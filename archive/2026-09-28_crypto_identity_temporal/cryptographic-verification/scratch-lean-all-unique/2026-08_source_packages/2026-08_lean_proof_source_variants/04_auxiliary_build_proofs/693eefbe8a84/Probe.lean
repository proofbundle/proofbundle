import ECDSAP256
set_option maxRecDepth 100000
open ProofBundle.Crypto.ECDSAP256

-- Cheapest first: pure Nat arithmetic (kernel GMP)
theorem probe_p_eq : p = 2^256 - 2^224 + 2^192 + 2^96 - 1 := by decide
#print axioms probe_p_eq
