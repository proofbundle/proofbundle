theorem conjunctive_blocking (s : System) (i : Interval)
    (h : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro ⟨h1, h2, h3, h4, h5, _⟩
  rcases h with hc1 | hc2 | hc3 | hc4 | hc5
  · exact hc1 h1
  · exact hc2 h2
  · exact hc3 h3
  · exact hc4 h4
  · exact hc5 h5
