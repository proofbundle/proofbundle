theorem coreCandidate_support_ge_three (R : Registry) (r : RootSig) :
    coreCandidate R r → 3 ≤ R.supportCount r.rid := by
  intro h
  exact h.2.2.1
