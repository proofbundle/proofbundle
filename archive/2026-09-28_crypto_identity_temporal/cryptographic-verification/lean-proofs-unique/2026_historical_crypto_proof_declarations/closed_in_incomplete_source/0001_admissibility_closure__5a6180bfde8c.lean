theorem admissibility_closure {s : S} {i : I} {u : S → S}
    (hatt : Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
            (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i)
    (hu : u ∈ perturbations)
    (heps : d_G u < ε) :
    C3 perturbations d_G Corr ε (u s) i := by
  unfold Attribution at hatt
  have hC3 := hatt.2.2.1
  apply hC3
  · exact hu
  · exact heps
