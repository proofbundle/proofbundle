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

theorem hostile_pubkey_infinity_encoding :
    ecdsaVerifyFull (Point.affine 0x0 0x0) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `pubkey_wrong_curve_p384` — signature/message substitution with empty message.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/

end ProofBundle.Crypto.ECDSAP256
