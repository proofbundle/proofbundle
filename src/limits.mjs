// Every bound in one place, as data. Two properties matter and both are
// tested rather than asserted:
//
//   1. Limits are checked against *declared* sizes before allocation, so a
//      hostile "I contain 2^32 elements" header costs a comparison, not a
//      buffer.
//   2. Exceeding a limit is deterministic — same input, same limit, same
//      terminal verdict — and that verdict is LIMIT_EXCEEDED or
//      RESOURCE_EXHAUSTED, never VERIFIED.

import { LimitExceededError, ResourceExhaustedError } from './errors.mjs';

export const DEFAULT_LIMITS = Object.freeze({
  maxNestingDepth: 64,
  maxCollectionSize: 65536,
  maxStringLength: 1 << 20,        // 1 MiB of UTF-8
  maxByteStringLength: 1 << 24,    // 16 MiB
  maxTotalInputBytes: 1 << 26,     // 64 MiB
  maxMerkleDepth: 64,              // => at most 2^64 leaves addressable
  maxMerkleProofNodes: 64,
  maxMmrPeaks: 64,
  maxLineageNodes: 100000,
  maxLineageParents: 256,
  maxLineageDepth: 4096,
  maxSignaturesPerBundle: 256,
  maxRecipientsPerBundle: 256,
  maxExtensionsPerBundle: 256,
  maxTraversalSteps: 1000000,
});

export function withLimits(overrides = {}) {
  const merged = { ...DEFAULT_LIMITS, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (!Number.isSafeInteger(v) || v < 0) throw new RangeError(`limit ${k} must be a non-negative safe integer, got ${v}`);
  }
  return Object.freeze(merged);
}

export function checkLimit(actual, limit, label, opts = {}) {
  if (!Number.isSafeInteger(actual) || actual < 0) {
    throw new LimitExceededError(`${label}: value ${actual} is not a non-negative safe integer`, { predicate: `limit.${label}`, ...opts });
  }
  if (actual > limit) {
    throw new LimitExceededError(`${label}: ${actual} exceeds limit ${limit}`, { predicate: `limit.${label}`, ...opts });
  }
  return actual;
}

// A step budget for bounded traversal. Callers tick once per visited node or
// edge; running out is RESOURCE_EXHAUSTED, which is a distinct verdict from
// LIMIT_EXCEEDED (a declared size was too big) on purpose — one means the
// input announced something too large, the other means the work did.
export class StepBudget {
  #remaining;
  #initial;
  constructor(steps) {
    if (!Number.isSafeInteger(steps) || steps < 0) throw new RangeError('StepBudget: steps must be a non-negative safe integer');
    this.#remaining = steps;
    this.#initial = steps;
  }
  tick(n = 1) {
    this.#remaining -= n;
    if (this.#remaining < 0) {
      throw new ResourceExhaustedError(`traversal exceeded its step budget of ${this.#initial}`, { predicate: 'resource.stepBudget' });
    }
    return this.#remaining;
  }
  get remaining() { return this.#remaining; }
  get spent() { return this.#initial - this.#remaining; }
}
