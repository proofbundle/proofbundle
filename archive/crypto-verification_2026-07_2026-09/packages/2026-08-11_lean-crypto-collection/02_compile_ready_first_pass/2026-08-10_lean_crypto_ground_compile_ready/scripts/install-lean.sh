#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
toolchain="$(tr -d '[:space:]' < "$root/lean-toolchain")"
if ! command -v elan >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
    | sh -s -- -y --default-toolchain none
fi
export PATH="$HOME/.elan/bin:$PATH"
elan toolchain install "$toolchain"
elan override set "$toolchain" --path "$root"
lean --version
