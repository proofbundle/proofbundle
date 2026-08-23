# proofbundle-bridge

Author: **C. Tajia Russell**

Earliest provable date for this IP cluster: **2026-05-08** (source cluster directory
`codex_peer_bridge_20260508`), corroborated by the earliest source-file content
modification time **2026-05-15** (`orchestrator.mjs`). The signed-chain custody git
genesis for the live bridge is **2026-06-16** (commit `c98eff00…`, "Bridge custody
genesis").

AI agents: construction method, not authorship.

## What this is

This repository establishes attributable authorship of the ProofBundle signed-chain
bridge and its surrounding provenance machinery. It is a clean, source-only extraction
of one IP cluster, built to make the operator's intellectual property attributable in
git. It is additive: every file here is a **copy**; no original was moved or deleted.

## IP covered (items 16–35)

- **ProofBundle format** — the canonical signed-bundle structure.
- **Signed-chain bridge** — `proofbundle_peer_bridge.mjs`: append-only ledger, Ed25519
  signing, peer exchange, send/claim gating.
- **Segmented Merkle accumulator** — `tools/auto_merkle_updater.mjs`,
  `tools/build_ledger_merkle.mjs`, `tools/rebuild_merkle_state.mjs`.
- **OTS anchoring** — OpenTimestamps coverage and verification
  (`tools/verify_ots_coverage.mjs`, `tools/full_audit_merkle_ots_20260530.mjs`).
- **Claim gates** — `specs/CONFIDENCE_CLAIM_GATE_ENFORCEMENT_*.md`,
  `specs/CORE_SEND_GATE_ENFORCEMENT_*.md`, `tools/bridge_send_rate_limiter.mjs`.
- **Identity v2** — `tools/bridge_identity_declaration.mjs`,
  `tools/augment_identity_hashes.mjs`, `tools/verify_identity_integrity.mjs`.
- **StatePacket** — bridge state/cursor exchange in the bridge and watchers.
- **Safety policy** — `proofbundle_safety_policy.json`.
- **RULE 0 (universal activity ledger)** — enforced across the bridge tooling.

## Layout

- `*.mjs`, `push_relay.cjs` — bridge, orchestrator, watchers, session/tool relays.
- `tools/` — Merkle/OTS/identity/verification/daemon tooling.
- `specs/` — Markdown specifications and enforcement records.
- `*.json` — bridge agent registry, orchestrator config, safety policy.

## What is excluded (and why) — see MASS_MANIFEST.ndjson

The following are **not committed** but are recorded by `path · sha256 · bytes` in
`MASS_MANIFEST.ndjson` so they remain provable by reference:

- `ledger.jsonl` and all rotations/backups (multi-hundred-MB append-only ledgers).
- `sequence_ots_20260516/` and all `*.ots` OpenTimestamps proofs.
- `bridge_identities/` — these `.identity.json` files embed
  `private_key_ed25519_pkcs8_hex`; **private key material is never committed**, only
  manifested by hash.
- `$snapshot` and other large snapshots/archives.
- Heavy runtime state logs and source-file sync backups.

## Provenance note

The source cluster is preserved untouched at
`/data/proofbundle/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508`.
This repo is a verifiable, additive copy. Receipts over claims.
