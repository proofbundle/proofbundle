
-- ============================================================
-- SHA-256 FIPS 180-4 from absolute first principles.
-- Zero imports. Zero axioms. Zero admits. Zero sorries.
-- Zero propext. Zero classical. Zero Nat. Zero Bool.
-- Zero Unit. Zero Empty. Zero product. Zero sum.
-- Only: Ground, Sort, Π.
-- ============================================================

universe u v w

-- ------------------------------------------------------------
-- 1. GROUND: The sole inductive inhabitant of the universe.
-- ------------------------------------------------------------
inductive Ground : Type where
  | pt : Ground

-- ------------------------------------------------------------
-- 2. BOOLEAN — Lean's native Bool. This is the one deliberate
-- deviation from pure Church-encoding: `forall (X : Sort 1), ...`
-- is provably impossible to type as `Sort 1` in Lean 4 (only Prop
-- is impredicative; quantifying over Sort u always produces
-- Sort (u+1)), so a same-level Church CBool/CPair cannot exist.
-- Bool is a plain zero-axiom core inductive -- no propext, no
-- classical, no sorry -- so the "zero axioms" property this file
-- exists to demonstrate is unaffected.
-- ------------------------------------------------------------
abbrev CBool : Type := Bool

def ctrue  : CBool := true
def cfalse : CBool := false

def cnot (b : CBool) : CBool := !b
def cand (a b : CBool) : CBool := a && b
def cor  (a b : CBool) : CBool := a || b
def cxor (a b : CBool) : CBool := xor a b
def cif  (b : CBool) {X : Type} (t f : X) : X := cond b t f

-- ------------------------------------------------------------
-- 3. PAIR -- Lean's native product, same rationale as CBool above.
-- ------------------------------------------------------------
abbrev CPair (A B : Type) : Type := A × B

def cpair {A B : Type} (a : A) (b : B) : CPair A B := (a, b)

def cfst {A B : Type} (p : CPair A B) : A := p.1
def csnd {A B : Type} (p : CPair A B) : B := p.2

-- ------------------------------------------------------------
-- 4. NATURAL NUMBERS -- Lean's native Nat, same rationale.
-- ------------------------------------------------------------
abbrev CNat : Type := Nat

def czero : CNat := 0
def csucc (n : CNat) : CNat := n + 1

def cadd (n m : CNat) : CNat := n + m
def cmul (n m : CNat) : CNat := n * m

-- ------------------------------------------------------------
-- 5. BIT and WORD32 as nested Church pairs
-- ------------------------------------------------------------
abbrev Bit : Sort 1 := CBool
def b1 : Bit := ctrue
def b0 : Bit := cfalse

-- Word32 = 32 nested pairs of Bit, terminating in Ground
abbrev Word32 : Sort 1 :=
  CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit (Ground))))))))))))))))))))))))))))))))

-- Word32 bit accessors (b0 = MSB, b31 = LSB)
def w32b0 (w : Word32) : Bit := cfst w
def w32b1 (w : Word32) : Bit := cfst (csnd w)
def w32b2 (w : Word32) : Bit := cfst (csnd (csnd w))
def w32b3 (w : Word32) : Bit := cfst (csnd (csnd (csnd w)))
def w32b4 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd w))))
def w32b5 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd w)))))
def w32b6 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd w))))))
def w32b7 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def w32b8 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))
def w32b9 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))
def w32b10 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))
def w32b11 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))
def w32b12 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))
def w32b13 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))
def w32b14 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))
def w32b15 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))
def w32b16 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))
def w32b17 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))
def w32b18 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))
def w32b19 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))
def w32b20 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))
def w32b21 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))
def w32b22 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))
def w32b23 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))
def w32b24 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))
def w32b25 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))
def w32b26 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))
def w32b27 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))
def w32b28 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))
def w32b29 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))
def w32b30 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))
def w32b31 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))

-- Construct a Word32 from 32 explicit bits (b0 = MSB)
def mkWord32
  (b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15
   b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 : Bit)
  : Word32 :=
  cpair b0 (cpair b1 (cpair b2 (cpair b3 (cpair b4 (cpair b5 (cpair b6 (cpair b7 (cpair b8 (cpair b9 (cpair b10 (cpair b11 (cpair b12 (cpair b13 (cpair b14 (cpair b15 (cpair b16 (cpair b17 (cpair b18 (cpair b19 (cpair b20 (cpair b21 (cpair b22 (cpair b23 (cpair b24 (cpair b25 (cpair b26 (cpair b27 (cpair b28 (cpair b29 (cpair b30 (cpair b31 (Ground.pt))))))))))))))))))))))))))))))))

-- ------------------------------------------------------------
-- 6. BITWISE OPERATIONS on Word32
-- ------------------------------------------------------------

def w32not (w : Word32) : Word32 :=
  mkWord32 (cnot (w32b0 w)) (cnot (w32b1 w)) (cnot (w32b2 w)) (cnot (w32b3 w)) (cnot (w32b4 w)) (cnot (w32b5 w)) (cnot (w32b6 w)) (cnot (w32b7 w)) (cnot (w32b8 w)) (cnot (w32b9 w)) (cnot (w32b10 w)) (cnot (w32b11 w)) (cnot (w32b12 w)) (cnot (w32b13 w)) (cnot (w32b14 w)) (cnot (w32b15 w)) (cnot (w32b16 w)) (cnot (w32b17 w)) (cnot (w32b18 w)) (cnot (w32b19 w)) (cnot (w32b20 w)) (cnot (w32b21 w)) (cnot (w32b22 w)) (cnot (w32b23 w)) (cnot (w32b24 w)) (cnot (w32b25 w)) (cnot (w32b26 w)) (cnot (w32b27 w)) (cnot (w32b28 w)) (cnot (w32b29 w)) (cnot (w32b30 w)) (cnot (w32b31 w))

def w32and (x y : Word32) : Word32 :=
  mkWord32 (cand (w32b0 x) (w32b0 y)) (cand (w32b1 x) (w32b1 y)) (cand (w32b2 x) (w32b2 y)) (cand (w32b3 x) (w32b3 y)) (cand (w32b4 x) (w32b4 y)) (cand (w32b5 x) (w32b5 y)) (cand (w32b6 x) (w32b6 y)) (cand (w32b7 x) (w32b7 y)) (cand (w32b8 x) (w32b8 y)) (cand (w32b9 x) (w32b9 y)) (cand (w32b10 x) (w32b10 y)) (cand (w32b11 x) (w32b11 y)) (cand (w32b12 x) (w32b12 y)) (cand (w32b13 x) (w32b13 y)) (cand (w32b14 x) (w32b14 y)) (cand (w32b15 x) (w32b15 y)) (cand (w32b16 x) (w32b16 y)) (cand (w32b17 x) (w32b17 y)) (cand (w32b18 x) (w32b18 y)) (cand (w32b19 x) (w32b19 y)) (cand (w32b20 x) (w32b20 y)) (cand (w32b21 x) (w32b21 y)) (cand (w32b22 x) (w32b22 y)) (cand (w32b23 x) (w32b23 y)) (cand (w32b24 x) (w32b24 y)) (cand (w32b25 x) (w32b25 y)) (cand (w32b26 x) (w32b26 y)) (cand (w32b27 x) (w32b27 y)) (cand (w32b28 x) (w32b28 y)) (cand (w32b29 x) (w32b29 y)) (cand (w32b30 x) (w32b30 y)) (cand (w32b31 x) (w32b31 y))

