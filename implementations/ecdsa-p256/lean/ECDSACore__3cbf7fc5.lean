/-
ECDSACore.lean — P-256 ECDSA verify, kernel-timing evaluator.
Jacobian coordinates, one Fermat inversion at end, double-and-add over List Bool.
Nat field elements with % p. No Array/BitVec/UInt, no WellFounded.fix,
no sorry/admit/native_decide.
-/

def p : Nat := 115792089210356248762697446949407573530086143415290314195533631308867097853951
def nOrder : Nat := 115792089210356248762697446949407573529996955224135760342422259061068512044369
def aCurve : Nat := p - 3
def Gx : Nat := 48439561293906451759052585252797914202762949526041747995844080717082404635286
def Gy : Nat := 36134250956749795798585127919587881956611106672985015071877198253568414405109

def modp (x : Nat) : Nat := x % p
def madd (x y : Nat) : Nat := modp (x + y)
def msub (x y : Nat) : Nat := modp (p + x - y % p)
def mmul (x y : Nat) : Nat := modp (x * y)

/-- Square-and-multiply Fermat power; fuel bounds bit length. -/
def modPowF : Nat → Nat → Nat → Nat → Nat
  | 0, _, _, acc => acc
  | fuel + 1, base, exp, acc =>
    let acc' := if exp % 2 = 1 then mmul acc base else acc
    modPowF fuel (mmul base base) (exp / 2) acc'

def minv (x : Nat) : Nat := modPowF 256 x (p - 2) 1
def ninv (x : Nat) : Nat :=
  let rec go : Nat → Nat → Nat → Nat → Nat
    | 0, _, _, acc => acc
    | fuel + 1, base, exp, acc =>
      let acc' := if exp % 2 = 1 then (acc * base) % nOrder else acc
      go fuel ((base * base) % nOrder) (exp / 2) acc'
  go 256 x (nOrder - 2) 1

structure JPoint where
  X : Nat
  Y : Nat
  Z : Nat

def infinity : JPoint := { X := 0, Y := 0, Z := 0 }

def jdouble (P : JPoint) : JPoint :=
  if P.Z = 0 then infinity
  else
    let YY := mmul P.Y P.Y
    let S := mmul (mmul 4 P.X) YY
    let ZZ := mmul P.Z P.Z
    let ZZZZ := mmul ZZ ZZ
    let M := madd (mmul 3 (mmul P.X P.X)) (mmul aCurve ZZZZ)
    let X3 := msub (mmul M M) (mmul 2 S)
    let Y3 := msub (mmul M (msub S X3)) (mmul 8 (mmul YY YY))
    let Z3 := mmul (mmul 2 P.Y) P.Z
    { X := X3, Y := Y3, Z := Z3 }

def jadd (P Q : JPoint) : JPoint :=
  if P.Z = 0 then Q
  else if Q.Z = 0 then P
  else
    let Z1Z1 := mmul P.Z P.Z
    let Z2Z2 := mmul Q.Z Q.Z
    let U1 := mmul P.X Z2Z2
    let U2 := mmul Q.X Z1Z1
    let S1 := mmul (mmul P.Y Q.Z) Z2Z2
    let S2 := mmul (mmul Q.Y P.Z) Z1Z1
    if U1 = U2 then
      if S1 = S2 then jdouble P else infinity
    else
      let H := msub U2 U1
      let R := msub S2 S1
      let HH := mmul H H
      let HHH := mmul H HH
      let V := mmul U1 HH
      let X3 := msub (msub (mmul R R) HHH) (mmul 2 V)
      let Y3 := msub (mmul R (msub V X3)) (mmul S1 HHH)
      let Z3 := mmul (mmul P.Z Q.Z) H
      { X := X3, Y := Y3, Z := Z3 }

/-- MSB-first double-and-add over a bit list (true = 1). -/
def jmulBits : List Bool → JPoint → JPoint
  | [], _ => infinity
  | b :: bs, Q =>
    let rec go : List Bool → JPoint → JPoint
      | [], R => R
      | bit :: rest, R =>
        let R2 := jdouble R
        let R3 := if bit then jadd R2 Q else R2
        go rest R3
    let R0 := if b then Q else infinity
    go bs R0

def toAffine (P : JPoint) : Nat × Nat :=
  if P.Z = 0 then (0, 0)
  else
    let zinv := minv P.Z
    let z2 := mmul zinv zinv
    let z3 := mmul z2 zinv
    (mmul P.X z2, mmul P.Y z3)

/-- Full ECDSA verify; returns true iff valid. -/
def verify (Qx Qy z r s : Nat) : Bool :=
  if r = 0 ∨ r ≥ nOrder ∨ s = 0 ∨ s ≥ nOrder then false
  else
    let w := ninv s
    let u1 := (z * w) % nOrder
    let u2 := (r * w) % nOrder
    let bitsOf (k : Nat) : List Bool :=
      let rec go (fuel : Nat) (x : Nat) (acc : List Bool) : List Bool :=
        match fuel with
        | 0 => acc
        | fuel + 1 => go fuel (x / 2) ((x % 2 = 1) :: acc)
      go 256 k []
    let P1 := jmulBits (bitsOf u1) { X := Gx, Y := Gy, Z := 1 }
    let P2 := jmulBits (bitsOf u2) { X := Qx, Y := Qy, Z := 1 }
    let R := jadd P1 P2
    if R.Z = 0 then false
    else
      let (x1, _) := toAffine R
      (x1 % nOrder) = r
