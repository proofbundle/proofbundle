#!/usr/bin/env bash
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p 40_RUN_LOGS 50_RECEIPTS
status=0
lean --version | tee 40_RUN_LOGS/lean-version.txt
for f in ECDSAP256.lean ECDSAP256Theorems.lean ECDSAP256Hostile.lean SHA256.lean SHA256Theorems.lean; do
  echo "===== $f =====" | tee "40_RUN_LOGS/${f%.lean}.log"
  if lake env lean "10_WORKING/lean/$f" 2>&1 | tee -a "40_RUN_LOGS/${f%.lean}.log"; then
    echo PASS > "50_RECEIPTS/${f%.lean}.verdict"
  else
    echo FAIL > "50_RECEIPTS/${f%.lean}.verdict"
    status=1
  fi
done
exit $status
