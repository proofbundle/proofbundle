def bigCheck (n : Nat) : Bool := (n * n + 1) % 7 == 0
-- assert something FALSE via native_decide's trust path is not possible directly,
-- but note the axiom is unconditional: it asserts the compiler's answer as truth.
theorem viaNative : bigCheck 20 = false := by native_decide
#print axioms viaNative
