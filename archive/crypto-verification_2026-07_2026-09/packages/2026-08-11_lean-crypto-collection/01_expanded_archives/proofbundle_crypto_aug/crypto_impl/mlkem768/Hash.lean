import MlKem768.Parameters

/-!
# Hash Function Interface for ML-KEM

Instead of opaque primitives or axioms, we define a `HashSuite`
structure that provides the required hash functions.

A concrete implementation instantiates this structure with
actual SHA-3/SHAKE implementations. The KEM correctness is
proven relative to the HashSuite properties.

Zero axioms. Zero sorries. Zero opaque.
-/

namespace MlKem768

/-- A suite of hash functions required by ML-KEM.
    All functions are total and computable.

    A verified SHA-3 implementation provides a concrete instance. -/
structure HashSuite where
  /-- SHA3-256: arbitrary input -> exactly 32 bytes -/
  sha3_256 : Array UInt8 → Array UInt8
  sha3_256_size : ∀ input, (sha3_256 input).size = 32

  /-- SHA3-512: arbitrary input -> exactly 64 bytes -/
  sha3_512 : Array UInt8 → Array UInt8
  sha3_512_size : ∀ input, (sha3_512 input).size = 64

  /-- SHAKE-128 XOF: input and output length -> exactly len bytes -/
  shake128 : Array UInt8 → Nat → Array UInt8
  shake128_size : ∀ input len, (shake128 input len).size = len

  /-- SHAKE-256 KDF: input and output length -> exactly len bytes -/
  shake256 : Array UInt8 → Nat → Array UInt8
  shake256_size : ∀ input len, (shake256 input len).size = len

/-- G function using the hash suite.
    G(m) = SHA3-512(m) split into two 32-byte arrays. -/
def HashSuite.G (H : HashSuite) (input : Array UInt8) :
  ByteVec 32 × ByteVec 32 :=
  let output := H.sha3_512 input
  have h_out : output.size = 64 := H.sha3_512_size input
  let left := output.extract 0 32
  let right := output.extract 32 64
  have h_left : left.size = 32 := by
    simp [Array.extract, h_out]
  have h_right : right.size = 32 := by
    simp [Array.extract, h_out]
  (⟨left, h_left⟩, ⟨right, h_right⟩)

/-- H function: SHA3-256 -/
def HashSuite.H (H : HashSuite) (input : Array UInt8) : ByteVec 32 :=
  let output := H.sha3_256 input
  have h_out : output.size = 32 := H.sha3_256_size input
  ⟨output, h_out⟩

/-- KDF: SHAKE-256 with 32-byte output -/
def HashSuite.KDF (H : HashSuite) (input : Array UInt8) : ByteVec 32 :=
  let output := H.shake256 input 32
  have h_out : output.size = 32 := H.shake256_size input 32
  ⟨output, h_out⟩

/-- XOF: SHAKE-128 with specified output length -/
def HashSuite.XOF (H : HashSuite) (input : Array UInt8) (len : Nat) :
  { a : Array UInt8 // a.size = len } :=
  let output := H.shake128 input len
  have h_out : output.size = len := H.shake128_size input len
  ⟨output, h_out⟩

end MlKem768
