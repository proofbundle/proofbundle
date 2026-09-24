inductive P : Type where
  | one : P
  | twice : P → P
  | twicePlusOne : P → P
  deriving DecidableEq

inductive E : Type where
  | a : E
  | b : E
  | c : E
  deriving DecidableEq

theorem t_omega (x y : Nat) : 2*x+1+2*y+1 = 2*(x+y+1) := by omega
theorem t_decP : P.twice P.one ≠ P.one := by decide
theorem t_decE : E.a ≠ E.b := by decide
theorem t_bycases (x L : Nat) : x + 1 = L ∨ x + 1 ≠ L := by
  by_cases h : x + 1 = L
  · exact Or.inl h
  · exact Or.inr h
theorem t_ifpos (L x : Nat) (h : x + 1 = L) : (if x + 1 = L then 0 else 1) = 0 := by rw [if_pos h]
theorem t_div (k L : Nat) (h : 0 < L) : k % L < L := Nat.mod_lt k h
theorem t_divmod (k L : Nat) : L * (k / L) + k % L = k := Nat.div_add_mod k L

#print axioms t_omega
#print axioms t_decP
#print axioms t_decE
#print axioms t_bycases
#print axioms t_ifpos
#print axioms t_div
#print axioms t_divmod
#print axioms Nat.add_mul
#print axioms Nat.one_mul
#print axioms Nat.mul_add
#print axioms Nat.add_assoc
#print axioms Nat.add_comm
#print axioms Nat.add_left_comm
#print axioms Nat.lt_of_le_of_ne
#print axioms Nat.succ_le_of_lt
#print axioms Nat.zero_mul
#print axioms Nat.add_mul_div_right
#print axioms Nat.div_eq_of_lt
#print axioms Nat.add_mul_mod_self_right
#print axioms Nat.mod_eq_of_lt
#print axioms List.cons.inj
#print axioms Nat.add_right_cancel
#print axioms Nat.mul_comm
