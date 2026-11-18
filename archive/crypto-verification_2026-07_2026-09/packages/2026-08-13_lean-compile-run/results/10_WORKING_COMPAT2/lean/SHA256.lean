/-
# FIPS 180-4 SHA-256 — Executable Specification in Lean 4

This file is a complete, executable, dependency-free (Lean core + `Std` only)
formalization of the SHA-256 secure hash algorithm as specified in

  NIST FIPS PUB 180-4, "Secure Hash Standard (SHS)", August 2015.

Every numeric constant in this file (the 64 round constants `K` of section
4.2.2 and the 8 initial hash values `H0` of section 4.2.1) was regenerated
from first principles (the fractional parts of the cube roots, respectively
square roots, of the first prime numbers) and cross-checked against a
reference implementation; see the per-constant comments, which record the
prime and the exact derivation of every word.  Every function is documented
with the section of FIPS 180-4 that it implements.

Companion files:

  * `SHA256Theorems.lean` — known-answer tests (FIPS 180-4 examples, NIST
    CAVP vectors and generated boundary tests), structural theorems about
    padding and digest length (proved, no `sorry`), and an HMAC RFC 4231
    test case;
  * `SHA256Hostile.lean` — twenty-four adversarial test vectors exercising
    padding boundaries, block boundaries, delimiter confusion, extreme
    Hamming weights and long-message length-counter integrity.

Layout of this file:

  * section 1: 32-bit word operations (FIPS 180-4 sections 3.2 and 4.1.2);
  * section 2: the round constants `K` (FIPS 180-4 section 4.2.2);
  * section 3: the initial hash value `H0` (FIPS 180-4 section 4.2.1);
  * section 4: the message schedule (FIPS 180-4 section 6.2.2, step 1);
  * section 5: the compression function (FIPS 180-4 section 6.2.2, steps 2-4);
  * section 6: message padding (FIPS 180-4 section 5.1.1);
  * section 7: block iteration and the top-level `sha256` (section 6.2);
  * section 8: hexadecimal encoding/decoding utilities (local, no deps);
  * section 9: derived constructions: HMAC-SHA-256 (RFC 2104), double
    SHA-256, and iterated hashing (`sha256Chain`);
  * section 10: additional auditable accessors and API conveniences.

Implementation notes:

  * `UInt32` addition in Lean is two's-complement addition modulo 2^32,
    exactly the "addition modulo 2^32" used throughout FIPS 180-4
    section 2.1.
  * Lean's core library does not (on all stable toolchains) expose a direct
    `UInt32.rotateRight`; we therefore implement right rotation `rotr` as
    the composition of a right shift and a left shift joined by bitwise OR,
    which is the standard expansion
    `ROTR^n(x) = SHR^n(x) OR SHL^(32-n)(x)`.  This is documented at the
    definition of `rotr`.
  * All message-manipulation code works on `List UInt8` internally (which
    makes the padding theorems in `SHA256Theorems.lean` provable by list
    induction) and converts from/to `ByteArray` only at the API boundary.
  * Indexing into the state uses `Fin 8`, so all state accesses are total
    and statically bounds-checked; indexing into the schedule and constant
    arrays uses `Array.get!`, which is safe here because the loops are
    bounded by construction (64 rounds, 64 schedule words, 64 constants).
-/

import Std


def Array.get! [Inhabited α] (xs : Array α) (i : Nat) : α := xs.getD i default

namespace ProofBundle.Crypto.SHA256

/-!
## Section 1: 32-bit word operations (FIPS 180-4 sections 3.2 and 4.1.2)

SHA-256 operates on 32-bit words.  The operations used are (FIPS 180-4
sections 2.1 and 3.2): bitwise AND, OR, XOR, complement, addition modulo
2^32, right shift, and right rotation.  The eight logical functions used by
the algorithm are defined in section 4.1.2 of the standard; all of them are
defined here, one definition per equation of the standard.
-/

/-- Right rotation of a 32-bit word by `n` bits, `ROTR^n(x)` of FIPS 180-4
section 3.2 item 4: "The right rotate operation ... where x is a w-bit word
and n is an integer with 0 <= n < w, is defined by ROTR^n(x) = (x >> n) OR
(x << (w - n))".

Lean core does not uniformly expose `UInt32.rotateRight`, so we expand the
rotation into exactly this defining composition of shifts:

  ROTR^n(x) = (x >> n) OR (x << (32 - n))   for 0 < n < 32.

All SHA-256 rotation amounts (2, 3, 6, 7, 10, 11, 13, 17, 18, 19, 22, 25)
satisfy `0 < n < 32`, so the boundary behaviour of the expansion is never
exercised outside its specified domain. -/
def rotr (x : UInt32) (n : UInt32) : UInt32 :=
  (UInt32.shiftRight x n) ||| (UInt32.shiftLeft x (32 - n))

/-- Right shift of a 32-bit word by `n` bits, `SHR^n(x)` of FIPS 180-4
section 3.2 item 3.  This is simply `UInt32.shiftRight`; it is given a name
matching the standard so that the sigma functions below read exactly like
the equations of section 4.1.2. -/
def shr (x : UInt32) (n : UInt32) : UInt32 :=
  UInt32.shiftRight x n

/-- The `Ch` ("choose") function of FIPS 180-4 section 4.1.2 (equation 4.2):

  Ch(x, y, z) = (x AND y) XOR ((NOT x) AND z).

For each bit position, the bit of `x` selects between the bit of `y` (when
the `x` bit is 1) and the bit of `z` (when the `x` bit is 0). -/
def ch (x y z : UInt32) : UInt32 :=
  (x &&& y) ^^^ ((~~~ x) &&& z)

/-- The `Maj` ("majority") function of FIPS 180-4 section 4.1.2 (equation
4.3):

  Maj(x, y, z) = (x AND y) XOR (x AND z) XOR (y AND z).

For each bit position the output bit is the majority vote of the three
input bits. -/
def maj (x y z : UInt32) : UInt32 :=
  (x &&& y) ^^^ (x &&& z) ^^^ (y &&& z)

/-- The capital sigma function `Σ0` ("big sigma zero") of FIPS 180-4
section 4.1.2 (equation 4.4), used in the compression function:

  Σ0(x) = ROTR^2(x) XOR ROTR^13(x) XOR ROTR^22(x). -/
def bigSigma0 (x : UInt32) : UInt32 :=
  rotr x 2 ^^^ rotr x 13 ^^^ rotr x 22

/-- The capital sigma function `Σ1` ("big sigma one") of FIPS 180-4
section 4.1.2 (equation 4.5), used in the compression function:

  Σ1(x) = ROTR^6(x) XOR ROTR^11(x) XOR ROTR^25(x). -/
def bigSigma1 (x : UInt32) : UInt32 :=
  rotr x 6 ^^^ rotr x 11 ^^^ rotr x 25

/-- The small sigma function `σ0` of FIPS 180-4 section 4.1.2
(equation 4.6), used in the message schedule:

  σ0(x) = ROTR^7(x) XOR ROTR^18(x) XOR SHR^3(x). -/
def smallSigma0 (x : UInt32) : UInt32 :=
  rotr x 7 ^^^ rotr x 18 ^^^ shr x 3

/-- The small sigma function `σ1` of FIPS 180-4 section 4.1.2
(equation 4.7), used in the message schedule:

  σ1(x) = ROTR^17(x) XOR ROTR^19(x) XOR SHR^10(x). -/
def smallSigma1 (x : UInt32) : UInt32 :=
  rotr x 17 ^^^ rotr x 19 ^^^ shr x 10

/-!
## Section 2: the round constants `K` (FIPS 180-4 section 4.2.2)

The sixty-four 32-bit words `K[0] .. K[63]` represent the first 32 bits of
the fractional parts of the cube roots of the first sixty-four prime
numbers.  Each constant below carries a comment recording the prime it is
derived from, so that the whole table can be regenerated and audited:

  K[t] = floor( frac( p_t ^ (1/3) ) * 2^32 ),  p_t = t-th prime (0-indexed).

All 64 values were regenerated from the primes and checked against a
reference SHA-256 implementation before inclusion; the comments give, for
every word, the prime, the hexadecimal value, and the decimal value.
-/

