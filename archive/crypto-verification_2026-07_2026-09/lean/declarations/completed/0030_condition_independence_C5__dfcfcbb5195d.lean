theorem condition_independence_C5 (S : System) (I : Interval) :
    Spoofable_on_C5 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C4 →
       matches_on M S I C5) := by
  intro ⟨M, hm1, hm2, hm3, hm4, hn5⟩ himp
  exact hn5 (himp M hm1 hm2 hm3 hm4)
