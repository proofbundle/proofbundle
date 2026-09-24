#!/bin/bash
# 2026-09-15_RUN_ALL.sh
# Reruns every build and check for the SI-second witness and logs everything, failures included.
# Each step writes logs/2026-09-15_STEP_NN_<name>.txt containing the exact commands (the function
# body), full output, exit code, and wall time. logs/2026-09-15_RUN_LOG.txt lists every step.
# A failing step does not stop the run.
# Needs outside the bundle: elan with Lean 4.34.0; Coq 8.18.0 (coqc, coqchk); Node; Python 3 with
# blake3; a clone of github.com/proofbundle/proofbundle at /tmp/pb with jsdom installed.
set -u
export PATH="$HOME/.elan/bin:$PATH"
export ELAN_TOOLCHAIN="leanprover/lean4:v4.34.0"
B="$(cd "$(dirname "$0")/.." && pwd)"
S=/home/claude/build
C=/home/claude/coqcheck
PB=/tmp/pb
OUT=/mnt/user-data/outputs
LOGDIR="$B/logs"
LOG="$LOGDIR/2026-09-15_RUN_LOG.txt"
mkdir -p "$LOGDIR"
: > "$LOG"
echo "RUN STARTED $(date -u +%Y-%m-%dT%H:%M:%SZ) bundle=$B" >> "$LOG"
n=0
step() {
  n=$((n+1)); local id; id=$(printf "%02d" "$n")
  local out="$LOGDIR/2026-09-15_STEP_${id}_$2.txt"
  { echo "== STEP $id: $1"; echo "== started $(date -u +%Y-%m-%dT%H:%M:%SZ)"; echo "== commands:"; declare -f "$2"; echo "== output:"; } > "$out"
  local t0 t1 rc
  t0=$(date +%s.%N)
  ( "$2" ) >> "$out" 2>&1
  rc=$?
  t1=$(date +%s.%N)
  { echo "== exit $rc"; echo "== wall $(echo "$t1 - $t0" | bc) s"; } >> "$out"
  echo "STEP $id exit=$rc wall=$(echo "$t1 - $t0" | bc)s $1 -> logs/$(basename "$out")" >> "$LOG"
}

toolchain() {
  lean --version; lake --version
  coqc --version; coqchk --version
  node --version; python3 --version
  python3 -c "import blake3; print('python blake3', blake3.__version__)"
  echo "-- Lean 4.34.0 toolchain binaries:"; ls "$HOME/.elan/toolchains/leanprover--lean4---v4.34.0/bin/"
  echo "-- ProofBundle clone:"; git -C "$PB" log -1 --format='commit %H %cI'
  git -C "$PB" status --porcelain -- cli proofbundle.html package.json
  echo "(no status lines above = cli, proofbundle.html, package.json unmodified)"
  (cd "$PB" && npm ls jsdom)
}

collect_inputs() {
  mkdir -p "$B/lean" "$B/coq" "$B/data/cases" "$B/proofbundle/cli" "$B/scratch"
  cp -v "$S/2026-09-15_SI_SECOND_KERNEL.lean" "$S/2026-09-15_SI_SECOND_LEDGER.lean" \
        "$S/2026-09-15_LAKEFILE.lean" "$S/2026-09-15_SI_SECOND_AUDIT.lean" "$B/lean/"
  cp -v "$OUT/2026-09-15_SI_SECOND_WITNESS.lean" "$B/lean/"
  cp -v "$OUT/SI_SECOND_CHECKER_2026_09_15.v" "$B/coq/"
  cp -v "$OUT/witness.json" "$OUT/witness.pb.json" "$B/data/"
  cp -v "$OUT/2026-09-15_MANIFEST.txt" "$B/scratch/2026-09-15_PRIOR_BUILD_MANIFEST.txt"
  cp -v "$PB/proofbundle.html" "$PB/package.json" "$B/proofbundle/"
  [ -e "$PB/package-lock.json" ] && cp -v "$PB/package-lock.json" "$B/proofbundle/"
  cp -v "$PB/cli/proofbundle-cli.mjs" "$B/proofbundle/cli/"
  echo "-- git blob ids recorded at the clone commit:"
  git -C "$PB" ls-files -s proofbundle.html cli/proofbundle-cli.mjs package.json package-lock.json
  echo "-- git blob ids of the copies:"
  git hash-object "$B/proofbundle/proofbundle.html" "$B/proofbundle/cli/proofbundle-cli.mjs" "$B/proofbundle/package.json"
  cp -v "$PB/seal_witness_scratch.mjs" "$B/proofbundle/2026-09-15_SEAL_DRIVER_SCRATCH.mjs"
}

