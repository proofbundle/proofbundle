theorem no_hidden_information (d : Determination) :
  C0_UNCERT d ∧ d.suppressed_info → (d.hidden_U ≥ 0.2) := by
  intro ⟨h, suppressed⟩
  unfold C0_UNCERT in h
  exact h suppressed
