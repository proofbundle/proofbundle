prelude

-- ============================================================
-- P-256 (secp256r1) Prime Field from absolute first principles.
-- Self-contained. Zero imports. Zero axioms. Zero admits. Zero sorries.
-- Zero propext. Zero classical. Zero Nat. Zero Bool.
-- Zero Unit. Zero Empty. Zero product. Zero sum.
-- Only: Ground, Sort, Π.
-- ============================================================

universe u v w

inductive Ground : Sort u where | pt : Ground

def CBool : Sort 1 := ∀ (X : Sort 1), X → X → X
def ctrue  : CBool := λ X t f => t
def cfalse : CBool := λ X t f => f
def cnot (b : CBool) : CBool := λ X t f => b X f t
def cand (a b : CBool) : CBool := λ X t f => a X (b X t f) f
def cor  (a b : CBool) : CBool := λ X t f => a X t (b X t f)
def cxor (a b : CBool) : CBool := λ X t f => a X (b X f t) (b X t f)
def cif  (b : CBool) {X : Sort 1} (t f : X) : X := b X t f

def CPair (A B : Sort 1) : Sort 1 := ∀ (X : Sort 1), (A → B → X) → X
def cpair {A B : Sort 1} (a : A) (b : B) : CPair A B := λ X f => f a b
def cfst {A B : Sort 1} (p : CPair A B) : A := p A (λ a _ => a)
def csnd {A B : Sort 1} (p : CPair A B) : B := p B (λ _ b => b)

def CNat : Sort 1 := ∀ (X : Sort 1), (X → X) → X → X
def czero : CNat := λ X s z => z
def csucc (n : CNat) : CNat := λ X s z => s (n X s z)
def cadd (n m : CNat) : CNat := λ X s z => m X s (n X s z)
def cmul (n m : CNat) : CNat := λ X s z => n X (λ x => m X s x) z

def Bit : Sort 1 := CBool
def b1 : Bit := ctrue
def b0 : Bit := cfalse

def Word32 : Sort 1 :=
  CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit ( CPair Bit (Ground)))))))))))))))))))))))))))))))

def w32b0 (w : Word32) : Bit := cfst w
def w32b1 (w : Word32) : Bit := cfst (csnd w))
def w32b2 (w : Word32) : Bit := cfst (csnd (csnd w)))
def w32b3 (w : Word32) : Bit := cfst (csnd (csnd (csnd w))))
def w32b4 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd w)))))
def w32b5 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd w))))))
def w32b6 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def w32b7 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))
def w32b8 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))
def w32b9 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))
def w32b10 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))
def w32b11 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))
def w32b12 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))
def w32b13 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))
def w32b14 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))
def w32b15 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))
def w32b16 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))
def w32b17 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))
def w32b18 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))
def w32b19 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))
def w32b20 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))
def w32b21 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))
def w32b22 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))
def w32b23 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))
def w32b24 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))
def w32b25 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))
def w32b26 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))
def w32b27 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))
def w32b28 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))
def w32b29 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))
def w32b30 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))))))))))))))))))
def w32b31 (w : Word32) : Bit := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))))))))))))))))))

def mkWord32
  (b0 b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 b11 b12 b13 b14 b15
   b16 b17 b18 b19 b20 b21 b22 b23 b24 b25 b26 b27 b28 b29 b30 b31 : Bit)
  : Word32 :=
  cpair b0 (cpair b1 (cpair b2 (cpair b3 (cpair b4 (cpair b5 (cpair b6 (cpair b7 (cpair b8 (cpair b9 (cpair b10 (cpair b11 (cpair b12 (cpair b13 (cpair b14 (cpair b15 (cpair b16 (cpair b17 (cpair b18 (cpair b19 (cpair b20 (cpair b21 (cpair b22 (cpair b23 (cpair b24 (cpair b25 (cpair b26 (cpair b27 (cpair b28 (cpair b29 (cpair b30 (cpair b31 (Ground.pt))))))))))))))))))))))))))))))))

def w32not (w : Word32) : Word32 :=
  mkWord32 (cnot (w32b0 w)) (cnot (w32b1 w)) (cnot (w32b2 w)) (cnot (w32b3 w)) (cnot (w32b4 w)) (cnot (w32b5 w)) (cnot (w32b6 w)) (cnot (w32b7 w)) (cnot (w32b8 w)) (cnot (w32b9 w)) (cnot (w32b10 w)) (cnot (w32b11 w)) (cnot (w32b12 w)) (cnot (w32b13 w)) (cnot (w32b14 w)) (cnot (w32b15 w)) (cnot (w32b16 w)) (cnot (w32b17 w)) (cnot (w32b18 w)) (cnot (w32b19 w)) (cnot (w32b20 w)) (cnot (w32b21 w)) (cnot (w32b22 w)) (cnot (w32b23 w)) (cnot (w32b24 w)) (cnot (w32b25 w)) (cnot (w32b26 w)) (cnot (w32b27 w)) (cnot (w32b28 w)) (cnot (w32b29 w)) (cnot (w32b30 w)) (cnot (w32b31 w))

def w32and (x y : Word32) : Word32 :=
  mkWord32 (cand (w32b0 x) (w32b0 y)) (cand (w32b1 x) (w32b1 y)) (cand (w32b2 x) (w32b2 y)) (cand (w32b3 x) (w32b3 y)) (cand (w32b4 x) (w32b4 y)) (cand (w32b5 x) (w32b5 y)) (cand (w32b6 x) (w32b6 y)) (cand (w32b7 x) (w32b7 y)) (cand (w32b8 x) (w32b8 y)) (cand (w32b9 x) (w32b9 y)) (cand (w32b10 x) (w32b10 y)) (cand (w32b11 x) (w32b11 y)) (cand (w32b12 x) (w32b12 y)) (cand (w32b13 x) (w32b13 y)) (cand (w32b14 x) (w32b14 y)) (cand (w32b15 x) (w32b15 y)) (cand (w32b16 x) (w32b16 y)) (cand (w32b17 x) (w32b17 y)) (cand (w32b18 x) (w32b18 y)) (cand (w32b19 x) (w32b19 y)) (cand (w32b20 x) (w32b20 y)) (cand (w32b21 x) (w32b21 y)) (cand (w32b22 x) (w32b22 y)) (cand (w32b23 x) (w32b23 y)) (cand (w32b24 x) (w32b24 y)) (cand (w32b25 x) (w32b25 y)) (cand (w32b26 x) (w32b26 y)) (cand (w32b27 x) (w32b27 y)) (cand (w32b28 x) (w32b28 y)) (cand (w32b29 x) (w32b29 y)) (cand (w32b30 x) (w32b30 y)) (cand (w32b31 x) (w32b31 y))

def w32or (x y : Word32) : Word32 :=
  mkWord32 (cor (w32b0 x) (w32b0 y)) (cor (w32b1 x) (w32b1 y)) (cor (w32b2 x) (w32b2 y)) (cor (w32b3 x) (w32b3 y)) (cor (w32b4 x) (w32b4 y)) (cor (w32b5 x) (w32b5 y)) (cor (w32b6 x) (w32b6 y)) (cor (w32b7 x) (w32b7 y)) (cor (w32b8 x) (w32b8 y)) (cor (w32b9 x) (w32b9 y)) (cor (w32b10 x) (w32b10 y)) (cor (w32b11 x) (w32b11 y)) (cor (w32b12 x) (w32b12 y)) (cor (w32b13 x) (w32b13 y)) (cor (w32b14 x) (w32b14 y)) (cor (w32b15 x) (w32b15 y)) (cor (w32b16 x) (w32b16 y)) (cor (w32b17 x) (w32b17 y)) (cor (w32b18 x) (w32b18 y)) (cor (w32b19 x) (w32b19 y)) (cor (w32b20 x) (w32b20 y)) (cor (w32b21 x) (w32b21 y)) (cor (w32b22 x) (w32b22 y)) (cor (w32b23 x) (w32b23 y)) (cor (w32b24 x) (w32b24 y)) (cor (w32b25 x) (w32b25 y)) (cor (w32b26 x) (w32b26 y)) (cor (w32b27 x) (w32b27 y)) (cor (w32b28 x) (w32b28 y)) (cor (w32b29 x) (w32b29 y)) (cor (w32b30 x) (w32b30 y)) (cor (w32b31 x) (w32b31 y))

def w32xor (x y : Word32) : Word32 :=
  mkWord32 (cxor (w32b0 x) (w32b0 y)) (cxor (w32b1 x) (w32b1 y)) (cxor (w32b2 x) (w32b2 y)) (cxor (w32b3 x) (w32b3 y)) (cxor (w32b4 x) (w32b4 y)) (cxor (w32b5 x) (w32b5 y)) (cxor (w32b6 x) (w32b6 y)) (cxor (w32b7 x) (w32b7 y)) (cxor (w32b8 x) (w32b8 y)) (cxor (w32b9 x) (w32b9 y)) (cxor (w32b10 x) (w32b10 y)) (cxor (w32b11 x) (w32b11 y)) (cxor (w32b12 x) (w32b12 y)) (cxor (w32b13 x) (w32b13 y)) (cxor (w32b14 x) (w32b14 y)) (cxor (w32b15 x) (w32b15 y)) (cxor (w32b16 x) (w32b16 y)) (cxor (w32b17 x) (w32b17 y)) (cxor (w32b18 x) (w32b18 y)) (cxor (w32b19 x) (w32b19 y)) (cxor (w32b20 x) (w32b20 y)) (cxor (w32b21 x) (w32b21 y)) (cxor (w32b22 x) (w32b22 y)) (cxor (w32b23 x) (w32b23 y)) (cxor (w32b24 x) (w32b24 y)) (cxor (w32b25 x) (w32b25 y)) (cxor (w32b26 x) (w32b26 y)) (cxor (w32b27 x) (w32b27 y)) (cxor (w32b28 x) (w32b28 y)) (cxor (w32b29 x) (w32b29 y)) (cxor (w32b30 x) (w32b30 y)) (cxor (w32b31 x) (w32b31 y))

