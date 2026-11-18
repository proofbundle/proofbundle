/-
ML-KEM (FIPS 203) — Keccak-f[1600] permutation.

2026-10-29: `keccakRound` and `keccakF` were identity stubs
(`keccakRound rc s := s`), proven hollow by the Lean kernel. The ι step was
skipped entirely, so every SHA3/SHAKE output derived from this module would
have been wrong.

The implementation below is the FIPS 202 Keccak-f[1600] permutation applied
to the flat 25-lane state this module already used, with lane index
  i = 5*y + x   (x = column 0..4, y = row 0..4)
so that `l0` is A[0][0], `l1` is A[1][0], ..., `l4` is A[4][0], `l5` is A[0][1].

The ρ offsets are the standard rotation offsets r[x][y]:
  r[0] = 0,36,3,41,18   r[1] = 1,44,10,45,2   r[2] = 62,6,43,15,61
  r[3] = 28,55,25,21,56 r[4] = 27,20,39,8,14
and the π step maps A[x][y] to B[y][(2x+3y) mod 5].

NOTE on notation: in Lean 4 `^` on `Nat` is **exponentiation**, not
exclusive-or. Every xor in this file therefore goes through the hand-folded
`xor64` below, which is also what keeps the module free of `propext` (core
bitwise operations on `Nat` report `propext` through well-founded recursion).

Ground truth: Keccak-f[1600] applied to the all-zero state has first lane
0xf1258f7940e1dde7; see `keccak_f_zero_lane0` below, which the Lean kernel
checks by reduction.
-/
namespace Crypto.MLKEM

-- State: 5x5 lanes of 64 bits each. Represent as 25 Nat fields (no Array).
structure KeccakState where
  l0 : Nat
  l1 : Nat
  l2 : Nat
  l3 : Nat
  l4 : Nat
  l5 : Nat
  l6 : Nat
  l7 : Nat
  l8 : Nat
  l9 : Nat
  l10 : Nat
  l11 : Nat
  l12 : Nat
  l13 : Nat
  l14 : Nat
  l15 : Nat
  l16 : Nat
  l17 : Nat
  l18 : Nat
  l19 : Nat
  l20 : Nat
  l21 : Nat
  l22 : Nat
  l23 : Nat
  l24 : Nat

def mask64 (x : Nat) : Nat := x % 18446744073709551616

/-- 64-bit ones, for complement. -/
def ones64 : Nat := 18446744073709551615

def notw64 (x : Nat) : Nat := ones64 - x

/-- Bit `i` of `x`. -/
def bit (x i : Nat) : Nat := (x >>> i) % 2

/-- `[n-1, n-2, ..., 0]`, descending. -/
def downto64 : Nat -> List Nat
  | 0 => []
  | n + 1 => n :: downto64 n

/-- Lift a per-bit arithmetic operation to a 64-bit word operation. Hand-folded
    rather than using core bitwise ops, which report `propext`. -/
def bitop64 (f : Nat -> Nat -> Nat) (x y : Nat) : Nat :=
  (downto64 64).foldl (fun acc i => acc * 2 + f (bit x i) (bit y i)) 0

def and64 (x y : Nat) : Nat := bitop64 (fun a b => a * b) x y
def or64 (x y : Nat) : Nat := bitop64 (fun a b => a + b - a * b) x y
def xor64 (x y : Nat) : Nat := bitop64 (fun a b => (a + b) % 2) x y

/-- Rotate a 64-bit word left by `n` bits, for 0 <= n < 64.

    The low `64-n` bits move up by `n` and the top `n` bits move down to the
    bottom:

        rotl(x,n) = (x mod 2^(64-n)) * 2^n + (x >> (64-n))   (mod 2^64)

    `Nat.pow` refuses an exponent of 63 or more, so the case n = 1 -- the
    only one needing `2^63` -- is split out and written with the literal
    `9223372036854775808` (= 2^63) instead of a power. Every other case uses
    an exponent in 2..62. -/
def rotl64 (x n : Nat) : Nat :=
  match n with
  | 0 => mask64 x
  | 1 =>
      let lo := x % 9223372036854775808   -- low 63 bits
      let hi := x / 9223372036854775808   -- top bit
      mask64 (lo * 2 + hi)
  | n + 2 =>
      let lo := x % 2^(62 - n)            -- low (62-n) bits
      let hi := x / 2^(62 - n)            -- the remaining top n+2 bits
      mask64 (lo * 2^(n + 2) + hi)

