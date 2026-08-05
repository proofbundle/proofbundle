# Implementation status — slice 2 of the full cryptographic/evidentiary spec

**This is an honest second installment, not the completed specification.**
`ALGORITHM_REGISTRY.json` lists 95 algorithm/profile entries; the originating
request additionally specifies ~150 source modules, a parallel Lean 4
formal-verification tree, hardware/HSM providers, external timestamping
services, a multi-agent orchestration loop and an EU AI Act mapping. That is
not achievable in one pass and this repository does not claim otherwise.

## Closure rule: NOT PASSED

The closure rule requires, among other things, that every substantive theorem
compiles. **Zero theorems compile, because the Lean toolchain is not installed
in this environment** (`lake`, `lean`, `elan` all exit 127 — see
`reports/lean-build-report.txt`). The rule therefore cannot pass here, and is
reported as not passed rather than reinterpreted.

What *is* closed is narrower and stated exactly: every row marked COMPLETE has
a source module, generated positive vectors, a negative-vector file, a
unit-test file and a hostile-input test file, and `scripts/check-coverage.mjs`
fails the build if any COMPLETE row lacks one.

## Surface status (95 registry entries)

| status | count |
|---|---|
| COMPLETE | 42 |
| COMPLETE_PROVIDER_UNAVAILABLE | 1 |
| LEGACY_VERIFY_ONLY | 1 |
| PARTIAL | 1 |
| RECOGNIZE_ONLY | 2 |
| BLOCKED | 17 |
| NOT_IMPLEMENTED | 31 |

### COMPLETE (42)

    digests    SHA-224/256/384/512, SHA-512/224, SHA-512/256,
               SHA3-256/384/512, SHAKE128/256, BLAKE2b-512, BLAKE2s-256
    MAC        HMAC-SHA-256/384/512, HMAC-SHA3-256/384/512
    KDF        HKDF-SHA-256/384/512, PBKDF2-HMAC-SHA-256/512,
               ProofBundle-subkey-derivation
    signature  Ed25519, Ed448, ECDSA P-256/P-384/P-521,
               RSA-PSS-SHA-256/384/512
    KEM        X25519, X448, ECDH P-256/P-384/P-521
    AEAD       AES-128/192/256-GCM, ChaCha20-Poly1305

Plus the structural layer, which is not registry rows but is implemented and
tested: domain-separated transcripts, Merkle trees with inclusion/consistency
proofs, Merkle Mountain Ranges with rollback and fork detection, hash-chain
append-only logs, a lineage DAG with cycle detection and bounded traversal,
provider capability detection, resource limits with step budgets, and 16 CLI
commands.

### The three special statuses, and why they are not COMPLETE

**COMPLETE_PROVIDER_UNAVAILABLE (1) — keyed-BLAKE2.** `node:crypto` accepts
`createHash(alg, { key })` and *silently ignores the key*, returning an
unkeyed digest. Shipping that as a MAC would be a silent authentication
failure, so `src/digest/blake2.mjs` detects it and raises
`PROVIDER_UNAVAILABLE`. The interface and the refusal are implemented and
tested; no keyed BLAKE2 output is ever produced on this build.

**LEGACY_VERIFY_ONLY (1) — RSA-PKCS1v1.5.** Verifies historical signatures
(positive vector included); generation is refused in two independent places.

**PARTIAL (1) — scrypt.** Implemented with parameter validation and a memory
ceiling, unit-tested for both rejection paths, but no positive RFC 7914
known-answer vector is recorded — so it does not meet the vector requirement
and is not marked COMPLETE.

## What is NOT implemented, with the blocking dependency for each

Each `NOT_IMPLEMENTED` and `BLOCKED` row in `ALGORITHM_REGISTRY.json` carries
its own specific blocker in `interoperabilityNotes`. These are not collapsed
into one generic limitation. The distinct categories:

1. **Absent formal toolchain.** Lean and Coq are not installed. This blocks
   every theorem, the refinement bridge, and the Rocq cross-check.
2. **Absent provider.** 19 providers are probed and report
   `PROVIDER_UNAVAILABLE` with a specific reason each — no PKCS#11 module, no
   `/dev/tpm0`, wrong platform, no configured endpoint or credential. ML-KEM,
   ML-DSA, SLH-DSA, Argon2id and BLAKE3 fall here.
3. **Blocked on a missing component.** All 11 hybrid signature profiles and
   all 6 hybrid KEM profiles: the classical half is now COMPLETE, but no PQ
   component is registered through this dispatch layer, and a
   `BOTH_REQUIRED` profile with a missing component must reject, not degrade.
4. **Real buildable work not yet done.** cSHAKE128/256 and KMAC (need the raw
   sponge exported), SHA3-224, Keccak-256/512, XChaCha20-Poly1305 (needs
   HChaCha20), AES key wrap.

