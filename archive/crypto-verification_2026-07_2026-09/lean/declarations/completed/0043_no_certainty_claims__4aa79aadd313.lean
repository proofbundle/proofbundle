theorem no_certainty_claims (d : Determination) :
  C0_FALLIBLE d → (d.confidence < 1.0) := by
  intro h
  exact h
