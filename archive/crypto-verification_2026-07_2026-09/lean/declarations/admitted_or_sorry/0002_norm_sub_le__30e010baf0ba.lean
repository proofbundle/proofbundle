theorem norm_sub_le (s t : Sedenion) :
  |norm s - norm t| ≤ norm (fun i => s i - t i) := by
  sorry -- Would use Minkowski inequality from mathlib
