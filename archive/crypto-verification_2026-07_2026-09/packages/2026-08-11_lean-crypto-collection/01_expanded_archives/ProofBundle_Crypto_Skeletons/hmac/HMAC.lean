import Mathlib

/-!
# HMAC-SHA256 Message Authentication (RFC 2104)

HMAC(K, m) = H( (K ⊕ opad) ‖ H( (K ⊕ ipad) ‖ m ) )

This is a pure skeleton. It is parameterized over an arbitrary hash function
of type `ByteArray → ByteArray`. Instantiating it with a concrete SHA-256
(and proving the usual security properties) is left for later work.
-/

namespace HMAC_SHA256

/-- Block size for SHA-256 = 64 bytes -/
def blockSize : Nat := 64

/-- Output size for SHA-256 = 32 bytes -/
def outputSize : Nat := 32

/-- ipad = 0x36 repeated `blockSize` times -/
def ipad : ByteArray :=
  ByteArray.mk (Array.replicate blockSize (0x36 : UInt8))

/-- opad = 0x5c repeated `blockSize` times -/
def opad : ByteArray :=
  ByteArray.mk (Array.replicate blockSize (0x5c : UInt8))

/-- Byte-wise XOR of two `ByteArray`s (truncates to the shorter length) -/
def xorBytes (a b : ByteArray) : ByteArray :=
  let n := min a.size b.size
  ByteArray.mk <| Array.ofFn (fun i : Fin n =>
    UInt8.ofNat (a.get ⟨i.val, by omega⟩ |>.toNat ^^^ b.get ⟨i.val, by omega⟩ |>.toNat))

/-- Pad or hash the key to exactly `blockSize` bytes -/
def prepareKey (hashFn : ByteArray → ByteArray) (key : ByteArray) : ByteArray :=
  let k := if key.size > blockSize then hashFn key else key
  if k.size < blockSize then
    k ++ ByteArray.mk (Array.replicate (blockSize - k.size) (0 : UInt8))
  else
    k

/-- Core HMAC construction (pure) -/
def hmac (hashFn : ByteArray → ByteArray) (key msg : ByteArray) : ByteArray :=
  let kPad := prepareKey hashFn key
  let inner := xorBytes kPad ipad ++ msg
  let innerHash := hashFn inner
  let outer := xorBytes kPad opad ++ innerHash
  hashFn outer

/-- Simple equality check of the computed tag.
    (Not constant-time; suitable only for formal verification, not production use.) -/
def verify (hashFn : ByteArray → ByteArray)
    (key msg tag : ByteArray) : Bool :=
  let computed := hmac hashFn key msg
  computed == tag

end HMAC_SHA256
