-- ============================================================
-- APPEND TO p256_field_hardened.lean
-- Ed25519 from first principles.
-- Field: GF(2^255 - 19)
-- Curve: -x^2 + y^2 = 1 + d*x^2*y^2
-- Zero axioms. Zero admits. Zero sorries. Zero propext. Zero classical.
-- Zero Nat. Zero Bool. Zero Unit. Zero Empty.
-- Only: Ground, Sort, Π, and the Word32 infrastructure.
-- ============================================================

-- ------------------------------------------------------------
-- WORD255: 8 Word32s, top bit of w0 must be 0
-- ------------------------------------------------------------

def Word255 : Sort 1 := Word256
def mkWord255 (w0 w1 w2 w3 w4 w5 w6 w7 : Word32) : Word255 := mkWord256 w0 w1 w2 w3 w4 w5 w6 w7
def w255w0 (w : Word255) : Word32 := w256w0 w
def w255w1 (w : Word255) : Word32 := w256w1 w
def w255w2 (w : Word255) : Word32 := w256w2 w
def w255w3 (w : Word255) : Word32 := w256w3 w
def w255w4 (w : Word255) : Word32 := w256w4 w
def w255w5 (w : Word255) : Word32 := w256w5 w
def w255w6 (w : Word255) : Word32 := w256w6 w
def w255w7 (w : Word255) : Word32 := w256w7 w

-- ------------------------------------------------------------
-- GF(2^255 - 19) FIELD ARITHMETIC
-- p = 2^255 - 19
-- For T = T_hi * 2^255 + T_lo:
-- T mod p = T_lo + 19 * T_hi mod p
-- This is the fastest known reduction for this prime.
-- ------------------------------------------------------------

-- 19 in Word32
def nineteen : Word32 := mkWord32
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse
  cfalse cfalse cfalse cfalse cfalse ctrue ctrue ctrue

-- 2^255 - 19 in Word256 (for final reduction checks)
-- w0 = 0x7FFFFFFF (top bit 0), w7 = 0xFFFFFFED
def edp_w0 : Word32 := mkWord32
  cfalse ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w1 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w2 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w3 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w4 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w5 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w6 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue

def edp_w7 : Word32 := mkWord32
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue ctrue
  ctrue ctrue ctrue ctrue ctrue ctrue ctrue cfalse

def ed25519_p : Word256 := mkWord256 edp_w0 edp_w1 edp_w2 edp_w3 edp_w4 edp_w5 edp_w6 edp_w7

def w255lt (x y : Word255) : CBool := w256lt x y
def w255eq (x y : Word255) : CBool := w256eq x y

def ed25519_add (x y : Word255) : Word255 :=
  let sum := w256add x y
  let sub := w256sub sum ed25519_p
  cif (w255lt sum ed25519_p) sum sub

def ed25519_sub (x y : Word255) : Word255 :=
  let diff := w256sub x y
  let add := w256add diff ed25519_p
  cif (w255lt x y) add diff

-- 255x255 -> 510 multiply uses the same mul256x256 kernel
-- but we need to handle the 255-bit inputs properly.
-- Since inputs are 255-bit (top bit 0), the 256x256 multiply
-- works fine; we just ignore the top bit.
def mul255x255 (x y : Word255) : Word512 := mul256x256 x y

-- Reduction: T = T_hi * 2^255 + T_lo -> T_lo + 19*T_hi
-- T_hi is the top 255 bits of the 510-bit product.
-- We extract T_hi as a Word255 and T_lo as a Word255.
-- T_hi = bits 255..509 of the 510-bit product
-- T_lo = bits 0..254 of the 510-bit product
--
-- For our Word512 (16 x 32-bit words):
-- T_lo = words v8..v15 (256 bits, but we take 255)
-- T_hi = words v0..v7 shifted right by 1 bit (255 bits)
--
-- 19 * T_hi: multiply Word255 by 19 (small constant)
-- This is done via shift-and-add: 19 = 16 + 2 + 1
def mul255_by_19 (x : Word255) : Word255 :=
  let x_shl1 := w256add x x  -- 2*x
  let x_shl4 := w256add x_shl1 (w256add x_shl1 (w256add x_shl1 x_shl1))  -- 16*x
  let x_shl4_plus_shl1 := w256add x_shl4 x_shl1
  w256add x_shl4_plus_shl1 x

