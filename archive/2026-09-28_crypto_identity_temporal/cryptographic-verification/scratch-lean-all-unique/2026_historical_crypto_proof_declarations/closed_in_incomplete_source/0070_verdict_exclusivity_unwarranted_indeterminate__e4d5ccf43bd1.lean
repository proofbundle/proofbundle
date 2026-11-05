theorem verdict_exclusivity_unwarranted_indeterminate :
    (Verdict.UNWARRANTED : Verdict) ≠ Verdict.INDETERMINATE := by
  decide
