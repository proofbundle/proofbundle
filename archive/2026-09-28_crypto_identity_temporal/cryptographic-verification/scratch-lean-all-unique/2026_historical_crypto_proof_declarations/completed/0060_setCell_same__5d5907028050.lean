theorem setCell_same (L : Ledger) (r : RootId) (o : Operator8) (s : Status) :
    setCell L r o s r o = s := by
  simp [setCell]
