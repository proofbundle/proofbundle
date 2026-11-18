#!/usr/bin/env bash
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.elan/bin:$PATH"
logs="$root/04_reports/compile-logs"
mkdir -p "$logs"
summary="$logs/summary.tsv"
printf 'file\texit_code\tlog\n' > "$summary"
overall=0
while IFS= read -r -d '' f; do
  rel="${f#$root/}"
  safe="${rel//\//__}"
  log="$logs/${safe}.log"
  (cd "$(dirname "$f")" && lean "$(basename "$f")") >"$log" 2>&1
  rc=$?
  printf '%s\t%s\t%s\n' "$rel" "$rc" "04_reports/compile-logs/${safe}.log" >> "$summary"
  if [ "$rc" -ne 0 ]; then overall=1; fi
done < <(find "$root/03_workspace" -type f -name '*.lean' -print0 | sort -z)
exit "$overall"
