import { sha512, sha384, sha512Hex, sha384Hex } from './sha512.mjs';
import { createHash } from 'node:crypto';

// Checked against Node's own audited crypto.createHash('sha512'/'sha384') as
// the primary reference implementation, the same way sha256.test.mjs and
// keccak.test.mjs work. A hardcoded FIPS 180-4 / NIST known-answer section
// follows further down so the test does not rely solely on Node agreeing
// with itself.

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

// The classic NIST/FIPS 180-4 112-character two-block message used to test
// SHA-384/SHA-512 (analogous to the 56-char message used for SHA-256).
const NIST_112 = 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu';

const messages = [
  '',
  'abc',
  'The quick brown fox jumps over the lazy dog',
  NIST_112,
  'a'.repeat(111),      // one byte under the 112-byte (896-bit) padding threshold
  'a'.repeat(112),      // exactly the threshold -> the 0x80+length no longer fits, forces a second block
  'a'.repeat(113),      // one byte over
  'a'.repeat(127),      // one byte under a full 128-byte block
  'a'.repeat(128),      // exactly one block
  'a'.repeat(129),      // one byte over
  'a'.repeat(1000000),  // NIST million-'a' stress vector
];

for (const msg of messages) {
  const tag = msg.length > 24 ? `<${msg.length} chars>` : JSON.stringify(msg);
  check(`sha512 ${tag}`, sha512Hex(msg), createHash('sha512').update(msg).digest('hex'));
  check(`sha384 ${tag}`, sha384Hex(msg), createHash('sha384').update(msg).digest('hex'));
}

// sha512()/sha384() (the Uint8Array-returning forms) should agree with the
// hex forms and have the right byte lengths.
{
  const b512 = sha512('abc');
  const b384 = sha384('abc');
  check('sha512() returns Uint8Array', b512 instanceof Uint8Array, true);
  check('sha512() length == 64 bytes', b512.length, 64);
  check('sha384() returns Uint8Array', b384 instanceof Uint8Array, true);
  check('sha384() length == 48 bytes', b384.length, 48);
  check('sha512() bytes match sha512Hex()', Buffer.from(b512).toString('hex'), sha512Hex('abc'));
  check('sha384() bytes match sha384Hex()', Buffer.from(b384).toString('hex'), sha384Hex('abc'));
}

// Known-answer values published in FIPS 180-4 / the NIST CAVP examples,
// hardcoded so the test does not rely solely on Node agreeing with us.
const KAT = [
  ['sha512', '', 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'],
  ['sha384', '', '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b'],
  ['sha512', 'abc', 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'],
  ['sha384', 'abc', 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7'],
  ['sha512', NIST_112, '8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909'],
  ['sha384', NIST_112, '09330c33f71147e83d192fc782cd1b4753111b173b3b05d22fa08086e3b0f712fcc7c71a557e2db966c3e9fa91746039'],
  ['sha512', 'a'.repeat(1000000), 'e718483d0ce769644e2e42c7bc15b4638e1f98b13b2044285632a803afa973ebde0ff244877ea60a4cb0432ce577c31beb009c5c2c49aa2e4eadb217ad8cc09b'],
  ['sha384', 'a'.repeat(1000000), '9d0e1809716474cb086e834e310a4a1ced149e9c00f248527972cec5704c2a5b07b8b3dc38ecc4ebae97ddd87f3d8985'],
];
for (const [alg, msg, expected] of KAT) {
  const got = alg === 'sha512' ? sha512Hex(msg) : sha384Hex(msg);
  const tag = msg.length > 24 ? `<${msg.length} chars>` : JSON.stringify(msg);
  check(`KAT ${alg} ${tag}`, got, expected);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