def halfAdder (a b : Bit) : CPair Bit Bit := cpair (cxor a b) (cand a b)
def fullAdder (a b cin : Bit) : CPair Bit Bit :=
  let hs1 := halfAdder a b
  let d1 := cfst hs1
  let b1 := csnd hs1
  let hs2 := halfAdder d1 cin
  let d2 := cfst hs2
  let b2 := csnd hs2
  cpair d2 (cor b1 b2)

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
  cpair (mkWord32 s0 s1 s2 s3 s4 s5 s6 s7 s8 s9 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26 s27 s28 s29 s30 s31) c32

def w32add (x y : Word32) : Word32 := cfst (w32addc x y)

def w32eq (x y : Word32) : CBool :=
  let e0  := cnot (cxor (w32b0 x) (w32b0 y))
  let e1  := cand e0 (cnot (cxor (w32b1 x) (w32b1 y)))
  let e2  := cand e1 (cnot (cxor (w32b2 x) (w32b2 y)))
  let e3  := cand e2 (cnot (cxor (w32b3 x) (w32b3 y)))
  let e4  := cand e3 (cnot (cxor (w32b4 x) (w32b4 y)))
  let e5  := cand e4 (cnot (cxor (w32b5 x) (w32b5 y)))
  let e6  := cand e5 (cnot (cxor (w32b6 x) (w32b6 y)))
  let e7  := cand e6 (cnot (cxor (w32b7 x) (w32b7 y)))
  let e8  := cand e7 (cnot (cxor (w32b8 x) (w32b8 y)))
  let e9  := cand e8 (cnot (cxor (w32b9 x) (w32b9 y)))
  let e10  := cand e9 (cnot (cxor (w32b10 x) (w32b10 y)))
  let e11  := cand e10 (cnot (cxor (w32b11 x) (w32b11 y)))
  let e12  := cand e11 (cnot (cxor (w32b12 x) (w32b12 y)))
  let e13  := cand e12 (cnot (cxor (w32b13 x) (w32b13 y)))
  let e14  := cand e13 (cnot (cxor (w32b14 x) (w32b14 y)))
  let e15  := cand e14 (cnot (cxor (w32b15 x) (w32b15 y)))
  let e16  := cand e15 (cnot (cxor (w32b16 x) (w32b16 y)))
  let e17  := cand e16 (cnot (cxor (w32b17 x) (w32b17 y)))
  let e18  := cand e17 (cnot (cxor (w32b18 x) (w32b18 y)))
  let e19  := cand e18 (cnot (cxor (w32b19 x) (w32b19 y)))
  let e20  := cand e19 (cnot (cxor (w32b20 x) (w32b20 y)))
  let e21  := cand e20 (cnot (cxor (w32b21 x) (w32b21 y)))
  let e22  := cand e21 (cnot (cxor (w32b22 x) (w32b22 y)))
  let e23  := cand e22 (cnot (cxor (w32b23 x) (w32b23 y)))
  let e24  := cand e23 (cnot (cxor (w32b24 x) (w32b24 y)))
  let e25  := cand e24 (cnot (cxor (w32b25 x) (w32b25 y)))
  let e26  := cand e25 (cnot (cxor (w32b26 x) (w32b26 y)))
  let e27  := cand e26 (cnot (cxor (w32b27 x) (w32b27 y)))
  let e28  := cand e27 (cnot (cxor (w32b28 x) (w32b28 y)))
  let e29  := cand e28 (cnot (cxor (w32b29 x) (w32b29 y)))
  let e30  := cand e29 (cnot (cxor (w32b30 x) (w32b30 y)))
  let e31  := cand e30 (cnot (cxor (w32b31 x) (w32b31 y)))
  e31

def w32lt (x y : Word32) : CBool :=
  let lt0  := cand (cnot (w32b0 x)) (w32b0 y)
  let eq0  := cnot (cxor (w32b0 x) (w32b0 y))
  let lt1  := cor lt0 (cand eq0 (cand (cnot (w32b1 x)) (w32b1 y)))
  let eq1  := cand eq0 (cnot (cxor (w32b1 x) (w32b1 y)))
  let lt2  := cor lt1 (cand eq1 (cand (cnot (w32b2 x)) (w32b2 y)))
  let eq2  := cand eq1 (cnot (cxor (w32b2 x) (w32b2 y)))
  let lt3  := cor lt2 (cand eq2 (cand (cnot (w32b3 x)) (w32b3 y)))
  let eq3  := cand eq2 (cnot (cxor (w32b3 x) (w32b3 y)))
  let lt4  := cor lt3 (cand eq3 (cand (cnot (w32b4 x)) (w32b4 y)))
  let eq4  := cand eq3 (cnot (cxor (w32b4 x) (w32b4 y)))
  let lt5  := cor lt4 (cand eq4 (cand (cnot (w32b5 x)) (w32b5 y)))
  let eq5  := cand eq4 (cnot (cxor (w32b5 x) (w32b5 y)))
  let lt6  := cor lt5 (cand eq5 (cand (cnot (w32b6 x)) (w32b6 y)))
  let eq6  := cand eq5 (cnot (cxor (w32b6 x) (w32b6 y)))
  let lt7  := cor lt6 (cand eq6 (cand (cnot (w32b7 x)) (w32b7 y)))
  let eq7  := cand eq6 (cnot (cxor (w32b7 x) (w32b7 y)))
  let lt8  := cor lt7 (cand eq7 (cand (cnot (w32b8 x)) (w32b8 y)))
  let eq8  := cand eq7 (cnot (cxor (w32b8 x) (w32b8 y)))
  let lt9  := cor lt8 (cand eq8 (cand (cnot (w32b9 x)) (w32b9 y)))
  let eq9  := cand eq8 (cnot (cxor (w32b9 x) (w32b9 y)))
  let lt10  := cor lt9 (cand eq9 (cand (cnot (w32b10 x)) (w32b10 y)))
  let eq10  := cand eq9 (cnot (cxor (w32b10 x) (w32b10 y)))
  let lt11  := cor lt10 (cand eq10 (cand (cnot (w32b11 x)) (w32b11 y)))
  let eq11  := cand eq10 (cnot (cxor (w32b11 x) (w32b11 y)))
  let lt12  := cor lt11 (cand eq11 (cand (cnot (w32b12 x)) (w32b12 y)))
  let eq12  := cand eq11 (cnot (cxor (w32b12 x) (w32b12 y)))
  let lt13  := cor lt12 (cand eq12 (cand (cnot (w32b13 x)) (w32b13 y)))
  let eq13  := cand eq12 (cnot (cxor (w32b13 x) (w32b13 y)))
  let lt14  := cor lt13 (cand eq13 (cand (cnot (w32b14 x)) (w32b14 y)))
  let eq14  := cand eq13 (cnot (cxor (w32b14 x) (w32b14 y)))
  let lt15  := cor lt14 (cand eq14 (cand (cnot (w32b15 x)) (w32b15 y)))
  let eq15  := cand eq14 (cnot (cxor (w32b15 x) (w32b15 y)))
  let lt16  := cor lt15 (cand eq15 (cand (cnot (w32b16 x)) (w32b16 y)))
  let eq16  := cand eq15 (cnot (cxor (w32b16 x) (w32b16 y)))
  let lt17  := cor lt16 (cand eq16 (cand (cnot (w32b17 x)) (w32b17 y)))
  let eq17  := cand eq16 (cnot (cxor (w32b17 x) (w32b17 y)))
  let lt18  := cor lt17 (cand eq17 (cand (cnot (w32b18 x)) (w32b18 y)))
  let eq18  := cand eq17 (cnot (cxor (w32b18 x) (w32b18 y)))
  let lt19  := cor lt18 (cand eq18 (cand (cnot (w32b19 x)) (w32b19 y)))
  let eq19  := cand eq18 (cnot (cxor (w32b19 x) (w32b19 y)))
  let lt20  := cor lt19 (cand eq19 (cand (cnot (w32b20 x)) (w32b20 y)))
  let eq20  := cand eq19 (cnot (cxor (w32b20 x) (w32b20 y)))
  let lt21  := cor lt20 (cand eq20 (cand (cnot (w32b21 x)) (w32b21 y)))
  let eq21  := cand eq20 (cnot (cxor (w32b21 x) (w32b21 y)))
  let lt22  := cor lt21 (cand eq21 (cand (cnot (w32b22 x)) (w32b22 y)))
  let eq22  := cand eq21 (cnot (cxor (w32b22 x) (w32b22 y)))
  let lt23  := cor lt22 (cand eq22 (cand (cnot (w32b23 x)) (w32b23 y)))
  let eq23  := cand eq22 (cnot (cxor (w32b23 x) (w32b23 y)))
  let lt24  := cor lt23 (cand eq23 (cand (cnot (w32b24 x)) (w32b24 y)))
  let eq24  := cand eq23 (cnot (cxor (w32b24 x) (w32b24 y)))
  let lt25  := cor lt24 (cand eq24 (cand (cnot (w32b25 x)) (w32b25 y)))
  let eq25  := cand eq24 (cnot (cxor (w32b25 x) (w32b25 y)))
  let lt26  := cor lt25 (cand eq25 (cand (cnot (w32b26 x)) (w32b26 y)))
  let eq26  := cand eq25 (cnot (cxor (w32b26 x) (w32b26 y)))
  let lt27  := cor lt26 (cand eq26 (cand (cnot (w32b27 x)) (w32b27 y)))
  let eq27  := cand eq26 (cnot (cxor (w32b27 x) (w32b27 y)))
  let lt28  := cor lt27 (cand eq27 (cand (cnot (w32b28 x)) (w32b28 y)))
  let eq28  := cand eq27 (cnot (cxor (w32b28 x) (w32b28 y)))
  let lt29  := cor lt28 (cand eq28 (cand (cnot (w32b29 x)) (w32b29 y)))
  let eq29  := cand eq28 (cnot (cxor (w32b29 x) (w32b29 y)))
  let lt30  := cor lt29 (cand eq29 (cand (cnot (w32b30 x)) (w32b30 y)))
  let eq30  := cand eq29 (cnot (cxor (w32b30 x) (w32b30 y)))
  let lt31  := cor lt30 (cand eq30 (cand (cnot (w32b31 x)) (w32b31 y)))
  let eq31  := cand eq30 (cnot (cxor (w32b31 x) (w32b31 y)))
  lt31