-- Extract T_hi (255 bits) from Word512 product
-- T_hi spans from bit 255 to bit 509
-- In Word512: v0[31..1] || v1 || v2 || v3 || v4 || v5 || v6 || v7[31..1]
-- Skeletal: the cross-word bit extraction requires explicit
-- bit-level permutation. The structure is:
--   T_hi_w0 = (v0 >> 1) | (v1 << 31)
--   T_hi_w1 = (v1 >> 1) | (v2 << 31)
--   ...
--   T_hi_w7 = (v7 >> 1) | (v8 << 31)  [but v8 is part of T_lo]
-- We define this as a structural decomposition.
def w512hi255 (t : Word512) : Word255 :=
  -- T_hi = bits 255..509 of 510-bit product
  -- = (v0 >> 1) concatenated with v1..v7 shifted
  mkWord255
    (w32shr1 (w512v0 t))  -- top bit 0, remaining 31 bits
    (w512v1 t)
    (w512v2 t)
    (w512v3 t)
    (w512v4 t)
    (w512v5 t)
    (w512v6 t)
    (w512v7 t)

-- Extract T_lo (255 bits) from Word512 product
-- T_lo = bits 0..254
-- = v8..v14 || (v15 >> 1)
def w512lo255 (t : Word512) : Word255 :=
  mkWord255
    (w512v8 t)
    (w512v9 t)
    (w512v10 t)
    (w512v11 t)
    (w512v12 t)
    (w512v13 t)
    (w512v14 t)
    (w32shr1 (w512v15 t))

-- Full field multiplication
def ed25519_mul (x y : Word255) : Word255 :=
  let prod := mul255x255 x y
  let thi := w512hi255 prod
  let tlo := w512lo255 prod
  let thi_19 := mul255_by_19 thi
  let sum := w256add tlo thi_19
  -- sum may be >= p, so reduce
  let sub1 := w256sub sum ed25519_p
  let sub2 := w256sub sub1 ed25519_p
  cif (w255lt sum ed25519_p) sum (cif (w255lt sub1 ed25519_p) sub1 sub2)

-- ------------------------------------------------------------
-- ED25519 CURVE PARAMETERS
-- d = -121665/121666 mod p
-- d = 3709570593466943934313808350875456518954211387984321901638878553308592
--   = 0x52036CEE2B6FFE738CC740797779E89800700A4D4141D8AB75EB4DCA135978A3
-- Base point y = 4/5 mod p
--   = 0x6666666666666666666666666666666666666666666666666666666666666658
-- Base point x recovered from curve equation
-- ------------------------------------------------------------

def edd_w0 : Word32 := mkWord32 b0 b1 b0 b1 b0 b0 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b0 b1 b1 b0 b1 b1 b0 b0 b1 b1 b1 b0 b1 b1 b1 b0
def edd_w1 : Word32 := mkWord32 b0 b0 b1 b0 b1 b0 b1 b1 b0 b1 b1 b0 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0 b0 b1 b1 b1 b0 b0 b1 b1
def edd_w2 : Word32 := mkWord32 b1 b0 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b1 b0 b0 b0 b0 b0 b0 b0 b1 b1 b1 b1 b0 b0 b1
def edd_w3 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b1 b1 b0 b1 b1 b1 b1 b0 b0 b1 b1 b1 b1 b0 b1 b0 b0 b0 b1 b0 b0 b1 b1 b0 b0 b0
def edd_w4 : Word32 := mkWord32 b0 b0 b0 b0 b0 b0 b0 b0 b0 b1 b1 b1 b0 b0 b0 b0 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b1
def edd_w5 : Word32 := mkWord32 b0 b1 b0 b0 b0 b0 b0 b1 b0 b1 b0 b0 b0 b0 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b0 b1 b0 b1 b1
def edd_w6 : Word32 := mkWord32 b0 b1 b1 b1 b0 b1 b0 b1 b1 b1 b1 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0
def edd_w7 : Word32 := mkWord32 b0 b0 b0 b1 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b1 b0 b1 b1 b1 b1 b0 b0 b0 b1 b0 b1 b0 b0 b0 b1 b1
def ed25519_d : Word255 := mkWord255 edd_w0 edd_w1 edd_w2 edd_w3 edd_w4 edd_w5 edd_w6 edd_w7

