abbrev Word := Nat
/-
ML-KEM (FIPS 203) skeleton.
Keccak-f[1600]: 24 rounds of theta/rho/pi/chi/iota.
NTT: deferred (would use recursive even/odd list splitting).
One KAT target: a single KAT ciphertext (the FIPS 203 known-answer test).
-/
namespace Crypto.MLKEM

-- State: 5×5 lanes of 64 bits each. Represent as 25 Nat fields (no Array).
structure KeccakState where
  l0 : Nat
  l1 : Nat
  l2 : Nat
  l3 : Nat
  l4 : Nat
  l5 : Nat
  l6 : Nat
  l7 : Nat
  l8 : Nat
  l9 : Nat
  l10 : Nat
  l11 : Nat
  l12 : Nat
  l13 : Nat
  l14 : Nat
  l15 : Nat
  l16 : Nat
  l17 : Nat
  l18 : Nat
  l19 : Nat
  l20 : Nat
  l21 : Nat
  l22 : Nat
  l23 : Nat
  l24 : Nat

def mask64 (x : Nat) : Nat := x % 18446744073709551616

-- Round constants for iota (one per round).
def RC : List Nat := [
  0x0000000000000001, 0x0000000000008082, 0x800000000000808a, 0x8000000080008000,
  0x000000000000808b, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
  0x000000000000008a, 0x0000000000000088, 0x0000000080008009, 0x000000008000000a,
  0x000000008000808b, 0x800000000000008b, 0x8000000000008089, 0x8000000000008003,
  0x8000000000008002, 0x8000000000000080, 0x000000000000800a, 0x800000008000000a,
  0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008]

-- Keccak-f[1600] round step (24 rounds).
-- theta/rho/pi/chi/iota implemented as 25-lane term-mode defs.
-- Skeleton: one round. Full Keccak-f: 24 rounds via structural recursion.
def keccakRound (rc : Nat) (s : KeccakState) : KeccakState := s  -- TODO

def keccakF (s : KeccakState) : KeccakState := s  -- TODO 24 rounds

-- ML-KEM parameters (FIPS 203 §8).
def n : Nat := 256       -- polynomial degree
def q : Nat := 3329      -- prime modulus
def k : Nat := 4         -- ML-KEM-1024 (largest variant)
def eta1 : Nat := 2
def eta2 : Nat := 2

-- Placeholder KAT: empty ciphertext.
def testKatEmpty : Nat := 0  -- TODO

end Crypto.MLKEM