/-- The 64 round constants of FIPS 180-4 section 4.2.2, in order.
Derivation of each word: `floor(frac(p^(1/3)) * 2^32)` for successive
primes `p = 2, 3, 5, 7, ..., 311`. -/
def K : Array UInt32 := #[
  -- K[ 0]: prime   2.  floor(frac(2^(1/3)) * 2^32) = 0x428a2f98 = 1116352408.
  0x428a2f98,
  -- K[ 1]: prime   3.  floor(frac(3^(1/3)) * 2^32) = 0x71374491 = 1899447441.
  0x71374491,
  -- K[ 2]: prime   5.  floor(frac(5^(1/3)) * 2^32) = 0xb5c0fbcf = 3049323471.
  0xb5c0fbcf,
  -- K[ 3]: prime   7.  floor(frac(7^(1/3)) * 2^32) = 0xe9b5dba5 = 3921009573.
  0xe9b5dba5,
  -- K[ 4]: prime  11.  floor(frac(11^(1/3)) * 2^32) = 0x3956c25b = 961987163.
  0x3956c25b,
  -- K[ 5]: prime  13.  floor(frac(13^(1/3)) * 2^32) = 0x59f111f1 = 1508970993.
  0x59f111f1,
  -- K[ 6]: prime  17.  floor(frac(17^(1/3)) * 2^32) = 0x923f82a4 = 2453635748.
  0x923f82a4,
  -- K[ 7]: prime  19.  floor(frac(19^(1/3)) * 2^32) = 0xab1c5ed5 = 2870763221.
  0xab1c5ed5,
  -- K[ 8]: prime  23.  floor(frac(23^(1/3)) * 2^32) = 0xd807aa98 = 3624381080.
  0xd807aa98,
  -- K[ 9]: prime  29.  floor(frac(29^(1/3)) * 2^32) = 0x12835b01 = 310598401.
  0x12835b01,
  -- K[10]: prime  31.  floor(frac(31^(1/3)) * 2^32) = 0x243185be = 607225278.
  0x243185be,
  -- K[11]: prime  37.  floor(frac(37^(1/3)) * 2^32) = 0x550c7dc3 = 1426881987.
  0x550c7dc3,
  -- K[12]: prime  41.  floor(frac(41^(1/3)) * 2^32) = 0x72be5d74 = 1925078388.
  0x72be5d74,
  -- K[13]: prime  43.  floor(frac(43^(1/3)) * 2^32) = 0x80deb1fe = 2162078206.
  0x80deb1fe,
  -- K[14]: prime  47.  floor(frac(47^(1/3)) * 2^32) = 0x9bdc06a7 = 2614888103.
  0x9bdc06a7,
  -- K[15]: prime  53.  floor(frac(53^(1/3)) * 2^32) = 0xc19bf174 = 3248222580.
  0xc19bf174,
  -- K[16]: prime  59.  floor(frac(59^(1/3)) * 2^32) = 0xe49b69c1 = 3835390401.
  0xe49b69c1,
  -- K[17]: prime  61.  floor(frac(61^(1/3)) * 2^32) = 0xefbe4786 = 4022224774.
  0xefbe4786,
  -- K[18]: prime  67.  floor(frac(67^(1/3)) * 2^32) = 0xfc19dc6 = 264347078.
  0xfc19dc6,
  -- K[19]: prime  71.  floor(frac(71^(1/3)) * 2^32) = 0x240ca1cc = 604807628.
  0x240ca1cc,
  -- K[20]: prime  73.  floor(frac(73^(1/3)) * 2^32) = 0x2de92c6f = 770255983.
  0x2de92c6f,
  -- K[21]: prime  79.  floor(frac(79^(1/3)) * 2^32) = 0x4a7484aa = 1249150122.
  0x4a7484aa,
  -- K[22]: prime  83.  floor(frac(83^(1/3)) * 2^32) = 0x5cb0a9dc = 1555081692.
  0x5cb0a9dc,
  -- K[23]: prime  89.  floor(frac(89^(1/3)) * 2^32) = 0x76f988da = 1996064986.
  0x76f988da,
  -- K[24]: prime  97.  floor(frac(97^(1/3)) * 2^32) = 0x983e5152 = 2554220882.
  0x983e5152,
  -- K[25]: prime 101.  floor(frac(101^(1/3)) * 2^32) = 0xa831c66d = 2821834349.
  0xa831c66d,
  -- K[26]: prime 103.  floor(frac(103^(1/3)) * 2^32) = 0xb00327c8 = 2952996808.
  0xb00327c8,
  -- K[27]: prime 107.  floor(frac(107^(1/3)) * 2^32) = 0xbf597fc7 = 3210313671.
  0xbf597fc7,
  -- K[28]: prime 109.  floor(frac(109^(1/3)) * 2^32) = 0xc6e00bf3 = 3336571891.
  0xc6e00bf3,
  -- K[29]: prime 113.  floor(frac(113^(1/3)) * 2^32) = 0xd5a79147 = 3584528711.
  0xd5a79147,
  -- K[30]: prime 127.  floor(frac(127^(1/3)) * 2^32) = 0x6ca6351 = 113926993.
  0x6ca6351,
  -- K[31]: prime 131.  floor(frac(131^(1/3)) * 2^32) = 0x14292967 = 338241895.
  0x14292967,
  -- K[32]: prime 137.  floor(frac(137^(1/3)) * 2^32) = 0x27b70a85 = 666307205.
  0x27b70a85,
  -- K[33]: prime 139.  floor(frac(139^(1/3)) * 2^32) = 0x2e1b2138 = 773529912.
  0x2e1b2138,
  -- K[34]: prime 149.  floor(frac(149^(1/3)) * 2^32) = 0x4d2c6dfc = 1294757372.
  0x4d2c6dfc,
  -- K[35]: prime 151.  floor(frac(151^(1/3)) * 2^32) = 0x53380d13 = 1396182291.
  0x53380d13,
  -- K[36]: prime 157.  floor(frac(157^(1/3)) * 2^32) = 0x650a7354 = 1695183700.
  0x650a7354,
  -- K[37]: prime 163.  floor(frac(163^(1/3)) * 2^32) = 0x766a0abb = 1986661051.
  0x766a0abb,
  -- K[38]: prime 167.  floor(frac(167^(1/3)) * 2^32) = 0x81c2c92e = 2177026350.
  0x81c2c92e,
  -- K[39]: prime 173.  floor(frac(173^(1/3)) * 2^32) = 0x92722c85 = 2456956037.
  0x92722c85,
  -- K[40]: prime 179.  floor(frac(179^(1/3)) * 2^32) = 0xa2bfe8a1 = 2730485921.
  0xa2bfe8a1,
  -- K[41]: prime 181.  floor(frac(181^(1/3)) * 2^32) = 0xa81a664b = 2820302411.
  0xa81a664b,
  -- K[42]: prime 191.  floor(frac(191^(1/3)) * 2^32) = 0xc24b8b70 = 3259730800.
  0xc24b8b70,
  -- K[43]: prime 193.  floor(frac(193^(1/3)) * 2^32) = 0xc76c51a3 = 3345764771.
  0xc76c51a3,
  -- K[44]: prime 197.  floor(frac(197^(1/3)) * 2^32) = 0xd192e819 = 3516065817.
  0xd192e819,
  -- K[45]: prime 199.  floor(frac(199^(1/3)) * 2^32) = 0xd6990624 = 3600352804.
  0xd6990624,
  -- K[46]: prime 211.  floor(frac(211^(1/3)) * 2^32) = 0xf40e3585 = 4094571909.
  0xf40e3585,
  -- K[47]: prime 223.  floor(frac(223^(1/3)) * 2^32) = 0x106aa070 = 275423344.
  0x106aa070,
  -- K[48]: prime 227.  floor(frac(227^(1/3)) * 2^32) = 0x19a4c116 = 430227734.
  0x19a4c116,
  -- K[49]: prime 229.  floor(frac(229^(1/3)) * 2^32) = 0x1e376c08 = 506948616.
  0x1e376c08,
  -- K[50]: prime 233.  floor(frac(233^(1/3)) * 2^32) = 0x2748774c = 659060556.
  0x2748774c,
  -- K[51]: prime 239.  floor(frac(239^(1/3)) * 2^32) = 0x34b0bcb5 = 883997877.
  0x34b0bcb5,
  -- K[52]: prime 241.  floor(frac(241^(1/3)) * 2^32) = 0x391c0cb3 = 958139571.
  0x391c0cb3,
  -- K[53]: prime 251.  floor(frac(251^(1/3)) * 2^32) = 0x4ed8aa4a = 1322822218.
  0x4ed8aa4a,
  -- K[54]: prime 257.  floor(frac(257^(1/3)) * 2^32) = 0x5b9cca4f = 1537002063.
  0x5b9cca4f,
  -- K[55]: prime 263.  floor(frac(263^(1/3)) * 2^32) = 0x682e6ff3 = 1747873779.
  0x682e6ff3,
  -- K[56]: prime 269.  floor(frac(269^(1/3)) * 2^32) = 0x748f82ee = 1955562222.
  0x748f82ee,
  -- K[57]: prime 271.  floor(frac(271^(1/3)) * 2^32) = 0x78a5636f = 2024104815.
  0x78a5636f,
  -- K[58]: prime 277.  floor(frac(277^(1/3)) * 2^32) = 0x84c87814 = 2227730452.
  0x84c87814,
  -- K[59]: prime 281.  floor(frac(281^(1/3)) * 2^32) = 0x8cc70208 = 2361852424.
  0x8cc70208,
  -- K[60]: prime 283.  floor(frac(283^(1/3)) * 2^32) = 0x90befffa = 2428436474.
  0x90befffa,
  -- K[61]: prime 293.  floor(frac(293^(1/3)) * 2^32) = 0xa4506ceb = 2756734187.
  0xa4506ceb,
  -- K[62]: prime 307.  floor(frac(307^(1/3)) * 2^32) = 0xbef9a3f7 = 3204031479.
  0xbef9a3f7,
  -- K[63]: prime 311.  floor(frac(311^(1/3)) * 2^32) = 0xc67178f2 = 3329325298.
  0xc67178f2
]

