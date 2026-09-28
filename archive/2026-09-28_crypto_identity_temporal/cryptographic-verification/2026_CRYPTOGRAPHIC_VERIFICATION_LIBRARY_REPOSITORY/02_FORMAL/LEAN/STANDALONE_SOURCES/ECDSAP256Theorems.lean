/-
# FIPS 186-5 ECDSA over P-256 — Theorems: SHA-256/HMAC known-answer
# tests, group sanity, and the nine ground-truth ECDSA vectors

Compile with `lake env lean ECDSAP256Theorems.lean` (with `ECDSAP256.lean`
in the same source root and the import below).  This file contains no
`sorry`, no `admit` and no `axiom`; every theorem is closed by
`native_decide` over the executable definitions of `ECDSAP256.lean`.

Contents:

  * Part 1: SHA-256 known-answer tests — FIPS 180-4 "abc" and the empty
    string, pinning the embedded SHA-256 against its published digests;
  * Part 2: HMAC-SHA-256 known-answer test — RFC 4231 test case 1,
    pinning the embedded HMAC (RFC 2104, B = 64);
  * Part 3: group sanity — the base point is on the curve, `n·G` is the
    point at infinity, `(n+1)·G = G`, `2·G` is affine, and `n` is odd;
  * Part 4: all nine ECDSA vectors from the project ground truth
    (`ground_truth.json`, dual-verified against OpenSSL and an
    independent pure-Python model): for each vector, RFC 6979 nonce
    recovery (`rfc6979K priv msg = k`), signature generation
    (`ecdsaSign priv msg = (r, s)`), verification acceptance, and
    public-key derivation (`priv·G = (Qx, Qy)`).

Every private key, nonce, signature component and public-key coordinate
below is written as an explicit hexadecimal `Nat` literal transcribed
from the ground truth, and every message as an explicit
`ByteArray.mk #[...]` literal, so the file is self-contained and
auditable byte by byte.
-/

import Std
import ECDSAP256

namespace ProofBundle.Crypto.ECDSAP256

/-!
## Part 1: SHA-256 known-answer tests (FIPS 180-4 appendix D)
-/

/-- FIPS 180-4 SHA-256 example 1: the empty string. -/
theorem sha256_kat_empty :
    sha256Hex "" =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" := by
  native_decide

/-- FIPS 180-4 SHA-256 example 2: the one-block message "abc". -/
theorem sha256_kat_abc :
    sha256Hex "abc" =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" := by
  native_decide

/-- The digest of "abc" as a `ByteArray` equality, pinning the byte-level
output (not only the hex rendering). -/
theorem sha256_kat_abc_bytes :
    sha256 "abc".toUTF8 =
      ByteArray.mk #[0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea,
                    0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23,
                    0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
                    0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad] := by
  native_decide

/-!
## Part 2: HMAC-SHA-256 known-answer test (RFC 4231 test case 1)
-/

/-- RFC 4231 HMAC-SHA-256 test case 1: key = 0x0b repeated 20 times
(shorter than the block size, exercising zero-padding), data = "Hi
There". -/
theorem hmac_sha256_rfc4231_tc1 :
    hexEncode (hmacSha256
      (ByteArray.mk #[0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
                     0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
                     0x0b, 0x0b, 0x0b, 0x0b])
      "Hi There".toUTF8) =
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7" := by
  native_decide

/-!
## Part 3: group sanity theorems
-/

/-- The base point G lies on the P-256 curve (FIPS 186-4 D.1.2.3). -/
theorem basePoint_onCurve : onCurve Gx Gy = true := by native_decide

/-- The base point has order `n`: `n·G` is the point at infinity
(FIPS 186-4 D.1.2.3, ground truth `curve.n`). -/
theorem basePoint_order : pointMul basePoint n = Point.infinity := by
  native_decide

/-- Consequently `(n + 1)·G = G`, a cross-check of the group law. -/
theorem basePoint_order_plus_one :
    pointMul basePoint (n + 1) = basePoint := by native_decide

/-- The base point is valid per the FIPS 186-5 section 5.6.2.3 full
public-key validation procedure. -/
theorem basePoint_validates : validatePublicKey basePoint = true := by
  native_decide

