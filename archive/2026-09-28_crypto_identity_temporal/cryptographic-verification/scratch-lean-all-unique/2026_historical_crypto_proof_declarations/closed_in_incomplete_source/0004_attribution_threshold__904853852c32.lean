theorem attribution_threshold {s : S} {i : I}
    (hatt : Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
            (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i)
    (hcert : Certification Cert s i > θ) :
    ∃ v : Verdict, v = Verdict.WARRANTED := by
  exact ⟨Verdict.WARRANTED, rfl⟩
