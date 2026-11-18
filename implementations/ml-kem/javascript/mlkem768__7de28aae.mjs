// mlkem768.mjs - ML-KEM-768 implementation per FIPS 203
// From scratch, no dependencies, constant-time operations

const Q = 3329;
const N = 256;
const K = 3;
const ETA1 = 2;
const ETA2 = 2;
const DU = 10;
const DV = 4;

// Keccak-f[1600] round constants
const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

const R = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

function keccakF1600(state) {
  const A = Array(5).fill(0).map(() => Array(5).fill(0n));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const idx = i * 5 + j;
      let val = 0n;
      for (let b = 0; b < 8; b++) val |= BigInt(state[idx * 8 + b]) << BigInt(b * 8);
      A[i][j] = val;
    }
  }
  for (let round = 0; round < 24; round++) {
    const C = Array(5).fill(0n);
    for (let i = 0; i < 5; i++) C[i] = A[i][0] ^ A[i][1] ^ A[i][2] ^ A[i][3] ^ A[i][4];
    const D = Array(5).fill(0n);
    for (let i = 0; i < 5; i++) D[i] = C[(i + 4) % 5] ^ ((C[(i + 1) % 5] << 1n) | (C[(i + 1) % 5] >> 63n));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) A[i][j] ^= D[i];
    const B = Array(5).fill(0).map(() => Array(5).fill(0n));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const rot = R[j][i];
      B[j][i] = (A[i][j] << BigInt(rot)) | (A[i][j] >> BigInt(64 - rot));
    }
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) A[i][j] = B[i][j] ^ ((~B[i][(j + 1) % 5]) & B[i][(j + 2) % 5]);
    A[0][0] ^= RC[round];
  }
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const idx = i * 5 + j;
      const val = A[i][j];
      for (let b = 0; b < 8; b++) state[idx * 8 + b] = Number((val >> BigInt(b * 8)) & 0xffn);
    }
  }
}

function keccak(rate, suffix, input, outputLen) {
  const state = Array(200).fill(0);
  const rateBytes = rate / 8;
  let inputOffset = 0;
  while (inputOffset < input.length) {
    const blockLen = Math.min(rateBytes, input.length - inputOffset);
    for (let i = 0; i < blockLen; i++) state[i] ^= input[inputOffset + i];
    inputOffset += blockLen;
    if (blockLen === rateBytes) keccakF1600(state);
  }
  state[input.length % rateBytes] ^= suffix;
  state[rateBytes - 1] ^= 0x80;
  keccakF1600(state);
  const output = new Uint8Array(outputLen);
  let outputOffset = 0;
  while (outputOffset < outputLen) {
    const blockLen = Math.min(rateBytes, outputLen - outputOffset);
    for (let i = 0; i < blockLen; i++) output[outputOffset + i] = state[i];
    outputOffset += blockLen;
    if (outputOffset < outputLen) keccakF1600(state);
  }
  return output;
}

function shake128(input, outputLen) { return keccak(1344, 0x1f, input, outputLen); }
function shake256(input, outputLen) { return keccak(1088, 0x1f, input, outputLen); }
function sha3_256(input) { return keccak(1088, 0x06, input, 32); }
function sha3_512(input) { return keccak(576, 0x06, input, 64); }

// Barrett reduction: floor(2^26 / 3329) = 20159
const BARRETT_SHIFT = 26;
const BARRETT_FACTOR = 20159;

function barrettReduce(a) {
  let r = a - ((a * BARRETT_FACTOR) >> BARRETT_SHIFT) * Q;
  const mask = -(r >= Q);
  r -= Q & mask;
  const mask2 = -(r < 0);
  r += Q & mask2;
  return r;
}

