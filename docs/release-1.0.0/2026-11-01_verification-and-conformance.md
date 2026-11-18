# ProofBundle 1.0.0 — verification and conformance

Written 2026-11-01. Client build `proofbundle-1.0.0-20261101T012119Z.html`, SHA-256 `1b41e7f83d61903bc8233e88ed488be122fd32481db440207e0356d7998be1f6`. Conformance definition `conformance_1_0_0.json`, SHA-256 `b24fe9a47e692f148bce53f09736437c4bdc965d00501ab2164651e565aca81a`, 12,967,641 bytes, 6,015 cases.

## What changed, in one pass

The client had two verifiers and two vocabularies. The 2.x path returned ten hyphenated outcome names; the 1.0.0 path added on 2026-10-30 returned eleven. Neither returned the 46 verdicts that the originating specification defines in `src/verdict/verdict.mjs`, which has been in the repository since 2026-08-12 with the Result and Cause shape in `src/verdict/cause.mjs`. The test suite was the June 2026 manifest of 1,097 vectors, frozen when the client had four digests and three signature schemes. Its expected outcomes were the June generator's own results, and its signatures cover the message bytes, not the digest the patent specifies. That is why the count stayed at 1,097 while algorithms were added: nothing derived the suite from the registry.

This build has one verifier, `verify_bundle`, returning exactly one of the 46 codes with its causes and warnings. Both old paths are removed. The test suite is generated from the registry, so adding a digest or a signature scheme adds its whole row of cases, every verdict included. Every page that shows a verdict gets it from `verify_bundle`: the Verify tab, the bundle store, archives, encrypted receipts, sealed predictions, the boundary examples, the demos and the workbench's outcome run. The demos no longer print hand-written outcomes. Each one seals real bundles and verifies them, and the page shows a demo's expected verdict only where it differs from the result.

1.0.0 is the finished release, so the client now seals `spec_ver` 1.0.0. The labels 2.0.0 and 2.1.0 were written by pre-release builds. Bundles carrying them still verify, with a pre-release warning, so nothing sealed earlier is lost.

## Stage order

The stages follow the patent (PDF sha256 ce332fdb…, anchored in Bitcoin block 931808). The first stage that fails decides the verdict.

1. **Parse.** Strict JSON, shape, `spec_id`, meta and seal agree on algorithms, signature present, payload present, size and nesting limits.
2. **Canonical.** Supplied bytes must equal the canonical serialization, and every string must be Unicode NFC.
3. **Gating.** Checks the version, the envelope's version, the profile, the encoding, the digest, signature and KEM algorithms, provider availability, and migration state (broken, disallowed or deprecated, decided at the verification time against a trusted time anchor).
4. **Cryptographic integrity.**
   - The digest of the canonical bundle-without-seal, then the Merkle root over hdr, meta and payload.
   - The trust set (expected signer, unknown, revoked, expired or not-yet-valid keys).
   - The signature over the digest.
   - The witness layer.
   - The required signature count, the issuer certificate, and the time anchor.
5. **Boundary.** The validity window, then the boundary predicate.
6. **Auxiliary data.** Side attestations and auxiliary items with their digests.
7. **Lineage.** Every ancestor must resolve, digest-bind and pass integrity, with no cycle.
8. **Budgets.** Enforced at every step of lineage: depth, container count, ancestor bytes.
9. **Policy.** Profile rules (PB-REGULATED-1 human approval and approval expiry), `policy_requires`, and prediction claims.

## Envelopes

Three envelope forms are read:

- **Native** carries `merkleRoot` and the key in `seal.pub_b64u`. Its admitted versions are 1.0.0 and the pre-release 2.0.0 and 2.1.0.
- **Key-beside** carries neither; the producer key is supplied with the bundle. It is 1.0.0, the form of the May 2026 corpus.
- **Legacy** carries `sig` instead of `seal`: Ed25519 over `merkleRoot|canonical`. It is 1.1.0 and verifies with a warning.

