import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_65B : sha256 (katMsg 65) = hexDecode "fc518669b6eb4b4dd91827ecacef86689c725bd5bab888fd3b26dbb196eec954" := by
  native_decide

/-- Generated boundary KAT (119 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/

end ProofBundle.Crypto.SHA256
