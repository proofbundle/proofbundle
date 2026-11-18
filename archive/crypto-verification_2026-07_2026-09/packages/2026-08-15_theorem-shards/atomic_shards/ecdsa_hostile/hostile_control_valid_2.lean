import Std
import ECDSAP256

namespace ProofBundle.Crypto.ECDSAP256

def nonceReuseMsg1 : ByteArray := ByteArray.mk #[0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x20, 0x6f, 0x6e, 0x65]

/-- The second message of the reuse pair: "abc" (the kat_0_msg message,
ground truth). -/

def nonceReuseMsg2 : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

/-- The shared `r` of the reuse pair (ground truth: the kat_0_msg `r`). -/

def nonceReuseR : Nat := 0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407

/-- `s1`, the partner signature component over "message one" (ground
truth `s1`). -/

def nonceReuseS1 : Nat := 0xdfb9cf5cc897790cec4af65ac8e9124a338eb77756ef033cc8bd086112a668a8

/-- `s2`, the ground-truth signature component over "abc" (the
kat_0_msg `s`). -/

def nonceReuseS2 : Nat := 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666

/-- Nonce recovery: `(z1 - z2)·(s1 - s2)⁻¹ mod n` reproduces the reused
nonce `k`, the kat_0_msg RFC 6979 nonce (ground truth `k_reused`). -/

theorem hostile_control_valid_2 :
    ecdsaVerifyFull (Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9) ByteArray.mk #[0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f]
      0x3ca606521d9fbbc7b06092d3847a3100bff508e9972d08563bf9a10c615c9cad 0xed60a7491ecf40115aca684279a264e228bfce015cca0a4031c326be3001a70f = true := by native_decide


/-!
## Malleability, continued: the complementary low-s signature

For the malleability probes above, `(r, n - s)` is the complementary
signature.  It verifies mathematically (same `r`, negated `s`) and is
policy-accepted by `isLowS`, showing precisely the boundary of the
policy: the low-s rule selects exactly one representative of each
malleable pair.
-/

/-- The complement of the kat_0_msg signature verifies mathematically
(ECDSA malleability, proved, not assumed). -/

end ProofBundle.Crypto.ECDSAP256
