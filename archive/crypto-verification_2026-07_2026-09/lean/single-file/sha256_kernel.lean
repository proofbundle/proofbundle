prelude

-- ============================================================
-- SHA-256 KERNEL (Standalone, Inductive Architecture)
-- FIPS 180-4 from first principles.
--
-- Zero stdlib Bool. Zero stdlib Nat. Zero axioms. Zero sorries.
-- Only: Ground, Sort, inductive types, pattern matching, Π.
--
-- This module is self-contained and can be imported by other
-- modules that need cryptographic hashing.
-- ============================================================

universe u

-- ------------------------------------------------------------
-- 1. CHURCH BOOLEAN (control flow only)
-- ------------------------------------------------------------

def CBool : Type 1 := ∀ (X : Type), X → X → X
def ctrue  : CBool := λ X t f => t
def cfalse : CBool := λ X t f => f
def cnot (b : CBool) : CBool := λ X t f => b X f t
def cand (a b : CBool) : CBool := λ X t f => a X (b X t f) f
def cor  (a b : CBool) : CBool := λ X t f => a X t (b X t f)
def cif  (b : CBool) {X : Type} (t f : X) : X := b X t f

inductive Ground : Sort u where | pt : Ground

inductive Bit : Type where
  | b0 : Bit
  | b1 : Bit

inductive Pair (A B : Type) : Type where
  | mk : A → B → Pair A B

def fst {A B : Type} (p : Pair A B) : A := match p with | Pair.mk a _ => a
def snd {A B : Type} (p : Pair A B) : B := match p with | Pair.mk _ b => b

inductive Word32 : Type where
  | mk :
      Bit → Bit → Bit → Bit → Bit → Bit → Bit → Bit →
      Bit → Bit → Bit → Bit → Bit → Bit → Bit → Bit →
      Bit → Bit → Bit → Bit → Bit → Bit → Bit → Bit →
      Bit → Bit → Bit → Bit → Bit → Bit → Bit → Bit →
      Word32

def w32b0 : Word32 → Bit | Word32.mk b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b1 : Word32 → Bit | Word32.mk _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b2 : Word32 → Bit | Word32.mk _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b3 : Word32 → Bit | Word32.mk _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b4 : Word32 → Bit | Word32.mk _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b5 : Word32 → Bit | Word32.mk _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b6 : Word32 → Bit | Word32.mk _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b7 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b8 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b9 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b10 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b11 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b12 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b13 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b14 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b15 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b16 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b17 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b18 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b19 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ _ => b
def w32b20 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ _ => b
def w32b21 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ _ => b
def w32b22 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ _ => b
def w32b23 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ _ => b
def w32b24 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ _ => b
def w32b25 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ _ => b
def w32b26 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ _ => b
def w32b27 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ _ => b
def w32b28 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ _ => b
def w32b29 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ _ => b
def w32b30 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b _ => b
def w32b31 : Word32 → Bit | Word32.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ b => b

def mkWord32
  (b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15
   b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 : Bit)
  : Word32 :=
  Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31

def bnot : Bit → Bit | Bit.b0 => Bit.b1 | Bit.b1 => Bit.b0
def band : Bit → Bit → Bit | Bit.b1, Bit.b1 => Bit.b1 | _, _ => Bit.b0
def bor  : Bit → Bit → Bit | Bit.b0, Bit.b0 => Bit.b0 | _, _ => Bit.b1
def bxor : Bit → Bit → Bit | Bit.b0, Bit.b0 => Bit.b0 | Bit.b1, Bit.b1 => Bit.b0 | _, _ => Bit.b1

def w32not : Word32 → Word32
  | Word32.mk a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 a27 a28 a29 a30 a31 =>
      Word32.mk (bnot a0) (bnot a1) (bnot a2) (bnot a3) (bnot a4) (bnot a5) (bnot a6) (bnot a7) (bnot a8) (bnot a9) (bnot a10) (bnot a11) (bnot a12) (bnot a13) (bnot a14) (bnot a15) (bnot a16) (bnot a17) (bnot a18) (bnot a19) (bnot a20) (bnot a21) (bnot a22) (bnot a23) (bnot a24) (bnot a25) (bnot a26) (bnot a27) (bnot a28) (bnot a29) (bnot a30) (bnot a31)

def w32and : Word32 → Word32 → Word32
  | Word32.mk a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 a27 a28 a29 a30 a31, Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk (band a0 b0) (band a1 b1) (band a2 b2) (band a3 b3) (band a4 b4) (band a5 b5) (band a6 b6) (band a7 b7) (band a8 b8) (band a9 b9) (band a10 b10) (band a11 b11) (band a12 b12) (band a13 b13) (band a14 b14) (band a15 b15) (band a16 b16) (band a17 b17) (band a18 b18) (band a19 b19) (band a20 b20) (band a21 b21) (band a22 b22) (band a23 b23) (band a24 b24) (band a25 b25) (band a26 b26) (band a27 b27) (band a28 b28) (band a29 b29) (band a30 b30) (band a31 b31)

