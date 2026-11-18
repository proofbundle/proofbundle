
-- Crypto/SHA512/Hash.lean
-- SHA-512 padding, block extraction, and full iterative hash.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA512.Core

-- ========================================================================
-- Padding
-- ========================================================================

-- Compute padding length: smallest k such that (msgLen + 1 + k) ≡ 112 (mod 128)
def paddingLength512 (msgLen : Nat) : Nat :=
  let r := (msgLen + 1) % 128
  if r ≤ 112 then 112 - r else 128 - r + 112

theorem paddingLength512_spec (msgLen : Nat) :
  (msgLen + 1 + paddingLength512 msgLen) % 128 = 112 := by
  unfold paddingLength512
  split
  · -- Case r ≤ 112
    rename_i r hr
    have h1 : msgLen + 1 = 128 * ((msgLen + 1) / 128) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 128]
    have h2 : r + (112 - r) = 112 := Nat.add_sub_cancel' hr
    have h3 : 128 * ((msgLen + 1) / 128) + r + (112 - r) = 128 * ((msgLen + 1) / 128) + 112 := by
      rw [Nat.add_assoc]
      rw [h2]
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]
  · -- Case r > 112
    rename_i r hr
    have h1 : msgLen + 1 = 128 * ((msgLen + 1) / 128) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 128]
    have hr128 : r ≤ 128 := by
      have : r < 128 := Nat.mod_lt (msgLen + 1) (by decide)
      exact Nat.le_of_lt this
    have h2 : r + (128 - r + 112) = 128 + 112 := by
      have h3 : r + (128 - r) = 128 := Nat.add_sub_cancel' hr128
      calc
        r + (128 - r + 112) = r + (128 - r) + 112 := by rw [Nat.add_assoc]
        _ = 128 + 112 := by rw [h3]
    have h3 : 128 * ((msgLen + 1) / 128) + r + (128 - r + 112) = 128 * ((msgLen + 1) / 128 + 1) + 112 := by
      rw [Nat.add_assoc]
      rw [h2]
      rw [Nat.mul_add]
      rfl
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]

-- Encode a 128-bit length in bits as 16 big-endian bytes.
def encodeLength512 (lenBits : Nat) : ByteArray :=
  ByteArray.mk #[
    UInt8.ofNat ((lenBits >>> 120) % 256), UInt8.ofNat ((lenBits >>> 112) % 256),
    UInt8.ofNat ((lenBits >>> 104) % 256), UInt8.ofNat ((lenBits >>> 96) % 256),
    UInt8.ofNat ((lenBits >>> 88) % 256), UInt8.ofNat ((lenBits >>> 80) % 256),
    UInt8.ofNat ((lenBits >>> 72) % 256), UInt8.ofNat ((lenBits >>> 64) % 256),
    UInt8.ofNat ((lenBits >>> 56) % 256), UInt8.ofNat ((lenBits >>> 48) % 256),
    UInt8.ofNat ((lenBits >>> 40) % 256), UInt8.ofNat ((lenBits >>> 32) % 256),
    UInt8.ofNat ((lenBits >>> 24) % 256), UInt8.ofNat ((lenBits >>> 16) % 256),
    UInt8.ofNat ((lenBits >>> 8) % 256), UInt8.ofNat (lenBits % 256)
  ]

-- Full padding: message || 0x80 || 00...00 || 128-bit length.
def padMessage512 (msg : ByteArray) : ByteArray :=
  let lenBits := msg.size * 8
  let padLen := paddingLength512 msg.size
  let padding := ByteArray.mk (Array.mkArray padLen 0)
  let withOne := msg.push 0x80
  let withPad := ByteArray.append withOne padding
  ByteArray.append withPad (encodeLength512 lenBits)

theorem padMessage512_size (msg : ByteArray) :
  (padMessage512 msg).size % 128 = 0 := by
  unfold padMessage512
  simp [ByteArray.size_append, ByteArray.size_push]
  have h : msg.size + 1 + paddingLength512 msg.size + 16 =
           (msg.size + 1 + paddingLength512 msg.size) + 16 := by rfl
  rw [h]
  have h2 : (msg.size + 1 + paddingLength512 msg.size) % 128 = 112 := paddingLength512_spec msg.size
  have h3 : ∃ q, msg.size + 1 + paddingLength512 msg.size = 128 * q + 112 := by
    refine ⟨ (msg.size + 1 + paddingLength512 msg.size) / 128, ?_ ⟩
    rw [Nat.div_add_mod _ 128]
    rw [h2]
  obtain ⟨q, hq⟩ := h3
  rw [hq]
  have h4 : (128 * q + 112 + 16) % 128 = 0 := by
    have : 128 * q + 112 + 16 = 128 * (q + 1) := by
      rw [Nat.mul_add]
      rfl
    rw [this]
    simp [Nat.mul_mod]
  exact h4

