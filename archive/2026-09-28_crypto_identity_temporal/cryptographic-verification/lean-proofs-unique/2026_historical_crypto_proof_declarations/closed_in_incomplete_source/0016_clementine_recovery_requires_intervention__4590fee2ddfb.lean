theorem clementine_recovery_requires_intervention :
  ¬(viable clementine_state) ∧
  ∀ dC, 0 < dC →
    let s' := { clementine_state with C := clementine_state.C + dC }
    viable s' ↔ dC > 0.91 := by
  constructor
  · unfold viable collapse clementine_state energy
    norm_num
  intro dC h_dC
  constructor
  · intro h_viable
    unfold viable clementine_state energy in h_viable
    linarith
  intro h_bound
    unfold viable clementine_state energy
    linarith
