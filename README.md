<h1 align="center">💿️ maxcso</h1>

<p align="center"><b>Pre-compiled binaries and Node.js wrapper for unknownbrackets' <a href="https://github.com/unknownbrackets/maxcso">maxcso</a> tool.</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/maxcso"><img alt="npm: version" src="https://img.shields.io/npm/v/maxcso?color=%23cc3534&label=version&logo=npm&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/maxcso"><img alt="npm: downloads" src="https://img.shields.io/npm/dt/maxcso?color=%23cc3534&logo=npm&logoColor=white"></a>
  <a href="https://github.com/emmercm/maxcso-js"><img alt="GitHub: stars" src="https://img.shields.io/github/stars/emmercm/maxcso-js?style=flat&logo=github&logoColor=white&color=%236e5494"></a>
  <a href="https://github.com/emmercm/maxcso-js/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/github/license/emmercm/maxcso-js?color=blue"></a>
</p>

## Supported platforms

| OS                     | Architectures                                                     |
|------------------------|-------------------------------------------------------------------|
| [Windows](./bin/win32) | <ul><li>x64</li><li>x86</li></ul>                                 |
| [macOS](./bin/darwin)  | <ul><li>arm64 (Apple Silicon)</li><li>x64 (Intel)</li></ul>       |
| [Linux](./bin/linux)   | <ul><li>x64</li><li>x86</li><li>arm v7</li><li>arm64 v8</li></ul> |

## Running

You can easily run the `maxcso` binary for your OS from the command line like this:

```shell
npx maxcso [options..]
```

Examples:

```shell
npx maxcso --crc Disc.cso
npx maxcso --decompress Disc.cso -o Disc.iso
npx maxcso --format=cso1 Disc.iso -o Disc.cso
```

## Installation

```shell
npm install --save maxcso
```

## Usage

```javascript
import maxcso from 'maxcso';

/**
 * Compress an ISO.
 */
await maxcso.compress({
  inputFilename: 'Disc.iso',
  outputFilename: 'Disc.cso',
});

/**
 * Given a compressed file, get the decompressed file's CRC32.
 */
const crc32 = await maxcso.uncompressedCrc32('Disc.cso');
console.log(crc32);
// "abcd01234"

/**
 * Decompress a CSO.
 */
await maxcso.decompress({
  inputFilename: 'Disc.cso',
  outputFilename: 'Disc.iso',
});
```

## License

unknownbrackets' [maxcso](https://github.com/unknownbrackets/maxcso) tool is licensed under the ISC license.