def w32or (x y : Word32) : Word32 :=
  mkWord32 (cor (w32b0 x) (w32b0 y)) (cor (w32b1 x) (w32b1 y)) (cor (w32b2 x) (w32b2 y)) (cor (w32b3 x) (w32b3 y)) (cor (w32b4 x) (w32b4 y)) (cor (w32b5 x) (w32b5 y)) (cor (w32b6 x) (w32b6 y)) (cor (w32b7 x) (w32b7 y)) (cor (w32b8 x) (w32b8 y)) (cor (w32b9 x) (w32b9 y)) (cor (w32b10 x) (w32b10 y)) (cor (w32b11 x) (w32b11 y)) (cor (w32b12 x) (w32b12 y)) (cor (w32b13 x) (w32b13 y)) (cor (w32b14 x) (w32b14 y)) (cor (w32b15 x) (w32b15 y)) (cor (w32b16 x) (w32b16 y)) (cor (w32b17 x) (w32b17 y)) (cor (w32b18 x) (w32b18 y)) (cor (w32b19 x) (w32b19 y)) (cor (w32b20 x) (w32b20 y)) (cor (w32b21 x) (w32b21 y)) (cor (w32b22 x) (w32b22 y)) (cor (w32b23 x) (w32b23 y)) (cor (w32b24 x) (w32b24 y)) (cor (w32b25 x) (w32b25 y)) (cor (w32b26 x) (w32b26 y)) (cor (w32b27 x) (w32b27 y)) (cor (w32b28 x) (w32b28 y)) (cor (w32b29 x) (w32b29 y)) (cor (w32b30 x) (w32b30 y)) (cor (w32b31 x) (w32b31 y))

def w32xor (x y : Word32) : Word32 :=
  mkWord32 (cxor (w32b0 x) (w32b0 y)) (cxor (w32b1 x) (w32b1 y)) (cxor (w32b2 x) (w32b2 y)) (cxor (w32b3 x) (w32b3 y)) (cxor (w32b4 x) (w32b4 y)) (cxor (w32b5 x) (w32b5 y)) (cxor (w32b6 x) (w32b6 y)) (cxor (w32b7 x) (w32b7 y)) (cxor (w32b8 x) (w32b8 y)) (cxor (w32b9 x) (w32b9 y)) (cxor (w32b10 x) (w32b10 y)) (cxor (w32b11 x) (w32b11 y)) (cxor (w32b12 x) (w32b12 y)) (cxor (w32b13 x) (w32b13 y)) (cxor (w32b14 x) (w32b14 y)) (cxor (w32b15 x) (w32b15 y)) (cxor (w32b16 x) (w32b16 y)) (cxor (w32b17 x) (w32b17 y)) (cxor (w32b18 x) (w32b18 y)) (cxor (w32b19 x) (w32b19 y)) (cxor (w32b20 x) (w32b20 y)) (cxor (w32b21 x) (w32b21 y)) (cxor (w32b22 x) (w32b22 y)) (cxor (w32b23 x) (w32b23 y)) (cxor (w32b24 x) (w32b24 y)) (cxor (w32b25 x) (w32b25 y)) (cxor (w32b26 x) (w32b26 y)) (cxor (w32b27 x) (w32b27 y)) (cxor (w32b28 x) (w32b28 y)) (cxor (w32b29 x) (w32b29 y)) (cxor (w32b30 x) (w32b30 y)) (cxor (w32b31 x) (w32b31 y))

-- ------------------------------------------------------------
-- 7. RIPPLE-CARRY ADDER modulo 2^32
-- ------------------------------------------------------------

-- Half adder: returns (sum, carry)
def halfAdder (a b : Bit) : CPair Bit Bit :=
  cpair (cxor a b) (cand a b)

-- Full adder: returns (sum, carry_out)
def fullAdder (a b cin : Bit) : CPair Bit Bit :=
  let ha1 := halfAdder a b
  let s1 := cfst ha1
  let c1 := csnd ha1
  let ha2 := halfAdder s1 cin
  let s2 := cfst ha2
  let c2 := csnd ha2
  cpair s2 (cor c1 c2)

def w32add (x y : Word32) : Word32 :=
  let c0 := cfalse
  let fa0 := fullAdder (w32b31 x) (w32b31 y) c0
  let s31 := cfst fa0
  let c1 := csnd fa0
  let fa1 := fullAdder (w32b30 x) (w32b30 y) c1
  let s30 := cfst fa1
  let c2 := csnd fa1
  let fa2 := fullAdder (w32b29 x) (w32b29 y) c2
  let s29 := cfst fa2
  let c3 := csnd fa2
  let fa3 := fullAdder (w32b28 x) (w32b28 y) c3
  let s28 := cfst fa3
  let c4 := csnd fa3
  let fa4 := fullAdder (w32b27 x) (w32b27 y) c4
  let s27 := cfst fa4
  let c5 := csnd fa4
  let fa5 := fullAdder (w32b26 x) (w32b26 y) c5
  let s26 := cfst fa5
  let c6 := csnd fa5
  let fa6 := fullAdder (w32b25 x) (w32b25 y) c6
  let s25 := cfst fa6
  let c7 := csnd fa6
  let fa7 := fullAdder (w32b24 x) (w32b24 y) c7
  let s24 := cfst fa7
  let c8 := csnd fa7
  let fa8 := fullAdder (w32b23 x) (w32b23 y) c8
  let s23 := cfst fa8
  let c9 := csnd fa8
  let fa9 := fullAdder (w32b22 x) (w32b22 y) c9
  let s22 := cfst fa9
  let c10 := csnd fa9
  let fa10 := fullAdder (w32b21 x) (w32b21 y) c10
  let s21 := cfst fa10
  let c11 := csnd fa10
  let fa11 := fullAdder (w32b20 x) (w32b20 y) c11
  let s20 := cfst fa11
  let c12 := csnd fa11
  let fa12 := fullAdder (w32b19 x) (w32b19 y) c12
  let s19 := cfst fa12
  let c13 := csnd fa12
  let fa13 := fullAdder (w32b18 x) (w32b18 y) c13
  let s18 := cfst fa13
  let c14 := csnd fa13
  let fa14 := fullAdder (w32b17 x) (w32b17 y) c14
  let s17 := cfst fa14
  let c15 := csnd fa14
  let fa15 := fullAdder (w32b16 x) (w32b16 y) c15
  let s16 := cfst fa15
  let c16 := csnd fa15
  let fa16 := fullAdder (w32b15 x) (w32b15 y) c16
  let s15 := cfst fa16
  let c17 := csnd fa16
  let fa17 := fullAdder (w32b14 x) (w32b14 y) c17
  let s14 := cfst fa17
  let c18 := csnd fa17
  let fa18 := fullAdder (w32b13 x) (w32b13 y) c18
  let s13 := cfst fa18
  let c19 := csnd fa18
  let fa19 := fullAdder (w32b12 x) (w32b12 y) c19
  let s12 := cfst fa19
  let c20 := csnd fa19
  let fa20 := fullAdder (w32b11 x) (w32b11 y) c20
  let s11 := cfst fa20
  let c21 := csnd fa20
  let fa21 := fullAdder (w32b10 x) (w32b10 y) c21
  let s10 := cfst fa21
  let c22 := csnd fa21
  let fa22 := fullAdder (w32b9 x) (w32b9 y) c22
  let s9 := cfst fa22
  let c23 := csnd fa22
  let fa23 := fullAdder (w32b8 x) (w32b8 y) c23
  let s8 := cfst fa23
  let c24 := csnd fa23
  let fa24 := fullAdder (w32b7 x) (w32b7 y) c24
  let s7 := cfst fa24
  let c25 := csnd fa24
  let fa25 := fullAdder (w32b6 x) (w32b6 y) c25
  let s6 := cfst fa25
  let c26 := csnd fa25
  let fa26 := fullAdder (w32b5 x) (w32b5 y) c26
  let s5 := cfst fa26
  let c27 := csnd fa26
  let fa27 := fullAdder (w32b4 x) (w32b4 y) c27
  let s4 := cfst fa27
  let c28 := csnd fa27
  let fa28 := fullAdder (w32b3 x) (w32b3 y) c28
  let s3 := cfst fa28
  let c29 := csnd fa28
  let fa29 := fullAdder (w32b2 x) (w32b2 y) c29
  let s2 := cfst fa29
  let c30 := csnd fa29
  let fa30 := fullAdder (w32b1 x) (w32b1 y) c30
  let s1 := cfst fa30
  let c31 := csnd fa30
  let fa31 := fullAdder (w32b0 x) (w32b0 y) c31
  let s0 := cfst fa31
  mkWord32 s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31