## Choices the verdict names alone do not settle

Each of these was settled once and is stated in the verifier's header. The definition tests each one.

**Boundary.**
- A false boundary is POLICY_DENIED, with cause stage `boundary`.
- A `present` atom whose context value is absent is SIDE_INFORMATION_MISSING.
- Connectives are three-valued. A structural fault decides first. A decided child settles the connective next: false settles `all`, true settles `any`. A missing value leaves it undecided only when nothing else settles it.
- Atoms are accepted in both defined forms, `{op: operand}` and `{op, path, …}`.
- Wrong arity or operand type is MALFORMED. An unknown atom is NOT_DEFINED.

**Validity window.** `meta.expiration` / `expires_at` and `meta.not_before` give BUNDLE_EXPIRED and BUNDLE_NOT_YET_VALID.

**Dual signature.** This follows the dual-signature specification, as the client's own seal panel states it:
- Both layers valid passes.
- Exactly one valid is INDETERMINATE, which the specification describes as "requires investigation".
- Both invalid is INVALID_SIGNATURE.
- A witness key bound in the signed content (`meta.witness_binding`) makes the witness mandatory: removing it is INSUFFICIENT_SIGNATURES and replacing it is UNEXPECTED_SIGNER.
- An unbound witness passes with a warning.

**RSA-PSS in 1.0.0.**
- The PSS hash is chosen by modulus: SHA-256 for 2048, SHA-384 for 3072, SHA-512 for 4096. MGF1 uses the same hash, and the salt length is the hash length. This is the parameterization of the only 1.0.0 artifact that predates this build, the May corpus.
- Pre-release builds used SHA-256 at every modulus, and their bundles are verified that way.
- Signing is new (`rsaPssSignHashed`, RFC 8017 9.1.1). It is checked against signatures made by Python cryptography 50.0.1 in the boot self-test.
- Every RSA signature in the definition was also verified independently (see Verification below).

**Migration (NIST IR 8547, final, October 2026).**
- Classical signatures are deprecated from 2031-01-01 and disallowed from 2036-01-01.
- Deprecated passes with a warning, or is DEPRECATED_ALGORITHM under PB-REGULATED-1 or when the caller refuses deprecated algorithms.
- Disallowed is DEPRECATED_ALGORITHM unless a trusted time anchor shows the bundle predates the cutoff, in which case it passes with a warning as legacy use.
- An algorithm declared broken is FORBIDDEN_ALGORITHM, with the same time-anchor exception.

**Predictions.**
- A prediction without a falsification condition is EVIDENCE_INCOMPLETE.
- With no observation yet it is NULL, and falsified it is NEGATIVE.
- The client now seals the resolution criteria as the falsification condition, and resolution verifies with the observation.

**Certificates and timestamps.** The client fetches neither. Those verdicts come from the check results the caller supplies (`certificate_check`, `timestamp_check`). A declared certificate with no check result is EVIDENCE_INCOMPLETE. PB-INTEGRITY-TEMPORAL-1 requires a time anchor.

**INDETERMINATE.** Returned when the two signature layers disagree, or when a time-dependent check is needed and the caller required a supplied time but gave none.

**INTERNAL_ERROR.** Returned only when the verifier itself throws. No input is built to cause it, so it is the one verdict the definition does not construct.

## The definition

`pb_generate_conformance` runs inside the client and uses the client's own sealing.

- **Scope.** For each of the 72 pairs (9 digests × 8 signature schemes) it builds one case per verdict the pair can reach. It also covers every profile, every envelope form, the boundary connectives and atom structure, and the registered-but-not-executable algorithms (SHA3-224, Falcon512, SLH-DSA-SHA2-128f). Falcon512 and SLH-DSA are the two of the README's ten schemes removed on 2026-10-18 pending from-scratch builds.
- **Expected verdicts.** Every expected verdict is fixed by how its case was built. None is read back from the verifier.
- **Time.** Verification time is fixed at 2026-11-01T00:00:00Z, so the file gives the same results whenever it is run.
- **Embedding.** The client embeds the exact bytes as gzip+base64url, recording both the bytes' SHA-256 and the embedded text's SHA-256. The boot self-test checks the embedded text, and the Test Suite checks the bytes before running them.
- **Running it.** The Test Suite tab runs the embedded definition (one pair, every Ed25519 pair, or all of it), can generate a fresh one in the browser with new keys, downloads either, and imports definitions or external vector sets.