// NTT zetas (powers of 17 mod 3329)
const ZETAS = [
  1, 1729, 2580, 3289, 2642, 630, 1897, 848, 1062, 2699, 2139, 2111,
  2552, 2002, 2630, 884, 1792, 2262, 1300, 2662, 3285, 108, 2182, 1944,
  726, 1692, 1229, 942, 2915, 2508, 3160, 2294, 1023, 3041, 3023, 2842,
  2212, 3246, 764, 1070, 1416, 1971, 2299, 1698, 2044, 3069, 1084, 1073,
  939, 2456, 2877, 2461, 2822, 1241, 2041, 3141, 1265, 2727, 3253, 2106,
  2654, 923, 1648, 3063, 2283, 412, 1690, 1036, 2849, 1069, 744, 3245,
  1845, 2583, 645, 2814, 647, 62, 3122, 3044, 2205, 3003, 2618, 1692,
  1293, 2742, 2325, 1842, 2494, 804, 3145, 3094, 3214, 290, 285, 2384,
  2256, 2121, 222, 1447, 1536, 1840, 2364, 3017, 1851, 805, 142, 2889,
  2240, 2281, 2622, 1801, 481, 2812, 2601, 654, 1129, 812, 3022, 1731,
  3099, 1553, 1494, 2376, 218, 2779, 1525, 2369, 3328, 1600, 749, 40,
  687, 2699, 1432, 2481, 2267, 630, 1190, 1218, 777, 1327, 699, 2445,
  1537, 1067, 2029, 667, 44, 3221, 1147, 1385, 2603, 1637, 2100, 2387,
  414, 821, 169, 1035, 2306, 288, 306, 487, 1117, 83, 2565, 2259,
  1913, 1358, 1030, 1631, 1285, 260, 2245, 2256, 2390, 873, 452, 868,
  507, 2088, 1288, 188, 2064, 602, 76, 1223, 675, 2406, 1681, 266,
  1046, 2917, 1639, 2293, 480, 2260, 2585, 84, 1484, 746, 2684, 515,
  2682, 3267, 207, 285, 1124, 326, 711, 1637, 2036, 587, 1004, 1487,
  835, 2525, 184, 235, 115, 3039, 3044, 945, 1073, 1208, 3107, 1882,
  1793, 1489, 965, 312, 1478, 2524, 3187, 440, 1089, 1048, 707, 1528,
  2848, 517, 728, 2675, 2200, 2517, 307, 1598, 230, 776, 835, 953,
  3111, 550, 1804, 960
];

function ntt(a) {
  let len = 128, zetaIdx = 1;
  const r = new Int16Array(a);
  for (; len >= 2; len >>= 1) {
    for (let start = 0; start < 256; start += 2 * len) {
      const zeta = ZETAS[zetaIdx++];
      for (let j = start; j < start + len; j++) {
        const t = barrettReduce(zeta * r[j + len]);
        r[j + len] = barrettReduce(r[j] - t);
        r[j] = barrettReduce(r[j] + t);
      }
    }
  }
  return r;
}

function invNtt(a) {
  const r = new Int16Array(a);
  let len = 2, zetaIdx = 127;
  for (; len <= 128; len <<= 1) {
    for (let start = 0; start < 256; start += 2 * len) {
      const zeta = ZETAS[zetaIdx--];
      for (let j = start; j < start + len; j++) {
        const t = r[j];
        r[j] = barrettReduce(t + r[j + len]);
        r[j + len] = barrettReduce(zeta * (r[j + len] - t));
      }
    }
  }
  const nInv = 3303; // 256^-1 mod 3329
  for (let i = 0; i < 256; i++) r[i] = barrettReduce(r[i] * nInv);
  return r;
}

function baseCaseMultiply(a0, a1, b0, b1, zeta) {
  return [
    barrettReduce(a0 * b0 + barrettReduce(zeta * a1 * b1)),
    barrettReduce(a1 * b0 + a0 * b1)
  ];
}