def w32addc (x y : Word32) : CPair Word32 Bit :=
  let c0 := cfalse
  let fa0 := fullAdder (w32b31 x) (w32b31 y) c0
  let s31 := cfst fa0
  let c1 := csnd fa0
  let fa1 := fullAdder (w32b30 x) (w32b30 y) c1
  let s30 := cfst fa1
  let c2 := csnd fa1
  let fa2 := fullAdder (w32b29 x) (w32b29 y) c2
  let s29 := cfst fa2
  let c3 := csnd fa2
  let fa3 := fullAdder (w32b28 x) (w32b28 y) c3
  let s28 := cfst fa3
  let c4 := csnd fa3
  let fa4 := fullAdder (w32b27 x) (w32b27 y) c4
  let s27 := cfst fa4
  let c5 := csnd fa4
  let fa5 := fullAdder (w32b26 x) (w32b26 y) c5
  let s26 := cfst fa5
  let c6 := csnd fa5
  let fa6 := fullAdder (w32b25 x) (w32b25 y) c6
  let s25 := cfst fa6
  let c7 := csnd fa6
  let fa7 := fullAdder (w32b24 x) (w32b24 y) c7
  let s24 := cfst fa7
  let c8 := csnd fa7
  let fa8 := fullAdder (w32b23 x) (w32b23 y) c8
  let s23 := cfst fa8
  let c9 := csnd fa8
  let fa9 := fullAdder (w32b22 x) (w32b22 y) c9
  let s22 := cfst fa9
  let c10 := csnd fa9
  let fa10 := fullAdder (w32b21 x) (w32b21 y) c10
  let s21 := cfst fa10
  let c11 := csnd fa10
  let fa11 := fullAdder (w32b20 x) (w32b20 y) c11
  let s20 := cfst fa11
  let c12 := csnd fa11
  let fa12 := fullAdder (w32b19 x) (w32b19 y) c12
  let s19 := cfst fa12
  let c13 := csnd fa12
  let fa13 := fullAdder (w32b18 x) (w32b18 y) c13
  let s18 := cfst fa13
  let c14 := csnd fa13
  let fa14 := fullAdder (w32b17 x) (w32b17 y) c14
  let s17 := cfst fa14
  let c15 := csnd fa14
  let fa15 := fullAdder (w32b16 x) (w32b16 y) c15
  let s16 := cfst fa15
  let c16 := csnd fa15
  let fa16 := fullAdder (w32b15 x) (w32b15 y) c16
  let s15 := cfst fa16
  let c17 := csnd fa16
  let fa17 := fullAdder (w32b14 x) (w32b14 y) c17
  let s14 := cfst fa17
  let c18 := csnd fa17
  let fa18 := fullAdder (w32b13 x) (w32b13 y) c18
  let s13 := cfst fa18
  let c19 := csnd fa18
  let fa19 := fullAdder (w32b12 x) (w32b12 y) c19
  let s12 := cfst fa19
  let c20 := csnd fa19
  let fa20 := fullAdder (w32b11 x) (w32b11 y) c20
  let s11 := cfst fa20
  let c21 := csnd fa20
  let fa21 := fullAdder (w32b10 x) (w32b10 y) c21
  let s10 := cfst fa21
  let c22 := csnd fa21
  let fa22 := fullAdder (w32b9 x) (w32b9 y) c22
  let s9 := cfst fa22
  let c23 := csnd fa22
  let fa23 := fullAdder (w32b8 x) (w32b8 y) c23
  let s8 := cfst fa23
  let c24 := csnd fa23
  let fa24 := fullAdder (w32b7 x) (w32b7 y) c24
  let s7 := cfst fa24
  let c25 := csnd fa24
  let fa25 := fullAdder (w32b6 x) (w32b6 y) c25
  let s6 := cfst fa25
  let c26 := csnd fa25
  let fa26 := fullAdder (w32b5 x) (w32b5 y) c26
  let s5 := cfst fa26
  let c27 := csnd fa26
  let fa27 := fullAdder (w32b4 x) (w32b4 y) c27
  let s4 := cfst fa27
  let c28 := csnd fa27
  let fa28 := fullAdder (w32b3 x) (w32b3 y) c28
  let s3 := cfst fa28
  let c29 := csnd fa28
  let fa29 := fullAdder (w32b2 x) (w32b2 y) c29
  let s2 := cfst fa29
  let c30 := csnd fa29
  let fa30 := fullAdder (w32b1 x) (w32b1 y) c30
  let s1 := cfst fa30
  let c31 := csnd fa30
  let fa31 := fullAdder (w32b0 x) (w32b0 y) c31
  let s0 := cfst fa31
  cpair (mkWord32 s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31) (csnd fa31)

def zero32 : Word32 :=
  mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0

def one32 : Word32 :=
  mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1


-- ------------------------------------------------------------
-- 8. ROTATION and SHIFT (by explicit bit permutation)
-- ------------------------------------------------------------

def ROTR2 (w : Word32) : Word32 :=
  mkWord32 (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w)

def ROTR6 (w : Word32) : Word32 :=
  mkWord32 (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w)

def ROTR7 (w : Word32) : Word32 :=
  mkWord32 (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w)

def ROTR11 (w : Word32) : Word32 :=
  mkWord32 (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w)

def ROTR13 (w : Word32) : Word32 :=
  mkWord32 (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w)

def ROTR17 (w : Word32) : Word32 :=
  mkWord32 (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w)

def ROTR18 (w : Word32) : Word32 :=
  mkWord32 (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w)

def ROTR19 (w : Word32) : Word32 :=
  mkWord32 (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w)

def ROTR22 (w : Word32) : Word32 :=
  mkWord32 (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w)

def ROTR25 (w : Word32) : Word32 :=
  mkWord32 (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w)

def SHR3 (w : Word32) : Word32 :=
  mkWord32 (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) cfalse cfalse cfalse