/-- The number of round constants; SHA-256 performs exactly 64 rounds per
block (FIPS 180-4 section 6.2.2), one per constant. -/
theorem K_size : K.size = 64 := rfl

/-!
## Section 3: the initial hash value `H0` (FIPS 180-4 section 4.2.1)

The eight 32-bit words of the initial hash value `H0` are the first 32 bits
of the fractional parts of the square roots of the first eight prime
numbers 2, 3, 5, 7, 11, 13, 17, 19:

  H0[i] = floor( frac( sqrt( p_i ) ) * 2^32 ).
-/

/-- The initial hash value of FIPS 180-4 section 4.2.1.  Derivation of each
word: `floor(frac(sqrt(p)) * 2^32)` for the primes `p = 2, 3, 5, 7, 11, 13,
17, 19`. -/
def H0 : Array UInt32 := #[
  -- H0[0]: prime  2.  floor(frac(sqrt(2)) * 2^32) = 0x6a09e667 = 1779033703.
  0x6a09e667,
  -- H0[1]: prime  3.  floor(frac(sqrt(3)) * 2^32) = 0xbb67ae85 = 3144134277.
  0xbb67ae85,
  -- H0[2]: prime  5.  floor(frac(sqrt(5)) * 2^32) = 0x3c6ef372 = 1013904242.
  0x3c6ef372,
  -- H0[3]: prime  7.  floor(frac(sqrt(7)) * 2^32) = 0xa54ff53a = 2773480762.
  0xa54ff53a,
  -- H0[4]: prime 11.  floor(frac(sqrt(11)) * 2^32) = 0x510e527f = 1359893119.
  0x510e527f,
  -- H0[5]: prime 13.  floor(frac(sqrt(13)) * 2^32) = 0x9b05688c = 2600822924.
  0x9b05688c,
  -- H0[6]: prime 17.  floor(frac(sqrt(17)) * 2^32) = 0x1f83d9ab = 528734635.
  0x1f83d9ab,
  -- H0[7]: prime 19.  floor(frac(sqrt(19)) * 2^32) = 0x5be0cd19 = 1541459225.
  0x5be0cd19
]

/-- The initial hash state has exactly eight words, one for each of the
working variables a..h (FIPS 180-4 section 6.2.2). -/
theorem H0_size : H0.size = 8 := rfl

/-- The hash state: eight 32-bit working variables `a, b, c, d, e, f, g, h`
(FIPS 180-4 section 6.2.2, step 2), represented as a function from `Fin 8`
to `UInt32` so that indexing is total and statically bounds-checked.
Index 0 is `a`, index 1 is `b`, ..., index 7 is `h`. -/
abbrev State := Fin 8 → UInt32

/-- The initial state of the SHA-256 computation: the eight words of `H0`
(FIPS 180-4 section 6.2.1: "Set the initial hash value, H(0)"). -/
def initState : State :=
  fun i => H0.get! i.val

/-!
## Section 4: the message schedule (FIPS 180-4 section 6.2.2, step 1)

Each 512-bit message block is viewed as sixteen 32-bit big-endian words
`W[0] .. W[15]`, and then expanded to sixty-four words by the recurrence

  W[t] = σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16],   16 ≤ t ≤ 63,

where `+` is addition modulo 2^32 and `σ0`, `σ1` are the small sigma
functions of section 4.1.2.
-/

/-- Assemble four bytes into one 32-bit word, most significant byte first
(FIPS 180-4 section 3.1: "the left-most bit ... is the most significant
bit").  This is the big-endian reading of the message block, and it is also
how the padded length field of section 5.1.1 is laid out. -/
def bytesToWord (b0 b1 b2 b3 : UInt8) : UInt32 :=
  (UInt32.shiftLeft b0.toUInt32 24) |||
  (UInt32.shiftLeft b1.toUInt32 16) |||
  (UInt32.shiftLeft b2.toUInt32 8) |||
  b3.toUInt32

/-- The message schedule of FIPS 180-4 section 6.2.2, step 1.  The input is
one 64-byte message block; the output is the array of 64 words `W[t]`.
`W[0..15]` are read big-endian from the block; `W[16..63]` are computed by
the recurrence above, implemented as a fold that pushes one word at a time
onto the schedule array.  Because the loop bounds are the literals 16 and
64, every `get!` below is in bounds by construction. -/
def schedule (block : Array UInt8) : Array UInt32 := Id.run do
  let mut w : Array UInt32 := Array.mkEmpty 64
  -- W[0..15]: the block itself, read as sixteen big-endian 32-bit words.
  for i in [0:16] do
    let j := 4 * i
    w := w.push (bytesToWord (block.get! j) (block.get! (j + 1))
      (block.get! (j + 2)) (block.get! (j + 3)))
  -- W[16..63]: the recurrence W[t] = σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16].
  for t in [16:64] do
    let s1 := smallSigma1 (w.get! (t - 2))
    let s0 := smallSigma0 (w.get! (t - 15))
    w := w.push (s1 + w.get! (t - 7) + s0 + w.get! (t - 16))
  return w

/-!
## Section 5: the compression function (FIPS 180-4 section 6.2.2)

The compression function transforms the hash state by 64 rounds, one per
schedule word and round constant.  Round `t` computes

  T1 = h + Σ1(e) + Ch(e, f, g) + K[t] + W[t]
  T2 = Σ0(a) + Maj(a, b, c)

and updates the working variables by

  h := g,  g := f,  f := e,  e := d + T1,
  d := c,  c := b,  b := a,  a := T1 + T2,

all additions being addition modulo 2^32.
-/

/-- One round of the SHA-256 compression function (FIPS 180-4 section
6.2.2, step 3).  `round st k w` performs a single round with round constant
`k = K[t]` and schedule word `w = W[t]`, returning the updated vector of
working variables.  The update is written out variable by variable so that
each round is explicitly auditable against the standard; the theorem
`round_uses_temps` in section 10 records the agreement with the named
temporaries `T1` and `T2`. -/
def round (st : State) (k w : UInt32) : State :=
  let a := st 0
  let b := st 1
  let c := st 2
  let d := st 3
  let e := st 4
  let f := st 5
  let g := st 6
  let h := st 7
  let t1 := h + bigSigma1 e + ch e f g + k + w
  let t2 := bigSigma0 a + maj a b c
  fun i =>
    if i = 0 then t1 + t2        -- new a := T1 + T2
    else if i = 1 then a         -- new b := a
    else if i = 2 then b         -- new c := b
    else if i = 3 then c         -- new d := c
    else if i = 4 then d + t1    -- new e := d + T1
    else if i = 5 then e         -- new f := e
    else if i = 6 then f         -- new g := f
    else g                       -- new h := g

/-- The full compression function of FIPS 180-4 section 6.2.2, steps 2-4:
fold all 64 rounds over the message schedule of the block, then add the
resulting working variables back into the incoming hash state word by word
(the feed-forward, "Compute the i-th intermediate hash value H(i)").  The
64-round fold is an explicit loop over `t` in `[0, 64)`, so that the number
of rounds is directly auditable. -/
def compress (st : State) (block : Array UInt8) : State :=
  let w := schedule block
  Id.run do
    let mut s := st
    -- The 64-round fold: rounds 0 through 63, one per K[t], W[t].
    for t in [0:64] do
      s := round s (K.get! t) (w.get! t)
    -- Feed-forward: H(i)_j = H(i-1)_j + working variable j (mod 2^32).
    return fun i => s i + st i

/-!
## Section 6: padding (FIPS 180-4 section 5.1.1)

