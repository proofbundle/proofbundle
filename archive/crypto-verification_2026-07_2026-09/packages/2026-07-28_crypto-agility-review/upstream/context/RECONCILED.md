# Proof corpus — reconciled state (v2, corrected)

Built from the audit snapshots in `Archive.zip` (March–July 2026), re-parsed
rather than re-read.

**v2 supersedes v1.** v1 stated 551 theorems closed. That number was wrong and
inflated. The correction is the first section below.

---

## Correction to v1

v1 reported **551** theorems `Closed under the global context`, obtained by
counting that string across `audit/axresult.txt`. That is a raw line count, not
a count of distinct results, and the corpus contains duplicate proof files under
different ordinals. The same theorems were counted twice:

    f065.v= 40   f079.v= 38    double-counted 38    DAG-ACYCLICITY
    f041.v= 40   f076.v= 40    double-counted 40    ATTRIBUTION-FIVE-CONDITION
    f026.v= 40   f058.v= 40    double-counted 40    TRANSFORM-APPLY-RECOVERY
    f093.v= 13   f097.v= 13    double-counted 13    ARCHITECTURE-EXCLUSION
    f030.v= 12   f106.v= 13    double-counted 12    PRIMITIVE-ORDER-FOLD
    f073.v=  3   f104.v= 15    double-counted  3    LINEAGE-WALK
    f053.v=  1   f061.v=  1    double-counted  1    BUDGET-HORIZON-KOLMOGOROV
                                            ─────
                                             147

551 − 147 = 404, and the residual gap to the true figure is the `head -n 40`
truncation in `axaudit.sh`, which cut in the opposite direction. Two errors
running opposite ways is exactly why a raw line count is not a measurement.

**The authoritative figure is 473.** It comes from
`mc108_INDEPENDENT_AUDIT.txt`, referenced in `mc108_PROPERTY_INDEX_20260727.md`
— an independent re-verification run 2026-07-06T02:45:10Z on Coq 8.18.0 /
OCaml 4.14.1 in a fresh container. That audit counted distinct named statements
rather than log lines.

---

## Authoritative counts

    CUSTODY       anchor 173d23e8… verified; 99/99 hashes match MANIFEST.sha256
    COMPILE       41 / 88 RC0            (generated ledger said 40/88)
    ASSUMPTIONS   528 named statements across the 41 passers
                → 473 Closed under the global context, zero axioms
                   55 axiom-dependent

The one compile disagreement is f035, which the independent audit found compiles
clean and byte-identical to its hash-pinned copy. Ledger error direction:
under-claim. That is the third time in this corpus the ledger has been more
pessimistic than the evidence.

---

## Timeline

| Date | Snapshot | What it establishes |
|---|---|---|
| 2026-03-23 | `AUDIT.md` | `continuum_final.v`, 489 lines → 81,039-byte `.vo`, kernel-checked. SHA-256 `34f556e5…`. One axiom: `uuid_global_freshness`, justified as a runtime property of the monotonic counter. |
| 2026-04-20 | `PROOF_CORPUS_AUDIT.md` | 323 files extracted, 86 byte-unique, 10 compiled artifacts. Ten files closed with zero axioms and zero admits, named individually. Open items named honestly. |
| 2026-04-29 | complete corpus concatenation | 22+ files across 6 proof systems. 177+ theorems, 89+ lemmas, 0 global axioms, 3 documented admits. |
| 2026-05-03 | module logs | Coq: Dimensional 16, Hardening 22, Phronesis 20, Recovery 10, Structural 40, TrackB 43 = **151 closed**. Lean: Phronesis 20, `does not depend on any axioms`. |
| 2026-05-06 | `CORPUS_AUDIT.md` | 771 source files indexed, 760 text-extracted, 23,380,337 words. One damaged archive repaired with `zip -FF`. |
| 2026-05-25 | `lean_axiom_audit.log` | 20 Lean theorems, no axiom dependencies. |
| 2026-07-02 | `audit/result.txt`, `axresult.txt` | mc108 sweep: 108 files, 40 compile under that run. |
| **2026-07-06** | **independent audit** | **41/88 RC0 · 528 statements · 473 closed · 55 axiom-dependent · custody 99/99.** Authoritative. |
| 2026-07-25 | `theorem_index.txt` | 86 files, 1,221 statement instances, 533 distinct names, 325 with a compiling home. |
| 2026-07-27 | `mc108_PROPERTY_INDEX` | Files renamed by property. Reconciles index against independent audit. |
| 2026-07-27 | GPX Coq tree | 83 theorems closed, zero axioms, after three repairs. |