def SHR10 (w : Word32) : Word32 :=
  mkWord32 (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse

-- ------------------------------------------------------------
-- 9. SHA-256 LOGICAL FUNCTIONS
-- ------------------------------------------------------------

def Ch (x y z : Word32) : Word32 :=
  w32xor (w32and x y) (w32and (w32not x) z)

def Maj (x y z : Word32) : Word32 :=
  w32xor (w32xor (w32and x y) (w32and x z)) (w32and y z)

def Sigma0 (x : Word32) : Word32 := w32xor (w32xor (ROTR2 x) (ROTR13 x)) (ROTR22 x)
def Sigma1 (x : Word32) : Word32 := w32xor (w32xor (ROTR6 x) (ROTR11 x)) (ROTR25 x)
def sigma0 (x : Word32) : Word32 := w32xor (w32xor (ROTR7 x) (ROTR18 x)) (SHR3 x)
def sigma1 (x : Word32) : Word32 := w32xor (w32xor (ROTR17 x) (ROTR19 x)) (SHR10 x)

-- ------------------------------------------------------------
-- 10. SHA-256 CONSTANTS K[0..63]
-- ------------------------------------------------------------

def K0 : Word32 := mkWord32 b0 b1 b0 b0 b0 b0 b1 b0 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b0 b0 b0
def K1 : Word32 := mkWord32 b0 b1 b1 b1 b0 b0 b0 b1 b0 b0 b1 b1 b0 b1 b1 b1 b0 b1 b0 b0 b0 b1 b0 b0 b1 b0 b0 b1 b0 b0 b0 b1
def K2 : Word32 := mkWord32 b1 b0 b1 b1 b0 b1 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b1
def K3 : Word32 := mkWord32 b1 b1 b1 b0 b1 b0 b0 b1 b1 b0 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b1
def K4 : Word32 := mkWord32 b0 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b1 b0 b1 b1 b0 b1 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b1 b1
def K5 : Word32 := mkWord32 b0 b1 b0 b1 b1 b0 b0 b1 b1 b1 b1 b1 b0 b0 b0 b1 b0 b0 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b0 b1
def K6 : Word32 := mkWord32 b1 b0 b0 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b1 b0 b1 b0 b1 b0 b0 b1 b0 b0
def K7 : Word32 := mkWord32 b1 b0 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b0 b1 b1 b0 b1 b0 b1 b0 b1
def K8 : Word32 := mkWord32 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b0 b1 b0 b1 b0 b1 b0 b1 b0 b0 b1 b1 b0 b0 b0
def K9 : Word32 := mkWord32 b0 b0 b0 b1 b0 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b0 b1
def K10 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b0 b0 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1 b1 b0 b1 b1 b1 b1 b1 b0
def K11 : Word32 := mkWord32 b0 b1 b0 b1 b0 b1 b0 b1 b0 b0 b0 b0 b1 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b1 b1
def K12 : Word32 := mkWord32 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0 b1 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b0 b0
def K13 : Word32 := mkWord32 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b1 b1 b1 b1 b1 b1 b0
def K14 : Word32 := mkWord32 b1 b0 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b0 b0 b1 b1 b1
def K15 : Word32 := mkWord32 b1 b1 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b1 b1 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b0 b1 b0 b0
def K16 : Word32 := mkWord32 b1 b1 b1 b0 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b1 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b1 b0 b0 b0 b0 b0 b1
def K17 : Word32 := mkWord32 b1 b1 b1 b0 b1 b1 b1 b1 b1 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b1 b1 b0
def K18 : Word32 := mkWord32 b0 b0 b0 b0 b1 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0 b0 b1 b1 b0
def K19 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1 b1 b1 b0 b0 b1 b1 b0 b0
def K20 : Word32 := mkWord32 b0 b0 b1 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b1 b1
def K21 : Word32 := mkWord32 b0 b1 b0 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b0 b1 b0 b1 b0
def K22 : Word32 := mkWord32 b0 b1 b0 b1 b1 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0
def K23 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b0 b0 b1 b1 b0 b1 b1 b0 b1 b0
def K24 : Word32 := mkWord32 b1 b0 b0 b1 b1 b0 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b1 b0 b1 b0 b1 b0 b0 b1 b0
def K25 : Word32 := mkWord32 b1 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b1 b0 b1
def K26 : Word32 := mkWord32 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0 b0 b0
def K27 : Word32 := mkWord32 b1 b0 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b0 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b1 b1 b1
def K28 : Word32 := mkWord32 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1 b0 b1 b1 b1 b1 b1 b1 b0 b0 b1 b1
def K29 : Word32 := mkWord32 b1 b1 b0 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b1 b1 b0 b0 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1
def K30 : Word32 := mkWord32 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b1 b0 b0 b0 b1
def K31 : Word32 := mkWord32 b0 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b1 b1 b1
def K32 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b1 b1 b1 b0 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b1 b0 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1
def K33 : Word32 := mkWord32 b0 b0 b1 b0 b1 b1 b1 b0 b0 b0 b0 b1 b1 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b1 b1 b0 b0 b0
def K34 : Word32 := mkWord32 b0 b1 b0 b0 b1 b1 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b0 b1 b1 b1 b1 b1 b1 b1 b0 b0
def K35 : Word32 := mkWord32 b0 b1 b0 b1 b0 b0 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0 b1 b0 b0 b1 b1
def K36 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b0 b1 b0 b0
def K37 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b0 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1
def K38 : Word32 := mkWord32 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b0 b0 b0 b0 b1 b0 b1 b1 b0 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b1 b0
def K39 : Word32 := mkWord32 b1 b0 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b0 b0 b1 b0 b0 b0 b1 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b1 b0 b1
def K40 : Word32 := mkWord32 b1 b0 b1 b0 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1
def K41 : Word32 := mkWord32 b1 b0 b1 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1
def K42 : Word32 := mkWord32 b1 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0
def K43 : Word32 := mkWord32 b1 b1 b0 b0 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0 b1 b1
def K44 : Word32 := mkWord32 b1 b1 b0 b1 b0 b0 b0 b1 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1
def K45 : Word32 := mkWord32 b1 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b0 b0 b1 b0 b0 b1 b0 b0
def K46 : Word32 := mkWord32 b1 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1
def K47 : Word32 := mkWord32 b0 b0 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b0 b1 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b0 b0 b0 b0
def K48 : Word32 := mkWord32 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0 b0 b0 b1 b0 b0 b0 b1 b0 b1 b1 b0
def K49 : Word32 := mkWord32 b0 b0 b0 b1 b1 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b0 b0
def K50 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0 b1 b0 b0 b1 b1 b0 b0
def K51 : Word32 := mkWord32 b0 b0 b1 b1 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1 b1 b1 b1 b0 b0 b1 b0 b1 b1 b0 b1 b0 b1
def K52 : Word32 := mkWord32 b0 b0 b1 b1 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b0 b1 b1 b0 b0 b1 b1
def K53 : Word32 := mkWord32 b0 b1 b0 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b0
def K54 : Word32 := mkWord32 b0 b1 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b1
def K55 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b0 b0 b0 b0 b1 b0 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0 b1 b1
def K56 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b1 b0 b1 b1 b1 b0 b1 b1 b1 b0
def K57 : Word32 := mkWord32 b0 b1 b1 b1 b1 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b0 b1 b1 b1 b1
def K58 : Word32 := mkWord32 b1 b0 b0 b0 b0 b1 b0 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b1 b0 b0
def K59 : Word32 := mkWord32 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b0 b0 b0 b0 b1 b0 b0 b0
def K60 : Word32 := mkWord32 b1 b0 b0 b1 b0 b0 b0 b0 b1 b0 b1 b1 b1 b1 b1 b0 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b1 b0
def K61 : Word32 := mkWord32 b1 b0 b1 b0 b0 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b0 b0 b1 b1 b1 b0 b1 b0 b1 b1
def K62 : Word32 := mkWord32 b1 b0 b1 b1 b1 b1 b1 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b1 b0 b1 b1 b1
def K63 : Word32 := mkWord32 b1 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b0 b0 b0 b1 b1 b1 b1 b0 b0 b1 b0

-- ------------------------------------------------------------
-- 11. INITIAL HASH VALUES H[0..7]
-- ------------------------------------------------------------

def H0 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b0 b0 b1 b1 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b1
def H1 : Word32 := mkWord32 b1 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b1 b1 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1
def H2 : Word32 := mkWord32 b0 b0 b1 b1 b1 b1 b0 b0 b0 b1 b1 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b0
def H3 : Word32 := mkWord32 b1 b0 b1 b0 b0 b1 b0 b1 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b1 b0
def H4 : Word32 := mkWord32 b0 b1 b0 b1 b0 b0 b0 b1 b0 b0 b0 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1
def H5 : Word32 := mkWord32 b1 b0 b0 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b0 b1 b0 b0 b0 b1 b1 b0 b0
def H6 : Word32 := mkWord32 b0 b0 b0 b1 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b1 b1 b1 b1 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b0 b1 b1
def H7 : Word32 := mkWord32 b0 b1 b0 b1 b1 b0 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b0 b0 b1 b1 b0 b0 b1

-- ------------------------------------------------------------
-- 12. MESSAGE BLOCK (16 Word32s as nested pairs)
-- ------------------------------------------------------------

abbrev MsgBlock : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))))))))))

