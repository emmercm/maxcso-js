import MaxcsoBin from './maxcsoBin.js';

export default {
  async uncompressedCrc32(inputFilename: string): Promise<string> {
    const output = await MaxcsoBin.run(['--crc', inputFilename]);
    const crcMatch = output.replace(/[\n\r]/g, '').match(/ ([\da-f]{8})$/);
    if (crcMatch === null) {
      throw new Error('failed to get CRC of uncompressed file');
    }
    return crcMatch[1];
  },
};
