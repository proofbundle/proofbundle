import Mathlib

/-!
# RSA-OAEP (RFC 8017) — pure skeleton

Optimal Asymmetric Encryption Padding with RSA.

This file defines the algebraic interface and the OAEP encode/decode
shape. A complete formalization still needs:

* a cryptographically secure random source for the seed,
* a concrete hash (typically SHA-256 or SHA-512),
* a verified MGF1,
* careful constant-time (or at least side-channel-aware) comparisons,
* and the usual RSA key-generation / CRT optimizations.

The current definitions are therefore honest skeletons.
-/

namespace RSA_OAEP

/-- RSA public key (n, e) -/
structure PublicKey where
  n : Nat
  e : Nat
  deriving Repr

/-- Basic RSA encryption: c = mᵉ mod n -/
def PublicKey.encrypt (pk : PublicKey) (m : Nat) : Nat :=
  Nat.modPow m pk.e pk.n

/-- RSA private key (minimal form) -/
structure PrivateKey where
  n : Nat
  d : Nat
  deriving Repr

/-- Basic RSA decryption: m = cᵈ mod n -/
def PrivateKey.decrypt (sk : PrivateKey) (c : Nat) : Nat :=
  Nat.modPow c sk.d sk.n

/-- Byte-wise XOR of two ByteArrays of equal length.
    Returns none if lengths differ. -/
def xorBytes (a b : ByteArray) : Option ByteArray :=
  if a.size ≠ b.size then none
  else some <| ByteArray.mk <|
    Array.ofFn (fun i : Fin a.size =>
      UInt8.ofNat (a.get ⟨i.val, by omega⟩ |>.toNat ^^^
                   b.get ⟨i.val, by omega⟩ |>.toNat))

/-- MGF1 (Mask Generation Function) — pure recursive version.
    Produces exactly `length` bytes. -/
def mgf1 (hash : ByteArray → ByteArray)
    (seed : ByteArray) (length : Nat) : ByteArray :=
  let hLen := (hash ByteArray.empty).size
  go 0 ByteArray.empty
where
  go (counter : Nat) (acc : ByteArray) : ByteArray :=
    if acc.size ≥ length then
      acc.extract 0 length
    else
      let c : ByteArray := ByteArray.mk #[
        UInt8.ofNat ((counter >>> 24) % 256),
        UInt8.ofNat ((counter >>> 16) % 256),
        UInt8.ofNat ((counter >>>  8) % 256),
        UInt8.ofNat ( counter         % 256)
      ]
      go (counter + 1) (acc ++ hash (seed ++ c))

/-- OAEP encoding (RFC 8017 §7.1.1).
    The seed must be supplied by the caller (normally random hLen bytes).
    Returns `none` if the message is too long for the given modulus size. -/
def oaepEncode (hash : ByteArray → ByteArray)
    (k : Nat)                    -- modulus length in bytes
    (message : ByteArray)
    (seed : ByteArray)           -- must have length = hLen
    (label : ByteArray := ByteArray.empty) : Option ByteArray :=
  let hLen := (hash ByteArray.empty).size
  if message.size > k - 2 * hLen - 2 then
    none
  else if seed.size ≠ hLen then
    none
  else
    let lHash := hash label
    let psLen := k - message.size - 2 * hLen - 2
    let ps := ByteArray.mk (Array.replicate psLen (0 : UInt8))
    let db := lHash ++ ps ++ ByteArray.mk #[1] ++ message
    let dbMask := mgf1 hash seed (k - hLen - 1)
    match xorBytes db dbMask with
    | none => none
    | some maskedDB =>
      let seedMask := mgf1 hash maskedDB hLen
      match xorBytes seed seedMask with
      | none => none
      | some maskedSeed =>
        some (ByteArray.mk #[0] ++ maskedSeed ++ maskedDB)

/-- OAEP decoding (RFC 8017 §7.1.2).
    Returns `none` on any formatting or label-hash mismatch. -/
def oaepDecode (hash : ByteArray → ByteArray)
    (k : Nat)
    (em : ByteArray)
    (label : ByteArray := ByteArray.empty) : Option ByteArray :=
  let hLen := (hash ByteArray.empty).size
  if em.size ≠ k then none
  else if em.get! 0 ≠ 0 then none
  else
    let maskedSeed := em.extract 1 (1 + hLen)
    let maskedDB   := em.extract (1 + hLen) k
    let seedMask   := mgf1 hash maskedDB hLen
    match xorBytes maskedSeed seedMask with
    | none => none
    | some seed =>
      let dbMask := mgf1 hash seed (k - hLen - 1)
      match xorBytes maskedDB dbMask with
      | none => none
      | some db =>
        let lHash    := hash label
        let dbLHash  := db.extract 0 hLen
        if lHash ≠ dbLHash then none
        else
          -- locate the 0x01 separator after the zero padding
          let rec findSep (i : Nat) : Option Nat :=
            if i ≥ db.size then none
            else
              let b := db.get! i
              if b = 1 then some i
              else if b = 0 then findSep (i + 1)
              else none
          match findSep hLen with
          | none => none
          | some sepIdx =>
            some (db.extract (sepIdx + 1) db.size)

end RSA_OAEP
