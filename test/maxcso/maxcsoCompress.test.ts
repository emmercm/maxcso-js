import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import fs from 'node:fs';
import MaxcsoCompress, { CompressFormat, CompressMethod } from '../../src/maxcso/maxcsoCompress.js';
import TestUtil from '../testUtil.js';
import MaxcsoDecompress from '../../src/maxcso/maxcsoDecompress.js';

it('should fail on nonexistent file', async () => {
  const temporaryCso = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.cso`;

  try {
    await expect(MaxcsoCompress.compress({
      inputFilename: os.devNull,
      outputFilename: temporaryCso,
    })).rejects.toBeTruthy();
  } finally {
    await promisify(fs.rm)(temporaryCso, { force: true });
  }
});

describe.each(
  Object.keys(CompressFormat)
    .filter((format) => Number.isNaN(Number(format)))
    .map((format) => ([format])),
)('%s', (formatKey) => {
  const formatValue = CompressFormat[formatKey as keyof typeof CompressFormat];

  describe.each(
    Object.keys(CompressMethod)
      .filter((method) => Number.isNaN(Number(method)))
      .map((method) => ([method])),
  )('%s', (methodKey) => {
    const methodValue = CompressMethod[methodKey as keyof typeof CompressMethod];

    // Incompatible options
    if (formatValue === CompressFormat.DAX && (
      methodValue === CompressMethod.LZ4
        || methodValue === CompressMethod.LZ4_BRUTE
    )) {
      return;
    }

    test.each([
      [path.join('test', 'fixtures', '2048.bin')],
      [path.join('test', 'fixtures', '4096.bin')],
      [path.join('test', 'fixtures', '6144.bin')],
    ])('should compress with format: %s', async (filePath) => {
      const temporaryCso = `${await TestUtil.mktemp(path.join(os.tmpdir(), path.basename(filePath)))}.${formatValue}`;
      const temporaryRaw = await TestUtil.mktemp(path.join(os.tmpdir(), path.parse(filePath).name));

      try {
        await MaxcsoCompress.compress({
          inputFilename: filePath,
          outputFilename: temporaryCso,
          format: formatValue,
          method: methodValue,
        });
        await expect(TestUtil.exists(temporaryCso)).resolves.toEqual(true);

        await MaxcsoDecompress.decompress({
          inputFilename: temporaryCso,
          outputFilename: temporaryRaw,
        });
        await expect(TestUtil.exists(temporaryRaw)).resolves.toEqual(true);

        await expect(TestUtil.equals(filePath, temporaryRaw)).resolves.toEqual(true);
      } finally {
        await promisify(fs.rm)(temporaryCso, { force: true });
        await promisify(fs.rm)(temporaryRaw, { force: true });
      }
    });
  });
});
