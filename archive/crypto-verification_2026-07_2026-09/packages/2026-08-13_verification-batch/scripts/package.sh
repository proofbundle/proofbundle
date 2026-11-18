#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/.."
name="$(basename "$ROOT")"
zip -qr "${name}.zip" "$name" -x "$name/.git/*"
sha256sum "${name}.zip" > "${name}.zip.sha256"
