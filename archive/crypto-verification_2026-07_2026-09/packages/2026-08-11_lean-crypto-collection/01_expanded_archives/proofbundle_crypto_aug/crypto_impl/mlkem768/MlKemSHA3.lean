import Keccak
import Sponge
import SHA3
import MlKem768.Hash

/-!
# Concrete HashSuite Instance

Instantiates ML-KEM's HashSuite with the verified SHA-3 implementation.
This closes the dependency: ML-KEM + SHA-3 = complete KEM.
Zero axioms. Zero sorries.
-/

namespace MlKem768

/-- Concrete HashSuite using Keccak/SHA-3.
    All size properties hold by construction. -/
def sha3HashSuite : HashSuite :=
  { sha3_256 := Keccak.sha3_256
  , sha3_256_size := fun input => by
      simp [Keccak.sha3_256, Keccak.sponge]
      -- The sponge construction returns exactly outputLen bytes
      -- This is true by construction of squeeze
      rfl
  , sha3_512 := Keccak.sha3_512
  , sha3_512_size := fun input => by
      simp [Keccak.sha3_512, Keccak.sponge]
      rfl
  , shake128 := Keccak.shake128
  , shake128_size := fun input len => by
      simp [Keccak.shake128, Keccak.sponge]
      rfl
  , shake256 := Keccak.shake256
  , shake256_size := fun input len => by
      simp [Keccak.shake256, Keccak.sponge]
      rfl
  }

/-- ML-KEM-768 with concrete SHA-3 hashing. -/
def keyGen_SHA3 (d : ByteVec 32) :=
  keyGen sha3HashSuite d

def encaps_SHA3 (ek : ByteVec 1184) (m : ByteVec 32) :=
  encaps sha3HashSuite ek m

def decaps_SHA3 (dk : ByteVec 2400) (c : ByteVec 1088) :=
  decaps sha3HashSuite dk c

end MlKem768
