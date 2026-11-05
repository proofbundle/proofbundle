theorem score_insufficiency_C1 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C1 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.1
