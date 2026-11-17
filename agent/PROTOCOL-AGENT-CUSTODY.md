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

## 9. The rest of the system (operator, 2026-11-17) — items W10 onward

Same rule: each clause names what exists. A lane takes one item.

| id | item | what already exists |
|---|---|---|
| W10 | every artifact persisted to Google Drive as well as locally | rclone mount `~/mnt/gdrive` (5.0 TB, 4.5 TB free) and the transfer protocol tool `ops-logs/2026-11-15_…_pb-transfer_plan-copy-verify.py`: plan manifest before any byte moves, per-file SHA-256 / SHA-384 / SHA3-384 / BLAKE3, three iterated chains, RFC 6962 Merkle root, OTS on manifest and result, then destination re-read. A local copy finishing is not an upload finishing: confirm with `rclone check` or `rclone hashsum`. |
| W11 | a connector over Claude exposing the RLM SQLite as memory, and RLM memory in the client | the client already carries an `rlm_captures` custody store; corpora: the Clementine origin-pass SQLite (2,616 items) and `memory_v100`; `everything_rlm_20260629.sqlite3` (22k rows, `memory_fts`); the transcript ledger `agent-memory/ingest/all.sqlite` (331k events, `events_fts`) and `pb/bin/pb-memory-recall` over it. The connector is MCP. |
| W12 | secret storage for agents | `agent/identity.mjs` holds keys per agent root; key material is operator-only and is never read, printed or copied by any lane. Storage means an encrypted store the agent unlocks, not a lane reading keys. |
| W13 | multi-tab fabric | built 2026-11-17: dependency-free CDP driver (`pb/work/2026-11-17_venice-browser-lane_claude-opus-5-5/cdp.mjs`) over Chrome's debugging port; profile `/mnt/pb-work/venice-profiles/p00` signed in (PRO), chat input `textarea[aria-label="Chat message input"]`. Scales by tabs per profile, more profiles, and a second host. |
| W14 | cryptographic registry development continued | `ALGORITHM_REGISTRY.json` (566 distinct ids, 545 marked NOT_IMPLEMENTED), 95 registry ids on main, client registers 15 digests × 12 signatures. `crypto/` already holds X25519, X448, Ed448, SLH-DSA, scrypt, AES-GCM-SIV, key wrap, XChaCha20-Poly1305 and hybrids that the registry still marks NOT_IMPLEMENTED — reconcile before adding. 627 KAT vector sets exist, 560 with no matching registry id. |
| W15 | EU AI Act articles 10, 11, 12 and the rest, mathematically expanded | Article 12 and Annex IV need sealed versioned documents and hash-chained signed event logs with event classes, system version, actor and retention; Article 10 needs data-governance records against (2)(a)–(h) and paragraphs 3, 4, 6; Article 11 the technical documentation. Article 50(2) is the first family to complete because of the 2 December 2026 date: a carrier that puts or references the mark in the output, content→manifest lookup, refusal to sign with placeholder provider or system names, and a registered provider key. Expansion means each obligation stated as a predicate over a bundle, decidable by the verifier, with its falsifier. |
| W16 | all conformance vectors | the May 2026 corpus (300) passes on the independent reference; the client's generated definition is 17,822 cases and is a regression gate, not ground truth; external sets: Wycheproof 13,983 cases over 67 files with 0 disagreements, NIST ACVP ML-KEM/ML-DSA 855, NIST CAVP 2,146, BLAKE3 70, RFC 6979. Vectors must be generated for every Act predicate of W15 too. |
| W17 | adversarial testing of everything: each model the most hostile critic of the others | the mutation harness over `verify_bundle` (361 sites, 319 detected, 42 not detected) is the pattern; extend it to the signature and digest paths and to every module. A lane does not grade its own work: each model attacks another's output from an angle that model did not use, and every attack is recorded whether or not it succeeds. |
| W18 | break each part down from orthogonal angles, derive the invariant structures, rebuild upward with motion opcodes governing admissible transformation types | the motion-bytecode layer exists in the Clementine RLM line, and in the version reached it **does not discriminate** (0.0001; intra 0.9916 against cross 0.9917). Cause already located: in `_build_motion_program`, `_ref_<word>` lines are emitted for every sentence unconditionally, and the hedge path `pass` fires only when nothing else was added. The v040 UTG bytecode branch (`7bd9fccb…`) was never merged. W18 begins by fixing that defect and measuring discrimination again, then defines the opcode set as the admissible transformations over custody records — each opcode a typed transformation with preconditions, an invariant it preserves, and a falsifier. |

An invariant is only admissible here when something that would refute it has been run and did not.
