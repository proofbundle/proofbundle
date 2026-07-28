# Corpus state — read this first

**Compiled 2026-07-28.** This file exists so the state of the proof corpus and the
crypto core does not have to be reconstructed from memory, chat scrollback, or a
laptop that may not boot. It supersedes ad-hoc summaries. Where two sources
disagree, the disagreement is recorded here rather than silently resolved.

Every number is labelled with how it is known:

- **[verified here]** — recomputed in this repository from a tracked artifact.
- **[relayed]** — taken from an audit artifact, not independently re-run. Coq and
  Lean are not installed in the environment that produced this file, so no compile
  status is re-derived here.

---

## 0. The numbers that are safe to publish

Short list, because the corpus contains several plausible-looking numbers that do
not survive checking. These do.

| claim | value | basis |
|---|---|---|
| Distinct theorem names in the corpus | **533** | [verified here] |
| …with at least one compiling home | **325** | [verified here] |
| …with no compiling copy anywhere | **208** | [verified here] |
| Statements across the 41 compiling files | **528** | [verified here] |
| …closed under the global context | **473** | [verified here] |
| …axiom-dependent | **55** | [verified here] |
| Distinct axiom names in the surface | **11** (9 bespoke + 2 Coq stdlib) | [relayed] |
| Independent `Print Assumptions` logs | **161**, all closed | [verified here] |
| GPX Coq theorems kernel-closed | **65 of 83** | [relayed, logs attached] |
| Crypto core self-tests | **173 pass / 0 fail** | [verified here] |

**Do not publish 551.** See section 3.2 — it is wrong in both directions.

---

## 1. Crypto core — recovered and verified

The from-scratch FIPS 202 / FIPS 203 implementation is in [`crypto/`](../crypto/).
Recovered from archive copies and **byte-identical to its manifest**.

**[verified here]** SHA-256 recomputed and matched for `keccak.mjs` (5,000 B),
`mlkem.mjs` (14,026 B), `t_keccak.mjs`, `t_mlkem.mjs`, `t_ref.mjs`, and the 88KB
`ref_vectors.json`. Tests re-run on Node v22.22.2: **88 + 40 + 45 = 173 pass, 0 fail**,
reproducing the recorded figures exactly. `RESULTS.txt` is the one manifest entry that
differs (109 B against a recorded 54); it is regenerated summary text, not source, and
is deliberately untracked. No source file diverges.

This closes the largest recovery gap — the crypto core is no longer only on
unreachable storage.

### Say the dependency claim precisely

"Zero dependencies" is **not** true yet, and the accurate sentence is stronger because
it survives someone reading the imports:

    from scratch : SHA-256 + RFC 6962 Merkle (pbhash) · SHA3/SHAKE (keccak) · ML-KEM (mlkem)
    still noble
    or WebCrypto : SHA-512 · BLAKE2/BLAKE3 · Ed25519 · ECDSA P-384 · ML-DSA · Falcon · SLH-DSA

Publishable form: *every hash and the KEM are ours, verified against independent
implementations.*

### Next primitive: SLH-DSA

It is hash-based and nothing else — SHA-2 and SHAKE are its entire primitive base,
both of which `keccak.mjs` now supplies verified. No field arithmetic, no lattice, no
curve; Merkle bookkeeping over a hash that already works. Cheapest of the five
post-quantum schemes by a wide margin and the one resting on the weakest security
assumption. It is also the only one that would let a signature path ship with zero
third-party code.

Note ML-KEM does not sign, so it does not replace the noble-pq signature path. It
fills a hole the spec already cut: GPX-SPEC Subclause 87 (Confidential Provenance)
defines commit/prove/verify and leaves the proof system open. A KEM is what belongs
there.

---

## 2. mc108 Coq corpus — authoritative numbers

The governing artifact is the **independent re-verification of 2026-07-06T02:45:10Z**
(Coq 8.18.0 / OCaml 4.14.1, fresh container) with its per-file table.

    CUSTODY      anchor 173d23e8… verified; 99/99 hashes match MANIFEST.sha256   [relayed]
    COMPILE      41 / 88 RC0   (generated ledger said 40/88)                     [relayed]
    ASSUMPTIONS  528 statements → 473 closed, 55 axiom-dependent                 [verified here]

**[verified here]** The totals reconcile exactly against the per-file table: 41 files,
528 statements, 473 closed, 55 axiom-dependent, `473 + 55 = 528` with no residue.

