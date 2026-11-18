-- SHA256Core.lean
-- Version 2: Structural bounds via Vec (fixed-size vectors) and Fin indices.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.
-- No panic operators. No unsafe array access.
--
-- Defective predecessor: SHA256Core_defective.lean
-- Predecessor hash (SHA-256): 5cd498bf5d8b0fc4c8144d4b0cabda6079f75c4d29309c4031f2602f1e4e7dcc
-- Defect: Used Array indexing operator [!] which invokes panic! on out-of-bounds
-- access, introducing an axiomatic escape hatch contrary to the stated boundary.

abbrev Word := UInt32

-- Fixed-size vector with intrinsic size invariant.
structure Vec (α : Type) (n : Nat) where
  data : Array α
  size_eq : data.size = n

def Vec.get (v : Vec α n) (i : Fin n) : α :=
  v.data.get (i.cast v.size_eq.symm)

def Vec.size (_v : Vec α n) : Nat := n

-- SHA-256 initial hash values (H0..H7)
def H : Vec Word 8 := ⟨#[
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
], by decide⟩

-- SHA-256 round constants (K0..K63)
def K : Vec Word 64 := ⟨#[
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
], by decide⟩

-- Word operations
def rotr (x : Word) (n : Nat) : Word :=
  (x >>> n) ||| (x <<< (32 - n))

def Ch (x y z : Word) : Word := (x &&& y) ^^^ ((~~~x) &&& z)
def Maj (x y z : Word) : Word := (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)
def Sigma0 (x : Word) : Word := rotr x 2 ^^^ rotr x 13 ^^^ rotr x 22
def Sigma1 (x : Word) : Word := rotr x 6 ^^^ rotr x 11 ^^^ rotr x 25
def sigma0 (x : Word) : Word := rotr x 7 ^^^ rotr x 18 ^^^ (x >>> 3)
def sigma1 (x : Word) : Word := rotr x 17 ^^^ rotr x 19 ^^^ (x >>> 10)

-- State for round computation
structure State where
  a : Word
  b : Word
  c : Word
  d : Word
  e : Word
  f : Word
  g : Word
  h : Word

-- Block: exactly 16 words
structure Block where
  words : Vec Word 16

-- Digest state: exactly 8 words
structure DigestState where
  words : Vec Word 8

def initState : State := {
  a := H.get ⟨0, by decide⟩,
  b := H.get ⟨1, by decide⟩,
  c := H.get ⟨2, by decide⟩,
  d := H.get ⟨3, by decide⟩,
  e := H.get ⟨4, by decide⟩,
  f := H.get ⟨5, by decide⟩,
  g := H.get ⟨6, by decide⟩,
  h := H.get ⟨7, by decide⟩
}

def round (s : State) (k w : Word) : State :=
  let t1 := s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w
  let t2 := Sigma0 s.a + Maj s.a s.b s.c
  { a := t1 + t2, b := s.a, c := s.b, d := s.c,
    e := s.d + t1, f := s.e, g := s.f, h := s.g }

-- Message schedule expansion: 16 words → 64 words.
-- Fuel-based recursion with explicit size invariant i + fuel = 64.
def expandSchedule (block : Vec Word 16) : Vec Word 64 :=
  let rec go (fuel : Nat) (i : Nat) (acc : Array Word)
             (h : acc.size = i) (h2 : i ≤ 64) (h3 : i + fuel = 64) : Vec Word 64 :=
    match fuel with
    | 0 =>
      have hi : i = 64 := by rw [Nat.zero_add] at h3; exact h3
      ⟨acc, by rw [hi] at h; exact h⟩
    | fuel + 1 =>
      if hi : i < 16 then
        let w := block.get ⟨i, hi⟩
        go fuel (i + 1) (acc.push w)
          (by rw [Array.size_push, h])
          (by exact Nat.le_trans (Nat.succ_le_of_lt hi) (by decide))
          (by rw [Nat.add_right_comm i fuel 1] at h3; exact h3)
      else if hi2 : i < 64 then
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
        let wi := sigma1 w2 + w7 + sigma0 w15 + w16
        go fuel (i + 1) (acc.push wi)
          (by rw [Array.size_push, h])
          (by exact Nat.succ_le_of_lt hi2)
          (by rw [Nat.add_right_comm i fuel 1] at h3; exact h3)
      else
        have hi : i = 64 := Nat.le_antisymm h2 (Nat.le_of_not_lt hi2)
        ⟨acc, by rw [hi] at h; exact h⟩
  go 64 0 #[] (by rfl) (by decide) (by rfl)

