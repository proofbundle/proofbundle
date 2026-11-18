theorem regulated_implies_integrity (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesIntegrity chkI s :=
  fun h => boundary_implies_integrity chkI chkB s
    (lineage_implies_boundary chkI chkB chkL s
      (regulated_implies_lineage chkI chkB chkL chkR s h))
