/-
# RFC 8032 Ed25519 — Executable Specification in Lean 4

This file is a complete, executable, dependency-free (Lean core + `Std`
only; no Mathlib) formalization of the Ed25519 signature scheme as
specified in

  S. Josefsson, I. Liusvaara, "Edwards-Curve Digital Signature Algorithm
  (EdDSA)", RFC 8032, January 2017,

together with a from-scratch implementation of SHA-512 as specified in

  NIST FIPS PUB 180-4, "Secure Hash Standard (SHS)", August 2015,

because Ed25519 is defined over SHA-512 (RFC 8032 section 5.1) and not
over SHA-256.

Because only `Std` is imported, there is no `ZMod p` available: all field
arithmetic for GF(p) with p = 2^255 - 19 is implemented directly on `Nat`
with explicit reduction modulo `p`, and all scalar arithmetic is on `Nat`
with explicit reduction modulo the group order `L`.

Every curve constant (`p`, `d`, `I`, `Bx`, `By`, `L`) is quoted verbatim
from the project ground-truth file `ground_truth.json`, whose values were
dual-verified against OpenSSL and an independent pure-Python model.  The
SHA-512 constants (the eighty round constants `K` of FIPS 180-4 section
4.2.3 and the eight initial hash values `H0` of section
5.3.5) were regenerated from first principles: the fractional parts of the
cube roots (respectively square roots) of the first eighty (respectively
eight) primes.  Each constant carries a comment recording the prime and
the exact derivation, so the whole table can be regenerated and audited.
The tables were cross-checked against `hashlib.sha512` via the known
answer tests in `Ed25519Theorems.lean` (including the FIPS 180-4 "abc",
empty-string and 896-bit examples).

Companion files:

  * `Ed25519Theorems.lean` — known-answer tests: three SHA-512 FIPS
    examples, all sixteen ground-truth signature vectors (public key
    derivation, signing, and verification acceptance), and curve sanity
    theorems (base point on the curve, `L * B = identity`, the
    `d = -121665/121666` relation, `I^2 = -1`).  No `sorry`, no `admit`,
    no `axiom`.
  * `Ed25519Hostile.lean` — twenty-two adversarial verification cases
    (bit flips, non-canonical scalars, small-order points, truncation,
    cross-vector confusion, ...) with their expected verdicts.

Layout of this file:

  * section 1: 64-bit word operations (FIPS 180-4 sections 3.2 and 4.1.3);
  * section 2: the SHA-512 round constants `K` (FIPS 180-4 section 4.2.3);
  * section 3: the SHA-512 initial hash value `H0` (FIPS 180-4 section
    4.2.3);
  * section 4: the SHA-512 message schedule (FIPS 180-4 section 6.4.2);
  * section 5: the SHA-512 compression function (FIPS 180-4 section
    6.4.2);
  * section 6: SHA-512 padding (FIPS 180-4 section 5.1.2: 1024-bit
    blocks, 128-bit length field);
  * section 7: block iteration and the top-level `sha512`;
  * section 8: hexadecimal utilities (local, dependency-free);
  * section 9: the Ed25519 field GF(2^255 - 19) on `Nat`;
  * section 10: the twisted Edwards curve and point arithmetic (RFC 8032
    section 3 and appendix A.1);
  * section 11: point and integer encodings (RFC 8032 sections 5.1.2 and
    3);
  * section 12: decoding predicates (canonicality, on-curve, small
    order);
  * section 13: key generation, signing and verification (RFC 8032
    sections 5.1.4, 5.1.5, 5.1.6 and 5.1.7).

Implementation notes:

  * `UInt64` addition in Lean is two's-complement addition modulo 2^64,
    exactly the "addition modulo 2^64" used throughout FIPS 180-4
    section 2.1 for SHA-512.
  * As in the companion SHA-256 development, right rotation is expanded
    into its defining composition of shifts,
    `ROTR^n(x) = SHR^n(x) OR SHL^(64-n)(x)`, because Lean core does not
    uniformly expose `UInt64.rotateRight`.
  * All message manipulation works on `List UInt8` internally and
    converts from/to `ByteArray` only at the API boundary.
  * Scalar multiplication uses double-and-add with an explicit fuel
    parameter, so every definition is structurally recursive and total;
    the fuel (512) exceeds the bit length of every scalar that arises
    (private scalars < 2^255, verification scalars < 2^253 after
    reduction modulo L < 2^253).
  * Point arithmetic is affine, using the complete addition formulas of
    RFC 8032 appendix A.1 (which are the formulas used by the RFC's own
    reference Python code) with field inversion by Fermat's little
    theorem.  This favours auditability over speed; `native_decide`
    executes it comfortably.
-/

import Std

namespace ProofBundle.Crypto.Ed25519

/-!
## Section 1: 64-bit word operations (FIPS 180-4 sections 3.2 and 4.1.3)

SHA-512 operates on 64-bit words.  The eight logical functions used by the
algorithm are defined in FIPS 180-4 section 4.1.3; all of them are defined
here, one definition per equation of the standard.
-/

/-- Right rotation of a 64-bit word by `n` bits, `ROTR^n(x)` of FIPS 180-4
section 3.2 item 4, expanded into its defining composition of shifts:

  ROTR^n(x) = (x >> n) OR (x << (64 - n))   for 0 < n < 64.

All SHA-512 rotation amounts (1, 6, 8, 14, 18, 19, 28, 34, 39, 41, 61)
satisfy `0 < n < 64`, so the boundary behaviour of the expansion is never
exercised outside its specified domain. -/
def rotr64 (x : UInt64) (n : UInt64) : UInt64 :=
  (UInt64.shiftRight x n) ||| (UInt64.shiftLeft x (64 - n))

/-- Right shift of a 64-bit word by `n` bits, `SHR^n(x)` of FIPS 180-4
section 3.2 item 3. -/
def shr64 (x : UInt64) (n : UInt64) : UInt64 :=
  UInt64.shiftRight x n

/-- The `Ch` ("choose") function of FIPS 180-4 section 4.1.3
(equation 4.9):

  Ch(x, y, z) = (x AND y) XOR ((NOT x) AND z). -/
def ch64 (x y z : UInt64) : UInt64 :=
  (x &&& y) ^^^ ((~~~ x) &&& z)

/-- The `Maj` ("majority") function of FIPS 180-4 section 4.1.3
(equation 4.10):

  Maj(x, y, z) = (x AND y) XOR (x AND z) XOR (y AND z). -/
def maj64 (x y z : UInt64) : UInt64 :=
  (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)

/-- The capital sigma function `Σ0` ("big sigma zero") for SHA-512 of FIPS
180-4 section 4.1.3 (equation 4.11), used in the compression function:

  Σ0(x) = ROTR^28(x) XOR ROTR^34(x) XOR ROTR^39(x). -/
def bigSigma0_512 (x : UInt64) : UInt64 :=
  rotr64 x 28 ^^^ rotr64 x 34 ^^^ rotr64 x 39

/-- The capital sigma function `Σ1` ("big sigma one") for SHA-512 of FIPS
180-4 section 4.1.3 (equation 4.12), used in the compression function:

  Σ1(x) = ROTR^14(x) XOR ROTR^18(x) XOR ROTR^41(x). -/
def bigSigma1_512 (x : UInt64) : UInt64 :=
  rotr64 x 14 ^^^ rotr64 x 18 ^^^ rotr64 x 41

/-- The small sigma function `σ0` for SHA-512 of FIPS 180-4 section 4.1.3
(equation 4.13), used in the message schedule:

  σ0(x) = ROTR^1(x) XOR ROTR^8(x) XOR SHR^7(x). -/
def smallSigma0_512 (x : UInt64) : UInt64 :=
  rotr64 x 1 ^^^ rotr64 x 8 ^^^ shr64 x 7

/-- The small sigma function `σ1` for SHA-512 of FIPS 180-4 section 4.1.3
(equation 4.14), used in the message schedule:

  σ1(x) = ROTR^19(x) XOR ROTR^61(x) XOR SHR^6(x). -/