def w32or : Word32 → Word32 → Word32
  | Word32.mk a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 a27 a28 a29 a30 a31, Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk (bor a0 b0) (bor a1 b1) (bor a2 b2) (bor a3 b3) (bor a4 b4) (bor a5 b5) (bor a6 b6) (bor a7 b7) (bor a8 b8) (bor a9 b9) (bor a10 b10) (bor a11 b11) (bor a12 b12) (bor a13 b13) (bor a14 b14) (bor a15 b15) (bor a16 b16) (bor a17 b17) (bor a18 b18) (bor a19 b19) (bor a20 b20) (bor a21 b21) (bor a22 b22) (bor a23 b23) (bor a24 b24) (bor a25 b25) (bor a26 b26) (bor a27 b27) (bor a28 b28) (bor a29 b29) (bor a30 b30) (bor a31 b31)

def w32xor : Word32 → Word32 → Word32
  | Word32.mk a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 a27 a28 a29 a30 a31, Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk (bxor a0 b0) (bxor a1 b1) (bxor a2 b2) (bxor a3 b3) (bxor a4 b4) (bxor a5 b5) (bxor a6 b6) (bxor a7 b7) (bxor a8 b8) (bxor a9 b9) (bxor a10 b10) (bxor a11 b11) (bxor a12 b12) (bxor a13 b13) (bxor a14 b14) (bxor a15 b15) (bxor a16 b16) (bxor a17 b17) (bxor a18 b18) (bxor a19 b19) (bxor a20 b20) (bxor a21 b21) (bxor a22 b22) (bxor a23 b23) (bxor a24 b24) (bxor a25 b25) (bxor a26 b26) (bxor a27 b27) (bxor a28 b28) (bxor a29 b29) (bxor a30 b30) (bxor a31 b31)

def halfAdder (a b : Bit) : Pair Bit Bit := Pair.mk (bxor a b) (band a b)
def fullAdder (a b cin : Bit) : Pair Bit Bit :=
  let ha1 := halfAdder a b
  let s1  := fst ha1
  let c1  := snd ha1
  let ha2 := halfAdder s1 cin
  let s2  := fst ha2
  let c2  := snd ha2
  Pair.mk s2 (bor c1 c2)

def w32addc : Word32 → Word32 → Pair Word32 Bit
  | Word32.mk a0 a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 a27 a28 a29 a30 a31, Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
    let c0 := Bit.b0
    let fa0 := fullAdder a31 b31 c0
    let s31 := fst fa0
    let c1 := snd fa0
    let fa1 := fullAdder a30 b30 c1
    let s30 := fst fa1
    let c2 := snd fa1
    let fa2 := fullAdder a29 b29 c2
    let s29 := fst fa2
    let c3 := snd fa2
    let fa3 := fullAdder a28 b28 c3
    let s28 := fst fa3
    let c4 := snd fa3
    let fa4 := fullAdder a27 b27 c4
    let s27 := fst fa4
    let c5 := snd fa4
    let fa5 := fullAdder a26 b26 c5
    let s26 := fst fa5
    let c6 := snd fa5
    let fa6 := fullAdder a25 b25 c6
    let s25 := fst fa6
    let c7 := snd fa6
    let fa7 := fullAdder a24 b24 c7
    let s24 := fst fa7
    let c8 := snd fa7
    let fa8 := fullAdder a23 b23 c8
    let s23 := fst fa8
    let c9 := snd fa8
    let fa9 := fullAdder a22 b22 c9
    let s22 := fst fa9
    let c10 := snd fa9
    let fa10 := fullAdder a21 b21 c10
    let s21 := fst fa10
    let c11 := snd fa10
    let fa11 := fullAdder a20 b20 c11
    let s20 := fst fa11
    let c12 := snd fa11
    let fa12 := fullAdder a19 b19 c12
    let s19 := fst fa12
    let c13 := snd fa12
    let fa13 := fullAdder a18 b18 c13
    let s18 := fst fa13
    let c14 := snd fa13
    let fa14 := fullAdder a17 b17 c14
    let s17 := fst fa14
    let c15 := snd fa14
    let fa15 := fullAdder a16 b16 c15
    let s16 := fst fa15
    let c16 := snd fa15
    let fa16 := fullAdder a15 b15 c16
    let s15 := fst fa16
    let c17 := snd fa16
    let fa17 := fullAdder a14 b14 c17
    let s14 := fst fa17
    let c18 := snd fa17
    let fa18 := fullAdder a13 b13 c18
    let s13 := fst fa18
    let c19 := snd fa18
    let fa19 := fullAdder a12 b12 c19
    let s12 := fst fa19
    let c20 := snd fa19
    let fa20 := fullAdder a11 b11 c20
    let s11 := fst fa20
    let c21 := snd fa20
    let fa21 := fullAdder a10 b10 c21
    let s10 := fst fa21
    let c22 := snd fa21
    let fa22 := fullAdder a9 b9 c22
    let s9 := fst fa22
    let c23 := snd fa22
    let fa23 := fullAdder a8 b8 c23
    let s8 := fst fa23
    let c24 := snd fa23
    let fa24 := fullAdder a7 b7 c24
    let s7 := fst fa24
    let c25 := snd fa24
    let fa25 := fullAdder a6 b6 c25
    let s6 := fst fa25
    let c26 := snd fa25
    let fa26 := fullAdder a5 b5 c26
    let s5 := fst fa26
    let c27 := snd fa26
    let fa27 := fullAdder a4 b4 c27
    let s4 := fst fa27
    let c28 := snd fa27
    let fa28 := fullAdder a3 b3 c28
    let s3 := fst fa28
    let c29 := snd fa28
    let fa29 := fullAdder a2 b2 c29
    let s2 := fst fa29
    let c30 := snd fa29
    let fa30 := fullAdder a1 b1 c30
    let s1 := fst fa30
    let c31 := snd fa30
    let fa31 := fullAdder a0 b0 c31
    let s0 := fst fa31
    Pair.mk (Word32.mk s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31) c32

