import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_3B : sha256 (katMsg 3) = hexDecode "b39fad1a1075f64570b3226d339ea818f9c66ecd2f1c59fd8b9c5a32b54c513f" := by
  native_decide

/-- Generated boundary KAT (55 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/

end ProofBundle.Crypto.SHA256
