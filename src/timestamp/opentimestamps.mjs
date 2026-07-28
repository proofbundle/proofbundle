// A real OpenTimestamps calendar client: submission and proof parsing.
//
// This was NOT written from the OpenTimestamps spec document. It was
// written by fetching the actual python-opentimestamps reference
// implementation (opentimestamps/core/{op,notary,timestamp,serialize}.py)
// from GitHub, extracting the exact tag bytes and wire grammar, then
// validating the parser here against a real response captured from a live
// submission to https://alice.btc.calendar.opentimestamps.org — see
// vectors/timestamps/ots-live-capture-*.json, which record the literal
// bytes sent and received, not synthetic data.
//
// A prior version of this project's documentation stated timestamping
// services were unreachable from this environment. That was never tested;
// it was wrong. Outbound HTTPS works via the configured proxy. This module
// exists because someone asked "why the hell" instead of accepting the
// unverified claim.

import { decodeVarint, encodeVarint } from '../bytes/varint.mjs';
import { concatBytes } from '../bytes/bytes.mjs';

export const DEFAULT_CALENDARS = Object.freeze([
  'https://alice.btc.calendar.opentimestamps.org',
  'https://bob.btc.calendar.opentimestamps.org',
]);

// ---- tag tables, taken verbatim from the reference implementation -------

const PENDING_TAG = hexToBytes('83dfe30d2ef90c8e');
const BITCOIN_TAG = hexToBytes('0588960d73d71901');
const LITECOIN_TAG = hexToBytes('06869a0d73d71b45');

// tag byte -> { name, hasArg } — hasArg distinguishes BinaryOp (append,
// prepend — carry a varbytes argument) from UnaryOp (the hash functions
// and reverse/hexlify — operate on the running message with no argument).
const OPS = new Map([
  [0xf0, { name: 'append', hasArg: true }],
  [0xf1, { name: 'prepend', hasArg: true }],
  [0xf2, { name: 'reverse', hasArg: false }],
  [0xf3, { name: 'hexlify', hasArg: false }],
  [0x02, { name: 'sha1', hasArg: false }],
  [0x03, { name: 'ripemd160', hasArg: false }],
  [0x08, { name: 'sha256', hasArg: false }],
  [0x67, { name: 'keccak256', hasArg: false }],
]);

function hexToBytes(hex) { return Uint8Array.from(Buffer.from(hex, 'hex')); }

// ---- byte reader, built on this repo's own varint decoder ---------------

class Reader {
  constructor(bytes) { this.b = bytes; this.pos = 0; }
  readByte() {
    if (this.pos >= this.b.length) throw new RangeError('OTS parse: unexpected end of input');
    return this.b[this.pos++];
  }
  readBytes(n) {
    if (this.pos + n > this.b.length) throw new RangeError('OTS parse: unexpected end of input');
    const r = this.b.subarray(this.pos, this.pos + n);
    this.pos += n;
    return r;
  }
  readVarUint() {
    const { value, bytesRead } = decodeVarint(this.b, this.pos);
    this.pos += bytesRead;
    return value;
  }
  readVarBytes(maxLen = 8192) {
    const n = this.readVarUint();
    if (n > maxLen) throw new RangeError(`OTS parse: varbytes length ${n} exceeds maximum ${maxLen}`);
    return this.readBytes(n);
  }
  eof() { return this.pos >= this.b.length; }
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function parseAttestation(r) {
  const tag = r.readBytes(8);
  const payload = r.readVarBytes();
  if (bytesEqual(tag, PENDING_TAG)) {
    // PendingAttestation's payload is itself varbytes-wrapped around the
    // raw URI (TimeAttestation.serialize wraps whatever _serialize_payload
    // writes in an outer varbytes, and PendingAttestation._serialize_payload
    // writes ANOTHER varbytes around the URI) — a double length prefix.
    // Missing this was the one bug found while validating this parser
    // against the live-captured response: it produced a URI with a stray
    // leading byte until fixed.
    const pr = new Reader(payload);
    const uriBytes = pr.readVarBytes(1000);
    return { type: 'PendingAttestation', uri: new TextDecoder().decode(uriBytes) };
  }
  if (bytesEqual(tag, BITCOIN_TAG)) {
    const { value: height } = decodeVarint(payload, 0);
    return { type: 'BitcoinBlockHeaderAttestation', height };
  }
  if (bytesEqual(tag, LITECOIN_TAG)) {
    const { value: height } = decodeVarint(payload, 0);
    return { type: 'LitecoinBlockHeaderAttestation', height };
  }
  return { type: 'UnknownAttestation', tagHex: Buffer.from(tag).toString('hex'), payloadHex: Buffer.from(payload).toString('hex') };
}

function parseOp(r, tagByte) {
  const spec = OPS.get(tagByte);
  const arg = spec.hasArg ? r.readVarBytes() : null;
  return { kind: 'op', op: spec.name, arg, then: parseTimestampNode(r) };
}

function parseTimestampNode(r) {
  const nodes = [];
  for (;;) {
    if (r.eof()) break;
    const marker = r.readByte();
    if (marker === 0x00) {
      nodes.push({ kind: 'attestation', ...parseAttestation(r) });
      break;
    } else if (marker === 0xff) {
      const next = r.readByte();
      if (next === 0x00) {
        nodes.push({ kind: 'attestation', ...parseAttestation(r) });
      } else if (OPS.has(next)) {
        nodes.push(parseOp(r, next));
      } else {
        throw new RangeError(`OTS parse: unexpected byte 0x${next.toString(16)} after 0xff marker at offset ${r.pos}`);
      }
    } else if (OPS.has(marker)) {
      nodes.push(parseOp(r, marker));
      break; // an unprefixed op is always the last entry at this tree level
    } else {
      throw new RangeError(`OTS parse: unexpected marker byte 0x${marker.toString(16)} at offset ${r.pos}`);
    }
  }
  return nodes;
}

/**
 * Parse a raw OpenTimestamps calendar `/digest` response (the Timestamp
 * serialization, NOT the full `.ots` detached-file format, which adds a
 * magic header and version byte this function does not expect).
 */
export function parseTimestampResponse(bytes) {
  const r = new Reader(bytes);
  const tree = parseTimestampNode(r);
  if (r.pos !== bytes.length) {
    throw new RangeError(`OTS parse: ${bytes.length - r.pos} trailing bytes not consumed — response did not fully parse`);
  }
  return tree;
}

/** Walk a parsed tree and collect every PendingAttestation URI found. */
export function pendingCalendarUris(tree) {
  const uris = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.kind === 'attestation' && n.type === 'PendingAttestation') uris.push(n.uri);
      if (n.kind === 'op') walk(n.then);
    }
  };
  walk(tree);
  return uris;
}

