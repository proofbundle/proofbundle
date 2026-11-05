theorem separation_of_powers (d : Determination) :
  C0_ANTICONC d → ¬(d.control_spec ∧ d.control_verify ∧ d.control_enforce) := by
  intro h
  exact h
