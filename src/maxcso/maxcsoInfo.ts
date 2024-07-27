import MaxcsoBin from './maxcsoBin.js';

export default {
  /**
   * Given a compressed CSO/ZSO/DAX file, get its uncompressed ISO's CRC32. This is fast/cheap to
   * calculate.
   */
  async uncompressedCrc32(inputFilename: string): Promise<string> {
    const output = await MaxcsoBin.run(['--crc', inputFilename]);
    const crcMatch = output.replace(/[\n\r]/g, '').match(/ ([\da-f]{8})$/);
    if (crcMatch === null) {
      throw new Error('failed to get CRC of uncompressed file');
    }
    return crcMatch[1];
  },

  /**
   * Given a compressed CSO/ZSO/DAX file, get its uncompressed ISO's filesize. This is expensive
   * to calculate as full decompression is necessary.
   */
  async uncompressedSize(inputFilename: string): Promise<number> {
    const output = await MaxcsoBin.run(['--measure', inputFilename]);
    const sizeMatch = output.match(/(\d+) -> \d+/);
    if (sizeMatch === null) {
      throw new Error('failed to get size of uncompressed file');
    }
    return Number.parseInt(sizeMatch[1], 10);
  },
};
