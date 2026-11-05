import { sha3_256, sha3_384, sha3_512, shake128, shake256, toHex } from './keccak.mjs';
import { createHash } from 'node:crypto';

// Checked against Node's own OpenSSL-backed implementations as reference.
// No crypto library is imported by keccak.mjs itself; Node's crypto is used
// here only as an independent yardstick, the same way sha256.test.mjs works.

const messages = [
  '',
  'abc',
  'The quick brown fox jumps over the lazy dog',
  'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
  'a'.repeat(135),   // one byte under SHA3-256 rate (136)
  'a'.repeat(136),   // exactly SHA3-256 rate -> forces a full pad block
  'a'.repeat(137),   // one byte over
  'a'.repeat(167),   // one under SHAKE128 rate (168)
  'a'.repeat(168),   // exactly SHAKE128 rate
  'z'.repeat(1000),  // multi-block
  'q'.repeat(100000),// stress
];

let pass = 0, fail = 0;

function check(label, got, ref) {
  const ok = got === ref;
  if (ok) pass++; else fail++;
  if (!ok) {
    console.log(`FAIL ${label}`);
    console.log(`  got=${got}`);
    console.log(`  ref=${ref}`);
  }
  return ok;
}

for (const msg of messages) {
  const tag = msg.length > 24 ? `<${msg.length} bytes>` : JSON.stringify(msg);

  check(`sha3-256 ${tag}`,
    toHex(sha3_256(msg)),
    createHash('sha3-256').update(msg).digest('hex'));

  check(`sha3-384 ${tag}`,
    toHex(sha3_384(msg)),
    createHash('sha3-384').update(msg).digest('hex'));

  check(`sha3-512 ${tag}`,
    toHex(sha3_512(msg)),
    createHash('sha3-512').update(msg).digest('hex'));
}

// SHAKE is extendable-output; test several lengths including ones that cross
// the rate boundary and therefore require an extra permutation during squeeze.
const shakeLens = [1, 16, 32, 64, 167, 168, 169, 200, 336, 337, 512];
for (const msg of ['', 'abc', 'a'.repeat(200)]) {
  const tag = msg.length > 24 ? `<${msg.length} bytes>` : JSON.stringify(msg);
  for (const L of shakeLens) {
    check(`shake128 ${tag} len=${L}`,
      toHex(shake128(msg, L)),
      createHash('shake128', { outputLength: L }).update(msg).digest('hex'));

    check(`shake256 ${tag} len=${L}`,
      toHex(shake256(msg, L)),
      createHash('shake256', { outputLength: L }).update(msg).digest('hex'));
  }
}

// Known-answer values published in FIPS 202 / NIST examples, hardcoded so the
// test does not rely solely on Node agreeing with us.
const KAT = [
  ['sha3-256', '', 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a'],
  ['sha3-256', 'abc', '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532'],
  ['sha3-512', 'abc', 'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0'],
];
for (const [alg, msg, expected] of KAT) {
  const got = alg === 'sha3-256' ? toHex(sha3_256(msg)) : toHex(sha3_512(msg));
  check(`KAT ${alg} ${JSON.stringify(msg)}`, got, expected);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