### Count distinct names, not files

File-level counts mislead, because `_b`/`_c`/`_d` families are the same theorems under
different ordinals. **[verified here]** Deduplicating by theorem name across the whole
index gives **533 distinct names, 325 with at least one compiling home, 208 with
none.** The 208 are the real recovery surface. This reproduces an earlier independent
count exactly.

### Why the denominator is 88 and not 108

**[verified here]** The sweep scanned `f001`–`f108`, all 108 present. Twenty —
`f001`–`f018`, `f070`, `f071` — fail with `Syntax Error: Lexer: Undefined token` at
line 1, character 0: not recoverable text at all, consistent with a byte-order mark or
smart quote at the first byte. `108 − 20 = 88`. The contiguous `f001`–`f018` block
points at one transfer event rather than eighteen separate problems.

### `f035` — move it to OK

Recorded `FAIL` by the generated ledger (type error, line 216) but compiles clean in
the independent audit, isolated directory, byte-identical to the hash-pinned copy.
**Treat as OK.** The ledger was *under*-claiming. That releases 8 theorems including
`full_independence` and `condition_independence_C1..C5`. **[relayed]**

### Exactly one genuine incomplete proof

Of the 68 non-compiling files, the failures are dominated by missing load paths and
unresolved identifiers — dependency ordering, not false theorems. **[verified here]**
The error taxonomy shows exactly one `Attempt to save an incomplete proof`:
`corruption_transitive`, in the `f055` architecture-exclusion family.

---

## 3. Three assumption datasets — do not mix them

Conflating these produces wrong numbers, and it has happened repeatedly.

### 3.1 The independent run (2026-07-06) — **the authority**

Clean, uncapped, covers `f019`, reports `f026`/`f058` at their true 43 statements.
Its totals reconcile. All numbers in section 2 come from it.

### 3.2 The archived run (`audit/axresult.txt`) — **unusable as a count**

**[verified here]** This artifact is wrong in *both* directions simultaneously, so
the 551 "Closed under the global context" lines it contains are not a theorem count
and **must not be published as one**.

*Truncated downward.* The producing script pipes each file through `head -n 40`.
Four files hit that cap against a larger declared count — `f026` (40 shown / 43
declared), `f058` (40/43), `f065` (40/40), and most starkly `f036` (40 shown against
**151** declared).

*Inflated upward.* Five files report **more** closed lines than they have declared
statements, four of them at exactly double:

    f027   20 closed / 10 declared      f041   40 closed / 20 declared
    f037   32 closed / 16 declared      f076   40 closed / 20 declared
    f029   40 closed / 22 declared  (capped; would be 44 = 2 x 22)

The exact-doubling signature means the name scraper emits two `Print Assumptions`
per statement — its `grep -oiE` is case-insensitive and matches prose and duplicated
declarations, not only real ones. So 551 is neither a ceiling nor a floor. Removing
the `head -n 40` cap alone would *not* fix it; the scraper needs fixing too.

Two further defects in the same artifact: `f019` compiles but is **absent from the
script's hardcoded file list**, so it was never audited there at all; and seven files
errored during the audit recompile itself (`AUDRC != 0`) — `f036 f065 f079 f080 f089
f091 f094` — with `f089` and `f091` producing **zero** data.

A corrected script was written in an earlier session but **did not survive**: all
three copies of `axaudit.sh` in the uploaded archive are byte-identical and still
carry the cap. A reconstruction that removes the cap, discovers files from disk, and
counts declarations without double-matching is now tracked at
[`tools/axaudit.sh`](../tools/axaudit.sh).

### 3.3 The independent per-module logs — clean

The seven `*_print_assumptions_INDEPENDENT.log` files in [`docs/logs/`](logs/):
**161 statements** across Structural, TrackB, Hardening, Phronesis, Dimensional,
Recovery and BoundaryPredicates_fixed, **every line** `Closed under the global
context`, no axioms. **[verified here]** — two separately uploaded copies of this log
set are byte-identical to each other.

---

## 4. The axiom surface is smaller than it looks

Three different quantities get called "the axiom count". They are all correct and
they are not the same number:

- **11 distinct axiom names** in the whole surface — **9 bespoke, 2 Coq stdlib**.
  The stdlib pair (`ClassicalDedekindReals.sig_forall_dec`, `functional_extensionality_dep`)
  arrive the moment you `Require Import Reals`; neither is an assumption about the
  subject matter. **Split stdlib from bespoke wherever a count is published** — it
  removes the easiest objection anyone can make and costs nothing. **[relayed]**
