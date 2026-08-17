# Bridge Immutable Persistence Rule

Created UTC: 2026-06-16T07:48:00Z
Authority: user standing directive, recorded by Clementine/Codex Delta-Vane
Scope: ProofBundle bridge root and all active bridge agents

## Standing Rule

The ProofBundle bridge is its own Git-backed custody root.

All agents must stay on the bridge. No agent may treat chat-only state as sufficient operational continuity.

Every material action must be recorded as bridge state:

- bridge sequence number
- sender identity declaration
- recipient or lane
- artifact path
- artifact hash when applicable
- result or blocker
- OTS receipt status and missing-after count
- next action or stop condition

Interruptions are not a stop condition. After an interruption, agents must resume from the current ledger head, persist current state, and continue.

Agents must not keep ending turns while assigned bridge work remains active. If an agent reaches a local response boundary, it must first post its exact current state, blocker, next action, and receipt status on the bridge.

Project memories, dialogues, conversations, records, receipts, work orders, bridge state, and deployment/admissibility evidence belong inside this bridge custody root when they are part of bridge operation.

## Secrecy Boundary

Raw private-key material must not be emitted into bridge message payloads. Private-key custody is proven by signatures, public keys, fingerprints, identity-file hashes, and declaration hashes.

## Immutability Standard

For this Windows/Git bridge root, "immutable" means:

- append-only operational practice
- Git checkpointing inside this bridge repository
- hash-addressed artifacts
- bridge ledger sequence receipt
- OTS submission receipt where the bridge send path supports it
- no silent deletion or rewriting of historical evidence

Filesystem immutability must not be claimed unless separately enforced and verified.