def w32shl1 (w : Word32) : Word32 :=
  mkWord32 (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) cfalse

def w32shr1 (w : Word32) : Word32 :=
  mkWord32 cfalse (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w)

def Word64 : Sort 1 := CPair Word32 Word32
def mkWord64 (hi lo : Word32) : Word64 := cpair hi lo
def w64hi (w : Word64) : Word32 := cfst w
def w64lo (w : Word64) : Word32 := csnd w

def zero32 : Word32 := mkWord32
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse
  cfalse

def one32 : Word32 := mkWord32
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse ctrue

def w64add (x y : Word64) : Word64 :=
  let lo_res := w32addc (w64lo x) (w64lo y)
  let lo_sum := cfst lo_res
  let lo_carry := csnd lo_res
  let hi_temp := w32add (w64hi y) (cif lo_carry one32 zero32)
  let hi_sum := w32add (w64hi x) hi_temp
  mkWord64 hi_sum lo_sum

def w64shl1 (w : Word64) : Word64 :=
  let lo := w64lo w
  let hi := w64hi w
  let lo_shl := w32shl1 lo
  let lo_msb := w32b0 lo
  let hi_shl := w32shl1 hi
  let hi_new := cif lo_msb (w32or hi_shl one32) hi_shl
  mkWord64 hi_new lo_shl

def mul32x32 (x y : Word32) : Word64 :=
  let acc0 := mkWord64 zero32 zero32
  let mc0 := mkWord64 zero32 y
  let mp0 := x
  let add0 := w64add acc0 (cif (w32b31 mp0) mc0 (mkWord64 zero32 zero32))
  let acc1 := add0
  let mc1 := w64shl1 mc0
  let mp1 := w32shr1 mp0
  let add1 := w64add acc1 (cif (w32b31 mp1) mc1 (mkWord64 zero32 zero32))
  let acc2 := add1
  let mc2 := w64shl1 mc1
  let mp2 := w32shr1 mp1
  let add2 := w64add acc2 (cif (w32b31 mp2) mc2 (mkWord64 zero32 zero32))
  let acc3 := add2
  let mc3 := w64shl1 mc2
  let mp3 := w32shr1 mp2
  let add3 := w64add acc3 (cif (w32b31 mp3) mc3 (mkWord64 zero32 zero32))
  let acc4 := add3
  let mc4 := w64shl1 mc3
  let mp4 := w32shr1 mp3
  let add4 := w64add acc4 (cif (w32b31 mp4) mc4 (mkWord64 zero32 zero32))
  let acc5 := add4
  let mc5 := w64shl1 mc4
  let mp5 := w32shr1 mp4
  let add5 := w64add acc5 (cif (w32b31 mp5) mc5 (mkWord64 zero32 zero32))
  let acc6 := add5
  let mc6 := w64shl1 mc5
  let mp6 := w32shr1 mp5
  let add6 := w64add acc6 (cif (w32b31 mp6) mc6 (mkWord64 zero32 zero32))
  let acc7 := add6
  let mc7 := w64shl1 mc6
  let mp7 := w32shr1 mp6
  let add7 := w64add acc7 (cif (w32b31 mp7) mc7 (mkWord64 zero32 zero32))
  let acc8 := add7
  let mc8 := w64shl1 mc7
  let mp8 := w32shr1 mp7
  let add8 := w64add acc8 (cif (w32b31 mp8) mc8 (mkWord64 zero32 zero32))
  let acc9 := add8
  let mc9 := w64shl1 mc8
  let mp9 := w32shr1 mp8
  let add9 := w64add acc9 (cif (w32b31 mp9) mc9 (mkWord64 zero32 zero32))
  let acc10 := add9
  let mc10 := w64shl1 mc9
  let mp10 := w32shr1 mp9
  let add10 := w64add acc10 (cif (w32b31 mp10) mc10 (mkWord64 zero32 zero32))
  let acc11 := add10
  let mc11 := w64shl1 mc10
  let mp11 := w32shr1 mp10
  let add11 := w64add acc11 (cif (w32b31 mp11) mc11 (mkWord64 zero32 zero32))
  let acc12 := add11
  let mc12 := w64shl1 mc11
  let mp12 := w32shr1 mp11
  let add12 := w64add acc12 (cif (w32b31 mp12) mc12 (mkWord64 zero32 zero32))
  let acc13 := add12
  let mc13 := w64shl1 mc12
  let mp13 := w32shr1 mp12
  let add13 := w64add acc13 (cif (w32b31 mp13) mc13 (mkWord64 zero32 zero32))
  let acc14 := add13
  let mc14 := w64shl1 mc13
  let mp14 := w32shr1 mp13
  let add14 := w64add acc14 (cif (w32b31 mp14) mc14 (mkWord64 zero32 zero32))
  let acc15 := add14
  let mc15 := w64shl1 mc14
  let mp15 := w32shr1 mp14
  let add15 := w64add acc15 (cif (w32b31 mp15) mc15 (mkWord64 zero32 zero32))
  let acc16 := add15
  let mc16 := w64shl1 mc15
  let mp16 := w32shr1 mp15
  let add16 := w64add acc16 (cif (w32b31 mp16) mc16 (mkWord64 zero32 zero32))
  let acc17 := add16
  let mc17 := w64shl1 mc16
  let mp17 := w32shr1 mp16
  let add17 := w64add acc17 (cif (w32b31 mp17) mc17 (mkWord64 zero32 zero32))
  let acc18 := add17
  let mc18 := w64shl1 mc17
  let mp18 := w32shr1 mp17
  let add18 := w64add acc18 (cif (w32b31 mp18) mc18 (mkWord64 zero32 zero32))
  let acc19 := add18
  let mc19 := w64shl1 mc18
  let mp19 := w32shr1 mp18
  let add19 := w64add acc19 (cif (w32b31 mp19) mc19 (mkWord64 zero32 zero32))
  let acc20 := add19
  let mc20 := w64shl1 mc19
  let mp20 := w32shr1 mp19
  let add20 := w64add acc20 (cif (w32b31 mp20) mc20 (mkWord64 zero32 zero32))
  let acc21 := add20
  let mc21 := w64shl1 mc20
  let mp21 := w32shr1 mp20
  let add21 := w64add acc21 (cif (w32b31 mp21) mc21 (mkWord64 zero32 zero32))
  let acc22 := add21
  let mc22 := w64shl1 mc21
  let mp22 := w32shr1 mp21
  let add22 := w64add acc22 (cif (w32b31 mp22) mc22 (mkWord64 zero32 zero32))
  let acc23 := add22
  let mc23 := w64shl1 mc22
  let mp23 := w32shr1 mp22
  let add23 := w64add acc23 (cif (w32b31 mp23) mc23 (mkWord64 zero32 zero32))
  let acc24 := add23
  let mc24 := w64shl1 mc23
  let mp24 := w32shr1 mp23
  let add24 := w64add acc24 (cif (w32b31 mp24) mc24 (mkWord64 zero32 zero32))
  let acc25 := add24
  let mc25 := w64shl1 mc24
  let mp25 := w32shr1 mp24
  let add25 := w64add acc25 (cif (w32b31 mp25) mc25 (mkWord64 zero32 zero32))
  let acc26 := add25
  let mc26 := w64shl1 mc25
  let mp26 := w32shr1 mp25
  let add26 := w64add acc26 (cif (w32b31 mp26) mc26 (mkWord64 zero32 zero32))
  let acc27 := add26
  let mc27 := w64shl1 mc26
  let mp27 := w32shr1 mp26
  let add27 := w64add acc27 (cif (w32b31 mp27) mc27 (mkWord64 zero32 zero32))
  let acc28 := add27
  let mc28 := w64shl1 mc27
  let mp28 := w32shr1 mp27
  let add28 := w64add acc28 (cif (w32b31 mp28) mc28 (mkWord64 zero32 zero32))
  let acc29 := add28
  let mc29 := w64shl1 mc28
  let mp29 := w32shr1 mp28
  let add29 := w64add acc29 (cif (w32b31 mp29) mc29 (mkWord64 zero32 zero32))
  let acc30 := add29
  let mc30 := w64shl1 mc29
  let mp30 := w32shr1 mp29
  let add30 := w64add acc30 (cif (w32b31 mp30) mc30 (mkWord64 zero32 zero32))
  let acc31 := add30
  let mc31 := w64shl1 mc30
  let mp31 := w32shr1 mp30
  let add31 := w64add acc31 (cif (w32b31 mp31) mc31 (mkWord64 zero32 zero32))
  let acc32 := add31
  let mc32 := w64shl1 mc31
  let mp32 := w32shr1 mp31
  acc32