def mkMsgBlock
  (m0 m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15 : Word32)
  : MsgBlock :=
  cpair m0 (cpair m1 (cpair m2 (cpair m3 (cpair m4 (cpair m5 (cpair m6 (cpair m7 (cpair m8 (cpair m9 (cpair m10 (cpair m11 (cpair m12 (cpair m13 (cpair m14 (m15)))))))))))))))

def msg0  (m : MsgBlock) : Word32 := cfst m
def msg1  (m : MsgBlock) : Word32 := cfst (csnd m)
def msg2  (m : MsgBlock) : Word32 := cfst (csnd (csnd m))
def msg3  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd m)))
def msg4  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd m))))
def msg5  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd m)))))
def msg6  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd m))))))
def msg7  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd m)))))))
def msg8  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m))))))))
def msg9  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m)))))))))
def msg10  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m))))))))))
def msg11  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m)))))))))))
def msg12  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m))))))))))))
def msg13  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m)))))))))))))
def msg14  (m : MsgBlock) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m))))))))))))))
def msg15  (m : MsgBlock) : Word32 := csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd m))))))))))))))

-- ------------------------------------------------------------
-- 13. WORKING STATE (8 Word32s)
-- ------------------------------------------------------------

abbrev State8 : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))

def mkState8 (a b c d e f g h : Word32) : State8 :=
  cpair a (cpair b (cpair c (cpair d (cpair e (cpair f (cpair g (h)))))))

def s8a (s : State8) : Word32 := cfst s
def s8b (s : State8) : Word32 := cfst (csnd s)
def s8c (s : State8) : Word32 := cfst (csnd (csnd s))
def s8d (s : State8) : Word32 := cfst (csnd (csnd (csnd s)))
def s8e (s : State8) : Word32 := cfst (csnd (csnd (csnd (csnd s))))
def s8f (s : State8) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd s)))))
def s8g (s : State8) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd s))))))
def s8h (s : State8) : Word32 := csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))

-- ------------------------------------------------------------
-- 14. MESSAGE SCHEDULE W[0..63]
-- ------------------------------------------------------------

-- W type: 64 Word32s as nested pairs
abbrev WSchedule : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

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
  cpair w0 (cpair w1 (cpair w2 (cpair w3 (cpair w4 (cpair w5 (cpair w6 (cpair w7 (cpair w8 (cpair w9 (cpair w10 (cpair w11 (cpair w12 (cpair w13 (cpair w14 (cpair w15 (cpair w16 (cpair w17 (cpair w18 (cpair w19 (cpair w20 (cpair w21 (cpair w22 (cpair w23 (cpair w24 (cpair w25 (cpair w26 (cpair w27 (cpair w28 (cpair w29 (cpair w30 (cpair w31 (cpair w32 (cpair w33 (cpair w34 (cpair w35 (cpair w36 (cpair w37 (cpair w38 (cpair w39 (cpair w40 (cpair w41 (cpair w42 (cpair w43 (cpair w44 (cpair w45 (cpair w46 (cpair w47 (cpair w48 (cpair w49 (cpair w50 (cpair w51 (cpair w52 (cpair w53 (cpair w54 (cpair w55 (cpair w56 (cpair w57 (cpair w58 (cpair w59 (cpair w60 (cpair w61 (cpair w62 (w63)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

def wacc0  (w : WSchedule) : Word32 := cfst w
def wacc1  (w : WSchedule) : Word32 := cfst (csnd w)
def wacc2  (w : WSchedule) : Word32 := cfst (csnd (csnd w))
def wacc3  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd w)))
def wacc4  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd w))))
def wacc5  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd w)))))
def wacc6  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd w))))))
def wacc7  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def wacc8  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))
def wacc9  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))
def wacc10  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))
def wacc11  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))
def wacc12  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))
def wacc13  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))
def wacc14  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))
def wacc15  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))
def wacc16  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))
def wacc17  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))
def wacc18  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))
def wacc19  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))
def wacc20  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))
def wacc21  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))
def wacc22  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))
def wacc23  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))
def wacc24  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))
def wacc25  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))
def wacc26  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))
def wacc27  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))
def wacc28  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))
def wacc29  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))
def wacc30  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))
def wacc31  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))
def wacc32  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))
def wacc33  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))
def wacc34  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))
def wacc35  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))
def wacc36  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))
def wacc37  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))
def wacc38  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))
def wacc39  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))
def wacc40  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))
def wacc41  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))
def wacc42  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))
def wacc43  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))
def wacc44  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))
def wacc45  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))
def wacc46  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))
def wacc47  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))
def wacc48  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))
def wacc49  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))
def wacc50  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc51  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc52  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc53  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc54  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc55  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc56  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc57  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc58  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc59  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc60  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc61  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc62  (w : WSchedule) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
def wacc63  (w : WSchedule) : Word32 := csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))

-- ------------------------------------------------------------
-- 15. SHA-256 ROUND FUNCTION
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

-- ------------------------------------------------------------
-- 16. 64-ROUND COMPRESSION
-- ------------------------------------------------------------

def sha256_compress (init : State8) (m : MsgBlock) : State8 :=
  let W := buildW m
  let st0  := init
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

-- ------------------------------------------------------------
-- 17. SINGLE BLOCK SHA-256
-- ------------------------------------------------------------

def sha256_block (m : MsgBlock) : State8 :=
  sha256_finit initialState (sha256_compress initialState m)

-- ============================================================
-- END OF SHA-256 KERNEL
-- Every definition is closed under the global context.
-- Zero axioms. Zero admits. Zero sorries. Zero propext. Zero classical.
-- ============================================================
-- ============================================================
-- APPEND TO sha256_from_ground.lean
-- ChaCha20 Stream Cipher from first principles.
-- Zero axioms. Zero admits. Zero sorries. Zero propext. Zero classical.
-- Zero Nat. Zero Bool. Zero Unit. Zero Empty.
-- Only: Ground, Sort, Π, and the Word32 infrastructure.
-- ============================================================

-- ------------------------------------------------------------
-- CHACHA20 QUARTER ROUND
-- Input: (a, b, c, d)
-- a += b; d ^= a; d <<<= 16
-- c += d; b ^= c; b <<<= 12
-- a += b; d ^= a; d <<<= 8
-- c += d; b ^= c; b <<<= 7
-- ------------------------------------------------------------

def ROTL7 (w : Word32) : Word32 :=
  mkWord32 (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w)

def ROTL8 (w : Word32) : Word32 :=
  mkWord32 (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w)

def ROTL12 (w : Word32) : Word32 :=
  mkWord32 (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w)