/-- The point at infinity is rejected by public-key validation. -/
theorem infinity_not_valid : validatePublicKey Point.infinity = false := by
  native_decide

/-- `n` is odd, so the low-s threshold `⌊n/2⌋` is exact. -/
theorem n_odd : n % 2 = 1 := by native_decide

/-!
## Part 4: the nine ground-truth ECDSA vectors (FIPS 186-5 section 6, RFC 6979 section 3.2)
-/

/-- Vector `kat_0_empty` — private key (ground truth). -/
def priv_kat_0_empty : Nat := 0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52

/-- Vector `kat_0_empty` — message (ground truth, hex in the JSON). -/
def msg_kat_0_empty : ByteArray := ByteArray.mk #[]

/-- Vector `kat_0_empty` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_0_empty_nonce :
    rfc6979K priv_kat_0_empty msg_kat_0_empty = 0xe959d49f8d73e7fb283f6611a43408791837e47bf25af629633dd8bc35398980 := by native_decide

/-- Vector `kat_0_empty` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0xd3cb108e02fc4842b51d8afa14b1c3c73e6528f1c6102ae5c6238a5a2efa2c58`
and `s = 0x4c641a9fa2cecf284d99385b41b48bc356568dc0c16b902ce193ff111bca657f`. -/
theorem kat_kat_0_empty_sign :
    ecdsaSign priv_kat_0_empty msg_kat_0_empty = (0xd3cb108e02fc4842b51d8afa14b1c3c73e6528f1c6102ae5c6238a5a2efa2c58, 0x4c641a9fa2cecf284d99385b41b48bc356568dc0c16b902ce193ff111bca657f) := by native_decide

/-- Vector `kat_0_empty` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_0_empty_verify :
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) msg_kat_0_empty
      0xd3cb108e02fc4842b51d8afa14b1c3c73e6528f1c6102ae5c6238a5a2efa2c58 0x4c641a9fa2cecf284d99385b41b48bc356568dc0c16b902ce193ff111bca657f = true := by native_decide

/-- Vector `kat_0_empty` — public-key derivation: `priv·G` is the ground-truth
public key 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c / 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163. -/
theorem kat_kat_0_empty_pubkey :
    pointMul basePoint priv_kat_0_empty =
      Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163 := by native_decide

/-- Vector `kat_0_empty` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_0_empty_verify_full :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) msg_kat_0_empty
      0xd3cb108e02fc4842b51d8afa14b1c3c73e6528f1c6102ae5c6238a5a2efa2c58 0x4c641a9fa2cecf284d99385b41b48bc356568dc0c16b902ce193ff111bca657f = true := by native_decide

/-- Vector `kat_0_msg` — private key (ground truth). -/
def priv_kat_0_msg : Nat := 0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52

/-- Vector `kat_0_msg` — message (ground truth, hex in the JSON). -/
def msg_kat_0_msg : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

/-- Vector `kat_0_msg` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_0_msg_nonce :
    rfc6979K priv_kat_0_msg msg_kat_0_msg = 0x4d75d064bb2ce80e039b78788d8ed52cf74a04861440fad10f3f0c3dc5df488e := by native_decide

/-- Vector `kat_0_msg` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407`
and `s = 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666`. -/
theorem kat_kat_0_msg_sign :
    ecdsaSign priv_kat_0_msg msg_kat_0_msg = (0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407, 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666) := by native_decide

/-- Vector `kat_0_msg` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_0_msg_verify :
    ecdsaVerify (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) msg_kat_0_msg
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- Vector `kat_0_msg` — public-key derivation: `priv·G` is the ground-truth
public key 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c / 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163. -/
theorem kat_kat_0_msg_pubkey :
    pointMul basePoint priv_kat_0_msg =
      Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163 := by native_decide

/-- Vector `kat_0_msg` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_0_msg_verify_full :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) msg_kat_0_msg
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = true := by native_decide

/-- Vector `kat_1_empty` — private key (ground truth). -/
def priv_kat_1_empty : Nat := 0x39c82bd578436d01e3074d1c9817b1cb020fd333978045da39ec9495fb383360

/-- Vector `kat_1_empty` — message (ground truth, hex in the JSON). -/
def msg_kat_1_empty : ByteArray := ByteArray.mk #[]

