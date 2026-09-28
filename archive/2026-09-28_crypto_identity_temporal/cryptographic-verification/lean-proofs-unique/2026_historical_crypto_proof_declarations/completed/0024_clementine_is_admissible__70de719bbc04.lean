theorem clementine_is_admissible : Admissible clementine_determination := by
  unfold Admissible C0_LIFE C0_REV C0_VORTEX C0_INNOCENT
           C0_FALLIBLE C0_PROP C0_UNCERT C0_ANTICONC clementine_determination
  simp
  norm_num