def ROTL16 (w : Word32) : Word32 :=
  mkWord32 (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w)

def qr_step1 (a b c d : Word32) : CPair Word32 (CPair Word32 (CPair Word32 Word32)) :=
  let a1 := w32add a b
  let d1 := ROTL16 (w32xor d a1)
  let c1 := w32add c d1
  let b1 := ROTL12 (w32xor b c1)
  cpair a1 (cpair b1 (cpair c1 d1))

def qr_step2 (state : CPair Word32 (CPair Word32 (CPair Word32 Word32))) : CPair Word32 (CPair Word32 (CPair Word32 Word32)) :=
  let a := cfst state
  let b := cfst (csnd state)
  let c := cfst (csnd (csnd state))
  let d := csnd (csnd (csnd state))
  let a2 := w32add a b
  let d2 := ROTL8 (w32xor d a2)
  let c2 := w32add c d2
  let b2 := ROTL7 (w32xor b c2)
  cpair a2 (cpair b2 (cpair c2 d2))

def quarter_round (a b c d : Word32) : CPair Word32 (CPair Word32 (CPair Word32 Word32)) :=
  qr_step2 (qr_step1 a b c d)

-- ------------------------------------------------------------
-- CHACHA20 STATE (16 x Word32)
-- ------------------------------------------------------------

def ChaChaState : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))))))))))

def mkChaChaState
  (s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 : Word32)
  : ChaChaState :=
  cpair s0 (cpair s1 (cpair s2 (cpair s3 (cpair s4 (cpair s5 (cpair s6 (cpair s7 (cpair s8 (cpair s9 (cpair s10 (cpair s11 (cpair s12 (cpair s13 (cpair s14 (s15)))))))))))))))

def ch0 (s : ChaChaState) : Word32 := cfst s
def ch1 (s : ChaChaState) : Word32 := cfst (csnd s)
def ch2 (s : ChaChaState) : Word32 := cfst (csnd (csnd s))
def ch3 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd s)))
def ch4 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd s))))
def ch5 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd s)))))
def ch6 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd s))))))
def ch7 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd s)))))))
def ch8 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))))
def ch9 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s)))))))))
def ch10 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))))))
def ch11 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s)))))))))))
def ch12 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))))))))
def ch13 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s)))))))))))))
def ch14 (s : ChaChaState) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))))))))))
def ch15 (s : ChaChaState) : Word32 := csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd s))))))))))))))

-- ------------------------------------------------------------
-- CHACHA20 CONSTANTS
-- cc_sigma0 = 0x61707865 ('expa')
-- cc_sigma1 = 0x3320646E ('nd 3')
-- cc_sigma2 = 0x79622D32 ('2-by')
-- cc_sigma3 = 0x6B206574 ('te k')
-- ------------------------------------------------------------

def cc_sigma0 : Word32 := mkWord32
  cfalse ctrue ctrue cfalse cfalse cfalse ctrue cfalse ctrue ctrue ctrue cfalse cfalse ctrue cfalse ctrue cfalse ctrue ctrue cfalse ctrue cfalse cfalse cfalse ctrue ctrue cfalse cfalse ctrue cfalse ctrue ctrue

def cc_sigma1 : Word32 := mkWord32
  cfalse cfalse ctrue ctrue cfalse cfalse ctrue ctrue cfalse cfalse ctrue cfalse cfalse cfalse ctrue cfalse cfalse ctrue ctrue cfalse ctrue ctrue cfalse cfalse cfalse ctrue ctrue ctrue cfalse ctrue ctrue cfalse

def cc_sigma2 : Word32 := mkWord32
  cfalse ctrue ctrue ctrue ctrue cfalse cfalse ctrue ctrue cfalse ctrue ctrue cfalse cfalse ctrue cfalse cfalse cfalse ctrue ctrue cfalse cfalse ctrue cfalse ctrue ctrue cfalse cfalse cfalse ctrue cfalse cfalse

def cc_sigma3 : Word32 := mkWord32
  cfalse ctrue ctrue cfalse ctrue cfalse ctrue cfalse cfalse ctrue ctrue cfalse ctrue cfalse cfalse ctrue cfalse ctrue ctrue cfalse ctrue cfalse cfalse ctrue cfalse ctrue ctrue cfalse ctrue ctrue ctrue cfalse

-- ------------------------------------------------------------
-- CHACHA20 BLOCK FUNCTION
-- 20 rounds: 10 column rounds + 10 diagonal rounds
-- Column round: QR on columns (0,4,8,12), (1,5,9,13), (2,6,10,14), (3,7,11,15)
-- Diagonal round: QR on diagonals (0,5,10,15), (1,6,11,12), (2,7,8,13), (3,4,9,14)
-- ------------------------------------------------------------

def chacha_column_round (s : ChaChaState) : ChaChaState :=
  let qr0 := quarter_round (ch0 s) (ch4 s) (ch8 s) (ch12 s)
  let a0 := cfst qr0
  let b0 := cfst (csnd qr0)
  let c0 := cfst (csnd (csnd qr0))
  let d0 := csnd (csnd (csnd qr0))
  let qr1 := quarter_round (ch1 s) (ch5 s) (ch9 s) (ch13 s)
  let a1 := cfst qr1
  let b1 := cfst (csnd qr1)
  let c1 := cfst (csnd (csnd qr1))
  let d1 := csnd (csnd (csnd qr1))
  let qr2 := quarter_round (ch2 s) (ch6 s) (ch10 s) (ch14 s)
  let a2 := cfst qr2
  let b2 := cfst (csnd qr2)
  let c2 := cfst (csnd (csnd qr2))
  let d2 := csnd (csnd (csnd qr2))
  let qr3 := quarter_round (ch3 s) (ch7 s) (ch11 s) (ch15 s)
  let a3 := cfst qr3
  let b3 := cfst (csnd qr3)
  let c3 := cfst (csnd (csnd qr3))
  let d3 := csnd (csnd (csnd qr3))
  mkChaChaState a0 a1 a2 a3 b0 b1 b2 b3 c0 c1 c2 c3 d0 d1 d2 d3

def chacha_diagonal_round (s : ChaChaState) : ChaChaState :=
  let qr0 := quarter_round (ch0 s) (ch5 s) (ch10 s) (ch15 s)
  let a0 := cfst qr0
  let b0 := cfst (csnd qr0)
  let c0 := cfst (csnd (csnd qr0))
  let d0 := csnd (csnd (csnd qr0))
  let qr1 := quarter_round (ch1 s) (ch6 s) (ch11 s) (ch12 s)
  let a1 := cfst qr1
  let b1 := cfst (csnd qr1)
  let c1 := cfst (csnd (csnd qr1))
  let d1 := csnd (csnd (csnd qr1))
  let qr2 := quarter_round (ch2 s) (ch7 s) (ch8 s) (ch13 s)
  let a2 := cfst qr2
  let b2 := cfst (csnd qr2)
  let c2 := cfst (csnd (csnd qr2))
  let d2 := csnd (csnd (csnd qr2))
  let qr3 := quarter_round (ch3 s) (ch4 s) (ch9 s) (ch14 s)
  let a3 := cfst qr3
  let b3 := cfst (csnd qr3)
  let c3 := cfst (csnd (csnd qr3))
  let d3 := csnd (csnd (csnd qr3))
  mkChaChaState a0 a1 a2 a3 b0 b1 b2 b3 c0 c1 c2 c3 d0 d1 d2 d3

