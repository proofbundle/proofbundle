import {
  ntt, nttInverse, multiplyNTTs, polyMulSchoolbook,
  power2round, decompose,
  mldsaKeygen, mldsaSign, mldsaVerify, PARAMS,
} from './mldsa.mjs';

// No reference library is imported. Correctness is established by internal
// mathematical properties that a broken implementation cannot satisfy:
//   1. NTT is invertible (forward then inverse is the identity)
//   2. NTT-domain multiplication (plain coordinatewise, since ML-DSA's NTT is
//      a *complete* 256-point transform) agrees with direct schoolbook
//      multiplication in Z_q[X]/(X^256+1) — an independent computation
//   3. Power2Round / Decompose round-trip their inputs
//   4. Sign then verify succeeds, for every parameter set
//   5. Verify rejects: a flipped signature bit, a flipped message bit, a
//      signature made under a different key, and a truncated signature
//   6. Everything is deterministic given the same seed/rnd
//   7. Sizes match the FIPS 204 tables

const Q = 8380417;

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const eq = (a, b) => a.length === b.length && Array.from(a).every((v, i) => v === Array.from(b)[i]);
const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');

// deterministic pseudo-random filler (not cryptographic; test input only)
function fill(len, seed) {
  const out = new Uint8Array(len);
  let x = seed | 1;
  for (let i = 0; i < len; i++) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    out[i] = x & 0xff;
  }
  return out;
}

// deterministic pseudo-random polynomial with coefficients spread over [0, Q)
function randPoly(seed) {
  const f = new Int32Array(256);
  const r = fill(1024, seed);
  for (let i = 0; i < 256; i++) {
    const v = (r[4 * i] | (r[4 * i + 1] << 8) | (r[4 * i + 2] << 16) | (r[4 * i + 3] << 24)) >>> 0;
    f[i] = v % Q;
  }
  return f;
}

function modq(x) { const m = x % Q; return m < 0 ? m + Q : m; }

// --- 1. NTT invertibility -------------------------------------------------
for (const seed of [1, 12345, 999983, 424242]) {
  const f = randPoly(seed);
  const back = nttInverse(ntt(f));
  check(`NTT roundtrip seed=${seed}`, eq(f, back));
}

// --- 2. NTT multiplication vs schoolbook ----------------------------------
// ML-DSA's NTT is a *complete* 256-point transform (q ≡ 1 mod 512, so
// X^256+1 splits into 256 linear factors), so multiplyNTTs is plain
// coordinatewise product. Verify it still agrees with an independent
// schoolbook convolution mod (X^256+1).
for (const seed of [7, 4242, 31337]) {
  const a = randPoly(seed), b = randPoly(seed + 1);
  const viaNTT = nttInverse(multiplyNTTs(ntt(a), ntt(b)));
  const direct = polyMulSchoolbook(a, b);
  check(`NTT mul == schoolbook seed=${seed}`, eq(viaNTT, direct));
}

// --- 3. Power2Round / Decompose round-trip identities ---------------------
// Power2Round reconstructs its input exactly (no boundary wraparound).
{
  let allOk = true;
  const samples = [0, 1, Q - 1, Math.floor(Q / 2), 4096, 8191, 8192, 8193];
  for (let t = 0; t < 200; t++) samples.push(Math.floor(Math.random() * Q));
  for (const r of samples) {
    const [r1, r0] = power2round(r);
    const recon = r1 * 8192 + r0;
    if (recon !== modq(r)) { allOk = false; console.log(`Power2Round mismatch r=${r} -> r1=${r1} r0=${r0} recon=${recon}`); }
  }
  check('Power2Round round-trip (exact)', allOk);
}
// Decompose reconstructs its input mod q (the r+ = q-1 boundary wraps r1=0,
// r0=-1, which is only congruent to q-1 modulo q, not equal as an integer).
{
  let allOk = true;
  for (const gamma2 of [PARAMS['ML-DSA-44'].gamma2, PARAMS['ML-DSA-65'].gamma2]) {
    const samples = [0, 1, Q - 1, Q - 2, 2 * gamma2, 2 * gamma2 - 1, Math.floor(Q / 2)];
    for (let t = 0; t < 200; t++) samples.push(Math.floor(Math.random() * Q));
    for (const r of samples) {
      const [r1, r0] = decompose(r, gamma2);
      const recon = modq(r1 * 2 * gamma2 + r0);
      if (recon !== modq(r)) { allOk = false; console.log(`Decompose mismatch gamma2=${gamma2} r=${r} -> r1=${r1} r0=${r0} recon=${recon}`); }
    }
  }
  check('Decompose round-trip (mod q)', allOk);
}

