theorem single_witness (w : WID) (root : MRoot) :
    allWitnessesValid witnessSigValid [w] root = witnessSigValid w root := by
  simp [allWitnessesValid, List.all]
  rfl
