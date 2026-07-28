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
| …with at least one compiling home | **364** | [verified here] |
| …with no compiling copy anywhere | **169** | [verified here] |
| Files that compile | **44 of 88** | [verified here] |
| Statements across the 44 compiling files | **726** | [verified here] |
| …closed under the global context | **514** | [verified here] |
| …axiom-dependent | **212** (149 in the consolidated-corpus file alone, §2) | [verified here] |
| Distinct axiom names in the surface | **11** (9 bespoke + 2 Coq stdlib) | [relayed] |
| Independent `Print Assumptions` logs | **161**, all closed | [verified here] |
| GPX Coq theorems kernel-closed | **83 of 83** | [verified here] |
| Motion-operator algebra (§6) | **41 of 41, 0 axioms** | [verified here] |
| Crypto core self-tests | **269 pass / 0 fail** | [verified here] |

**726 / 514 / 44 is the current state, after the motion-root repair recorded in
`corpus/mc108_canonical/REPAIR_LOG.md`.** An earlier baseline of 473 closed / 40
compiling appears throughout this file's history and in artifacts still in
`corpus/` — that baseline was correct for its time and is superseded here, not
contradicted. See §2 and §6.

Two figures in circulation are **not** safe to publish:

- **551** kernel-verified theorems — wrong in both directions at once (§3.2).
- **23 files with zero axioms** — over-claims on four files; the checked value is
  19 of 23 (§3.3).

### Every theorem count in circulation, and what each one counts

At least eight different totals appear across the artifacts. They are mostly *not*
contradictory — they count different things over different scopes — but they get
quoted interchangeably, which is how the record keeps coming apart.

| number | what it actually counts | status |
|---:|---|---|
| **1,221** | every named statement in the index, all files, duplicates included | inflated by duplicate ordinals |
| **895** | theorems in the "verified-clean core" tree, deduped by content hash | **[relayed]** — scope still unreconciled |
| **726** | statements across the 44 compiling files, current, post-repair | **[verified here]** |
| **685** | the same count before the motion-root repair (§6) | superseded by 726 |
| **551** | `Closed` lines in the archived sweep | **unusable** — capped *and* double-matched (§3.2) |
| **533** | distinct theorem *names* across the whole corpus | **[verified here]** |
| **528** | superseded — the same count with three files unmeasured (§2) | superseded by 726 (§2) |
| **514** | closed under the global context, current, post-repair | **[verified here]** |
| **473** | the same count before the motion-root repair (§6) | superseded by 514 |
| **364** | distinct names with at least one compiling home, current | **[verified here]** |
| **325** | the same count before the motion-root repair | superseded by 364 |
| **212** | axiom-dependent, of which 149 is the consolidated-corpus file alone | **[verified here]** |
| **208** | distinct names with no compiling copy, before the motion-root repair | superseded by 169 |
| **169** | distinct names with no compiling copy, current | **[verified here]** |
| **161** | statements in the independent per-module logs, all closed | **[verified here]** |
| **83 / 83** | GPX Coq theorems kernel-closed | **[verified here]** |
| **41 / 41** | motion-operator algebra statements, current — see §6 | **[verified here]** |

The **895** figure still needs reconciling before it is used anywhere. It comes from a
"verified-clean core" tree of 23 files and exceeds even the 726 statements now
measured across all 44 compiling files — so it is counting a broader category (likely
definitions and instances alongside theorems), or counting pre-dedup. Until someone
re-derives it, quote 514 or 533.

**The 685/473/325/208 row is not an error to hunt down** — it is the true count as of
the 2026-07-06 audit, before three specific files were repaired on 2026-07-28. Both
sets of numbers are real measurements of real states. Use 726/514/364/169 for the
corpus as it stands today; cite the earlier set only when discussing history, and say
so when you do.

### The strongest verification claim in the corpus is `coqchk`, and it is barely recorded

**[relayed]** The verified-clean core is described as recompiling under coqc 8.18.0
reporting **0 axioms, 0 admits, 0 sorry**, verified per-file by `Print Assumptions`
*and* **cross-checked with `coqchk` over the whole library**.