-- Process a single 512-bit block.
def processBlock (block : Block) (hash : DigestState) : DigestState :=
  let W := expandSchedule block.words
  let rec rounds (fuel : Nat) (i : Nat) (s : State) : State :=
    match fuel with
    | 0 => s
    | fuel + 1 =>
      if hi : i < 64 then
        let k := K.get ⟨i, hi⟩
        let w := W.get ⟨i, hi⟩
        rounds fuel (i + 1) (round s k w)
      else
        s
  let s0 : State := {
    a := hash.words.get ⟨0, by decide⟩,
    b := hash.words.get ⟨1, by decide⟩,
    c := hash.words.get ⟨2, by decide⟩,
    d := hash.words.get ⟨3, by decide⟩,
    e := hash.words.get ⟨4, by decide⟩,
    f := hash.words.get ⟨5, by decide⟩,
    g := hash.words.get ⟨6, by decide⟩,
    h := hash.words.get ⟨7, by decide⟩
  }
  let s := rounds 64 0 s0
  DigestState.mk ⟨#[
    hash.words.get ⟨0, by decide⟩ + s.a,
    hash.words.get ⟨1, by decide⟩ + s.b,
    hash.words.get ⟨2, by decide⟩ + s.c,
    hash.words.get ⟨3, by decide⟩ + s.d,
    hash.words.get ⟨4, by decide⟩ + s.e,
    hash.words.get ⟨5, by decide⟩ + s.f,
    hash.words.get ⟨6, by decide⟩ + s.g,
    hash.words.get ⟨7, by decide⟩ + s.h
  ], by decide⟩

-- Theorems: zero admits, zero sorries, zero axioms, zero propext, zero classical.
-- Verify with: #print axioms <theorem_name>

theorem H_size_eq : H.size = 8 := by rfl

theorem K_size_eq : K.size = 64 := by rfl

theorem initState_a_eq : initState.a = H.get ⟨0, by decide⟩ := by rfl
theorem initState_b_eq : initState.b = H.get ⟨1, by decide⟩ := by rfl
theorem initState_c_eq : initState.c = H.get ⟨2, by decide⟩ := by rfl
theorem initState_d_eq : initState.d = H.get ⟨3, by decide⟩ := by rfl
theorem initState_e_eq : initState.e = H.get ⟨4, by decide⟩ := by rfl
theorem initState_f_eq : initState.f = H.get ⟨5, by decide⟩ := by rfl
theorem initState_g_eq : initState.g = H.get ⟨6, by decide⟩ := by rfl
theorem initState_h_eq : initState.h = H.get ⟨7, by decide⟩ := by rfl

theorem round_a_eq (s : State) (k w : Word) :
  (round s k w).a = (s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w) + (Sigma0 s.a + Maj s.a s.b s.c) := by
  rfl

theorem round_b_eq (s : State) (k w : Word) :
  (round s k w).b = s.a := by rfl

theorem round_c_eq (s : State) (k w : Word) :
  (round s k w).c = s.b := by rfl

theorem round_d_eq (s : State) (k w : Word) :
  (round s k w).d = s.c := by rfl

theorem round_e_eq (s : State) (k w : Word) :
  (round s k w).e = s.d + (s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w) := by
  rfl

theorem round_f_eq (s : State) (k w : Word) :
  (round s k w).f = s.e := by rfl

theorem round_g_eq (s : State) (k w : Word) :
  (round s k w).g = s.f := by rfl

theorem round_h_eq (s : State) (k w : Word) :
  (round s k w).h = s.g := by rfl

-- Structural theorems on fixed-size boundaries.

theorem expandSchedule_size (block : Vec Word 16) : (expandSchedule block).size = 64 := by
  unfold expandSchedule Vec.size
  rfl

theorem processBlock_size (block : Block) (hash : DigestState) :
  (processBlock block hash).words.size = 8 := by
  unfold processBlock Vec.size
  rfl
