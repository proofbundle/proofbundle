set_option maxRecDepth 100000
def p : Nat := 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff

/-- Square-and-multiply modpow, structurally recursive on fuel so the
    kernel can unfold it (well-founded recursion would not reduce). -/
def modpowAux (m : Nat) : Nat → Nat → Nat → Nat → Nat
  | 0,        _, _, acc => acc
  | _+1,      _, 0, acc => acc
  | fuel+1,   b, e, acc =>
      modpowAux m fuel ((b * b) % m) (e / 2) (if e % 2 == 1 then (acc * b) % m else acc)

def modpow (b e m : Nat) : Nat := modpowAux m 300 (b % m) e 1

/-- Modular inverse via Fermat: a^(p-2) mod p -/
def inv (a : Nat) : Nat := modpow a (p - 2) p

-- Does the KERNEL evaluate a full 256-bit modular inversion?
theorem invCheck :
    (inv 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c
      * 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c) % p = 1 := by
  decide

#print axioms invCheck
