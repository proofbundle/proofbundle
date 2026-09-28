-- Which TACTICS introduce axioms, independent of what they prove?
theorem t_rfl    (n : Nat) : n + 0 = n := rfl
theorem t_omega  (n : Nat) : n + 0 = n := by omega
theorem t_simp   (n : Nat) : n + 0 = n := by simp
theorem t_decide : (2:Nat) + 2 = 4 := by decide
theorem t_ind    : ∀ n : Nat, 0 + n = n
  | 0 => rfl
  | Nat.succ n => congrArg Nat.succ (t_ind n)

#print axioms t_rfl
#print axioms t_omega
#print axioms t_simp
#print axioms t_decide
#print axioms t_ind