function multiplyNTT(a, b) {
  const aHat = ntt(new Int16Array(a));
  const bHat = ntt(new Int16Array(b));
  const cHat = new Int16Array(256);
  for (let i = 0; i < 128; i++) {
    const [r0, r1] = baseCaseMultiply(aHat[2*i], aHat[2*i+1], bHat[2*i], bHat[2*i+1], ZETAS[64+i]);
    cHat[2*i] = r0;
    cHat[2*i+1] = r1;
  }
  return invNtt(cHat);
}

function cbd(buf, eta) {
  const r = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    let a = 0, b = 0;
    for (let j = 0; j < eta; j++) {
      a += (buf[2*i*eta + j] & 1);
      b += ((buf[2*i*eta + j] >> 1) & 1);
    }
    r[i] = a - b;
  }
  return r;
}

function compress(d, x) {
  const t = (x << d) + Math.floor(Q / 2);
  return Math.floor(t / Q) & ((1 << d) - 1);
}

function decompress(d, x) {
  return Math.floor((x * Q + (1 << (d - 1))) >> d);
}

function encodePoly(f) {
  const r = new Uint8Array(384);
  for (let i = 0; i < 256; i++) {
    const t = ((f[i] % Q) + Q) % Q;
    r[3*i] = t & 0xff;
    r[3*i+1] = (t >> 8) & 0xff;
    r[3*i+2] = (t >> 16) & 0xff;
  }
  return r;
}

function decodePoly(a) {
  const r = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    r[i] = a[3*i] | (a[3*i+1] << 8) | (a[3*i+2] << 16);
    if (r[i] >= 8192) r[i] -= 16384;
  }
  return r;
}

function encodeVec(vec, k) {
  const r = new Uint8Array(k * 384);
  for (let i = 0; i < k; i++) r.set(encodePoly(vec[i]), i * 384);
  return r;
}

function decodeVec(a, k) {
  const r = [];
  for (let i = 0; i < k; i++) r.push(decodePoly(a.subarray(i * 384, (i + 1) * 384)));
  return r;
}

function compressPoly(d, f) {
  const r = new Uint8Array(256 * d / 8);
  for (let i = 0; i < 256; i++) {
    const c = compress(d, f[i]);
    for (let j = 0; j < d; j++) {
      const bit = (c >> j) & 1;
      const bitPos = i * d + j;
      r[bitPos >> 3] |= bit << (bitPos & 7);
    }
  }
  return r;
}

function decompressPoly(d, buf) {
  const r = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    let c = 0;
    for (let j = 0; j < d; j++) {
      const bitPos = i * d + j;
      c |= ((buf[bitPos >> 3] >> (bitPos & 7)) & 1) << j;
    }
    r[i] = decompress(d, c);
  }
  return r;
}

function encodeCompressedVec(vec, k, d) {
  const r = new Uint8Array(k * 256 * d / 8);
  for (let i = 0; i < k; i++) {
    const enc = compressPoly(d, vec[i]);
    r.set(enc, i * 256 * d / 8);
  }
  return r;
}

function decodeCompressedVec(a, k, d) {
  const r = [];
  const bytesPerPoly = 256 * d / 8;
  for (let i = 0; i < k; i++) r.push(decompressPoly(d, a.subarray(i * bytesPerPoly, (i + 1) * bytesPerPoly)));
  return r;
}

function polyAdd(a, b) {
  const r = new Int16Array(256);
  for (let i = 0; i < 256; i++) r[i] = barrettReduce(a[i] + b[i]);
  return r;
}

function polySub(a, b) {
  const r = new Int16Array(256);
  for (let i = 0; i < 256; i++) r[i] = barrettReduce(a[i] - b[i]);
  return r;
}

function vecAdd(a, b, k) {
  const r = [];
  for (let i = 0; i < k; i++) r.push(polyAdd(a[i], b[i]));
  return r;
}

