theorem score_insufficiency {s : S} {i : I}
    (_hcert : Cert s i)
    (hfail : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution C1 C2 C3 C4 C5 s i := by
  apply conjunctive_blocking
  assumption