def smallSigma1_512 (x : UInt64) : UInt64 :=
  rotr64 x 19 ^^^ rotr64 x 61 ^^^ shr64 x 6

/-!
## Section 2: the SHA-512 round constants `K` (FIPS 180-4 section 4.2.3)

The eighty 64-bit words `K[0] .. K[79]` represent the first 64 bits of the
fractional parts of the cube roots of the first eighty prime numbers:

  K[t] = floor( frac( p_t ^ (1/3) ) * 2^64 ),   p_t = t-th prime (0-indexed).

Every word below carries a comment recording the prime it is derived from,
so the whole table can be regenerated and audited.  All 80 values were
regenerated from the primes and cross-checked against a reference SHA-512
implementation (the FIPS 180-4 appendix D known-answer tests in
`Ed25519Theorems.lean` pin the full table down functionally).
-/

/-- The 80 round constants of FIPS 180-4 section 4.2.3, in order.
Derivation of each word: `floor(frac(p^(1/3)) * 2^64)` for successive
primes `p = 2, 3, 5, 7, ..., 409`. -/
def K512 : Array UInt64 := #[
  -- K[ 0]: prime   2.  floor(frac(2^(1/3)) * 2^64) = 0x428a2f98d728ae22 = 4794697086780616226.
  0x428a2f98d728ae22,
  -- K[ 1]: prime   3.  floor(frac(3^(1/3)) * 2^64) = 0x7137449123ef65cd = 8158064640168781261.
  0x7137449123ef65cd,
  -- K[ 2]: prime   5.  floor(frac(5^(1/3)) * 2^64) = 0xb5c0fbcfec4d3b2f = 13096744586834688815.
  0xb5c0fbcfec4d3b2f,
  -- K[ 3]: prime   7.  floor(frac(7^(1/3)) * 2^64) = 0xe9b5dba58189dbbc = 16840607885511220156.
  0xe9b5dba58189dbbc,
  -- K[ 4]: prime  11.  floor(frac(11^(1/3)) * 2^64) = 0x3956c25bf348b538 = 4131703408338449720.
  0x3956c25bf348b538,
  -- K[ 5]: prime  13.  floor(frac(13^(1/3)) * 2^64) = 0x59f111f1b605d019 = 6480981068601479193.
  0x59f111f1b605d019,
  -- K[ 6]: prime  17.  floor(frac(17^(1/3)) * 2^64) = 0x923f82a4af194f9b = 10538285296894168987.
  0x923f82a4af194f9b,
  -- K[ 7]: prime  19.  floor(frac(19^(1/3)) * 2^64) = 0xab1c5ed5da6d8118 = 12329834152419229976.
  0xab1c5ed5da6d8118,
  -- K[ 8]: prime  23.  floor(frac(23^(1/3)) * 2^64) = 0xd807aa98a3030242 = 15566598209576043074.
  0xd807aa98a3030242,
  -- K[ 9]: prime  29.  floor(frac(29^(1/3)) * 2^64) = 0x12835b0145706fbe = 1334009975649890238.
  0x12835b0145706fbe,
  -- K[10]: prime  31.  floor(frac(31^(1/3)) * 2^64) = 0x243185be4ee4b28c = 2608012711638119052.
  0x243185be4ee4b28c,
  -- K[11]: prime  37.  floor(frac(37^(1/3)) * 2^64) = 0x550c7dc3d5ffb4e2 = 6128411473006802146.
  0x550c7dc3d5ffb4e2,
  -- K[12]: prime  41.  floor(frac(41^(1/3)) * 2^64) = 0x72be5d74f27b896f = 8268148722764581231.
  0x72be5d74f27b896f,
  -- K[13]: prime  43.  floor(frac(43^(1/3)) * 2^64) = 0x80deb1fe3b1696b1 = 9286055187155687089.
  0x80deb1fe3b1696b1,
  -- K[14]: prime  47.  floor(frac(47^(1/3)) * 2^64) = 0x9bdc06a725c71235 = 11230858885718282805.
  0x9bdc06a725c71235,
  -- K[15]: prime  53.  floor(frac(53^(1/3)) * 2^64) = 0xc19bf174cf692694 = 13951009754708518548.
  0xc19bf174cf692694,
  -- K[16]: prime  59.  floor(frac(59^(1/3)) * 2^64) = 0xe49b69c19ef14ad2 = 16472876342353939154.
  0xe49b69c19ef14ad2,
  -- K[17]: prime  61.  floor(frac(61^(1/3)) * 2^64) = 0xefbe4786384f25e3 = 17275323862435702243.
  0xefbe4786384f25e3,
  -- K[18]: prime  67.  floor(frac(67^(1/3)) * 2^64) = 0x0fc19dc68b8cd5b5 = 1135362057144423861.
  0x0fc19dc68b8cd5b5,
  -- K[19]: prime  71.  floor(frac(71^(1/3)) * 2^64) = 0x240ca1cc77ac9c65 = 2597628984639134821.
  0x240ca1cc77ac9c65,
  -- K[20]: prime  73.  floor(frac(73^(1/3)) * 2^64) = 0x2de92c6f592b0275 = 3308224258029322869.
  0x2de92c6f592b0275,
  -- K[21]: prime  79.  floor(frac(79^(1/3)) * 2^64) = 0x4a7484aa6ea6e483 = 5365058923640841347.
  0x4a7484aa6ea6e483,
  -- K[22]: prime  83.  floor(frac(83^(1/3)) * 2^64) = 0x5cb0a9dcbd41fbd4 = 6679025012923562964.
  0x5cb0a9dcbd41fbd4,
  -- K[23]: prime  89.  floor(frac(89^(1/3)) * 2^64) = 0x76f988da831153b5 = 8573033837759648693.
  0x76f988da831153b5,
  -- K[24]: prime  97.  floor(frac(97^(1/3)) * 2^64) = 0x983e5152ee66dfab = 10970295158949994411.
  0x983e5152ee66dfab,
  -- K[25]: prime 101.  floor(frac(101^(1/3)) * 2^64) = 0xa831c66d2db43210 = 12119686244451234320.
  0xa831c66d2db43210,
  -- K[26]: prime 103.  floor(frac(103^(1/3)) * 2^64) = 0xb00327c898fb213f = 12683024718118986047.
  0xb00327c898fb213f,
  -- K[27]: prime 107.  floor(frac(107^(1/3)) * 2^64) = 0xbf597fc7beef0ee4 = 13788192230050041572.
  0xbf597fc7beef0ee4,
  -- K[28]: prime 109.  floor(frac(109^(1/3)) * 2^64) = 0xc6e00bf33da88fc2 = 14330467153632333762.
  0xc6e00bf33da88fc2,
  -- K[29]: prime 113.  floor(frac(113^(1/3)) * 2^64) = 0xd5a79147930aa725 = 15395433587784984357.
  0xd5a79147930aa725,
  -- K[30]: prime 127.  floor(frac(127^(1/3)) * 2^64) = 0x06ca6351e003826f = 489312712824947311.
  0x06ca6351e003826f,
  -- K[31]: prime 131.  floor(frac(131^(1/3)) * 2^64) = 0x142929670a0e6e70 = 1452737877330783856.
  0x142929670a0e6e70,
  -- K[32]: prime 137.  floor(frac(137^(1/3)) * 2^64) = 0x27b70a8546d22ffc = 2861767655752347644.
  0x27b70a8546d22ffc,
  -- K[33]: prime 139.  floor(frac(139^(1/3)) * 2^64) = 0x2e1b21385c26c926 = 3322285676063803686.
  0x2e1b21385c26c926,
  -- K[34]: prime 149.  floor(frac(149^(1/3)) * 2^64) = 0x4d2c6dfc5ac42aed = 5560940570517711597.
  0x4d2c6dfc5ac42aed,
  -- K[35]: prime 151.  floor(frac(151^(1/3)) * 2^64) = 0x53380d139d95b3df = 5996557281743188959.
  0x53380d139d95b3df,
  -- K[36]: prime 157.  floor(frac(157^(1/3)) * 2^64) = 0x650a73548baf63de = 7280758554555802590.
  0x650a73548baf63de,
  -- K[37]: prime 163.  floor(frac(163^(1/3)) * 2^64) = 0x766a0abb3c77b2a8 = 8532644243296465576.
  0x766a0abb3c77b2a8,
  -- K[38]: prime 167.  floor(frac(167^(1/3)) * 2^64) = 0x81c2c92e47edaee6 = 9350256976987008742.
  0x81c2c92e47edaee6,
  -- K[39]: prime 173.  floor(frac(173^(1/3)) * 2^64) = 0x92722c851482353b = 10552545826968843579.
  0x92722c851482353b,
  -- K[40]: prime 179.  floor(frac(179^(1/3)) * 2^64) = 0xa2bfe8a14cf10364 = 11727347734174303076.
  0xa2bfe8a14cf10364,
  -- K[41]: prime 181.  floor(frac(181^(1/3)) * 2^64) = 0xa81a664bbc423001 = 12113106623233404929.
  0xa81a664bbc423001,
  -- K[42]: prime 191.  floor(frac(191^(1/3)) * 2^64) = 0xc24b8b70d0f89791 = 14000437183269869457.
  0xc24b8b70d0f89791,
  -- K[43]: prime 193.  floor(frac(193^(1/3)) * 2^64) = 0xc76c51a30654be30 = 14369950271660146224.
  0xc76c51a30654be30,
  -- K[44]: prime 197.  floor(frac(197^(1/3)) * 2^64) = 0xd192e819d6ef5218 = 15101387698204529176.
  0xd192e819d6ef5218,
  -- K[45]: prime 199.  floor(frac(199^(1/3)) * 2^64) = 0xd69906245565a910 = 15463397548674623760.
  0xd69906245565a910,
  -- K[46]: prime 211.  floor(frac(211^(1/3)) * 2^64) = 0xf40e35855771202a = 17586052441742319658.
  0xf40e35855771202a,
  -- K[47]: prime 223.  floor(frac(223^(1/3)) * 2^64) = 0x106aa07032bbd1b8 = 1182934255886127544.
  0x106aa07032bbd1b8,
  -- K[48]: prime 227.  floor(frac(227^(1/3)) * 2^64) = 0x19a4c116b8d2d0c8 = 1847814050463011016.
  0x19a4c116b8d2d0c8,
  -- K[49]: prime 229.  floor(frac(229^(1/3)) * 2^64) = 0x1e376c085141ab53 = 2177327727835720531.
  0x1e376c085141ab53,
  -- K[50]: prime 233.  floor(frac(233^(1/3)) * 2^64) = 0x2748774cdf8eeb99 = 2830643537854262169.
  0x2748774cdf8eeb99,
  -- K[51]: prime 239.  floor(frac(239^(1/3)) * 2^64) = 0x34b0bcb5e19b48a8 = 3796741975233480872.
  0x34b0bcb5e19b48a8,
  -- K[52]: prime 241.  floor(frac(241^(1/3)) * 2^64) = 0x391c0cb3c5c95a63 = 4115178125766777443.
  0x391c0cb3c5c95a63,
  -- K[53]: prime 251.  floor(frac(251^(1/3)) * 2^64) = 0x4ed8aa4ae3418acb = 5681478168544905931.
  0x4ed8aa4ae3418acb,
  -- K[54]: prime 257.  floor(frac(257^(1/3)) * 2^64) = 0x5b9cca4f7763e373 = 6601373596472566643.
  0x5b9cca4f7763e373,
  -- K[55]: prime 263.  floor(frac(263^(1/3)) * 2^64) = 0x682e6ff3d6b2b8a3 = 7507060721942968483.
  0x682e6ff3d6b2b8a3,
  -- K[56]: prime 269.  floor(frac(269^(1/3)) * 2^64) = 0x748f82ee5defb2fc = 8399075790359081724.
  0x748f82ee5defb2fc,
  -- K[57]: prime 271.  floor(frac(271^(1/3)) * 2^64) = 0x78a5636f43172f60 = 8693463985226723168.
  0x78a5636f43172f60,
  -- K[58]: prime 277.  floor(frac(277^(1/3)) * 2^64) = 0x84c87814a1f0ab72 = 9568029438360202098.
  0x84c87814a1f0ab72,
  -- K[59]: prime 281.  floor(frac(281^(1/3)) * 2^64) = 0x8cc702081a6439ec = 10144078919501101548.
  0x8cc702081a6439ec,
  -- K[60]: prime 283.  floor(frac(283^(1/3)) * 2^64) = 0x90befffa23631e28 = 10430055236837252648.
  0x90befffa23631e28,
  -- K[61]: prime 293.  floor(frac(293^(1/3)) * 2^64) = 0xa4506cebde82bde9 = 11840083180663258601.
  0xa4506cebde82bde9,
  -- K[62]: prime 307.  floor(frac(307^(1/3)) * 2^64) = 0xbef9a3f7b2c67915 = 13761210420658862357.
  0xbef9a3f7b2c67915,
  -- K[63]: prime 311.  floor(frac(311^(1/3)) * 2^64) = 0xc67178f2e372532b = 14299343276471374635.
  0xc67178f2e372532b,
  -- K[64]: prime 313.  floor(frac(313^(1/3)) * 2^64) = 0xca273eceea26619c = 14566680578165727644.
  0xca273eceea26619c,
  -- K[65]: prime 317.  floor(frac(317^(1/3)) * 2^64) = 0xd186b8c721c0c207 = 15097957966210449927.
  0xd186b8c721c0c207,
  -- K[66]: prime 331.  floor(frac(331^(1/3)) * 2^64) = 0xeada7dd6cde0eb1e = 16922976911328602910.
  0xeada7dd6cde0eb1e,
  -- K[67]: prime 337.  floor(frac(337^(1/3)) * 2^64) = 0xf57d4f7fee6ed178 = 17689382322260857208.
  0xf57d4f7fee6ed178,
  -- K[68]: prime 347.  floor(frac(347^(1/3)) * 2^64) = 0x06f067aa72176fba = 500013540394364858.
  0x06f067aa72176fba,
  -- K[69]: prime 349.  floor(frac(349^(1/3)) * 2^64) = 0x0a637dc5a2c898a6 = 748580250866718886.
  0x0a637dc5a2c898a6,
  -- K[70]: prime 353.  floor(frac(353^(1/3)) * 2^64) = 0x113f9804bef90dae = 1242879168328830382.
  0x113f9804bef90dae,
  -- K[71]: prime 359.  floor(frac(359^(1/3)) * 2^64) = 0x1b710b35131c471b = 1977374033974150939.
  0x1b710b35131c471b,
  -- K[72]: prime 367.  floor(frac(367^(1/3)) * 2^64) = 0x28db77f523047d84 = 2944078676154940804.
  0x28db77f523047d84,
  -- K[73]: prime 373.  floor(frac(373^(1/3)) * 2^64) = 0x32caab7b40c72493 = 3659926193048069267.
  0x32caab7b40c72493,
  -- K[74]: prime 379.  floor(frac(379^(1/3)) * 2^64) = 0x3c9ebe0a15c9bebc = 4368137639120453308.
  0x3c9ebe0a15c9bebc,
  -- K[75]: prime 383.  floor(frac(383^(1/3)) * 2^64) = 0x431d67c49c100d4c = 4836135668995329356.
  0x431d67c49c100d4c,
  -- K[76]: prime 389.  floor(frac(389^(1/3)) * 2^64) = 0x4cc5d4becb3e42b6 = 5532061633213252278.
  0x4cc5d4becb3e42b6,
  -- K[77]: prime 397.  floor(frac(397^(1/3)) * 2^64) = 0x597f299cfc657e2a = 6448918945643986474.
  0x597f299cfc657e2a,
  -- K[78]: prime 401.  floor(frac(401^(1/3)) * 2^64) = 0x5fcb6fab3ad6faec = 6902733635092675308.
  0x5fcb6fab3ad6faec,
  -- K[79]: prime 409.  floor(frac(409^(1/3)) * 2^64) = 0x6c44198c4a475817 = 7801388544844847127.
  0x6c44198c4a475817
]
/-!
## Section 3: the SHA-512 initial hash value `H0` (FIPS 180-4
section 5.3.5)

