theorem monotone_hardening_C1 (S : System) (I : Interval)
    (cls cls' : ComparisonModel → Prop) :
    (∀ M, cls M → cls' M) →
    Spoofable_on_C1_in C1 C2 C3 C4 C5 matches_on cls S I →
    Spoofable_on_C1_in C1 C2 C3 C4 C5 matches_on cls' S I := by
  intro hsub ⟨M, hcls, hm2, hm3, hm4, hm5, hn1⟩
  exact ⟨M, hsub M hcls, hm2, hm3, hm4, hm5, hn1⟩
