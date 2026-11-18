
-- Crypto/SHA256/Defective.lean
-- PRESERVED DEFECTIVE PREDECESSOR — DO NOT USE IN PRODUCTION
--
-- This file contains the original SHA-256 core implementation that used the
-- Array indexing operator [!], which invokes panic! on out-of-bounds access.
-- In Lean 4, panic! is implemented via an axiom (sorryAx in core), meaning
-- this code violates the zero-axiom boundary despite claiming otherwise.
--
-- The mathematics of the SHA-256 transition (Ch, Maj, Sigma, sigma, round)
-- was correct. The failure was in the admissibility boundary around indexing:
-- the type system was bypassed via panic rather than carrying the array-safety
-- invariant through Fin n indices.
--
-- Predecessor hash (SHA-256): 5cd498bf5d8b0fc4c8144d4b0cabda6079f75c4d29309c4031f2602f1e4e7dcc
-- Corrected hash (SHA-256):  51e27902d594796f3450c9c896d16be8bff08b9f8dada47d66cf7572b7db069a
--
-- Defect class: Axiomatic escape hatch via partial function operator.
-- Repair: Replace Array with Vec α n, replace a[i]! with Vec.get ⟨i, proof⟩.

abbrev Word := UInt32

def rotr (x : Word) (n : Nat) : Word :=
  (x >>> n) ||| (x <<< (32 - n))

def Ch (x y z : Word) : Word := (x &&& y) ^^^ ((~~~x) &&& z)
def Maj (x y z : Word) : Word := (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)
def Sigma0 (x : Word) : Word := rotr x 2 ^^^ rotr x 13 ^^^ rotr x 22
def Sigma1 (x : Word) : Word := rotr x 6 ^^^ rotr x 11 ^^^ rotr x 25
def sigma0 (x : Word) : Word := rotr x 7 ^^^ rotr x 18 ^^^ (x >>> 3)
def sigma1 (x : Word) : Word := rotr x 17 ^^^ rotr x 19 ^^^ (x >>> 10)

-- DEFECT: These are raw Arrays, not fixed-size vectors.
def H : Array Word := #[
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]

-- DEFECT: These are raw Arrays, not fixed-size vectors.
def K : Array Word := #[
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

structure State where
  a : Word
  b : Word
  c : Word
  d : Word
  e : Word
  f : Word
  g : Word
  h : Word

-- DEFECT: initState uses H[i]! which panics if i >= H.size.
-- In this specific case the indices are 0..7 and H.size = 8,
-- so it happens to not panic at runtime, but the type system
-- does not enforce this — it is an accident, not a guarantee.
def initState : State := {
  a := H[0]!, b := H[1]!, c := H[2]!, d := H[3]!,
  e := H[4]!, f := H[5]!, g := H[6]!, h := H[7]!
}

def round (s : State) (k w : Word) : State :=
  let t1 := s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w
  let t2 := Sigma0 s.a + Maj s.a s.b s.c
  { a := t1 + t2, b := s.a, c := s.b, d := s.c,
    e := s.d + t1, f := s.e, g := s.f, h := s.g }

-- DEFECT: expandMessageFuel uses W[i - 2]!, W[i - 7]!, etc.
-- If the fuel parameter were miscomputed, these could panic.
def expandMessageFuel (block : Array Word) (fuel : Nat) (i : Nat) (W : Array Word) : Array Word :=
  match fuel with
  | 0 => W
  | fuel + 1 =>
    if i >= 64 then W
    else if i < 16 then expandMessageFuel block fuel (i + 1) W
    else
      let wi := sigma1 (W[i - 2]!) + W[i - 7]! + sigma0 (W[i - 15]!) + W[i - 16]!
      expandMessageFuel block fuel (i + 1) (W.set! i wi)

-- DEFECT: processBlock uses K[i]! and W[i]! inside rounds.
-- The bounds are maintained by the programmer's discipline, not the type system.
def processBlock (block : Array Word) (hash : Array Word) : Array Word :=
  let W := expandMessageFuel block 48 16 (Array.append block (Array.mkArray 48 0))
  let s0 : State := {
    a := hash[0]!, b := hash[1]!, c := hash[2]!, d := hash[3]!,
    e := hash[4]!, f := hash[5]!, g := hash[6]!, h := hash[7]!
  }
  let rec rounds (fuel : Nat) (i : Nat) (s : State) : State :=
    match fuel with
    | 0 => s
    | fuel + 1 =>
      if i >= 64 then s
      else rounds fuel (i + 1) (round s (K[i]!) (W[i]!))
  let s := rounds 64 0 s0
  #[hash[0]! + s.a, hash[1]! + s.b, hash[2]! + s.c, hash[3]! + s.d,
    hash[4]! + s.e, hash[5]! + s.f, hash[6]! + s.g, hash[7]! + s.h]

-- Theorems proven with rfl are honest about the definitions,
-- but the definitions rest on panic foundations.
theorem H_size_eq : H.size = 8 := by rfl
theorem K_size_eq : K.size = 64 := by rfl
