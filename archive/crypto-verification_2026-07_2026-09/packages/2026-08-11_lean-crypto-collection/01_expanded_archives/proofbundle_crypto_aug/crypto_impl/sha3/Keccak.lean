import Mathlib

/-!
# Keccak-f[1600] Permutation (FIPS 202)

The core permutation underlying SHA-3 and SHAKE.
State is 5×5 lanes of 64-bit words = 1600 bits.
Zero axioms. Zero sorries.
-/

namespace Keccak

/-- Lane: a 64-bit word -/
def Lane : Type := Fin 64 → Bool

/-- State: 5×5 lanes -/
def State : Type := Fin 5 → Fin 5 → Lane

/-- Round constants for Keccak-f[1600].
    Derived from π in FIPS 202 Section 3.2.5.
    Precomputed for all 24 rounds. -/
def RC : Fin 24 → Nat
  | ⟨0, _⟩  => 0x0000000000000001
  | ⟨1, _⟩  => 0x0000000000008082
  | ⟨2, _⟩  => 0x800000000000808A
  | ⟨3, _⟩  => 0x8000000080008000
  | ⟨4, _⟩  => 0x000000000000808B
  | ⟨5, _⟩  => 0x0000000080000001
  | ⟨6, _⟩  => 0x8000000080008081
  | ⟨7, _⟩  => 0x8000000000008009
  | ⟨8, _⟩  => 0x000000000000008A
  | ⟨9, _⟩  => 0x0000000000000088
  | ⟨10, _⟩ => 0x0000000080008009
  | ⟨11, _⟩ => 0x000000008000000A
  | ⟨12, _⟩ => 0x000000008000808B
  | ⟨13, _⟩ => 0x800000000000008B
  | ⟨14, _⟩ => 0x8000000000008089
  | ⟨15, _⟩ => 0x8000000000008003
  | ⟨16, _⟩ => 0x8000000000008002
  | ⟨17, _⟩ => 0x8000000000000080
  | ⟨18, _⟩ => 0x000000000000800A
  | ⟨19, _⟩ => 0x800000008000000A
  | ⟨20, _⟩ => 0x8000000080008081
  | ⟨21, _⟩ => 0x8000000000008080
  | ⟨22, _⟩ => 0x0000000080000001
  | ⟨23, _⟩ => 0x8000000080008008
  | ⟨n, h⟩  => by exfalso; have : n < 24 := h; interval_cases n

/-- Rotation offsets for ρ step (FIPS 202 Table 2). -/
def rotOffset (x y : Fin 5) : Nat :=
  match x.val, y.val with
  | 0, 0 => 0
  | 0, 1 => 36
  | 0, 2 => 3
  | 0, 3 => 41
  | 0, 4 => 18
  | 1, 0 => 1
  | 1, 1 => 44
  | 1, 2 => 10
  | 1, 3 => 45
  | 1, 4 => 2
  | 2, 0 => 62
  | 2, 1 => 6
  | 2, 2 => 43
  | 2, 3 => 15
  | 2, 4 => 61
  | 3, 0 => 28
  | 3, 1 => 55
  | 3, 2 => 25
  | 3, 3 => 21
  | 3, 4 => 56
  | 4, 0 => 27
  | 4, 1 => 20
  | 4, 2 => 39
  | 4, 3 => 8
  | 4, 4 => 14
  | _, _ => 0

/-- θ step: XOR each lane with parity of column. -/
def theta (A : State) : State :=
  fun x y =>
    let C := fun x =>
      let mut c := false
      for y in [0:5] do
        c := c ≠ A x ⟨y, by omega⟩
      c
    let D := fun x =>
      let x_prev := ⟨(x.val + 4) % 5, by omega⟩
      let x_next := ⟨(x.val + 1) % 5, by omega⟩
      C x_prev ≠ C x_next
    fun z => A x y z ≠ D x

/-- ρ and π steps combined: rotate and rearrange lanes. -/
def rhoPi (A : State) : State :=
  fun x y =>
    let x_src := ⟨(0 * x.val + 1 * y.val) % 5, by omega⟩
    let y_src := ⟨(2 * x.val + 3 * y.val) % 5, by omega⟩
    let offset := rotOffset x_src y_src
    fun z =>
      let z_src := ⟨(z.val + 64 - offset % 64) % 64, by omega⟩
      A x_src y_src z_src

/-- χ step: non-linear layer. -/
def chi (A : State) : State :=
  fun x y z =>
    let x_next := ⟨(x.val + 1) % 5, by omega⟩
    let x_next2 := ⟨(x.val + 2) % 5, by omega⟩
    A x y z ≠ (A x_next y z && !A x_next2 y z)

/-- ι step: XOR round constant into lane (0,0). -/
def iota (A : State) (rc : Nat) : State :=
  fun x y z =>
    if x.val = 0 ∧ y.val = 0 then
      A x y z ≠ ((rc >>> z.val) &&& 1 = 1)
    else
      A x y z

/-- One round of Keccak-f[1600]. -/
def round (A : State) (ir : Fin 24) : State :=
  let rc := RC ir
  iota (chi (rhoPi (theta A))) rc

/-- Full Keccak-f[1600] permutation: 24 rounds. -/
def keccakF (A : State) : State :=
  let r0  := round A ⟨0, by decide⟩
  let r1  := round r0 ⟨1, by decide⟩
  let r2  := round r1 ⟨2, by decide⟩
  let r3  := round r2 ⟨3, by decide⟩
  let r4  := round r3 ⟨4, by decide⟩
  let r5  := round r4 ⟨5, by decide⟩
  let r6  := round r5 ⟨6, by decide⟩
  let r7  := round r6 ⟨7, by decide⟩
  let r8  := round r7 ⟨8, by decide⟩
  let r9  := round r8 ⟨9, by decide⟩
  let r10 := round r9 ⟨10, by decide⟩
  let r11 := round r10 ⟨11, by decide⟩
  let r12 := round r11 ⟨12, by decide⟩
  let r13 := round r12 ⟨13, by decide⟩
  let r14 := round r13 ⟨14, by decide⟩
  let r15 := round r14 ⟨15, by decide⟩
  let r16 := round r15 ⟨16, by decide⟩
  let r17 := round r16 ⟨17, by decide⟩
  let r18 := round r17 ⟨18, by decide⟩
  let r19 := round r18 ⟨19, by decide⟩
  let r20 := round r19 ⟨20, by decide⟩
  let r21 := round r20 ⟨21, by decide⟩
  let r22 := round r21 ⟨22, by decide⟩
  let r23 := round r22 ⟨23, by decide⟩
  r23

end Keccak