def Word256 : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))

def mkWord256 (w0 w1 w2 w3 w4 w5 w6 w7 : Word32) : Word256 :=
  cpair w0 (cpair w1 (cpair w2 (cpair w3 (cpair w4 (cpair w5 (cpair w6 (w7)))))))

def w256w0 (w : Word256) : Word32 := cfst w
def w256w1 (w : Word256) : Word32 := cfst (csnd w))
def w256w2 (w : Word256) : Word32 := cfst (csnd (csnd w)))
def w256w3 (w : Word256) : Word32 := cfst (csnd (csnd (csnd w))))
def w256w4 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd w)))))
def w256w5 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd w))))))
def w256w6 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def w256w7 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))

def w256eq (x y : Word256) : CBool :=
  let e0 := w32eq (w256w0 x) (w256w0 y)
  let e1 := cand e0 (w32eq (w256w1 x) (w256w1 y))
  let e2 := cand e1 (w32eq (w256w2 x) (w256w2 y))
  let e3 := cand e2 (w32eq (w256w3 x) (w256w3 y))
  let e4 := cand e3 (w32eq (w256w4 x) (w256w4 y))
  let e5 := cand e4 (w32eq (w256w5 x) (w256w5 y))
  let e6 := cand e5 (w32eq (w256w6 x) (w256w6 y))
  let e7 := cand e6 (w32eq (w256w7 x) (w256w7 y))
  e7

def w256lt (x y : Word256) : CBool :=
  let lt0 := w32lt (w256w0 x) (w256w0 y)
  let eq0 := w32eq (w256w0 x) (w256w0 y)
  let lt1 := cor lt0 (cand eq0 (w32lt (w256w1 x) (w256w1 y)))
  let eq1 := cand eq0 (w32eq (w256w1 x) (w256w1 y))
  let lt2 := cor lt1 (cand eq1 (w32lt (w256w2 x) (w256w2 y)))
  let eq2 := cand eq1 (w32eq (w256w2 x) (w256w2 y))
  let lt3 := cor lt2 (cand eq2 (w32lt (w256w3 x) (w256w3 y)))
  let eq3 := cand eq2 (w32eq (w256w3 x) (w256w3 y))
  let lt4 := cor lt3 (cand eq3 (w32lt (w256w4 x) (w256w4 y)))
  let eq4 := cand eq3 (w32eq (w256w4 x) (w256w4 y))
  let lt5 := cor lt4 (cand eq4 (w32lt (w256w5 x) (w256w5 y)))
  let eq5 := cand eq4 (w32eq (w256w5 x) (w256w5 y))
  let lt6 := cor lt5 (cand eq5 (w32lt (w256w6 x) (w256w6 y)))
  let eq6 := cand eq5 (w32eq (w256w6 x) (w256w6 y))
  let lt7 := cor lt6 (cand eq6 (w32lt (w256w7 x) (w256w7 y)))
  let eq7 := cand eq6 (w32eq (w256w7 x) (w256w7 y))
  lt7

def w256addc (x y : Word256) : CPair Word256 Bit :=
  let r0 := w32addc (w256w0 x) (w256w0 y)
  let s0 := cfst r0
  let c1 := csnd r0
  let a1 := w32addc (w256w1 x) (w256w1 y)
  let b1 := w32addc (cfst a1) (cif c1 one32 zero32)
  let s1 := cfst b1
  let c2 := cor (csnd a1) (csnd b1)
  let a2 := w32addc (w256w2 x) (w256w2 y)
  let b2 := w32addc (cfst a2) (cif c2 one32 zero32)
  let s2 := cfst b2
  let c3 := cor (csnd a2) (csnd b2)
  let a3 := w32addc (w256w3 x) (w256w3 y)
  let b3 := w32addc (cfst a3) (cif c3 one32 zero32)
  let s3 := cfst b3
  let c4 := cor (csnd a3) (csnd b3)
  let a4 := w32addc (w256w4 x) (w256w4 y)
  let b4 := w32addc (cfst a4) (cif c4 one32 zero32)
  let s4 := cfst b4
  let c5 := cor (csnd a4) (csnd b4)
  let a5 := w32addc (w256w5 x) (w256w5 y)
  let b5 := w32addc (cfst a5) (cif c5 one32 zero32)
  let s5 := cfst b5
  let c6 := cor (csnd a5) (csnd b5)
  let a6 := w32addc (w256w6 x) (w256w6 y)
  let b6 := w32addc (cfst a6) (cif c6 one32 zero32)
  let s6 := cfst b6
  let c7 := cor (csnd a6) (csnd b6)
  let a7 := w32addc (w256w7 x) (w256w7 y)
  let b7 := w32addc (cfst a7) (cif c7 one32 zero32)
  let s7 := cfst b7
  let c8 := cor (csnd a7) (csnd b7)
  cpair (mkWord256 s0 s1 s2 s3 s4 s5 s6 s7) c9

def w256add (x y : Word256) : Word256 := cfst (w256addc x y)

def halfSub (a b : Bit) : CPair Bit Bit := cpair (cxor a b) (cand (cnot a) b)
def fullSub (a b bin : Bit) : CPair Bit Bit :=
  let hs1 := halfSub a b
  let d1 := cfst hs1
  let b1 := csnd hs1
  let hs2 := halfSub d1 bin
  let d2 := cfst hs2
  let b2 := csnd hs2
  cpair d2 (cor b1 b2)

def w32subc (x y : Word32) : CPair Word32 Bit :=
  let b0 := cfalse
  let fs0 := fullSub (w32b31 x) (w32b31 y) b0
  let d31 := cfst fs0
  let b1 := csnd fs0
  let fs1 := fullSub (w32b30 x) (w32b30 y) b1
  let d30 := cfst fs1
  let b2 := csnd fs1
  let fs2 := fullSub (w32b29 x) (w32b29 y) b2
  let d29 := cfst fs2
  let b3 := csnd fs2
  let fs3 := fullSub (w32b28 x) (w32b28 y) b3
  let d28 := cfst fs3
  let b4 := csnd fs3
  let fs4 := fullSub (w32b27 x) (w32b27 y) b4
  let d27 := cfst fs4
  let b5 := csnd fs4
  let fs5 := fullSub (w32b26 x) (w32b26 y) b5
  let d26 := cfst fs5
  let b6 := csnd fs5
  let fs6 := fullSub (w32b25 x) (w32b25 y) b6
  let d25 := cfst fs6
  let b7 := csnd fs6
  let fs7 := fullSub (w32b24 x) (w32b24 y) b7
  let d24 := cfst fs7
  let b8 := csnd fs7
  let fs8 := fullSub (w32b23 x) (w32b23 y) b8
  let d23 := cfst fs8
  let b9 := csnd fs8
  let fs9 := fullSub (w32b22 x) (w32b22 y) b9
  let d22 := cfst fs9
  let b10 := csnd fs9
  let fs10 := fullSub (w32b21 x) (w32b21 y) b10
  let d21 := cfst fs10
  let b11 := csnd fs10
  let fs11 := fullSub (w32b20 x) (w32b20 y) b11
  let d20 := cfst fs11
  let b12 := csnd fs11
  let fs12 := fullSub (w32b19 x) (w32b19 y) b12
  let d19 := cfst fs12
  let b13 := csnd fs12
  let fs13 := fullSub (w32b18 x) (w32b18 y) b13
  let d18 := cfst fs13
  let b14 := csnd fs13
  let fs14 := fullSub (w32b17 x) (w32b17 y) b14
  let d17 := cfst fs14
  let b15 := csnd fs14
  let fs15 := fullSub (w32b16 x) (w32b16 y) b15
  let d16 := cfst fs15
  let b16 := csnd fs15
  let fs16 := fullSub (w32b15 x) (w32b15 y) b16
  let d15 := cfst fs16
  let b17 := csnd fs16
  let fs17 := fullSub (w32b14 x) (w32b14 y) b17
  let d14 := cfst fs17
  let b18 := csnd fs17
  let fs18 := fullSub (w32b13 x) (w32b13 y) b18
  let d13 := cfst fs18
  let b19 := csnd fs18
  let fs19 := fullSub (w32b12 x) (w32b12 y) b19
  let d12 := cfst fs19
  let b20 := csnd fs19
  let fs20 := fullSub (w32b11 x) (w32b11 y) b20
  let d11 := cfst fs20
  let b21 := csnd fs20
  let fs21 := fullSub (w32b10 x) (w32b10 y) b21
  let d10 := cfst fs21
  let b22 := csnd fs21
  let fs22 := fullSub (w32b9 x) (w32b9 y) b22
  let d9 := cfst fs22
  let b23 := csnd fs22
  let fs23 := fullSub (w32b8 x) (w32b8 y) b23
  let d8 := cfst fs23
  let b24 := csnd fs23
  let fs24 := fullSub (w32b7 x) (w32b7 y) b24
  let d7 := cfst fs24
  let b25 := csnd fs24
  let fs25 := fullSub (w32b6 x) (w32b6 y) b25
  let d6 := cfst fs25
  let b26 := csnd fs25
  let fs26 := fullSub (w32b5 x) (w32b5 y) b26
  let d5 := cfst fs26
  let b27 := csnd fs26
  let fs27 := fullSub (w32b4 x) (w32b4 y) b27
  let d4 := cfst fs27
  let b28 := csnd fs27
  let fs28 := fullSub (w32b3 x) (w32b3 y) b28
  let d3 := cfst fs28
  let b29 := csnd fs28
  let fs29 := fullSub (w32b2 x) (w32b2 y) b29
  let d2 := cfst fs29
  let b30 := csnd fs29
  let fs30 := fullSub (w32b1 x) (w32b1 y) b30
  let d1 := cfst fs30
  let b31 := csnd fs30
  let fs31 := fullSub (w32b0 x) (w32b0 y) b31
  let d0 := cfst fs31
  cpair (mkWord32 d0 d1 d2 d3 d4 d5 d6 d7 d8 d9 d10 d11 d12 d13 d14 d15 d16 d17 d18 d19 d20 d21 d22 d23 d24 d25 d26 d27 d28 d29 d30 d31) b32

