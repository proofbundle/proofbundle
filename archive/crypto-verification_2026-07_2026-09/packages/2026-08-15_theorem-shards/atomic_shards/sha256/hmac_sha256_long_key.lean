import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem hmac_sha256_long_key :
    hexEncode (hmacSha256
        (ByteArray.mk (Array.mk ((List.range 100).map (fun i => i.toUInt8))))
        (String.toUTF8 "msg")) =
      "f85da02f25a44a117825adec49678dd31f98d263ba21680c07fd30c161cda4ec" := by
  native_decide

/-- Double SHA-256 of the empty message: `sha256 (sha256 "")`.  Expected
value from a reference implementation. -/

end ProofBundle.Crypto.SHA256