The 151 from May and the 473 from July are not in conflict. May measured six
named modules; July measured the whole mc108 pile.

---

## Compile-clean is not proof-clean, and the index already says so

Six families pass `coqc` while carrying `Admitted`:

    NORMAL-FORM-UNIQUENESS               f023
    COMPOSITION-CLOSURE-CANONICAL-FOLD   f049
    BUDGET-HORIZON-KOLMOGOROV            f053, f061
    COMPOSITION-CLOSURE-KOLMOGOROV       f066
    LINEAGE-WALK-AND-SUITE-COMPAT        f073, f104

The last one matters most. `cycle_rejected` — cycle rejection in the lineage
walk, one of the load-bearing claims of the whole system — is proved in
LINEAGE-WALK-AND-SUITE-COMPAT, and that family carries **8 user axioms and is
Admitted-bearing**. The headline result currently sits on the least clean file
in the corpus. Anyone citing cycle rejection should know that before they do.

---

## The axiom surface, and the part of it that is already solved

55 axiom-dependent statements, concentrated in three families:

    OPERATOR-COMPOSITION-WITNESS   f062   8 user axioms
    LINEAGE-WALK-AND-SUITE-COMPAT  f073   8 user axioms
    STATE-MONOID-BOUNDARY          f047   6 user axioms

`aud_047_axiom_discharged.v` already solves the third. I recompiled it here:

    aud_047 rebuild — closed under global context: 4
    residual axioms:
       ClassicalDedekindReals.sig_forall_dec        (Coq stdlib, arrives with R)
       FunctionalExtensionality.functional_extensionality_dep   (Coq stdlib)
    user axioms: 0

Three mechanical moves did it: `Parameter` → Section `Variable`, `Axiom` →
Section `Hypothesis`, and compose laws restated pointwise so funext is not
needed at the point of use.

**It reaches further than f047.** OPERATOR-COMPOSITION-WITNESS is
STATE-MONOID-BOUNDARY plus two statements. Compare:

    f047 : state_eq  compose_assoc  compose_id_left  compose_id_right
           boundary_trichotomy  admissible_iff
    f062 : the same six, plus compose_Witness  compose_admissible

`aud_047` contains all six, and already defines `Witness` and `Admissible`. The
two missing theorems are additive work inside a Section that compiles today —
not a new build. That path clears 14 of the 55 axiom-dependent statements, a
quarter of the entire axiom surface, from a file that already exists.

---

## The failure column is mostly not mathematics

Of the 68 files that failed on 2026-07-02:

**21 fail at line 1, character 0.** Twenty with `Syntax Error: Lexer: Undefined
token`. A lexer error at the first byte is a byte-order mark or a smart quote
introduced in transfer, not a defect in a proof. These are f001–f018, f070,
f071, f086 — and eighteen of them are one contiguous block, consistent with a
single transfer event rather than eighteen problems. `fix_bom.sh` strips BOMs
and curly quotes, recompiles, and reports what recovered.

**47 fail elsewhere**, dominated by missing load paths and unresolved
identifiers — `Cannot find a physical path bound to logical path kernel`,
`The reference viable was not found` — which is dependency ordering, not false
theorems. Exactly one is a genuine incomplete proof: f055 line 152,
`corruption_transitive`.

---

## The habit worth publishing

