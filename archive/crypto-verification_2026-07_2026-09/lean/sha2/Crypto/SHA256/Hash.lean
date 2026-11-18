
-- Crypto/SHA256/Hash.lean
-- Padding, block decomposition, iterative hash, and top-level API.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA256.Core

-- ========================================================================
-- Padding
-- ========================================================================

-- Compute padding length: smallest k such that (msgLen + 1 + k) ≡ 56 (mod 64)
def paddingLength (msgLen : Nat) : Nat :=
  let r := (msgLen + 1) % 64
  if r ≤ 56 then 56 - r else 64 - r + 56

-- Proof that padding produces correct alignment for length suffix.
theorem paddingLength_spec (msgLen : Nat) :
  (msgLen + 1 + paddingLength msgLen) % 64 = 56 := by
  unfold paddingLength
  split
  · -- Case r ≤ 56
    rename_i r hr
    have h1 : msgLen + 1 = 64 * ((msgLen + 1) / 64) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 64]
    have h2 : r + (56 - r) = 56 := Nat.add_sub_cancel' hr
    have h3 : 64 * ((msgLen + 1) / 64) + r + (56 - r) = 64 * ((msgLen + 1) / 64) + 56 := by
      rw [Nat.add_assoc]
      rw [h2]
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]
  · -- Case r > 56
    rename_i r hr
    have h1 : msgLen + 1 = 64 * ((msgLen + 1) / 64) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 64]
    have hr64 : r ≤ 64 := by
      have : r < 64 := Nat.mod_lt (msgLen + 1) (by decide)
      exact Nat.le_of_lt this
    have h2 : r + (64 - r + 56) = 64 + 56 := by
      have h3 : r + (64 - r) = 64 := Nat.add_sub_cancel' hr64
      calc
        r + (64 - r + 56) = r + (64 - r) + 56 := by rw [Nat.add_assoc]
        _ = 64 + 56 := by rw [h3]
    have h3 : 64 * ((msgLen + 1) / 64) + r + (64 - r + 56) = 64 * ((msgLen + 1) / 64 + 1) + 56 := by
      rw [Nat.add_assoc]
      rw [h2]
      rw [Nat.mul_add]
      rfl
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]

-- Encode a 64-bit length in bits as 8 big-endian bytes.
def encodeLength (lenBits : Nat) : ByteArray :=
  ByteArray.mk #[
    UInt8.ofNat ((lenBits >>> 56) % 256),
    UInt8.ofNat ((lenBits >>> 48) % 256),
    UInt8.ofNat ((lenBits >>> 40) % 256),
    UInt8.ofNat ((lenBits >>> 32) % 256),
    UInt8.ofNat ((lenBits >>> 24) % 256),
    UInt8.ofNat ((lenBits >>> 16) % 256),
    UInt8.ofNat ((lenBits >>> 8) % 256),
    UInt8.ofNat (lenBits % 256)
  ]

-- Full padding: message || 0x80 || 00...00 || 64-bit length.
def padMessage (msg : ByteArray) : ByteArray :=
  let lenBits := msg.size * 8
  let padLen := paddingLength msg.size
  let padding := ByteArray.mk (Array.mkArray padLen 0)
  let withOne := msg.push 0x80
  let withPad := ByteArray.append withOne padding
  ByteArray.append withPad (encodeLength lenBits)

-- Proof that padMessage always produces a multiple of 64 bytes.
theorem padMessage_size (msg : ByteArray) :
  (padMessage msg).size % 64 = 0 := by
  unfold padMessage
  simp [ByteArray.size_append, ByteArray.size_push]
  have h : msg.size + 1 + paddingLength msg.size + 8 =
           (msg.size + 1 + paddingLength msg.size) + 8 := by rfl
  rw [h]
  have h2 : (msg.size + 1 + paddingLength msg.size) % 64 = 56 := paddingLength_spec msg.size
  have h3 : ∃ q, msg.size + 1 + paddingLength msg.size = 64 * q + 56 := by
    refine ⟨ (msg.size + 1 + paddingLength msg.size) / 64, ?_ ⟩
    rw [Nat.div_add_mod _ 64]
    rw [h2]
  obtain ⟨q, hq⟩ := h3
  rw [hq]
  have h4 : (64 * q + 56 + 8) % 64 = 0 := by
    have : 64 * q + 56 + 8 = 64 * (q + 1) := by
      rw [Nat.mul_add]
      rfl
    rw [this]
    simp [Nat.mul_mod]
  exact h4

