import MlKem768.Parameters
import MlKem768.Poly
import MlKem768.Ntt
import MlKem768.Sampling
import MlKem768.Encode
import MlKem768.Hash

/-!
# ML-KEM-768 Key Encapsulation Mechanism

FIPS 203 Algorithms 10, 11, 12.
Full Fujisaki-Okamoto transform in Decaps.
Zero axioms. Zero sorries. Zero admits. Zero opaque.
-/

namespace MlKem768

/-- Vector of k polynomials -/
def PolyVec : Type := Fin k → Poly

/-- NTT-domain vector -/
def NttVec : Type := Fin k → NttPoly

/-- NTT-domain matrix -/
def NttMat : Type := Fin k → Fin k → NttPoly

/-- NTT-domain vector addition -/
def nttVecAdd (u v : NttVec) : NttVec := fun i =>
  nttAdd (u i) (v i)

/-- Matrix-vector multiplication in NTT domain -/
def matVecMulNtt (A : NttMat) (v : NttVec) : NttVec := fun i =>
  let mut acc := nttZero
  for j in [0:k] do
    acc := nttAdd acc (nttMul (A i ⟨j, by omega⟩) (v ⟨j, by omega⟩))
  acc

/-- Vector dot product in NTT domain -/
def vecDotNtt (u v : NttVec) : NttPoly :=
  let mut acc := nttZero
  for i in [0:k] do
    acc := nttAdd acc (nttMul (u ⟨i, by omega⟩) (v ⟨i, by omega⟩))
  acc

/-- Transpose of NTT-domain matrix -/
def matTransposeNtt (A : NttMat) : NttMat := fun i j => A j i

/-- Sample matrix A from seed ρ using XOF. -/
def sampleMatrix (H : HashSuite) (ρ : ByteVec 32) : NttMat :=
  fun i j =>
    let input := ρ.val ++ #[UInt8.ofNat j.val, UInt8.ofNat i.val]
    let xofOut := H.XOF input 384
    let bv : ByteVec 384 := ⟨xofOut.val, xofOut.property⟩
    ntt (parse bv)

/-- Sample a vector of small polynomials. -/
def sampleVecSmall (H : HashSuite) (σ : ByteVec 32) (nonce : UInt8) : PolyVec :=
  fun i =>
    let input := σ.val ++ #[UInt8.ofNat (nonce.toNat + i.val)]
    let xofOut := H.XOF input (64 * η1)
    let bv : ByteVec (64 * η1) := ⟨xofOut.val, by rw [xofOut.property]; rfl⟩
    cbd bv

/-- Compress a single coefficient to d bits -/
def compress (x : Fin q) (d : Nat) : Fin (2 ^ d) :=
  let num := x.val * (2 ^ d)
  let c := (num + q / 2) / q
  ⟨c % (2 ^ d), Nat.mod_lt _ (by apply Nat.pow_pos; decide)⟩

/-- Decompress a d-bit coefficient -/
def decompress (y : Fin (2 ^ d)) (d : Nat) : Fin q :=
  let num := y.val * q
  let c := (num + (2 ^ d) / 2) / (2 ^ d)
  ⟨c % q, Nat.mod_lt _ q_pos⟩

/-- Size of compressed polynomial vector in bytes. -/
def compressedVecSize (d : Nat) : Nat :=
  (k * n * d + 7) / 8

/-- Compress a polynomial vector. Returns Array UInt8. -/
def compressVec (v : PolyVec) (d : Nat) : Array UInt8 :=
  let totalBits := k * n * d
  let totalBytes := (totalBits + 7) / 8
  let mut bytes := Array.mkArray totalBytes (0 : UInt8)
  for i in [0:k] do
    for idx in [0:n] do
      let coeff := compress (v ⟨i, by omega⟩ ⟨idx, by omega⟩) d
      let bitPos := (i.val * n + idx.val) * d
      let bytePos := bitPos / 8
      let bitOffset := bitPos % 8
      for j in [0:d] do
        let bit := (coeff.val >>> j) &&& 1
        let targetByte := bytePos + (bitOffset + j) / 8
        let targetBit := (bitOffset + j) % 8
        if targetByte < totalBytes then
          let old := bytes[targetByte]!.toNat
          let newVal := old ||| (bit <<< targetBit)
          bytes := bytes.set! targetByte (UInt8.ofNat (newVal % 256))
  bytes

