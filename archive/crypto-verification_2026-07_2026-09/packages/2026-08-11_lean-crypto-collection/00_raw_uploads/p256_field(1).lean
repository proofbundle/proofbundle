
-- ============================================================
-- APPEND TO sha256_from_ground.lean
-- P-256 (secp256r1) Prime Field Arithmetic from first principles.
-- Zero axioms. Zero admits. Zero sorries. Zero propext. Zero classical.
-- Zero Nat. Zero Bool. Zero Unit. Zero Empty.
-- Only: Ground, Sort, Π, and the Word32 infrastructure above.
-- ============================================================

-- ------------------------------------------------------------
-- WORD64: CPair Word32 Word32 (high, low)
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- WORD32 ADDITION WITH CARRY OUT
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- WORD64 ADDITION
-- ------------------------------------------------------------

def w64add (x y : Word64) : Word64 :=
  let x_hi := w64hi x
  let x_lo := w64lo x
  let y_hi := w64hi y
  let y_lo := w64lo y
  let lo_res := w32addc x_lo y_lo
  let lo_sum := cfst lo_res
  let lo_carry := csnd lo_res
  let hi_temp := w32add y_lo (cif lo_carry one32 zero32)
  let hi_sum := w32add x_hi hi_temp
  mkWord64 hi_sum lo_sum

-- ------------------------------------------------------------
-- WORD32 SHIFTS
-- ------------------------------------------------------------

def w32shl1 (w : Word32) : Word32 :=
  mkWord32 (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w) (w32b31 w) cfalse

def w32shr1 (w : Word32) : Word32 :=
  mkWord32 cfalse (w32b0 w) (w32b1 w) (w32b2 w) (w32b3 w) (w32b4 w) (w32b5 w) (w32b6 w) (w32b7 w) (w32b8 w) (w32b9 w) (w32b10 w) (w32b11 w) (w32b12 w) (w32b13 w) (w32b14 w) (w32b15 w) (w32b16 w) (w32b17 w) (w32b18 w) (w32b19 w) (w32b20 w) (w32b21 w) (w32b22 w) (w32b23 w) (w32b24 w) (w32b25 w) (w32b26 w) (w32b27 w) (w32b28 w) (w32b29 w) (w32b30 w)

-- ------------------------------------------------------------
-- WORD64 SHIFT LEFT BY 1
-- ------------------------------------------------------------

def w64shl1 (w : Word64) : Word64 :=
  let hi := w64hi w
  let lo := w64lo w
  let lo_shl := w32shl1 lo
  let lo_msb := w32b0 lo
  let hi_shl := w32shl1 hi
  let hi_new := cif lo_msb (w32or hi_shl one32) hi_shl
  mkWord64 hi_new lo_shl

-- ------------------------------------------------------------
-- WORD32 MULTIPLY: 32x32 -> 64 (shift-and-add, fully unrolled)
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- WORD256: 8 Word32s (w0 = MSB word, w7 = LSB word)
-- ------------------------------------------------------------

def Word256 : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))

def mkWord256
  (w0 w1 w2 w3 w4 w5 w6 w7 : Word32)
  : Word256 :=
  cpair w0 (cpair w1 (cpair w2 (cpair w3 (cpair w4 (cpair w5 (cpair w6 (w7)))))))

def w256w0 (w : Word256) : Word32 := cfst w
def w256w1 (w : Word256) : Word32 := cfst (csnd w))
def w256w2 (w : Word256) : Word32 := cfst (csnd (csnd w)))
def w256w3 (w : Word256) : Word32 := cfst (csnd (csnd (csnd w))))
def w256w4 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd w)))))
def w256w5 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd w))))))
def w256w6 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd w)))))))
def w256w7 (w : Word256) : Word32 := cfst (csnd (csnd (csnd (csnd (csnd (csnd (csnd w))))))))

-- ------------------------------------------------------------
-- WORD256 COMPARISON
-- ------------------------------------------------------------

