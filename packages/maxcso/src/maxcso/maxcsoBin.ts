import { promisify } from 'node:util';
import fs from 'node:fs';
import which from 'which';
import * as child_process from 'node:child_process';

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

  private static async getBinPath(
    binaryPreference?: MaxcsoBinaryPreference,
  ): Promise<string | undefined> {
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
  }

  private static async getBinPathBundled(): Promise<string | undefined> {
    // try {
    const maxcso = await import(`@emmercm/maxcso-${process.platform}-${process.arch}`);
    const prebuilt = maxcso.default;
    if (await promisify(fs.exists)(prebuilt)) {
      return prebuilt;
    }
    // } catch { /* ignored */ }

    return undefined;
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
