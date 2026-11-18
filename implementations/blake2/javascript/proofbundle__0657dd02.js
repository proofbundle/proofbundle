#!/usr/bin/env node
/**
 * ProofBundle v1.0.0 - Node.js Core Module
 * Adapted from the self-contained HTML verifier.
 *
 * Usage:
 *   const PB = require('./proofbundle');
 *   const bundle = await PB.seal({claim: 'test'}, {env: 'demo'});
 *   const result = await PB.verify(bundle, {env: 'demo'});
 */

'use strict';

const crypto = require('crypto');

// Use Node's native crypto for SHA where possible, webcrypto for signatures
const webcrypto = crypto.webcrypto;
const subtle = webcrypto?.subtle;

/* ================================================================
   UTILITIES
   ================================================================ */

function b64uEncode(bytes) {
  if (typeof bytes === 'string') bytes = utf8Encode(bytes);
  return Buffer.from(bytes).toString('base64url');
}

function b64uDecode(str) {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}

function utf8Encode(s) {
  return new TextEncoder().encode(s);
}

function utf8Decode(b) {
  return new TextDecoder().decode(b);
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function concatBytes(...arrs) {
  let total = 0;
  for (const a of arrs) total += a.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

function bufferToUint8Array(buf) {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/* ================================================================
   PB-CANON-JSON-1 CANONICALIZATION
   ================================================================ */

function canonicalJSON(value) {
  const t = typeof value;
  if (value === null) return 'null';
  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') {
    if (!Number.isFinite(value)) throw new Error('NaN/Infinity rejected');
    return Number.isInteger(value) ? value.toString() : value.toString();
  }
  if (t === 'string') return JSON.stringify(value.normalize('NFC'));
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJSON).join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const seen = new Set();
    const parts = [];
    for (const k of keys) {
      if (seen.has(k)) throw new Error('Duplicate key: ' + k);
      seen.add(k);
      parts.push(JSON.stringify(k) + ':' + canonicalJSON(value[k]));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error('Unsupported type: ' + t);
}

function canonicalBytes(obj) {
  return utf8Encode(canonicalJSON(obj));
}

/* ================================================================
   BLAKE2b (pure JS, extracted from v1.0.0)
   ================================================================ */

const BLAKE2B_IV = new Uint32Array([
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85,
  0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
  0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
  0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
]);

const BLAKE2B_SIGMA = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  [14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],
  [11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],
  [7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],
  [9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],
  [2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],
  [12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],
  [13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10],
  [6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5],
  [10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0],
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  [14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3]
];

function blake2bAdd64(v, idx, x0, x1) {
  const lo = (v[idx] >>> 0) + (x0 >>> 0);
  v[idx] = lo >>> 0;
  v[idx + 1] = (v[idx + 1] + x1 + (lo > 0xffffffff ? 1 : 0)) >>> 0;
}

function blake2bMix(v, m, i) {
  const s = BLAKE2B_SIGMA[i % 12];
  function G(a, b, c, d, ix, iy) {
    blake2bAdd64(v, a, v[b], v[b + 1]);
    const x0 = v[a] ^ v[c], x1 = v[a + 1] ^ v[c + 1];
    v[a] = x1; v[a + 1] = x0;
    blake2bAdd64(v, c, v[d], v[d + 1]);
    const y0 = v[b] ^ v[c], y1 = v[b + 1] ^ v[c + 1];
    v[b] = (y0 >>> 1) | (y1 << 31); v[b + 1] = (y1 >>> 1) | (y0 << 31);
    blake2bAdd64(v, a, v[b], v[b + 1]);
    v[a] = v[a] ^ v[d]; v[a + 1] = v[a + 1] ^ v[d + 1];
    blake2bAdd64(v, c, v[a], v[a + 1]);
    const z0 = v[b] ^ v[c], z1 = v[b + 1] ^ v[c + 1];
    v[b] = (z0 >>> 24) | (z1 << 8); v[b + 1] = (z1 >>> 24) | (z0 << 8);
  }
  G(0, 8, 16, 24, s[0], s[1]);
  G(2, 10, 18, 26, s[2], s[3]);
  G(4, 12, 20, 28, s[4], s[5]);
  G(6, 14, 22, 30, s[6], s[7]);
  G(0, 10, 20, 30, s[8], s[9]);
  G(2, 12, 22, 24, s[10], s[11]);
  G(4, 14, 16, 26, s[12], s[13]);
  G(6, 8, 18, 28, s[14], s[15]);
}

function blake2bCompress(h, m, t0, t1, f, rounds) {
  const v = new Uint32Array(32);
  for (let i = 0; i < 16; i++) v[i] = h[i];
  for (let i = 0; i < 16; i++) v[i + 16] = BLAKE2B_IV[i];
  v[24] ^= t0; v[25] ^= t1;
  if (f) v[28] ^= 0xffffffff;
  if (f) v[29] ^= 0xffffffff;
  const msg = new Uint32Array(32);
  for (let i = 0; i < 16; i++) {
    msg[i * 2] = m[i * 4] | (m[i * 4 + 1] << 8) | (m[i * 4 + 2] << 16) | (m[i * 4 + 3] << 24);
    msg[i * 2 + 1] = m[i * 4 + 4] | (m[i * 4 + 5] << 8) | (m[i * 4 + 6] << 16) | (m[i * 4 + 7] << 24);
  }
  for (let i = 0; i < rounds; i++) blake2bMix(v, msg, i);
  for (let i = 0; i < 16; i++) h[i] ^= v[i] ^ v[i + 16];
}

function blake2b(data, outLen = 64, key = new Uint8Array(0)) {
  if (outLen < 1 || outLen > 64) throw new Error('Invalid output length');
  const h = new Uint32Array(16);
  for (let i = 0; i < 16; i++) h[i] = BLAKE2B_IV[i];
  h[0] ^= 0x01010000 ^ (key.length << 8) ^ outLen;
  const block = new Uint8Array(128);
  if (key.length > 0) {
    block.set(key);
    blake2bCompress(h, block, 0, 0, false, 12);
  }
  let off = 0;
  while (off < data.length) {
    const chunk = data.slice(off, off + 128);
    block.fill(0);
    block.set(chunk);
    off += chunk.length;
    const f = off >= data.length;
    const t0 = off >>> 0;
    const t1 = (off / 0x100000000) >>> 0;
    blake2bCompress(h, block, t0, t1, f, 12);
  }
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = h[i >> 2] >>> ((i & 3) * 8);
  return out;
}

/* ================================================================
   BLAKE3 (pure JS, simplified single-chunk)
   ================================================================ */

const BLAKE3_IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);

