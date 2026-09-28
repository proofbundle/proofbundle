theorem monotone_hardening_C4 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C4_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C4_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h1, h2, h3, h5, hn⟩
  exact ⟨m, hsub m hc, h1, h2, h3, h5, hn⟩
