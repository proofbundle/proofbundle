theorem collapse_implies_below_horizon (s : State) :
  collapse s → energy s < 0 := by
  intro h
  unfold collapse energy in h ⊢
  exact h
