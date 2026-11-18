theorem evalPred_zero (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    evalPred 0 ctx ea p = none := by cases p <;> rfl
