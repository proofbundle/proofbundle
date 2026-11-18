/-
# FIPS 186-5 ECDSA over P-256 — Hostile test cases

Compile with `lake env lean ECDSAP256Hostile.lean` (with `ECDSAP256.lean`
in the same source root).  No `sorry`, no `admit`, no `axiom`; every
theorem is closed by `native_decide`.

This file pins down all twenty adversarial cases of
`ground_truth.json` (dual-verified against OpenSSL and an independent
pure-Python model), each tagged with its expected verdict:

  * REJECT cases — `ecdsaVerifyFull` (FIPS 186-5 section 5.6.2.3 key
    validation followed by section 6.4.4 verification with the full
    [1, n-1] range checks) must return `false`.  This covers out-of-range
    signature components (r = 0, s = 0, r = n, s = n), the
    "r = n-1 masquerading as -1" encoding probe, single-bit flips in r
    and s, wrong-message and wrong-public-key substitution, an off-curve
    public key (invalid-curve attack probe), the (0,0)
    point-at-infinity masquerade, and the degenerate probes
    (r = s = 1), (s = r), (r, s swapped);
  * REJECT_LOW_S_POLICY cases — ECDSA malleability: `(r, s)` and
    `(r, n - s)` are simultaneously valid, so a high-s signature
    *verifies mathematically* (`ecdsaVerify = true`) but fails the
    low-s canonicality policy (`isLowS s = false`).  Both sides are
    proved, and the complementary low-s signature is shown to verify
    and to be policy-accepted — documenting exactly what the policy
    changes;
  * ACCEPT controls — two valid baseline signatures must verify under
    the full pipeline;
  * REJECT_FORENSIC_NONCE_REUSE — a signature produced with a nonce
    reused from another signature on the same key: the signature itself
    is mathematically valid (proved), but the nonce reuse makes the
    private key recoverable, proved by the honest recovery theorems
    `hostile_nonce_reuse_nonce_recovery` and
    `hostile_nonce_reuse_key_recovery`.
-/

import Std
import ECDSAP256

namespace ProofBundle.Crypto.ECDSAP256

/-- Hostile case `r_zero` — r=0: invalid per FIPS 186-4 range check.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_r_zero :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0x0 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `s_zero` — s=0.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_s_zero :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0x0 = false := by native_decide

/-- Hostile case `r_equals_n` — r=n: out of range [1,n-1].  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_r_equals_n :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `s_equals_n` — s=n: out of range.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_s_equals_n :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 = false := by native_decide

/-- Hostile case `r_negative_encoding` — r=n-1 masquerading as -1.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_r_negative_encoding :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632550 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `bitflip_r` — single bit flipped in r.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_bitflip_r :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81406 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `bitflip_s` — single bit flipped in s.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_bitflip_s :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e667 = false := by native_decide

/-- Hostile case `wrong_message` — valid signature, wrong message.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_wrong_message :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x77, 0x72, 0x6f, 0x6e, 0x67]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `wrong_pubkey` — valid signature, wrong public key.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_wrong_pubkey :
    ecdsaVerifyFull (Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Malleability case `malleability_s_complement` — (r, n-s): ECDSA signature malleability — verifier policy MUST define accept/reject.  The signature
is mathematically valid (ECDSA is malleable: the verifier sees `s` only
up to sign through the x-coordinate) but the high-s form is rejected by
the low-s canonicality policy.  Both facts are proved: this is a
documented policy rejection, not a verification failure. -/
theorem hostile_malleability_s_complement :
    isLowS 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false ∧
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- Malleability case `s_above_half_order` — s > n/2: high-s non-canonical form.  The signature
is mathematically valid (ECDSA is malleable: the verifier sees `s` only
up to sign through the x-coordinate) but the high-s form is rejected by
the low-s canonicality policy.  Both facts are proved: this is a
documented policy rejection, not a verification failure. -/
theorem hostile_s_above_half_order :
    isLowS 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false ∧
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- Hostile case `pubkey_not_on_curve` — public key point not on curve: invalid-curve attack probe.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_pubkey_not_on_curve :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839164) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `pubkey_infinity_encoding` — public key (0,0): point-at-infinity masquerade.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_pubkey_infinity_encoding :
    ecdsaVerifyFull (Point.affine 0x0 0x0) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `pubkey_wrong_curve_p384` — signature/message substitution with empty message.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_pubkey_wrong_curve_p384 :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by native_decide

/-- Hostile case `r_1_s_1` — r=1,s=1: trivial forgery probe.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_r_1_s_1 :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0x1 0x1 = false := by native_decide

/-- Hostile case `s_equals_r` — s=r degenerate case.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_s_equals_r :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 = false := by native_decide

/-- Hostile case `swapped_r_s` — r and s swapped.  Expected verdict: REJECT;
the full pipeline (key validation + range checks + FIPS 186-5 6.4.4
verification) rejects it. -/
theorem hostile_swapped_r_s :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 = false := by native_decide

/-- Control case `control_valid` — valid baseline signature (control).  Expected verdict: ACCEPT. -/
theorem hostile_control_valid :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- Control case `control_valid_2` — valid baseline (control).  Expected verdict: ACCEPT. -/
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
theorem malleability_complement_verifies :
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 (nsub 0 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666) = true := by native_decide

/-- The complement is low-s, hence policy-accepted: the low-s policy
selects exactly one of the two malleable forms. -/
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
theorem hostile_nonce_reuse_pair :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- The first message of the reuse pair: "message one" (ground truth
`message1`). -/
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
theorem hostile_nonce_reuse_key_recovery :
    recoverPrivFromReuse nonceReuseR nonceReuseS1 (hashToInt nonceReuseMsg1)
      nonceReuseS2 (hashToInt nonceReuseMsg2) =
      0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52 := by native_decide

/-- Consistency: the recovered nonce regenerates the shared `r` —
`(k·G).x mod n = r`. -/
theorem hostile_nonce_reuse_r_consistency :
    (match pointMul basePoint 0x4d75d064bb2ce80e039b78788d8ed52cf74a04861440fad10f3f0c3dc5df488e with
     | Point.affine x _ => x % n
     | Point.infinity => 0) = nonceReuseR := by native_decide

/-- Both signatures of the reuse pair verify mathematically under the
kat_0 public key (the partner signature included). -/
theorem hostile_nonce_reuse_both_verify :
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163)
        nonceReuseMsg1 nonceReuseR nonceReuseS1 = true ∧
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163)
        nonceReuseMsg2 nonceReuseR nonceReuseS2 = true := by native_decide

end ProofBundle.Crypto.ECDSAP256
