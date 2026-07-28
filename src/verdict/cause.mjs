// The Result shape every verifier-family function returns. Structurally
// enforces "exactly one terminal verdict": `code` is a single value, not a
// list, and `Result.of` is the only constructor, so nothing downstream can
// build a result with two terminal codes even by mistake.
//
// `warnings` is deliberately inert with respect to `code` — nothing in this
// module lets a warning array change what `code` is, which is what
// "warnings cannot silently convert failure into VERIFIED" means at the
// type level rather than only as a policy statement.

import { assertValidVerdict } from './verdict.mjs';

let seq = 0;
function nextOrdinal() { return seq++; } // deterministic cause ordering: insertion order, not Set/Map iteration order of anything unordered

export class Cause {
  constructor({ code, predicate, path = null, algorithmId = null, keyId = null, signerId = null, evidenceId = null, policyId = null, message = null }) {
    assertValidVerdict(code);
    this.code = code;
    this.predicate = predicate ?? null;
    this.path = path;
    this.algorithmId = algorithmId;
    this.keyId = keyId;
    this.signerId = signerId;
    this.evidenceId = evidenceId;
    this.policyId = policyId;
    this.message = message;
    this.ordinal = nextOrdinal();
    Object.freeze(this);
  }
}

export class Result {
  constructor(code, { cause = null, causes = [], warnings = [], remediation = null } = {}) {
    assertValidVerdict(code);
    if (cause && causes.length) throw new TypeError('Result: pass either `cause` or `causes`, not both');
    this.code = code;
    this.causes = Object.freeze(cause ? [cause] : [...causes]);
    this.warnings = Object.freeze([...warnings]);
    this.remediation = remediation;
    Object.freeze(this);
  }

  static of(code, opts) { return new Result(code, opts); }

  get isVerified() { return this.code === 'VERIFIED' || this.code === 'VERIFIED_WITH_WARNINGS'; }
  get isFailure() { return !this.isVerified; }
}

// Deterministic cause ordering: by insertion (`ordinal`), not by any
// unordered collection's iteration order.
export function orderedCauses(causes) {
  return [...causes].sort((a, b) => a.ordinal - b.ordinal);
}
