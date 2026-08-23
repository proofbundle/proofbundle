#!/usr/bin/env bash
# Promote ledger.jsonl.incoming_* to canonical ledger after sha256 backup + verify.
set -euo pipefail

BRIDGE="${BRIDGE_PATH:-/data/proofbundle/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508}"
cd "$BRIDGE"

LEDGER="ledger.jsonl"
INCOMING="$(ls -1t ledger.jsonl.incoming_* 2>/dev/null | head -1 || true)"

if [[ -z "$INCOMING" ]]; then
  echo "no incoming ledger candidate; canonical unchanged"
  node proofbundle_peer_bridge.mjs verify
  exit 0
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="${LEDGER}.backup_${STAMP}"
cp -a "$LEDGER" "$BACKUP"
echo "backup=${BACKUP}"

IN_SHA="$(sha256sum "$INCOMING" | awk '{print toupper($1)}')"
CAN_SHA="$(sha256sum "$LEDGER" | awk '{print toupper($1)}')"
echo "incoming_sha256=${IN_SHA}"
echo "canonical_sha256_before=${CAN_SHA}"

# Incoming is full replacement snapshot when newer head verified locally
cp -a "$INCOMING" "${LEDGER}.promoted_${STAMP}"
mv "${LEDGER}.promoted_${STAMP}" "$LEDGER"

node proofbundle_peer_bridge.mjs verify
echo "promote_incoming_ledger complete stamp=${STAMP}"