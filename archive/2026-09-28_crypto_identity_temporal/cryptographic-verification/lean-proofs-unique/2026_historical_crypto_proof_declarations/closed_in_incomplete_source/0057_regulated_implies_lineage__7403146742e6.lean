theorem regulated_implies_lineage (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesLineage chkI chkB chkL s :=
  fun ⟨hi, hb, hl, _⟩ => ⟨hi, hb, hl⟩