def w256subc (x y : Word256) : CPair Word256 Bit :=
  let r0 := w32subc (w256w0 x) (w256w0 y)
  let d0 := cfst r0
  let b1 := csnd r0
  let a1 := w32subc (w256w1 x) (w256w1 y)
  let e1 := w32subc (cfst a1) (cif b1 one32 zero32)
  let d1 := cfst e1
  let b2 := cor (csnd a1) (csnd e1)
  let a2 := w32subc (w256w2 x) (w256w2 y)
  let e2 := w32subc (cfst a2) (cif b2 one32 zero32)
  let d2 := cfst e2
  let b3 := cor (csnd a2) (csnd e2)
  let a3 := w32subc (w256w3 x) (w256w3 y)
  let e3 := w32subc (cfst a3) (cif b3 one32 zero32)
  let d3 := cfst e3
  let b4 := cor (csnd a3) (csnd e3)
  let a4 := w32subc (w256w4 x) (w256w4 y)
  let e4 := w32subc (cfst a4) (cif b4 one32 zero32)
  let d4 := cfst e4
  let b5 := cor (csnd a4) (csnd e4)
  let a5 := w32subc (w256w5 x) (w256w5 y)
  let e5 := w32subc (cfst a5) (cif b5 one32 zero32)
  let d5 := cfst e5
  let b6 := cor (csnd a5) (csnd e5)
  let a6 := w32subc (w256w6 x) (w256w6 y)
  let e6 := w32subc (cfst a6) (cif b6 one32 zero32)
  let d6 := cfst e6
  let b7 := cor (csnd a6) (csnd e6)
  let a7 := w32subc (w256w7 x) (w256w7 y)
  let e7 := w32subc (cfst a7) (cif b7 one32 zero32)
  let d7 := cfst e7
  let b8 := cor (csnd a7) (csnd e7)
  cpair (mkWord256 d0 d1 d2 d3 d4 d5 d6 d7) b9

def w256sub (x y : Word256) : Word256 := cfst (w256subc x y)

-- P-256 prime p = 2^256 - 2^224 + 2^192 + 2^96 - 1
-- p words: FFFFFFFF 00000001 00000000 00000000 00000000 FFFFFFFF FFFFFFFF FFFFFFFF
def p256w0 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w1 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1
def p256w2 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w3 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w4 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w5 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w6 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w7 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1

def p256 : Word256 := mkWord256 p256w0 p256w1 p256w2 p256w3 p256w4 p256w5 p256w6 p256w7

def Fp256 : Sort 1 := Word256
def fp256add (x y : Fp256) : Fp256 :=
  let sum := w256add x y
  let sub := w256sub sum p256
  cif (w256lt sum p256) sum sub

def fp256sub (x y : Fp256) : Fp256 :=
  let diff := w256sub x y
  let add := w256add diff p256
  cif (w256lt x y) add diff

def Word512 : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))))))))))

def mkWord512 (v0 v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15 : Word32) : Word512 :=
  cpair v0 (cpair v1 (cpair v2 (cpair v3 (cpair v4 (cpair v5 (cpair v6 (cpair v7 (cpair v8 (cpair v9 (cpair v10 (cpair v11 (cpair v12 (cpair v13 (cpair v14 (v15)))))))))))))))

def w512v0 (w : Word512) : Word32 := cfst w
def w512v1 (w : Word512) : Word32 := cfst (csnd w))
def w512v2 (w : Word512) : Word32 := cfst (csnd (csnd w)))
def w512v3 (w : Word512) : Word32 := cfst (csnd (csnd (csnd w))))
def w512v4 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd w)))))
def w512v5 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd w))))))
def w512v6 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def w512v7 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))
def w512v8 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))
def w512v9 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))
def w512v10 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))
def w512v11 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))
def w512v12 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))
def w512v13 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))
def w512v14 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w)))))))))))))))
def w512v15 (w : Word512) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))))))))))

-- 64 partial products pp[i][j] = w256w_i(x) * w256w_j(y)
def pp0_0 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w0 y)
def pp0_1 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w1 y)
def pp0_2 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w2 y)
def pp0_3 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w3 y)
def pp0_4 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w4 y)
def pp0_5 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w5 y)
def pp0_6 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w6 y)
def pp0_7 (x y : Word256) : Word64 := mul32x32 (w256w0 x) (w256w7 y)
def pp1_0 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w0 y)
def pp1_1 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w1 y)
def pp1_2 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w2 y)
def pp1_3 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w3 y)
def pp1_4 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w4 y)
def pp1_5 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w5 y)
def pp1_6 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w6 y)
def pp1_7 (x y : Word256) : Word64 := mul32x32 (w256w1 x) (w256w7 y)
def pp2_0 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w0 y)
def pp2_1 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w1 y)
def pp2_2 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w2 y)
def pp2_3 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w3 y)
def pp2_4 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w4 y)
def pp2_5 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w5 y)
def pp2_6 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w6 y)
def pp2_7 (x y : Word256) : Word64 := mul32x32 (w256w2 x) (w256w7 y)
def pp3_0 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w0 y)
def pp3_1 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w1 y)
def pp3_2 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w2 y)
def pp3_3 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w3 y)
def pp3_4 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w4 y)
def pp3_5 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w5 y)
def pp3_6 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w6 y)
def pp3_7 (x y : Word256) : Word64 := mul32x32 (w256w3 x) (w256w7 y)
def pp4_0 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w0 y)
def pp4_1 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w1 y)
def pp4_2 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w2 y)
def pp4_3 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w3 y)
def pp4_4 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w4 y)
def pp4_5 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w5 y)
def pp4_6 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w6 y)
def pp4_7 (x y : Word256) : Word64 := mul32x32 (w256w4 x) (w256w7 y)
def pp5_0 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w0 y)
def pp5_1 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w1 y)
def pp5_2 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w2 y)
def pp5_3 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w3 y)
def pp5_4 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w4 y)
def pp5_5 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w5 y)
def pp5_6 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w6 y)
def pp5_7 (x y : Word256) : Word64 := mul32x32 (w256w5 x) (w256w7 y)
def pp6_0 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w0 y)
def pp6_1 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w1 y)
def pp6_2 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w2 y)
def pp6_3 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w3 y)
def pp6_4 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w4 y)
def pp6_5 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w5 y)
def pp6_6 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w6 y)
def pp6_7 (x y : Word256) : Word64 := mul32x32 (w256w6 x) (w256w7 y)
def pp7_0 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w0 y)
def pp7_1 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w1 y)
def pp7_2 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w2 y)
def pp7_3 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w3 y)
def pp7_4 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w4 y)
def pp7_5 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w5 y)
def pp7_6 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w6 y)
def pp7_7 (x y : Word256) : Word64 := mul32x32 (w256w7 x) (w256w7 y)

-- ------------------------------------------------------------
-- 256x256 -> 512 MULTIPLY (schoolbook, fully explicit)
-- ------------------------------------------------------------