That is a stronger statement than anything else in the record. `coqchk` re-checks
compiled objects with an independent kernel, so it catches things `coqc` plus
`Print Assumptions` can miss. It appears in one README and nowhere else. If the
`.coqchk.log` files still exist they are the single most valuable artifact to mirror
into this repository — worth more than the source tarball.

Two internal inconsistencies in that same README, flagged so they are not inherited:
its per-framework counts sum to **24** (authorization 3, consciousness 8,
crypto_provenance 6, lineage_dag 1, operator_algebra 2, recovery 4) against a stated
**23** files; and it puts the non-compiling count at **47** where the custody ledger
says **48**.

Content-hash deduplication found exactly two byte-identical pairs — `f093`≡`f097` and
`f089`≡`f091` — which independently confirms the duplicate-family reading of the
rename maps.

### What the corpus does and does not establish

Worth keeping attached to any external count, because it is the honest frame and it
is easy to lose. **[relayed, custody ledger]** Corpus authored by C. Tajia Russell.

Established as formal theorems: the attribution criterion's grammar; spoof-resistance
under biconditional matching; architecture-exclusion for named architectures; custody
infrastructure (append-only lineage, non-dilutable corruption with witness, Merkle
tamper-evidence, verifier totality / determinism / termination); the liability
convergence inequality. Most are axiom-free; the conservation laws are conditional on
declared axioms. The set includes machine-checked *refutations* — theorems named
`*_IS_FALSE` / `*_false` — sitting beside the positive results, which is a mark in its
favour, not against it.

Not established: any real-world or consciousness conclusion. The criterion states
**when the question is warranted, not whether any system satisfies it.** That
distinction should survive into every summary.

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

**SHA-3 is now wired into the shipped app.** `proofbundle.html` previously routed
`SHA3-256/384/512` to the bundled noble blob; it now calls `PBKECCAK`, our
implementation, and the digest registry reports `engine:'proofbundle'`.
**[verified here]** The swap is behaviour-preserving — our output was checked
byte-for-byte against the previously bundled SHA-3 across 13 message lengths
including every rate boundary (39/39 identical) before the change, and the app's
`digestBytes` was checked against `node:crypto` after it (30/30). Self-test remains
65/65.