prior_manifest() {
  python3 - "$B" <<'PY'
import hashlib, re, sys
b = sys.argv[1]
m = open(f"{b}/scratch/2026-09-15_PRIOR_BUILD_MANIFEST.txt").read()
rec = dict(re.findall(r"file:\s+(\S+)\nbytes:\s+\d+\nsha256:\s+(\w+)", m))
for f in ["2026-09-15_SI_SECOND_KERNEL.lean", "2026-09-15_SI_SECOND_LEDGER.lean",
          "2026-09-15_LAKEFILE.lean", "2026-09-15_SI_SECOND_AUDIT.lean"]:
    d = hashlib.sha256(open(f"{b}/lean/{f}", "rb").read()).hexdigest()
    print(f, d, "MATCHES prior manifest" if d == rec.get(f) else f"DIFFERS from prior manifest {rec.get(f)}")
PY
}

lean_build() {
  cd "$B/lean" || exit 1
  rm -rf .lake lake-manifest.json
  lake -f 2026-09-15_LAKEFILE.lean build
  echo "lake exit $?"
  ls -la .lake/build/lib/lean/
}

lean_witness() {
  cd "$B/lean" || exit 1
  mkdir -p witness_build
  lake -f 2026-09-15_LAKEFILE.lean env lean \
    -o witness_build/2026-09-15_SI_SECOND_WITNESS.olean \
    -i witness_build/2026-09-15_SI_SECOND_WITNESS.ilean \
    2026-09-15_SI_SECOND_WITNESS.lean
  echo "lean exit $?"
  ls -la witness_build/
}