// --- 4/5/6/7. Full sign/verify across all parameter sets -------------------
const SIZES = {
  'ML-DSA-44': { pk: 1312, sk: 2560, sig: 2420 },
  'ML-DSA-65': { pk: 1952, sk: 4032, sig: 3309 },
  'ML-DSA-87': { pk: 2592, sk: 4896, sig: 4627 },
};

for (const name of Object.keys(PARAMS)) {
  const kseed = fill(32, 0xABCD + name.charCodeAt(7));
  const rnd = fill(32, 0x1234 + name.charCodeAt(7));
  const message = new TextEncoder().encode(`ProofBundle ML-DSA test message for ${name} — the quick brown fox`);

  const { publicKey, privateKey } = mldsaKeygen(kseed, name);
  const exp = SIZES[name];
  check(`${name} pk size`, publicKey.length === exp.pk, `${publicKey.length} != ${exp.pk}`);
  check(`${name} sk size`, privateKey.length === exp.sk, `${privateKey.length} != ${exp.sk}`);

  const sig = mldsaSign(privateKey, message, rnd, name);
  check(`${name} sig size`, sig.length === exp.sig, `${sig.length} != ${exp.sig}`);

  const ok = mldsaVerify(publicKey, message, sig, name);
  check(`${name} sign/verify agree`, ok === true);

  // determinism: same key + same rnd must reproduce byte-identical signature
  const sig2 = mldsaSign(privateKey, message, rnd, name);
  check(`${name} sign deterministic`, eq(sig, sig2));

  // different rnd (still deterministic per-call) must generally change the signature
  const sigDiffRnd = mldsaSign(privateKey, message, fill(32, 0x9999 + name.charCodeAt(7)), name);
  check(`${name} distinct rnd -> distinct sig`, !eq(sig, sigDiffRnd));
  check(`${name} distinct rnd still verifies`, mldsaVerify(publicKey, message, sigDiffRnd, name));

  // --- rejection tests ---

  // flipped bit in signature (flip a bit inside z, well past the cTilde prefix)
  const tamperedSig = Uint8Array.from(sig);
  tamperedSig[exp.sig - 10] ^= 0x01;
  check(`${name} verify rejects flipped signature bit`, mldsaVerify(publicKey, message, tamperedSig, name) === false);

  // flipped bit in cTilde specifically (first byte)
  const tamperedSig2 = Uint8Array.from(sig);
  tamperedSig2[0] ^= 0x01;
  check(`${name} verify rejects flipped cTilde bit`, mldsaVerify(publicKey, message, tamperedSig2, name) === false);

  // flipped bit in message
  const tamperedMsg = Uint8Array.from(message);
  tamperedMsg[0] ^= 0x01;
  check(`${name} verify rejects flipped message bit`, mldsaVerify(publicKey, tamperedMsg, sig, name) === false);

  // signature from a different key
  const otherKeys = mldsaKeygen(fill(32, 0xDEAD + name.charCodeAt(7)), name);
  check(`${name} verify rejects signature under different key`,
    mldsaVerify(otherKeys.publicKey, message, sig, name) === false);
  const sigFromOtherKey = mldsaSign(otherKeys.privateKey, message, rnd, name);
  check(`${name} verify rejects other key's signature against this pk`,
    mldsaVerify(publicKey, message, sigFromOtherKey, name) === false);

  // truncated signature
  const truncatedSig = sig.slice(0, sig.length - 16);
  check(`${name} verify rejects truncated signature`, mldsaVerify(publicKey, message, truncatedSig, name) === false);

  // overlong (padded) signature
  const paddedSig = new Uint8Array(sig.length + 8);
  paddedSig.set(sig);
  check(`${name} verify rejects overlong signature`, mldsaVerify(publicKey, message, paddedSig, name) === false);

  console.log(`${name}: pk=${publicKey.length} sk=${privateKey.length} sig=${sig.length} cTilde=${hex(sig.slice(0, 8))}...`);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