The eight 64-bit words `H0[0] .. H0[7]` are the first 64 bits of the
fractional parts of the square roots of the first eight primes
2, 3, 5, 7, 11, 13, 17, 19:

  H0[i] = floor( frac( p_i ^ (1/2) ) * 2^64 ).
-/

/-- The eight initial hash words of FIPS 180-4 section 5.3.5, in order,
each with its generating prime recorded. -/
def H0512 : Array UInt64 := #[
  -- H0[0]: prime  2.  floor(frac(2^(1/2)) * 2^64) = 0x6a09e667f3bcc908 = 7640891576956012808.
  0x6a09e667f3bcc908,
  -- H0[1]: prime  3.  floor(frac(3^(1/2)) * 2^64) = 0xbb67ae8584caa73b = 13503953896175478587.
  0xbb67ae8584caa73b,
  -- H0[2]: prime  5.  floor(frac(5^(1/2)) * 2^64) = 0x3c6ef372fe94f82b = 4354685564936845355.
  0x3c6ef372fe94f82b,
  -- H0[3]: prime  7.  floor(frac(7^(1/2)) * 2^64) = 0xa54ff53a5f1d36f1 = 11912009170470909681.
  0xa54ff53a5f1d36f1,
  -- H0[4]: prime 11.  floor(frac(11^(1/2)) * 2^64) = 0x510e527fade682d1 = 5840696475078001361.
  0x510e527fade682d1,
  -- H0[5]: prime 13.  floor(frac(13^(1/2)) * 2^64) = 0x9b05688c2b3e6c1f = 11170449401992604703.
  0x9b05688c2b3e6c1f,
  -- H0[6]: prime 17.  floor(frac(17^(1/2)) * 2^64) = 0x1f83d9abfb41bd6b = 2270897969802886507.
  0x1f83d9abfb41bd6b,
  -- H0[7]: prime 19.  floor(frac(19^(1/2)) * 2^64) = 0x5be0cd19137e2179 = 6620516959819538809.
  0x5be0cd19137e2179
]

