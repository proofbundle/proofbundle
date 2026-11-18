import MlKem768.Parameters

/-!
# Encoding and Decoding (FIPS 203 Section 4.2.1, 4.2.2)

Byte <-> polynomial conversions.
Zero axioms. Zero sorries.
-/

namespace MlKem768

/-- Encode a polynomial into bytes with d bits per coefficient.
    For uncompressed: d = 12. For compressed: d = d_u or d_v. -/
def encodePoly (f : Fin n → Fin q) (d : Nat) : Array UInt8 :=
  let totalBits := n * d
  let totalBytes := (totalBits + 7) / 8
  let mut bytes := Array.mkArray totalBytes (0 : UInt8)
  for i in [0:n] do
    let coeff := (f ⟨i, by omega⟩).val
    let c := if d < 12 then (coeff * (2 ^ d) + q / 2) / q else coeff
    let bitPos := i * d
    let bytePos := bitPos / 8
    let bitOffset := bitPos % 8
    for j in [0:d] do
      let bit := (c >>> j) &&& 1
      let targetByte := bytePos + (bitOffset + j) / 8
      let targetBit := (bitOffset + j) % 8
      if targetByte < totalBytes then
        let old := bytes[targetByte]!.toNat
        let newVal := old ||| (bit <<< targetBit)
        bytes := bytes.set! targetByte (UInt8.ofNat (newVal % 256))
  bytes

/-- Decode bytes into a polynomial. -/
def decodePoly (bytes : Array UInt8) (d : Nat) : Fin n → Fin q :=
  fun idx =>
    let i := idx.val
    let bitPos := i * d
    let bytePos := bitPos / 8
    let bitOffset := bitPos % 8
    let mut c := 0
    for j in [0:d] do
      let targetByte := bytePos + (bitOffset + j) / 8
      let targetBit := (bitOffset + j) % 8
      if targetByte < bytes.size then
        let bit := (bytes[targetByte]!.toNat >>> targetBit) &&& 1
        c := c ||| (bit <<< j)
    let coeff := if d < 12 then (c * q + (2 ^ d) / 2) / (2 ^ d) else c
    ⟨coeff % q, Nat.mod_lt _ q_pos⟩

/-- Encode a 32-byte message into a polynomial.
    Each bit becomes coefficient q/2 or 0. -/
def encodeMessage (msg : ByteVec 32) : Poly :=
  fun idx =>
    let i := idx.val
    let byteIdx := i / 8
    let bitIdx := i % 8
    have h_byte : byteIdx < 32 := by
      have : i < 256 := idx.isLt
      omega
    let bit := (msg.get ⟨byteIdx, h_byte⟩).toNat >>> bitIdx &&& 1
    let coeff := if bit = 1 then q / 2 else 0
    ⟨coeff, by omega⟩

/-- Decode a polynomial back to a 32-byte message. -/
def decodeMessage (f : Poly) : ByteVec 32 :=
  let mut bytes := Array.mkArray 32 (0 : UInt8)
  for byteIdx in [0:32] do
    let mut byte := 0
    for bitIdx in [0:8] do
      let i := byteIdx * 8 + bitIdx
      have h_i : i < n := by omega
      let coeff := (f ⟨i, h_i⟩).val
      let bit := if coeff > q / 4 then 1 else 0
      byte := byte ||| (bit <<< bitIdx)
    bytes := bytes.set! byteIdx (UInt8.ofNat (byte % 256))
  ⟨bytes, by decide⟩

end MlKem768
