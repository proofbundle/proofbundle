theorem lineage_implies_boundary (s : Sys) :
    passesLineage chkI chkB chkL s → passesBoundary chkI chkB s :=
  fun ⟨hi, hb, _⟩ => ⟨hi, hb⟩