Padding is defined on lists of bytes so that the companion theorem file can
reason about it by list induction.  Given a message of length `L` bits
(here `L = 8 * l.length` for a byte list `l`), append the bit `1` (the byte
`0x80`, since all our messages are byte-aligned), then append `k` zero bits
where `k` is the smallest non-negative solution of `L + 1 + k ≡ 448 (mod
512)`, then append the 64-bit big-endian representation of `L`.

Since our messages are byte strings, `k` is always a multiple of 8 and we
append whole zero bytes.  The number of zero bytes to append is
`padZeros l.length` below.  The padded length is always a positive multiple
of 64 bytes; this is proved as `pad_length_multiple_of_64` in
`SHA256Theorems.lean`.
-/

/-- The number of zero bytes appended between the `0x80` delimiter and the
64-bit length field when padding a message of `n` bytes (FIPS 180-4 section
5.1.1).  Chosen so that `n + 1 + padZeros n + 8 ≡ 0 (mod 64)`; equivalently
`padZeros n` is the unique value in `[0, 64)` with `n + 9 + padZeros n`
divisible by 64. -/
def padZeros (n : Nat) : Nat :=
  (64 - (n + 9) % 64) % 64

/-- The 64-bit big-endian representation of the bit length, as a list of
eight bytes (FIPS 180-4 section 5.1.1: "append the 64-bit block that is
equal to the number L written using the binary representation").  Only the
low 64 bits of `n` are represented, matching the standard's requirement
that message lengths be below 2^64 bits.  Byte `i` of the result is
`(n / 2^(8*(7-i))) mod 256`. -/
def natToBe64 (n : Nat) : List UInt8 :=
  [ UInt8.ofNat (n / 72057594037927936),  -- byte 0 (most significant): bits 63..56 (2^56)
    UInt8.ofNat (n / 281474976710656),    -- byte 1: bits 55..48
    UInt8.ofNat (n / 1099511627776),      -- byte 2: bits 47..40
    UInt8.ofNat (n / 4294967296),         -- byte 3: bits 39..32
    UInt8.ofNat (n / 16777216),           -- byte 4: bits 31..24
    UInt8.ofNat (n / 65536),              -- byte 5: bits 23..16
    UInt8.ofNat (n / 256),                -- byte 6: bits 15..8
    UInt8.ofNat (n / 1) ]                 -- byte 7 (least significant): bits 7..0

/-- The padded message, as a list of bytes (FIPS 180-4 section 5.1.1):
the message, then `0x80`, then `padZeros` zero bytes, then the 64-bit
big-endian bit length.  Its length is always a multiple of 64; see
`SHA256Theorems.pad_length_multiple_of_64`. -/
def padList (m : List UInt8) : List UInt8 :=
  m ++ [0x80] ++ List.replicate (padZeros m.length) 0x00 ++ natToBe64 (m.length * 8)

/-- Padding lifted to `ByteArray` (FIPS 180-4 section 5.1.1).  This is a
thin wrapper around `padList`; all the mathematical content is in
`padList`, `padZeros` and `natToBe64`. -/
def pad (m : ByteArray) : ByteArray :=
  ByteArray.mk (Array.mk (padList m.data.toList))

/-!
## Section 7: block iteration and the top-level hash (FIPS 180-4 section 6.2)

After padding, the padded message is a sequence of 512-bit blocks
`M(1), M(2), ..., M(N)`.  The hash computation processes them in order:

  H(i) = compress(H(i-1), M(i)),   i = 1 .. N,

starting from `H(0) = H0`, and the digest is the concatenation of the eight
words of `H(N)`, each serialised big-endian.
-/

/-- Auxiliary block iteration with an explicit fuel parameter (so the
recursion is structural and needs no well-founded-termination proof).
Each iteration consumes one 64-byte block; the fuel computed in
`hashBlocks` below always suffices for a fully padded message: a nonempty
byte list of length `L` that is a multiple of 64 has exactly `L / 64`
blocks, and `L / 64 <= L / 64 + 1`. -/
def hashBlocksAux (st : State) (fuel : Nat) (bytes : List UInt8) : State :=
  match fuel with
  | 0 => st
  | fuel + 1 =>
    match bytes with
    | [] => st
    | _ =>
      let block := Array.mk (bytes.take 64)
      hashBlocksAux (compress st block) fuel (bytes.drop 64)

/-- Iterate the compression function over the (padded) message, one 64-byte
block at a time (FIPS 180-4 section 6.2.2: the message blocks `M(1)` through
`M(N)` "are processed in order").  The fuel `length / 64 + 1` bounds the
number of blocks of any message whose length is a multiple of 64 bytes. -/
def hashBlocks (st : State) (bytes : List UInt8) : State :=
  hashBlocksAux st (bytes.length / 64 + 1) bytes

/-- Serialise one 32-bit word as four bytes, most significant byte first
(FIPS 180-4 section 6.2.2 final step: the message digest is the
concatenation of the eight hash words, each big-endian). -/
def wordToBytes (w : UInt32) : List UInt8 :=
  [ ((UInt32.shiftRight w 24) &&& 0xff).toUInt8,
    ((UInt32.shiftRight w 16) &&& 0xff).toUInt8,
    ((UInt32.shiftRight w 8) &&& 0xff).toUInt8,
    (w &&& 0xff).toUInt8 ]

/-- Serialise the final hash state as 32 bytes: the concatenation of the
eight words `H(N)_0 .. H(N)_7`, each written big-endian (FIPS 180-4 section
6.2.2: "the 256-bit message digest ... H(N)_0 || H(N)_1 || ... || H(N)_7"). -/
def stateToBytes (st : State) : List UInt8 :=
  wordToBytes (st 0) ++ wordToBytes (st 1) ++ wordToBytes (st 2) ++
  wordToBytes (st 3) ++ wordToBytes (st 4) ++ wordToBytes (st 5) ++
  wordToBytes (st 6) ++ wordToBytes (st 7)

/-- The SHA-256 hash function (FIPS 180-4 section 6.2): pad the message,
process all blocks starting from the initial state, and serialise the final
state to a 32-byte digest.  The output is always exactly 32 bytes; see
`SHA256Theorems.sha256_output_length`. -/
def sha256 (m : ByteArray) : ByteArray :=
  ByteArray.mk (Array.mk (stateToBytes (hashBlocks initState (padList m.data.toList))))

/-!
## Section 8: hexadecimal utilities (local, dependency-free)

Known-answer tests are conventionally written as hex strings.  These
helpers encode digests to lowercase hex and decode hex strings to bytes, so
that the theorem files can state vectors in their published form.  They are
small, total, and use no external dependencies.
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

/-- Lowercase hex encoding of a byte string (no external dependencies). -/
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

/-- Decode an even-length hexadecimal string to a byte list, two characters
per byte, high nibble first.  Odd-length tails are discarded. -/
def hexDecodeAux : List Char → List UInt8
  | c1 :: c2 :: rest => (hexVal c1 * 16 + hexVal c2).toUInt8 :: hexDecodeAux rest
  | _ => []

/-- Decode a hexadecimal string to a `ByteArray`.  Used to write known
answer tests compactly in the companion theorem files. -/
def hexDecode (s : String) : ByteArray :=
  ByteArray.mk (Array.mk (hexDecodeAux s.toList))

/-- Convenience: SHA-256 of the UTF-8 encoding of a string, rendered as a
lowercase hex string.  This is the form in which most published test
vectors (including the FIPS 180-4 examples) are stated. -/
def sha256Hex (s : String) : String :=
  hexEncode (sha256 s.toUTF8)

/-!
## Section 9: derived constructions

The following are genuine, fully executable definitions built on `sha256`:
HMAC (RFC 2104), double SHA-256 (as used in Bitcoin), and iterated hashing.
They are included both because they are useful in their own right and
because they exercise `sha256` on structured inputs (64-byte key pads,
32-byte intermediate digests) that complement the raw test vectors.  The
correctness of `hmacSha256` is pinned down by RFC 4231 test case 1 in
`SHA256Theorems.lean`.
-/

/-- HMAC-SHA-256 (RFC 2104) with block size B = 64 bytes:

  HMAC(K, m) = H( (K0 XOR opad) || H( (K0 XOR ipad) || m ) )

where `K0` is the key hashed with `sha256` if it is longer than 64 bytes
and otherwise zero-padded on the right to 64 bytes, `ipad = 0x36` repeated
64 times and `opad = 0x5c` repeated 64 times.  Note that after the optional
hashing step the key list is at most 64 bytes long, so the zero-padding
count `64 - klist.length` below is never truncated. -/
def hmacSha256 (key msg : ByteArray) : ByteArray :=
  let k := if 64 < key.size then sha256 key else key
  let klist := k.data.toList
  -- zero-pad the (possibly hashed) key on the right to exactly 64 bytes
  let k0 := klist ++ List.replicate (64 - klist.length) 0x00
  let ipad := k0.map (fun b => b ^^^ 0x36)
  let opad := k0.map (fun b => b ^^^ 0x5c)
  let inner := sha256 (ByteArray.mk (Array.mk (ipad ++ msg.data.toList)))
  sha256 (ByteArray.mk (Array.mk (opad ++ inner.data.toList)))

/-- Double SHA-256: `sha256 (sha256 m)`.  Used as the hash function of the
Bitcoin block chain; a standard countermeasure against length-extension
attacks on plain SHA-256. -/
def doubleSha256 (m : ByteArray) : ByteArray :=
  sha256 (sha256 m)

/-- Iterated hashing: `sha256Chain m n` applies `sha256` `n` times in
succession, with `sha256Chain m 0 = m`.  This is the structure of hash
chains used in protocols such as S/KEY and in proof-of-work style iterated
hashing constructions. -/
def sha256Chain (m : ByteArray) : Nat → ByteArray
  | 0 => m
  | n + 1 => sha256 (sha256Chain m n)

/-!
## Section 10: additional auditable accessors and API conveniences

The definitions in this section are not new primitives: they are alternate
presentations and conveniences around the core algorithm above, provided so
that reviewers and downstream users can inspect intermediate values of the
computation (schedule words, round temporaries, per-block iteration) without
re-implementing anything.
-/

/-- The round temporary `T1` of FIPS 180-4 section 6.2.2, step 3, exposed
separately for auditability:

  T1 = h + Σ1(e) + Ch(e, f, g) + K[t] + W[t].

`round` above computes exactly this value; this definition allows theorems
and tests to refer to it directly. -/
def t1Temp (st : State) (k w : UInt32) : UInt32 :=
  st 7 + bigSigma1 (st 4) + ch (st 4) (st 5) (st 6) + k + w

/-- The round temporary `T2` of FIPS 180-4 section 6.2.2, step 3:

  T2 = Σ0(a) + Maj(a, b, c). -/
def t2Temp (st : State) : UInt32 :=
  bigSigma0 (st 0) + maj (st 0) (st 1) (st 2)

/-- `round` agrees with the explicitly named temporaries: the new `a` is
`T1 + T2` and the new `e` is `d + T1` (FIPS 180-4 section 6.2.2, step 3).
Both equations hold by reflexivity of the definitions. -/
theorem round_uses_temps (st : State) (k w : UInt32) :
    round st k w 0 = t1Temp st k w + t2Temp st ∧
    round st k w 4 = st 3 + t1Temp st k w := by
  exact ⟨rfl, rfl⟩

/-- Auxiliary for `messageBlocks` with explicit fuel, so the recursion is
structural.  Each step peels one 64-byte block off the front of the list. -/
def messageBlocksAux (fuel : Nat) (l : List UInt8) : List (List UInt8) :=
  match fuel with
  | 0 => []
  | fuel + 1 =>
    match l with
    | [] => []
    | _ => l.take 64 :: messageBlocksAux fuel (l.drop 64)

/-- Split a byte list into consecutive blocks of 64 bytes (FIPS 180-4
section 5.2.1: "the padded message is parsed into 512-bit blocks").  The
final block is shorter than 64 bytes only if the input length is not a
multiple of 64, which never happens for padded messages. -/
def messageBlocks (l : List UInt8) : List (List UInt8) :=
  messageBlocksAux (l.length / 64 + 1) l

/-- Fold the compression function over an explicit list of 64-byte blocks.
This is the mathematical content of `hashBlocks`: `hashBlocks` computes the
same value by consuming the padded byte string 64 bytes at a time. -/
def hashBlockList (st : State) : List (Array UInt8) → State
  | [] => st
  | b :: bs => hashBlockList (compress st b) bs

/-- Number of 64-byte blocks needed for a padded message of `n` bytes
(FIPS 180-4 section 5.1.1): always at least one. -/
def paddedBlockCount (n : Nat) : Nat :=
  (n + 1 + padZeros n + 8) / 64

/-- The full schedule of a block, viewed as a list of the 64 words
`W[0] .. W[63]` (FIPS 180-4 section 6.2.2, step 1).  This is simply the
list view of `schedule`; it is provided so that schedule words can be
pattern-matched and printed by test harnesses that prefer lists. -/
def scheduleWords (block : Array UInt8) : List UInt32 :=
  (schedule block).toList

/-- SHA-256 of a byte string, rendered as lowercase hex.  Companion to
`sha256Hex`, which hashes the UTF-8 encoding of a string. -/
def sha256HexBytes (m : ByteArray) : String :=
  hexEncode (sha256 m)

/-- HMAC-SHA-256 with the key and message given as strings (UTF-8 encoded),
rendered as lowercase hex. -/
def hmacSha256Hex (key msg : String) : String :=
  hexEncode (hmacSha256 key.toUTF8 msg.toUTF8)

/-- Double SHA-256, rendered as lowercase hex of the digest of the UTF-8
encoding of the input string. -/
def doubleSha256Hex (s : String) : String :=
  hexEncode (doubleSha256 s.toUTF8)

/-- Iterated hashing rendered as lowercase hex: `sha256ChainHex s n` is the
hex encoding of `sha256` applied `n` times to the UTF-8 bytes of `s`. -/
def sha256ChainHex (s : String) (n : Nat) : String :=
  hexEncode (sha256Chain s.toUTF8 n)

/-

=====================================================================
APPENDIX A: fully worked example (FIPS 180-4 Example 2, "abc")
=====================================================================

This appendix records, for audit, the complete intermediate state of the
computation for the message "abc" (0x616263), as produced by a reference
implementation and reproduced by the definitions above.  The companion
theorem file proves kat_abc : sha256Hex "abc" = the final digest below.

A.1  Padding (FIPS 180-4 section 5.1.1).  The message has L = 24 bits,
so padZeros 3 = 52 and the single padded block is:

  61 62 63 80 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 18

(message 61 62 63, delimiter 80, 52 zero bytes, length 0x18 = 24 bits.)

A.2  Message schedule W[0..63] (FIPS 180-4 section 6.2.2, step 1):

  W[ 0] = 61626380, W[ 1] = 00000000, W[ 2] = 00000000, W[ 3] = 00000000
  W[ 4] = 00000000, W[ 5] = 00000000, W[ 6] = 00000000, W[ 7] = 00000000
  W[ 8] = 00000000, W[ 9] = 00000000, W[10] = 00000000, W[11] = 00000000
  W[12] = 00000000, W[13] = 00000000, W[14] = 00000000, W[15] = 00000018
  W[16] = 61626380, W[17] = 000f0000, W[18] = 7da86405, W[19] = 600003c6
  W[20] = 3e9d7b78, W[21] = 0183fc00, W[22] = 12dcbfdb, W[23] = e2e2c38e
  W[24] = c8215c1a, W[25] = b73679a2, W[26] = e5bc3909, W[27] = 32663c5b
  W[28] = 9d209d67, W[29] = ec8726cb, W[30] = 702138a4, W[31] = d3b7973b
  W[32] = 93f5997f, W[33] = 3b68ba73, W[34] = aff4ffc1, W[35] = f10a5c62
  W[36] = 0a8b3996, W[37] = 72af830a, W[38] = 9409e33e, W[39] = 24641522
  W[40] = 9f47bf94, W[41] = f0a64f5a, W[42] = 3e246a79, W[43] = 27333ba3
  W[44] = 0c4763f2, W[45] = 840abf27, W[46] = 7a290d5d, W[47] = 065c43da
  W[48] = fb3e89cb, W[49] = cc7617db, W[50] = b9e66c34, W[51] = a9993667
  W[52] = 84badedd, W[53] = c21462bc, W[54] = 1487472c, W[55] = b20f7a99
  W[56] = ef57b9cd, W[57] = ebe6b238, W[58] = 9fe3095e, W[59] = 78bc8d4b
  W[60] = a43fcf15, W[61] = 668b2ff8, W[62] = eeaba2cc, W[63] = 12b1edeb

A.3  Compression trace (FIPS 180-4 section 6.2.2, step 3).  Working
variables a..h at the START of the round, with the round's T1 and T2.
First eight rounds:

  t = 0:
    a = 6a09e667  b = bb67ae85  c = 3c6ef372  d = a54ff53a
    e = 510e527f  f = 9b05688c  g = 1f83d9ab  h = 5be0cd19
    T1 = 54da50e8  T2 = 08909ae5
  t = 1:
    a = 5d6aebcd  b = 6a09e667  c = bb67ae85  d = 3c6ef372
    e = fa2a4622  f = 510e527f  g = 9b05688c  h = 1f83d9ab
    T1 = 3c5f8617  T2 = 1e0b5396
  t = 2:
    a = 5a6ad9ad  b = 5d6aebcd  c = 6a09e667  d = bb67ae85
    e = 78ce7989  f = fa2a4622  g = 510e527f  h = 9b05688c
    T1 = 3dc18b66  T2 = 8b01bc41
  t = 3:
    a = c8c347a7  b = 5a6ad9ad  c = 5d6aebcd  d = 6a09e667
    e = f92939eb  f = 78ce7989  g = fa2a4622  h = 510e527f
    T1 = bad621e9  T2 = 1a7ad47d
  t = 4:
    a = d550f666  b = c8c347a7  c = 5a6ad9ad  d = 5d6aebcd
    e = 24e00850  f = f92939eb  g = 78ce7989  h = fa2a4622
    T1 = e642b678  T2 = 1dfde3f2
  t = 5:
    a = 04409a6a  b = d550f666  c = c8c347a7  d = 5a6ad9ad
    e = 43ada245  f = 24e00850  g = f92939eb  h = 78ce7989
    T1 = 16d78700  T2 = 146a82f5
  t = 6:
    a = 2b4209f5  b = 04409a6a  c = d550f666  d = c8c347a7
    e = 714260ad  f = 43ada245  g = 24e00850  h = f92939eb
    T1 = d2645c5a  T2 = 129ea726
  t = 7:
    a = e5030380  b = 2b4209f5  c = 04409a6a  d = d550f666
    e = 9b27a401  f = 714260ad  g = 43ada245  h = 24e00850
    T1 = 37148413  T2 = 4e8bf74c

A.4  Final digest (feed-forward, FIPS 180-4 section 6.2.2, step 4):

  ba7816bf 8f01cfea 414140de 5dae2223 b00361a3 96177a9c b410ff61 f20015ad

  i.e. ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
A.3b Compression trace, rounds 8 through 63 (same format):

  t = 8:
    a = 85a07b5f  b = e5030380  c = 2b4209f5  d = 04409a6a
    e = 0c657a79  f = 9b27a401  g = 714260ad  h = 43ada245
    T1 = 2e899322  T2 = 5f7b5997
  t = 9:
    a = 8e04ecb9  b = 85a07b5f  c = e5030380  d = 2b4209f5
    e = 32ca2d8c  f = 0c657a79  g = 9b27a401  h = 714260ad
    T1 = f1871ba1  T2 = 9b0018ca
  t = 10:
    a = 8c87346b  b = 8e04ecb9  c = 85a07b5f  d = e5030380
    e = 1cc92596  f = 32ca2d8c  g = 0c657a79  h = 9b27a401
    T1 = 5e682068  T2 = e930838c
  t = 11:
    a = 4798a3f4  b = 8c87346b  c = 8e04ecb9  d = 85a07b5f
    e = 436b23e8  f = 1cc92596  g = 32ca2d8c  h = 0c657a79
    T1 = fbcf5b8a  T2 = fb506a1f
  t = 12:
    a = f71fc5a9  b = 4798a3f4  c = 8c87346b  d = 8e04ecb9
    e = 816fd6e9  f = 436b23e8  g = 1cc92596  h = 32ca2d8c
    T1 = 9052955f  T2 = f73e9431
  t = 13:
    a = 87912990  b = f71fc5a9  c = 4798a3f4  d = 8c87346b
    e = 1e578218  f = 816fd6e9  g = 436b23e8  h = 1cc92596
    T1 = e7d31473  T2 = f15fd6a3
  t = 14:
    a = d932eb16  b = 87912990  c = f71fc5a9  d = 4798a3f4
    e = 745a48de  f = 1e578218  g = 816fd6e9  h = 436b23e8
    T1 = c3fa4e18  T2 = fc6a11c6
  t = 15:
    a = c0645fde  b = d932eb16  c = 87912990  d = f71fc5a9
    e = 0b92f20c  f = 745a48de  g = 1e578218  h = 816fd6e9
    T1 = 10394824  T2 = a0c0db6a
  t = 16:
    a = b0fa238e  b = c0645fde  c = d932eb16  d = 87912990
    e = 07590dcd  f = 0b92f20c  g = 745a48de  h = 1e578218
    T1 = f8a2f90c  T2 = 2937a18f
  t = 17:
    a = 21da9a9b  b = b0fa238e  c = c0645fde  d = d932eb16
    e = 8034229c  f = 07590dcd  g = 0b92f20c  h = 745a48de
    T1 = ab3bf93e  T2 = 17bfe093
  t = 18:
    a = c2fbd9d1  b = 21da9a9b  c = b0fa238e  d = c0645fde
    e = 846ee454  f = 8034229c  g = 07590dcd  h = 0b92f20c
    T1 = 0c253983  T2 = f252423c
  t = 19:
    a = fe777bbf  b = c2fbd9d1  c = 21da9a9b  d = b0fa238e
    e = cc899961  f = 846ee454  g = 8034229c  h = 07590dcd
    T1 = ff695deb  T2 = e288ae48
  t = 20:
    a = e1f20c33  b = fe777bbf  c = c2fbd9d1  d = 21da9a9b
    e = b0638179  f = cc899961  g = 846ee454  h = 8034229c
    T1 = 68ffee95  T2 = 34c69cce
  t = 21:
    a = 9dc68b63  b = e1f20c33  c = fe777bbf  d = c2fbd9d1
    e = 8ada8930  f = b0638179  g = cc899961  h = 846ee454
    T1 = 1e299f9f  T2 = a436cdce
  t = 22:
    a = c2606d6d  b = 9dc68b63  c = e1f20c33  d = fe777bbf
    e = e1257970  f = 8ada8930  g = b0638179  h = cc899961
    T1 = 4b7d958b  T2 = 5c25ccb4
  t = 23:
    a = a7a3623f  b = c2606d6d  c = 9dc68b63  d = e1f20c33
    e = 49f5114a  f = e1257970  g = 8ada8930  h = b0638179
    T1 = c855b714  T2 = fd7f8679
  t = 24:
    a = c5d53d8d  b = a7a3623f  c = c2606d6d  d = 9dc68b63
    e = aa47c347  f = 49f5114a  g = e1257970  h = 8ada8930
    T1 = 8a5d642e  T2 = 91cec40a
  t = 25:
    a = 1c2c2838  b = c5d53d8d  c = a7a3623f  d = c2606d6d
    e = 2823ef91  f = aa47c347  g = 49f5114a  h = e1257970
    T1 = 51d7d021  T2 = 7c10335c
  t = 26:
    a = cde8037d  b = 1c2c2838  c = c5d53d8d  d = a7a3623f
    e = 14383d8e  f = 2823ef91  g = aa47c347  h = 49f5114a
    T1 = 1fa902d7  T2 = 9685c1e5
  t = 27:
    a = b62ec4bc  b = cde8037d  c = 1c2c2838  d = c5d53d8d
    e = c74c6516  f = 14383d8e  g = 2823ef91  h = aa47c347
    T1 = 282a826b  T2 = 4fa8f2bd
  t = 28:
    a = 77d37528  b = b62ec4bc  c = cde8037d  d = 1c2c2838
    e = edffbff8  f = c74c6516  g = 14383d8e  h = 2823ef91
    T1 = 44e67b7f  T2 = f14e074a
  t = 29:
    a = 363482c9  b = 77d37528  c = b62ec4bc  d = cde8037d
    e = 6112a3b7  f = edffbff8  g = c74c6516  h = 14383d8e
    T1 = dfff90ba  T2 = c0067a76
  t = 30:
    a = a0060b30  b = 363482c9  c = 77d37528  d = b62ec4bc
    e = ade79437  f = 6112a3b7  g = edffbff8  h = c74c6516
    T1 = 4adae67e  T2 = 9fbe43a4
  t = 31:
    a = ea992a22  b = a0060b30  c = 363482c9  d = 77d37528
    e = 0109ab3a  f = ade79437  g = 6112a3b7  h = edffbff8
    T1 = 42859bea  T2 = 312da00b
  t = 32:
    a = 73b33bf5  b = ea992a22  c = a0060b30  d = 363482c9
    e = ba591112  f = 0109ab3a  g = ade79437  h = 6112a3b7
    T1 = 66a5732d  T2 = 323bb1da
  t = 33:
    a = 98e12507  b = 73b33bf5  c = ea992a22  d = a0060b30
    e = 9cd9f5f6  f = ba591112  g = 0109ab3a  h = ade79437
    T1 = b91e92a3  T2 = 4541bb52
  t = 34:
    a = fe604df5  b = 98e12507  c = 73b33bf5  d = ea992a22
    e = 59249dd3  f = 9cd9f5f6  g = ba591112  h = 0109ab3a
    T1 = 1dc60e11  T2 = 8be1657b
  t = 35:
    a = a9a7738c  b = fe604df5  c = 98e12507  d = 73b33bf5
    e = 085f3833  f = 59249dd3  g = 9cd9f5f6  h = ba591112
    T1 = 80fcc6e1  T2 = e4a40903
  t = 36:
    a = 65a0cfe4  b = a9a7738c  c = fe604df5  d = 98e12507
    e = f4b002d6  f = 085f3833  g = 59249dd3  h = 9cd9f5f6
    T1 = 6e917d64  T2 = d314df4d
  t = 37:
    a = 41a65cb1  b = 65a0cfe4  c = a9a7738c  d = fe604df5
    e = 0772a26b  f = f4b002d6  g = 085f3833  h = 59249dd3
    T1 = a6a75748  T2 = 8e37bebc
  t = 38:
    a = 34df1604  b = 41a65cb1  c = 65a0cfe4  d = a9a7738c
    e = a507a53d  f = 0772a26b  g = f4b002d6  h = 085f3833
    T1 = 46d0a83c  T2 = 26f4d24e
  t = 39:
    a = 6dc57a8a  b = 34df1604  c = 41a65cb1  d = 65a0cfe4
    e = f0781bc8  f = a507a53d  g = 0772a26b  h = f4b002d6
    T1 = b95af0bc  T2 = c08f77be
  t = 40:
    a = 79ea687a  b = 6dc57a8a  c = 34df1604  d = 41a65cb1
    e = 1efbc0a0  f = f0781bc8  g = a507a53d  h = 0772a26b
    T1 = e48ed0b2  T2 = f1d836b4
  t = 41:
    a = d6670766  b = 79ea687a  c = 6dc57a8a  d = 34df1604
    e = 26352d63  f = 1efbc0a0  g = f0781bc8  h = a507a53d
    T1 = 4eac110d  T2 = 909a5422
  t = 42:
    a = df46652f  b = d6670766  c = 79ea687a  d = 6dc57a8a
    e = 838b2711  f = 26352d63  g = 1efbc0a0  h = f0781bc8
    T1 = 7107cc8b  T2 = a6a24173
  t = 43:
    a = 17aa0dfe  b = df46652f  c = d6670766  d = 79ea687a
    e = decd4715  f = 838b2711  g = 26352d63  h = 1efbc0a0
    T1 = 83b7e3b4  T2 = 1993cbdf
  t = 44:
    a = 9d4baf93  b = 17aa0dfe  c = df46652f  d = d6670766
    e = fda24c2e  f = decd4715  g = 838b2711  h = 26352d63
    T1 = d1a80a8a  T2 = 54ba7d8b
  t = 45:
    a = 26628815  b = 9d4baf93  c = 17aa0dfe  d = df46652f
    e = a80f11f0  f = fda24c2e  g = decd4715  h = 838b2711
    T1 = d82ef872  T2 = 9a7c531f
  t = 46:
    a = 72ab4b91  b = 26628815  c = 9d4baf93  d = 17aa0dfe
    e = b7755da1  f = a80f11f0  g = fda24c2e  h = decd4715
    T1 = bdd186ab  T2 = e37a8e05
  t = 47:
    a = a14c14b0  b = 72ab4b91  c = 26628815  d = 9d4baf93
    e = d57b94a9  f = b7755da1  g = a80f11f0  h = fda24c2e
    T1 = 61835c33  T2 = dfeed65a
  t = 48:
    a = 4172328d  b = a14c14b0  c = 72ab4b91  d = 26628815
    e = fecf0bc6  f = d57b94a9  g = b7755da1  h = a80f11f0
    T1 = 970eb823  T2 = 6e66c4c8
  t = 49:
    a = 05757ceb  b = 4172328d  c = a14c14b0  d = 72ab4b91
    e = bd714038  f = fecf0bc6  g = d57b94a9  h = b7755da1
    T1 = fbb0ed7b  T2 = f56b0d2d
  t = 50:
    a = f11bfaa8  b = 05757ceb  c = 4172328d  d = a14c14b0
    e = 6e5c390c  f = bd714038  g = fecf0bc6  h = d57b94a9
    T1 = b1a5b847  T2 = c85f505a
  t = 51:
    a = 7a0508a1  b = f11bfaa8  c = 05757ceb  d = 4172328d
    e = 52f1ccf7  f = 6e5c390c  g = bd714038  h = fecf0bc6
    T1 = 07b0e991  T2 = 80bd9091
  t = 52:
    a = 886e7a22  b = 7a0508a1  c = f11bfaa8  d = 05757ceb
    e = 49231c1e  f = 52f1ccf7  g = 6e5c390c  h = bd714038
    T1 = 4d290015  T2 = c2f6d27a
  t = 53:
    a = 101fd28f  b = 886e7a22  c = 7a0508a1  d = f11bfaa8
    e = 529e7d00  f = 49231c1e  g = 52f1ccf7  h = 6e5c390c
    T1 = ae2b8d1b  T2 = 4744a2c0
  t = 54:
    a = f5702fdb  b = 101fd28f  c = 886e7a22  d = 7a0508a1
    e = 9f4787c3  f = 529e7d00  g = 49231c1e  h = 52f1ccf7
    T1 = 6b0912ae  T2 = d3bb4a2d
  t = 55:
    a = 3ec45cdb  b = f5702fdb  c = 101fd28f  d = 886e7a22
    e = e50e1b4f  f = 9f4787c3  g = 529e7d00  h = 49231c1e
    T1 = cc5cac49  T2 = 6c6fecca
  t = 56:
    a = 38cc9913  b = 3ec45cdb  c = f5702fdb  d = 101fd28f
    e = 54cb266b  f = e50e1b4f  g = 9f4787c3  h = 529e7d00
    T1 = 8b3ebddd  T2 = 7192ca9e
  t = 57:
    a = fcd1887b  b = 38cc9913  c = 3ec45cdb  d = f5702fdb
    e = 9b5e906c  f = 54cb266b  g = e50e1b4f  h = 9f4787c3
    T1 = 88d3d0b3  T2 = 378f03bc
  t = 58:
    a = c062d46f  b = fcd1887b  c = 38cc9913  d = 3ec45cdb
    e = 7e44008e  f = 9b5e906c  g = 54cb266b  h = e50e1b4f
    T1 = 2ebf62eb  T2 = d0f7a187
  t = 59:
    a = ffb70472  b = c062d46f  c = fcd1887b  d = 38cc9913
    e = 6d83bfc6  f = 7e44008e  g = 9b5e906c  h = 54cb266b
    T1 = 794f142a  T2 = 3d5f7bd5
  t = 60:
    a = b6ae8fff  b = ffb70472  c = c062d46f  d = fcd1887b
    e = b21bad3d  f = 6d83bfc6  g = 7e44008e  h = 9b5e906c
    T1 = 994dc019  T2 = 1f106cd0
  t = 61:
    a = b85e2ce9  b = b6ae8fff  c = ffb70472  d = c062d46f
    e = 961f4894  f = b21bad3d  g = 6d83bfc6  h = 7e44008e
    T1 = d42a5147  T2 = 30a7fc25
  t = 62:
    a = 04d24d6c  b = b85e2ce9  c = b6ae8fff  d = ffb70472
    e = 948d25b6  f = 961f4894  g = b21bad3d  h = 6d83bfc6
    T1 = fb5b0d9e  T2 = d83f13c7
  t = 63:
    a = d39a2165  b = 04d24d6c  c = b85e2ce9  d = b6ae8fff
    e = fb121210  f = 948d25b6  g = 961f4894  h = b21bad3d
    T1 = a8467f25  T2 = a827b133

A.5  Second worked example: the two-block message of FIPS 180-4
Example 3, "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
(56 bytes, L = 448 bits).  padZeros 56 = 63, so the padded message
has two blocks; the length field is 0x1c0 = 448:

  61 62 63 64 62 63 64 65 63 64 65 66 64 65 66 67
  65 66 67 68 66 67 68 69 67 68 69 6a 68 69 6a 6b
  69 6a 6b 6c 6a 6b 6c 6d 6b 6c 6d 6e 6c 6d 6e 6f
  6d 6e 6f 70 6e 6f 70 71 80 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 c0

Intermediate hash H(1) after the first block:

  85e655d6 417a1795 3363376a 624cde5c 76e09589 cac5f811 cc4b32c1 f20e533a

Final digest:

  248d6a61 d20638b8 e5c02693 0c3e6039 a33ce459 64ff2167 f6ecedd4 19db06c1

  i.e. 248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1
=====================================================================
APPENDIX B: known-answer test summary (see SHA256Theorems.lean)
=====================================================================

Every vector below is stated and proved (by native_decide) in the
companion file SHA256Theorems.lean.  All expected digests were taken
from the project ground-truth file, which was itself verified against
a reference implementation of FIPS 180-4.

  empty                                                    len       0 bits
    expected = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    source   = NIST CAVP SHA256ShortMsg LEN=0 / FIPS 180-4 example 1
  abc                                                      len      24 bits
    expected = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    source   = FIPS 180-4 example 2 / CAVP
  abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq len     448 bits
    expected = 248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1
    source   = FIPS 180-4 example 3 (448-bit)
  fips_ex4_896bit                                          len     896 bits
    expected = cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1
    source   = FIPS 180-4 example 4 (896-bit)
  million_a                                                len 8000000 bits
    expected = cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0
    source   = FIPS 180-4 example 5 / CAVP long message
  kat_1B                                                   len       8 bits
    expected = e7cf46a078fed4fafd0b5e3aff144802b853f8ae459a4f0c14add3314b7cc3a6
    source   = generated KAT (hashlib-verified)
  kat_2B                                                   len      16 bits
    expected = cdc63a6325d5fa92515578c0b418e6eeec1c6d085937a24fc43c2126ea517457
    source   = generated KAT (hashlib-verified)
  kat_3B                                                   len      24 bits
    expected = b39fad1a1075f64570b3226d339ea818f9c66ecd2f1c59fd8b9c5a32b54c513f
    source   = generated KAT (hashlib-verified)
  kat_55B                                                  len     440 bits
    expected = 2900465fcb533e05a158fd2b3be0e5e3b03740d83060aa3580e0d98a96bf2384
    source   = generated KAT (hashlib-verified)
  kat_56B                                                  len     448 bits
    expected = 31454ff48ef36af2f08fd511bdc37d9d5855ac23e992e5ff5445cb6b7674a674
    source   = generated KAT (hashlib-verified)
  kat_57B                                                  len     456 bits
    expected = bcc0a5d3791b985b7550e04ca660a6c63a589ba1edd2283c8e110e5b515df124
    source   = generated KAT (hashlib-verified)
  kat_63B                                                  len     504 bits
    expected = 5f6401b96532c36de4e65beec0409b69b1d181864c8009b7a04f43e5d56350d1
    source   = generated KAT (hashlib-verified)
  kat_64B                                                  len     512 bits
    expected = 94eb5de4943613fd048dc93393ab06877405faa39c11f53e9386083339833e7e
    source   = generated KAT (hashlib-verified)
  kat_65B                                                  len     520 bits
    expected = fc518669b6eb4b4dd91827ecacef86689c725bd5bab888fd3b26dbb196eec954
    source   = generated KAT (hashlib-verified)
  kat_119B                                                 len     952 bits
    expected = b0dc41b1a384e2f1203f0351b38fbeaafceef577ce1191d5bfc25da39f721eae
    source   = generated KAT (hashlib-verified)
  kat_120B                                                 len     960 bits
    expected = 5df24dd802ac26132ce608dcb5f09841eef039ee0f152acf98d26d17fe4e88e6
    source   = generated KAT (hashlib-verified)
  kat_127B                                                 len    1016 bits
    expected = 0fe729ff19257bd6fec853acc2ea355f6b34b58e6c0f684c3e188fcdfcd9baae
    source   = generated KAT (hashlib-verified)
  kat_128B                                                 len    1024 bits
    expected = 0aedd4856f8eba0963627336ad5144a9a7dbe12498e6066f0165fc97d8ddee4c
    source   = generated KAT (hashlib-verified)
  kat_129B                                                 len    1032 bits
    expected = 4f1757ae4bffbae86d775b831765b75af154d52f7deaa46dd378051a2d3ad57f
    source   = generated KAT (hashlib-verified)
  kat_255B                                                 len    2040 bits
    expected = 3c835ac0bba7147eaa568a76183d465e72ac456df24b55e01d44dc87be05a971
    source   = generated KAT (hashlib-verified)
  kat_256B                                                 len    2048 bits
    expected = 3ef33734daae0e353f132ff5f3241d8f86ba81f851c0b9685149f079c16eb45b
    source   = generated KAT (hashlib-verified)
  kat_1000B                                                len    8000 bits
    expected = 57799de80e3dd6e2ac4d40c41a150d1662f7f87d0d994776a2fdc37c39b0ea4e
    source   = generated KAT (hashlib-verified)

APPENDIX C: adversarial test summary (see SHA256Hostile.lean)

  len_55_max_single_block          55 bytes: longest message fitting one padded block
    expected = 02779466cdec163811d078815c633f21901413081449002f24aa3e80f0b88ef7
  len_56_forces_two_blocks         56 bytes: minimal length forcing second block (length field overflow into new block)
    expected = d464bb04abbc80a2254cd4ad0f3356f1b70b5b6390085b193edcd291f065b01e
  len_63_block_minus_one           63 bytes: one byte under block size
    expected = d12449c8124182545ae91924286cc6af13528bcf62a5ddbd5e00b891fffc1b48
  len_64_exact_block               64 bytes: exact block; padding occupies entire second block
    expected = f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b
  len_65_block_plus_one            65 bytes: first multi-block data
    expected = dc7156746a46cbe6edfaceb4ccfb9b27fc7250d2608a991848cfec6f62f39932
  len_119_double_boundary_low      119 bytes: 2-block boundary analogue of 55
    expected = 2b65d765e9a878e2ff822128260e1a496b06d112dfb1e28b04a7597ea74d70fb
  len_120_double_boundary_high     120 bytes: 2-block boundary analogue of 56
    expected = 09a02baece236f519f993edbc70815d9987454d75b244e985ff156ca2865d63b
  all_zero_64                      all-zero full block: tests constant injection, no input entropy
    expected = f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b
  all_ff_64                        all-ones full block: maximal Hamming weight input
    expected = 8667e718294e9e0df1d30600ba3eeb201f764aad2dad72748643e4a285e1d1f7
  all_ff_1                         single byte 0xFF: high-bit set, exercises 0x80 padding delimiter adjacency
    expected = a8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89
  single_zero                      single zero byte: minimal nonempty input
    expected = 6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d
  bitlength_0_vs_80_collision_probe distinguishes 0-bit from 80-bit preimage (padding injectivity)
    expected = 01d448afd928065458cf670b60f5a594d735af0172c8d67f22a81680132681ca
  abc_highbit_variant              0x80 terminator byte inside message: padding-delimiter confusion attack
    expected = f9863f51bd38625dacc35a74b984a82e88b3b070fe1be491878cbe77704bc0af
  abc_ff_variant                   0xFF inside message adjacent to padding
    expected = 8e3b08dc1236880bf0c55873db58b12d8bf0398b1b17c9686e015ccfe098d35d
  len_128_exact_two_blocks         exactly two data blocks: padding in third block
    expected = 7abaa701a6f4bb8d9ea3872a315597eb6f2ccfd03392d8d10560837f6136d06a
  len_127                          one byte under two blocks
    expected = 0875818355c7fb9bc0f246dad7fa1010a13b8a97162af00a3870bacec1400332
  len_129                          one byte over two blocks
    expected = 95b9362aa85cb5a5ea893c0d7681165e45e9e5c29d73e05efd6f45455bc2a056
  million_a                        1,000,000 × 0x61: CAVP long-message stress (64-bit length counter integrity)
    expected = cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0
  sequential_0_255                 all byte values ascending: S-box-like coverage of input alphabet
    expected = 40aff2e9d2d8922e47afd4648e6967497158785fbd1da870e7110266bf944880
  sequential_255_0                 all byte values descending
    expected = cd6816b77f68d70001fc3eaa4d42bdd67cb5973b3151cc5292ecc02a3daac6ab
  alternating_aa_55_100            alternating 10101010/01010101 pattern: maximal bit-flip density
    expected = 7b79b7f0a94603f6d0d17af5ca22f60d03e7743ca486a6490086eaf5fb816e89
  len_1000                         1000 bytes irregular: 16 blocks + partial
    expected = d65421767957649d707b553fb0062bfa78475eaacc89f973272a4841de37ae79
  len_4096_power_of_two            4096 bytes: 64 exact blocks, no partial tail
    expected = d010f6d76d0eb4dce5d5b5b34014a8a157ec4380a66c24d7d455a9bf652db14a
  bit_level_msb_set_all            0x80 repeated at the 56-byte boundary: delimiter ambiguity stress
    expected = ab44ecde4bac7f799c8588f617770b1a5877bead1a4bee5d3d848cd41b8855a0
-/

end ProofBundle.Crypto.SHA256
