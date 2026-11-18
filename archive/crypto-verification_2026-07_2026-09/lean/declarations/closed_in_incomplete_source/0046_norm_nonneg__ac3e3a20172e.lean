theorem norm_nonneg (s : Sedenion) : 0 ≤ norm s := by
  unfold norm
  exact Real.sqrt_nonneg _
