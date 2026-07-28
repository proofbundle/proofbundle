# Motion-root repair — 2026-07-28

The three files holding the operator algebra now compile. All 41 statements
close under the global context with zero axioms.

    operator_algebra__demo20_gress_attested__151e2051.v      12/12    was f022.v
    operator_algebra__gress_is_core_candidate__dad99b43.v    14/14    was f048.v
    operator_algebra__gress_core_eligible_demo__3dc49949.v   15/15    was f056.v

Verified content: 46 core operator IDs, 20 demo IDs, a 1,232-entry ledger, the
tier system with support / clarity / drift thresholds, collision pairs, the
idempotent projection, and attestation for gress · scend · mit · morph.

## The reported cause was wrong

Every ledger in the archive attributes these failures to "iPhone-transfer syntax
corruption." That is true for exactly one defect in one file. The rest are
ordinary Coq errors that were never diagnosed because nobody ran the compiler on
them.

### Defect 1 — `String.length` shadowing `List.length`  (f022, f048, f056)

    From Coq Require Import List String Bool Arith Lia.

`String` is imported after `List`, so bare `length` resolves to
`String.length : string -> nat`. Every call site on a list failed with
`has type "list X" while it is expected to have type "string"`.

Repair: qualified 13 call sites to `List.length`. Nine in f022, two in f048,
two in f056. No statement changed.

### Defect 2 — stripped backslashes  (f022 ×2, f056 ×6)

This is the transfer damage, and it is confined to eight lines. `/\` was
flattened to `/`, so a conjunction parsed as chained equality:

    tier_of S r = TierCore /  clarity_ok r /  drift_ok r
                           ^^ should be /\

Coq reported `Unknown interpretation for notation "_ = _ = _"`. Repair: restored
the eight conjunctions.

### Defect 3 — `ge` is not a registered reflexive relation  (f048)

`repeat split; lia || reflexivity` sent `reflexivity` at a `>=` goal after `lia`
declined it. Repair: `repeat split; try reflexivity; try (vm_compute; lia); try lia`.

### Defect 4 — `contradiction` against a flipped hypothesis  (f056)

Hypothesis `r1 <> r2`, goal branch `r2 = r1`. `contradiction` cannot bridge the
symmetry. Repair: `congruence`.

### Defect 5 — `simpl` too weak for the eligibility side conditions  (f048, f056)

`support_count` did not reduce under `simpl`, so `lia` had nothing to work with
and reported `Cannot find witness`. Repair: `vm_compute` before `lia`.

## One genuine disagreement, retained rather than corrected

`f022` asserted `attested_count_o8 R020 = 6`. The shipped ledger yields **7**.

The other three demo attestations are correct as written: R001 = 8, R002 = 5,
R009 = 6. Only morph disagrees.

I did not change 6 to 7. Editing a claim so it matches the data destroys the
finding. Following the discipline already used in this corpus for
`possibility_preserved_ORIGINAL_IS_FALSE` and `naive_compose_refuted`, both
facts are now recorded:

    Example demo20_morph_attested_ORIGINAL_IS_FALSE :
      attested_count_o8 R020 <> 6.
    Proof. vm_compute. discriminate. Qed.

    Example demo20_morph_attested :
      attested_count_o8 R020 = 7.
    Proof. vm_compute. reflexivity. Qed.

Either `ledgerO8` gained an entry or the expected count is stale. That is a data
question and it is yours to settle. Until you do, the discrepancy is machine-
checked in both directions and cannot quietly disappear.

## Corpus totals after this repair

    compile                44 / 88 RC0      was 41 / 88
    closed, zero axioms    514              was 473
    files in 01_proved     25               was 22

Raw `coqc` and `Print Assumptions` logs for all three are in `00_logs/`.
