theorem condition_independence_C3 (s : System) (i : Interval) :
    Spoofable_on_C3 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C1 → matches_on m s i C2 →
            matches_on m s i C4 → matches_on m s i C5 →
            matches_on m s i C3) := by
  rintro ⟨m, h1, h2, h4, h5, hn3⟩ himp
  exact hn3 (himp m h1 h2 h4 h5)
