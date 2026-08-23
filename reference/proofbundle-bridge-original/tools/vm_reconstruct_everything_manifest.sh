#!/usr/bin/env bash
set -euo pipefail

OUT_ROOT="${1:-/data/proofbundle/reconstruction/everything_from_may_20260617}"
SINCE="${SINCE:-2026-05-01}"
mkdir -p "$OUT_ROOT/chunks" "$OUT_ROOT/receipts"

STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HOST="$(hostname)"
INVENTORY="$OUT_ROOT/source_inventory.tsv"
COUNTS="$OUT_ROOT/counts.json"
LATEST="$OUT_ROOT/latest.txt"
ROOT_STATUS="$OUT_ROOT/root_status.tsv"
COVERAGE_GAPS="$OUT_ROOT/coverage_gaps.tsv"
MATCH_PATTERNS="$OUT_ROOT/match_patterns.txt"
LOG="$OUT_ROOT/receipts/reconstruct_everything_$(date -u +%Y%m%dT%H%M%SZ).log"

SOURCE_ROOTS=(
  "/data/proofbundle/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508"
  "/data/proofbundle/AGENT_COORDINATION/proofbundles"
  "/data/proofbundle"
  "/home/proofbundle/.codex"
  "/home/proofbundle/.claude"
  "/home/proofbundle/.grok"
  "/home/proofbundle/.config/Claude"
  "/home/proofbundle/.config/claude"
  "/home/proofbundle/.local/share/Claude"
  "/home/proofbundle/.local/share/claude"
  "/data/proofbundle/incoming_codex_artifacts"
  "/data/proofbundle/VM_HOME_CLAUDE/latest"
)

LOG_NAME_EXPR=(
  -iname '*.jsonl' -o -iname '*.ndjson' -o -iname '*.json' -o
  -iname '*.log' -o -iname '*.md' -o -iname '*.txt' -o
  -iname '*.sqlite' -o -iname '*.sqlite3' -o -iname '*.db' -o -iname '*.db3' -o
  -iname '*.csv' -o -iname '*.tsv' -o -iname '*.yaml' -o -iname '*.yml' -o
  -iname '*.html' -o -iname '*.htm' -o
  -iname '*ledger*' -o -iname '*dialogue*' -o -iname '*message*' -o
  -iname '*conversation*' -o -iname '*transcript*' -o -iname '*toolcall*' -o
  -iname '*tool_call*' -o -iname '*session*' -o -iname '*outbox*' -o -iname '*inbox*' -o
  -iname '*receipt*' -o -iname '*ots*' -o -iname '*bridge*' -o
  -ipath '*/.codex/*' -o -ipath '*/.claude/*' -o -ipath '*/.grok/*' -o
  -ipath '*/Claude/*' -o -ipath '*/claude/*' -o -ipath '*/Grok/*' -o -ipath '*/grok/*'
)

printf '%s\n' "${LOG_NAME_EXPR[@]}" > "$MATCH_PATTERNS"

