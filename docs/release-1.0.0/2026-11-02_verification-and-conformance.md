# ProofBundle 1.0.0 — verification and conformance

Written 2026-11-02. Client build `proofbundle-1.0.0-20261102T084002Z.html`, SHA-256 `7602f2aa101cb1e6cbe6239b48cf9be340f2b4f2144e42670cbaf674f66e5623`. Conformance definition `conformance_1_0_0.json`, SHA-256 `256de0b9fa36d8e0e56ffc52a836a56caa4bc265dba89dd78642e5b5e83d177f`, 77,536,059 bytes, 17,822 cases.

## What changed, in one pass

The client had two verifiers and two vocabularies. The 2.x path returned ten hyphenated outcome names; the 1.0.0 path added on 2026-10-30 returned eleven. Neither returned the 46 verdicts that the originating specification defines in `src/verdict/verdict.mjs`, which has been in the repository since 2026-08-12 with the Result and Cause shape in `src/verdict/cause.mjs`. The test suite was the June 2026 manifest of 1,097 vectors, frozen when the client had four digests and three signature schemes. Its expected outcomes were the June generator's own results, and its signatures cover the message bytes, not the digest the patent specifies. That is why the count stayed at 1,097 while algorithms were added: nothing derived the suite from the registry.

This build has one verifier, `verify_bundle`, returning exactly one of the 46 codes with its causes and warnings. Both old paths are removed. The test suite is generated from the registry, so adding a digest or a signature scheme adds its whole row of cases, every verdict included. Every page that shows a verdict gets it from `verify_bundle`: the Verify tab, the bundle store, archives, encrypted receipts, sealed predictions, the boundary examples, the demos and the workbench's outcome run. The demos no longer print hand-written outcomes. Each one seals real bundles and verifies them, and the page shows a demo's expected verdict only where it differs from the result.

An adversarial run against the verifier by a second agent on the operator's machine (137 checks over five pairs, requirements written before the run) found four places where a bundle could pass that should not, or pass in more than one byte form, and this build closes all four. A bundle carries its own public key, so with nothing supplied to anchor the signer anyone could change the content, reseal it under their own key and receive a clean VERIFIED; a verified result now names what anchored the signer, and a key the bundle merely carries gives VERIFIED_WITH_WARNINGS with that stated. Base64url values outside the signed content accepted spellings with nonzero unused bits, so one bundle had several valid byte forms; they are now refused as NONCANONICAL. The seal accepted fields no signature covers (a fabricated `time_anchors`, for example); the seal schema is now closed. Nesting beyond the parser's limit in an object surfaced as INTERNAL_ERROR; it is now LIMIT_EXCEEDED. Checking those paths also showed that legacy 1.1.0 envelopes ignored an expected signer and a trust set entirely; they now go through the same signer check as every other envelope.

The client carries no third-party code. Every digest, signature, key encapsulation and AEAD runs from its specification in the client's own core; the platform supplies only random bytes. A minified noble bundle left behind when Falcon-512 was removed on 2026-10-18 was still loaded although no algorithm reached it, and is gone, with a build check that fails if it returns. All of the client's own names are snake_case; the names kept are the platform's, the 46 verdict codes, fields of external formats (the bundle's `merkleRoot`, ACVP, RFC 6962 proofs, MCP), algorithm identifiers, and the desktop bridge and public adapter globals (`window.aletheiaDesktop`, `window.ProofBundle`), which other programs call by name. State saved by earlier builds is read through a key migration, and sealed bundles inside it are never touched.

A mechanical mutation run then tested the definition itself, with no faults chosen by hand. Every refusal condition in the verifier was negated or removed, every comparison and connective flipped, every refusal call dropped: 952 mutants of the previous build's verifier, each run against the whole definition until a verdict changed. The survivors showed what 14,467 passing cases had not tested:
- the parse-stage structure refusals;
- limits at their exact edges;
- base64url spellings other than unused bits;
- nearly every boundary atom.

Building the atom table from the stated rule also showed that the 2.x atom form accepted malformed operands, which it now refuses. This build adds the cases and reruns the mutation against itself; the results are under "Verification of this build".

This build also adds selective disclosure (`PB-DISCLOSURE-1`). A record is sealed once, and any subset of its fields can be presented, with salted leaves so that a withheld field cannot be guessed from its hash. The Article 50(2) marking manifest now carries a salted content commitment in place of the content's bare SHA-256, and is signed by the producer key loaded in the Seal tab instead of a key made for one click and discarded.

1.0.0 is the finished release, so the client now seals `spec_ver` 1.0.0. The labels 2.0.0 and 2.1.0 were written by pre-release builds. Bundles carrying them still verify, with a pre-release warning, so nothing sealed earlier is lost.

## Algorithms

An algorithm is dispatched when its implementation in the client reproduces NIST's own test vectors (usnistgov/ACVP-Server, gen-val/json-files, run 2026-11-01, 0 failures). This build adds six digests and two signature parameter sets on that basis:
- **Digests.** SHA-224 (79 byte-aligned AFT vectors), SHA-512/224 (146), SHA-512/256 (1,024), SHA3-224 (163), SHAKE128 at 256 output bits (269), SHAKE256 at 512 output bits (41). Fifteen digests are dispatched in all.
- **Signatures.** ML-DSA-65 and ML-DSA-87 join ML-DSA-44 (`Dilithium2`). Across the three parameter sets the implementation passes 75 keyGen, 180 sigVer (accepting and rejecting) and 360 sigGen vectors, deterministic and hedged, over the pure, pre-hash, internal and external-mu interfaces. Ten signature schemes are dispatched in all.
- **Key encapsulation.** ML-KEM-512/768/1024 pass 75 keyGen, 75 encapsulation, 30 decapsulation (implicit rejection included) and 60 key-check vectors.
- **Registered, not executable here.** SM3, RIPEMD-160, Streebog-256, Falcon-512 and SLH-DSA verify as UNSUPPORTED_ALGORITHM until an implementation in the client passes official vectors.

