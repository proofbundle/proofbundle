// Ed448 against OpenSSL 3.5.7 (node:crypto) and the vector on disk.
//
// Checks:
//   1. public key derived from a seed matches OpenSSL's
//   2. Ed448 is deterministic: our signature bytes equal OpenSSL's
//   3. cross-verification both directions
//   4. tamper rejection (signature, message, public key)
//   5. the ground-truth vector for algo-ed448 on IMAGES-A verifies
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign as nodeSign, verify as nodeVerify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { keyPairFromSeed, sign, verify } from './ed448.mjs';

const KAT = '/media/falsealias/IMAGES-A/vectors-home/crypto-kat-algo-repos-20260924/algo-repos/algo-ed448/ground-truths/ground_truth.json';
const hex = (b) => Buffer.from(b).toString('hex');
const unb = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));

let pass = 0, fail = 0;
function check(label, ok, detail = '') {
  if (ok) pass++;
  else { fail++; console.log(`FAIL: ${label} ${detail}`); }
}

function nodeKeyFromSeed(seed, pub) {
  return createPrivateKey({
    key: {
      kty: 'OKP', crv: 'Ed448',
      d: Buffer.from(seed).toString('base64url'),
      x: Buffer.from(pub).toString('base64url'),
    },
    format: 'jwk',
  });
}

for (let i = 0; i < 5; i++) {
  const seed = new Uint8Array(randomBytes(57));
  const ours = keyPairFromSeed(seed);
  const key = nodeKeyFromSeed(seed, ours.publicKey);
  const nodePub = new Uint8Array(Buffer.from(createPublicKey(key).export({ format: 'jwk' }).x, 'base64url'));

  check(`public key from seed #${i}`, hex(ours.publicKey) === hex(nodePub),
        `\n  openssl ${hex(nodePub)}\n  ours    ${hex(ours.publicKey)}`);

  for (const len of [0, 1, 64, 1000]) {
    const msg = new Uint8Array(randomBytes(len));
    const nodeSig = new Uint8Array(nodeSign(null, msg, key));
    const ourSig = sign(msg, seed);
    check(`deterministic signature len=${len} #${i}`, hex(ourSig) === hex(nodeSig));
    check(`openssl verifies ours len=${len} #${i}`, nodeVerify(null, msg, createPublicKey(key), Buffer.from(ourSig)));
    check(`we verify openssl len=${len} #${i}`, verify(nodeSig, msg, nodePub));

    const badSig = Uint8Array.from(ourSig); badSig[40] ^= 1;
    check(`we reject altered signature len=${len} #${i}`, !verify(badSig, msg, nodePub));
    check(`openssl rejects altered signature len=${len} #${i}`,
          !nodeVerify(null, msg, createPublicKey(key), Buffer.from(badSig)));

    const badMsg = Uint8Array.from(msg.length ? msg : new Uint8Array([0]));
    badMsg[0] ^= 1;
    check(`we reject altered message len=${len} #${i}`, !verify(ourSig, badMsg, nodePub));

    const wrongSeed = new Uint8Array(randomBytes(57));
    const wrongPub = keyPairFromSeed(wrongSeed).publicKey;
    check(`we reject wrong key len=${len} #${i}`, !verify(ourSig, msg, wrongPub));
  }
}

// 5: on-disk ground truth produced by python cryptography on 2026-09-24
{
  const gt = JSON.parse(readFileSync(KAT, 'utf8'));
  const v = gt.verified_outputs.python;
  const pk = unb(v.public_key_hex);
  const sig = unb(v.signature_hex);
  const msg = unb(gt.reference_implementations.python.test_input_hex);
  check('ground truth signature length', sig.length === 114, `got ${sig.length}`);
  check('ground truth verifies', verify(sig, msg, pk));
  const bad = Uint8Array.from(sig); bad[0] ^= 1;
  check('ground truth tamper rejected', !verify(bad, msg, pk));
}

console.log(`\nEd448 vs OpenSSL + on-disk KAT: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
