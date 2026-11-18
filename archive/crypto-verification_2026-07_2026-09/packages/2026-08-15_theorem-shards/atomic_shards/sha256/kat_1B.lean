import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_1B : sha256 (katMsg 1) = hexDecode "e7cf46a078fed4fafd0b5e3aff144802b853f8ae459a4f0c14add3314b7cc3a6" := by
  native_decide

/-- Generated boundary KAT (2 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/

end ProofBundle.Crypto.SHA256
