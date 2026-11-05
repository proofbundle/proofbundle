import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem sha256_chain_abc_3 :
    hexEncode (sha256Chain (String.toUTF8 "abc") 3) =
      "f2a778f1a6ed3d5bc59a5d79104c598f3f07093f240ca4e91333fb09ed4f36da" := by
  native_decide


end ProofBundle.Crypto.SHA256
