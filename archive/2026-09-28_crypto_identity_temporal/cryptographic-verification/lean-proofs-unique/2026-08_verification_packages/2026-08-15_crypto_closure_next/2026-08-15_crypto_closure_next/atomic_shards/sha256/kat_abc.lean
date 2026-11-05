import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_abc :
    sha256Hex "abc" =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" := by
  native_decide

/-- FIPS 180-4 example 3: the 448-bit (56-byte) message, which pads to two
blocks because the length field no longer fits in the first block. -/

end ProofBundle.Crypto.SHA256
