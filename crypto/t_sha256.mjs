import { createHash } from 'node:crypto';
import { sha256, sha256hex } from './sha256.mjs';

const vectors = [
  '',
  'abc',
  'The quick brown fox jumps over the lazy dog',
  'a'.repeat(1000000),
  new Uint8Array(0),
  new Uint8Array([0xff, 0x00, 0x80, 0x7f]),
];

let pass = 0, fail = 0;
for (const v of vectors) {
  const nodeDigest = createHash('sha256').update(typeof v === 'string' ? v : Buffer.from(v)).digest('hex');
  const oursDigest = sha256hex(v);
  const label = typeof v === 'string' ? (v.length > 40 ? `${v.slice(0,20)}...(${v.length} chars)` : JSON.stringify(v)) : `Uint8Array(${v.length})`;
  if (nodeDigest === oursDigest) { pass++; }
  else { fail++; console.log(`FAIL: ${label}\n  node : ${nodeDigest}\n  ours : ${oursDigest}`); }
}

const fipsAbc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
console.log('FIPS 180-4 "abc" KAT:', sha256hex('abc') === fipsAbc ? 'MATCHES' : 'MISMATCH');

console.log(`\n${pass}/${pass+fail} vectors match node:crypto`);
process.exit(fail === 0 ? 0 : 1);