const BLAKE3_SIGMA = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  [14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3],
  [11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4],
  [7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8],
  [9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13],
  [2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9],
  [12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11],
  [13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10]
];

function blake3G(v, a, b, c, d, mx, my) {
  v[a] = (v[a] + v[b] + mx) >>> 0;
  v[d] = ((v[d] ^ v[a]) >>> 16) | ((v[d] ^ v[a]) << 16);
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = ((v[b] ^ v[c]) >>> 12) | ((v[b] ^ v[c]) << 20);
  v[a] = (v[a] + v[b] + my) >>> 0;
  v[d] = ((v[d] ^ v[a]) >>> 8) | ((v[d] ^ v[a]) << 24);
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = ((v[b] ^ v[c]) >>> 7) | ((v[b] ^ v[c]) << 25);
}

function blake3Round(st, m, round) {
  const s = BLAKE3_SIGMA[round % 8];
  blake3G(st, 0, 4, 8, 12, m[s[0]], m[s[1]]);
  blake3G(st, 1, 5, 9, 13, m[s[2]], m[s[3]]);
  blake3G(st, 2, 6, 10, 14, m[s[4]], m[s[5]]);
  blake3G(st, 3, 7, 11, 15, m[s[6]], m[s[7]]);
  blake3G(st, 0, 5, 10, 15, m[s[8]], m[s[9]]);
  blake3G(st, 1, 6, 11, 12, m[s[10]], m[s[11]]);
  blake3G(st, 2, 7, 8, 13, m[s[12]], m[s[13]]);
  blake3G(st, 3, 4, 9, 14, m[s[14]], m[s[15]]);
}

function blake3Compress(chainingValue, blockWords, counter, blockLen, flags) {
  const state = new Uint32Array(16);
  for (let i = 0; i < 8; i++) state[i] = chainingValue[i];
  for (let i = 0; i < 8; i++) state[i + 8] = BLAKE3_IV[i];
  state[12] = counter >>> 0;
  state[13] = (counter / 0x100000000) >>> 0;
  state[14] = blockLen;
  state[15] = flags;
  for (let i = 0; i < 7; i++) blake3Round(state, blockWords, i);
  for (let i = 0; i < 8; i++) state[i] ^= state[i + 8];
  return state;
}