### Cases by verdict

| Verdict | Cases | How the cases are built |
|---|---:|---|
| VERIFIED | 1,008 | sealed by the client, unchanged (72); bound witness present and valid (72); child with one valid, digest-bound parent (72); boundary requires context operator_id, supplied (72); prediction not falsified by the supplied observation (72); any(present operator_id, env=production): operator_id absent, env=production — the true disjunct decides (72); PB-BOUNDARY-1, boundary holds (72); PB-AI-MODEL-1, sealed by the client (72); PB-ARTIFACT-1, sealed by the client (72); PB-ARCHIVE-1, sealed by the client (72); PB-VERIFY-REPORT-1, sealed by the client (72); PB-REGULATED-1 with a human approval (meta.hitl) (72); PB-INTEGRITY-TEMPORAL-1 with a valid trusted time anchor (72); key-beside envelope, producer key supplied (72) |
| VERIFIED_WITH_WARNINGS | 280 | valid witness added without a binding in the signed content (legacy dual-signature form) (72); ‹alg› declared broken from 2026-10-01, trusted time anchor 2026-09-01 precedes the break (legacy use) (72); pre-release spec_ver 2.1.0 native bundle (RSA-PSS, if any, with ‹alg› as those builds wrote it) (72); verified in 2032 (after ‹alg› deprecation), deprecated algorithms allowed for verification (63); legacy 1.1.0 envelope, unchanged (1) |
| MALFORMED | 144 | hdr.profile deleted (72); boundary atom equals with one operand (arity 2) (72) |
| NONCANONICAL | 72 | the same bundle supplied as JSON text with whitespace |
| UNSUPPORTED_VERSION | 73 | native envelope claiming spec 1.1.0 (a legacy-only version) (72); legacy envelope claiming spec 2.1.0 (1) |
| UNKNOWN_VERSION | 72 | spec_ver 99.0.0 |
| UNSUPPORTED_ALGORITHM | 216 | digest_alg SHA3-224 (registered, not dispatched) (72); sig_alg Falcon512 (registered; not executable in this client until its from-scratch implementation lands) (72); sig_alg SLH-DSA-SHA2-128f (registered; not executable in this client until its from-scratch implementation lands) (72) |
| UNKNOWN_ALGORITHM | 144 | digest_alg SHA-999 (not registered) (72); sig_alg Lamport-9 (not registered) (72) |
| DEPRECATED_ALGORITHM | 189 | verified in 2032 (after ‹alg› deprecation) with deprecated algorithms refused (63); verified in 2037 (after ‹alg› is disallowed) with no time anchor (63); PB-REGULATED-1 verified in 2032: the profile refuses deprecated ‹alg› (63) |
| FORBIDDEN_ALGORITHM | 144 | digest_alg SHA-1 (recognized and refused) (72); ‹alg› declared broken from 2026-10-01, no time anchor (72) |
| DIGEST_MISMATCH | 288 | payload changed after sealing (72); seal.digest_b64u altered, content and signature untouched (isolates the digest comparison) (72); sealed and signed over a merkleRoot that is not the root of hdr/meta/payload (isolates the Merkle comparison) (72); key-beside envelope, payload changed after sealing (72) |
| INVALID_SIGNATURE | 217 | one signature byte flipped (72); primary and bound witness signatures both flipped (72); key-beside envelope, a different key supplied (72); legacy 1.1.0 envelope, payload changed after signing (1) |
| MISSING_SIGNATURE | 72 | seal.signature_b64u deleted |
| INSUFFICIENT_SIGNATURES | 72 | bound witness removed after sealing |
| UNEXPECTED_SIGNER | 144 | bound witness replaced by another key after sealing (72); a different signer was expected (72) |
| UNKNOWN_SIGNER | 72 | sealing key not in the supplied trust set |
| REVOKED_KEY | 72 | sealing key revoked in the trust set |
| EXPIRED_KEY | 72 | sealing key validity ended 2026-10-01 |
| KEY_NOT_YET_VALID | 72 | sealing key valid only from 2027-01-01 |
| CERTIFICATE_INVALID | 72 | issuer certificate checks invalid |
| CERTIFICATE_PATH_INVALID | 72 | issuer certificate path invalid |
| CERTIFICATE_UNTRUSTED | 72 | issuer certificate chains to no trusted root |
| CERTIFICATE_REVOCATION_INDETERMINATE | 72 | issuer certificate revocation status unavailable |
| TIMESTAMP_INVALID | 72 | declared time anchor checks invalid |
| TIMESTAMP_UNTRUSTED | 72 | declared time anchor from an untrusted source |
| TIMESTAMP_INDETERMINATE | 144 | time anchor required and still pending (72); PB-INTEGRITY-TEMPORAL-1, anchor declared, no anchor check supplied (72) |
| BUNDLE_EXPIRED | 72 | meta.expiration 2026-10-15, verified 2026-11-01 |
| BUNDLE_NOT_YET_VALID | 72 | meta.not_before 2027-01-01 |
| LINEAGE_INVALID | 72 | child commits to a parent digest the supplied parent does not have |
| LINEAGE_CYCLE | 72 | child → parent → child |
| LINEAGE_MISSING | 72 | child references a parent that is not supplied |
| ANCESTOR_UNAVAILABLE | 72 | lineage store unreachable |
| PAYLOAD_MISSING | 72 | meta commits to a payload digest, payload deleted |
| SIDE_INFORMATION_MISSING | 216 | boundary requires context operator_id, not supplied (72); any(present operator_id, env=production): operator_id absent, env=test — undecided (72); key-beside envelope, no key supplied (72) |
| POLICY_DENIED | 288 | boundary env=production, context env=test (72); all(present operator_id, env=production): operator_id absent, env=test — the false conjunct decides (72); PB-REGULATED-1 without any human approval (72); PB-REGULATED-1 approval expired 2026-10-20 (72) |
| POLICY_INDETERMINATE | 72 | policy needs context approval_ok, not supplied |
| RESOURCE_EXHAUSTED | 72 | one parent, max_depth 0 |
| LIMIT_EXCEEDED | 72 | max_bundle_bytes 100 |
| PROVIDER_UNAVAILABLE | 72 | provider for ‹alg› marked unavailable |
| EXTERNAL_SERVICE_UNAVAILABLE | 72 | side-information store unreachable |
| EVIDENCE_INCOMPLETE | 144 | issuer certificate declared, no certificate check supplied (72); PB-INTEGRITY-TEMPORAL-1 declares no time anchor (72) |
| NEGATIVE | 72 | prediction falsified by the supplied observation |
| NULL | 72 | prediction with no observation supplied yet |
| INDETERMINATE | 216 | bound witness signature flipped, primary valid (the layers disagree) (72); primary signature flipped, bound witness valid (the layers disagree) (72); expiry must be evaluated, supplied time required and not given (72) |
| NOT_DEFINED | 144 | profile PB-UNDEFINED-9 (72); boundary atom "teleport" is not defined (72) |
| INTERNAL_ERROR | 0 | not constructed — reached only when the verifier itself throws; no input is built to cause that |