def mul256x256 (x y : Word256) : Word512 :=
  let t00 := pp0_0 x y
  let t01 := pp0_1 x y
  let t02 := pp0_2 x y
  let t03 := pp0_3 x y
  let t04 := pp0_4 x y
  let t05 := pp0_5 x y
  let t06 := pp0_6 x y
  let t07 := pp0_7 x y
  let t10 := pp1_0 x y
  let t11 := pp1_1 x y
  let t12 := pp1_2 x y
  let t13 := pp1_3 x y
  let t14 := pp1_4 x y
  let t15 := pp1_5 x y
  let t16 := pp1_6 x y
  let t17 := pp1_7 x y
  let t20 := pp2_0 x y
  let t21 := pp2_1 x y
  let t22 := pp2_2 x y
  let t23 := pp2_3 x y
  let t24 := pp2_4 x y
  let t25 := pp2_5 x y
  let t26 := pp2_6 x y
  let t27 := pp2_7 x y
  let t30 := pp3_0 x y
  let t31 := pp3_1 x y
  let t32 := pp3_2 x y
  let t33 := pp3_3 x y
  let t34 := pp3_4 x y
  let t35 := pp3_5 x y
  let t36 := pp3_6 x y
  let t37 := pp3_7 x y
  let t40 := pp4_0 x y
  let t41 := pp4_1 x y
  let t42 := pp4_2 x y
  let t43 := pp4_3 x y
  let t44 := pp4_4 x y
  let t45 := pp4_5 x y
  let t46 := pp4_6 x y
  let t47 := pp4_7 x y
  let t50 := pp5_0 x y
  let t51 := pp5_1 x y
  let t52 := pp5_2 x y
  let t53 := pp5_3 x y
  let t54 := pp5_4 x y
  let t55 := pp5_5 x y
  let t56 := pp5_6 x y
  let t57 := pp5_7 x y
  let t60 := pp6_0 x y
  let t61 := pp6_1 x y
  let t62 := pp6_2 x y
  let t63 := pp6_3 x y
  let t64 := pp6_4 x y
  let t65 := pp6_5 x y
  let t66 := pp6_6 x y
  let t67 := pp6_7 x y
  let t70 := pp7_0 x y
  let t71 := pp7_1 x y
  let t72 := pp7_2 x y
  let t73 := pp7_3 x y
  let t74 := pp7_4 x y
  let t75 := pp7_5 x y
  let t76 := pp7_6 x y
  let t77 := pp7_7 x y
  -- Position 0
  let a0_0 := w64lo t77
  let k0_0 := zero32
  let r0_1 := w32addc a0_0 w64hi t67
  let a0_1 := cfst r0_1
  let k0_1 := w32add k0_0 (cif (csnd r0_1) one32 zero32)
  let r0_2 := w32addc a0_1 w64hi t76
  let a0_2 := cfst r0_2
  let k0_2 := w32add k0_1 (cif (csnd r0_2) one32 zero32)
  let r0_c := w32addc a0_2 zero32
  let v0 := cfst r0_c
  let k0_c := w32add k0_2 (cif (csnd r0_c) one32 zero32)
  -- Position 1
  let a1_0 := w64lo t67
  let k1_0 := zero32
  let r1_1 := w32addc a1_0 w64lo t76
  let a1_1 := cfst r1_1
  let k1_1 := w32add k1_0 (cif (csnd r1_1) one32 zero32)
  let r1_2 := w32addc a1_1 w64hi t57
  let a1_2 := cfst r1_2
  let k1_2 := w32add k1_1 (cif (csnd r1_2) one32 zero32)
  let r1_3 := w32addc a1_2 w64hi t66
  let a1_3 := cfst r1_3
  let k1_3 := w32add k1_2 (cif (csnd r1_3) one32 zero32)
  let r1_4 := w32addc a1_3 w64hi t75
  let a1_4 := cfst r1_4
  let k1_4 := w32add k1_3 (cif (csnd r1_4) one32 zero32)
  let r1_c := w32addc a1_4 k0_c
  let v1 := cfst r1_c
  let k1_c := w32add k1_4 (cif (csnd r1_c) one32 zero32)
  -- Position 2
  let a2_0 := w64lo t57
  let k2_0 := zero32
  let r2_1 := w32addc a2_0 w64lo t66
  let a2_1 := cfst r2_1
  let k2_1 := w32add k2_0 (cif (csnd r2_1) one32 zero32)
  let r2_2 := w32addc a2_1 w64lo t75
  let a2_2 := cfst r2_2
  let k2_2 := w32add k2_1 (cif (csnd r2_2) one32 zero32)
  let r2_3 := w32addc a2_2 w64hi t47
  let a2_3 := cfst r2_3
  let k2_3 := w32add k2_2 (cif (csnd r2_3) one32 zero32)
  let r2_4 := w32addc a2_3 w64hi t56
  let a2_4 := cfst r2_4
  let k2_4 := w32add k2_3 (cif (csnd r2_4) one32 zero32)
  let r2_5 := w32addc a2_4 w64hi t65
  let a2_5 := cfst r2_5
  let k2_5 := w32add k2_4 (cif (csnd r2_5) one32 zero32)
  let r2_6 := w32addc a2_5 w64hi t74
  let a2_6 := cfst r2_6
  let k2_6 := w32add k2_5 (cif (csnd r2_6) one32 zero32)
  let r2_c := w32addc a2_6 k1_c
  let v2 := cfst r2_c
  let k2_c := w32add k2_6 (cif (csnd r2_c) one32 zero32)
  -- Position 3
  let a3_0 := w64lo t47
  let k3_0 := zero32
  let r3_1 := w32addc a3_0 w64lo t56
  let a3_1 := cfst r3_1
  let k3_1 := w32add k3_0 (cif (csnd r3_1) one32 zero32)
  let r3_2 := w32addc a3_1 w64lo t65
  let a3_2 := cfst r3_2
  let k3_2 := w32add k3_1 (cif (csnd r3_2) one32 zero32)
  let r3_3 := w32addc a3_2 w64lo t74
  let a3_3 := cfst r3_3
  let k3_3 := w32add k3_2 (cif (csnd r3_3) one32 zero32)
  let r3_4 := w32addc a3_3 w64hi t37
  let a3_4 := cfst r3_4
  let k3_4 := w32add k3_3 (cif (csnd r3_4) one32 zero32)
  let r3_5 := w32addc a3_4 w64hi t46
  let a3_5 := cfst r3_5
  let k3_5 := w32add k3_4 (cif (csnd r3_5) one32 zero32)
  let r3_6 := w32addc a3_5 w64hi t55
  let a3_6 := cfst r3_6
  let k3_6 := w32add k3_5 (cif (csnd r3_6) one32 zero32)
  let r3_7 := w32addc a3_6 w64hi t64
  let a3_7 := cfst r3_7
  let k3_7 := w32add k3_6 (cif (csnd r3_7) one32 zero32)
  let r3_8 := w32addc a3_7 w64hi t73
  let a3_8 := cfst r3_8
  let k3_8 := w32add k3_7 (cif (csnd r3_8) one32 zero32)
  let r3_c := w32addc a3_8 k2_c
  let v3 := cfst r3_c
  let k3_c := w32add k3_8 (cif (csnd r3_c) one32 zero32)
  -- Position 4
  let a4_0 := w64lo t37
  let k4_0 := zero32
  let r4_1 := w32addc a4_0 w64lo t46
  let a4_1 := cfst r4_1
  let k4_1 := w32add k4_0 (cif (csnd r4_1) one32 zero32)
  let r4_2 := w32addc a4_1 w64lo t55
  let a4_2 := cfst r4_2
  let k4_2 := w32add k4_1 (cif (csnd r4_2) one32 zero32)
  let r4_3 := w32addc a4_2 w64lo t64
  let a4_3 := cfst r4_3
  let k4_3 := w32add k4_2 (cif (csnd r4_3) one32 zero32)
  let r4_4 := w32addc a4_3 w64lo t73
  let a4_4 := cfst r4_4
  let k4_4 := w32add k4_3 (cif (csnd r4_4) one32 zero32)
  let r4_5 := w32addc a4_4 w64hi t27
  let a4_5 := cfst r4_5
  let k4_5 := w32add k4_4 (cif (csnd r4_5) one32 zero32)
  let r4_6 := w32addc a4_5 w64hi t36
  let a4_6 := cfst r4_6
  let k4_6 := w32add k4_5 (cif (csnd r4_6) one32 zero32)
  let r4_7 := w32addc a4_6 w64hi t45
  let a4_7 := cfst r4_7
  let k4_7 := w32add k4_6 (cif (csnd r4_7) one32 zero32)
  let r4_8 := w32addc a4_7 w64hi t54
  let a4_8 := cfst r4_8
  let k4_8 := w32add k4_7 (cif (csnd r4_8) one32 zero32)
  let r4_9 := w32addc a4_8 w64hi t63
  let a4_9 := cfst r4_9
  let k4_9 := w32add k4_8 (cif (csnd r4_9) one32 zero32)
  let r4_10 := w32addc a4_9 w64hi t72
  let a4_10 := cfst r4_10
  let k4_10 := w32add k4_9 (cif (csnd r4_10) one32 zero32)
  let r4_c := w32addc a4_10 k3_c
  let v4 := cfst r4_c
  let k4_c := w32add k4_10 (cif (csnd r4_c) one32 zero32)
  -- Position 5
  let a5_0 := w64lo t27
  let k5_0 := zero32
  let r5_1 := w32addc a5_0 w64lo t36
  let a5_1 := cfst r5_1
  let k5_1 := w32add k5_0 (cif (csnd r5_1) one32 zero32)
  let r5_2 := w32addc a5_1 w64lo t45
  let a5_2 := cfst r5_2
  let k5_2 := w32add k5_1 (cif (csnd r5_2) one32 zero32)
  let r5_3 := w32addc a5_2 w64lo t54
  let a5_3 := cfst r5_3
  let k5_3 := w32add k5_2 (cif (csnd r5_3) one32 zero32)
  let r5_4 := w32addc a5_3 w64lo t63
  let a5_4 := cfst r5_4
  let k5_4 := w32add k5_3 (cif (csnd r5_4) one32 zero32)
  let r5_5 := w32addc a5_4 w64lo t72
  let a5_5 := cfst r5_5
  let k5_5 := w32add k5_4 (cif (csnd r5_5) one32 zero32)
  let r5_6 := w32addc a5_5 w64hi t17
  let a5_6 := cfst r5_6
  let k5_6 := w32add k5_5 (cif (csnd r5_6) one32 zero32)
  let r5_7 := w32addc a5_6 w64hi t26
  let a5_7 := cfst r5_7
  let k5_7 := w32add k5_6 (cif (csnd r5_7) one32 zero32)
  let r5_8 := w32addc a5_7 w64hi t35
  let a5_8 := cfst r5_8
  let k5_8 := w32add k5_7 (cif (csnd r5_8) one32 zero32)
  let r5_9 := w32addc a5_8 w64hi t44
  let a5_9 := cfst r5_9
  let k5_9 := w32add k5_8 (cif (csnd r5_9) one32 zero32)
  let r5_10 := w32addc a5_9 w64hi t53
  let a5_10 := cfst r5_10
  let k5_10 := w32add k5_9 (cif (csnd r5_10) one32 zero32)
  let r5_11 := w32addc a5_10 w64hi t62
  let a5_11 := cfst r5_11
  let k5_11 := w32add k5_10 (cif (csnd r5_11) one32 zero32)
  let r5_12 := w32addc a5_11 w64hi t71
  let a5_12 := cfst r5_12
  let k5_12 := w32add k5_11 (cif (csnd r5_12) one32 zero32)
  let r5_c := w32addc a5_12 k4_c
  let v5 := cfst r5_c
  let k5_c := w32add k5_12 (cif (csnd r5_c) one32 zero32)
  -- Position 6
  let a6_0 := w64lo t17
  let k6_0 := zero32
  let r6_1 := w32addc a6_0 w64lo t26
  let a6_1 := cfst r6_1
  let k6_1 := w32add k6_0 (cif (csnd r6_1) one32 zero32)
  let r6_2 := w32addc a6_1 w64lo t35
  let a6_2 := cfst r6_2
  let k6_2 := w32add k6_1 (cif (csnd r6_2) one32 zero32)
  let r6_3 := w32addc a6_2 w64lo t44
  let a6_3 := cfst r6_3
  let k6_3 := w32add k6_2 (cif (csnd r6_3) one32 zero32)
  let r6_4 := w32addc a6_3 w64lo t53
  let a6_4 := cfst r6_4
  let k6_4 := w32add k6_3 (cif (csnd r6_4) one32 zero32)
  let r6_5 := w32addc a6_4 w64lo t62
  let a6_5 := cfst r6_5
  let k6_5 := w32add k6_4 (cif (csnd r6_5) one32 zero32)
  let r6_6 := w32addc a6_5 w64lo t71
  let a6_6 := cfst r6_6
  let k6_6 := w32add k6_5 (cif (csnd r6_6) one32 zero32)
  let r6_7 := w32addc a6_6 w64hi t07
  let a6_7 := cfst r6_7
  let k6_7 := w32add k6_6 (cif (csnd r6_7) one32 zero32)
  let r6_8 := w32addc a6_7 w64hi t16
  let a6_8 := cfst r6_8
  let k6_8 := w32add k6_7 (cif (csnd r6_8) one32 zero32)
  let r6_9 := w32addc a6_8 w64hi t25
  let a6_9 := cfst r6_9
  let k6_9 := w32add k6_8 (cif (csnd r6_9) one32 zero32)
  let r6_10 := w32addc a6_9 w64hi t34
  let a6_10 := cfst r6_10
  let k6_10 := w32add k6_9 (cif (csnd r6_10) one32 zero32)
  let r6_11 := w32addc a6_10 w64hi t43
  let a6_11 := cfst r6_11
  let k6_11 := w32add k6_10 (cif (csnd r6_11) one32 zero32)
  let r6_12 := w32addc a6_11 w64hi t52
  let a6_12 := cfst r6_12
  let k6_12 := w32add k6_11 (cif (csnd r6_12) one32 zero32)
  let r6_13 := w32addc a6_12 w64hi t61
  let a6_13 := cfst r6_13
  let k6_13 := w32add k6_12 (cif (csnd r6_13) one32 zero32)
  let r6_14 := w32addc a6_13 w64hi t70
  let a6_14 := cfst r6_14
  let k6_14 := w32add k6_13 (cif (csnd r6_14) one32 zero32)
  let r6_c := w32addc a6_14 k5_c
  let v6 := cfst r6_c
  let k6_c := w32add k6_14 (cif (csnd r6_c) one32 zero32)
  -- Position 7
  let a7_0 := w64lo t07
  let k7_0 := zero32
  let r7_1 := w32addc a7_0 w64lo t16
  let a7_1 := cfst r7_1
  let k7_1 := w32add k7_0 (cif (csnd r7_1) one32 zero32)
  let r7_2 := w32addc a7_1 w64lo t25
  let a7_2 := cfst r7_2
  let k7_2 := w32add k7_1 (cif (csnd r7_2) one32 zero32)
  let r7_3 := w32addc a7_2 w64lo t34
  let a7_3 := cfst r7_3
  let k7_3 := w32add k7_2 (cif (csnd r7_3) one32 zero32)
  let r7_4 := w32addc a7_3 w64lo t43
  let a7_4 := cfst r7_4
  let k7_4 := w32add k7_3 (cif (csnd r7_4) one32 zero32)
  let r7_5 := w32addc a7_4 w64lo t52
  let a7_5 := cfst r7_5
  let k7_5 := w32add k7_4 (cif (csnd r7_5) one32 zero32)
  let r7_6 := w32addc a7_5 w64lo t61
  let a7_6 := cfst r7_6
  let k7_6 := w32add k7_5 (cif (csnd r7_6) one32 zero32)
  let r7_7 := w32addc a7_6 w64lo t70
  let a7_7 := cfst r7_7
  let k7_7 := w32add k7_6 (cif (csnd r7_7) one32 zero32)
  let r7_8 := w32addc a7_7 w64hi t06
  let a7_8 := cfst r7_8
  let k7_8 := w32add k7_7 (cif (csnd r7_8) one32 zero32)
  let r7_9 := w32addc a7_8 w64hi t15
  let a7_9 := cfst r7_9
  let k7_9 := w32add k7_8 (cif (csnd r7_9) one32 zero32)
  let r7_10 := w32addc a7_9 w64hi t24
  let a7_10 := cfst r7_10
  let k7_10 := w32add k7_9 (cif (csnd r7_10) one32 zero32)
  let r7_11 := w32addc a7_10 w64hi t33
  let a7_11 := cfst r7_11
  let k7_11 := w32add k7_10 (cif (csnd r7_11) one32 zero32)
  let r7_12 := w32addc a7_11 w64hi t42
  let a7_12 := cfst r7_12
  let k7_12 := w32add k7_11 (cif (csnd r7_12) one32 zero32)
  let r7_13 := w32addc a7_12 w64hi t51
  let a7_13 := cfst r7_13
  let k7_13 := w32add k7_12 (cif (csnd r7_13) one32 zero32)
  let r7_14 := w32addc a7_13 w64hi t60
  let a7_14 := cfst r7_14
  let k7_14 := w32add k7_13 (cif (csnd r7_14) one32 zero32)
  let r7_c := w32addc a7_14 k6_c
  let v7 := cfst r7_c
  let k7_c := w32add k7_14 (cif (csnd r7_c) one32 zero32)
  -- Position 8
  let a8_0 := w64lo t06
  let k8_0 := zero32
  let r8_1 := w32addc a8_0 w64lo t15
  let a8_1 := cfst r8_1
  let k8_1 := w32add k8_0 (cif (csnd r8_1) one32 zero32)
  let r8_2 := w32addc a8_1 w64lo t24
  let a8_2 := cfst r8_2
  let k8_2 := w32add k8_1 (cif (csnd r8_2) one32 zero32)
  let r8_3 := w32addc a8_2 w64lo t33
  let a8_3 := cfst r8_3
  let k8_3 := w32add k8_2 (cif (csnd r8_3) one32 zero32)
  let r8_4 := w32addc a8_3 w64lo t42
  let a8_4 := cfst r8_4
  let k8_4 := w32add k8_3 (cif (csnd r8_4) one32 zero32)
  let r8_5 := w32addc a8_4 w64lo t51
  let a8_5 := cfst r8_5
  let k8_5 := w32add k8_4 (cif (csnd r8_5) one32 zero32)
  let r8_6 := w32addc a8_5 w64lo t60
  let a8_6 := cfst r8_6
  let k8_6 := w32add k8_5 (cif (csnd r8_6) one32 zero32)
  let r8_7 := w32addc a8_6 w64hi t05
  let a8_7 := cfst r8_7
  let k8_7 := w32add k8_6 (cif (csnd r8_7) one32 zero32)
  let r8_8 := w32addc a8_7 w64hi t14
  let a8_8 := cfst r8_8
  let k8_8 := w32add k8_7 (cif (csnd r8_8) one32 zero32)
  let r8_9 := w32addc a8_8 w64hi t23
  let a8_9 := cfst r8_9
  let k8_9 := w32add k8_8 (cif (csnd r8_9) one32 zero32)
  let r8_10 := w32addc a8_9 w64hi t32
  let a8_10 := cfst r8_10
  let k8_10 := w32add k8_9 (cif (csnd r8_10) one32 zero32)
  let r8_11 := w32addc a8_10 w64hi t41
  let a8_11 := cfst r8_11
  let k8_11 := w32add k8_10 (cif (csnd r8_11) one32 zero32)
  let r8_12 := w32addc a8_11 w64hi t50
  let a8_12 := cfst r8_12
  let k8_12 := w32add k8_11 (cif (csnd r8_12) one32 zero32)
  let r8_c := w32addc a8_12 k7_c
  let v8 := cfst r8_c
  let k8_c := w32add k8_12 (cif (csnd r8_c) one32 zero32)
  -- Position 9
  let a9_0 := w64lo t05
  let k9_0 := zero32
  let r9_1 := w32addc a9_0 w64lo t14
  let a9_1 := cfst r9_1
  let k9_1 := w32add k9_0 (cif (csnd r9_1) one32 zero32)
  let r9_2 := w32addc a9_1 w64lo t23
  let a9_2 := cfst r9_2
  let k9_2 := w32add k9_1 (cif (csnd r9_2) one32 zero32)
  let r9_3 := w32addc a9_2 w64lo t32
  let a9_3 := cfst r9_3
  let k9_3 := w32add k9_2 (cif (csnd r9_3) one32 zero32)
  let r9_4 := w32addc a9_3 w64lo t41
  let a9_4 := cfst r9_4
  let k9_4 := w32add k9_3 (cif (csnd r9_4) one32 zero32)
  let r9_5 := w32addc a9_4 w64lo t50
  let a9_5 := cfst r9_5
  let k9_5 := w32add k9_4 (cif (csnd r9_5) one32 zero32)
  let r9_6 := w32addc a9_5 w64hi t04
  let a9_6 := cfst r9_6
  let k9_6 := w32add k9_5 (cif (csnd r9_6) one32 zero32)
  let r9_7 := w32addc a9_6 w64hi t13
  let a9_7 := cfst r9_7
  let k9_7 := w32add k9_6 (cif (csnd r9_7) one32 zero32)
  let r9_8 := w32addc a9_7 w64hi t22
  let a9_8 := cfst r9_8
  let k9_8 := w32add k9_7 (cif (csnd r9_8) one32 zero32)
  let r9_9 := w32addc a9_8 w64hi t31
  let a9_9 := cfst r9_9
  let k9_9 := w32add k9_8 (cif (csnd r9_9) one32 zero32)
  let r9_10 := w32addc a9_9 w64hi t40
  let a9_10 := cfst r9_10
  let k9_10 := w32add k9_9 (cif (csnd r9_10) one32 zero32)
  let r9_c := w32addc a9_10 k8_c
  let v9 := cfst r9_c
  let k9_c := w32add k9_10 (cif (csnd r9_c) one32 zero32)
  -- Position 10
  let a10_0 := w64lo t04
  let k10_0 := zero32
  let r10_1 := w32addc a10_0 w64lo t13
  let a10_1 := cfst r10_1
  let k10_1 := w32add k10_0 (cif (csnd r10_1) one32 zero32)
  let r10_2 := w32addc a10_1 w64lo t22
  let a10_2 := cfst r10_2
  let k10_2 := w32add k10_1 (cif (csnd r10_2) one32 zero32)
  let r10_3 := w32addc a10_2 w64lo t31
  let a10_3 := cfst r10_3
  let k10_3 := w32add k10_2 (cif (csnd r10_3) one32 zero32)
  let r10_4 := w32addc a10_3 w64lo t40
  let a10_4 := cfst r10_4
  let k10_4 := w32add k10_3 (cif (csnd r10_4) one32 zero32)
  let r10_5 := w32addc a10_4 w64hi t03
  let a10_5 := cfst r10_5
  let k10_5 := w32add k10_4 (cif (csnd r10_5) one32 zero32)
  let r10_6 := w32addc a10_5 w64hi t12
  let a10_6 := cfst r10_6
  let k10_6 := w32add k10_5 (cif (csnd r10_6) one32 zero32)
  let r10_7 := w32addc a10_6 w64hi t21
  let a10_7 := cfst r10_7
  let k10_7 := w32add k10_6 (cif (csnd r10_7) one32 zero32)
  let r10_8 := w32addc a10_7 w64hi t30
  let a10_8 := cfst r10_8
  let k10_8 := w32add k10_7 (cif (csnd r10_8) one32 zero32)
  let r10_c := w32addc a10_8 k9_c
  let v10 := cfst r10_c
  let k10_c := w32add k10_8 (cif (csnd r10_c) one32 zero32)
  -- Position 11
  let a11_0 := w64lo t03
  let k11_0 := zero32
  let r11_1 := w32addc a11_0 w64lo t12
  let a11_1 := cfst r11_1
  let k11_1 := w32add k11_0 (cif (csnd r11_1) one32 zero32)
  let r11_2 := w32addc a11_1 w64lo t21
  let a11_2 := cfst r11_2
  let k11_2 := w32add k11_1 (cif (csnd r11_2) one32 zero32)
  let r11_3 := w32addc a11_2 w64lo t30
  let a11_3 := cfst r11_3
  let k11_3 := w32add k11_2 (cif (csnd r11_3) one32 zero32)
  let r11_4 := w32addc a11_3 w64hi t02
  let a11_4 := cfst r11_4
  let k11_4 := w32add k11_3 (cif (csnd r11_4) one32 zero32)
  let r11_5 := w32addc a11_4 w64hi t11
  let a11_5 := cfst r11_5
  let k11_5 := w32add k11_4 (cif (csnd r11_5) one32 zero32)
  let r11_6 := w32addc a11_5 w64hi t20
  let a11_6 := cfst r11_6
  let k11_6 := w32add k11_5 (cif (csnd r11_6) one32 zero32)
  let r11_c := w32addc a11_6 k10_c
  let v11 := cfst r11_c
  let k11_c := w32add k11_6 (cif (csnd r11_c) one32 zero32)
  -- Position 12
  let a12_0 := w64lo t02
  let k12_0 := zero32
  let r12_1 := w32addc a12_0 w64lo t11
  let a12_1 := cfst r12_1
  let k12_1 := w32add k12_0 (cif (csnd r12_1) one32 zero32)
  let r12_2 := w32addc a12_1 w64lo t20
  let a12_2 := cfst r12_2
  let k12_2 := w32add k12_1 (cif (csnd r12_2) one32 zero32)
  let r12_3 := w32addc a12_2 w64hi t01
  let a12_3 := cfst r12_3
  let k12_3 := w32add k12_2 (cif (csnd r12_3) one32 zero32)
  let r12_4 := w32addc a12_3 w64hi t10
  let a12_4 := cfst r12_4
  let k12_4 := w32add k12_3 (cif (csnd r12_4) one32 zero32)
  let r12_c := w32addc a12_4 k11_c
  let v12 := cfst r12_c
  let k12_c := w32add k12_4 (cif (csnd r12_c) one32 zero32)
  -- Position 13
  let a13_0 := w64lo t01
  let k13_0 := zero32
  let r13_1 := w32addc a13_0 w64lo t10
  let a13_1 := cfst r13_1
  let k13_1 := w32add k13_0 (cif (csnd r13_1) one32 zero32)
  let r13_2 := w32addc a13_1 w64hi t00
  let a13_2 := cfst r13_2
  let k13_2 := w32add k13_1 (cif (csnd r13_2) one32 zero32)
  let r13_c := w32addc a13_2 k12_c
  let v13 := cfst r13_c
  let k13_c := w32add k13_2 (cif (csnd r13_c) one32 zero32)
  -- Position 14
  let a14_0 := w64lo t00
  let k14_0 := zero32
  let r14_c := w32addc a14_0 k13_c
  let v14 := cfst r14_c
  let k14_c := w32add k14_0 (cif (csnd r14_c) one32 zero32)
  -- Position 15
  let v15 := k14_c
  mkWord512 v0 v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15

