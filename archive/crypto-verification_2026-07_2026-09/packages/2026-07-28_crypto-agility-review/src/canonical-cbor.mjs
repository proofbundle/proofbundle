import {
  asBytes,
  compareBytes,
  concatBytes,
  decodeUtf8,
  equalBytes,
  utf8,
} from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';

const MAX_UINT64 = 0xffffffffffffffffn;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function malformed(message) {
  throw new ProofBundleError(Verdict.MALFORMED, message);
}

function encodeHead(major, rawValue) {
  const value = typeof rawValue === 'bigint' ? rawValue : BigInt(rawValue);
  if (value < 0n || value > MAX_UINT64) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'CBOR integer or length exceeds uint64');
  }
  const prefix = major << 5;
  if (value < 24n) return new Uint8Array([prefix | Number(value)]);
  if (value <= 0xffn) return new Uint8Array([prefix | 24, Number(value)]);
  if (value <= 0xffffn) {
    return new Uint8Array([prefix | 25, Number(value >> 8n), Number(value & 0xffn)]);
  }
  if (value <= 0xffffffffn) {
    const out = new Uint8Array(5);
    out[0] = prefix | 26;
    new DataView(out.buffer).setUint32(1, Number(value), false);
    return out;
  }
  const out = new Uint8Array(9);
  out[0] = prefix | 27;
  new DataView(out.buffer).setBigUint64(1, value, false);
  return out;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function encodeValue(value, path) {
  if (value === null) return new Uint8Array([0xf6]);
  if (value === false) return new Uint8Array([0xf4]);
  if (value === true) return new Uint8Array([0xf5]);

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      malformed(`${path} must be a safe integer; floats are forbidden by this CBOR profile`);
    }
    if (value >= 0) return encodeHead(0, value);
    return encodeHead(1, -1n - BigInt(value));
  }

  if (typeof value === 'bigint') {
    if (value >= 0n) return encodeHead(0, value);
    return encodeHead(1, -1n - value);
  }

  if (typeof value === 'string') {
    const encoded = utf8(value, path);
    return concatBytes(encodeHead(3, encoded.byteLength), encoded);
  }

  if (value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes = asBytes(value, path);
    return concatBytes(encodeHead(2, bytes.byteLength), bytes);
  }

  if (Array.isArray(value)) {
    const encoded = value.map((item, index) => encodeValue(item, `${path}[${index}]`));
    return concatBytes(encodeHead(4, encoded.length), ...encoded);
  }

  let members;
  if (value instanceof Map) {
    members = [...value.entries()];
  } else if (isPlainObject(value)) {
    members = Object.entries(value);
  } else {
    malformed(`${path} contains a value outside the deterministic CBOR subset`);
  }

  const encodedMembers = members.map(([key, item]) => {
    if (typeof key !== 'string') malformed(`${path} map keys must be text strings`);
    return {
      key,
      encodedKey: encodeValue(key, `${path} key`),
      encodedValue: encodeValue(item, `${path}.${key}`),
    };
  });
  const unique = new Set(encodedMembers.map(({ key }) => key));
  if (unique.size !== encodedMembers.length) malformed(`${path} contains a duplicate map key`);
  encodedMembers.sort(
    (a, b) =>
      a.encodedKey.byteLength - b.encodedKey.byteLength || compareBytes(a.encodedKey, b.encodedKey),
  );
  return concatBytes(
    encodeHead(5, encodedMembers.length),
    ...encodedMembers.flatMap(({ encodedKey, encodedValue }) => [encodedKey, encodedValue]),
  );
}

export function encodeCanonicalCbor(value) {
  return encodeValue(value, '$');
}

class Decoder {
  constructor(bytes) {
    this.bytes = asBytes(bytes, 'CBOR input');
    this.offset = 0;
  }

  ensure(length) {
    if (length < 0 || this.offset + length > this.bytes.byteLength) {
      malformed('truncated CBOR input');
    }
  }

  readByte() {
    this.ensure(1);
    return this.bytes[this.offset++];
  }

