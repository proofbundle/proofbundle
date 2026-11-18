/-
Pure, list-based ChaCha20 (RFC 8439 §2.1 - §2.4)

Implementation notes (same discipline as `CleanSpec.PureSHA256`):
* No `UInt32`, `UInt8`, `ByteArray`, `Array`, or mutable state.
* Words are natural numbers < 2^32; bytes are natural numbers < 256.
* All data structures are `List Nat`, `Nat`, or a 4-tuple of `Nat`.
* XOR is the first-principles `CleanSpec.NatBits.bitXor` (recursion on
  `Nat.mod`/`Nat.div` by 2), never core `Nat.xor`.
* Addition mod 2^32 and the 32-bit left roll are plain `Nat` arithmetic
  (`+`, `*`, `/`, `%` by powers of two).  For x < 2^32 and 0 < n < 32 the two
  summands of `rotl32` occupy disjoint bit ranges, so `+` coincides with the
  bitwise OR the RFC describes; this is exercised by the §2.1.1/§2.2.1 KATs.
* Lists are indexed only by `CleanSpec.NatBits.getD` or by pattern matching
  -- never by core `List.getD`, `List.get?` or `xs[i]` (core `List.getD`
  pulls in `propext`, see MISTAKES.md item 1).
* Every pattern match is non-overlapping and exhaustive.  A match whose
  later arm overlaps an earlier one (e.g. `| x :: xs, y :: ys => .. | _, _ =>
  ..`) is compiled by Lean 4.32 into a matcher that depends on `propext`;
  this was measured with `#print axioms` on 2026-10-02 (see
  MISTAKES.md item 6), not assumed.
* No `native_decide`, no `sorry`, no `admit`, no `axiom`, no `Classical`.

Malformed inputs: `block`/`encrypt` return `[]` unless the key is exactly 32
bytes and the nonce exactly 12 bytes (`ChaCha20Hostile.lean` proves this for
concrete off-by-one lengths).  The 32-bit block counter wraps modulo 2^32
(RFC 8439 §2.3: the counter is a 32-bit word); the wrap is proved, not
assumed, in `ChaCha20Hostile.lean`.
-/

import CleanSpec.NatBits

namespace CleanSpec.ChaCha20

open CleanSpec.NatBits (getD)

/-- 2^32. -/
def WORDMOD : Nat := 4294967296

/-- Addition modulo 2^32 (RFC 8439 §2.1, "+"). -/
def add32 (a b : Nat) : Nat := (a + b) % WORDMOD

/-- Bitwise XOR of two 32-bit words (RFC 8439 §2.1, "^"), via the
    first-principles `NatBits.bitXor`. -/
def xor32 (a b : Nat) : Nat := NatBits.bitXor a b

/-- n-bit left roll of a 32-bit word, 0 < n < 32 (RFC 8439 §2.1, "<<<"). -/
def rotl32 (x n : Nat) : Nat := (x * 2 ^ n) % WORDMOD + x / 2 ^ (32 - n)

/-- The ChaCha quarter round on four words (RFC 8439 §2.1):
      a += b; d ^= a; d <<<= 16;
      c += d; b ^= c; b <<<= 12;
      a += b; d ^= a; d <<<= 8;
      c += d; b ^= c; b <<<= 7; -/
def quarterRound (a b c d : Nat) : Nat × Nat × Nat × Nat :=
  let a := add32 a b
  let d := rotl32 (xor32 d a) 16
  let c := add32 c d
  let b := rotl32 (xor32 b c) 12
  let a := add32 a b
  let d := rotl32 (xor32 d a) 8
  let c := add32 c d
  let b := rotl32 (xor32 b c) 7
  (a, b, c, d)

/-- `quarterRound` on a list `[a, b, c, d]`; used only to state the RFC 8439
    §2.1.1 test vector against list data.  (Indexing is `NatBits.getD`, so a
    shorter list reads missing words as 0.) -/
def quarterRoundList (s : List Nat) : List Nat :=
  match quarterRound (getD s 0 0) (getD s 1 0) (getD s 2 0) (getD s 3 0) with
  | (a, b, c, d) => [a, b, c, d]

/-- QUARTERROUND(2, 7, 8, 13) applied to a 16-word state (RFC 8439 §2.2);
    used only for the §2.2.1 test vector. -/
def qr2_7_8_13 (s : List Nat) : List Nat :=
  match quarterRound (getD s 2 0) (getD s 7 0) (getD s 8 0) (getD s 13 0) with
  | (y2, y7, y8, y13) =>
    [getD s 0 0, getD s 1 0, y2, getD s 3 0, getD s 4 0, getD s 5 0, getD s 6 0, y7,
     y8, getD s 9 0, getD s 10 0, getD s 11 0, getD s 12 0, y13, getD s 14 0, getD s 15 0]

/-- One column round followed by one diagonal round (RFC 8439 §2.3.1,
    `inner_block`) on a 16-word state.  Words are read with `NatBits.getD`
    (structural recursion); the state built by `initState` from a 32-byte key
    and a 12-byte nonce always has exactly 16 words, and `block` checks
    those lengths before calling this. -/
