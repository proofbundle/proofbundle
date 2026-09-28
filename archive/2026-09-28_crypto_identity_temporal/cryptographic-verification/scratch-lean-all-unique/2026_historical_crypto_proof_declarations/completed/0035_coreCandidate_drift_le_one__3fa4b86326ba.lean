theorem coreCandidate_drift_le_one (R : Registry) (r : RootSig) :
    coreCandidate R r → r.drift ≤ 1 := by
  intro h
  exact h.2.1.2
