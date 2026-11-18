theorem null_vs_negative :
    NullStructurallyUnresolvable ≠ NonAttributionVerdict ∧
    NullInsufficientlyTested     ≠ NonAttributionVerdict := by
  refine ⟨?_, ?_⟩ <;> decide
