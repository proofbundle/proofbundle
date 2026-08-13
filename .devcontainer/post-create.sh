#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "==> ProofBundle Codespaces post-create setup"
echo "    Node: $(node --version)"
echo "    npm:  $(npm --version)"
echo "    coqc: $(coqc --version | head -n 1)"
echo "    lean: $(lean --version)"

bash tools/install-toolchains.sh
