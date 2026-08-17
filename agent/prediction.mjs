/**
 * Falsifiable predictions — sealed claims about future outcomes.
 *
 * An agent commits to a predicate (e.g. "lake build exits 0 with 0 axioms")
 * BEFORE the outcome is known. The commit_hash = SHA-256(predicate) is sealed
 * in the envelope. Later, a verifier agent resolves it: confirmed or
 * falsified. If valid_until passes with no resolution, auto-expire.
 *
 * This is the falsifiable prediction ledger from ProofBundle, applied
 * to agent work.
 */
import { createHash } from 'node:crypto';
import { canonicalJSON } from './envelope.mjs';

/** SHA-256 hex of canonical JSON. */
function sha256Hex(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Create a falsifiable prediction.
 * @param {string} predicate — the claim (e.g. "lake build ProofBundle Architecture exits 0")
 * @param {object} opts — { validFrom, validUntil, context }
 * @returns {object} Prediction object (to embed in an envelope)
 */
export function createPrediction(predicate, {
  validFrom = null,
  validUntil = null,
  context = null,
} = {}) {
  const now = new Date();
  const commitHash = sha256Hex(canonicalJSON({ predicate, context }));
  return {
    predicate,
    commit_hash: commitHash,
    valid_from: validFrom || now.toISOString(),
    valid_until: validUntil || new Date(now.getTime() + 3600_000).toISOString(), // 1h default
    context,
    outcome: null,           // null | "confirmed" | "falsified" | "expired"
    outcome_sealed_at: null,
    outcome_envelope_seq: null,
    outcome_verifier: null,  // agent_id of verifier
  };
}

/**
 * Check if a prediction has expired (valid_until passed, no outcome).
 * @returns {boolean} true if should be auto-expired
 */
export function isExpired(prediction) {
  if (prediction.outcome) return false;
  return new Date() > new Date(prediction.valid_until);
}

/**
 * Compute a resolved COPY of a prediction. Never mutates its argument —
 * this codebase treats sealed content as append-only everywhere else
 * (envelopes are never rewritten; see bridge.mjs), and a prediction embedded
 * in an already-sealed envelope is exactly that: sealed content.
 *
 * NOTE: this is a pure helper, not the live resolution path. The actual
 * bridge (bridge.mjs predictionStatus) resolves a prediction by scanning the
 * lineage for a later "verdict" envelope whose payload.body.resolve_seq
 * matches, and computing the outcome on read — it never touches the
 * original prediction object. Call this only if you are building a
 * standalone prediction record outside that flow and need the resulting
 * shape; it is unused by the bridge itself as of this writing.
 * @param {object} prediction — the prediction to resolve (not mutated)
 * @param {string} outcome — "confirmed" | "falsified"
 * @param {string} verifierAgentId — who is resolving it
 * @param {number} envelopeSeq — seq of the resolving envelope
 * @returns {object} a new prediction object with the outcome applied
 */
export function resolvePrediction(prediction, outcome, verifierAgentId, envelopeSeq) {
  if (prediction.outcome) return prediction; // already resolved — no-op, still no mutation
  return {
    ...prediction,
    outcome,
    outcome_sealed_at: new Date().toISOString(),
    outcome_envelope_seq: envelopeSeq,
    outcome_verifier: verifierAgentId,
  };
}

/**
 * Verify that a commit_hash matches the predicate.
 * (Prevents retrospective claim-tampering.)
 */
export function verifyCommit(prediction) {
  const expected = sha256Hex(canonicalJSON({
    predicate: prediction.predicate,
    context: prediction.context,
  }));
  return expected === prediction.commit_hash;
}
