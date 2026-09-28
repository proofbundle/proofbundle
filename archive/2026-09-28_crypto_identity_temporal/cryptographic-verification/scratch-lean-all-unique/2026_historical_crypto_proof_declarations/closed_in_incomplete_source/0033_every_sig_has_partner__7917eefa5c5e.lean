theorem every_sig_has_partner (s : SigAlg) :
    ∃ d : DigestAlg, compatible d s = true := by
  cases s <;> first | exact ⟨.sha256, rfl⟩ | exact ⟨.sha384, rfl⟩ | exact ⟨.sha512, rfl⟩
