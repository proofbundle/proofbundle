theorem witness_existence {s : S} {i : I}
    (hC2 : C2 A predictive_info self_info η s i) :
    ∃ a : A, predictive_info s a i > η := by
  unfold C2 at hC2
  rcases hC2 with ⟨a, τ, hτ, hpred, _⟩
  exact ⟨a, hpred⟩
