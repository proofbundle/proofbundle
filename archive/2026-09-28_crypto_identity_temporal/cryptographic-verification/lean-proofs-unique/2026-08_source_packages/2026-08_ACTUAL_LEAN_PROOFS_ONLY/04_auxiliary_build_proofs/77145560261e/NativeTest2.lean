def bigCheck (n : Nat) : Bool := (n * n + 1) % 7 == 0
theorem viaNative : bigCheck 20 = false := by native_decide

#print axioms viaNative
#print viaNative._native.native_decide.ax_1_1

-- is it genuinely an axiom in the environment?
open Lean in
run_cmd do
  let env ← getEnv
  for n in [`viaNative._native.native_decide.ax_1_1, `Lean.ofReduceBool, `Lean.trustCompiler] do
    match env.find? n with
    | some (.axiomInfo ai) => logInfo m!"{n} :: IS AN AXIOM, type = {ai.type}"
    | some _ => logInfo m!"{n} :: exists, not an axiom"
    | none   => logInfo m!"{n} :: not in environment"
