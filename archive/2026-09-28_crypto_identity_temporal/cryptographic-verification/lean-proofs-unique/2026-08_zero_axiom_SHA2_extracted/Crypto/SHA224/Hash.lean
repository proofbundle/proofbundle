-- Crypto/SHA224/Hash.lean
-- SHA-224 full hash. Reuses SHA-256 padding and block processing;
-- differs in initial values and final truncation.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA224.Core

-- SHA-224 uses the same padding and block size as SHA-256.
def sha224 (msg : ByteArray) : Vec Word 7 :=
  let padded := padMessage msg
  have h_size : padded.size % 64 = 0 := padMessage_size msg
  let numBlocks := padded.size / 64
  have h_eq : padded.size = numBlocks * 64 := by
    rw [Nat.div_mul_cancel]
    exact h_size
  let rec process (fuel : Nat) (i : Nat) (hash : Digest) : Digest :=
    match fuel with
    | 0 => hash
    | fuel + 1 =>
      if hi : i < numBlocks then
        let start := i * 64
        have h_bound : start + 63 < padded.size := by
          rw [h_eq]
          have h1 : i + 1 ≤ numBlocks := Nat.succ_le_of_lt hi
          have h2 : (i + 1) * 64 ≤ numBlocks * 64 := Nat.mul_le_mul_right 64 h1
          have h3 : i * 64 + 64 = (i + 1) * 64 := by rw [Nat.succ_mul]
          have h4 : i * 64 + 63 < i * 64 + 64 := by
            exact Nat.lt_add_of_pos_right (by decide)
          have h5 : i * 64 + 63 < numBlocks * 64 := Nat.lt_of_lt_of_le h4 (by rw [←h3]; exact h2)
          exact h5
        let block := Block.mk (extractBlock padded start h_bound)
        process fuel (i + 1) (processBlock block hash)
      else hash
  let fullDigest := process numBlocks 0 (Digest.mk H224)
  (truncate224 fullDigest).words

def sha224String (s : String) : Vec Word 7 :=
  sha224 s.toUTF8

theorem sha224_size (msg : ByteArray) : (sha224 msg).size = 7 := by
  unfold sha224 Vec.size
  rfl
