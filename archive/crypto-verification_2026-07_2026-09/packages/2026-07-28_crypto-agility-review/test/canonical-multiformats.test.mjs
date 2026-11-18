import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeJson,
  canonicalizeJsonSource,
  contentId,
  decodeCanonicalCbor,
  decodeCidV1,
  decodeMultibase,
  decodeMultihash,
  decodeVarint,
  encodeCanonicalCbor,
  encodeMultibase,
  encodeVarint,
  equalBytes,
  multihash,
  parseJsonStrict,
  toHex,
} from '../src/index.mjs';

test('JCS canonicalizes keys and rejects duplicate or unsafe input', () => {
  assert.equal(canonicalizeJson({ b: 1, a: 'x' }), '{"a":"x","b":1}');
  assert.equal(canonicalizeJsonSource(' { "b": 1, "a": "x" } '), '{"a":"x","b":1}');
  assert.throws(() => parseJsonStrict('{"a":1,"a":2}'), { code: 'malformed' });
  assert.throws(() => canonicalizeJson({ n: Number.NaN }), { code: 'malformed' });
  assert.throws(() => canonicalizeJson({ n: 9_007_199_254_740_992 }), { code: 'malformed' });
});

test('deterministic CBOR uses length-first map ordering and strict decoding', () => {
  const encoded = encodeCanonicalCbor({ b: 1, a: 'x' });
  assert.equal(toHex(encoded), 'a261616178616201');
  const decoded = decodeCanonicalCbor(encoded);
  assert.equal(decoded.a, 'x');
  assert.equal(decoded.b, 1);
  assert.throws(() => decodeCanonicalCbor(Uint8Array.of(0x18, 0x01)), {
    code: 'malformed',
  });
  assert.throws(() => decodeCanonicalCbor(Uint8Array.of(0x9f, 0xff)), {
    code: 'malformed',
  });
  assert.throws(() => encodeCanonicalCbor(1.5), { code: 'malformed' });
});

test('uint64 varints reject non-minimal encodings', () => {
  for (const value of [0n, 127n, 128n, 16_384n, 0xffffffffffffffffn]) {
    const encoded = encodeVarint(value);
    const decoded = decodeVarint(encoded);
    assert.equal(decoded.value, value);
    assert.equal(decoded.nextOffset, encoded.byteLength);
  }
  assert.throws(() => decodeVarint(Uint8Array.of(0x80, 0x00)), { code: 'malformed' });
});

test('multibase, multihash, and CIDv1 round-trip canonically', () => {
  const bytes = Uint8Array.of(0, 1, 2, 253, 254, 255);
  for (const base of ['base32', 'base58btc', 'base16', 'base64url']) {
    assert.ok(equalBytes(decodeMultibase(encodeMultibase(base, bytes)), bytes));
  }
  const mh = multihash('pb.hash.sha2-256.v1', bytes);
  assert.equal(decodeMultihash(mh).algorithmId, 'pb.hash.sha2-256.v1');
  const cid = contentId(bytes, {
    hashId: 'pb.hash.sha2-256.v1',
    codec: 'raw',
    base: 'base32',
  });
  const decoded = decodeCidV1(cid);
  assert.equal(decoded.version, 1);
  assert.equal(decoded.codecName, 'raw');
  assert.equal(decoded.multihash.algorithmId, 'pb.hash.sha2-256.v1');
});
