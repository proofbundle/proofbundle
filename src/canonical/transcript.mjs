// Domain separation.
//
// Every security-relevant byte string that gets hashed or signed in this
// project is built here, and the encoding is unambiguous by construction:
//
//   transcript := varint(len(tag)) || tag || varint(fieldCount) || field*
//   field      := varint(len(bytes)) || bytes
//
// Length prefixes everywhere, on the tag and on every field, plus an explicit
// field count. No separator characters, no bare concatenation. That is what
// makes the encoding injective: given the bytes you can read back exactly one
// (tag, fields) pair, so two different field lists can never collide into the
// same transcript. `decodeTranscript` below is the executable witness for that
// claim — the round-trip is tested over adversarial inputs (empty fields,
// fields containing the tag, fields containing length bytes) rather than
// asserted in a comment.
//
// Injectivity of *this encoding* is a statement about the encoding alone. It
// says nothing about the hash applied afterwards; collision resistance of the
// digest is a separate, external assumption recorded in ASSUMPTIONS.md
// (ASSUMPTION-HASH-COLLISION-RESISTANCE).

import { concatBytes } from '../bytes/bytes.mjs';
import { encodeVarint, decodeVarint } from '../bytes/varint.mjs';
import { utf8Encode } from '../bytes/utf8.mjs';
import { MalformedInputError } from '../errors.mjs';

// Versioned tags. The version is inside the tag string, so a v1 transcript and
// a v2 transcript for the same purpose are different domains and can never be
// confused for one another.
export const DOMAIN_TAGS = Object.freeze({
  RAW_PAYLOAD: 'PB/v1/raw-payload',
  BUNDLE_TRANSCRIPT: 'PB/v1/bundle-transcript',
  MERKLE_LEAF: 'PB/v1/merkle-leaf',
  MERKLE_NODE: 'PB/v1/merkle-node',
  MMR_LEAF: 'PB/v1/mmr-leaf',
  MMR_PARENT: 'PB/v1/mmr-parent',
  DAG_NODE: 'PB/v1/dag-node',
  LINEAGE_EDGE: 'PB/v1/lineage-edge',
  SIGNATURE_TRANSCRIPT: 'PB/v1/signature-transcript',
  HYBRID_COMPONENT: 'PB/v1/hybrid-signature-component',
  KEM_COMPONENT: 'PB/v1/kem-component',
  HYBRID_KEM_COMBINER: 'PB/v1/hybrid-kem-combiner',
  POLICY_COMMITMENT: 'PB/v1/policy-commitment',
  KEY_IDENTIFIER: 'PB/v1/key-identifier',
  CERTIFICATE_COMMITMENT: 'PB/v1/certificate-commitment',
  TIMESTAMP_COMMITMENT: 'PB/v1/timestamp-commitment',
  REDACTION_COMMITMENT: 'PB/v1/redaction-commitment',
  DISCLOSURE_COMMITMENT: 'PB/v1/disclosure-commitment',
  ENCRYPTED_HEADER: 'PB/v1/encrypted-header',
  RELEASE_MANIFEST: 'PB/v1/release-manifest',
  THEOREM_VECTOR_RECORD: 'PB/v1/theorem-vector-record',
  LOG_RECORD: 'PB/v1/log-record',
  LOG_HEAD: 'PB/v1/log-head',
  SUBKEY_DERIVATION: 'PB/v1/subkey-derivation',
});

const KNOWN_TAGS = new Set(Object.values(DOMAIN_TAGS));

export function isKnownDomainTag(tag) { return KNOWN_TAGS.has(tag); }

function fieldToBytes(f, index) {
  if (f instanceof Uint8Array) return f;
  if (typeof f === 'string') return utf8Encode(f);
  throw new TypeError(`transcript field ${index}: expected Uint8Array or string, got ${typeof f}`);
}

// Build a domain-separated transcript. `tag` must be a registered tag —
// an unregistered tag throws rather than silently creating a new domain,
// so domains cannot be invented at a call site by accident.
export function buildTranscript(tag, fields = []) {
  if (!KNOWN_TAGS.has(tag)) throw new RangeError(`buildTranscript: unregistered domain tag ${JSON.stringify(tag)}`);
  if (!Array.isArray(fields)) throw new TypeError('buildTranscript: fields must be an array');
  const tagBytes = utf8Encode(tag);
  const parts = [encodeVarint(tagBytes.length), tagBytes, encodeVarint(fields.length)];
  for (let i = 0; i < fields.length; i++) {
    const b = fieldToBytes(fields[i], i);
    parts.push(encodeVarint(b.length), b);
  }
  return concatBytes(...parts);
}

// The decoder exists to make injectivity checkable rather than asserted:
// if every transcript decodes back to exactly the inputs that built it, no
// two distinct inputs share an encoding.
export function decodeTranscript(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('decodeTranscript: expected Uint8Array');
  let off = 0;
  const readVarint = (what) => {
    let r;
    try { r = decodeVarint(bytes, off); } catch (e) {
      throw new MalformedInputError(`decodeTranscript: bad varint for ${what}`, { predicate: 'transcript.varint', cause: e });
    }
    off += r.bytesRead;
    return r.value;
  };
  const tagLen = readVarint('tag length');
  if (off + tagLen > bytes.length) throw new MalformedInputError('decodeTranscript: tag length overruns input', { predicate: 'transcript.tagLength' });
  const tag = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(off, off + tagLen));
  off += tagLen;
  const count = readVarint('field count');
  const fields = [];
  for (let i = 0; i < count; i++) {
    const len = readVarint(`field ${i} length`);
    if (off + len > bytes.length) throw new MalformedInputError(`decodeTranscript: field ${i} length overruns input`, { predicate: 'transcript.fieldLength' });
    fields.push(bytes.slice(off, off + len));
    off += len;
  }
  if (off !== bytes.length) {
    throw new MalformedInputError(`decodeTranscript: ${bytes.length - off} trailing byte(s) after transcript`, { predicate: 'transcript.noTrailingBytes' });
  }
  return { tag, fields };
}
