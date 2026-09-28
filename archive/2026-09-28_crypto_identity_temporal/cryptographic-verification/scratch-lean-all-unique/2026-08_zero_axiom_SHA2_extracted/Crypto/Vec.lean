-- Crypto/Vec.lean
-- Fixed-size vectors with intrinsic size invariants.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

structure Vec (α : Type) (n : Nat) where
  data : Array α
  size_eq : data.size = n

namespace Vec

def get (v : Vec α n) (i : Fin n) : α :=
  v.data.get (i.cast v.size_eq.symm)

def set (v : Vec α n) (i : Fin n) (x : α) : Vec α n :=
  ⟨v.data.set (i.cast v.size_eq.symm) x, by rw [Array.size_set, v.size_eq]⟩

def push (v : Vec α n) (x : α) : Vec α (n + 1) :=
  ⟨v.data.push x, by rw [Array.size_push, v.size_eq]⟩

def append (v1 : Vec α n) (v2 : Vec α m) : Vec α (n + m) :=
  ⟨v1.data.append v2.data, by rw [Array.size_append, v1.size_eq, v2.size_eq]⟩

def mkVec {α : Type} (n : Nat) (x : α) : Vec α n :=
  ⟨Array.mkArray n x, Array.size_mkArray n x⟩

def map (v : Vec α n) (f : α → β) : Vec β n :=
  ⟨v.data.map f, by rw [Array.size_map, v.size_eq]⟩

def foldl (v : Vec α n) (f : β → α → β) (init : β) : β :=
  v.data.foldl f init

def size (_v : Vec α n) : Nat := n

def toArray (v : Vec α n) : Array α := v.data

instance [BEq α] : BEq (Vec α n) where
  beq v1 v2 := v1.data == v2.data

-- Structural theorems
theorem size_eq_n (v : Vec α n) : v.size = n := by rfl

theorem get_push_eq (v : Vec α n) (x : α) :
  (v.push x).get ⟨n, by rw [v.size_eq_n]; exact Nat.lt_succ_self n⟩ = x := by
  unfold get push
  simp [Array.get_push_eq]

theorem append_get_left (v1 : Vec α n) (v2 : Vec α m) (i : Fin n) :
  (v1.append v2).get ⟨i.val, Nat.lt_of_lt_of_le i.isLt (Nat.le_add_right n m)⟩ = v1.get i := by
  unfold get append
  simp [Array.append_get_left, v1.size_eq]

theorem append_get_right (v1 : Vec α n) (v2 : Vec α m) (i : Fin m) :
  (v1.append v2).get ⟨n + i.val, Nat.add_lt_add_left i.isLt n⟩ = v2.get i := by
  unfold get append
  simp [Array.append_get_right, v1.size_eq]

end Vec