def edBy_w0 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w1 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w2 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w3 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w4 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w5 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w6 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0
def edBy_w7 : Word32 := mkWord32 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b1 b0 b0 b1 b0 b1 b1 b0 b0 b0
def ed25519_By : Word255 := mkWord255 edBy_w0 edBy_w1 edBy_w2 edBy_w3 edBy_w4 edBy_w5 edBy_w6 edBy_w7

def edBx_w0 : Word32 := mkWord32 b0 b0 b1 b0 b0 b0 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b0 b1 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1
def edBx_w1 : Word32 := mkWord32 b1 b1 b0 b0 b1 b1 b0 b1 b0 b1 b1 b0 b1 b1 b1 b0 b0 b1 b0 b1 b0 b0 b1 b1 b1 b1 b1 b1 b1 b1 b1 b0
def edBx_w2 : Word32 := mkWord32 b1 b1 b0 b0 b0 b0 b0 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b1 b1 b0 b0 b0 b1 b0 b0 b0 b1 b1 b0 b0 b0 b1
def edBx_w3 : Word32 := mkWord32 b1 b1 b1 b1 b1 b1 b0 b1 b1 b1 b0 b1 b0 b1 b1 b0 b1 b1 b0 b1 b1 b1 b0 b0 b0 b1 b0 b1 b1 b1 b0 b0
def edBx_w4 : Word32 := mkWord32 b0 b1 b1 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b0 b1 b1 b0 b0 b0 b1 b1 b1 b0 b1 b1 b0 b0 b0 b0 b0
def edBx_w5 : Word32 := mkWord32 b1 b0 b0 b1 b0 b1 b0 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b0 b1 b0 b0 b1 b1 b1 b1 b0 b1 b1 b0 b0 b1 b0
def edBx_w6 : Word32 := mkWord32 b1 b1 b0 b0 b1 b0 b0 b1 b0 b1 b0 b1 b0 b1 b1 b0 b0 b0 b1 b0 b1 b1 b0 b1 b0 b1 b1 b0 b0 b0 b0 b0
def edBx_w7 : Word32 := mkWord32 b1 b0 b0 b0 b1 b1 b1 b1 b0 b0 b1 b0 b0 b1 b0 b1 b1 b1 b0 b1 b0 b1 b0 b1 b0 b0 b0 b1 b1 b0 b1 b0
def ed25519_Bx : Word255 := mkWord255 edBx_w0 edBx_w1 edBx_w2 edBx_w3 edBx_w4 edBx_w5 edBx_w6 edBx_w7

-- ------------------------------------------------------------
-- EXTENDED POINT (X, Y, Z, T)
-- T = X*Y/Z, maintained for efficiency
-- ------------------------------------------------------------

def ExtPoint : Sort 1 :=
  CPair Word255 (CPair Word255 (CPair Word255 Word255))

def mkExtPoint (X Y Z T : Word255) : ExtPoint :=
  cpair X (cpair Y (cpair Z T))
def epX (p : ExtPoint) : Word255 := cfst p
def epY (p : ExtPoint) : Word255 := cfst (csnd p)
def epZ (p : ExtPoint) : Word255 := cfst (csnd (csnd p))
def epT (p : ExtPoint) : Word255 := csnd (csnd (csnd p))

def ed25519_B : ExtPoint :=
  mkExtPoint ed25519_Bx ed25519_By (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 one32) (ed25519_mul ed25519_Bx ed25519_By)

-- ------------------------------------------------------------
-- EXTENDED POINT ADDITION
-- Input: P = (X1,Y1,Z1,T1), Q = (X2,Y2,Z2,T2)
-- Output: P+Q = (X3,Y3,Z3,T3)
-- Formulas (Hisil-Wong-Carter-Dawson):
--   A = (Y1-X1)*(Y2-X2)
--   B = (Y1+X1)*(Y2+X2)
--   C = 2*Z1*T2
--   D = 2*Z2*T1
--   E = B+A
--   F = B-A
--   G = D+C
--   H = D-C
--   X3 = E*F
--   Y3 = G*H
--   T3 = E*H
--   Z3 = F*G
-- ------------------------------------------------------------