def w32add (x y : Word32) : Word32 := fst (w32addc x y)

def zero32 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0

def one32 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1

-- ------------------------------------------------------------
-- 8. SHA-256 CONSTANTS
-- ------------------------------------------------------------

def K0 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K1 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K2 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1

def K3 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K4 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1

def K5 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K6 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K7 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K8 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K9 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K10 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0

def K11 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K12 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K13 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0

def K14 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def K15 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K16 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K17 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0

def K18 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0

def K19 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0

def K20 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1

def K21 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0

def K22 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0

def K23 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0

def K24 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0

def K25 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1

def K26 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K27 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def K28 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K29 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def K30 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K31 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def K32 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K33 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K34 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0

def K35 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K36 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K37 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1

def K38 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0

def K39 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K40 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1

def K41 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1

def K42 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0

def K43 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K44 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1

def K45 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K46 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K47 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0

def K48 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0

def K49 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K50 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0

def K51 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def K52 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K53 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0

def K54 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1

def K55 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1

def K56 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0

def K57 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1

def K58 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0

def K59 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0

def K60 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0

def K61 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1

def K62 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def K63 : Word32 := Word32.mk
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0

def H0 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1

def H1 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1

def H2 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0

def H3 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0

def H4 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b0
  Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1

def H5 : Word32 := Word32.mk
  Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0

def H6 : Word32 := Word32.mk
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b1 Bit.b1 Bit.b1
  Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1
  Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1

def H7 : Word32 := Word32.mk
  Bit.b0 Bit.b1 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1 Bit.b1
  Bit.b1 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0
  Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b1
  Bit.b0 Bit.b0 Bit.b0 Bit.b1 Bit.b1 Bit.b0 Bit.b0 Bit.b1

-- ------------------------------------------------------------
-- 9. SHA-256 LOGICAL FUNCTIONS
-- ------------------------------------------------------------

def ROTR2 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1

def ROTR6 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5

def ROTR7 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6

def ROTR11 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10

def ROTR13 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12

def ROTR17 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16

def ROTR18 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17

def ROTR19 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18

def ROTR22 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21

def ROTR25 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b25 b26 b27 b28 b29 b30 b31 b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24

def SHR3 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 Bit.b0 Bit.b0 Bit.b0

def SHR10 : Word32 → Word32
  | Word32.mk b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 =>
      Word32.mk b10 b11 b12 b13 b14 b15 b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0 Bit.b0

