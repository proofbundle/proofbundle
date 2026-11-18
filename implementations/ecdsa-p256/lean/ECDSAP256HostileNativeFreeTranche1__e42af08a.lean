import ECDSAP256

namespace ProofBundle.Crypto.ECDSAP256

/-- If mathematical ECDSA verification is false, the full pipeline is false
without needing to evaluate public-key validation. -/
theorem ecdsaVerifyFull_false_of_verify_false
    (Q : Point) (msg : ByteArray) (r s : Nat)
    (h : ecdsaVerify Q msg r s = false) :
    ecdsaVerifyFull Q msg r s = false := by
  simp [ecdsaVerifyFull, h]

/-- Any signature with r = 0 fails the first ECDSA range check. -/
theorem ecdsaVerify_r_zero_any
    (Q : Point) (msg : ByteArray) (s : Nat) :
    ecdsaVerify Q msg 0 s = false := by
  simp [ecdsaVerify]

/-- Any signature with s = 0 fails the ECDSA range checks. -/
theorem ecdsaVerify_s_zero_any
    (Q : Point) (msg : ByteArray) (r : Nat) :
    ecdsaVerify Q msg r 0 = false := by
  simp [ecdsaVerify]

/-- Any signature with r = n fails because n is outside [1,n-1]. -/
theorem ecdsaVerify_r_eq_n_any
    (Q : Point) (msg : ByteArray) (s : Nat) :
    ecdsaVerify Q msg n s = false := by
  simp [ecdsaVerify, n]

/-- Any signature with s = n fails because n is outside [1,n-1]. -/
theorem ecdsaVerify_s_eq_n_any
    (Q : Point) (msg : ByteArray) (r : Nat) :
    ecdsaVerify Q msg r n = false := by
  simp [ecdsaVerify, n]

/-- Original hostile theorem, rewritten without native_decide. -/
theorem hostile_r_zero :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0x0 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by
  apply ecdsaVerifyFull_false_of_verify_false
  exact ecdsaVerify_r_zero_any _ _ _

/-- Original hostile theorem, rewritten without native_decide. -/
theorem hostile_s_zero :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0x0 = false := by
  apply ecdsaVerifyFull_false_of_verify_false
  exact ecdsaVerify_s_zero_any _ _ _

/-- Original hostile theorem, rewritten without native_decide. -/
theorem hostile_r_equals_n :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 0xcbf1e0a1241d47736db4ff09539caf0309b0b6bdd67ab6e8fca484e683c7e666 = false := by
  apply ecdsaVerifyFull_false_of_verify_false
  change ecdsaVerify _ _ n _ = false
  exact ecdsaVerify_r_eq_n_any _ _ _

/-- Original hostile theorem, rewritten without native_decide. -/
theorem hostile_s_equals_n :
    ecdsaVerifyFull (Point.affine 0xf839cbb33743702a05c3c4b394c0f2ad813a2e51801bf68ac9bc884fb987541c 0x5a2360547558b03a662421c13e13b97e9d202c26b96681b6206215786e839163) ByteArray.mk #[0x61, 0x62, 0x63]
      0xe3087afd1470fd1db5c63c735f509eb06bafb399c805f506908319e9aab81407 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 = false := by
  apply ecdsaVerifyFull_false_of_verify_false
  change ecdsaVerify _ _ _ n = false
  exact ecdsaVerify_s_eq_n_any _ _ _

#print axioms ProofBundle.Crypto.ECDSAP256.hostile_r_zero
#print axioms ProofBundle.Crypto.ECDSAP256.hostile_s_zero
#print axioms ProofBundle.Crypto.ECDSAP256.hostile_r_equals_n
#print axioms ProofBundle.Crypto.ECDSAP256.hostile_s_equals_n

end ProofBundle.Crypto.ECDSAP256
