theorem verdict_exhaustive_all (v : Verdict) :
    v = .attributed ∨ v = .notAttributed ∨ v = .nullInsufficient ∨
    v = .nullUnresolvable ∨ v = .indeterminate := by
  cases v <;> simp
