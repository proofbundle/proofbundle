import { readFileSync } from 'node:fs';
import { digestBytes, digestBytesXOF, isImplementedDigest } from '../../digest/digest.mjs';
import { bytesToHex } from '../../encoding/hex.mjs';
import { EXIT_CODES } from '../output.mjs';

export function runHash({ positional, flags }) {
  const algId = flags.alg || 'SHA-256';
  const file = positional[0];
  if (!file) {
    process.stderr.write('usage: proofbundle hash <file> --alg SHA-256 [--length N for XOF algorithms]\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  let bytes;
  try {
    bytes = new Uint8Array(readFileSync(file));
  } catch (e) {
    process.stderr.write(`hash: cannot read ${file}: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
  try {
    const isXOF = algId === 'SHAKE128' || algId === 'SHAKE256';
    const out = isXOF
      ? digestBytesXOF(algId, bytes, Number(flags.length || 32))
      : digestBytes(algId, bytes);
    if (flags.json) {
      process.stdout.write(JSON.stringify({ algorithm: algId, file, digest: bytesToHex(out) }, null, 2) + '\n');
    } else {
      process.stdout.write(`${bytesToHex(out)}  ${file}  (${algId})\n`);
    }
    return EXIT_CODES.OK;
  } catch (e) {
    process.stderr.write(`hash: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
}