function blake3(data, outLen = 32) {
  // Ensure we have a proper Uint8Array with aligned buffer
  if (!(data instanceof Uint8Array)) {
    data = new Uint8Array(data);
  }
  const aligned = new Uint8Array(data.length);
  aligned.set(data);
  data = aligned;

  function readWords(src) {
    const words = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) {
        const idx = i * 4 + k;
        if (idx < src.length) w |= src[idx] << (k * 8);
      }
      words[i] = w >>> 0;
    }
    return words;
  }

  if (data.length <= 64) {
    const blockWords = readWords(data);
    const out = blake3Compress(BLAKE3_IV, blockWords, 0, data.length, 0x0000000b);
    const result = new Uint8Array(outLen);
    const outDv = new DataView(out.buffer);
    for (let i = 0; i < Math.min(outLen, 32); i++) result[i] = outDv.getUint8(i);
    return result;
  }
  // For larger data, fall back to iterative chunked processing (simplified)
  const chunks = Math.ceil(data.length / 64);
  let cv = BLAKE3_IV.slice();
  for (let i = 0; i < chunks; i++) {
    const chunk = data.slice(i * 64, Math.min((i + 1) * 64, data.length));
    const blockWords = readWords(chunk);
    const isLast = (i === chunks - 1);
    const flags = isLast ? 0x0000000b : 0x00000001;
    cv = blake3Compress(cv, blockWords, i, chunk.length, flags).slice(0, 8);
  }
  const out = blake3Compress(cv, new Uint32Array(16), 0, 0, 0x0000000f);
  const result = new Uint8Array(outLen);
  const outDv = new DataView(out.buffer);
  for (let i = 0; i < Math.min(outLen, 32); i++) result[i] = outDv.getUint8(i);
  return result;
}

/* ================================================================
   DIGESTS
   ================================================================ */

async function digest(alg, data) {
  // Ensure data is Uint8Array
  if (data instanceof Buffer) data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  switch (alg) {
    case 'SHA-256':
      return new Uint8Array(crypto.createHash('sha256').update(data).digest());
    case 'SHA-384':
      return new Uint8Array(crypto.createHash('sha384').update(data).digest());
    case 'SHA-512':
      return new Uint8Array(crypto.createHash('sha512').update(data).digest());
    case 'BLAKE3':
      return blake3(data, 32);
    case 'BLAKE2b':
      return blake2b(data, 64);
    default:
      throw new Error('Unknown digest: ' + alg);
  }
}

/* ================================================================
   KEY GENERATION & SIGNATURES
   ================================================================ */

