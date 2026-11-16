// Hybrid KEM and hybrid signature tests.
//
// The combiner is generic (hybrids.mjs imports no algorithm), so this test wires
// the repo's primitives in and attacks the construction rather than the parts:
// dropping a component, swapping the order, tampering one component's bytes, and
// truncating the framing must all fail.
//
// Runtime note: SLH-DSA signing is seconds, so it appears in one signature
// combination rather than the full matrix; the machinery is identical for the
// others.
import { combineSecrets, kemEncap, kemDecap, sigSign, sigVerify } from './hybrids.mjs';
import { x25519Keygen, x25519Shared } from './x25519.mjs';
import { x448Keygen, x448Shared } from './x448.mjs';
import { mlkemKeygen, mlkemEncapsulate, mlkemDecapsulate } from './mlkem.mjs';
import { mldsaKeygen, mldsaSign, mldsaVerify } from './mldsa.mjs';
import { keyPairFromSeed as ed25519KeyPair, sign as ed25519Sign, verify as ed25519Verify } from './ed25519.mjs';
import { keyPairFromSeed as ed448KeyPair, sign as ed448Sign, verify as ed448Verify } from './ed448.mjs';
import { keygen as slhKeygen, sign as slhSign, verify as slhVerify } from './slh-dsa.mjs';

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const hex = (b) => Buffer.from(b).toString('hex');
const seed = (n, v) => Uint8Array.from({ length: n }, (_, i) => ((i * 31) + v) & 255);
const cat = (...xs) => { const o = new Uint8Array(xs.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of xs) { o.set(x, p); p += x.length; } return o; };

// ---- DH-style KEM adapters ------------------------------------------------
function dhKem(name, keygen, shared, len) {
  return (privateKey) => {
    const raw = keygen(privateKey);
    const publicKey = raw instanceof Uint8Array ? raw : (raw.publicKey || raw.pub || raw.encapsKey);
    if (!(publicKey instanceof Uint8Array)) throw new TypeError('keygen returned no public key bytes');
    return {
      name, publicKey, secretKey: privateKey,
      encapsulate: (pk) => {
        const eph = seed(len, 91);
        const ephRaw = keygen(eph);
        const ephPub = ephRaw instanceof Uint8Array ? ephRaw : (ephRaw.publicKey || ephRaw.pub);
        return { ciphertext: ephPub, secret: shared(eph, pk) };
      },
      decapsulate: (ct, sk) => shared(sk, ct),
    };
  };
}

function mlkemAdaptor(paramName, privateSeed) {
  const k = mlkemKeygen(privateSeed, paramName);
  return {
    name: paramName, publicKey: k.encapsKey, secretKey: k.decapsKey,
    encapsulate: (ek) => {
      const e = mlkemEncapsulate(ek, seed(32, 7), paramName);
      return { ciphertext: e.ciphertext, secret: e.sharedSecret };
    },
    decapsulate: (ct, dk) => mlkemDecapsulate(dk, ct, paramName),
  };
}

// ---- Signature adapters ---------------------------------------------------
function ed25519Part(s) {
  const kp = ed25519KeyPair(s);
  return { name: 'Ed25519', publicKey: kp.publicKey, secretKey: kp.secretKey,
           sign: (m) => ed25519Sign(m, kp.secretKey), verify: (sig, m) => ed25519Verify(sig, m, kp.publicKey) };
}
function ed448Part(s) {
  const kp = ed448KeyPair(s);
  return { name: 'Ed448', publicKey: kp.publicKey, secretKey: kp.secretKey,
           sign: (m) => ed448Sign(m, kp.secretKey), verify: (sig, m) => ed448Verify(sig, m, kp.publicKey) };
}
function mldsaPart(s) {
  const kp = mldsaKeygen(s);
  return { name: 'ML-DSA-44', publicKey: kp.publicKey, secretKey: kp.privateKey,
           sign: (m) => mldsaSign(kp.privateKey, m, new Uint8Array(32)), verify: (sig, m) => mldsaVerify(kp.publicKey, m, sig) };
}
function slhPart(s) {
  const kp = slhKeygen(s);
  return { name: 'SLH-DSA-SHA2-128f', publicKey: kp.publicKey, secretKey: kp.secretKey,
           sign: (m) => slhSign(m, kp.secretKey, { deterministic: true }), verify: (sig, m) => slhVerify(sig, m, kp.publicKey) };
}

// ---- the combiner itself --------------------------------------------------
{
  const a = seed(32, 1), b = seed(32, 2);
  const k1 = combineSecrets('L1', ['A', 'B'], [seed(32, 3), seed(32, 4)], [a, b]);
  const k2 = combineSecrets('L1', ['A', 'B'], [seed(32, 3), seed(32, 4)], [a, b]);
  check('combiner is deterministic for the same inputs', hex(k1) === hex(k2));
  check('different label gives a different secret',
    hex(combineSecrets('L2', ['A', 'B'], [seed(32, 3), seed(32, 4)], [a, b])) !== hex(k1));
  check('swapped order gives a different secret',
    hex(combineSecrets('L1', ['B', 'A'], [seed(32, 4), seed(32, 3)], [b, a])) !== hex(k1));
  check('different public keys give a different secret',
    hex(combineSecrets('L1', ['A', 'B'], [seed(32, 5), seed(32, 4)], [a, b])) !== hex(k1));
  check('one component is rejected', (() => { try { combineSecrets('L1', ['A'], [seed(32, 3)], [a]); return false; } catch { return true; } })());
}

