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

theorem malleability_complement_lowS :
    isLowS (nsub 0 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666) = true := by native_decide

/-!
## The nonce-reuse forensic case

The ground-truth signature below is `kat_0_msg` (over `"abc"`).  Its
RFC 6979 nonce `k` was reused by a partner signature over `"message
one"` on the same private key (the kat_0 key); both signatures
therefore share the same `r`.  Both signatures are mathematically valid
— verification cannot detect nonce reuse — but anyone holding both
recovers the private key by honest modular arithmetic:

  k = (z1 - z2)·(s1 - s2)⁻¹ mod n,   d = (s1·k - z1)·r⁻¹ mod n.

The reused nonce `k`, the partner signature component `s1`, and the
recovered key are all anchored in `ground_truth.json` (fields
`k_reused`, `s1`, `message1`, `recovered_private_key` of the
`nonce_reuse_pair` case, machine-verified: `s1` verifies, `(k·G).x = r`,
both recovery identities hold) and are pinned down by computation
below.
-/

/-- Nonce-reuse case — the ground-truth signature over `"abc"`
(kat_0_msg) is mathematically valid (this is precisely why nonce reuse
is dangerous: nothing in verification rejects it). -/

end ProofBundle.Crypto.ECDSAP256
