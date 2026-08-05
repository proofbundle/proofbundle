# Implementation status — slice 3 of the full cryptographic/evidentiary spec

**This is an honest third installment, not the completed specification.** The
algorithm registry now carries the exhaustive enumeration: **390 rows**, every
algorithm and parameter set named in the specification, including the ones this
build cannot perform. A row exists so its status can be stated — an algorithm
absent from the registry is an algorithm whose absence nobody recorded.

## Closure rule: NOT PASSED

The closure rule requires every substantive theorem to compile. **Zero theorems
compile, because the Lean toolchain is not installed in this environment**
(`lake`, `lean`, `elan` all exit 127 — see `reports/lean-build-report.txt`).
The rule cannot pass here and is reported as not passed rather than
reinterpreted.

What *is* closed is narrower and stated exactly: every row marked COMPLETE has
a source module, generated positive vectors, a negative-vector file, a
unit-test file and a hostile-input test file; `scripts/check-coverage.mjs`
fails the build if any COMPLETE row lacks one; and
`test/unit/registry-consistency.test.mjs` fails if any COMPLETE row is not
actually reachable through a dispatcher.

## Surface status (390 registry entries)

| status | count | meaning |
|---|---|---|
| COMPLETE | 97 | implemented here, with vectors and tests |
| LEGACY_VERIFY_ONLY | 12 | computable for historical verification; generation refused |
| COMPLETE_PROVIDER_UNAVAILABLE | 1 | interface + deterministic refusal implemented and tested; provider absent |
| PARTIAL | 1 | implemented but missing a required artifact |
| RECOGNIZE_ONLY | 97 | recognized so rejection is deterministic; never computed |
| BLOCKED | 32 | waits on another row in this registry |
| NOT_IMPLEMENTED | 150 | not built; each row names its specific blocker |

By family: DIGEST 46, MAC 24, KDF 36, SIGNATURE 118, KEM 79, AEAD 52,
HYBRID_SIGNATURE 19, HYBRID_KEM 16.

### What became COMPLETE this pass (42 → 97)

    digests    SHA3-224, Keccak-224/256/384/512, SM3
               (SHA3-224 and Keccak were unblocked by exporting the sponge
               from crypto/keccak.mjs — the blocker the registry had recorded)
    SP 800-185 cSHAKE128/256, KMAC128/256, TupleHash128/256,
               ParallelHash128/256 — all checked against NIST sample vectors
    MAC        HMAC over SHA-224, SHA-512/224, SHA-512/256, SHA3-224, SM3
    KDF        HKDF over 11 digests; PBKDF2 over SHA-224/384
    signature  ECDSA P-224, ECDSA secp256k1, RSA-PSS-SHA-224
    KEM        ECDH P-224, ECDH secp256k1
    AEAD       AES-CCM (128/192/256 and the 8-byte-tag variants),
               AES-OCB (128/192/256), ARIA-GCM and ARIA-CCM (128/192/256)
    key wrap   AES-KW and AES-KWP (128/192/256), RFC 3394 + RFC 5649

### The three special statuses

**COMPLETE_PROVIDER_UNAVAILABLE (1) — keyed-BLAKE2.** `node:crypto` accepts
`createHash(alg, { key })` and *silently ignores the key*, returning an unkeyed
digest. Shipping that as a MAC would authenticate nothing, so
`src/digest/blake2.mjs` detects it and raises `PROVIDER_UNAVAILABLE`.

**LEGACY_VERIFY_ONLY (12).** SHA-1, RIPEMD-160, HMAC-SHA-1, HMAC-RIPEMD-160,
PBKDF2-HMAC-SHA-1, ECDSA-P-192, and the six RSA-PKCS1v1.5 digest bindings.
All are computable so historical artifacts stay checkable; every generation
entry point refuses them.

**PARTIAL (1) — scrypt.** Implemented with parameter validation and a memory
ceiling, unit-tested for both rejection paths, but no positive RFC 7914
known-answer vector is recorded — so it does not meet the vector requirement.

## Blocking dependencies, by category

Each NOT_IMPLEMENTED and BLOCKED row carries its own blocker string in
`ALGORITHM_REGISTRY.json`. These are not collapsed into one generic
limitation. The categories:

1. **Absent formal toolchain.** Lean and Coq are not installed. Blocks every
   theorem, the refinement bridge, and the Rocq cross-check.
2. **Absent post-quantum provider.** ML-DSA, SLH-DSA, Falcon, XMSS, LMS, HSS,
   Classic McEliece, NTRU, NTRU Prime, BIKE, HQC, FrodoKEM. No vetted
   liboqs-class provider is bundled or configured.
