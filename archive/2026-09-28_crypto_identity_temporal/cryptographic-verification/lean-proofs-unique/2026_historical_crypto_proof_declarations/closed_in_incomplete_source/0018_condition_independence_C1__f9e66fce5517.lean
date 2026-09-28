theorem condition_independence_C1 (s : System) (i : Interval) :
    Spoofable_on_C1 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C2 → matches_on m s i C3 →
            matches_on m s i C4 → matches_on m s i C5 →
            matches_on m s i C1) := by
  rintro ⟨m, h2, h3, h4, h5, hn1⟩ himp
  exact hn1 (himp m h2 h3 h4 h5)
