#!/usr/bin/env node

import MaxcsoBin, { MaxcsoBinaryPreference } from './maxcso/maxcsoBin.js';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async (): Promise<void> => {
  const argv = process.argv.slice(2);

  try {
    await MaxcsoBin.run(argv, {
      logStd: true,
      binaryPreference: MaxcsoBinaryPreference.PREFER_BUNDLED_BINARY,
    });
  } catch {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
})();
