theorem conjunctive_blocking {s : S} {i : I}
    (h : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution C1 C2 C3 C4 C5 s i := by
  unfold Attribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · -- Case ¬C1
    exact h1 hcontra.1
  · -- Case ¬C2
    exact h2 hcontra.2.1
  · -- Case ¬C3
    exact h3 hcontra.2.2.1
  · -- Case ¬C4
    exact h4 hcontra.2.2.2.1
  · -- Case ¬C5
    exact h5 hcontra.2.2.2.2