-- ------------------------------------------------------------
-- P-256 CURVE PARAMETERS
-- ------------------------------------------------------------

def p256a_w0 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w1 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1
def p256a_w2 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w3 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w4 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w5 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w6 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w7 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0
def p256a : Fp256 := mkWord256 p256a_w0 p256a_w1 p256a_w2 p256a_w3 p256a_w4 p256a_w5 p256a_w6 p256a_w7

def p256b_w0 : Word32 := mkWord32 b0 b1 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0
def p256b_w1 : Word32 := mkWord32 b1 b0 b1 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b1
def p256b_w2 : Word32 := mkWord32 b1 b0 b1 b1 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b0 b1 b0 b1 b0 b1
def p256b_w3 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b1 b1 b0 b0
def p256b_w4 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b0
def p256b_w5 : Word32 := mkWord32 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0 b0 b1 b1 b1 b1 b0 b1 b1 b0
def p256b_w6 : Word32 := mkWord32 b0 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0
def p256b_w7 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b1
def p256b : Fp256 := mkWord256 p256b_w0 p256b_w1 p256b_w2 p256b_w3 p256b_w4 p256b_w5 p256b_w6 p256b_w7

def p256Gx_w0 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b1 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0
def p256Gx_w1 : Word32 := mkWord32 b1 b1 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1
def p256Gx_w2 : Word32 := mkWord32 b1 b1 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b0 b1
def p256Gx_w3 : Word32 := mkWord32 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b0 b0 b1 b0
def p256Gx_w4 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b1 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b1
def p256Gx_w5 : Word32 := mkWord32 b0 b0 b1 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0
def p256Gx_w6 : Word32 := mkWord32 b1 b1 b1 b1 b0 b1 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b1 b0 b1
def p256Gx_w7 : Word32 := mkWord32 b1 b1 b0 b1 b1 b0 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b1 b1 b0
def p256Gx : Fp256 := mkWord256 p256Gx_w0 p256Gx_w1 p256Gx_w2 p256Gx_w3 p256Gx_w4 p256Gx_w5 p256Gx_w6 p256Gx_w7

