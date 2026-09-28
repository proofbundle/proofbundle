theorem conjunctive_blocking (S : System) (I : Interval) :
    (¬ C1 S I ∨ ¬ C2 S I ∨ ¬ C3 S I ∨ ¬ C4 S I ∨ ¬ C5 S I) →
    ¬ Attribution C1 C2 C3 C4 C5 S I := by
  intro h ⟨h1, h2, h3, h4, h5⟩
  rcases h with n | n | n | n | n <;> exact n (by assumption)
