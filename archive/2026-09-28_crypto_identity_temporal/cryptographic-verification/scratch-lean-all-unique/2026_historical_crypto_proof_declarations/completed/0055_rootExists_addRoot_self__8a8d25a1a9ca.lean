theorem rootExists_addRoot_self (R : Registry) (r : RootSig) :
    rootExists (addRoot R r) r.rid := by
  refine ⟨r, ?_, rfl⟩
  simp [addRoot]
