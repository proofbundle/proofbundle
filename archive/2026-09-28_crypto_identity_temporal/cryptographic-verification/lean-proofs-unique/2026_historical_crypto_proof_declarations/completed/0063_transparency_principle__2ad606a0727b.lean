theorem transparency_principle (d : Determination) :
  constraint_information_transparency d ∧ d.information_suppressed →
  (d.hidden_uncertainty_penalty ≥ 0.2) := by
  intro ⟨h, suppressed⟩
  unfold constraint_information_transparency in h
  exact h suppressed
