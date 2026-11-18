
-- Crypto/SHA512/HMAC.lean
-- HMAC-SHA512 construction.
-- UNVERIFIED: Generated code. Requires compilation to check type signatures
-- and axiom dependencies.

import Crypto.SHA512.Hash
import Crypto.SHA256.HMAC  -- Reuse padKey, xorVec64 patterns

-- ========================================================================
-- Word / Digest ↔ Byte conversions for SHA-512
-- ========================================================================

def word512ToBytes (w : Word512) : Vec UInt8 8 :=
  ⟨#[
    UInt8.ofNat ((w.toNat >>> 56) % 256),
    UInt8.ofNat ((w.toNat >>> 48) % 256),
    UInt8.ofNat ((w.toNat >>> 40) % 256),
    UInt8.ofNat ((w.toNat >>> 32) % 256),
    UInt8.ofNat ((w.toNat >>> 24) % 256),
    UInt8.ofNat ((w.toNat >>> 16) % 256),
    UInt8.ofNat ((w.toNat >>> 8) % 256),
    UInt8.ofNat (w.toNat % 256)
  ], by decide⟩

def digest512ToByteVec (d : Vec Word512 8) : Vec UInt8 64 :=
  let w0 := word512ToBytes (d.get ⟨0, by decide⟩)
  let w1 := word512ToBytes (d.get ⟨1, by decide⟩)
  let w2 := word512ToBytes (d.get ⟨2, by decide⟩)
  let w3 := word512ToBytes (d.get ⟨3, by decide⟩)
  let w4 := word512ToBytes (d.get ⟨4, by decide⟩)
  let w5 := word512ToBytes (d.get ⟨5, by decide⟩)
  let w6 := word512ToBytes (d.get ⟨6, by decide⟩)
  let w7 := word512ToBytes (d.get ⟨7, by decide⟩)
  let a01 := w0.append w1
  let a012 := a01.append w2
  let a0123 := a012.append w3
  let a01234 := a0123.append w4
  let a012345 := a01234.append w5
  let a0123456 := a012345.append w6
  a0123456.append w7

def sha512ByteVec (msg : ByteArray) : Vec UInt8 64 :=
  digest512ToByteVec (sha512 msg)

-- ========================================================================
-- HMAC-SHA512
-- ========================================================================

def padKey128 {n : Nat} (v : Vec UInt8 n) (h : n ≤ 128) : Vec UInt8 128 :=
  let zeros := Vec.mkVec (128 - n) 0
  have h_sum : n + (128 - n) = 128 := Nat.add_sub_of_le h
  ⟨v.data.append zeros.data, by rw [Array.size_append, v.size_eq, zeros.size_eq, h_sum]⟩

def padKey512 (key : ByteArray) : Vec UInt8 128 :=
  if h : key.size ≤ 128 then
    let keyVec : Vec UInt8 key.size := ⟨key.data, by rfl⟩
    padKey128 keyVec h
  else
    let hashVec := sha512ByteVec key
    padKey128 hashVec (by decide)

def xorVec128 (a b : Vec UInt8 128) : Vec UInt8 128 :=
  let rec go (fuel : Nat) (i : Nat) (acc : Array UInt8)
             (h : acc.size = i) (h_i : i + fuel = 128) : Vec UInt8 128 :=
    match fuel with
    | 0 =>
      have hi : i = 128 := by rw [Nat.zero_add] at h_i; exact h_i
      ⟨acc, by rw [hi] at h; exact h⟩
    | fuel + 1 =>
      have hi : i < 128 := by
        have h1 : fuel ≥ 1 := Nat.succ_le_succ (Nat.zero_le fuel)
        have h2 : i + fuel = 128 := h_i
        have h3 : i + 1 ≤ 128 := by
          have : i + 1 ≤ i + fuel := Nat.add_le_add_left h1 i
          rw [h2] at this
          exact this
        have h4 : i ≤ 127 := Nat.le_of_succ_le_succ h3
        exact Nat.lt_succ_of_le h4
      let x := a.get ⟨i, hi⟩
      let y := b.get ⟨i, hi⟩
      go fuel (i + 1) (acc.push (x ^^^ y))
        (by rw [Array.size_push, h])
        (by rw [Nat.add_right_comm i fuel 1] at h_i; exact h_i)
  go 128 0 #[] (by rfl) (by rfl)

def hmacSha512 (key : ByteArray) (msg : ByteArray) : Vec Word512 8 :=
  let keyBlock := padKey512 key
  let ipad := Vec.mkVec 128 0x36
  let opad := Vec.mkVec 128 0x5c
  let innerKey := xorVec128 keyBlock ipad
  let outerKey := xorVec128 keyBlock opad
  let innerMsg := ByteArray.append (ByteArray.mk innerKey.data) msg
  let innerHash := sha512 innerMsg
  let innerHashBytes := ByteArray.mk (digest512ToByteVec innerHash).data
  let outerMsg := ByteArray.append (ByteArray.mk outerKey.data) innerHashBytes
  sha512 outerMsg

theorem hmacSha512_size (key : ByteArray) (msg : ByteArray) :
  (hmacSha512 key msg).size = 8 := by
  unfold hmacSha512 Vec.size
  rfl
