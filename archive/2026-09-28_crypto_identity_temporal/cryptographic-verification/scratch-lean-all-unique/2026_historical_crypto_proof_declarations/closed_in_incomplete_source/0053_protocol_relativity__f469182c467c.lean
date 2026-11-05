theorem protocol_relativity :
    ∃ f : Bool → VerdictType, f true ≠ f false := by
  refine ⟨protocol_relativity_witness, ?_⟩
  unfold protocol_relativity_witness; decide
