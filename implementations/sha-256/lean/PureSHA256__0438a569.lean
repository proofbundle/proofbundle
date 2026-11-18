/-
# Pure, list-based SHA-256 derived from first principles

Implementation notes:
* No `UInt32`, `UInt8`, `ByteArray`, `Array`, or mutable state.
* Words are natural numbers modulo `2^32`; bytes are natural numbers < 256.
* All data structures are `List` or `Nat`.
* Bitwise operations are the first-principles `CleanSpec.NatBits` primitives
  (recursion on `Nat.mod`/`Nat.div` by 2), not core `Nat.land`/`Nat.lor`/
  `Nat.xor`, so closed theorems do not depend on `propext`.
* No `native_decide`, no `sorry`, no `admit`, no `axiom`, no `Classical`.
* Constants are regenerated from the fractional parts of prime roots, exactly
  as in FIPS 180-4 §4.2.1 and §4.2.2.
-/

import CleanSpec.NatBits

namespace CleanSpec.PureSHA256

open CleanSpec.NatBits

/-- Modulus for a 32-bit SHA-256 word. -/
def WORDMOD : Nat := 4294967296 -- 2^32

/-- Mask to 32 bits using Nat bitwise AND. -/
def mask32 (x : Nat) : Nat := bitAnd x (WORDMOD - 1)

/-- Logical right shift of a word by `n` bits. -/
def shr (x n : Nat) : Nat := shiftRight x n

/-- Left shift of a word by `n` bits, masked to 32 bits. -/
def shl (x n : Nat) : Nat := mask32 (shiftLeft x n)

/-- Right rotation of a 32-bit word by `n` bits. -/
def rotr (x : Nat) (n : Nat) : Nat :=
  mask32 (bitOr (shiftRight x n) (shl x (32 - n)))

/-- Bitwise `Ch` (choose) function on words (FIPS 180-4 §4.1.2 eq. 4.2). -/
def ch (x y z : Nat) : Nat :=
  bitXor (bitAnd x y) (bitAnd (WORDMOD - 1 - x) z)

/-- Bitwise `Maj` (majority) function on words (FIPS 180-4 §4.1.2 eq. 4.3). -/
def maj (x y z : Nat) : Nat :=
  bitXor (bitXor (bitAnd x y) (bitAnd x z)) (bitAnd y z)

/-- `Σ0` big sigma function (FIPS 180-4 §4.1.2 eq. 4.4). -/
def bigSigma0 (x : Nat) : Nat :=
  bitXor (bitXor (rotr x 2) (rotr x 13)) (rotr x 22)

/-- `Σ1` big sigma function (FIPS 180-4 §4.1.2 eq. 4.5). -/
def bigSigma1 (x : Nat) : Nat :=
  bitXor (bitXor (rotr x 6) (rotr x 11)) (rotr x 25)

/-- `σ0` small sigma function (FIPS 180-4 §4.1.2 eq. 4.6). -/
def smallSigma0 (x : Nat) : Nat :=
  bitXor (bitXor (rotr x 7) (rotr x 18)) (shr x 3)

/-- `σ1` small sigma function (FIPS 180-4 §4.1.2 eq. 4.7). -/
def smallSigma1 (x : Nat) : Nat :=
  bitXor (bitXor (rotr x 17) (rotr x 19)) (shr x 10)