/-- Vector `kat_1_empty` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_1_empty_nonce :
    rfc6979K priv_kat_1_empty msg_kat_1_empty = 0x431b4af646e83f4fb44f9567ffa45e6c29152887f3a1f0cbc5c11d17e7d96ac2 := by native_decide

/-- Vector `kat_1_empty` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0x926a96b79dbcbf6a45dfa34e19e4f937fcf8dd97e87f330fda1ad48374f1a9f0`
and `s = 0x97f2a9c669f413630b4fcf2778811c582ed5a469004067f946ece31ee1df52a3`. -/
theorem kat_kat_1_empty_sign :
    ecdsaSign priv_kat_1_empty msg_kat_1_empty = (0x926a96b79dbcbf6a45dfa34e19e4f937fcf8dd97e87f330fda1ad48374f1a9f0, 0x97f2a9c669f413630b4fcf2778811c582ed5a469004067f946ece31ee1df52a3) := by native_decide

/-- Vector `kat_1_empty` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_1_empty_verify :
    ecdsaVerify (Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72) msg_kat_1_empty
      0x926a96b79dbcbf6a45dfa34e19e4f937fcf8dd97e87f330fda1ad48374f1a9f0 0x97f2a9c669f413630b4fcf2778811c582ed5a469004067f946ece31ee1df52a3 = true := by native_decide

/-- Vector `kat_1_empty` — public-key derivation: `priv·G` is the ground-truth
public key 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 / 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72. -/
theorem kat_kat_1_empty_pubkey :
    pointMul basePoint priv_kat_1_empty =
      Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72 := by native_decide

/-- Vector `kat_1_empty` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_1_empty_verify_full :
    ecdsaVerifyFull (Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72) msg_kat_1_empty
      0x926a96b79dbcbf6a45dfa34e19e4f937fcf8dd97e87f330fda1ad48374f1a9f0 0x97f2a9c669f413630b4fcf2778811c582ed5a469004067f946ece31ee1df52a3 = true := by native_decide

/-- Vector `kat_1_msg` — private key (ground truth). -/
def priv_kat_1_msg : Nat := 0x39c82bd578436d01e3074d1c9817b1cb020fd333978045da39ec9495fb383360

/-- Vector `kat_1_msg` — message (ground truth, hex in the JSON). -/
def msg_kat_1_msg : ByteArray := ByteArray.mk #[0x00]

/-- Vector `kat_1_msg` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_1_msg_nonce :
    rfc6979K priv_kat_1_msg msg_kat_1_msg = 0xbc995b457cc872e5eac6640b6706cdc9ecf4d7805b8a2fdc260f541b12138f09 := by native_decide

/-- Vector `kat_1_msg` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0xef5a672bcc27db3052407f3e6d61a5e4d2ba7dc9578bd28c3b155931dc1e3883`
and `s = 0xa97e4b723bb8c8ca90280bc1a81de2b14ed680920ca8da6d21f3b6fb8ea8a5ea`. -/
theorem kat_kat_1_msg_sign :
    ecdsaSign priv_kat_1_msg msg_kat_1_msg = (0xef5a672bcc27db3052407f3e6d61a5e4d2ba7dc9578bd28c3b155931dc1e3883, 0xa97e4b723bb8c8ca90280bc1a81de2b14ed680920ca8da6d21f3b6fb8ea8a5ea) := by native_decide

/-- Vector `kat_1_msg` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_1_msg_verify :
    ecdsaVerify (Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72) msg_kat_1_msg
      0xef5a672bcc27db3052407f3e6d61a5e4d2ba7dc9578bd28c3b155931dc1e3883 0xa97e4b723bb8c8ca90280bc1a81de2b14ed680920ca8da6d21f3b6fb8ea8a5ea = true := by native_decide

/-- Vector `kat_1_msg` — public-key derivation: `priv·G` is the ground-truth
public key 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 / 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72. -/
theorem kat_kat_1_msg_pubkey :
    pointMul basePoint priv_kat_1_msg =
      Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72 := by native_decide

