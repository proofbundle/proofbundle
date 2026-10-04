# Corpus state

Current state of the proof corpus and the crypto core, with how each number is known:

- **[verified here]** — recomputed in this repository from a tracked artifact.
- **[relayed]** — taken from an audit artifact, not independently re-run.

---

## 0. Numbers

| claim | value | basis |
|---|---|---|
| Coq corpus files (`corpus/coq/`) | **68** | [verified here] |
| …that compile | **33 of 68** | [verified here, coqc 8.18.0, 2026-10-04] |
| Statements across the compiling files | **467** | [verified here] |
| …closed under the global context | **406** | [verified here] |
| …axiom-dependent | **61** | [verified here] |
| Motion-operator algebra (§3) | **41 of 41, 0 axioms** | [verified here] |
| GPX Coq theorems kernel-closed (§4) | **83 of 83** | [verified here] |
| Independent `Print Assumptions` logs (`docs/logs/`) | **141** across 6 modules, all closed | [verified here] |
| Crypto core tests (`npm run test:crypto`) | **338 pass / 0 fail** | [verified here, 2026-10-03] |

---

## 1. Crypto core

From-scratch implementations, no crypto library imported, are in [`crypto/`](../crypto/):
SHA-256, SHA-512/384, SHA-3/SHAKE, cSHAKE/KMAC, BLAKE2, BLAKE3, HMAC, HKDF, PBKDF2,
Ed25519, ECDSA P-256/P-384, ML-DSA, ML-KEM. Each has a test file that checks it
against an independent implementation.

The shipped engine (`proofbundle.html`) uses the from-scratch SHA-3 (`PBKECCAK`) and
SHA-256 Merkle code. Its Ed25519, ECDSA, RSA-PSS and SHA-2 digest paths still go
through WebCrypto, and ML-DSA, SLH-DSA and Falcon through the bundled noble code.

---

## 2. Coq corpus

`corpus/coq/` holds 68 Coq sources in `<status>/<framework>/<principal_theorem>.v`.
Totals by directory:

| Directory | Files | Statements | Closed | Axiom-dependent |
|---|---:|---:|---:|---:|
| `01_proved` | 17 | 341 | 341 | 0 |
| `02_axiom_dependent` | 16 | 126 | 65 | 61 |
| `04_uncompiled` | 35 | 0 | 0 | 0 |
| **total** | **68** | **467** | **406** | **61** |

**[verified here]** On 2026-10-04 every file was compiled with coqc 8.18.0: every
file under `01_proved` and `02_axiom_dependent` compiles and every file under
`04_uncompiled` fails. `corpus/coq/INDEX.tsv` gives per-file counts;
`corpus/coq/MANIFEST.json` gives SHA-256, SHA-512 and BLAKE3 for every file.

---

## 3. Motion-operator algebra

The three operator-algebra files compile, and all 41 statements close with zero
axioms. **[verified here]**

    corpus/coq/01_proved/operator_algebra/
      demo20_gress_attested.v      12/12 closed, 0 axioms
      gress_is_core_candidate.v    14/14 closed, 0 axioms
      gress_core_eligible_demo.v   15/15 closed, 0 axioms

Content: 46 core operator IDs, 20 demo IDs, a 1,232-entry ledger, the tier system with
support/clarity/drift thresholds, collision pairs, an idempotent projection, and
attestation for gress · scend · mit · morph. The 2026-07-28 repair is described in
`corpus/coq/REPAIR_LOG.md`; no statement was weakened to make it compile.

One data question is recorded in both directions: `demo20_morph_attested` originally
claimed `attested_count_o8 R020 = 6`, and the shipped ledger yields **7**. Both are
machine-checked:

    Example demo20_morph_attested_ORIGINAL_IS_FALSE : attested_count_o8 R020 <> 6.
    Example demo20_morph_attested : attested_count_o8 R020 = 7.

---

## 4. GPX bundle — 83 of 83

**[verified here]** The Coq sources and kernel logs are in [`coq/`](../coq/).

    GPXBoundary.coq.log     42 closed
    GPXTemporal.coq.log     23 closed
    GPXDiachronic.coq.log   18 closed
    ────────────────────────────────
                            83 statements, 83 closed

Each log contains only `Closed under the global context` lines. The sources contain
no `Admitted`. CI recompiles them and checks these counts on every push.

---

## 5. Release mechanics

**[relayed]** `release.yml` signs with Sigstore keyless: identity comes from GitHub's
OIDC token inside the Actions runner and the signature is recorded in Rekor. Tagging a
release runs the self-test, builds artifacts, writes `SHA256SUMS`/`SHA512SUMS`, signs
every file, attaches SLSA build provenance, and publishes. No key material is needed.

---

## 6. Layout

    crypto/                 from-scratch primitives + tests
    corpus/coq/             68 Coq sources, INDEX.tsv, MANIFEST.json, REPAIR_LOG.md
    coq/                    GPX sources + kernel logs, 83/83
    docs/CORPUS-STATE.md    this file
    docs/logs/              independent Print Assumptions logs (141 statements, all closed)