ML-KEM is committed and verified but **not yet wired into the app**. It is a key
encapsulation mechanism, not a signature, so it backs none of the existing
post-quantum claims — those are ML-DSA, Falcon and SLH-DSA, which come from noble and
are already present. Integrating ML-KEM means building the Confidential Provenance
surface (encapsulate a record to a recipient's key), which is feature work, not
wiring. Nothing published is wrong while it waits.

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

Two governing artifacts, in chronological order, both correct for their time:
the **independent re-verification of 2026-07-06T02:45:10Z** (Coq 8.18.0 / OCaml
4.14.1, fresh container), and the **motion-root repair of 2026-07-28**, which fixed
three files that account for the only substantive numeric change between them.

    CUSTODY      anchor 173d23e8… verified; 99/99 hashes match MANIFEST.sha256   [relayed]
    COMPILE      44 / 88 compile  (was 40/88 before the 2026-07-28 repair)       [verified here]
    ASSUMPTIONS  726 statements → 514 closed, 212 axiom-dependent                [verified here]

**[verified here]** Computed directly from the real, named `.v` files now in
`corpus/mc108_canonical/`, cross-checked against `corpus/mc108_canonical/MANIFEST.json`
(198 of 199 tracked files hash-verified — see the `RENAME.tsv` note below for the one
exception) and against the individual `Print Assumptions` logs in `00_logs/` for the
three repaired files specifically. `514 + 212 = 726` with no residue, and the
axiom-dependent count is unchanged from the pre-repair total — the three newly-fixed
files contribute 41 statements, all 41 closed, 0 axioms, which is why `514 = 473 + 41`
while `212` does not move.

### `corpus/mc108_canonical/RENAME.tsv` is stale — it predates the repair

The `RENAME.tsv` shipped in the canonical corpus **fails its own manifest's SHA-256
check** — the only file in the tree that does. Its own status column shows 22 proved
/ 18 axiom-dependent / 1 empty / 47 broken (88 compiling as 41), while the actual
directory placement — which the manifest hashes do verify — has 25 / 18 / 1 / 44
(compiling as 44). The 3-file gap in both columns is exactly the three motion-root
files: `RENAME.tsv` was generated before they were repaired and moved into
`01_proved/operator_algebra/`, and a fresh copy was not regenerated afterward.
`corpus/mc108_canonical/REPAIR_LOG.md` and `MANIFEST.json`'s own `totals` /
`after_motion_root_repair` fields are the later, correct values — this is the same
"manifest chronology and current source can diverge" pattern flagged elsewhere in
this corpus's own audit culture, now confirmed a second time, in the file whose
entire purpose is to prevent it.

### The earlier "55 axiom-dependent" was measured with three files missing

`f019`, `f036`, `f089`, `f091` etc. are **pre-rename ledger ordinals** — ordinals
assigned during intake, not theorem names and not descriptive of content. That is
the entire reason the rename maps (`mc108_RENAME_MAP.md`, `_v2.md`) and the canonical
corpus in `corpus/` exist. `corpus/mc108_canonical/RENAME.tsv` is the ordinal → canonical-name lookup;
treat any `fNNN` below as a file handle to look up there, never as a name in itself.

The 2026-07-06 audit reported 528 statements and 55 axiom-dependent. That run's
assumption sweep **failed on the files at ordinals `f036`, `f089` and `f091`**, which
therefore contributed zero. Measuring them closes the gap exactly:

     55   previously measured
    +149   ordinal f036, now measured
    +  4   ordinal f089
    +  4   ordinal f091
    ────
     212   the current total

**The file at ordinal `f036` is the finding**, and it does not have one name — it is
the **consolidated-corpus union file** (`full_consolidated_corpus.v` /
`consolidated_corpus.v` in the two rename maps), a merge of the attribution core,
transformation/recovery, DAG/ledger invariants, and dimensional-independence families,
celebrated by the property index as "the largest single compiling unit." It has
**149 statements, of which zero are closed.** Every one is axiom-dependent — 70% of
the entire axiom surface in one file — and the earlier figures never saw it because
the audit crashed on it.

Its canonical location is
`corpus/mc108_canonical_20260728.tar.gz` →
`02_axiom_dependent/recovery/recovery__t15_failure_meet_localized__51fbd51b.v`.
**That filename is itself a partial answer, not the full one:** the canonical
tooling's naming scheme picks one `principal_theorem` per file
(`t15_failure_meet_localized`, one statement among the ~149), which fits a file with
a single focus but understates a union file with none. Read the canonical name as
"where to find it," not as "what it is about."

Excluding this file, the corpus reads 535 statements / 473 closed / 63
axiom-dependent, which is close to what was published.

**473 is the robust number.** Two independent sweeps, run four days apart with
different tooling and different scope, both put the closed count at exactly 473.
Nothing that was ever measured as closed has been retracted — the correction is
entirely about statements that had not been measured at all.

### Count distinct names, not files

File-level counts mislead, because `_b`/`_c`/`_d` families are the same theorems under
different ordinals. **[verified here]** Deduplicating by theorem name across the whole
index gives **533 distinct names**. Before the motion-root repair, 325 had at least
one compiling home and 208 had none — that 208 figure reproduced an earlier
independent count exactly. After the repair, the three motion-root files' 39
distinct names (of their 41 statements — two are refutation pairs sharing a base
name, `demo20_morph_attested` / `demo20_morph_attested_ORIGINAL_IS_FALSE`, matching
the pattern documented in §0) move across: **364 now have a compiling home, 169 do
not.** The 169 are the current recovery surface.

### Why the denominator is 88 and not 108 — and why those 20 are not repairable

**[verified here]** The sweep scanned `f001`–`f108`, all 108 present. Twenty —
`f001`–`f018`, `f070`, `f071` — fail with `Syntax Error: Lexer: Undefined token` at
line 1, character 0. `108 − 20 = 88`, and `40 + 48 = 88` closes the arithmetic.

**These twenty are AppleDouble metadata sidecars with no data fork.** **[relayed,
custody ledger]** They carry Finder metadata only; the source they describe is not in
the bundle at all. This matters because the failure *looks* identical to a byte-order
mark or smart quote at the first byte, and a BOM/smart-quote repair pass was proposed
on exactly that reading. **It cannot work on these files** — there is nothing to
repair. The source has to be re-supplied from origin.

Keep a BOM/CRLF check in the tooling anyway (`tools/axaudit.sh` reports it as a
distinct `ENCODING:` state) so a genuine encoding fault is never again mistaken for
proof damage, or vice versa.

### `f035` — move it to OK

Recorded `FAIL` by the generated ledger (type error, line 216) but compiles clean in
the independent audit, isolated directory, byte-identical to the hash-pinned copy.
**Treat as OK.** The ledger was *under*-claiming. That releases 8 theorems including
`full_independence` and `condition_independence_C1..C5`. **[relayed]**

### One genuinely incomplete proof, in three copies

Of the 48 real compile failures, the causes are dominated by missing load paths and
unresolved identifiers — dependency ordering, not false theorems. **[verified here]**
Only one error is an incomplete proof rather than an environment problem:
`Attempt to save an incomplete proof (in proof corruption_transitive)`. It appears in
**three** files — `f055`, `f074`, `f099` — which are all copies of the same
architecture-exclusion family. So it is one distinct unfinished theorem, not three,
but no copy of that family compiles with it finished.

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

### 3.3 The custody ledger (2026-07-02) — superseded on four files

The custody status ledger groups the 40 compiling files as **23 zero-axiom**, 10
axiom-bearing, and 7 whose axiom audit did not complete. The later independent run
contradicts it on four of the 23. **[verified here]**

    f023    1 statement    0 closed    1 axiom-dependent
    f034    8 statements   6 closed    2 axiom-dependent
    f106   15 statements  13 closed    2 axiom-dependent
    f107    1 statement    0 closed    1 axiom-dependent

Plus `f019` (2 axiom-dependent), which appears in *neither* of the ledger's lists
because the 07-02 sweep never audited it. The ledger's 10-file axiom-bearing list is
confirmed exactly — all ten are axiom-dependent in the later run — so the
disagreement is one-directional: **the ledger over-claims zero-axiom status for four
files and is silent on a fifth.**

Direction matters here. The `f035` correction has the ledger *under*-claiming, which
is the safe direction. This one runs the other way, so **do not publish the
"23 files, zero axioms" figure** — the checked value is 19 of those 23, and the
statement-level totals in section 2 are the ones to quote.

### 3.4 The independent per-module logs — clean

The seven `*_print_assumptions_INDEPENDENT.log` files in [`docs/logs/`](logs/):
**161 statements** across Structural, TrackB, Hardening, Phronesis, Dimensional,
Recovery and BoundaryPredicates_fixed, **every line** `Closed under the global
context`, no axioms. **[verified here]** — two separately uploaded copies of this log
set are byte-identical to each other.

---

## 4. The axiom surface is smaller than it looks

Three different quantities get called "the axiom count". They are all correct and
they are not the same number:

- **27 names are *declared*** as `Axiom`/`Parameter` across the axiom-bearing files:
  `byte`, `canonical_minus_seal`, `cost`, `d_i`, `delta_p`, `digest_alg`,
  `digest_eq_dec`, `digest_t`, `drift`, `encode_header`, `encode_prim`,
  `encode_state`, `eps_i`, `eval_core`, `hdr_bundle_id`, `n_features`, `n_flags`,
  `pr_parent_digest`, `pr_parent_id`, `rec_op_Op`, `rec_op_apply`, `rec_op_eps`,
  `rec_op_eps_nonneg`, `sha256`, `uncertainty`, `z_max`, `z_min`. **[relayed]**
  Most are uninterpreted *function* parameters (`sha256`, `encode_header`,
  `encode_prim`, `digest_t`, `cost`, `d_i`) rather than assumed propositions — a
  contract on an implementation, not a mathematical assumption. Declaring is not the
  same as being reached.
- **11 distinct axiom names** are actually reached by `Print Assumptions` —
  **9 bespoke, 2 Coq stdlib**.
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

## 5. Compile-clean is not proof-clean — now settled against source

This was an open question while only summaries were available. The 88 sources are now
in `corpus/`, so it is answered directly. **[verified here]** — parsed with comments
stripped, counting only real `Admitted.` / `admit.` / `sorry` at declaration
position.

    01_proved            25 files    0 with a real Admitted   ← the claim HOLDS
    02_axiom_dependent   18 files    6 with a real Admitted
    04_uncompiled        44 files   20 with a real Admitted

**The "zero axioms, zero admits, zero sorry" claim for the proved set is true.** All
25 files are clean when checked against the source itself, not against a grep.

The six in the axiom-dependent set are exactly the six the audit named — `f023`
(`unique_normal_form`), `f049` and `f066` (`closure_under_composition`), `f053` and
`f061` (`event_horizon_sufficient_for_recovery`), `f073` (`cycle_rejected`). The
audit's list was right.

**The `SRCHOLE` grep was wrong, as suspected.** It is case-insensitive and fires on
the word anywhere, comments included. It flagged **18 of the 40** compiling files
where only **6** contain a real one, and 44 across the corpus where 26 do. Every `+A`
mark in the rename maps inherits from that grep. They are now superseded by
`corpus/mc108_canonical/RENAME.tsv`, which carries measured counts and a SHA-256 per file.

---

## 6. The motion-operator algebra — was the highest-value gap, now solved

Three files are the **only** formalization of the operator algebra anywhere in the
corpus. As of 2026-07-28 **all three compile, and all 41 statements close with zero
axioms.** This was open in every audit up to and including an earlier revision of
this document — the repair arrived in the same archive that also supplied the
canonical corpus, and was missed on first pass here. **[verified here]** — checked
directly against the `.v` sources and their individual `Print Assumptions` logs, not
relayed from a summary.

    corpus/mc108_canonical/01_proved/operator_algebra/
      operator_algebra__demo20_gress_attested__151e2051.v      12/12 closed, 0 axioms
      operator_algebra__gress_is_core_candidate__dad99b43.v    14/14 closed, 0 axioms
      operator_algebra__gress_core_eligible_demo__3dc49949.v   15/15 closed, 0 axioms

These were `f022.v`, `f048.v`, `f056.v` under the pre-rename ordinals. Verified
content: 46 core operator IDs, 20 demo IDs, a 1,232-entry ledger, the tier system
with support/clarity/drift thresholds, collision pairs, an idempotent projection, and
attestation for gress · scend · mit · morph.

### The reported cause of the failures was wrong

Every prior ledger in this corpus attributes the failures to "iPhone-transfer syntax
corruption." True for exactly one defect in one file. The rest were ordinary Coq
errors nobody had diagnosed because nobody had run the compiler on them — full
account in `corpus/mc108_canonical/REPAIR_LOG.md`:

- `String` imported after `List` shadowed `length`, so 13 list-length call sites
  resolved to `String.length` and failed on a type mismatch. Not corruption.
- Eight conjunctions had `/\` flattened to `/` — this one *is* the transfer damage,
  confined to eight lines across two files.
- `ge` is not a registered reflexive relation, so a `lia || reflexivity` combinator
  sent `reflexivity` at a `>=` goal after `lia` declined it.
- One `contradiction` call couldn't bridge a symmetric hypothesis; needed `congruence`.
- `simpl` was too weak to reduce `support_count` for two side conditions; needed
  `vm_compute` first.

No statement was weakened to make it compile.

### One genuine, unresolved disagreement — recorded, not silently fixed

`demo20_morph_attested` originally claimed `attested_count_o8 R020 = 6`. The shipped
ledger data yields **7**. The other three demo attestations check out as written
(R001 = 8, R002 = 5, R009 = 6) — only morph disagrees. Rather than edit the claim to
match the data, both facts are now machine-checked and committed side by side,
following the precedent this corpus already set with
`possibility_preserved_ORIGINAL_IS_FALSE`:

    Example demo20_morph_attested_ORIGINAL_IS_FALSE : attested_count_o8 R020 <> 6.
    Proof. vm_compute. discriminate. Qed.

    Example demo20_morph_attested : attested_count_o8 R020 = 7.
    Proof. vm_compute. reflexivity. Qed.

Either `ledgerO8` gained an entry since the original claim was written, or the
expected count was always stale. **That is a data question for whoever maintains the
ledger, not a proof question** — it is verified true in both directions and does not
resolve itself. Do not silently pick one when summarizing this file.

### Other families with no compiling survivor

`canonicalize_idempotent` (`f072 f090 f102`), `verify_profile_terminates`
(`f075 f092 f103`), `admissibility_closure` (`f045 f057`) remain unrepaired.
Everywhere else a `FAIL` twin has an `OK` sibling, so recovery is a copy, not proof
work.

---

## 7. GPX bundle — 83 of 83, complete

**[verified here]** All three Coq sources and their kernel logs are now in
[`coq/`](../coq/). `GPXGrace.v` — the file that could not be repaired and left 18
theorems `source_only` — has been **superseded by `GPXDiachronic.v`, which closes all
18.**

    GPXBoundary.coq.log     42 lines   42 closed   nothing else in the file
    GPXTemporal.coq.log     23 lines   23 closed   nothing else in the file
    GPXDiachronic.coq.log   18 lines   18 closed   nothing else in the file
    ────────────────────────────────────────────
                            83 statements, 83 closed

Each log contains **only** `Closed under the global context` lines — no axioms, no
admits, no warnings, no other output. The three sources contain zero real `Admitted`.
This supersedes the earlier 65-of-83 figure.

### How it got there

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

Most of this list has now been recovered. What remains:

- **The `.coqchk.log` files from the verified-clean core.** Still the highest-value
  missing artifact — an independent-kernel result is stronger than every other
  verification claim in the corpus, and it exists as one sentence in one README.
- SMT proof objects for T1/T2 and unsat records for T5–T8.
- The lost signature work. If it is rebuilt, do **SLH-DSA first** (section 1).

**Recovered and now tracked in this repository:**

    corpus/mc108_canonical/                  all 88 .v sources as real, named files —
                                              <status>/<framework>/<framework>__
                                              <principal_theorem>__<sha8>.v — browsable
                                              directly, not locked inside an archive
    corpus/mc108_canonical/00_logs/          raw coqc + Print Assumptions output, all 88
    corpus/mc108_canonical/MANIFEST.json     per-file SHA-256/512/BLAKE3 + the totals
                                              this document's numbers are checked against
    corpus/mc108_canonical/REPAIR_LOG.md     the motion-root repair, in full (§6)
    corpus/mc108_canonical_20260728.tar.gz   the same tree, archived — for bulk download
    coq/                                     GPX sources + kernel logs, 83/83
    crypto/                                  FIPS 202 + FIPS 203 + confidential
                                              provenance, 269 tests
    tools/fix_bom.sh · apply_rename.sh       recovered tooling
    docs/RECONCILED.md · DEVELOPMENT-LOG.md  prior reconciliation + full history

The three motion-root files are **solved** (§6) — this list no longer needs to say
otherwise.

---

## 11. Layout

    crypto/                    from-scratch FIPS 202 / FIPS 203 / confidential + tests
    corpus/mc108_canonical/    all 88 sources, real canonical names, browsable directly
    coq/                       GPX sources + kernel logs, 83/83
    docs/CORPUS-STATE.md       this file
    docs/aud_047_axiom_discharged.v
    docs/logs/                 independent Print Assumptions logs (161 statements, all closed)
    tools/axaudit.sh           reconstructed assumption sweep — no cap, no double-count

**On names:** every source file in this repository has a real name — either its own
(`keccak.mjs`, `GPXBoundary.v`) or, for the mc108 corpus, the
`<framework>__<principal_theorem>__<hash8>.v` scheme in `corpus/mc108_canonical/`. A
bare `fNNN` appearing anywhere in this document is a **pre-rename ledger ordinal**,
kept only because the historical artifact being described (an old audit log, a
compile sweep) used that ordinal natively and cannot be rewritten after the fact.
It is never asserted as a name in itself — `corpus/mc108_canonical/RENAME.tsv` is
the ordinal-to-name lookup, with the staleness caveat in §2.
