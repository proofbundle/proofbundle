import Pack.Arith
/-
  List lemmas, proved from first principles.
-/
universe u

namespace Pack.Lists

theorem appendNil {α : Type u} : ∀ (l : List α), l ++ [] = l
  | []      => rfl
  | x :: xs => congrArg (x :: ·) (appendNil xs)

theorem nilAppend {α : Type u} (l : List α) : [] ++ l = l := rfl

theorem appendAssoc {α : Type u} : ∀ (l m k : List α),
    (l ++ m) ++ k = l ++ (m ++ k)
  | [],      _, _ => rfl
  | x :: xs, m, k => congrArg (x :: ·) (appendAssoc xs m k)

theorem lengthAppend {α : Type u} : ∀ (l m : List α),
    (l ++ m).length = l.length + m.length
  | [],      m => (Pack.Arith.zeroAdd m.length).symm
  | x :: xs, m =>
      Eq.trans (congrArg Nat.succ (lengthAppend xs m))
               (Pack.Arith.succAdd xs.length m.length).symm

end Pack.Lists