## Layers of the specification with NO implementation in this repository

Stated plainly so their absence is not mistaken for an oversight: bundle data
model and parser, selective disclosure and redaction, supersession and
revocation records, policy engine, certificates and revocation checking, RFC
3161 and OpenTimestamps timestamping, blockchain anchoring, content-addressed
storage, multi-agent orchestration, the verifier loop, Kolmogorov retrieval,
the EU AI Act mapping, the browser application, the Firefox extension, the
bridge, and the swarm protocol.

The verdict enum (46 codes) and the single-terminal-verdict `Result` type
exist and are used throughout, but there is no bundle-level verifier that
consumes them yet.

## Why Lean 4 was not compiled

`lake` and `lean` are not installed in this environment (`reports/lean-build-report.txt`
records the exact check). No Lean source in `lean/` has been compiled, so
**zero theorems from this slice are counted as compiled or substantive** —
see `THEOREM_INDEX.json`, which is empty by design rather than populated
with claims the toolchain never checked. What exists in `lean/` is real,
syntactically-intended Lean 4 source for the most foundational types
(bytes, the admitted semantic-value domain) written to the same discipline
the spec's theorem-acceptance rules demand, explicitly labeled as unverified
pending a toolchain this session does not have.

This mirrors, deliberately, the exact caution `docs/CORPUS-STATE.md`
already applies to the pre-existing mc108 Coq corpus in this repository:
Coq is equally absent here, and every claim about that corpus is already
labeled `[relayed]` rather than `[verified here]` for that reason. The same
standard applies to this new Lean tree.

## Numbers, exactly as run

    registry entries                        95
      COMPLETE                              42
      COMPLETE_PROVIDER_UNAVAILABLE          1
      LEGACY_VERIFY_ONLY                     1
      PARTIAL                                1
      RECOGNIZE_ONLY                         2
      BLOCKED                               17
      NOT_IMPLEMENTED                       31

    unit tests                             190  (190 pass, 0 fail)
    negative tests                          19  ( 19 pass, 0 fail)
    hostile-input tests                     46  ( 46 pass, 0 fail)
    integration (CLI subprocess) tests      15  ( 15 pass, 0 fail)
    total node --test                      270  (270 pass, 0 fail)

    vector files                            24
    positive vectors                       217
    negative vectors                       185
    vector conformance checks              426  (426 pass, 0 fail)
      scripts/verify-vectors.mjs           223
      scripts/verify-surface-vectors.mjs   203

    compiled substantive theorems            0  (Lean toolchain absent, exit 127)
    support lemmas                           0
    providers available                      1  (node:crypto)
    providers unavailable                   19  (each with a distinct reason)

All of the above were executed in this session; raw output is in `reports/`.

## Things caught and fixed while building this, kept in the record

These are exactly the gaps this file exists to disclose rather than paper
over. All were fixed rather than only flagged.

1. **`KMAC128`/`KMAC256` were registered twice** — once under "Digests" and
   once under "MAC", both present in the originating specification's own
   algorithm list. `scripts/check-registry.mjs`'s duplicate-id check caught
   it. Fixed by keeping one canonical entry.
2. **The canonical-JSON parser had no explicit recursion-depth bound**,
   relying on the host engine's call stack. Fixed with an explicit `maxDepth`
   (default 512).
3. **`node:crypto` silently ignores the `key` option on `createHash`.**
   Passing `{ key }` to `createHash('blake2b512', …)` returns the *unkeyed*
   digest. Had this gone unnoticed, keyed-BLAKE2 would have shipped as a MAC
   that authenticates nothing. `src/digest/blake2.mjs` now compares against
   the unkeyed digest and raises `PROVIDER_UNAVAILABLE`; the row is
   `COMPLETE_PROVIDER_UNAVAILABLE`, not `COMPLETE`.
4. **The registry marked BLAKE2b-512 COMPLETE while the central digest
   dispatcher had no entry for it.** The coverage matrix claimed evidence for
   code that could not be reached — `digestBytes('BLAKE2b-512', …)` raised
   `UNKNOWN_ALGORITHM`. Caught by the vector run. Fixed by wiring BLAKE2 into
   `src/digest/digest.mjs`, and `test/unit/registry-consistency.test.mjs` now
   checks *every* COMPLETE row for dispatchability so the class of defect
   cannot recur.
5. **The first release archive reproduced all 124 recorded source hashes and
   still could not run.** `src/digest/sha3.mjs` imports `crypto/keccak.mjs`,
   and `crypto/` had not been packaged. A manifest can only attest to the
   files it lists; it cannot notice one that should have been listed and
   wasn't. Caught by extracting the archive into an empty directory and
   running the suite there — now `scripts/check-cleanroom.mjs`, which is the
   only check that can catch a missing-file packaging bug.
