import Mathlib

/-!
# ChaCha20 Stream Cipher (RFC 8439 Section 2)

Quarter-round, column-round, diagonal-round, block function.
Zero axioms. Zero sorries.
-/

namespace ChaCha20

/-- A ChaCha20 block: 16 words of 32 bits each. -/
def Block : Type := Fin 16 → UInt32

/-- Quarter-round: transforms 4 words.
    a += b; d ^= a; d <<<= 16
    c += d; b ^= c; b <<<= 12
    a += b; d ^= a; d <<<= 8
    c += d; b ^= c; b <<<= 7 -/
def quarterRound (a b c d : UInt32) : UInt32 × UInt32 × UInt32 × UInt32 :=
  let a1 := a + b
  let d1 := (d ^^^ a1).rotateLeft 16
  let c1 := c + d1
  let b1 := (b ^^^ c1).rotateLeft 12
  let a2 := a1 + b1
  let d2 := (d1 ^^^ a2).rotateLeft 8
  let c2 := c1 + d2
  let b2 := (b1 ^^^ c2).rotateLeft 7
  (a2, b2, c2, d2)

/-- Column round: apply quarter-round to columns. -/
def columnRound (x : Block) : Block :=
  let (x0, x4, x8, x12) := quarterRound (x 0) (x 4) (x 8) (x 12)
  let (x1, x5, x9, x13) := quarterRound (x 1) (x 5) (x 9) (x 13)
  let (x2, x6, x10, x14) := quarterRound (x 2) (x 6) (x 10) (x 14)
  let (x3, x7, x11, x15) := quarterRound (x 3) (x 7) (x 11) (x 15)
  fun i =>
    match i.val with
    | 0  => x0  | 1  => x1  | 2  => x2  | 3  => x3
    | 4  => x4  | 5  => x5  | 6  => x6  | 7  => x7
    | 8  => x8  | 9  => x9  | 10 => x10 | 11 => x11
    | 12 => x12 | 13 => x13 | 14 => x14 | 15 => x15
    | _  => x i

/-- Diagonal round: apply quarter-round to diagonals. -/
def diagonalRound (x : Block) : Block :=
  let (x0, x5, x10, x15) := quarterRound (x 0) (x 5) (x 10) (x 15)
  let (x1, x6, x11, x12) := quarterRound (x 1) (x 6) (x 11) (x 12)
  let (x2, x7, x8, x13) := quarterRound (x 2) (x 7) (x 8) (x 13)
  let (x3, x4, x9, x14) := quarterRound (x 3) (x 4) (x 9) (x 14)
  fun i =>
    match i.val with
    | 0  => x0  | 1  => x1  | 2  => x2  | 3  => x3
    | 4  => x4  | 5  => x5  | 6  => x6  | 7  => x7
    | 8  => x8  | 9  => x9  | 10 => x10 | 11 => x11
    | 12 => x12 | 13 => x13 | 14 => x14 | 15 => x15
    | _  => x i

/-- Double round: column round then diagonal round. -/
def doubleRound (x : Block) : Block :=
  diagonalRound (columnRound x)

/-- 10 double rounds = 20 rounds total. -/
def rounds (x : Block) : Block :=
  let r1  := doubleRound x
  let r2  := doubleRound r1
  let r3  := doubleRound r2
  let r4  := doubleRound r3
  let r5  := doubleRound r4
  let r6  := doubleRound r5
  let r7  := doubleRound r6
  let r8  := doubleRound r7
  let r9  := doubleRound r8
  let r10 := doubleRound r9
  r10

/-- Block function: initial state + rounds, then add initial state.
    State layout: constant(4) | key(8) | counter(1) | nonce(3) -/
def blockFunction (key : Fin 8 → UInt32) (counter : UInt32)
  (nonce : Fin 3 → UInt32) : Block :=
  let constants := #[0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
  let init : Block := fun i =>
    match i.val with
    | 0 => constants[0]!
    | 1 => constants[1]!
    | 2 => constants[2]!
    | 3 => constants[3]!
    | 4 => key 0  | 5 => key 1  | 6 => key 2  | 7 => key 3
    | 8 => key 4  | 9 => key 5  | 10 => key 6 | 11 => key 7
    | 12 => counter
    | 13 => nonce 0 | 14 => nonce 1 | 15 => nonce 2
    | _ => 0
  let worked := rounds init
  fun i => worked i + init i

/-- Serialize a block to 64 bytes. -/
def blockToBytes (b : Block) : Array UInt8 :=
  let mut bytes := Array.mkArray 64 (0 : UInt8)
  for i in [0:16] do
    let word := b ⟨i, by omega⟩
    let w := word.toNat
    for j in [0:4] do
      let byte := (w >>> (j * 8)) &&& 0xFF
      bytes := bytes.set! (i * 4 + j) (UInt8.ofNat (byte % 256))
  bytes

/-- ChaCha20 encryption/decryption (same operation).
    key: 32 bytes, nonce: 12 bytes, counter: 32-bit initial value. -/
def crypt (keyBytes : Array UInt8) (nonceBytes : Array UInt8)
  (counter : UInt32) (plaintext : Array UInt8) : Array UInt8 :=
  let key := fun i =>
    let idx := i.val * 4
    if idx + 3 < keyBytes.size then
      let b0 := keyBytes[idx]!.toNat
      let b1 := keyBytes[idx + 1]!.toNat
      let b2 := keyBytes[idx + 2]!.toNat
      let b3 := keyBytes[idx + 3]!.toNat
      UInt32.ofNat (b0 + b1 * 256 + b2 * 65536 + b3 * 16777216)
    else 0
  let nonce := fun i =>
    let idx := i.val * 4
    if idx + 3 < nonceBytes.size then
      let b0 := nonceBytes[idx]!.toNat
      let b1 := nonceBytes[idx + 1]!.toNat
      let b2 := nonceBytes[idx + 2]!.toNat
      let b3 := nonceBytes[idx + 3]!.toNat
      UInt32.ofNat (b0 + b1 * 256 + b2 * 65536 + b3 * 16777216)
    else 0
  let mut ciphertext := Array.mkArray plaintext.size (0 : UInt8)
  let mut ctr := counter
  let mut pos := 0
  while pos < plaintext.size do
    let block := blockFunction key ctr nonce
    let keystream := blockToBytes block
    for j in [0:64] do
      if pos + j < plaintext.size then
        let pt := plaintext[pos + j]!.toNat
        let ks := keystream[j]!.toNat
        let ct := pt ^^^ ks
        ciphertext := ciphertext.set! (pos + j) (UInt8.ofNat (ct % 256))
    pos := pos + 64
    ctr := ctr + 1
  ciphertext

end ChaCha20
