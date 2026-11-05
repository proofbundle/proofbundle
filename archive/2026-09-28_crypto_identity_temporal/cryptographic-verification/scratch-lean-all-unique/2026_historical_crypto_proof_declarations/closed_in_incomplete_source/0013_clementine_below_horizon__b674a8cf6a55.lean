theorem clementine_below_horizon :
  collapse clementine_state := by
  unfold collapse clementine_state energy
  norm_num
