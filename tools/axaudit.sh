#!/usr/bin/env bash
# Print Assumptions sweep over a Coq corpus.
#
# Reconstruction of the corrected sweep. The original shipped with three defects
# that silently corrupted its own results, all fixed here:
#
#   1. Output was piped through `head -n 40`. Seven files hit that cap exactly,
#      so their statement counts were wrong and any axiom line past line 40 was
#      invisible. There is no cap now.
#   2. The file list was hardcoded and omitted f019, which compiles. The list is
#      discovered from disk.
#   3. A UTF-8 BOM or CRLF line endings on a source file make coqc fail with an
#      undefined-token error at line 1 that reads like corruption. Both are
#      detected and reported rather than being left to look like proof damage.
#
# Emits one record per file. Parse with the counter at the end of this file.
#
# Usage:  tools/axaudit.sh [corpus-dir] [out-file]

set -uo pipefail

CORPUS="${1:-.}"
OUT="${2:-axresult.txt}"
TIMEOUT="${AXAUDIT_TIMEOUT:-120}"

command -v coqc >/dev/null || { echo "coqc not found in PATH" >&2; exit 127; }

cd "$CORPUS" || exit 1
: > "$OUT"

shopt -s nullglob
files=(*.v)
(( ${#files[@]} )) || { echo "no .v files in $CORPUS" >&2; exit 1; }

for f in "${files[@]}"; do
  case "$f" in aud_*.v) continue ;; esac   # skip our own generated probes

  {
    echo "===== $f ====="

    # Encoding checks first: these masquerade as syntax corruption.
    if [ "$(head -c 3 "$f" | od -An -tx1 | tr -d ' \n')" = "efbbbf" ]; then
      echo "ENCODING: BOM"
    elif grep -q $'\r' "$f"; then
      echo "ENCODING: CRLF"
    else
      echo "ENCODING: clean"
    fi

    # Every named statement the file declares, in declaration order.
    mapfile -t names < <(
      grep -oiE '^[[:space:]]*(Theorem|Lemma|Corollary|Example|Fact|Property|Remark|Proposition)[[:space:]]+[A-Za-z0-9_'"'"']+' "$f" \
        | sed -E 's/^[[:space:]]*[A-Za-z]+[[:space:]]+//'
    )
    echo "DECLARED: ${#names[@]}"

    if (( ${#names[@]} == 0 )); then
      echo "AUDRC: 0"
      echo "===== END $f ====="
      continue
    fi

    probe="aud_$(basename "$f" .v).v"
    cp "$f" "$probe"
    printf '\n' >> "$probe"
    for nm in "${names[@]}"; do
      printf 'Print Assumptions %s.\n' "$nm" >> "$probe"
    done

    out=$(timeout "$TIMEOUT" coqc -q "$probe" 2>&1); rc=$?
    echo "AUDRC: $rc"
    [ "$rc" -eq 124 ] && echo "NOTE: timed out after ${TIMEOUT}s"

    # Full output, uncapped. Warnings dropped; everything else kept, because an
    # axiom line arriving late is exactly what the cap used to hide.
    printf '%s\n' "$out" \
      | grep -vE '^Warning:|\[deprecated|\[local-declaration' \
      | grep -vE '^[[:space:]]*$'

    rm -f "$probe" "aud_$(basename "$f" .v).vo" \
          "aud_$(basename "$f" .v).glob" ".aud_$(basename "$f" .v).aux"

    echo "===== END $f ====="
  } >> "$OUT" 2>&1
done

echo "AUDDONE" >> "$OUT"

# ---- summary -----------------------------------------------------------------
# Counts every "Closed under the global context" against every axiom-bearing
# report, and flags files whose own audit compile failed — those contribute no
# trustworthy data and must not be counted as clean.
awk '
  /^===== END /            { infile=0 }
  /^===== [^E]/            { file=$2; infile=1; declared[file]=0; rc[file]=0 }
  infile && /^DECLARED: /  { declared[file]=$2 }
  infile && /^AUDRC: /     { rc[file]=$2 }
  infile && /^ENCODING: /  { if ($2 != "clean") enc[file]=$2 }
  infile && /Closed under the global context/ { closed[file]++; C++ }
  infile && /^(Axioms|Parameters):/           { dep[file]++;    D++ }
  END {
    printf "\n%-16s %8s %8s %8s %6s %s\n","file","declared","closed","axiomdep","rc","note"
    for (f in declared)
      printf "%-16s %8d %8d %8d %6d %s\n", f, declared[f], closed[f], dep[f], rc[f], \
             (rc[f]!=0 ? "AUDIT FAILED - data unusable" : (f in enc ? enc[f] : ""))
    printf "\ntotal closed: %d\ntotal axiom-dependent: %d\ntotal: %d\n", C, D, C+D
  }
' "$OUT" | sort -k1,1
