# Audit log

Every entry below is a defect that was found in this codebase, how it was found,
what the fix was, and what re-verification showed. Nothing here is a projection
or a plan. Entries are appended, never edited or removed.

Method: findings are established by running the code against an independent
reference implementation, not by reading it. Where a claim could not be
established that way, it is recorded as unverified rather than assumed.

---

## PB-2026-07-06-001 — Ed25519 fallback: base point not on the curve

**Severity** critical · **Component** pure-JS Ed25519 fallback · **Status** fixed

The base point constants `GX` and `GY` in the pure-JavaScript Ed25519 path were
not points on curve25519. The fallback is used when SubtleCrypto lacks Ed25519
support, and it is reached through a bare `try`/`catch`, so the failure was
silent — signatures were produced and rejected with no diagnostic.

**Found by** re-implementing the curve arithmetic in Python and checking the
stated constants against the curve equation, then against libsodium/PyNaCl.

**Fix** constants replaced with the RFC 8032 values.

**Re-verified** RFC 8032 test vectors 1–3 pass; sign/verify round trip agrees
with PyNaCl byte for byte.

---

## PB-2026-07-06-002 — Ed25519 point decode: wrong square-root branch

**Severity** critical · **Component** pure-JS Ed25519 fallback · **Status** fixed

`pt_decode` used the wrong candidate-root formula from RFC 8032 §5.1.3. The
implementation could not decode points it had itself encoded.

**Found by** round-tripping encode/decode against the reference implementation
after PB-2026-07-06-001 was fixed; the failure was still present, which showed
the two defects were independent.

**Fix** corrected to the RFC 8032 candidate-root method.

**Re-verified** RFC 8032 vectors 1–3; decode of every encoded point matches.

---

## PB-2026-07-06-003 — Signature comparison was not constant time

**Severity** high · **Component** pure-JS Ed25519 fallback · **Status** fixed

Signature bytes were compared with an early-exit loop. Comparison time varied
with the position of the first differing byte.

**Fix** constant-time comparison over the full length.

**Also added** a boot-time RFC 8032 known-answer test. If it fails, the fallback
is poisoned rather than left available, so this class of defect cannot recur
silently.

**Re-verified** 65/65 boot self-tests, 660/660 conformance cases across 9
digests and 10 signature schemes.

---

## PB-2026-07-15-001 — OpenTimestamps proof was malformed

**Severity** high · **Component** .ots serialization · **Status** fixed

The generated `.ots` file carried a spurious length prefix on the digest and a
duplicate SHA256 operation. The reference `opentimestamps` Python library
rejected it with `Unknown unary op tag 0x20`.

**Found by** submitting the generated file to the reference library rather than
assuming the format was right.

**Fix** structure corrected by byte-diffing against a known-good file produced
by the reference library.

**Re-verified** single- and dual-calendar `.ots` files parse cleanly in the
reference library, including a file captured from the running browser app.

---

## PB-2026-07-15-002 — Conformance vector file targets an older schema

**Severity** medium · **Component** conformance fixtures · **Status** open

The 1,097-vector file was written against `spec_ver 1.0.0`. Under the current
engine it lacks `bundle.seal.pub_b64u` and `bundle.merkleRoot`, and its keys are
SPKI-wrapped where the engine expects raw 32-byte form. Three of these were
corrected; a fourth remains, in which the boundary-predicate evaluator receives
an undefined `path` and fails on `path.split('.')`.

**Current state** 436/1097 pass. All 108 vectors of kind `verified` pass, which
is the result that establishes the signing and verification path is correct.

**Not fixed** the remaining gap is schema drift in the fixture file, not a
defect in the engine. Either the file is regenerated against the current schema
or the count stays stated as 436.

**Note** the README previously described this as a 1,097-case suite without
qualification. Corrected.

---

## PB-2026-07-15-003 — RFC 3161 token signature chain is not verified

**Severity** medium · **Component** timestamp anchoring · **Status** open

The RFC 3161 response parser extracts and displays the time asserted by the
timestamp authority. It does not verify the token's signature against the
authority's certificate chain, which requires per-authority CA certificates.

**What is verified** the request is well-formed: OpenSSL parses it as a valid
`TimeStampReq`, and a live authority (freetsa.org) returned `Status: Granted`
with a signed token at 2026-07-15T09:34:23Z.

**Limitation as stated** reading the asserted time is real; proving it is not
yet done.

---

## GPX-MERKLE-0001 — CVE-2012-2459 in two Merkle implementations

**Severity** high · **Component** merkle root construction · **Status** fixed

Two implementations padded odd levels by duplicating the final node, so leaf
sets `[A,B,C]` and `[A,B,C,C]` produce the same root.

**Found by** an executed proof of concept, not by inspection.