/**
 * Submit a 32-byte SHA-256 digest to a calendar server and return the raw
 * response bytes plus the parsed tree. Network I/O — this is the one
 * function in this module that is not offline. Everything else (parsing,
 * tree walking) operates on bytes already received and works fully offline
 * given a previously-saved response, which is the normal case once a proof
 * has been fetched and stored.
 */
// Found live during this session: a real calendar server returned a
// transient HTTP 503 after several rapid requests during protocol
// exploration, and a bare retry with no delay succeeded immediately.
// Real external services do this; a client that gives up on the first 5xx
// is not honestly representing what "submission works" means in practice.
// Retries only on 5xx (server-side, plausibly transient) — never on 4xx
// (client error, retrying would not help and could mask a real bug).
export class CalendarUnavailableError extends Error {
  constructor(calendarUrl, status, attempts) {
    super(`submitDigest: ${calendarUrl} returned HTTP ${status} after ${attempts} attempt(s)`);
    this.name = 'CalendarUnavailableError';
    this.calendarUrl = calendarUrl;
    this.status = status;
    this.attempts = attempts;
  }
}

export async function submitDigest(digest32, calendarUrl = DEFAULT_CALENDARS[0], { fetchImpl = fetch, timeoutMs = 20000, retries = 2, retryDelayMs = 500 } = {}) {
  if (!(digest32 instanceof Uint8Array) || digest32.length !== 32) {
    throw new RangeError('submitDigest: expected a 32-byte SHA-256 digest');
  }
  let lastStatus = null;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${calendarUrl}/digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'application/vnd.opentimestamps.v1' },
        body: digest32,
        signal: controller.signal,
      });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        return { raw: buf, tree: parseTimestampResponse(buf), calendarUrl, attempts: attempt };
      }
      lastStatus = res.status;
      if (res.status < 500 || attempt > retries) break; // 4xx never retried; 5xx retried up to `retries` times
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
  }
  throw new CalendarUnavailableError(calendarUrl, lastStatus, retries + 1);
}

// Found live during this session: a single calendar can return a real
// HTTP 503 with an Envoy "upstream connect error ... TLS handshake
// failure" body — the calendar's own edge proxy failing to reach its
// origin, intermittently, unrelated to anything this client does (curl
// and this module's fetch calls both hit it, on different attempts,
// against the same URL). This is exactly the failure mode calendar
// redundancy exists to cover: submit to several calendars, accept
// whichever succeed. Relying on one calendar and treating its failure as
// "the service is unreachable" would misdiagnose a normal, expected
// characteristic of this kind of service as a hard blocker.
export async function submitToCalendars(digest32, calendarUrls = DEFAULT_CALENDARS, { minSuccesses = 1, ...submitOpts } = {}) {
  const results = await Promise.allSettled(calendarUrls.map((url) => submitDigest(digest32, url, submitOpts)));
  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') succeeded.push(r.value);
    else failed.push({ calendarUrl: calendarUrls[i], error: r.reason?.message ?? String(r.reason) });
  });
  if (succeeded.length < minSuccesses) {
    throw new Error(`submitToCalendars: only ${succeeded.length}/${calendarUrls.length} calendars succeeded (needed ${minSuccesses}). Failures: ${JSON.stringify(failed)}`);
  }
  return { succeeded, failed };
}

export { encodeVarint, concatBytes };
