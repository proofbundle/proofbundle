/-
  Arithmetic on Nat, proved from first principles.
  Term-mode structural induction only. No tactic is used that could
  introduce Classical.choice, propext, or Quot.sound.
-/
namespace Pack.Arith

theorem addZero (n : Nat) : n + 0 = n := rfl

theorem addSucc (n m : Nat) : n + Nat.succ m = Nat.succ (n + m) := rfl

theorem zeroAdd : ∀ n : Nat, 0 + n = n
  | 0          => rfl
  | Nat.succ n => congrArg Nat.succ (zeroAdd n)

theorem succAdd : ∀ n m : Nat, Nat.succ n + m = Nat.succ (n + m)
  | _, 0          => rfl
  | n, Nat.succ m => congrArg Nat.succ (succAdd n m)

theorem addComm : ∀ n m : Nat, n + m = m + n
  | n, 0          => (zeroAdd n).symm
  | n, Nat.succ m => Eq.trans (congrArg Nat.succ (addComm n m)) (succAdd m n).symm

theorem addAssoc : ∀ n m k : Nat, (n + m) + k = n + (m + k)
  | _, _, 0          => rfl
  | n, m, Nat.succ k => congrArg Nat.succ (addAssoc n m k)

theorem mulZero (n : Nat) : n * 0 = 0 := rfl

theorem zeroMul : ∀ n : Nat, 0 * n = 0
  | 0          => rfl
  | Nat.succ n => Eq.trans (addZero (0 * n)) (zeroMul n)

end Pack.Arith