## Verification of this build

The build is reproducible from the gpx-free writ-closure build (sha256 898a3da0…) by `integrate.py`. Every splice is anchored on exact text and asserted to match once, and the script fails if any of the following remains in the output: an old verify path, an old outcome name, the frozen manifest, or a gpx identifier outside the Rust crate record.

**Boot self-test: 89 of 89.**
- Run under jsdom, and under Chromium 153.0.8010.12.
- Covers the verdicts above on real seals.
- Checks the RSA-PSS-3072 and RSA-PSS-4096 known answers from Python cryptography, with an altered message rejected.
- Covers the legacy envelope, the three-valued connectives, digest-bound lineage, every dual-signature case, the archive, key and report round-trips, and the embedded definition's recorded SHA-256.

**Full definition: 6,015 of 6,015.** All 45 constructed verdicts were reached as built. It was run three ways:
- Through the Test Suite tab's own button: under jsdom in 49.9 s, and in Chromium in 20.9 s.
- At generation, in the build that generated it.
- On iPhone 13 emulation, the quick scope gave 87 of 87.

**Independent signature check.** Every signature in the definition's passing cases was verified with Python cryptography 50.0.1, over the digest bytes in the seal, under the 1.0.0 parameterization:
- Ed25519, ECDSA P-256/384/521 and RSA-PSS 2048/3072/4096, in native, key-beside and pre-release envelopes, plus every Ed25519 witness: 0 failures.
- Dilithium2 was not checked independently (153 signatures).

