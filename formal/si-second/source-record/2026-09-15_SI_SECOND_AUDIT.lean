import Lean
import «2026-09-15_SI_SECOND_KERNEL»
import «2026-09-15_SI_SECOND_LEDGER»

/-
  2026-09-15_SI_SECOND_AUDIT.lean

  Audit of every constant in the kernel and ledger modules, including constants Lean
  generates (recursors, size functions, equation helpers, derived instances).
  Reports:
    1. constants whose axiom set is non-empty (expected: none)
    2. kernel constants whose own type or value names the natural-number type directly
    3. for selected kernel constants, whether the natural-number type is reachable
       through any chain of referenced constants
  This file brings in Lean's metaprogramming library; it is not part of the kernel.
-/

open Lean

def moduleConstants (env : Environment) (mod : Name) : Array Name :=
  match env.getModuleIdx? mod with
  | some idx => (env.header.moduleData[idx.toNat]?.map (·.constNames)).getD #[]
  | none => #[]

def usedConstants (ci : ConstantInfo) : Array Name :=
  ci.type.getUsedConstants ++
    (match ci.value? (allowOpaque := true) with
     | some v => v.getUsedConstants
     | none => #[])

def reaches (env : Environment) (target start : Name) : Bool := Id.run do
  let mut visited : NameSet := {}
  let mut stack : Array Name := #[start]
  let mut fuel := 200000
  while fuel > 0 do
    fuel := fuel - 1
    match stack.back? with
    | none => return false
    | some n =>
      stack := stack.pop
      if n == target then return true
      if visited.contains n then continue
      visited := visited.insert n
      if let some ci := env.find? n then
        for m in usedConstants ci do
          stack := stack.push m
  return true -- fuel exhausted: report as reachable (conservative)

#eval show CoreM Unit from do
  let env ← getEnv
  let kernel := `«2026-09-15_SI_SECOND_KERNEL»
  let ledger := `«2026-09-15_SI_SECOND_LEDGER»
  for mod in [kernel, ledger] do
    let names := moduleConstants env mod
    let mut withAxioms : Array (Name × Array Name) := #[]
    for n in names do
      let axs ← collectAxioms n
      if !axs.isEmpty then withAxioms := withAxioms.push (n, axs)
    IO.println s!"MODULE {mod}: {names.size} constants; constants with a non-empty axiom set: {withAxioms.size}"
    for (n, axs) in withAxioms do
      IO.println s!"  {n}: {axs}"
  -- 2. direct mentions of the natural-number type in the kernel
  let knames := moduleConstants env kernel
  let direct := knames.filter fun n =>
    match env.find? n with
    | some ci => (usedConstants ci).contains ``Nat
    | none => false
  let generatedMarks := ["_sizeOf_", "sizeOf_spec", "ctorIdx", "ctorElim", ".elim",
    "noConfusion", ".ofNat", "instDecidableEq", "_proof_"]
  let isGenerated (n : Name) : Bool :=
    generatedMarks.any (fun m => (n.toString.splitOn m).length > 1)
  let generated := direct.filter isGenerated
  let other := direct.filter (fun n => !isGenerated n)
  IO.println s!"KERNEL constants whose own type or value names Nat directly: {direct.size} of {knames.size}"
  IO.println s!"  matching Lean-generated name patterns {generatedMarks}: {generated.size}"
  IO.println s!"  not matching those patterns (hand-written candidates): {other.size}"
  for n in other.qsort (fun a b => a.toString < b.toString) do
    IO.println s!"    {n}"
  IO.println "  full list:"
  for n in direct.qsort (fun a b => a.toString < b.toString) do
    IO.println s!"    {n}"
  -- 3. reachability for selected kernel constants
  let selected : List Name :=
    [ ``SISecond.caesiumPeriodsPerSecond, ``SISecond.lightSpeedMetresPerSecond,
      ``SISecond.Pos.mul, ``SISecond.periodsFor,
      ``SISecond.IsSecond, ``SISecond.IsDuration, ``SISecond.MeetsDefinitionForm,
      ``SISecond.decIsSecond, ``SISecond.formOnlyRecord_isSecond,
      ``SISecond.NoCarrier.BareIsSecond, ``SISecond.Pos.encode_append_inj ]
  IO.println "KERNEL reachability of Nat through referenced constants:"
  for n in selected do
    IO.println s!"  {n}: {if reaches env ``Nat n then "reaches Nat" else "does not reach Nat"}"

-- Headline results, printed in readable form.
#print axioms SISecond.formOnlyRecord_isSecond
#print axioms SISecond.isDuration_iff_count
#print axioms SISecond.Pos.toNat_mul
#print axioms SISecond.Pos.toNat_inj
#print axioms SISecond.run_total
#print axioms SISecond.run_phase_lt
#print axioms SISecond.caesium_run_total
#print axioms SISecond.NoCarrier.bareIsSecond_iff
#print axioms SISecond.NoCarrier.bare_same_content
#print axioms SISecond.Pos.encode_append_inj
#print axioms SISecond.raw64_caesium_count_wrap_seconds
