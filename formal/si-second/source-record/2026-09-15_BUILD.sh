#!/bin/bash
# 2026-09-15_BUILD.sh
# Reproduces every check reported in 2026-09-15_BUILD_LOG.txt.
# Needs elan with leanprover/lean4:v4.34.0, python3, bc. Run from the directory holding the files.
set -u
export PATH="$HOME/.elan/bin:$PATH"
export ELAN_TOOLCHAIN="leanprover/lean4:v4.34.0"
cd "$(dirname "$0")"
now() { date +%s.%N; }
since() { echo "$(echo "$(now) - $1" | bc) s"; }

echo "== run started $(date -u +%Y-%m-%dT%H:%M:%SZ) =="
echo "== toolchain =="
lean --version
lake --version

echo
echo "== kernel source scan: whole words Nat axiom sorry admit import Mathlib native_decide Classical propext =="
if grep -nwE 'Nat|axiom|sorry|admit|import|Mathlib|native_decide|Classical|propext' 2026-09-15_SI_SECOND_KERNEL.lean; then
  echo "SCAN RESULT: matches found (see lines above)"
else
  echo "SCAN RESULT: no matches"
fi

echo
echo "== clean build: kernel and ledger =="
rm -rf .lake lake-manifest.json
t=$(now); lake -f 2026-09-15_LAKEFILE.lean build 2>&1 | grep -vE '^trace:'; echo "exit=${PIPESTATUS[0]}; wall $(since $t) (includes lakefile setup)"

echo
echo "== audit: every constant in both modules =="
t=$(now); lake -f 2026-09-15_LAKEFILE.lean env lean 2026-09-15_SI_SECOND_AUDIT.lean 2>&1; echo "exit=$?; wall $(since $t)"

echo
echo "== source sketch defects (expected: compiles; every check passes) =="
t=$(now); lean 2026-09-15_SOURCE_SKETCH_DEFECTS.lean 2>&1; echo "exit=$?; wall $(since $t)"

echo
echo "== sorry in a definition (expected: sorry warning; sorryAx in axiom report) =="
lean 2026-09-15_SOURCE_SKETCH_SORRY.lean 2>&1; echo "exit=$?"

echo
echo "== from as a field name (expected: parse error, nonzero exit) =="
lean 2026-09-15_SOURCE_SKETCH_PARSE_FAILURE.lean 2>&1; echo "exit=$?"

echo
echo "== unary numeral depth probe =="
python3 2026-09-15_UNARY_DEPTH_PROBE.py
echo "== run finished $(date -u +%Y-%m-%dT%H:%M:%SZ) =="
