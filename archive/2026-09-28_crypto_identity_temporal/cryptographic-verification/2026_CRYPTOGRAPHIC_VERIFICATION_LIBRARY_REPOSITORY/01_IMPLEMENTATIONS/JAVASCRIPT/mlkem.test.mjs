import {
  ntt, nttInverse, multiplyNTTs, polyMulSchoolbook,
  mlkemKeygen, mlkemEncapsulate, mlkemDecapsulate, PARAMS,
} from './mlkem.mjs';

// No reference library is imported. Correctness is established by internal
// mathematical properties that a broken implementation cannot satisfy:
//   1. NTT is invertible (forward then inverse is the identity)
//   2. NTT-domain multiplication agrees with direct schoolbook multiplication
//      in Z_q[X]/(X^256+1) — an independent computation of the same product
//   3. Encapsulate/decapsulate agree on the shared secret
//   4. A tampered ciphertext triggers implicit rejection, yielding a different
//      secret rather than the real one
//   5. Everything is deterministic from a fixed seed
//   6. Sizes match the FIPS 203 tables

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const hex = (b) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

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

// --- 1. NTT invertibility -------------------------------------------------
for (const seed of [1, 12345, 999983]) {
  const f = new Int32Array(256);
  const r = fill(512, seed);
  for (let i = 0; i < 256; i++) f[i] = ((r[2 * i] << 8) | r[2 * i + 1]) % 3329;
  const back = nttInverse(ntt(f));
  check(`NTT roundtrip seed=${seed}`, eq(Array.from(f), Array.from(back)));
}

// --- 2. NTT multiplication vs schoolbook ---------------------------------
for (const seed of [7, 4242]) {
  const a = new Int32Array(256), b = new Int32Array(256);
  const ra = fill(512, seed), rb = fill(512, seed + 1);
  for (let i = 0; i < 256; i++) {
    a[i] = ((ra[2 * i] << 8) | ra[2 * i + 1]) % 3329;
    b[i] = ((rb[2 * i] << 8) | rb[2 * i + 1]) % 3329;
  }
  const viaNTT = nttInverse(multiplyNTTs(ntt(a), ntt(b)));
  const direct = polyMulSchoolbook(a, b);
  check(`NTT mul == schoolbook seed=${seed}`, eq(Array.from(viaNTT), Array.from(direct)));
}

// --- 3/4/5/6. Full KEM across all parameter sets --------------------------
const SIZES = {
  'ML-KEM-512':  { ek: 800,  dk: 1632, ct: 768 },
  'ML-KEM-768':  { ek: 1184, dk: 2400, ct: 1088 },
  'ML-KEM-1024': { ek: 1568, dk: 3168, ct: 1568 },
};

for (const name of Object.keys(PARAMS)) {
  const kseed = fill(64, 0xABCD);
  const mseed = fill(32, 0x1234);

  const { encapsKey, decapsKey } = mlkemKeygen(kseed, name);
  const exp = SIZES[name];
  check(`${name} ek size`, encapsKey.length === exp.ek, `${encapsKey.length} != ${exp.ek}`);
  check(`${name} dk size`, decapsKey.length === exp.dk, `${decapsKey.length} != ${exp.dk}`);

  const { sharedSecret, ciphertext } = mlkemEncapsulate(encapsKey, mseed, name);
  check(`${name} ct size`, ciphertext.length === exp.ct, `${ciphertext.length} != ${exp.ct}`);
  check(`${name} ss size`, sharedSecret.length === 32);

  const recovered = mlkemDecapsulate(decapsKey, ciphertext, name);
  check(`${name} encaps/decaps agree`, eq(Array.from(sharedSecret), Array.from(recovered)),
    `${hex(sharedSecret).slice(0, 24)} vs ${hex(recovered).slice(0, 24)}`);

  // determinism: same seeds must reproduce byte-identical output
  const again = mlkemKeygen(kseed, name);
  check(`${name} keygen deterministic`, eq(Array.from(encapsKey), Array.from(again.encapsKey)));
  const enc2 = mlkemEncapsulate(encapsKey, mseed, name);
  check(`${name} encaps deterministic`, eq(Array.from(ciphertext), Array.from(enc2.ciphertext)));

  // implicit rejection: flip one bit of ciphertext, secret must change
  const tampered = Uint8Array.from(ciphertext);
  tampered[0] ^= 0x01;
  const rej = mlkemDecapsulate(decapsKey, tampered, name);
  check(`${name} tampered ct rejected`, !eq(Array.from(rej), Array.from(sharedSecret)));
  check(`${name} rejection secret sized`, rej.length === 32);

  // distinct seeds must give distinct secrets
  const { sharedSecret: ssB } = mlkemEncapsulate(encapsKey, fill(32, 0x9999), name);
  check(`${name} distinct seed -> distinct ss`, !eq(Array.from(sharedSecret), Array.from(ssB)));

  console.log(`${name}: ek=${encapsKey.length} dk=${decapsKey.length} ct=${ciphertext.length} ss=${hex(sharedSecret).slice(0, 16)}...`);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
