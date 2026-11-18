import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem hmac_sha256_rfc4231_case1 :
    hmacSha256 (ByteArray.mk (Array.mkArray 20 0x0b)) (String.toUTF8 "Hi There") =
      hexDecode "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7" := by
  native_decide

/-- HMAC-SHA-256 with an over-length key (100 bytes, key `i` = `i mod 256`,
message "msg"), exercising the branch of RFC 2104 that first hashes the key
down to 32 bytes before padding.  Expected value from a reference
implementation. -/

end ProofBundle.Crypto.SHA256