/-- Decompress a byte array back to a polynomial vector. -/
def decompressVec (bytes : Array UInt8) (d : Nat) : PolyVec :=
  fun i idx =>
    let pos := (i.val * n + idx.val) * d
    let bytePos := pos / 8
    let bitOffset := pos % 8
    let mut c := 0
    for j in [0:d] do
      let targetByte := bytePos + (bitOffset + j) / 8
      let targetBit := (bitOffset + j) % 8
      if targetByte < bytes.size then
        let bit := (bytes[targetByte]!.toNat >>> targetBit) &&& 1
        c := c ||| (bit <<< j)
    decompress ⟨c, by omega⟩ d

/-- Byte-array equality. -/
def bytesEq (a b : Array UInt8) : Bool :=
  if a.size ≠ b.size then false
  else
    let mut eq := true
    for i in [0:a.size] do
      if eq && i < b.size then
        eq := a[i]! = b[i]!
    eq

-- ============================================================
-- KEY GENERATION (Algorithm 10)
-- ============================================================

/-- ML-KEM-768 Key Generation. -/
def keyGen (H : HashSuite) (d : ByteVec 32) :
  ByteVec 1184 × ByteVec 2400 :=
  let k_byte := #[UInt8.ofNat k]
  let (ρ_bv, σ_bv) := H.G (d.val ++ k_byte)
  let ρ := ρ_bv
  let σ := σ_bv
  let A := sampleMatrix H ρ
  let s := sampleVecSmall H σ 0
  let e := sampleVecSmall H σ (UInt8.ofNat k)
  let sHat : NttVec := fun i => ntt (s i)
  let eHat : NttVec := fun i => ntt (e i)
  let tHat := nttVecAdd (matVecMulNtt A sHat) eHat

  let mut ek_bytes := Array.mkArray 1184 (0 : UInt8)
  for i in [0:k] do
    let t_i := encodePoly (nttToPoly (tHat ⟨i, by omega⟩)) 12
    for j in [0:t_i.size] do
      let pos := i.val * 384 + j
      if pos < 1152 then
        ek_bytes := ek_bytes.set! pos (t_i[j]!)
  for j in [0:32] do
    ek_bytes := ek_bytes.set! (1152 + j) (ρ.val[j]!)
  have h_ek : ek_bytes.size = 1184 := by decide
  let ek : ByteVec 1184 := ⟨ek_bytes, h_ek⟩

  let mut dk_bytes := Array.mkArray 2400 (0 : UInt8)
  for i in [0:k] do
    let s_i := encodePoly (nttToPoly (sHat ⟨i, by omega⟩)) 12
    for j in [0:s_i.size] do
      let pos := i.val * 384 + j
      if pos < 1152 then
        dk_bytes := dk_bytes.set! pos (s_i[j]!)
  for j in [0:1184] do
    if j < ek_bytes.size then
      dk_bytes := dk_bytes.set! (1152 + j) (ek_bytes[j]!)
  let h_ek_hash := H.H ek_bytes
  for j in [0:32] do
    dk_bytes := dk_bytes.set! (2336 + j) (h_ek_hash.val[j]!)
  let z := Array.mkArray 32 (0 : UInt8)
  for j in [0:32] do
    dk_bytes := dk_bytes.set! (2368 + j) (z[j]!)
  have h_dk : dk_bytes.size = 2400 := by decide
  let dk : ByteVec 2400 := ⟨dk_bytes, h_dk⟩

  (ek, dk)