/-- The initial hash state has exactly eight words, one for each of the
working variables a..h (FIPS 180-4 section 6.4.2). -/
theorem H0512_size : H0512.size = 8 := rfl

/-- The SHA-512 hash state: eight 64-bit working variables
`a, b, c, d, e, f, g, h` (FIPS 180-4 section 6.4.2, step 2), represented
as a function from `Fin 8` to `UInt64` so that indexing is total and
statically bounds-checked.  Index 0 is `a`, ..., index 7 is `h`. -/
abbrev State512 := Fin 8 → UInt64

/-- The initial state of the SHA-512 computation: the eight words of
`H0512` (FIPS 180-4 section 6.4.1: "Set the initial hash value, H(0)"). -/
def initState512 : State512 :=
  fun i => H0512.get! i.val

/-!
## Section 4: the SHA-512 message schedule (FIPS 180-4 section 6.4.2,
step 1)

Each 1024-bit message block is viewed as sixteen 64-bit big-endian words
`W[0] .. W[15]`, and then expanded to eighty words by the recurrence

  W[t] = σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16],   16 ≤ t ≤ 79,

where `+` is addition modulo 2^64 and `σ0`, `σ1` are the small sigma
functions of section 4.1.3.
-/

/-- Assemble eight bytes into one 64-bit word, most significant byte first
(FIPS 180-4 section 3.1: "the left-most bit ... is the most significant
bit"). -/
def bytesToWord64 (b0 b1 b2 b3 b4 b5 b6 b7 : UInt8) : UInt64 :=
  (UInt64.shiftLeft b0.toUInt64 56) |||
  (UInt64.shiftLeft b1.toUInt64 48) |||
  (UInt64.shiftLeft b2.toUInt64 40) |||
  (UInt64.shiftLeft b3.toUInt64 32) |||
  (UInt64.shiftLeft b4.toUInt64 24) |||
  (UInt64.shiftLeft b5.toUInt64 16) |||
  (UInt64.shiftLeft b6.toUInt64 8) |||
  b7.toUInt64

/-- The SHA-512 message schedule of FIPS 180-4 section 6.4.2, step 1.  The
input is one 128-byte message block; the output is the array of eighty
words `W[t]`.  Because the loop bounds are the literals 16 and 80, every
`get!` below is in bounds by construction. -/
def schedule512 (block : Array UInt8) : Array UInt64 := Id.run do
  let mut w : Array UInt64 := Array.mkEmpty 80
  -- W[0..15]: the block itself, read as sixteen big-endian 64-bit words.
  for i in [0:16] do
    let j := 8 * i
    w := w.push (bytesToWord64 (block.get! j) (block.get! (j + 1))
      (block.get! (j + 2)) (block.get! (j + 3)) (block.get! (j + 4))
      (block.get! (j + 5)) (block.get! (j + 6)) (block.get! (j + 7)))
  -- W[16..79]: the recurrence
  --   W[t] = σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16].
  for t in [16:80] do
    let s1 := smallSigma1_512 (w.get! (t - 2))
    let s0 := smallSigma0_512 (w.get! (t - 15))
    w := w.push (s1 + w.get! (t - 7) + s0 + w.get! (t - 16))
  return w

/-!
## Section 5: the SHA-512 compression function (FIPS 180-4 section 6.4.2)

The compression function transforms the hash state by eighty rounds, one
per schedule word and round constant.  Round `t` computes

  T1 = h + Σ1(e) + Ch(e, f, g) + K[t] + W[t]
  T2 = Σ0(a) + Maj(a, b, c)

and updates the working variables by

  h := g,  g := f,  f := e,  e := d + T1,
  d := c,  c := b,  b := a,  a := T1 + T2,

all additions being addition modulo 2^64.
-/

/-- One round of the SHA-512 compression function (FIPS 180-4 section
6.4.2, step 3).  `round512 st k w` performs a single round with round
constant `k = K[t]` and schedule word `w = W[t]`.  The update is written
out variable by variable so that each round is explicitly auditable
against the standard. -/
def round512 (st : State512) (k w : UInt64) : State512 :=
  let a := st 0
  let b := st 1
  let c := st 2
  let d := st 3
  let e := st 4
  let f := st 5
  let g := st 6
  let h := st 7
  let t1 := h + bigSigma1_512 e + ch64 e f g + k + w
  let t2 := bigSigma0_512 a + maj64 a b c
  fun i =>
    if i = 0 then t1 + t2        -- new a := T1 + T2
    else if i = 1 then a         -- new b := a
    else if i = 2 then b         -- new c := b
    else if i = 3 then c         -- new d := c
    else if i = 4 then d + t1    -- new e := d + T1
    else if i = 5 then e         -- new f := e
    else if i = 6 then f         -- new g := f
    else g                       -- new h := g

/-- The full SHA-512 compression function of FIPS 180-4 section 6.4.2,
steps 2-4: fold all eighty rounds over the message schedule of the block,
then add the resulting working variables back into the incoming hash state
word by word (the feed-forward).  The 80-round fold is an explicit loop
over `t` in `[0, 80)`, so that the number of rounds is directly
auditable. -/
def compress512 (st : State512) (block : Array UInt8) : State512 :=
  let w := schedule512 block
  Id.run do
    let mut s := st
    -- The 80-round fold: rounds 0 through 79, one per K[t], W[t].
    for t in [0:80] do
      s := round512 s (K512.get! t) (w.get! t)
    -- Feed-forward: H(i)_j = H(i-1)_j + working variable j (mod 2^64).
    return fun i => s i + st i

/-!
## Section 6: SHA-512 padding (FIPS 180-4 section 5.1.2)

Given a message of length `L` bits (here `L = 8 * m.length` for a byte
list `m`), append the bit `1` (the byte `0x80`), then `k` zero bits where
`k` is the smallest non-negative solution of `L + 1 + k ≡ 896 (mod 1024)`,
then the **128-bit** big-endian representation of `L`.  Since our messages
are byte strings, whole zero bytes are appended.
-/

