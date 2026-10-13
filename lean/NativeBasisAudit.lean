-- SPDX-License-Identifier: GPL-3.0-or-later
-- Abstract interface/model audit. This does not claim refinement of JS crypto.
import ProofBundle.Bytes
import ProofBundle.Canonical
import ProofBundle.Digest
import ProofBundle.Verdict
import ProofBundle.Temporal
#print axioms ProofBundle.Canonical.canonicalize_injective
#print axioms ProofBundle.Canonical.parse_canonicalize_idempotent
#print axioms ProofBundle.Digest.digestBytes_deterministic
#print axioms ProofBundle.Digest.digestBytes_some_implies_implemented
#print axioms ProofBundle.Verdict.digestMismatch_not_verified
#print axioms ProofBundle.Verdict.malformed_not_verified
#print axioms ProofBundle.Verdict.isVerified_soundness
#print axioms ProofBundle.Temporal.sound_requires_precedence
