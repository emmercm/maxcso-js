import fs, { PathLike } from 'node:fs';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

export default {
  /**
   * Asynchronously check the existence of a file.
   */
  async exists(pathLike: PathLike): Promise<boolean> {
    return promisify(fs.exists)(pathLike);
  },

  /**
   * Asynchronously check the equality of two files.
   */
  async equals(pathOne: PathLike, pathTwo: PathLike): Promise<boolean> {
    const contentsOne = await promisify(fs.readFile)(pathOne);
    const contentsTwo = await promisify(fs.readFile)(pathTwo);
    return contentsOne.equals(contentsTwo);
  },

  /**
   * Make a random file in the temporary directory.
   */
  async mktemp(prefix: string): Promise<string> {
    const randomExtension = crypto.randomBytes(4).readUInt32LE().toString(36);
    const filePath = `${prefix.replace(/\.+$/, '')}.${randomExtension}`;
    if (!await this.exists(filePath)) {
      return filePath;
    }
    return this.mktemp(prefix);
  },
};
