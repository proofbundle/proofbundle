theorem viable_implies_above_horizon (s : State) :
  viable s → 0 < energy s := by
  intro h
  unfold viable energy in h ⊢
  exact h