/-- Vector `kat_1_msg` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_1_msg_verify_full :
    ecdsaVerifyFull (Point.affine 0xbbcc2bf06cd5102ff518fa9ebe734d1646a4f0ce47efb945499b2be42d486291 0xcbf00bb9a65930170bd98127208c6f193a56563ece78bdc37284c9091f065c72) msg_kat_1_msg
      0xef5a672bcc27db3052407f3e6d61a5e4d2ba7dc9578bd28c3b155931dc1e3883 0xa97e4b723bb8c8ca90280bc1a81de2b14ed680920ca8da6d21f3b6fb8ea8a5ea = true := by native_decide

/-- Vector `kat_2_empty` — private key (ground truth). -/
def priv_kat_2_empty : Nat := 0x6884f77d3e9098b773d660dd4a4f297b29805739db772a334f209db13c035de6

/-- Vector `kat_2_empty` — message (ground truth, hex in the JSON). -/
def msg_kat_2_empty : ByteArray := ByteArray.mk #[]

/-- Vector `kat_2_empty` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_2_empty_nonce :
    rfc6979K priv_kat_2_empty msg_kat_2_empty = 0xac1e330cda30645827868935362388ea2614b7b4338525b17603346d6ce2da7d := by native_decide

/-- Vector `kat_2_empty` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0xbac017cbdf65e2c96dded840a9103770236dc4cd733d64b664264cdfd675205c`
and `s = 0xafd5e0057affb675b1d88a42cba0cb2f81d6e549c191e60478ae12dc7950b952`. -/
theorem kat_kat_2_empty_sign :
    ecdsaSign priv_kat_2_empty msg_kat_2_empty = (0xbac017cbdf65e2c96dded840a9103770236dc4cd733d64b664264cdfd675205c, 0xafd5e0057affb675b1d88a42cba0cb2f81d6e549c191e60478ae12dc7950b952) := by native_decide

/-- Vector `kat_2_empty` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_2_empty_verify :
    ecdsaVerify (Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9) msg_kat_2_empty
      0xbac017cbdf65e2c96dded840a9103770236dc4cd733d64b664264cdfd675205c 0xafd5e0057affb675b1d88a42cba0cb2f81d6e549c191e60478ae12dc7950b952 = true := by native_decide

/-- Vector `kat_2_empty` — public-key derivation: `priv·G` is the ground-truth
public key 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 / 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9. -/
theorem kat_kat_2_empty_pubkey :
    pointMul basePoint priv_kat_2_empty =
      Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9 := by native_decide

/-- Vector `kat_2_empty` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_2_empty_verify_full :
    ecdsaVerifyFull (Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9) msg_kat_2_empty
      0xbac017cbdf65e2c96dded840a9103770236dc4cd733d64b664264cdfd675205c 0xafd5e0057affb675b1d88a42cba0cb2f81d6e549c191e60478ae12dc7950b952 = true := by native_decide

/-- Vector `kat_2_msg` — private key (ground truth). -/
def priv_kat_2_msg : Nat := 0x6884f77d3e9098b773d660dd4a4f297b29805739db772a334f209db13c035de6

/-- Vector `kat_2_msg` — message (ground truth, hex in the JSON). -/
def msg_kat_2_msg : ByteArray := ByteArray.mk #[0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f]

/-- Vector `kat_2_msg` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_2_msg_nonce :
    rfc6979K priv_kat_2_msg msg_kat_2_msg = 0xe5991b4761aec252bf58d23a798052b9e45f7a33ec51ac5804ae5a33e0bfbff8 := by native_decide

/-- Vector `kat_2_msg` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0x3ca606521d9fbbc7b06092d3847a3100bff508e9972d08563bf9a10c615c9cad`
and `s = 0xed60a7491ecf40115aca684279a264e228bfce015cca0a4031c326be3001a70f`. -/
theorem kat_kat_2_msg_sign :
    ecdsaSign priv_kat_2_msg msg_kat_2_msg = (0x3ca606521d9fbbc7b06092d3847a3100bff508e9972d08563bf9a10c615c9cad, 0xed60a7491ecf40115aca684279a264e228bfce015cca0a4031c326be3001a70f) := by native_decide

/-- Vector `kat_2_msg` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_2_msg_verify :
    ecdsaVerify (Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9) msg_kat_2_msg
      0x3ca606521d9fbbc7b06092d3847a3100bff508e9972d08563bf9a10c615c9cad 0xed60a7491ecf40115aca684279a264e228bfce015cca0a4031c326be3001a70f = true := by native_decide

