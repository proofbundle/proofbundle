theorem score_insufficiency_C4 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C4 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.2.2.1