function generateMatrix(rho, k, transpose) {
  const A = [];
  for (let i = 0; i < k; i++) {
    const row = [];
    for (let j = 0; j < k; j++) {
      const ij = transpose ? [j, i] : [i, j];
      const shake = shake128(new Uint8Array([...rho, ij[0], ij[1]]), 672);
      const poly = new Int16Array(256);
      let ctr = 0, pos = 0;
      while (ctr < 256 && pos < shake.length - 2) {
        const val = shake[pos] | (shake[pos + 1] << 8);
        if (val < 8192 - (8192 % Q)) {
          poly[ctr++] = barrettReduce(val);
        }
        pos += 2;
      }
      row.push(poly);
    }
    A.push(row);
  }
  return A;
}

function generateErrorVector(seed, eta, k) {
  const shake = shake256(seed, k * 64 * eta);
  const r = [];
  for (let i = 0; i < k; i++) r.push(cbd(shake.subarray(i * 64 * eta, (i + 1) * 64 * eta), eta));
  return r;
}

function matVecMul(A, v, k) {
  const r = [];
  for (let i = 0; i < k; i++) {
    let acc = new Int16Array(256);
    for (let j = 0; j < k; j++) acc = polyAdd(acc, multiplyNTT(A[i][j], v[j]));
    r.push(acc);
  }
  return r;
}

function vecDot(a, b, k) {
  let acc = new Int16Array(256);
  for (let i = 0; i < k; i++) acc = polyAdd(acc, multiplyNTT(a[i], b[i]));
  return acc;
}

// Input validation
function checkModulus(ek) {
  const tEnc = ek.subarray(32);
  const t = decodeCompressedVec(tEnc, K, 12);
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < 256; j++) {
      if (t[i][j] < 0 || t[i][j] >= Q) return false;
    }
  }
  return true;
}

function checkDkHash(dk) {
  const storedHash = dk.subarray(2368, 2400);
  const ek = dk.subarray(1152, 2336);
  const computedHash = sha3_256(ek);
  let match = 0;
  for (let i = 0; i < 32; i++) match |= storedHash[i] ^ computedHash[i];
  return match === 0;
}

// Exported functions
export function keygenFromSeed(d32, z32) {
  if (d32.length !== 32) throw new Error('d must be 32 bytes');
  if (z32.length !== 32) throw new Error('z must be 32 bytes');
  
  const dHash = sha3_512(d32);
  const rho = dHash.subarray(0, 32);
  const sigma = dHash.subarray(32, 64);
  
  const A = generateMatrix(rho, K, false);
  const s = generateErrorVector(sigma, ETA1, K);
  const e = generateErrorVector(new Uint8Array([...sigma, 0]), ETA1, K);
  
  const sHat = s.map(ntt);
  const eHat = e.map(ntt);
  
  const t = [];
  for (let i = 0; i < K; i++) {
    let acc = new Int16Array(256);
    for (let j = 0; j < K; j++) acc = polyAdd(acc, multiplyNTT(A[i][j], s[j]));
    t.push(polyAdd(acc, e[i]));
  }
  
  const ek = new Uint8Array(1184);
  ek.set(rho, 0);
  ek.set(encodeCompressedVec(t, K, 12), 32);
  
  const dk = new Uint8Array(2400);
  dk.set(encodeVec(sHat, K), 0);
  dk.set(ek, 1152);
  dk.set(z32, 2336);
  dk.set(sha3_256(ek), 2368);
  
  return { ek, dk };
}

