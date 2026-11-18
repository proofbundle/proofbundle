theorem recovery_by_capacity_increase (s : State) (dC : ℝ) :
  collapse s →
  dC > (s.U - s.C) + s.λ_coeff * s.D →
  viable { s with C := s.C + dC } := by
  intro h_collapse h_dC
  unfold viable collapse energy in *
  linarith
