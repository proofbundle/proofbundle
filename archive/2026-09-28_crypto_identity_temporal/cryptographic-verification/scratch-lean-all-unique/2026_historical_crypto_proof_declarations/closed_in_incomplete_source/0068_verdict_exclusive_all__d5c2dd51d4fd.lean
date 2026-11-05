theorem verdict_exclusive_all :
    Verdict.attributed ≠ Verdict.notAttributed ∧
    Verdict.attributed ≠ Verdict.nullInsufficient ∧
    Verdict.attributed ≠ Verdict.nullUnresolvable ∧
    Verdict.attributed ≠ Verdict.indeterminate ∧
    Verdict.notAttributed ≠ Verdict.nullInsufficient ∧
    Verdict.notAttributed ≠ Verdict.nullUnresolvable ∧
    Verdict.notAttributed ≠ Verdict.indeterminate ∧
    Verdict.nullInsufficient ≠ Verdict.nullUnresolvable ∧
    Verdict.nullInsufficient ≠ Verdict.indeterminate ∧
    Verdict.nullUnresolvable ≠ Verdict.indeterminate := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