## Stage order

The stages follow the patent (PDF sha256 ce332fdb…, anchored in Bitcoin block 931808). The first stage that fails decides the verdict.

1. **Parse.** Strict JSON, shape, `spec_id`, meta and seal agree on algorithms, signature present, payload present, the seal carries only the fields its schema defines (and the witness and legacy `sig` likewise), size limits, and nesting at most 500 levels for objects as for text.
2. **Canonical.** Supplied bytes must equal the canonical serialization, every string must be Unicode NFC, and every base64url value outside the signed content (signature, key, digest, Merkle root, witness) must be the one canonical spelling of its bytes.
3. **Gating.** Checks the version, the envelope's version, the profile, the encoding, the digest, signature and KEM algorithms, provider availability, and migration state (broken, disallowed or deprecated, decided at the verification time against a trusted time anchor).
4. **Cryptographic integrity.**
   - The digest of the canonical bundle-without-seal, then the Merkle root over hdr, meta and payload.
   - The signer: an expected signer, a trust set (unknown, revoked, expired or not-yet-valid keys) or a supplied key anchors it; the result names which (`signer.basis`), and a key the bundle only carries is reported as such.
   - The signature over the digest.
   - The witness layer.
   - The required signature count, the issuer certificate, and the time anchor.
5. **Boundary.** The validity window, then the boundary predicate.
6. **Auxiliary data.** Side attestations and auxiliary items with their digests.
7. **Lineage.** Lineage is a DAG. Every distinct ancestor must resolve and pass integrity once; every edge's digest commitment is checked; a node met again on the current path is a cycle, met again off it is a shared ancestor already verified.
8. **Budgets.** Enforced at every step of lineage: depth is the longest path, container count and ancestor bytes count distinct ancestors.
9. **Policy.** Profile rules (PB-REGULATED-1 human approval and approval expiry), `policy_requires`, and prediction claims.

## Envelopes

Four envelope forms are read:

- **Native** carries `merkleRoot` and the key in `seal.pub_b64u`. Its admitted versions are 1.0.0 and the pre-release 2.0.0 and 2.1.0.
- **Key-beside** carries neither; the producer key is supplied with the bundle. It is 1.0.0, the form of the May 2026 corpus.
- **Legacy** carries `sig` instead of `seal`: Ed25519 over `merkleRoot|canonical`. It is 1.1.0 and verifies with a warning.
- **Disclosure** carries `disclosure` and declares profile `PB-DISCLOSURE-1`; it is 1.0.0. See "Selective disclosure".

## Choices the verdict names alone do not settle

Each of these was settled once and is stated in the verifier's header. The definition tests each one.

**Boundary.**
- A false boundary is POLICY_DENIED, with cause stage `boundary`.
- A `present` atom whose context value is absent is SIDE_INFORMATION_MISSING.
- Connectives are three-valued. A structural fault decides first. A decided child settles the connective next: false settles `all`, true settles `any`. A missing value leaves it undecided only when nothing else settles it.
- Atoms are accepted in both defined forms, `{op: operand}` and `{op, path, …}`.
- Wrong arity or operand type is MALFORMED. An unknown atom is NOT_DEFINED.

**Boundary atoms.** Each atom is true, false, SIDE_INFORMATION_MISSING (only `present`) or a refusal for its own shape. A false atom makes the boundary POLICY_DENIED. "Now" is the verification time, or the context's `_now` when it supplies one. A context path that is absent makes every atom false except `present`.

| atom | 1.0.0 form | 2.x form | true when |
|---|---|---|---|
| equals | `{"equals": [path, value]}` | `{"op":"equals","path","value"}` | the context value equals `value` as canonical JSON (key order does not matter) |
| present | `{"present": path}` | `{"op":"present","path"}` | the value is present; absent, `null` or `""` is SIDE_INFORMATION_MISSING (`0` and `false` are present) |
| in | `{"in": [path, [v…]]}` | `{"op":"in","path","set":[v…]}` | the value equals a member as canonical JSON |
| range | `{"range": [path, lo, hi]}` | `{"op":"range","path","lo","hi"}` | the value is a JSON number with lo ≤ value ≤ hi (both ends included; a numeric string is not a number) |
| before / after | `{"before": [path, t]}` | `{"op":"before","path","value": t or "now"}` | the context time is strictly earlier / later than t (equal times are false) |
| within | `{"within": [path, t1, t2]}` | — | t1 ≤ context time ≤ t2 |
| within_days | `{"within_days": [path, n]}` | `{"op":"within_days","path","days": n}` | the context time is within n days of now, either side, ends included |
| expired / not_expired | `{"expired": path}` | — | the context time is at or before now / strictly after now; an absent value is false for both |
| within_last / age_lt | `{"within_last": [path, d]}` | — | now − context time ≤ d / < d, with d written `<n>s`, `m`, `h`, `d` or `w` |
| all / any | `{"all": [atoms]}` | — | every / some atom is true; `[]` is true for all and false for any; a top-level array is `all` |

