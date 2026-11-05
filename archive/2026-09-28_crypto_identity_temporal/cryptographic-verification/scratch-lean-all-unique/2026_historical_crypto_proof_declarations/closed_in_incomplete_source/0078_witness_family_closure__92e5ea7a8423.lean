theorem witness_family_closure {s : S} {i : I} {a1 a2 : A}
    (h1 : predictive_info s a1 i > η)
    (h2 : predictive_info s a2 i > η) :
    ∃ a3 : A, predictive_info s a3 i > η := by
  exact ⟨a1, h1⟩
