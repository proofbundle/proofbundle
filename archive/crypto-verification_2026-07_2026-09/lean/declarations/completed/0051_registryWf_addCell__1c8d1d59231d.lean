theorem registryWf_addCell (R : Registry) (c : Cell)
    (hWf : registryWf R)
    (hRoot : rootExists R c.rootId) :
    registryWf (addCell R c) := by
  rcases hWf with ⟨hNodup, hCells⟩
  constructor
  · simpa [addCell] using hNodup
  · intro c' hc'
    rcases hc' with rfl | hc''
    · simpa [cellWf] using hRoot
    · exact hCells c' hc''
