import { blake2b, blake2s, blake2bKeyed, blake2sKeyed } from './blake2.mjs';
import { createHash } from 'node:crypto';

// Checked against Node's own OpenSSL-backed blake2b512 / blake2s256 as the
// primary reference, the same way sha256.test.mjs and keccak.test.mjs work.
//
// Node's createHash in this environment only exposes fixed-length, unkeyed
// blake2b512/blake2s256 -- createHash('blake2b512', { outputLength: N })
// throws "not XOF or invalid length", and the { key } option is silently
// ignored (verified: passing an oversized, spec-invalid key changes nothing
// about the output). So keyed hashing and non-default output lengths are
// checked below against hardcoded published vectors instead: RFC 7693's
// Appendix A/B worked examples, the official BLAKE2 reference
// implementation's testvectors/blake2-kat.json, and Go's x/crypto/blake2s
// New128 test vectors. A handful of additional output-length vectors for
// BLAKE2b are cross-checked against Python's hashlib.blake2b, a completely
// independent implementation (CPython's own C extension), since it does
// support arbitrary digest_size/key and Node here does not.

const toHex = (u8) => Buffer.from(u8).toString('hex');

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

// Sequential-byte message of length n: [0, 1, 2, ..., (n-1) mod 256].
// This is the exact input construction used by the official BLAKE2 KAT and
// by Go's blake2s test vectors, so KAT entries below can be checked as-is.
function seq(n) {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = i & 0xff;
  return a;
}

// ---- Bulk cross-check against node:crypto (default output length, unkeyed) ----
// Same 112-byte NIST/FIPS 180-4 two-block message used in sha512.test.mjs,
// reused here purely as a convenient multi-block input not aligned to
// either algorithm's block size.
const NIST_112 = 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu';

const messages = [
  '',
  'abc',
  'The quick brown fox jumps over the lazy dog',
  NIST_112,             // 112-byte multi-block message, not aligned to either block size
  'a'.repeat(63),        // one byte under BLAKE2s's 64-byte block
  'a'.repeat(64),        // exactly one BLAKE2s block
  'a'.repeat(65),        // one byte over
  'a'.repeat(127),       // one byte under BLAKE2b's 128-byte block
  'a'.repeat(128),        // exactly one BLAKE2b block
  'a'.repeat(129),        // one byte over
  'z'.repeat(1000),       // multi-block
  'a'.repeat(1000000),    // stress vector
];

for (const msg of messages) {
  const tag = msg.length > 24 ? `<${msg.length} bytes>` : JSON.stringify(msg);
  check(`blake2b-512 ${tag}`, toHex(blake2b(msg)), createHash('blake2b512').update(msg).digest('hex'));
  check(`blake2s-256 ${tag}`, toHex(blake2s(msg)), createHash('blake2s256').update(msg).digest('hex'));
}

// ---- Sanity: a supplied key must actually change the output. This is
// exactly the property Node's own { key } option silently fails at in this
// environment (see header comment), so it's worth asserting directly. ----
{
  const keyB = seq(64), keyS = seq(32);
  check('blake2b keyed output differs from unkeyed', toHex(blake2bKeyed('abc', keyB)) !== toHex(blake2b('abc')), true);
  check('blake2s keyed output differs from unkeyed', toHex(blake2sKeyed('abc', keyS)) !== toHex(blake2s('abc')), true);
  // Output length changes the whole digest (it's mixed into h[0] before any
  // compression), not just a truncation point.
  check('blake2b(msg,32) is not a truncation of blake2b(msg,64)',
    toHex(blake2b('abc', 32)) !== toHex(blake2b('abc', 64)).slice(0, 64), true);
}

/* ------------------------------------------------------------------------
 * Known-answer values, hardcoded so the test does not rely solely on Node
 * agreeing with us. Sources noted per entry.
 * ---------------------------------------------------------------------- */

// RFC 7693 Appendix A (BLAKE2b-512 worked trace) and Appendix B (BLAKE2s-256
// worked trace), both for the message "abc".
check('KAT RFC7693 AppendixA blake2b-512("abc")',
  toHex(blake2b('abc')),
  'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923');
check('KAT RFC7693 AppendixB blake2s-256("abc")',
  toHex(blake2s('abc')),
  '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982');

// Official BLAKE2 reference implementation KAT
// (github.com/BLAKE2/BLAKE2 testvectors/blake2-kat.json), unkeyed.
check('KAT blake2-kat.json blake2b("")', toHex(blake2b(seq(0))),
  '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce');
check('KAT blake2-kat.json blake2b(00)', toHex(blake2b(seq(1))),
  '2fa3f686df876995167e7c2e5d74c4c7b6e48f8068fe0e44208344d480f7904c36963e44115fe3eb2a3ac8694c28bcb4f5a0f3276f2e79487d8219057a506e4b');
check('KAT blake2-kat.json blake2s("")', toHex(blake2s(seq(0))),
  '69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9');
check('KAT blake2-kat.json blake2s(00)', toHex(blake2s(seq(1))),
  'e34d74dbaf4ff4c6abd871cc220451d2ea2648846c7757fbaac82fe51ad64bea');

// Same reference KAT file, keyed section (fixed key = bytes 0x00..0x3F for
// blake2b / 0x00..0x1F for blake2s), empty message and block-boundary
// lengths (63/64/65 for BLAKE2s, 127/128/129 for BLAKE2b).
const KEY_B = seq(64), KEY_S = seq(32);
check('KAT blake2-kat.json blake2b keyed ""', toHex(blake2bKeyed(seq(0), KEY_B)),
  '10ebb67700b1868efb4417987acf4690ae9d972fb7a590c2f02871799aaa4786b5e996e8f0f4eb981fc214b005f42d2ff4233499391653df7aefcbc13fc51568');
