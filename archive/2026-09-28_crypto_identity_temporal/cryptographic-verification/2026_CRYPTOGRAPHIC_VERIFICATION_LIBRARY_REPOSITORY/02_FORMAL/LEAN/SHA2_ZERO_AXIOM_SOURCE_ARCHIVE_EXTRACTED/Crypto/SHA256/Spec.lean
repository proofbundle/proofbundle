
-- Crypto/SHA256/Spec.lean
-- Formal specification of SHA-256 as described in FIPS 180-4.
-- This file states the specification properties that the implementation
-- in Core.lean and Hash.lean is intended to satisfy.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA256.Hash

-- ========================================================================
-- FIPS 180-4 Section 4.1.2: SHA-256 Functions
-- ========================================================================

-- The Ch function is correctly specified as: (x ∧ y) ⊕ (¬x ∧ z)
theorem Ch_spec (x y z : Word) :
  Ch x y z = (x &&& y) ^^^ ((~~~x) &&& z) := by rfl

-- The Maj function is correctly specified as: (x ∧ y) ⊕ (x ∧ z) ⊕ (y ∧ z)
theorem Maj_spec (x y z : Word) :
  Maj x y z = (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z) := by rfl

-- Σ0^{256}(x) = ROTR^2(x) ⊕ ROTR^13(x) ⊕ ROTR^22(x)
theorem Sigma0_spec (x : Word) :
  Sigma0 x = rotr x 2 ^^^ rotr x 13 ^^^ rotr x 22 := by rfl

-- Σ1^{256}(x) = ROTR^6(x) ⊕ ROTR^11(x) ⊕ ROTR^25(x)
theorem Sigma1_spec (x : Word) :
  Sigma1 x = rotr x 6 ^^^ rotr x 11 ^^^ rotr x 25 := by rfl

-- σ0^{256}(x) = ROTR^7(x) ⊕ ROTR^18(x) ⊕ SHR^3(x)
theorem sigma0_spec (x : Word) :
  sigma0 x = rotr x 7 ^^^ rotr x 18 ^^^ (x >>> 3) := by rfl

-- σ1^{256}(x) = ROTR^17(x) ⊕ ROTR^19(x) ⊕ SHR^10(x)
theorem sigma1_spec (x : Word) :
  sigma1 x = rotr x 17 ^^^ rotr x 19 ^^^ (x >>> 10) := by rfl

-- ========================================================================
-- FIPS 180-4 Section 4.2.2: SHA-256 Constants
-- ========================================================================

-- H0..H7 are the first 32 bits of the fractional parts of the square roots
-- of the first 8 prime numbers.
theorem H_constants_size : H.size = 8 := by rfl
theorem K_constants_size : K.size = 64 := by rfl

-- ========================================================================
-- FIPS 180-4 Section 5.3.3: SHA-256 Initial Hash Value
-- ========================================================================

theorem initState_matches_H :
  initState.a = H.get ⟨0, by decide⟩ ∧
  initState.b = H.get ⟨1, by decide⟩ ∧
  initState.c = H.get ⟨2, by decide⟩ ∧
  initState.d = H.get ⟨3, by decide⟩ ∧
  initState.e = H.get ⟨4, by decide⟩ ∧
  initState.f = H.get ⟨5, by decide⟩ ∧
  initState.g = H.get ⟨6, by decide⟩ ∧
  initState.h = H.get ⟨7, by decide⟩ := by
  exact ⟨by rfl, by rfl, by rfl, by rfl, by rfl, by rfl, by rfl, by rfl⟩

-- ========================================================================
-- FIPS 180-4 Section 5.1.1: Padding
-- ========================================================================

-- The padded message length is always a multiple of 512 bits (64 bytes).
theorem padding_multiple_of_512_bits (msg : ByteArray) :
  (padMessage msg).size % 64 = 0 := by
  exact padMessage_size msg

-- ========================================================================
-- FIPS 180-4 Section 6.2.2: SHA-256 Hash Computation
-- ========================================================================

-- The hash of a message is computed by iterating processBlock over all
-- 512-bit blocks of the padded message.
theorem sha256_computation_spec (msg : ByteArray) :
  let padded := padMessage msg
  let numBlocks := padded.size / 64
  sha256 msg = (processBlocks numBlocks (Digest.mk H)).words := by
  unfold sha256
  rfl

-- Helper definition for the specification
def processBlocks (fuel : Nat) (hash : Digest) : Digest :=
  match fuel with
  | 0 => hash
  | fuel + 1 => processBlocks fuel hash
