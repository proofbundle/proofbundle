#!/bin/bash
# 2026-09-15_HANDOVER_BUILD.sh
# Fresh run of every tool from the bundle sources. Each tool invocation writes its unedited stdout and
# stderr directly into its own log in logs/, with the command, working directory, start time, exit
# status, and wall time. logs/2026-09-15_HANDOVER_RUN.log lists every invocation in order.
set -u
export PATH="$HOME/.elan/bin:$PATH"
export ELAN_TOOLCHAIN="leanprover/lean4:v4.34.0"
TC="$HOME/.elan/toolchains/leanprover--lean4---v4.34.0"
H=/home/claude/2026-09-15_HANDOVER
SRC=/home/claude/2026-09-15_SI_SECOND_WITNESS_BUNDLE
PB=/tmp/pb
L="$H/logs"
mkdir -p "$H/lean" "$H/coq" "$H/data" "$L"
INDEX="$L/2026-09-15_HANDOVER_RUN.log"
echo "handover run started $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$INDEX"

run() {
  local log="$L/$1" dir="$2"; shift 2
  { echo "== command: $*"; echo "== working directory: $dir"
    echo "== started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"; echo "== output (stdout and stderr, unedited):"; } > "$log"
  local t0 t1 rc
  t0=$(date +%s.%N)
  (cd "$dir" && "$@") >> "$log" 2>&1
  rc=$?
  t1=$(date +%s.%N)
  { echo "== exit status: $rc"; echo "== wall seconds: $(echo "$t1 - $t0" | bc)"; } >> "$log"
  echo "exit=$rc  $1  (cd $dir && $*)" >> "$INDEX"
  return $rc
}

cp "$SRC"/lean/2026-09-15_SI_SECOND_KERNEL.lean "$SRC"/lean/2026-09-15_SI_SECOND_LEDGER.lean \
   "$SRC"/lean/2026-09-15_SI_SECOND_AUDIT.lean "$SRC"/lean/2026-09-15_SI_SECOND_WITNESS.lean \
   "$SRC"/lean/2026-09-15_LAKEFILE.lean "$H/lean/"
cp "$SRC"/coq/SI_SECOND_CHECKER_2026_09_15.v "$H/coq/"
cp "$SRC"/data/witness.json "$SRC"/data/witness.pb.json "$SRC"/data/cases/*.json "$H/data/"
cp /home/claude/2026-09-15_HANDOVER/2026-09-15_GEN_COQ_RUN_FILES.sh "$H/coq/"

run 2026-09-15_SOURCE_HASHES.log "$H" sha256sum lean/2026-09-15_SI_SECOND_KERNEL.lean lean/2026-09-15_SI_SECOND_LEDGER.lean lean/2026-09-15_SI_SECOND_AUDIT.lean lean/2026-09-15_SI_SECOND_WITNESS.lean lean/2026-09-15_LAKEFILE.lean coq/SI_SECOND_CHECKER_2026_09_15.v data/witness.json data/witness.pb.json
run 2026-09-15_TOOL_VERSIONS.log "$H" bash -c 'lean --version; lake --version; coqc --version; coqchk --version; node --version; python3 --version; git -C /tmp/pb log -1 --format="proofbundle commit %H %cI"'

# Lean
run 2026-09-15_LAKE_BUILD.log "$H/lean" lake -f 2026-09-15_LAKEFILE.lean build -v
run 2026-09-15_LAKE_BUILD_OUTPUT_FILES.log "$H/lean" find .lake -type f -printf '%10s bytes  %p\n'
run 2026-09-15_LEAN_WITNESS_COMPILE_PRINT_AXIOMS.log "$H/lean" lake -f 2026-09-15_LAKEFILE.lean env lean -o 2026-09-15_SI_SECOND_WITNESS.olean -i 2026-09-15_SI_SECOND_WITNESS.ilean 2026-09-15_SI_SECOND_WITNESS.lean
run 2026-09-15_LEAN_AUDIT_PRINT_AXIOMS.log "$H/lean" lake -f 2026-09-15_LAKEFILE.lean env lean 2026-09-15_SI_SECOND_AUDIT.lean
run 2026-09-15_LEANCHECKER_KERNEL_LEDGER.log "$H/lean" lake -f 2026-09-15_LAKEFILE.lean env leanchecker «2026-09-15_SI_SECOND_KERNEL» «2026-09-15_SI_SECOND_LEDGER»
run 2026-09-15_LEANCHECKER_WITNESS.log "$H/lean" env LEAN_PATH="$H/lean:$H/lean/.lake/build/lib/lean:$TC/lib/lean" leanchecker «2026-09-15_SI_SECOND_WITNESS»
run 2026-09-15_LEANCHECKER_NEGATIVE_CONTROL.log "$H/lean" lake -f 2026-09-15_LAKEFILE.lean env leanchecker «2026-09-15_NO_SUCH_MODULE»

# Coq
run 2026-09-15_COQ_CHECKER_COMPILE_PRINT_ASSUMPTIONS.log "$H/coq" coqc -Q . SIC SI_SECOND_CHECKER_2026_09_15.v
run 2026-09-15_COQ_RUN_FILES_GENERATE.log "$H/coq" bash 2026-09-15_GEN_COQ_RUN_FILES.sh . ../data/witness.json ../data/twin_succ_periods.json ../data/twin_empty_corrections.json ../data/twin_other_species.json ../data/twin_same_level.json ../data/malformed_extra_key.json ../data/malformed_trailing_space.json
for c in witness twin_succ_periods twin_empty_corrections twin_other_species twin_same_level malformed_extra_key malformed_trailing_space; do
  run "2026-09-15_COQ_RUN_${c}_PRINT_ASSUMPTIONS.log" "$H/coq" coqc -Q . SIC "run_${c}.v"
done
run 2026-09-15_COQCHK.log "$H/coq" coqchk -o -Q . SIC SIC.SI_SECOND_CHECKER_2026_09_15 SIC.run_witness SIC.run_twin_succ_periods SIC.run_twin_empty_corrections SIC.run_twin_other_species SIC.run_twin_same_level SIC.run_malformed_extra_key SIC.run_malformed_trailing_space
run 2026-09-15_SHA256_WITNESS_JSON.log "$H/data" sha256sum witness.json

# ProofBundle
run 2026-09-15_PROOFBUNDLE_VERIFY.log "$H/data" node "$PB/cli/proofbundle-cli.mjs" verify witness.pb.json
run 2026-09-15_PROOFBUNDLE_TAMPER_MAKE.log "$H/data" python3 -c 'import json; c=json.load(open("witness.pb.json")); r=c["payload"]["artifacts"][0]["merkle_root_b64u"]; c["payload"]["artifacts"][0]["merkle_root_b64u"]=("A" if r[0]!="A" else "B")+r[1:]; open("witness_tampered_root.pb.json","w").write(json.dumps(c,indent=2)); print("merkle_root_b64u first character", r[0], "->", c["payload"]["artifacts"][0]["merkle_root_b64u"][0])'
run 2026-09-15_PROOFBUNDLE_VERIFY_TAMPERED.log "$H/data" node "$PB/cli/proofbundle-cli.mjs" verify witness_tampered_root.pb.json

echo "handover run finished $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$INDEX"