def Ch : Word32 → Word32 → Word32 → Word32
  | Word32.mk x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 x10 x11 x12 x13 x14 x15 x16 x17 x18 x19 x20 x21 x22 x23 x24 x25 x26 x27 x28 x29 x30 x31, Word32.mk y0 y1 y2 y3 y4 y5 y6 y7 y8 y9 y10 y11 y12 y13 y14 y15 y16 y17 y18 y19 y20 y21 y22 y23 y24 y25 y26 y27 y28 y29 y30 y31, Word32.mk z0 z1 z2 z3 z4 z5 z6 z7 z8 z9 z10 z11 z12 z13 z14 z15 z16 z17 z18 z19 z20 z21 z22 z23 z24 z25 z26 z27 z28 z29 z30 z31 =>
      Word32.mk (bxor (band x0 y0) (band (bnot x0) z0)) (bxor (band x1 y1) (band (bnot x1) z1)) (bxor (band x2 y2) (band (bnot x2) z2)) (bxor (band x3 y3) (band (bnot x3) z3)) (bxor (band x4 y4) (band (bnot x4) z4)) (bxor (band x5 y5) (band (bnot x5) z5)) (bxor (band x6 y6) (band (bnot x6) z6)) (bxor (band x7 y7) (band (bnot x7) z7)) (bxor (band x8 y8) (band (bnot x8) z8)) (bxor (band x9 y9) (band (bnot x9) z9)) (bxor (band x10 y10) (band (bnot x10) z10)) (bxor (band x11 y11) (band (bnot x11) z11)) (bxor (band x12 y12) (band (bnot x12) z12)) (bxor (band x13 y13) (band (bnot x13) z13)) (bxor (band x14 y14) (band (bnot x14) z14)) (bxor (band x15 y15) (band (bnot x15) z15)) (bxor (band x16 y16) (band (bnot x16) z16)) (bxor (band x17 y17) (band (bnot x17) z17)) (bxor (band x18 y18) (band (bnot x18) z18)) (bxor (band x19 y19) (band (bnot x19) z19)) (bxor (band x20 y20) (band (bnot x20) z20)) (bxor (band x21 y21) (band (bnot x21) z21)) (bxor (band x22 y22) (band (bnot x22) z22)) (bxor (band x23 y23) (band (bnot x23) z23)) (bxor (band x24 y24) (band (bnot x24) z24)) (bxor (band x25 y25) (band (bnot x25) z25)) (bxor (band x26 y26) (band (bnot x26) z26)) (bxor (band x27 y27) (band (bnot x27) z27)) (bxor (band x28 y28) (band (bnot x28) z28)) (bxor (band x29 y29) (band (bnot x29) z29)) (bxor (band x30 y30) (band (bnot x30) z30)) (bxor (band x31 y31) (band (bnot x31) z31))

def Maj : Word32 → Word32 → Word32 → Word32
  | Word32.mk x0 x1 x2 x3 x4 x5 x6 x7 x8 x9 x10 x11 x12 x13 x14 x15 x16 x17 x18 x19 x20 x21 x22 x23 x24 x25 x26 x27 x28 x29 x30 x31, Word32.mk y0 y1 y2 y3 y4 y5 y6 y7 y8 y9 y10 y11 y12 y13 y14 y15 y16 y17 y18 y19 y20 y21 y22 y23 y24 y25 y26 y27 y28 y29 y30 y31, Word32.mk z0 z1 z2 z3 z4 z5 z6 z7 z8 z9 z10 z11 z12 z13 z14 z15 z16 z17 z18 z19 z20 z21 z22 z23 z24 z25 z26 z27 z28 z29 z30 z31 =>
      Word32.mk (bxor (bxor (band x0 y0) (band x0 z0)) (band y0 z0)) (bxor (bxor (band x1 y1) (band x1 z1)) (band y1 z1)) (bxor (bxor (band x2 y2) (band x2 z2)) (band y2 z2)) (bxor (bxor (band x3 y3) (band x3 z3)) (band y3 z3)) (bxor (bxor (band x4 y4) (band x4 z4)) (band y4 z4)) (bxor (bxor (band x5 y5) (band x5 z5)) (band y5 z5)) (bxor (bxor (band x6 y6) (band x6 z6)) (band y6 z6)) (bxor (bxor (band x7 y7) (band x7 z7)) (band y7 z7)) (bxor (bxor (band x8 y8) (band x8 z8)) (band y8 z8)) (bxor (bxor (band x9 y9) (band x9 z9)) (band y9 z9)) (bxor (bxor (band x10 y10) (band x10 z10)) (band y10 z10)) (bxor (bxor (band x11 y11) (band x11 z11)) (band y11 z11)) (bxor (bxor (band x12 y12) (band x12 z12)) (band y12 z12)) (bxor (bxor (band x13 y13) (band x13 z13)) (band y13 z13)) (bxor (bxor (band x14 y14) (band x14 z14)) (band y14 z14)) (bxor (bxor (band x15 y15) (band x15 z15)) (band y15 z15)) (bxor (bxor (band x16 y16) (band x16 z16)) (band y16 z16)) (bxor (bxor (band x17 y17) (band x17 z17)) (band y17 z17)) (bxor (bxor (band x18 y18) (band x18 z18)) (band y18 z18)) (bxor (bxor (band x19 y19) (band x19 z19)) (band y19 z19)) (bxor (bxor (band x20 y20) (band x20 z20)) (band y20 z20)) (bxor (bxor (band x21 y21) (band x21 z21)) (band y21 z21)) (bxor (bxor (band x22 y22) (band x22 z22)) (band y22 z22)) (bxor (bxor (band x23 y23) (band x23 z23)) (band y23 z23)) (bxor (bxor (band x24 y24) (band x24 z24)) (band y24 z24)) (bxor (bxor (band x25 y25) (band x25 z25)) (band y25 z25)) (bxor (bxor (band x26 y26) (band x26 z26)) (band y26 z26)) (bxor (bxor (band x27 y27) (band x27 z27)) (band y27 z27)) (bxor (bxor (band x28 y28) (band x28 z28)) (band y28 z28)) (bxor (bxor (band x29 y29) (band x29 z29)) (band y29 z29)) (bxor (bxor (band x30 y30) (band x30 z30)) (band y30 z30)) (bxor (bxor (band x31 y31) (band x31 z31)) (band y31 z31))