Two refuted claims are retained in the corpus as machine-checked refutations
rather than deleted:

    f029   possibility_preserved_ORIGINAL_IS_FALSE   retained beside its corrected form
    GPX    naive_compose_refuted                     Z3 witness MAX=100, b1=100, b2=1

That is the single most credible habit in this body of work. A corpus that keeps
its own disproofs is making a claim about method that a corpus of only successes
cannot make. It belongs in the README, not buried in a file listing.

---

## A contradiction the archive resolves

The Gold Archetype monograph (2026-07-23) lists T6 and T7 as open obligations
under O12. The SMT ledger (2026-07-25) records both as mechanically checked with
`unsat` objects saved. The ledger is the later value and the property index
already flags this correctly. The monograph should be corrected to match.

---

## The highest-value damaged set

Three files, none compiling, containing the only formalization of the operator
algebra anywhere in the corpus:

    f022  MOTION-ROOT-ATTESTATION          11 statements · 46 core operator IDs
                                           gress · scend · mit · morph attested
    f048  MOTION-ROOT-REGISTRY-WF          14 · tier system, support/clarity/drift
                                           thresholds, collision pairs, idempotent projection
    f056  MOTION-ROOT-TIER-ELIGIBILITY     15 · 8 operators, core/pressure eligibility

Roots attested across the set: gress, scend, mit, morph, vert, struct. No
compiling copy exists anywhere. Reported cause is transfer-level syntax
corruption, which is mechanical to repair.

---

## Also in the archive, closed with zero axioms

    HorizonCoupling.v     horizon_chain_budget · decay_chain_coh · horizon_bound_tight
    HorizonGrowth.v       horizon_chain_budget_growth · horizon_growth_tight
    CrossTrackHorizon.v   horizon_chain_budget_A — carries only uncertainty/drift,
                          the two Parameters its statement necessarily mentions

**Track A / `continuum.v`**, extracted from sealed record `34f556e5…`, first
independent compilation, RC0: 13 statements, 8 closed, 5 dependent on exactly
the declared interface surface. The audit's phrase is that self-declaration was
confirmed measurement-for-measurement — the file's own account of what it
assumes matched what `Print Assumptions` found, with nothing hidden and nothing
extra. That is a stronger result than a clean bill of health, and it is worth
saying out loud.

---

## Priority

1. **Recompile f022 / f048 / f056.** The operator algebra exists nowhere else
   and none of it compiles. Transfer corruption, mechanically repairable.
2. **Extend `aud_047` to cover `compose_Witness` and `compose_admissible`.**
   Clears 14 of 55 axiom-dependent statements from a file that compiles today.
3. **Resolve the six Admitted-bearing compilers**, starting with
   LINEAGE-WALK-AND-SUITE-COMPAT, because cycle rejection is proved there.
4. **Strip BOMs from the 21 line-1 failures.** One shell loop, eighteen
   contiguous files likely recovered at once.
5. **Move f035 to OK.** Third instance of the ledger under-claiming.
6. **Delete `head -n 40` from `axaudit.sh`** before it is ever re-run.
7. **Correct the Gold Archetype monograph** on T6 and T7.
8. **Split every published axiom count into stdlib and bespoke.** Two of the
   eleven distinct axioms are Coq's own and arrive with `Reals` and funext.

Items 2 and 4 through 8 are editing. Item 1 is repair with a known cause.
Item 3 is the only real proof work on the list.

---

## What the archive does not contain

No signature-scheme source. The from-scratch Ed25519, ECDSA P-384, ML-DSA,
Falcon, and SLH-DSA implementations are not in these snapshots — this is
proof-corpus audit material only.

Of that set, SLH-DSA is the cheapest to rebuild. It is hash-based and nothing
else: SHA-2 and SHAKE are its entire primitive base, and `keccak.mjs`, verified
88/88 against `node:crypto`, already supplies SHAKE128/256 and SHA3-256/384/512.
Rebuilding it is Merkle bookkeeping over a working hash — no field arithmetic,
no lattice, no curve.