/-- The number of zero bytes appended between the `0x80` delimiter and the
128-bit length field when padding a message of `n` bytes (FIPS 180-4
section 5.1.2).  Chosen so that `n + 1 + padZeros512 n + 16 ≡ 0 (mod
128)`; equivalently `padZeros512 n` is the unique value in `[0, 128)` with
`n + 17 + padZeros512 n` divisible by 128. -/
def padZeros512 (n : Nat) : Nat :=
  (128 - (n + 17) % 128) % 128

/-- The 128-bit big-endian representation of the bit length, as a list of
sixteen bytes (FIPS 180-4 section 5.1.2: "append the 128-bit block that is
equal to the number L written using the binary representation").  Only the
low 128 bits of `n` are represented; byte `i` of the result is
`(n / 2^(8*(15-i))) mod 256`. -/
def natToBe128 (n : Nat) : List UInt8 :=
  (List.range 16).map (fun i => UInt8.ofNat (n / 2^(8 * (15 - i))))

/-- The padded message, as a list of bytes (FIPS 180-4 section 5.1.2):
the message, then `0x80`, then `padZeros512` zero bytes, then the 128-bit
big-endian bit length.  Its length is always a multiple of 128. -/
def padList512 (m : List UInt8) : List UInt8 :=
  m ++ [0x80] ++ List.replicate (padZeros512 m.length) 0x00 ++ natToBe128 (m.length * 8)

/-- Padding lifted to `ByteArray` (FIPS 180-4 section 5.1.2). -/
def pad512 (m : ByteArray) : ByteArray :=
  ByteArray.mk (Array.mk (padList512 m.data.toList))

/-!
## Section 7: block iteration and the top-level hash (FIPS 180-4
section 6.4)
-/

/-- Auxiliary block iteration with an explicit fuel parameter (structural
recursion, no well-founded-termination proof needed).  Each iteration
consumes one 128-byte block; the fuel computed in `hashBlocks512` below
always suffices for a fully padded message. -/
def hashBlocks512Aux (st : State512) (fuel : Nat) (bytes : List UInt8) : State512 :=
  match fuel with
  | 0 => st
  | fuel + 1 =>
    match bytes with
    | [] => st
    | _ =>
      let block := Array.mk (bytes.take 128)
      hashBlocks512Aux (compress512 st block) fuel (bytes.drop 128)

/-- Iterate the SHA-512 compression function over the (padded) message,
one 128-byte block at a time (FIPS 180-4 section 6.4.2: the message blocks
`M(1)` through `M(N)` "are processed in order"). -/
def hashBlocks512 (st : State512) (bytes : List UInt8) : State512 :=
  hashBlocks512Aux st (bytes.length / 128 + 1) bytes

/-- Serialise one 64-bit word as eight bytes, most significant byte first
(FIPS 180-4 section 6.4.2 final step). -/
def wordToBytes64 (w : UInt64) : List UInt8 :=
  [ ((UInt64.shiftRight w 56) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 48) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 40) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 32) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 24) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 16) &&& 0xff).toUInt8,
    ((UInt64.shiftRight w 8) &&& 0xff).toUInt8,
    (w &&& 0xff).toUInt8 ]

/-- Serialise the final SHA-512 hash state as 64 bytes: the concatenation
of the eight words `H(N)_0 .. H(N)_7`, each written big-endian (FIPS 180-4
section 6.4.2: the 512-bit message digest). -/
def stateToBytes512 (st : State512) : List UInt8 :=
  wordToBytes64 (st 0) ++ wordToBytes64 (st 1) ++ wordToBytes64 (st 2) ++
  wordToBytes64 (st 3) ++ wordToBytes64 (st 4) ++ wordToBytes64 (st 5) ++
  wordToBytes64 (st 6) ++ wordToBytes64 (st 7)

/-- The serialised SHA-512 state has exactly 64 bytes, one eight-byte
big-endian word per working variable. -/
theorem stateToBytes512_length (st : State512) :
    (stateToBytes512 st).length = 64 := rfl

/-- The SHA-512 hash of a message, as a 64-byte `ByteArray` (FIPS 180-4
section 6.4).  This is the full top-level algorithm: pad, iterate the
compression function over all 1024-bit blocks starting from `H0512`, and
serialise the final state. -/
def sha512 (m : ByteArray) : ByteArray :=
  ByteArray.mk (Array.mk (stateToBytes512 (hashBlocks512 initState512 (padList512 m.data.toList))))

/-- SHA-512 always produces exactly 64 bytes of output, for every input
(FIPS 180-4: a 512-bit message digest). -/
theorem sha512_output_length (m : ByteArray) : (sha512 m).size = 64 := by
  show (stateToBytes512 (hashBlocks512 initState512 (padList512 m.data.toList))).length = 64
  exact stateToBytes512_length _

/-- Unfolding form of `sha512_output_length`: the digest length does not
depend on the message. -/
theorem sha512_size (m : ByteArray) :
    (sha512 m).size = (stateToBytes512 initState512).length := by
  rw [sha512_output_length, stateToBytes512_length]

/-!
## Section 8: hexadecimal utilities (local, dependency-free)

Test vectors are conventionally written as hex strings.  These helpers
encode bytes to lowercase hex and decode hex strings to bytes, so that the
theorem files can state vectors in their published form.
-/

/-- The hexadecimal digit for a nibble value; values above 15 do not occur
in the uses below but map to `'x'` so the function is total. -/
def nibbleChar (n : Nat) : Char :=
  match n with
  | 0 => '0' | 1 => '1' | 2 => '2' | 3 => '3' | 4 => '4'
  | 5 => '5' | 6 => '6' | 7 => '7' | 8 => '8' | 9 => '9'
  | 10 => 'a' | 11 => 'b' | 12 => 'c' | 13 => 'd' | 14 => 'e' | 15 => 'f'
  | _ => 'x'

/-- The two lowercase hexadecimal characters of one byte, high nibble
first. -/
def byteToHex (b : UInt8) : List Char :=
  [ nibbleChar (UInt8.shiftRight b 4).toNat, nibbleChar (b &&& 0x0f).toNat ]

/-- Lowercase hex encoding of a byte string. -/
def hexEncode (b : ByteArray) : String :=
  String.ofList (b.data.toList.flatMap byteToHex)

/-- The numeric value of a hexadecimal digit (both upper- and lowercase
accepted); other characters map to 0 so the function is total. -/
def hexVal (c : Char) : Nat :=
  let n := c.toNat
  if 48 <= n && n <= 57 then n - 48        -- '0'..'9'
  else if 97 <= n && n <= 102 then n - 87  -- 'a'..'f'
  else if 65 <= n && n <= 70 then n - 55   -- 'A'..'F'
  else 0

/-- Decode an even-length hexadecimal string to a byte list, two
characters per byte, high nibble first.  Odd-length tails are
discarded. -/
def hexDecodeAux : List Char → List UInt8
  | c1 :: c2 :: rest => (hexVal c1 * 16 + hexVal c2).toUInt8 :: hexDecodeAux rest
  | _ => []

/-- Decode a hexadecimal string to a `ByteArray`. -/
def hexDecode (s : String) : ByteArray :=
  ByteArray.mk (Array.mk (hexDecodeAux s.toList))

/-- Convenience: SHA-512 of the UTF-8 encoding of a string, rendered as a
lowercase hex string.  This is the form in which the FIPS 180-4 example
digests are stated. -/
def sha512Hex (s : String) : String :=
  hexEncode (sha512 s.toUTF8)

/-!
## Section 9: the field GF(2^255 - 19) on `Nat` (RFC 8032 section 3)

Ed25519 is defined over the finite field GF(p) with

  p = 2^255 - 19

(RFC 8032 section 3, first paragraph).  Since only `Std` is imported,
field elements are represented as `Nat` values in `[0, p)` and every
operation reduces explicitly modulo `p`.
-/

/-- The field modulus `p = 2^255 - 19` (RFC 8032 section 3).  Value from
the ground truth; check: `2^255 - 19 = p` holds by computation. -/
def p : Nat := 57896044618658097711785492504343953926634992332820282019728792003956564819949

/-- The modulus is indeed `2^255 - 19` (RFC 8032 section 3). -/
theorem p_eq : p = 2^255 - 19 := by native_decide

