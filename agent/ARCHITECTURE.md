# ProofBundle Agent Architecture

> Identity, lineage, attestation, Merkle-rooted, sequenced.
> Offline by default. Browser-grade. Potato-compatible.

## What this is

A sealed-message system for AI agents to communicate with cryptographic
identity, tamper-evident lineage, falsifiable predictions, and offline
timestamp attestation. Built on the same primitives as the ProofBundle
artifact verifier — Ed25519, ML-KEM, SHA-256/SHA-3, RFC 6962 domain
separation, OpenTimestamps.

Two layers, as the operator specified:

1. **Individual agent layer** — an agent seals its own work products
   (proofs, code, claims) into self-attested envelopes with Ed25519
   identity. This is the agent's individual custody chain.

2. **Multi-agent bridge layer** — the "arousal" layer. Agents send sealed
   envelopes to each other through a local broker. The broker verifies
   signatures, sequences messages into a Merkle-rooted append-only log,
   and routes responses. This is the thalamic-cortico loop: ingress →
   relay → sheet → broadcast → reenter.

## Primitives

| Primitive | Use | Source |
|---|---|---|
| Ed25519 | Agent identity + message signing | Node 24 native `crypto` |
| ML-KEM-768 | Payload encryption (who can read this) | Node 24 native `crypto` |
| XChaCha20-Poly1305 | AEAD over encrypted payloads | Node 24 native `crypto.chacha20poly1305` |
| SHA-256 / SHA3-256 | Canonical hashing | Node 24 native `crypto` / `src/digest/` |
| Merkle tree (RFC 6962) | Batch inclusion proofs | This module |
| OpenTimestamps | External attestation (backfillable) | OTS layer (optional, offline-deferred) |
## Envelope structure

```
SealedEnvelope {
  version: "PB-AGENT-1"
  seq: <integer, assigned by bridge>
  prev_hash: <hex, hash of previous envelope or "genesis">
  merkle_root: <hex, root of current batch or null>
  timestamp: <ISO 8601 UTC>
  from: {
    agent_id: <string>            // "glm-5.2", "kimi-k2.6"
    pubkey: <hex Ed25519 public key>
    key_fingerprint: <hex SHA-256 of pubkey, first 16 bytes>
  }
  payload_type: "work" | "prediction" | "verdict" | "handoff" | "attestation"
  payload: {
    encoding: "canonical-json"
    encrypted: <bool>
    ciphertext: <hex or null>
    encapsulated_key: <hex or null>
    plaintext_hash: <hex>         // SHA-256 of canonical plaintext (always)
    body: <object or null>        // plaintext body if not encrypted
  }
  prediction: <Prediction or null>
  signature: <hex Ed25519 over canonical envelope less signature>
}
## Lineage

Each envelope has `prev_hash` = SHA-256 of the previous envelope's
canonical encoding. The bridge maintains an append-only log. Every N
envelopes (or T seconds), it computes a Merkle root over the batch and
stamps with OTS (if internet available; otherwise defers, marks
`ots_status: "pending"`).

```
genesis → env1 → env2 → env3 → [merkle root A, OTS pending] → env4 → ...
```

## Falsifiable predictions

An agent emits a `prediction` envelope:

```
Prediction {
  predicate: <string>           // "lake build exits 0"
  commit_hash: <hex>           // SHA-256 of claim (sealed before outcome)
  valid_from: <ISO 8601>        // when prediction becomes testable
  valid_until: <ISO 8601>       // deadline; after this, absence = falsified
  outcome: <null | "confirmed" | "falsified" | "expired">
  outcome_sealed_at: <null | ISO 8601>
  outcome_envelope_seq: <null | integer>
}
## The bridge (arousal layer)

Local HTTP broker on `127.0.0.1`:

```
POST /seal        — submit plaintext payload, get sealed envelope
POST /verify      — verify sealed envelope signature + lineage
POST /route       — send sealed envelope to another agent by agent_id
GET  /lineage     — append-only log (with Merkle inclusion proofs)
GET  /identity/:id — agent public key + fingerprint
POST /register    — register agent identity (pubkey + name)
GET  /predict/:seq — prediction status by envelope seq
POST /resolve     — resolve a prediction (verifier only)
POST /stamp       — trigger OTS stamping of current Merkle root (if internet)
```

Does not need internet except for OTS stamping (backfillable). Everything
else is local, offline, on the potato.

## Agent identities

Each agent generates Ed25519 keypair on first run. Stored in
## Isomorphism to the thalamic-cortico loop

| Loop arrow | Bridge operation |
|---|---|
| ingress (world → relay) | agent submits payload to `/seal` |
| present (relay → sheet) | bridge writes envelope to lineage log |
| modulate (sheet → relay) | bridge returns sealed envelope + Merkle proof |
| drive (sheet → broadcast) | bridge routes envelope to destination agent |
| represent (broadcast → sheet) | destination agent's response sealed back |
| shellIn (shell on ingress) | signature verification on ingress |
| shellBack (shell on return) | signature verification on response |
| reenter ((committed × world) → sheet) | prediction resolution |

The `htmlPrefix` realization (ingress + present + shellIn + shellBack,
but no modulate/drive/represent/reenter) is the state where an agent can
submit and be verified but cannot route or respond — exactly the current
situation without the bridge.

## Not proprietary

MIT/Apache-2.0 dual-licensed. Primitives are standard (Ed25519 = RFC 8032,
ML-KEM = FIPS 203, Merkle = RFC 6962, OTS = OpenTimestamps). API layers,
CLIs, Rust bindings, Docker images to follow.
`~/.proofbundle/agent/<agent_id>/`:

```
~/.proofbundle/agent/
  glm-5.2/
    identity.json    — { agent_id, pubkey, key_fingerprint, created_at }
    secret.key       — Ed25519 private key (0600)
    lineage.jsonl    — this agent's individual custody chain
  kimi-k2.6/
    ...
```

Bridge holds a registry. Envelope from unregistered agent → `UNEXPECTED_SIGNER`.
```

The `commit_hash` is sealed **before** the outcome is known. A later
`verdict` envelope resolves it. If `valid_until` passes with no verdict,
the prediction auto-expires as falsified. This is the falsifiable prediction
ledger from the ProofBundle spec, applied to agent work.
```

### Signing scope

The signature covers everything **deterministic**: envelope metadata and
the **plaintext hash**. It does NOT cover ciphertext (non-deterministic
due to ML-KEM randomness). Signature is verifiable without decrypting.
Plaintext hash proves what was signed. Merkle root ties into lineage.
| Canonical JSON | Deterministic encoding | `src/canonical/canonical-json.mjs` |
