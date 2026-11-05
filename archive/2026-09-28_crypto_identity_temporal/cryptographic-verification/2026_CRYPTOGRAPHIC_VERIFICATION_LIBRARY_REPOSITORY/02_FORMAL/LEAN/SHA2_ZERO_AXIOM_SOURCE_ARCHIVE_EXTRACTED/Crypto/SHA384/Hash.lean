
-- Crypto/SHA384/Hash.lean
-- SHA-384 full hash. Reuses SHA-512 padding and block processing;
-- differs in initial values and final truncation.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA384.Core

-- SHA-384 uses the same padding and block size as SHA-512.
def sha384 (msg : ByteArray) : Vec Word512 6 :=
  let padded := padMessage512 msg
  have h_size : padded.size % 128 = 0 := padMessage512_size msg
  let numBlocks := padded.size / 128
  have h_eq : padded.size = numBlocks * 128 := by
    rw [Nat.div_mul_cancel]
    exact h_size
  let rec process (fuel : Nat) (i : Nat) (hash : Digest512) : Digest512 :=
    match fuel with
    | 0 => hash
    | fuel + 1 =>
      if hi : i < numBlocks then
        let start := i * 128
        have h_bound : start + 127 < padded.size := by
          rw [h_eq]
          have h1 : i + 1 ≤ numBlocks := Nat.succ_le_of_lt hi
          have h2 : (i + 1) * 128 ≤ numBlocks * 128 := Nat.mul_le_mul_right 128 h1
          have h3 : i * 128 + 128 = (i + 1) * 128 := by rw [Nat.succ_mul]
          have h4 : i * 128 + 127 < i * 128 + 128 := by
            exact Nat.lt_add_of_pos_right (by decide)
          have h5 : i * 128 + 127 < numBlocks * 128 := Nat.lt_of_lt_of_le h4 (by rw [←h3]; exact h2)
          exact h5
        let block := Block512.mk (extractBlock512 padded start h_bound)
        process fuel (i + 1) (processBlock512 block hash)
      else hash
  let fullDigest := process numBlocks 0 (Digest512.mk H384)
  (truncate384 fullDigest).words

def sha384String (s : String) : Vec Word512 6 :=
  sha384 s.toUTF8

theorem sha384_size (msg : ByteArray) : (sha384 msg).size = 6 := by
  unfold sha384 Vec.size
  rfl
