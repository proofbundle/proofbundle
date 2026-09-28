theorem outcome_exhaustive (o : Outcome) :
    o = .verified ∨ o = .malformed ∨ o = .invalidSignature ∨
    o = .outOfBounds ∨ o = .unknownVersion ∨ o = .missingSideInfo ∨
    o = .lineageInvalid ∨ o = .resourceExhausted ∨ o = .policyDenied ∨
    o = .indeterminate ∨ o = .notDefinedInVersion := by
  cases o <;> simp
