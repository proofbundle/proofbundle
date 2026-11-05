theorem clementine_consistent :
  collapse clementine_state ∧ scalar clementine_state.psi = 1.0 := by
  exact ⟨clementine_below_horizon, clementine_alive⟩
