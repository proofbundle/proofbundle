import P256.Field

/-!
# P-256 Point Arithmetic

Zero axioms. Zero sorries.
-/

namespace P256

inductive Point
  | infinity
  | affine (x y : Fp)

structure JacobianPoint where
  X : Fp
  Y : Fp
  Z : Fp

def jacobianToAffine (P : JacobianPoint) : Point :=
  if P.Z.val = 0 then
    Point.infinity
  else
    let z2 := fpMul P.Z P.Z
    let z3 := fpMul z2 P.Z
    let x := fpMul P.X (fpInv z2)
    let y := fpMul P.Y (fpInv z3)
    Point.affine x y

def pointDouble (P : JacobianPoint) : JacobianPoint :=
  if P.Y.val = 0 then
    ⟨P.X, P.Y, ⟨0, by decide⟩⟩
  else
    let S := fpMul (fpMul ⟨4, by native_decide⟩ P.X) (fpMul P.Y P.Y)
    let M := fpMul ⟨3, by native_decide⟩ (fpMul P.X P.X)
    let X3 := fpSub (fpMul M M) (fpMul ⟨2, by native_decide⟩ S)
    let Y3 := fpSub (fpMul M (fpSub S X3))
      (fpMul ⟨8, by native_decide⟩ (fpMul P.Y (fpMul P.Y (fpMul P.Y P.Y))))
    let Z3 := fpMul ⟨2, by native_decide⟩ (fpMul P.Y P.Z)
    ⟨X3, Y3, Z3⟩

def pointAdd (P Q : JacobianPoint) : JacobianPoint :=
  if P.Z.val = 0 then Q
  else if Q.Z.val = 0 then P
  else
    let z1z1 := fpMul P.Z P.Z
    let z2z2 := fpMul Q.Z Q.Z
    let u1 := fpMul P.X z2z2
    let u2 := fpMul Q.X z1z1
    let s1 := fpMul P.Y (fpMul Q.Z z2z2)
    let s2 := fpMul Q.Y (fpMul P.Z z1z1)
    if u1.val = u2.val then
      if s1.val = s2.val then
        pointDouble P
      else
        ⟨⟨0, by decide⟩, ⟨1, by decide⟩, ⟨0, by decide⟩⟩
    else
      let h := fpSub u2 u1
      let i := fpMul (fpMul ⟨4, by native_decide⟩ h) h
      let j := fpMul h i
      let r := fpMul ⟨2, by native_decide⟩ (fpSub s2 s1)
      let v := fpMul u1 i
      let X3 := fpSub (fpSub (fpMul r r) j) (fpMul ⟨2, by native_decide⟩ v)
      let Y3 := fpSub (fpMul r (fpSub v X3)) (fpMul ⟨2, by native_decide⟩ (fpMul s1 j))
      let Z3 := fpMul (fpMul (fpAdd P.Z Q.Z)
        (fpSub (fpMul (fpAdd P.Z Q.Z) (fpAdd P.Z Q.Z)) z1z1)) z2z2
      ⟨X3, Y3, Z3⟩

def scalarMul (k : Nat) (P : JacobianPoint) : JacobianPoint :=
  let mut result := ⟨⟨0, by decide⟩, ⟨1, by decide⟩, ⟨0, by decide⟩⟩
  let mut addend := P
  let mut exp := k
  while exp > 0 do
    if exp % 2 = 1 then
      result := pointAdd result addend
    addend := pointDouble addend
    exp := exp / 2
  result

def G : JacobianPoint :=
  ⟨Gx, Gy, ⟨1, by decide⟩⟩

def isOnCurve (P : Point) : Bool :=
  match P with
  | Point.infinity => true
  | Point.affine x y =>
    let y2 := fpMul y y
    let x3 := fpMul (fpMul x x) x
    let ax := fpMul curveA x
    let rhs := fpAdd (fpAdd x3 ax) curveB
    y2.val = rhs.val

end P256
