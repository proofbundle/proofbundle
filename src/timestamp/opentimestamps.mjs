// OpenTimestamps (.ots) detached-proof format: build and parse.
//
// Every constant below — the header magic, MAJOR_VERSION, the attestation
// tag bytes, the op tag bytes, the varuint/varbytes wire format, and the
// 0xff/0x00 sibling-framing algorithm — was checked against the reference
// implementation (opentimestamps/python-opentimestamps, core/timestamp.py,
// core/notary.py, core/op.py, core/serialize.py) rather than written from
// memory, because a byte-format parser that is subtly wrong is worse than
// one honestly marked absent.
//
// Scope: this parses proof structure and can replay the operation chain
// (append/prepend/reverse/hexlify/sha1/ripemd160/sha256/keccak256 — all
// computable in this environment) to recover the digest each attestation
// commits to. It does NOT fetch a Bitcoin/Litecoin block header and confirm
// the attestation against the chain — that needs network access this build
// does not have. A BITCOIN or LITECOIN attestation here means "the proof
// structurally claims this height commits to this digest," not "confirmed
// on-chain." PENDING means "the proof names a calendar to ask later."

import { createHash } from 'node:crypto';
import { MalformedInputError, LimitExceededError } from '../errors.mjs';
import { digestBytes } from '../digest/digest.mjs';

export const HEADER_MAGIC = Uint8Array.from(Buffer.from('00 4F 70 65 6E 54 69 6D 65 73 74 61 6D 70 73 00 00 50 72 6F 6F 66 00 BF 89 E2 E8 84 E8 92 94'.replace(/ /g, ''), 'hex'));
export const MAJOR_VERSION = 1;

const CRYPTO_OPS = new Map([
  [0x02, { name: 'SHA1', len: 20, digest: (m) => createHash('sha1').update(m).digest() }],
  [0x03, { name: 'RIPEMD160', len: 20, digest: (m) => createHash('ripemd160').update(m).digest() }],
  [0x08, { name: 'SHA256', len: 32, digest: (m) => createHash('sha256').update(m).digest() }],
  [0x67, { name: 'KECCAK256', len: 32, digest: (m) => digestBytes('Keccak-256', m) }],
]);
const HASH_OP_BY_NAME = new Map([...CRYPTO_OPS].map(([tag, v]) => [v.name, { tag, ...v }]));
const TRANSFORM_OPS = new Map([[0xf0, 'APPEND'], [0xf1, 'PREPEND'], [0xf2, 'REVERSE'], [0xf3, 'HEXLIFY']]);

const ATTESTATION_TAGS = new Map([
  ['83dfe30d2ef90c8e', 'PENDING'],
  ['0588960d73d71901', 'BITCOIN'],
  ['06869a0d73d71b45', 'LITECOIN'],
]);
const ATTESTATION_TAG_BY_NAME = new Map([...ATTESTATION_TAGS].map(([hex, name]) => [name, hex]));

const MAX_PAYLOAD_SIZE = 8192;   // TimeAttestation.MAX_PAYLOAD_SIZE
const MAX_URI_LENGTH = 1000;     // reasonable bound; not asserted to match the reference constant exactly
const MAX_RESULT_LENGTH = 4096;  // BinaryOp.MAX_RESULT_LENGTH
const RECURSION_LIMIT = 256;     // Timestamp.deserialize's _recursion_limit default
const MAX_NODES = 20000;         // this module's own bound against flat-but-huge proofs

function hex(bytes) { return Buffer.from(bytes).toString('hex'); }

// -- bounded cursor reader ---------------------------------------------------

function readByte(c) {
  if (c.pos >= c.buf.length) throw new MalformedInputError('opentimestamps: truncated proof', { predicate: 'ots.notTruncated' });
  return c.buf[c.pos++];
}
function readBytes(c, n) {
  if (n < 0 || c.pos + n > c.buf.length) throw new MalformedInputError('opentimestamps: truncated proof', { predicate: 'ots.notTruncated' });
  const b = c.buf.subarray(c.pos, c.pos + n);
  c.pos += n;
  return b;
}
function readVarUint(c) {
  let result = 0n, shift = 0n, count = 0;
  for (;;) {
    if (count++ > 10) throw new MalformedInputError('opentimestamps: varuint exceeds bound', { predicate: 'ots.varuintBounded' });
    const b = readByte(c);
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7n;
  }
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new MalformedInputError('opentimestamps: varuint exceeds safe integer range', { predicate: 'ots.varuintBounded' });
  return Number(result);
}
function readVarBytes(c, maxLen) {
  const len = readVarUint(c);
  if (len > maxLen) throw new MalformedInputError(`opentimestamps: varbytes length ${len} exceeds bound ${maxLen}`, { predicate: 'ots.varbytesBounded' });
  return readBytes(c, len);
}