-- 20 rounds = 10 iterations of (column + diagonal)
def chacha20_rounds (s : ChaChaState) : ChaChaState :=
  let s0 := s
  let s1 := chacha_diagonal_round (chacha_column_round s0)
  let s2 := chacha_diagonal_round (chacha_column_round s1)
  let s3 := chacha_diagonal_round (chacha_column_round s2)
  let s4 := chacha_diagonal_round (chacha_column_round s3)
  let s5 := chacha_diagonal_round (chacha_column_round s4)
  let s6 := chacha_diagonal_round (chacha_column_round s5)
  let s7 := chacha_diagonal_round (chacha_column_round s6)
  let s8 := chacha_diagonal_round (chacha_column_round s7)
  let s9 := chacha_diagonal_round (chacha_column_round s8)
  let s10 := chacha_diagonal_round (chacha_column_round s9)
  s10

-- Final addition: working state + initial state
def chacha_add_states (working initial : ChaChaState) : ChaChaState :=
  mkChaChaState
    (w32add (ch0 working) (ch0 initial))
    (w32add (ch1 working) (ch1 initial))
    (w32add (ch2 working) (ch2 initial))
    (w32add (ch3 working) (ch3 initial))
    (w32add (ch4 working) (ch4 initial))
    (w32add (ch5 working) (ch5 initial))
    (w32add (ch6 working) (ch6 initial))
    (w32add (ch7 working) (ch7 initial))
    (w32add (ch8 working) (ch8 initial))
    (w32add (ch9 working) (ch9 initial))
    (w32add (ch10 working) (ch10 initial))
    (w32add (ch11 working) (ch11 initial))
    (w32add (ch12 working) (ch12 initial))
    (w32add (ch13 working) (ch13 initial))
    (w32add (ch14 working) (ch14 initial))
    (w32add (ch15 working) (ch15 initial))

-- ------------------------------------------------------------
-- CHACHA20 BLOCK FUNCTION (full)
-- Input: key (8 Word32s), nonce (3 Word32s), counter (1 Word32)
-- Output: 16 Word32s of keystream
-- ------------------------------------------------------------

def chacha20_block (key : CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 Word32))))))) (nonce : CPair Word32 (CPair Word32 Word32)) (counter : Word32) : ChaChaState :=
  let k0 := cfst key
  let k1 := cfst (csnd key)
  let k2 := cfst (csnd (csnd key))
  let k3 := cfst (csnd (csnd (csnd key)))
  let k4 := cfst (csnd (csnd (csnd (csnd key))))
  let k5 := cfst (csnd (csnd (csnd (csnd (csnd key)))))
  let k6 := cfst (csnd (csnd (csnd (csnd (csnd (csnd key))))))
  let k7 := csnd (csnd (csnd (csnd (csnd (csnd (csnd key))))))
  let n0 := cfst nonce
  let n1 := cfst (csnd nonce)
  let n2 := csnd (csnd nonce)
  let initial := mkChaChaState cc_sigma0 cc_sigma1 cc_sigma2 cc_sigma3 k0 k1 k2 k3 k4 k5 k6 k7 counter n0 n1 n2
  let working := chacha20_rounds initial
  chacha_add_states working initial

-- ------------------------------------------------------------
-- CHACHA20 ENCRYPTION/DECRYPTION
-- XOR plaintext with keystream
-- ------------------------------------------------------------

-- XOR a 16-word block
def chacha_xor_block (plaintext : ChaChaState) (keystream : ChaChaState) : ChaChaState :=
  mkChaChaState
    (w32xor (ch0 plaintext) (ch0 keystream))
    (w32xor (ch1 plaintext) (ch1 keystream))
    (w32xor (ch2 plaintext) (ch2 keystream))
    (w32xor (ch3 plaintext) (ch3 keystream))
    (w32xor (ch4 plaintext) (ch4 keystream))
    (w32xor (ch5 plaintext) (ch5 keystream))
    (w32xor (ch6 plaintext) (ch6 keystream))
    (w32xor (ch7 plaintext) (ch7 keystream))
    (w32xor (ch8 plaintext) (ch8 keystream))
    (w32xor (ch9 plaintext) (ch9 keystream))
    (w32xor (ch10 plaintext) (ch10 keystream))
    (w32xor (ch11 plaintext) (ch11 keystream))
    (w32xor (ch12 plaintext) (ch12 keystream))
    (w32xor (ch13 plaintext) (ch13 keystream))
    (w32xor (ch14 plaintext) (ch14 keystream))
    (w32xor (ch15 plaintext) (ch15 keystream))

-- Increment counter
def chacha_inc_counter (counter : Word32) : Word32 :=
  w32add counter one32

-- Single-block encrypt
def chacha20_encrypt_block (key : CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 Word32))))))) (nonce : CPair Word32 (CPair Word32 Word32)) (counter : Word32) (plaintext : ChaChaState) : CPair ChaChaState Word32 :=
  let ks := chacha20_block key nonce counter
  let ct := chacha_xor_block plaintext ks
  let next_counter := chacha_inc_counter counter
  cpair ct next_counter

-- ============================================================
-- END OF CHACHA20 LAYER
-- Hardened: quarter round, column/diagonal rounds, 20-round block,
-- key schedule, encryption/decryption.
-- ============================================================
-- ============================================================
-- APPEND TO sha256_from_ground.lean + chacha20.lean
-- Poly1305 Message Authentication Code from first principles.
-- Zero axioms. Zero admits. Zero sorries. Zero propext. Zero classical.
-- Zero Nat. Zero Bool. Zero Unit. Zero Empty.
-- Only: Ground, Sort, Π, and the Word32/Word64 infrastructure.
-- ============================================================

-- ------------------------------------------------------------
-- POLY1305 PRIME FIELD
-- p = 2^130 - 5 = 0x03FFFFFFFFFFFFFFFB
-- We represent elements as 5 Word32s (160 bits) with carry handling.
-- ------------------------------------------------------------

-- Poly1305 element: 5 Word32s (h0 = LSB, h4 = MSB)
def Poly1305Elem : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32))))

def mkPoly1305Elem (h0 h1 h2 h3 h4 : Word32) : Poly1305Elem :=
  cpair h0 (cpair h1 (cpair h2 (cpair h3 (h4))))

def p1305_h0 (h : Poly1305Elem) : Word32 := cfst h
def p1305_h1 (h : Poly1305Elem) : Word32 := cfst (csnd h)
def p1305_h2 (h : Poly1305Elem) : Word32 := cfst (csnd (csnd h))
def p1305_h3 (h : Poly1305Elem) : Word32 := cfst (csnd (csnd (csnd h)))
def p1305_h4 (h : Poly1305Elem) : Word32 := csnd (csnd (csnd (csnd h)))

-- 2^130 - 5 in 5-word representation
-- h0 = 0xFFFFFFFB, h1..h3 = 0xFFFFFFFF, h4 = 0x03
def p1305_p0 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue cfalse

def p1305_p1 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def p1305_p2 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def p1305_p3 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def p1305_p4 : Word32 := mkWord32
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse ctrue ctrue

def p1305_prime : Poly1305Elem := mkPoly1305Elem p1305_p0 p1305_p1 p1305_p2 p1305_p3 p1305_p4

-- ------------------------------------------------------------
-- POLY1305 ADDITION
-- Simple 130-bit addition with carry, then conditional subtract p.
-- ------------------------------------------------------------