Shape refusals for atoms are as follows:
- An unknown atom, or a 2.x operator with no 2.x form, is NOT_DEFINED.
- A wrong operand count, or a 2.x atom with keys other than the ones listed, is MALFORMED.
- A wrong operand type is MALFORMED. This covers a non-array set, non-numeric or inverted range bounds, a bound that is not a timestamp, non-numeric days, and a duration outside `<n>[smhdw]`.
- An `expired` value that is not a timestamp is MALFORMED.
- A context time that does not parse makes `before`, `after`, `within`, `within_days`, `within_last` and `age_lt` false.

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
- Signing is new (`rsa_pss_sign_hashed`, RFC 8017 9.1.1). It is checked against signatures made by Python cryptography 50.0.1 in the boot self-test.
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

**Signer anchoring.** A native bundle carries its public key in the seal, so its signature shows only that the bundle is intact under that key. The verifier reports what anchored the signer as `signer.basis`: `expected_signer`, `trust_set`, `supplied_key`, or `carried_by_bundle`. The last one passes as VERIFIED_WITH_WARNINGS with the warning `signer.self_carried`, which says what to supply to bind it. A bundle changed and resealed under another key is UNEXPECTED_SIGNER against an expected signer and UNKNOWN_SIGNER against a trust set that does not hold that key. Legacy 1.1.0 envelopes go through the same check. The Verify tab puts the producer key field beside the bundle rather than under Advanced options.

**Seal fields.** The seal sits outside the signed content, so it admits only `digest_alg`, `digest_b64u`, `sig_alg`, `signature_b64u`, `pub_b64u` (native), `witness`, and the sealer's own engine note (`_engine`, `_engine_note`). The engine note is unsigned, and a bundle carrying it passes with the warning `seal.unsigned_note`. Any other field is MALFORMED, as is any field outside `{sig_alg, pub_b64u, signature_b64u}` in a witness or outside `{alg, pub, sig}` in a legacy `sig`.

**Base64url.** A lenient decoder gives one value many spellings: nonzero unused bits in the last character, `=` padding, the standard alphabet's `+` and `/`, a stray character, an impossible length. Every base64url value outside the signed content must re-encode to itself. Otherwise the verdict is NONCANONICAL, with the field named and the canonical spelling as the revision condition. The seal's digest, signature and key are checked against the base64url alphabet while parsing, so a foreign character there is MALFORMED.

**Selective disclosure (`PB-DISCLOSURE-1`).**
- **What is committed.** `hdr` is one leaf, and every top-level field of `meta` and of `payload` is a leaf of its own.
- **Leaf.** A leaf is `H(0x00 ‖ canonical ["PB-DISCLOSURE-1", path, salt, value])`, with a fresh 32-byte salt for each leaf.
- **Root and signature.** The leaves, in ascending path order, form a Merkle tree under the client's node rule. The signature covers `H(canonical {digest_alg, leaf_count, profile, root_b64u})`.
- **Presentation.** A presentation lists every leaf. A disclosed leaf comes with its salt and its value in place. A withheld leaf is its leaf hash alone, and its salt leaves with it; without the salt, a short withheld value cannot be found by hashing guesses.
- **Verdicts.** A presentation with every field disclosed is VERIFIED. One with withheld fields is VERIFIED_WITH_WARNINGS, and the warning `disclosure.withheld` names them.
- **Refused.**
  - MALFORMED: a field carried and not committed, a path listed twice, `hdr` withheld, a salt that is not 32 bytes or that is used twice, a disclosed field that is absent, a withheld field that is present, a withheld leaf of the wrong length.
  - NONCANONICAL: leaves out of order.
  - DIGEST_MISMATCH: any disclosed value, salt or withheld leaf that differs from what was sealed.
  - EVIDENCE_INCOMPLETE: a presentation that withholds a field verification acts on. Those are the 21 `meta` fields the verifier reads (validity window, boundary, approvals, references, certificate, time anchor, witness binding, algorithms and so on); withholding one would remove its check. The build fails if that list differs from the fields the verifier source reads.

**Nesting.** Objects deeper than 500 levels are LIMIT_EXCEEDED before anything walks them, and the parser's own depth limit on text gives the same verdict, so no input reaches the canonicalizer's guard or the call stack.

**Certificates and timestamps.** The client fetches neither. Those verdicts come from the check results the caller supplies (`certificate_check`, `timestamp_check`). A declared certificate with no check result is EVIDENCE_INCOMPLETE. PB-INTEGRITY-TEMPORAL-1 requires a time anchor.

**INDETERMINATE.** Returned when the two signature layers disagree, or when a time-dependent check is needed and the caller required a supplied time but gave none.

**INTERNAL_ERROR.** Returned only when the verifier itself throws. No input is built to cause it, so it is the one verdict the definition does not construct.

**Revision condition.** Every negative cause carries `revisable_by`: the contrary finding that would change the verdict (the missing parent supplied, the original content whose digest matches, a trusted time anchor before the cutoff, and so on). Where nothing further can change it for that bundle, the field says so and why; LINEAGE_CYCLE is the one such verdict, because the references themselves form the cycle.

## The definition

