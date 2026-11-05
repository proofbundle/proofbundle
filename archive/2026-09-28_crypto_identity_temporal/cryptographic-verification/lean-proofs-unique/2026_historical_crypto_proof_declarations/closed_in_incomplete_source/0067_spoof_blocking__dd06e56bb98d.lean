theorem spoof_blocking {M s : S} {i : I}
    (hM : M ∈ spoof_class)
    (hpr : Pr_equiv M s < 1 - γ) :
    ¬ C5 Cert ζ γ M i := by
  unfold C5 non_spoofable
  intro h
  have hns := h.2
  specialize hns M hM
  linarith
