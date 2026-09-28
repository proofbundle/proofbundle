theorem condition_independence_C2 (S : System) (I : Interval) :
    Spoofable_on_C2 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C2) := by
  intro ⟨M, hm1, hm3, hm4, hm5, hn2⟩ himp
  exact hn2 (himp M hm1 hm3 hm4 hm5)
