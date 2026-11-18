import { asBytes, compareBytes, concatBytes, equalBytes, fromHex, toHex } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { ALGORITHM_REGISTRY, getAlgorithm } from './registry.mjs';

const CODECS = Object.freeze({
  raw: 0x55,
  'dag-cbor': 0x71,
  json: 0x0200,
});

function malformed(message) {
  throw new ProofBundleError(Verdict.MALFORMED, message);
}

export function encodeVarint(rawValue) {
  let value = typeof rawValue === 'bigint' ? rawValue : BigInt(rawValue);
  if (value < 0n || value > 0xffffffffffffffffn) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'varint is outside uint64');
  }
  const bytes = [];
  do {
    let byte = Number(value & 0x7fn);
    value >>= 7n;
    if (value !== 0n) byte |= 0x80;
    bytes.push(byte);
  } while (value !== 0n);
  return new Uint8Array(bytes);
}

export function decodeVarint(bytes, offset = 0) {
  const input = asBytes(bytes, 'varint input');
  let value = 0n;
  let shift = 0n;
  let cursor = offset;
  for (; cursor < input.byteLength && cursor - offset < 10; cursor += 1) {
    const byte = input[cursor];
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      const encoded = encodeVarint(value);
      if (!equalBytes(encoded, input.subarray(offset, cursor + 1))) malformed('non-minimal varint');
      return { value, nextOffset: cursor + 1 };
    }
    shift += 7n;
  }
  malformed('truncated or oversized varint');
}

function algorithmForMultihashCode(code) {
  const matches = Object.values(ALGORITHM_REGISTRY).filter(
    ({ multihash }) => multihash?.code === code,
  );
  if (matches.length !== 1) return undefined;
  return matches[0];
}

export function encodeMultihash(algorithmId, digestBytes) {
  const algorithm = getAlgorithm(algorithmId);
  if (!algorithm.multihash) {
    throw new ProofBundleError(
      Verdict.UNSUPPORTED_ALGORITHM,
      `${algorithmId} has no registered multihash code`,
    );
  }
  const value = asBytes(digestBytes, 'digest');
  if (algorithm.outputLength && value.byteLength !== algorithm.outputLength) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `${algorithmId} digest must be ${algorithm.outputLength} bytes`,
    );
  }
  return concatBytes(
    encodeVarint(algorithm.multihash.code),
    encodeVarint(value.byteLength),
    value,
  );
}

export function multihash(algorithmId, content, options = {}) {
  return encodeMultihash(algorithmId, digest(algorithmId, content, options));
}

export function decodeMultihash(bytes) {
  const input = asBytes(bytes, 'multihash');
  const codeResult = decodeVarint(input, 0);
  const lengthResult = decodeVarint(input, codeResult.nextOffset);
  if (lengthResult.value > BigInt(Number.MAX_SAFE_INTEGER)) malformed('multihash length is too large');
  const length = Number(lengthResult.value);
  if (lengthResult.nextOffset + length !== input.byteLength) {
    malformed('multihash length does not match the input');
  }
  const code = Number(codeResult.value);
  const algorithm = algorithmForMultihashCode(code);
  const digestBytes = Uint8Array.from(input.subarray(lengthResult.nextOffset));
  if (algorithm?.outputLength && digestBytes.byteLength !== algorithm.outputLength) {
    malformed('multihash digest length conflicts with its algorithm');
  }
  return Object.freeze({
    code,
    algorithmId: algorithm?.id,
    registryStatus: algorithm?.multihash?.status,
    digest: digestBytes,
  });
}

const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase32(bytes) {
  const input = asBytes(bytes);
  let accumulator = 0;
  let bits = 0;
  let out = '';
  for (const byte of input) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += BASE32[(accumulator >>> bits) & 31];
    }
  }
  if (bits > 0) out += BASE32[(accumulator << (5 - bits)) & 31];
  return out;
}

function decodeBase32(text) {
  if (!/^[a-z2-7]*$/.test(text)) malformed('base32 text is not canonical lowercase');
  let accumulator = 0;
  let bits = 0;
  const out = [];
  for (const c of text) {
    accumulator = (accumulator << 5) | BASE32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((accumulator >>> bits) & 0xff);
    }
  }
  if (bits > 0 && (accumulator & ((1 << bits) - 1)) !== 0) malformed('non-zero base32 padding bits');
  const bytes = new Uint8Array(out);
  if (encodeBase32(bytes) !== text) malformed('non-minimal base32 encoding');
  return bytes;
}