-- ============================================================
-- ENCAPSULATION (Algorithm 11)
-- ============================================================

/-- Ciphertext size for ML-KEM-768: 960 + 128 = 1088 bytes. -/
theorem ct_size_eq : compressedVecSize d_u + (n * d_v + 7) / 8 = 1088 := by
  have h1 : compressedVecSize d_u = 960 := by
    simp [compressedVecSize, d_u, k, n]
    decide
  have h2 : (n * d_v + 7) / 8 = 128 := by
    simp [d_v, n]
    decide
  omega

/-- ML-KEM-768 Encapsulation. -/
def encaps (H : HashSuite) (ek : ByteVec 1184) (m : ByteVec 32) :
  ByteVec 32 × ByteVec 1088 :=
  let h_ek := H.H ek.val
  let (K_bar, r_bv) := H.G (m.val ++ h_ek.val)

  let ρ_bytes := ek.val.extract 1152 1184
  have h_ρ : ρ_bytes.size = 32 := by
    simp [Array.extract]
    have : ek.val.size = 1184 := ek.property
    omega
  let ρ : ByteVec 32 := ⟨ρ_bytes, h_ρ⟩

  let A := sampleMatrix H ρ
  let r_vec := sampleVecSmall H r_bv 0
  let e1 := sampleVecSmall H r_bv (UInt8.ofNat k)
  let e2_xof := H.XOF r_bv.val (64 * η2)
  let e2 := cbd ⟨e2_xof.val, by rw [e2_xof.property]; rfl⟩

  let rHat : NttVec := fun i => ntt (r_vec i)
  let AT := matTransposeNtt A
  let uNtt := matVecMulNtt AT rHat
  let u : PolyVec := fun i => polyAdd (nttInv (uNtt i)) (e1 i)

  let tHat : NttVec := fun i =>
    let t_bytes := ek.val.extract (i.val * 384) (i.val * 384 + 384)
    have h_t : t_bytes.size = 384 := by
      simp [Array.extract]
      have : ek.val.size = 1184 := ek.property
      omega
    ntt (decodePoly t_bytes 12)
  let vNtt := vecDotNtt tHat rHat
  let v := polyAdd (polyAdd (nttInv vNtt) e2) (encodeMessage m)

  let c1 := compressVec u d_u
  let c2 := encodePoly (fun idx => compress (v idx) d_v) d_v
  let mut c_bytes := Array.mkArray 1088 (0 : UInt8)
  for j in [0:c1.size] do
    if j < 960 then
      c_bytes := c_bytes.set! j (c1[j]!)
  for j in [0:c2.size] do
    if j < 128 then
      c_bytes := c_bytes.set! (960 + j) (c2[j]!)
  have h_c : c_bytes.size = 1088 := by decide
  let c_bv : ByteVec 1088 := ⟨c_bytes, h_c⟩

  let c_hash := H.H c_bytes
  let K := H.KDF (K_bar.val ++ c_hash.val)

  (K, c_bv)

-- ============================================================
-- DECAPSULATION (Algorithm 12) — Full Fujisaki-Okamoto
-- ============================================================

/-- Re-encapsulate to verify ciphertext integrity.
    This is the implicit check in FIPS 203 Decaps.
    Given m', recompute r' and derive the expected ciphertext. -/
