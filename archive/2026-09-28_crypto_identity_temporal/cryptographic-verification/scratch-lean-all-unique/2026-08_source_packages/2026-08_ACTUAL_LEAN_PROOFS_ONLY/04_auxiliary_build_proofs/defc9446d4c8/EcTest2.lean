import ECDSAP256
set_option maxRecDepth 8000000
set_option maxHeartbeats 0
open ProofBundle.Crypto.ECDSAP256

-- full 256-bit scalar: the realistic cost of one ECDSA scalar multiplication
theorem ec_full : (match pointMul basePoint
    0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52 with
   | Point.affine x _ => x % n
   | Point.infinity => 0) =
   (match pointMul basePoint
    0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52 with
   | Point.affine x _ => x % n
   | Point.infinity => 0) := by rfl
#print axioms ec_full
