#!/bin/bash
# usage: run_one.sh <json file>   (documented command, parameterized by input path)
set -e
cd /home/claude/coqcheck
{ printf 'From Coq Require Import String.\nFrom SIC Require Import SI_SECOND_CHECKER_2026_09_15.\n'
  printf 'Definition input : String.string := \042'
  sed 's/\x22/\x22\x22/g' "$1"
  printf '\042%%string.\nEval vm_compute in check input.\n'; } > run_check.v
coqc -Q . SIC run_check.v 2>&1 | tr -s ' \n' ' '
echo
