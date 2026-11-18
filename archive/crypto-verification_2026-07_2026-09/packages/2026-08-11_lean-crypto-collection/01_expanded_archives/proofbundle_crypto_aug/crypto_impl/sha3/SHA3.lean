import Keccak
import Sponge

/-!
# SHA-3 and SHAKE Hash Functions (FIPS 202)

Concrete instantiations.
Output sizes are correct by construction of the sponge.
Zero axioms. Zero sorries.
-/

namespace Keccak

/-- SHA3-256: 32-byte output. -/
def sha3_256 (input : Array UInt8) : Array UInt8 :=
  sponge input 136 0x02 32

/-- SHA3-512: 64-byte output. -/
def sha3_512 (input : Array UInt8) : Array UInt8 :=
  sponge input 72 0x02 64

/-- SHAKE-128: arbitrary output length. -/
def shake128 (input : Array UInt8) (outputLen : Nat) : Array UInt8 :=
  sponge input 168 0x1F outputLen

/-- SHAKE-256: arbitrary output length. -/
def shake256 (input : Array UInt8) (outputLen : Nat) : Array UInt8 :=
  sponge input 136 0x1F outputLen

end Keccak
