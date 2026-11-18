theorem proportionality_holds (d : Determination) :
  C0_PROP d → (d.flow ≤ d.confidence * d.severity) := by
  intro h
  exact h