check('KAT blake2-kat.json blake2s keyed ""', toHex(blake2sKeyed(seq(0), KEY_S)),
  '48a8997da407876b3d79c0d92325ad3b89cbb754d86ab71aee047ad345fd2c49');

const blockKAT = [
  ['blake2s unkeyed len=63', () => blake2s(seq(63)), 'e57cb79487dd57902432b250733813bd96a84efce59f650fac26e6696aefafc3'],
  ['blake2s unkeyed len=64', () => blake2s(seq(64)), '56f34e8b96557e90c1f24b52d0c89d51086acf1b00f634cf1dde9233b8eaaa3e'],
  ['blake2s unkeyed len=65', () => blake2s(seq(65)), '1b53ee94aaf34e4b159d48de352c7f0661d0a40edff95a0b1639b4090e974472'],
  ['blake2s keyed   len=63', () => blake2sKeyed(seq(63), KEY_S), 'c65382513f07460da39833cb666c5ed82e61b9e998f4b0c4287cee56c3cc9bcd'],
  ['blake2s keyed   len=64', () => blake2sKeyed(seq(64), KEY_S), '8975b0577fd35566d750b362b0897a26c399136df07bababbde6203ff2954ed4'],
  ['blake2s keyed   len=65', () => blake2sKeyed(seq(65), KEY_S), '21fe0ceb0052be7fb0f004187cacd7de67fa6eb0938d927677f2398c132317a8'],
  ['blake2b unkeyed len=127', () => blake2b(seq(127)), 'b6292669ccd38d5f01caae96ba272c76a879a45743afa0725d83b9ebb26665b731f1848c52f11972b6644f554c064fa90780dbbbf3a89d4fc31f67df3e5857ef'],
  ['blake2b unkeyed len=128', () => blake2b(seq(128)), '2319e3789c47e2daa5fe807f61bec2a1a6537fa03f19ff32e87eecbfd64b7e0e8ccff439ac333b040f19b0c4ddd11a61e24ac1fe0f10a039806c5dcc0da3d115'],
  ['blake2b unkeyed len=129', () => blake2b(seq(129)), 'f59711d44a031d5f97a9413c065d1e614c417ede998590325f49bad2fd444d3e4418be19aec4e11449ac1a57207898bc57d76a1bcf3566292c20c683a5c4648f'],
  ['blake2b keyed   len=127', () => blake2bKeyed(seq(127), KEY_B), '76d2d819c92bce55fa8e092ab1bf9b9eab237a25267986cacf2b8ee14d214d730dc9a5aa2d7b596e86a1fd8fa0804c77402d2fcd45083688b218b1cdfa0dcbcb'],
  ['blake2b keyed   len=128', () => blake2bKeyed(seq(128), KEY_B), '72065ee4dd91c2d8509fa1fc28a37c7fc9fa7d5b3f8ad3d0d7a25626b57b1b44788d4caf806290425f9890a3a2a35a905ab4b37acfd0da6e4517b2525c9651e4'],
  ['blake2b keyed   len=129', () => blake2bKeyed(seq(129), KEY_B), '64475dfe7600d7171bea0b394e27c9b00d8e74dd1e416a79473682ad3dfdbb706631558055cfc8a40e07bd015a4540dcdea15883cbbf31412df1de1cd4152b91'],
];
for (const [label, fn, expected] of blockKAT) {
  check(`KAT blake2-kat.json ${label}`, toHex(fn()), expected);
}

// Go's golang.org/x/crypto/blake2s New128 test vectors: keyed (32-byte key
// 0x00..0x1F), 16-byte (128-bit) output -- an independently published
// source for a non-default BLAKE2s output length.
const goKey = seq(32);
const goHashes128 = [
  '9536f9b267655743dee97b8a670f9f53',
  '13bacfb85b48a1223c595f8c1e7e82cb',
  'd47a9b1645e2feae501cd5fe44ce6333',
];
for (let i = 0; i < goHashes128.length; i++) {
  check(`KAT go blake2s New128 keyed len=${i}`, toHex(blake2sKeyed(seq(i), goKey, 16)), goHashes128[i]);
}

// Cross-checked against Python's hashlib.blake2b (CPython's own C
// extension -- a completely independent implementation from both Node and
// this from-scratch code) for several non-default output lengths and a
// keyed + short-output combination, since Node cannot verify these here.
const pyKeyB = seq(64);
const pyKAT = [
  ['abc', null, 32, 'bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319'],
  ['abc', null, 20, '384264f676f39536840523f284921cdc68b6846b'],
  ['abc', null, 1, '6b'],
  ['', pyKeyB, 16, '2ae6b02df83c8d5a85eb7ab86fe3a11f'],
  ['abc', pyKeyB, 48, '93043d2104d6cc8ad34b52d905288a06811559eb8e9f8892d79e2b181f91deb536923f536e6da57296e36d9cdb0aa74d'],
];
for (const [msg, key, outLen, expected] of pyKAT) {
  const got = key ? toHex(blake2bKeyed(msg, key, outLen)) : toHex(blake2b(msg, outLen));
  check(`KAT python hashlib blake2b ${JSON.stringify(msg)} outLen=${outLen}${key ? ' keyed' : ''}`, got, expected);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
