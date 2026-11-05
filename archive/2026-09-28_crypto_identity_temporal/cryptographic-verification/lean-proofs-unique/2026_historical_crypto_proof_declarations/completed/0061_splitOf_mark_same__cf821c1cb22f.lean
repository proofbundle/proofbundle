theorem splitOf_mark_same (S : SystemState) (r : RootId) (b : Bool) :
    splitOf (applyUpdate S (.markSplitU r b)) r = b := by
  simp [applyUpdate, splitOf]
