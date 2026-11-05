theorem clementine_energy_correct :
  energy clementine_state = -0.91 := by
  unfold energy clementine_state
  norm_num
