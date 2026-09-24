import Lean
import «2026-09-22_SI_SECOND_SERIAL»
/- Audit of every constant in the serialization module, generated ones included.
   Same method as 2026-09-15_SI_SECOND_AUDIT.lean: collectAxioms per constant, plus
   direct mentions of Nat split into Lean-generated vs hand-written names. -/
open Lean
def moduleConstants (env : Environment) (mod : Name) : Array Name :=
  match env.getModuleIdx? mod with
  | some idx => (env.header.moduleData[idx.toNat]?.map (·.constNames)).getD #[]
  | none => #[]
def usedConstants (ci : ConstantInfo) : Array Name :=
  ci.type.getUsedConstants ++ (match ci.value? (allowOpaque := true) with | some v => v.getUsedConstants | none => #[])
#eval show CoreM Unit from do
  let env ← getEnv
  let mod := `«2026-09-22_SI_SECOND_SERIAL»
  let names := moduleConstants env mod
  let mut bad := 0
  for n in names do
    let axs ← collectAxioms n
    if !axs.isEmpty then bad := bad + 1; IO.println s!"  {n}: {axs}"
  IO.println s!"MODULE {mod}: {names.size} constants; constants with a non-empty axiom set: {bad}"
  let marks := ["_sizeOf_", "sizeOf_spec", "ctorIdx", "ctorElim", ".elim", "noConfusion", ".ofNat", "instDecidableEq", "_proof_", "match_", "_unfold", ".eq_"]
  let direct := names.filter fun n => match env.find? n with | some ci => (usedConstants ci).contains ``Nat | none => false
  let hand := direct.filter fun n => !(marks.any fun m => (n.toString.splitOn m).length > 1)
  IO.println s!"constants naming Nat directly: {direct.size}; not matching generated patterns: {hand.size}"
  for n in hand do IO.println s!"    {n}"
#print axioms SISecond.Serial.realizationE_pf
#print axioms SISecond.Serial.encode_inj
#print axioms SISecond.Serial.encode_pair_inj
#print axioms SISecond.Serial.formOnly_code_ne_succ
#print axioms SISecond.Serial.formOnly_code_ne_reversed
