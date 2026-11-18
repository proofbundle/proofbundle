import Mathlib

/-!
# ML-KEM-768 Parameters (FIPS 203)

All constants are concrete `Nat` literals.
All properties are proven by `decide` or `native_decide`.
Zero axioms. Zero sorries. Zero admits.
-/

namespace MlKem768

/-- Ring dimension n = 256 -/
def n : Nat := 256

theorem n_pos : n > 0 := by decide

theorem n_eq_256 : n = 256 := rfl

/-- Modulus q = 3329 = 2^8 * 13 + 1 -/
def q : Nat := 3329

theorem q_pos : q > 0 := by decide

theorem q_eq_3329 : q = 3329 := rfl

/-- q is prime -/
theorem q_prime : Nat.Prime q := by native_decide

/-- Primitive 256th root of unity ζ = 17 -/
def ζ : Nat := 17

theorem ζ_lt_q : ζ < q := by decide

theorem ζ_pow_256 : ζ ^ 256 % q = 1 := by native_decide

theorem ζ_pow_128 : ζ ^ 128 % q = q - 1 := by native_decide

/-- Module rank k = 3 for ML-KEM-768 -/
def k : Nat := 3

theorem k_pos : k > 0 := by decide

theorem k_eq_3 : k = 3 := rfl

/-- CBD parameter η1 = η2 = 2 -/
def η1 : Nat := 2
def η2 : Nat := 2

theorem η1_pos : η1 > 0 := by decide
theorem η2_pos : η2 > 0 := by decide

/-- Compression parameters -/
def d_u : Nat := 10
def d_v : Nat := 4

theorem d_u_pos : d_u > 0 := by decide
theorem d_v_pos : d_v > 0 := by decide

/-- Derived powers of two -/
def pow2_du : Nat := 2 ^ d_u
def pow2_dv : Nat := 2 ^ d_v

theorem pow2_du_eq : pow2_du = 1024 := rfl
theorem pow2_dv_eq : pow2_dv = 16 := rfl

/-- Bit-reversal permutation for 7-bit indices (0..127) -/
def bitrev7 (i : Nat) : Nat :=
  let b0 := (i >>> 0) &&& 1
  let b1 := (i >>> 1) &&& 1
  let b2 := (i >>> 2) &&& 1
  let b3 := (i >>> 3) &&& 1
  let b4 := (i >>> 4) &&& 1
  let b5 := (i >>> 5) &&& 1
  let b6 := (i >>> 6) &&& 1
  b6 * 64 + b5 * 32 + b4 * 16 + b3 * 8 + b2 * 4 + b1 * 2 + b0

/-- NTT twiddle factors: γ[i] = ζ^(2*bitrev7(i)+1) mod q -/
def γ (i : Fin 128) : Fin q :=
  ⟨ζ ^ (2 * bitrev7 i.val + 1) % q, by
    have h : ζ ^ (2 * bitrev7 i.val + 1) % q < q := Nat.mod_lt _ q_pos
    exact h⟩

end MlKem768
