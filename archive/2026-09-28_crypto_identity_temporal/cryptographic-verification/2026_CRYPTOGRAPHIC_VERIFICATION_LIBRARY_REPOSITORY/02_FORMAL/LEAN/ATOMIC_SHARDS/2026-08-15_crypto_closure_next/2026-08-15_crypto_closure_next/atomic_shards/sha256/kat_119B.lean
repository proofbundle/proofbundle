import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_119B : sha256 (katMsg 119) = hexDecode "b0dc41b1a384e2f1203f0351b38fbeaafceef577ce1191d5bfc25da39f721eae" := by
  native_decide

/-- Generated boundary KAT (120 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/

end ProofBundle.Crypto.SHA256