3. **Stateful signatures, independently.** XMSS/LMS/HSS carry a *second*
   blocker beyond provider availability: signing consumes a one-time key and
   reusing an index is catastrophic. ProofBundle has no state-management story
   for stateful signatures.
4. **OpenSSL build limits.** Camellia and SM4 are present but only in
   CBC/CFB/CTR/ECB/OFB — no GCM or CCM mode. BLAKE2 truncated digest lengths
   are not exposed. GOST/Streebog needs an engine this build lacks. Each was
   verified by inspecting `getCiphers()`/`getHashes()` during this build.
5. **Blocked on a missing component.** All 19 hybrid signature profiles and
   13 hybrid KEM profiles: the classical half is COMPLETE, the PQ half is not,
   and a `BOTH_REQUIRED` profile with a missing component must reject rather
   than degrade.
6. **Broken or superseded, recognized for rejection.** 97 rows: SIKE and
   Rainbow (practically broken), Kyber/Dilithium/SPHINCS+ round-3 identifiers
   (superseded by the FIPS versions and not bit-compatible), MD2/MD4/MD5,
   DSA, the NIST Round-1 KEM candidates.
7. **Real buildable work not done.** CMAC and GMAC, SP 800-108 and SP 800-56C
   KDFs, XChaCha20-Poly1305, RSA-OAEP, encrypt-then-MAC compositions. Each
   says so plainly rather than blaming a missing dependency.

## Layers with NO implementation in this repository

Stated plainly so their absence is not mistaken for oversight: bundle data
model and parser, selective disclosure and redaction, supersession and
revocation records, policy engine, certificates and revocation checking, RFC
3161 and OpenTimestamps timestamping, blockchain anchoring, content-addressed
storage, multi-agent orchestration, the verifier loop, Kolmogorov retrieval,
the EU AI Act mapping, the browser application, the Firefox extension, the
bridge, and the swarm protocol.

The verdict enum (46 codes) and the single-terminal-verdict `Result` type
exist and are used throughout, but no bundle-level verifier consumes them yet.

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

    registry entries                        390
      COMPLETE                               97
      LEGACY_VERIFY_ONLY                     12
      COMPLETE_PROVIDER_UNAVAILABLE           1
      PARTIAL                                 1
      RECOGNIZE_ONLY                         97
      BLOCKED                                32
      NOT_IMPLEMENTED                       150

    unit tests                              318  (318 pass, 0 fail)
    negative tests                           19  ( 19 pass, 0 fail)
    hostile-input tests                      46  ( 46 pass, 0 fail)
    integration (CLI subprocess) tests       15  ( 15 pass, 0 fail)
    total node --test                       398  (398 pass, 0 fail)

    vector files                             29
    positive vectors                        371
    negative vectors                        315
    vector conformance checks               751  (751 pass, 0 fail)
      scripts/verify-vectors.mjs            235
      scripts/verify-surface-vectors.mjs    431
      scripts/verify-extended-vectors.mjs    85
    of which checked against an external
      NIST/RFC published value               14

    compiled substantive theorems             0  (Lean toolchain absent, exit 127)
    support lemmas                            0
    providers available                       1  (node:crypto)
    providers unavailable                    19  (each with a distinct reason)

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
5. **The vector checker caught a stale expectation the moment SHA-1 changed
   status.** SHA-1 moved from RECOGNIZE_AND_REJECT to LEGACY_VERIFY_ONLY when
   the legacy digest path landed, and `vectors/digest/negative-algorithm-ids.json`
   still asserted `FORBIDDEN_ALGORITHM` for it. `verify-vectors` failed with
   "expected an error, got none" — which is exactly what a vector set is for.
6. **A negative vector that could never fail.** The AEAD generator built its
   "truncated tag" case by slicing to a fixed 8 bytes. For the CCM-8 suites the
   full tag *is* 8 bytes, so the "truncated" tag was the valid one and the
   vector asserted a failure that cannot happen. Both the generator and the
   unit test now truncate relative to each suite's own tag length.
7. **A test that let recognize-and-reject rows look dispatchable.** The
   registry-consistency check defaulted to `true` for families with no
   dispatcher, so the three superseded `X25519+Kyber*` hybrid rows passed a
   check that should have flagged them. The default is now `false`.
8. **The first release archive reproduced all 124 recorded source hashes and
   still could not run.** `src/digest/sha3.mjs` imports `crypto/keccak.mjs`,
   and `crypto/` had not been packaged. A manifest can only attest to the
   files it lists; it cannot notice one that should have been listed and
   wasn't. Caught by extracting the archive into an empty directory and
   running the suite there — now `scripts/check-cleanroom.mjs`, which is the
   only check that can catch a missing-file packaging bug.
