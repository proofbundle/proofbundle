import Mathlib

/-!
# Parameterized ML-KEM Parameters (FIPS 203)

Generic parameters for all three security levels.
Instantiated for ML-KEM-512, ML-KEM-768, ML-KEM-1024.
Zero axioms. Zero sorries.
-/

namespace MlKem

/-- Security level determines all derived parameters. -/
inductive SecurityLevel
  | kem512
  | kem768
  | kem1024

def SecurityLevel.k : SecurityLevel → Nat
  | .kem512 => 2
  | .kem768 => 3
  | .kem1024 => 4

def SecurityLevel.η1 : SecurityLevel → Nat
  | .kem512 => 3
  | .kem768 => 2
  | .kem1024 => 2

def SecurityLevel.η2 : SecurityLevel → Nat
  | .kem512 => 2
  | .kem768 => 2
  | .kem1024 => 2

def SecurityLevel.d_u : SecurityLevel → Nat
  | .kem512 => 10
  | .kem768 => 10
  | .kem1024 => 11

def SecurityLevel.d_v : SecurityLevel → Nat
  | .kem512 => 4
  | .kem768 => 4
  | .kem1024 => 5

/-- Derived key sizes -/
def SecurityLevel.ekSize (sl : SecurityLevel) : Nat :=
  sl.k * 384 + 32

def SecurityLevel.dkSize (sl : SecurityLevel) : Nat :=
  sl.k * 384 + sl.ekSize + 32 + 32

def SecurityLevel.ctSize (sl : SecurityLevel) : Nat :=
  (sl.k * 256 * sl.d_u + 7) / 8 + (256 * sl.d_v + 7) / 8

/-- Verify sizes match FIPS 203 -/
theorem kem512_ek : SecurityLevel.ekSize .kem512 = 800 := rfl
theorem kem512_dk : SecurityLevel.dkSize .kem512 = 1632 := rfl
theorem kem512_ct : SecurityLevel.ctSize .kem512 = 768 := rfl

theorem kem768_ek : SecurityLevel.ekSize .kem768 = 1184 := rfl
theorem kem768_dk : SecurityLevel.dkSize .kem768 = 2400 := rfl
theorem kem768_ct : SecurityLevel.ctSize .kem768 = 1088 := rfl

theorem kem1024_ek : SecurityLevel.ekSize .kem1024 = 1568 := rfl
theorem kem1024_dk : SecurityLevel.dkSize .kem1024 = 3168 := rfl
theorem kem1024_ct : SecurityLevel.ctSize .kem1024 = 1568 := rfl

/-- Fixed parameters across all levels -/
def n : Nat := 256
def q : Nat := 3329

theorem n_pos : n > 0 := by decide
theorem q_pos : q > 0 := by decide
theorem q_prime : Nat.Prime q := by native_decide

def ζ : Nat := 17

theorem ζ_lt_q : ζ < q := by decide

def bitrev7 (i : Nat) : Nat :=
  let b0 := (i >>> 0) &&& 1
  let b1 := (i >>> 1) &&& 1
  let b2 := (i >>> 2) &&& 1
  let b3 := (i >>> 3) &&& 1
  let b4 := (i >>> 4) &&& 1
  let b5 := (i >>> 5) &&& 1
  let b6 := (i >>> 6) &&& 1
  b6 * 64 + b5 * 32 + b4 * 16 + b3 * 8 + b2 * 4 + b1 * 2 + b0

def γ (i : Fin 128) : Fin q :=
  ⟨ζ ^ (2 * bitrev7 i.val + 1) % q, by
    have h : ζ ^ (2 * bitrev7 i.val + 1) % q < q := Nat.mod_lt _ q_pos
    exact h⟩

end MlKem
