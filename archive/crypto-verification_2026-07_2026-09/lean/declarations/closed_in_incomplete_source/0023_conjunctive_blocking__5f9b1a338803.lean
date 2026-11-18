theorem conjunctive_blocking {s : S} {i : I}
    (h : ¬ C1 Delta_split partitions δ s i ∨ ¬ C2 A predictive_info self_info η s i ∨
         ¬ C3 perturbations d_G Corr ε s i ∨ ¬ C4 Loss λ s i ∨ ¬ C5 Cert ζ γ s i) :
    ¬ Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
      (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i := by
  unfold Attribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · exact h1 hcontra.1
  · exact h2 hcontra.2.1
  · exact h3 hcontra.2.2.1
  · exact h4 hcontra.2.2.2.1
  · exact h5 hcontra.2.2.2.2
