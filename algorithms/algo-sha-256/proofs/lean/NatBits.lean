/-
First-principles natural-number bit operations.

These are defined by recursion on the bit length using only `Nat.mod` and
`Nat.div` by small powers of two.  No core `Nat` bitwise primitives are used,
so theorems about closed values do not depend on `propext`.
-/ 

namespace Crypto.NatBits

/-- Parity of a natural number: `0` for even, `1` for odd. -/
def mod2 (x : Nat) : Nat := x % 2

/-- Halving, rounded down. -/
def div2 (x : Nat) : Nat := x / 2

/-- Fuelled bitwise AND. -/
def bitAndAux (fuel a b : Nat) : Nat :=
  match fuel with
  | 0 => 0
  | fuel + 1 =>
      match a with
      | 0 => 0
      | a + 1 =>
        match b with
        | 0 => 0
        | b + 1 =>
            let bit := mod2 (a + 1) * mod2 (b + 1)
            bit + 2 * bitAndAux fuel (div2 (a + 1)) (div2 (b + 1))

/-- Bitwise AND of two natural numbers (correct for 32-bit inputs). -/
def bitAnd (a b : Nat) : Nat := bitAndAux 32 a b

/-- Fuelled bitwise OR. -/
def bitOrAux (fuel a b : Nat) : Nat :=
  match fuel with
  | 0 => 0
  | fuel + 1 =>
      match a with
      | 0 => b
      | a + 1 =>
        match b with
        | 0 => a + 1
        | b + 1 =>
            let ab := a + 1
            let bb := b + 1
            let bit := (mod2 ab) + (mod2 bb) - (mod2 ab * mod2 bb)
            bit + 2 * bitOrAux fuel (div2 ab) (div2 bb)

/-- Bitwise OR of two natural numbers (correct for 32-bit inputs). -/
def bitOr (a b : Nat) : Nat := bitOrAux 32 a b

/-- Fuelled bitwise XOR. -/
def bitXorAux (fuel a b : Nat) : Nat :=
  match fuel with
  | 0 => 0
  | fuel + 1 =>
      match a with
      | 0 => b
      | a + 1 =>
        match b with
        | 0 => a + 1
        | b + 1 =>
            let ab := a + 1
            let bb := b + 1
            let bit := (mod2 ab) + (mod2 bb) - 2 * (mod2 ab * mod2 bb)
            bit + 2 * bitXorAux fuel (div2 ab) (div2 bb)

/-- Bitwise XOR of two natural numbers (correct for 32-bit inputs). -/
def bitXor (a b : Nat) : Nat := bitXorAux 32 a b

/-- Logical right shift by `n` bits. -/
def shiftRight (a n : Nat) : Nat :=
  match n with
  | 0 => a
  | n + 1 => shiftRight (div2 a) n

/-- Logical left shift by `n` bits. -/
def shiftLeft (a n : Nat) : Nat :=
  match n with
  | 0 => a
  | n + 1 => shiftLeft (2 * a) n

/-- Keep the lower `n` bits of a natural number. -/
def lowerBitsAux (n x : Nat) : Nat :=
  match n with
  | 0 => 0
  | n + 1 => mod2 x + 2 * lowerBitsAux n (div2 x)

/-- Modulo 256. -/
def mod256 (x : Nat) : Nat := lowerBitsAux 8 x

/-- Modulo 2^32. -/
def mod32 (x : Nat) : Nat := lowerBitsAux 32 x

/-- Addition modulo 2^32. -/
def add32 (a b : Nat) : Nat := mod32 (a + b)

/-- First-principles replacement for `List.getD`: index into a list with a
    default, by structural recursion.  Core `List.getD` depends on `propext`
    through its own definitional unfolding; this does not. -/
def getD {α : Type} : List α → Nat → α → α
  | [], _, d => d
  | x :: _, 0, _ => x
  | _ :: xs, n + 1, d => getD xs n d

end Crypto.NatBits
