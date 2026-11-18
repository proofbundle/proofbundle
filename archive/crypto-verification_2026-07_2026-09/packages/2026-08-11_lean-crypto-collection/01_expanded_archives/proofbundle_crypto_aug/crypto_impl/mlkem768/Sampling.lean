import MlKem768.Parameters
import MlKem768.Poly

/-!
# Sampling Functions

Zero axioms. All bounds explicit.
-/

namespace MlKem768

/-- Byte vector of exactly N bytes -/
def ByteVec (N : Nat) : Type := { a : Array UInt8 // a.size = N }

def ByteVec.get {N} (v : ByteVec N) (i : Fin N) : UInt8 :=
  v.val[i.val]'(by rw [v.property]; exact i.isLt)

/-- Parse 384 bytes into a polynomial.
    Each 3-byte chunk gives two 12-bit coefficients. -/
def parse (bytes : ByteVec 384) : Poly :=
  fun idx =>
    let i := idx.val
    let byteIdx := i / 2 * 3
    have h0 : byteIdx < 384 := by
      have : i < 256 := idx.isLt
      omega
    have h1 : byteIdx + 1 < 384 := by omega
    have h2 : byteIdx + 2 < 384 := by omega
    let b0 := (bytes.get ⟨byteIdx, h0⟩).toNat
    let b1 := (bytes.get ⟨byteIdx + 1, h1⟩).toNat
    let b2 := (bytes.get ⟨byteIdx + 2, h2⟩).toNat
    let d := b0 + b1 * 256 + b2 * 65536
    let coeff := if i % 2 = 0 then d % 4096 else (d / 4096) % 4096
    ⟨coeff % q, Nat.mod_lt _ q_pos⟩

/-- Centered Binomial Distribution with η = 2.
    Input: 128 bytes (64 * η1 = 128).
    Output: polynomial with small coefficients. -/
def cbd (bytes : ByteVec (64 * η1)) : Poly :=
  fun idx =>
    let i := idx.val
    let bitsPerCoeff := 2 * η1
    let bytesPerCoeff := (bitsPerCoeff + 7) / 8
    let start := i * bytesPerCoeff
    have h_start : start + bytesPerCoeff ≤ 64 * η1 := by
      have : i < 256 := idx.isLt
      have : η1 = 2 := rfl
      omega
    let bitStart := i * bitsPerCoeff
    let byteStart := bitStart / 8
    let bitOffset := bitStart % 8
    have h_bs : byteStart < 64 * η1 := by omega
    let b0 := (bytes.get ⟨byteStart, h_bs⟩).toNat
    let b1 := if byteStart + 1 < 64 * η1 then
      (bytes.get ⟨byteStart + 1, by omega⟩).toNat
    else 0
    let rawBits := (b0 >>> bitOffset) ||| ((b1 <<< (8 - bitOffset)) &&& 0xFF)
    let chunk := rawBits &&& ((1 <<< bitsPerCoeff) - 1)
    let mask := (1 <<< η1) - 1
    let a := chunk &&& mask
    let b := (chunk >>> η1) &&& mask
    let raw := if a ≥ b then a - b else q - (b - a)
    ⟨raw % q, Nat.mod_lt _ q_pos⟩

/-- Sample uniform polynomial from 384 bytes. -/
def sampleUniform (bytes : ByteVec 384) : Poly :=
  parse bytes

/-- Sample small polynomial from 128 bytes. -/
def sampleSmall (bytes : ByteVec (64 * η1)) : Poly :=
  cbd bytes

end MlKem768
