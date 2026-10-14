# Corpus state

Current state of the proof corpus and the crypto core, with how each number is known:

- **[verified here]** — recomputed in this repository from a tracked artifact.
- **[relayed]** — taken from an audit artifact, not independently re-run.

---

## 0. Numbers

| claim | value | basis |
|---|---|---|
| Coq corpus files (`corpus/coq/`) | **26** | [verified here] |
| …that compile | **12 of 26** | [verified here, coqc 8.18.0, 2026-10-04] |
| Statements across the compiling files | **209** | [verified here] |
| …closed under the global context | **196** | [verified here] |
| …axiom-dependent | **13** | [verified here] |
| GPX Coq theorems kernel-closed (§3) | **83 of 83** | [verified here] |
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

`corpus/coq/` holds 26 Coq sources (authorization, crypto_provenance, lineage_dag) in
`<status>/<framework>/<principal_theorem>.v`.
Totals by directory:

| Directory | Files | Statements | Closed | Axiom-dependent |
|---|---:|---:|---:|---:|
| `01_proved` | 9 | 177 | 177 | 0 |
| `02_axiom_dependent` | 3 | 32 | 19 | 13 |
| `04_uncompiled` | 14 | 0 | 0 | 0 |
| **total** | **26** | **209** | **196** | **13** |

**[verified here]** On 2026-10-04 every file was compiled with coqc 8.18.0: every
file under `01_proved` and `02_axiom_dependent` compiles and every file under
`04_uncompiled` fails. `corpus/coq/INDEX.tsv` gives per-file counts;
`corpus/coq/MANIFEST.json` gives SHA-256, SHA-512 and BLAKE3 for every file.

---

## 3. GPX bundle — 83 of 83

**[verified here]** The Coq sources and kernel logs are in [`coq/`](../coq/).

    GPXBoundary.coq.log     42 closed
    GPXTemporal.coq.log     23 closed
    GPXDiachronic.coq.log   18 closed
    ────────────────────────────────
                            83 statements, 83 closed

Each log contains only `Closed under the global context` lines. The sources contain
no `Admitted`. CI recompiles them and checks these counts on every push.

---

## 4. Release mechanics

**[relayed]** `release.yml` signs with Sigstore keyless: identity comes from GitHub's
OIDC token inside the Actions runner and the signature is recorded in Rekor. Tagging a
release runs the self-test, builds artifacts, writes `SHA256SUMS`/`SHA512SUMS`, signs
every file, attaches SLSA build provenance, and publishes. No key material is needed.

---

## 5. Layout

    crypto/                 from-scratch primitives + tests
    corpus/coq/             26 Coq sources, INDEX.tsv, MANIFEST.json
    coq/                    GPX sources + kernel logs, 83/83
    docs/CORPUS-STATE.md    this file
    docs/logs/              independent Print Assumptions logs (141 statements, all closed)
