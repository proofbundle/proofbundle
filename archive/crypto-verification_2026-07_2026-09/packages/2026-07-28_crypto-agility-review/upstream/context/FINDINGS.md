# GPX bundle — first kernel run

Date: 2026-07-27
Bundle: gpx-boundary-temporal-grace 0.1.0
Manifest payload_sha256: 66ac0fb61f6fbd9ba36262b8a67e61dbcf6ebf7239912903f5dd93dcf0dd6be5
Environment: Ubuntu 24.04, Coq 8.18.0 (apt, OCaml 4.14.1), z3 5.0.0, Node 22, Python 3

The manifest recorded all six proof files as `source_only` on the grounds that no
coqc or lean was present in the build container. That label was correct. Coq
8.18.0 — the manifest's stated target version — was installed here and run.

## Coq results

| file | as shipped | after repair | forbidden axioms |
|---|---|---|---|
| GPXBoundary.v | FAILS at line 334 | 42/42 closed, 0 non-closed | none |
| GPXTemporal.v | FAILS at line 223 | 23/23 closed, 0 non-closed | none |
| GPXGrace.v | FAILS at line 149 | not repaired | — |

65 of the 83 claimed Coq theorems are now kernel-closed under the global
context with zero axioms, zero admits, zero sorries. Counts match the manifest
exactly for both files that closed.

### Defect 1 — GPXBoundary.v:334, theorem `overall_pass_iff_all_pass`

Reverse direction reads `intros [H1 [H2 [H3 [H4 H5]]]]; subst; reflexivity.`
After `intros [a c l b d]` the hypotheses have the form
`g_auth {| g_auth := a; ... |} = APass` rather than `a = APass`. `subst` does
not fire on an unreduced projection, so `reflexivity` is left with a goal it
cannot close.

Repair (one line):

    - intros [H1 [H2 [H3 [H4 H5]]]]; simpl in H1,H2,H3,H4,H5; subst; reflexivity.

Result: `coqc -q GPXBoundary.v` exits 0, 42 lines "Closed under the global
context", zero other output.

### Defect 2 — GPXTemporal.v:223

Identical shape, six hypotheses instead of five.

Repair (one line):

    - intros [H1 [H2 [H3 [H4 [H5 H6]]]]]; simpl in H1,H2,H3,H4,H5,H6; subst; reflexivity.

Result: exits 0, 23 lines "Closed under the global context", zero other output.

### Defect 3 — GPXGrace.v, systematic

`simpl` does not reduce `effective`, `grant_grace`, or `raw`, so every proof
that relies on that reduction leaves an unreduced goal. Confirmed at line 149
(`grace_cannot_launder`) and line 163 (`grace_scoped`); the pattern recurs
through the file. Adding `unfold effective, grant_grace` before the case split
clears 149 and moves the failure to 163, so the fix is mechanical but touches
multiple proofs rather than one line. Not repaired here — 18 theorems remain
`source_only`.

## Executed harnesses — reproduced

| harness | manifest note | this run |
|---|---|---|
| tools/z3_check.py | 19/19 unsat + 1 refutation sat | 19/19 unsat, refutation sat, witness b1=100 b2=1 |
| tools/exhaustive_check.py | 39/39 over full domain | 39/39 |
| tools/merkle_cve_poc.py | CVE-2012-2459 in 2 implementations | confirmed; RFC 6962 form 0/4 collisions |
| tools/pbhash.js | 7000-input differential, 0 divergences | 0 divergences |
| tools/verify_bundle.py | — | PASS: 19/19 file hashes, merkle root matches, ephemeral Ed25519 valid |

pbhash.js derived constants were checked against the FIPS 180-4 published
tables. The BigInt prime-root derivation reproduces them exactly:
K[0..3] = 428a2f98 71374491 b5c0fbcf e9b5dba5, and all eight H values.

## Documentation defects

**D-1 — AUDIT.md is stale and unsealed.** It states "Z3 5.0.0, 14/14 unsat" and
"21/21 statements". The actual counts are 19/19 and 39/39; README.md and
MANIFEST.json both carry the correct figures. It also expects 24 Lean
"does not depend on any axioms" lines against a manifest count of 37 theorems.
AUDIT.md does not appear in MANIFEST.json's file list, so no hash binds it and
nothing detects the drift.

**D-2 — smt/gpx_boundary.smt2 is marked `solver_checked` but is never
executed.** `tools/z3_check.py` line 7 reads

    BASE = open(...smt2...).read() if False else """..."""

so the shipped .smt2 is never read; the SMT source used for the 19 obligations
is inlined in the Python. The shipped file contains only declarations — no
assert, no check-sat, and none of the temporal definitions the obligations need.
Running `z3 gpx_boundary.smt2`, the command AUDIT.md gives, returns `sat` on an
empty assertion set, which establishes nothing. The `solver_checked` status
belongs to the inline block in z3_check.py, which the manifest marks `executed`.

**D-3 — pbhash.js vector count.** The manifest note reads "NIST FIPS 180-4
vectors 5/5". `selfTest()` contains three NIST vectors plus one CVE regression
check and returns `{pass: 4}`. Nothing shipped reproduces 5.

## Status ladder after this run

    kernel_checked  : coq/GPXBoundary.v (42), coq/GPXTemporal.v (23) — with the repairs above
    source_only     : coq/GPXGrace.v (18), all three lean/ files (58)
    executed        : tools/z3_check.py, exhaustive_check.py, merkle_cve_poc.py, pbhash.js
    unverified      : smt/gpx_boundary.smt2 — was marked solver_checked, see D-2

Lean 4.12.0 was not installed in this run, so the 58 Lean theorems remain
`source_only`. Given that both Coq files failed as shipped on the same class of
defect, the Lean mirrors should be assumed to fail until `lake build` is run.