def p256Gy_w0 : Word32 := mkWord32 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1 b1 b1 b0 b0 b0 b1 b0
def p256Gy_w1 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1
def p256Gy_w2 : Word32 := mkWord32 b1 b0 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b0 b1 b0
def p256Gy_w3 : Word32 := mkWord32 b0 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b1 b0 b1 b1 b0
def p256Gy_w4 : Word32 := mkWord32 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b0 b1 b1 b1
def p256Gy_w5 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b0 b1 b1 b0 b0 b1 b1 b1 b0
def p256Gy_w6 : Word32 := mkWord32 b1 b1 b0 b0 b1 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0
def p256Gy_w7 : Word32 := mkWord32 b0 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b1
def p256Gy : Fp256 := mkWord256 p256Gy_w0 p256Gy_w1 p256Gy_w2 p256Gy_w3 p256Gy_w4 p256Gy_w5 p256Gy_w6 p256Gy_w7

def JPoint : Sort 1 := CPair Fp256 (CPair Fp256 Fp256)
def mkJPoint (X Y Z : Fp256) : JPoint := cpair X (cpair Y Z)
def jpX (p : JPoint) : Fp256 := cfst p
def jpY (p : JPoint) : Fp256 := cfst (csnd p)
def jpZ (p : JPoint) : Fp256 := csnd (csnd p)

def p256one : Word256 := mkWord256 zero32 zero32 zero32 zero32 zero32 zero32 zero32 one32
def p256G : JPoint := mkJPoint p256Gx p256Gy p256one

-- ============================================================
-- END OF P-256 FIELD LAYER (hardened)
-- Hardened: Word32/64/256/512 types, add/sub/cmp,
-- 32x32->64 multiply, 256x256->512 multiply (full schoolbook),
-- curve parameters, Jacobian point type.
-- Next: Barrett reduction, F_p multiplication, point operations.
-- ============================================================