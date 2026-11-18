import ChaCha20
import Poly1305

/-!
# ChaCha20-Poly1305 AEAD (RFC 8439 Section 2.8)

Authenticated encryption with associated data.
Zero axioms. Zero sorries.
-/

namespace ChaCha20Poly1305

/-- Pad to 16-byte boundary. -/
def pad16 (data : Array UInt8) : Array UInt8 :=
  let mut padded := data
  while padded.size % 16 ≠ 0 do
    padded := padded.push (0 : UInt8)
  padded

/-- Encode 64-bit length as little-endian 8 bytes. -/
def encodeLen (len : Nat) : Array UInt8 :=
  let mut bytes := Array.mkArray 8 (0 : UInt8)
  for i in [0:8] do
    let byte := (len >>> (i * 8)) &&& 0xFF
    bytes := bytes.set! i (UInt8.ofNat (byte % 256))
  bytes

/-- Compute Poly1305 key from ChaCha20 block 0.
    key: 32 bytes, nonce: 12 bytes. -/
def polyKey (key : Array UInt8) (nonce : Array UInt8) : Array UInt8 :=
  let block0 := ChaCha20.blockFunction
    (fun i =>
      let idx := i.val * 4
      if idx + 3 < key.size then
        let b0 := key[idx]!.toNat
        let b1 := key[idx + 1]!.toNat
        let b2 := key[idx + 2]!.toNat
        let b3 := key[idx + 3]!.toNat
        UInt32.ofNat (b0 + b1 * 256 + b2 * 65536 + b3 * 16777216)
      else 0)
    0
    (fun i =>
      let idx := i.val * 4
      if idx + 3 < nonce.size then
        let b0 := nonce[idx]!.toNat
        let b1 := nonce[idx + 1]!.toNat
        let b2 := nonce[idx + 2]!.toNat
        let b3 := nonce[idx + 3]!.toNat
        UInt32.ofNat (b0 + b1 * 256 + b2 * 65536 + b3 * 16777216)
      else 0)
  let bytes := ChaCha20.blockToBytes block0
  bytes.extract 0 32

/-- AEAD encrypt.
    key: 32 bytes, nonce: 12 bytes, plaintext, associated data. -/
def encrypt (key : Array UInt8) (nonce : Array UInt8)
  (ad : Array UInt8) (plaintext : Array UInt8) :
  Array UInt8 × Array UInt8 :=
  let pkey := polyKey key nonce
  let ciphertext := ChaCha20.crypt key nonce 1 plaintext
  let mut macInput := Array.mkArray 0 (0 : UInt8)
  macInput := macInput ++ pad16 ad
  macInput := macInput ++ pad16 ciphertext
  macInput := macInput ++ encodeLen ad.size
  macInput := macInput ++ encodeLen ciphertext.size
  let tag := Poly1305.mac pkey macInput
  (ciphertext, tag)

/-- AEAD decrypt.
    Returns plaintext if tag verifies, otherwise empty. -/
def decrypt (key : Array UInt8) (nonce : Array UInt8)
  (ad : Array UInt8) (ciphertext : Array UInt8) (tag : Array UInt8) :
  Array UInt8 :=
  let pkey := polyKey key nonce
  let mut macInput := Array.mkArray 0 (0 : UInt8)
  macInput := macInput ++ pad16 ad
  macInput := macInput ++ pad16 ciphertext
  macInput := macInput ++ encodeLen ad.size
  macInput := macInput ++ encodeLen ciphertext.size
  let computedTag := Poly1305.mac pkey macInput
  if tag = computedTag then
    ChaCha20.crypt key nonce 1 ciphertext
  else
    Array.mkArray 0 (0 : UInt8)

end ChaCha20Poly1305
