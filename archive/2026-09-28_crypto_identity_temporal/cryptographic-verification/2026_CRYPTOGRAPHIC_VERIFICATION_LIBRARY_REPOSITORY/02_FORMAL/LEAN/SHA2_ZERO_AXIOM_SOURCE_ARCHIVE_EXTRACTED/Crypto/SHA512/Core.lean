
-- Crypto/SHA512/Core.lean
-- SHA-512 core using the same zero-axiom architectural pattern as SHA-256.
-- Word size is 64 bits, 80 rounds, 80 constants, 1024-bit blocks.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.Vec

abbrev Word512 := UInt64

def rotr512 (x : Word512) (n : Nat) : Word512 :=
  (x >>> n) ||| (x <<< (64 - n))

def Ch512 (x y z : Word512) : Word512 := (x &&& y) ^^^ ((~~~x) &&& z)
def Maj512 (x y z : Word512) : Word512 := (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)
def Sigma0_512 (x : Word512) : Word512 := rotr512 x 28 ^^^ rotr512 x 34 ^^^ rotr512 x 39
def Sigma1_512 (x : Word512) : Word512 := rotr512 x 14 ^^^ rotr512 x 18 ^^^ rotr512 x 41
def sigma0_512 (x : Word512) : Word512 := rotr512 x 1 ^^^ rotr512 x 8 ^^^ (x >>> 7)
def sigma1_512 (x : Word512) : Word512 := rotr512 x 19 ^^^ rotr512 x 61 ^^^ (x >>> 6)

-- Initial hash values H0..H7 (first 64 bits of fractional parts of square roots of first 8 primes)
def H512 : Vec Word512 8 := ⟨#[
  0x6a09e667f3bcc908, 0xbb67ae8584caa73b, 0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
  0x510e527fade682d1, 0x9b05688c2b3e6c1f, 0x1f83d9abfb41bd6b, 0x5be0cd19137e2179
], by decide⟩

-- Round constants K0..K79 (first 64 bits of fractional parts of cube roots of first 80 primes)
def K512 : Vec Word512 80 := ⟨#[
  0x428a2f98d728ae22, 0x7137449123ef65cd, 0xb5c0fbcfec4d3b2f, 0xe9b5dba58189dbbc,
  0x3956c25bf348b538, 0x59f111f1b605d019, 0x923f82a4af194f9b, 0xab1c5ed5da6d8118,
  0xd807aa98a3030242, 0x12835b0145706fbe, 0x243185be4ee4b28c, 0x550c7dc3d5ffb4e2,
  0x72be5d74f27b896f, 0x80deb1fe3b1696b1, 0x9bdc06a725c71235, 0xc19bf174cf692694,
  0xe49b69c19ef14ad2, 0xefbe4786384f25e3, 0x0fc19dc68b8cd5b5, 0x240ca1cc77ac9c65,
  0x2de92c6f592b0275, 0x4a7484aa6ea6e483, 0x5cb0a9dcbd41fbd4, 0x76f988da831153b5,
  0x983e5152ee66dfab, 0xa831c66d2db43210, 0xb00327c898fb213f, 0xbf597fc7beef0ee4,
  0xc6e00bf33da88fc2, 0xd5a79147930aa725, 0x06ca6351e003826f, 0x142929670a0e6e70,
  0x27b70a8546d22ffc, 0x2e1b21385c26c926, 0x4d2c6dfc5ac42aed, 0x53380d139d95b3df,
  0x650a73548baf63de, 0x766a0abb3c77b2a8, 0x81c2c92e47edaee6, 0x92722c851482353b,
  0xa2bfe8a14cf10364, 0xa81a664bbc423001, 0xc24b8b70d0f89791, 0xc76c51a30654be30,
  0xd192e819d6ef5218, 0xd69906245565a910, 0xf40e35855771202a, 0x106aa07032bbd1b8,
  0x19a4c116b8d2d0c8, 0x1e376c085141ab53, 0x2748774cdf8eeb99, 0x34b0bcb5e19b48a8,
  0x391c0cb3c5c95a63, 0x4ed8aa4ae3418acb, 0x5b9cca4f7763e373, 0x682e6ff3d6b2b8a3,
  0x748f82ee5defb2fc, 0x78a5636f43172f60, 0x84c87814a1f0ab72, 0x8cc702081a6439ec,
  0x90befffa23631e28, 0xa4506cebde82bde9, 0xbef9a3f7b2c67915, 0xc67178f2e372532b,
  0xca273eceea26619c, 0xd186b8c721c0c207, 0xeada7dd6cde0eb1e, 0xf57d4f7fee6ed178,
  0x06f067aa72176fba, 0x0a637dc5a2c898a6, 0x113f9804bef90dae, 0x1b710b35131c471b,
  0x28db77f523047d84, 0x32caab7b40c72493, 0x3c9ebe0a15c9bebc, 0x431d67c49c100d4c,
  0x4cc5d4becb3e42b6, 0x597f299cfc657e2a, 0x5fcb6fab3ad6faec, 0x6c44198c4a475817
], by decide⟩

structure State512 where
  a : Word512
  b : Word512
  c : Word512
  d : Word512
  e : Word512
  f : Word512
  g : Word512
  h : Word512

structure Block512 where
  words : Vec Word512 16

structure Digest512 where
  words : Vec Word512 8