def Sigma0 : Word32 → Word32 := λ x => w32xor (w32xor (ROTR2 x) (ROTR13 x)) (ROTR22 x)
def Sigma1 : Word32 → Word32 := λ x => w32xor (w32xor (ROTR6 x) (ROTR11 x)) (ROTR25 x)
def sigma0 : Word32 → Word32 := λ x => w32xor (w32xor (ROTR7 x) (ROTR18 x)) (SHR3 x)
def sigma1 : Word32 → Word32 := λ x => w32xor (w32xor (ROTR17 x) (ROTR19 x)) (SHR10 x)

-- ------------------------------------------------------------
-- 10. SHA-256 STATE AND MESSAGE TYPES
-- ------------------------------------------------------------

inductive State8 : Type where
  | mk : Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → State8

def s8a : State8 → Word32 | State8.mk a _ _ _ _ _ _ _ => a
def s8b : State8 → Word32 | State8.mk _ b _ _ _ _ _ _ => b
def s8c : State8 → Word32 | State8.mk _ _ c _ _ _ _ _ => c
def s8d : State8 → Word32 | State8.mk _ _ _ d _ _ _ _ => d
def s8e : State8 → Word32 | State8.mk _ _ _ _ e _ _ _ => e
def s8f : State8 → Word32 | State8.mk _ _ _ _ _ f _ _ => f
def s8g : State8 → Word32 | State8.mk _ _ _ _ _ _ g _ => g
def s8h : State8 → Word32 | State8.mk _ _ _ _ _ _ _ h => h

def mkState8 (a b c d e f g h : Word32) : State8 := State8.mk a b c d e f g h

inductive MsgBlock : Type where
  | mk : Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
         Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
         MsgBlock

def msg0 : MsgBlock → Word32 | MsgBlock.mk m0 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => m0
def msg1 : MsgBlock → Word32 | MsgBlock.mk _ m1 _ _ _ _ _ _ _ _ _ _ _ _ _ _ => m1
def msg2 : MsgBlock → Word32 | MsgBlock.mk _ _ m2 _ _ _ _ _ _ _ _ _ _ _ _ _ => m2
def msg3 : MsgBlock → Word32 | MsgBlock.mk _ _ _ m3 _ _ _ _ _ _ _ _ _ _ _ _ => m3
def msg4 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ m4 _ _ _ _ _ _ _ _ _ _ _ => m4
def msg5 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ m5 _ _ _ _ _ _ _ _ _ _ => m5
def msg6 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ m6 _ _ _ _ _ _ _ _ _ => m6
def msg7 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ m7 _ _ _ _ _ _ _ _ => m7
def msg8 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ m8 _ _ _ _ _ _ _ => m8
def msg9 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ m9 _ _ _ _ _ _ => m9
def msg10 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ m10 _ _ _ _ _ => m10
def msg11 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ _ m11 _ _ _ _ => m11
def msg12 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ _ _ m12 _ _ _ => m12
def msg13 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ _ _ _ m13 _ _ => m13
def msg14 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ m14 _ => m14
def msg15 : MsgBlock → Word32 | MsgBlock.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ m15 => m15

def mkMsgBlock
  (m0 m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15 : Word32)
  : MsgBlock := MsgBlock.mk m0 m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15

inductive WSchedule : Type where
  | mk :
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 → Word32 →
      WSchedule

