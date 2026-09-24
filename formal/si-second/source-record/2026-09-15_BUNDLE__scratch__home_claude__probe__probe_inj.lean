set_option genInjectivity false in
inductive P : Type where
  | one : P
  | twice : P → P
  | twicePlusOne : P → P
  deriving DecidableEq
set_option genInjectivity false in
structure S where
  a : P
  b : Bool
  deriving DecidableEq
theorem t : P.twice P.one ≠ P.twicePlusOne P.one := by decide
theorem u : (⟨P.one, true⟩ : S) ≠ ⟨P.one, false⟩ := by decide
#print axioms t
#print axioms u
#print axioms instDecidableEqP
#print axioms instDecidableEqS
open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  IO.println s!"P.twice.injEq exists: {env.contains `P.twice.injEq}; S.mk.injEq exists: {env.contains `S.mk.injEq}"
