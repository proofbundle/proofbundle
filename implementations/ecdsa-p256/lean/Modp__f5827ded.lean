/-
Prime-field arithmetic for the P-256 field, kernel-friendly.

p = 2^256 - 2^224 + 2^192 + 2^96 - 1 (the P-256 prime).
All operations are term-mode with explicit masking.

2026-10-29: `minv` was `a^(p-2) mod p` computed by decrementing a counter
from p-2, i.e. about 2^256 recursive steps. That is not computable by the
Lean kernel, so the function could not be used in any proof. It is replaced
below by a square-and-multiply inversion that walks the *bits* of the
exponent, which is O(log p) steps and is kernel-reducible.

The same treatment is applied to `minvN` for the group order n, which ECDSA
needs for the scalar inversions (all scalar arithmetic is mod n, not mod p).
-/

namespace Crypto.Modp

-- The P-256 prime.
def p : Nat :=
  115792089210356248762697446949407573530086143415290314195533631308867097853951

-- The P-256 group order.
def n : Nat :=
  115792089210356248762697446949407573529996955224135760342422259061068512044369

-- Reduction modulo p.
def modp (x : Nat) : Nat := x % p

-- Reduction modulo n.
def modn (x : Nat) : Nat := x % n

-- Modular add/sub/mul.
def madd (a b : Nat) : Nat := modp (a + b)
def msub (a b : Nat) : Nat := modp (p + a - b % p)
def mmul (a b : Nat) : Nat := modp (a * b)

-- Scalar arithmetic modulo the group order n.
def sadd (a b : Nat) : Nat := modn (a + b)
def ssub (a b : Nat) : Nat := modn (n + a - b % n)
def smul (a b : Nat) : Nat := modn (a * b)

/-- Bit `i` of `x`. -/
def bit (x i : Nat) : Nat := (x >>> i) % 2

/-- The bits of `x`, least significant first. -/
def bitsOf : Nat → List Bool
  | 0 => []
  | n + 1 => (n % 2 == 1) :: bitsOf (n / 2)

/-- Reduction modulo an arbitrary modulus `m`. -/
def modm (x m : Nat) : Nat := x % m

/-- Square-and-multiply: `base ^ e mod m`, by walking the bits of `e`.

    `e` is consumed from its least significant bit upward, so the recursion
    depth is O(log e) rather than O(e). This is the standard right-to-left
    binary method: the accumulator is multiplied by `base` when the current
    bit is odd, and `base` is squared at every step. -/
def powModAux : Nat → Nat → Nat → Nat → Nat
  | _, _, acc, 0 => acc
  | m, base, acc, e + 1 =>
      -- The pattern binds `e` to (exponent - 1), so the bit of the exponent
      -- that is being consumed is that of `e + 1`. Testing `e % 2` instead
      -- would consume the wrong bit and silently compute a different power.
      --
      -- The parity test is a structural match rather than `(e+1) % 2 == 1`,
      -- because `Nat.decEq` does not reduce definitionally and would block a
      -- known-answer test proved by `rfl`.
      let acc' := match (e + 1) % 2 with
        | 0 => acc
        | _ + 1 => modm (acc * base) m
      let base' := modm (base * base) m
      -- The bound `e` is (exponent - 1), so the next exponent is (e + 1) / 2,
      -- not e / 2. Using e / 2 silently computes a different power.
      powModAux m base' acc' ((e + 1) / 2)

/-- Structural equality on `Nat` that reduces by `rfl`.

    `Nat.decEq` decides equality by binary subtraction, which does not reduce
    definitionally for the 256-bit numbers used here, so a known-answer test
    proved by `rfl` cannot get through it. This predicate compares by
    structural recursion instead and does reduce. -/
def natEq : Nat → Nat → Bool
  | 0, 0 => true
  | 0, _ + 1 => false
  | _ + 1, 0 => false
  | a + 1, b + 1 => natEq a b

/-- Modular exponentiation `base ^ e mod m`. -/
def powMod (base e m : Nat) : Nat :=
  match m with
  | 0 => 0
  | 1 => 0
  | m + 2 => powModAux (m + 2) (modm base (m + 2)) 1 e

/-- Modular inverse of `a` modulo `m`, for `m` prime and `a` not divisible by
    `m`, by Fermat's little theorem: `a^(m-2) mod m`. -/
def invMod (a m : Nat) : Nat :=
  match m with
  | 0 => 0
  | 1 => 0
  | m + 2 => powModAux (m + 2) (modm a (m + 2)) 1 m

-- Fermat's little theorem inverse in the P-256 field: a^(p-2) mod p.
def minv (a : Nat) : Nat := invMod a p

-- Inverse modulo the group order n, for the scalar arithmetic of ECDSA.
def minvN (a : Nat) : Nat := invMod a n

end Crypto.Modp
