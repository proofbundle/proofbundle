theorem condition_independence_C3 (S : System) (I : Interval) :
    Spoofable_on_C3 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C3) := by
  intro ⟨M, hm1, hm2, hm4, hm5, hn3⟩ himp
  exact hn3 (himp M hm1 hm2 hm4 hm5)
