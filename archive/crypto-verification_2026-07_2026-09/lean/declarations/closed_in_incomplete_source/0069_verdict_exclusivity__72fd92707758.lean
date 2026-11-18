theorem verdict_exclusivity :
    AttributionVerdict          ≠ NonAttributionVerdict         ∧
    AttributionVerdict          ≠ NullInsufficientlyTested      ∧
    AttributionVerdict          ≠ NullStructurallyUnresolvable  ∧
    AttributionVerdict          ≠ IndeterminateVerdict          ∧
    NonAttributionVerdict       ≠ NullInsufficientlyTested      ∧
    NonAttributionVerdict       ≠ NullStructurallyUnresolvable  ∧
    NonAttributionVerdict       ≠ IndeterminateVerdict          ∧
    NullInsufficientlyTested    ≠ NullStructurallyUnresolvable  ∧
    NullInsufficientlyTested    ≠ IndeterminateVerdict          ∧
    NullStructurallyUnresolvable ≠ IndeterminateVerdict := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
