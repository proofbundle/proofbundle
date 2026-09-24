#print axioms Nat.mul_assoc
#print axioms Nat.ne_of_lt
#print axioms Nat.le_add_right
#print axioms Nat.lt_of_lt_of_le
#print axioms Nat.zero_lt_succ
#print axioms Nat.succ.inj
#print axioms List.append_nil
#check @Nat.add_one_mul
#print axioms Nat.add_one_mul
theorem twoPow : 2 ^ 64 / 9192631770 = 2006688023 := by decide
#print axioms twoPow
inductive T where | one | succ : T → T
theorem noConf (b : Nat) (h : 2 * 0 = 2 * b + 1) : False := nomatch h
#print axioms noConf
theorem noConf2 (b : Nat) (h : 0 = 2 * (b + 1)) : False := nomatch h
#print axioms noConf2
