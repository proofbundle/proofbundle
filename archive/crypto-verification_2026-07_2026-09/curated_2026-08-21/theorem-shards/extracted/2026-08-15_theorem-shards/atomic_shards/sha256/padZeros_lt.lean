import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem padZeros_lt (n : Nat) : padZeros n < 64 := by
  unfold padZeros
  omega

/-- The big-endian length field is exactly eight bytes. -/

end ProofBundle.Crypto.SHA256
