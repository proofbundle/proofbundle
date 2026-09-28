theorem rootExists_mono_addRoot (R : Registry) (r : RootSig) (i : Nat) :
    rootExists R i → rootExists (addRoot R r) i := by
  intro h
  rcases h with ⟨r0, hr0, hid⟩
  refine ⟨r0, ?_, hid⟩
  simp [addRoot, hr0]