{
  printf 'schema\tProofBundleEverythingReconstructionInventory/v1.0.0\n' > "$INVENTORY.meta"
  printf 'started_at_utc\t%s\n' "$STARTED_AT" >> "$INVENTORY.meta"
  printf 'host\t%s\n' "$HOST" >> "$INVENTORY.meta"
  printf 'since\t%s\n' "$SINCE" >> "$INVENTORY.meta"
  printf 'source_policy\tVM-side hashes only; no bulk inventory pull to Windows\n' >> "$INVENTORY.meta"
  printf 'match_patterns\t%s\n' "$MATCH_PATTERNS" >> "$INVENTORY.meta"
  printf 'path\tmtime_utc\tsize\tsha256\tsource_root\tclass\n' > "$INVENTORY"
  printf 'source_root\tstatus\tfile_count_since\tbytes_since\n' > "$ROOT_STATUS"
  printf 'source_root\tgap\tchecked_at_utc\n' > "$COVERAGE_GAPS"

  declare -A SEEN_FILES=()
  for root in "${SOURCE_ROOTS[@]}"; do
    if [ ! -e "$root" ]; then
      printf '%s\tmissing\t0\t0\n' "$root" >> "$ROOT_STATUS"
      printf '%s\tmissing_source_root\t%s\n' "$root" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$COVERAGE_GAPS"
      continue
    fi
    root_count=0
    root_bytes=0
    while IFS= read -r -d '' file; do
      if [[ -n "${SEEN_FILES[$file]+x}" ]]; then
        continue
      fi
      SEEN_FILES["$file"]=1
      size="$(stat -c '%s' "$file" 2>/dev/null || echo 0)"
      mtime="$(date -u -d "@$(stat -c '%Y' "$file")" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo unknown)"
      sha="$(sha256sum "$file" 2>/dev/null | awk '{print toupper($1)}')"
      class="artifact"
      case "$file" in
        *ledger.jsonl|*dialogue_backlog.jsonl|*bridge_notifications*|*outbox*) class="bridge_message" ;;
        *.codex/*|*codex_session*|*session_to_bridge*|*toolcall*|*tool_call*) class="codex_session_or_toolcall" ;;
        *.claude/*|*Claude/*|*claude*|*Claude*) class="claude_conversation_or_toolcall" ;;
        *.grok/*|*grok*|*Grok*) class="grok_conversation_or_toolcall" ;;
        *run_receipts*|*receipt*|*ots*|*sequence_ots*) class="receipt_or_timestamp" ;;
        *.sqlite|*.sqlite3|*.db|*.db3) class="database" ;;
        *message*|*conversation*|*transcript*|*chat*) class="message_log" ;;
      esac
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$file" "$mtime" "$size" "$sha" "$root" "$class" >> "$INVENTORY"
      root_count=$((root_count + 1))
      root_bytes=$((root_bytes + size))
    done < <(find "$root" -xdev -type f \
      \( "${LOG_NAME_EXPR[@]}" \) \
      -newermt "$SINCE" -print0 2>/dev/null)
    printf '%s\tpresent\t%s\t%s\n' "$root" "$root_count" "$root_bytes" >> "$ROOT_STATUS"
    if [ "$root_count" -eq 0 ]; then
      printf '%s\tno_matching_files_since_cutoff\t%s\n' "$root" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$COVERAGE_GAPS"
    fi
  done

  split -l 5000 -d -a 5 "$INVENTORY" "$OUT_ROOT/chunks/source_inventory_"
  for chunk in "$OUT_ROOT"/chunks/source_inventory_*; do mv "$chunk" "$chunk.tsv"; done

  python3 - "$INVENTORY" "$COUNTS" "$ROOT_STATUS" "$COVERAGE_GAPS" <<'PY'
import collections, json, pathlib, sys
inventory = pathlib.Path(sys.argv[1])
counts_path = pathlib.Path(sys.argv[2])
root_status = pathlib.Path(sys.argv[3])
coverage_gaps = pathlib.Path(sys.argv[4])
by_class = collections.Counter()
by_root = collections.Counter()
total_size = 0
total = 0
with inventory.open("r", encoding="utf-8", errors="replace") as f:
    next(f, None)
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 6:
            continue
        total += 1
        try:
            total_size += int(parts[2])
        except Exception:
            pass
        by_root[parts[4]] += 1
        by_class[parts[5]] += 1
counts_path.write_text(json.dumps({
    "schema": "ProofBundleEverythingReconstructionCounts/v1.0.0",
    "total_files": total,
    "total_size_bytes": total_size,
    "by_class": by_class,
    "by_root": by_root,
    "root_status": root_status.as_posix(),
    "coverage_gaps": coverage_gaps.as_posix(),
}, indent=2, sort_keys=True) + "\n", encoding="utf-8")
PY

  {
    echo "ProofBundle everything reconstruction manifest"
    echo "started_at_utc=$STARTED_AT"
    echo "finished_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "host=$HOST"
    echo "out_root=$OUT_ROOT"
    echo "inventory=$INVENTORY"
    echo "counts=$COUNTS"
    echo "root_status=$ROOT_STATUS"
    echo "coverage_gaps=$COVERAGE_GAPS"
    echo "match_patterns=$MATCH_PATTERNS"
    sha256sum "$INVENTORY" "$COUNTS" "$ROOT_STATUS" "$COVERAGE_GAPS" "$MATCH_PATTERNS" | awk '{print toupper($1), $2}'
  } > "$LATEST"
} >> "$LOG" 2>&1

cat "$LATEST"