  readLength(additional) {
    if (additional < 24) return BigInt(additional);
    if (additional === 24) {
      const value = BigInt(this.readByte());
      if (value < 24n) malformed('non-minimal CBOR integer or length');
      return value;
    }
    if (additional === 25) {
      this.ensure(2);
      const value = BigInt(new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 2).getUint16(0, false));
      this.offset += 2;
      if (value <= 0xffn) malformed('non-minimal CBOR integer or length');
      return value;
    }
    if (additional === 26) {
      this.ensure(4);
      const value = BigInt(new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 4).getUint32(0, false));
      this.offset += 4;
      if (value <= 0xffffn) malformed('non-minimal CBOR integer or length');
      return value;
    }
    if (additional === 27) {
      this.ensure(8);
      const value = new DataView(
        this.bytes.buffer,
        this.bytes.byteOffset + this.offset,
        8,
      ).getBigUint64(0, false);
      this.offset += 8;
      if (value <= 0xffffffffn) malformed('non-minimal CBOR integer or length');
      return value;
    }
    malformed('indefinite lengths and reserved additional values are forbidden');
  }

  lengthAsNumber(value, label) {
    if (value > MAX_SAFE) {
      throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, `${label} exceeds runtime bounds`);
    }
    return Number(value);
  }

  decode(path = '$') {
    const start = this.offset;
    const initial = this.readByte();
    const major = initial >> 5;
    const additional = initial & 0x1f;

    if (major === 7) {
      if (additional === 20) return { value: false, start, end: this.offset };
      if (additional === 21) return { value: true, start, end: this.offset };
      if (additional === 22) return { value: null, start, end: this.offset };
      malformed('floating-point and unassigned simple values are forbidden');
    }

    const length = this.readLength(additional);
    if (major === 0) {
      return { value: length <= MAX_SAFE ? Number(length) : length, start, end: this.offset };
    }
    if (major === 1) {
      const negative = -1n - length;
      return {
        value: negative >= -MAX_SAFE ? Number(negative) : negative,
        start,
        end: this.offset,
      };
    }
    if (major === 2) {
      const byteLength = this.lengthAsNumber(length, 'byte string');
      this.ensure(byteLength);
      const value = Uint8Array.from(this.bytes.subarray(this.offset, this.offset + byteLength));
      this.offset += byteLength;
      return { value, start, end: this.offset };
    }
    if (major === 3) {
      const byteLength = this.lengthAsNumber(length, 'text string');
      this.ensure(byteLength);
      const value = decodeUtf8(
        this.bytes.subarray(this.offset, this.offset + byteLength),
        `${path} text`,
      );
      this.offset += byteLength;
      return { value, start, end: this.offset };
    }
    if (major === 4) {
      const count = this.lengthAsNumber(length, 'array');
      const value = [];
      for (let index = 0; index < count; index += 1) {
        value.push(this.decode(`${path}[${index}]`).value);
      }
      return { value, start, end: this.offset };
    }
    if (major === 5) {
      const count = this.lengthAsNumber(length, 'map');
      const value = Object.create(null);
      let previousKeyEncoding;
      for (let index = 0; index < count; index += 1) {
        const decodedKey = this.decode(`${path} key`);
        if (typeof decodedKey.value !== 'string') malformed(`${path} map key is not text`);
        const keyEncoding = this.bytes.subarray(decodedKey.start, decodedKey.end);
        if (
          previousKeyEncoding &&
          (previousKeyEncoding.byteLength > keyEncoding.byteLength ||
            (previousKeyEncoding.byteLength === keyEncoding.byteLength &&
              compareBytes(previousKeyEncoding, keyEncoding) >= 0))
        ) {
          malformed(`${path} map keys are not in deterministic order or contain a duplicate`);
        }
        previousKeyEncoding = keyEncoding;
        if (Object.hasOwn(value, decodedKey.value)) malformed(`${path} contains a duplicate key`);
        value[decodedKey.value] = this.decode(`${path}.${decodedKey.value}`).value;
      }
      return { value, start, end: this.offset };
    }
    malformed(`CBOR major type ${major} is forbidden by this profile`);
  }
}

export function decodeCanonicalCbor(bytes) {
  const decoder = new Decoder(bytes);
  const decoded = decoder.decode();
  if (decoder.offset !== decoder.bytes.byteLength) malformed('trailing bytes after CBOR item');
  const reencoded = encodeCanonicalCbor(decoded.value);
  if (!equalBytes(reencoded, decoder.bytes)) malformed('CBOR input is not deterministically encoded');
  return decoded.value;
}

export function isCanonicalCbor(bytes) {
  try {
    decodeCanonicalCbor(bytes);
    return true;
  } catch {
    return false;
  }
}