/-- The non-square `-1` square root `I = 2^((p-1)/4) mod p` of RFC 8032
section 3 ("`sqrt(-1)`"), used to recover `x` from `y` during point
decoding.  Value from the ground truth. -/
def I : Nat := 19681161376707505956807079304988542015446066515923890162744021073123829784752

/-- The Edwards curve parameter `d = -121665/121666 (mod p)` of RFC 8032
section 3.  Value from the ground truth. -/
def d : Nat := 37095705934669439343138083508754565189542113879843219016388785533085940283555

/-- The order `L` of the prime-order subgroup generated by the base point
(RFC 8032 section 3: "`L = 2^252 + 27742317777372353535851937790883648493`").
Value from the ground truth. -/
def L : Nat := 7237005577332262213973186563042994240857116359379907606001950938285454250989

/-- The x-coordinate of the base point `B` (RFC 8032 section 3).
Value from the ground truth. -/
def Bx : Nat := 15112221349535400772501151409588531511454012693041857206046113283949847762202

/-- The y-coordinate of the base point `B` (RFC 8032 section 3: it is
`4/5 mod p`).  Value from the ground truth. -/
def By : Nat := 46316835694926478169428394003475163141307993866256225615783033603165251855960

/-- Field addition `(a + b) mod p`.  All inputs are treated as residue
classes; the result is always in `[0, p)`. -/
def fadd (a b : Nat) : Nat := (a + b) % p

/-- Field subtraction `(a - b) mod p`, computed as `(a%p + p - b%p) % p`
so that no truncated natural subtraction can occur. -/
def fsub (a b : Nat) : Nat := (a % p + p - b % p) % p

/-- Field multiplication `(a * b) mod p`. -/
def fmul (a b : Nat) : Nat := (a * b) % p

/-- Auxiliary exponentiation by square-and-multiply with an explicit fuel
parameter (structural recursion).  `fpowAux acc base e fuel` computes
`acc * base^e (mod p)` provided `fuel` exceeds the bit length of `e`;
extra fuel is harmless because the recursion stops as soon as `e = 0`. -/
def fpowAux (acc base e : Nat) : Nat → Nat
  | 0 => acc
  | fuel + 1 =>
    if e = 0 then acc
    else fpowAux (if e % 2 = 1 then fmul acc base else acc)
      (fmul base base) (e / 2) fuel

/-- Field exponentiation `x^e mod p` by square-and-multiply.  The fuel is
264, which exceeds the bit length of every exponent used in this
development (`p - 2 < 2^255` for inversion, `(p + 5)/8 < 2^253` for
square-root extraction). -/
def fpow (x e : Nat) : Nat := fpowAux 1 (x % p) e 264

/-- Field inversion `x^(p-2) mod p` (Fermat's little theorem: for
`x ≠ 0 (mod p)`, `x^(p-1) = 1`, so `x^(p-2)` is the multiplicative
inverse).  This is the `inv` of the RFC 8032 reference Python code. -/
def finv (x : Nat) : Nat := fpow x (p - 2)

/-!
## Section 10: the twisted Edwards curve and point arithmetic
(RFC 8032 section 3 and appendix A.1)

The Ed25519 curve is the twisted Edwards curve

  -x^2 + y^2 = 1 + d*x^2*y^2   (over GF(p))

(RFC 8032 section 3).  Points are represented in affine coordinates as
pairs `(x, y)` of field elements.  The addition formulas used below are
the complete formulas of RFC 8032 appendix A.1 ("the following complete
formulas ... can be used to implement point addition"), specialised to
`a = -1`; they are exactly the formulas of the RFC's reference Python
implementation (`edwards_add`), and they are complete for this curve
because `d` is not a square in GF(p).
-/

/-- An affine point on the twisted Edwards curve: two field elements `x`
and `y` (both represented as `Nat` residues in `[0, p)`).  Well-formed
points additionally satisfy `onCurve`. -/
structure Point where
  /-- The x-coordinate (a field element modulo `p`). -/
  x : Nat
  /-- The y-coordinate (a field element modulo `p`). -/
  y : Nat
deriving Repr, BEq, DecidableEq

/-- The neutral element (identity) of the Edwards group: `(0, 1)`
(RFC 8032 section 3: "The neutral element is (0,1)"). -/
def identityPoint : Point := ⟨0, 1⟩

/-- The base point `B = (Bx, By)` of the prime-order subgroup (RFC 8032
section 3; the encoding of `B` is the 32-byte string
`586666...6666`). -/
def basePoint : Point := ⟨Bx, By⟩

/-- Point addition on the Ed25519 curve, using the complete formulas of
RFC 8032 appendix A.1 with `a = -1`:

  x3 = (x1*y2 + x2*y1) / (1 + d*x1*x2*y1*y2)
  y3 = (y1*y2 + x1*x2) / (1 - d*x1*x2*y1*y2)

with division realised as multiplication by `finv`.  These are the
formulas of the RFC's reference Python code (`edwards_add`). -/
def edwardsAdd (P Q : Point) : Point :=
  let x1y2 := fmul P.x Q.y
  let x2y1 := fmul Q.x P.y
  let x1x2 := fmul P.x Q.x
  let y1y2 := fmul P.y Q.y
  let t := fmul d (fmul x1x2 y1y2)
  ⟨ fmul (fadd x1y2 x2y1) (finv (fadd 1 t)),
    fmul (fadd y1y2 x1x2) (finv (fsub 1 t)) ⟩

/-- Auxiliary scalar multiplication by double-and-add with an explicit
fuel parameter (structural recursion).  `scalarmultAux acc base e fuel`
computes `acc + e·base` provided `fuel` exceeds the bit length of `e`;
extra fuel is harmless. -/
def scalarmultAux (acc base : Point) (e : Nat) : Nat → Point
  | 0 => acc
  | fuel + 1 =>
    if e = 0 then acc
    else scalarmultAux (if e % 2 = 1 then edwardsAdd acc base else acc)
      (edwardsAdd base base) (e / 2) fuel

/-- Scalar multiplication `e·P` on the Ed25519 curve by double-and-add
(the `scalarmult` of the RFC 8032 reference Python code).  The fuel is
512, which strictly exceeds the bit length of every scalar arising in the
scheme: private scalars are below `2^255` (clamping sets bit 254 and
clears bit 255), and all scalars in signing and verification are reduced
modulo `L < 2^253`. -/
def scalarmult (P : Point) (e : Nat) : Point :=
  scalarmultAux identityPoint P e 512

/-!
## Section 11: point and integer encodings (RFC 8032 sections 5.1.2,
5.1.3 and 3)

