theorem protocol_relativity_strong :
    ∀ v1 v2 : VerdictType, v1 ≠ v2 →
    ∃ f : Bool → VerdictType, f true = v1 ∧ f false = v2 := by
  intro v1 v2 _
  exact ⟨fun b => if b then v1 else v2, rfl, rfl⟩