**Planted faults: 35 of 35 caught.** Each fault disables one check in the verifier inside the client. The definition was then run against that mutant client, and every fault made cases fail:
- From 1 case (legacy envelope warning dropped) to 280 (warnings never raised).
- It includes the digest and Merkle comparisons separately. On 2026-11-01 the first fault run found that each of those two checks masked the other. The definition now isolates each of them.

The mutants were built from the generation build (sha256 a3793cee…). Its verifier text is byte-identical to this build's. The two builds differ only in one sentence of the demo page's introduction and in the embedded definition.

**May 2026 corpus** (`vectors_v1.json`, 11aef10b…, 300 vectors), through the Test Suite import box: 300 consistent, 0 inconsistent, compared through the old-outcome mapping.

**June 2026 set** (`conformance_vectors_800.json`, 858a1b58…, 1,097 vectors), through the import box: 244 consistent, 853 inconsistent. The inconsistent vectors are the message-signed form. For every Ed25519 case the cause says the signature verifies over the canonical message bytes instead of the digest.

**Demos: 6 of 6 ran.** All 23 computed verdicts equal the demos' declared expectations.

**Phone layout** (Chromium, iPhone 13, 390 px): the Test Suite, Verify and Showcase tabs have no element overflowing the page and no horizontal page scroll. No page errors were recorded in any run.

## What this build does not do

- **Dilithium2 (ML-DSA-44).** Its signatures in the definition are verified by the client only. An independent ML-DSA implementation was not available in this workspace.
- **The Rust workspace.** The definition is a plain JSON file whose cases carry their bundles, options and parents, so any implementation can run it.
  - **Where it is.** The 32-crate workspace (manifest sha256 89423f4b…, crates named `gpx-*`) is the genophylaxis workspace. The Google Drive listing of 2026-08-22 has it under `VM_FULL_20260626/genophylaxis-src/` and `VM_BUILT_ARTIFACTS_20260627/genophylaxis_source_crates/`.
  - **Not run.** It was not fetched or built here, and the definition has not been run there.
  - **Not checked.** Whether any of its crates reads ProofBundle 1.0.0 envelopes was not checked.
  - **The staged Rust.** `src/proofbundle/rust` is the custody CLI, and it does not read them.
  - **Naming.** The crate names are recorded verbatim in the client's algorithm-synthesis data. The client has no other gpx naming.
- **Aletheia naming.** The workbench still uses `aletheia` element ids and the desktop bridge name `window.aletheiaDesktop`, and the desktop's custody signatures use `ALETHEIA-*` domain-separation strings. Renaming the bridge needs the desktop preload changed with it. Renaming the domain strings changes what existing custody signatures cover, so it needs dual acceptance during the change. Neither was done here.
