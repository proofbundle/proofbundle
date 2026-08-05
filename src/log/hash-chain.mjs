// Append-only hash chain with monotone sequence numbers.
//
// Each record commits to (sequence, previousRecordHash, payload) under the
// LOG_RECORD domain. Two properties are enforced by construction and tested:
//
//   - Sequence numbers are monotone with no gaps: appending is the only way
//     to add a record and it always uses lastSequence + 1.
//   - A record's hash depends on its predecessor's hash, so editing record k
//     changes every hash from k onward. Verification recomputes the whole
//     chain, so a rewritten middle record is detected at the first recomputed
//     link, not merely suspected.
//
// This detects tampering by anyone who cannot also reissue every later head.
// It does not by itself stop the log's own operator from publishing two
// divergent chains; that is what fork detection against signed heads is for.

import { digestBytes } from '../digest/digest.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { encodeVarint } from '../bytes/varint.mjs';
import { MalformedInputError } from '../errors.mjs';

export const DEFAULT_LOG_DIGEST = 'SHA-256';

export function recordHash(digestAlg, sequence, previousHash, payload) {
  return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.LOG_RECORD, [encodeVarint(sequence), previousHash, payload]));
}

// The genesis predecessor is the digest of the empty LOG_RECORD domain, so
// "no previous record" is a specific value rather than a zero-filled buffer
// an attacker could also produce as a real record hash.
export function genesisHash(digestAlg = DEFAULT_LOG_DIGEST) {
  return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.LOG_RECORD, []));
}

export class HashChainLog {
  #records = [];
  #digestAlg;
  constructor({ digestAlg = DEFAULT_LOG_DIGEST } = {}) { this.#digestAlg = digestAlg; }

  get length() { return this.#records.length; }
  get digestAlg() { return this.#digestAlg; }
  get records() { return this.#records.map((r) => ({ ...r })); }

  head() {
    if (this.#records.length === 0) return { sequence: -1, hash: genesisHash(this.#digestAlg), digestAlg: this.#digestAlg };
    const last = this.#records[this.#records.length - 1];
    return { sequence: last.sequence, hash: last.hash, digestAlg: this.#digestAlg };
  }

  append(payload) {
    if (!(payload instanceof Uint8Array)) throw new TypeError('HashChainLog.append: payload must be Uint8Array');
    const prev = this.head();
    const sequence = prev.sequence + 1;
    const hash = recordHash(this.#digestAlg, sequence, prev.hash, payload);
    this.#records.push({ sequence, previousHash: prev.hash, payload, hash });
    return { sequence, hash };
  }
}

// Recompute the whole chain. Returns the first inconsistency found, which is
// deterministic (lowest sequence first) rather than whichever check happened
// to run first.
export function verifyChain(records, { digestAlg = DEFAULT_LOG_DIGEST } = {}) {
  let expectedPrev = genesisHash(digestAlg);
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.sequence !== i) {
      return { ok: false, failure: 'SEQUENCE_NOT_MONOTONE', at: i, expected: i, actual: r.sequence };
    }
    if (Buffer.compare(Buffer.from(r.previousHash), Buffer.from(expectedPrev)) !== 0) {
      return { ok: false, failure: 'PREVIOUS_HASH_MISMATCH', at: i };
    }
    const h = recordHash(digestAlg, r.sequence, r.previousHash, r.payload);
    if (Buffer.compare(Buffer.from(h), Buffer.from(r.hash)) !== 0) {
      return { ok: false, failure: 'RECORD_HASH_MISMATCH', at: i };
    }
    expectedPrev = r.hash;
  }
  return { ok: true, length: records.length, head: expectedPrev };
}

// A later head must extend an earlier one. If the earlier head's hash is not
// the hash of the later chain at that sequence, the log was rewritten.
export function verifyExtends(earlierHead, laterRecords, { digestAlg = DEFAULT_LOG_DIGEST } = {}) {
  if (earlierHead.sequence < 0) return { ok: true, reason: 'EARLIER_HEAD_IS_GENESIS' };
  if (earlierHead.sequence >= laterRecords.length) {
    return { ok: false, failure: 'ROLLBACK', reason: `earlier head at sequence ${earlierHead.sequence} is beyond later log length ${laterRecords.length}` };
  }
  const atSeq = laterRecords[earlierHead.sequence];
  if (!atSeq) throw new MalformedInputError('verifyExtends: missing record at earlier head sequence', { predicate: 'log.recordPresent' });
  const same = Buffer.compare(Buffer.from(atSeq.hash), Buffer.from(earlierHead.hash)) === 0;
  return same ? { ok: true } : { ok: false, failure: 'FORK', reason: `record ${earlierHead.sequence} differs from the previously published head` };
}
