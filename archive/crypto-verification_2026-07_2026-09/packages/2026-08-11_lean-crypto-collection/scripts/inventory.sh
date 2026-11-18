#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
printf 'Lean toolchain: '; cat "$root/lean-toolchain"
printf '\nLean files: '
find "$root" -type f -name '*.lean' | wc -l
printf 'ZIP source archives: '
find "$root/00_raw_uploads" -maxdepth 1 -type f -name '*.zip' | wc -l
printf 'All regular files: '
find "$root" -type f | wc -l