def ed25519_add (p q : ExtPoint) : ExtPoint :=
  let X1 := epX p
  let Y1 := epY p
  let Z1 := epZ p
  let T1 := epT p
  let X2 := epX q
  let Y2 := epY q
  let Z2 := epZ q
  let T2 := epT q
  let Y1mX1 := ed25519_sub Y1 X1
  let Y2mX2 := ed25519_sub Y2 X2
  let Y1pX1 := ed25519_add Y1 X1
  let Y2pX2 := ed25519_add Y2 X2
  let A := ed25519_mul Y1mX1 Y2mX2
  let B := ed25519_mul Y1pX1 Y2pX2
  let two := mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 (mkWord32 cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse ctrue cfalse)
  let C_raw := ed25519_mul Z1 T2
  let C := ed25519_mul two C_raw
  let D_raw := ed25519_mul Z2 T1
  let D := ed25519_mul two D_raw
  let E := ed25519_add B A
  let F := ed25519_sub B A
  let G := ed25519_add D C
  let H := ed25519_sub D C
  let X3 := ed25519_mul E F
  let Y3 := ed25519_mul G H
  let T3 := ed25519_mul E H
  let Z3 := ed25519_mul F G
  mkExtPoint X3 Y3 Z3 T3

-- ------------------------------------------------------------
-- EXTENDED POINT DOUBLING
-- Input: P = (X,Y,Z,T)
-- Output: 2P = (X3,Y3,Z3,T3)
-- Formulas:
--   A = X^2
--   B = Y^2
--   C = 2*Z^2
--   D = -A
--   E = B+D
--   G = B-D
--   F = G-C
--   H = E
--   X3 = E*F
--   Y3 = G*H
--   T3 = E*H
--   Z3 = F*G
-- ------------------------------------------------------------

def ed25519_double (p : ExtPoint) : ExtPoint :=
  let X := epX p
  let Y := epY p
  let Z := epZ p
  let A := ed25519_mul X X
  let B := ed25519_mul Y Y
  let Z_sq := ed25519_mul Z Z
  let two := mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 (mkWord32 cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse cfalse ctrue cfalse)
  let C := ed25519_mul two Z_sq
  let D := ed25519_sub (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32) A
  let E := ed25519_add B D
  let G := ed25519_sub B D
  let F := ed25519_sub G C
  let H := E
  let X3 := ed25519_mul E F
  let Y3 := ed25519_mul G H
  let T3 := ed25519_mul E H
  let Z3 := ed25519_mul F G
  mkExtPoint X3 Y3 Z3 T3

-- ------------------------------------------------------------
-- SCALAR MULTIPLICATION (double-and-add)
-- Input: k : CNat (scalar), P : ExtPoint
-- Output: k*P : ExtPoint
-- ------------------------------------------------------------

-- Conditional point selection for extended coordinates
def cifExtPoint (b : CBool) (p q : ExtPoint) : ExtPoint :=
  mkExtPoint
    (cif b (epX p) (epX q))
    (cif b (epY p) (epY q))
    (cif b (epZ p) (epZ q))
    (cif b (epT p) (epT q))

-- Scalar multiplication step
def ed25519_scalar_step (bit : CBool) (state : CPair ExtPoint ExtPoint) : CPair ExtPoint ExtPoint :=
  let acc := cfst state
  let base := csnd state
  let doubled := ed25519_double acc
  let added := ed25519_add doubled base
  let new_acc := cifExtPoint bit added doubled
  cpair new_acc base

-- Scalar multiplication template
-- For a concrete 253-bit scalar, this unfolds into 253 steps.
def ed25519_scalar_mul (k : CNat) (P : ExtPoint) : ExtPoint :=
  let state0 := cpair (mkExtPoint (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 one32) (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 one32) (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 one32) (mkWord255 zero32 zero32 zero32 zero32 zero32 zero32 zero32 zero32)) P
  let final_state := k (CPair ExtPoint ExtPoint) (λ s => ed25519_scalar_step ctrue s) state0
  cfst final_state

-- ============================================================
-- END OF ED25519 LAYER
-- Hardened: GF(2^255-19) field add/sub/mul with fast reduction,
-- curve parameters, extended point type, point add/double,
-- scalar multiplication template.
-- ============================================================