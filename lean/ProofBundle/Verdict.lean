-- SPDX-License-Identifier: GPL-3.0-or-later
namespace ProofBundle.Verdict

inductive Verdict where
  | verified
  | verifiedWithWarnings
  | malformed
  | unsupportedVersion
  | unknownVersion
  | unsupportedAlgorithm
  | unknownAlgorithm
  | deprecatedAlgorithm
  | forbiddenAlgorithm
  | digestMismatch
  | invalidSignature
  | missingSignature
  | insufficientSignatures
  | unexpectedSigner
  | unknownSigner
  | revokedKey
  | expiredKey
  | keyNotYetValid
  | certificateInvalid
  | certificatePathInvalid
  | certificateUntrusted
  | certificateRevocationIndeterminate
  | timestampInvalid
  | timestampUntrusted
  | timestampIndeterminate
  | bundleExpired
  | bundleNotYetValid
  | lineageInvalid
  | lineageCycle
  | lineageMissing
  | ancestorUnavailable
  | payloadMissing
  | sideInformationMissing
  | policyDenied
  | policyIndeterminate
  | resourceExhausted
  | limitExceeded
  | providerUnavailable
  | externalServiceUnavailable
  | evidenceIncomplete
  | negative
  | null
  | indeterminate
  | notDefined
  | internalError
  deriving DecidableEq, Repr

def isVerified (v : Verdict) : Bool :=
  match v with
  | .verified | .verifiedWithWarnings => true
  | _ => false

theorem verified_isVerified : isVerified .verified = true := rfl

theorem verifiedWithWarnings_isVerified : isVerified .verifiedWithWarnings = true := rfl

theorem isVerified_soundness (v : Verdict) :
    isVerified v = true ↔ v = .verified ∨ v = .verifiedWithWarnings := by
  constructor
  · intro h
    cases v <;> try { exact Or.inl rfl } <;> try { exact Or.inr rfl } <;> contradiction
  · intro h
    cases h <;> subst v <;> rfl

theorem malformed_not_verified : isVerified .malformed = false := rfl

theorem digestMismatch_not_verified : isVerified .digestMismatch = false := rfl

theorem isVerified_false_iff (v : Verdict) :
    isVerified v = false ↔ v ≠ .verified ∧ v ≠ .verifiedWithWarnings := by
  constructor
  · intro h
    cases v <;> try { constructor <;> intro h_eq <;> injection h_eq } <;> contradiction
  · intro h
    cases v <;> unfold isVerified <;> try { rfl } <;> contradiction

end ProofBundle.Verdict
