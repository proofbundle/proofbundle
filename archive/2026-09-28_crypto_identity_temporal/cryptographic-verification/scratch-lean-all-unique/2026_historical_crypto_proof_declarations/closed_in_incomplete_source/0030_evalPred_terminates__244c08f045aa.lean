theorem evalPred_terminates (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    ∃ r, evalPred fuel ctx ea p = r := ⟨_, rfl⟩