- **55 statements** depend on some axiom. **[verified here]**
- **11 files** carry a real axiom dependency — as against the 44 flagged by the crude
  grep (section 5). **[relayed]**

The bespoke surface is led by `uuid_global_freshness` at **9 sites**, which the
March audit already justifies correctly: it is a runtime property of the monotonic
UUID counter, verifiable by inspecting the generator, not a mathematical assumption.

### Twenty of the 55 need no new proof work

The standing priority list names three concentrations — `f062` (8), `f073` (8),
`f047` (6). Most of that is already discharged.

**`f104` already discharges `f073` — 8 statements, zero cost.** **[verified here]**
`f073` and `f104` are the same family and their statement lists in `theorem_index.txt`
are identical: the same 15 names in the same order, `walk_terminates` through
`every_sig_has_partner`. But:

    f073   15 statements    7 closed    8 axiom-dependent
    f104   15 statements   15 closed    0 axiom-dependent

`f104` proves the identical 15 statements with **zero axioms**. The 8-axiom surface
attributed to this family is an artifact of citing the weaker twin. In particular
`cycle_rejected` — the result the property index singles out here — is axiom-free in
`f104`. Prose describing the family as "carries 8 user axioms; also Admitted-bearing"
is true of `f073` and false of `f104`.

**The `aud_047` rebuild extends to `f062` — 6 more.** `aud_047_axiom_discharged.v`
(tracked at [`docs/`](aud_047_axiom_discharged.v)) rebuilds `f047` with every
`Parameter` as a section `Variable`, every `Axiom` as a section `Hypothesis`, and the
compose laws restated pointwise to drop `functional_extensionality` at the point of
use. Result: 0 user axioms, residual trust base only the two stdlib entries.
**[relayed]**

**[verified here]** `f047`'s six statements are `state_eq`, `compose_assoc`,
`compose_id_left`, `compose_id_right`, `boundary_trichotomy`, `admissible_iff`. `f062`
is **those same six plus two**: `compose_Witness` and `compose_admissible`. `aud_047`
already closes all six.

    55  axiom-dependent statements
    -8  f073 → prefer f104            no proof work; a naming decision
    -6  f047 → aud_047 rebuild        already written and verified
    -6  f062 → same rebuild pattern   transcription, not proof work
    ──
    35  remaining, of which exactly 2 (compose_Witness, compose_admissible)
        are new obligations inside the three named concentrations

---

## 5. Compile-clean is not proof-clean — and the grep is not the test

Six RC0 files carry `Admitted` despite compiling: `f023 f049 f053 f061 f066 f073`.
**[relayed]** Do not flatten that distinction in any summary.

But the `SRCHOLE` column that produced the `+A` marks is a case-insensitive grep for
`admit|admitted|sorry|oops|postulate` — it fires on the word appearing anywhere,
comments included. **[verified here]** It flags **18 of the 40** RC0 files, not 6,
including `f019 f026 f027 f036 f037 f042 f058 f060 f065 f079 f080 f104`. Across the
whole corpus it flagged 44 files where `Print Assumptions` finds 11.

**Every `+A` mark in the rename maps inherits from that grep and should be
re-derived** from `Print Assumptions`. Same direction of error as the `f035` note:
the ledger under-claims.

---

## 6. Highest-value damaged set — the motion-operator algebra

Three files are the **only** formalization of the operator algebra anywhere in the
corpus, and **none compiles**: **[relayed]**

    f022.v  motion_root_attestation     11 stmts   46 core operator IDs
    f048.v  registry_wellformedness     14 stmts   tier system, support/clarity/drift
    f056.v  gress_core_eligible         15 stmts   8 operators, per-root support

Roots attested: gress · scend · mit · morph · vert · struct. Reported cause is
transfer-level syntax corruption — mechanical to repair, and no compiling copy exists
to fall back on.

Other families with no compiling survivor: `canonicalize_idempotent` (`f072 f090
f102`), `verify_profile_terminates` (`f075 f092 f103`), `admissibility_closure`
(`f045 f057`). Everywhere else a `FAIL` twin has an `OK` sibling, so recovery is a
copy, not proof work.

---

## 7. GPX bundle — 65 of 83