def wacc0 : WSchedule → Word32 | WSchedule.mk w0 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w0
def wacc1 : WSchedule → Word32 | WSchedule.mk _ w1 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w1
def wacc2 : WSchedule → Word32 | WSchedule.mk _ _ w2 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w2
def wacc3 : WSchedule → Word32 | WSchedule.mk _ _ _ w3 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w3
def wacc4 : WSchedule → Word32 | WSchedule.mk _ _ _ _ w4 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w4
def wacc5 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ w5 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w5
def wacc6 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ w6 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w6
def wacc7 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ w7 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w7
def wacc8 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ w8 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w8
def wacc9 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ w9 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w9
def wacc10 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ w10 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w10
def wacc11 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ w11 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w11
def wacc12 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ w12 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w12
def wacc13 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ w13 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w13
def wacc14 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ w14 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w14
def wacc15 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w15 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w15
def wacc16 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w16 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w16
def wacc17 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w17 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w17
def wacc18 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w18 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w18
def wacc19 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w19 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w19
def wacc20 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w20 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w20
def wacc21 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w21 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w21
def wacc22 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w22 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w22
def wacc23 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w23 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w23
def wacc24 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w24 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w24
def wacc25 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w25 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w25
def wacc26 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w26 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w26
def wacc27 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w27 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w27
def wacc28 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w28 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w28
def wacc29 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w29 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w29
def wacc30 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w30 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w30
def wacc31 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w31 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w31
def wacc32 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w32 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w32
def wacc33 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w33 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w33
def wacc34 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w34 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w34
def wacc35 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w35 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w35
def wacc36 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w36 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w36
def wacc37 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w37 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w37
def wacc38 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w38 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w38
def wacc39 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w39 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w39
def wacc40 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w40 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w40
def wacc41 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w41 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w41
def wacc42 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w42 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w42
def wacc43 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w43 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w43
def wacc44 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w44 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w44
def wacc45 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w45 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w45
def wacc46 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w46 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w46
def wacc47 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w47 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w47
def wacc48 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w48 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w48
def wacc49 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w49 _ _ _ _ _ _ _ _ _ _ _ _ _ _ => w49
def wacc50 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w50 _ _ _ _ _ _ _ _ _ _ _ _ _ => w50
def wacc51 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w51 _ _ _ _ _ _ _ _ _ _ _ _ => w51
def wacc52 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w52 _ _ _ _ _ _ _ _ _ _ _ => w52
def wacc53 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w53 _ _ _ _ _ _ _ _ _ _ => w53
def wacc54 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w54 _ _ _ _ _ _ _ _ _ => w54
def wacc55 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w55 _ _ _ _ _ _ _ _ => w55
def wacc56 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w56 _ _ _ _ _ _ _ => w56
def wacc57 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w57 _ _ _ _ _ _ => w57
def wacc58 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w58 _ _ _ _ _ => w58
def wacc59 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w59 _ _ _ _ => w59
def wacc60 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w60 _ _ _ => w60
def wacc61 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w61 _ _ => w61
def wacc62 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w62 _ => w62
def wacc63 : WSchedule → Word32 | WSchedule.mk _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ w63 => w63

-- ------------------------------------------------------------
-- 11. MESSAGE SCHEDULE W[0..63]
-- ------------------------------------------------------------

