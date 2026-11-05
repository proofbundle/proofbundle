import ECDSAP256
open ProofBundle.Crypto.ECDSAP256
#eval (match pointMul basePoint
    0x7a083a580e618c8d21c8b9a24fa5a52bfae8f2490a75152a63d36eb7250a5f52 with
   | Point.affine x _ => x | Point.infinity => 0)
