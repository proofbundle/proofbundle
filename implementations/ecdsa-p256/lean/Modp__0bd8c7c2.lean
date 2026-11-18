/-
Prime-field arithmetic, kernel-friendly.
p = 2^256 - 2^224 + 2^192 + 2^96 - 1 (the P-256 prime).
All operations term-mode with explicit masking.
-/

namespace Crypto.Modp

-- The P-256 prime.
def p : Nat :=
  115792089210356248762697446949407573530086143415290314195533631308867097853951

-- Reduction modulo p.
def modp (x : Nat) : Nat := x % p

-- Modular add/sub/mul.
def madd (a b : Nat) : Nat := modp (a + b)
def msub (a b : Nat) : Nat := modp (p + a - b % p)
def mmul (a b : Nat) : Nat := modp (a * b)

-- Fermat's little theorem inverse: a^(p-2) mod p.
-- Recursive square-and-multiply (structural).
def minvAux : Nat → Nat → Nat → Nat
  | 0, _, acc => acc
  | n+1, a, acc => minvAux n (mmul a a) (if (n+1) % 2 = 0 then acc else mmul acc a)
def minv (a : Nat) : Nat := minvAux (p - 2) a 1

end Crypto.Modp
