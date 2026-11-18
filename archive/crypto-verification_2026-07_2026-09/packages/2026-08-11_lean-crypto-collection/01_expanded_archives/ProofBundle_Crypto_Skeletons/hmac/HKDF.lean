import HMAC

/-!
# HKDF-SHA256 Key Derivation (RFC 5869)

Extract-then-Expand construction.

Parameterized over an HMAC function of type
`ByteArray → ByteArray → ByteArray` (key, message → tag).
-/

namespace HKDF_SHA256

/-- HKDF-Extract: PRK = HMAC(salt, IKM) -/
def extract (hmacFn : ByteArray → ByteArray → ByteArray)
    (salt ikm : ByteArray) : ByteArray :=
  hmacFn salt ikm

/-- One round of the Expand iteration -/
def expandRound (hmacFn : ByteArray → ByteArray → ByteArray)
    (prk info tPrev : ByteArray) (i : Nat) : ByteArray :=
  hmacFn prk (tPrev ++ info ++ ByteArray.mk #[UInt8.ofNat i])

/-- HKDF-Expand (pure recursive version)
    Produces at least `L` bytes; the caller truncates if necessary. -/
def expand (hmacFn : ByteArray → ByteArray → ByteArray)
    (prk info : ByteArray) (L : Nat) : ByteArray :=
  let hashLen := 32
  let N := (L + hashLen - 1) / hashLen
  go 1 ByteArray.empty ByteArray.empty N
where
  go (i : Nat) (okm tPrev : ByteArray) : Nat → ByteArray
    | 0     => okm
    | n+1   =>
        let t := expandRound hmacFn prk info tPrev i
        go (i+1) (okm ++ t) t (n)

/-- Full HKDF = Extract then Expand, truncated to exactly `L` bytes -/
def hkdf (hmacFn : ByteArray → ByteArray → ByteArray)
    (salt ikm info : ByteArray) (L : Nat) : ByteArray :=
  let prk := extract hmacFn salt ikm
  let okm := expand hmacFn prk info L
  okm.extract 0 (min L okm.size)

end HKDF_SHA256
