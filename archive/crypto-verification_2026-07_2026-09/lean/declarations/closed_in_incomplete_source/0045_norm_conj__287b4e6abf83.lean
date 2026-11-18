theorem norm_conj (s : Sedenion) : norm (conj s) = norm s := by
  unfold norm norm_sq conj
  simp [Finset.sum_congr]
  ring