**[relayed]** Coq 8.18.0 was installed and run against the GPX bundle — the first
time a kernel touched those files. Both Coq files failed *as shipped*, with the same
defect: `subst` applied to unreduced record projections, so hypotheses read
`g_auth {| g_auth := a; … |} = APass` instead of `a = APass` and the tactic does not
fire. One line each:

    GPXBoundary.v:334   42/42 closed after repair
    GPXTemporal.v:223   23/23 closed after repair
    GPXGrace.v          systematic form of the same class — simpl does not reduce
                        effective/grant_grace/raw; fails at 149, then 163, onward.
                        18 theorems stay source_only.

Zero forbidden axioms, zero admits, counts match the manifest exactly. Everything
marked `executed` reproduced: z3 19/19 unsat plus the refutation sat with witness
`b1=100 b2=1`, exhaustive 39/39, the CVE-2012-2459 PoC colliding in both original
implementations and not in the RFC 6962 form, pbhash 0 divergences over 7,000 inputs.
Derived constants equal the FIPS 180-4 tables — the prime-root BigInt derivation
reproduces `428a2f98 71374491 b5c0fbcf e9b5dba5` and all eight `H` values.

Lean 4.12.0 was not installed, so the 58 Lean theorems remain `source_only`. Since
both Coq files failed as shipped on the same class of defect, **assume the Lean
mirrors fail until `lake build` is run.**

---

## 8. Known documentation drift

Recorded so it is not rediscovered a fourth time:

- **A stale `AUDIT.md`** in the GPX bundle claims "Z3 5.0.0, 14/14 unsat" and "21/21
  statements" where the real figures are **19/19 and 39/39**. It is absent from its
  `MANIFEST.json` file list, so no hash binds it and nothing detects the drift.
- **`smt/gpx_boundary.smt2` is marked `solver_checked` but never executes.**
  `tools/z3_check.py` line 7 reads `open(...smt2...).read() if False else """..."""`.
  The shipped `.smt2` holds declarations only — no assert, no check-sat — so running
  the command `AUDIT.md` gives returns `sat` on an empty assertion set and establishes
  nothing. The real obligations are inline in the Python.
- **pbhash vector count.** The manifest says "NIST FIPS 180-4 vectors 5/5";
  `selfTest()` returns `{pass: 4}` — three NIST vectors plus one CVE regression.
  Nothing shipped reproduces 5.
- **Gold Archetype monograph vs proof-status ledger.** The monograph (2026-07-23)
  lists T6 and T7 as open; the ledger (2026-07-25) records both mechanically checked
  with unsat saved. **The ledger is the later value.**
- **`C1`–`C4` closure constraints are interpretive** and explicitly *not* mechanized.
  Keep it that way in any external document.

---

## 9. Release mechanics — no key required

**[relayed]** Signing is solved and needs no key material. `release.yml` signs with
**Sigstore keyless**: identity comes from GitHub's OIDC token inside the Actions
runner and the signature goes to Rekor, the public transparency log. Nothing to
generate, store, back up, or protect. Tagging `v1.0.0` from the GitHub web UI — phone
is sufficient — runs the self-test, builds artifacts, writes `SHA256SUMS`/`SHA512SUMS`,
signs every file, attaches SLSA build provenance, and publishes.

For someone with no working computer and nowhere safe to keep a key this is strictly
better than a key: there is nothing to lose and the record is public. The existing
`cosign.pub` is not needed.

Note `VERIFYING.md` currently documents the key-based `cosign verify-blob` path and
still calls `cosign.pub` a placeholder. It should be rewritten to the three-tier form:
hash check with no tools, `cosign verify-blob` with identity pinned to the repo, and
`gh attestation verify` for provenance.

---

## 10. What is still only in one place

Not yet mirrored here, and worth pulling in first:

- `mc108_compiled_proofs_20260627.tar.gz` — the `.v` sources. Without them no compile
  claim can be independently re-derived and the `SRCHOLE` question cannot be settled.
- The three motion-root files (section 6) — highest value, unrecoverable from anything
  tracked here.
- SMT proof objects for T1/T2 and unsat records for T5–T8.
- The lost signature work. If it is rebuilt, do **SLH-DSA first** (section 1).

---

## 11. Layout

    crypto/                  from-scratch FIPS 202 / FIPS 203 + tests + manifest
    docs/CORPUS-STATE.md     this file
    docs/aud_047_axiom_discharged.v
    docs/logs/               independent Print Assumptions logs (161 statements, all closed)
    tools/axaudit.sh         reconstructed assumption sweep — no cap, no double-count