def innerBlock (s : List Nat) : List Nat :=
  match quarterRound (getD s 0 0) (getD s 4 0) (getD s 8 0) (getD s 12 0) with
  | (x0, x4, x8, x12) =>
  match quarterRound (getD s 1 0) (getD s 5 0) (getD s 9 0) (getD s 13 0) with
  | (x1, x5, x9, x13) =>
  match quarterRound (getD s 2 0) (getD s 6 0) (getD s 10 0) (getD s 14 0) with
  | (x2, x6, x10, x14) =>
  match quarterRound (getD s 3 0) (getD s 7 0) (getD s 11 0) (getD s 15 0) with
  | (x3, x7, x11, x15) =>
  match quarterRound x0 x5 x10 x15 with
  | (x0, x5, x10, x15) =>
  match quarterRound x1 x6 x11 x12 with
  | (x1, x6, x11, x12) =>
  match quarterRound x2 x7 x8 x13 with
  | (x2, x7, x8, x13) =>
  match quarterRound x3 x4 x9 x14 with
  | (x3, x4, x9, x14) =>
    [x0, x1, x2, x3, x4, x5, x6, x7, x8, x9, x10, x11, x12, x13, x14, x15]

/-- `n` iterations of `innerBlock` (ChaCha20 uses n = 10, i.e. 20 rounds). -/
def innerBlocks : Nat → List Nat → List Nat
  | 0, s => s
  | n + 1, s => innerBlocks n (innerBlock s)

/-- The four ChaCha constants "expand 32-byte k" (RFC 8439 §2.3). -/
def sigma : List Nat := [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]

/-- Four bytes, least significant first, as one word. -/
def le32 (b0 b1 b2 b3 : Nat) : Nat := b0 + 256 * (b1 + 256 * (b2 + 256 * b3))

/-- Read a byte list as consecutive little-endian 32-bit words; a trailing
    group of fewer than four bytes is dropped. -/
def wordsLE : List Nat → List Nat
  | [] => []
  | [_] => []
  | [_, _] => []
  | [_, _, _] => []
  | b0 :: b1 :: b2 :: b3 :: rest => le32 b0 b1 b2 b3 :: wordsLE rest

/-- A word as four little-endian bytes. -/
def wordToLE (w : Nat) : List Nat :=
  [w % 256, (w / 256) % 256, (w / 65536) % 256, (w / 16777216) % 256]

/-- Serialize a list of words in little-endian order (RFC 8439 §2.3). -/
def serialize : List Nat → List Nat
  | [] => []
  | w :: ws => wordToLE w ++ serialize ws

/-- Elementwise addition mod 2^32 of two word lists (truncating). -/
def addWords : List Nat → List Nat → List Nat
  | x :: xs, y :: ys => add32 x y :: addWords xs ys
  | [], _ => []
  | _ :: _, [] => []

/-- Length test by structural recursion (`Nat.beq` on `List.length`). -/
def hasLength {α : Type} (xs : List α) (n : Nat) : Bool := Nat.beq xs.length n

/-- Initial ChaCha20 state: constants | key | counter | nonce (RFC 8439 §2.3).
    The counter is reduced mod 2^32. -/
def initState (key : List Nat) (counter : Nat) (nonce : List Nat) : List Nat :=
  sigma ++ wordsLE key ++ [counter % WORDMOD] ++ wordsLE nonce

/-- The state after the 20 rounds, before the feed-forward addition. -/
def rounds (key : List Nat) (counter : Nat) (nonce : List Nat) : List Nat :=
  innerBlocks 10 (initState key counter nonce)

/-- The state at the end of the block function (after adding the initial
    state back in), as 16 words. -/
def blockWords (key : List Nat) (counter : Nat) (nonce : List Nat) : List Nat :=
  let s0 := initState key counter nonce
  addWords (innerBlocks 10 s0) s0

/-- The ChaCha20 block function (RFC 8439 §2.3.1, `chacha20_block`): 64
    keystream bytes.  Returns `[]` unless `key` has 32 bytes and `nonce` has
    12 bytes. -/
def block (key : List Nat) (counter : Nat) (nonce : List Nat) : List Nat :=
  match hasLength key 32 && hasLength nonce 12 with
  | true => serialize (blockWords key counter nonce)
  | false => []

/-- XOR two byte lists, truncating to the shorter one. -/
def xorBytes : List Nat → List Nat → List Nat
  | x :: xs, y :: ys => NatBits.bitXor x y :: xorBytes xs ys
  | [], _ => []
  | _ :: _, [] => []

/-- Fuelled block loop of `chacha20_encrypt`. -/
def encryptAux : Nat → List Nat → Nat → List Nat → List Nat → List Nat
  | 0, _, _, _, _ => []
  | fuel + 1, key, counter, nonce, msg =>
    match msg with
    | [] => []
    | _ :: _ =>
      xorBytes (msg.take 64) (block key counter nonce) ++
        encryptAux fuel key (counter + 1) nonce (msg.drop 64)

/-- ChaCha20 encryption (RFC 8439 §2.4.1, `chacha20_encrypt`).  Decryption is
    the same function.  Returns `[]` for a malformed key or nonce (because
    `block` does).  Fuel `len/64 + 1` is always enough: each step consumes 64
    bytes. -/
def encrypt (key : List Nat) (counter : Nat) (nonce : List Nat) (msg : List Nat) : List Nat :=
  encryptAux (msg.length / 64 + 1) key counter nonce msg

end CleanSpec.ChaCha20
