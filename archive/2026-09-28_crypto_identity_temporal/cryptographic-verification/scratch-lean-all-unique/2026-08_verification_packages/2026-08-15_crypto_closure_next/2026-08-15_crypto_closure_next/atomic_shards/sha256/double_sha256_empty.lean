import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem double_sha256_empty :
    hexEncode (doubleSha256 (String.toUTF8 "")) =
      "5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456" := by
  native_decide

/-- Iterated hashing: `sha256` applied three times to "abc"
(`sha256Chain "abc" 3`).  Expected value from a reference implementation. -/

end ProofBundle.Crypto.SHA256
