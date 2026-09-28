theorem outcome_exclusive :
    Outcome.verified ≠ Outcome.malformed ∧
    Outcome.verified ≠ Outcome.invalidSignature ∧
    Outcome.verified ≠ Outcome.outOfBounds ∧
    Outcome.verified ≠ Outcome.unknownVersion ∧
    Outcome.verified ≠ Outcome.missingSideInfo ∧
    Outcome.verified ≠ Outcome.lineageInvalid ∧
    Outcome.verified ≠ Outcome.resourceExhausted ∧
    Outcome.verified ≠ Outcome.policyDenied ∧
    Outcome.verified ≠ Outcome.indeterminate ∧
    Outcome.verified ≠ Outcome.notDefinedInVersion := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
