theorem evalPred_atom (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (a : BAtom) :
    evalPred (fuel + 1) ctx ea (.atom a) = some (ea ctx a) := rfl
