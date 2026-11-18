import Std.Tactic

/-!
# Executable byte-oriented SHA-256

Reference: NIST FIPS 180-4, sections 4.1.2, 4.2.2, 5.1.1, 5.2.1,
5.3.3 and 6.2. All arithmetic is explicit natural-number arithmetic modulo
2^32. Inputs/outputs are lists of natural-number octets, never byte arrays.
For FIPS-conforming inputs require `ValidMessage`: each entry < 256 and
bit length < 2^64. Outside that domain `sha256` is still a total function,
normalizing entries modulo 256 and encoding length modulo 2^64.
This file makes no cryptographic-security claim.
-/
namespace ActualSHA256

abbrev Bytes := List Nat
abbrev Word := Nat

def modulus : Nat := 4294967296

def word (x : Nat) : Word := x % modulus

def octet (x : Nat) : Nat := x % 256

def ValidMessage (m : Bytes) : Prop :=
  (∀ b ∈ m, b < 256) ∧ m.length * 8 < 18446744073709551616

/-- Right rotation on 32-bit words. All algorithm uses have 0 < n < 32. -/
def rotr (x n : Nat) : Word :=
  (x / 2^n + (x % 2^n) * 2^(32-n)) % modulus

def ch (x y z : Word) : Word :=
  (x &&& y) ^^^ ((4294967295 - x) &&& z)
def maj (x y z : Word) : Word :=
  (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)
def bigSigma0 (x : Word) : Word := rotr x 2 ^^^ rotr x 13 ^^^ rotr x 22
def bigSigma1 (x : Word) : Word := rotr x 6 ^^^ rotr x 11 ^^^ rotr x 25
def smallSigma0 (x : Word) : Word := rotr x 7 ^^^ rotr x 18 ^^^ (x / 8)
def smallSigma1 (x : Word) : Word := rotr x 17 ^^^ rotr x 19 ^^^ (x / 1024)

/-- FIPS 180-4 section 4.2.2, in increasing round order. -/
def roundConstants : List Word := [
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
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]

structure State where
  a : Word
  b : Word
  c : Word
  d : Word
  e : Word
  f : Word
  g : Word
  h : Word
  deriving DecidableEq, Repr

def initial : State :=
  ⟨0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
   0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19⟩

/-- One SHA-256 working-variable transition, including both modulo additions. -/
def round (s : State) (k w : Word) : State :=
  let t1 := word (s.h + bigSigma1 s.e + ch s.e s.f s.g + k + w)
  let t2 := word (bigSigma0 s.a + maj s.a s.b s.c)
  ⟨word (t1 + t2), s.a, s.b, s.c, word (s.d + t1), s.e, s.f, s.g⟩

/-- Read four octets, most significant first. -/
def readWord (bs : Bytes) : Word :=
  octet (bs.getD 0 0) * 16777216 + octet (bs.getD 1 0) * 65536 +
  octet (bs.getD 2 0) * 256 + octet (bs.getD 3 0)

def firstWords (block : Bytes) : List Word :=
  (List.range 16).map (fun i => readWord (block.drop (4*i)))

/-- Append schedule words W_16 through W_63 according to FIPS 6.2.2. -/
def expand : Nat → List Word → List Word
  | 0, ws => ws
  | n+1, ws =>
    let t := ws.length
    let w := word (smallSigma1 (ws.getD (t-2) 0) + ws.getD (t-7) 0 +
      smallSigma0 (ws.getD (t-15) 0) + ws.getD (t-16) 0)
    expand n (ws ++ [w])

def schedule (block : Bytes) : List Word := expand 48 (firstWords block)

/-- Sequentially consume the constants and schedule; SHA-256 supplies 64 of each. -/
def rounds : List Word → List Word → State → State
  | k :: ks, w :: ws, s => rounds ks ws (round s k w)
  | _, _, s => s

def feedForward (s t : State) : State :=
  ⟨word (s.a+t.a), word (s.b+t.b), word (s.c+t.c), word (s.d+t.d),
   word (s.e+t.e), word (s.f+t.f), word (s.g+t.g), word (s.h+t.h)⟩

def compress (s : State) (block : Bytes) : State :=
  feedForward s (rounds roundConstants (schedule block) s)

/-- Big-endian 64-bit length suffix, with explicit modulo-256 octets. -/
def lengthBytes (n : Nat) : Bytes :=
  [octet (n / 2^56), octet (n / 2^48), octet (n / 2^40), octet (n / 2^32),
   octet (n / 2^24), octet (n / 2^16), octet (n / 2^8), octet n]

/-- Number of zero octets following the mandatory 0x80 octet. -/
def zeroCount (n : Nat) : Nat := (64 - ((n+9) % 64)) % 64

def pad (m : Bytes) : Bytes :=
  m.map octet ++ [128] ++ List.replicate (zeroCount m.length) 0 ++
  lengthBytes (m.length * 8)

/-- Split all data into 64-octet blocks; the fuel is the exact ceiling length. -/
def blocksAux : Nat → Bytes → List Bytes
  | 0, _ => []
  | n+1, bs => if bs.isEmpty then [] else bs.take 64 :: blocksAux n (bs.drop 64)

def blocks (bs : Bytes) : List Bytes := blocksAux ((bs.length+63)/64) bs

def wordBytes (w : Word) : Bytes :=
  [octet (w / 16777216), octet (w / 65536), octet (w / 256), octet w]

def digestBytes (s : State) : Bytes :=
  wordBytes s.a ++ wordBytes s.b ++ wordBytes s.c ++ wordBytes s.d ++
  wordBytes s.e ++ wordBytes s.f ++ wordBytes s.g ++ wordBytes s.h

/-- Full SHA-256: pad, parse blocks, compress every block, serialize all 32 digest octets. -/
def sha256 (m : Bytes) : Bytes :=
  digestBytes ((blocks (pad m)).foldl compress initial)

set_option maxRecDepth 100000
set_option maxHeartbeats 20000000

/-- Kernel-computed SHA-256 known answer for the empty octet string. -/
theorem empty_vector : sha256 [] = [
  0xe3,0xb0,0xc4,0x42,0x98,0xfc,0x1c,0x14,0x9a,0xfb,0xf4,0xc8,0x99,0x6f,0xb9,0x24,
  0x27,0xae,0x41,0xe4,0x64,0x9b,0x93,0x4c,0xa4,0x95,0x99,0x1b,0x78,0x52,0xb8,0x55] := by decide

/-- Kernel-computed SHA-256 known answer for ASCII abc. -/
theorem abc_vector : sha256 [97,98,99] = [
  0xba,0x78,0x16,0xbf,0x8f,0x01,0xcf,0xea,0x41,0x41,0x40,0xde,0x5d,0xae,0x22,0x23,
  0xb0,0x03,0x61,0xa3,0x96,0x17,0x7a,0x9c,0xb4,0x10,0xff,0x61,0xf2,0x00,0x15,0xad] := by decide

end ActualSHA256
