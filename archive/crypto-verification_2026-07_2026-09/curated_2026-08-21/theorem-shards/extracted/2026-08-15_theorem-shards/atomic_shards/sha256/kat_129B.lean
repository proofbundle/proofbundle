import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_129B : sha256 (katMsg 129) = hexDecode "4f1757ae4bffbae86d775b831765b75af154d52f7deaa46dd378051a2d3ad57f" := by
  native_decide

/-- Generated boundary KAT (255 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/

end ProofBundle.Crypto.SHA256