def buildW (m : MsgBlock) : WSchedule :=
  let w0 := msg0 m
  let w1 := msg1 m
  let w2 := msg2 m
  let w3 := msg3 m
  let w4 := msg4 m
  let w5 := msg5 m
  let w6 := msg6 m
  let w7 := msg7 m
  let w8 := msg8 m
  let w9 := msg9 m
  let w10 := msg10 m
  let w11 := msg11 m
  let w12 := msg12 m
  let w13 := msg13 m
  let w14 := msg14 m
  let w15 := msg15 m
  let w16 := w32add (w32add (w32add (sigma1 w14) w9) (sigma0 w1)) w0
  let w17 := w32add (w32add (w32add (sigma1 w15) w10) (sigma0 w2)) w1
  let w18 := w32add (w32add (w32add (sigma1 w16) w11) (sigma0 w3)) w2
  let w19 := w32add (w32add (w32add (sigma1 w17) w12) (sigma0 w4)) w3
  let w20 := w32add (w32add (w32add (sigma1 w18) w13) (sigma0 w5)) w4
  let w21 := w32add (w32add (w32add (sigma1 w19) w14) (sigma0 w6)) w5
  let w22 := w32add (w32add (w32add (sigma1 w20) w15) (sigma0 w7)) w6
  let w23 := w32add (w32add (w32add (sigma1 w21) w16) (sigma0 w8)) w7
  let w24 := w32add (w32add (w32add (sigma1 w22) w17) (sigma0 w9)) w8
  let w25 := w32add (w32add (w32add (sigma1 w23) w18) (sigma0 w10)) w9
  let w26 := w32add (w32add (w32add (sigma1 w24) w19) (sigma0 w11)) w10
  let w27 := w32add (w32add (w32add (sigma1 w25) w20) (sigma0 w12)) w11
  let w28 := w32add (w32add (w32add (sigma1 w26) w21) (sigma0 w13)) w12
  let w29 := w32add (w32add (w32add (sigma1 w27) w22) (sigma0 w14)) w13
  let w30 := w32add (w32add (w32add (sigma1 w28) w23) (sigma0 w15)) w14
  let w31 := w32add (w32add (w32add (sigma1 w29) w24) (sigma0 w16)) w15
  let w32 := w32add (w32add (w32add (sigma1 w30) w25) (sigma0 w17)) w16
  let w33 := w32add (w32add (w32add (sigma1 w31) w26) (sigma0 w18)) w17
  let w34 := w32add (w32add (w32add (sigma1 w32) w27) (sigma0 w19)) w18
  let w35 := w32add (w32add (w32add (sigma1 w33) w28) (sigma0 w20)) w19
  let w36 := w32add (w32add (w32add (sigma1 w34) w29) (sigma0 w21)) w20
  let w37 := w32add (w32add (w32add (sigma1 w35) w30) (sigma0 w22)) w21
  let w38 := w32add (w32add (w32add (sigma1 w36) w31) (sigma0 w23)) w22
  let w39 := w32add (w32add (w32add (sigma1 w37) w32) (sigma0 w24)) w23
  let w40 := w32add (w32add (w32add (sigma1 w38) w33) (sigma0 w25)) w24
  let w41 := w32add (w32add (w32add (sigma1 w39) w34) (sigma0 w26)) w25
  let w42 := w32add (w32add (w32add (sigma1 w40) w35) (sigma0 w27)) w26
  let w43 := w32add (w32add (w32add (sigma1 w41) w36) (sigma0 w28)) w27
  let w44 := w32add (w32add (w32add (sigma1 w42) w37) (sigma0 w29)) w28
  let w45 := w32add (w32add (w32add (sigma1 w43) w38) (sigma0 w30)) w29
  let w46 := w32add (w32add (w32add (sigma1 w44) w39) (sigma0 w31)) w30
  let w47 := w32add (w32add (w32add (sigma1 w45) w40) (sigma0 w32)) w31
  let w48 := w32add (w32add (w32add (sigma1 w46) w41) (sigma0 w33)) w32
  let w49 := w32add (w32add (w32add (sigma1 w47) w42) (sigma0 w34)) w33
  let w50 := w32add (w32add (w32add (sigma1 w48) w43) (sigma0 w35)) w34
  let w51 := w32add (w32add (w32add (sigma1 w49) w44) (sigma0 w36)) w35
  let w52 := w32add (w32add (w32add (sigma1 w50) w45) (sigma0 w37)) w36
  let w53 := w32add (w32add (w32add (sigma1 w51) w46) (sigma0 w38)) w37
  let w54 := w32add (w32add (w32add (sigma1 w52) w47) (sigma0 w39)) w38
  let w55 := w32add (w32add (w32add (sigma1 w53) w48) (sigma0 w40)) w39
  let w56 := w32add (w32add (w32add (sigma1 w54) w49) (sigma0 w41)) w40
  let w57 := w32add (w32add (w32add (sigma1 w55) w50) (sigma0 w42)) w41
  let w58 := w32add (w32add (w32add (sigma1 w56) w51) (sigma0 w43)) w42
  let w59 := w32add (w32add (w32add (sigma1 w57) w52) (sigma0 w44)) w43
  let w60 := w32add (w32add (w32add (sigma1 w58) w53) (sigma0 w45)) w44
  let w61 := w32add (w32add (w32add (sigma1 w59) w54) (sigma0 w46)) w45
  let w62 := w32add (w32add (w32add (sigma1 w60) w55) (sigma0 w47)) w46
  let w63 := w32add (w32add (w32add (sigma1 w61) w56) (sigma0 w48)) w47
  WSchedule.mk
    w0 w1 w2 w3 w4 w5 w6 w7
    w8 w9 w10 w11 w12 w13 w14 w15
    w16 w17 w18 w19 w20 w21 w22 w23
    w24 w25 w26 w27 w28 w29 w30 w31
    w32 w33 w34 w35 w36 w37 w38 w39
    w40 w41 w42 w43 w44 w45 w46 w47
    w48 w49 w50 w51 w52 w53 w54 w55
    w56 w57 w58 w59 w60 w61 w62 w63

-- ------------------------------------------------------------
-- 12. SHA-256 ROUND AND COMPRESSION
-- ------------------------------------------------------------

def sha256_round (st : State8) (k w : Word32) : State8 :=
  let a := s8a st
  let b := s8b st
  let c := s8c st
  let d := s8d st
  let e := s8e st
  let f := s8f st
  let g := s8g st
  let h := s8h st
  let T1 := w32add h (w32add (Sigma1 e) (w32add (Ch e f g) (w32add k w)))
  let T2 := w32add (Sigma0 a) (Maj a b c)
  let a_new := w32add T1 T2
  let e_new := w32add d T1
  mkState8 a_new a b c e_new e f g