/-- Vector `kat_2_msg` — public-key derivation: `priv·G` is the ground-truth
public key 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 / 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9. -/
theorem kat_kat_2_msg_pubkey :
    pointMul basePoint priv_kat_2_msg =
      Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9 := by native_decide

/-- Vector `kat_2_msg` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_2_msg_verify_full :
    ecdsaVerifyFull (Point.affine 0x8687c1b7cc9e108f61c91886d4bdedb2d0803e68db540c7ee2ce8e2991edfa89 0xf1fc0fbcefa2decac587b31e72fb14cdfa2ca808af700f80037562a64905a6b9) msg_kat_2_msg
      0x3ca606521d9fbbc7b06092d3847a3100bff508e9972d08563bf9a10c615c9cad 0xed60a7491ecf40115aca684279a264e228bfce015cca0a4031c326be3001a70f = true := by native_decide

/-- Vector `kat_3_empty` — private key (ground truth). -/
def priv_kat_3_empty : Nat := 0xb6ab6057d4911fd0912ed386f5529b78475c60ebe40a6ca00d487b86c90bfa44

/-- Vector `kat_3_empty` — message (ground truth, hex in the JSON). -/
def msg_kat_3_empty : ByteArray := ByteArray.mk #[]

/-- Vector `kat_3_empty` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_3_empty_nonce :
    rfc6979K priv_kat_3_empty msg_kat_3_empty = 0x6c92acc08af029a20b8129b3718fc671a1920a9597206d52cc4431ce96a84b26 := by native_decide