// ---- KEM hybrids ----------------------------------------------------------
const kemSets = [
  ['X25519+X448', () => [dhKem('X25519', x25519Keygen, x25519Shared, 32)(seed(32, 11)), dhKem('X448', x448Keygen, x448Shared, 56)(seed(56, 12))]],
  ['X25519+ML-KEM-768', () => [dhKem('X25519', x25519Keygen, x25519Shared, 32)(seed(32, 11)), mlkemAdaptor('ML-KEM-768', seed(64, 13))]],
  ['X448+ML-KEM-768', () => [dhKem('X448', x448Keygen, x448Shared, 56)(seed(56, 12)), mlkemAdaptor('ML-KEM-768', seed(64, 13))]],
  ['X25519+X448+ML-KEM-768', () => [dhKem('X25519', x25519Keygen, x25519Shared, 32)(seed(32, 11)), dhKem('X448', x448Keygen, x448Shared, 56)(seed(56, 12)), mlkemAdaptor('ML-KEM-768', seed(64, 13))]],
];
for (const [label, make] of kemSets) {
  const parts = make();
  const enc = kemEncap(parts);
  const dec = kemDecap(parts, enc.ciphertext);
  check(`${label}: encaps/decaps agree`, dec !== null && hex(dec) === hex(enc.secret));

  // Hostile: flip a byte inside each component's ciphertext.
  let off = 0;
  for (let i = 0; i < parts.length; i++) {
    const len = (enc.ciphertext[off] << 8) | enc.ciphertext[off + 1];
    const tampered = Uint8Array.from(enc.ciphertext);
    tampered[off + 2] ^= 1;
    const got = kemDecap(parts, tampered);
    check(`${label}: tampered component ${i} does not yield the same secret`,
      got === null || hex(got) !== hex(enc.secret));
    off += 2 + len;
  }
  // Hostile: drop the last component's framing.
  check(`${label}: truncated framing rejected`,
    kemDecap(parts, enc.ciphertext.subarray(0, enc.ciphertext.length - 1)) === null);
  // Hostile: reorder the components at decapsulation.
  if (parts.length > 1) {
    const swapped = [...parts].reverse();
    const got = kemDecap(swapped, enc.ciphertext);
    check(`${label}: component order is bound into the secret`,
      got === null || hex(got) !== hex(enc.secret));
  }
}

// ---- Signature hybrids ----------------------------------------------------
const sigSets = [
  ['Ed25519+Ed448', () => [ed25519Part(seed(32, 21)), ed448Part(seed(57, 22))]],
  ['Ed25519+ML-DSA-44', () => [ed25519Part(seed(32, 21)), mldsaPart(seed(32, 23))]],
  ['Ed448+ML-DSA-44', () => [ed448Part(seed(57, 22)), mldsaPart(seed(32, 23))]],
  ['Ed25519+SLH-DSA', () => [ed25519Part(seed(32, 21)), slhPart(seed(48, 24))]],
];
const msg = new TextEncoder().encode('hybrid signature, 2026-11-16');
for (const [label, make] of sigSets) {
  const parts = make();
  const sig = sigSign(parts, msg);
  check(`${label}: hybrid verifies`, sigVerify(parts, msg, sig) === true);
  check(`${label}: altered message rejected`,
    sigVerify(parts, cat(msg, Uint8Array.of(0)), sig) === false);
  check(`${label}: truncated signature rejected`,
    sigVerify(parts, msg, sig.subarray(0, sig.length - 1)) === false);

  // Hostile: break each component's signature in turn; the hybrid must fail.
  let off = 0;
  for (let i = 0; i < parts.length; i++) {
    const len = (sig[off] << 24) | (sig[off + 1] << 16) | (sig[off + 2] << 8) | sig[off + 3];
    const tampered = Uint8Array.from(sig);
    tampered[off + 4] ^= 1;
    check(`${label}: tampered component ${i} is rejected`, sigVerify(parts, msg, tampered) === false);
    off += 4 + len;
  }
  // Hostile: verify with the components in the other order.
  check(`${label}: reordered components are rejected`,
    sigVerify([...parts].reverse(), msg, sig) === false);

  // Hostile: one component replaced by a different key pair.
  if (parts.length === 2) {
    const other = label.includes('Ed25519') ? ed25519Part(seed(32, 99)) : null;
    if (other) {
      const mixed = [other, parts[1]];
      check(`${label}: wrong Ed25519 key rejected`, sigVerify(mixed, msg, sig) === false);
    }
  }
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