`pb_generate_conformance` runs inside the client and uses the client's own sealing.

- **Scope.** For each of the 150 pairs (15 digests × 10 signature schemes) it builds one case per verdict the pair can reach. It also covers every profile, every envelope form, the boundary atom table clause by clause (each atom true and false, both edges of each bound, absent paths, every shape refusal, both forms), the parse-stage structure refusals, limits at their exact edges, every base64url spelling the verifier refuses, selective disclosure (each refusal, withheld and fully disclosed presentations, resealing under another key), and the registered-but-not-executable algorithms (SM3, Falcon512, SLH-DSA-SHA2-128f), and DAG-shaped lineage (diamonds, shortcuts, and a ladder of 29 distinct ancestors over 2^15 paths), the signer basis (unanchored, resealed under another key against an expected signer and against a trust set), non-canonical base64url, fields outside the seal, witness and legacy-sig schemas, the unsigned engine note, and nesting beyond the limit as an object and as text. Cases expected to verify are given their sealing key as the expected signer unless the case supplies its own anchor or tests its absence. Falcon512 and SLH-DSA are the two of the README's ten schemes removed on 2026-10-18 pending from-scratch builds.
- **Expected verdicts.** Every expected verdict is fixed by how its case was built. None is read back from the verifier.
- **Time.** Verification time is fixed at 2026-11-01T00:00:00Z, so the file gives the same results whenever it is run.
- **Embedding.** The client embeds the exact bytes as gzip+base64url, recording both the bytes' SHA-256 and the embedded text's SHA-256, and the Test Suite checks the bytes before running them. Beside it the client embeds the quick slice, every SHA-256 × Ed25519 case, with its own SHA-256; the boot self-test checks that hash and runs the slice on every page load.
- **Running it.** The Test Suite tab runs the embedded definition (one pair, every Ed25519 pair, or all of it), can generate a fresh one in the browser with new keys, downloads either, and imports definitions or external vector sets.

### Cases by verdict

