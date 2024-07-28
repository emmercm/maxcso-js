import fs from 'node:fs';
import MaxcsoBin from './maxcsoBin.js';

export enum CsoFileType {
  CSO = 'CISO',
  DAX = 'DAX',
  ZSO = 'ZISO',
}

export interface CsoInfo {
  fileType: CsoFileType,
  uncompressedSize: bigint,
  blockSize: number,
  version: number,
  indexAlignment: number,
}

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
   * Given a compressed CSO/ZSO/DAX file, get the information stored in its file header.
   */
  async header(inputFilename: string): Promise<CsoInfo> {
    const chunks: Buffer[] = [];
    for await (const chunk of fs.createReadStream(inputFilename, { start: 0, end: 24 })) {
      chunks.push(chunk);
    }
    const contents = Buffer.concat(chunks);

    const signature = contents.subarray(0x0, 4).filter((char) => char !== 0x00).toString();
    const fileType = Object.values(CsoFileType).find((value) => value === signature);
    if (fileType === undefined) {
      throw new Error('failed to get file type');
    }

    if (fileType === CsoFileType.DAX) {
      // @see https://github.com/unknownbrackets/maxcso/blob/961f232cf99d546b2b7e704c0ecf3fc5bea52221/src/dax.h
      return {
        fileType,
        uncompressedSize: BigInt(contents.readUInt32LE(0x4)),
        blockSize: -1,
        version: contents.readUInt32LE(0x8),
        indexAlignment: -1,
      };
    }

    // @see https://docs.fileformat.com/disc-and-media/cso/
    return {
      fileType,
      uncompressedSize: contents.readBigUInt64LE(0x8),
      blockSize: contents.readUInt32LE(0x10),
      version: contents.readInt8(0x14),
      indexAlignment: contents.readInt8(0x15),
    };
  },
};
