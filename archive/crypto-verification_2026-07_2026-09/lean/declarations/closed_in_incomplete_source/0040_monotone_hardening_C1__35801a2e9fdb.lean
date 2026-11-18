theorem monotone_hardening_C1 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C1_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C1_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h2, h3, h4, h5, hn⟩
  exact ⟨m, hsub m hc, h2, h3, h4, h5, hn⟩
