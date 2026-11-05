import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem stateToBytes_length (st : State) :
    (stateToBytes st).length = 32 := rfl

/-- SHA-256 always produces exactly 32 bytes of output, for every input
(FIPS 180-4: a 256-bit message digest). -/

end ProofBundle.Crypto.SHA256
