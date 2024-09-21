import url from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';
import fs from 'node:fs';
import which from 'which';
import * as child_process from 'node:child_process';

export interface MaxcsoBinOptions {
  logStd?: boolean
}

/**
 * Code to find and interact with the `maxcso` binary.
 */
export default class MaxcsoBin {
  private static MAXCSO_BIN: string | undefined;

  private static async findRoot(filePath = url.fileURLToPath(new URL('.', import.meta.url))): Promise<string | undefined> {
    const fullPath = path.join(filePath, 'package.json');
    if (await promisify(fs.exists)(fullPath)) {
      return filePath;
    }

    const parentPath = path.dirname(filePath);
    if (parentPath !== filePath) {
      return this.findRoot(path.dirname(filePath));
    }

    return undefined;
  }

  static async getBinPath(): Promise<string | undefined> {
    if (MaxcsoBin.MAXCSO_BIN) {
      return MaxcsoBin.MAXCSO_BIN;
    }

    try {
      const maxcso = await import(`@emmercm/maxcso-${process.platform}-${process.arch}`);
      const prebuilt = maxcso.default;
      if (await promisify(fs.exists)(prebuilt)) {
        MaxcsoBin.MAXCSO_BIN = prebuilt;
        return prebuilt;
      }
    } catch { /* ignored */ }

    const resolved = await which('maxcso', { nothrow: true });
    if (resolved) {
      MaxcsoBin.MAXCSO_BIN = resolved;
      return resolved;
    }

    return undefined;
  }

  /**
   * Run maxcso with some arguments.
   */
  static async run(arguments_: string[], options?: MaxcsoBinOptions): Promise<string> {
    const maxcsoBin = await this.getBinPath();
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
