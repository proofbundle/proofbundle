theorem power_distribution_principle (d : Determination) :
  constraint_separation_of_powers d →
  ¬(d.has_specification_control ∧ d.has_verification_control ∧ d.has_enforcement_control) := by
  intro h
  exact h
