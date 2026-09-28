import { sha256Hex } from './sha256.mjs';
import { createHash } from 'node:crypto';

// Classic FIPS 180-4 / NIST test strings, checked against Node's own audited
// crypto.createHash('sha256') as the reference implementation.
const messages = [
  '',
  'abc',
  'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', // NIST two-block message
  'The quick brown fox jumps over the lazy dog',
  'a'.repeat(1000000), // NIST million-a stress vector
];

let pass = 0, fail = 0;
for (const msg of messages) {
  const got = sha256Hex(msg);
  const ref = createHash('sha256').update(msg).digest('hex');
  const ok = got === ref;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(msg.length > 20 ? `<${msg.length} chars>` : msg), 'got=' + got, 'ref=' + ref);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