function encodeBase58(bytes) {
  const input = asBytes(bytes);
  let value = 0n;
  for (const byte of input) value = (value << 8n) | BigInt(byte);
  let out = '';
  while (value > 0n) {
    out = BASE58[Number(value % 58n)] + out;
    value /= 58n;
  }
  let zeroes = 0;
  while (zeroes < input.byteLength && input[zeroes] === 0) zeroes += 1;
  return '1'.repeat(zeroes) + out;
}

function decodeBase58(text) {
  if (typeof text !== 'string' || !text.length) return new Uint8Array(0);
  let value = 0n;
  for (const c of text) {
    const index = BASE58.indexOf(c);
    if (index < 0) malformed('invalid base58btc character');
    value = value * 58n + BigInt(index);
  }
  const body = [];
  while (value > 0n) {
    body.push(Number(value & 0xffn));
    value >>= 8n;
  }
  body.reverse();
  let zeroes = 0;
  while (zeroes < text.length && text[zeroes] === '1') zeroes += 1;
  const bytes = new Uint8Array(zeroes + body.length);
  bytes.set(body, zeroes);
  if (encodeBase58(bytes) !== text) malformed('non-minimal base58btc encoding');
  return bytes;
}

export function encodeMultibase(base, bytes) {
  const input = asBytes(bytes);
  if (base === 'base32') return `b${encodeBase32(input)}`;
  if (base === 'base58btc') return `z${encodeBase58(input)}`;
  if (base === 'base16') return `f${toHex(input)}`;
  if (base === 'base64url') return `u${Buffer.from(input).toString('base64url')}`;
  throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unsupported multibase: ${base}`);
}

export function decodeMultibase(text) {
  if (typeof text !== 'string' || text.length === 0) malformed('empty multibase value');
  const prefix = text[0];
  const body = text.slice(1);
  if (prefix === 'b') return decodeBase32(body);
  if (prefix === 'z') return decodeBase58(body);
  if (prefix === 'f') {
    if (body !== body.toLowerCase()) malformed('base16 multibase must be lowercase');
    return fromHex(body, 'base16 multibase');
  }
  if (prefix === 'u') {
    if (!/^[A-Za-z0-9_-]*$/.test(body) || body.includes('=') || body.length % 4 === 1) {
      malformed('invalid base64url multibase');
    }
    const bytes = new Uint8Array(Buffer.from(body, 'base64url'));
    if (Buffer.from(bytes).toString('base64url') !== body) malformed('non-minimal base64url');
    return bytes;
  }
  malformed(`unknown multibase prefix: ${prefix}`);
}

export function encodeCidV1(codec, multihashBytes, base = 'base32') {
  const codecCode = typeof codec === 'number' ? codec : CODECS[codec];
  if (codecCode === undefined) {
    throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unknown CID codec: ${codec}`);
  }
  const bytes = concatBytes(encodeVarint(1), encodeVarint(codecCode), multihashBytes);
  return encodeMultibase(base, bytes);
}

export function contentId(content, options = {}) {
  const hashId = options.hashId ?? 'pb.hash.sha2-256.v1';
  const codec = options.codec ?? 'raw';
  const base = options.base ?? 'base32';
  return encodeCidV1(codec, multihash(hashId, content), base);
}

export function decodeCidV1(cid) {
  const bytes = decodeMultibase(cid);
  const version = decodeVarint(bytes, 0);
  if (version.value !== 1n) malformed('only CIDv1 is supported');
  const codec = decodeVarint(bytes, version.nextOffset);
  const multihashBytes = bytes.subarray(codec.nextOffset);
  const decodedHash = decodeMultihash(multihashBytes);
  return Object.freeze({
    version: 1,
    codec: Number(codec.value),
    codecName: Object.entries(CODECS).find(([, value]) => value === Number(codec.value))?.[0],
    multihash: decodedHash,
    bytes: Uint8Array.from(bytes),
  });
}

export function compareContentIds(a, b) {
  return compareBytes(decodeMultibase(a), decodeMultibase(b));
}
