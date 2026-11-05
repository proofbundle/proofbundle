-- Three ways to prove the same decidable fact, audited side by side.

def bigCheck (n : Nat) : Bool := (n * n + 1) % 7 == 0

theorem viaRfl  : bigCheck 20 = false := rfl
theorem viaDecide : bigCheck 20 = false := by decide
theorem viaNative : bigCheck 20 = false := by native_decide

#print axioms viaRfl
#print axioms viaDecide
#print axioms viaNative