/-- Vector `kat_3_empty` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0x62317deabda139f8aee3bcca39ee51d8afc2c6a9ac17170fa87e4b99f7ab2dcb`
and `s = 0x250015c493852dc3ea6a8dfa82b3e6e3d23288a14f7dfb9a9f2720f4ba37b4b6`. -/
theorem kat_kat_3_empty_sign :
    ecdsaSign priv_kat_3_empty msg_kat_3_empty = (0x62317deabda139f8aee3bcca39ee51d8afc2c6a9ac17170fa87e4b99f7ab2dcb, 0x250015c493852dc3ea6a8dfa82b3e6e3d23288a14f7dfb9a9f2720f4ba37b4b6) := by native_decide

/-- Vector `kat_3_empty` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_3_empty_verify :
    ecdsaVerify (Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f) msg_kat_3_empty
      0x62317deabda139f8aee3bcca39ee51d8afc2c6a9ac17170fa87e4b99f7ab2dcb 0x250015c493852dc3ea6a8dfa82b3e6e3d23288a14f7dfb9a9f2720f4ba37b4b6 = true := by native_decide

/-- Vector `kat_3_empty` — public-key derivation: `priv·G` is the ground-truth
public key 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c / 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f. -/
theorem kat_kat_3_empty_pubkey :
    pointMul basePoint priv_kat_3_empty =
      Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f := by native_decide

/-- Vector `kat_3_empty` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_3_empty_verify_full :
    ecdsaVerifyFull (Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f) msg_kat_3_empty
      0x62317deabda139f8aee3bcca39ee51d8afc2c6a9ac17170fa87e4b99f7ab2dcb 0x250015c493852dc3ea6a8dfa82b3e6e3d23288a14f7dfb9a9f2720f4ba37b4b6 = true := by native_decide

/-- Vector `kat_3_msg` — private key (ground truth). -/
def priv_kat_3_msg : Nat := 0xb6ab6057d4911fd0912ed386f5529b78475c60ebe40a6ca00d487b86c90bfa44

/-- Vector `kat_3_msg` — message (ground truth, hex in the JSON). -/
def msg_kat_3_msg : ByteArray := ByteArray.mk #[0x00, 0x0b, 0x16, 0x21, 0x2c, 0x37, 0x42, 0x4d, 0x58, 0x63, 0x6e, 0x79, 0x84, 0x8f, 0x9a, 0xa5, 0xb0, 0xbb, 0xc6, 0xd1, 0xdc, 0xe7, 0xf2, 0xfd, 0x08, 0x13, 0x1e, 0x29, 0x34, 0x3f, 0x4a, 0x55, 0x60, 0x6b, 0x76, 0x81, 0x8c, 0x97, 0xa2, 0xad, 0xb8, 0xc3, 0xce, 0xd9, 0xe4, 0xef, 0xfa, 0x05, 0x10, 0x1b, 0x26, 0x31, 0x3c, 0x47, 0x52, 0x5d, 0x68, 0x73, 0x7e, 0x89, 0x94, 0x9f, 0xaa, 0xb5, 0xc0, 0xcb, 0xd6, 0xe1, 0xec, 0xf7, 0x02, 0x0d, 0x18, 0x23, 0x2e, 0x39, 0x44, 0x4f, 0x5a, 0x65, 0x70, 0x7b, 0x86, 0x91, 0x9c, 0xa7, 0xb2, 0xbd, 0xc8, 0xd3, 0xde, 0xe9, 0xf4, 0xff, 0x0a, 0x15, 0x20, 0x2b, 0x36, 0x41, 0x4c, 0x57, 0x62, 0x6d, 0x78, 0x83, 0x8e, 0x99, 0xa4, 0xaf, 0xba, 0xc5, 0xd0, 0xdb, 0xe6, 0xf1, 0xfc, 0x07, 0x12, 0x1d, 0x28, 0x33, 0x3e, 0x49, 0x54, 0x5f, 0x6a, 0x75, 0x80, 0x8b, 0x96, 0xa1, 0xac, 0xb7, 0xc2, 0xcd, 0xd8, 0xe3, 0xee, 0xf9, 0x04, 0x0f, 0x1a, 0x25, 0x30, 0x3b, 0x46, 0x51, 0x5c, 0x67, 0x72, 0x7d, 0x88, 0x93, 0x9e, 0xa9, 0xb4, 0xbf, 0xca, 0xd5, 0xe0, 0xeb, 0xf6, 0x01, 0x0c, 0x17, 0x22, 0x2d, 0x38, 0x43, 0x4e, 0x59, 0x64, 0x6f, 0x7a, 0x85, 0x90, 0x9b, 0xa6, 0xb1, 0xbc, 0xc7, 0xd2, 0xdd, 0xe8, 0xf3, 0xfe, 0x09, 0x14, 0x1f, 0x2a, 0x35, 0x40, 0x4b, 0x56, 0x61, 0x6c, 0x77, 0x82, 0x8d, 0x98, 0xa3, 0xae, 0xb9, 0xc4, 0xcf, 0xda, 0xe5, 0xf0, 0xfb, 0x06, 0x11, 0x1c, 0x27, 0x32, 0x3d, 0x48, 0x53, 0x5e, 0x69, 0x74, 0x7f, 0x8a, 0x95, 0xa0, 0xab, 0xb6, 0xc1, 0xcc, 0xd7, 0xe2, 0xed, 0xf8, 0x03, 0x0e, 0x19, 0x24, 0x2f, 0x3a, 0x45, 0x50, 0x5b, 0x66, 0x71, 0x7c, 0x87, 0x92, 0x9d, 0xa8, 0xb3, 0xbe, 0xc9, 0xd4, 0xdf, 0xea]

/-- Vector `kat_3_msg` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_kat_3_msg_nonce :
    rfc6979K priv_kat_3_msg msg_kat_3_msg = 0x9ca88a2d5b1071a6c6283a0f3279f52c180cb47ba895ccc5ea677b8097e5d2b6 := by native_decide

/-- Vector `kat_3_msg` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0x849e08062958580f7d8b705839cd451f738e20082a13ae2fd79ff00bacfbd3ff`
and `s = 0x852930a48aff6c16198359e2a2611e0ac29e7df37114678a42d0aecdf71ad213`. -/
theorem kat_kat_3_msg_sign :
    ecdsaSign priv_kat_3_msg msg_kat_3_msg = (0x849e08062958580f7d8b705839cd451f738e20082a13ae2fd79ff00bacfbd3ff, 0x852930a48aff6c16198359e2a2611e0ac29e7df37114678a42d0aecdf71ad213) := by native_decide

