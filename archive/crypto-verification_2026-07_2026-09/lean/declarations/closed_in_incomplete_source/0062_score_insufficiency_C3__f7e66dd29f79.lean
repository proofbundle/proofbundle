theorem score_insufficiency_C3 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C3 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.2.1
