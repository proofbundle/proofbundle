theorem setCell_other_root (L : Ledger) (r₁ r₂ : RootId) (o : Operator8) (s : Status)
    (h : r₂ ≠ r₁) : setCell L r₁ o s r₂ o = L r₂ o := by
  simp [setCell, h]
