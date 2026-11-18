import { timingSafeEqual } from 'node:crypto';
import { ProofBundleError, Verdict } from './errors.mjs';

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

export function asBytes(value, label = 'value') {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new ProofBundleError(
    Verdict.MALFORMED,
    `${label} must be bytes; implicit string-to-byte conversion is forbidden`,
  );
}

export function copyBytes(value, label = 'value') {
  return Uint8Array.from(asBytes(value, label));
}

export function utf8(text, label = 'text') {
  if (typeof text !== 'string') {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} must be a string`);
  }
  assertWellFormedUnicode(text, label);
  return utf8Encoder.encode(text);
}

export function decodeUtf8(bytes, label = 'UTF-8 data') {
  try {
    return utf8Decoder.decode(asBytes(bytes, label));
  } catch (cause) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} is not valid UTF-8`, undefined, {
      cause,
    });
  }
}

export function assertWellFormedUnicode(text, label = 'text') {
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new ProofBundleError(
          Verdict.MALFORMED,
          `${label} contains an unpaired high surrogate at UTF-16 index ${i}`,
        );
      }
      i += 1;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `${label} contains an unpaired low surrogate at UTF-16 index ${i}`,
      );
    }
  }
}

export function concatBytes(...values) {
  const arrays = values.map((value, index) => asBytes(value, `part[${index}]`));
  const length = arrays.reduce((sum, value) => sum + value.byteLength, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const value of arrays) {
    out.set(value, offset);
    offset += value.byteLength;
  }
  return out;
}

export function u32be(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'u32 value is out of range');
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, false);
  return out;
}

export function u64be(value) {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'u64 value is out of range');
  }
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, n, false);
  return out;
}

export function domainSeparated(label, ...parts) {
  const labelBytes = utf8(label, 'domain label');
  if (labelBytes.byteLength === 0 || labelBytes.byteLength > 255) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      'domain label must contain between 1 and 255 UTF-8 bytes',
    );
  }
  const encoded = [new Uint8Array([labelBytes.byteLength]), labelBytes, u32be(parts.length)];
  for (const [index, part] of parts.entries()) {
    const bytes = asBytes(part, `domain part[${index}]`);
    encoded.push(u64be(bytes.byteLength), bytes);
  }
  return concatBytes(...encoded);
}

export function equalBytes(a, b) {
  const aa = asBytes(a, 'left bytes');
  const bb = asBytes(b, 'right bytes');
  return aa.byteLength === bb.byteLength && timingSafeEqual(aa, bb);
}

export function compareBytes(a, b) {
  const aa = asBytes(a);
  const bb = asBytes(b);
  const length = Math.min(aa.byteLength, bb.byteLength);
  for (let i = 0; i < length; i += 1) {
    if (aa[i] !== bb[i]) return aa[i] < bb[i] ? -1 : 1;
  }
  return Math.sign(aa.byteLength - bb.byteLength);
}

export function toHex(bytes) {
  return Buffer.from(asBytes(bytes)).toString('hex');
}

export function fromHex(text, label = 'hex') {
  if (typeof text !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(text)) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} is not canonical hexadecimal`);
  }
  return new Uint8Array(Buffer.from(text, 'hex'));
}

export function toBase64url(bytes) {
  return Buffer.from(asBytes(bytes)).toString('base64url');
}

export function fromBase64url(text, label = 'base64url') {
  if (
    typeof text !== 'string' ||
    !/^[A-Za-z0-9_-]*$/.test(text) ||
    text.includes('=') ||
    text.length % 4 === 1
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} is not canonical base64url`);
  }
  const decoded = new Uint8Array(Buffer.from(text, 'base64url'));
  if (toBase64url(decoded) !== text) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} is not minimally encoded`);
  }
  return decoded;
}

export function freezeBytes(bytes) {
  // Typed arrays cannot be deeply frozen in current V8. A defensive copy still
  // prevents an external caller from mutating the source buffer after validation.
  return Uint8Array.from(asBytes(bytes));
}
