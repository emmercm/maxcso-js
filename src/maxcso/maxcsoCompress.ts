import MaxcsoBin from './maxcsoBin.js';
import MaxcsoInfo from './maxcsoInfo.js';

export enum CompressFormat {
  CSO_V1 = 'cso1',
  CSO_V2 = 'cso2',
  ZSO = 'zso',
  DAX = 'dax',
}

export enum CompressMethod {
  ZLIB = 'zlib',
  ZOPFLI = 'zopfli',
  '7ZDEFLATE' = '7zdeflate',
  LZ4 = 'lz4',
  LZ4_BRUTE = 'lz4brute',
  LIBDEFLATE = 'libdeflate',
}

export interface CompressOptions {
  inputFilename: string,
  outputFilename: string,
  threads?: number,
  fast?: boolean,
  blockSize?: number,
  format?: CompressFormat,
  tryMethods?: CompressMethod[],
  method?: CompressMethod,
  disableMethods?: CompressMethod[],
  lz4Cost?: number,
  originalCost?: number,
}

export default {
  async compress(options: CompressOptions): Promise<void> {
    await MaxcsoBin.run([
      ...(options.threads === undefined ? [] : [`--threads=${options.threads}`]),
      ...(options.fast === true ? ['--fast'] : []),
      ...(options.blockSize === undefined ? [] : [`--block=${options.blockSize}`]),
      ...(options.format === undefined ? [] : [`--format=${options.format}`]),
      ...(options.tryMethods ?? []).map((m) => `--use-${m}`),
      ...(options.method === undefined ? [] : [`--only-${options.method}`]),
      ...(options.disableMethods ?? []).map((m) => `--no-${m}`),
      ...(options.lz4Cost === undefined ? [] : [`--lz4-cost=${options.lz4Cost}`]),
      ...(options.originalCost === undefined ? [] : [`--orig-cost=${options.originalCost}`]),
      options.inputFilename,
      '-o', options.outputFilename,
    ]);

    try {
      await MaxcsoInfo.uncompressedCrc32(options.outputFilename);
    } catch (error) {
      throw new Error(`created CSO is invalid: ${error}`);
    }
  },
};
