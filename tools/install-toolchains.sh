#!/usr/bin/env bash
# Install the exact toolchains ProofBundle expects:
#   - Node dependencies (npm ci)
#   - Coq 8.18.0 (via opam)
#   - Lean 4 v4.11.0 (via elan)
#
# This script is idempotent and safe to re-run. It is used both locally
# ("install everything you need here") and from the GitHub Codespaces
# post-create hook.

set -e

cd "$(dirname "$0")/.."

echo "==> ProofBundle toolchain installer"
echo "    node: $(node --version 2>/dev/null || echo 'not found')"
echo "    npm:  $(npm --version 2>/dev/null || echo 'not found')"

# ---------------------------------------------------------------------------
# npm dependencies
# ---------------------------------------------------------------------------
echo ""
echo "==> Installing npm dependencies..."
npm ci

# ---------------------------------------------------------------------------
# Coq 8.18.0 via opam
# ---------------------------------------------------------------------------
echo ""
if command -v coqc >/dev/null 2>&1 && coqc --version 2>/dev/null | grep -q '8\.18'; then
  echo "==> Coq 8.18 already available:"
  coqc --version | head -n 1
else
  if ! command -v opam >/dev/null 2>&1; then
    echo "ERROR: opam is required to install Coq. Install opam first:"
    echo "  https://opam.ocaml.org/doc/Install.html"
    exit 1
  fi

  if [ ! -d "$HOME/.opam" ]; then
    echo "==> Initialising opam..."
    opam init --disable-sandboxing --bare -y
  fi

  echo "==> Creating opam switch 4.14.2 (if absent)..."
  opam switch list --short 2>/dev/null | grep -qx '4\.14\.2' || opam switch create 4.14.2 --yes

  echo "==> Installing Coq 8.18.0..."
  eval $(opam env --switch=4.14.2)
  opam install coq.8.18.0 -y

  echo "==> Coq installed:"
  coqc --version | head -n 1
fi

# ---------------------------------------------------------------------------
# Lean 4 v4.11.0 via elan
# ---------------------------------------------------------------------------
echo ""
if command -v lean >/dev/null 2>&1 && lean --version 2>/dev/null | grep -q '4\.11\.0'; then
  echo "==> Lean 4.11.0 already available:"
  lean --version
else
  if ! command -v elan >/dev/null 2>&1; then
    echo "==> Installing elan (Lean version manager)..."
    curl -fsSL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -o /tmp/elan-init.sh
    chmod +x /tmp/elan-init.sh
    /tmp/elan-init.sh -y --default-toolchain leanprover/lean4:v4.11.0
    rm -f /tmp/elan-init.sh
  else
    echo "==> Installing Lean 4.11.0 via elan..."
    elan toolchain install leanprover/lean4:v4.11.0
    elan default leanprover/lean4:v4.11.0
  fi

  echo "==> Lean installed:"
  lean --version
fi

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------
echo ""
echo "==> Toolchain summary"
echo "    node: $(node --version)"
echo "    npm:  $(npm --version)"
echo "    coqc: $(coqc --version | head -n 1)"
echo "    lean: $(lean --version)"
echo ""
echo "==> Ready. Run:"
echo "      npm run test:surface"
echo "      npm run test:crypto"
echo "      node cli/proofbundle-cli.mjs selftest"
echo "      cd coq && make check"
echo "      cd lean && lake build"
