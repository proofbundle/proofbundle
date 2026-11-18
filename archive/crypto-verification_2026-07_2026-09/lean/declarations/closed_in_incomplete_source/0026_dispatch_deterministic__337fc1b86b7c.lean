theorem dispatch_deterministic (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) :
    ∃! b : Bool, dispatchVerify vEd vP256 vP384 vP521 vRSA2 vRSA3 vRSA4 alg k m s = b :=
  ⟨_, rfl, fun _ h => h.symm⟩
