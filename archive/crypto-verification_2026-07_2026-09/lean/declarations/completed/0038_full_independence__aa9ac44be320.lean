theorem full_independence (S : System) (I : Interval) :
    AdversarialSufficiency C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C2 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C1) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C2) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C3) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C5 → matches_on M S I C4) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C4 → matches_on M S I C5) := by
  intro ⟨h1, h2, h3, h4, h5⟩
  exact ⟨condition_independence_C1 C1 C2 C3 C4 C5 matches_on S I h1,
         condition_independence_C2 C1 C2 C3 C4 C5 matches_on S I h2,
         condition_independence_C3 C1 C2 C3 C4 C5 matches_on S I h3,
         condition_independence_C4 C1 C2 C3 C4 C5 matches_on S I h4,
         condition_independence_C5 C1 C2 C3 C4 C5 matches_on S I h5⟩
