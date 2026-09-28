import ECDSAP256
set_option maxRecDepth 8000000
set_option maxHeartbeats 0
open ProofBundle.Crypto.ECDSAP256

-- pointMul is already axiom-free in the original source. Can the kernel run it?
theorem ec_base : (match pointMul basePoint 1 with
                   | Point.affine x _ => x
                   | Point.infinity => 0) = Gx := by decide
#print axioms ec_base