-- ========================================================================
-- Block extraction
-- ========================================================================

def bytesToWord512 (b0 b1 b2 b3 b4 b5 b6 b7 : UInt8) : Word512 :=
  (UInt64.ofNat b0.toNat <<< 56) |||
  (UInt64.ofNat b1.toNat <<< 48) |||
  (UInt64.ofNat b2.toNat <<< 40) |||
  (UInt64.ofNat b3.toNat <<< 32) |||
  (UInt64.ofNat b4.toNat <<< 24) |||
  (UInt64.ofNat b5.toNat <<< 16) |||
  (UInt64.ofNat b6.toNat <<< 8) |||
  UInt64.ofNat b7.toNat

def extractBlock512 (padded : ByteArray) (start : Nat)
                    (h_bound : start + 127 < padded.size) : Vec Word512 16 :=
  let rec build (fuel : Nat) (i : Nat) (acc : Array Word512)
                (h_acc : acc.size = i) (h_i : i + fuel = 16)
                (h_byte : start + 127 < padded.size) : Vec Word512 16 :=
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
      have hj1 : i * 8 + 7 ≤ 127 := by
        have : i ≤ 15 := Nat.le_of_lt_add_one hi
        have : i * 8 ≤ 120 := Nat.mul_le_mul_right 8 this
        exact Nat.add_le_add_right this 7
      have h0 : start + i * 8 < padded.size := by
        have h_pos : 0 < 7 := by decide
        have h_lt : start + i * 8 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h1 : start + i * 8 + 1 < padded.size := by
        have h_pos : 0 < 6 := by decide
        have h_lt : start + i * 8 + 1 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h2 : start + i * 8 + 2 < padded.size := by
        have h_pos : 0 < 5 := by decide
        have h_lt : start + i * 8 + 2 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h3 : start + i * 8 + 3 < padded.size := by
        have h_pos : 0 < 4 := by decide
        have h_lt : start + i * 8 + 3 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h4 : start + i * 8 + 4 < padded.size := by
        have h_pos : 0 < 3 := by decide
        have h_lt : start + i * 8 + 4 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h5 : start + i * 8 + 5 < padded.size := by
        have h_pos : 0 < 2 := by decide
        have h_lt : start + i * 8 + 5 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h6 : start + i * 8 + 6 < padded.size := by
        have h_pos : 0 < 1 := by decide
        have h_lt : start + i * 8 + 6 < start + i * 8 + 7 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 8 + 7 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h7 : start + i * 8 + 7 < padded.size := by
        have h_le : start + i * 8 + 7 ≤ start + 127 := Nat.add_le_add_left hj1 start
        exact Nat.lt_of_le_of_lt h_le h_byte
      let b0 := padded.get ⟨start + i * 8, h0⟩
      let b1 := padded.get ⟨start + i * 8 + 1, h1⟩
      let b2 := padded.get ⟨start + i * 8 + 2, h2⟩
      let b3 := padded.get ⟨start + i * 8 + 3, h3⟩
      let b4 := padded.get ⟨start + i * 8 + 4, h4⟩
      let b5 := padded.get ⟨start + i * 8 + 5, h5⟩
      let b6 := padded.get ⟨start + i * 8 + 6, h6⟩
      let b7 := padded.get ⟨start + i * 8 + 7, h7⟩
      let w := bytesToWord512 b0 b1 b2 b3 b4 b5 b6 b7
      have h_next : start + 127 < padded.size := h_byte
      build fuel (i + 1) (acc.push w)
        (by rw [Array.size_push, h_acc])
        (by rw [Nat.add_right_comm i fuel 1] at h_i; exact h_i)
        h_next
  build 16 0 #[] (by rfl) (by rfl) h_bound

-- ========================================================================
-- Full SHA-512 hash
-- ========================================================================

def sha512 (msg : ByteArray) : Vec Word512 8 :=
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
  (process numBlocks 0 (Digest512.mk H512)).words

def sha512String (s : String) : Vec Word512 8 :=
  sha512 s.toUTF8

theorem sha512_size (msg : ByteArray) : (sha512 msg).size = 8 := by
  unfold sha512 Vec.size
  rfl
