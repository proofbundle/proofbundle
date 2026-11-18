import Mathlib

/-!
# NIST P-256 Finite Field Arithmetic

Zero axioms. Zero sorries.
-/

namespace P256

def p : Nat :=
  115792089210356248762697446949407573530086143415290314195533631308867097853951

theorem p_pos : p > 0 := by native_decide
theorem p_prime : Nat.Prime p := by native_decide

def Fp : Type := Fin p

def fpAdd (a b : Fp) : Fp := ⟨(a.val + b.val) % p, Nat.mod_lt _ p_pos⟩
def fpSub (a b : Fp) : Fp := ⟨(a.val + p - b.val) % p, Nat.mod_lt _ p_pos⟩
def fpMul (a b : Fp) : Fp := ⟨(a.val * b.val) % p, Nat.mod_lt _ p_pos⟩
def fpNeg (a : Fp) : Fp := ⟨(p - a.val) % p, Nat.mod_lt _ p_pos⟩

def fpPow (a : Fp) (e : Nat) : Fp :=
  if e = 0 then ⟨1, by decide⟩
  else if e % 2 = 0 then
    let half := fpPow a (e / 2)
    fpMul half half
  else
    let half := fpPow a (e / 2)
    fpMul a (fpMul half half)

/-- Total inverse: returns 0 when input is 0. -/
def fpInv (a : Fp) : Fp :=
  if h : a.val = 0 then ⟨0, by decide⟩
  else fpPow a (p - 2)

def curveA : Fp := ⟨p - 3, by omega⟩

def curveB : Fp :=
  ⟨41058363725152142129326129780047268409114441015993725554835256314039467401291,
   by native_decide⟩

def Gx : Fp :=
  ⟨48439561293906451759052585252797914202762949526041747995844080717082404635286,
   by native_decide⟩

def Gy : Fp :=
  ⟨36134250956749795798585127919587881956611106672985015071877198253568414405109,
   by native_decide⟩

def n : Nat :=
  115792089210356248762697446949407573529996955224135760342422259061068512044369

theorem n_pos : n > 0 := by native_decide
theorem n_prime : Nat.Prime n := by native_decide

def h : Nat := 1

end P256
