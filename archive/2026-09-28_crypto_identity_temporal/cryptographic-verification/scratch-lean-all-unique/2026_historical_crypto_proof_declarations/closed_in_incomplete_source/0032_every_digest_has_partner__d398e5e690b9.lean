theorem every_digest_has_partner (d : DigestAlg) :
    ∃ s : SigAlg, compatible d s = true := by
  cases d <;> exact ⟨.ed25519, rfl⟩
