theorem coreCandidate_clarity_ge_two (R : Registry) (r : RootSig) :
    coreCandidate R r → 2 ≤ r.clarity := by
  intro h
  exact h.2.1.1
