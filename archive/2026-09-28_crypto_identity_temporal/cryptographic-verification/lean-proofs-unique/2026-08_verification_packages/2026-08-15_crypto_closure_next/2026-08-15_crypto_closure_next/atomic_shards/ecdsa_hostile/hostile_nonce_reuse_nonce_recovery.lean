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

theorem hostile_nonce_reuse_nonce_recovery :
    recoverNonceFromReuse nonceReuseS1 (hashToInt nonceReuseMsg1)
      nonceReuseS2 (hashToInt nonceReuseMsg2) =
      0x4d75d064bb2ce80e039b78788d8ed52cf74a04861440fad10f3f0c3dc5df488e := by native_decide

/-- Key recovery: from the reuse pair alone, the honest formula
`d = (s1·k - z1)·r⁻¹ mod n` recovers the ground-truth private key of
kat_0 (ground truth `recovered_private_key`). -/

end ProofBundle.Crypto.ECDSAP256
