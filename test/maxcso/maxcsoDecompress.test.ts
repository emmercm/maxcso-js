import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import fs from 'node:fs';
import TestUtil from '../testUtil.js';
import MaxcsoDecompress from '../../src/maxcso/maxcsoDecompress.js';

it('should fail on nonexistent file', async () => {
  const temporaryCso = `${await TestUtil.mktemp(path.join(os.tmpdir(), 'dummy'))}.cso`;

  try {
    await expect(MaxcsoDecompress.decompress({
      inputFilename: os.devNull,
      outputFilename: temporaryCso,
    })).rejects.toBeTruthy();
  } finally {
    await promisify(fs.rm)(temporaryCso, { force: true });
  }
});

it('should decompress', () => {
  // see maxcsoCompress.test.ts
});
