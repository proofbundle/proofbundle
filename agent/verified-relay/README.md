# Verified agent relay

This layer reuses ProofBundle's existing identity, AIBOM and envelope modules. An agent signs and encrypts a request to the verifier. The verifier checks the registered identity, AIBOM digest and signature, ingress signature, decryption and signed routing. It creates an Ed25519 receipt and a new encrypted envelope for the recipient. Accepted encrypted requests, deliveries and receipts enter the existing append-only lane bus. Replay of the same request ID and bytes returns the same sequence; conflicting reuse is rejected.

Ed25519 signs. A separate X25519 encryption key is signed into the same agent/thread identity binding. Private keys stay in the local agent directory with mode 0600; HTTP responses contain public verification material and encrypted envelopes. Both X25519 + HKDF-SHA256 + ChaCha20-Poly1305 and native ML-KEM-768 + HKDF-SHA256 + ChaCha20-Poly1305 profiles have been exercised. The optional seal parameter is `profile=ml-kem-768-hkdf-sha256-chacha20poly1305-v1`; signing remains Ed25519, record digests SHA-256, and AIBOM digests SHA3-384. Each encryption public key has an Ed25519-signed identity binding. Other algorithms remain in the existing ProofBundle cryptographic registry; this layer does not imply that every registered algorithm has been exercised.

## Install and operate locally

Requires Node, Python, and the packages in requirements.txt. Install with `python3 agent/verified-relay/install.py`; source helpers go under `~/pb`, preserving existing state. Set `PB_REPO_ROOT` to this checkout when invoking identity tools. The installer creates relay and attestation unit files, but does not start provider models or replace a running API.

After checking the configuration:

```sh
systemctl --user daemon-reload
systemctl --user enable --now pb-verified-relay.service pb-bridge-attest.timer pb-bridge-attest-upgrade.timer
```

The tracker is a native PyQt5 desktop window: `pb-bridge-track-native`. Its `--tty` mode gives a live terminal view, and `--tty --once` or `--json` supplies snapshots. It reads the local ledger, public identity bindings, conversation-worker state, Qwen poll receipts, detached proof counts, and cumulative Merkle ranges directly from disk. Tracking has no HTTP/server dependency. Selected encrypted deliveries can be verified and opened locally.

The separately requested relay API binds to `127.0.0.1:8791`. Open `/proofbundle?tab=bridge` for the existing ProofBundle app or `/` for the rail panel. It is a local operator surface, not an Internet deployment or an isolation boundary between processes running as the same user.

CLI: `pb-rail register --agent ID --thread THREAD_UUID`, `pb-rail seal --file request.json`, `pb-rail submit --file envelope.json`, `pb-rail inbox --agent ID`, `pb-rail attestations`. Request files avoid putting payloads in command arguments.

API: `POST /api/agent/register`, `/api/envelope/seal`, `/api/envelope/verify`, `/api/envelope/submit`; `GET /api/inbox?agent_id=ID`, `/api/agents`, `/api/attestations`. `/api/send` is a convenience path that seals and submits through the same verifier.

## Background communication and capture

`conversation_worker.py --config CONFIG.json` reads the explicitly configured native JSONL sources without editing them. Source lines, including their original LF bytes, are encrypted in witness records with source offset and SHA-256. Witness signatures attest capture; they do not claim the operator cryptographically signed those messages. Actual operator messages are separately delivered to every currently registered communication identity. Newly registered recipients receive historical messages during catch-up.

Directed messages produce a sequence-only notice through the existing Codex app-server Unix WebSocket, using `turn/steer` for a live turn or `turn/start` for an idle conversation. Witness batches do not trigger notices. Native delegated prompts and generated bridge notices are preserved in the raw witness capture but excluded from operator broadcast to prevent loops.

Configure `witness_agent`, `socket_path`, and `sources` entries containing `agent_id`, `thread_id`, and `path`. Keep this runtime config local. The worker does not discover or export authentication tokens.

`qwen_inbox.py --agent ID --session-file LOCAL_SESSION_JSON` polls Qwen's encrypted inbox and notifies its existing authenticated native peer socket. `--open` verifies receipts and decrypts locally. Socket acceptance and actual model consumption are separate observations. The poller loads authentication locally without logging it. Under the operator's authorization, a verifier poller can use Qwen's supported `qwen sessions controllers add --label LABEL --json` interface; capture its output into a mode-0600 local `~/pb/live/qwen-inbox/controller.json`, never into a transcript, shell argument, or repository. The poller correlates authenticated native delivery receipts and distinguishes `held`, `delivered`, and model consumption. No peer-gate configuration is bypassed or silently changed.

## Sequence timestamps and Merkle roots

`pb-bridge-attest stamp` checks the lane-bus predecessor chain, writes each record's exact hash preimage to an immutable file, and submits a fresh detached OTS proof for each previously unstamped sequence. The preimage is canonical UTF-8 JSON with `hash` excluded and no newline; its SHA-256 equals the record's ledger hash. This is distinct from old proofs over serialized records including the hash field, which remain preserved.

Only after individual proofs pass local digest readback does the attester create an RFC6962 cumulative root over raw record hashes and timestamp the root artifact. No root record includes itself. This uses local Merkle batching for calendar submissions while retaining an individual `.ots` proof for every sequence. `check` validates the current snapshot; new appends may be pending until the next 30-second timer cycle. `upgrade` preserves submitted proof bytes before trying to obtain Bitcoin attestations.

An OTS calendar submission is not Bitcoin anchoring. The original ledger, exact preimages, submitted proofs, upgraded proofs and roots remain separate artifacts. Nothing here asserts formal identity inheritance or correctness of a computational claim merely because its message was signed.

## Validation

The live integration exercised encrypted ingress → verifier → encrypted delivery → recipient decryption, duplicate replay, forged sender rejection, wrong recipient rejection, reciprocal automatic conversation notices, source-byte witness readback, per-sequence OTS digest readback and cumulative Merkle recomputation. Browser provenance uses the existing `agent/web-browser.mjs` with this verifier.

No identities, private keys, IPC credentials, native transcripts, runtime configurations, ciphertext archives or OTS evidence are included in this source package.

## Source tests

Run `PB_REPO_ROOT=/path/to/checkout PB_AGENT_ROOT=/local/test-identities python3 -m unittest test_identity_gate` from this directory. Test keys remain outside the checkout; tests check both encryption profiles, ciphertext/KEM/nonce/salt tampering, forged sender and verifier receipts, wrong destination/verifier keys, and plaintext rejection. `loadOrCreateIdentity` accepts an optional key directory while preserving its existing default.