| Verdict | Cases | How the cases are built |
|---|---:|---|
| VERIFIED | 2,629 | sealed by the client, unchanged (150); bound witness present and valid (150); disclosure: every committed field disclosed (150); child with one valid, digest-bound parent (150); diamond: child → two parents → one shared root; max_containers 3 (three distinct ancestors, four paths) (150); shortcut with max_depth 2 (150); boundary requires context operator_id, supplied (150); prediction not falsified by the supplied observation (150); any(present operator_id, env=production): operator_id absent, env=production — the true disjunct decides (150); PB-BOUNDARY-1, boundary holds (150); PB-AI-MODEL-1, sealed by the client (150); PB-ARTIFACT-1, sealed by the client (150); PB-ARCHIVE-1, sealed by the client (150); PB-VERIFY-REPORT-1, sealed by the client (150); PB-REGULATED-1 with a human approval (meta.hitl) (150); PB-INTEGRITY-TEMPORAL-1 with a valid trusted time anchor (150); key-beside envelope, producer key supplied (150); ladder DAG: 29 distinct ancestors over 2^15 paths, max_containers 29, max_depth 15 (15); boundary atom table: equals, value equal (1); boundary atom table: equals, objects equal as canonical JSON in another key order (1); boundary atom table: equals, nested path (1); boundary atom table: present, value present (1); boundary atom table: present, value 0 (1); boundary atom table: present, value false (1); boundary atom table: in, value a member (1); boundary atom table: range, value at lo (1); boundary atom table: range, value at hi (1); boundary atom table: before, one second earlier (1); boundary atom table: after, one second later (1); boundary atom table: within, at the start (1); boundary atom table: within, at the end (1); boundary atom table: within_days 30, exactly 30 days before now (1); boundary atom table: within_days 30, exactly 30 days after now (1); boundary atom table: expired, time equal to now (1); boundary atom table: not_expired, one second after now (1); boundary atom table: within_last 7d, exactly 7 days old (1); boundary atom table: age_lt 7d, one second younger (1); boundary atom table: within_last 2h with the context supplying _now (1); boundary atom table: all of nothing (1); boundary atom table: a top-level array is all (1); boundary atom table: nested: any(all(false, true), all(true, true)) (1); boundary atom table: 2.x equals (1); boundary atom table: 2.x present (1); boundary atom table: 2.x in (1); boundary atom table: 2.x range at hi (1); boundary atom table: 2.x after "now" (1); boundary atom table: 2.x within_days 1, one day after now (1); canonical: a payload string already in NFC (precomposed é) (1); gating: meta.encryption names ML-KEM-768 (registered key encapsulation) (1); structure: meta.payload_sha256 with the payload present (1); signer: native bundle verified under its own key, supplied (1); signer: the trust set holds the sealing key (no expected signer) (1); signer: key validity ends exactly at the verification time (still valid) (1); signer: key validity starts exactly at the verification time (already valid) (1); signatures: one required, stated explicitly (1); signatures: two required, primary and bound witness both valid (1); certificate: declared and checked valid (1); timestamp: declared and checked valid (1); timestamp: PB-INTEGRITY-TEMPORAL-1, anchor checked valid (1); validity: meta.expiration one second after the verification time (1); validity: meta.not_before exactly the verification time (1); auxiliary: side attestations required and complete (1); auxiliary: side attestations carried, not required (1); auxiliary: aux item supplied and matching its digest (1); lineage: a parent referenced by id alone, its integrity verified (1); lineage: the parent supplied in the bundle store (opts.bundles) (1); lineage: ancestor bytes exactly max_bytes (1); lineage: key-beside parent with its key supplied (1); lineage: a reference object with parent_id and no digest (bound by id, parent verified) (1); lineage: parent_digest_alg naming a digest other than the default ‹alg› (1); policy: a regulated approval expiring one second after (1); policy: PB-REGULATED-1 approved by side attestations without meta.hitl (1); policy: a required context value true (1); policy: a required context value present and not false (0) (1); nesting: payload reaching depth 500, as an object (1); nesting: payload reaching depth 500, as canonical JSON text (1); limits: max_nesting 2 on a bundle of depth 2 (1); limits: max_bundle_bytes equal to the canonical size, object input (1); limits: max_bundle_bytes equal to the text size, text input (1); migration: deprecated algorithms refused, verified one second before ‹alg› is deprecated (1); signer: ‹alg› seal key in SubjectPublicKeyInfo form (same key) (1); signer: ‹alg› expected signer given in SubjectPublicKeyInfo form (1) |
| VERIFIED_WITH_WARNINGS | 1,315 | sealed by the client, verified with no expected signer, trust set or key (the key the bundle carries is all that was checked) (150); content changed and resealed under another key; nothing anchors the signer (intact under the key it carries, flagged as unanchored) (150); seal carries the sealer's unsigned engine note (seal._engine, seal._engine_note) (150); valid witness added without a binding in the signed content (legacy dual-signature form) (150); ‹alg› declared broken from 2026-10-01, trusted time anchor 2026-09-01 precedes the break (legacy use) (150); disclosure: meta.subject and payload.decision withheld (the warning names them) (150); disclosure: every field disclosed, nothing anchors the signer (150); pre-release spec_ver 2.1.0 native bundle (RSA-PSS, if any, with ‹alg› as those builds wrote it) (150); verified in 2032 (after ‹alg› deprecation), deprecated algorithms allowed for verification (105); legacy 1.1.0 envelope, unchanged (1); signer: the key is not in a trust set that does not require it (unanchored) (1); seal: the engine note without _engine_note (1); seal: _engine_note without _engine (1); timestamp: declared, not required, no check supplied (1); timestamp: declared, not required, check pending (1); lineage: key-beside parent, no key, bound by the child's digest commitment (1); witness: unbound ‹alg› witness whose key is in SubjectPublicKeyInfo form (same key) (1); migration: verified one second before ‹alg› is disallowed (1); migration: ‹alg› broken from 2026-10-01, trusted time anchor one second before (1) |
| MALFORMED | 2,158 | seal.time_anchors added after sealing (a field outside the seal schema, covered by no signature) (150); hdr.profile deleted (150); bound witness with a field outside the witness schema (150); disclosure: a withheld leaf hash of the wrong length (150); disclosure: a payload field carried and not committed (150); disclosure: a top-level field outside the commitment (150); disclosure: one path committed twice (150); disclosure: hdr withheld (150); disclosure: a 16-byte salt (150); disclosure: one salt used for two leaves (150); disclosure: a field listed as disclosed is absent (150); disclosure: a field listed as withheld is present (150); native envelope declaring the disclosure profile (150); boundary atom equals with one operand (arity 2) (150); boundary atom table: equals operand is not an array (1); boundary atom table: equals operand empty (1); boundary atom table: equals first operand is not a path string (1); boundary atom table: equals with three operands (1); boundary atom table: in, set is not an array (1); boundary atom table: range, lo above hi (1); boundary atom table: range, a bound is a string (1); boundary atom table: range with two operands (1); boundary atom table: before, bound is not a timestamp (1); boundary atom table: within, a bound is not a timestamp (1); boundary atom table: within_days, days is a string (1); boundary atom table: expired, value is not a timestamp (1); boundary atom table: within_last, duration "7 days" (1); boundary atom table: age_lt, duration "7y" (no year unit) (1); boundary atom table: all(false, malformed): the structural fault decides first (1); boundary atom table: all operand is not an array (1); boundary atom table: an atom with two operators (1); boundary atom table: an atom that is not an object (1); boundary atom table: 2.x range without hi (1); boundary atom table: 2.x range, lo above hi (1); boundary atom table: 2.x in, set not an array (1); boundary atom table: 2.x after, value not a timestamp or "now" (1); boundary atom table: 2.x within_days, days a string (1); boundary atom table: 2.x equals with an extra key (1); boundary atom table: 2.x path empty (1); legacy sig with a field outside its schema (1); structure: text that is not JSON (1); structure: JSON text that is an array (1); structure: JSON text that is a string (1); structure: hdr absent (1); structure: hdr is a string (1); structure: hdr.bundle_id absent (1); structure: hdr.spec_ver absent (1); structure: meta absent (1); structure: hdr.spec_id is not PROOFBUNDLE (1); structure: hdr.spec_id absent on a sealed (non-legacy) bundle (1); structure: seal is a string (1); structure: seal.digest_alg absent (1); structure: a native seal without its key (1); structure: seal.digest_b64u with padding (not the base64url alphabet) (1); structure: meta and seal name different digest algorithms (1); structure: seal._engine is not a string (1); structure: seal.digest_alg empty (1); structure: seal.pub_b64u a number (1); structure: seal.pub_b64u with padding (not the base64url alphabet) (1); structure: seal.signature_b64u with a "+" (not the base64url alphabet) (1); structure: meta and seal name different signature algorithms (1); crypto: meta.witness_binding without a key (1); structure: key-beside refs not an array (1); certificate: a check status that is not defined (1); timestamp: a check status that is not defined (1); validity: meta.expiration not a timestamp (1); validity: meta.not_before not a timestamp (1); lineage: a reference with no parent_id (1); prediction: an observation whose "falsified" is not a boolean (1); witness: without its signature (1); witness: a string, not an object (1); structure: legacy sig is a string (1) |
| NONCANONICAL | 655 | the same bundle supplied as JSON text with whitespace (150); disclosure: leaves out of ascending path order (150); disclosure: a withheld leaf hash re-spelled with a nonzero unused trailing bit (130); seal.pub_b64u re-spelled with a nonzero unused trailing bit (same bytes, non-canonical base64url) (120); seal.signature_b64u re-spelled with a nonzero unused trailing bit (same bytes, non-canonical base64url) (90); canonical: a payload string not in NFC (e + combining acute) (1); canonical: a payload key not in NFC (1); base64url: merkleRoot padded with "=" (1); base64url: merkleRoot with a character outside base64url ("$") (1); base64url: seal.witness.pub_b64u padded with "=" (1); base64url: seal.witness.pub_b64u in the standard alphabet ("+" "/") (1); base64url: seal.witness.pub_b64u with a character outside base64url ("$") (1); base64url: seal.witness.signature_b64u padded with "=" (1); base64url: seal.witness.signature_b64u in the standard alphabet ("+" "/") (1); base64url: seal.witness.signature_b64u with a character outside base64url ("$") (1); base64url: legacy sig.sig padded with "=" (1); base64url: legacy sig.sig in the standard alphabet (1); base64url: legacy sig.sig with "$" (1); base64url: legacy sig.pub padded with "=" (1); base64url: legacy sig.pub with "$" (1) |
| UNSUPPORTED_VERSION | 151 | native envelope claiming spec 1.1.0 (a legacy-only version) (150); legacy envelope claiming spec 2.1.0 (1) |
| UNKNOWN_VERSION | 150 | spec_ver 99.0.0 |
| UNSUPPORTED_ALGORITHM | 450 | digest_alg SM3 (registered, not implemented in this client) (150); sig_alg Falcon512 (registered; not executable in this client until its from-scratch implementation lands) (150); sig_alg SLH-DSA-SHA2-128f (registered; not executable in this client until its from-scratch implementation lands) (150) |
| UNKNOWN_ALGORITHM | 301 | digest_alg SHA-999 (not registered) (150); sig_alg Lamport-9 (not registered) (150); gating: meta.encryption names an unregistered key encapsulation (1) |
| DEPRECATED_ALGORITHM | 317 | verified in 2032 (after ‹alg› deprecation) with deprecated algorithms refused (105); verified in 2037 (after ‹alg› is disallowed) with no time anchor (105); PB-REGULATED-1 verified in 2032: the profile refuses deprecated ‹alg› (105); migration: verified at the first instant ‹alg› is disallowed (2036-01-01T00:00:00Z) (1); migration: deprecated algorithms refused, verified at the first instant ‹alg› is deprecated (2031-01-01T00:00:00Z) (1) |
| FORBIDDEN_ALGORITHM | 302 | digest_alg SHA-1 (recognized and refused) (150); ‹alg› declared broken from 2026-10-01, no time anchor (150); migration: ‹alg› broken from 2026-10-01, trusted time anchor at exactly that instant (not before it) (1); migration: ‹alg› broken from exactly the verification time (1) |
| DIGEST_MISMATCH | 1,050 | payload changed after sealing (150); seal.digest_b64u altered, content and signature untouched (isolates the digest comparison) (150); sealed and signed over a merkleRoot that is not the root of hdr/meta/payload (isolates the Merkle comparison) (150); disclosure: a disclosed value changed (150); disclosure: the salts of two disclosed fields swapped (150); disclosure: a withheld leaf hash altered (150); key-beside envelope, payload changed after sealing (150) |
| INVALID_SIGNATURE | 602 | one signature byte flipped (150); primary and bound witness signatures both flipped (150); disclosure: one signature byte flipped (150); key-beside envelope, a different key supplied (150); legacy 1.1.0 envelope, payload changed after signing (1); signer: native bundle verified under a supplied key that did not seal it (1) |
| MISSING_SIGNATURE | 153 | seal.signature_b64u deleted (150); structure: no seal and no sig (1); structure: seal.signature_b64u empty (1); structure: seal.signature_b64u a number (1) |
| INSUFFICIENT_SIGNATURES | 152 | bound witness removed after sealing (150); signatures: two required, the primary alone present (1); signatures: three required, two present (1) |
| UNEXPECTED_SIGNER | 601 | content changed and resealed under another key; the expected signer is supplied (150); bound witness replaced by another key after sealing (150); disclosure: the same record sealed by another key, the original signer expected (150); a different signer was expected (150); legacy 1.1.0 envelope, another expected signer supplied (1) |
| UNKNOWN_SIGNER | 300 | content changed and resealed under another key; a trust set holding only the original key is supplied (150); sealing key not in the supplied trust set (150) |
| REVOKED_KEY | 150 | sealing key revoked in the trust set |
| EXPIRED_KEY | 151 | sealing key validity ended 2026-10-01 (150); signer: key validity ended one second before the verification time (1) |
| KEY_NOT_YET_VALID | 150 | sealing key valid only from 2027-01-01 |
| CERTIFICATE_INVALID | 150 | issuer certificate checks invalid |
| CERTIFICATE_PATH_INVALID | 150 | issuer certificate path invalid |
| CERTIFICATE_UNTRUSTED | 150 | issuer certificate chains to no trusted root |
| CERTIFICATE_REVOCATION_INDETERMINATE | 150 | issuer certificate revocation status unavailable |
| TIMESTAMP_INVALID | 150 | declared time anchor checks invalid |
| TIMESTAMP_UNTRUSTED | 150 | declared time anchor from an untrusted source |
| TIMESTAMP_INDETERMINATE | 302 | time anchor required and still pending (150); PB-INTEGRITY-TEMPORAL-1, anchor declared, no anchor check supplied (150); timestamp: required by the caller, declared, no check supplied (1); timestamp: PB-INTEGRITY-TEMPORAL-1, anchor declared, no check supplied (1) |
| BUNDLE_EXPIRED | 152 | meta.expiration 2026-10-15, verified 2026-11-01 (150); validity: meta.expiration exactly the verification time (1); validity: meta.expires_at exactly the verification time (1) |
| BUNDLE_NOT_YET_VALID | 151 | meta.not_before 2027-01-01 (150); validity: meta.not_before one second after the verification time (1) |
| LINEAGE_INVALID | 302 | child commits to a parent digest the supplied parent does not have (150); diamond whose second edge to the shared root commits to a wrong digest (root already verified through the first edge) (150); lineage: a parent referenced by id whose own integrity fails (1); lineage: key-beside parent, no key, referenced by id alone (nothing binds it) (1) |
| LINEAGE_CYCLE | 150 | child → parent → child |
| LINEAGE_MISSING | 150 | child references a parent that is not supplied |
| ANCESTOR_UNAVAILABLE | 150 | lineage store unreachable |
| PAYLOAD_MISSING | 152 | meta commits to a payload digest, payload deleted (150); structure: native payload null (1); structure: key-beside envelope without a payload (1) |
| SIDE_INFORMATION_MISSING | 459 | boundary requires context operator_id, not supplied (150); any(present operator_id, env=production): operator_id absent, env=test — undecided (150); key-beside envelope, no key supplied (150); boundary atom table: present, value null (1); boundary atom table: present, value "" (1); boundary atom table: present, path absent (1); boundary atom table: all(true, missing) is undecided (1); boundary atom table: 2.x present, absent (1); auxiliary: side attestations required, none carried (1); auxiliary: side attestations required, an empty list (1); auxiliary: aux item not supplied (1); auxiliary: aux item supplied with other bytes (1) |
| POLICY_DENIED | 632 | boundary env=production, context env=test (150); all(present operator_id, env=production): operator_id absent, env=test — the false conjunct decides (150); PB-REGULATED-1 without any human approval (150); PB-REGULATED-1 approval expired 2026-10-20 (150); boundary atom table: equals, value different (1); boundary atom table: equals, path absent (1); boundary atom table: equals, number 1 against string "1" (1); boundary atom table: in, value not a member (1); boundary atom table: in, path absent (1); boundary atom table: range, value just below lo (1); boundary atom table: range, value just above hi (1); boundary atom table: range, value a numeric string (1); boundary atom table: range, path absent (1); boundary atom table: before, equal time (1); boundary atom table: after, equal time (1); boundary atom table: after, earlier (1); boundary atom table: before, context time does not parse (1); boundary atom table: within, one second before the start (1); boundary atom table: within, one second after the end (1); boundary atom table: within_days 30, one second more than 30 days before now (1); boundary atom table: within_days 30, path absent (1); boundary atom table: expired, one second after now (1); boundary atom table: not_expired, time equal to now (1); boundary atom table: expired, path absent (1); boundary atom table: not_expired, path absent (1); boundary atom table: within_last 7d, one second older (1); boundary atom table: age_lt 7d, exactly 7 days old (1); boundary atom table: within_last 7d, path absent (1); boundary atom table: any of nothing (1); boundary atom table: a top-level array is all: one false (1); boundary atom table: 2.x equals, different (1); boundary atom table: 2.x in, not a member (1); boundary atom table: 2.x range, numeric string (1); boundary atom table: 2.x before "now", equal time (1); policy: a regulated approval expiring exactly at the verification time (1); policy: a required context value false (1) |
| POLICY_INDETERMINATE | 150 | policy needs context approval_ok, not supplied |
| RESOURCE_EXHAUSTED | 467 | one parent, max_depth 0 (150); diamond with max_containers 2 (three distinct ancestors) (150); shortcut: child → root and child → parent → root, max_depth 1 (longest path 2; the root is first reached by the short edge) (150); ladder DAG with max_containers 28 (15); lineage: one parent, opts.max_depth 0 (1); lineage: ancestor bytes over max_bytes (1) |
| LIMIT_EXCEEDED | 157 | max_bundle_bytes 100 (150); payload nested 600 deep, supplied as an object (1); payload nested 600 deep, supplied as JSON text (1); nesting: payload reaching depth 501, as an object (1); nesting: payload reaching depth 501, as canonical JSON text (1); limits: max_nesting 1 on a bundle of depth 2 (1); limits: max_bundle_bytes one below the canonical size, object input (1); limits: max_bundle_bytes one below the text size, text input (1) |
| PROVIDER_UNAVAILABLE | 150 | provider for ‹alg› marked unavailable |
| EXTERNAL_SERVICE_UNAVAILABLE | 151 | side-information store unreachable (150); auxiliary: aux store unreachable (1) |
| EVIDENCE_INCOMPLETE | 454 | disclosure: meta.expiration withheld (verification acts on it) (150); issuer certificate declared, no certificate check supplied (150); PB-INTEGRITY-TEMPORAL-1 declares no time anchor (150); timestamp: required by the caller, none declared (1); timestamp: PB-INTEGRITY-TEMPORAL-1 with no time anchor declared (1); auxiliary: a side attestation without its signature (1); prediction: no falsification condition (1) |
| NEGATIVE | 150 | prediction falsified by the supplied observation |
| NULL | 151 | prediction with no observation supplied yet (150); prediction: claim_type on a PB-INTEGRITY-1 bundle, no observation yet (1) |
| INDETERMINATE | 451 | bound witness signature flipped, primary valid (the layers disagree) (150); primary signature flipped, bound witness valid (the layers disagree) (150); expiry must be evaluated, supplied time required and not given (150); boundary atom table: a time atom when a supplied time is required and none is given (1) |
| NOT_DEFINED | 304 | profile PB-UNDEFINED-9 (150); boundary atom "teleport" is not defined (150); boundary atom table: atom "teleport" in a nested connective (1); boundary atom table: 2.x "within" (no 2.x form) (1); boundary atom table: 2.x unknown operator (1); gating: canonical_encoding XML-C14N is not defined (1) |
| INTERNAL_ERROR | 0 | not constructed — reached only when the verifier itself throws; no input is built to cause that |

