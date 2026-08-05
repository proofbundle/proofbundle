// RFC 3161 timestamp requests and responses (Time-Stamp Protocol, TSP).
//
// Scope, stated plainly: this builds a conformant TimeStampReq and parses a
// TimeStampResp far enough to recover the asserted time and the message
// imprint(s) it carries, and to check that an imprint matches a digest this
// caller holds. It does not validate the TSA's CMS SignedData signature or
// certificate chain — that requires a trust anchor this module is not given,
// exactly the gap the offline verifier this was ported from documented via
// "one `openssl ts -verify` away." Binding (imprint present in the token)
// and asserted time are what can be checked without one; that is what
// `verifyBinding` below reports, and nothing more.
//
// The DER reader is a generic bounded walk: it never reads past the buffer,
// caps recursion depth and total node count, and returns MALFORMED rather
// than throwing an unrelated error on truncated or hostile input.

import { MalformedInputError } from '../errors.mjs';

const HASH_OIDS = new Map([
  ['SHA-256', { der: Uint8Array.of(0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01), length: 32 }],
  ['SHA-384', { der: Uint8Array.of(0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x02), length: 48 }],
  ['SHA-512', { der: Uint8Array.of(0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x03), length: 64 }],
]);
const DIGEST_LENGTHS = new Set([...HASH_OIDS.values()].map((v) => v.length).concat([20])); // 20: legacy SHA-1 imprints, verify-only context

function lenBytes(n) {
  if (n < 0x80) return [n];
  const b = [];
  let x = n;
  while (x > 0) { b.unshift(x & 0xff); x >>= 8; }
  return [0x80 | b.length, ...b];
}
function tlv(tag, contentArrays) {
  const content = [].concat(...contentArrays);
  return [tag, ...lenBytes(content.length), ...content];
}
function derInteger(bytes) {
  let b = [...bytes];
  while (b.length > 1 && b[0] === 0x00 && (b[1] & 0x80) === 0) b.shift();
  if (b[0] & 0x80) b = [0x00, ...b];
  return tlv(0x02, [b]);
}
function derIntegerFromNonNegative(n) {
  if (typeof n === 'bigint') {
    if (n < 0n) throw new RangeError('rfc3161: nonce must be non-negative');
    let hex = n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return derInteger(Buffer.from(hex, 'hex'));
  }
  if (!Number.isInteger(n) || n < 0) throw new RangeError('rfc3161: nonce must be a non-negative integer or bigint');
  const b = [];
  let x = n;
  do { b.unshift(x & 0xff); x = Math.floor(x / 256); } while (x > 0);
  return derInteger(Uint8Array.from(b));
}

export function buildTimestampRequest(digest, { hashAlg = 'SHA-256', nonce = null, certReq = true } = {}) {
  if (!(digest instanceof Uint8Array)) throw new TypeError('buildTimestampRequest: digest must be a Uint8Array');
  const spec = HASH_OIDS.get(hashAlg);
  if (!spec) throw new RangeError(`buildTimestampRequest: unsupported hashAlg ${JSON.stringify(hashAlg)}`);
  if (digest.length !== spec.length) throw new RangeError(`buildTimestampRequest: ${hashAlg} digest must be ${spec.length} bytes, got ${digest.length}`);

  const algId = tlv(0x30, [spec.der, [0x05, 0x00]]); // AlgorithmIdentifier with NULL params
  const messageImprint = tlv(0x30, [algId, tlv(0x04, [[...digest]])]);
  const parts = [derInteger([1]), messageImprint];
  if (nonce !== null) parts.push(derIntegerFromNonNegative(nonce));
  if (certReq) parts.push([0x01, 0x01, 0xff]);
  return Uint8Array.from(tlv(0x30, parts));
}

// -- generic bounded DER walk, used for parsing responses -------------------

const MAX_DEPTH = 32;
const MAX_NODES = 20000;

