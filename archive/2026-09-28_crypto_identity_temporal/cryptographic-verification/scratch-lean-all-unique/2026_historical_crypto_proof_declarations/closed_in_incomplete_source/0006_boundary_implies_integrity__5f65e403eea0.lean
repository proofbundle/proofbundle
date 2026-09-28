theorem boundary_implies_integrity (s : Sys) :
    passesBoundary chkI chkB s → passesIntegrity chkI s :=
  fun ⟨hi, _⟩ => hi