-- Round constants for iota (one per round).
def RC : List Nat := [
  0x0000000000000001, 0x0000000000008082, 0x800000000000808a, 0x8000000080008000,
  0x000000000000808b, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
  0x000000000000008a, 0x0000000000000088, 0x0000000080008009, 0x000000008000000a,
  0x000000008000808b, 0x800000000000008b, 0x8000000000008089, 0x8000000000008003,
  0x8000000000008002, 0x8000000000000080, 0x000000000000800a, 0x800000008000000a,
  0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008]

/-- One round of Keccak-f[1600]: theta, rho, pi, chi, iota. -/
def keccakRound (rc : Nat) (s : KeccakState) : KeccakState :=
  let l0 := s.l0
  let l1 := s.l1
  let l2 := s.l2
  let l3 := s.l3
  let l4 := s.l4
  let l5 := s.l5
  let l6 := s.l6
  let l7 := s.l7
  let l8 := s.l8
  let l9 := s.l9
  let l10 := s.l10
  let l11 := s.l11
  let l12 := s.l12
  let l13 := s.l13
  let l14 := s.l14
  let l15 := s.l15
  let l16 := s.l16
  let l17 := s.l17
  let l18 := s.l18
  let l19 := s.l19
  let l20 := s.l20
  let l21 := s.l21
  let l22 := s.l22
  let l23 := s.l23
  let l24 := s.l24
  -- theta
    let t0 := (xor64 (l0) (xor64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) 1)))
    let t1 := (xor64 (l1) (xor64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) 1)))
    let t2 := (xor64 (l2) (xor64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) 1)))
    let t3 := (xor64 (l3) (xor64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) 1)))
    let t4 := (xor64 (l4) (xor64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) 1)))
    let t5 := (xor64 (l5) (xor64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) 1)))
    let t6 := (xor64 (l6) (xor64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) 1)))
    let t7 := (xor64 (l7) (xor64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) 1)))
    let t8 := (xor64 (l8) (xor64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) 1)))
    let t9 := (xor64 (l9) (xor64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) 1)))
    let t10 := (xor64 (l10) (xor64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) 1)))
    let t11 := (xor64 (l11) (xor64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) 1)))
    let t12 := (xor64 (l12) (xor64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) 1)))
    let t13 := (xor64 (l13) (xor64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) 1)))
    let t14 := (xor64 (l14) (xor64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) 1)))
    let t15 := (xor64 (l15) (xor64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) 1)))
    let t16 := (xor64 (l16) (xor64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) 1)))
    let t17 := (xor64 (l17) (xor64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) 1)))
    let t18 := (xor64 (l18) (xor64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) 1)))
    let t19 := (xor64 (l19) (xor64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) 1)))
    let t20 := (xor64 (l20) (xor64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) 1)))
    let t21 := (xor64 (l21) (xor64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) 1)))
    let t22 := (xor64 (l22) (xor64 ((xor64 (xor64 (xor64 (xor64 (l1) l6) l11) l16) l21)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) 1)))
    let t23 := (xor64 (l23) (xor64 ((xor64 (xor64 (xor64 (xor64 (l2) l7) l12) l17) l22)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l4) l9) l14) l19) l24)) 1)))
    let t24 := (xor64 (l24) (xor64 ((xor64 (xor64 (xor64 (xor64 (l3) l8) l13) l18) l23)) (rotl64 ((xor64 (xor64 (xor64 (xor64 (l0) l5) l10) l15) l20)) 1)))
  -- rho + pi
    let b0 := (t0)
    let b5 := (rotl64 (t3) 28)
    let b10 := (rotl64 (t1) 1)
    let b15 := (rotl64 (t4) 27)
    let b20 := (rotl64 (t2) 62)
    let b1 := (rotl64 (t6) 44)
    let b6 := (rotl64 (t9) 20)
    let b11 := (rotl64 (t7) 6)
    let b16 := (rotl64 (t5) 36)
    let b21 := (rotl64 (t8) 55)
    let b2 := (rotl64 (t12) 43)
    let b7 := (rotl64 (t10) 3)
    let b12 := (rotl64 (t13) 25)
    let b17 := (rotl64 (t11) 10)
    let b22 := (rotl64 (t14) 39)
    let b3 := (rotl64 (t18) 21)
    let b8 := (rotl64 (t16) 45)
    let b13 := (rotl64 (t19) 8)
    let b18 := (rotl64 (t17) 15)
    let b23 := (rotl64 (t15) 41)
    let b4 := (rotl64 (t24) 14)
    let b9 := (rotl64 (t22) 61)
    let b14 := (rotl64 (t20) 18)
    let b19 := (rotl64 (t23) 56)
    let b24 := (rotl64 (t21) 2)
  -- chi
    let c0 := (xor64 (b0) (and64 (notw64 b1) b2))
    let c1 := (xor64 (b1) (and64 (notw64 b2) b3))
    let c2 := (xor64 (b2) (and64 (notw64 b3) b4))
    let c3 := (xor64 (b3) (and64 (notw64 b4) b0))
    let c4 := (xor64 (b4) (and64 (notw64 b0) b1))
    let c5 := (xor64 (b5) (and64 (notw64 b6) b7))
    let c6 := (xor64 (b6) (and64 (notw64 b7) b8))
    let c7 := (xor64 (b7) (and64 (notw64 b8) b9))
    let c8 := (xor64 (b8) (and64 (notw64 b9) b5))
    let c9 := (xor64 (b9) (and64 (notw64 b5) b6))
    let c10 := (xor64 (b10) (and64 (notw64 b11) b12))
    let c11 := (xor64 (b11) (and64 (notw64 b12) b13))
    let c12 := (xor64 (b12) (and64 (notw64 b13) b14))
    let c13 := (xor64 (b13) (and64 (notw64 b14) b10))
    let c14 := (xor64 (b14) (and64 (notw64 b10) b11))
    let c15 := (xor64 (b15) (and64 (notw64 b16) b17))
    let c16 := (xor64 (b16) (and64 (notw64 b17) b18))
    let c17 := (xor64 (b17) (and64 (notw64 b18) b19))
    let c18 := (xor64 (b18) (and64 (notw64 b19) b15))
    let c19 := (xor64 (b19) (and64 (notw64 b15) b16))
    let c20 := (xor64 (b20) (and64 (notw64 b21) b22))
    let c21 := (xor64 (b21) (and64 (notw64 b22) b23))
    let c22 := (xor64 (b22) (and64 (notw64 b23) b24))
    let c23 := (xor64 (b23) (and64 (notw64 b24) b20))
    let c24 := (xor64 (b24) (and64 (notw64 b20) b21))
  -- iota
    let i0 := (xor64 c0 rc)
    let i1 := c1
    let i2 := c2
    let i3 := c3
    let i4 := c4
    let i5 := c5
    let i6 := c6
    let i7 := c7
    let i8 := c8
    let i9 := c9
    let i10 := c10
    let i11 := c11
    let i12 := c12
    let i13 := c13
    let i14 := c14
    let i15 := c15
    let i16 := c16
    let i17 := c17
    let i18 := c18
    let i19 := c19
    let i20 := c20
    let i21 := c21
    let i22 := c22
    let i23 := c23
    let i24 := c24
  KeccakState.mk i0 i1 i2 i3 i4 i5 i6 i7 i8 i9 i10 i11 i12 i13 i14 i15
    i16 i17 i18 i19 i20 i21 i22 i23 i24

