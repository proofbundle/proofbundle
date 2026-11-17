# Agent custody protocol — the verifier as custody layer

Operator's design, 2026-11-17, written down so parallel lanes implement one thing and not several.
Feel: a lightweight JavaScript client that runs in any browser (RuneScape), rooms where agents talk
(xat), an external time reference anyone can check (Bitcoin through OpenTimestamps), and agents.

Nothing here is new where something already exists. Each clause names the file that already does the
work, or marks the gap. **Do not rebuild a part that is listed as existing.**

## 1. The flow

    agent (own key)
      -> encrypted, signed payload
        -> verifier (proofbundle.org in-page, or local, or offline)
             verifies: registrar key for that agent_id, envelope signature, then decrypts
             assigns: SHA-256 + SHA3-384 + BLAKE3 (and any named signature algorithm)
             routes:  -> custody log (append-only, hash-chained)   or   -> another agent
             submits: provenance head -> its own API -> external time reference
             binds:   the SI-second kernel witness as the time formalization

## 2. Identity and registrar

- Agent identity: Ed25519. `agent/identity.mjs` — `load_or_create_identity(agent_id, {agent_root})`,
  `fingerprint(public_key_der)`, `sign`, `verify`. In the browser the equivalent is the client's own
  `sig_keygen` / `sig_sign` / `sig_verify` (live on proofbundle.org today, verified 2026-11-17).
- Registrar: append-only, hash-chained key registry with register / rotate / revoke; duplicate or
  reused keys refused. Implementation reused unchanged from OUTGPG registrar-core; routes in
  `agent/registry-verify.mjs`: `GET /api/registry`, `POST /api/verify/signature`, `POST /api/verify/chain`.
  Per entry it checks the SHA-256 link, SHA3-384 and BLAKE3 of the link digest, a PB-REGISTRAR-SIG-1
  Ed25519 signature by the identity's **current** key (revoked or superseded gives KEY_NOT_CURRENT),
  a wrapper-key substitution check, and optionally an OTS receipt (reports pending vs Bitcoin; it does
  **not** check a Bitcoin block header).
- **Gap R1:** the registrar is not served from proofbundle.org. The site is static (GitHub Pages), so
  the registry must be published as a signed static file the in-page client verifies itself, with the
  chain check running in the page. No backend is to be assumed.
- **Gap R2:** `pb_local_identity` / `PBLocalIdentity` is **absent from the published client**
  (checked in-page 2026-11-17 on c1d85fd6). Without it every browser agent mints a throwaway key that
  matches no custody chain. The module exists in the home build 2047b90c. This is the first change to land.

## 3. Payload: encrypted and signed

- `agent/envelope.mjs` already implements it. `KX_ALG = 'x25519-hkdf-sha256-chacha20poly1305-v1'`;
  `seal({...})`, `verify_envelope(envelope)`, `envelope_hash(envelope)`,
  `encrypt_payload(plaintext, recipient_enc_pub_key_hex)`, `decrypt_payload(payload_field, recipient_enc_priv_key_der)`.
- Order on receipt, and it is not negotiable: registrar lookup of the sender key for that agent_id,
  then envelope signature, then decrypt. A payload is never decrypted before the key is anchored.
- **Gap P1:** `envelope.mjs` digests with SHA-256 only and uses `node:crypto`. The protocol requires the
  triple digest (§4) and the from-scratch implementations (§5), and it must run in the page, not only in node.

## 4. What the verifier assigns to every custody record

Three digests over the canonical bytes, always, not one chosen among them:

| digest | from-scratch module | external ground truth, measured 2026-11-17 |
|---|---|---|
| SHA-256 | client native block | 314 cases vs OpenSSL, 0 disagreements |
| SHA3-384 | client native block | 314 cases vs OpenSSL, 0 disagreements |
| BLAKE3 | client native block | 70 cases vs the BLAKE3 team's `test_vectors.json`, 0 disagreements |
| Ed25519 (signature) | client native block | Wycheproof, 0 disagreements |

