
-- Crypto/SHA256/HMAC.lean
-- HMAC-SHA256 construction with fixed-size key blocks.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA256.Hash

-- ========================================================================
-- Word / Digest ↔ Byte conversions
-- ========================================================================

def wordToBytes (w : Word) : Vec UInt8 4 :=
  ⟨#[
    UInt8.ofNat ((w.toNat >>> 24) % 256),
    UInt8.ofNat ((w.toNat >>> 16) % 256),
    UInt8.ofNat ((w.toNat >>> 8) % 256),
    UInt8.ofNat (w.toNat % 256)
  ], by decide⟩

def digestToByteVec (d : Vec Word 8) : Vec UInt8 32 :=
  let w0 := wordToBytes (d.get ⟨0, by decide⟩)
  let w1 := wordToBytes (d.get ⟨1, by decide⟩)
  let w2 := wordToBytes (d.get ⟨2, by decide⟩)
  let w3 := wordToBytes (d.get ⟨3, by decide⟩)
  let w4 := wordToBytes (d.get ⟨4, by decide⟩)
  let w5 := wordToBytes (d.get ⟨5, by decide⟩)
  let w6 := wordToBytes (d.get ⟨6, by decide⟩)
  let w7 := wordToBytes (d.get ⟨7, by decide⟩)
  let a01 := w0.append w1
  let a012 := a01.append w2
  let a0123 := a012.append w3
  let a01234 := a0123.append w4
  let a012345 := a01234.append w5
  let a0123456 := a012345.append w6
  a0123456.append w7

def sha256ByteVec (msg : ByteArray) : Vec UInt8 32 :=
  digestToByteVec (sha256 msg)

-- ========================================================================
-- Fixed-size vector utilities for HMAC
-- ========================================================================

def padTo64 {n : Nat} (v : Vec UInt8 n) (h : n ≤ 64) : Vec UInt8 64 :=
  let zeros := Vec.mkVec (64 - n) 0
  have h_sum : n + (64 - n) = 64 := Nat.add_sub_of_le h
  ⟨v.data.append zeros.data, by rw [Array.size_append, v.size_eq, zeros.size_eq, h_sum]⟩

def xorVec64 (a b : Vec UInt8 64) : Vec UInt8 64 :=
  let rec go (fuel : Nat) (i : Nat) (acc : Array UInt8)
             (h : acc.size = i) (h_i : i + fuel = 64) : Vec UInt8 64 :=
    match fuel with
    | 0 =>
      have hi : i = 64 := by rw [Nat.zero_add] at h_i; exact h_i
      ⟨acc, by rw [hi] at h; exact h⟩
    | fuel + 1 =>
      have hi : i < 64 := by
        have h1 : fuel ≥ 1 := Nat.succ_le_succ (Nat.zero_le fuel)
        have h2 : i + fuel = 64 := h_i
        have h3 : i + 1 ≤ 64 := by
          have : i + 1 ≤ i + fuel := Nat.add_le_add_left h1 i
          rw [h2] at this
          exact this
        have h4 : i ≤ 63 := Nat.le_of_succ_le_succ h3
        exact Nat.lt_succ_of_le h4
      let x := a.get ⟨i, hi⟩
      let y := b.get ⟨i, hi⟩
      go fuel (i + 1) (acc.push (x ^^^ y))
        (by rw [Array.size_push, h])
        (by rw [Nat.add_right_comm i fuel 1] at h_i; exact h_i)
  go 64 0 #[] (by rfl) (by rfl)

-- ========================================================================
-- Key padding
-- ========================================================================

def padKey (key : ByteArray) : Vec UInt8 64 :=
  if h : key.size ≤ 64 then
    let keyVec : Vec UInt8 key.size := ⟨key.data, by rfl⟩
    padTo64 keyVec h
  else
    let hashVec := sha256ByteVec key
    padTo64 hashVec (by decide)

-- ========================================================================
-- HMAC-SHA256
-- ========================================================================

def hmacSha256 (key : ByteArray) (msg : ByteArray) : Vec Word 8 :=
  let keyBlock := padKey key
  let ipad := Vec.mkVec 64 0x36
  let opad := Vec.mkVec 64 0x5c
  let innerKey := xorVec64 keyBlock ipad
  let outerKey := xorVec64 keyBlock opad
  let innerMsg := ByteArray.append (ByteArray.mk innerKey.data) msg
  let innerHash := sha256 innerMsg
  let innerHashBytes := ByteArray.mk (digestToByteVec innerHash).data
  let outerMsg := ByteArray.append (ByteArray.mk outerKey.data) innerHashBytes
  sha256 outerMsg

def hmacSha256String (key : String) (msg : String) : Vec Word 8 :=
  hmacSha256 key.toUTF8 msg.toUTF8

-- Structural theorem
theorem hmacSha256_size (key : ByteArray) (msg : ByteArray) :
  (hmacSha256 key msg).size = 8 := by
  unfold hmacSha256 Vec.size
  rfl