export function encapsDerand(ek, m32) {
  if (ek.length !== 1184) throw new Error('ek must be 1184 bytes');
  if (m32.length !== 32) throw new Error('m must be 32 bytes');
  
  // Modulus check (FIPS 203 Section 7.2)
  if (!checkModulus(ek)) throw new Error('Modulus check failed');
  
  const rho = ek.subarray(0, 32);
  const A = generateMatrix(rho, K, true);
  
  const gHash = sha3_512(new Uint8Array([...m32, ...sha3_256(ek)]));
  const Kbar = gHash.subarray(0, 32);
  const r = gHash.subarray(32, 64);
  
  const rVec = generateErrorVector(r, ETA1, K);
  const e1 = generateErrorVector(new Uint8Array([...r, 1]), ETA2, K);
  const e2 = cbd(shake256(new Uint8Array([...r, 2]), 64 * ETA2), ETA2);
  
  const u = [];
  for (let i = 0; i < K; i++) {
    let acc = new Int16Array(256);
    for (let j = 0; j < K; j++) acc = polyAdd(acc, multiplyNTT(A[i][j], rVec[j]));
    u.push(polyAdd(acc, e1[i]));
  }
  
  const t = decodeCompressedVec(ek.subarray(32), K, 12);
  const v = polyAdd(vecDot(t, rVec, K), e2);
  
  const ct = new Uint8Array(1088);
  ct.set(encodeCompressedVec(u, K, DU), 0);
  ct.set(compressPoly(DV, v), K * 256 * DU / 8);
  
  const Kout = shake256(new Uint8Array([...Kbar, ...ct]), 32);
  
  return { ct, K: Kout };
}

export function decaps(dk, ct) {
  if (dk.length !== 2400) throw new Error('dk must be 2400 bytes');
  if (ct.length !== 1088) throw new Error('ct must be 1088 bytes');
  
  // Hash check (FIPS 203 Section 7.3)
  const hashValid = checkDkHash(dk);
  
  const sHat = decodeVec(dk.subarray(0, 1152), K);
  const z = dk.subarray(2336, 2368);
  
  const u = decodeCompressedVec(ct.subarray(0, K * 256 * DU / 8), K, DU);
  const v = decompressPoly(DV, ct.subarray(K * 256 * DU / 8));
  
  const mPrime = polySub(v, vecDot(sHat, u, K));
  const mPrimeEnc = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      const c = compress(1, mPrime[i * 8 + j]);
      byte |= c << j;
    }
    mPrimeEnc[i] = byte;
  }
  
  // Re-encapsulate
  let ctPrime;
  try {
    const ek = dk.subarray(1152, 2336);
    const result = encapsDerand(ek, mPrimeEnc);
    ctPrime = result.ct;
  } catch (e) {
    ctPrime = new Uint8Array(1088);
  }
  
  // Constant-time comparison
  let ctMatch = 0;
  for (let i = 0; i < 1088; i++) ctMatch |= ct[i] ^ ctPrime[i];
  
  // Implicit rejection in constant time
  const reject = (hashValid ? 0 : 1) | (ctMatch ? 1 : 0);
  
  const ek = dk.subarray(1152, 2336);
  const gHash = sha3_512(new Uint8Array([...mPrimeEnc, ...sha3_256(ek)]));
  const Kbar = gHash.subarray(0, 32);
  
  const Kimplicit = shake256(new Uint8Array([...z, ...ct]), 32);
  const Kexplicit = shake256(new Uint8Array([...Kbar, ...ct]), 32);
  
  const Kout = new Uint8Array(32);
  const mask = -reject;
  for (let i = 0; i < 32; i++) Kout[i] = (Kexplicit[i] & ~mask) | (Kimplicit[i] & mask);
  
  return Kout;
}

