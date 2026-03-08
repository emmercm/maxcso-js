import { promisify } from 'node:util';
import fs from 'node:fs';
import which from 'which';
import child_process from 'node:child_process';
import { Mutex } from 'async-mutex';
import path from 'node:path';
import stream from 'node:stream';
import os from 'node:os';
import crypto from 'node:crypto';

export interface MaxcsoBinOptions {
  binaryPreference?: MaxcsoBinaryPreference
  logStd?: boolean
}

export enum MaxcsoBinaryPreference {
  PREFER_BUNDLED_BINARY = 1,
  PREFER_PATH_BINARY,
}

/**
 * Code to find and interact with the `maxcso` binary.
 */
export default class MaxcsoBin {
  private static MAXCSO_BIN: string | undefined;

  private static readonly MAXCSO_BIN_MUTEX = new Mutex();

  private static async getBinPath(
    binaryPreference?: MaxcsoBinaryPreference,
  ): Promise<string | undefined> {
    if (this.MAXCSO_BIN) {
      return this.MAXCSO_BIN;
    }

    return this.MAXCSO_BIN_MUTEX.runExclusive(async () => {
      if (this.MAXCSO_BIN) {
        return this.MAXCSO_BIN;
      }

      if ((binaryPreference ?? MaxcsoBinaryPreference.PREFER_BUNDLED_BINARY)
      === MaxcsoBinaryPreference.PREFER_BUNDLED_BINARY
      ) {
        const pathBundled = await this.getBinPathBundled();
        this.MAXCSO_BIN = pathBundled ?? (await this.getBinPathExisting());
      } else {
        const pathExisting = await this.getBinPathExisting();
        this.MAXCSO_BIN = pathExisting ?? (await this.getBinPathBundled());
      }

      return this.MAXCSO_BIN;
    });
  }

  private static async getBinPathBundled(): Promise<string | undefined> {
    const bunPath = await this.getBinPathBundledBun();
    if (bunPath !== undefined) {
      return bunPath;
    }

    try {
      const maxcso = await import(`@emmercm/maxcso-${process.platform}-${process.arch}`);
      const prebuilt = maxcso.default;
      try {
        await promisify(fs.stat)(prebuilt);
        return prebuilt;
      } catch { /* ignored */ }
    } catch { /* ignored */ }

    return undefined;
  }

  /**
   * Look for maxcso binaries bundled with:
   * `bun build --compile --asset-naming="[name].[ext]" maxcso *.dylib`
   */
  private static async getBinPathBundledBun(): Promise<string | undefined> {
    try {
      const { embeddedFiles } = await import('bun');

      // Find all files that might be maxcso-related
      const maxcsoBlob = embeddedFiles.find((blob) => {
        // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
        const blobName: string = blob.name;
        return blobName.toLowerCase().startsWith('maxcso');
      });

      if (maxcsoBlob !== undefined) {
        // Create the temporary directory
        const hash = crypto.createHash('md5');
        await maxcsoBlob.stream().pipeTo(new WritableStream({
          write(chunk): void {
            hash.update(chunk);
          },
        }));
        const temporaryDirectory = await this.getTemporaryDirectory(`maxcso-${hash.digest('hex').slice(0, 7)}`);

        // Find additional files that might be necessary
        const dylibBlobs = embeddedFiles.filter((blob) => {
          // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
          const blobName: string = blob.name;
          return blobName.toLowerCase().endsWith('.dylib');
        });

        // Extract all files if necessary
        const temporaryBlobs = await Promise.all([maxcsoBlob, ...dylibBlobs].map(async (blob) => {
          // @ts-expect-error https://github.com/oven-sh/bun/issues/20700
          const blobName: string = blob.name.replace(/-[\da-z]{8}\./, '.').replace(/\.+$/, '');
          const temporaryBlob = path.join(temporaryDirectory, blobName);
          try {
            await promisify(fs.stat)(temporaryBlob);
            return temporaryBlob;
          } catch {
            /* ignored */
          }
          const writableStream = stream.Writable.toWeb(fs.createWriteStream(temporaryBlob));
          await blob.stream().pipeTo(writableStream);
          await promisify(fs.chmod)(temporaryBlob, 0o755); // chmod +x
          return temporaryBlob;
        }));
        return temporaryBlobs.find((temporaryBlob) => path.basename(temporaryBlob).startsWith('maxcso'));
      }
    } catch { /* ignored */ }

    return undefined;
  }

  private static async getTemporaryDirectory(temporaryDirectoryBasename: string): Promise<string> {
    const candidateDirectories = [
      path.join(os.tmpdir(), temporaryDirectoryBasename),
      path.join(process.cwd(), '.maxcso', temporaryDirectoryBasename),
      path.join(os.homedir(), '.maxcso', temporaryDirectoryBasename),
    ];
    /* eslint-disable no-await-in-loop */
    for (const candidateDirectory of candidateDirectories) {
      try {
        try {
          await promisify(fs.stat)(candidateDirectory);
        } catch {
          await promisify(fs.mkdir)(candidateDirectory, { recursive: true });
        }
        const temporaryFile = path.join(candidateDirectory, temporaryDirectoryBasename);
        await promisify(fs.writeFile)(temporaryFile, temporaryFile);
        await promisify(fs.unlink)(temporaryFile);
        return candidateDirectory;
      } catch {
        /* ignored */
      }
    }
    throw new Error("couldn't find a suitable temporary directory");
  }

  private static async getBinPathExisting(): Promise<string | undefined> {
    const resolved = await which(
      process.platform === 'win32' ? 'maxcso.exe' : 'maxcso',
      { nothrow: true },
    );
    if (resolved) {
      return resolved;
    }
    return undefined;
  }

  /**
   * Run maxcso with some arguments.
   */
  static async run(arguments_: string[], options?: MaxcsoBinOptions): Promise<string> {
    const maxcsoBin = await this.getBinPath(options?.binaryPreference);
    if (!maxcsoBin) {
      throw new Error('maxcso not found');
    }

    return new Promise<string>((resolve, reject) => {
      const proc = child_process.spawn(maxcsoBin, arguments_, { windowsHide: true });

      const chunks: Buffer[] = [];

      proc.stdout.on('data', (chunk) => {
        if (options?.logStd) {
          console.log(chunk.toString());
        }

        chunks.push(chunk);
      });

      proc.stderr.on('data', (chunk) => {
        if (options?.logStd) {
          console.error(chunk.toString());
        }

        chunks.push(chunk);
      });

      proc.on('close', (code) => {
        const output = Buffer.concat(chunks).toString().trim();
        if (code !== null && code !== 0) {
          return reject(output);
        }
        return resolve(output);
      });
      proc.on('error', () => {
        const output = Buffer.concat(chunks).toString().trim();
        reject(output);
      });
    });
  }
}
