theorem condition_independence_C1 (S : System) (I : Interval) :
    Spoofable_on_C1 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C2 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C1) := by
  intro ⟨M, hm2, hm3, hm4, hm5, hn1⟩ himp
  exact hn1 (himp M hm2 hm3 hm4 hm5)
