theorem score_insufficiency {s : S} {i : I}
    (_hcert : Certification Cert s i > θ)
    (hfail : ¬ C1 Delta_split partitions δ s i ∨ ¬ C2 A predictive_info self_info η s i ∨
             ¬ C3 perturbations d_G Corr ε s i ∨ ¬ C4 Loss λ s i ∨ ¬ C5 Cert ζ γ s i) :
    ¬ Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
      (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i := by
  apply conjunctive_blocking
  assumption