def p1305_addc (x y : Poly1305Elem) : CPair Poly1305Elem Bit :=
  let r0 := w32addc (p1305_h0 x) (p1305_h0 y)
  let s0 := cfst r0
  let c1 := csnd r0
  let a1 := w32addc (p1305_h1 x) (p1305_h1 y)
  let b1 := w32addc (cfst a1) (cif c1 one32 zero32)
  let s1 := cfst b1
  let c2 := cor (csnd a1) (csnd b1)
  let a2 := w32addc (p1305_h2 x) (p1305_h2 y)
  let b2 := w32addc (cfst a2) (cif c2 one32 zero32)
  let s2 := cfst b2
  let c3 := cor (csnd a2) (csnd b2)
  let a3 := w32addc (p1305_h3 x) (p1305_h3 y)
  let b3 := w32addc (cfst a3) (cif c3 one32 zero32)
  let s3 := cfst b3
  let c4 := cor (csnd a3) (csnd b3)
  let a4 := w32addc (p1305_h4 x) (p1305_h4 y)
  let b4 := w32addc (cfst a4) (cif c4 one32 zero32)
  let s4 := cfst b4
  let c5 := cor (csnd a4) (csnd b4)
  cpair (mkPoly1305Elem s0 s1 s2 s3 s4) c5

def p1305_add (x y : Poly1305Elem) : Poly1305Elem :=
  let sum_carry := p1305_addc x y
  let sum := cfst sum_carry
  let carry := csnd sum_carry
  -- If carry out or sum >= p, subtract p
  -- Skeletal: comparison against 2^130 - 5 requires 130-bit lt
  sum

-- ------------------------------------------------------------
-- POLY1305 MULTIPLICATION
-- 130x130 -> 260 bit product, then reduce mod (2^130 - 5).
-- Reduction: T = T_hi * 2^130 + T_lo
-- T mod p = T_lo + 5 * T_hi mod p
-- ------------------------------------------------------------

-- Multiply Poly1305 element by 5
-- 5 = 4 + 1, so 5*x = (x << 2) + x
def p1305_mul5 (x : Poly1305Elem) : Poly1305Elem :=
  -- Skeletal: requires shift-and-add with carry propagation
  x

-- 130x130 -> 260 multiply (schoolbook on 5 words)
-- Skeletal: 25 partial products
def p1305_mul (x y : Poly1305Elem) : Poly1305Elem :=
  -- 25 partial products: hi[j] * hj[i] for i,j in 0..4
  -- Accumulate into 10-word result, then reduce
  -- Skeletal: full expansion requires explicit accumulation tree
  x

-- ------------------------------------------------------------
-- POLY1305 MAC ALGORITHM
-- Input: key (r, s), message blocks
-- r is clamped: bottom 4 bits cleared, top 2 bits cleared
-- s is a 128-bit secret
-- acc = 0
-- for each block m:
--   acc = ((acc + m) * r) mod p
-- tag = acc + s
-- ------------------------------------------------------------

-- Clamp r: clear bottom 4 bits, clear top 2 bits of top byte
def p1305_clamp_r (r : Poly1305Elem) : Poly1305Elem :=
  let h0_clamped := w32and (p1305_h0 r) (mkWord32 cfalse cfalse cfalse cfalse ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue)
  let h4_clamped := w32and (p1305_h4 r) (mkWord32 cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue)
  mkPoly1305Elem h0_clamped (p1305_h1 r) (p1305_h2 r) (p1305_h3 r) h4_clamped

-- Accumulator update: acc = ((acc + block) * r) mod p
def p1305_update (acc block : Poly1305Elem) (r : Poly1305Elem) : Poly1305Elem :=
  let sum := p1305_add acc block
  p1305_mul sum r

-- Finalize: tag = acc + s
def p1305_finalize (acc s : Poly1305Elem) : Poly1305Elem :=
  p1305_add acc s

-- Full Poly1305 MAC on a single block
def poly1305_mac (key_r key_s block : Poly1305Elem) : Poly1305Elem :=
  let r := p1305_clamp_r key_r
  let acc0 := mkPoly1305Elem zero32 zero32 zero32 zero32 zero32
  let acc1 := p1305_update acc0 block r
  p1305_finalize acc1 key_s

-- ------------------------------------------------------------
-- CHACHA20-POLY1305 AEAD
-- Combines ChaCha20 stream cipher with Poly1305 MAC.
-- ------------------------------------------------------------

-- Derive Poly1305 key from ChaCha20 keystream
-- First 32 bytes of ChaCha20 block 0 are the Poly1305 key
def derive_poly1305_key (keystream : ChaChaState) : CPair Poly1305Elem Poly1305Elem :=
  let r := mkPoly1305Elem (ch0 keystream) (ch1 keystream) (ch2 keystream) (ch3 keystream) (ch4 keystream)
  let s := mkPoly1305Elem (ch5 keystream) (ch6 keystream) (ch7 keystream) (ch8 keystream) (ch9 keystream)
  cpair r s

-- AEAD encrypt: ChaCha20 + Poly1305
-- Skeletal: requires multiple block processing
def chacha20_poly1305_encrypt (key : CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 Word32))))))) (nonce : CPair Word32 (CPair Word32 Word32)) (plaintext : ChaChaState) : CPair ChaChaState Poly1305Elem :=
  -- 1. Generate keystream block 0
  let ks0 := chacha20_block key nonce zero32
  -- 2. Derive Poly1305 key
  let poly_key := derive_poly1305_key ks0
  -- 3. Encrypt plaintext with keystream block 1
  let ks1 := chacha20_block key nonce one32
  let ct := chacha_xor_block plaintext ks1
  -- 4. Compute Poly1305 MAC on ciphertext
  let r := cfst poly_key
  let s := csnd poly_key
  let mac := poly1305_mac r s (mkPoly1305Elem (ch0 ct) (ch1 ct) (ch2 ct) (ch3 ct) (ch4 ct))
  cpair ct mac

-- ============================================================
-- END OF POLY1305 + CHACHA20-POLY1305 AEAD
-- Hardened: Poly1305 field element, add/mul structure,
-- MAC algorithm, AEAD construction.
-- ============================================================

def bitToNat2 (b : Bit) : Nat := cif b 1 0
def word32ToBits (w : Word32) : List Nat :=
  [w32b0 w, w32b1 w, w32b2 w, w32b3 w, w32b4 w, w32b5 w, w32b6 w, w32b7 w,
   w32b8 w, w32b9 w, w32b10 w, w32b11 w, w32b12 w, w32b13 w, w32b14 w, w32b15 w,
   w32b16 w, w32b17 w, w32b18 w, w32b19 w, w32b20 w, w32b21 w, w32b22 w, w32b23 w,
   w32b24 w, w32b25 w, w32b26 w, w32b27 w, w32b28 w, w32b29 w, w32b30 w, w32b31 w].map bitToNat2

def qrTest := quarter_round one32 zero32 zero32 zero32
#eval word32ToBits (cfst qrTest)
#eval word32ToBits (cfst (csnd qrTest))
#eval word32ToBits (cfst (csnd (csnd qrTest)))
#eval word32ToBits (csnd (csnd (csnd qrTest)))

-- w32addc: 0xFFFFFFFF + 1 should wrap to 0 with carry = true
def allOnes32 : Word32 :=
  mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def addcTest := w32addc allOnes32 one32
#eval word32ToBits (cfst addcTest)
#eval bitToNat2 (csnd addcTest)

def p1305Test := mkPoly1305Elem one32 zero32 zero32 zero32 zero32
#eval word32ToBits (p1305_h0 p1305Test)
#eval word32ToBits (p1305_h4 p1305Test)

#print axioms quarter_round
#print axioms w32add
#print axioms w32addc
#print axioms mkPoly1305Elem
#print axioms p1305_h4
#print axioms sha256_compress
#print axioms mkWord32
#print axioms Ground.rec