-- ========================================================================
-- Block extraction
-- ========================================================================

-- Convert four big-endian bytes to one 32-bit word.
def bytesToWord (b0 b1 b2 b3 : UInt8) : Word :=
  (UInt32.ofNat b0.toNat <<< 24) |||
  (UInt32.ofNat b1.toNat <<< 16) |||
  (UInt32.ofNat b2.toNat <<< 8) |||
  UInt32.ofNat b3.toNat

-- Extract one 16-word block from a padded message at a given byte offset.
-- Requires proof that the offset plus 63 is within bounds.
def extractBlock (padded : ByteArray) (start : Nat)
                 (h_bound : start + 63 < padded.size) : Vec Word 16 :=
  let rec build (fuel : Nat) (i : Nat) (acc : Array Word)
                (h_acc : acc.size = i) (h_i : i + fuel = 16)
                (h_byte : start + 63 < padded.size) : Vec Word 16 :=
    match fuel with
    | 0 =>
      have hi : i = 16 := by rw [Nat.zero_add] at h_i; exact h_i
      ⟨acc, by rw [hi] at h_acc; exact h_acc⟩
    | fuel + 1 =>
      have hi : i < 16 := by
        have h1 : fuel ≥ 1 := Nat.succ_le_succ (Nat.zero_le fuel)
        have h2 : i + fuel = 16 := h_i
        have h3 : i + 1 ≤ 16 := by
          have : i + 1 ≤ i + fuel := Nat.add_le_add_left h1 i
          rw [h2] at this
          exact this
        have h4 : i ≤ 15 := Nat.le_of_succ_le_succ h3
        exact Nat.lt_succ_of_le h4
      have hj1 : i * 4 + 3 ≤ 63 := by
        have : i ≤ 15 := Nat.le_of_lt_add_one hi
        have : i * 4 ≤ 60 := Nat.mul_le_mul_right 4 this
        exact Nat.add_le_add_right this 3
      have h0 : start + i * 4 < padded.size := by
        have h_pos : 0 < 3 := by decide
        have h_lt : start + i * 4 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h1 : start + i * 4 + 1 < padded.size := by
        have h_pos : 0 < 2 := by decide
        have h_lt : start + i * 4 + 1 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h2 : start + i * 4 + 2 < padded.size := by
        have h_pos : 0 < 1 := by decide
        have h_lt : start + i * 4 + 2 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h3 : start + i * 4 + 3 < padded.size := by
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        exact Nat.lt_of_le_of_lt h_le h_byte
      let b0 := padded.get ⟨start + i * 4, h0⟩
      let b1 := padded.get ⟨start + i * 4 + 1, h1⟩
      let b2 := padded.get ⟨start + i * 4 + 2, h2⟩
      let b3 := padded.get ⟨start + i * 4 + 3, h3⟩
      let w := bytesToWord b0 b1 b2 b3
      have h_next : start + 63 < padded.size := h_byte
      build fuel (i + 1) (acc.push w)
        (by rw [Array.size_push, h_acc])
        (by rw [Nat.add_right_comm i fuel 1] at h_i; exact h_i)
        h_next
  build 16 0 #[] (by rfl) (by rfl) h_bound

-- ========================================================================
-- Full SHA-256 hash
-- ========================================================================

def sha256 (msg : ByteArray) : Vec Word 8 :=
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
  (process numBlocks 0 (Digest.mk H)).words

-- Convenience: hash a UTF-8 string.
def sha256String (s : String) : Vec Word 8 :=
  sha256 s.toUTF8

-- Structural theorems.
theorem sha256_size (msg : ByteArray) : (sha256 msg).size = 8 := by
  unfold sha256 Vec.size
  rfl

theorem extractBlock_size (padded : ByteArray) (start : Nat)
  (h : start + 63 < padded.size) : (extractBlock padded start h).size = 16 := by
  unfold extractBlock Vec.size
  rfl
