import { keyPairFromSeed, sign, verify } from './ed25519.mjs';
import { createPrivateKey, createPublicKey, sign as nodeSign, verify as nodeVerify, randomBytes } from 'node:crypto';

let pass = 0, fail = 0; const bad = [];
const chk = (n, a, b) => { if (a === b) pass++; else { fail++; bad.push(n + "\n  got " + a + "\n  ref " + b); } };
const hex = (b) => Buffer.from(b).toString('hex');

// node:crypto only appears in this test file, never in the implementation.
// Raw 32-byte seed <-> PKCS8/SPKI DER, via the fixed OneAsymmetricKey header
// for Ed25519 (RFC 8410).
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const nodePrivFromSeed = (seed) => createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, seed]), format: 'der', type: 'pkcs8' });
const nodePubFromRaw = (pub) => createPublicKey({ key: Buffer.concat([SPKI_PREFIX, pub]), format: 'der', type: 'spki' });
const nodePubBytes = (seed) => {
  const der = createPublicKey(nodePrivFromSeed(seed)).export({ format: 'der', type: 'spki' });
  return der.subarray(der.length - 32);
};

// No hardcoded RFC 8032 vectors here: a hex string transcribed from memory
// is exactly the kind of unattested claim this project exists to catch (this
// file tried it twice while being written and got the seed length wrong
// both times). node:crypto's own Ed25519 is the independent arbiter instead,
// exercised below over randomised seeds and message lengths.

// Randomised cross-verification: keygen, sign, verify against node:crypto
// across seeds and message lengths straddling common boundaries.
for (let i = 0; i < 40; i++) {
  const seed = randomBytes(32);
  const len = [0, 1, 2, 31, 32, 33, 63, 64, 65, 127, 128, 255, 1000][i % 13];
  const msg = randomBytes(len);

  const kp = keyPairFromSeed(new Uint8Array(seed));
  const nodePub = nodePubBytes(seed);
  chk(`rand[${i}] len=${len} pubkey`, hex(kp.publicKey), hex(nodePub));

  const sig = sign(new Uint8Array(msg), new Uint8Array(seed));
  const nodeSig = nodeSign(null, msg, nodePrivFromSeed(seed));
  chk(`rand[${i}] len=${len} signature`, hex(sig), hex(nodeSig));
  chk(`rand[${i}] len=${len} node accepts ours`,
    nodeVerify(null, msg, nodePubFromRaw(kp.publicKey), Buffer.from(sig)), true);
  chk(`rand[${i}] len=${len} ours accepts node sig`,
    verify(new Uint8Array(nodeSig), new Uint8Array(msg), kp.publicKey), true);
}

// Negative cases — every one of these MUST be rejected.
{
  const seed = new Uint8Array(randomBytes(32));
  const kp = keyPairFromSeed(seed);
  const msg = new TextEncoder().encode('admissibility, not truth');
  const sig = sign(msg, seed);
  chk('valid baseline verifies', verify(sig, msg, kp.publicKey), true);

  for (const bit of [0, 7, 255, 256, 383, 511]) {
    const bad_ = sig.slice();
    bad_[bit >> 3] ^= (1 << (bit & 7));
    chk(`bit flip @${bit} rejected`, verify(bad_, msg, kp.publicKey), false);
  }
  const badMsg = msg.slice(); badMsg[0] ^= 1;
  chk('tampered message rejected', verify(sig, badMsg, kp.publicKey), false);

  const otherPub = keyPairFromSeed(new Uint8Array(randomBytes(32))).publicKey;
  chk('wrong public key rejected', verify(sig, msg, otherPub), false);

  const badPub = kp.publicKey.slice(); badPub[31] ^= 0x80;
  chk('corrupted public key rejected', verify(sig, msg, badPub), false);

  chk('truncated signature rejected', verify(sig.slice(0, 63), msg, kp.publicKey), false);
  chk('oversized signature rejected', verify(new Uint8Array([...sig, 0]), msg, kp.publicKey), false);
  chk('all-zero signature rejected', verify(new Uint8Array(64), msg, kp.publicKey), false);
  chk('all-ff signature rejected', verify(new Uint8Array(64).fill(0xff), msg, kp.publicKey), false);
}

// Determinism and shape.
{
  const seed = new Uint8Array(randomBytes(32));
  const msg = new TextEncoder().encode('deterministic');
  const a = sign(msg, seed), b = sign(msg, seed);
  chk('signing is deterministic', hex(a), hex(b));
  chk('signature is 64 bytes', a.length, 64);
  chk('public key is 32 bytes', keyPairFromSeed(seed).publicKey.length, 32);
}

console.log(`ed25519: ${pass} pass, ${fail} fail`);
if (bad.length) console.log(bad.slice(0, 8).join("\n"));
process.exit(fail ? 1 : 0);
