import CleanBits
set_option maxRecDepth 4000000
open Clean

namespace CleanSha

/-- 8-word state as a STRUCTURE (not `Fin 8 → Nat`): each round produces a
constructor with already-evaluated fields, so the kernel shares values
instead of re-deriving them. -/
structure St where
  a : Nat
  b : Nat
  c : Nat
  d : Nat
  e : Nat
  f : Nat
  g : Nat
  h : Nat

/-- 16-word sliding window for the message schedule. -/
structure Win where
  w0 : Nat
  w1 : Nat
  w2 : Nat
  w3 : Nat
  w4 : Nat
  w5 : Nat
  w6 : Nat
  w7 : Nat
  w8 : Nat
  w9 : Nat
  w10 : Nat
  w11 : Nat
  w12 : Nat
  w13 : Nat
  w14 : Nat
  w15 : Nat

def sig0 (x : Nat) : Nat := xor32 (xor32 (rotr32 x 7) (rotr32 x 18)) (shr32 x 3)
def sig1 (x : Nat) : Nat := xor32 (xor32 (rotr32 x 17) (rotr32 x 19)) (shr32 x 10)
def Sig0 (x : Nat) : Nat := xor32 (xor32 (rotr32 x 2) (rotr32 x 13)) (rotr32 x 22)
def Sig1 (x : Nat) : Nat := xor32 (xor32 (rotr32 x 6) (rotr32 x 11)) (rotr32 x 25)
def chF  (x y z : Nat) : Nat := xor32 (and32 x y) (and32 (not32 x) z)
def majF (x y z : Nat) : Nat := xor32 (xor32 (and32 x y) (and32 x z)) (and32 y z)

def shiftWin (w : Win) (nw : Nat) : Win :=
  ⟨w.w1, w.w2, w.w3, w.w4, w.w5, w.w6, w.w7, w.w8,
   w.w9, w.w10, w.w11, w.w12, w.w13, w.w14, w.w15, nw⟩

/-- Expand the schedule: emit `fuel` further words from the window. -/
def expand : Nat → Win → List Nat
  | 0,      _ => []
  | fuel+1, w =>
      let nw := add32 (add32 (sig1 w.w14) w.w9) (add32 (sig0 w.w1) w.w0)
      nw :: expand fuel (shiftWin w nw)

def step (s : St) (k w : Nat) : St :=
  let t1 := add32 (add32 (add32 s.h (Sig1 s.e)) (add32 (chF s.e s.f s.g) k)) w
  let t2 := add32 (Sig0 s.a) (majF s.a s.b s.c)
  ⟨add32 t1 t2, s.a, s.b, s.c, add32 s.d t1, s.e, s.f, s.g⟩

def rounds : St → List Nat → List Nat → St
  | s, [],      _       => s
  | s, _,       []      => s
  | s, k :: ks, w :: ws => rounds (step s k w) ks ws

end CleanSha