/-- The 24 rounds of Keccak-f[1600], in order, with the standard round
    constants. -/
def keccakF (s : KeccakState) : KeccakState :=
  let rec go : List Nat -> KeccakState -> KeccakState
    | [], st => st
    | rc :: rcs, st => go rcs (keccakRound rc st)
  go RC s

/-- The all-zero state. -/
def zeroState : KeccakState :=
  { l0 := 0, l1 := 0, l2 := 0, l3 := 0, l4 := 0, l5 := 0, l6 := 0, l7 := 0,
    l8 := 0, l9 := 0, l10 := 0, l11 := 0, l12 := 0, l13 := 0, l14 := 0,
    l15 := 0, l16 := 0, l17 := 0, l18 := 0, l19 := 0, l20 := 0, l21 := 0,
    l22 := 0, l23 := 0, l24 := 0 }

set_option maxRecDepth 1000000 in
set_option maxHeartbeats 1000000000 in
/-- Keccak-f[1600] of the all-zero state, first lane.

    This is the standard published value for the Keccak-f[1600] permutation
    applied to the zero state. It exercises all 24 rounds, the ι step and all
    25 lanes, so it is sensitive to any error in theta, rho, pi, chi or the
    round-constant order. -/
theorem keccak_f_zero_lane0 :
    (keccakF zeroState).l0 = 0xf1258f7940e1dde7 := by rfl

-- ML-KEM parameters (FIPS 203 section 8).
def n : Nat := 256       -- polynomial degree
def q : Nat := 3329      -- prime modulus
def k : Nat := 4         -- ML-KEM-1024 (largest variant)
def eta1 : Nat := 2
def eta2 : Nat := 2

end Crypto.MLKEM
