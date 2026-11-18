#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$root/scripts/preflight.py"
if ! command -v lean >/dev/null 2>&1; then
  echo 'lean executable not found; run scripts/install-lean.sh first' >&2
  exit 127
fi
exec "$root/scripts/compile-composites.sh"
