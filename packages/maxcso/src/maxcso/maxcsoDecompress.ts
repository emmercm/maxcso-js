import MaxcsoBin from './maxcsoBin.js';

export interface DecompressOptions {
  inputFilename: string,
  outputFilename: string,
}

export default {
  async decompress(options: DecompressOptions): Promise<void> {
    await MaxcsoBin.run([
      '--decompress',
      options.inputFilename,
      '-o', options.outputFilename,
    ]);
  },
};
