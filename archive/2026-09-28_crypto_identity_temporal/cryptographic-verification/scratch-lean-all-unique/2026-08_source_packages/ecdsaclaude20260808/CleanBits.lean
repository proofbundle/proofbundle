/-!
Axiom-free 32-bit word operations.
Built ONLY from Nat +, -, *, /, %, and structural recursion on fuel.
No Nat.bitwise, no UInt32, hence no propext and no Quot.sound.

Bit identities used:
  xor bit = (a + b) % 2
  and bit = a * b
  not bit = 1 - a          (Nat truncated subtraction)
-/
namespace Clean

def W : Nat := 4294967296   -- 2^32

def xorN : Nat → Nat → Nat → Nat
  | 0,      _, _ => 0
  | fuel+1, x, y => (x % 2 + y % 2) % 2 + 2 * xorN fuel (x / 2) (y / 2)

def andN : Nat → Nat → Nat → Nat
  | 0,      _, _ => 0
  | fuel+1, x, y => (x % 2) * (y % 2) + 2 * andN fuel (x / 2) (y / 2)

def notN : Nat → Nat → Nat
  | 0,      _ => 0
  | fuel+1, x => (1 - x % 2) + 2 * notN fuel (x / 2)

@[inline] def xor32 (x y : Nat) : Nat := xorN 32 x y
@[inline] def and32 (x y : Nat) : Nat := andN 32 x y
@[inline] def not32 (x : Nat)   : Nat := notN 32 x

-- Rotations/shifts need NO bitwise op at all: pure arithmetic on x < 2^32
@[inline] def rotr32 (x n : Nat) : Nat := (x / 2^n) + (x % 2^n) * 2^(32 - n)
@[inline] def shr32  (x n : Nat) : Nat := x / 2^n
@[inline] def add32  (x y : Nat) : Nat := (x + y) % W

end Clean

