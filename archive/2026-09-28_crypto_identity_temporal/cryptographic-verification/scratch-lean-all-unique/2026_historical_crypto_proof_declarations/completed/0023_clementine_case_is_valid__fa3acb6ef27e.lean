theorem clementine_case_is_valid : is_admissible clementine_case := by
  unfold is_admissible constraint_life_preservation constraint_reversibility
         constraint_no_manufactured_crisis constraint_innocence_priority
         constraint_fallibility constraint_proportionality constraint_information_transparency
         constraint_separation_of_powers clementine_case
  simp
  norm_num
