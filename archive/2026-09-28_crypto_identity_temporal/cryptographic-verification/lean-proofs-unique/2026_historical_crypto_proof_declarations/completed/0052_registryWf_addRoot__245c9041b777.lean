theorem registryWf_addRoot (R : Registry) (r : RootSig)
    (hWf : registryWf R)
    (hFresh : r.rid ∉ R.rootIds) :
    registryWf (addRoot R r) := by
  rcases hWf with ⟨hNodup, hCells⟩
  constructor
  · simp [addRoot, rootIds, hFresh, hNodup]
  · intro c hc
    have hc' : c ∈ R.cells := by simpa [addRoot] using hc
    exact rootExists_mono_addRoot R r c.rootId (hCells c hc')
