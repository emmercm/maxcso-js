import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import fs from 'node:fs';
import TestUtil from '../testUtil.js';
import MaxcsoCompress, { CompressFormat } from '../../src/maxcso/maxcsoCompress.js';
import MaxcsoInfo, { CsoFileType } from '../../src/maxcso/maxcsoInfo.js';

describe.each([
  [path.join('test', 'fixtures', '2048.bin'), 2048],
  [path.join('test', 'fixtures', '4096.bin'), 4096],
  [path.join('test', 'fixtures', '6144.bin'), 6144],
])('%s', (filePath, expectedSize) => {
  it('should parse CSO v1', async () => {
    const temporaryCso = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(filePath)))}.cso`;

    try {
      await MaxcsoCompress.compress({
        inputFilename: filePath,
        outputFilename: temporaryCso,
        format: CompressFormat.CSO_V1,
      });

      const info = await MaxcsoInfo.header(temporaryCso);
      expect(info.fileType).toEqual(CsoFileType.CSO);
      expect(info.uncompressedSize).toEqual(BigInt(expectedSize));
      expect(info.blockSize).toEqual(2048);
      expect(info.version).toEqual(1);
      expect(info.indexAlignment).toEqual(0);
    } finally {
      await promisify(fs.rm)(temporaryCso, { force: true });
    }
  });

  it('should parse CSO v2', async () => {
    const temporaryCso = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(filePath)))}.cso`;

    try {
      await MaxcsoCompress.compress({
        inputFilename: filePath,
        outputFilename: temporaryCso,
        format: CompressFormat.CSO_V2,
      });

      const info = await MaxcsoInfo.header(temporaryCso);
      expect(info.fileType).toEqual(CsoFileType.CSO);
      expect(info.uncompressedSize).toEqual(BigInt(expectedSize));
      expect(info.blockSize).toEqual(2048);
      expect(info.version).toEqual(2);
      expect(info.indexAlignment).toEqual(0);
    } finally {
      await promisify(fs.rm)(temporaryCso, { force: true });
    }
  });

  it('should parse ZSO', async () => {
    const temporaryZso = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(filePath)))}.zso`;

    try {
      await MaxcsoCompress.compress({
        inputFilename: filePath,
        outputFilename: temporaryZso,
        format: CompressFormat.ZSO,
      });

      const info = await MaxcsoInfo.header(temporaryZso);
      expect(info.fileType).toEqual(CsoFileType.ZSO);
      expect(info.uncompressedSize).toEqual(BigInt(expectedSize));
      expect(info.blockSize).toEqual(2048);
      expect(info.version).toEqual(1);
      expect(info.indexAlignment).toEqual(0);
    } finally {
      await promisify(fs.rm)(temporaryZso, { force: true });
    }
  });

  it('should parse DAX', async () => {
    const temporaryDax = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(filePath)))}.dax`;

    try {
      await MaxcsoCompress.compress({
        inputFilename: filePath,
        outputFilename: temporaryDax,
        format: CompressFormat.DAX,
      });

      const info = await MaxcsoInfo.header(temporaryDax);
      expect(info.fileType).toEqual(CsoFileType.DAX);
      expect(info.uncompressedSize).toEqual(BigInt(expectedSize));
      expect(info.blockSize).toEqual(-1);
      expect(info.version).toEqual(0);
      expect(info.indexAlignment).toEqual(-1);
    } finally {
      await promisify(fs.rm)(temporaryDax, { force: true });
    }
  });
});