def initState512 : State512 := {
  a := H512.get ⟨0, by decide⟩,
  b := H512.get ⟨1, by decide⟩,
  c := H512.get ⟨2, by decide⟩,
  d := H512.get ⟨3, by decide⟩,
  e := H512.get ⟨4, by decide⟩,
  f := H512.get ⟨5, by decide⟩,
  g := H512.get ⟨6, by decide⟩,
  h := H512.get ⟨7, by decide⟩
}

def round512 (s : State512) (k w : Word512) : State512 :=
  let t1 := s.h + Sigma1_512 s.e + Ch512 s.e s.f s.g + k + w
  let t2 := Sigma0_512 s.a + Maj512 s.a s.b s.c
  { a := t1 + t2, b := s.a, c := s.b, d := s.c,
    e := s.d + t1, f := s.e, g := s.f, h := s.g }

-- Expand 16-word block into 80-word schedule.
def expandSchedule512 (block : Vec Word512 16) : Vec Word512 80 :=
  let rec go (fuel : Nat) (i : Nat) (acc : Array Word512)
             (h : acc.size = i) (h2 : i ≤ 80) (h3 : i + fuel = 80) : Vec Word512 80 :=
    match fuel with
    | 0 =>
      have hi : i = 80 := by rw [Nat.zero_add] at h3; exact h3
      ⟨acc, by rw [hi] at h; exact h⟩
    | fuel + 1 =>
      if hi : i < 16 then
        let w := block.get ⟨i, hi⟩
        go fuel (i + 1) (acc.push w)
          (by rw [Array.size_push, h])
          (by exact Nat.le_trans (Nat.succ_le_of_lt hi) (by decide))
          (by rw [Nat.add_right_comm i fuel 1] at h3; exact h3)
      else if hi2 : i < 80 then
        have h16 : i ≥ 16 := Nat.le_of_not_lt hi
        have h1 : i - 2 < acc.size := by
          rw [h]
          exact Nat.sub_lt i 2 (by decide) (Nat.le_trans (by decide) h16)
        have h2_7 : i - 7 < acc.size := by
          rw [h]
          exact Nat.sub_lt i 7 (by decide) (Nat.le_trans (by decide) h16)
        have h3_15 : i - 15 < acc.size := by
          rw [h]
          exact Nat.sub_lt i 15 (by decide) (Nat.le_trans (by decide) h16)
        have h4_16 : i - 16 < acc.size := by
          rw [h]
          exact Nat.sub_lt i 16 (by decide) (Nat.le_trans (by decide) h16)
        let w2 := acc.get ⟨i - 2, h1⟩
        let w7 := acc.get ⟨i - 7, h2_7⟩
        let w15 := acc.get ⟨i - 15, h3_15⟩
        let w16 := acc.get ⟨i - 16, h4_16⟩
        let wi := sigma1_512 w2 + w7 + sigma0_512 w15 + w16
        go fuel (i + 1) (acc.push wi)
          (by rw [Array.size_push, h])
          (by exact Nat.succ_le_of_lt hi2)
          (by rw [Nat.add_right_comm i fuel 1] at h3; exact h3)
      else
        have hi : i = 80 := Nat.le_antisymm h2 (Nat.le_of_not_lt hi2)
        ⟨acc, by rw [hi] at h; exact h⟩
  go 80 0 #[] (by rfl) (by decide) (by rfl)

def processBlock512 (block : Block512) (hash : Digest512) : Digest512 :=
  let W := expandSchedule512 block.words
  let rec rounds (fuel : Nat) (i : Nat) (s : State512) : State512 :=
    match fuel with
    | 0 => s
    | fuel + 1 =>
      if hi : i < 80 then
        let k := K512.get ⟨i, hi⟩
        let w := W.get ⟨i, hi⟩
        rounds fuel (i + 1) (round512 s k w)
      else
        s
  let s0 : State512 := {
    a := hash.words.get ⟨0, by decide⟩,
    b := hash.words.get ⟨1, by decide⟩,
    c := hash.words.get ⟨2, by decide⟩,
    d := hash.words.get ⟨3, by decide⟩,
    e := hash.words.get ⟨4, by decide⟩,
    f := hash.words.get ⟨5, by decide⟩,
    g := hash.words.get ⟨6, by decide⟩,
    h := hash.words.get ⟨7, by decide⟩
  }
  let s := rounds 80 0 s0
  Digest512.mk ⟨#[
    hash.words.get ⟨0, by decide⟩ + s.a,
    hash.words.get ⟨1, by decide⟩ + s.b,
    hash.words.get ⟨2, by decide⟩ + s.c,
    hash.words.get ⟨3, by decide⟩ + s.d,
    hash.words.get ⟨4, by decide⟩ + s.e,
    hash.words.get ⟨5, by decide⟩ + s.f,
    hash.words.get ⟨6, by decide⟩ + s.g,
    hash.words.get ⟨7, by decide⟩ + s.h
  ], by decide⟩

-- Structural theorems
theorem H512_size_eq : H512.size = 8 := by rfl
theorem K512_size_eq : K512.size = 80 := by rfl
theorem expandSchedule512_size (block : Vec Word512 16) : (expandSchedule512 block).size = 80 := by
  unfold expandSchedule512 Vec.size
  rfl
theorem processBlock512_size (block : Block512) (hash : Digest512) :
  (processBlock512 block hash).words.size = 8 := by
  unfold processBlock512 Vec.size
  rfl