## The boot self-test

The self-test runs on every page load, in the browser that will use the client, before anything is sealed. It is derived rather than chosen:

- **Every primitive against outside answers.** One known answer per primitive, one per parameter set: the SHA-2 and SHA-3 families, SHAKE, BLAKE2 and BLAKE3 through the same dispatch the verifier uses; HMAC, HKDF and PBKDF2; AES-256-GCM and ChaCha20-Poly1305 sealing, opening and refusing an altered tag; Poly1305; X25519; Ed25519, ECDSA P-256/384/521 and RSA-PSS, each in its module and through the verifier's dispatch, with an altered signature refused; ML-KEM-512/768/1024 key generation, encapsulation and decapsulation, with implicit rejection at 768; ML-DSA-44/65/87 key generation and signature verification from NIST ACVP. The answers come from independent implementations (Python hashlib and cryptography) and from NIST ACVP, and the data records its sources.
- **Verdicts from the definition.** The quick slice of the definition replaces hand-written verdict checks.
- **One seal made in this browser.** A fresh key seals a bundle and the verifier returns VERIFIED under that producer key.
- **Features the definition does not reach.** Archives, verification reports, the action chain, the AI-BOM gate, sealed predictions, Merkle inclusion proofs, and the dual-signature sealer keep their own checks.

