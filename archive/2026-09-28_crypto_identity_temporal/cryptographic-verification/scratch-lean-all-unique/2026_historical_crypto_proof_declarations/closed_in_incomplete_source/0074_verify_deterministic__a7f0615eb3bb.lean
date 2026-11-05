theorem verify_deterministic (b : Bundle) (c : Context) (k : Key) :
    ∃! o, verify stage1 stage2 stage3 stage4 stage5 stage6 stage7 stage8 stage9 b c k = o :=
  ⟨_, rfl, fun _ h => h.symm⟩