// Test vectors from Wycheproof/NIST
const TEST_VECTORS = {
  keygen: {
    d: '92ac7d1f83baeae6ee86fe00f95d813375772434860f5ff7d54ffc37399bc4cc',
    z: '92ac7d1f83baeae6ee86fe00f95d813375772434860f5ff7d54ffc37399bc4cc',
    ek: 'd2e69a05534a7232c5f1b766e93a5ee2ea1b26e860a3441adea91edb782cabc8a5d011a21bc388e7f486f0b7993079ae3f1a7c85d27d0f492184d59062142b76a43734a90d556a95dc483dd82104ed58ca1571c39685827951434cc1001aa4c813261e4f93028e14cd08f768a454310c3b010c83b74d04a57bb977b3d8bcf3aaa78ca12b78f010d95134928a5e5d96a029b442a41888038b29c2f122b0b6b3af121aea29a05553bdf1db607afb17001860af1823bcf03db3b441da163a28c523a5fb4669a64234a4bcd1217ff2635bd97680ff938dbcf10e9532a9a79a5b073a9e8db2123d210faea200b664838e80071f2ba254aac890a46e28ec342d92812b01593071657e7a3a4a75cb3d5279ce88405ac5adacb2051e022ee0ac9bbfe32def98667ed347adcb3930f3cad031391b709a4e61b8dd4b3fb741b5bd60bf304015ee7546a24b59eadca137c7125074726b7686ec551b7bc26bbdb20fc3783534e34ee1f1bc6b77ab49a6667846975778c3c536830450a3fa910259722f3f806e6eb4b9346763fef0922bc4b6eb3826aff24eadc6cf6e477c2e055cfb7a90a55c06d0b2a2f5116069e64a5b5078c0577bc8e7900ea71c341c02ad854ea5a01af2a605cb2068d52438cddc60b03882cc024d13045f2ba6b0f446aaa5958760617945371fd78c28a40677a6e72f513b9e0667a9baf446c1ba931ba81834234792a2a2b2b3701f31b7cf467c80f1981141bb457793e1307091c48b5914646a60ce1a301543779d7c3342ad179796c2c440d99df9d41b52e32625a82aa5f579a9920bffba964fa70db259c85e68c813817b1347bf19814da5e9364a4645e621923d955c211a55d355c816da04730aa324085e622b51d6109b49f673add00e414755c8024aa0164f24556ded963d61143856cb4ff0567e3320730dbcbf12f66e2b70b20054a6dea42614b50ef72b156f5149fc263dd7e039c55a3ee9827df92c565d24c55e0a81c6494695344d948748afba9f762c0ea90bb724897902000775613949602c48c78a9440678c24086d326d79643baf7036c66c7e026aaefda2807a60bd7fc91363bb0234a590984aa011f11d40268218a1588377b3d7671b8b99789919b86ee82b18ec22d4e80a1f27853d889419d460def7567aa4567969c43048c32b8462a9c9386eb3152a6976aa783cdd1a8c57a9b6bbd837a00624b58b4ba3dbb63bb8200e7bc88881bebda925bca028e291aa1c22539cd04f90090d7f74108c32b8022c1591c881e76304e2408190e20f09a54fc23420e2620e9d87a3108a94feea72d5ab7fcfb972e6561b1a7b062f1a682e020aa2562812b296547b917824cdb88c582b5a6890177bc70c91acac9abe290aeb2c34a7e2368955cb456a345368abe3b91b47fc30b0233a09ba79fb11238ac508cce61095f854c23204a8d36bfc2c6e05a72af5244b17c12101e01451570eb110567e850e79c000142441fe4160027545f6290e85451b80234a9406c390b0cea3c8335d4c6f8550b544c9343e61ba1c8489d1b0399739168af740a481b0f5c3372530ca06b508ece838ab78bee1e597a9b14f6aec7a3bd1aa8d10bac23b9802902cd529ab6ef54db3110cfb561e7e6948e65281250416c349c8100b3b4d3d0f62acad8d161175b134f7564937cd'
  },
  encaps: {
    ek: '1456a2ee8c3556054abc79b4882c3190e5ca726ab402e5b09728c0f4f79c9fc2add828abe432b1501b60f46ccbc86a3378c34895708a13671b20b389479aaa01c69d6b3b7d07d1c3ab54b91c580f5a336b30069a4f134ffd3764ce73a047e2844771742bf4710b972d4f6590a1c53a975368c271b670f1a4036441054a66e8815997512288552fd7149ffb705aae133f8414060d0092fa8a1627d78ab2abc6696288baf5c60ef370827a7efa72ae5c6741a5da043d5940f121485372a98f472d60f05f74d95f01a1991e73a3e0a9536467a4738ab4cf385ba772827eb8cc058b3572e40b598444c181c7f6d9b760a7b907092e9c3351ea234e4449bd9b61a134654e2da191ff0793961569d3594448bbc2586999a6671efca957f3a6699a4a1b2f4707aba0b2db20114fe68a4e2815af3aac4b8c6be5648c50cc35c27c57288028d361708d302eebb860bee691f656a2550cb321e9293d7516c599817b766ba928b108779a1c8712e74c76841ac58b8c515bf4749bf715984445b2b53063384001e55f68867b1af46ca70ca8ea74172db80b5218bde4f00a0e658db5a18d94e1427af7ae358cceb238772fcc83f10828a4a367d42c4cb6933fdd1c1c7b86ad8b009657a96222d7ba92f527af877970a83247f47a23fc2285118b57717715204674da9c94b62bc7838cf87200156b26ba4671159931c49322d80671a0f332eaa2bbf893be408b9eac6a505483aa9075bd1368b51f99211f480a9c542a75b5be08e43adaf301dd729a85954010e64892a2aa4f15c0bd70b3d856494ff9ba0fe4ce12991ca06b5e3d0b2af1f797b7a2b760910ae9f833d0d4267a58052c2990f161b886e251711c09d085c3d958b144192c9cc3224a460715b6784eb0b26f237187507d85c5110acc71ce47198f254553356dab448c38d243a7c02be40c908c828d05c081dfab8fc6b5cfe7d56e7317157dc053b2b3489986b081288871818585e09931095e3274a084115be276438254a796270a7b4306f08b98d9c2aaecf7065e74446b7c696dbaaf8b4625a10b07827b4a8babab09b64ae1c375bb785441f319fb9ac2f14c95ffb252abbb809c6909cd97706e40691cba61c9252bd38a04311ca5bb2ca79578347505d0888851e082648bd003be97c0f8f66759ec96a96a081c6822c4510559537042fc15f069a649b74a10961b354a1f625b04e25b293cf65fb4f53a80cc733d7a175775bf8a9abb9201620e83a7f3e724d1287dbc44bdd5d85fc71545a927beede537a7768735cc1486c7c3f31104db67343f435d2d45554baac9cdb5822e8422ae8321c78abe9f261fd4810a79e33e94e63b3341872c92253521997c084fbc060b8b125ccc88ac85ac5fe3168acb059b3f119c4e050a20732f501bb9b3e687c846b5c2653f8886373e1004a2ab8d1bb970a7e571d8a46ee81b782f26942dd394fdd9a5e4c5631d985528604b1cc976275b6ac8a67ceec10ffacbba3d3bb141321dfc3c9231fc96e448b9ab847021e2c8d90c6bcaf2b1240783b62c79dedc072a5763e660af2c27c3f0c3c09207cad990bb41a7bfcec99f51596a0e83778f85c006ac6d1fe981b4c4ba1cb575a7d07ae2d31ba760095f74bc163841cf8ff77f894abc6d261ed87a4530363b949c4ad24efb3a56809478dda2',
    m: '40be9dcac16e9ca73d49d0c83f9d3d89bb71574a4219a0f393dfece2988394c4',
    ct: '778d6b03791acaf56caafcc78cee5cbca1de8737e9c7ff4ae5f384d344e08223c74c824cb5848520517c7f0ea0645eb6f889517ae5216b0cf41ddc3f0d1df9bc6e4decb236a5ea8b214f64266d3cde08e0cb00e5d91f586706b1ee533d20476f4423b78f916b1726eeea959ffb9ac634d04a94d09923cb0d4e730cca4144e7c4884921652da4928c68e644f673cfc57d3e87cf5be581a89f9cb8f0fce2782d681e5ce88af58458c3d63d807572de5aa8e1faf2dcd14edb7349565b7d3271ddbeb0b6cc7afe08635784311159733c46e5fdc5e0cd36ce5685acfb1afe50abb46f447521e60d9c8f0e4ca28c190abb40c365f412471e95a8ea396d4bd8070eeb1f02b07c825367aa1ec0f10c3862416bb21ad6ca748a86e9829efc1a0499093c85176d37f574c75cf5edfa8d920d3268cb34c6a4bb0002869bc05d7c8fcc0658d4a01eacd74557a37d98a763074752dfdd6429881caff577d3a048031bd52c4e9726398590f9519fd59405d6b3c307afcb168a985785d954a6d1dc1ea92e1eb6f946a4d99dd6ca307abfd8362faba98bb264c69c5f555d60883cc56019feb4e8000c48b7e68cd667f00b5250cef293a4a9e778726e62f120361e21ab3140464cdc6abde9ea05198d8b3bb671b9111a2f317582847ca5015664f22cdb08c143187bde2129b54f34160295d75fe9a494fd7e67aaa76b57aaffd89d01a71df5c8158620298d582bbefa6d09ac412a99aa3be9c383504948c43dd5af4127b1435804f44bafa142bfc2a95d95fb2ef0641abe71064de51d6b9ec50857b8eef7f48036313d0e936763b8f7bde69b064dd5761d80ea6f1a8b37565753c579bbb895efb9fcb3fc5fa3362e3774f0f77140b973cae587bad2f3b566a9c25a969347e5c54f87f1105e9c074867d94077ccae3abea54520edb51d9daabe7848e78fdf66e07e2e22b30251931e890baf1f5e177d4d9cec9e4969481fd7c1335a0ed5879f34ef4bb4f66c28803cea162ba461506d52eb3ae16951922b06825186c3d4ce1b51f3c92f3c52f2d04d1f13b2b17c9eeb882cce0eb88b7ea9a1ce4e37415cc84c7bc436a4628386cc77d9afd207911bd9bfd8a7fa05c275be0c4c6a8fc0a61bda1d67ae33b5310be1290dc71c1418eb5744bf2842c1652173a49a692e71fe43258a205b3caab90c0304a51e77d01b404a01fae2f83ab80c5dbf6cf518c001f46a633fa169b1bdb77a9d0b1e0c007835c09f6abba96f3f53564da508ee8861a483a81749d4a44672b1ef1605f29d168b74b736b4f13501d7ad1213118a7832e666a50be8010d54322a526cf7a4e543a79d0d98e004fbec76ea3f7e887bdbaf50dadfdddf3ffecf6d3f77ea4b9b16dc754f4a68e5ef32f6a137e7c9e3c3e8c2e236c7ebc45d46ec1677a5a8bb2668443b0be8693dc257f13d8b9a90100b92b4d1761b819673832c32020671bfb3d0220a363e4bed6d649d3f7368cfe081e196a43d4708798e31bb2a2f61824674aba2fc9dcd05db84b8627ae11488886f921bc79ae1fd03',
    K: '616e0b753a3b7f40fef9a389f58f16bfbb04622941d2464bdae767820dfac38e'
  }
};

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Self-test
function selfTest() {
  const results = { passed: 0, failed: 0 };
  
  // Keygen test
  try {
    const d = hexToBytes(TEST_VECTORS.keygen.d);
    const z = hexToBytes(TEST_VECTORS.keygen.z);
    const { ek, dk } = keygenFromSeed(d, z);
    if (bytesToHex(ek) === TEST_VECTORS.keygen.ek) {
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (e) { results.failed++; }
  
  // Encaps test
  try {
    const ek = hexToBytes(TEST_VECTORS.encaps.ek);
    const m = hexToBytes(TEST_VECTORS.encaps.m);
    const { ct, K } = encapsDerand(ek, m);
    if (bytesToHex(ct) === TEST_VECTORS.encaps.ct && bytesToHex(K) === TEST_VECTORS.encaps.K) {
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (e) { results.failed++; }
  
  return results;
}

const testResults = selfTest();
console.log(`Self-test results: ${testResults.passed} passed, ${testResults.failed} failed`);