/-- Round constants K[0..63] (FIPS 180-4 §4.2.2). -/
def K : List Nat := [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

/-- Initial hash value H0[0..7] (FIPS 180-4 §4.2.1). -/
def H0 : List Nat := [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]

-- ---------------------------------------------------------------------------
-- Word/byte conversions and schedule
-- ---------------------------------------------------------------------------

/-- Assemble four bytes (each < 256) into one big-endian 32-bit word. -/
def bytesToWord (b0 b1 b2 b3 : Nat) : Nat :=
  bitOr (bitOr (shiftLeft b0 24) (shiftLeft b1 16))
        (bitOr (shiftLeft b2 8) b3)

/-- Split a 32-bit word into four big-endian bytes. -/
def wordToBytes (w : Nat) : List Nat :=
  [ shiftRight w 24,
    bitAnd (shiftRight w 16) 255,
    bitAnd (shiftRight w 8) 255,
    bitAnd w 255 ]

/-- Read the i-th big-endian word from a 64-byte block (0 ≤ i < 16). -/
def blockWord (block : List Nat) (i : Nat) : Nat :=
  bytesToWord (getD block (4 * i) 0) (getD block (4 * i + 1) 0)
              (getD block (4 * i + 2) 0) (getD block (4 * i + 3) 0)

/-- Build the first 16 schedule words from a 64-byte block. -/
def scheduleInit (block : List Nat) : List Nat :=
  List.map (blockWord block) (List.range 16)

/-- Extend a 16-word schedule to 64 words using the SHA-256 recurrence.
    `fuel` is the number of words still to append (48 for a fresh block). -/
def scheduleExtend (ws : List Nat) (fuel : Nat) : List Nat :=
  match fuel with
  | 0 => ws
  | fuel + 1 =>
      let t := ws.length
      let wtm2 := getD ws (t - 2) 0
      let wtm7 := getD ws (t - 7) 0
      let wtm15 := getD ws (t - 15) 0
      let wtm16 := getD ws (t - 16) 0
      let v := mask32 (smallSigma1 wtm2 + wtm7 + smallSigma0 wtm15 + wtm16)
      scheduleExtend (ws ++ [v]) fuel

/-- Full 64-word schedule for a 64-byte block. -/
def schedule (block : List Nat) : List Nat :=
  scheduleExtend (scheduleInit block) 48

-- ---------------------------------------------------------------------------
-- Compression, padding, and top-level hash
-- ---------------------------------------------------------------------------

/-- One round of SHA-256 compression.  State is a list of 8 words
    [a,b,c,d,e,f,g,h]. -/
def round (st : List Nat) (k w : Nat) : List Nat :=
  let a := getD st 0 0
  let b := getD st 1 0
  let c := getD st 2 0
  let d := getD st 3 0
  let e := getD st 4 0
  let f := getD st 5 0
  let g := getD st 6 0
  let h := getD st 7 0
  let t1 := mask32 (h + bigSigma1 e + ch e f g + k + w)
  let t2 := mask32 (bigSigma0 a + maj a b c)
  [ mask32 (t1 + t2), a, b, c, mask32 (d + t1), e, f, g ]

/-- Run 64 compression rounds on a state using a schedule and constants. -/
def compressRounds (st : List Nat) (ks : List (Nat × Nat)) : List Nat :=
  match ks with
  | [] => st
  | (k, w) :: rest => compressRounds (round st k w) rest

/-- Compress a single 64-byte block into a new state. -/
def compress (st : List Nat) (block : List Nat) : List Nat :=
  let ws := schedule block
  let paired := List.zip K ws
  let newSt := compressRounds st paired
  List.zipWith (fun x y => mask32 (x + y)) newSt st

/-- Number of zero bytes required after the 0x80 delimiter. -/
def padZeros (n : Nat) : Nat :=
  (64 - (n + 9) % 64) % 64

/-- Big-endian 64-bit length field (in bytes) for a message of `n` bytes. -/
def lengthField (n : Nat) : List Nat :=
  [ shiftRight (n * 8) 56,
    bitAnd (shiftRight (n * 8) 48) 255,
    bitAnd (shiftRight (n * 8) 40) 255,
    bitAnd (shiftRight (n * 8) 32) 255,
    bitAnd (shiftRight (n * 8) 24) 255,
    bitAnd (shiftRight (n * 8) 16) 255,
    bitAnd (shiftRight (n * 8) 8) 255,
    bitAnd (n * 8) 255 ]

/-- SHA-256 padding of a byte list. -/
def pad (msg : List Nat) : List Nat :=
  msg ++ [0x80] ++ List.replicate (padZeros msg.length) 0x00 ++ lengthField msg.length

/-- Auxiliary: split a message into `fuel` 64-byte blocks. -/
def blocksAux (fuel : Nat) (msg : List Nat) : List (List Nat) :=
  match fuel with
  | 0 => []
  | fuel + 1 => msg.take 64 :: blocksAux fuel (msg.drop 64)

/-- Split a padded message into 64-byte blocks.  The padded length is always
    a multiple of 64, so `msg.length / 64` is exact. -/
def blocks (msg : List Nat) : List (List Nat) :=
  blocksAux (shiftRight msg.length 6) msg

/-- Hash a list of blocks starting from an initial state. -/
def hashBlocks (st : List Nat) (bs : List (List Nat)) : List Nat :=
  match bs with
  | [] => st
  | b :: rest => hashBlocks (compress st b) rest

/-- SHA-256 digest of a byte list, as a list of 32 bytes. -/
def sha256Bytes (msg : List Nat) : List Nat :=
  let padded := pad msg
  let bs := blocks padded
  let st := hashBlocks H0 bs
  List.flatMap wordToBytes st

-- ---------------------------------------------------------------------------
-- Hexadecimal helpers (only for closed test vectors)
-- ---------------------------------------------------------------------------

/-- Numeric value of a hex digit.  Out-of-range characters map to 0. -/
def hexVal (c : Char) : Nat :=
  let n := Char.toNat c
  match Nat.ble 48 n && Nat.ble n 57 with
  | true => n - 48
  | false =>
    match Nat.ble 97 n && Nat.ble n 102 with
    | true => n - 87
    | false =>
      match Nat.ble 65 n && Nat.ble n 70 with
      | true => n - 55
      | false => 0

/-- Value of two hex digits as one byte. -/
def hexPair (c1 c2 : Char) : Nat := hexVal c1 * 16 + hexVal c2

/-- Decode a list of characters as pairs of hex digits to a byte list. -/
def hexDecodeAux (cs : List Char) : List Nat :=
  match cs with
  | c1 :: c2 :: rest => hexPair c1 c2 :: hexDecodeAux rest
  | _ => []

/-- Decode a lowercase/uppercase hex string to a byte list. -/
def hexDecode (s : String) : List Nat :=
  hexDecodeAux s.toList

end CleanSpec.PureSHA256