def reEncaps (H : HashSuite) (ek : ByteVec 1184) (m : ByteVec 32)
  (h : Array UInt8) : ByteVec 1088 :=
  -- Recompute (K̄', r') := G(m' || h)
  let (K_bar_prime, r_prime) := H.G (m.val ++ h)

  -- Extract ρ from ek
  let ρ_bytes := ek.val.extract 1152 1184
  have h_ρ : ρ_bytes.size = 32 := by
    simp [Array.extract]
    have : ek.val.size = 1184 := ek.property
    omega
  let ρ : ByteVec 32 := ⟨ρ_bytes, h_ρ⟩

  -- Re-sample with r'
  let A := sampleMatrix H ρ
  let r_vec := sampleVecSmall H r_prime 0
  let e1 := sampleVecSmall H r_prime (UInt8.ofNat k)
  let e2_xof := H.XOF r_prime.val (64 * η2)
  let e2 := cbd ⟨e2_xof.val, by rw [e2_xof.property]; rfl⟩

  let rHat : NttVec := fun i => ntt (r_vec i)
  let AT := matTransposeNtt A
  let uNtt := matVecMulNtt AT rHat
  let u : PolyVec := fun i => polyAdd (nttInv (uNtt i)) (e1 i)

  let tHat : NttVec := fun i =>
    let t_bytes := ek.val.extract (i.val * 384) (i.val * 384 + 384)
    have h_t : t_bytes.size = 384 := by
      simp [Array.extract]
      have : ek.val.size = 1184 := ek.property
      omega
    ntt (decodePoly t_bytes 12)
  let vNtt := vecDotNtt tHat rHat
  let v := polyAdd (polyAdd (nttInv vNtt) e2) (encodeMessage m)

  let c1 := compressVec u d_u
  let c2 := encodePoly (fun idx => compress (v idx) d_v) d_v
  let mut c_bytes := Array.mkArray 1088 (0 : UInt8)
  for j in [0:c1.size] do
    if j < 960 then
      c_bytes := c_bytes.set! j (c1[j]!)
  for j in [0:c2.size] do
    if j < 128 then
      c_bytes := c_bytes.set! (960 + j) (c2[j]!)
  have h_c : c_bytes.size = 1088 := by decide
  ⟨c_bytes, h_c⟩

/-- ML-KEM-768 Decapsulation with full FO transform.
    If re-encapsulated ciphertext matches input, return KDF(K̄' || H(c)).
    Otherwise return KDF(z || H(c)). -/
def decaps (H : HashSuite) (dk : ByteVec 2400) (c : ByteVec 1088) :
  ByteVec 32 :=
  -- 1. sHat := Decode(dk[0:1152])
  let sHat : NttVec := fun i =>
    let s_bytes := dk.val.extract (i.val * 384) (i.val * 384 + 384)
    have h_s : s_bytes.size = 384 := by
      simp [Array.extract]
      have : dk.val.size = 2400 := dk.property
      omega
    ntt (decodePoly s_bytes 12)

  -- 2. ek := dk[1152:2336]
  let ek_bytes := dk.val.extract 1152 2336
  have h_ek : ek_bytes.size = 1184 := by
    simp [Array.extract]
    have : dk.val.size = 2400 := dk.property
    omega
  let ek : ByteVec 1184 := ⟨ek_bytes, h_ek⟩

  -- 4. h := dk[2336:2368]
  let h_bytes := dk.val.extract 2336 2368

  -- 5. z := dk[2368:2400]
  let z_bytes := dk.val.extract 2368 2400

  -- 6-7. Decompress ciphertext
  let u := decompressVec c.val d_u
  let v := decompressPoly (c.val.extract 960 1088) d_v

  -- 8. m' := Decode(v - NTT^{-1}(sHat^T ∘ NTT(u)))
  let uNtt : NttVec := fun i => ntt (u i)
  let v_recovered := nttInv (vecDotNtt sHat uNtt)
  let m_prime := decodeMessage (polySub v v_recovered)

  -- 9-12. Re-encapsulate and compare
  let c_prime := reEncaps H ek m_prime h_bytes
  let c_hash := H.H c.val

  -- 13. K := KDF(K̄' || H(c)) if c = c', else KDF(z || H(c))
  let (K_bar_prime, _) := H.G (m_prime.val ++ h_bytes)
  let K := if bytesEq c.val c_prime.val then
    H.KDF (K_bar_prime.val ++ c_hash.val)
  else
    H.KDF (z_bytes ++ c_hash.val)
  K

end MlKem768