function readNode(buf, pos, end) {
  if (pos + 2 > end) return null;
  const tag = buf[pos];
  let len = buf[pos + 1];
  let headerLen = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) return null; // indefinite-length or absurd length-of-length: not TSP DER
    if (pos + 2 + n > end) return null;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | buf[pos + 2 + i];
    headerLen = 2 + n;
  }
  const contentStart = pos + headerLen;
  const contentEnd = contentStart + len;
  if (len < 0 || contentEnd > end) return null;
  return { tag, contentStart, contentEnd, nextPos: contentEnd };
}

function walk(buf, start, end, depth, budget, out) {
  if (depth > MAX_DEPTH) throw new MalformedInputError('rfc3161: DER nesting exceeds bound', { predicate: 'rfc3161.depthBounded' });
  let pos = start;
  while (pos < end) {
    if (budget.n++ > MAX_NODES) throw new MalformedInputError('rfc3161: DER node count exceeds bound', { predicate: 'rfc3161.nodeCountBounded' });
    const node = readNode(buf, pos, end);
    if (!node) throw new MalformedInputError('rfc3161: truncated or invalid DER TLV', { predicate: 'rfc3161.derWellFormed' });
    out.push(node);
    const constructed = (node.tag & 0x20) !== 0 || node.tag === 0x30 || node.tag === 0x31;
    if (constructed && node.contentEnd > node.contentStart) {
      walk(buf, node.contentStart, node.contentEnd, depth + 1, budget, out);
    }
    pos = node.nextPos;
  }
}

function generalizedTimeToISO(bytes) {
  const s = Buffer.from(bytes).toString('ascii').replace('Z', '');
  if (!/^\d{14}(\.\d+)?$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`;
}

export function parseTimestampResponse(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('parseTimestampResponse: bytes must be a Uint8Array');
  if (bytes.length < 4) throw new MalformedInputError('rfc3161: response too short to be a TimeStampResp', { predicate: 'rfc3161.minLength' });

  const nodes = [];
  walk(bytes, 0, bytes.length, 0, { n: 0 }, nodes);
  if (nodes.length === 0 || nodes[0].tag !== 0x30) {
    throw new MalformedInputError('rfc3161: response is not a top-level DER SEQUENCE', { predicate: 'rfc3161.topLevelSequence' });
  }

  // PKIStatusInfo is the first child SEQUENCE; its first child is the status INTEGER.
  const top = nodes[0];
  const children = nodes.filter((n) => n !== top && n.contentStart >= top.contentStart && n.contentEnd <= top.contentEnd);
  const statusInfo = children.find((n) => n.tag === 0x30 && n.contentStart >= top.contentStart);
  let status = null;
  if (statusInfo) {
    const statusInt = nodes.find((n) => n.tag === 0x02 && n.contentStart >= statusInfo.contentStart && n.contentStart < statusInfo.contentEnd);
    if (statusInt) status = bytes[statusInt.contentStart]; // small non-negative PKIStatus values fit one byte
  }

  const genTimes = nodes.filter((n) => n.tag === 0x18).map((n) => generalizedTimeToISO(bytes.subarray(n.contentStart, n.contentEnd))).filter(Boolean);
  const imprintHex = [...new Set(
    nodes.filter((n) => n.tag === 0x04 && DIGEST_LENGTHS.has(n.contentEnd - n.contentStart))
      .map((n) => Buffer.from(bytes.subarray(n.contentStart, n.contentEnd)).toString('hex')),
  )];

  return Object.freeze({
    status,
    granted: status === 0 || status === 1,
    genTimeISO: genTimes[0] ?? null,
    imprints: imprintHex,
  });
}

// Binding only: does this response carry an imprint equal to `digest`. Not a
// signature check — see the module-level scope note.
export function verifyBinding(parsedResponse, digest) {
  if (!(digest instanceof Uint8Array)) throw new TypeError('verifyBinding: digest must be a Uint8Array');
  const hex = Buffer.from(digest).toString('hex');
  return parsedResponse.imprints.includes(hex);
}
