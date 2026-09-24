#!/bin/bash
# 2026-09-18_NEXT_BUILD.sh
# Builds and checks 2026-09-18_REPORT_TO_FACT.lean against the existing kernel and ledger.
# Each tool invocation writes its unedited output into its own log in logs/, with the command,
# working directory, UTC start time, exit status and wall time. logs/2026-09-18_RUN.log indexes them.
set -u
export PATH="$HOME/.elan/bin:$PATH"
export ELAN_TOOLCHAIN="leanprover/lean4:v4.34.0"
TC="$HOME/.elan/toolchains/leanprover--lean4---v4.34.0"
N="$(cd "$(dirname "$0")" && pwd)"
L="$N/logs"; mkdir -p "$L"
IDX="$L/2026-09-18_RUN.log"
echo "run started $(date -u +%Y-%m-%dT%H:%M:%SZ) (container clock, UTC)" > "$IDX"
run() {
  local logname="$1" log="$L/$1" dir="$2"; shift 2
  { echo "== command: $*"; echo "== working directory: $dir"
    echo "== started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"; echo "== output (stdout and stderr, unedited):"; } > "$log"
  local t0 t1 rc; t0=$(date +%s.%N)
  ( cd "$dir" && "$@" ) >> "$log" 2>&1; rc=$?
  t1=$(date +%s.%N)
  { echo "== exit status: $rc"; echo "== wall seconds: $(echo "$t1 - $t0" | bc)"; } >> "$log"
  echo "exit=$rc  $logname  (cd $dir && $*)" >> "$IDX"
  return $rc
}

run 2026-09-18_TOOL_VERSIONS.log "$N" bash -c 'lean --version; lake --version; date -u +"container clock now: %Y-%m-%dT%H:%M:%SZ"'
run 2026-09-18_SOURCE_HASHES.log "$N/lean" sha256sum 2026-09-15_SI_SECOND_KERNEL.lean 2026-09-15_SI_SECOND_LEDGER.lean 2026-09-15_LAKEFILE.lean 2026-09-18_REPORT_TO_FACT.lean
run 2026-09-18_LAKE_BUILD.log "$N/lean" lake -f 2026-09-15_LAKEFILE.lean build
run 2026-09-18_REPORT_TO_FACT_COMPILE_PRINT_AXIOMS.log "$N/lean" lake -f 2026-09-15_LAKEFILE.lean env lean -o 2026-09-18_REPORT_TO_FACT.olean -i 2026-09-18_REPORT_TO_FACT.ilean 2026-09-18_REPORT_TO_FACT.lean

{ echo 'import Lean'; cat "$N/lean/2026-09-18_REPORT_TO_FACT.lean"; cat <<'LEAN'

open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  let mut n := 0; let mut bad := 0
  for (name, _) in env.constants.map₂.toList do
    if (`SISecond.ReportToFact).isPrefixOf name then
      n := n + 1
      let axs ← collectAxioms name
      IO.println s!"{name}: axioms {axs}"
      if !axs.isEmpty then bad := bad + 1
  IO.println s!"declarations under SISecond.ReportToFact: {n}; with axioms: {bad}"
LEAN
} > "$N/2026-09-18_ALL_CONSTANTS_SCAN.lean"
run 2026-09-18_ALL_CONSTANTS_SCAN.log "$N/lean" lake -f 2026-09-15_LAKEFILE.lean env lean "$N/2026-09-18_ALL_CONSTANTS_SCAN.lean"

run 2026-09-18_LEANCHECKER.log "$N/lean" bash -c "
  echo '-- replay kernel and ledger'
  lake -f 2026-09-15_LAKEFILE.lean env leanchecker «2026-09-15_SI_SECOND_KERNEL» «2026-09-15_SI_SECOND_LEDGER»; echo \"exit \$?\"
  echo '-- replay the new module (.olean produced above)'
  LEAN_PATH=\"$N/lean:$N/lean/.lake/build/lib/lean:$TC/lib/lean\" leanchecker «2026-09-18_REPORT_TO_FACT»; echo \"exit \$?\"
  echo '-- negative control: a module that does not exist (expected nonzero)'
  lake -f 2026-09-15_LAKEFILE.lean env leanchecker «2026-09-18_NO_SUCH_MODULE»; echo \"exit \$?\""
echo "run finished $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$IDX"
