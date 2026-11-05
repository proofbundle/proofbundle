#!/bin/bash
# 2026-09-15_GEN_COQ_RUN_FILES.sh <coq dir> <json files...>
# For each JSON file writes run_<name>.v: the file's bytes as a Coq string (each double quote doubled,
# which is how Coq writes one inside a string), the checker call with its printed result, a
# kernel-checked lemma that the stored result equals the checker call, and Print Assumptions.
set -u
dir="$1"; shift
for f in "$@"; do
  name=$(basename "$f" .json)
  v="$dir/run_${name}.v"
  { printf 'From Coq Require Import String.\nFrom SIC Require Import SI_SECOND_CHECKER_2026_09_15.\n'
    printf 'Definition input : String.string := \042'
    sed 's/\x22/\x22\x22/g' "$f"
    printf '\042%%string.\n'
    printf 'Eval vm_compute in check input.\n'
    printf 'Definition result := Eval vm_compute in check input.\n'
    printf 'Print result.\n'
    printf 'Lemma result_is_check_input : result = check input.\nProof. reflexivity. Qed.\n'
    printf 'Print Assumptions result_is_check_input.\n'; } > "$v"
  echo "wrote $v from $f sha256 $(sha256sum "$f" | cut -d' ' -f1)"
done
