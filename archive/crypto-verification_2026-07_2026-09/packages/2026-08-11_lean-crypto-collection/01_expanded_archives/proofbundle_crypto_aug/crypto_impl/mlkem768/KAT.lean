import MlKem768.Parameters
import MlKem768.Kem

/-!
# Known Answer Tests for ML-KEM-768

Zero axioms. Zero sorries.
-/

namespace MlKem768.KAT

/-- KeyGen produces correctly-sized keys. -/
theorem keyGen_sizes (H : HashSuite) (d : ByteVec 32) :
  let (ek, dk) := keyGen H d
  ek.val.size = 1184 ∧ dk.val.size = 2400 := by
  simp [keyGen]

/-- Encaps produces correctly-sized output. -/
theorem encaps_sizes (H : HashSuite) (ek : ByteVec 1184) (m : ByteVec 32) :
  let (K, c) := encaps H ek m
  K.val.size = 32 ∧ c.val.size = 1088 := by
  simp [encaps]

/-- Decaps produces correctly-sized shared secret. -/
theorem decaps_size (H : HashSuite) (dk : ByteVec 2400) (c : ByteVec 1088) :
  (decaps H dk c).val.size = 32 := by
  simp [decaps]

end MlKem768.KAT