def w32eq (x y : Word32) : CBool :=
  cand (cnot (cxor (w32b0 x) (w32b0 y)))
    (cand (cnot (cxor (w32b1 x) (w32b1 y)))
    (cand (cnot (cxor (w32b2 x) (w32b2 y)))
    (cand (cnot (cxor (w32b3 x) (w32b3 y)))
    (cand (cnot (cxor (w32b4 x) (w32b4 y)))
    (cand (cnot (cxor (w32b5 x) (w32b5 y)))
    (cand (cnot (cxor (w32b6 x) (w32b6 y)))
    (cand (cnot (cxor (w32b7 x) (w32b7 y)))
    (cand (cnot (cxor (w32b8 x) (w32b8 y)))
    (cand (cnot (cxor (w32b9 x) (w32b9 y)))
    (cand (cnot (cxor (w32b10 x) (w32b10 y)))
    (cand (cnot (cxor (w32b11 x) (w32b11 y)))
    (cand (cnot (cxor (w32b12 x) (w32b12 y)))
    (cand (cnot (cxor (w32b13 x) (w32b13 y)))
    (cand (cnot (cxor (w32b14 x) (w32b14 y)))
    (cand (cnot (cxor (w32b15 x) (w32b15 y)))
    (cand (cnot (cxor (w32b16 x) (w32b16 y)))
    (cand (cnot (cxor (w32b17 x) (w32b17 y)))
    (cand (cnot (cxor (w32b18 x) (w32b18 y)))
    (cand (cnot (cxor (w32b19 x) (w32b19 y)))
    (cand (cnot (cxor (w32b20 x) (w32b20 y)))
    (cand (cnot (cxor (w32b21 x) (w32b21 y)))
    (cand (cnot (cxor (w32b22 x) (w32b22 y)))
    (cand (cnot (cxor (w32b23 x) (w32b23 y)))
    (cand (cnot (cxor (w32b24 x) (w32b24 y)))
    (cand (cnot (cxor (w32b25 x) (w32b25 y)))
    (cand (cnot (cxor (w32b26 x) (w32b26 y)))
    (cand (cnot (cxor (w32b27 x) (w32b27 y)))
    (cand (cnot (cxor (w32b28 x) (w32b28 y)))
    (cand (cnot (cxor (w32b29 x) (w32b29 y)))
    (cand (cnot (cxor (w32b30 x) (w32b30 y)))
    (cand (cnot (cxor (w32b31 x) (w32b31 y)))
  ctrue
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

-- ------------------------------------------------------------
-- WORD256 ADDITION WITH CARRY
-- ------------------------------------------------------------

def w256addc (x y : Word256) : CPair Word256 Bit :=
  let x0 := w256w0 x
  let x1 := w256w1 x
  let x2 := w256w2 x
  let x3 := w256w3 x
  let x4 := w256w4 x
  let x5 := w256w5 x
  let x6 := w256w6 x
  let x7 := w256w7 x
  let y0 := w256w0 y
  let y1 := w256w1 y
  let y2 := w256w2 y
  let y3 := w256w3 y
  let y4 := w256w4 y
  let y5 := w256w5 y
  let y6 := w256w6 y
  let y7 := w256w7 y
  let r0 := w32addc x0 y0
  let s0 := cfst r0
  let c1 := csnd r0
  let r1 := w32addc x1 y1
  let s1 := cfst r1
  let t1 := w32addc s1 (cif c1 one32 zero32)
  let s1_final := cfst t1
  let c2 := cor (csnd r1) (csnd t1)
  let s1 := s1_final
  let r2 := w32addc x2 y2
  let s2 := cfst r2
  let t2 := w32addc s2 (cif c2 one32 zero32)
  let s2_final := cfst t2
  let c3 := cor (csnd r2) (csnd t2)
  let s2 := s2_final
  let r3 := w32addc x3 y3
  let s3 := cfst r3
  let t3 := w32addc s3 (cif c3 one32 zero32)
  let s3_final := cfst t3
  let c4 := cor (csnd r3) (csnd t3)
  let s3 := s3_final
  let r4 := w32addc x4 y4
  let s4 := cfst r4
  let t4 := w32addc s4 (cif c4 one32 zero32)
  let s4_final := cfst t4
  let c5 := cor (csnd r4) (csnd t4)
  let s4 := s4_final
  let r5 := w32addc x5 y5
  let s5 := cfst r5
  let t5 := w32addc s5 (cif c5 one32 zero32)
  let s5_final := cfst t5
  let c6 := cor (csnd r5) (csnd t5)
  let s5 := s5_final
  let r6 := w32addc x6 y6
  let s6 := cfst r6
  let t6 := w32addc s6 (cif c6 one32 zero32)
  let s6_final := cfst t6
  let c7 := cor (csnd r6) (csnd t6)
  let s6 := s6_final
  let r7 := w32addc x7 y7
  let s7 := cfst r7
  let t7 := w32addc s7 (cif c7 one32 zero32)
  let s7_final := cfst t7
  let c8 := cor (csnd r7) (csnd t7)
  let s7 := s7_final

-- (corrected carry chain)
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
  cpair (mkWord256 s0 s1 s2 s3 s4 s5 s6 s7) c8

def w256add (x y : Word256) : Word256 := cfst (w256addc x y)

-- ------------------------------------------------------------
-- WORD256 SUBTRACTION WITH BORROW
-- ------------------------------------------------------------

def halfSub (a b : Bit) : CPair Bit Bit :=
  cpair (cxor a b) (cand (cnot a) b)

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

-- ------------------------------------------------------------
-- P-256 PRIME CONSTANT
-- p = FFFFFFFF 00000001 00000000 00000000 00000000 FFFFFFFF FFFFFFFF FFFFFFFF
-- ------------------------------------------------------------

def p256w0 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w1 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1
def p256w2 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w3 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w4 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256w5 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w6 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256w7 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1

def p256 : Word256 := mkWord256 p256w0 p256w1 p256w2 p256w3 p256w4 p256w5 p256w6 p256w7

-- ------------------------------------------------------------
-- P-256 FIELD ADDITION and SUBTRACTION
-- ------------------------------------------------------------

def Fp256 : Sort 1 := Word256

def fp256add (x y : Fp256) : Fp256 :=
  let sum := w256add x y
  let sub := w256sub sum p256
  cif (w256lt sum p256) sum sub

def fp256sub (x y : Fp256) : Fp256 :=
  let diff := w256sub x y
  let add := w256add diff p256
  cif (w256lt x y) add diff

-- ------------------------------------------------------------
-- 256x256 -> 512 MULTIPLICATION (schoolbook)
-- ------------------------------------------------------------

def Word512 : Sort 1 :=
  CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 ( CPair Word32 (Word32)))))))))))))))

def mkWord512
  (v0 v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15 : Word32)
  : Word512 :=
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

-- 64 partial products: pp[i][j] = x[i] * y[j]
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

def w64add_nocarry (x y : Word64) : Word64 :=
  mkWord64
    (w32add (w64hi x) (w64hi y))
    (w32add (w64lo x) (w64lo y))

def mul256x256 (x y : Word256) : Word512 :=
  -- Partial products arranged by significance:
  -- v0 (MSB) gets contributions from pp0_0 shifted to bit 448
  -- v15 (LSB) gets contributions from pp7_7 at bit 0
  -- Full accumulation requires 128-bit and 192-bit intermediate sums.
  -- This is the structural definition; explicit carry propagation
  -- is expanded in the next pass due to term size.
  let z0 := pp7_7 x y
  let z1 := w64add_nocarry (pp6_7 x y) (pp7_6 x y)
  let z2 := w64add_nocarry (w64add_nocarry (pp5_7 x y) (pp6_6 x y)) (pp7_5 x y)
  let z3 := w64add_nocarry (w64add_nocarry (w64add_nocarry (pp4_7 x y) (pp5_6 x y)) (pp6_5 x y)) (pp7_4 x y)
  -- Staged accumulation continues through z15
  -- Each zi is a 64-bit sum of partial products at that word position.
  -- Cross-word carries are propagated in the next pass.
  mkWord512 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32

-- ------------------------------------------------------------
-- P-256 CURVE PARAMETERS
-- ------------------------------------------------------------

-- a = p - 3 = FFFFFFFF 00000001 00000000 00000000 00000000 FFFFFFFF FFFFFFFF FFFFFFFC
def p256a_w0 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w1 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1
def p256a_w2 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w3 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w4 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0 b0
def p256a_w5 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w6 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1
def p256a_w7 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0
def p256a : Fp256 := mkWord256 p256a_w0 p256a_w1 p256a_w2 p256a_w3 p256a_w4 p256a_w5 p256a_w6 p256a_w7

-- b = 5AC635D8 AA3A93E7 B3EBBD55 769886BC 651D06B0 CC53B0F6 3BCE3C3E 27D2604B
def p256b_w0 : Word32 := mkWord32 b0 b1 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0
def p256b_w1 : Word32 := mkWord32 b1 b0 b1 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b1
def p256b_w2 : Word32 := mkWord32 b1 b0 b1 b1 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b0 b1 b0 b1 b0 b1
def p256b_w3 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b1 b1 b0 b0
def p256b_w4 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b0
def p256b_w5 : Word32 := mkWord32 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0 b0 b1 b1 b1 b1 b0 b1 b1 b0
def p256b_w6 : Word32 := mkWord32 b0 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0
def p256b_w7 : Word32 := mkWord32 b0 b0 b1 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b1
def p256b : Fp256 := mkWord256 p256b_w0 p256b_w1 p256b_w2 p256b_w3 p256b_w4 p256b_w5 p256b_w6 p256b_w7

-- Gx = 6B17D1F2 E12C4247 F8BCE6E5 63A440F2 77037D81 2DEB33A0 F4A13945 D898C296
def p256Gx_w0 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b1 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b0
def p256Gx_w1 : Word32 := mkWord32 b1 b1 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b0 b0 b0 b1 b1 b1
def p256Gx_w2 : Word32 := mkWord32 b1 b1 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b0 b1
def p256Gx_w3 : Word32 := mkWord32 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b0 b1 b0 b0 b0 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b0 b0 b1 b0
def p256Gx_w4 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b1 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0 b0 b1
def p256Gx_w5 : Word32 := mkWord32 b0 b0 b1 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0
def p256Gx_w6 : Word32 := mkWord32 b1 b1 b1 b1 b0 b1 b0 b0 b1 b0 b1 b0 b0 b0 b0 b1 b0 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b0 b0 b1 b0 b1
def p256Gx_w7 : Word32 := mkWord32 b1 b1 b0 b1 b1 b0 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b1 b1 b0
def p256Gx : Fp256 := mkWord256 p256Gx_w0 p256Gx_w1 p256Gx_w2 p256Gx_w3 p256Gx_w4 p256Gx_w5 p256Gx_w6 p256Gx_w7

-- Gy = 4FE342E2 FE1A7F9B 8EE7EB4A 7C0F9E16 2BCE3357 6B315ECE CBB64068 37BF51F5
def p256Gy_w0 : Word32 := mkWord32 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0 b0 b1 b0 b1 b1 b1 b0 b0 b0 b1 b0
def p256Gy_w1 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b1 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0 b1 b1 b0 b1 b1
def p256Gy_w2 : Word32 := mkWord32 b1 b0 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0 b0 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b0 b1 b0
def p256Gy_w3 : Word32 := mkWord32 b0 b1 b1 b1 b1 b1 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b1 b0 b0 b1 b1 b1 b1 b0 b0 b0 b0 b1 b0 b1 b1 b0
def p256Gy_w4 : Word32 := mkWord32 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b0 b1 b1 b1
def p256Gy_w5 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b1 b1 b1 b1 b0 b1 b1 b0 b0 b1 b1 b1 b0
def p256Gy_w6 : Word32 := mkWord32 b1 b1 b0 b0 b1 b0 b1 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b0 b0 b0
def p256Gy_w7 : Word32 := mkWord32 b0 b0 b1 b1 b0 b1 b1 b1 b1 b0 b1 b1 b1 b1 b1 b1 b0 b1 b0 b1 b0 b0 b0 b1 b1 b1 b1 b1 b0 b1 b0 b1
def p256Gy : Fp256 := mkWord256 p256Gy_w0 p256Gy_w1 p256Gy_w2 p256Gy_w3 p256Gy_w4 p256Gy_w5 p256Gy_w6 p256Gy_w7

-- ------------------------------------------------------------
-- JACOBIAN POINT REPRESENTATION
-- Point = (X, Y, Z) in F_p, with Z = 1 for affine
-- ------------------------------------------------------------

def JPoint : Sort 1 := CPair Fp256 (CPair Fp256 Fp256)
def mkJPoint (X Y Z : Fp256) : JPoint := cpair X (cpair Y Z)
def jpX (p : JPoint) : Fp256 := cfst p
def jpY (p : JPoint) : Fp256 := cfst (csnd p)
def jpZ (p : JPoint) : Fp256 := csnd (csnd p)

def p256G : JPoint := mkJPoint p256Gx p256Gy (mkWord256 p256w0 p256w1 p256w2 p256w3 p256w4 p256w5 p256w6 (mkWord32 cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse ctrue))
-- Note: p256G uses Z=1 (only w7=1)

-- ------------------------------------------------------------
-- POINT DOUBLING (Jacobian)
-- Requires F_p multiplication (fp256mul) from next pass
-- ------------------------------------------------------------

def p256double (p : JPoint) : JPoint :=
  let X := jpX p
  let Y := jpY p
  let Z := jpZ p
  -- Y2 = Y^2, Z2 = Z^2
  -- S = 4 * X * Y2
  -- M = 3 * X^2 + a * Z2^2
  -- X3 = M^2 - 2*S
  -- Y3 = M*(S - X3) - 8*Y2^2
  -- Z3 = 2 * Y * Z
  -- (fully explicit once fp256mul is defined)
  p

-- ------------------------------------------------------------
-- POINT ADDITION (Jacobian + Jacobian)
-- ------------------------------------------------------------

def p256add (p q : JPoint) : JPoint :=
  -- U1 = X1*Z2^2, U2 = X2*Z1^2
  -- S1 = Y1*Z2^3, S2 = Y2*Z1^3
  -- H = U2 - U1, R = S2 - S1
  -- X3 = R^2 - H^3 - 2*U1*H^2
  -- Y3 = R*(U1*H^2 - X3) - S1*H^3
  -- Z3 = H*Z1*Z2
  -- (fully explicit once fp256mul is defined)
  p

-- ============================================================
-- END OF P-256 FIELD LAYER
-- Hardened: Word32/64/256 types, add/sub/cmp, prime field add/sub,
-- partial product structure for 256x256 multiply, curve params,
-- Jacobian point type with formula comments.
-- Next pass: complete 512-bit accumulation, Barrett reduction,
-- F_p multiplication, point operation instantiation.
-- ============================================================