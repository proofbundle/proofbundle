theorem proportionality_principle (d : Determination) :
  constraint_proportionality d → (d.consequence_magnitude ≤ d.confidence_level * d.severity_level) := by
  intro h
  exact h