Integers are encoded little-endian (RFC 8032 section 3: "all values are
encoded as little-endian").  A point `(x, y)` is encoded as the 255-bit
little-endian encoding of `y`, with the lowest bit of `x` stored in the
most significant bit of the final byte (RFC 8032 section 3, "Encoding
points").
-/

/-- The raw byte list of a `ByteArray`. -/
def toBytes (b : ByteArray) : List UInt8 := b.data.toList

/-- Assemble a `ByteArray` from a list of bytes. -/
def bytesOfList (l : List UInt8) : ByteArray := ByteArray.mk (Array.mk l)

/-- Concatenation of byte strings (used to build the hash inputs of
RFC 8032 section 5.1.6, which concatenate encodings and the message). -/
def catBytes (a b : ByteArray) : ByteArray :=
  bytesOfList (toBytes a ++ toBytes b)

/-- `encodeInt` (RFC 8032 sections 3 and 5.1.2, "little-endian encoding"):
the 32-byte little-endian encoding of the integer `n mod 2^256`.  Every
integer encoded in Ed25519 (coordinates and scalars) is below `2^255`, so
no truncation occurs in the intended uses. -/
def encodeInt (n : Nat) : ByteArray :=
  bytesOfList ((List.range 32).map (fun i => UInt8.ofNat (n / 2^(8 * i))))

/-- `decodeInt` (RFC 8032 section 3): interpret a byte string as a
little-endian integer. -/
def decodeInt (b : ByteArray) : Nat :=
  (toBytes b).reverse.foldl (fun acc byte => acc * 256 + byte.toNat) 0

/-- `encodePoint` (RFC 8032 section 3, "Encoding points"; also section
5.1.2): the 32-byte little-endian encoding of the y-coordinate, with the
least significant bit of the x-coordinate placed in the most significant
bit of the last byte. -/
def encodePoint (P : Point) : ByteArray :=
  encodeInt (P.y % p + (P.x % 2) * 2^255)

/-- The bit length of `p` as an encoding mask: `2^255` is the value of the
sign bit position in a 32-byte point encoding. -/
theorem two_pow_255_eq : 2^255 =
    57896044618658097711785492504343953926634992332820282019728792003956564819968 := by native_decide

/-!
## Section 12: decoding predicates and point decoding (RFC 8032 sections
3 and 5.1.3)

Point decoding recovers `x` from `y` and the sign bit by solving the curve
equation:

  x^2 = (y^2 - 1) / (d*y^2 + 1)

using the square-root algorithm of the RFC 8032 reference Python code
(`recover_x`): candidate `x = u^((p+5)/8)`, corrected by a factor `I`
(the canonical square root of `-1`) when needed.  The checks below are the
ones a strict verifier must perform: canonical field elements (`y < p`),
canonical scalars (`S < L`), on-curve membership, and small-order
rejection.
-/

/-- `recoverX` (RFC 8032 reference Python code, `recover_x`): given the
y-coordinate `y` and the sign bit `sign` of `x`, recover the x-coordinate,
or fail (`none`) if `y >= p` or if the curve equation has no solution.
The candidate root is `x2^((p+5)/8)`; if its square differs from `x2` it
is multiplied by `I = sqrt(-1)`, and if it still differs, `y` is not on
the curve. -/
def recoverX (y sign : Nat) : Option Nat :=
  if p ≤ y then none
  else
    let x2 := fmul (fsub (fmul y y) 1) (finv (fadd (fmul d (fmul y y)) 1))
    if x2 = 0 then (if sign = 0 then some 0 else none)
    else
      let x0 := fpow x2 ((p + 5) / 8)
      let x1 := if fsub (fmul x0 x0) x2 ≠ 0 then fmul x0 I else x0
      if fsub (fmul x1 x1) x2 ≠ 0 then none
      else some (if x1 % 2 ≠ sign then p - x1 else x1)

/-- `decodePoint` (RFC 8032 sections 3 and 5.1.3): decode a 32-byte
string to a curve point, or fail (`none`).  The most significant bit of
the last byte is the sign of `x`; the remaining 255 bits are the
little-endian encoding of `y`.  Fails when the input is not 32 bytes,
when `y >= p` (a non-canonical field element), or when no x-coordinate
satisfies the curve equation (i.e. the point would not be on the curve).
Hence a successful decode is always a canonical, on-curve point. -/
def decodePoint (b : ByteArray) : Option Point :=
  if b.size ≠ 32 then none
  else
    let v := decodeInt b
    let y := v % 2^255
    let sign := v / 2^255
    match recoverX y sign with
    | none => none
    | some x => some ⟨x, y⟩

/-- On-curve predicate (RFC 8032 section 3): `(x, y)` lies on the twisted
Edwards curve iff `-x^2 + y^2 = 1 + d*x^2*y^2 (mod p)`, written here as
`y^2 - x^2 = 1 + d*x^2*y^2` to stay within `Nat`. -/
def onCurve (P : Point) : Bool :=
  decide (fsub (fmul P.y P.y) (fmul P.x P.x) =
    fadd 1 (fmul d (fmul (fmul P.x P.x) (fmul P.y P.y))))

/-- Canonical-scalar predicate (RFC 8032 section 5.1.7, step 1 in strict
verifiers): the scalar part `S` of a signature is canonical iff
`S < L`.  Non-canonical scalars (`S = L`, `S = L + 1`, `S = 2^256 - 1`,
...) are a classic signature-malleability vector and are rejected by
`verify` below. -/
def isCanonicalS (S : Nat) : Bool := decide (S < L)

/-- Canonical point-encoding predicate: a 32-byte string is a canonical
point encoding iff the encoded y-coordinate is below `p` (the sign bit is
masked out before the comparison).  Encodings with `y ∈ [p, 2^255)` are
non-canonical and are rejected by `verify` below. -/
def isCanonicalPointEncoding (b : ByteArray) : Bool :=
  b.size == 32 && decide (decodeInt b % 2^255 < p)

/-- The eight canonical encodings of the points of the small-order
(cofactor-8) subgroup of the curve, listed explicitly (these are the
encodings blacklisted by libsodium and by RFC 8032 section 8.9-style
defences, restricted to the canonical representatives):

  1. `01 00 ... 00` — the identity point `(0, 1)`;
  2. `ec ff ... 7f` — the order-2 point `(0, -1)`;
  3. `00 ... 00` — the order-4 point `(I, 0)` with even x;
  4. `00 ... 80` — the order-4 point `(-I, 0)` with odd x (sign bit set);
  5.-8. the four order-8 points (two y-values, each with both signs of x).

Every entry below was verified computationally: each decodes to a point
`P` with `8·P = identity`. -/
def smallOrderEncodings : List ByteArray := [
  -- the identity point (0, 1)
  ByteArray.mk #[
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  -- the order-2 point (0, -1)
  ByteArray.mk #[
    0xec, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f],
  -- the order-4 point with even x
  ByteArray.mk #[
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  -- the order-4 point with odd x (sign bit set)
  ByteArray.mk #[
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80],
  -- an order-8 point (y = c717...037a, even x)
  ByteArray.mk #[
    0xc7, 0x17, 0x6a, 0x70, 0x3d, 0x4d, 0xd8, 0x4f, 0xba, 0x3c, 0x0b, 0x76, 0x0d, 0x10, 0x67, 0x0f, 
    0x2a, 0x20, 0x53, 0xfa, 0x2c, 0x39, 0xcc, 0xc6, 0x4e, 0xc7, 0xfd, 0x77, 0x92, 0xac, 0x03, 0x7a],
  -- an order-8 point (y = c717...037a, odd x)
  ByteArray.mk #[
    0xc7, 0x17, 0x6a, 0x70, 0x3d, 0x4d, 0xd8, 0x4f, 0xba, 0x3c, 0x0b, 0x76, 0x0d, 0x10, 0x67, 0x0f, 
    0x2a, 0x20, 0x53, 0xfa, 0x2c, 0x39, 0xcc, 0xc6, 0x4e, 0xc7, 0xfd, 0x77, 0x92, 0xac, 0x03, 0xfa],
  -- an order-8 point (y = 26e8...fc05, even x)
  ByteArray.mk #[
    0x26, 0xe8, 0x95, 0x8f, 0xc2, 0xb2, 0x27, 0xb0, 0x45, 0xc3, 0xf4, 0x89, 0xf2, 0xef, 0x98, 0xf0, 
    0xd5, 0xdf, 0xac, 0x05, 0xd3, 0xc6, 0x33, 0x39, 0xb1, 0x38, 0x02, 0x88, 0x6d, 0x53, 0xfc, 0x05],
  -- an order-8 point (y = 26e8...fc05, odd x)
  ByteArray.mk #[
    0x26, 0xe8, 0x95, 0x8f, 0xc2, 0xb2, 0x27, 0xb0, 0x45, 0xc3, 0xf4, 0x89, 0xf2, 0xef, 0x98, 0xf0, 
    0xd5, 0xdf, 0xac, 0x05, 0xd3, 0xc6, 0x33, 0x39, 0xb1, 0x38, 0x02, 0x88, 0x6d, 0x53, 0xfc, 0x85]
]

/-- Small-order predicate: a 32-byte encoding is small-order iff it is one
of the eight encodings listed in `smallOrderEncodings`.  Small-order
public keys and signature R-values enable the cofactor attacks discussed
in RFC 8032 section 8.9 ("Malleability" / small-subgroup considerations);
a strict implementation rejects them. -/
def isSmallOrder (b : ByteArray) : Bool :=
  smallOrderEncodings.any (fun e => e == b)

