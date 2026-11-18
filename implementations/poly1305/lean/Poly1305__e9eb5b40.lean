/-
Pure, list-based Poly1305 (RFC 8439 §2.5)

Implementation notes (same discipline as `CleanSpec.PureSHA256` and
`CleanSpec.ChaCha20`):
* No `UInt*`, `ByteArray`, `Array`, or mutable state; bytes are `Nat` < 256,
  the accumulator, `r`, `s` and `p` are plain `Nat`.
* The arithmetic is exactly the RFC's: Acc = ((Acc + block) * r) % p with
  p = 2^130 - 5, then (Acc + s) mod 2^128, serialized little-endian.  No
  limb splitting, no partial reduction -- the kernel's `Nat` is
  arbitrary-precision, so the spec can be stated directly.  (The RFC's
  Appendix A.3 vectors #5 - #11 target bugs in limb-based implementations;
  they are proved here anyway, in `Poly1305Hostile.lean`.)
* Clamping uses the first-principles `CleanSpec.NatBits.bitAnd` on each
  byte, literally as in RFC 8439 §2.5 (`r[3] &= 15; ... r[4] &= 252; ...`).
* Every pattern match is non-overlapping and exhaustive (overlapping
  matches compile to `propext`-dependent matchers; MISTAKES.md item 6).
* No `native_decide`, no `sorry`, no `admit`, no `axiom`, no `Classical`.

Malformed inputs: `mac` returns `[]` unless the one-time key is exactly 32
bytes.
-/

import CleanSpec.NatBits

namespace CleanSpec.Poly1305

open CleanSpec.NatBits (getD bitAnd)

/-- The prime p = 2^130 - 5 (RFC 8439 §2.5: 3fffffffffffffffffffffffffffffffb). -/
def P : Nat := 0x3fffffffffffffffffffffffffffffffb

/-- 2^128. -/
def TWO128 : Nat := 0x100000000000000000000000000000000

/-- A little-endian byte string as a number (`le_bytes_to_num`). -/
def leBytesToNat : List Nat → Nat
  | [] => 0
  | b :: bs => b + 256 * leBytesToNat bs

/-- The low `n` bytes of `x`, little-endian (`num_to_n_le_bytes`). -/
def natToLeBytes : Nat → Nat → List Nat
  | 0, _ => []
  | n + 1, x => x % 256 :: natToLeBytes n (x / 256)

/-- Clamp the 16 bytes of r (RFC 8439 §2.5):
    r[3], r[7], r[11], r[15] &= 15;  r[4], r[8], r[12] &= 252. -/
def clampBytes (r : List Nat) : List Nat :=
  [getD r 0 0, getD r 1 0, getD r 2 0, bitAnd (getD r 3 0) 15,
   bitAnd (getD r 4 0) 252, getD r 5 0, getD r 6 0, bitAnd (getD r 7 0) 15,
   bitAnd (getD r 8 0) 252, getD r 9 0, getD r 10 0, bitAnd (getD r 11 0) 15,
   bitAnd (getD r 12 0) 252, getD r 13 0, getD r 14 0, bitAnd (getD r 15 0) 15]

/-- The clamped r as a number. -/
def clamp (r : List Nat) : Nat := leBytesToNat (clampBytes r)

/-- The accumulator loop: for each 16-byte block (the last may be shorter),
    read it little-endian with one 0x01 byte appended, add to the
    accumulator, multiply by r, reduce mod p (RFC 8439 §2.5.1).  `fuel`
    bounds the number of blocks processed. -/
def accumulate : Nat → Nat → Nat → List Nat → Nat
  | 0, _, acc, _ => acc
  | fuel + 1, r, acc, msg =>
    match msg with
    | [] => acc
    | _ :: _ =>
      accumulate fuel r ((acc + leBytesToNat (msg.take 16 ++ [1])) * r % P) (msg.drop 16)

/-- Length test (`Nat.beq` on `List.length`). -/
def hasLength (xs : List Nat) (n : Nat) : Bool := Nat.beq xs.length n

/-- Poly1305 (RFC 8439 §2.5.1, `poly1305_mac`): 16-byte tag of `msg` under
    the 32-byte one-time key `key` = r || s.  Returns `[]` unless the key has
    32 bytes.  Fuel `len/16 + 1` is always enough. -/
def mac (key msg : List Nat) : List Nat :=
  match hasLength key 32 with
  | true =>
    natToLeBytes 16
      (accumulate (msg.length / 16 + 1) (clamp (key.take 16)) 0 msg +
        leBytesToNat (key.drop 16))
  | false => []

end CleanSpec.Poly1305
