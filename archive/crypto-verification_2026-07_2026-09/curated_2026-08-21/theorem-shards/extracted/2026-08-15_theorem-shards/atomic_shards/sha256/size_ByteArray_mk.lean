import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem size_ByteArray_mk (a : Array UInt8) :
    (ByteArray.mk a).size = a.toList.length := rfl

/-- The list view of `Array.mk l` is `l`; holds definitionally. -/

end ProofBundle.Crypto.SHA256
