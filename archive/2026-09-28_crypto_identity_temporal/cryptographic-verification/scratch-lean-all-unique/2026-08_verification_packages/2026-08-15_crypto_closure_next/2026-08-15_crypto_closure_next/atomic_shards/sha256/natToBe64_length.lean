import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem natToBe64_length (n : Nat) : (natToBe64 n).length = 8 := rfl

/-- The length of a padded list, in closed form. -/

end ProofBundle.Crypto.SHA256
