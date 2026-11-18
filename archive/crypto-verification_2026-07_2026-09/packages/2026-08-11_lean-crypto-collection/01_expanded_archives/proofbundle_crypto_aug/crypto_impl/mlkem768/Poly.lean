import MlKem768.Parameters

/-!
# Polynomial Arithmetic over R_q = Z_q[X]/(X^n + 1)

Total functions. No partiality. No axioms.
-/

namespace MlKem768

/-- Polynomial as a function from index to coefficient -/
def Poly : Type := Fin n → Fin q

/-- Zero polynomial -/
def polyZero : Poly := fun _ => ⟨0, by decide⟩

/-- One polynomial (constant 1) -/
def polyOne : Poly := fun i =>
  if i.val = 0 then ⟨1, by decide⟩ else ⟨0, by decide⟩

/-- Polynomial addition -/
def polyAdd (a b : Poly) : Poly := fun i =>
  ⟨(a i).val + (b i).val % q, Nat.mod_lt _ q_pos⟩

/-- Polynomial subtraction -/
def polySub (a b : Poly) : Poly := fun i =>
  ⟨(a i).val + q - (b i).val % q, Nat.mod_lt _ q_pos⟩

/-- Scalar multiplication -/
def polyScalarMul (c : Fin q) (a : Poly) : Poly := fun i =>
  ⟨(c.val * (a i).val) % q, Nat.mod_lt _ q_pos⟩

/-- Schoolbook multiplication in R_q.
    c_k = Σ_{i+j≡k (mod n)} a_i * b_j * (if i+j < n then 1 else -1) -/
def polyMul (a b : Poly) : Poly := fun k =>
  let sum := Nat.sum (List.range n) fun i =>
    let j := (k.val + n - i) % n
    let ai := a ⟨i, by omega⟩
    let bj := b ⟨j, by omega⟩
    let prod := (ai.val * bj.val) % q
    if i + j < n then prod else (q - prod) % q
  ⟨sum % q, Nat.mod_lt _ q_pos⟩

/-- Dot product as vectors -/
def polyDot (a b : Poly) : Fin q :=
  let s := Nat.sum (List.range n) fun i =>
    let ai := a ⟨i, by omega⟩
    let bi := b ⟨i, by omega⟩
    (ai.val * bi.val) % q
  ⟨s % q, Nat.mod_lt _ q_pos⟩

/-- Extensional equality -/
def polyEq (a b : Poly) : Prop := ∀ i, a i = b i

/-- NTT domain representation (same type, different semantic interpretation) -/
def NttPoly : Type := Fin n → Fin q

/-- Component-wise multiplication in NTT domain -/
def nttMul (a b : NttPoly) : NttPoly := fun i =>
  ⟨(a i).val * (b i).val % q, Nat.mod_lt _ q_pos⟩

/-- NTT-domain addition -/
def nttAdd (a b : NttPoly) : NttPoly := fun i =>
  ⟨(a i).val + (b i).val % q, Nat.mod_lt _ q_pos⟩

/-- NTT-domain subtraction -/
def nttSub (a b : NttPoly) : NttPoly := fun i =>
  ⟨(a i).val + q - (b i).val % q, Nat.mod_lt _ q_pos⟩

/-- Identity conversion: Poly -> NttPoly -/
def polyToNtt (p : Poly) : NttPoly := p

/-- Identity conversion: NttPoly -> Poly -/
def nttToPoly (p : NttPoly) : Poly := p

/-- Zero NTT polynomial -/
def nttZero : NttPoly := fun _ => ⟨0, by decide⟩

end MlKem768
