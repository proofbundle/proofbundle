import P256.Field
import P256.Point

/-!
# ECDSA Signature Scheme (FIPS 186-5)

Zero axioms. Zero sorries.
-/

namespace P256

structure HashFn where
  hash : Array UInt8 → Array UInt8
  hashSize : Nat

def hashToScalar (H : HashFn) (msg : Array UInt8) : Nat :=
  let h := H.hash msg
  let mut z := 0
  for i in [0:H.hashSize] do
    if i < h.size then
      z := (z * 256 + h[i]!.toNat) % n
  z

def keyGen (d : Nat) (_hd : d > 0 ∧ d < n) : JacobianPoint :=
  scalarMul d G

def sign (d k : Nat) (_hd : d > 0 ∧ d < n) (_hk : k > 0 ∧ k < n)
  (H : HashFn) (msg : Array UInt8) : Nat × Nat :=
  let z := hashToScalar H msg
  let R := scalarMul k G
  let r := R.X.val % n
  if r = 0 then
    (0, 0)
  else
    let kInv := Nat.modPow k (n - 2) n
    let s := (kInv * (z + r * d)) % n
    if s = 0 then
      (0, 0)
    else
      (r, s)

def verify (Q : JacobianPoint) (r s : Nat)
  (H : HashFn) (msg : Array UInt8) : Bool :=
  if r ≤ 0 ∨ r ≥ n ∨ s ≤ 0 ∨ s ≥ n then
    false
  else
    let z := hashToScalar H msg
    let sInv := Nat.modPow s (n - 2) n
    let u1 := (z * sInv) % n
    let u2 := (r * sInv) % n
    let R := pointAdd (scalarMul u1 G) (scalarMul u2 Q)
    if R.Z.val = 0 then
      false
    else
      let x := R.X.val % n
      x = r

end P256