lean_witness_all_constants() {
  cd "$B/lean" || exit 1
  { echo 'import Lean'; cat 2026-09-15_SI_SECOND_WITNESS.lean; cat <<'LEAN'

open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  let mut n := 0
  let mut bad := 0
  for (name, _) in env.constants.map₂.toList do
    if (`SISecond.Witness).isPrefixOf name then
      n := n + 1
      let axs ← collectAxioms name
      IO.println s!"{name}: axioms {axs}"
      if !axs.isEmpty then bad := bad + 1
  IO.println s!"declarations under SISecond.Witness: {n}; with axioms: {bad}"
LEAN
  } > "$B/scripts/2026-09-15_WITNESS_ALL_CONSTANTS.lean"
  lake -f 2026-09-15_LAKEFILE.lean env lean "$B/scripts/2026-09-15_WITNESS_ALL_CONSTANTS.lean"
  echo "lean exit $?"
}

lean_audit() {
  cd "$B/lean" || exit 1
  lake -f 2026-09-15_LAKEFILE.lean env lean 2026-09-15_SI_SECOND_AUDIT.lean
  echo "lean exit $?"
}

lean_checker() {
  cd "$B/lean" || exit 1
  local lc="$HOME/.elan/toolchains/leanprover--lean4---v4.34.0/bin/leanchecker"
  if [ -x "$lc" ]; then
    "$lc" --help 2>&1 | head -30
    lake -f 2026-09-15_LAKEFILE.lean env leanchecker «2026-09-15_SI_SECOND_KERNEL» «2026-09-15_SI_SECOND_LEDGER»
    echo "leanchecker exit $?"
  else
    echo "leanchecker is not present in the Lean 4.34.0 toolchain bin directory."
    echo "No independent replay of the .olean files was run."
    exit 3
  fi
}

json_regenerate() {
  python3 - "$B" <<'PY'
import json, sys
b = sys.argv[1]
n = 9192631770; code = ""
while n != 1:
    code += "0" if n % 2 == 0 else "1"; n //= 2
code += "."
corr = [{"effect": e, "shift": "zero", "uncertainty": "zero"}
        for e in ["motion", "staticFields", "thermalRadiation", "collisions"]]
rec = {"atRest": "correctedToLimit", "corrections": corr, "isolated": "correctedToLimit",
       "noStaticFields": "correctedToLimit", "noThermalRadiation": "correctedToLimit",
       "periods": code, "species": "caesium133", "sublevels": "zeroToZero",
       "transition": {"levelA": "fThree", "levelB": "fFour"}}
text = json.dumps(rec, separators=(",", ":"), sort_keys=True, ensure_ascii=True)
open(f"{b}/logs/2026-09-15_REGENERATED_witness.json", "w", newline="").write(text)
print("regenerated", len(text), "bytes; periods code", code)
PY
  cmp "$B/logs/2026-09-15_REGENERATED_witness.json" "$B/data/witness.json" \
    && echo "regenerated file is byte-identical to data/witness.json"
}

json_stability() {
  cp -v /tmp/stability.js "$B/scripts/2026-09-15_JSON_STABILITY.js"
  node "$B/scripts/2026-09-15_JSON_STABILITY.js" "$B/data/witness.json"
  echo "node exit $?"
}

make_cases() {
  python3 - "$B" <<'PY'
import hashlib, json, sys
b = sys.argv[1]
base = json.loads(open(f"{b}/data/witness.json").read())
def enc(n):
    out = ""
    while n != 1:
        out += "0" if n % 2 == 0 else "1"; n //= 2
    return out + "."
def dump(r): return json.dumps(r, separators=(",", ":"), sort_keys=True, ensure_ascii=True)
cases = {}
t = json.loads(dump(base)); t["periods"] = enc(9192631771); cases["twin_succ_periods"] = dump(t)
t = json.loads(dump(base)); t["corrections"] = []; cases["twin_empty_corrections"] = dump(t)
t = json.loads(dump(base)); t["species"] = "otherSpecies"; cases["twin_other_species"] = dump(t)
t = json.loads(dump(base)); t["transition"]["levelB"] = "fThree"; cases["twin_same_level"] = dump(t)
t = json.loads(dump(base)); t["note"] = "x"; cases["malformed_extra_key"] = dump(t)
cases["malformed_trailing_space"] = dump(base) + " "
for k, v in cases.items():
    open(f"{b}/data/cases/{k}.json", "w", newline="").write(v)
    print(k, len(v.encode()), "bytes sha256", hashlib.sha256(v.encode()).hexdigest())
PY
  for f in "$B"/data/cases/*.json; do
    if cmp -s "$f" "/tmp/cases/$(basename "$f")"; then echo "$(basename "$f") identical to the earlier scratch copy"
    else echo "$(basename "$f") DIFFERS from the earlier scratch copy"; fi
  done
}

coq_checker() {
  cd "$B/coq" || exit 1
  coqc -Q . SIC SI_SECOND_CHECKER_2026_09_15.v
  echo "coqc exit $?"
  ls -la
}

coq_runs() {
  cd "$B/coq" || exit 1
  mkdir -p runs
  for f in ../data/witness.json ../data/cases/*.json; do
    name=$(basename "$f" .json)
    v="runs/run_${name}.v"
    { printf 'From Coq Require Import String.\nFrom SIC Require Import SI_SECOND_CHECKER_2026_09_15.\n'
      printf 'Definition input : String.string := \042'
      sed 's/\x22/\x22\x22/g' "$f"
      printf '\042%%string.\n'
      printf 'Eval vm_compute in check input.\n'
      printf 'Definition result := Eval vm_compute in check input.\n'
      printf 'Print result.\n'
      printf 'Lemma result_is_check_input : result = check input.\nProof. reflexivity. Qed.\n'
      printf 'Print Assumptions result_is_check_input.\n'; } > "$v"
    echo "---- input $f sha256 $(sha256sum "$f" | cut -d' ' -f1)"
    echo "---- generated $v"
    coqc -Q . SIC "$v"
    echo "coqc exit $?"
  done
  echo "---- sha256 of B printed with the checker result:"
  sha256sum ../data/witness.json
}

coq_kernel_check() {
  cd "$B/coq" || exit 1
  mods="SIC.SI_SECOND_CHECKER_2026_09_15"
  for v in runs/run_*.v; do mods="$mods SIC.runs.$(basename "$v" .v)"; done
  echo "modules: $mods"
  coqchk -o -Q . SIC $mods
  echo "coqchk exit $?"
}

pb_verify() {
  cd "$B/data" || exit 1
  node "$PB/cli/proofbundle-cli.mjs" verify witness.pb.json
  echo "cli verify exit $?"
}

pb_tamper() {
  cd "$B/data" || exit 1
  python3 - <<'PY'
import json
c = json.load(open("witness.pb.json"))
r = c["payload"]["artifacts"][0]["merkle_root_b64u"]
c["payload"]["artifacts"][0]["merkle_root_b64u"] = ("A" if r[0] != "A" else "B") + r[1:]
open("witness_tampered_root.pb.json", "w").write(json.dumps(c, indent=2))
print("first character of merkle_root_b64u changed:", r[0], "->", c["payload"]["artifacts"][0]["merkle_root_b64u"][0])
PY
  node "$PB/cli/proofbundle-cli.mjs" verify witness_tampered_root.pb.json
  echo "cli verify exit $?"
}

binding() {
  python3 - "$B" <<'PY'
import base64, hashlib, json, sys
b = sys.argv[1]
B = open(f"{b}/data/witness.json", "rb").read()
C = open(f"{b}/data/witness.pb.json", "rb").read()
c = json.loads(C); art = c["payload"]["artifacts"][0]
root = base64.urlsafe_b64encode(hashlib.sha256(b"\x00" + B).digest()).rstrip(b"=").decode()
gpx = hashlib.sha3_384(b"artifact.content" + b"\x00" + len(B).to_bytes(8, "little") + B).hexdigest()
print("receipt merkle_root_b64u    ", art["merkle_root_b64u"])
print("base64url(SHA-256(0x00||B)) ", root, "equal:", root == art["merkle_root_b64u"])
print("receipt gpx_content_address ", art["gpx_content_address"])
print("SHA3-384(prefix||B)         ", gpx, "equal:", gpx == art["gpx_content_address"])
print("receipt size", art["size"], "len(B)", len(B), "equal:", art["size"] == len(B))
print("bundle_id", c["hdr"]["bundle_id"], "profile", c["hdr"]["profile"], "spec_ver", c["hdr"]["spec_ver"])
print("sha256(B)", hashlib.sha256(B).hexdigest())
print("sha256(C)", hashlib.sha256(C).hexdigest())
PY
}

collect_scratch() {
  d="$B/scratch"
  mkdir -p "$d/tmp/cases" "$d/home_claude/build" "$d/home_claude/coqcheck" "$d/home_claude/coqprobe" "$d/home_claude/probe"
  for f in /tmp/run_one.sh /tmp/witness_allconsts.lean /tmp/stability.js /tmp/verify_out.json /tmp/verify_err.txt \
           /tmp/tamper_out.json /tmp/witness_tampered.pb.json /tmp/npm.log; do
    if [ -e "$f" ]; then cp -v "$f" "$d/tmp/"; else echo "absent: $f"; fi
  done
  cp -v /tmp/cases/*.json "$d/tmp/cases/"
  for f in /home/claude/coq_install.log /home/claude/elan_install.log /home/claude/elan-init.sh; do
    if [ -e "$f" ]; then cp -v "$f" "$d/home_claude/"; else echo "absent: $f"; fi
  done
  for f in witness_out.txt witness_syms.txt witness_code.txt bits_term.txt handwritten.txt audit_out.txt lean-toolchain; do
    if [ -e "$S/$f" ]; then cp -v "$S/$f" "$d/home_claude/build/"; else echo "absent: $S/$f"; fi
  done
  for f in run_check.v run_check.vo run_check.vok run_check.vos run_check.glob; do
    if [ -e "$C/$f" ]; then cp -v "$C/$f" "$d/home_claude/coqcheck/"; else echo "absent: $C/$f"; fi
  done
  cp -v /home/claude/coqprobe/* "$d/home_claude/coqprobe/"
  (cd /home/claude/probe && find . -path ./modprobe/.lake -prune -o -type f -print | while read -r f; do
     mkdir -p "$d/home_claude/probe/$(dirname "$f")"; cp "$f" "$d/home_claude/probe/$f"; echo "copied probe/$f"; done)
  echo "-- note: /home/claude/probe/modprobe/.lake (Lake build cache of a name probe) not copied"
}

step "Tool versions and ProofBundle clone state" toolchain
step "Copy delivered files, sources, and the ProofBundle engine into the bundle" collect_inputs
step "Kernel, ledger, lakefile, audit against the prior manifest" prior_manifest
step "Lean clean build of kernel and ledger (.olean)" lean_build
step "Lean compile of the witness with #print axioms (.olean)" lean_witness
step "Lean scan of every declaration under SISecond.Witness" lean_witness_all_constants
step "Lean audit of every constant in kernel and ledger" lean_audit
step "Independent replay of .olean files if leanchecker exists" lean_checker
step "Regenerate witness.json from its definition and compare bytes" json_regenerate
step "Node JSON round-trip test on witness.json" json_stability
step "Generate negative-twin and malformed JSON cases" make_cases
step "Coq compile of the checker with Print Assumptions (.vo)" coq_checker
step "Coq runs on witness.json and every case, results printed and kernel-checked" coq_runs
step "coqchk on the checker and every run module" coq_kernel_check
step "ProofBundle CLI verifyCore on witness.pb.json" pb_verify
step "ProofBundle CLI verifyCore on a copy with one Merkle-root character changed" pb_tamper
step "Binding of witness.pb.json to witness.json with standard hashes" binding
step "Collect every earlier scratch file and log" collect_scratch
echo "RUN FINISHED $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG"
