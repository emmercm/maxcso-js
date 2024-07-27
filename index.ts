import MaxcsoBin from './src/maxcso/maxcsoBin.js';
import MaxcsoInfo from './src/maxcso/maxcsoInfo.js';
import MaxcsoCompress from './src/maxcso/maxcsoCompress.js';
import MaxcsoDecompress from './src/maxcso/maxcsoDecompress.js';

export * from './src/maxcso/maxcsoBin.js';
export * from './src/maxcso/maxcsoCompress.js';
export * from './src/maxcso/maxcsoDecompress.js';
export * from './src/maxcso/maxcsoInfo.js';

export default {
  run: MaxcsoBin.run,

  uncompressedCrc32: MaxcsoInfo.uncompressedCrc32,
  uncompressedSize: MaxcsoInfo.uncompressedSize,

  compress: MaxcsoCompress.compress,

  decompress: MaxcsoDecompress.decompress,
};