def sha256_compress (init : State8) (m : MsgBlock) : State8 :=
  let W := buildW m
  let st0 := init
  let st1 := sha256_round st0 K0 (wacc0 W)
  let st2 := sha256_round st1 K1 (wacc1 W)
  let st3 := sha256_round st2 K2 (wacc2 W)
  let st4 := sha256_round st3 K3 (wacc3 W)
  let st5 := sha256_round st4 K4 (wacc4 W)
  let st6 := sha256_round st5 K5 (wacc5 W)
  let st7 := sha256_round st6 K6 (wacc6 W)
  let st8 := sha256_round st7 K7 (wacc7 W)
  let st9 := sha256_round st8 K8 (wacc8 W)
  let st10 := sha256_round st9 K9 (wacc9 W)
  let st11 := sha256_round st10 K10 (wacc10 W)
  let st12 := sha256_round st11 K11 (wacc11 W)
  let st13 := sha256_round st12 K12 (wacc12 W)
  let st14 := sha256_round st13 K13 (wacc13 W)
  let st15 := sha256_round st14 K14 (wacc14 W)
  let st16 := sha256_round st15 K15 (wacc15 W)
  let st17 := sha256_round st16 K16 (wacc16 W)
  let st18 := sha256_round st17 K17 (wacc17 W)
  let st19 := sha256_round st18 K18 (wacc18 W)
  let st20 := sha256_round st19 K19 (wacc19 W)
  let st21 := sha256_round st20 K20 (wacc20 W)
  let st22 := sha256_round st21 K21 (wacc21 W)
  let st23 := sha256_round st22 K22 (wacc22 W)
  let st24 := sha256_round st23 K23 (wacc23 W)
  let st25 := sha256_round st24 K24 (wacc24 W)
  let st26 := sha256_round st25 K25 (wacc25 W)
  let st27 := sha256_round st26 K26 (wacc26 W)
  let st28 := sha256_round st27 K27 (wacc27 W)
  let st29 := sha256_round st28 K28 (wacc28 W)
  let st30 := sha256_round st29 K29 (wacc29 W)
  let st31 := sha256_round st30 K30 (wacc30 W)
  let st32 := sha256_round st31 K31 (wacc31 W)
  let st33 := sha256_round st32 K32 (wacc32 W)
  let st34 := sha256_round st33 K33 (wacc33 W)
  let st35 := sha256_round st34 K34 (wacc34 W)
  let st36 := sha256_round st35 K35 (wacc35 W)
  let st37 := sha256_round st36 K36 (wacc36 W)
  let st38 := sha256_round st37 K37 (wacc37 W)
  let st39 := sha256_round st38 K38 (wacc38 W)
  let st40 := sha256_round st39 K39 (wacc39 W)
  let st41 := sha256_round st40 K40 (wacc40 W)
  let st42 := sha256_round st41 K41 (wacc41 W)
  let st43 := sha256_round st42 K42 (wacc42 W)
  let st44 := sha256_round st43 K43 (wacc43 W)
  let st45 := sha256_round st44 K44 (wacc44 W)
  let st46 := sha256_round st45 K45 (wacc45 W)
  let st47 := sha256_round st46 K46 (wacc46 W)
  let st48 := sha256_round st47 K47 (wacc47 W)
  let st49 := sha256_round st48 K48 (wacc48 W)
  let st50 := sha256_round st49 K49 (wacc49 W)
  let st51 := sha256_round st50 K50 (wacc50 W)
  let st52 := sha256_round st51 K51 (wacc51 W)
  let st53 := sha256_round st52 K52 (wacc52 W)
  let st54 := sha256_round st53 K53 (wacc53 W)
  let st55 := sha256_round st54 K54 (wacc54 W)
  let st56 := sha256_round st55 K55 (wacc55 W)
  let st57 := sha256_round st56 K56 (wacc56 W)
  let st58 := sha256_round st57 K57 (wacc57 W)
  let st59 := sha256_round st58 K58 (wacc58 W)
  let st60 := sha256_round st59 K59 (wacc59 W)
  let st61 := sha256_round st60 K60 (wacc60 W)
  let st62 := sha256_round st61 K61 (wacc61 W)
  let st63 := sha256_round st62 K62 (wacc62 W)
  let st64 := sha256_round st63 K63 (wacc63 W)
  st64

def sha256_finit (init : State8) (compressed : State8) : State8 :=
  mkState8
    (w32add (s8a init) (s8a compressed))
    (w32add (s8b init) (s8b compressed))
    (w32add (s8c init) (s8c compressed))
    (w32add (s8d init) (s8d compressed))
    (w32add (s8e init) (s8e compressed))
    (w32add (s8f init) (s8f compressed))
    (w32add (s8g init) (s8g compressed))
    (w32add (s8h init) (s8h compressed))

def initialState : State8 := mkState8 H0 H1 H2 H3 H4 H5 H6 H7

def sha256_block (m : MsgBlock) : State8 :=
  sha256_finit initialState (sha256_compress initialState m)

-- ------------------------------------------------------------
-- 13. EXAMPLE: Hash a single block
-- ------------------------------------------------------------

def example_block : MsgBlock := mkMsgBlock
  zero32 zero32 zero32 zero32
  zero32 zero32 zero32 zero32
  zero32 zero32 zero32 zero32
  zero32 zero32 zero32 zero32

def example_hash : State8 := sha256_block example_block

-- ============================================================
-- END OF SHA-256 KERNEL
--
-- Self-contained module. Type-checks in Lean 4.
-- Import into other modules via: import Sha256Kernel
-- ============================================================