// -- bounded writer -----------------------------------------------------------

function writeVarUint(out, n) {
  let x = BigInt(n);
  if (x < 0n) throw new RangeError('opentimestamps: varuint must be non-negative');
  do {
    let byte = Number(x & 0x7fn);
    x >>= 7n;
    if (x > 0n) byte |= 0x80;
    out.push(byte);
  } while (x > 0n);
}
function writeVarBytes(out, bytes) { writeVarUint(out, bytes.length); out.push(...bytes); }

// -- op application -----------------------------------------------------------

function applyOp(msg, tag, arg) {
  if (tag === 0xf0) return Buffer.concat([msg, arg]);
  if (tag === 0xf1) return Buffer.concat([arg, msg]);
  if (tag === 0xf2) return Uint8Array.from(msg).reverse();
  if (tag === 0xf3) return Buffer.from(hex(msg), 'ascii');
  const crypto = CRYPTO_OPS.get(tag);
  if (crypto) return crypto.digest(Buffer.from(msg));
  throw new MalformedInputError(`opentimestamps: unrecognized op tag 0x${tag.toString(16)}`, { predicate: 'ots.opTagKnown' });
}

// -- attestation payload -------------------------------------------------------

function parseAttestationPayload(tagHex, payload) {
  const name = ATTESTATION_TAGS.get(tagHex);
  if (!name) return { name: 'UNKNOWN', tagHex, raw: payload };
  const c = { buf: payload, pos: 0 };
  if (name === 'PENDING') {
    const uriBytes = readVarBytes(c, MAX_URI_LENGTH);
    if (c.pos !== payload.length) throw new MalformedInputError('opentimestamps: trailing bytes in PENDING attestation payload', { predicate: 'ots.attestationEof' });
    return { name, tagHex, uri: Buffer.from(uriBytes).toString('utf-8') };
  }
  // BITCOIN / LITECOIN: varuint height
  const height = readVarUint(c);
  if (c.pos !== payload.length) throw new MalformedInputError(`opentimestamps: trailing bytes in ${name} attestation payload`, { predicate: 'ots.attestationEof' });
  return { name, tagHex, height };
}
function serializeAttestationPayload(att) {
  const out = [];
  if (att.name === 'PENDING') writeVarBytes(out, Array.from(Buffer.from(att.uri, 'utf-8')));
  else if (att.name === 'BITCOIN' || att.name === 'LITECOIN') writeVarUint(out, att.height);
  else if (att.name === 'UNKNOWN') out.push(...att.raw);
  else throw new RangeError(`opentimestamps: unknown attestation name ${att.name}`);
  return out;
}

// -- timestamp tree -------------------------------------------------------------

function deserializeTimestamp(c, msg, depth, budget) {
  if (depth > RECURSION_LIMIT) throw new LimitExceededError('opentimestamps: proof nesting exceeds recursion limit', { predicate: 'ots.depthBounded' });
  if (++budget.n > MAX_NODES) throw new LimitExceededError('opentimestamps: proof node count exceeds bound', { predicate: 'ots.nodeCountBounded' });

  const node = { msgHex: hex(msg), attestations: [], ops: [] };
  const doTagOrAttestation = (tag) => {
    if (tag === 0x00) {
      const tagHex = hex(readBytes(c, 8));
      const payload = readVarBytes(c, MAX_PAYLOAD_SIZE);
      node.attestations.push(parseAttestationPayload(tagHex, payload));
      return;
    }
    if (TRANSFORM_OPS.has(tag) || CRYPTO_OPS.has(tag)) {
      let arg = null;
      if (tag === 0xf0 || tag === 0xf1) {
        arg = readVarBytes(c, MAX_RESULT_LENGTH);
        if (arg.length < 1) throw new MalformedInputError('opentimestamps: append/prepend argument must be non-empty', { predicate: 'ots.opArgNonEmpty' });
      }
      const result = applyOp(msg, tag, arg);
      const subtree = deserializeTimestamp(c, result, depth + 1, budget);
      node.ops.push({ tag, name: TRANSFORM_OPS.get(tag) ?? CRYPTO_OPS.get(tag).name, arg, subtree });
      return;
    }
    throw new MalformedInputError(`opentimestamps: unrecognized tag byte 0x${tag.toString(16)}`, { predicate: 'ots.tagKnown' });
  };

  let tag = readByte(c);
  while (tag === 0xff) {
    doTagOrAttestation(readByte(c));
    tag = readByte(c);
  }
  doTagOrAttestation(tag);
  if (node.attestations.length === 0 && node.ops.length === 0) {
    throw new MalformedInputError('opentimestamps: empty timestamp node', { predicate: 'ots.nodeNonEmpty' });
  }
  return node;
}

