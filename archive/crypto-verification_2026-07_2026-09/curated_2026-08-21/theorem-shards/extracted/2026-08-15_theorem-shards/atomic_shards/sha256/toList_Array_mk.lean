import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem toList_Array_mk (l : List UInt8) :
    (Array.mk l).toList = l := rfl

/-- The zero-byte count is always in `[0, 64)`, by construction. -/

end ProofBundle.Crypto.SHA256
