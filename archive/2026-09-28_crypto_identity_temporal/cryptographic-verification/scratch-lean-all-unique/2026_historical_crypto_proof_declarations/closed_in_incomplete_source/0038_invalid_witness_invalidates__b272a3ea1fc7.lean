theorem invalid_witness_invalidates (w : WID) (ws : List WID) (root : MRoot) :
    witnessSigValid w root = false →
    allWitnessesValid witnessSigValid (w :: ws) root = false := by
  intro h
  simp [allWitnessesValid, List.all]
  simp [h]
