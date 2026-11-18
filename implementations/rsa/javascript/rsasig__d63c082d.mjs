// rsasig.mjs — RSA signature verification from scratch (RFC 8017).
// BigInt modular arithmetic, own SHA-256/384/512, EMSA-PKCS1-v1_5 and EMSA-PSS
// with MGF1. Strict: signature must be exactly modulus-length, s < n, and the
// recovered encoded message must match byte for byte. No BER/DER leniency.
//
// Purpose: verifying the RSA signature on RFC 3161 timestamp tokens.
//
// verifyPkcs1v15(nBytes, eBytes, msg, sig, hashName) -> boolean
// verifyPss(nBytes, eBytes, msg, sig, hashName, saltLen) -> boolean
// hashName in 'sha256' | 'sha384' | 'sha512'; saltLen defaults to the hash length.
//
// Public data only, so BigInt and data-dependent branches are fine here.

export class RsasigError extends Error {
  constructor(m) { super(m); this.name = 'RsasigError'; }
}

const M64 = (1n << 64n) - 1n;

const toU8 = (x) => {
  if (x instanceof Uint8Array) return x;
  if (Array.isArray(x)) return Uint8Array.from(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  throw new RsasigError('expected bytes');
};

const toHex = (b) => {
  let s = '';
  for (let i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
  return s;
};

const fromHex = (h) => {
  const o = new Uint8Array(h.length >> 1);
  for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16);
  return o;
};

const bytesToBigInt = (b) => {
  let v = 0n;
  for (let i = 0; i < b.length; i++) v = (v << 8n) | BigInt(b[i]);
  return v;
};

const bigIntToBytes = (v, len) => {
  const o = new Uint8Array(len);
  for (let i = len - 1; i >= 0; i--) { o[i] = Number(v & 0xffn); v >>= 8n; }
  return o;
};

const stripLeadingZeros = (b) => {
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  return b.subarray(i);
};

const bitLength = (v) => {
  if (v === 0n) return 0;
  return v.toString(2).length;
};

// ---------------------------------------------------------------- padding
function mdPad(msg, blockSize, littleEndian, lengthFieldBytes) {
  const len = msg.length;
  const total = Math.ceil((len + lengthFieldBytes + 1) / blockSize) * blockSize;
  const out = new Uint8Array(total);
  out.set(msg);
  out[len] = 0x80;
  const bits = BigInt(len) * 8n;
  const o = total - lengthFieldBytes;
  for (let i = 0; i < lengthFieldBytes; i++) {
    out[total - 1 - i] = Number((bits >> BigInt(8 * i)) & 0xffn);
  }
  if (littleEndian) {
    const rev = out.slice(o);
    for (let i = 0; i < lengthFieldBytes; i++) out[o + i] = rev[lengthFieldBytes - 1 - i];
  }
  return out;
}

const rotr = (x, n) => (x >>> n) | (x << (32 - n));
const rotl = (x, n) => (x << n) | (x >>> (32 - n));

// ------------------------------------------------------------------- SHA-256
const K256 = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256(msg) {
  msg = toU8(msg);
  const H = Uint32Array.from([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const p = mdPad(msg, 64, false, 8);
  const w = new Int32Array(64);
  for (let o = 0; o < p.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (p[o + i * 4] << 24) | (p[o + i * 4 + 1] << 16) | (p[o + i * 4 + 2] << 8) | p[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const a1 = w[i - 15], a2 = w[i - 2];
      const s0 = rotr(a1, 7) ^ rotr(a1, 18) ^ (a1 >>> 3);
      const s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = H[i] >>> 24; out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 8) & 0xff; out[i * 4 + 3] = H[i] & 0xff;
  }
  return out;
}

// ------------------------------------------------------------ SHA-512 core
const K512 = [
  0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
  0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
  0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
  0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
  0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
  0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
  0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
  0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
  0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
  0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
  0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
  0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
  0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
  0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
  0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
  0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
  0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
  0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
  0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
  0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
];

const rotr64 = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & M64;

function sha512Core(msg, iv, outLen) {
  msg = toU8(msg);
  const H = iv.slice();
  const p = mdPad(msg, 128, false, 16);
  const W = new Array(80);
  for (let o = 0; o < p.length; o += 128) {
    for (let i = 0; i < 16; i++) {
      let v = 0n;
      for (let j = 0; j < 8; j++) v = (v << 8n) | BigInt(p[o + i * 8 + j]);
      W[i] = v;
    }
    for (let i = 16; i < 80; i++) {
      const s0 = rotr64(W[i - 15], 1) ^ rotr64(W[i - 15], 8) ^ (W[i - 15] >> 7n);
      const s1 = rotr64(W[i - 2], 19) ^ rotr64(W[i - 2], 61) ^ (W[i - 2] >> 6n);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) & M64;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 80; i++) {
      const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
      const ch = (e & f) ^ (~e & M64 & g);
      const t1 = (h + S1 + ch + K512[i] + W[i]) & M64;
      const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) & M64;
      h = g; g = f; f = e; e = (d + t1) & M64; d = c; c = b; b = a; a = (t1 + t2) & M64;
    }
    H[0] = (H[0] + a) & M64; H[1] = (H[1] + b) & M64; H[2] = (H[2] + c) & M64; H[3] = (H[3] + d) & M64;
    H[4] = (H[4] + e) & M64; H[5] = (H[5] + f) & M64; H[6] = (H[6] + g) & M64; H[7] = (H[7] + h) & M64;
  }
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = Number((H[i >> 3] >> BigInt(8 * (7 - (i & 7)))) & 0xffn);
  return out;
}

const IV384 = [
  0xcbbb9d5dc1059ed8n, 0x629a292a367cd507n, 0x9159015a3070dd17n, 0x152fecd8f70e5939n,
  0x67332667ffc00b31n, 0x8eb44a8768581511n, 0xdb0c2e0d64f98fa7n, 0x47b5481dbefa4fa4n,
];
const IV512 = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

export function sha384(msg) { return sha512Core(msg, IV384, 48); }
export function sha512(msg) { return sha512Core(msg, IV512, 64); }

export const hashes = { sha256, sha384, sha512 };

const HASH_LEN = { sha256: 32, sha384: 48, sha512: 64 };

// DigestInfo DER prefixes from RFC 8017 section 9.2, note 1.
const DIGEST_INFO = {
  sha256: fromHex('3031300d060960864801650304020105000420'),
  sha384: fromHex('3041300d060960864801650304020205000430'),
  sha512: fromHex('3051300d060960864801650304020305000440'),
};

// ------------------------------------------------------------- modular exp
function modPow(base, exp, mod) {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

function prepare(nBytes, eBytes, sig) {
  const n = bytesToBigInt(stripLeadingZeros(toU8(nBytes)));
  const e = bytesToBigInt(stripLeadingZeros(toU8(eBytes)));
  if (n <= 0n || e <= 0n) return null;
  const k = Math.ceil(bitLength(n) / 8);
  if (k === 0) return null;
  const s = toU8(sig);
  if (s.length !== k) return null;
  const sv = bytesToBigInt(s);
  if (sv >= n) return null;
  return { n, e, k, s: sv };
}

// --------------------------------------------------------------- PKCS#1 v1.5
export function verifyPkcs1v15(nBytes, eBytes, msg, sig, hashName) {
  try {
    const hLen = HASH_LEN[hashName];
    const prefix = DIGEST_INFO[hashName];
    if (!hLen || !prefix) throw new RsasigError(`unsupported hash ${hashName}`);
    const p = prepare(nBytes, eBytes, sig);
    if (!p) return false;
    const tLen = prefix.length + hLen;
    if (p.k < tLen + 11) return false;

    const em = bigIntToBytes(modPow(p.s, p.e, p.n), p.k);
    if (em[0] !== 0x00 || em[1] !== 0x01) return false;

    let i = 2;
    while (i < em.length && em[i] === 0xff) i++;
    if (i - 2 < 8) return false;
    if (i >= em.length || em[i] !== 0x00) return false;
    if (i + 1 !== p.k - tLen) return false;

    const t = new Uint8Array(tLen);
    t.set(prefix, 0);
    t.set(hashes[hashName](toU8(msg)), prefix.length);
    for (let j = 0; j < tLen; j++) if (em[p.k - tLen + j] !== t[j]) return false;
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------- PSS
function mgf1(hashName, seed, maskLen) {
  const hLen = HASH_LEN[hashName];
  const out = new Uint8Array(maskLen);
  const counter = new Uint8Array(4);
  let written = 0;
  for (let c = 0; written < maskLen; c++) {
    counter[0] = (c >>> 24) & 0xff; counter[1] = (c >>> 16) & 0xff;
    counter[2] = (c >>> 8) & 0xff; counter[3] = c & 0xff;
    const buf = new Uint8Array(seed.length + 4);
    buf.set(seed, 0);
    buf.set(counter, seed.length);
    const d = hashes[hashName](buf);
    const take = Math.min(hLen, maskLen - written);
    out.set(d.subarray(0, take), written);
    written += take;
  }
  return out;
}

export function verifyPss(nBytes, eBytes, msg, sig, hashName, saltLen) {
  try {
    const hLen = HASH_LEN[hashName];
    if (!hLen) throw new RsasigError(`unsupported hash ${hashName}`);
    const sLen = saltLen === undefined ? hLen : saltLen;
    if (!Number.isInteger(sLen) || sLen < 0) return false;
    const p = prepare(nBytes, eBytes, sig);
    if (!p) return false;

    const modBits = bitLength(p.n);
    const emBits = modBits - 1;
    const emLen = Math.ceil(emBits / 8);
    if (emLen < hLen + sLen + 2) return false;

    const full = bigIntToBytes(modPow(p.s, p.e, p.n), p.k);
    for (let i = 0; i < p.k - emLen; i++) if (full[i] !== 0x00) return false;
    const em = full.subarray(p.k - emLen);

    if (em[emLen - 1] !== 0xbc) return false;

    const dbLen = emLen - hLen - 1;
    const maskedDB = em.subarray(0, dbLen);
    const h = em.subarray(dbLen, dbLen + hLen);

    const dbMask = mgf1(hashName, h, dbLen);
    const db = new Uint8Array(dbLen);
    for (let i = 0; i < dbLen; i++) db[i] = maskedDB[i] ^ dbMask[i];

    const unused = 8 * emLen - emBits;
    if (unused > 0) db[0] &= 0xff >>> unused;

    const psLen = dbLen - sLen - 1;
    if (psLen < 0) return false;
    for (let i = 0; i < psLen; i++) if (db[i] !== 0x00) return false;
    if (db[psLen] !== 0x01) return false;

    const salt = db.subarray(dbLen - sLen);
    const mHash = hashes[hashName](toU8(msg));
    const mPrime = new Uint8Array(8 + hLen + sLen);
    mPrime.set(mHash, 8);
    mPrime.set(salt, 8 + hLen);
    const hPrime = hashes[hashName](mPrime);

    let diff = 0;
    for (let i = 0; i < hLen; i++) diff |= hPrime[i] ^ h[i];
    return diff === 0;
  } catch { return false; }
}

// ------------------------------------------------------------------ self test
export function selfTest() {
  const cases = [];
  const utf8Encode = (s) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
  const H = (name, inp, want) => {
    const got = toHex(hashes[name](utf8Encode(inp)));
    cases.push({ name: `${name}(${inp.length}B)`, ok: got === want, got, want });
  };

  H('sha256', '', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  H('sha256', 'abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  H('sha256', 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  H('sha384', '', '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b');
  H('sha384', 'abc', 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7');
  H('sha512', '', 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
  H('sha512', 'abc', 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
  H('sha512', 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', '8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909');

  cases.push({ name: 'sha256 DigestInfo prefix', ok: toHex(DIGEST_INFO.sha256) === '3031300d060960864801650304020105000420' });
  cases.push({ name: 'sha384 DigestInfo prefix', ok: toHex(DIGEST_INFO.sha384) === '3041300d060960864801650304020205000430' });
  cases.push({ name: 'sha512 DigestInfo prefix', ok: toHex(DIGEST_INFO.sha512) === '3051300d060960864801650304020305000440' });

  cases.push({ name: 'modPow 4^13 mod 497', ok: modPow(4n, 13n, 497n) === 445n });

  const seed = fromHex('8ecc9e7e3c1d6f2a');
  cases.push({ name: 'mgf1 length', ok: mgf1('sha256', seed, 40).length === 40 });

  const n2048 = fromHex('00' + 'c8'.repeat(256));
  const e65537 = fromHex('010001');
  cases.push({ name: 'short signature rejected', ok: verifyPkcs1v15(n2048, e65537, fromHex('00'), fromHex('11'.repeat(255)), 'sha256') === false });
  cases.push({ name: 'oversize signature rejected', ok: verifyPkcs1v15(n2048, e65537, fromHex('00'), fromHex('11'.repeat(257)), 'sha256') === false });
  cases.push({ name: 'unknown hash rejected', ok: verifyPkcs1v15(n2048, e65537, fromHex('00'), fromHex('11'.repeat(256)), 'sha1') === false });
  cases.push({ name: 'PSS rejects non-0xbc', ok: verifyPss(n2048, e65537, fromHex('00'), fromHex('11'.repeat(256)), 'sha256', 32) === false });

  const pass = cases.filter((c) => c.ok).length;
  return { pass, fail: cases.length - pass, total: cases.length, cases };
}

// ----------------------------------------------------------------------- CLI
async function isEntryPoint() {
  if (typeof process === 'undefined' || !process.argv || typeof process.argv[1] !== 'string') return false;
  if (typeof import.meta.url !== 'string' || !import.meta.url.startsWith('file:')) return false;
  const { pathToFileURL } = await import('node:url');
  const self = import.meta.url;
  if (self === pathToFileURL(process.argv[1]).href) return true;
  try {
    const { realpathSync } = await import('node:fs');
    return self === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch { return false; }
}

if (await isEntryPoint()) {
  const { readFileSync } = await import('node:fs');
  const args = process.argv.slice(2);
  const mode = args[0];
  const print = (s) => process.stdout.write(s + '\n');
  process.exitCode = 0;
  try {
    if (mode === '--selftest') {
      const r = selfTest();
      for (const c of r.cases) print(`${c.ok ? 'pass' : 'FAIL'}  ${c.name}${c.ok ? '' : `  got=${c.got} want=${c.want}`}`);
      print(`\n${r.pass}/${r.total} passed, ${r.fail} failed`);
      process.exitCode = r.fail === 0 ? 0 : 1;
    } else if (mode === '--selfdigest') {
      const src = readFileSync(new URL(import.meta.url));
      print(`sha256=${toHex(sha256(src))} bytes=${src.length}`);
    } else if (mode === '--verify') {
      const n = readFileSync(args[1]);
      const msg = readFileSync(args[3]);
      const sig = readFileSync(args[4]);
      const hashName = args[2] ?? 'sha256';
      const ok = args[5] === 'pss'
        ? verifyPss(n, fromHex('010001'), msg, sig, hashName, Number(args[6]))
        : verifyPkcs1v15(n, fromHex('010001'), msg, sig, hashName);
      print(ok ? 'valid' : 'invalid');
      process.exitCode = ok ? 0 : 1;
    } else {
      print('usage: rsasig.mjs --selftest | --selfdigest | --verify MOD MSG SIG [hash]');
      process.exitCode = 2;
    }
  } catch (e) {
    print(`${e.name}: ${e.message}`);
    process.exitCode = 2;
  }
}

export default { verifyPkcs1v15, verifyPss, sha256, sha384, sha512, hashes, selfTest };