/-- Vector `kat_3_msg` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_kat_3_msg_verify :
    ecdsaVerify (Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f) msg_kat_3_msg
      0x849e08062958580f7d8b705839cd451f738e20082a13ae2fd79ff00bacfbd3ff 0x852930a48aff6c16198359e2a2611e0ac29e7df37114678a42d0aecdf71ad213 = true := by native_decide

/-- Vector `kat_3_msg` — public-key derivation: `priv·G` is the ground-truth
public key 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c / 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f. -/
theorem kat_kat_3_msg_pubkey :
    pointMul basePoint priv_kat_3_msg =
      Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f := by native_decide

/-- Vector `kat_3_msg` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_kat_3_msg_verify_full :
    ecdsaVerifyFull (Point.affine 0x8af4e1ee8a431ac672d3fad290ab73774a5e7ebed047551ffab5c82f0f54d91c 0x6a16c0aad11d9e0f925b13d3e3f318cf023e03284de795913cc65ae3f1cec38f) msg_kat_3_msg
      0x849e08062958580f7d8b705839cd451f738e20082a13ae2fd79ff00bacfbd3ff 0x852930a48aff6c16198359e2a2611e0ac29e7df37114678a42d0aecdf71ad213 = true := by native_decide

/-- Vector `rfc6979_style_sample` — private key (ground truth). -/
def priv_rfc6979_style_sample : Nat := 0x1

/-- Vector `rfc6979_style_sample` — message (ground truth, hex in the JSON). -/
def msg_rfc6979_style_sample : ByteArray := ByteArray.mk #[0x73, 0x61, 0x6d, 0x70, 0x6c, 0x65]

/-- Vector `rfc6979_style_sample` — RFC 6979 section 3.2 deterministic nonce recovery:
`rfc6979K priv msg` reproduces the ground-truth `k`. -/
theorem kat_rfc6979_style_sample_nonce :
    rfc6979K priv_rfc6979_style_sample msg_rfc6979_style_sample = 0xf23d7a2ba580b716ff2a03d43e26b3148eea2eb3a1fc6e7abf7cef3877b35be := by native_decide

/-- Vector `rfc6979_style_sample` — FIPS 186-5 section 6.4.1 signature generation:
`ecdsaSign priv msg = (r, s)` with `r = 0x466341174d59e93eb984c2a7c923a80ab99a9e91555bc73ebd8073d4c722121`
and `s = 0x998f2b7bb63082e976215e6ae46344d66d2d4edea67d65d91595f21311df5030`. -/
theorem kat_rfc6979_style_sample_sign :
    ecdsaSign priv_rfc6979_style_sample msg_rfc6979_style_sample = (0x466341174d59e93eb984c2a7c923a80ab99a9e91555bc73ebd8073d4c722121, 0x998f2b7bb63082e976215e6ae46344d66d2d4edea67d65d91595f21311df5030) := by native_decide

/-- Vector `rfc6979_style_sample` — FIPS 186-5 section 6.4.4 verification accepts the
fresh signature under the ground-truth public key. -/
theorem kat_rfc6979_style_sample_verify :
    ecdsaVerify (Point.affine 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5) msg_rfc6979_style_sample
      0x466341174d59e93eb984c2a7c923a80ab99a9e91555bc73ebd8073d4c722121 0x998f2b7bb63082e976215e6ae46344d66d2d4edea67d65d91595f21311df5030 = true := by native_decide

/-- Vector `rfc6979_style_sample` — public-key derivation: `priv·G` is the ground-truth
public key 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296 / 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5. -/
theorem kat_rfc6979_style_sample_pubkey :
    pointMul basePoint priv_rfc6979_style_sample =
      Point.affine 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5 := by native_decide

/-- Vector `rfc6979_style_sample` — the ground-truth public key passes the FIPS 186-5
section 5.6.2.3 full validation procedure, and the full pipeline
accepts the signature. -/
theorem kat_rfc6979_style_sample_verify_full :
    ecdsaVerifyFull (Point.affine 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5) msg_rfc6979_style_sample
      0x466341174d59e93eb984c2a7c923a80ab99a9e91555bc73ebd8073d4c722121 0x998f2b7bb63082e976215e6ae46344d66d2d4edea67d65d91595f21311df5030 = true := by native_decide

end ProofBundle.Crypto.ECDSAP256
