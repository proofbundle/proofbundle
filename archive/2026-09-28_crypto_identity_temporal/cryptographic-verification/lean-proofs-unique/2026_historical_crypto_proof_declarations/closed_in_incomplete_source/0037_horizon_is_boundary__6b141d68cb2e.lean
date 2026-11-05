theorem horizon_is_boundary (s : State) :
  viable s ∨ collapse s ∨ at_horizon s 0.1 := by
  unfold viable collapse at_horizon energy
  by_cases h : 0 < s.C - s.U - s.λ_coeff * s.D
  · left; exact h
  by_cases h' : s.C - s.U - s.λ_coeff * s.D < 0
  · right; left; exact h'
  · right; right
    simp [abs_sub_lt_iff]
    omega
