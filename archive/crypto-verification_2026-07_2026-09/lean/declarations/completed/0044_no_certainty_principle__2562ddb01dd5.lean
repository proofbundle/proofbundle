theorem no_certainty_principle (d : Determination) :
  constraint_fallibility d → (d.confidence_level < 1.0) := by
  intro h
  exact h