function serializeTimestamp(out, node) {
  const total = node.attestations.length + node.ops.length;
  if (total === 0) throw new RangeError('opentimestamps: cannot serialize an empty timestamp node');
  const atts = node.attestations, ops = node.ops;
  for (let i = 0; i < atts.length - (ops.length === 0 ? 1 : 0); i++) {
    out.push(0xff, 0x00);
    out.push(...hexToBytes(atts[i].tagHex));
    writeVarBytes(out, serializeAttestationPayload(atts[i]));
  }
  if (ops.length === 0) {
    const last = atts[atts.length - 1];
    out.push(0x00);
    out.push(...hexToBytes(last.tagHex));
    writeVarBytes(out, serializeAttestationPayload(last));
    return;
  }
  if (atts.length > 0) {
    const last = atts[atts.length - 1];
    out.push(0xff, 0x00);
    out.push(...hexToBytes(last.tagHex));
    writeVarBytes(out, serializeAttestationPayload(last));
  }
  for (let i = 0; i < ops.length - 1; i++) {
    out.push(0xff);
    serializeOp(out, ops[i]);
  }
  serializeOp(out, ops[ops.length - 1]);
}
function serializeOp(out, op) {
  out.push(op.tag);
  if (op.tag === 0xf0 || op.tag === 0xf1) writeVarBytes(out, Array.from(op.arg));
  serializeTimestamp(out, op.subtree);
}
function hexToBytes(h) { return Array.from(Buffer.from(h, 'hex')); }

// -- public API -----------------------------------------------------------------

export function buildDetachedTimestamp({ hashAlg = 'SHA256', digest, tree }) {
  const spec = HASH_OP_BY_NAME.get(hashAlg);
  if (!spec) throw new RangeError(`buildDetachedTimestamp: unsupported hashAlg ${JSON.stringify(hashAlg)}`);
  if (!(digest instanceof Uint8Array) || digest.length !== spec.len) {
    throw new RangeError(`buildDetachedTimestamp: ${hashAlg} digest must be ${spec.len} bytes`);
  }
  const out = [...HEADER_MAGIC, MAJOR_VERSION, spec.tag, ...digest];
  serializeTimestamp(out, tree);
  return Uint8Array.from(out);
}

export function parseOtsProof(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('parseOtsProof: bytes must be a Uint8Array');
  if (bytes.length < HEADER_MAGIC.length + 2) throw new MalformedInputError('opentimestamps: proof too short', { predicate: 'ots.minLength' });
  if (!Buffer.from(bytes.subarray(0, HEADER_MAGIC.length)).equals(Buffer.from(HEADER_MAGIC))) {
    throw new MalformedInputError('opentimestamps: bad header magic', { predicate: 'ots.magicValid' });
  }
  const c = { buf: bytes, pos: HEADER_MAGIC.length };
  const major = readByte(c);
  if (major !== MAJOR_VERSION) throw new MalformedInputError(`opentimestamps: unsupported major version ${major}`, { predicate: 'ots.versionSupported' });
  const hashOpTag = readByte(c);
  const cryptoInfo = CRYPTO_OPS.get(hashOpTag);
  if (!cryptoInfo) throw new MalformedInputError(`opentimestamps: unknown file hash op 0x${hashOpTag.toString(16)}`, { predicate: 'ots.fileHashOpKnown' });
  const digest = readBytes(c, cryptoInfo.len);
  const tree = deserializeTimestamp(c, digest, 0, { n: 0 });
  if (c.pos !== bytes.length) throw new MalformedInputError('opentimestamps: trailing bytes after proof', { predicate: 'ots.eof' });

  const attestations = [];
  (function flatten(node) {
    for (const a of node.attestations) attestations.push({ ...a, commitsToHex: node.msgHex });
    for (const o of node.ops) flatten(o.subtree);
  })(tree);

  return Object.freeze({
    version: major,
    hashAlg: cryptoInfo.name,
    digestHex: hex(digest),
    tree,
    attestations,
    pending: attestations.filter((a) => a.name === 'PENDING'),
    bitcoinAttested: attestations.some((a) => a.name === 'BITCOIN'),
  });
}

export function verifyDetachedDigest(parsed, digest) {
  if (!(digest instanceof Uint8Array)) throw new TypeError('verifyDetachedDigest: digest must be a Uint8Array');
  return parsed.digestHex === hex(digest);
}

export { ATTESTATION_TAG_BY_NAME };