**Fix** RFC 6962 construction: odd nodes are promoted unchanged, leaf hashes are
domain-separated with `0x00` and inner nodes with `0x01`, and the leaf count is
committed into the root so tree shape is bound.

**Re-verified** both original implementations collide on 4 of 4 test pairs; the
RFC 6962 form collides on 0 of 4.

---

## GPX-SKETCH-0001 — A stated theorem was false

**Severity** medium · **Component** boundary predicates · **Status** refuted and retained

`budget_composition_preserves_bound` asserted
`b1 ≤ MAX → b2 ≤ MAX → b1 + b2 ≤ MAX`, which is false.

**Found by** Z3, which returned `sat` on the negation with witness
`MAX=100, b1=100, b2=1`.

**Resolution** kept as `naive_compose_refuted` — a machine-checked refutation
rather than a deletion, so the false form cannot silently return. The saturating
form is proved separately.

---

## GPX-2026-07-27-001 — GPXBoundary.v did not compile

**Severity** high · **Component** Coq proofs · **Status** fixed

The file had never been through a kernel; the shipping manifest correctly
recorded it as `source_only` because no `coqc` was present in its build
container. On first contact with Coq 8.18.0 it failed at line 334, in
`overall_pass_iff_all_pass`. After `intros [a c l b d]` the hypotheses have the
form `g_auth {| g_auth := a; ... |} = APass` rather than `a = APass`; `subst`
does not fire on an unreduced projection, so `reflexivity` was left with an
unclosable goal.

**Fix** one line — reduce the projections before substituting.

**Re-verified** `coqc -q GPXBoundary.v` exits 0 with 42 lines
`Closed under the global context` and no other output. Zero axioms, admits, or
sorries.

---

## GPX-2026-07-27-002 — GPXTemporal.v did not compile

**Severity** high · **Component** Coq proofs · **Status** fixed

Same defect as GPX-2026-07-27-001 at line 223, with six hypotheses instead of
five. One-line fix. Exits 0 with 23 closed, none non-closed.

---

## GPX-2026-07-27-003 — GPXGrace.v did not compile (four sites plus one binder)

**Severity** high · **Component** Coq proofs · **Status** fixed

`simpl` does not reduce `effective`, `grant_grace`, or `raw`, so four proofs
that depended on that reduction failed: `grace_cannot_launder`, `grace_scoped`,
`grace_expires`, `grace_not_yet_active`. Separately,
`grace_does_not_weaken_meet` bound `ctx` without using it, so Coq could not
infer its type.

**Fix** explicit `unfold` before each case split; explicit type annotation on
the unused binder. No statement was weakened.

**Re-verified** exits 0 with 18 closed, none non-closed.

**Renamed** the module is now `GPXDiachronic.v`. The vocabulary of grace, mercy,
and pardon was replaced with plain description of the mechanism: a scoped,
attributed, time-bounded, revocable override that sits above the meet and never
enters it. Identifier mapping is in `coq/RENAME.md`. Theorem statements are
unchanged; only names and comments differ.

---

## Documentation defects found in the GPX bundle

**D-1** `AUDIT.md` in the gpx-bundle stated "14/14 unsat" and "21/21 statements"
where the executed counts are 19/19 and 39/39. It was also absent from
`MANIFEST.json`'s file list, so no hash bound it and nothing detected the drift.
Any document that states verification status belongs inside the sealed set.

**D-2** `smt/gpx_boundary.smt2` was marked `solver_checked`, but `z3_check.py`
line 7 reads `... if False else """..."""`, so the shipped file is never read.
The file contains declarations only — no `assert`, no `check-sat` — and running
it returns `sat` on an empty assertion set, which establishes nothing. The 19
obligations that were genuinely solver-checked are inlined in the Python. Status
corrected to `unverified`.

**D-3** The manifest note on `tools/pbhash.js` read "NIST FIPS 180-4 vectors
5/5". `selfTest()` contains three NIST vectors and one CVE regression check and
returns `{pass: 4}`. Nothing shipped reproduces 5.

---

## Claims that were checked and held

Recorded because a defect log that only lists failures is not a verification
record.

- `pbhash.js` derives the SHA-256 round constants and initial values from prime
  roots using exact BigInt integer roots, with no table transcribed from the
  standard. The derived values equal the FIPS 180-4 published tables:
  `K[0..3] = 428a2f98 71374491 b5c0fbcf e9b5dba5`, and all eight `H` values.
- 7,000-input differential against `node:crypto`: 0 divergences.
- Exhaustive model check: 39/39 statements true over their complete finite
  domain.
- Z3: 19/19 obligations unsat, plus the one deliberate refutation sat.
- Bundle verification: 19/19 file hashes match, RFC 6962 Merkle root matches,
  Ed25519 build signature valid.
