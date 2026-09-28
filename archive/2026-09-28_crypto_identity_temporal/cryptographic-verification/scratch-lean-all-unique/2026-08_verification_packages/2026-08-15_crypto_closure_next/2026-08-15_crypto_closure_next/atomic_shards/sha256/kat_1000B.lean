import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_1000B : sha256 (katMsg 1000) = hexDecode "57799de80e3dd6e2ac4d40c41a150d1662f7f87d0d994776a2fdc37c39b0ea4e" := by
  native_decide

/-!
## Part 3: derived constructions (HMAC, double hash, hash chains)

Expected values below were computed with a reference implementation
(RFC 4231 test case 1 for the first one, which is also the well-known
published value `b0344c61...32cff7`).
-/

/-- RFC 4231 test case 1: key = 0x0b repeated 20 times, data = "Hi There".
This exercises the short-key branch of `hmacSha256` (key shorter than the
64-byte block size, zero-padded on the right). -/

end ProofBundle.Crypto.SHA256