/-!
## Section 13: key generation, signing and verification (RFC 8032
sections 5.1.4 - 5.1.7)

This section is a faithful formalization of the RFC 8032 section 5.1
pipeline for Ed25519 (ph = false, context = the empty string):

  * 5.1.4: the private key is hashed with SHA-512; the first half is
    pruned ("clamped") to form the secret scalar `a`, the second half is
    used as the nonce prefix;
  * 5.1.5: the public key is `A = a·B`, encoded;
  * 5.1.6: the signature is `(encodePoint(R), encodeInt(S))` with
    `R = r·B`, `r = H(prefix || msg) mod L`, and
    `S = (r + H(R || A || msg) * a) mod L`;
  * 5.1.7: verification checks `S·B = R + H(R || A || msg)·A`.

### Cofactorless versus cofactored verification

There are two verification equations in the literature:

  * cofactorless: `S·B = R + k·A`          (RFC 8032 reference Python code)
  * cofactored:   `8·S·B = 8·R + 8·k·A`    (RFC 8032 section 5.1.7 text)

They differ on adversarial inputs involving the cofactor-8 subgroup (the
cofactored equation additionally accepts signatures whose `R` or `A`
differs by a small-order point).  This formalization implements the
**cofactorless** equation, exactly as in the RFC's own reference Python
implementation (`checkvalid`: `[S]B = R + [k]A`), and additionally rejects
non-canonical scalars (`S >= L`) and non-canonical point encodings
(`y >= p`).  All expected verdicts in the ground truth and in
`Ed25519Hostile.lean` are stated against this choice.
-/

/-- `secretExpand` (RFC 8032 section 5.1.6, steps 1-2; also section
5.1.5): hash the 32-byte secret key with SHA-512, then "prune" (clamp)
the lower half:

  * clear the lowest three bits (divisibility by the cofactor 8),
  * clear the highest bit,
  * set the second-highest bit (bit 254),

yielding the secret scalar `a`; the upper half of the hash is the nonce
prefix.  Returns the pair `(a, prefix)`.  The clamping is written
arithmetically: `a mod 2^254` clears the top bit, subtracting the low
three bits clears them, and adding `2^254` sets bit 254. -/
def secretExpand (sk : ByteArray) : Nat × ByteArray :=
  let h := toBytes (sha512 sk)
  let ah := decodeInt (bytesOfList (h.take 32))
  let a254 := ah % 2^254
  let a := a254 - a254 % 8 + 2^254
  (a, bytesOfList (h.drop 32))

/-- The Ed25519 hash-to-scalar of the RFC 8032 reference Python code
(`Hint`): SHA-512 of the input, interpreted little-endian, reduced modulo
the group order `L`.  Used for both the nonce `r` and the challenge `k`
(RFC 8032 section 5.1.6). -/
def hint (b : ByteArray) : Nat := decodeInt (sha512 b) % L

/-- `publickey` (RFC 8032 section 5.1.5): the public key for a 32-byte
secret key is the encoding of `a·B`, where `a` is the clamped secret
scalar from `secretExpand`. -/
def publickey (sk : ByteArray) : ByteArray :=
  let (a, _) := secretExpand sk
  encodePoint (scalarmult basePoint a)

/-- `sign` (RFC 8032 section 5.1.6): given the 32-byte secret key `sk`
and the message `msg`, produce the 64-byte signature `R || S`:

  1. `(a, prefix) := secretExpand sk`;
  2. `A := encodePoint (a·B)` (the public key);
  3. `r := H(prefix || msg) mod L` and `R := r·B`;
  4. `k := H(encodePoint R || A || msg) mod L`;
  5. `S := (r + k·a) mod L`;
  6. the signature is `encodePoint R || encodeInt S`. -/
def sign (sk msg : ByteArray) : ByteArray :=
  let (a, prefix) := secretExpand sk
  let A := encodePoint (scalarmult basePoint a)
  let r := hint (catBytes prefix msg)
  let R := scalarmult basePoint r
  let Rb := encodePoint R
  let k := hint (catBytes (catBytes Rb A) msg)
  let S := (r + k * a) % L
  catBytes Rb (encodeInt S)

/-- `verify` (RFC 8032 section 5.1.7, cofactorless — see the section 13
note above; this is the `checkvalid` of the RFC 8032 reference Python
code): check that `sig` is a valid Ed25519 signature on `msg` under the
public key `pk`.  The check is

  S·B = R + H(R || A || msg)·A

performed after the following strict input validation, each of which
corresponds to a known attack class:

  * the signature is exactly 64 bytes and the public key exactly 32
    (truncated/extended encodings are rejected);
  * `S < L` (`isCanonicalS`: rejects scalar malleability — `S = 0` is
    not rejected here but then fails the group equation);
  * the R encoding is canonical (`isCanonicalPointEncoding`: rejects
    `y >= p` encodings);
  * both `R` and `A` decode to on-curve points (`decodePoint`). -/
def verify (pk msg sig : ByteArray) : Bool :=
  if sig.size != 64 || pk.size != 32 then false
  else
    let Rb := bytesOfList ((toBytes sig).take 32)
    let S := decodeInt (bytesOfList ((toBytes sig).drop 32))
    if !isCanonicalS S then false
    else if !isCanonicalPointEncoding Rb then false
    else match decodePoint Rb, decodePoint pk with
      | some R, some A =>
        let k := hint (catBytes (catBytes Rb pk) msg)
        scalarmult basePoint S == edwardsAdd R (scalarmult A k)
      | _, _ => false

/-!
## Section 14: auditable accessors and API conveniences

Small derived definitions that make the development easier to audit and to
exercise from the theorem files: hex-facing variants of the protocol
functions, and the decomposed signature view used by the hostile-vector
file.  Everything here is a thin wrapper over sections 9-13.
-/

/-- Split a 64-byte signature into its `(R, S)` halves as byte strings
(RFC 8032 section 5.1.7 step 1: "the signature is split into two 32-octet
halves").  For inputs shorter than 64 bytes the halves are whatever the
truncation leaves; `verify` rejects such inputs before consulting this
decomposition. -/
def sigR (sig : ByteArray) : ByteArray := bytesOfList ((toBytes sig).take 32)

/-- The scalar half of a signature (the second 32 bytes). -/
def sigS (sig : ByteArray) : ByteArray := bytesOfList ((toBytes sig).drop 32)

/-- The scalar `S` of a signature as an integer (little-endian decode of
the second half). -/
def sigScalar (sig : ByteArray) : Nat := decodeInt (sigS sig)

/-- Hex-facing convenience: sign a message given as a hex string with a
secret key given as a hex string, returning the lowercase hex signature.
Used by the known-answer tests to state vectors in their published
(RFC 8032 test vector) form. -/
def signHex (skHex msgHex : String) : String :=
  hexEncode (sign (hexDecode skHex) (hexDecode msgHex))

/-- Hex-facing convenience: derive the public key of a hex-encoded secret
key, rendered lowercase. -/
def publickeyHex (skHex : String) : String :=
  hexEncode (publickey (hexDecode skHex))

/-- Hex-facing convenience: verify a hex-encoded signature under a
hex-encoded public key on a hex-encoded message. -/
def verifyHex (pkHex msgHex sigHex : String) : Bool :=
  verify (hexDecode pkHex) (hexDecode msgHex) (hexDecode sigHex)

/-- The clamped secret scalar of a secret key (the first component of
`secretExpand`), exposed for audit: RFC 8032 section 5.1.6 step 2. -/
def secretScalar (sk : ByteArray) : Nat := (secretExpand sk).1

/-- The nonce prefix of a secret key (the second component of
`secretExpand`): RFC 8032 section 5.1.6 step 1. -/
def secretPrefix (sk : ByteArray) : ByteArray := (secretExpand sk).2

/-- The point `R = r·B` of a signing computation, exposed for audit
(RFC 8032 section 5.1.6 step 3). -/
def noncePoint (sk msg : ByteArray) : Point :=
  scalarmult basePoint (hint (catBytes (secretPrefix sk) msg))

end ProofBundle.Crypto.Ed25519