const SIG_ALG_MAP = {
  'Ed25519': { name: 'Ed25519' },
  'ECDSA-P256': { name: 'ECDSA', namedCurve: 'P-256' },
  'ECDSA-P384': { name: 'ECDSA', namedCurve: 'P-384' },
  'ECDSA-P521': { name: 'ECDSA', namedCurve: 'P-521' },
  'RSA-PSS-2048': { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  'RSA-PSS-3072': { name: 'RSA-PSS', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  'RSA-PSS-4096': { name: 'RSA-PSS', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
};

function getSignVerifyParams(sigAlg) {
  const base = SIG_ALG_MAP[sigAlg];
  if (!base) throw new Error('Unknown sig alg: ' + sigAlg);
  if (base.name === 'ECDSA') {
    return { name: 'ECDSA', hash: base.hash || 'SHA-256' };
  }
  if (base.name === 'RSA-PSS') {
    return { name: 'RSA-PSS', saltLength: 32 };
  }
  return { name: base.name };
}

async function generateKeyPair(sigAlg) {
  const params = SIG_ALG_MAP[sigAlg];
  if (!params) throw new Error('Unknown sig alg: ' + sigAlg);
  const extractable = true;
  const usages = ['sign', 'verify'];
  const kp = await subtle.generateKey(params, extractable, usages);
  return kp;
}

async function exportPublicKey(key) {
  const spki = await subtle.exportKey('spki', key);
  return b64uEncode(new Uint8Array(spki));
}

async function importPublicKey(sigAlg, b64u) {
  const params = SIG_ALG_MAP[sigAlg];
  const bytes = b64uDecode(b64u);
  return await subtle.importKey('spki', bytes, params, false, ['verify']);
}

async function importPrivateKey(sigAlg, b64u) {
  const params = SIG_ALG_MAP[sigAlg];
  const bytes = b64uDecode(b64u);
  return await subtle.importKey('pkcs8', bytes, params, true, ['sign']);
}

async function exportPrivateKey(key) {
  const pkcs8 = await subtle.exportKey('pkcs8', key);
  return b64uEncode(new Uint8Array(pkcs8));
}

async function sign(sigAlg, privateKey, data) {
  const params = getSignVerifyParams(sigAlg);
  const sig = await subtle.sign(params, privateKey, data);
  return new Uint8Array(sig);
}

async function verify(sigAlg, publicKey, data, signature) {
  const params = getSignVerifyParams(sigAlg);
  return await subtle.verify(params, publicKey, signature, data);
}

/* ================================================================
   BOUNDARY PREDICATES
   ================================================================ */

function evaluateBoundary(boundary, context) {
  if (!boundary) return true;
  if (typeof boundary !== 'object') return false;

  if (boundary.all) {
    for (const c of boundary.all) if (!evaluateBoundary(c, context)) return false;
    return true;
  }
  if (boundary.any) {
    for (const c of boundary.any) if (evaluateBoundary(c, context)) return true;
    return false;
  }
  if (boundary.not) {
    return !evaluateBoundary(boundary.not, context);
  }

  // Parse predicate format
  // Supports: { equals: ['field', 'value'] } or { equals: 'field', value: 'val' } or { present: 'field' }
  const keys = Object.keys(boundary);
  const op = keys.find(k => k !== 'field' && k !== 'value' && k !== 'values');
  if (!op || keys.length === 0) return true;
  
  let field, value, values;
  
  const opVal = boundary[op];
  if (Array.isArray(opVal) && opVal.length === 2) {
    // Array format: { equals: ['field', 'value'] }
    field = opVal[0];
    value = opVal[1];
  } else if (typeof opVal === 'string' && op !== 'in' && op !== 'within' && op !== 'range') {
    // String shorthand: { present: 'field', expired: 'field', not_expired: 'field', age_lt: 'field', age_gt: 'field', equals: 'field', before: 'field', after: 'field' }
    field = opVal;
    value = boundary.value;
    values = boundary.values;
  } else {
    // Explicit format: { equals: 'field', value: 'val' } or { in: 'field', values: [...] }
    field = boundary.field;
    value = boundary.value;
    values = boundary.values;
  }
  
  const ctx = field ? context[field] : context;

  switch (op) {
    case 'equals': return ctx === value;
    case 'in': return Array.isArray(values) && values.includes(ctx);
    case 'range': return ctx >= (value?.min ?? -Infinity) && ctx <= (value?.max ?? Infinity);
    case 'present': return ctx !== undefined && ctx !== null && ctx !== '';
    case 'before': return new Date(ctx) <= new Date(value);
    case 'after': return new Date(ctx) >= new Date(value);
    case 'within': return Array.isArray(values) && values.includes(ctx);
    case 'expired': return new Date(ctx) < new Date();
    case 'not_expired': return new Date(ctx) >= new Date();
    case 'age_lt': return (Date.now() - new Date(ctx).getTime()) / 1000 < value;
    case 'age_gt': return (Date.now() - new Date(ctx).getTime()) / 1000 > value;
    default: return false;
  }
}

/* ================================================================
   BUNDLE STRUCTURE
   ================================================================ */

const SPEC_ID = 'PB-CANON-JSON-1';
const SPEC_VER = '1.0.0';
const PROFILES = ['PB-INTEGRITY-1', 'PB-BOUNDARY-1', 'PB-LINEAGE-1', 'PB-REGULATED-1'];

function makeBundleId() {
  const b = crypto.randomBytes(16);
  return b64uEncode(b);
}

function makeTimestamp() {
  return new Date().toISOString();
}

/* ================================================================
   SEAL
   ================================================================ */

async function seal(payload, boundary, opts = {}) {
  const digestAlg = opts.digestAlg || 'SHA-256';
  const sigAlg = opts.sigAlg || 'Ed25519';
  const profile = opts.profile || 'PB-INTEGRITY-1';
  const proofKind = opts.proofKind || 'signature';
  const producerId = opts.producerId || 'proofbundle-node';
  const expiration = opts.expiration || null;
  const keyPair = opts.keyPair || await generateKeyPair(sigAlg);
  const refs = opts.refs || [];
  const sideAttestations = opts.sideAttestations || [];

  const payloadBytes = typeof payload === 'string' ? utf8Encode(payload) : utf8Encode(JSON.stringify(payload));
  const payloadB64u = b64uEncode(payloadBytes);

  const meta = {
    digest_alg: digestAlg,
    sig_alg: sigAlg,
    proof_kind: proofKind,
    producer_id: producerId,
    created_at: makeTimestamp(),
    ...(boundary && { boundary }),
    ...(expiration && { expiration }),
    ...(sideAttestations.length && { side_attestations: sideAttestations })
  };

  const hdr = {
    spec_id: SPEC_ID,
    spec_ver: SPEC_VER,
    profile,
    bundle_id: makeBundleId()
  };

  const bundlePre = { hdr, payload: payloadB64u, meta, refs };
  const canon = canonicalBytes(bundlePre);
  const dgst = await digest(digestAlg, canon);
  const signature = await sign(sigAlg, keyPair.privateKey, dgst);

  const seal = {
    digest: b64uEncode(dgst),
    signature: b64uEncode(signature)
  };

  const bundle = { ...bundlePre, seal };

  return {
    bundle,
    publicKey: await exportPublicKey(keyPair.publicKey),
    privateKey: await exportPrivateKey(keyPair.privateKey),
    keyPair
  };
}

/* ================================================================
   VERIFY
   ================================================================ */

async function verifyBundle(bundle, context, opts = {}) {
  const trace = [];
  function add(step, ok, detail) {
    trace.push({ step, ok, detail });
  }

  try {
    if (!bundle || typeof bundle !== 'object') {
      add('parse', false, 'Not an object');
      return { outcome: 'malformed', trace };
    }

    const { hdr, payload, meta, refs, seal } = bundle;
    if (!hdr || !payload || !meta || !seal) {
      add('parse', false, 'Missing required field');
      return { outcome: 'malformed', trace };
    }

    add('parse', true, 'Structure valid');

    if (hdr.spec_id !== SPEC_ID) {
      add('spec', false, `Expected ${SPEC_ID}, got ${hdr.spec_id}`);
      return { outcome: 'unknown-version', trace };
    }
    add('spec', true, hdr.spec_id);

    if (!PROFILES.includes(hdr.profile)) {
      add('profile', false, hdr.profile);
      return { outcome: 'malformed', trace };
    }
    add('profile', true, hdr.profile);

    const digestAlg = meta.digest_alg;
    const sigAlg = meta.sig_alg;
    if (!digestAlg || !sigAlg) {
      add('meta', false, 'Missing digest_alg or sig_alg');
      return { outcome: 'malformed', trace };
    }
    add('meta', true, `${digestAlg} / ${sigAlg}`);

    if (meta.expiration && new Date(meta.expiration) < new Date()) {
      add('expiration', false, meta.expiration);
      return { outcome: 'out-of-bounds', trace };
    }
    add('expiration', true, meta.expiration || 'none');

    if (hdr.profile === 'PB-BOUNDARY-1' || hdr.profile === 'PB-LINEAGE-1' || hdr.profile === 'PB-REGULATED-1') {
      if (meta.boundary) {
        const boundOk = evaluateBoundary(meta.boundary, context || {});
        add('boundary', boundOk, JSON.stringify(meta.boundary));
        if (!boundOk) return { outcome: 'out-of-bounds', trace };
      }
    }

    const pubkey = opts.publicKey;
    if (!pubkey) {
      add('key', false, 'No public key provided');
      return { outcome: 'missing-side-info', trace };
    }
    add('key', true, 'Present');

    const publicKey = await importPublicKey(sigAlg, pubkey);
    add('key-import', true, sigAlg);

    const bundlePre = { hdr, payload, meta, refs };
    const canon = canonicalBytes(bundlePre);
    const dgst = await digest(digestAlg, canon);
    const sigBytes = b64uDecode(seal.signature);
    const digBytes = b64uDecode(seal.digest);

    if (!bytesEqual(digBytes, dgst)) {
      add('digest', false, 'Digest mismatch');
      return { outcome: 'malformed', trace };
    }
    add('digest', true, digestAlg);

    const sigOk = await verify(sigAlg, publicKey, dgst, sigBytes);
    add('signature', sigOk, sigAlg);
    if (!sigOk) return { outcome: 'invalid-signature', trace };

    if (hdr.profile === 'PB-LINEAGE-1' || hdr.profile === 'PB-REGULATED-1') {
      const parentResult = await verifyLineage(bundle, opts.parents || [], trace);
      if (!parentResult.ok) return { outcome: parentResult.outcome, trace };
    }

    return { outcome: 'verified', trace };

  } catch (e) {
    add('error', false, e.message);
    return { outcome: 'indeterminate', trace };
  }
}

/* ================================================================
   LINEAGE
   ================================================================ */

async function verifyLineage(bundle, parents, trace) {
  if (!bundle.meta?.parent_id) {
    trace.push({ step: 'lineage', ok: true, detail: 'No parent declared' });
    return { ok: true };
  }

  const maxDepth = 100;
  let depth = 0;
  let current = bundle;

  while (current.meta?.parent_id) {
    depth++;
    if (depth > maxDepth) {
      trace.push({ step: 'lineage-depth', ok: false, detail: 'Exceeded max depth' });
      return { ok: false, outcome: 'lineage-invalid' };
    }

    const parent = parents.find(p => p.hdr?.bundle_id === current.meta.parent_id);
    if (!parent) {
      trace.push({ step: 'lineage-resolve', ok: false, detail: `Parent ${current.meta.parent_id} not found` });
      return { ok: false, outcome: 'lineage-invalid' };
    }

    const parentCanon = canonicalBytes({ hdr: parent.hdr, payload: parent.payload, meta: parent.meta, refs: parent.refs || [] });
    const parentDigest = await digest(current.meta.digest_alg || 'SHA-256', parentCanon);
    const parentDigestB64u = b64uEncode(parentDigest);

    if (current.meta.parent_digest && current.meta.parent_digest !== parentDigestB64u) {
      trace.push({ step: 'lineage-digest', ok: false, detail: 'Parent digest mismatch' });
      return { ok: false, outcome: 'lineage-invalid' };
    }

    current = parent;
  }

  trace.push({ step: 'lineage', ok: true, detail: `${depth} ancestors` });
  return { ok: true };
}

/* ================================================================
   INSPECT
   ================================================================ */

function inspect(bundle) {
  try {
    if (!bundle || typeof bundle !== 'object') return { error: 'Not an object' };
    return {
      spec_id: bundle.hdr?.spec_id,
      spec_ver: bundle.hdr?.spec_ver,
      profile: bundle.hdr?.profile,
      bundle_id: bundle.hdr?.bundle_id,
      producer_id: bundle.meta?.producer_id,
      created_at: bundle.meta?.created_at,
      digest_alg: bundle.meta?.digest_alg,
      sig_alg: bundle.meta?.sig_alg,
      proof_kind: bundle.meta?.proof_kind,
      expiration: bundle.meta?.expiration || null,
      payload_bytes: bundle.payload?.length || 0,
      refs_count: (bundle.refs || []).length,
      side_attestations: (bundle.meta?.side_attestations || []).length,
      boundary: bundle.meta?.boundary || null
    };
  } catch (e) {
    return { error: e.message };
  }
}

/* ================================================================
   DOMAINS (20 reusable claim classes)
   ================================================================ */

const DOMAINS = [
  { id: 'software-release', name: 'Software Release', desc: 'Versioned artifact release claim', profile: 'PB-INTEGRITY-1', template: { all: [{ equals: ['type', 'release'] }, { present: 'version' }] } },
  { id: 'audit-log', name: 'Audit Log Entry', desc: 'Tamper-evident audit record', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'actor' }, { present: 'action' }, { present: 'timestamp' }] } },
  { id: 'identity-claim', name: 'Identity Claim', desc: 'Verifiable identity assertion', profile: 'PB-BOUNDARY-1', template: { all: [{ present: 'subject' }, { present: 'issuer' }, { not_expired: 'valid_until' }] } },
  { id: 'config-snapshot', name: 'Configuration Snapshot', desc: 'Infrastructure state capture', profile: 'PB-INTEGRITY-1', template: { all: [{ present: 'resource_id' }, { present: 'config_hash' }] } },
  { id: 'compliance-report', name: 'Compliance Report', desc: 'Regulatory compliance attestation', profile: 'PB-REGULATED-1', template: { all: [{ present: 'standard' }, { present: 'scope' }, { present: 'assessor' }] } },
  { id: 'data-provenance', name: 'Data Provenance', desc: 'Origin and transformation chain', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'source' }, { present: 'transform' }] } },
  { id: 'key-rotation', name: 'Key Rotation', desc: 'Cryptographic key lifecycle event', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'key_id' }, { present: 'old_key_digest' }, { present: 'new_key_digest' }] } },
  { id: 'access-grant', name: 'Access Grant', desc: 'Permission authorization with boundary', profile: 'PB-BOUNDARY-1', template: { all: [{ present: 'principal' }, { present: 'resource' }, { present: 'expires' }] } },
  { id: 'contract-state', name: 'Contract State', desc: 'Smart contract or legal agreement state', profile: 'PB-INTEGRITY-1', template: { all: [{ present: 'contract_id' }, { present: 'state_hash' }] } },
  { id: 'ml-model', name: 'ML Model Artifact', desc: 'Trained model with provenance', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'model_id' }, { present: 'training_digest' }, { present: 'dataset_refs' }] } },
  { id: 'document-signature', name: 'Document Signature', desc: 'Signed document with temporal boundary', profile: 'PB-BOUNDARY-1', template: { all: [{ present: 'document_hash' }, { present: 'signer' }, { not_expired: 'valid_until' }] } },
  { id: 'incident-response', name: 'Incident Response', desc: 'Security incident handling record', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'incident_id' }, { present: 'severity' }, { present: 'responder' }] } },
  { id: 'supply-chain', name: 'Supply Chain Attestation', desc: 'Component origin and integrity', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'component_id' }, { present: 'supplier' }, { present: 'bill_of_materials' }] } },
  { id: 'credential-issuance', name: 'Credential Issuance', desc: 'Verifiable credential issuance', profile: 'PB-REGULATED-1', template: { all: [{ present: 'credential_type' }, { present: 'issuer' }, { present: 'subject' }, { not_expired: 'valid_until' }] } },
  { id: 'vulnerability-disclosure', name: 'Vulnerability Disclosure', desc: 'Security vulnerability report', profile: 'PB-INTEGRITY-1', template: { all: [{ present: 'cve_id' }, { present: 'affected_versions' }] } },
  { id: 'test-result', name: 'Test Result', desc: 'Formal verification or test outcome', profile: 'PB-INTEGRITY-1', template: { all: [{ present: 'test_id' }, { present: 'result' }, { present: 'runner' }] } },
  { id: 'policy-change', name: 'Policy Change', desc: 'Governance policy modification', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'policy_id' }, { present: 'old_version' }, { present: 'new_version' }, { present: 'approver' }] } },
  { id: 'financial-transaction', name: 'Financial Transaction', desc: 'Settled financial event', profile: 'PB-REGULATED-1', template: { all: [{ present: 'tx_id' }, { present: 'amount' }, { present: 'currency' }, { present: 'parties' }] } },
  { id: 'medical-record', name: 'Medical Record', desc: 'Patient data with consent boundary', profile: 'PB-REGULATED-1', template: { all: [{ present: 'patient_id' }, { present: 'record_type' }, { present: 'provider' }, { not_expired: 'consent_expires' }] } },
  { id: 'research-data', name: 'Research Data', desc: 'Scientific dataset with provenance', profile: 'PB-LINEAGE-1', template: { all: [{ present: 'dataset_id' }, { present: 'methodology' }, { present: 'ethics_approval' }] } }
];

