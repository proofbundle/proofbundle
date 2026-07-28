# mc108 — canonical tree

88 source files, renamed by property. Each file's sha256 was verified against the
custody manifest before it was moved.

Toolchain: Coq 8.18.0, OCaml 4.14.1, Ubuntu 24.04.

    compile sweep       44 / 88 RC0
    Print Assumptions   514 statements Closed under the global context

The starting point reproduced `mc108_INDEPENDENT_AUDIT.txt` exactly at 41/88 and
473 closed. The three motion-root files were then repaired — see `REPAIR_LOG.md`.

## Layout

    <status>/<framework>/<framework>__<principal_theorem>__<sha8>.v

| Directory | Files | Statements | Closed | Axiom-dependent |
|---|---:|---:|---:|---:|
| `01_proved` | 25 | 445 | 445 | 0 |
| `02_axiom_dependent` | 18 | 281 | 69 | 212 |
| `03_no_statements` | 1 | 0 | 0 | 0 |
| `04_uncompiled` | 44 | 0 | 0 | 0 |
| **total** | **88** | **726** | **514** | **212** |

`00_logs/` holds raw `coqc` output for all 88 and `Print Assumptions` output for
every file that compiles, named to match its source.

`RENAME.tsv` is the origin map. `HYGIENE.md` covers the previous naming and the
counting defect in the published theorem total. `REPAIR_LOG.md` covers the
motion-root repair and the one data disagreement it surfaced.

## Operator algebra — now proved

    01_proved/operator_algebra/operator_algebra__demo20_gress_attested__151e2051.v
        12/12 closed, 0 axioms — was f022.v
    01_proved/operator_algebra/operator_algebra__gress_core_eligible_demo__3dc49949.v
        15/15 closed, 0 axioms — was f056.v
    01_proved/operator_algebra/operator_algebra__gress_is_core_candidate__dad99b43.v
        14/14 closed, 0 axioms — was f048.v

46 core operator IDs, 20 demo IDs, a 1,232-entry ledger, the tier system with
support / clarity / drift thresholds, collision pairs, the idempotent projection,
and attestation for gress · scend · mit · morph.

## Duplicate families, adjacent

    closure_under_composition  [axiom_dep]
        recovery__closure_under_composition__a703d4ef.v   was f049.v
        recovery__closure_under_composition__fae7d6a5.v   was f066.v
    event_horizon_sufficient_for_recovery  [axiom_dep]
        recovery__event_horizon_sufficient_for_recovery__af6a44eb.v   was f053.v
        recovery__event_horizon_sufficient_for_recovery__e2d85878.v   was f061.v
    admissibility_closure  [broken]
        consciousness__admissibility_closure__8bdeae4e.v   was f045.v
        consciousness__admissibility_closure__b9d7504a.v   was f057.v
    architecture_exclusion_schema  [broken]
        consciousness__architecture_exclusion_schema__a96a94ec.v   was f074.v
        consciousness__architecture_exclusion_schema__b8254f33.v   was f055.v
        consciousness__architecture_exclusion_schema__ecc89534.v   was f099.v
    canonicalize_idempotent  [broken]
        crypto_provenance__canonicalize_idempotent__13fdf0bb.v   was f090.v
        crypto_provenance__canonicalize_idempotent__a7ead757.v   was f072.v
        crypto_provenance__canonicalize_idempotent__ba812501.v   was f102.v
    regulated_implies_lineage  [broken]
        crypto_provenance__regulated_implies_lineage__08c77de4.v   was f100.v
        crypto_provenance__regulated_implies_lineage__db404fd7.v   was f059.v
    cycle_detected  [broken]
        lineage_dag__cycle_detected__031f5675.v   was f101.v
        lineage_dag__cycle_detected__5cd934b8.v   was f038.v
    t1_dag_acyclicity  [proved]
        authorization__t1_dag_acyclicity__8776277e.v   was f079.v
        authorization__t1_dag_acyclicity__f4f759e3.v   was f065.v
    architecture_exclusion_schema  [proved]
        consciousness__architecture_exclusion_schema__346dc85c.v   was f093.v
        consciousness__architecture_exclusion_schema__cce9b7ee.v   was f097.v
    protocol_relativity_strong  [proved]
        consciousness__protocol_relativity_strong__0b8efe61.v   was f076.v
        consciousness__protocol_relativity_strong__670e9394.v   was f041.v
    lyapunov_stability  [proved]
        recovery__lyapunov_stability__27a9a6e2.v   was f026.v
        recovery__lyapunov_stability__cda18c42.v   was f058.v
