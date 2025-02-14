import MaxcsoBin, { MaxcsoBinOptions } from './maxcsoBin.js';

export interface DecompressOptions extends MaxcsoBinOptions {
  inputFilename: string,
  outputFilename: string,
}

export default {
  async decompress(options: DecompressOptions): Promise<void> {
    await MaxcsoBin.run([
      '--decompress',
      options.inputFilename,
      '-o', options.outputFilename,
    ], options);
  },
};