/* ================================================================
   CONFORMANCE TESTS
   ================================================================ */

async function runConformance() {
  const results = [];
  const digestAlgs = ['SHA-256', 'SHA-384', 'SHA-512', 'BLAKE3', 'BLAKE2b'];
  const sigAlgs = ['Ed25519', 'ECDSA-P256', 'ECDSA-P384', 'ECDSA-P521', 'RSA-PSS-2048', 'RSA-PSS-3072', 'RSA-PSS-4096'];
  const profiles = ['PB-INTEGRITY-1', 'PB-BOUNDARY-1', 'PB-LINEAGE-1', 'PB-REGULATED-1'];

  // 1. Algorithm pair tests (35 combinations)
  for (const digestAlg of digestAlgs) {
    for (const sigAlg of sigAlgs) {
      try {
        const { bundle, publicKey } = await seal({ test: 'conformance', pair: `${digestAlg}/${sigAlg}` }, null, { digestAlg, sigAlg });
        const result = await verifyBundle(bundle, {}, { publicKey });
        results.push({
          test: `seal-verify-${digestAlg}-${sigAlg}`,
          ok: result.outcome === 'verified',
          outcome: result.outcome,
          digestAlg,
          sigAlg
        });
      } catch (e) {
        results.push({ test: `seal-verify-${digestAlg}-${sigAlg}`, ok: false, error: e.message, digestAlg, sigAlg });
      }
    }
  }

  // 2. Tamper detection
  const { bundle: goodBundle, publicKey, keyPair } = await seal({ claim: 'tamper-test' }, null, { sigAlg: 'Ed25519' });
  const tamperTests = [
    { name: 'mutate-payload', mut: b => { b.payload = b64uEncode('tampered'); } },
    { name: 'mutate-meta', mut: b => { b.meta.producer_id = 'evil'; } },
    { name: 'mutate-hdr', mut: b => { b.hdr.profile = 'PB-REGULATED-1'; } },
    { name: 'mutate-seal', mut: b => { b.seal.signature = b64uEncode(new Uint8Array(64)); } }
  ];

  for (const tt of tamperTests) {
    const mutated = JSON.parse(JSON.stringify(goodBundle));
    tt.mut(mutated);
    const result = await verifyBundle(mutated, {}, { publicKey });
    results.push({
      test: `tamper-${tt.name}`,
      ok: result.outcome !== 'verified',
      outcome: result.outcome
    });
  }

  // 3. Boundary tests
  const boundTests = [
    { boundary: { all: [{ equals: ['env', 'demo'] }] }, context: { env: 'demo' }, expect: 'verified' },
    { boundary: { all: [{ equals: ['env', 'demo'] }] }, context: { env: 'prod' }, expect: 'out-of-bounds' },
    { boundary: { any: [{ equals: ['env', 'demo'] }, { equals: ['env', 'test'] }] }, context: { env: 'test' }, expect: 'verified' },
    { boundary: { not: { equals: ['env', 'blocked'] } }, context: { env: 'allowed' }, expect: 'verified' },
    { boundary: { present: 'token' }, context: {}, expect: 'out-of-bounds' },
    { boundary: { not_expired: 'valid_until' }, context: { valid_until: '2020-01-01T00:00:00Z' }, expect: 'out-of-bounds' }
  ];

  for (const bt of boundTests) {
    const { bundle, publicKey: pk } = await seal({ claim: 'boundary-test' }, bt.boundary, { profile: 'PB-BOUNDARY-1', sigAlg: 'Ed25519' });
    const result = await verifyBundle(bundle, bt.context, { publicKey: pk });
    results.push({
      test: `boundary-${bt.expect}`,
      ok: result.outcome === bt.expect,
      outcome: result.outcome,
      expected: bt.expect
    });
  }

  // 4. Expiration tests
  const { bundle: expBundle, publicKey: expPk } = await seal({ claim: 'exp-test' }, null, { expiration: '2020-01-01T00:00:00Z', sigAlg: 'Ed25519' });
  const expResult = await verifyBundle(expBundle, {}, { publicKey: expPk });
  results.push({ test: 'expired-bundle', ok: expResult.outcome === 'out-of-bounds', outcome: expResult.outcome });

  const { bundle: futBundle, publicKey: futPk } = await seal({ claim: 'exp-test' }, null, { expiration: '2099-01-01T00:00:00Z', sigAlg: 'Ed25519' });
  const futResult = await verifyBundle(futBundle, {}, { publicKey: futPk });
  results.push({ test: 'future-expiry', ok: futResult.outcome === 'verified', outcome: futResult.outcome });

  // 5. Lineage test
  const parent = await seal({ claim: 'parent' }, null, { sigAlg: 'Ed25519' });
  const parentCanon = canonicalBytes({ hdr: parent.bundle.hdr, payload: parent.bundle.payload, meta: parent.bundle.meta, refs: parent.bundle.refs || [] });
  const parentDigest = await digest('SHA-256', parentCanon);
  const parentDigestB64u = b64uEncode(parentDigest);

  const childMeta = {
    parent_id: parent.bundle.hdr.bundle_id,
    parent_digest: parentDigestB64u,
    digest_alg: 'SHA-256',
    sig_alg: 'Ed25519',
    proof_kind: 'signature',
    producer_id: 'proofbundle-node',
    created_at: makeTimestamp()
  };
  const childHdr = { spec_id: SPEC_ID, spec_ver: SPEC_VER, profile: 'PB-LINEAGE-1', bundle_id: makeBundleId() };
  const childPayload = b64uEncode(utf8Encode(JSON.stringify({ claim: 'child' })));
  const childRefs = [{ parent_id: parent.bundle.hdr.bundle_id, parent_digest: parentDigestB64u }];
  const childPre = { hdr: childHdr, payload: childPayload, meta: childMeta, refs: childRefs };
  const childCanon = canonicalBytes(childPre);
  const childDgst = await digest('SHA-256', childCanon);
  const childSig = await sign('Ed25519', parent.keyPair.privateKey, childDgst);
  const childSeal = { digest: b64uEncode(childDgst), signature: b64uEncode(childSig) };
  const childBundle = { ...childPre, seal: childSeal };

  const linResult = await verifyBundle(childBundle, {}, { publicKey: parent.publicKey, parents: [parent.bundle] });
  results.push({ test: 'lineage-valid', ok: linResult.outcome === 'verified', outcome: linResult.outcome });

  // Summary
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return { results, passed, failed, total: results.length };
}

/* ================================================================
   EXPORTS
   ================================================================ */

module.exports = {
  seal,
  verify: verifyBundle,
  inspect,
  evaluateBoundary,
  verifyLineage,
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  sign,
  digest,
  canonicalJSON,
  canonicalBytes,
  b64uEncode,
  b64uDecode,
  DOMAINS,
  runConformance,
  // Constants
  SPEC_ID,
  SPEC_VER,
  PROFILES
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'test') {
    runConformance().then(r => {
      console.log(`\nProofBundle v1.0.0 Conformance\n${r.passed}/${r.total} passed, ${r.failed} failed\n`);
      if (r.failed > 0) {
        for (const f of r.results.filter(x => !x.ok)) {
          console.log(`FAIL: ${f.test} → ${f.outcome || f.error}`);
        }
      }
      process.exit(r.failed > 0 ? 1 : 0);
    }).catch(e => {
      console.error('Conformance error:', e);
      process.exit(1);
    });
  }
}