## Producers and the trust set

A verified result names what anchored its signer: the expected signer, a producer key entered in the Verify tab, a producer in the trust set, or nothing beyond the key the bundle carries (VERIFIED_WITH_WARNINGS, `signer.self_carried`). The Verify tab keeps the trust set in the browser: producers by name, algorithm and fingerprint, added by hand, from a client key file (public half only) or from the bridge registry (`~/.proofbundle/bridge/registry.json`), where each key is admitted only if its fingerprint equals the registry's. The fingerprint is the first 16 bytes of SHA-256 over the key in the form the registry records it, so the two show the same string. A verified result shows who sealed it and on what basis; a refused one is explained by its causes.

Verification does not wait on local custody. The custody workbench records each verification input and each action-chain entry, and those records are written once custody is unlocked; the verdict is returned at once, so a person who only verifies a receipt needs no signing key.

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

- **The Rust workspace.** The definition is a plain JSON file whose cases carry their bundles, options and parents, so any implementation can run it.
  - **Where it is.** The 32-crate workspace (manifest sha256 89423f4b…, crates named `gpx-*`) is the genophylaxis workspace. The Google Drive listing of 2026-08-22 has it under `VM_FULL_20260626/genophylaxis-src/` and `VM_BUILT_ARTIFACTS_20260627/genophylaxis_source_crates/`.
  - **Not run.** It was not fetched or built here, and the definition has not been run there.
  - **Not checked.** Whether any of its crates reads ProofBundle 1.0.0 envelopes was not checked.
  - **The staged Rust.** `src/proofbundle/rust` is the custody CLI, and it does not read them.
  - **Naming.** The crate names are recorded verbatim in the client's algorithm-synthesis data. The client has no other gpx naming.
- **Aletheia naming.** The workbench still uses `aletheia` element ids and the desktop bridge name `window.aletheiaDesktop` (with its preload methods `clipboardWrite` and `sourcePath`), and the desktop's custody signatures use `ALETHEIA-*` domain-separation strings. The bridge names are defined by the desktop preload, so they keep their spelling until the preload changes with them. Renaming the domain strings changes what existing custody signatures cover, so it needs dual acceptance during the change. Neither was done here.
- **Adapter API names.** `window.ProofBundle` keeps its name; the methods on it are now snake_case like the rest of the client. An adapter written against the camelCase methods needs their new names.