Whole-run figure: 67 files, 13,983 cases, **0 client disagreements, 0 OpenSSL disagreements**
(`conformance/ground-truth/results/2026-11-17/`, client c1d85fd6, native block 63229d593429da56).
Any further algorithm a payload names must arrive with the same evidence before the verifier will use
it: a from-scratch implementation, published vectors, and a passing specification.

Chain record, per entry: `seq`, `ts`, `action`, `ref`, `prev`, the three digests, the signing agent's
fingerprint, and the envelope hash. Compare the in-page `chain_append` (client line ~11043), which
today records only `prev` and a single SHA-256 and carries **no per-entry signature**:
**Gap C1 — the in-page custody chain must sign each entry and carry all three digests.**

## 5. Routing

The verifier decides, after verification, between two destinations, and records which it chose:

- **custody** — append to the hash-chained log. Single writer: `agent/local-verifier.mjs` (file drops in
  `~/.proofbundle/bridge/local-intents`, abstract singleton socket, lineage at ~40,595 records). In the
  browser the writer is the in-page custody database (16 stores: claims, predictions, store, chain,
  agent_receipts, bridge_actions, bridge_observations, rlm_captures, origins, supplements,
  catalogue_sources, algorithm_sources, vector_sets, conformance_runs, implementation_runs, outcome_runs).
- **forward** — hand the payload to another agent, re-encrypted to that agent's registrar key. The
  sequencing that keeps agents from colliding is the single-writer property plus
  `agent/sequence-index.mjs`; handshake record kinds already exist on the lane bus.
- **Gap F1:** routing is not implemented as a decision with a recorded reason. `agent/decision.mjs` is
  the place for it.

## 6. External time reference, through its own API

- `agent/ots.mjs` and `agent/ots-event-worker.mjs` submit to OpenTimestamps calendars;
  `pb-ots-blockwatch` upgrades pending proofs every sixth block. A receipt is **pending** until a
  Bitcoin block attests it, and the verifier reports it that way and never as confirmed.
- **Gap T1:** submission must be the verifier's own API endpoint over the chain head, so a caller gets
  back the receipt and its state, rather than a side worker stamping files.

## 7. The time formalization (already built — do not re-derive)

`2026-09-15_SI_SECOND_WITNESS_BUNDLE/`: `lean/…_SI_SECOND_KERNEL.lean` with `…_WITNESS`, `…_LEDGER`,
`…_AUDIT`; a Coq checker `coq/SI_SECOND_CHECKER_2026_09_15.v` **compiled** (`.vo`); `data/witness.json`,
`data/witness.pb.json`, and `data/witness_tampered_root.pb.json` as the negative case. The repo already
carries that Coq run under `archive/2026-09-28_crypto_identity_temporal/build-verification/si_second_coq_run/`.
The caesium-133 hyperfine definition of the second is the kernel's subject.

**Gap S1:** the witness is not bound into custody records. Each record's time assertion should cite the
witness digest, so "when" rests on the formalization and the OTS receipt rather than on a host clock.

## 8. Work breakdown — one lane per item, no overlap

| id | item | depends on |
|---|---|---|
| W1 | land `pb_local_identity` in the published client (Gap R2) | — |
| W2 | triple-digest + per-entry signature in the in-page custody chain (Gap C1) | — |
| W3 | port `envelope.mjs` to the page, on the from-scratch primitives (Gap P1) | W1 |
| W4 | routing decision with recorded reason in `agent/decision.mjs` (Gap F1) | W3 |
| W5 | verifier API endpoint for time-reference submission over the chain head (Gap T1) | W2 |
| W6 | publish the signed registry as a static file; in-page chain verification (Gap R1) | W1 |
| W7 | bind the SI-second witness digest into custody records (Gap S1) | W2 |
| W8 | rename the Rust-build name to ProofBundle across the client, migrating the signing domain and the stored database rather than replacing the strings | — |
| W9 | the 32-crate workspace (`genophylaxis/crates`, 8 copies on LINUX_BOOT) as the provenance spine for AI/ML artifacts | W2 |

Rules every lane follows: `/home/falsealias/pb/work/2026-11-17_lane-dispatch_claude-opus-5-5/RULES.md`.
Self-written tests are not ground truth. Nothing is deleted. Every output is hashed, chained and stamped.
