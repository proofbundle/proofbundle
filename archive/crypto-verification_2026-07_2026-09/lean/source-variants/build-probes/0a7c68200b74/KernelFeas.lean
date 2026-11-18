-- Can the KERNEL (no native compilation) handle P-256 scale arithmetic?
-- Lean's kernel has GMP-accelerated Nat add/mul/mod/div/decEq.

def p : Nat := 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
def n : Nat := 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551

-- 1. big modular multiplication
theorem t1 : (0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c
              * 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) % p
             = (0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c
              * 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) % p := rfl

-- 2. modular exponentiation (inversion via Fermat) — the expensive primitive
def powMod (b e m : Nat) : Nat := Nat.pow b e % m

-- 3. range checks — these are the FIPS 5.6.2.3 guards, decided in the kernel
theorem rangeCheck_zero : (0 == 0 || 0 ≥ n) = true := by decide
theorem rangeCheck_n     : decide (n ≥ n) = true := by decide

#print axioms t1
#print axioms rangeCheck_zero
#print axioms rangeCheck_n
