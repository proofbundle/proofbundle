# All deduplicated proof declarations with code

This file lists all 770 unique exact-code variants. 709 are lexically closed; placeholder-terminated declarations remain listed in their own admitted/sorry/oops sections. Full occurrence provenance is in `inventory/unique_proof_code_with_code.jsonl`.



---

# Coq proof code — admitted or sorry

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `asymmetric_governance_preserves_options`

- Kind: `Theorem`
- Code SHA-256: `f634e4da6529abc47ceda98e2faabdfc2c034e6c2302a1debdac3cec552a1983`
- Statement SHA-256: `0222517cb5ce0bc746fec2c82294466e5920b2aed77dd92948543904d99b85bb`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000001_asymmetric_governance_preserves_options__f634e4da6529.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4550–4563; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem asymmetric_governance_preserves_options :
  forall s policy,
    (forall t,
      policy s = Some t ->
      asymmetric_governance t s
        (upside t s) (downside t s) (reachability_loss t s) = true) ->
    option_value_preserved s policy.

Parameter upside downside : Transition -> State -> R.
Parameter option_value_preserved : State -> (State -> option Transition) -> Prop.

Proof.
  admit.
Admitted.
```

## 2. `boundary_information_loss`

- Kind: `Theorem`
- Code SHA-256: `94cbfeb3ed011a3abceb9747bffbd8bb4c5ececa32d9c9c6045fb1d4c349eaf6`
- Statement SHA-256: `fdc5abbccca0e11350b7f6dd97b493dabc9ef45461d44466bbe2d21d11c8c419`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000002_boundary_information_loss__94cbfeb3ed01.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6823–6830; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem boundary_information_loss :
  forall sys,
    finite_boundary sys ->
    exists info, ~ passes_through sys info.
Proof.
  (* Infinite information, finite boundary capacity *)
  admit.
Admitted.
```

## 3. `canon_preserves_sem_eq2`

- Kind: `Theorem`
- Code SHA-256: `88530acc9d738131d317a1e5267ac0b4e9ea5ceaabc7d694eeb50d4cf80a533d`
- Statement SHA-256: `4a30d7ed91e3a25d672fa5580f36994699707c08d38b371756be7038501b0e70`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000003_canon_preserves_sem_eq2__88530acc9d73.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 269–297; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem canon_preserves_sem_eq2 :
  forall j1 j2, WellFormed j1 -> WellFormed j2 ->
    sem_eq2 j1 j2 -> canonicalize j1 = canonicalize j2.
Proof.
  intros j1 j2 Hwf1 Hwf2 Hseq.
  induction Hseq.
  - reflexivity.
  - reflexivity.
  - simpl. f_equal. (* Q_eq doesn't directly give = on JNum;
                       canonicalization to canon_number string is what gives = *)
    (* The proof here delegates to canon_number_unique once we serialize *)
    admit.
  - simpl. rewrite H. reflexivity.
  - simpl. f_equal.
    induction H.
    + reflexivity.
    + simpl. f_equal.
      * apply IHsem_eq2; admit. (* WellFormed sub-derivation *)
      * apply IHForall2; admit.
  - simpl. f_equal.
    (* Permutation + per-key equivalence on well-formed (no-dup) objects
       implies the sorted canonical forms are equal. *)
    apply Permutation_sort_unique with (le := kv_le).
    + apply sort_kvs_sorted.
    + apply sort_kvs_sorted.
    + (* sorted lists with the same multiset are equal *)
      admit.
  - reflexivity.
Admitted.
```

## 4. `canonicalize_idempotent`

- Kind: `Theorem`
- Code SHA-256: `605484d837c4e95071be082573553c0b07d9a2e38fea6fe55917fdee8669968f`
- Statement SHA-256: `f086edcc1dff56d7441686451de7d1d652a50ecf610bd3a6a3da810742650c6b`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000004_canonicalize_idempotent__605484d837c4.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 332–353; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem canonicalize_idempotent :
  forall j, WellFormed j ->
    canonicalize (canonicalize j) = canonicalize j.
Proof.
  fix IH 1.
  intros j Hwf.
  destruct j.
  - reflexivity.
  - reflexivity.
  - reflexivity.
  - simpl. rewrite nfc_idempotent. reflexivity.
  - simpl. f_equal.
    rewrite map_map.
    apply map_ext_in.
    intros j' Hin.
    apply IH. inversion Hwf; subst.
    rewrite Forall_forall in H0. apply H0. exact Hin.
  - simpl. f_equal.
    (* sort_kvs is idempotent because sort_kvs of sorted = same *)
    admit.
  - reflexivity.
Admitted.
```

## 5. `cartography_predicts_cascades`

- Kind: `Theorem`
- Code SHA-256: `bedc78d0560fb855ab1120d2b384191be89f868a21d389951eb637f3eb1ed384`
- Statement SHA-256: `923129ee87838716ec7ecc0236140dc319f0195e078f1325fc02b5906ade59e3`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000005_cartography_predicts_cascades__bedc78d0560f.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5858–5869; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem cartography_predicts_cascades :
  forall cart events,
    (forall fe, In fe events -> In fe (cart_fractures cart)) ->
    fracture_cascade events ->
    exists predicted_outcome : FractureClass,
      forall fe_last,
        last events fe_last = fe_last ->
        fe_class fe_last = predicted_outcome.
Proof.
  (* Completeness ensures deterministic prediction *)
  admit.
Admitted.
```

## 6. `chain_bounded`

- Kind: `Theorem`
- Code SHA-256: `fb4b891ce49099735b5d192818f74d0583bb585a4a2511906f7749e5a288968c`
- Statement SHA-256: `22340f078017e632a906af76ff2652cdd19c8a06c18b183ee588bd4389995033`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000006_chain_bounded__fb4b891ce490.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2448–2454; embedded `proofbundle_2026-05_3aa754dce56dbe40_3aa754dce56dbe40_000213_3aa754dce56d_oal_preprint_1.v`

```coq
Theorem chain_bounded : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  st_step s' = (st_step s + length chain)%nat.
Proof.
  (* Each concrete_apply increments st_step by 1.
     Induction on chain gives the sum. *)
  Admitted.
```

## 7. `chain_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `2c42215b578b83fe03732d81d985d28e8bc51df9f69a066c95707b0b6f017f07`
- Statement SHA-256: `07a90c4dff08b4337669577e15515d1c7be8a58986647f1ef1684167783ea673`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000007_chain_coh_bound__2c42215b578b.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2427–2435; embedded `proofbundle_2026-05_3aa754dce56dbe40_3aa754dce56dbe40_000213_3aa754dce56d_oal_preprint_1.v`

```coq
Theorem chain_coh_bound : forall (chain : op_chain) (s s' : state),
  state_valid s ->
  apply_chain chain s = Some s' ->
  coh_budget s' >= coh_budget s - Z.of_nat (length chain) * concrete_eps.
Proof.
  (* Induction on chain. Each step uses the two guards in
     concrete_apply to establish bounded loss per step.
     Total loss is at most length(chain) * eps. *)
  Admitted.
```

## 8. `chain_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `d70890f9f1ec470b17ededdc481ec4246ec8a24f60e81812ff1a5b7032d0e977`
- Statement SHA-256: `cd73b941abb2b5175325b3fdde4296a57bc7b95848c1b71bba7b66489924d686`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000008_chain_id_preservation__d70890f9f1ec.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2438–2445; embedded `proofbundle_2026-05_3aa754dce56dbe40_3aa754dce56dbe40_000213_3aa754dce56d_oal_preprint_1.v`

```coq
Theorem chain_id_preservation : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  (* Induction on chain. concrete_apply preserves st_prims
     (only modifies coh_budget, lineage, step).
     Transitivity of map equality gives the result. *)
  Admitted.
```

## 9. `coherence_invariant_characterization`

- Kind: `Theorem`
- Code SHA-256: `a09cb00bf4a2dfff987acc65af2860571e784eddc5f3dd8e86278f74d3905e82`
- Statement SHA-256: `0ee900803ee7bdfb2f9b9414955d5df4f447a9331bbefe66848c342cd30c840b`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000009_coherence_invariant_characterization__a09cb00bf4a2.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 169–177; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem coherence_invariant_characterization :
  forall (chain : op_chain) (s : state),
    Forall (fun o => op_delta o >= 0) chain ->
    state_valid s ->
    coherence_invariant_chain chain s.
Proof.
  (* Each step with delta >= 0 cannot decrease coherence.
     Induction on chain length. *)
  Admitted.
```

## 10. `compare_by_option_preservation`

- Kind: `Theorem`
- Code SHA-256: `88fa9272debdbea6b4161a3f51edb819d4ea5dc52805f14472fccd5137b7d1a8`
- Statement SHA-256: `f4f2460ed7a45a0905a0e3a3b55165e923b2d3c99f36727d6655f5366fa0fd93`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000010_compare_by_option_preservation__88fa9272debd.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4653–4668; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem compare_by_option_preservation :
  forall action delay s,
    uncertainty s > 0 ->
    (option_value (apply_transition action s) >
     option_value (delayed_state delay s) ->
     compare_irreversibilities action delay s = Lt) /\
    (option_value (apply_transition action s) <
     option_value (delayed_state delay s) ->
     compare_irreversibilities action delay s = Gt).

Parameter uncertainty : State -> R.
Parameter delayed_state : R -> State -> State.

Proof.
  admit.
Admitted.
```

## 11. `compose_transformation_correct`

- Kind: `Theorem`
- Code SHA-256: `0ea84fb976d799dc7e0efab8c9907d92c342d968f2bdb2f7a4a12b6d616235a9`
- Statement SHA-256: `9b527324c54ea14603251f11b223f522a3828a80ec7f1997dc974da2fd6d2122`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000011_compose_transformation_correct__0ea84fb976d7.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 424–439; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem compose_transformation_correct :
  forall t1 t2 tc s s1 s',
    compose_transformation t1 t2 = Some tc ->
    apply_transformation t1 s = Some s1 ->
    apply_transformation t2 s1 = Some s' ->
    apply_transformation tc s = Some s'.
Proof.
  intros t1 t2 tc s s1 s' Hcomp Ht1 Ht2.
  unfold compose_transformation in Hcomp.
  destruct (Nat.eqb (tf_target t1) (tf_source t2)); [|discriminate].
  injection Hcomp as <-.
  unfold apply_transformation in *. simpl.
  (* Need: apply_chain (chain1 ++ chain2) s = Some s'
     given apply_chain chain1 s = Some s1
     and   apply_chain chain2 s1 = Some s' *)
  Admitted.
```

## 12. `concrete_apply_conserves_identity`

- Kind: `Theorem`
- Code SHA-256: `e64420c5afcb32c5e3e41c928c815756d8fee0d7c8fb3f3c55f7e51f73188fc6`
- Statement SHA-256: `01381ceb1ffdce2c9ca3434da4396acbe5948aa6e4a535b849fcb50322b82c90`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000012_concrete_apply_conserves_identity__e64420c5afcb.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 133–145; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem concrete_apply_conserves_identity :
  forall o s s',
    concrete_apply o s = Some s' ->
    identity_conserved s s'.
Proof.
  intros o s s' H.
  unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2;
    [discriminate|].
  (* After both guards, H : Some {| st_prims := st_prims s; ... |} = Some s' *)
  (* Need to extract s' = the record, then identity_density unfolds to length st_prims *)
  Admitted.
```

## 13. `containment_at_critical_prevents_catastrophe`

- Kind: `Theorem`
- Code SHA-256: `ac7294bfba9e3ca902fc4dd072ab9a42c372cca09be8c61ac641cfa68c4fc8b1`
- Statement SHA-256: `bf280000c8585b8f7f23fc6720bf28b537da715f4fa53886bef1db74f160e414`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000013_containment_at_critical_prevents_catastrophe__ac7294bfba9e.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5622–5639; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem containment_at_critical_prevents_catastrophe :
  forall sys events,
    effective_containment sys ->
    fracture_cascade events ->
    (forall fe, In fe events -> fe_system fe = sys) ->
    (exists fe_first, head events = Some fe_first /\
       critical_state (fe_pre_state fe_first)) ->
    ~ catastrophic_cascade events.
Proof.
  intros sys events Hcont Hcascade Hsys Hcrit Hcat.
  unfold catastrophic_cascade in Hcat.
  destruct Hcat as [Hcasc Hsev].
  (* Containment ensures the cascade terminates *)
  destruct (Hcont events Hcascade Hsys) as [fe_last [Hlast Hzone]].
  (* But we need more structure to complete this proof *)
  (* The intuition: containment zones prevent severity escalation *)
  admit.
Admitted.
```

## 14. `cross_level_corruption_destroys_integrity`

- Kind: `Theorem`
- Code SHA-256: `9d5cd6e568b8dbf624a65c50a7c66e960e94bb5399ecc1edf4a8be1e8faf43a3`
- Statement SHA-256: `ca229ddabf04e2c435835895ae363d12d5e9d2859a619b6aaefdbf19d309ac7b`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000014_cross_level_corruption_destroys_integrity__9d5cd6e568b8.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5352–5359; embedded `proofbundle_2026-05_650ccba05346f025_650ccba05346f025_000227_650ccba05346_reference.v`

```coq
Theorem cross_level_corruption_destroys_integrity :
  forall hijacker victim R,
    cross_level_corruption hijacker victim ->
    exists R_corrupted,
      illegitimate_evolution R R_corrupted.
Proof.
  admit.
Admitted.
```

## 15. `decreasing_measure_terminates`

- Kind: `Theorem`
- Code SHA-256: `e69140fdd7b4addda8f80a204de99b178d60d06297db06a6120d0cfde7b337da`
- Statement SHA-256: `b4a9192229f3eaf1f1e250ea774572b9c5e37a238f5f05f1f42a3c2ef869e6e6`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000015_decreasing_measure_terminates__e69140fdd7b4.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8229–8237; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem decreasing_measure_terminates :
  forall comp,
    valid_computation comp ->
    measure_decreasing comp ->
    terminates comp.
Proof.
  (* Proof by well-founded induction on measure *)
  admit.
Admitted.
```

## 16. `defeat_precedes_collapse`

- Kind: `Theorem`
- Code SHA-256: `62512e2040c6151963087ab52dc2d1ca3a72c684b5adf6716d1b7e1570404956`
- Statement SHA-256: `b0b09d828b8cd37f8f7b0eb4e9c4675e599a09a3ce9e71a4d3070ea8b518be87`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000016_defeat_precedes_collapse__62512e2040c6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4470–4482; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem defeat_precedes_collapse :
  forall s_current s_critical,
    structural_defeat s_current s_critical ->
    (* Current state may still appear viable *)
    viable s_current /\
    (* But collapse is structurally locked in *)
    forall s_future,
      reachable_from s_current s_future ->
      reachable_from s_critical s_future ->
      observable_collapse s_future.
Proof.
  admit.
Admitted.
```

## 17. `deliberation_preserves_option_value`

- Kind: `Theorem`
- Code SHA-256: `5526d0beea4791cc89f82855f6d128da92539f405713d6b2d6b2ca3fc281184d`
- Statement SHA-256: `c5be997b97e5034adcaf73e538bc514ba695b30b93bd9b8ce958d932faad9639`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000017_deliberation_preserves_option_value__5526d0beea47.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7264–7276; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem deliberation_preserves_option_value :
  forall action delay uncertainty,
    uncertainty > 0 ->
    irreversibility action > 0 ->
    option_value (deliberation action delay) >
    option_value action.

Parameter irreversibility : (State -> State) -> R.
Parameter option_value : (State -> State) -> R.

Proof.
  admit.
Admitted.
```

## 18. `divergent_yields_partial`

- Kind: `Theorem`
- Code SHA-256: `2f4ee5245f9dd06ae239d5cb84b05b1a219c2d2cd3a8bcc383fca14d075b3e05`
- Statement SHA-256: `c1d86d9bebacc32631882e7f9b682006767a562d831772e11e0891b1145dad79`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000018_divergent_yields_partial__2f4ee5245f9d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8380–8392; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem divergent_yields_partial :
  forall ic cont,
    productive ic ->
    exists pr : PartialResult,
      forall n,
        match nth_ic n ic with
        | Some c =>
            approximates pr c
        | None => True
        end.
Proof.
  admit.
Admitted.
```

## 19. `early_warning_requires_recoverability_monitoring`

- Kind: `Theorem`
- Code SHA-256: `d134d3fbe74c343b1f006cf8d062f174db8c43a3f1ce9c183227782fd77ec03b`
- Statement SHA-256: `3b5fd7ba5ed473e60374dd50d2252afe5a3718ce7ecf9a558cab218581c06f61`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000019_early_warning_requires_recoverability_monitoring__d134d3fbe74c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4499–4506; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem early_warning_requires_recoverability_monitoring :
  forall warning_system,
    (forall s, warning_system s -> ~ viable s) ->
    (* Warning only fires at collapse—too late *)
    ~ exists s, early_warning_possible s warning_system.
Proof.
  admit.
Admitted.
```

## 20. `every_sig_has_partner`

- Kind: `Theorem`
- Code SHA-256: `ca47a2e785f6a798de599e2f7750b6018d78304754c244b7b9ba7c99b43b2d0b`
- Statement SHA-256: `db1232c2d0451247b310b7025948f88d1bbe11204140ea1583877b7a3376a9c8`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000020_every_sig_has_partner__ca47a2e785f6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1194–1208; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem every_sig_has_partner :
  forall s, exists d, compatible d s = true.
Proof.
  intros. destruct s.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_384. reflexivity.
  - exists BLAKE2b. unfold compatible. simpl.
    (* SHA_512 is 64; ECDSA_P521 needs 66; mismatch *)
    (* Need to pick a 66-byte digest, which doesn't exist in registry *)
    admit.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
Admitted.
```

## 21. `existential_witness_sufficiency`

- Kind: `Theorem`
- Code SHA-256: `657c33846377312da7c094d4dc30256209ea293743867df1f3915641f1d0ae23`
- Statement SHA-256: `fd460a60f855b8df3af0f92463b62b34e06efe7648019a72e964472da63022ea`
- Occurrences: 1
- Source statuses: `INCOMPLETE` × 1
- Extracted code file: `proof_code/admitted_or_sorry/coq/000021_existential_witness_sufficiency__657c33846377.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 14601–14629; embedded `proofbundle_2026-05_ba253798317165d1_survival_theorem_existential_repair_20260513.v`

```coq
Theorem existential_witness_sufficiency :
  forall W C : R,
  W > 0 -> C >= 0 ->
  exists k : nat,
  removal_cost_exceeds_budget W C k.
Proof.
  intros W C HW HC.
  (* We need k such that k * W > C.
     Since W > 0, we can choose k > C/W.
     By the Archimedean property of reals, such a natural k exists. *)
  exists (S (Z.to_nat (up (C / W))));
  unfold removal_cost_exceeds_budget;
  intros _ _.
  (* Use the Archimedean property: for any real x, there exists n with n > x *)
  assert (Harch: exists n : nat, INR n > C / W).
  { apply archimed with (r := C / W). }
  destruct Harch as [n Hn].
  (* Our chosen k is at least n+1, so INR k > C/W *)
  assert (Hk: INR (S (Z.to_nat (up (C / W)))) > C / W).
  { (* This follows from the definition of up and the Archimedean property *)
    admit. (* Placeholder: needs archimed + up properties *) }
  (* Multiply both sides by W (positive, so inequality preserved) *)
  apply Rmult_gt_compat_r with (r := W) in Hk; try exact HW.
  (* k * W > (C/W) * W = C *)
  assert (Hcancel: (C / W) * W = C).
  { field. apply Rgt_not_eq. exact HW. }
  rewrite Hcancel in Hk.
  exact Hk.
Admitted.
```

## 22. `expansion_requires_acquisition`

- Kind: `Theorem`
- Code SHA-256: `48ba1a93cbdd8053bab6fa30448fbef40d1e35590a3f175d7721906f04aadb91`
- Statement SHA-256: `f979e06fade5373ce769cb13a467be10907a12045ef4980d3a67f1eab6c8c864`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000022_expansion_requires_acquisition__48ba1a93cbdd.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6645–6651; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem expansion_requires_acquisition :
  forall s1 s2,
    boundary_expands s1 s2 ->
    exists e, ~ contains s1 e /\ contains s2 e.
Proof.
  admit.
Admitted.
```

## 23. `fair_divergence_liveness`

- Kind: `Theorem`
- Code SHA-256: `298c80fc06110d48a4671885576fb4fb7d3c52f7f1b8dc0e5c4717542d15bc58`
- Statement SHA-256: `2bba50472ca491cb098c00e5aadd0dd712a5df010b139083257685effd64f071`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000023_fair_divergence_liveness__298c80fc0611.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8445–8452; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem fair_divergence_liveness :
  forall ic P,
    fair_divergence ic ->
    liveness_property P ->
    eventually_satisfies ic P.
Proof.
  admit.
Admitted.
```

## 24. `fast_action_consumes_future`

- Kind: `Theorem`
- Code SHA-256: `6b545410b988f4e93a3db482967918c3bf06e5b12b3be50b3461ec5b8e7e3d92`
- Statement SHA-256: `ebd7c49658b6d17d2d5c22040a9ceb27e886510cb140e8bf0e25a3a6a3192735`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000024_fast_action_consumes_future__6b545410b988.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7054–7069; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem fast_action_consumes_future :
  forall clocks action_rate damage_rate,
    faster_clock (action_clock clocks) (correction_clock clocks)
      (t_now, t_future) ->
    compounding_damage damage_rate t_now t_future >
    correction_capacity (correction_clock clocks) ->
    (* System is consuming future viability for present performance *)
    future_viability_decreasing.

Parameter t_now t_future : Time.
Parameter correction_capacity : (Time -> Prop) -> R.
Parameter future_viability_decreasing : Prop.

Proof.
  admit.
Admitted.
```

## 25. `finite_repair_possible`

- Kind: `Theorem`
- Code SHA-256: `74308aa2583398b27d6fce496651e0d85aa2e477075ea7e40afe409fa957629b`
- Statement SHA-256: `32fb1f6d2aab0b511741aa66b0517cdc72c79a8576ddf0fde3aab4cfe578efe2`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000025_finite_repair_possible__74308aa25833.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5824–5833; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem finite_repair_possible :
  forall sys fe,
    fe_class fe = FC_Partial ->
    fe_system fe = sys ->
    exists n : nat,
      safe_state (repair_sequence n (fe_post_state fe)).
Proof.
  (* This requires assumptions about recovery effectiveness *)
  admit.
Admitted.
```

## 26. `fracture_complete_predictable`

- Kind: `Theorem`
- Code SHA-256: `c407febf8db6251f3967ab2d338b9577042eb06c65c9ddb5b18e8e7d5cca0693`
- Statement SHA-256: `cdedb84bba8a5687397f2375d07889b54a55640ab6de510e927362e0828b15f7`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000026_fracture_complete_predictable__c407febf8db6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5786–5800; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem fracture_complete_predictable :
  forall sys fk,
    fracture_complete sys fk ->
    forall fe1 fe2 : FractureEvent,
      fe_system fe1 = sys ->
      fe_system fe2 = sys ->
      fe_class fe1 = fe_class fe2 ->
      (* Same class implies similar containment strategies apply *)
      (effective_containment sys ->
       (propagates fe1 fe2 -> ~ catastrophic_cascade [fe1; fe2])).
Proof.
  intros sys fk Hcomp fe1 fe2 Hsys1 Hsys2 Hclass Hcont Hprop.
  (* Completeness ensures we can classify and contain *)
  admit.
Admitted.
```

## 27. `genus_boundary_relation`

- Kind: `Theorem`
- Code SHA-256: `ef2a697224d93f151e21f8e705294eb4464eb0d3d55605723b75558618f7029e`
- Statement SHA-256: `cdebb3fa7aa21d73cdef89852373ec4cdb9968957253de3e81df3ad10e27c3cd`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000027_genus_boundary_relation__ef2a697224d9.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6859–6865; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem genus_boundary_relation :
  forall sys,
    boundary_measure sys >= 2 * PI * sqrt (INR (genus sys) + 1).
Proof.
  (* Topological lower bound *)
  admit.
Admitted.
```

## 28. `illegitimate_evolution_sealed_drift`

- Kind: `Theorem`
- Code SHA-256: `4e5ff8d97bb6bab054bdf00d399e92f779e79d8e49b8df381b9d00c22c8da9cf`
- Statement SHA-256: `9fec7638282e84542b7424601edee0436679abc1336e0a94013bcc6ba4288cd4`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000028_illegitimate_evolution_sealed_drift__4e5ff8d97bb6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5265–5276; embedded `proofbundle_2026-05_650ccba05346f025_650ccba05346f025_000227_650ccba05346_reference.v`

```coq
Theorem illegitimate_evolution_sealed_drift :
  forall R_old R_new s,
    illegitimate_evolution R_old R_new ->
    R_new s ->
    ~ R_old s ->
    exists sd : SealedDrift,
      sd_original_ref sd = R_old /\
      sd_current_ref sd = R_new /\
      sd_state sd = s.
Proof.
  admit.
Admitted.
```

## 29. `impedance_matching_preserves_signal`

- Kind: `Theorem`
- Code SHA-256: `df95124b24032e0b5cdc671f9a83309dac19733d7969874986741857bdd88246`
- Statement SHA-256: `f94c62bbe700add0cb1f34e94d6c6a4dbe69902c85b04344aeb889343f05c006`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000029_impedance_matching_preserves_signal__df95124b2403.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7220–7233; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem impedance_matching_preserves_signal :
  forall signal control,
    temporal_impedance_matched
      (clock_speed control t1 t2)
      (signal_speed signal t1 t2) ->
    signal_integrity_preserved signal control.

Parameter signal_speed : (Time -> R) -> Time -> Time -> R.
Parameter signal_integrity_preserved :
  (Time -> R) -> (Time -> Prop) -> Prop.

Proof.
  admit.
Admitted.
```

## 30. `infinite_stagnation_livelock`

- Kind: `Theorem`
- Code SHA-256: `f69ea24aa3728afd8e739f9abff488da400a5d3e469630d179a02bd6b8aee4f8`
- Statement SHA-256: `3cc0404551247abc34f16a9e3d42313a7498880d7cda836524db6affd22998b4`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000030_infinite_stagnation_livelock__f69ea24aa372.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8273–8284; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem infinite_stagnation_livelock :
  forall ic : InfiniteComputation,
    (forall n,
      match nth_ic n ic, nth_ic (S n) ic with
      | Some c1, Some c2 => stagnates c1 c2
      | _, _ => True
      end) ->
    degenerate ic.
Proof.
  (* If depth never increases, no observable progress *)
  admit.
Admitted.
```

## 31. `information_seeking_dominates`

- Kind: `Theorem`
- Code SHA-256: `42e1c141e41d172de0cd98ef49bbb27b68aab4d46a1f762ee37938f01cbe546b`
- Statement SHA-256: `4a45d3ffa84f340cd8a6acb77340f633700c13b29960857db9a29839f4971c96`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000031_information_seeking_dominates__42e1c141e41d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4605–4620; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem information_seeking_dominates :
  forall s uncertainty irreversibility,
    uncertainty > high_uncertainty_threshold ->
    irreversibility > high_irreversibility_threshold ->
    exists probe_action,
      value_of_information probe_action s >
      direct_optimization_value s.

Parameter high_uncertainty_threshold : R.
Parameter high_irreversibility_threshold : R.
Parameter value_of_information : Transition -> State -> R.
Parameter direct_optimization_value : State -> R.

Proof.
  admit.
Admitted.
```

## 32. `interface_compose_assoc`

- Kind: `Theorem`
- Code SHA-256: `06806d5e7763f6addc09732f03eb81c4f192aaf760276df6260b0a25ee9ab612`
- Statement SHA-256: `6a2c9baaf1804c25bc33042685faaeb66a9d329fbd5877b9a6833758aba2f5a7`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000032_interface_compose_assoc__06806d5e7763.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6680–6690; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem interface_compose_assoc :
  forall i1 i2 i3 icompose1 icompose2 icompose3 icompose_final,
    compose_interface i1 i2 = Some icompose1 ->
    compose_interface icompose1 i3 = Some icompose2 ->
    compose_interface i2 i3 = Some icompose3 ->
    compose_interface i1 icompose3 = Some icompose_final ->
    icompose2 = icompose_final.
Proof.
  (* Expand definitions and use equality of functions *)
  admit.
Admitted.
```

## 33. `irreversibility_reduces_options`

- Kind: `Theorem`
- Code SHA-256: `eaa303550c23b027cffbaea604d29416e108469a2b7096f7035419cd219ef37e`
- Statement SHA-256: `9e0bf4b1fddd0ebde7370332e0500cfc8c844ed571de3044e28d01fa0b9867ed`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000033_irreversibility_reduces_options__eaa303550c23.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4426–4432; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem irreversibility_reduces_options :
  forall t s,
    irreversible t s ->
    option_value (apply_transition t s) < option_value s.
Proof.
  admit.
Admitted.
```

## 34. `lex_well_founded`

- Kind: `Lemma`
- Code SHA-256: `c9b6a3034d8544504ddf7b3ddb8361fceaa771fba56f49e32a3b81e80e96320b`
- Statement SHA-256: `40e83583bf08cebcdfe76814fa944163f9f698f0d810e3c5043287791d42b7a2`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000034_lex_well_founded__c9b6a3034d85.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8246–8251; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Lemma lex_well_founded :
  well_founded lex_lt.
Proof.
  (* Standard result: lexicographic product of well-founded relations *)
  admit.
Admitted.
```

## 35. `meta_irreversibility_most_dangerous`

- Kind: `Theorem`
- Code SHA-256: `5a74160222f17bcd5bdd3ab42eff46e75027120531b528eeebb94b7e05e83871`
- Statement SHA-256: `fb2050b8e074b34c84387230bcd88a700f43ddb5022fcbb37fb3471e067aa19b`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000035_meta_irreversibility_most_dangerous__5a74160222f1.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4694–4705; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem meta_irreversibility_most_dangerous :
  forall t s,
    meta_irreversible t s ->
    (* Destroys not just current options but future capacity to choose *)
    correction_capacity (apply_transition t s) = 0 /\
    correction_capacity s > 0.

Parameter correction_capacity : State -> R.

Proof.
  admit.
Admitted.
```

## 36. `morpho_increases_coherence`

- Kind: `Theorem`
- Code SHA-256: `386d2ddf673d1e426c6bb73aae9c1b78d01b7eb5319dbe3fb9f99e764ac145b2`
- Statement SHA-256: `441768ff747ea8b01e88187663d3b1780036deb271878b6f831fa4a7e9361d54`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000036_morpho_increases_coherence__386d2ddf673d.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 485–495; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem morpho_increases_coherence : forall m s s',
  morpho_valid m ->
  state_valid s ->
  concrete_apply (morpho_op m) s = Some s' ->
  coh_budget s' > coh_budget s.
Proof.
  intros m s s' [Hdelta Hmin] Hvalid Happ.
  unfold concrete_apply in Happ.
  destruct (Z.ltb _ 0) eqn:G1; [discriminate|].
  destruct (Z.ltb _ _) eqn:G2; [discriminate|].
  Admitted.
```

## 37. `nesting_increases_boundary`

- Kind: `Theorem`
- Code SHA-256: `80ca0a3d6acc8a96f313d01f6bdabb551a8bf503b4c1d024aef0bd9e1d9e038e`
- Statement SHA-256: `4afa6c3f42285cf51e0c55b908bee97c83c3b45bdee5ff17cf48540562b60cf2`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000037_nesting_increases_boundary__80ca0a3d6acc.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6793–6799; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem nesting_increases_boundary :
  forall sys n,
    boundary_measure_total (boundary_depth sys n) >=
    boundary_measure sys.
Proof.
  admit.
Admitted.
```

## 38. `no_perfect_detector`

- Kind: `Theorem`
- Code SHA-256: `a24bf4e4d5f86d8766672ca967b93c8ddfaebb708a0c95a96866a922044a03b6`
- Statement SHA-256: `d7bccfb3feddcc3ddf7e73232b0d0485b858ca743cd67c65d62f4b3c4bb8709b`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000038_no_perfect_detector__a24bf4e4d5f8.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8418–8425; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem no_perfect_detector :
  ~ exists detector,
    (forall comp, diverges comp -> detector comp = true) /\
    (forall comp, terminates comp -> detector comp = false).
Proof.
  (* Reduces to halting problem *)
  admit.
Admitted.
```

## 39. `one_way_door_path_closure`

- Kind: `Theorem`
- Code SHA-256: `7aabc9aa4e868eaad665d4c0af058974c13bdcd45fe1414466cdec173b27bd9d`
- Statement SHA-256: `37130981bcc62acdaf59f4d2c7b370c92a7df91cdca6ab0d322a51adb2b929a5`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000039_one_way_door_path_closure__7aabc9aa4e86.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4442–4448; embedded `proofbundle_2026-05_438dbf7a8bb38026_438dbf7a8bb38026_000189_438dbf7a8bb3_irreversibility.v`

```coq
Theorem one_way_door_path_closure :
  forall t s,
    one_way_door t s ->
    path_closure s (apply_transition t s).
Proof.
  admit.
Admitted.
```

## 40. `op_id_left`

- Kind: `Theorem`
- Code SHA-256: `42499d9e5e2a2b597e1fd9ea4e30ff96abd2d2a34f7ba7e8f166c6942cf4529e`
- Statement SHA-256: `b178c9555cca1f40458bd174b88354deb71a92fbea2b56770dac43e7ab9327d8`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000040_op_id_left__42499d9e5e2a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2375–2383; embedded `proofbundle_2026-05_3aa754dce56dbe40_3aa754dce56dbe40_000213_3aa754dce56d_oal_preprint_1.v`

```coq
Theorem op_id_left : forall (o : concrete_op) (s : state),
  coh_budget s >= 0 ->
  exists s', seq_apply op_id o s = Some s' ->
    coh_budget s' = coh_budget s + op_delta o.
Proof.
  (* The identity operator preserves coherence but extends lineage.
     seq_apply op_id o s applies op_id (coh unchanged) then o.
     The intermediate state has same coherence as s. *)
  Admitted.
```

## 41. `pipeline_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `1729633e51e067106f2884c4bd4643e7e6a00772c4ff79fb4afc801136b55e49`
- Statement SHA-256: `f0c3781499f36b13f279b730ce61cdeba81c5c22ee0e55577031e7ea8942aca1`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/admitted_or_sorry/coq/000041_pipeline_coh_bound__1729633e51e0.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 182–189; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem pipeline_coh_bound : forall s s' u d,
  state_valid s ->
  adaptive_pipeline s u d = Some s' ->
  coh_budget s' >= coh_budget s - 4 * concrete_eps.
Proof.
  (* 4 stages, each bounded by concrete_eps.
     Total loss <= 4 * eps. *)
  Admitted.
```

## 42. `possibility_preserved`

- Kind: `Theorem`
- Code SHA-256: `d77a85b2ffc209b510492e50cb1263b7eba384005eb0c990d4a990f8366fc4aa`
- Statement SHA-256: `8e935e22e418a659a603719d4e116df25f8f0ddd038e34a4376eb88f8184c06a`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000042_possibility_preserved__d77a85b2ffc2.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 252–260; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem possibility_preserved : forall s s' chain,
  in_possibility_manifold s s' chain ->
  state_valid s'.
Proof.
  intros s s' chain [Hreach Hcoh].
  unfold state_valid.
  split; [lia|].
  (* Primitives validity propagates through chain *)
  Admitted.
```

## 43. `projection_necessary_for_temporal_coherence`

- Kind: `Theorem`
- Code SHA-256: `20870b6f07d12c42b973340e8abe4d283896b28bfaf6b9021e1987ccdfe55b17`
- Statement SHA-256: `14614336d59f451b3ff6164ecceaf708f0d6e7f4273b804ebfb97546c67aa0d5`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000043_projection_necessary_for_temporal_coherence__20870b6f07d1.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7171–7183; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem projection_necessary_for_temporal_coherence :
  forall clocks project actual,
    temporally_coherent clocks ->
    projection_quality project actual > threshold ->
    can_maintain_viability clocks project.

Parameter threshold : R.
Parameter can_maintain_viability :
  SystemClocks -> (State -> (State -> State) -> Time -> State) -> Prop.

Proof.
  admit.
Admitted.
```

## 44. `recovery_manifold_open`

- Kind: `Theorem`
- Code SHA-256: `ed578b3832b71542baad6a84af3a1ca514ce87e946d6ebe3529451ede9a672c6`
- Statement SHA-256: `ecb90ac4a95442c9345d81a13134f6d1b0ef8739879c1e086d2f177f60e78818`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000044_recovery_manifold_open__ed578b3832b7.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 454–466; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem recovery_manifold_open : forall s theta_rec kappa_max,
  in_recovery_manifold s theta_rec kappa_max ->
  coh_budget s > theta_rec + 1 ->
  forall o s', concrete_apply o s = Some s' ->
    op_delta o >= -1 ->
    in_recovery_manifold s' theta_rec (S kappa_max).
Proof.
  intros s theta_rec kappa_max [Hcoh Hkappa] Hmargin o s' Happ Hdelta.
  unfold in_recovery_manifold.
  unfold concrete_apply in Happ.
  destruct (Z.ltb _ 0) eqn:G1; [discriminate|].
  destruct (Z.ltb _ _) eqn:G2; [discriminate|].
  Admitted.
```

## 45. `resistance_dissipation_monotone`

- Kind: `Theorem`
- Code SHA-256: `814dfad275b80ec98968299eb7ac335e294076425446f957bc515af6463bbe30`
- Statement SHA-256: `4fccc85bcb4a84e5650fe5f6b8c24b3767708ea16728e70b9a89f5e22b587cde`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000045_resistance_dissipation_monotone__814dfad275b8.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6711–6719; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem resistance_dissipation_monotone :
  forall sys e r1 r2,
    r1 < r2 ->
    boundary_resistance sys = r1 ->
    boundary_resistance' sys = r2 ->
    dissipation sys e < dissipation' sys e.
Proof.
  admit.
Admitted.
```

## 46. `rigid_reference_brittle`

- Kind: `Theorem`
- Code SHA-256: `688814bc2bdb7505cc0b22432d34c00084677393ee7a6560c1c7e56174c6aec4`
- Statement SHA-256: `3c7db0773816a84dff9b7cc36cfc76b9726f24bfbb2cb8a44c64888d7113d690`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000046_rigid_reference_brittle__688814bc2bdb.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5137–5150; embedded `proofbundle_2026-05_650ccba05346f025_650ccba05346f025_000227_650ccba05346_reference.v`

```coq
Theorem rigid_reference_brittle :
  forall R s,
    rigid_reference R ->
    R s ->
    drifts_from R s' ->
    (* No recovery possible within same identity *)
    ~ exists s'', R s'' /\ s'' = s'.
Proof.
  intros R s Hrigid Href Hdrift [s'' [Hrefs Heq]].
  unfold drifts_from in Hdrift.
  unfold rigid_reference in Hrigid.
  (* If s' could map to some s'' in R, and R is rigid... *)
  admit.
Admitted.
```

## 47. `rupture_condition`

- Kind: `Theorem`
- Code SHA-256: `26e6c906b0643e2db40efbf2221a136cb76d94d36ff6a28e25b1930b18730941`
- Statement SHA-256: `c626e9c3afff7ac1652074dcf275e322fa642b4493cdbebe7aa88828c64a5f1d`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000047_rupture_condition__26e6c906b064.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6753–6767; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem rupture_condition :
  forall sys,
    failure_mode sys = BF_Rupture <->
    (exists t1 t2 : R,
      t2 > t1 /\
      t2 - t1 < 0.1 /\
      boundary_damage sys @ t1 < critical_damage / 2 /\
      boundary_damage sys @ t2 > critical_damage).

Parameter _at_time : System -> R -> System.
Notation "sys @ t" := (_at_time sys t) (at level 40).

Proof.
  admit.
Admitted.
```

## 48. `sealed_drift_invisible_internally`

- Kind: `Theorem`
- Code SHA-256: `c2a01743b325ab1cbc6334c240fd534388d583a81330f3874a4184d408fb18cb`
- Statement SHA-256: `cd91222303a4cd088bf20e9316bdbb5d43f999c6a70725bd722e8a57912c4d7b`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000048_sealed_drift_invisible_internally__c2a01743b325.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5217–5230; embedded `proofbundle_2026-05_650ccba05346f025_650ccba05346f025_000227_650ccba05346_reference.v`

```coq
Theorem sealed_drift_invisible_internally :
  forall sd : SealedDrift,
    (* The system appears healthy by its own lights *)
    preserves_identity (sd_current_ref sd) (sd_state sd) /\
    (* But has lost connection to original identity *)
    ~ preserves_identity (sd_original_ref sd) (sd_state sd).
Proof.
  intro sd.
  split.
  - exact (sd_satisfies_current sd).
  - unfold preserves_identity.
    (* From reference_drifted, we know original is not satisfied *)
    admit.
Admitted.
```

## 49. `sem_eq2_refl`

- Kind: `Theorem`
- Code SHA-256: `839410d66b1fd2f5f88704ccb2d9512ed461fd2c6e0bcd0bf7231079c7092207`
- Statement SHA-256: `e53ec20ed73d0eec6bc889049cddb842e802d3bcf9d84ececab61be2094a7b62`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000049_sem_eq2_refl__839410d66b1f.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 119–142; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem sem_eq2_refl : forall j, sem_eq2 j j.
Proof.
  fix IH 1.
  destruct j.
  - apply seq2_null.
  - apply seq2_bool.
  - apply seq2_num. apply Q_eq_refl.
  - apply seq2_str. reflexivity.
  - apply seq2_arr.
    induction l as [| j' rest IHrest].
    + apply Forall2_nil.
    + apply Forall2_cons. apply IH. apply IHrest.
  - apply seq2_obj.
    + apply Permutation_refl.
    + induction l as [| kv rest IHrest].
      * apply Forall_nil.
      * apply Forall_cons.
        { intros kv2 Hin Hkey. (* same key in same list -> same value *)
          (* This requires no-duplicate-keys invariant on JObj.
             For raw JObj we cannot prove this; we prove instead
             on canonicalized JObj which guarantees no dups. *)
          admit. }
        { apply IHrest. }
Admitted.
```

## 50. `sem_eq_refl`

- Kind: `Lemma`
- Code SHA-256: `b83e768ca632023fe7bad1fccc83de4f5d99c439000527319a95447468bd7f03`
- Statement SHA-256: `8703a143eef27034bac24a71804254aab084d01e7c634f25175222e3e8fc3aec`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000050_sem_eq_refl__b83e768ca632.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 88–97; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Lemma sem_eq_refl : forall j, sem_eq j j.
Proof.
  induction j; try constructor.
  - apply Q_eq_refl.
  - reflexivity.
  - reflexivity.
  - intros. (* arr case *) admit.
  - apply Permutation_refl.
  - intros. admit.
Admitted.
```

## 51. `stage_order_5_before_6_significant`

- Kind: `Theorem`
- Code SHA-256: `7ba07affb03e1dcb463cea694702b66952281cf46c7485fcda0d7b0af5243152`
- Statement SHA-256: `1f275d19e34dc50e57be1a22a25367928c168d5f6ec2fc5f0b9de2e8c69c8025`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000051_stage_order_5_before_6_significant__7ba07affb03e.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 862–873; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem stage_order_5_before_6_significant :
  exists b c k p f,
    let order_5_first := verify b c k p f in
    (* hypothetical permuted verifier where stage6 runs before stage5 *)
    True.
    (* Constructing the witness requires building a concrete bundle
       where stage5 fails AND stage6 fails with different outcomes.
       The witness exists because InvalidSignature ≠ OutOfBounds. *)
Proof.
  (* witness: any bundle with bad signature and out-of-bounds boundary *)
  admit.
Admitted.
```

## 52. `temporal_incoherence_irreversibility`

- Kind: `Theorem`
- Code SHA-256: `935b22186a3c0a030cb844016fca096c3d6e1d665cb12b784245b24b53d11976`
- Statement SHA-256: `5dc11372886ec3d9bfd185a2b170566a6ff9c02fe5f442efde6406842c52d5dd`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000052_temporal_incoherence_irreversibility__935b22186a3c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7017–7031; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem temporal_incoherence_irreversibility :
  forall clocks damage_func,
    temporally_incoherent clocks ->
    exists t_damage,
      damage_clock clocks t_damage /\
      (* Damage becomes irreversible because correction was delayed *)
      ~ recoverable_at (damage_func t_damage) t_damage.

Parameter recoverable_at : State -> Time -> Prop.
Parameter State : Type.
Parameter damage_func : Time -> State.

Proof.
  admit.
Admitted.
```

## 53. `timescale_separation_stability`

- Kind: `Theorem`
- Code SHA-256: `8cab292f607ca4194ee5e1c0c67610a6bb53e1032eeb1fa24168c24ef056187e`
- Statement SHA-256: `0841393d62ca52e82583a28a80d0021d2ea1d96759e73913f7cbfd1b02ca3045`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000053_timescale_separation_stability__8cab292f607c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 7122–7135; embedded `proofbundle_2026-05_b21d7c9c41b28863_b21d7c9c41b28863_000231_b21d7c9c41b2_temporality.v`

```coq
Theorem timescale_separation_stability :
  forall hc,
    (forall s, hc_instant hc s = s \/ hc_instant hc s <> s) ->
    (* Fast control doesn't destabilize slow control *)
    (forall s n, Nat.iter n (hc_instant hc) s = s \/
       converges_to (Nat.iter n (hc_instant hc) s) (hc_fast hc s)) ->
    stable_hierarchy hc.

Parameter converges_to : State -> State -> Prop.
Parameter stable_hierarchy : HierarchicalControl -> Prop.

Proof.
  admit.
Admitted.
```

## 54. `total_damage_bounded`

- Kind: `Theorem`
- Code SHA-256: `17fbb86e88ea9083f1410c520af2bb4b82c578ec01729b556dc28780d2edf9a2`
- Statement SHA-256: `f60b21594c54a88a4fe0d803f00ca3391a31da64e2d5b3b09d3e3d8a30a5209a`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000054_total_damage_bounded__17fbb86e88ea.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5703–5718; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem total_damage_bounded :
  forall sys events,
    events <> nil ->
    damage_accumulates sys events ->
    exists fe_last,
      last events fe_last = fe_last /\
      total_damage sys events <= damage sys (fe_post_state fe_last).
Proof.
  intros sys events Hne Hacc.
  destruct (exists_last Hne) as [fe_last [Hlast Hin]].
  exists fe_last.
  split.
  - exact Hlast.
  - (* Induction on events *)
    admit.
Admitted.
```

## 55. `unbounded_resource_implies_divergence`

- Kind: `Theorem`
- Code SHA-256: `addb3d2fd657faa320ff1e1edff7720644d0aad0a61ea5cae42a18f8f92ea6fc`
- Statement SHA-256: `bc2a21bd45d2ac5ee89866e9b8e4345dddd55c1a0040305c2c621addcc185175`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/admitted_or_sorry/coq/000055_unbounded_resource_implies_divergence__addb3d2fd657.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8340–8352; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Theorem unbounded_resource_implies_divergence :
  forall ic : InfiniteComputation,
    (exists r : Resource,
      forall n,
        match nth_ic n ic with
        | Some c =>
            resource_usage c r >= INR n  (* Grows with step count *)
        | None => True
        end) ->
    diverges (ic_to_list ic 1000).  (* Arbitrary truncation *)
Proof.
  admit.
Admitted.
```

## 56. `unique_normal_form`

- Kind: `Theorem`
- Code SHA-256: `d03833278ca1ac38d5bc54a006b0daa7d787f4033d049abccb39f51d2dad92fc`
- Statement SHA-256: `8bc1c1116e053fd8f8eec71ba2a6d8595f799f19dac9b3a8ca8b67341f8bac9c`
- Occurrences: 27
- Source statuses: `AXIOMATIC` × 27
- Extracted code file: `proof_code/admitted_or_sorry/coq/000056_unique_normal_form__d03833278ca1.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 121–130; embedded `principia_2026-05_2285d77c5e5903f8_2285d77c5e5903f8_000223_2285d77c5e59_principia_2285d77c5e59.v`

```coq
Theorem unique_normal_form :
  terminating ->
  locally_confluent ->
  forall st nf1 nf2,
    multi_step st nf1 ->
    multi_step st nf2 ->
    normal_form nf1 ->
    normal_form nf2 ->
    nf1 = nf2.
Admitted.
```

## 57. `verified_implies_aligned`

- Kind: `Theorem`
- Code SHA-256: `4f9deb82ea5ab3893cc43f1f8f35ac0ae47ace38ff8db4a7e15617d1d0ce0386`
- Statement SHA-256: `b5277db87bc5fc9f477e623c111a4dfe17f7dbf7f4fd86d374d3b2a6194f2e35`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/admitted_or_sorry/coq/000057_verified_implies_aligned__4f9deb82ea5a.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 528–534; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem verified_implies_aligned : forall o s s',
  verified_apply o s = Some s' ->
  alignment_score s s' >= 2.
Proof.
  (* verified_apply checks all_invariants_hold which subsumes
     coherence bound and chain limit. *)
  Admitted.
```

## 58. `verify_outcome_in_enum`

- Kind: `Theorem`
- Code SHA-256: `636e18d2ed18a9a9703d1d72eefc2f2fd522edcc230fd50c1accd1fc2e504244`
- Statement SHA-256: `d03499c467b74e74e2a849a4293ec03a0d9ef3e73072de8be7b8f17e1623d9ad`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/admitted_or_sorry/coq/000058_verify_outcome_in_enum__636e18d2ed18.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 771–845; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem verify_outcome_in_enum :
  forall b c k p f,
    let o := verify b c k p f in
    o = Verified \/ o = Malformed \/ o = InvalidSignature \/
    o = OutOfBounds \/ o = UnknownVersion \/ o = MissingSideInfo \/
    o = LineageInvalid \/ o = ResourceExhausted \/ o = PolicyDenied \/
    o = Indeterminate \/ o = NotDefinedInVersion.
Proof.
  intros b c k p f.
  unfold verify.
  destruct (stage1_parse b) as [|o1].
  - destruct (stage2_schema b) as [|o2].
    + destruct (stage3_version b) as [|o3].
      * destruct (stage4_digest b) as [|o4].
        { destruct (stage5_integrity b k) as [|o5].
          { destruct (hdr_profile (b_hdr b)) eqn:Hprof.
            { left. reflexivity. }
            { destruct (stage6_boundary b c) as [|o6].
              { destruct (stage7_side b) as [|o7].
                { destruct (hdr_profile (b_hdr b)) eqn:Hprof2.
                  - rewrite Hprof in Hprof2. discriminate.
                  - left. reflexivity.
                  - destruct (stage8_lineage b p f) as [|o8].
                    { destruct (hdr_profile (b_hdr b)) eqn:Hprof3.
                      - rewrite Hprof in Hprof3. discriminate.
                      - left. reflexivity.
                      - left. reflexivity.
                      - destruct (stage9_hitl b) as [|o9].
                        { left. reflexivity. }
                        { destruct o9; tauto. } }
                    { destruct o8; tauto. }
                  - destruct (stage8_lineage b p f) as [|o8].
                    { destruct (hdr_profile (b_hdr b)) eqn:Hprof3.
                      - rewrite Hprof in Hprof3. discriminate.
                      - left. reflexivity.
                      - left. reflexivity.
                      - destruct (stage9_hitl b) as [|o9].
                        { left. reflexivity. }
                        { destruct o9; tauto. } }
                    { destruct o8; tauto. } }
                { destruct o7; tauto. } }
              { destruct o6; tauto. } }
            { destruct (stage6_boundary b c) as [|o6].
              { destruct (stage7_side b) as [|o7].
                { destruct (hdr_profile (b_hdr b)) eqn:Hprof2.
                  - rewrite Hprof in Hprof2. discriminate.
                  - left. reflexivity.
                  - destruct (stage8_lineage b p f) as [|o8].
                    { destruct (hdr_profile (b_hdr b)) eqn:Hprof3.
                      - rewrite Hprof in Hprof3. discriminate.
                      - left. reflexivity.
                      - left. reflexivity.
                      - destruct (stage9_hitl b) as [|o9].
                        { left. reflexivity. }
                        { destruct o9; tauto. } }
                    { destruct o8; tauto. }
                  - destruct (stage8_lineage b p f) as [|o8].
                    { destruct (hdr_profile (b_hdr b)) eqn:Hprof3.
                      - rewrite Hprof in Hprof3. discriminate.
                      - left. reflexivity.
                      - left. reflexivity.
                      - destruct (stage9_hitl b) as [|o9].
                        { left. reflexivity. }
                        { destruct o9; tauto. } }
                    { destruct o8; tauto. } }
                { destruct o7; tauto. } }
              { destruct o6; tauto. } }
            { (* PB_LINEAGE_1 case mirrors above *) admit. }
            { (* PB_REGULATED_1 case mirrors above *) admit. } }
          { destruct o5; tauto. } }
        { destruct o4; tauto. }
      * destruct o3; tauto.
    + destruct o2; tauto.
  - destruct o1; tauto.
Admitted.
```



---

# Coq proof code — axiomatic

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `Adm_equiv_W_resource`

- Kind: `Theorem`
- Code SHA-256: `67a703b8d40ddae33f840c63fb2740c3f749d497a73a3b4771719fb310cafc3b`
- Statement SHA-256: `27d66489fcd8713d0736664fdbc843147d865ae30198afc04aa8d9807dec97c1`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000001_Adm_equiv_W_resource__67a703b8d40d.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 544–549; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem Adm_equiv_W_resource : forall x τ o R_bound,
    Adm x τ o R_bound <-> (W x τ /\ (C τ o <= R_bound)%R).
  Proof.
    intros x τ o R_bound.
    unfold Adm. tauto.
  Defined.
```

## 2. `admissibility_density_placeholder`

- Kind: `Theorem`
- Code SHA-256: `514768ff2754154e21b17436fe242a1c73c9196d3a3f1069eb1d54928fd0e9ce`
- Statement SHA-256: `b83826e08f9ce8484f2fa1cfdc0d255f1b5dc717eaa3ae9f952e71d481fb16b8`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000002_admissibility_density_placeholder__514768ff2754.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1011–1020; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem admissibility_density_placeholder : exists α : R,
    (0 < α)%R /\ (α <= 1)%R /\ alpha_measured = α.
  Proof.
    exists alpha_measured.
    split.
    - apply alpha_measured_pos.
    - split.
      + apply alpha_measured_le_1.
      + reflexivity.
  Defined.
```

## 3. `admissibility_under_error`

- Kind: `Theorem`
- Code SHA-256: `a3933cde6be233620339801ef4f5e1e2894f7cfdbd55d8e9c98bfec8bee8d688`
- Statement SHA-256: `fa2a856fd0c3a4f533c8a6134d39241dc1d450247982b87e75df3eeccb084d48`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000003_admissibility_under_error__a3933cde6be2.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 740–749; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem admissibility_under_error : forall (t : R),
    (Sigma_total t <= / 2 * ε_ι)%R ->
    exists (iota_hat : State -> Identity),
      (d_ι (iota_hat (StateStructure.StateStructure.t0)) (ι' (StateStructure.StateStructure.t0)) <= ε_ι)%R.
  Proof.
    intros t HΣ.
    (** If estimator variance is bounded by half tolerance, confidence interval remains within admissible bounds *)
    exists (fun x => ι' x). (** Trivial estimator *)
    unfold d_ι; rewrite d_ι_refl; lra.
  Defined.
```

## 4. `admissible_iff`

- Kind: `Lemma`
- Code SHA-256: `0b0c2432fdfc52e8bf711253d301c2c4fd25a7155ed35d9ec71b6a2a763e9645`
- Statement SHA-256: `11f1579f539e08459b3a347cff401847b4c2adceb5f3ebe97343dd53bc670f99`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000004_admissible_iff__0b0c2432fdfc.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4003–4012; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma admissible_iff :
  forall x tau o,
    Admissible x tau o <-> Witness x tau /\ cost tau o <= Rmax.
Proof.
  intros x tau o.
  unfold Admissible.
  split.
  - intro H. exact H.
  - intro H. exact H.
Qed.
```

## 5. `admissible_iff`

- Kind: `Lemma`
- Code SHA-256: `3926a99a8c9fe897837819e49072abc7846ae68f085babfee51ebd4f50afba9e`
- Statement SHA-256: `e58c6583bcd8f90a572251fc523d0cccbeb5cc22f1414aa9e32b52f17d39df2f`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000005_admissible_iff__3926a99a8c9f.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25551–25559; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma admissible_iff : forall x tau o,
  Admissible x tau o <-> Witness x tau /\ cost tau o <= Rmax.
Proof.
  intros x tau o.
  unfold Admissible.
  split.
  - intro H. exact H.
  - intro H. exact H.
Qed.
```

## 6. `after_correct`

- Kind: `Theorem`
- Code SHA-256: `b51a2c0087d45c579553c717371fbd524459a753f8cb5f0259d2f06b0b561267`
- Statement SHA-256: `1fe48757f7b7165af2e6b6aeba475698f85ce141de4d2a12ab83bd0119c38516`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000006_after_correct__b51a2c0087d4.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203033–203041; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem after_correct :
  forall p iso c v t t',
    resolve_path p c = Some v ->
    parse_iso iso = Some t ->
    value_to_time v = Some t' ->
    eval_atom (After p iso) c = Some (time_lt t t').
Proof.
  intros. simpl. rewrite H, H0, H1. reflexivity.
Qed.
```

## 7. `age_gt_correct`

- Kind: `Theorem`
- Code SHA-256: `6ffa9cbe829d8cce2df29f33795210cf5da007259a14f02ed30ea61c236906f7`
- Statement SHA-256: `f4a61b24d5e3d2d835cc64985958c10d039e7d49ec958a91850a2acf50e57202`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000007_age_gt_correct__6ffa9cbe829d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203084–203093; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem age_gt_correct :
  forall p dur_str c v d t,
    resolve_path p c = Some v ->
    parse_duration dur_str = Some d ->
    value_to_time v = Some t ->
    eval_atom (AgeGt p dur_str) c =
      Some (duration_lt d (time_minus (context_now c) t)).
Proof.
  intros. simpl. rewrite H, H0, H1. reflexivity.
Qed.
```

## 8. `age_lt_correct`

- Kind: `Theorem`
- Code SHA-256: `cc5b7501fdd3ca954824e6eec5b31103a384029d334ba37a50ca9a8bdb0e44ab`
- Statement SHA-256: `fbdd305fbab290f7f92204c6abcef8f8245d6fb46f3cba0af928342eb47410c9`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000008_age_lt_correct__cc5b7501fdd3.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203073–203082; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem age_lt_correct :
  forall p dur_str c v d t,
    resolve_path p c = Some v ->
    parse_duration dur_str = Some d ->
    value_to_time v = Some t ->
    eval_atom (AgeLt p dur_str) c =
      Some (duration_lt (time_minus (context_now c) t) d).
Proof.
  intros. simpl. rewrite H, H0, H1. reflexivity.
Qed.
```

## 9. `atom_always_some`

- Kind: `Theorem`
- Code SHA-256: `4b6c5987c128a7e9f8779bf55c18cfccf5645dbce21dbb6be41a5aed783c0978`
- Statement SHA-256: `402203219b9effad36f87bffc3ee9ccc16b0a0ff6817e1f835a6eff3cb7d5909`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000009_atom_always_some__4b6c5987c128.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203097–203105; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem atom_always_some :
  forall a c, exists b, eval_atom a c = Some b.
Proof.
  intros. destruct a; simpl;
    (* Each case: destruct on resolve_path, parse_iso, etc. *)
    repeat match goal with
    | |- context [match ?x with _ => _ end] => destruct x
    end; eexists; reflexivity.
Qed.
```

## 10. `auth_meet_assoc`

- Kind: `Lemma`
- Code SHA-256: `f3d6175bcd2956029ceb89c3e7a2f263efcf1d9096b4306312b583313c86db48`
- Statement SHA-256: `9f58d406f188cf017f5d08068ffb7193cf47c5a9c4c2c6cb1e022a1846269009`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000010_auth_meet_assoc__f3d6175bcd29.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1984–1985; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_assoc : forall a b c, (a ⊓ b) ⊓ c = a ⊓ (b ⊓ c).
Proof. intros. unfold auth_meet. symmetry. apply andb_assoc. Qed.
```

## 11. `auth_meet_comm`

- Kind: `Lemma`
- Code SHA-256: `ae38ccd0fe17fcb8505019c08b80679f5501b42d3fd23885bbe8b5dafcfe77fa`
- Statement SHA-256: `5803ab3c32618ff2479a748e71e5dcf35997228f425b69ed4b0a6e5fdbd4d616`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000011_auth_meet_comm__ae38ccd0fe17.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1981–1982; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_comm : forall a b, a ⊓ b = b ⊓ a.
Proof. intros. unfold auth_meet. apply andb_comm. Qed.
```

## 12. `auth_meet_false`

- Kind: `Lemma`
- Code SHA-256: `ef712051a6bb8eb7a156197df83f1f45f5cfff7f89ff8a079f30278b6ee8fd2f`
- Statement SHA-256: `7998ee5f0bc4130a2405f50ad1780a1a4abb3020c2466fbd1946499b8a0ed7ca`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000012_auth_meet_false__ef712051a6bb.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1993–1994; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_false : forall a, false ⊓ a = false.
Proof. intros. reflexivity. Qed.
```

## 13. `auth_meet_idempotent`

- Kind: `Lemma`
- Code SHA-256: `fed8f32a0ce1528990d764c642673dab3310e7edef36dc35f02148632a2047ca`
- Statement SHA-256: `c4c607c10361023ded546f668d631f41d9a8a8007de57dfe683101e566c7358a`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000013_auth_meet_idempotent__fed8f32a0ce1.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1987–1988; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_idempotent : forall a, a ⊓ a = a.
Proof. intros. destruct a; reflexivity. Qed.
```

## 14. `auth_meet_list_any_false`

- Kind: `Lemma`
- Code SHA-256: `f5e540604c8f5b6b46efc08ff158fbe9ab494f272d8dae0d4f90846a88e2cb62`
- Statement SHA-256: `d264c089cc9a3451496f5385ef29b7cac801fdd4ff44b7d000231d573baa57e4`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000014_auth_meet_list_any_false__f5e540604c8f.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2012–2021; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_list_any_false : forall xs,
  In false xs -> auth_meet_list xs = false.
Proof.
  induction xs as [|x rest IH]; intros H.
  - inversion H.
  - simpl in H. destruct H as [Heq | Hin].
    + subst. simpl. reflexivity.
    + simpl. rewrite IH by exact Hin.
      unfold auth_meet. apply andb_false_r.
Qed.
```

## 15. `auth_meet_list_any_false`

- Kind: `Lemma`
- Code SHA-256: `f7bc56491b0c98f843ec8cc36da1d2452a82dce8c8aac6747da006a927cac99a`
- Statement SHA-256: `d264c089cc9a3451496f5385ef29b7cac801fdd4ff44b7d000231d573baa57e4`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000015_auth_meet_list_any_false__f7bc56491b0c.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2533–2542; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_list_any_false : forall xs,
  In false xs -> auth_meet_list xs = false.
Proof.
  induction xs as [|x rest IH]; intros H.
  - inversion H.
  - simpl in H. destruct H as [Heq | Hin].
    + subst. reflexivity.
    + simpl. rewrite IH by exact Hin.
      unfold auth_meet. apply andb_false_r.
Qed.
```

## 16. `auth_meet_list_app`

- Kind: `Lemma`
- Code SHA-256: `96c9e6490a044c68125e8780dc54e558247614816d543a7f815c43783c942d05`
- Statement SHA-256: `1ec66d07d639c5aa30d8d6377dc1e32aac69ddc261c08209342282a6c4516e49`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000016_auth_meet_list_app__96c9e6490a04.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2003–2009; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_list_app : forall xs ys,
  auth_meet_list (xs ++ ys) = auth_meet_list xs ⊓ auth_meet_list ys.
Proof.
  induction xs as [|x rest IH]; intros ys; simpl.
  - reflexivity.
  - rewrite IH. rewrite auth_meet_assoc. reflexivity.
Qed.
```

## 17. `auth_meet_list_false_witness`

- Kind: `Lemma`
- Code SHA-256: `4b910523685ba0fd0a19cff7da934bc55e0b9da31c030b349d9951d69a97b3b8`
- Statement SHA-256: `9916a0a18d1232634d7eee6955e1056322aa8e9dc0ef82f9dd3e3f4e5537b40c`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000017_auth_meet_list_false_witness__4b910523685b.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2024–2033; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_list_false_witness : forall xs,
  auth_meet_list xs = false -> In false xs.
Proof.
  induction xs as [|x rest IH]; intros H.
  - simpl in H. discriminate.
  - simpl in H. unfold auth_meet in H. apply andb_false_iff in H.
    destruct H as [Hx | Hrest].
    + subst. simpl. left. reflexivity.
    + simpl. right. apply IH. exact Hrest.
Qed.
```

## 18. `auth_meet_list_op_any_false`

- Kind: `Lemma`
- Code SHA-256: `b26f6804792d6fa45327cf5e8e71285c82fbd0b54f5418d4bc958e373fba2991`
- Statement SHA-256: `ed3b802c5f32c27bff3116337f315fdaf4447d7a5c5fe0174c83e9e036edc266`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000018_auth_meet_list_op_any_false__b26f6804792d.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2545–2558; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_list_op_any_false :
  forall (xs : list AuthByOp) (op : OperationType),
    (exists a, In a xs /\ a op = false) ->
    auth_meet_list_op xs op = false.
Proof.
  induction xs as [|x rest IH]; intros op [a [Hin Hfalse]].
  - inversion Hin.
  - simpl in Hin. destruct Hin as [Heq | Hin'].
    + subst. simpl. rewrite Hfalse. reflexivity.
    + simpl.
      assert (H : auth_meet_list_op rest op = false).
      { apply IH. exists a. split; assumption. }
      rewrite H. unfold auth_meet. apply andb_false_r.
Qed.
```

## 19. `auth_meet_true`

- Kind: `Lemma`
- Code SHA-256: `97c1c88432036232a5541b853537c6958c98852d9138892403bed1eb660f5f97`
- Statement SHA-256: `2b6e18c35bdf0de131783d9483bac091eea480feadccc7bde501d3f1b0018eeb`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000019_auth_meet_true__97c1c8843203.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1990–1991; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma auth_meet_true : forall a, true ⊓ a = a.
Proof. intros. reflexivity. Qed.
```

## 20. `before_correct`

- Kind: `Theorem`
- Code SHA-256: `35b4f5bc445657e596ba7faef8fe26f3f7d92222b5a67b35ccd161c4d54cbf19`
- Statement SHA-256: `1efbd7aa21f90a98feedaa2ad83288801bf7023c6e1d043512b479564c1a8da5`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000020_before_correct__35b4f5bc4456.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203023–203031; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem before_correct :
  forall p iso c v t t',
    resolve_path p c = Some v ->
    parse_iso iso = Some t ->
    value_to_time v = Some t' ->
    eval_atom (Before p iso) c = Some (time_lt t' t).
Proof.
  intros. simpl. rewrite H, H0, H1. reflexivity.
Qed.
```

## 21. `boundary_profile_terminates_at_7`

- Kind: `Theorem`
- Code SHA-256: `00b4cb3a51a813db797b46755eecfeb38eb797e8309d75c460bfd48142b27261`
- Statement SHA-256: `b58443731dd17642485444f6b206b393445928453d25ee33029209d442837e34`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000021_boundary_profile_terminates_at_7__00b4cb3a51a8.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 718–732; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem boundary_profile_terminates_at_7 :
  forall b c k p f,
    hdr_profile (b_hdr b) = PB_BOUNDARY_1 ->
    stage1_parse b = Continue ->
    stage2_schema b = Continue ->
    stage3_version b = Continue ->
    stage4_digest b = Continue ->
    stage5_integrity b k = Continue ->
    stage6_boundary b c = Continue ->
    stage7_side b = Continue ->
    verify b c k p f = Verified.
Proof.
  intros b c k p f Hprof H1 H2 H3 H4 H5 H6 H7.
  unfold verify. rewrite H1, H2, H3, H4, H5, Hprof, H6, H7. reflexivity.
Qed.
```

## 22. `boundary_trichotomy`

- Kind: `Lemma`
- Code SHA-256: `8e8ea9d1fb3e1a10d1a7d7fd9efc8f6fe19d0cd4a471ae79c56e45153f7715a5`
- Statement SHA-256: `cd0ffc3885c69c22c3fd70789f3ccbfc95aa1bed2212693acf8ab3ce8d64cb78`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000022_boundary_trichotomy__8e8ea9d1fb3e.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25526–25535; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma boundary_trichotomy : forall s : State,
  boundary s > 0 \/ boundary s = 0 \/ boundary s < 0.
Proof.
  intro s.
  unfold boundary.
  destruct (total_order_T (Delta_p s - U_p s - delta_p s) 0) as [[Hlt | Heq] | Hgt].
  - right. right. exact Hlt.
  - right. left. exact Heq.
  - left. exact Hgt.
Qed.
```

## 23. `boundary_trichotomy`

- Kind: `Lemma`
- Code SHA-256: `d090783ae8d3b383ee35a601142e67eb059000dec5590af85d09ab771bf54e81`
- Statement SHA-256: `6f86b4ef9192836878300701add788ab2ef1c6e86655ba3844d5e3f3bf2f9ea5`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000023_boundary_trichotomy__d090783ae8d3.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 3978–3988; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma boundary_trichotomy :
  forall s : State,
    boundary s > 0 \/ boundary s = 0 \/ boundary s < 0.
Proof.
  intro s.
  unfold boundary.
  destruct (total_order_T (Delta_p s - U_p s - delta_p s) 0) as [[Hlt | Heq] | Hgt].
  - right. right. exact Hlt.
  - right. left. exact Heq.
  - left. exact Hgt.
Qed.
```

## 24. `bridge_axiom`

- Kind: `Theorem`
- Code SHA-256: `9faa70fbc423bc4047116ab59b7ad2af385e3d3f74d0faadabd72098166868a6`
- Statement SHA-256: `a35aed1d7eb01b6cbd40983b0ee022932cd8447507eacdb0ac99ff06b0e3f5d9`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000024_bridge_axiom__9faa70fbc423.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 641–659; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem bridge_axiom : forall x : State,
    B_impl x <= 0 ->
    exists ε_actual : R,
      (ε_ι < ε_actual)%R /\
      forall (iota_hat : State -> Identity) (E : Ensemble (State -> Identity)),
        (forall est, E est -> (ε_actual <= d_ι (est x) (ι' x))%R).
  Proof.
    intros x Hneg.
    exists (2 * ε_ι)%R.
    split.
    - (** 2*ε_ι > ε_ι by positivity of ε_ι *)
      assert (H : (0 < ε_ι)%R) by apply ε_ι_nonneg.
      assert (H2 : (ε_ι < 2 * ε_ι)%R) by lra.
      exact H2.
    - (** Minimal distance exceeds tolerance *)
      intros iota_hat E. intro H. specialize (H iota_hat).
      (** Placeholder: actual proof requires definition of E and U *)
      admit.
  Defined.
```

## 25. `canon_number_sound`

- Kind: `Theorem`
- Code SHA-256: `9ff3dcca086cf72019083d3ae27af51ff734852dfc59e44b881ea61fa07bb501`
- Statement SHA-256: `44377ca3473c715e40847197e5d91a7ef91260fb2aad25e5db5bae7efd35b36f`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000025_canon_number_sound__9ff3dcca086c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 314–320; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem canon_number_sound :
  forall q1 q2, Q_eq q1 q2 <-> canon_number q1 = canon_number q2.
Proof.
  intros q1 q2. split.
  - apply canon_number_unique.
  - apply canon_number_injective.
Qed.
```

## 26. `canon_preserves_err`

- Kind: `Theorem`
- Code SHA-256: `a8a84922f21d741f4d6552db6a266022d3f87451f24d7a4e750eeea8bb601498`
- Statement SHA-256: `3d65084d1aa8b50069fd40d019301ba8a0e1105ade04d666ca7a64f123a7d3d5`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000026_canon_preserves_err__a8a84922f21d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 360–362; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem canon_preserves_err :
  canonicalize JErr = JErr.
Proof. reflexivity. Qed.
```

## 27. `canon_str_nfc_idempotent`

- Kind: `Theorem`
- Code SHA-256: `9575ecaaded0fe995fee02f25d1bff414835af4f9be141eb6e75d7e2be78aa39`
- Statement SHA-256: `9ecddb1b0132852e4b8376d99777250c6f5fbf7aa2ab331bdad56cdeac1eabd1`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000027_canon_str_nfc_idempotent__9575ecaaded0.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 324–328; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem canon_str_nfc_idempotent :
  forall s, canonicalize (canonicalize (JStr s)) = canonicalize (JStr s).
Proof.
  intros s. simpl. rewrite nfc_idempotent. reflexivity.
Qed.
```

## 28. `categorical_uniqueness`

- Kind: `Theorem`
- Code SHA-256: `595a5a9f2cc29b38d292bf7b077cfd78233b36a290a032e808912408185eb0d2`
- Statement SHA-256: `8abec8745a9103214cbde85aff7fe47c03358c7e6835eba48c66a9e3be1a7ae8`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000028_categorical_uniqueness__595a5a9f2cc2.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1025–1032; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem categorical_uniqueness :
    (** If two models satisfy the same admissibility verdicts, they are isomorphic *)
    forall (M1 M2 : Type) (i1 : M1 -> State) (i2 : M2 -> State),
      (forall x : M1, X_adm (i1 x) <-> X_adm (i2 (f M1 M2))) ->
      M1 = M2.
  Proof.
    admit. (* ADMITTED: requires model theory foundations *)
  Defined.
```

## 29. `certificate_insufficient`

- Kind: `Theorem`
- Code SHA-256: `f812a9e23c437fb9dd082fc20c508781e0979f76d0ce4e634a219d19c4832eb5`
- Statement SHA-256: `44284405f0752cc62ba0d2a75e3e37435d1d75cf18ee7802b3248cfb515d4e21`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000029_certificate_insufficient__f812a9e23c43.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 788–806; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem certificate_insufficient : forall (x : State) (τ : Transformation) (π : Provenance),
    K x τ π ->
    ~ Comp τ ->
    ~ Adm x τ O R_max.
  Proof.
    intros x τ π HK Hnot_comp.
    apply not_and_or in Hnot_comp.
    destruct Hnot_comp as [H | H].
    - (** Comp τ is false, certificate may be insufficient *)
      unfold K in HK; destruct HK as [y [Hτ [Hcert Horigin]]].
      unfold W; intro HW.
      destruct HW as [y' [Hτ' [Hd [Hbounded HB]]]].
      (** Certificate exists but witness fails → incompleteness *)
      admit.
    - (** Resource bound fails, separately handled *)
      unfold not; intro Hadm.
      unfold Adm in Hadm; destruct Hadm as [HW HR].
      contradiction.
  Defined.
```

## 30. `closure_theorem`

- Kind: `Theorem`
- Code SHA-256: `7739d3daebd3d8cdd880dedabd00fbac08b8ba019e89f50221837af7b0179377`
- Statement SHA-256: `a81bb053261acaa443b40be657739f0776bc7a0115073bd8666cd4519415587c`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000030_closure_theorem__7739d3daebd3.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 997–1002; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem closure_theorem : forall (x : State),
    layer_of x = L0_Kernel \/ layer_of x = L1_Derived \/ layer_of x = L2_Empirical \/
    layer_of x = L3_Implementation \/ layer_of x = L4_Exposition.
  Proof.
    intros x. left; reflexivity.
  Defined.
```

## 31. `closure_under_composition_v2`

- Kind: `Theorem`
- Code SHA-256: `7e26bb09240caf81cd38037e955be2087d5669a34a57958ecf49bdf030498a00`
- Statement SHA-256: `df47f5cbf90cb2565a160e92486709ffd043d75e24412586d63fee3295cdf8ca`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000031_closure_under_composition_v2__7e26bb09240c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5048–5052; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Theorem closure_under_composition_v2 :
  forall (O1 O2 : Type) (b1 b2 : Z)
    `{Operator_v2 O1 b1} `{Operator_v2 O2 b2},
    Operator_v2 (O1 * O2) (b1 + b2).
Proof. exact _. Qed.
```

## 32. `commit_preserves_unique`

- Kind: `Lemma`
- Code SHA-256: `8a53a5f1a42c02d56c8d0dfdfe008481f3563dc98ceadae368b6ee5ada7304c6`
- Statement SHA-256: `dd17fcf3f1d3d565781280bfc6b83b7f6f7c081d4a706e61e0bc9091d50e9c86`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000032_commit_preserves_unique__8a53a5f1a42c.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1886–1898; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma commit_preserves_unique : forall r a,
  uid_unique r ->
  (forall b, In b r -> art_uid b <> art_uid a) ->
  uid_unique (commit r a).
Proof.
  intros r a Hu Hfresh.
  unfold uid_unique, commit. intros a1 a2 H1 H2 Heq.
  destruct H1 as [H1|H1]; destruct H2 as [H2|H2].
  - subst a1 a2. reflexivity.
  - subst a1. specialize (Hfresh a2 H2). symmetry in Heq. contradiction.
  - subst a2. specialize (Hfresh a1 H1). contradiction.
  - apply Hu; assumption.
Qed.
```

## 33. `complete_certification`

- Kind: `Theorem`
- Code SHA-256: `3079f5891e2dc41073e847814956714f9233df1ad1d1bb7b2b3bbe0c68e5e0b1`
- Statement SHA-256: `1f8f8a78347e59e04b937402e4d273067cbc2b69eca3c32314f4fda597dffaa2`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000033_complete_certification__3079f5891e2d.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 811–819; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem complete_certification : forall (τ : Transformation) (x : State) (π : Provenance),
    Comp τ ->
    K x τ π ->
    W x τ.
  Proof.
    intros τ x π HComp HK.
    apply HComp.
    exists π; exact HK.
  Defined.
```

## 34. `compose_admissible`

- Kind: `Theorem`
- Code SHA-256: `5cee8843bb77482feb435923f6db3c31d5aea59bb7be586f3ecf3853fa0c6d5c`
- Statement SHA-256: `081eaee1b6292d2887b037fe4ce9e475af7ddad63af7bf4125364dfaefdef674`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000034_compose_admissible__5cee8843bb77.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8033–8070; embedded `proofbundle_2026-05_ecacf7ad49386252_ecacf7ad49386252_000196_ecacf7ad4938_kernel.v`

```coq
Theorem compose_admissible : forall x f g o R1 R2,
  Admissible x f o ->
  (forall y, f x = Some y -> Admissible y g o) ->
  composable g f ->
  eps_i + eps_i <= eps_i ->
  cost f o <= R1 ->
  cost g o <= R2 ->
  R1 + R2 <= Rmax ->
  Admissible x (g ∘ f) o.
Proof.
  intros x f g o R1 R2 Hadm Hadmy Hcomp Heps HcostR1 HcostR2 Hsum.
  unfold Admissible in Hadm. destruct Hadm as [Hwf _].
  unfold Witness in Hwf. destruct Hwf as [y [Hfx [Hb1 [Hd1 Hbnd1]]]].
  assert (Hadm_y : Admissible y g o) by (apply Hadmy; exact Hfx).
  unfold Admissible in Hadm_y. destruct Hadm_y as [Hwy _].
  unfold Witness in Hwy. destruct Hwy as [z [Hgy [Hb2 [Hd2 Hbnd2]]]].
  assert (Hcost : cost (g ∘ f) o <= cost f o + cost g o) by
    (apply (cost_compose g f o x y z); assumption).
  split.
  - unfold Witness. exists z. split.
    + unfold compose. rewrite Hfx. exact Hgy.
    + split.
      * exact Hb2.
      * split.
        { apply Rle_trans with (r2 := d_i (iota x) (iota y) + d_i (iota y) (iota z)).
          - apply d_i_triangle.
          - apply Rle_trans with (r2 := eps_i + eps_i).
            + apply Rplus_le_compat; assumption.
            + assumption.
        }
        { exact Hbnd2.
        }
  - apply Rle_trans with (r2 := cost f o + cost g o).
    + exact Hcost.
    + apply Rle_trans with (r2 := R1 + R2).
      * apply Rplus_le_compat; assumption.
      * assumption.
Qed.
```

## 35. `compose_assoc`

- Kind: `Lemma`
- Code SHA-256: `e3581cab559eb82ccf69abd8bd44202cb70409385f0d4f2a6ceddae4a1bb9865`
- Statement SHA-256: `b2e8c73979559802ac3eefc879f17c1cc9b4071ed4132cd01b6fdabd2d28bc07`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000035_compose_assoc__e3581cab559e.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25477–25487; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma compose_assoc : forall h g f : Transformation,
  h ∘ (g ∘ f) = (h ∘ g) ∘ f.
Proof.
  intros h g f.
  apply functional_extensionality.
  intro s.
  unfold compose.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.
```

## 36. `compose_assoc`

- Kind: `Lemma`
- Code SHA-256: `f23bcd71123f8f4079dc4ba9d330b0c50d255970ce4f47ac9a9d56163757ed05`
- Statement SHA-256: `cc0a31dafbfd4c32908d943bfd9fa4d4b945448a953c6eb1253fac01d2149cc3`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000036_compose_assoc__f23bcd71123f.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 3924–3935; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma compose_assoc :
  forall h g f : Transformation,
    h ∘ (g ∘ f) = (h ∘ g) ∘ f.
Proof.
  intros h g f.
  apply functional_extensionality.
  intro s.
  unfold compose.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.
```

## 37. `compose_associative`

- Kind: `Lemma`
- Code SHA-256: `41bc7927718ccd055b67dabf1fc75382fec005adf4447b93a3470fc7508cdaa7`
- Statement SHA-256: `8450aa66fdbab18ed6f1e57aad7ab1c70d3e7d0c7fb5c3892b84ff11ed89508f`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000037_compose_associative__41bc7927718c.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 434–441; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma compose_associative : forall (τ₁ τ₂ τ₃ : Transformation),
    (τ₃ ∘ (τ₂ ∘ τ₁))%type = ((τ₃ ∘ τ₂) ∘ τ₁)%type.
  Proof.
    intros τ₁ τ₂ τ₃.
    unfold compose_transformations.
    extensionality x.
    destruct (τ₁ x); reflexivity.
  Defined.
```

## 38. `compose_Budgeted_2`

- Kind: `Lemma`
- Code SHA-256: `0f8e841615dddbc145520a264eafb2e1868bb6449ef83bfd14800a904b69b1b3`
- Statement SHA-256: `92c601f09fe91310051b65dcdda576027431d4b6b9790445401b17729d3c9dda`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000038_compose_Budgeted_2__0f8e841615dd.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4880–4897; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Budgeted_2 {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x x'',
    seq_apply p x = Some x'' ->
    Z.abs (coh_budget x'' - coh_budget x) <= 2.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply in Hx. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Budgeted O1 H1 o1 x x' E1) as B1.
  pose proof (@Budgeted O2 H2 o2 x' x'' Hx) as B2.
  assert (T : Z.abs (coh_budget x'' - coh_budget x) <=
              Z.abs (coh_budget x'' - coh_budget x') +
              Z.abs (coh_budget x' - coh_budget x)).
  { replace (coh_budget x'' - coh_budget x) with
      ((coh_budget x'' - coh_budget x') + (coh_budget x' - coh_budget x)) by ring.
    apply Z.abs_triangle. }
  lia.
Qed.
```

## 39. `compose_Budgeted_v2`

- Kind: `Lemma`
- Code SHA-256: `e05dd821b7dd51da459b1ad77d0fd17884f326303aee659b7e553800f390bacc`
- Statement SHA-256: `3cfb0e538c5d63580b1e812b4817db8fb5ed8bfd8789d9affef49df5aca6404f`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000039_compose_Budgeted_v2__e05dd821b7dd.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4984–5002; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Budgeted_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x x'',
    seq_apply_v2 p x = Some x'' ->
    Z.abs (coh_budget x'' - coh_budget x) <= b1 + b2.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Budgeted_v2 O1 b1 H1 o1 x x' E1) as B1.
  pose proof (@Budgeted_v2 O2 b2 H2 o2 x' x'' Hx) as B2.
  assert (T : Z.abs (coh_budget x'' - coh_budget x) <=
              Z.abs (coh_budget x'' - coh_budget x') +
              Z.abs (coh_budget x' - coh_budget x)).
  { replace (coh_budget x'' - coh_budget x) with
      ((coh_budget x'' - coh_budget x') + (coh_budget x' - coh_budget x)) by ring.
    apply Z.abs_triangle. }
  lia.
Qed.
```

## 40. `compose_Fresh_v2`

- Kind: `Lemma`
- Code SHA-256: `0ac0cb148e3e31abe56e39e0ae1e9361f43b1edd611071a864b0e96bea89cb17`
- Statement SHA-256: `ddcb4b6c7bb11ab5236a0641905fabb75afbcdde0f8a1841db6a3b0755104b12`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000040_compose_Fresh_v2__0ac0cb148e3e.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5023–5033; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Fresh_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (pair : O1 * O2) x x'',
    seq_apply_v2 pair x = Some x'' ->
    forall p, List.In p (prims x'') -> ~ prim_id_in p (prims x).
Proof.
  intros [o1 o2] x x'' Hx p Hin.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  exact (uuid_global_freshness o1 o2 x x' x'' E1 Hx p Hin).
Qed.
```

## 41. `compose_id_left`

- Kind: `Lemma`
- Code SHA-256: `d50d668738516093e78192e4b35471892ea97e0e4f58053efa84f7cd8955be21`
- Statement SHA-256: `6bbae5ab97fbb4cadd2ef11f6dc2752d5eeb3c9247f68b5b57e8d6dc3f0fe7a6`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000041_compose_id_left__d50d66873851.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 3937–3948; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma compose_id_left :
  forall f : Transformation,
    id_transformation ∘ f = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.
```

## 42. `compose_id_left`

- Kind: `Lemma`
- Code SHA-256: `dacf7fa4df70ad25400b30858fab0f81db6c2d0f6530ed3e7ba211f651abe7a2`
- Statement SHA-256: `301443fbc8326583354ab17a9872b338180fc2377119b83744867af75764116c`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000042_compose_id_left__dacf7fa4df70.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25489–25499; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma compose_id_left : forall f : Transformation,
  id_transformation ∘ f = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.
```

## 43. `compose_id_right`

- Kind: `Lemma`
- Code SHA-256: `0203066b3929acebe1e22279253907f3ab288b2da117c6bc945e8c6069d06954`
- Statement SHA-256: `0b2161b6f8bb85fb3239f146476299739850930f5f4e0f734d95b1b88c56abc1`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000043_compose_id_right__0203066b3929.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25501–25509; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma compose_id_right : forall f : Transformation,
  f ∘ id_transformation = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  reflexivity.
Qed.
```

## 44. `compose_id_right`

- Kind: `Lemma`
- Code SHA-256: `e5a2502823ca1e7ecb339541c6cc00459e35d06a295096445e72fcf38a0bb8e3`
- Statement SHA-256: `13f0d5c77bab4ba9d4ea44d92f35902d48b6145855d0a6e2f20f2d8db9d1f199`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000044_compose_id_right__e5a2502823ca.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 3950–3959; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma compose_id_right :
  forall f : Transformation,
    f ∘ id_transformation = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  reflexivity.
Qed.
```

## 45. `compose_Identity`

- Kind: `Lemma`
- Code SHA-256: `e64ea8436a8ded78bd4cee41e914e84e0609160d76c4fff16948ec5789404abb`
- Statement SHA-256: `a9eb0eb2beca77495f0468f0a58f85d380e281342a939d95ae63accc3de6e75f`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000045_compose_Identity__e64ea8436a8d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4860–4871; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Identity {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x x'',
    seq_apply p x = Some x'' ->
    root_id x'' = root_id x.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply in Hx. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Identity O1 H1 o1 x x' E1) as I1.
  pose proof (@Identity O2 H2 o2 x' x'' Hx) as I2.
  congruence.
Qed.
```

## 46. `compose_Identity_v2`

- Kind: `Lemma`
- Code SHA-256: `96e084c495d11669f14faaf98c8014c1d6c81b68a1e51dcd3ab8b2b90815432e`
- Statement SHA-256: `8ecfb77cefb70f03239241d6af29bea420cf7d1d8329681f71290bece56c7692`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000046_compose_Identity_v2__96e084c495d1.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4969–4981; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Identity_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x x'',
    seq_apply_v2 p x = Some x'' ->
    root_id x'' = root_id x.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Identity_v2 O1 b1 H1 o1 x x' E1) as I1.
  pose proof (@Identity_v2 O2 b2 H2 o2 x' x'' Hx) as I2.
  congruence.
Qed.
```

## 47. `compose_Lipschitz`

- Kind: `Lemma`
- Code SHA-256: `5b4dc6f6ea90ea5218ffb29023ce71587d13c45cd2d6da9bc7829865d5452f86`
- Statement SHA-256: `1a9083e7a8c2166a97a784603697e1a4f6d30f5abfe3dcabefc5460a2f5ad868`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000047_compose_Lipschitz__5b4dc6f6ea90.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4841–4854; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Lipschitz {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x y x'' y'',
    seq_apply p x = Some x'' ->
    seq_apply p y = Some y'' ->
    Z.abs (coh_budget x'' - coh_budget y'') <= Z.abs (coh_budget x - coh_budget y).
Proof.
  intros [o1 o2] x y x'' y'' Hx Hy.
  unfold seq_apply in Hx, Hy. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1x; [|discriminate].
  destruct (apply o1 y) as [y'|] eqn:E1y; [|discriminate].
  pose proof (@Lipschitz O1 H1 o1 x y x' y' E1x E1y) as L1.
  pose proof (@Lipschitz O2 H2 o2 x' y' x'' y'' Hx Hy) as L2.
  lia.
Qed.
```

## 48. `compose_Lipschitz_v2`

- Kind: `Lemma`
- Code SHA-256: `a23169c16f690cdd83f52acf2e4b0ec72f26871e6cd7eafab55a01a6f8860ab7`
- Statement SHA-256: `6ef8719c89426809dbe85fa7cb650dda126cf59677ab2d693f1e62a16badeaf7`
- Occurrences: 23
- Source statuses: `AXIOMATIC` × 23
- Extracted code file: `proof_code/axiomatic/coq/000048_compose_Lipschitz_v2__a23169c16f69.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4952–4966; embedded `proofbundle_2026-05_45ad746646e60f80_45ad746646e60f80_000117_45ad746646e6_2026_03_23_compose_v2.v`

```coq
Lemma compose_Lipschitz_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x y x'' y'',
    seq_apply_v2 p x = Some x'' ->
    seq_apply_v2 p y = Some y'' ->
    Z.abs (coh_budget x'' - coh_budget y'') <= Z.abs (coh_budget x - coh_budget y).
Proof.
  intros [o1 o2] x y x'' y'' Hx Hy.
  unfold seq_apply_v2 in Hx, Hy. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1x; [|discriminate].
  destruct (apply_v2 o1 y) as [y'|] eqn:E1y; [|discriminate].
  pose proof (@Lipschitz_v2 O1 b1 H1 o1 x y x' y' E1x E1y) as L1.
  pose proof (@Lipschitz_v2 O2 b2 H2 o2 x' y' x'' y'' Hx Hy) as L2.
  lia.
Qed.
```

## 49. `compose_Witness`

- Kind: `Lemma`
- Code SHA-256: `da49d3cf1e5f3025f3766f8e9b6ddb5568244d2dbaaf030958b433baebb611eb`
- Statement SHA-256: `bdeeb69401a8a0f6e842efa7acf7987f53d733c1c1d9345cd18a26875414af3b`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000049_compose_Witness__da49d3cf1e5f.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8010–8030; embedded `proofbundle_2026-05_ecacf7ad49386252_ecacf7ad49386252_000196_ecacf7ad4938_kernel.v`

```coq
Lemma compose_Witness : forall x f g,
  Witness x f ->
  (forall y, f x = Some y -> Witness y g) ->
  composable g f ->
  eps_i + eps_i <= eps_i ->
  Witness x (g ∘ f).
Proof.
  intros x f g Hwf Hwfy Hcomp Heps.
  unfold Witness in Hwf. destruct Hwf as [y [Hfx [Hb1 [Hd1 Hbnd1]]]].
  assert (Hwy : Witness y g) by (apply Hwfy; exact Hfx).
  unfold Witness in Hwy. destruct Hwy as [z [Hgy [Hb2 [Hd2 Hbnd2]]]].
  exists z. split.
  - unfold compose. rewrite Hfx. exact Hgy.
  - split.
    + exact Hb2.
    + split.
      * apply Rle_trans with (r2 := d_i (iota x) (iota y) + d_i (iota y) (iota z)).
        { apply d_i_triangle. }
        { apply Rle_trans with (r2 := eps_i + eps_i); try lra. }
      * exact Hbnd2.
Qed.
```

## 50. `composition_admissibility`

- Kind: `Theorem`
- Code SHA-256: `0e59376d4b88bea927c9b8865123602dcb187e42182f8217d1110e0d5c7b11f4`
- Statement SHA-256: `49676d64c7745b09490e2e712987f38ae18cc66745bd961a8e5467bf35b32033`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000050_composition_admissibility__0e59376d4b88.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 850–884; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem composition_admissibility : forall (x : State) (τ₁ τ₂ : Transformation) (o : O) (R_bound : R),
    Adm x τ₁ o (R_bound / 2)%R ->
    (exists y, τ₁ x = Some y /\ Adm y τ₂ o (R_bound / 2)%R) ->
    Adm x (τ₂ ∘ τ₁) o R_bound.
  Proof.
    intros x τ₁ τ₂ o R_bound Hadm1 [y [Hτ1xy Hadm2]].
    unfold Adm in *; destruct Hadm1 as [HW1 HC1], Hadm2 as [HW2 HC2].
    unfold W in *; destruct HW1 as [y1 [Hτ1 Hd1 [Hb1 HB1]]], HW2 as [y2 [Hτ2 Hd2 [Hb2 HB2]]].
    (** τ₂ ∘ τ₁ applied to x yields y2 via y1 = y *)
    assert (Hcomp : (τ₂ ∘ τ₁) x = Some y2).
    { unfold compose_transformations; rewrite Hτ1xy; exact Hτ2. }
    split.
    - (** Witness holds for composition *)
      exists y2; split.
      + exact Hcomp.
      + split.
        * (** Identity bound via triangle inequality *)
          assert (Hd : (d_ι (ι' y2) (ι' x) <= ε_ι + ε_ι)%R).
          { transitivity (d_ι (ι' y2) (ι' y1)).
            - (** Note: y1 = y from Hτ1xy *)
              admit.
            - admit.
          }
          (** If 2*ε_ι <= ε_ι (requires adjustment) *)
          admit.
        * split.
          { admit. } (** Boundedness *)
          { admit. } (** Boundary positive *)
    - (** Resource bound *)
      assert (Hres : (C (τ₂ ∘ τ₁) o <= R_bound)%R).
      { (** Resource consumption is additive in composition *)
        admit.
      }
      exact Hres.
  Defined.
```

## 51. `cycle_rejected`

- Kind: `Theorem`
- Code SHA-256: `9bb3091878344febedf6c05d04504aef05c79586f5f32959c70442e7cef8e7f2`
- Statement SHA-256: `a9f4d688b4884042b78d7443e46ade940351a6debca6ce2e3cecd7324fa2a6c2`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000051_cycle_rejected__9bb309187834.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1009–1019; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem cycle_rejected :
  forall b provided visited fuel,
    in_visited (hdr_bundle_id (b_hdr b)) visited = true ->
    fuel > 0 ->
    walk b provided visited fuel = LCycle.
Proof.
  intros b provided visited fuel Hin Hfuel.
  destruct fuel.
  - lia.
  - simpl. rewrite Hin. reflexivity.
Qed.
```

## 52. `d_ι_nonneg`

- Kind: `Lemma`
- Code SHA-256: `33626adb128a51a883fc5286551d161dfb9d44b7c9cff2fffe773e7f31baf088`
- Statement SHA-256: `6fc249ac778c6e28468f2cba322ae8fe4b32c7a480b864a94f6a160211e869af`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000052_d___nonneg__33626adb128a.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 272–273; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma d_ι_nonneg : forall i1 i2, (0 <= d_ι i1 i2)%R.
  Proof. intros; unfold d_ι; lra. Qed.
```

## 53. `d_ι_refl`

- Kind: `Lemma`
- Code SHA-256: `3c3e50174e505013da7eb9f06adbd2a618c9e6796f295660731e5b516971543b`
- Statement SHA-256: `ca7799af186d2f8184030a8bde32490fcb330ccfedf3253603bee688e1ad17aa`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000053_d___refl__3c3e50174e50.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 278–279; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma d_ι_refl : forall i, (d_ι i i = 0)%R.
  Proof. intros; unfold d_ι; lra. Qed.
```

## 54. `d_ι_sym`

- Kind: `Lemma`
- Code SHA-256: `1c4b32d52f154c589f8aa88f4b9166d261cdcd53e9f68a235d1c366806703de0`
- Statement SHA-256: `ecca3045c9e75d116f6e4d48fb35a7dec174d1c640c7f2dbeb9f12df8464de7f`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000054_d___sym__1c4b32d52f15.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 275–276; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma d_ι_sym : forall i1 i2, (d_ι i1 i2 = d_ι i2 i1)%R.
  Proof. intros; unfold d_ι; lra. Qed.
```

## 55. `d_ι_triangle`

- Kind: `Lemma`
- Code SHA-256: `e40905f2fb8102820057dff0db5deeba62de0d3e02951f8c90bbe51d06f37e87`
- Statement SHA-256: `48d8de78c45485c8d89bdb7b07308aa4d5155101d3d7abc3eae56ffca0b533f2`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000055_d___triangle__e40905f2fb81.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 281–282; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma d_ι_triangle : forall i1 i2 i3, (d_ι i1 i3 <= d_ι i1 i2 + d_ι i2 i3)%R.
  Proof. intros; unfold d_ι; lra. Qed.
```

## 56. `decomposition_stability`

- Kind: `Theorem`
- Code SHA-256: `e339a491b375b2ef26fe6e2b29d9a0a1f57a900cbc034e26d0bdfb4446d86f32`
- Statement SHA-256: `c9968f8b79de9ad83e628a05088d514453f3f669e100259e276d919716835351`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000056_decomposition_stability__e339a491b375.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 889–916; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem decomposition_stability : forall (γ : Trajectory) (t0 t_star t1 : R),
    Adm_glob γ t0 t1 ->
    (t0 <= t_star <= t1)%R ->
    exists (γ1 γ2 : Trajectory),
      (forall t, (t0 <= t <= t_star)%R -> γ1 t = γ t) /\
      (forall t, (t_star <= t <= t1)%R -> γ2 t = γ t) /\
      Adm_glob γ1 t0 t_star /\
      Adm_glob γ2 t_star t1.
  Proof.
    intros γ t0 t_star t1 Hadm Ht.
    exists (fun t => γ t), (fun t => γ t).
    split; [reflexivity | split; [reflexivity | split]].
    - (** First segment admissible *)
      unfold Adm_glob in Hadm; destruct Hadm as [HB [Hd He]].
      split.
      + intros t Ht12; apply HB; omega.
      + split.
        * intros t Ht12; apply Hd; omega.
        * (** Energy bound preserved by subinterval *)
          admit.
    - (** Second segment admissible *)
      unfold Adm_glob in Hadm; destruct Hadm as [HB [Hd He]].
      split.
      + intros t Ht12; apply HB; omega.
      + split.
        * intros t Ht12; apply Hd; omega.
        * admit. (** Energy bound *)
  Defined.
```

## 57. `digest_mismatch_rejected`

- Kind: `Theorem`
- Code SHA-256: `9bade980e69229f093d04ea73d100ae72f44096873c59be332c19b55ca75c1b8`
- Statement SHA-256: `48ca5b659e2d1c9d13c64f2ec7d5370bf6f25930b128ecdd49abbacbc626ac68`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000057_digest_mismatch_rejected__9bade980e692.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1024–1042; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem digest_mismatch_rejected :
  forall b provided visited fuel parent r rest,
    fuel > 0 ->
    in_visited (hdr_bundle_id (b_hdr b)) visited = false ->
    b_refs b = r :: rest ->
    find_bundle (pr_parent_id r) provided = Some parent ->
    digest_alg parent (canonical_minus_seal parent) <> pr_parent_digest r ->
    walk b provided visited fuel = LDigestMismatch.
Proof.
  intros b provided visited fuel parent r rest Hfuel Hnotvisited Hrefs Hfind Hmismatch.
  destruct fuel.
  - lia.
  - simpl. rewrite Hnotvisited. rewrite Hrefs.
    simpl. rewrite Hfind.
    destruct (digest_eq_dec (digest_alg parent (canonical_minus_seal parent))
                            (pr_parent_digest r)).
    + contradiction.
    + reflexivity.
Qed.
```

## 58. `Dim_eqb_eq`

- Kind: `Lemma`
- Code SHA-256: `a7437c7cde9d52155fcbaaf54cf9ebb72e9fd749446991e3de93568bd69fbb79`
- Statement SHA-256: `166098a664fa20336267d69304773fb7720b48eb580493a916365d7b94ceac9f`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000058_Dim_eqb_eq__a7437c7cde9d.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2662–2663; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma Dim_eqb_eq : forall d1 d2, Dim_eqb d1 d2 = true -> d1 = d2.
Proof. destruct d1, d2; simpl; intro H; (reflexivity || discriminate). Qed.
```

## 59. `Dim_eqb_neq`

- Kind: `Lemma`
- Code SHA-256: `ce99b470cec43178fd41c0285d153117c8c0f55574ef1144d7c1321b4d299203`
- Statement SHA-256: `4e6df0228811dcec60395c625ee8f18a4901e5e377bb95878a8aaabade2cdc45`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000059_Dim_eqb_neq__ce99b470cec4.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2665–2666; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma Dim_eqb_neq : forall d1 d2, d1 <> d2 -> Dim_eqb d1 d2 = false.
Proof. destruct d1, d2; simpl; intro H; try reflexivity; exfalso; apply H; reflexivity. Qed.
```

## 60. `Dim_eqb_refl`

- Kind: `Lemma`
- Code SHA-256: `45394ba85e78f4d5c1a35d90b95a6e9890f3e9a960641978672c93bf3a053ee0`
- Statement SHA-256: `00c3a8f874689843255197b1427f3fb4d2026ff9c44ccc29a62f8e075a084cdb`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000060_Dim_eqb_refl__45394ba85e78.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2659–2660; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma Dim_eqb_refl : forall d, Dim_eqb d d = true.
Proof. destruct d; reflexivity. Qed.
```

## 61. `dispatch_deterministic`

- Kind: `Theorem`
- Code SHA-256: `f676d93d22184ce8a6ac051810dbd1a270b99910a12072d84c02b7a1a1fbf9b7`
- Statement SHA-256: `cccd9361659350d50203e303f4ce89834f179004179ea7295c449fbee9dd9c26`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000061_dispatch_deterministic__f676d93d2218.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202808–202813; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem dispatch_deterministic :
  forall alg pk msg sig b1 b2,
    dispatch_verify alg pk msg sig = b1 ->
    dispatch_verify alg pk msg sig = b2 ->
    b1 = b2.
Proof. intros. rewrite <- H, <- H0. reflexivity. Qed.
```

## 62. `dispatch_sound`

- Kind: `Theorem`
- Code SHA-256: `8fa8ae8d63bf4f1f7bd52a383a9d3ddb74638304b76b5cb272c238231f74d14b`
- Statement SHA-256: `3e3c54c1fc71274e534fe5d1f449a8a0d06be92d3f98c216f7163300686ba332`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000062_dispatch_sound__8fa8ae8d63bf.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202818–202847; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem dispatch_sound :
  forall alg pk msg sig,
    dispatch_verify alg pk msg sig = true ->
    match alg with
    | Ed25519' => exists priv, pk = Ed25519_pubkey_of priv /\
                                Ed25519_sign priv msg = sig
    | ECDSA_P256' => exists priv, pk = ECDSA_P256_pubkey_of priv /\
                                   ECDSA_P256_sign priv msg = sig
    | ECDSA_P384' => exists priv, pk = ECDSA_P384_pubkey_of priv /\
                                   ECDSA_P384_sign priv msg = sig
    | ECDSA_P521' => exists priv, pk = ECDSA_P521_pubkey_of priv /\
                                   ECDSA_P521_sign priv msg = sig
    | RSA_PSS_2048' => exists priv, pk = RSA_PSS_2048_pubkey_of priv /\
                                     RSA_PSS_2048_sign priv msg = sig
    | RSA_PSS_3072' => exists priv, pk = RSA_PSS_3072_pubkey_of priv /\
                                     RSA_PSS_3072_sign priv msg = sig
    | RSA_PSS_4096' => exists priv, pk = RSA_PSS_4096_pubkey_of priv /\
                                     RSA_PSS_4096_sign priv msg = sig
    end.
Proof.
  intros alg pk msg sig H.
  destruct alg; simpl in H.
  - apply Ed25519_EUF_CMA. exact H.
  - apply ECDSA_P256_EUF_CMA. exact H.
  - apply ECDSA_P384_EUF_CMA. exact H.
  - apply ECDSA_P521_EUF_CMA. exact H.
  - apply RSA_PSS_2048_EUF_CMA. exact H.
  - apply RSA_PSS_3072_EUF_CMA. exact H.
  - apply RSA_PSS_4096_EUF_CMA. exact H.
Qed.
```

## 63. `dispatch_total`

- Kind: `Theorem`
- Code SHA-256: `558bdbe5c436c346a66dfaae8b9400db6284574f691289ce513af72c324b89e8`
- Statement SHA-256: `4b5dc12246418606928c23be1043ab1a6495fb7be75ffeba1fe00bc4cb51d53b`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000063_dispatch_total__558bdbe5c436.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202804–202806; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem dispatch_total :
  forall alg pk msg sig, exists b, dispatch_verify alg pk msg sig = b.
Proof. intros. exists (dispatch_verify alg pk msg sig). reflexivity. Qed.
```

## 64. `divergence_severity_bounded`

- Kind: `Lemma`
- Code SHA-256: `ef468524c546ae7b666c5c98688746581ae4643044b6e332107f93b7fecca3d4`
- Statement SHA-256: `b7a90e1108bdeb9268ae12f09dacba1d5790a101f64b7f67f9988eb004a27165`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000064_divergence_severity_bounded__ef468524c546.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 8147–8151; embedded `proofbundle_2026-05_fe41ece393f174f3_fe41ece393f174f3_000184_fe41ece393f1_divergence.v`

```coq
Lemma divergence_severity_bounded :
  forall dm, divergence_severity dm <= 6.
Proof.
  intro dm. destruct dm; simpl; lia.
Qed.
```

## 65. `ecdsa_p256_needs_32`

- Kind: `Theorem`
- Code SHA-256: `4d17a60c18f5d649eae5706a15fee2775283e0c388d392f53182fdc3dc75a04f`
- Statement SHA-256: `6be8964dddd72b4e14b9ceb8edbccd2c316e3ed027f26ecf19378a7ddb7ca725`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000065_ecdsa_p256_needs_32__4d17a60c18f5.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1143–1150; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem ecdsa_p256_needs_32 :
  forall d, compatible d ECDSA_P256 = true <->
            digest_size d = 32.
Proof.
  intros. unfold compatible. simpl.
  destruct d; simpl; split; intro H; auto;
    try discriminate; try reflexivity.
Qed.
```

## 66. `ecdsa_p384_needs_48`

- Kind: `Theorem`
- Code SHA-256: `ee9b32e04f5076309637a6c43f4751f0d36c930ad5c54be9f692263034599eb5`
- Statement SHA-256: `6538e3af1d39e09d83a9697fce276562be3ecd4e1308100982f8d7b71fa94067`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000066_ecdsa_p384_needs_48__ee9b32e04f50.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1152–1159; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem ecdsa_p384_needs_48 :
  forall d, compatible d ECDSA_P384 = true <->
            digest_size d = 48.
Proof.
  intros. unfold compatible. simpl.
  destruct d; simpl; split; intro H; auto;
    try discriminate; try reflexivity.
Qed.
```

## 67. `ed25519_accepts_any`

- Kind: `Theorem`
- Code SHA-256: `17230c736002e59d1296cdf52077130eb0b21c4c7beeb620983addd068d3cfb9`
- Statement SHA-256: `5ec8a0d303bf03ed67e00c6e13d58ccbae18abbd4550d3ed9673e636cdd394f9`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000067_ed25519_accepts_any__17230c736002.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1139–1141; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem ed25519_accepts_any :
  forall d, compatible d Ed25519 = true.
Proof. intros. destruct d; reflexivity. Qed.
```

## 68. `empty_refs_valid`

- Kind: `Theorem`
- Code SHA-256: `5da43de61de5913e227e7fc926686de6f4817952d1ab762c56fb334f60e27dc2`
- Statement SHA-256: `a529d868911eca74b768d388de6dde5c2b731dc90bf14c23276fbf5d45c34497`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000068_empty_refs_valid__5da43de61de5.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1070–1081; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem empty_refs_valid :
  forall b provided visited fuel,
    fuel > 0 ->
    in_visited (hdr_bundle_id (b_hdr b)) visited = false ->
    b_refs b = [] ->
    walk b provided visited fuel = LValid.
Proof.
  intros b provided visited fuel Hfuel Hnotvisited Hrefs.
  destruct fuel.
  - lia.
  - simpl. rewrite Hnotvisited. rewrite Hrefs. reflexivity.
Qed.
```

## 69. `equals_correct`

- Kind: `Theorem`
- Code SHA-256: `95ae2c6ec2f9fa708fd7a4bd423d64debeda0fb76a52ee79329ce9815a714348`
- Statement SHA-256: `ac3dbc37f152147c1a0899f38766a3760bbeec9de4c18c66f2b2b85f2ec915fe`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000069_equals_correct__95ae2c6ec2f9.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202987–202991; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem equals_correct :
  forall p v c v',
    resolve_path p c = Some v' ->
    eval_atom (Equals p v) c = Some (value_eq v' v).
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 70. `equals_missing_path_false`

- Kind: `Theorem`
- Code SHA-256: `acf5b2d768b699c830881c4da1566f0851f5877bfba509843f9e3673b5085bd2`
- Statement SHA-256: `c0edd3ba70cf411a897bb86d13096e3ca1ad95aeb1a42a4ad215ab4d2adf1e3e`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000070_equals_missing_path_false__acf5b2d768b6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202993–202997; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem equals_missing_path_false :
  forall p v c,
    resolve_path p c = None ->
    eval_atom (Equals p v) c = Some false.
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 71. `equivalence_under_completeness`

- Kind: `Corollary`
- Code SHA-256: `70880315096c9cc05fb5d193fc3c6cd7052c71f420ec411bbf88e876040fe069`
- Statement SHA-256: `4c60d293a53d473b4942a1dcd92499e3ddc984f8f3f25fe4827fa6d02cffca4b`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000071_equivalence_under_completeness__70880315096c.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 822–832; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Corollary equivalence_under_completeness : forall (τ : Transformation),
    Comp τ ->
    forall (x : State) (π : Provenance),
      K x τ π <-> W x τ.
  Proof.
    intros τ HComp x π.
    split.
    - apply complete_certification; assumption.
    - (** Reverse direction requires certificate construction *)
      admit. (* ADMITTED: requires certificate generation procedure *)
  Defined.
```

## 72. `err_propagates_in_arr`

- Kind: `Theorem`
- Code SHA-256: `e50e6f27bcab8aa1e65d904c6fbd30bc721aef3ab06be705577daf3abbcf2532`
- Statement SHA-256: `4d3239e5389f225362b2b56d874dde32ff6e22418fe5743249c8363b63f7bcc8`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000072_err_propagates_in_arr__e50e6f27bcab.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 364–369; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem err_propagates_in_arr :
  forall pre post, canonicalize (JArr (pre ++ JErr :: post)) =
                   JArr (map canonicalize pre ++ JErr :: map canonicalize post).
Proof.
  intros. simpl. rewrite map_app. simpl. reflexivity.
Qed.
```

## 73. `eval_terminates`

- Kind: `Theorem`
- Code SHA-256: `43507656268c4336a56a7a9fea4d788bdbdba7ce3a21cd0e72021764e405cf3d`
- Statement SHA-256: `de5e94ef60e3684134b03788ac2ea9c58f48a4cc9117d50d2b669b80d4536f43`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000073_eval_terminates__43507656268c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203151–203153; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem eval_terminates :
  forall e c fuel, exists r, eval_expr e c fuel = r.
Proof. intros. exists (eval_expr e c fuel). reflexivity. Qed.
```

## 74. `every_digest_has_partner`

- Kind: `Theorem`
- Code SHA-256: `2d00d7a7e7f039db1815f41e2a55ec78157f841db462d7098686a81172cfdfb3`
- Statement SHA-256: `de39d42538ea800235cdbd1abfdb31b513f696276adfbfe47068bcbc10eab9e5`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000074_every_digest_has_partner__2d00d7a7e7f0.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1188–1192; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem every_digest_has_partner :
  forall d, exists s, compatible d s = true.
Proof.
  intros. exists Ed25519. apply ed25519_accepts_any.
Qed.
```

## 75. `expired_correct`

- Kind: `Theorem`
- Code SHA-256: `325b5f09bb6ad1107703cb7ef7076abfef0e949170d04357d10532510f807200`
- Statement SHA-256: `6e164f3a4cba9a505623533a7cea24fcf4daae4f597e676f861bf5e92c1e9690`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000075_expired_correct__325b5f09bb6a.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203055–203062; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem expired_correct :
  forall p c v t,
    resolve_path p c = Some v ->
    value_to_time v = Some t ->
    eval_atom (Expired p) c = Some (time_lt t (context_now c)).
Proof.
  intros. simpl. rewrite H, H0. reflexivity.
Qed.
```

## 76. `final_closure`

- Kind: `Theorem`
- Code SHA-256: `8fa1e6ea413077db011a49b3e1ae999a9a3f4b8057aadaa874ac9e76a9a9fdae`
- Statement SHA-256: `e7aec2bd4def654712b9510010580339df7032965f5f923f667cfd64fd582d46`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000076_final_closure__8fa1e6ea4130.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1075–1078; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem final_closure : is_closed.
  Proof.
    unfold is_closed. tauto.
  Defined.
```

## 77. `fold_ctx_canonical`

- Kind: `Theorem`
- Code SHA-256: `8ae97b20edffa2cab9726675600f0febe2c93e1c7695be800eab52e3d284446b`
- Statement SHA-256: `1bf4648e1651522c41178f2e30cb4e0320334801a950f70c62ee0c46a81ff04a`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000077_fold_ctx_canonical__8ae97b20edff.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4295–4313; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Theorem fold_ctx_canonical : forall s1 s2,
  state_equiv s1 s2 ->
  fold_ctx s1 = fold_ctx s2.
Proof.
  intros s1 s2 [Hroot [Hperm [Hcoh [Hev [Hver Huniq]]]]].
  unfold fold_ctx, encode_state_canonical.
  f_equal. f_equal.
  - exact (encode_header_ext s1 s2 Hroot Hcoh Hev Hver).
  - f_equal.
    apply locally_sorted_perm_unique_eq.
    + apply sort_prims_sorted.
    + apply sort_prims_sorted.
    + eapply Permutation_trans. { apply Permutation_sym. apply sort_prims_perm. }
      eapply Permutation_trans. { exact Hperm. }
      apply sort_prims_perm.
    + apply uuids_unique_perm with (l1 := prims s1).
      * apply sort_prims_perm.
      * exact Huniq.
Qed.
```

## 78. `fracture_severity_monotone`

- Kind: `Lemma`
- Code SHA-256: `4e74a8e308be2dc5740033fc89a58970f58e1c88c263ce44cce76afb2cb95c1f`
- Statement SHA-256: `aec2eeb75c5bc4de99ecbca7c8f897dcaf68c9f9e1ed59cd44a08ea4c1abd0aa`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000078_fracture_severity_monotone__4e74a8e308be.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5474–5482; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Lemma fracture_severity_monotone :
  forall fc1 fc2,
    fracture_severity fc1 < fracture_severity fc2 ->
    fc1 <> fc2.
Proof.
  intros fc1 fc2 H_lt H_eq.
  subst fc2.
  lia.
Qed.
```

## 79. `Gronwall_bound`

- Kind: `Theorem`
- Code SHA-256: `dea357eacd43bd574b65dc4209543d91c72ab6e85da27907105674e5c81b14b1`
- Statement SHA-256: `63502d1f2826b83a2eba7d0cf8935db7f5109adf94665ae7b7d1ccd2bbf0f7a6`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000079_Gronwall_bound__dea357eacd43.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 728–735; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem Gronwall_bound : forall (T : R) (Σ0 : R) (η : R -> R),
    (forall t, (Differential.D df (Sigma_total) t <= error_dynamics_bound (Sigma_total t) t)%R) ->
    (forall t, (0 <= η t)%R) ->
    (forall t, (Sigma_total t <= exp (integral (fun τ => norm_matrix (S_matrix τ)) 0 t) * (Σ0 + integral η 0 t))%R).
  Proof.
    (** Standard Grönwall-Bellman inequality proof *)
    admit. (* Deferred: requires differential equation library *)
  Defined.
```

## 80. `identity_left`

- Kind: `Lemma`
- Code SHA-256: `9d08d87a3958426a14f5d671e71896a2dd1ff8ca9f153eb44de3e91a827fddc1`
- Statement SHA-256: `7bcc3b70819c246d089eeaacc5fa40cbd58ed4673fe9f3a1a2f242f1b50828ac`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000080_identity_left__9d08d87a3958.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 446–452; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma identity_left : forall (τ : Transformation) (x : State),
    (τ ∘ identity_transformation)%type x = τ x.
  Proof.
    intros τ x.
    unfold compose_transformation, identity_transformation.
    destruct (τ x); reflexivity.
  Defined.
```

## 81. `identity_right`

- Kind: `Lemma`
- Code SHA-256: `430be466563a748103ec40a8eb57f4903943ee555db0dc87d470d2f95224e07c`
- Statement SHA-256: `617fcc9843e044bb99385c20d6b531a78e7afd5cf6a31dac5a798bf29b980bd8`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000081_identity_right__430be466563a.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 454–460; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma identity_right : forall (τ : Transformation) (x : State),
    (identity_transformation ∘ τ)%type x = τ x.
  Proof.
    intros τ x.
    unfold compose_transformation, identity_transformation.
    destruct (τ x); reflexivity.
  Defined.
```

## 82. `insert_kv_perm`

- Kind: `Lemma`
- Code SHA-256: `1e6e157a7b7d3de1babcbe06ff8f0f65d0481ae703107e07367637f67979a9ed`
- Statement SHA-256: `3804d58acd0a81b987a87d44fce508b3bce24cac60bd70d2f355e64a84425c89`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000082_insert_kv_perm__1e6e157a7b7d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 191–201; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Lemma insert_kv_perm : forall kv kvs,
  Permutation (kv :: kvs) (insert_kv kv kvs).
Proof.
  intros kv kvs. induction kvs as [| kv2 rest IH].
  - simpl. apply Permutation_refl.
  - simpl. destruct (string_le (fst kv) (fst kv2)).
    + apply Permutation_refl.
    + eapply Permutation_trans.
      * apply perm_swap.
      * apply perm_skip. exact IH.
Qed.
```

## 83. `insert_kv_sorted`

- Kind: `Lemma`
- Code SHA-256: `7692adf5dd2613c45d5b1e40bd9450ba34c2391cb0f9a277ba662adb1b9dcbd0`
- Statement SHA-256: `0f876803ad0d95011751a3a297f8732bec0e54cc44744339449c74733a6a66f3`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000083_insert_kv_sorted__7692adf5dd26.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 216–244; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Lemma insert_kv_sorted : forall kv kvs,
  Sorted kv_le kvs ->
  Sorted kv_le (insert_kv kv kvs).
Proof.
  intros kv kvs Hsorted. induction Hsorted.
  - simpl. constructor. constructor. constructor.
  - simpl. destruct (string_le (fst kv) (fst a)) eqn:E.
    + constructor.
      * constructor. exact Hsorted. exact H.
      * constructor. unfold kv_le. exact E.
    + (* IHHsorted gives sorted (insert_kv kv l) *)
      destruct l as [| a' rest].
      * simpl. constructor.
        { constructor. constructor. constructor. }
        { constructor. unfold kv_le.
          destruct (string_le_total (fst kv) (fst a)) as [HL | HL].
          - rewrite HL in E. discriminate.
          - exact HL. }
      * simpl in IHHsorted. simpl.
        destruct (string_le (fst kv) (fst a')) eqn:E'.
        { constructor. exact IHHsorted.
          constructor. unfold kv_le.
          destruct (string_le_total (fst kv) (fst a)) as [HL | HL].
          - rewrite HL in E. discriminate.
          - exact HL. }
        { constructor. exact IHHsorted.
          inversion Hsorted; subst.
          inversion H3; subst. constructor. exact H4. }
Qed.
```

## 84. `insert_prim_LSorted`

- Kind: `Lemma`
- Code SHA-256: `a1c02ecebb108a85d262db13c4aad694d5cc082ac0b90eee7c26742447eeed2b`
- Statement SHA-256: `34fa0e148d3eef2579a527be4eb27dcc97f4f95f8cc8c822ed9b0e4e1092fe61`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000084_insert_prim_LSorted__a1c02ecebb10.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4165–4187; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma insert_prim_LSorted : forall x l,
  LocallySorted prim_le l ->
  LocallySorted prim_le (insert_prim x l).
Proof.
  intros x l. revert x.
  induction l as [|a l' IH]; intros x Hsorted.
  - simpl. constructor.
  - simpl. destruct (prim_le_dec x a) as [Hxa | Hxa].
    + constructor; assumption.
    + assert (Hax : prim_le a x).
      { destruct (prim_le_total x a); [contradiction|auto]. }
      destruct l' as [|b l''].
      * simpl. constructor; [constructor|exact Hax].
      * assert (Hsorted_tail : LocallySorted prim_le (b :: l'')).
        { inversion Hsorted; assumption. }
        assert (Hab_le : prim_le a b).
        { inversion Hsorted; assumption. }
        specialize (IH x Hsorted_tail).
        simpl. simpl in IH.
        destruct (prim_le_dec x b) as [Hxb | Hxb].
        { constructor; [exact IH|exact Hax]. }
        { constructor; [exact IH|exact Hab_le]. }
Qed.
```

## 85. `insert_prim_perm`

- Kind: `Lemma`
- Code SHA-256: `1c1b331dd901aab203ab7fdc812b24c343af0f92cfd1ef088e2516d436d3f129`
- Statement SHA-256: `df0df516f31e21d9c44fc124ca670352a39a3dad3937aa1ca9b30c4b9d10861c`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000085_insert_prim_perm__1c1b331dd901.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4145–4154; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma insert_prim_perm : forall x l,
  Permutation (x :: l) (insert_prim x l).
Proof.
  intros x l. induction l as [|h t IH]; simpl.
  - apply Permutation_refl.
  - destruct (prim_le_dec x h).
    + apply Permutation_refl.
    + eapply perm_trans. { apply perm_swap. }
      apply perm_skip. exact IH.
Qed.
```

## 86. `inset_correct`

- Kind: `Theorem`
- Code SHA-256: `1d21586d99de1d3599fd2105d58578bad900d52af50eee29187c5363cd3fc10d`
- Statement SHA-256: `dd07835c53d3e6d541fae5dfdbdae24775810eb954461f826d54f12f483c2c4d`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000086_inset_correct__1d21586d99de.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 202999–203003; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem inset_correct :
  forall p vs c v,
    resolve_path p c = Some v ->
    eval_atom (InSet p vs) c = Some (value_in v vs).
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 87. `integrity_profile_terminates_at_5`

- Kind: `Theorem`
- Code SHA-256: `2a69a0638191874f7502b3dbb102a6d1382f0d4728305921d6b8a05994eebf9c`
- Statement SHA-256: `199997c2653145bf544968fbe111a370808ae6b421c3e7b20a9ab930426cabfa`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000087_integrity_profile_terminates_at_5__2a69a0638191.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 704–716; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem integrity_profile_terminates_at_5 :
  forall b c k p f,
    hdr_profile (b_hdr b) = PB_INTEGRITY_1 ->
    stage1_parse b = Continue ->
    stage2_schema b = Continue ->
    stage3_version b = Continue ->
    stage4_digest b = Continue ->
    stage5_integrity b k = Continue ->
    verify b c k p f = Verified.
Proof.
  intros b c k p f Hprof H1 H2 H3 H4 H5.
  unfold verify. rewrite H1, H2, H3, H4, H5, Hprof. reflexivity.
Qed.
```

## 88. `irreversibility`

- Kind: `Theorem`
- Code SHA-256: `1c9330caf407eec753db462390bea3d9c6162dda5a50e3484e4ee4029ac65145`
- Statement SHA-256: `127b00a380760c27fe566e7d463e278e71dbb930d54bfbd07aa09567f2997919`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000088_irreversibility__1c9330caf407.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 666–675; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem irreversibility : forall (x : State) (τ : Transformation),
    X_void x ->
    ~ exists y, τ x = Some y /\ X_adm y.
  Proof.
    intros x τ Hvoid [y [Hτy Hadm]].
    unfold X_void in Hvoid. unfold X_adm in Hadm.
    (** By bridge axiom, if B(x) < 0, inf{E[d_ι(...)]} > ε_ι *)
    (** No transformation can reduce this distance below ε_ι *)
    admit. (* ADMITTED: requires completeness of transformation class *)
  Defined.
```

## 89. `kernel_impenetrability`

- Kind: `Theorem`
- Code SHA-256: `26c631be511894b5ce3b1731cf7a3dfaf7e5d06254835c40db6489aedd957467`
- Statement SHA-256: `92f5c0eb9beb616657a135577a83a0214a3f0dcd0a819cddd76c186d14343e4f`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000089_kernel_impenetrability__26c631be5118.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1054–1057; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem kernel_impenetrability : forall (k : State), is_load_bearing k.
  Proof.
    intros k. unfold is_load_bearing. tauto.
  Defined.
```

## 90. `lineage_profile_terminates_at_8`

- Kind: `Theorem`
- Code SHA-256: `d7707a354cf5c42ecee99a0a0ae84a3952b89c9f88a2085f1b75c7755600d20e`
- Statement SHA-256: `c81f83cfda6d374c14330d794fcbd500d9f4dc5f7204ea2901cbca687fc7481c`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000090_lineage_profile_terminates_at_8__d7707a354cf5.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 734–749; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem lineage_profile_terminates_at_8 :
  forall b c k p f,
    hdr_profile (b_hdr b) = PB_LINEAGE_1 ->
    stage1_parse b = Continue ->
    stage2_schema b = Continue ->
    stage3_version b = Continue ->
    stage4_digest b = Continue ->
    stage5_integrity b k = Continue ->
    stage6_boundary b c = Continue ->
    stage7_side b = Continue ->
    stage8_lineage b p f = Continue ->
    verify b c k p f = Verified.
Proof.
  intros b c k p f Hprof H1 H2 H3 H4 H5 H6 H7 H8.
  unfold verify. rewrite H1, H2, H3, H4, H5, Hprof, H6, H7, H8. reflexivity.
Qed.
```

## 91. `locally_sorted_perm_unique_eq`

- Kind: `Lemma`
- Code SHA-256: `8004e6137e9d44ec901c7880ad4224c0f2575fa5d3509ee3fd8dd890de2bd0e7`
- Statement SHA-256: `8faa4da9278cb76f08b6a244213755e176c9788436a1c4f77eaa0bc368ece2ed`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000091_locally_sorted_perm_unique_eq__8004e6137e9d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4248–4266; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma locally_sorted_perm_unique_eq : forall l1 l2,
  LocallySorted prim_le l1 ->
  LocallySorted prim_le l2 ->
  Permutation l1 l2 ->
  uuids_unique l1 ->
  l1 = l2.
Proof.
  induction l1 as [|a l1' IH]; intros l2 Hs1 Hs2 Hperm Huniq.
  - symmetry. apply Permutation_nil. exact Hperm.
  - destruct l2 as [|b l2'].
    + apply Permutation_sym in Hperm. apply Permutation_nil in Hperm. discriminate.
    + assert (Hab : a = b) by (eapply sorted_perm_unique_same_head; eauto).
      subst b. f_equal.
      apply IH.
      * inversion Hs1; [constructor|assumption].
      * inversion Hs2; [constructor|assumption].
      * apply Permutation_cons_inv with (a := a). exact Hperm.
      * intros p q Hp Hq Hid. apply Huniq; simpl; auto.
Qed.
```

## 92. `LSorted_head_le_all`

- Kind: `Lemma`
- Code SHA-256: `78e461dc51fb1409dac011734e0a4d7d3e3868acc19aaa3351f4d1fd5c377726`
- Statement SHA-256: `54e7ace7c303f2ba77fed7a21fed85bdf4195e19de445758a8644884d6a005b7`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000092_LSorted_head_le_all__78e461dc51fb.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4212–4225; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma LSorted_head_le_all : forall a l,
  LocallySorted prim_le (a :: l) ->
  forall x, In x l -> prim_le a x.
Proof.
  intros a l. revert a.
  induction l as [|b l' IH]; intros a Hsorted x Hx.
  - inversion Hx.
  - assert (Hab : prim_le a b) by (inversion Hsorted; assumption).
    assert (Htail : LocallySorted prim_le (b :: l')) by (inversion Hsorted; assumption).
    simpl in Hx. destruct Hx as [Heq | Hx].
    + subst. exact Hab.
    + eapply prim_le_trans. { exact Hab. }
      eapply IH. { exact Htail. } exact Hx.
Qed.
```

## 93. `missing_parent_rejected`

- Kind: `Theorem`
- Code SHA-256: `e6285f04c1cec21bd0b6d303e7440a5be57f68bc5e5bd891dffff6df04de4cce`
- Statement SHA-256: `e645ea3405735b37d2ff62259bcc0b082bab8b72d7b2d15de41cd9c328bc958d`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000093_missing_parent_rejected__e6285f04c1ce.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1046–1059; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem missing_parent_rejected :
  forall b provided visited fuel r rest,
    fuel > 0 ->
    in_visited (hdr_bundle_id (b_hdr b)) visited = false ->
    b_refs b = r :: rest ->
    find_bundle (pr_parent_id r) provided = None ->
    walk b provided visited fuel = LMissingParent.
Proof.
  intros b provided visited fuel r rest Hfuel Hnotvisited Hrefs Hfind.
  destruct fuel.
  - lia.
  - simpl. rewrite Hnotvisited. rewrite Hrefs.
    simpl. rewrite Hfind. reflexivity.
Qed.
```

## 94. `no_latent_rescue`

- Kind: `Theorem`
- Code SHA-256: `fb6e2a393c49cdeb624ed05206c09f63fc893acac57ce38d64d54e29de53a06a`
- Statement SHA-256: `62a70d8e023ccc87355ded282c1089f10b27f897e8da0f0bf164a07651b3bd25`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000094_no_latent_rescue__fb6e2a393c49.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1065–1068; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem no_latent_rescue : forall (λ : State), ~ can_rescue λ.
  Proof.
    intros λ H. unfold can_rescue in H. contradiction.
  Defined.
```

## 95. `non_degrading_step_monotone`

- Kind: `Lemma`
- Code SHA-256: `f4f10f212563c9336811479ad5c9d5d1ca5683c6234993055a294aa3f237462a`
- Statement SHA-256: `37a1ad98fa572269fdc08a570adc33e0660cd92916ff0b31eec5a32e6f24a895`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000095_non_degrading_step_monotone__f4f10f212563.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2437–2446; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma non_degrading_step_monotone :
  forall o s s',
    op_delta o >= 0 ->
    concrete_apply o s = Some s' ->
    recovery_assessment s' >= recovery_assessment s.
Proof.
  intros o s s' Hdelta Happ.
  unfold recovery_assessment.
  rewrite (concrete_apply_coh o s s' Happ). lia.
Qed.
```

## 96. `non_fraud`

- Kind: `Theorem`
- Code SHA-256: `5098abd32db7fc8c16be9582f416b7b0205b2fa0675e3733558d2f2f62d17687`
- Statement SHA-256: `66f1172c137e0c0a0b58ab9115b4a34b8942ccbfbe31ba564742b964280a5d54`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000096_non_fraud__5098abd32db7.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 773–783; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem non_fraud : forall (x : State) (τ : Transformation) (π : Provenance),
    K x τ π ->
    ~ Comp τ ->
    ~ W x τ.
  Proof.
    intros x τ π HK Hnot_comp HW.
    unfold Comp in Hnot_comp.
    specialize (Hnot_comp x O R_max).
    (** If certificate exists but W is false, completeness must fail *)
    admit. (* ADMITTED: requires concrete provenance semantics *)
  Defined.
```

## 97. `not_expired_correct`

- Kind: `Theorem`
- Code SHA-256: `bf7becd4624c1bb50890349a1c2586024da1046fd6604040bbde1b61646e1b8d`
- Statement SHA-256: `40363459f22e4ae719dba0e4e3e79cde69504e3aa19fb0bf524375c5d468be22`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000097_not_expired_correct__bf7becd4624c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203064–203071; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem not_expired_correct :
  forall p c v t,
    resolve_path p c = Some v ->
    value_to_time v = Some t ->
    eval_atom (NotExpired p) c = Some (time_le (context_now c) t).
Proof.
  intros. simpl. rewrite H, H0. reflexivity.
Qed.
```

## 98. `OAL_nonvoid_implies_WF`

- Kind: `Lemma`
- Code SHA-256: `033d355157cb71519cd7c2a23a312d9c716e53bf25fdc2e33aa0be401564defb`
- Statement SHA-256: `4c82fde09287cb7af45ee7cae9413c69e02941a33292f63ed98e9b6f87e48cc7`
- Occurrences: 28
- Source statuses: `AXIOMATIC` × 28
- Extracted code file: `proof_code/axiomatic/coq/000098_OAL_nonvoid_implies_WF__033d355157cb.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25645–25653; embedded `principia_2026-03_8c7ced1c81ed2392_oal.v`

```coq
Lemma OAL_nonvoid_implies_WF : forall p t,
  OAL p = t -> t <> VOID -> WF p.
Proof.
  intros p t H Hnv.
  unfold OAL in H.
  destruct (WF_dec p) as [Hw | Hnw].
  - exact Hw.
  - rewrite H in Hnv. contradiction.
Qed.
```

## 99. `OAL_void_if_not_WF`

- Kind: `Lemma`
- Code SHA-256: `08b21a39e22a8da124c4fd82d5e381e41a6c04b7784e561d5d914db9f935f117`
- Statement SHA-256: `bec4b42d413ac237c751a648dc0c09b2a52d36c08c05255d1cce043456d31426`
- Occurrences: 28
- Source statuses: `AXIOMATIC` × 28
- Extracted code file: `proof_code/axiomatic/coq/000099_OAL_void_if_not_WF__08b21a39e22a.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25636–25643; embedded `principia_2026-03_8c7ced1c81ed2392_oal.v`

```coq
Lemma OAL_void_if_not_WF : forall p, ~ WF p -> OAL p = VOID.
Proof.
  intros p H.
  unfold OAL.
  destruct (WF_dec p) as [Hw | Hnw].
  - contradiction.
  - reflexivity.
Qed.
```

## 100. `parent_is_reach`

- Kind: `Lemma`
- Code SHA-256: `2bea670669d6faf86f36d8640e6e9cbed9922d593229c81ef7e035b1c47378c3`
- Statement SHA-256: `6988df05b5d500304a4f85ba801dc42d6ce023b1bb51d64fbe9f11532ecb60c4`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000100_parent_is_reach__2bea670669d6.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1730–1735; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma parent_is_reach : forall g u v,
  parent_of g u v -> reach g u v.
Proof.
  intros g u v Hp. exists 1%nat. simpl.
  right. exists v. split; [exact Hp|]. simpl. reflexivity.
Qed.
```

## 101. `present_correct_none`

- Kind: `Theorem`
- Code SHA-256: `69bd86f387133d291908273c883306eb40b41edb3406fdbd043f95a8c883e0fb`
- Statement SHA-256: `b04a489e2bf59fd5a10465c09619cb34fe5c59d8e57284fe9d53eed151b19e01`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000101_present_correct_none__69bd86f38713.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203017–203021; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem present_correct_none :
  forall p c,
    resolve_path p c = None ->
    eval_atom (Present p) c = Some false.
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 102. `present_correct_some`

- Kind: `Theorem`
- Code SHA-256: `93ea3828c28d690bc685ebd87e8603275b2d6863b9bfc6ed487fa4bb3798a0f0`
- Statement SHA-256: `7dac6af01c3d69ab78f64649803c5568f28cd282f1a19502a26af1fac3215be4`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000102_present_correct_some__93ea3828c28d.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203011–203015; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem present_correct_some :
  forall p c v,
    resolve_path p c = Some v ->
    eval_atom (Present p) c = Some true.
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 103. `prim_le_antisym`

- Kind: `Lemma`
- Code SHA-256: `8193961bcbf471b2a81d7466b9362b57c064b18de4d26733c21100b1ef52ca6f`
- Statement SHA-256: `04a727d532c82a0b7fa462e099aacd20fb9e2bf22498e5d4091bd9c030f688b7`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000103_prim_le_antisym__8193961bcbf4.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4117–4126; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma prim_le_antisym : forall a b,
  prim_le a b -> prim_le b a -> prim_id a = prim_id b.
Proof.
  intros a b Hab Hba. unfold prim_le, Pos.le in *.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E.
  - apply Pos.compare_eq. exact E.
  - exfalso. apply Hba. apply Pos.compare_lt_iff in E.
    apply Pos.lt_gt. exact E.
  - exfalso. apply Hab. reflexivity.
Qed.
```

## 104. `prim_le_dec`

- Kind: `Lemma`
- Code SHA-256: `c45ace2b7c33c96b1ad9cde63b5fc4a735a2b7327bc3cb7502acef88c367a2ca`
- Statement SHA-256: `eb172f5aa0fb29b86f07e439b042f0c964c22efbd0ab508fc858ca79fc9c8d41`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000104_prim_le_dec__c45ace2b7c33.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4079–4084; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma prim_le_dec : forall a b, {prim_le a b} + {~ prim_le a b}.
Proof.
  intros a b. unfold prim_le, Pos.le.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E;
    [left; discriminate | left; discriminate | right; intro H; apply H; reflexivity].
Defined.
```

## 105. `prim_le_total`

- Kind: `Lemma`
- Code SHA-256: `03de1b6de9331cbca4380a1779774e278caccf0213b182dd6a374d4fa4521f18`
- Statement SHA-256: `23c07b5cd608bc5ab26bd14731fe6a933b4384b9f395e9dc339766eb8eb7b5c2`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000105_prim_le_total__03de1b6de933.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4086–4096; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma prim_le_total : forall a b, prim_le a b \/ prim_le b a.
Proof.
  intros a b. unfold prim_le, Pos.le.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E.
  - left. discriminate.
  - left. discriminate.
  - right. intro Habs.
    apply Pos.compare_gt_iff in E.
    apply Pos.compare_gt_iff in Habs.
    exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ E Habs)).
Qed.
```

## 106. `prim_le_trans`

- Kind: `Lemma`
- Code SHA-256: `75a73ab11c6c6f90c10192f71f780e22ac2a56de8c44e2687d08d3e1613ed8ea`
- Statement SHA-256: `7e10c82fadd5b4753a70a2f1bb89a217140f4257ff1eef1acc8e1441bd531012`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000106_prim_le_trans__75a73ab11c6c.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4098–4115; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma prim_le_trans : forall a b c,
  prim_le a b -> prim_le b c -> prim_le a c.
Proof.
  intros a b c Hab Hbc. unfold prim_le, Pos.le in *.
  intro Hgt. apply Pos.compare_gt_iff in Hgt.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:Eab.
  - apply Pos.compare_eq in Eab. rewrite Eab in Hgt.
    apply Pos.lt_gt in Hgt. apply Hbc. exact Hgt.
  - apply Pos.compare_lt_iff in Eab.
    destruct (Pos.compare (prim_id b) (prim_id c)) eqn:Ebc.
    + apply Pos.compare_eq in Ebc. rewrite <- Ebc in Hgt.
      exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ Hgt Eab)).
    + apply Pos.compare_lt_iff in Ebc.
      pose proof (Pos.lt_trans _ _ _ Eab Ebc) as Hac.
      exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ Hgt Hac)).
    + exfalso. apply Hbc. reflexivity.
  - exfalso. apply Hab. reflexivity.
Qed.
```

## 107. `propagation_transitive`

- Kind: `Lemma`
- Code SHA-256: `de1162842019123d5458e975ccec3a99566eff5914aed650b7b77ca339cb25c7`
- Statement SHA-256: `bcb6c16b160f9e834b8622564df12a8d0163fedb317ac733a61bf1875f5a6a73`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000107_propagation_transitive__de1162842019.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5566–5581; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Lemma propagation_transitive :
  forall fe1 fe2 fe3,
    propagates fe1 fe2 ->
    propagates fe2 fe3 ->
    propagates fe1 fe3.
Proof.
  intros fe1 fe2 fe3 H12 H23.
  unfold propagates in *.
  destruct H12 as [Hsys12 [Htime12 Hsev12]].
  destruct H23 as [Hsys23 [Htime23 Hsev23]].
  split.
  - rewrite Hsys12. exact Hsys23.
  - split.
    + lra.
    + lia.
Qed.
```

## 108. `R_max_nonneg`

- Kind: `Lemma`
- Code SHA-256: `1f7310c20430ed51fe5595aceb1409f7e55a74eb4552335c3e2bcec9478cfe51`
- Statement SHA-256: `d9a23828f44d38fc77379c21f5777ff211c0f633b99f8f005d92c434a924f1ad`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000108_R_max_nonneg__1f7310c20430.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 284–285; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma R_max_nonneg : (0 <= R_max)%R.
  Proof. unfold R_max; lra. Qed.
```

## 109. `range_correct`

- Kind: `Theorem`
- Code SHA-256: `012251af09a58384c29db5ef20c0bc0e7474372874fabc96857f6045e218267d`
- Statement SHA-256: `c1db73d0881db6c564763ed1c74b7dedd058b43d5d3f82268ed7adf6a7d6abcd`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000109_range_correct__012251af09a5.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203005–203009; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem range_correct :
  forall p lo hi c v,
    resolve_path p c = Some v ->
    eval_atom (Range p lo hi) c = Some (andb (value_le lo v) (value_le v hi)).
Proof. intros. simpl. rewrite H. reflexivity. Qed.
```

## 110. `reach_from_parent`

- Kind: `Lemma`
- Code SHA-256: `cd489325efeb638f4f5de232a33a0b1cdfa844068233c1aea3058aa258214eba`
- Statement SHA-256: `88b9a2c55ac5d8bb8e14968d9c0afad594a5fea0da946b5e8b1572003666433e`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000110_reach_from_parent__cd489325efeb.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1789–1794; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_from_parent : forall g u w v,
  parent_of g u w -> reach g w v -> reach g u v.
Proof.
  intros g u w v Hp [n Hr]. exists (S n).
  simpl. right. exists w. split; [exact Hp|exact Hr].
Qed.
```

## 111. `reach_n_add_edge`

- Kind: `Lemma`
- Code SHA-256: `5111895daedd8d3487cd992f9e1593c1091596a14fbc6af8d8991f2edb460f74`
- Statement SHA-256: `3a730db14eee944c8a700082c83ee48bc9917818208d232e71930acb40d31f69`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000111_reach_n_add_edge__5111895daedd.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1738–1748; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_n_add_edge : forall g a b n u v,
  reach_n g n u v -> reach_n ((a,b) :: g) n u v.
Proof.
  intros g a b n. induction n as [|k IH]; intros u v H.
  - simpl in *. exact H.
  - simpl in *. destruct H as [Heq | [w [Hp Hr]]].
    + left. exact Heq.
    + right. exists w. split.
      * unfold parent_of in *. simpl. right. exact Hp.
      * apply IH. exact Hr.
Qed.
```

## 112. `reach_n_mono`

- Kind: `Lemma`
- Code SHA-256: `2123fd7a45b85e245ec20efb7a46c6492dc488ab13af518e9bd241cf994c0d54`
- Statement SHA-256: `28e51bd47171111b14cc3ce89f44d2b42e1eee32764378114eadf3134353a8e6`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000112_reach_n_mono__2123fd7a45b8.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1691–1702; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_n_mono : forall g n m u v,
  (n <= m)%nat -> reach_n g n u v -> reach_n g m u v.
Proof.
  intros g n. induction n as [|k IH]; intros m u v Hle H.
  - simpl in H. subst. destruct m as [|m'].
    + simpl. reflexivity.
    + simpl. left. reflexivity.
  - destruct m as [|m']; [lia|].
    simpl in *. destruct H as [Heq | [w [Hp Hr]]].
    + left. exact Heq.
    + right. exists w. split; [exact Hp|]. apply IH; [lia|exact Hr].
Qed.
```

## 113. `reach_n_split_on_edge`

- Kind: `Lemma`
- Code SHA-256: `699baf9ec9ae1db08e6a0834eb9ea9d1a51797f304c787520ecdc6122d086e09`
- Statement SHA-256: `e78b63a32ae8c5d635ecc8981bb02b728391c03b3411e0355d321e0cc1aa6de9`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000113_reach_n_split_on_edge__699baf9ec9ae.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1752–1786; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_n_split_on_edge : forall g a b n u v,
  reach_n ((a,b) :: g) n u v ->
  reach_n g n u v \/
  (exists k1 k2,
     (k1 + S k2 <= n)%nat /\
     reach_n g k1 u a /\
     reach_n g k2 b v).
Proof.
  intros g a b n. induction n as [|k IH]; intros u v H.
  - simpl in H. left. simpl. exact H.
  - simpl in H. destruct H as [Heq | [w [Hp Hr]]].
    + left. simpl. left. exact Heq.
    + destruct Hp as [Heq_ab | Hin_old].
      * (* the very first edge is (a,b): u = a, w = b *)
        injection Heq_ab as <- <-.
        (* Hr : reach_n ((a,b)::g) k b v. Recurse via IH to split. *)
        specialize (IH b v Hr).
        destruct IH as [Hold | [k1 [k2 [Hle [Ha Hb]]]]].
        -- right. exists O, k.
           split; [lia|]. split; [simpl; reflexivity|exact Hold].
        -- right. exists O, k.
           split; [lia|]. split; [simpl; reflexivity|].
           (* We have reach_n g k1 b a and reach_n g k2 b v.
              But we need reach_n g k b v. k2 <= k by Hle, so
              reach_n g k2 b v lifts to reach_n g k b v. *)
           apply reach_n_mono with (n := k2); [lia|exact Hb].
      * specialize (IH w v Hr).
        destruct IH as [Hold | [k1 [k2 [Hle [Ha Hb]]]]].
        -- left. simpl. right. exists w.
           split; [unfold parent_of; exact Hin_old | exact Hold].
        -- right. exists (S k1), k2.
           split; [lia|]. split; [|exact Hb].
           simpl. right. exists w.
           split; [unfold parent_of; exact Hin_old | exact Ha].
Qed.
```

## 114. `reach_n_trans`

- Kind: `Lemma`
- Code SHA-256: `833475d3e6309c8bbec0f0212a069208fc2bfefd8443ce17b0f300e7d55131a6`
- Statement SHA-256: `32df0993c08c882291be7dd61b91db984a4cc5e3957a06c63c02cc49ac3c40ba`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000114_reach_n_trans__833475d3e630.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1705–1719; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_n_trans : forall g n m u v w,
  reach_n g n u v -> reach_n g m v w -> reach_n g (n + m) u w.
Proof.
  intros g n. induction n as [|k IH]; intros m u v w H1 H2.
  - simpl in H1. subst. simpl. exact H2.
  - simpl in H1. destruct H1 as [Heq | [x [Hp Hr]]].
    + subst. simpl. destruct m as [|m'].
      * simpl in H2. subst. left. reflexivity.
      * simpl in H2. destruct H2 as [Heq2 | [y [Hp2 Hr2]]].
        -- left. exact Heq2.
        -- right. exists y. split; [exact Hp2|].
           apply reach_n_mono with (n := m'); [lia|exact Hr2].
    + simpl. right. exists x. split; [exact Hp|].
      eapply IH; [exact Hr|exact H2].
Qed.
```

## 115. `reach_trans`

- Kind: `Lemma`
- Code SHA-256: `24ccebf0478991f0d3133fb8597d0d62b6c244c5a4899d8fe4a534303711ac8e`
- Statement SHA-256: `7900ae3ef557f84e3e2f397c83e31f86cea383ae668043376a1910fcfc7e1547`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000115_reach_trans__24ccebf04789.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1722–1727; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Lemma reach_trans : forall g u v w,
  reach g u v -> reach g v w -> reach g u w.
Proof.
  intros g u v w [n1 H1] [n2 H2].
  exists (n1 + n2). eapply reach_n_trans; eauto.
Qed.
```

## 116. `registry_only_compatible`

- Kind: `Theorem`
- Code SHA-256: `6543916ce4bb921eea30159d99a355a91e70eaa789afa571df968126767eb30f`
- Statement SHA-256: `7903a428888beabfe93b0fc2843f8e7879c6ea4982d927f71eeb65e006a91a80`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000116_registry_only_compatible__6543916ce4bb.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1167–1169; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem registry_only_compatible :
  forall d s, is_registered d s -> compatible d s = true.
Proof. intros. exact H. Qed.
```

## 117. `regulated_profile_terminates_at_9`

- Kind: `Theorem`
- Code SHA-256: `7410d75c846965c2858dc3ad0cce53d0e647d669cbba09fe70d80247f69e358e`
- Statement SHA-256: `eabac78b18bc887192527e591814f5eef9627f4b0e5293c32776da22c9ca1637`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000117_regulated_profile_terminates_at_9__7410d75c8469.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 751–767; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem regulated_profile_terminates_at_9 :
  forall b c k p f,
    hdr_profile (b_hdr b) = PB_REGULATED_1 ->
    stage1_parse b = Continue ->
    stage2_schema b = Continue ->
    stage3_version b = Continue ->
    stage4_digest b = Continue ->
    stage5_integrity b k = Continue ->
    stage6_boundary b c = Continue ->
    stage7_side b = Continue ->
    stage8_lineage b p f = Continue ->
    stage9_hitl b = Continue ->
    verify b c k p f = Verified.
Proof.
  intros b c k p f Hprof H1 H2 H3 H4 H5 H6 H7 H8 H9.
  unfold verify. rewrite H1, H2, H3, H4, H5, Hprof, H6, H7, H8, H9. reflexivity.
Qed.
```

## 118. `safe_not_beyond`

- Kind: `Theorem`
- Code SHA-256: `2cfeab243f841634ea847bdd2ee320af5b49062a44cbe50ffee334dc48a1b66b`
- Statement SHA-256: `5a94a3d5d1dfcaae47afc7ee1e59ae644b9ecc3328cf304daf82fd6c6a5acf7e`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000118_safe_not_beyond__2cfeab243f84.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5546–5553; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem safe_not_beyond :
  forall s, safe_state s -> ~ beyond_recovery s.
Proof.
  intros s Hsafe Hbeyond.
  unfold safe_state in Hsafe.
  unfold beyond_recovery in Hbeyond.
  lra.
Qed.
```

## 119. `sha256_with_ecdsa_p384_incompatible`

- Kind: `Theorem`
- Code SHA-256: `d209151164da96039b66736ab3b533a107dcea056c0853f7daec60fbdf00565b`
- Statement SHA-256: `b207aa011d493851f5ea999ea8175ef270151b44d2e8e40e6e4763897d3216f2`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000119_sha256_with_ecdsa_p384_incompatible__d209151164da.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1172–1174; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem sha256_with_ecdsa_p384_incompatible :
  compatible SHA_256 ECDSA_P384 = false.
Proof. unfold compatible. simpl. reflexivity. Qed.
```

## 120. `sha384_with_ecdsa_p256_incompatible`

- Kind: `Theorem`
- Code SHA-256: `1e2db4626ede2067045242cb396b3f90ab70b48b06e487850e261952243084d1`
- Statement SHA-256: `8c8a3958af2bebf61856d292b4a5b2715bc0d5f2f38936575c89b986a4c5d1c4`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000120_sha384_with_ecdsa_p256_incompatible__1e2db4626ede.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1176–1178; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem sha384_with_ecdsa_p256_incompatible :
  compatible SHA_384 ECDSA_P256 = false.
Proof. unfold compatible. simpl. reflexivity. Qed.
```

## 121. `silent_preserves_capabilities`

- Kind: `Theorem`
- Code SHA-256: `4f57a4a6e6382a5e294a13a0bf05e261d415a1190b7b248de550505b68de8087`
- Statement SHA-256: `5477ee6f5304dad7412784fb80a6df89e5305ff787f2dc5133115b43718ffad5`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000121_silent_preserves_capabilities__4f57a4a6e638.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5667–5675; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem silent_preserves_capabilities :
  forall sys fe,
    fe_class fe = FC_Silent ->
    (forall cap, has_capability sys cap -> has_capability sys cap).
Proof.
  intros sys fe Hsilent cap Hcap.
  (* Silent fractures don't affect capabilities *)
  exact Hcap.
Qed.
```

## 122. `sort_kvs_perm`

- Kind: `Theorem`
- Code SHA-256: `2ef82d326b98fe2d425db01b34743bada251a4b3d8508ec5db1f86f238e64e2e`
- Statement SHA-256: `a1c01efa5f7000c8b7f204a7a576e4e8bc51c7501f924ebaf2305d964dc8a8a1`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000122_sort_kvs_perm__2ef82d326b98.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203–211; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem sort_kvs_perm : forall kvs,
  Permutation kvs (sort_kvs kvs).
Proof.
  intros kvs. induction kvs as [| kv rest IH].
  - simpl. apply Permutation_refl.
  - simpl. eapply Permutation_trans.
    + apply perm_skip. exact IH.
    + apply insert_kv_perm.
Qed.
```

## 123. `sort_kvs_sorted`

- Kind: `Theorem`
- Code SHA-256: `8be5391c77c95859aca9003ff59454fbc3c4f4db6bd1a7cc746e7ee9b5fcbfa0`
- Statement SHA-256: `16d69bf0e0b46751db5b3678ec0aec00ababccaed2216cf01dac5ca3a5a1e306`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000123_sort_kvs_sorted__8be5391c77c9.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 246–252; embedded `proofbundle_2026-05_13fdf0bbe4d6184d_2026_05_03_pb1_robust.v`

```coq
Theorem sort_kvs_sorted : forall kvs,
  Sorted kv_le (sort_kvs kvs).
Proof.
  intros kvs. induction kvs as [| kv rest IH].
  - simpl. constructor.
  - simpl. apply insert_kv_sorted. exact IH.
Qed.
```

## 124. `sort_prims_perm`

- Kind: `Lemma`
- Code SHA-256: `aa936afa4c8bbac17364d22dd2308293f459d14ccd90204a5370085e8ecf1142`
- Statement SHA-256: `31934edefd945e158f2ea1242325edee14e364e5eae528897d4cf9f65504078d`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000124_sort_prims_perm__aa936afa4c8b.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4156–4162; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma sort_prims_perm : forall l, Permutation l (sort_prims l).
Proof.
  induction l as [|h t IH]; simpl.
  - apply perm_nil.
  - eapply perm_trans. { apply perm_skip. exact IH. }
    apply insert_prim_perm.
Qed.
```

## 125. `sort_prims_sorted`

- Kind: `Lemma`
- Code SHA-256: `6837b438acb45b59d8e469106478a9e74c1c091a7cf5896f50c213fca2d02ea8`
- Statement SHA-256: `ed3a894da96af78fd91ec3b3b9346e7150bc33133f6ceeea18b4fd5f5534a648`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000125_sort_prims_sorted__6837b438acb4.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4189–4195; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma sort_prims_sorted : forall l,
  LocallySorted prim_le (sort_prims l).
Proof.
  induction l as [|h t IH]; simpl.
  - constructor.
  - apply insert_prim_LSorted. exact IH.
Qed.
```

## 126. `sorted_perm_unique_same_head`

- Kind: `Lemma`
- Code SHA-256: `df995aa537206c23c32f1e246d1fda3497d65c4b7bf292713acbb75397aadcb4`
- Statement SHA-256: `dd2bcb3be7a73ac7f09df55b638f2f6caf5dae96b61617cc7ea7d3310c55cb18`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000126_sorted_perm_unique_same_head__df995aa53720.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4227–4246; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma sorted_perm_unique_same_head : forall a b l1 l2,
  LocallySorted prim_le (a :: l1) ->
  LocallySorted prim_le (b :: l2) ->
  Permutation (a :: l1) (b :: l2) ->
  uuids_unique (a :: l1) ->
  a = b.
Proof.
  intros a b l1 l2 Hs1 Hs2 Hperm Huniq.
  assert (Ha_in : In a (b :: l2)).
  { eapply Permutation_in; [exact Hperm|simpl; auto]. }
  assert (Hb_in : In b (a :: l1)).
  { eapply Permutation_in; [apply Permutation_sym; exact Hperm|simpl; auto]. }
  simpl in Ha_in, Hb_in.
  destruct Ha_in as [Hab | Ha_in_l2]; [auto|].
  destruct Hb_in as [Hba | Hb_in_l1]; [auto|].
  assert (Hab : prim_le a b) by (eapply LSorted_head_le_all; eauto).
  assert (Hba : prim_le b a) by (eapply LSorted_head_le_all; eauto).
  assert (Hid : prim_id a = prim_id b) by (apply prim_le_antisym; auto).
  apply Huniq; simpl; auto.
Qed.
```

## 127. `state_boundary_trichotomy`

- Kind: `Theorem`
- Code SHA-256: `3ecdc461d9f21bd4178918fa453849cd512f2c0bd8bd5d2df10d139a5b85cb0d`
- Statement SHA-256: `e43f1944e15fafd687a6ac6236f2bd5bac89af0e8de7aa07f5c5301cda579da1`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000127_state_boundary_trichotomy__3ecdc461d9f2.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 5533–5543; embedded `proofbundle_2026-05_7e4839c333b67589_7e4839c333b67589_000187_7e4839c333b6_fracture.v`

```coq
Theorem state_boundary_trichotomy :
  forall s : State,
    safe_state s \/ critical_state s \/ beyond_recovery s.
Proof.
  intro s.
  unfold safe_state, critical_state, beyond_recovery.
  destruct (total_order_T (boundary_dist s) critical_boundary) as [[Hlt | Heq] | Hgt].
  - left. exact Hlt.
  - right. left. exact Heq.
  - right. right. exact Hgt.
Qed.
```

## 128. `state_eq`

- Kind: `Lemma`
- Code SHA-256: `533e9e8765195bd6fc7b150f1c9db584aab0062214aa146210d26d24d4d0503c`
- Statement SHA-256: `89cc50bd17993650e5766e3450392ef46aac33b5c6beee4fe558537aeee1b884`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000128_state_eq__533e9e876519.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 3885–3899; embedded `proofbundle_2026-05_236d3e652281612e_236d3e652281612e_000113_236d3e652281_2026_03_22_kernel_v2.v`

```coq
Lemma state_eq :
  forall s1 s2 : State,
    iota s1 = iota s2 ->
    z_of s1 = z_of s2 ->
    rho_of s1 = rho_of s2 ->
    c_of s1 = c_of s2 ->
    f_of s1 = f_of s2 ->
    s1 = s2.
Proof.
  intros [i1 z1 rho1 c1 f1] [i2 z2 rho2 c2 f2].
  simpl.
  intros Hi Hz Hr Hc Hf.
  subst.
  reflexivity.
Qed.
```

## 129. `state_eq`

- Kind: `Lemma`
- Code SHA-256: `9bfc48fdd0ec76e45444349778fe70d69ca6e3e781b460617df2573f7761c2cd`
- Statement SHA-256: `824ccee3d9945561b29ac364f40560ce51fb99dfe11b87584e5bbb7d97d218cc`
- Occurrences: 41
- Source statuses: `AXIOMATIC` × 41
- Extracted code file: `proof_code/axiomatic/coq/000129_state_eq__9bfc48fdd0ec.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 25445–25455; embedded `principia_2026-03_912fa97999e3d145_kernel.v`

```coq
Lemma state_eq : forall s1 s2 : State,
  iota s1 = iota s2 ->
  z_of s1 = z_of s2 ->
  rho_of s1 = rho_of s2 ->
  c_of s1 = c_of s2 ->
  f_of s1 = f_of s2 ->
  s1 = s2.
Proof.
  intros [i1 z1 rho1 c1 f1] [i2 z2 rho2 c2 f2]. simpl.
  intros Hi Hz Hr Hc Hf. subst. reflexivity.
Qed.
```

## 130. `state_extensionality`

- Kind: `Lemma`
- Code SHA-256: `decb95462d18c36ee6426a8e59e9b6520a7c1a15dffef180f726c56b19424c5c`
- Statement SHA-256: `272857dae30f7f50e6b047302f30c37b3c48a946db6ae22630e38e902cb261cd`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000130_state_extensionality__decb95462d18.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 349–361; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma state_extensionality : forall (x y : State),
    ι'(x) = ι'(y) ->
    z'(x) = z'(y) ->
    ρ'(x) = ρ'(y) ->
    c'(x) = c'(y) ->
    f'(x) = f'(y) ->
    x = y.
  Proof.
    intros x y Hι Hz Hρ Hc Hf.
    destruct x, y; simpl in *.
    rewrite Hι, Hz, Hρ, Hc, Hf.
    reflexivity.
  Defined.
```

## 131. `state_space_partition`

- Kind: `Theorem`
- Code SHA-256: `a62b97b40860d4181971e716b73e0b9dbdeb502d8a6a958dfd0a6a7010e97735`
- Statement SHA-256: `6526aa25b98d86d6cf67e5f3f81a7700a0c9d438d0667b829bc15807b8c40938`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000131_state_space_partition__a62b97b40860.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 629–638; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem state_space_partition : forall x : State,
    X_adm x \/ X_boundary x \/ X_void x.
  Proof.
    intros x.
    unfold X_adm, X_boundary, X_void.
    destruct (total_order_T (B_impl x) 0) as [[Hlt | Heq] | Hgt].
    - right; left; exact Heq.
    - left; exact Hgt.
    - right; right; exact Hlt.
  Defined.
```

## 132. `T11_per_op_assoc_pointwise`

- Kind: `Theorem`
- Code SHA-256: `4acd026decc80030caab81f92bada3cd8074891af7f3ba8239324d8c016b5dfd`
- Statement SHA-256: `b3bf05c16f3d84bf1f6b5a75c7cc30e7d0a34bc469de00a748174140cb58a974`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000132_T11_per_op_assoc_pointwise__4acd026decc8.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2117–2120; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T11_per_op_assoc_pointwise : forall a b c op,
  auth_meet_op (auth_meet_op a b) c op =
  auth_meet_op a (auth_meet_op b c) op.
Proof. intros. unfold auth_meet_op. apply auth_meet_assoc. Qed.
```

## 133. `T11_per_op_comm_pointwise`

- Kind: `Theorem`
- Code SHA-256: `cbf6d0918527626d25355c3aeb83d2edbf5c64e2187fc4fc76aa63af3fe72b42`
- Statement SHA-256: `7cce3e15438384fd15665191824ea4ddab042c29a423d26e0bc49185632009ec`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000133_T11_per_op_comm_pointwise__cbf6d0918527.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2113–2115; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T11_per_op_comm_pointwise : forall a b op,
  auth_meet_op a b op = auth_meet_op b a op.
Proof. intros. unfold auth_meet_op. apply auth_meet_comm. Qed.
```

## 134. `T11_per_op_independence`

- Kind: `Theorem`
- Code SHA-256: `09603bc4b49870b42bdde0283b9590f2b05eb78ab9ae55acca5d587012eed6d0`
- Statement SHA-256: `dae06eacff9be63ddcc831e18f23443d7dd3e40ebadc59a514928ea3eeaeed0a`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000134_T11_per_op_independence__09603bc4b498.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2098–2107; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T11_per_op_independence :
  forall (a : AuthByOp) (op1 op2 : OperationType),
    op1 <> op2 -> a op1 = false -> a op2 = true ->
    auth_meet (a op1) (a op2) = false /\
    a op2 = true.
Proof.
  intros a op1 op2 Hneq H1 H2. split.
  - rewrite H1. reflexivity.
  - exact H2.
Qed.
```

## 135. `T12_corruption_has_witness`

- Kind: `Theorem`
- Code SHA-256: `779438b874b452c8aba6b796a791a26a6ea74d25170db547cc8707eeec816f83`
- Statement SHA-256: `efa79833b677d11f526e9e69663987b8a06dd12e569821f47799443629c8143c`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000135_T12_corruption_has_witness__779438b874b4.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2598–2611; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T12_corruption_has_witness :
  forall (xs : list AuthByOp) (op : OperationType),
    auth_meet_list_op xs op = false ->
    exists a, In a xs /\ a op = false.
Proof.
  induction xs as [|x rest IH]; intros op H.
  - simpl in H. discriminate.
  - simpl in H. unfold auth_meet in H.
    apply andb_false_iff in H. destruct H as [Hx | Hrest].
    + exists x. split; [simpl; left; reflexivity | exact Hx].
    + specialize (IH op Hrest).
      destruct IH as [a [Hin Hfalse]].
      exists a. split; [simpl; right; exact Hin | exact Hfalse].
Qed.
```

## 136. `T12_per_operation_corruption`

- Kind: `Theorem`
- Code SHA-256: `3a1385cce8c13a244723b2acab1d423ff97b5ca993548ceaa6ba4ca354859080`
- Statement SHA-256: `ba5362dc8479adf6e3e893900928758a3e2f8501a94d8085176798eea9146d0f`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000136_T12_per_operation_corruption__3a1385cce8c1.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2563–2567; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T12_per_operation_corruption :
  forall (ancestors : list AuthByOp) (op : OperationType),
    (exists a, In a ancestors /\ a op = false) ->
    auth_meet_list_op ancestors op = false.
Proof. exact auth_meet_list_op_any_false. Qed.
```

## 137. `T12_per_operation_independence`

- Kind: `Theorem`
- Code SHA-256: `09b976085ba6a7cb9a7ce77cbea2517ebbfa3f8b20e94ac1ceeba56e099c9b05`
- Statement SHA-256: `46b8aee5509d8c7f1476faef25fbea3e4e8a44e1266f30aca3d9893cd017ccc4`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000137_T12_per_operation_independence__09b976085ba6.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2571–2579; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T12_per_operation_independence :
  forall (a : AuthByOp) (op1 op2 : OperationType),
    op1 <> op2 ->
    a op1 = false ->
    a op2 = true ->
    a op1 = false /\ a op2 = true.
Proof.
  intros a op1 op2 _ H1 H2. split; assumption.
Qed.
```

## 138. `T12_true_ancestors_noncontributing`

- Kind: `Theorem`
- Code SHA-256: `497bd1b55d1fc9bdd0828a475e1432a7e6a75d2127528127dfb89842bdda428d`
- Statement SHA-256: `6dea4e2e680b1042eca9d0f62d3bd8aac37da4d8a1b7b39f9d6f2ea515361ccd`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000138_T12_true_ancestors_noncontributing__497bd1b55d1f.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2583–2594; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T12_true_ancestors_noncontributing :
  forall (xs ys : list AuthByOp) (op : OperationType),
    (forall a, In a xs -> a op = true) ->
    auth_meet_list_op (xs ++ ys) op = auth_meet_list_op ys op.
Proof.
  induction xs as [|x rest IH]; intros ys op Hxs.
  - simpl. reflexivity.
  - simpl.
    assert (Hx : x op = true) by (apply Hxs; simpl; left; reflexivity).
    rewrite Hx. unfold auth_meet. simpl.
    apply IH. intros a Ha. apply Hxs. simpl. right. exact Ha.
Qed.
```

## 139. `T13_dimensional_independence`

- Kind: `Theorem`
- Code SHA-256: `ea4645d703812c79e3bd72562b09d24ce9ebf55fd0f272aa6c5a855423660942`
- Statement SHA-256: `be9b824ed7d84d51b9fff06294dd7f0baf6ab5d33ce9889ddd4b2a688781b1a3`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000139_T13_dimensional_independence__ea4645d70381.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2683–2689; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T13_dimensional_independence :
  forall (g : Gate) (d d' : Dim) (v : bool),
    d <> d' -> gate_set g d v d' = g d'.
Proof.
  intros g d d' v Hneq. unfold gate_set.
  rewrite Dim_eqb_neq; [reflexivity|exact Hneq].
Qed.
```

## 140. `T13_independent_updates_commute`

- Kind: `Theorem`
- Code SHA-256: `632a4334f963f4a37ad880ad930d53a9b115ef1efdce6f1095e037083b60bb08`
- Statement SHA-256: `679855d5a1b680321bc1a0b56a7058ee1603ce0a1fde90dae216e1df0c99277e`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000140_T13_independent_updates_commute__632a4334f963.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2701–2713; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T13_independent_updates_commute :
  forall (g : Gate) (d1 d2 : Dim) (v1 v2 : bool),
    d1 <> d2 ->
    forall d',
      gate_set (gate_set g d1 v1) d2 v2 d' =
      gate_set (gate_set g d2 v2) d1 v1 d'.
Proof.
  intros g d1 d2 v1 v2 Hneq d'. unfold gate_set.
  destruct (Dim_eqb d1 d') eqn:E1; destruct (Dim_eqb d2 d') eqn:E2;
    try reflexivity.
  apply Dim_eqb_eq in E1. apply Dim_eqb_eq in E2.
  subst. contradiction.
Qed.
```

## 141. `T13_set_hits_target`

- Kind: `Theorem`
- Code SHA-256: `10a84c24d0298c75acbfdb7096a3bdee355e9d095049d94ba8acfe0173e06d9d`
- Statement SHA-256: `5d68060d7312292ee391976bd9e95f514f13d11d116f4d1f2e6438aaa21e98b4`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000141_T13_set_hits_target__10a84c24d029.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2692–2697; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T13_set_hits_target :
  forall (g : Gate) (d : Dim) (v : bool),
    gate_set g d v d = v.
Proof.
  intros. unfold gate_set. rewrite Dim_eqb_refl. reflexivity.
Qed.
```

## 142. `T15_failure_forces_reject`

- Kind: `Theorem`
- Code SHA-256: `bda288058103e00dcb2d366159b00b23f57bb6fb0cf5645ba3102aed0f06582f`
- Statement SHA-256: `4c2927ad5a55590c160999f0d51a3f1e4e3f5bcaba70f930ff44c2616246a75f`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000142_T15_failure_forces_reject__bda288058103.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2811–2815; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T15_failure_forces_reject :
  forall g fm d, fm d = true -> apply_failure g fm d = false.
Proof.
  intros. unfold apply_failure. rewrite H. reflexivity.
Qed.
```

## 143. `T15_failure_meet_localized`

- Kind: `Theorem`
- Code SHA-256: `5913aceecd0d53c63c91833047f9be06c161c36f64251c161279732ab9f290fb`
- Statement SHA-256: `ee9e435c32bbc66a296c2ae0c973daa9745c54cda75a5b1bd49fbbd8ddf1cc7d`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000143_T15_failure_meet_localized__5913aceecd0d.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2846–2856; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T15_failure_meet_localized :
  forall g d_star,
    apply_failure g (single_failure d_star) d_star = false /\
    forall d, d <> d_star ->
      apply_failure g (single_failure d_star) d = g d.
Proof.
  intros g d_star. split.
  - apply T15_failure_forces_reject. unfold single_failure.
    apply Dim_eqb_refl.
  - intros. apply T15_single_failure_isolated. assumption.
Qed.
```

## 144. `T15_no_crosscontamination`

- Kind: `Theorem`
- Code SHA-256: `a9f9f64945f38c379d902bcecad3a471a1e6d84d2d5785e0f3d47c7468ad4216`
- Statement SHA-256: `26031455a9704afbd02b7f9d22cdeec1829f259b5eab36c3edd3e3d7d694ee19`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000144_T15_no_crosscontamination__a9f9f64945f3.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2804–2808; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T15_no_crosscontamination :
  forall g fm d, fm d = false -> apply_failure g fm d = g d.
Proof.
  intros. unfold apply_failure. rewrite H. reflexivity.
Qed.
```

## 145. `T15_selective_failure_defense`

- Kind: `Theorem`
- Code SHA-256: `1ff4ac75e42936cefd660aac6d330a6a502f955f18f3d9c9d9d61114f71aa924`
- Statement SHA-256: `499685a526b5fb64986f0c73e5f4a25ce67c23829c22c62f3b101f1bdd85c251`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000145_T15_selective_failure_defense__1ff4ac75e429.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2819–2827; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T15_selective_failure_defense :
  forall g fm,
    (forall d, fm d = true -> apply_failure g fm d = false) /\
    (forall d, fm d = false -> apply_failure g fm d = g d).
Proof.
  intros g fm. split.
  - intros d Hfail. apply T15_failure_forces_reject. exact Hfail.
  - intros d Hok. apply T15_no_crosscontamination. exact Hok.
Qed.
```

## 146. `T15_single_failure_isolated`

- Kind: `Theorem`
- Code SHA-256: `3eb9691e0919110c1223f7ba5466146205c884390f2e561deb9ea57a5b1dfd4b`
- Statement SHA-256: `7f3bc9f71aac0feec9998ce71275038a7e6d66ca87a0c4c8cbb9fbaa33d2c9f3`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000146_T15_single_failure_isolated__3eb9691e0919.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2834–2840; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T15_single_failure_isolated :
  forall g d_star d,
    d <> d_star -> apply_failure g (single_failure d_star) d = g d.
Proof.
  intros g d_star d Hneq. unfold apply_failure, single_failure.
  rewrite Dim_eqb_neq; [reflexivity|congruence].
Qed.
```

## 147. `T16_merge_non_dilutability`

- Kind: `Theorem`
- Code SHA-256: `4fdab890e42f2200a438a0553724b66f32547e19228d7ab94286b368dc35978c`
- Statement SHA-256: `3323ebfaa1299d950fb5a9459d58d2d99205e896cbdc809cdd8582fb930b04cf`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000147_T16_merge_non_dilutability__4fdab890e42f.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2129–2135; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T16_merge_non_dilutability :
  forall xs, auth_meet_list xs = false ->
    forall ys, In false (xs ++ ys).
Proof.
  intros xs Hxs ys. apply in_or_app. left.
  apply auth_meet_list_false_witness. exact Hxs.
Qed.
```

## 148. `T16_merge_pair_non_dilutable`

- Kind: `Theorem`
- Code SHA-256: `bbe018f450a0fe8a4a492b97500d33b77067b37728f39e90c9438dce2aeda847`
- Statement SHA-256: `522c3971b2674b1c823f057c3e3d6d3128101d773c79281cb0f1236fe27c3e3f`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000148_T16_merge_pair_non_dilutable__bbe018f450a0.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2138–2144; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T16_merge_pair_non_dilutable :
  forall a b, a = false \/ b = false -> auth_meet a b = false.
Proof.
  intros a b [Ha|Hb].
  - subst. reflexivity.
  - subst. apply andb_false_r.
Qed.
```

## 149. `T17_split_completeness`

- Kind: `Theorem`
- Code SHA-256: `9051ec4b252a199c027f96af4133f006ceddeffda102d13ab89be7c568f90e38`
- Statement SHA-256: `461047012a51926a3519c031278533f756ac3c5d12b2233cdd56ae0efe7dc533`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000149_T17_split_completeness__9051ec4b252a.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2154–2170; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T17_split_completeness :
  forall (parent_auth : AuthVal) (n : nat),
    (* n children, each carrying parent_auth *)
    auth_meet_list (repeat parent_auth n) =
    match n with
    | O => true
    | S _ => parent_auth
    end.
Proof.
  intros parent_auth n. induction n as [|k IH]; simpl.
  - reflexivity.
  - destruct k as [|k'].
    + simpl. unfold auth_meet. apply andb_true_r.
    + (* Goal: parent_auth ⊓ auth_meet_list (repeat parent_auth (S k')) = parent_auth *)
      (* IH at S k': auth_meet_list (repeat parent_auth (S k')) = parent_auth *)
      rewrite IH. apply auth_meet_idempotent.
Qed.
```

## 150. `T17_split_preserves_corruption`

- Kind: `Theorem`
- Code SHA-256: `d767a7fec331e2b6257cd46428820719df4c15a1d98f934baf08452da63fe878`
- Statement SHA-256: `ac910e525019e0d72f260a0f71efe8ef07e8d09251332669ef30e739c6570602`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000150_T17_split_preserves_corruption__d767a7fec331.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2182–2188; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T17_split_preserves_corruption :
  forall n, n > O ->
    auth_meet_list (repeat false n) = false.
Proof.
  intros n Hn. rewrite T17_split_completeness.
  destruct n; [lia|reflexivity].
Qed.
```

## 151. `T17_split_preserves_truth`

- Kind: `Theorem`
- Code SHA-256: `5bed3e3218ea15d6cc0362eec3092ee22fbbc9c6d981d96a10707e59074c78e1`
- Statement SHA-256: `dbc6bd62b50dea06efa3702f555236b1dc476245c608b6e80dda68c8796c742a`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000151_T17_split_preserves_truth__5bed3e3218ea.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2174–2180; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T17_split_preserves_truth :
  forall n, n > O ->
    auth_meet_list (repeat true n) = true.
Proof.
  intros n Hn. rewrite T17_split_completeness.
  destruct n; [lia|reflexivity].
Qed.
```

## 152. `T18_deploy_gate_strictness`

- Kind: `Theorem`
- Code SHA-256: `7d058980bcdbe8e2bc356f8d26f811a7eaed371efc393ea4aa252007b7d8b06c`
- Statement SHA-256: `5f23e40332b3be99d1fad7a9b133a145a5b307539eb9883af266ae8584db441d`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000152_T18_deploy_gate_strictness__7d058980bcdb.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2229–2237; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T18_deploy_gate_strictness :
  forall components,
    deploy_authorized components = true <->
    (forall a, In a components -> a = true).
Proof.
  intros. split.
  - apply T18_deploy_gate_strictness_backward.
  - apply T18_deploy_gate_strictness_forward.
Qed.
```

## 153. `T18_deploy_gate_strictness_backward`

- Kind: `Theorem`
- Code SHA-256: `f87ce9a27dfe5749a50b7a5b0bd5171113eefc72b33690339d8c94484ffd8302`
- Statement SHA-256: `1bfc46b60775969254317ba704fcce1f0ba0631b61277155e5ab43a3516b53cf`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000153_T18_deploy_gate_strictness_backward__f87ce9a27dfe.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2213–2226; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T18_deploy_gate_strictness_backward :
  forall components,
    deploy_authorized components = true ->
    (forall a, In a components -> a = true).
Proof.
  intros components Hall a Hin. unfold deploy_authorized in Hall.
  induction components as [|c rest IH].
  - inversion Hin.
  - simpl in Hall. unfold auth_meet in Hall.
    apply andb_true_iff in Hall. destruct Hall as [Htrue_c Htrue_rest].
    simpl in Hin. destruct Hin as [Heq | Hin'].
    + rewrite <- Heq. exact Htrue_c.
    + apply IH; assumption.
Qed.
```

## 154. `T18_deploy_gate_strictness_forward`

- Kind: `Theorem`
- Code SHA-256: `4a49aa057ccdbd25e423ac456aac985bb404f6d0cf0d70daf263abd5835a3137`
- Statement SHA-256: `27023291e1b5f5f4abee07db9c6935ebaffa4ed14c001c7819ba853895c636e0`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000154_T18_deploy_gate_strictness_forward__4a49aa057ccd.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2200–2211; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T18_deploy_gate_strictness_forward :
  forall components,
    (forall a, In a components -> a = true) ->
    deploy_authorized components = true.
Proof.
  intros components Hall. unfold deploy_authorized.
  induction components as [|c rest IH]; simpl.
  - reflexivity.
  - assert (Hc : c = true) by (apply Hall; simpl; left; reflexivity).
    rewrite Hc. simpl.
    apply IH. intros a Ha. apply Hall. simpl. right. exact Ha.
Qed.
```

## 155. `T19_failure_witness`

- Kind: `Theorem`
- Code SHA-256: `014810fd2720b444a5bced8c8a81d14521995900bfa564fed98ab47e972fd1c6`
- Statement SHA-256: `b7547b55d7649c640b9e2a262754fa917f1da6b631e5cd33f8ccf0d69ba6daf4`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000155_T19_failure_witness__014810fd2720.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2756–2769; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T19_failure_witness :
  forall g, gate_verdict g = false -> exists d, g d = false.
Proof.
  intros g H. unfold gate_verdict in H.
  apply andb_false_iff in H as [H | H5].
  - apply andb_false_iff in H as [H | H4].
    + apply andb_false_iff in H as [H | H3].
      * apply andb_false_iff in H as [H1 | H2].
        -- exists D1. exact H1.
        -- exists D2. exact H2.
      * exists D3. exact H3.
    + exists D4. exact H4.
  - exists D5. exact H5.
Qed.
```

## 156. `T19_five_gate_independence`

- Kind: `Theorem`
- Code SHA-256: `ec4c43db70f1f52ff730fbdb3c2712f65a458803fcf2c93dac4f564e73e6867e`
- Statement SHA-256: `335b8c0a4085ce3b101f0e4487be7ceddc1c9dc4840fad3f1b6bbc463ccdb68c`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000156_T19_five_gate_independence__ec4c43db70f1.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2747–2752; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T19_five_gate_independence :
  forall g, gate_verdict g = true <-> (forall d, g d = true).
Proof.
  split; [apply T19_verdict_factors_backward
        | apply T19_verdict_factors_forward].
Qed.
```

## 157. `T19_isolated_update_effect`

- Kind: `Theorem`
- Code SHA-256: `aa2875dfadf43cc802e15a42860ea00124d50c1941d3e9b41d3b3be9843ea7c3`
- Statement SHA-256: `cb7f989d03e8ac0d25389520e67adce73f651a40f20c0efce0aa4875dbaa9a3d`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000157_T19_isolated_update_effect__aa2875dfadf4.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2774–2781; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T19_isolated_update_effect :
  forall g d v,
    let g' := gate_set g d v in
    forall d', d' <> d -> g' d' = g d'.
Proof.
  intros g d v g' d' Hneq. unfold g', gate_set.
  rewrite Dim_eqb_neq; [reflexivity|congruence].
Qed.
```

## 158. `T19_verdict_factors_backward`

- Kind: `Theorem`
- Code SHA-256: `26d1c5c60b83987678d72281131f4e69315550384f89b009bff7b52bb213aaaa`
- Statement SHA-256: `cc394b84bdb7a24f86a957e8c430179081dd16bf588039901e5b203f3bab8b94`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000158_T19_verdict_factors_backward__26d1c5c60b83.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2736–2745; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T19_verdict_factors_backward :
  forall g, gate_verdict g = true -> forall d, g d = true.
Proof.
  intros g H d. unfold gate_verdict in H.
  apply andb_true_iff in H as [H H5].
  apply andb_true_iff in H as [H H4].
  apply andb_true_iff in H as [H H3].
  apply andb_true_iff in H as [H1 H2].
  destruct d; assumption.
Qed.
```

## 159. `T19_verdict_factors_forward`

- Kind: `Theorem`
- Code SHA-256: `a65dd053660eee295c8f34a1bff3c3a4d4b01843d41afe46d5caee058352563d`
- Statement SHA-256: `51a0c75e957423fd865ceebf7fca0014de7697647b66e244b269774200a19748`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000159_T19_verdict_factors_forward__a65dd053660e.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2728–2734; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T19_verdict_factors_forward :
  forall g, (forall d, g d = true) -> gate_verdict g = true.
Proof.
  intros g Hall. unfold gate_verdict.
  rewrite (Hall D1), (Hall D2), (Hall D3), (Hall D4), (Hall D5).
  reflexivity.
Qed.
```

## 160. `T1_DAG_acyclicity`

- Kind: `Theorem`
- Code SHA-256: `2152862310b11492f12fd43b0997be128359f90bd0bc2bdb233554d4c6b57fb9`
- Statement SHA-256: `fdb71466fa800484fbc20888041c88b5003b008f0fb0237640cdb00969d37f68`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000160_T1_DAG_acyclicity__2152862310b1.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1806–1845; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T1_DAG_acyclicity : forall g u v,
  acyclic g ->
  can_insert_safely g u v ->
  acyclic (insert_safe g u v).
Proof.
  intros g u v Hacyc Hsafe.
  unfold acyclic, insert_safe. intros w x Hp Hreach.
  destruct Hp as [Heq_uv | Hin_old].
  - (* new edge used first: w = u, x = v; need ~ reach ((u,v)::g) v u *)
    injection Heq_uv as <- <-.
    destruct Hreach as [n Hrn].
    apply reach_n_split_on_edge in Hrn.
    destruct Hrn as [Hold | [k1 [k2 [_ [Ha Hb]]]]].
    + (* reach g v u directly — contradicts safety *)
      apply Hsafe. exists n. exact Hold.
    + (* reach_n split: the cycle candidate v->u uses the new edge.
         Ha: reach_n g k1 v u already proves reach g v u,
         contradicting Hsafe. *)
      apply Hsafe. exists k1. exact Ha.
  - (* old edge used first *)
    destruct Hreach as [n Hrn].
    apply reach_n_split_on_edge in Hrn.
    destruct Hrn as [Hold | [k1 [k2 [_ [Ha Hb]]]]].
    + (* full path in g; then w -> x -> ... -> w is a cycle in g *)
      apply (Hacyc w x).
      * unfold parent_of. exact Hin_old.
      * exists n. exact Hold.
    + (* path in extended DAG passes new edge:
         x -> ... -> u  then  v -> ... -> w   — and  w -> x is the old edge.
         So reach g v u  (from k1? check — Ha: reach_n g k1 x u).
         And reach g v w  (from Hb: reach_n g k2 v w).
         Composing: v reaches w (Hb), w parent of x (Hin_old), x reaches u (Ha).
         So reach g v u — contradicts safety. *)
      apply Hsafe.
      apply reach_trans with (v := w).
      * exists k2. exact Hb.
      * apply reach_from_parent with (w := x).
        -- unfold parent_of. exact Hin_old.
        -- exists k1. exact Ha.
Qed.
```

## 161. `T20_lattice_minimum`

- Kind: `Theorem`
- Code SHA-256: `882374823cb0211a06223a91aa97fbaca5ce2dcf322fe553eaa20ac88360212d`
- Statement SHA-256: `f050b3147dce1bff16c343d87a4412a3cdb1d106e4210248fc16709c930de939`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000161_T20_lattice_minimum__882374823cb0.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2268–2275; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T20_lattice_minimum :
  forall xs,
    auth_meet_list xs = false <-> In false xs.
Proof.
  intros. split.
  - apply auth_meet_list_false_witness.
  - apply auth_meet_list_any_false.
Qed.
```

## 162. `T20_meet_is_greatest_lower_bound_false`

- Kind: `Theorem`
- Code SHA-256: `c2da90979f3eb7526b3923b5c4b04ca1aab3464ffbaa01795208d8ad09d74ddb`
- Statement SHA-256: `270b45a573dd691bbcdb492b0d20bf1568b66375a37a7dc13053fbe94657d9b6`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000162_T20_meet_is_greatest_lower_bound_false__c2da90979f3e.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2258–2264; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T20_meet_is_greatest_lower_bound_false :
  forall xs, (exists a, In a xs /\ a = false) ->
    auth_meet_list xs = false.
Proof.
  intros xs [a [Hin Hfalse]]. subst.
  apply auth_meet_list_any_false. exact Hin.
Qed.
```

## 163. `T20_meet_is_lower_bound`

- Kind: `Theorem`
- Code SHA-256: `cd902e706793ecee7d6e6d5c253f3f77f735e04e2e1e39304daa41425c818c7d`
- Statement SHA-256: `022a60a6059523f5c1a1ed13b5fa70bd35abd2d567aad8a97b51b5836f9b438b`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000163_T20_meet_is_lower_bound__cd902e706793.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2248–2254; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T20_meet_is_lower_bound :
  forall xs a, In a xs -> (auth_meet_list xs = true -> a = true).
Proof.
  intros xs a Hin Hmeet.
  pose proof (T18_deploy_gate_strictness_backward xs Hmeet) as Hall.
  apply Hall. exact Hin.
Qed.
```

## 164. `T2_artifact_immutability`

- Kind: `Theorem`
- Code SHA-256: `6f5094fbf454556987706a26d1a28e8901225507aebf42329a6e5cc7f6bbdb05`
- Statement SHA-256: `667096be164b04f31c67cfc25e88c64c7ef3df2e1b762ff95343a673872e146c`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000164_T2_artifact_immutability__6f5094fbf454.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1907–1918; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T2_artifact_immutability :
  forall r a a_new,
    art_uid a_new <> art_uid a ->
    lookup r (art_uid a) = Some a ->
    lookup (commit r a_new) (art_uid a) = Some a.
Proof.
  intros r a a_new Hneq Hlook.
  unfold commit. simpl.
  destruct (Nat.eqb (art_uid a_new) (art_uid a)) eqn:E.
  - apply Nat.eqb_eq in E. contradiction.
  - exact Hlook.
Qed.
```

## 165. `T2_field_invariance`

- Kind: `Theorem`
- Code SHA-256: `34e8050155a68d02ddbeaa2ddc94ff8a90ac6ffd553ace892936d58d11bf8de5`
- Statement SHA-256: `26b8ed872a6337cec40a193c23a71ac6f4225662c624e1524093d487dc9095fe`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000165_T2_field_invariance__34e8050155a6.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1923–1931; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T2_field_invariance :
  forall r uid a1 a2,
    uid_unique r ->
    lookup r uid = Some a1 ->
    lookup r uid = Some a2 ->
    a1 = a2.
Proof.
  intros r uid a1 a2 Hu H1 H2. rewrite H1 in H2. injection H2. auto.
Qed.
```

## 166. `T3_append_only_preservation`

- Kind: `Theorem`
- Code SHA-256: `746480c23596ba4f3b6df8b5630b004687ae004c1366cbbee9fe20bdb68d5d3c`
- Statement SHA-256: `599f0e315324e6a909e0705761d48e308e6d8ff31b57967afeaa7598e5739980`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000166_T3_append_only_preservation__746480c23596.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1938–1944; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T3_append_only_preservation :
  forall r a_new a,
    In a r ->
    In a (commit r a_new).
Proof.
  intros r a_new a Hin. unfold commit. simpl. right. exact Hin.
Qed.
```

## 167. `T3_length_strictly_increasing`

- Kind: `Theorem`
- Code SHA-256: `b040e4d0be3fcf48d7b58fcad0cad8fb994792f6d6af9e44dd5402c07d576e24`
- Statement SHA-256: `06f8e0baffcf022d2ee1cf850d80db7931b53be36a9e480121e977bc5c00b738`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000167_T3_length_strictly_increasing__b040e4d0be3f.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1962–1966; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T3_length_strictly_increasing :
  forall r a, length (commit r a) = S (length r).
Proof.
  intros r a. unfold commit. simpl. reflexivity.
Qed.
```

## 168. `T3_lookup_preservation`

- Kind: `Theorem`
- Code SHA-256: `19d59827d1101577b06b800b039bf5346e5105f87596a6245293e194c888bb16`
- Statement SHA-256: `6bd8dd71c7440d6f52c9252240c54733b869a4d8224ee1f987f0402438624ef7`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000168_T3_lookup_preservation__19d59827d110.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 1948–1958; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T3_lookup_preservation :
  forall r a_new uid a,
    art_uid a_new <> uid ->
    lookup r uid = Some a ->
    lookup (commit r a_new) uid = Some a.
Proof.
  intros r a_new uid a Hneq Hlook. unfold commit. simpl.
  destruct (Nat.eqb (art_uid a_new) uid) eqn:E.
  - apply Nat.eqb_eq in E. contradiction.
  - exact Hlook.
Qed.
```

## 169. `T5_corruption_has_witness`

- Kind: `Theorem`
- Code SHA-256: `31ad90cf0394614c4764b3abc4bf7c579abdce52be587afed87ee6fffcb23cfc`
- Statement SHA-256: `7fc24499117bf184d315a6669d4dcce59a1df0bd4a08622e7d3909879f388248`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000169_T5_corruption_has_witness__31ad90cf0394.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2057–2060; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T5_corruption_has_witness :
  forall (ancestors : list AuthVal),
    auth_meet_list ancestors = false -> In false ancestors.
Proof. exact auth_meet_list_false_witness. Qed.
```

## 170. `T5_monotone_weakening`

- Kind: `Theorem`
- Code SHA-256: `a43b69ab88e2e2eca60490c6036e7136da9d6aa2444f23c0b4afa9395583d4db`
- Statement SHA-256: `dda2a6e551c5010d6c3a924d6a08bceee4249c09b4060acd6533cf13520e5c33`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000170_T5_monotone_weakening__a43b69ab88e2.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2064–2070; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T5_monotone_weakening :
  forall (xs ys : list AuthVal),
    auth_meet_list xs = false ->
    auth_meet_list (xs ++ ys) = false.
Proof.
  intros xs ys H. rewrite auth_meet_list_app, H. reflexivity.
Qed.
```

## 171. `T5_monotone_weakening_right`

- Kind: `Theorem`
- Code SHA-256: `5fd4471917e26f2c63853a17d7cd7767e10d7e30380deec21cce8314ccd1138c`
- Statement SHA-256: `a2dc257f4296ee3c2334ff2910c5d7d7c667d0651697e27cd04c27d4412b0f31`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000171_T5_monotone_weakening_right__5fd4471917e2.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2072–2079; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T5_monotone_weakening_right :
  forall (xs ys : list AuthVal),
    auth_meet_list ys = false ->
    auth_meet_list (xs ++ ys) = false.
Proof.
  intros xs ys H. rewrite auth_meet_list_app, H.
  apply andb_false_r.
Qed.
```

## 172. `T5_non_dilutable_corruption`

- Kind: `Theorem`
- Code SHA-256: `c5b7a6ac86e5a17c49d143509b12d49284e105682f393db5b67251857535749f`
- Statement SHA-256: `ab45fa70f6199c353a678baae000a1e532af50812e40661cf7a3bc7f324a5562`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 44
- Extracted code file: `proof_code/axiomatic/coq/000172_T5_non_dilutable_corruption__c5b7a6ac86e5.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2050–2053; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T5_non_dilutable_corruption :
  forall (ancestors : list AuthVal),
    In false ancestors -> auth_meet_list ancestors = false.
Proof. exact auth_meet_list_any_false. Qed.
```

## 173. `T8_recovery_monotonicity`

- Kind: `Theorem`
- Code SHA-256: `8b6f92f907e02bd9131b603a478911780e235d8e98270f27f1d940096fcb7a1c`
- Statement SHA-256: `3ba6c6836616b9ab9bb52b6cb685ac3dc077e8cf328fcc692b97f04aede7cfa9`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000173_T8_recovery_monotonicity__8b6f92f907e0.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2450–2466; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T8_recovery_monotonicity :
  forall (chain : op_chain) (s s' : state),
    non_degrading chain ->
    apply_chain chain s = Some s' ->
    recovery_assessment s' >= recovery_assessment s.
Proof.
  induction chain as [|o rest IH]; intros s s' Hnd Happ.
  - simpl in Happ. inversion Happ. subst. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    inversion Hnd as [|o' rest' Hdelta Hnd']. subst.
    assert (H1 : recovery_assessment s1 >= recovery_assessment s)
      by (eapply non_degrading_step_monotone; eauto).
    assert (H2 : recovery_assessment s' >= recovery_assessment s1)
      by (apply (IH s1 s' Hnd' Happ)).
    lia.
Qed.
```

## 174. `T8_recovery_strict_monotonicity`

- Kind: `Theorem`
- Code SHA-256: `d58368356c117beabc4961f2ee0586e283f9126b69f11591d64a8c9656098c82`
- Statement SHA-256: `19ef5b6c34c46c809a179ba2635e5d1e057510ad58688aa2bbaac62966c13d97`
- Occurrences: 59
- Source statuses: `AXIOMATIC` × 6, `INCOMPLETE` × 53
- Extracted code file: `proof_code/axiomatic/coq/000174_T8_recovery_strict_monotonicity__d58368356c11.v`
- Primary provenance: `11-concat_gpx_consciousness_axiomatic_24_files.v` lines 2471–2496; embedded `gpx_consciousness_2026-05_51fbd51b030d175f_51fbd51b030d175f_51fbd51b030d175f_2026_04_24_gpx_master_consolidated.v`

```coq
Theorem T8_recovery_strict_monotonicity :
  forall (prefix : op_chain) (o : concrete_op) (suffix : op_chain) (s s' : state),
    non_degrading prefix ->
    op_delta o > 0 ->
    non_degrading suffix ->
    apply_chain (prefix ++ o :: suffix) s = Some s' ->
    recovery_assessment s' > recovery_assessment s.
Proof.
  intros prefix o suffix s s' Hpre Hpos Hsuf Happ.
  (* Split the chain into three evaluations *)
  revert s Happ. induction prefix as [|op rest IH]; intros s Happ.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hcoh1 : coh_budget s1 = coh_budget s + op_delta o)
      by (apply concrete_apply_coh; exact E).
    assert (H2 : recovery_assessment s' >= recovery_assessment s1).
    { apply (T8_recovery_monotonicity suffix s1 s' Hsuf). exact Happ. }
    unfold recovery_assessment in *. lia.
  - simpl in Happ.
    destruct (concrete_apply op s) as [s1|] eqn:E; [|discriminate].
    inversion Hpre as [|op' rest' Hdelta Hpre']. subst.
    assert (H1 : recovery_assessment s1 >= recovery_assessment s)
      by (eapply non_degrading_step_monotone; eauto).
    specialize (IH Hpre' s1 Happ).
    unfold recovery_assessment in *. lia.
Qed.
```

## 175. `universal_falsifiability`

- Kind: `Theorem`
- Code SHA-256: `ef2e6e5f484060f4ee07829dbfc16a852e33f62703871946bd31b4d3415e1b2e`
- Statement SHA-256: `5af20cefa01eb1d0df5b3b1e2dfc0425a21ea7dad35c62617454577856017796`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000175_universal_falsifiability__ef2e6e5f4840.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 1121–1129; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Theorem universal_falsifiability :
    (falsifier_density \/ falsifier_boundary \/ falsifier_composition \/ falsifier_witness) ->
    False.
  (** These are falsification CONDITIONS, not actual falsifiers *)
  Proof.
    intro H. destruct H as [Hd | [Hb | [Hc | Hw]]];
    unfold falsifier_density, falsifier_boundary, falsifier_composition, falsifier_witness in *;
    tauto.
  Defined.
```

## 176. `uuids_unique_perm`

- Kind: `Lemma`
- Code SHA-256: `a9be0194deac6c889f4352361284e2cd42b35aa8f09a66adaf4e14b530ea5d0f`
- Statement SHA-256: `65bc97e6492c540f5cc24dc93326b380f1e512c89c62a9c26c3e1cb762cad68f`
- Occurrences: 43
- Source statuses: `AXIOMATIC` × 43
- Extracted code file: `proof_code/axiomatic/coq/000176_uuids_unique_perm__a9be0194deac.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 4202–4210; embedded `proofbundle_2026-05_3a100f54de2ad10d_3a100f54de2ad10d_000124_3a100f54de2a_2026_03_23_fold_real.v`

```coq
Lemma uuids_unique_perm : forall l1 l2,
  Permutation l1 l2 -> uuids_unique l1 -> uuids_unique l2.
Proof.
  intros l1 l2 Hperm Huniq p q Hp Hq Hid.
  apply Huniq.
  - eapply Permutation_in. { apply Permutation_sym. exact Hperm. } exact Hp.
  - eapply Permutation_in. { apply Permutation_sym. exact Hperm. } exact Hq.
  - exact Hid.
Qed.
```

## 177. `verify_deterministic`

- Kind: `Theorem`
- Code SHA-256: `c337217455efbeb0f18f74f0de24f4050b2b9532500598df5fc45f2ff3cede40`
- Statement SHA-256: `00d3d05cb1f2716c07e982e12f8c951683cc3eb5104369f453c8c1c075a126f0`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000177_verify_deterministic__c337217455ef.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 683–692; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem verify_deterministic :
  forall b c k p f,
    forall o1 o2,
      verify b c k p f = o1 ->
      verify b c k p f = o2 ->
      o1 = o2.
Proof.
  intros b c k p f o1 o2 H1 H2.
  rewrite <- H1, <- H2. reflexivity.
Qed.
```

## 178. `verify_total`

- Kind: `Theorem`
- Code SHA-256: `51a1fe697e09fb7712da02b73bfb17aadd850b2e9bef2f1d5494c844345910d2`
- Statement SHA-256: `8a1eae5cd76845f1f463fe64648878a1451f55ee44b6dd7ab25c5f50b2fd0284`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000178_verify_total__51a1fe697e09.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 694–698; embedded `proofbundle_2026-05_bde2ad2727611a11_2026_05_03_pb2_robust.v`

```coq
Theorem verify_total :
  forall b c k p f, exists o, verify b c k p f = o.
Proof.
  intros. exists (verify b c k p f). reflexivity.
Qed.
```

## 179. `walk_deterministic`

- Kind: `Theorem`
- Code SHA-256: `27406a3e0afd00b5c0afb5040eb0f5b3933473f8ca3ef8d89743bcaf7eb6669f`
- Statement SHA-256: `65c2bca85805a6fda4b9597d347602d783b31c238f27c243e86e412c178566a4`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000179_walk_deterministic__27406a3e0afd.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1085–1093; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem walk_deterministic :
  forall b provided visited fuel,
    forall o1 o2,
      walk b provided visited fuel = o1 ->
      walk b provided visited fuel = o2 ->
      o1 = o2.
Proof.
  intros. rewrite <- H, <- H0. reflexivity.
Qed.
```

## 180. `walk_terminates`

- Kind: `Theorem`
- Code SHA-256: `8452b0d8ea814bc2fceeb6ce4034c2d849c573b67795681caf2ad10b29d0274d`
- Statement SHA-256: `9adc2faf7990bbe84f7f77a7ff0fdefdd234ac60b19d8a39b3d71999b8ddb8a8`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000180_walk_terminates__8452b0d8ea81.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 996–1001; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem walk_terminates :
  forall b provided visited fuel,
    exists o, walk b provided visited fuel = o.
Proof.
  intros. exists (walk b provided visited fuel). reflexivity.
Qed.
```

## 181. `within_correct`

- Kind: `Theorem`
- Code SHA-256: `1a4122730711b4c45a23c35332882a25fd5d9eee06787174789a891a02b88880`
- Statement SHA-256: `235e9ae39cb9e611e3fa3b7105952fa20fe65aeae8e7a87b9e10be4a748bc3e6`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000181_within_correct__1a4122730711.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203043–203053; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem within_correct :
  forall p iso_lo iso_hi c v lo hi t,
    resolve_path p c = Some v ->
    parse_iso iso_lo = Some lo ->
    parse_iso iso_hi = Some hi ->
    value_to_time v = Some t ->
    eval_atom (Within p iso_lo iso_hi) c =
      Some (andb (time_le lo t) (time_le t hi)).
Proof.
  intros. simpl. rewrite H, H0, H1, H2. reflexivity.
Qed.
```

## 182. `z_min_le_z_max`

- Kind: `Lemma`
- Code SHA-256: `17c72c172d577a9bdf2ce7858e1158f5f7d0926ce1915d6abf5d885ddbba8033`
- Statement SHA-256: `75aee0b2baa324ae4b398b6c02ca9df43ab88c56b75307c13be3742182ca3c4f`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000182_z_min_le_z_max__17c72c172d57.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 269–270; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma z_min_le_z_max : (z_min <= z_max)%R.
  Proof. unfold z_min, z_max; lra. Qed.
```

## 183. `zero_fuel_exhausted`

- Kind: `Theorem`
- Code SHA-256: `c2681a6067b6d4cd80e20130ad7b207b8fb70f20d32a313980bf1dd0141aba5a`
- Statement SHA-256: `df57392d78df11272fa38ee57960c4e91095a08dca62a927232493a4e50a58bc`
- Occurrences: 64
- Source statuses: `AXIOMATIC` × 64
- Extracted code file: `proof_code/axiomatic/coq/000183_zero_fuel_exhausted__c2681a6067b6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 1063–1066; embedded `proofbundle_2026-05_82362bfa61c671dd_2026_05_03_pb3_pb9_robust.v`

```coq
Theorem zero_fuel_exhausted :
  forall b provided visited,
    walk b provided visited 0 = LDepthExhausted.
Proof. intros. simpl. reflexivity. Qed.
```

## 184. `zero_fuel_none`

- Kind: `Theorem`
- Code SHA-256: `47be9ed24ea68849076d2c0061eef1b2f65cbbbc781e075b476e1a4810226850`
- Statement SHA-256: `97ce26228d34e2c167bd1034308a87e60f93865c7caafd05d3b4a3c6b5b90810`
- Occurrences: 1
- Source statuses: `AXIOMATIC` × 1
- Extracted code file: `proof_code/axiomatic/coq/000184_zero_fuel_none__47be9ed24ea6.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 203155–203157; embedded `proofbundle_2026-05_b5b425be15c6105d_2026_05_03_pb4_pb5_robust.v`

```coq
Theorem zero_fuel_none :
  forall e c, eval_expr e c 0 = None.
Proof. intros. simpl. reflexivity. Qed.
```

## 185. `zero_gradient_zero_flow`

- Kind: `Theorem`
- Code SHA-256: `b4d26ecff272aea780918c5c13620baf1a39f11799ddc4aa07b46438fd517f8b`
- Statement SHA-256: `1962537552aa1e8c8ea919487dcab650ed59691141f5423d203630e17ef2826a`
- Occurrences: 17
- Source statuses: `AXIOMATIC` × 17
- Extracted code file: `proof_code/axiomatic/coq/000185_zero_gradient_zero_flow__b4d26ecff272.v`
- Primary provenance: `13-concat_proofbundle_axiomatic_520_files.v` lines 6612–6620; embedded `proofbundle_2026-05_ab51f6372b8ea35e_ab51f6372b8ea35e_000166_ab51f6372b8e_boundary.v`

```coq
Theorem zero_gradient_zero_flow :
  forall s1 s2 e,
    concentration s1 e = concentration s2 e ->
    flow_rate s1 s2 e = 0.
Proof.
  intros s1 s2 e Hgrad.
  unfold flow_rate. rewrite Hgrad.
  lra.
Qed.
```

## 186. `ε_ι_nonneg`

- Kind: `Lemma`
- Code SHA-256: `1e4971b8262fbef7d931763f00e0b28444ebf1ec2991d5666aadf1c81136b6bb`
- Statement SHA-256: `231e4895b33e24607caebd1029e8d8e42aefe37e800943368111de880b56d985`
- Occurrences: 20
- Source statuses: `AXIOMATIC` × 20
- Extracted code file: `proof_code/axiomatic/coq/000186_nonneg__1e4971b8262f.v`
- Primary provenance: `08-concat_principia_axiomatic_75_files.v` lines 266–267; embedded `principia_2026-05_eda272378ddd156e_eda272378ddd156e_000221_eda272378ddd_principia.v`

```coq
Lemma ε_ι_nonneg : (0 <= ε_ι)%R.
  Proof. unfold ε_ι; lra. Qed.
```



---

# Coq proof code — closed in incomplete source

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `accumulated_never_loosens`

- Kind: `Theorem`
- Code SHA-256: `da1b6c6b215ae164dfe45224e413fa2c0c94691108504972d6175c1a19fb1ca8`
- Statement SHA-256: `52cf6c0d5f5a59c2ba658f924de757beda2399e44bd2c9859257b179a2a58cdc`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000001_accumulated_never_loosens__da1b6c6b215a.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 679–689; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem accumulated_never_loosens : forall (fc : FoldChain) (d : Distinction) (c : Constraint) (n : nat),
  accumulated_constraint fc n = false ->
  accumulated_constraint (ChainStep fc d c) n = false.
Proof.
  intros fc d c n H.
  simpl.
  unfold tighten.
  rewrite H.
  simpl.
  reflexivity.
Qed.
```

## 2. `admissibility_closure`

- Kind: `Theorem`
- Code SHA-256: `487c1ddecf68342948728b87d93d3265253f8974b7807b1a18a9bdda59e901b2`
- Statement SHA-256: `35c97dbef074e621800646d3f908c2113a11a48f17c8cd6ae8306d91fc6e6e18`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000002_admissibility_closure__487c1ddecf68.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1140–1148; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem admissibility_closure :
  forall s i, Attribution s i ->
  forall u, In (S -> S) perturbations u ->
  d_G u < epsilon ->
  C3 (u s) i.
Proof.
  unfold Attribution, C3. intros s i [_ [_ [HC3 [_ _]]]] u Hu Heps.
  apply HC3. assumption. assumption.
Qed.
```

## 3. `attribution_threshold`

- Kind: `Theorem`
- Code SHA-256: `bba819a94c838efb0ee58609a5fd661cf9b37bef7b01c0e67962ad42ccb7f3e7`
- Statement SHA-256: `7c11784561368e408366c19cc18aff311680d5a3723345e6a95e114fcaeaa736`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000003_attribution_threshold__bba819a94c83.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1151–1158; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem attribution_threshold :
  forall s i,
    Attribution s i ->
    Certification s i > theta ->
    exists v : Verdict, v = WARRANTED.
Proof.
  intros. exists WARRANTED. reflexivity.
Qed.
```

## 4. `constraint_ambiguity`

- Kind: `Theorem`
- Code SHA-256: `dfe5a99e845c15c454266987a8ccd55b7187cf98b035680b1cfd474f9d44b7d5`
- Statement SHA-256: `57815d1c354f9165a8268ed2f6bbc03a1c1997d0aa1f88e12a0c0673001c808c`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000004_constraint_ambiguity__dfe5a99e845c.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1692–1725; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem constraint_ambiguity :
  exists (L1a L1b : Distinction) (L2 L3 L4 : Distinction)
         (c1a c1b c2 cR : Constraint) (n : nat),
    (* different leaf values *)
    L1a n <> L1b n /\
    (* different constraints *)
    c1a n <> c1b n /\
    (* same root *)
    merkle_eval (depth2_tree L1a L2 L3 L4 c1a c2 cR) n =
    merkle_eval (depth2_tree L1b L2 L3 L4 c1b c2 cR) n.
Proof.
  (* Config A: c1a admits n, L2=trivial passes L1a through. L1a=null. *)
  (*   nodeL = false. L3=trivial, L4=trivial, nodeR=true. root=false *)
  (* Config B: c1b rejects n, so nodeL = L1b n directly. L1b=trivial *)
  (*   nodeL = true (passthrough of L1b since c1b rejects). *)
  (*   But wait -- if c1b rejects, constrained_fold returns d1 n     *)
  (*   which is the eval of left subtree leaf = L1b n = true.        *)
  (*   nodeR = true. root = nodeL = true. That's not false.          *)
  (* Need both roots equal. Try: make both roots = true.             *)
  (* Config A: c1a rejects n -> nodeL = L1a n. L1a = trivial -> nodeL=true *)
  (*   nodeR = true. root = nodeL = true. *)
  (* Config B: c1b admits n, L2 = null -> fold L1b null = true.      *)
  (*   nodeL = true. nodeR = true. root = true. Same.                *)
  exists trivial_dist, null_dist, null_dist, trivial_dist, trivial_dist.
  exists (fun _ => false), (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  split.
  { unfold trivial_dist, null_dist. intro H. discriminate H. }
  split.
  { intro H. discriminate H. }
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. reflexivity.
Qed.
```

## 5. `depth2_has_four_leaves`

- Kind: `Theorem`
- Code SHA-256: `f16b0ce84c4c6ac3293e8774bbc26b9ef808270bcebad95693d6fa00b4be9a78`
- Statement SHA-256: `d2d255d36bb63bfc0c8ff482312d2071a0f537129514d73728a48befd854bc37`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000005_depth2_has_four_leaves__f16b0ce84c4c.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1741–1746; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem depth2_has_four_leaves :
  forall (L1 L2 L3 L4 : Distinction) (c1 c2 cR : Constraint),
    merkle_leaf_count (depth2_tree L1 L2 L3 L4 c1 c2 cR) = 4.
Proof.
  intros. unfold depth2_tree. simpl. reflexivity.
Qed.
```

## 6. `depth2_root_formula`

- Kind: `Theorem`
- Code SHA-256: `bef35477b0fcbaf16c09f9bf01f6554e2498140a6fe559d309697205fe26e75f`
- Statement SHA-256: `3256e2c35d452ad84b7683d8eb3bbc8b277e17b2fc594e7fb39057639395700b`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000006_depth2_root_formula__bef35477b0fc.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1557–1571; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem depth2_root_formula :
  forall (L1 L2 L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true -> c2 n = true -> cR n = true ->
    merkle_eval (depth2_tree L1 L2 L3 L4 c1 c2 cR) n =
      (if (if L4 n then L3 n else true)
       then (if L2 n then L1 n else true)
       else true).
Proof.
  intros L1 L2 L3 L4 c1 c2 cR n Hc1 Hc2 HcR.
  unfold depth2_tree.
  simpl merkle_eval.
  unfold constrained_fold, fold.
  rewrite Hc1. rewrite Hc2. rewrite HcR.
  reflexivity.
Qed.
```

## 7. `excluded_monotone`

- Kind: `Theorem`
- Code SHA-256: `d17942ec895860a02351ead6b636d3f9143dda7ff2a59d024c971645b7516d07`
- Statement SHA-256: `662aee6e65a931e4e10df01646d2145fa96a8a7cdf581fda052258c5a33de25d`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000007_excluded_monotone__d17942ec8958.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 711–726; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem excluded_monotone : forall (fc : FoldChain) (d : Distinction) (c : Constraint) (bound : nat),
  excluded_count (accumulated_constraint fc) bound <=
  excluded_count (accumulated_constraint (ChainStep fc d c)) bound.
Proof.
  intros fc d c bound.
  unfold excluded_count.
  apply filter_sub_length.
  intros x H.
  apply negb_true_iff in H.
  apply negb_true_iff.
  simpl.
  unfold tighten.
  rewrite H.
  simpl.
  reflexivity.
Qed.
```

## 8. `exclusion_bounded`

- Kind: `Theorem`
- Code SHA-256: `1f8880a352c1faf55c52b66ef5bc2d807c8dcdb71f17c882f2f2eba444930dbc`
- Statement SHA-256: `871a48831ebe03f26d6529abbc0d23c95d86cf3adb28acdca561e8a2f8f57a9b`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000008_exclusion_bounded__1f8880a352c1.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 780–795; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem exclusion_bounded : forall (fc : FoldChain) (bound : nat),
  excluded_count (accumulated_constraint fc) bound <= bound.
Proof.
  intros fc bound.
  unfold excluded_count.
  assert (Hgen: forall l : list nat,
    length (filter (fun n => negb (accumulated_constraint fc n)) l) <= length l).
  { intro l. induction l as [|a l' IH].
    - simpl. apply Nat.le_refl.
    - simpl. destruct (negb (accumulated_constraint fc a)).
      + simpl. apply le_n_S. exact IH.
      + apply le_S. exact IH. }
  specialize (Hgen (seq 0 bound)).
  rewrite seq_length in Hgen.
  exact Hgen.
Qed.
```

## 9. `false_universal_counterexample`

- Kind: `Lemma`
- Code SHA-256: `74f0240a719c701c928ac64306258f4969f781875f1d709f206129b2954d4c27`
- Statement SHA-256: `4c4e291473f787645b2f130a360f7e5e45f7348e0376b490f449c71364ca54ec`
- Occurrences: 1
- Source statuses: `INCOMPLETE` × 1
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000009_false_universal_counterexample__74f0240a719c.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 14571–14587; embedded `proofbundle_2026-05_ba253798317165d1_survival_theorem_existential_repair_20260513.v`

```coq
Lemma false_universal_counterexample :
  ~ (forall W k, false_universal_claim W k).
Proof.
  intro H.
  specialize (H (1/2) 2).
  unfold false_universal_claim in H.
  assert (H1: (1/2) > 0) by apply Rlt_0_1.
  assert (H2: (2 >= 2)%R) by apply Rle_refl.
  specialize (H H1 H2).
  (* k * W = 2 * (1/2) = 1, and 1 > 1 is false *)
  assert (H3: 2 * (1/2) = 1).
  { field. }
  rewrite H3 in H.
  (* 1 > 1 is false *)
  apply Rlt_irrefl with (r := 1).
  exact H.
Qed.
```

## 10. `filter_sub_length`

- Kind: `Lemma`
- Code SHA-256: `9b9eab58655dadf8a46391b214240d008c1b69622e319eca27e3d248828aaf20`
- Statement SHA-256: `b971009eba372d377c6ab0ab378457e8777f31dfb5d95c0bb83a4b62aeea4970`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000010_filter_sub_length__9b9eab58655d.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 696–709; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Lemma filter_sub_length : forall (f g : nat -> bool) (l : list nat),
  (forall x, f x = true -> g x = true) ->
  length (filter f l) <= length (filter g l).
Proof.
  intros f g l Himp.
  induction l as [|a l' IH].
  - simpl. apply Nat.le_refl.
  - simpl.
    destruct (f a) eqn:Hfa.
    + apply Himp in Hfa. rewrite Hfa. simpl. apply le_n_S. exact IH.
    + destruct (g a) eqn:Hga.
      * simpl. apply le_S. exact IH.
      * exact IH.
Qed.
```

## 11. `gauge_stability`

- Kind: `Theorem`
- Code SHA-256: `dba78ff7096e11f7ac798115d508f0648c94c1277bc991ba4ac57507b8d59744`
- Statement SHA-256: `d397f72c5f07c27d9460f707ca8e9ee773ca7832f70d72d24ef5de2452fae4fe`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000011_gauge_stability__dba78ff7096e.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1075–1086; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem gauge_stability :
  forall s i g,
    In (S -> S) gauge_transforms g ->
    Rabs (Cert s i - Cert (g s) i) < zeta ->
    Attribution s i ->
    gauge_stable (g s) i.
Proof.
  unfold Attribution, C5, gauge_stable. intros s i g Hg Hcert [HC1 [HC2 [HC3 [HC4 [Hgau _]]]]].
  intros g' Hg'.
  (* Use triangle inequality on metric *)
  admit. (* Requires specific metric properties *)
Qed.
```

## 12. `L1_affects_root`

- Kind: `Theorem`
- Code SHA-256: `5269ba56a50f0586489f5f31a617e34674ab9083ca95ca67334487cad7ef970c`
- Statement SHA-256: `1fee0f6159556865b6f7390161fd8e5950913f623ed5cfd37407792269885513`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000012_L1_affects_root__5269ba56a50f.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1580–1593; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem L1_affects_root :
  exists (L1a L1b L2 L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1a L2 L3 L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1b L2 L3 L4 c1 c2 cR) n.
Proof.
  exists trivial_dist, null_dist, trivial_dist, trivial_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.
```

## 13. `L2_affects_root`

- Kind: `Theorem`
- Code SHA-256: `22c9d5d6453c7c41a2cac0f14d0974726b269d2d58db1002cea3c1c654e21121`
- Statement SHA-256: `55ce2baa616d5efc52453e0b418d76c42cc596896fe9e86dd0edb794e493c210`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000013_L2_affects_root__22c9d5d6453c.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1596–1611; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem L2_affects_root :
  exists (L1 L2a L2b L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2a L3 L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2b L3 L4 c1 c2 cR) n.
Proof.
  (* L2a = trivial (passes L1 through), L2b = null (projects to true) *)
  (* L1 = null, so pass-through gives false, projection gives true    *)
  exists null_dist, trivial_dist, null_dist, trivial_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.
```

## 14. `L3_affects_root`

- Kind: `Theorem`
- Code SHA-256: `e579bb4ce51435521b028919eb6a3554ef976462ead9fe55c85c47891d4a167d`
- Statement SHA-256: `8bb47459154f449ed6ba925c462fca08ce900677a1fe81d86f536a82c9768da0`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000014_L3_affects_root__e579bb4ce514.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1614–1633; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem L3_affects_root :
  exists (L1 L2 L3a L3b L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2 L3a L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2 L3b L4 c1 c2 cR) n.
Proof.
  (* L3 controls the right node output which controls whether left *)
  (* node passes through or projects. *)
  (* L4 = trivial (passes L3 through). *)
  (* L3a = trivial -> nodeR = true -> root = nodeL *)
  (* L3b = null -> nodeR = false -> root = true *)
  (* Need nodeL <> true, so L1 = null, L2 = trivial -> nodeL = false *)
  exists null_dist, trivial_dist, trivial_dist, null_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.
```

## 15. `L4_affects_root`

- Kind: `Theorem`
- Code SHA-256: `a32aae70cc87d9d667c50686b3d450fb319fd448aa2df629f1b1dce770af618f`
- Statement SHA-256: `1e634f7070d91b10f971b0776790044cbb577fc7d49013e1aed59377f9c3b6e1`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000015_L4_affects_root__a32aae70cc87.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1636–1655; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem L4_affects_root :
  exists (L1 L2 L3 L4a L4b : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2 L3 L4a c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2 L3 L4b c1 c2 cR) n.
Proof.
  (* L4 controls whether L3 passes through or projects at nodeR *)
  (* L4a = trivial -> nodeR = L3. L4b = null -> nodeR = true *)
  (* L3 = null -> nodeR with L4a = false, nodeR with L4b = true *)
  (* nodeL = false (L1=null, L2=trivial) *)
  (* root with L4a: nodeR=false -> root=true *)
  (* root with L4b: nodeR=true -> root=nodeL=false *)
  exists null_dist, trivial_dist, null_dist, trivial_dist, null_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.
```

## 16. `living_append_strict`

- Kind: `Theorem`
- Code SHA-256: `f247baeed9ec2ce74d50cdd4205cf374fd8fc07cbdc056f5f0622e3d8fd158fb`
- Statement SHA-256: `46dc47d13f8bacd6223627a2bfbbac7dfa21ef7183ad714180ea8f0e587eb7e7`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000016_living_append_strict__f247baeed9ec.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 878–889; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem living_append_strict : forall (fc : FoldChain) (d : Distinction) (c : Constraint),
  (exists n : nat, accumulated_constraint fc n = true /\ c n = false) ->
  exists n : nat,
    accumulated_constraint fc n = true /\
    accumulated_constraint (living_append fc d c) n = false.
Proof.
  intros fc d c [n [Hacc Hc]].
  exists n.
  split.
  - exact Hacc.
  - simpl. unfold tighten. rewrite Hacc. rewrite Hc. simpl. reflexivity.
Qed.
```

## 17. `living_append_tightens`

- Kind: `Theorem`
- Code SHA-256: `c200c3776eb2d230f56c7f6774fd2b95430f71946c4ae3baf8a08702264c3385`
- Statement SHA-256: `695f954556344686ca41b48aff1727d97d485e968de234ffb146287e1d8a92b9`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000017_living_append_tightens__c200c3776eb2.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 865–875; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem living_append_tightens : forall (fc : FoldChain) (d : Distinction) (c : Constraint) (n : nat),
  accumulated_constraint (living_append fc d c) n = true ->
  accumulated_constraint fc n = true.
Proof.
  intros fc d c n H.
  simpl in H.
  unfold tighten in H.
  apply andb_true_iff in H.
  destruct H as [H1 H2].
  exact H1.
Qed.
```

## 18. `main_composition`

- Kind: `Theorem`
- Code SHA-256: `c015e9065cfe5e7a31bcefe1f7bd65a0f2195df31069f22597b460a709f3bd7c`
- Statement SHA-256: `479253dde3948cca606c20dfb9925a24c87c86e3ab8372f0a3b663f48d10a099`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000018_main_composition__c015e9065cfe.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 898–909; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem main_composition :
  forall (fc : FoldChain) (d : Distinction) (c : Constraint) (bound : nat),
    (forall n, accumulated_constraint (ChainStep fc d c) n = true ->
               accumulated_constraint fc n = true) /\
    (excluded_count (accumulated_constraint fc) bound <=
     excluded_count (accumulated_constraint (ChainStep fc d c)) bound).
Proof.
  intros fc d c bound.
  split.
  - intros n H. apply living_append_tightens with d c. exact H.
  - apply excluded_monotone.
Qed.
```

## 19. `merkle_leaves_positive`

- Kind: `Theorem`
- Code SHA-256: `e3707abf61fd60ab39414cda6311df45e1ca08238dd52d6e1130fa94565986b4`
- Statement SHA-256: `ff71bfce704e573e00c7de64da3bec3c5665e97a2eadf7fd80059bd07869f09f`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000019_merkle_leaves_positive__e3707abf61fd.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 819–828; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem merkle_leaves_positive : forall (mt : MerkleFold),
  merkle_leaf_count mt >= 1.
Proof.
  intros mt.
  induction mt as [d | l IHl r IHr c].
  - simpl. apply Nat.le_refl.
  - simpl. apply Nat.le_trans with (merkle_leaf_count l).
    + exact IHl.
    + apply Nat.le_add_r.
Qed.
```

## 20. `merkle_tamper_evidence`

- Kind: `Theorem`
- Code SHA-256: `3f66ddfaa675e32402fd2d0ebd144d012417eea2abcad6778323fe5a6f457484`
- Statement SHA-256: `d8b947a44db032e372f241fa19e90b89ea99c06a39b826fe57fc32b81e2d2ec8`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000020_merkle_tamper_evidence__3f66ddfaa675.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 841–855; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem merkle_tamper_evidence :
  forall (d1 d2 d3 : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    d1 n <> d2 n ->
    merkle_eval (MNode (MLeaf d1) (MLeaf d3) c) n <>
    merkle_eval (MNode (MLeaf d2) (MLeaf d3) c) n.
Proof.
  intros d1 d2 d3 c n Hc Hneq.
  simpl.
  unfold constrained_fold.
  rewrite Hc.
  unfold fold.
  apply xorb_preserves_diff.
  exact Hneq.
Qed.
```

## 21. `obs_equiv_not_structural`

- Kind: `Theorem`
- Code SHA-256: `a3a2dc701957963dcbde4c1b281cce73bb3a59c4cd13606875cb8b9bfcff9f7b`
- Statement SHA-256: `04db0bcafcdefece691a85dc07714518ba2a7660e257162ab3b84ea8a11e9846`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000021_obs_equiv_not_structural__a3a2dc701957.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 758–770; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem obs_equiv_not_structural :
  exists fc1 fc2 : FoldChain,
    exists w : nat, obs_equiv_at fc1 fc2 w /\
    chain_length fc1 <> chain_length fc2.
Proof.
  exists (ChainBase null_dist).
  exists (ChainStep (ChainBase null_dist) null_dist (fun _ => true)).
  exists 0.
  split.
  - unfold obs_equiv_at, commitment. simpl.
    unfold constrained_fold, fold, null_dist, xorb. simpl. reflexivity.
  - simpl. intro H. discriminate H.
Qed.
```

## 22. `projection_erases_left_subtree`

- Kind: `Theorem`
- Code SHA-256: `b44b96383e9d9ac0e0c8df1a4b3a98aba54c5f95f04fde6ccf6e598bd75b05c7`
- Statement SHA-256: `76bfe750576c0c0899ed51062d729673dd1159fc603aad0af15e11ef3f809858`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000022_projection_erases_left_subtree__b44b96383e9d.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1665–1679; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem projection_erases_left_subtree :
  forall (L1a L1b L2a L2b L3 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true -> c2 n = true -> cR n = true ->
    L3 n = false ->
    merkle_eval (depth2_tree L1a L2a L3 trivial_dist c1 c2 cR) n =
    merkle_eval (depth2_tree L1b L2b L3 trivial_dist c1 c2 cR) n.
Proof.
  intros L1a L1b L2a L2b L3 c1 c2 cR n Hc1 Hc2 HcR HL3.
  unfold depth2_tree.
  simpl merkle_eval.
  unfold constrained_fold, fold, trivial_dist.
  rewrite Hc1. rewrite Hc2. rewrite HcR.
  rewrite HL3. simpl.
  reflexivity.
Qed.
```

## 23. `right_leaf_controls_passthrough`

- Kind: `Theorem`
- Code SHA-256: `5e3d471c3317c28a67e0fcd613d42635e2d2a220964bcf26c2b7884e9392d948`
- Statement SHA-256: `af52f383a5e9b3c75a6411efeee7ed1df2d3d9c577a5f922f4877d06fdde3d1d`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000023_right_leaf_controls_passthrough__5e3d471c3317.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1516–1524; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem right_leaf_controls_passthrough :
  forall (dL : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf trivial_dist) c) n = dL n.
Proof.
  intros dL c n Hc.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold, trivial_dist. reflexivity.
Qed.
```

## 24. `right_leaf_controls_projection`

- Kind: `Theorem`
- Code SHA-256: `119bf44d935e39467f82824cb3740577629d2e06b7329dcda33b4f913fe5ca40`
- Statement SHA-256: `69e0fb01f500e579959b2eb25cd24f6020a2112cd99a69ede15236d2a8770d07`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000024_right_leaf_controls_projection__119bf44d935e.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1506–1514; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem right_leaf_controls_projection :
  forall (dL : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf null_dist) c) n = true.
Proof.
  intros dL c n Hc.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold, null_dist. reflexivity.
Qed.
```

## 25. `root_depends_on_left_leaf`

- Kind: `Theorem`
- Code SHA-256: `6ecbab7fd7f9c1748848035bf1827fdf5071f24d41c1adc2f9aced129318cc25`
- Statement SHA-256: `a9edaae5eca2a6f86580ed8963872a6d7fbff13902ac66e29f6914480e095c24`
- Occurrences: 15
- Source statuses: `INCOMPLETE` × 15
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000025_root_depends_on_left_leaf__6ecbab7fd7f9.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1487–1496; embedded `proofbundle_2026-05_e0a506894b32d5f2_e0a506894b32d5f2_000141_e0a506894b32_2026_04_11_merklefolddiffusion.v`

```coq
Theorem root_depends_on_left_leaf :
  forall (dL dR : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    dR n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf dR) c) n = dL n.
Proof.
  intros dL dR c n Hc HdR.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold. rewrite HdR. reflexivity.
Qed.
```

## 26. `score_insufficiency`

- Kind: `Theorem`
- Code SHA-256: `b0bfb3fc4865666827d1a19dd2317fb0fa406990f828cb86ce6523538212fbf9`
- Statement SHA-256: `58eb7f445c15d7651e204edb8183d6dbf9318d93c299ee984f99d03071be6fcf`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000026_score_insufficiency__b0bfb3fc4865.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1063–1070; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem score_insufficiency :
  forall s i,
    Certification s i > theta ->
    (~C1 s i \/ ~C2 s i \/ ~C3 s i \/ ~C4 s i \/ ~C5 s i) ->
    ~Attribution s i.
Proof.
  intros. apply conjunctive_blocking. assumption.
Qed.
```

## 27. `spoof_blocking`

- Kind: `Theorem`
- Code SHA-256: `c16a5c210fbf7a64aa86f1c29ca46ff1da6f88eec968f0cacaf1b0288416ab2a`
- Statement SHA-256: `9f30ee4432b16d87d6fcbc87f6f3eade546607e5f5a23b65245ed914497b1caf`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000027_spoof_blocking__c16a5c210fbf.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1090–1100; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem spoof_blocking :
  forall M s i,
    In S spoof_class M ->
    Pr_equiv M s < 1 - gamma ->
    ~C5 M i.
Proof.
  unfold C5, non_spoofable. intros M s i HM Hpr Hcontra.
  destruct Hcontra as [_ Hns].
  specialize (Hns M HM).
  lra. (* Linear real arithmetic solves this *)
Qed.
```

## 28. `threshold_form`

- Kind: `Theorem`
- Code SHA-256: `b50ec5f6a2dc73eb224af6c5e628a0271d65495fb522d3bf8f4880d3f2a022bd`
- Statement SHA-256: `10852ccc9e8f5294d600d33b50f9499fa5b0247e9554fb02e2eee7cabc0be685`
- Occurrences: 1
- Source statuses: `INCOMPLETE` × 1
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000028_threshold_form__b50ec5f6a2dc.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 14636–14652; embedded `proofbundle_2026-05_ba253798317165d1_survival_theorem_existential_repair_20260513.v`

```coq
Theorem threshold_form :
  forall W C : R, forall k : nat,
  W > 0 -> k > 0%nat ->
  W > C / (INR k) ->
  (INR k) * W > C.
Proof.
  intros W C k HW Hk Hthresh.
  (* Multiply both sides of W > C/k by k (positive) *)
  apply Rmult_gt_compat_r with (r := INR k) in Hthresh.
  - (* Left side: k * W; right side: (C/k) * k = C *)
    assert (Hcancel: (C / INR k) * INR k = C).
    { field. apply Rgt_not_eq. apply lt_0_INR. exact Hk. }
    rewrite Hcancel in Hthresh.
    exact Hthresh.
  - (* Show INR k > 0 *)
    apply lt_0_INR. exact Hk.
Qed.
```

## 29. `tighten_monotone`

- Kind: `Theorem`
- Code SHA-256: `1a7ada9f0f7f446cd970ccb5dc02744f1d6511d202d6637a0540d110305cf1a9`
- Statement SHA-256: `7e0f1f0ef4b99ab86ca12a2585986793eb66cb89b0a82d1439ecb2960632b14b`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000029_tighten_monotone__1a7ada9f0f7f.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 628–635; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem tighten_monotone : forall (c1 c2 : Constraint) (n : nat),
  tighten c1 c2 n = true -> c1 n = true /\ c2 n = true.
Proof.
  intros c1 c2 n H.
  unfold tighten in H.
  apply andb_true_iff in H.
  exact H.
Qed.
```

## 30. `tighten_no_expand`

- Kind: `Theorem`
- Code SHA-256: `d69d2d71c9be1ca891f4ab44ee55d97b932b8297c0d4622b797dc8f1c386164c`
- Statement SHA-256: `d2e629b7570939fff1ea46c74b839445c0ff143a211b120c4a509fc92a3ea36f`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000030_tighten_no_expand__d69d2d71c9be.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 638–646; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem tighten_no_expand : forall (c1 c2 : Constraint) (n : nat),
  c1 n = false -> tighten c1 c2 n = false.
Proof.
  intros c1 c2 n H.
  unfold tighten.
  rewrite H.
  simpl.
  reflexivity.
Qed.
```

## 31. `trivial_has_collision`

- Kind: `Theorem`
- Code SHA-256: `0e8d4f0873863207893f6a531f4733584ed63610a64b4325e618ef6699f99eab`
- Statement SHA-256: `74966c4510303685fa08ffc6ab31bc4ae769d3c396e37e4018a585857f231cdf`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000031_trivial_has_collision__0e8d4f087386.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 736–745; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Theorem trivial_has_collision : forall bound : nat,
  1 < bound -> has_collision trivial_dist bound.
Proof.
  intros bound Hlt.
  exists 0, 1.
  split. { apply Nat.lt_trans with 1. apply Nat.lt_0_1. exact Hlt. }
  split. { exact Hlt. }
  split. { intro Heq. discriminate Heq. }
  unfold trivial_dist. reflexivity.
Qed.
```

## 32. `witness_existence`

- Kind: `Theorem`
- Code SHA-256: `4736f08fb3d060646895262395f1b4c753bf8e14648f1ad3dd0a072c614e4135`
- Statement SHA-256: `694a1cd5d226c8944ed7692f8317e51ceabab06e4ee260f7f003c1524eacd44c`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000032_witness_existence__4736f08fb3d0.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1120–1127; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem witness_existence :
  forall s i,
    C2 s i ->
    exists a : A, predictive_info s a i > eta.
Proof.
  unfold C2. intros s i [a [tau [_ [Hpred _]]]].
  exists a. assumption.
Qed.
```

## 33. `witness_family_closure`

- Kind: `Theorem`
- Code SHA-256: `3239361fff6274e6e4054d1404382802732aa20ce573fe3498a5a4a01ad1cd21`
- Statement SHA-256: `e7f36f8a21688b4d7220bae6d11e4104cc17e53e99bf3d7066bf65e3c5785308`
- Occurrences: 40
- Source statuses: `INCOMPLETE` × 40
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000033_witness_family_closure__3239361fff62.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 1130–1137; embedded `proofbundle_2026-05_8bdeae4ed70f2c12_8bdeae4ed70f2c12_000185_8bdeae4ed70f_expanded_coq.v`

```coq
Theorem witness_family_closure :
  forall s i a1 a2,
    predictive_info s a1 i > eta ->
    predictive_info s a2 i > eta ->
    exists a3, predictive_info s a3 i > eta.
Proof.
  intros. exists a1. assumption. (* Trivial - needs refinement *)
Qed.
```

## 34. `xorb_preserves_diff`

- Kind: `Lemma`
- Code SHA-256: `3eb54cbc6f4dace407338be209be6bc92e18368f440fc10e01898745e43268e3`
- Statement SHA-256: `969945b4e46d10dc93396247ec1a9316e92b3a4d00752d72d7673835410f6016`
- Occurrences: 6
- Source statuses: `INCOMPLETE` × 6
- Extracted code file: `proof_code/closed_in_incomplete_source/coq/000034_xorb_preserves_diff__3eb54cbc6f4d.v`
- Primary provenance: `16-concat_ALL_v_incomplete_138_files.v` lines 832–839; embedded `proofbundle_2026-05_6fa2e841e6d52ac3_6fa2e841e6d52ac3_6fa2e841e6d52ac3_2026_04_11_distinctioncrypto.v`

```coq
Lemma xorb_preserves_diff : forall a b c : bool,
  a <> b -> xorb a c <> xorb b c.
Proof.
  intros a b c Hneq.
  destruct a, b, c; simpl;
    try (intro H; discriminate H);
    try (exfalso; apply Hneq; reflexivity).
Qed.
```



---

# Coq proof code — completed

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `adversarial_sufficiency_nontrivial`

- Kind: `Theorem`
- Code SHA-256: `94c07aa496e1ddcfff1ffe9b07e061b696b3ca9af3974c3fa8b401cc1726c6ef`
- Statement SHA-256: `2d7a1d3736fde71a562199d43004ae04efd68dfbd3bdd00482258d2235b05c3f`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000001_adversarial_sufficiency_nontrivial__94c07aa496e1.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 205–223; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem adversarial_sufficiency_nontrivial :
  forall S I,
    AdversarialSufficiency S I ->
    exists M1 M2 M3 M4 M5 : ComparisonModel,
      ~matches_on M1 S I C1 /\
      ~matches_on M2 S I C2 /\
      ~matches_on M3 S I C3 /\
      ~matches_on M4 S I C4 /\
      ~matches_on M5 S I C5.
Proof.
  intros S I [H1 [H2 [H3 [H4 H5]]]].
  destruct H1 as [M1 [_ [_ [_ [_ Hn1]]]]].
  destruct H2 as [M2 [_ [_ [_ [_ Hn2]]]]].
  destruct H3 as [M3 [_ [_ [_ [_ Hn3]]]]].
  destruct H4 as [M4 [_ [_ [_ [_ Hn4]]]]].
  destruct H5 as [M5 [_ [_ [_ [_ Hn5]]]]].
  exists M1, M2, M3, M4, M5.
  auto.
Qed.
```

## 2. `alignment_max`

- Kind: `Theorem`
- Code SHA-256: `26d06cb1225fe82ffe108e27eb22562bcd69fb37d8b71c99f2f39a58bc2bb833`
- Statement SHA-256: `0eb5af1bcbec3a5a42e4e8841f1c466733594a0af1d49e03b91ed28b21cdd002`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000002_alignment_max__26d06cb1225f.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 516–521; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem alignment_max : forall s s',
  alignment_score s s' <= 3.
Proof.
  intros s s'. unfold alignment_score.
  destruct (Z.leb _ _); destruct (list_beq _ _); destruct (Nat.leb _ _); lia.
Qed.
```

## 3. `alignment_max`

- Kind: `Theorem`
- Code SHA-256: `386aca09539089affd0a44d5704f1dec3e92ff8ffe1886cacc95e31c2fc046bb`
- Statement SHA-256: `9b47dd3342a706881a9035b7d704d18ddb225150837fadc915fc9c0785c0e7eb`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000003_alignment_max__386aca095390.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 844–848; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem alignment_max : forall s s', alignment_score s s' <= 3.
Proof.
  intros. unfold alignment_score.
  destruct (Z.leb _ _); destruct (list_beq _ _); destruct (Nat.leb _ _); lia.
Qed.
```

## 4. `all_ops8_length`

- Kind: `Lemma`
- Code SHA-256: `84e2c6f6190e8bab647084f57d7c014707c8cc8fe37defc6d6c035ad4e6910bd`
- Statement SHA-256: `e1a0926e6ed8b8899e286ba61404c911a8f8b9da337a21870ccb453f34c8e182`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000004_all_ops8_length__84e2c6f6190e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5080–5081; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma all_ops8_length : length all_ops8 = 8.
Proof. reflexivity. Qed.
```

## 5. `all_roots_length`

- Kind: `Lemma`
- Code SHA-256: `8fdc3cd279ca34c43d1b4e645d3a30a5522aba157cfed7783fdeaa38a1697d26`
- Statement SHA-256: `2cf200feb61867e637dc10b96f6231ade6172206c22ffdfba4f353811c06996b`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000005_all_roots_length__8fdc3cd279ca.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5077–5078; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma all_roots_length : length all_roots = 46.
Proof. reflexivity. Qed.
```

## 6. `allRootIds_length`

- Kind: `Theorem`
- Code SHA-256: `e7d12ceae3be00cdf8447ec9be9bc73af378164c7a0ebc1f50b84f469c9285ca`
- Statement SHA-256: `731bd5b9877e3eb9412c6ba11ebd252c0e92c802f9c7c8f7f08e0c5127f06894`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000006_allRootIds_length__e7d12ceae3be.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2192–2193; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem allRootIds_length : length allRootIds = 154.
Proof. reflexivity. Qed.
```

## 7. `apply_chain_app`

- Kind: `Lemma`
- Code SHA-256: `5023bb1792c44664c2a0755d37220458136f6d778c617e2fddd49c1e1ff0689c`
- Statement SHA-256: `a1635390ae821b12712d2983c1f96b40bc85ac83be8b9508193e5999dbebdaca`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000007_apply_chain_app__5023bb1792c4.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1279–1292; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma apply_chain_app :
  forall ops₁ ops₂ s s',
    apply_chain (ops₁ ++ ops₂) s = Some s' →
    exists s_mid,
      apply_chain ops₁ s = Some s_mid /\ apply_chain ops₂ s_mid = Some s'.
Proof.
  induction ops₁ as [|o ops₁ IH]; intros ops₂ s s' H.
  - exists s. simpl in H. split; [reflexivity|assumption].
  - simpl in H.
    destruct (concrete_apply o s) as [s₁|] eqn:Ho; [|discriminate].
    specialize (IH ops₂ s₁ s' H).
    destruct IH as [s_mid [Hmid1 Hmid2]].
    exists s_mid. split; [simpl; rewrite Ho; assumption|assumption].
Qed.
```

## 8. `apply_chain_app`

- Kind: `Lemma`
- Code SHA-256: `d2d44a5a9d26170576b1bbb703bdc68f70fa8c0c8172854566702b6e5df136ba`
- Statement SHA-256: `d574e286656f36d8731ee9fd4c2019e7a3543dfe0eacbd4e4daef5ab219beac8`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000008_apply_chain_app__d2d44a5a9d26.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 428–438; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma apply_chain_app : forall (c1 c2 : op_chain) (s s1 s' : state),
  apply_chain c1 s = Some s1 ->
  apply_chain c2 s1 = Some s' ->
  apply_chain (c1 ++ c2) s = Some s'.
Proof.
  induction c1 as [|o rest IH]; intros c2 s s1 s' H1 H2.
  - simpl in H1. inversion H1. subst. simpl. exact H2.
  - simpl in H1. simpl.
    destruct (concrete_apply o s) as [sm|] eqn:E; [|discriminate].
    eapply IH; [exact H1|exact H2].
Qed.
```

## 9. `apply_chain_preserves_validity`

- Kind: `Lemma`
- Code SHA-256: `fe4299ec950100370a15aa54f2e0d4796b8f298e7ddc18bd752247c6cfe1d92c`
- Statement SHA-256: `207ad44b9b04d6c1cc3ebaff71b13de4466aeebd0d077e19bc8f7e00ecb63ec9`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000009_apply_chain_preserves_validity__fe4299ec9501.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 701–710; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma apply_chain_preserves_validity : forall (chain : op_chain) s s',
  state_valid s -> apply_chain chain s = Some s' -> state_valid s'.
Proof.
  induction chain as [|o rest IH]; intros s s' Hv Happ.
  - simpl in Happ. inversion Happ. subst. exact Hv.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hv1 : state_valid s1) by (eapply concrete_apply_closure_step; eauto).
    eapply IH; eauto.
Qed.
```

## 10. `apply_chain_total`

- Kind: `Theorem`
- Code SHA-256: `5dee346954efd27dc8d6f2550ce04be9e88743a68c82cf0140900cb226d1d5c9`
- Statement SHA-256: `481bd01a1f15c4b7448f78e074c4a0c5d8f4a4fdb01d213f96f0aa8e03706f97`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000010_apply_chain_total__5dee346954ef.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1126–1137; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem apply_chain_total : forall chain s,
  chain_admissible chain s ->
  exists s', apply_chain chain s = Some s'.
Proof.
  induction chain as [|o rest IH]; intros s Hadm.
  - simpl. exists s. reflexivity.
  - simpl in Hadm. destruct Hadm as [Hadm_o Hadm_rest].
    destruct (concrete_apply_total o s Hadm_o) as [s1 Hs1].
    specialize (Hadm_rest s1 Hs1).
    destruct (IH s1 Hadm_rest) as [s' Hs'].
    simpl. rewrite Hs1. exists s'. exact Hs'.
Qed.
```

## 11. `architecture_exclusion_schema`

- Kind: `Theorem`
- Code SHA-256: `25f94c5524e63dc8c09339a838d5e93ee4271b115a09d0be00735c6005ac10d6`
- Statement SHA-256: `fade7f26872a640324166fb6445c076f7ff7447f6fb636a0c8d8a0d3d84f07bb`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000011_architecture_exclusion_schema__25f94c5524e6.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 107–124; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem architecture_exclusion_schema :
  forall (Arch : System -> Prop) (j : nat)
    (blocks : forall S I, Arch S ->
      match j with
      | 0 => ~C1 S I | 1 => ~C2 S I | 2 => ~C3 S I
      | 3 => ~C4 S I | _ => ~C5 S I
      end),
    forall S I, Arch S -> ~Attribution S I.
Proof.
  intros Arch j blocks S I Harch Hattr.
  destruct Hattr as [H1 [H2 [H3 [H4 H5]]]].
  pose proof (blocks S I Harch) as Hneg.
  destruct j; [exact (Hneg H1) |
  destruct j; [exact (Hneg H2) |
  destruct j; [exact (Hneg H3) |
  destruct j; [exact (Hneg H4) |
  exact (Hneg H5)]]]].
Qed.
```

## 12. `atom_always_definite`

- Kind: `Theorem`
- Code SHA-256: `34c0f78f467c8627c3b0dba9cb87856369559c2c1290f42645fad9f41e2d4ad2`
- Statement SHA-256: `ebe7d45d8c20c0888d4686a76345063aa400c7a370343edadd4152322acc64d4`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000012_atom_always_definite__34c0f78f467c.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 925–929; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem atom_always_definite :
  forall ctx a, eval_pred 1 ctx (BAtomP a) = Some (eval_atom ctx a).
Proof.
  intros. simpl. reflexivity.
Qed.
```

## 13. `attr_implies_drop12`

- Kind: `Theorem`
- Code SHA-256: `2a5c2a86d10d7caf766b8d213542ce0bf49d4591bbd343bed93721751ad66589`
- Statement SHA-256: `80190b9fbb4f6988f2d454df745ff74a055323d749f83f4550aa3585ac31160d`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000013_attr_implies_drop12__2a5c2a86d10d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 137–141; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem attr_implies_drop12 :
  forall S I, Attribution S I -> Drop12 S I.
Proof.
  intros S I [_ [_ [H3 [H4 H5]]]]. unfold Drop12. auto.
Qed.
```

## 14. `attr_implies_drop123`

- Kind: `Theorem`
- Code SHA-256: `0619e0d1497a44397f76c01a89f404f50735137836ddb20f592f74ba0e47d852`
- Statement SHA-256: `7712a32a30be6aa29b2e862f708108b473119c09ea2f2c37b292d5c05b3c24bd`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000014_attr_implies_drop123__0619e0d1497a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 143–147; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem attr_implies_drop123 :
  forall S I, Attribution S I -> Drop123 S I.
Proof.
  intros S I [_ [_ [_ [H4 H5]]]]. unfold Drop123. auto.
Qed.
```

## 15. `attribution_implies_c1`

- Kind: `Theorem`
- Code SHA-256: `cfc9d34434b9dbb7154685a53537925c4b3c2fcb355191cc166ed8fa45128109`
- Statement SHA-256: `8802b892dd7c321477e7c00e132d95827a8877d77c238a400d1650b279865058`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000015_attribution_implies_c1__cfc9d34434b9.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2676–2677; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_c1 : forall S I, Attribution S I -> C1 S I.
Proof. intros S I H. exact (proj1 H). Qed.
```

## 16. `attribution_implies_c2`

- Kind: `Theorem`
- Code SHA-256: `80f3b21fa21d287aec5832f4c2d108d0e4a597b2daaba2d24db08e69d459513a`
- Statement SHA-256: `e0f727a0cd18f07c4b3ed42475517624880060b7080afbb851d401fe21642fc8`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000016_attribution_implies_c2__80f3b21fa21d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2679–2680; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_c2 : forall S I, Attribution S I -> C2 S I.
Proof. intros S I H. exact (proj1 (proj2 H)). Qed.
```

## 17. `attribution_implies_c3`

- Kind: `Theorem`
- Code SHA-256: `0785ac75d39d538d3606419651c0d35bac25000b51b84a509247cd88719db0f9`
- Statement SHA-256: `b4aa7b71bbd3137b5c1f218f0d4d45af9b97ca11af23893019aecffc06fc4206`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000017_attribution_implies_c3__0785ac75d39d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2682–2683; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_c3 : forall S I, Attribution S I -> C3 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 H))). Qed.
```

## 18. `attribution_implies_c4`

- Kind: `Theorem`
- Code SHA-256: `3d1862a6b5ce0114c4d3cc839605068d20d054c51b0fedf47c9f2da59c4a11a4`
- Statement SHA-256: `5a2b4d73fc2f3899afccf0732add7e9b4f1920d2fe77775fbcde4a363438a4de`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000018_attribution_implies_c4__3d1862a6b5ce.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2685–2686; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_c4 : forall S I, Attribution S I -> C4 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 (proj2 H)))). Qed.
```

## 19. `attribution_implies_c5`

- Kind: `Theorem`
- Code SHA-256: `670c9326fb2594f2c4a50aa0ce1168edb3ada4d12b025fe270ecdecbfdddbd6f`
- Statement SHA-256: `0769f9853a3474c29454c0dd7c0b35ee754c5a96affa6e26f4e1c4298e3f5754`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000019_attribution_implies_c5__670c9326fb25.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2688–2689; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_c5 : forall S I, Attribution S I -> C5 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 (proj2 (proj2 H))))). Qed.
```

## 20. `attribution_implies_cert`

- Kind: `Theorem`
- Code SHA-256: `169b766eed3e25a245a46a7edf8a809f3b10878888dd62c96c7644d1425911a1`
- Statement SHA-256: `52dc9d213311f657df455fcb35fff31c61807b0b1a03b0e4e6746c6d213b18a0`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000020_attribution_implies_cert__169b766eed3e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2691–2692; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem attribution_implies_cert : forall S I, Attribution S I -> CertAboveTheta S I.
Proof. intros S I H. exact (proj2 (proj2 (proj2 (proj2 (proj2 H))))). Qed.
```

## 21. `bad_prim_invalid`

- Kind: `Lemma`
- Code SHA-256: `1f588c8bb24e3995a89f42a76443ed00b80b0c7ab131b8c896a078cdbf6f0b3f`
- Statement SHA-256: `166f4d52be2cc19fb228166fcd647ab028245bbc788f4c8c3d70f4963f18c080`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000021_bad_prim_invalid__1f588c8bb24e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1248–1249; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma bad_prim_invalid : ~ prim_valid bad_prim.
Proof. unfold prim_valid, bad_prim. simpl. lia. Qed.
```

## 22. `bad_state_in_manifold`

- Kind: `Lemma`
- Code SHA-256: `aaf874c07dfa6ff4074b3040e6ccbd8ed6889695fb9d171f8c4d018f9dff0591`
- Statement SHA-256: `bbab1e9838e44b0cafab52f11883abe3fae9bbffeff450eb2b97d1fdfd8c89de`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000022_bad_state_in_manifold__aaf874c07dfa.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1258–1263; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma bad_state_in_manifold :
  in_possibility_manifold_original bad_state bad_state [].
Proof.
  unfold in_possibility_manifold_original.
  split; [apply bad_state_reachable | apply bad_state_positive_coh].
Qed.
```

## 23. `bad_state_invalid`

- Kind: `Lemma`
- Code SHA-256: `449aacf0d2fe8e8052443971cdb6d0ca92fc5ba7103763d307fbdefd5b209ab1`
- Statement SHA-256: `0d992021bc7ae60cf966acda726fdeb49593f3a6fcc3064bcdc4613317fb8029`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000023_bad_state_invalid__449aacf0d2fe.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1265–1269; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma bad_state_invalid : ~ state_valid bad_state.
Proof.
  unfold state_valid, bad_state. simpl. intros [_ Hforall].
  inversion Hforall as [|? ? Hp _]. apply bad_prim_invalid. exact Hp.
Qed.
```

## 24. `bad_state_positive_coh`

- Kind: `Lemma`
- Code SHA-256: `734d9b6c04ecfd0942d31a307654edb2e649aec6194f68d5665bf0a3d8df2587`
- Statement SHA-256: `18ee91afeca3e92d42642fd8a5beb5c594ffdb4f70434d8a407d721ca6b0da2d`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000024_bad_state_positive_coh__734d9b6c04ec.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1255–1256; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma bad_state_positive_coh : coh_budget bad_state > 0.
Proof. unfold bad_state. simpl. lia. Qed.
```

## 25. `bad_state_reachable`

- Kind: `Lemma`
- Code SHA-256: `a38c2febd1cf8825a097c30f6a46227d531d5b11d94e5b9f30f5c8584050703b`
- Statement SHA-256: `3858bd5528d3f90c0d842e6b99d67134b5544614afdf48d644e6e41cfc29de8d`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000025_bad_state_reachable__a38c2febd1cf.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1251–1253; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma bad_state_reachable :
  apply_chain [] bad_state = Some bad_state.
Proof. reflexivity. Qed.
```

## 26. `boundary_implies_integrity`

- Kind: `Theorem`
- Code SHA-256: `303d601c05001a3dd47c8491d0beb764bfccc3f8e6d115cbeda0d6a5f35c7fef`
- Statement SHA-256: `4354a4ede84395f7d6b862d2d5941451c21f9b9f293335977fa3043d0f85a6b0`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000026_boundary_implies_integrity__303d601c0500.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 650–654; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem boundary_implies_integrity :
  forall s, passes_boundary s -> passes_integrity s.
Proof.
  intros s [Hi Hb]. unfold passes_integrity. exact Hi.
Qed.
```

## 27. `boundary_not_implies_lineage`

- Kind: `Theorem`
- Code SHA-256: `37d7eebadc77b4cebc3f1699999509c4487f3691e087437268eeb3a0a89b4dff`
- Statement SHA-256: `c6e005d22947f8bde11cacb3a07f1bcbb6de1789223ecee5f2f233e2576a7e50`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000027_boundary_not_implies_lineage__37d7eebadc77.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 674–679; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem boundary_not_implies_lineage :
  (exists s, passes_boundary s /\ ~passes_lineage s) ->
  ~(forall s, passes_boundary s -> passes_lineage s).
Proof.
  intros [s [Hb Hnl]] Hall. apply Hnl. apply Hall. exact Hb.
Qed.
```

## 28. `BP_01_identity_preserves_artifact_uid`

- Kind: `Theorem`
- Code SHA-256: `2a6bed4d566d3e10cc209e3587c6846eee8cede1a29972c9204a899ace7e6fa6`
- Statement SHA-256: `6c8838eaaa2ab12dec95000b5910ed46cc7479ced31204297436dabd3e18ed84`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000028_BP_01_identity_preserves_artifact_uid__2a6bed4d566d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2545–2556; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_01_identity_preserves_artifact_uid :
  forall inv : OperatorInvocation,
    BP_01_identity inv ->
    match inv.inputs with
    | [] => False
    | (a :: _) => a.uid = inv.output.uid
    end.
Proof.
  intro inv H.
  unfold BP_01_identity in H.
  exact (snd H).
Qed.
```

## 29. `BP_02_passthrough_preserves_content_hash`

- Kind: `Theorem`
- Code SHA-256: `9bcf62b220e14827fbe43ccb41164080f286304dc1d6fac4abc96b5f2424c4c3`
- Statement SHA-256: `b35dfe8323f48051d2e755361ec121cb96c31577cc44ac5ceecfa97491624e80`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000029_BP_02_passthrough_preserves_content_hash__9bcf62b220e1.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2573–2584; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_02_passthrough_preserves_content_hash :
  forall inv : OperatorInvocation,
    BP_02_passthrough inv ->
    match inv.inputs with
    | [] => False
    | (a :: _) => a.content_hash = inv.output.content_hash
    end.
Proof.
  intro inv H.
  unfold BP_02_passthrough in H.
  exact (snd H).
Qed.
```

## 30. `BP_03_hash_produces_distinct_hash`

- Kind: `Theorem`
- Code SHA-256: `a96216d7d31d44ac26ac50bca79ac430734a7d605b1bd0b7c080df954d58d3e6`
- Statement SHA-256: `56053ec3bd5171548fc3e749388131d6fb628327b426a48df879f8cdd68eff80`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000030_BP_03_hash_produces_distinct_hash__a96216d7d31d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2601–2612; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_03_hash_produces_distinct_hash :
  forall inv : OperatorInvocation,
    BP_03_hash inv ->
    match inv.inputs with
    | [] => False
    | (a :: _) => a.content_hash <> inv.output.content_hash
    end.
Proof.
  intro inv H.
  unfold BP_03_hash in H.
  exact (snd H).
Qed.
```

## 31. `BP_04_merge_requires_multiple_inputs`

- Kind: `Theorem`
- Code SHA-256: `9acfdedc9b77e254922091cda31453e02fcd2140021a923307f351d024e771fb`
- Statement SHA-256: `01c834f7c2018256ae6bfb2e6b4e5662ec60cf0e529111e7dff37d199e42b28d`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000031_BP_04_merge_requires_multiple_inputs__9acfdedc9b77.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2625–2633; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_04_merge_requires_multiple_inputs :
  forall inv : OperatorInvocation,
    BP_04_merge inv ->
    length inv.inputs >= 2.
Proof.
  intro inv H.
  unfold BP_04_merge in H.
  exact H.
Qed.
```

## 32. `BP_05_split_single_input`

- Kind: `Theorem`
- Code SHA-256: `64b3eba4d06b4be2f770392192ea51cdffa9c0681c21914f0c77de3957a0df21`
- Statement SHA-256: `cf8f2f0157355863608d37255fe2602efb366504694796012b8ceacd15599dd5`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000032_BP_05_split_single_input__64b3eba4d06b.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2646–2654; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_05_split_single_input :
  forall inv : OperatorInvocation,
    BP_05_split inv ->
    length inv.inputs = 1.
Proof.
  intro inv H.
  unfold BP_05_split in H.
  exact H.
Qed.
```

## 33. `BP_07_transform_coherence_monotone`

- Kind: `Theorem`
- Code SHA-256: `0a38e03a920edf80cb11d591b45e067f034732317009db13691a267f7a84b1c0`
- Statement SHA-256: `837c5616438a78784aa2c7eee4032318548cca6f8687bffb733a2fa937f27aff`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000033_BP_07_transform_coherence_monotone__0a38e03a920e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2671–2682; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_07_transform_coherence_monotone :
  forall inv : OperatorInvocation,
    BP_07_transform inv ->
    match inv.inputs with
    | [] => False
    | (a :: _) => inv.output.coh_budget <= a.coh_budget
    end.
Proof.
  intro inv H.
  unfold BP_07_transform in H.
  exact (snd H).
Qed.
```

## 34. `BP_08_remediate_requires_inputs`

- Kind: `Theorem`
- Code SHA-256: `b4c99080ba285676090c4e94904d96820801667ab474b391a0a10f367ad35c88`
- Statement SHA-256: `a84924b658cc9081a4de2a33554b0cfde93d478d8730137918660d4119633d05`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000034_BP_08_remediate_requires_inputs__b4c99080ba28.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2695–2703; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_08_remediate_requires_inputs :
  forall inv : OperatorInvocation,
    BP_08_remediate inv ->
    length inv.inputs >= 1.
Proof.
  intro inv H.
  unfold BP_08_remediate in H.
  exact H.
Qed.
```

## 35. `BP_14_deploy_single_input`

- Kind: `Theorem`
- Code SHA-256: `78c94725248e15e042b68f96edd42c6feb8c68c3bff249623ead154a29f324c7`
- Statement SHA-256: `0b685afbeee7aaa25db1511e01ea37faf6931941185a5496a52190d46b79f431`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000035_BP_14_deploy_single_input__78c94725248e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2716–2724; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_14_deploy_single_input :
  forall inv : OperatorInvocation,
    BP_14_deploy inv ->
    length inv.inputs = 1.
Proof.
  intro inv H.
  unfold BP_14_deploy in H.
  exact H.
Qed.
```

## 36. `BP_15_certify_single_input`

- Kind: `Theorem`
- Code SHA-256: `6fcb094d2c94155b1822b56eea101e5185bce9802509a41e9e3c1e47aa72d077`
- Statement SHA-256: `3a4d17637cbde742d1e43537bf775455f17ec7b0095475ebf768d3cd998fb0fd`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000036_BP_15_certify_single_input__6fcb094d2c94.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2737–2745; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_15_certify_single_input :
  forall inv : OperatorInvocation,
    BP_15_certify inv ->
    length inv.inputs = 1.
Proof.
  intro inv H.
  unfold BP_15_certify in H.
  exact H.
Qed.
```

## 37. `BP_19_record_single_input`

- Kind: `Theorem`
- Code SHA-256: `288a50f62fbbd46514c2ee80eb987583f751338a4ab8516130af49a4445fc353`
- Statement SHA-256: `873fee84c3abf99070359fb1a6fe5d6e0654d83e91667df8224a6eb08d3fdfec`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000037_BP_19_record_single_input__288a50f62fbb.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2758–2766; embedded `proofbundle_2026-05_4538c4633faa2294_4538c4633faa2294_000218_4538c4633faa_operatorboundarypredicates.v`

```coq
Theorem BP_19_record_single_input :
  forall inv : OperatorInvocation,
    BP_19_record inv ->
    length inv.inputs = 1.
Proof.
  intro inv H.
  unfold BP_19_record in H.
  exact H.
Qed.
```

## 38. `cached_not_attributed`

- Kind: `Theorem`
- Code SHA-256: `684bc362e42ecc6c920d97ae11c12c33eabffb883b6bf2bd4830f83fad315975`
- Statement SHA-256: `caa8653bfc1f4f6633132abdfd9b0ff97aeef12b85d521d76ee0d629af01b8e4`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000038_cached_not_attributed__684bc362e42e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 72–78; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem cached_not_attributed :
  forall S I, is_cached_response S -> ~Attribution S I.
Proof.
  intros S I Hcr Hattr.
  destruct Hattr as [_ [_ [H3 _]]].
  exact (cached_fails_C3 S I Hcr H3).
Qed.
```

## 39. `canon_bool`

- Kind: `Theorem`
- Code SHA-256: `5c20aee0d108548815f3aa19d9099713e9c067f2a6becd4ebf482ef544b7b9a4`
- Statement SHA-256: `baa079b41544c701e6ffe3ebc3092c3cbaf9bc7efacb4b0191f954dfb2bc6b5a`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000039_canon_bool__5c20aee0d108.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 346–347; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem canon_bool : forall b, canonicalize (JBool b) = JBool b.
Proof. intros. simpl. reflexivity. Qed.
```

## 40. `canon_deterministic`

- Kind: `Theorem`
- Code SHA-256: `22efea98ea7d70365d52a800818b09aaf4be26a3a4da7ce417cf0afe2eb04bce`
- Statement SHA-256: `229c18e2bc0f1a6ace4e4ae188298879fd43fb9cab197a96269b6a7c431af450`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000040_canon_deterministic__22efea98ea7d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 319–321; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem canon_deterministic : forall j : JSON,
  canonicalize j = canonicalize j.
Proof. intros. reflexivity. Qed.
```

## 41. `canon_null`

- Kind: `Theorem`
- Code SHA-256: `a2131cc454ed0a137a852f46225e2b6f22f050594b71aca9319dc88f19942b93`
- Statement SHA-256: `5d931ad238cadb5a0d09856bda10dcf3bf72d3f694004d999f1628e24f9e8477`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000041_canon_null__a2131cc454ed.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 343–344; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem canon_null : canonicalize JNull = JNull.
Proof. simpl. reflexivity. Qed.
```

## 42. `canon_num`

- Kind: `Theorem`
- Code SHA-256: `6720805d982a734f821545488b6cf8f524fedc990ef513641e01a48a13f282b4`
- Statement SHA-256: `f174d26eaafe4a38715a00203dfe69017acae7a734b939ce911f6cd27e61a426`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000042_canon_num__6720805d982a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 349–350; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem canon_num : forall n, canonicalize (JNum n) = JNum n.
Proof. intros. simpl. reflexivity. Qed.
```

## 43. `canon_str`

- Kind: `Theorem`
- Code SHA-256: `ea9b14015ba7f533f99c2a6a5d02e235a418900f35e3e1748387bd3d2f8b0f47`
- Statement SHA-256: `efaa9cb95c6d2c3fef47f144ffb639b2b40a9d44bab3bffb168da67ed48609ae`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000043_canon_str__ea9b14015ba7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 352–353; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem canon_str : forall s, canonicalize (JStr s) = JStr s.
Proof. intros. simpl. reflexivity. Qed.
```

## 44. `caveat_count_nonneg`

- Kind: `Lemma`
- Code SHA-256: `31375659cbb3702f4d325cffba2573db4caab1463dfd49b56e4c052fd3b2a9da`
- Statement SHA-256: `52fcb729d156e4165ee44966aa03b4e08267a08b9031c18d575077fe01259dfb`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000044_caveat_count_nonneg__31375659cbb3.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3898–3902; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma caveat_count_nonneg :
  forall (R : Registry) (i : nat), caveat_count R i >= 0.
Proof.
  intros. unfold caveat_count. lia.
Qed.
```

## 45. `chain_bounded`

- Kind: `Theorem`
- Code SHA-256: `c86213ddebecb91ab7fa751918f2aaa0653953bfd7eda44f05e61f447bc709b2`
- Statement SHA-256: `22340f078017e632a906af76ff2652cdd19c8a06c18b183ee588bd4389995033`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000045_chain_bounded__c86213ddebec.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 414–425; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem chain_bounded : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  st_step s' = (st_step s + length chain)%nat.
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. inversion Happ. simpl. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    apply concrete_apply_step_succ in E.
    specialize (IH s1 s' Happ).
    simpl length. lia.
Qed.
```

## 46. `chain_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `e3c204e8a5f92b0a679d5184e624edb30c193918e91f9a155a4b5e36241f0ffc`
- Statement SHA-256: `07a90c4dff08b4337669577e15515d1c7be8a58986647f1ef1684167783ea673`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000046_chain_coh_bound__e3c204e8a5f9.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 382–398; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem chain_coh_bound : forall (chain : op_chain) (s s' : state),
  state_valid s ->
  apply_chain chain s = Some s' ->
  coh_budget s' >= coh_budget s - Z.of_nat (length chain) * concrete_eps.
Proof.
  induction chain as [|o rest IH]; intros s s' Hv Happ.
  - simpl in Happ. inversion Happ. subst. simpl. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hv1 : state_valid s1) by (eapply concrete_apply_closure_step; eauto).
    assert (Hc1 : coh_budget s1 >= coh_budget s - concrete_eps)
      by (eapply concrete_apply_coh_bound_step; eauto).
    specialize (IH s1 s' Hv1 Happ).
    simpl length.
    replace (Z.of_nat (S (length rest))) with (Z.of_nat (length rest) + 1) by lia.
    unfold concrete_eps in *. lia.
Qed.
```

## 47. `chain_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `d33060d6da0a18a89d3205a12843b7733dd82e9689afc2e9be595176e18ee1df`
- Statement SHA-256: `cd73b941abb2b5175325b3fdde4296a57bc7b95848c1b71bba7b66489924d686`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000047_chain_id_preservation__d33060d6da0a.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 401–411; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem chain_id_preservation : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. inversion Happ. reflexivity.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    rewrite (IH s1 s' Happ).
    rewrite (concrete_apply_prims o s s1 E). reflexivity.
Qed.
```

## 48. `chain_lineage_monotone`

- Kind: `Theorem`
- Code SHA-256: `bae210e275775700fc53949339a2d87655779ac82d374c0e59423757ef7fc6ea`
- Statement SHA-256: `0e08425a8f0228c129b256b0fa81462b74564bc2acb1e89d9e1a20c7d5eef848`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000048_chain_lineage_monotone__bae210e27577.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 247–258; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem chain_lineage_monotone : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. injection Happ as <-. exists []. rewrite app_nil_r. reflexivity.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    destruct (lineage_monotone o s s1 E1) as [suf1 Hsuf1].
    destruct (IH s1 s' Happ) as [suf2 Hsuf2].
    exists (suf1 ++ suf2). rewrite Hsuf2, Hsuf1. rewrite app_assoc. reflexivity.
Qed.
```

## 49. `chain_lineage_monotone`

- Kind: `Theorem`
- Code SHA-256: `f25e2e94ec8a8a02cac25fe2cd0eb7a2cee49b1f8c3c355f6d694e819ac017f6`
- Statement SHA-256: `0e08425a8f0228c129b256b0fa81462b74564bc2acb1e89d9e1a20c7d5eef848`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000049_chain_lineage_monotone__f25e2e94ec8a.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 592–603; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem chain_lineage_monotone : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. inversion Happ. exists []. rewrite app_nil_r. reflexivity.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    destruct (lineage_monotone o s s1 E1) as [suf1 Hsuf1].
    destruct (IH s1 s' Happ)             as [suf2 Hsuf2].
    exists (suf1 ++ suf2). rewrite Hsuf2, Hsuf1, app_assoc. reflexivity.
Qed.
```

## 50. `coh_bound_transitive`

- Kind: `Lemma`
- Code SHA-256: `4ac9ef69854362a7e5050b172d89d03c844bfa46fb42afc25b0b51cf2d2f6571`
- Statement SHA-256: `60527dcf5e72f8ef0363cca792e8cbfbb10129a5d250d21fd1645afcb38713f5`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000050_coh_bound_transitive__4ac9ef698543.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1171–1179; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma coh_bound_transitive : forall (c1 c2 c3 : Z) (n : nat),
  c2 >= c1 - concrete_eps ->
  c3 >= c2 - Z.of_nat n * concrete_eps ->
  c3 >= c1 - Z.of_nat (S n) * concrete_eps.
Proof.
  intros c1 c2 c3 n H1 H2.
  replace (Z.of_nat (S n)) with (Z.of_nat n + 1) by lia.
  pose proof concrete_eps_pos. lia.
Qed.
```

## 51. `coherence_invariant_characterization`

- Kind: `Theorem`
- Code SHA-256: `758cea5d4073e87298017ec9589eca2f0b1a258c79c8fabe3316b829018d5504`
- Statement SHA-256: `0ee900803ee7bdfb2f9b9414955d5df4f447a9331bbefe66848c342cd30c840b`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000051_coherence_invariant_characterization__758cea5d4073.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 669–686; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem coherence_invariant_characterization :
  forall (chain : op_chain) (s : state),
    Forall (fun o => op_delta o >= 0) chain ->
    state_valid s ->
    coherence_invariant_chain chain s.
Proof.
  induction chain as [|o rest IH]; intros s Hforall Hv s' Happ.
  - simpl in Happ. inversion Happ. lia.
  - inversion Hforall as [|o' rest' Hdelta Hforall']. subst.
    simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hc1 : coh_budget s1 = coh_budget s + op_delta o)
      by (eapply concrete_apply_coh; eauto).
    assert (Hv1 : state_valid s1) by (eapply concrete_apply_closure_step; eauto).
    assert (IH_app : coh_budget s' >= coh_budget s1)
      by (eapply IH; eauto).
    lia.
Qed.
```

## 52. `coherence_invariant_characterization`

- Kind: `Lemma`
- Code SHA-256: `ba23d5d9297f2236ea4284f4ddfadbe9a8535d74aa44781aaeb5a290dd2a6033`
- Statement SHA-256: `b52ecef7ed6c2367692100ac3360897fdafc72fa7848022737124d8cd70e5abc`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000052_coherence_invariant_characterization__ba23d5d9297f.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1307–1334; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma coherence_invariant_characterization :
  forall (chain:op_chain) (s:state),
    (Forall (fun o => op_delta o >= 0) chain) ->
    state_valid s ->
    forall s',
      apply_chain chain s = Some s' ->
      coh_budget s' >= coh_budget s.
Proof.
  intros chain s Hpos Hvalid.
  induction chain as [|o ops IH]; intros s' Hchain.
  - inversion Hchain; subst; lia.
  - simpl in Hchain.
    destruct (concrete_apply o s) as [s₁|] eqn:Ho; [|discriminate].
    inversion Hpos as [|_ Hpos' Hpos]; subst.
    assert (Hcoh : coh_budget s₁ = coh_budget s + op_delta o).
    { now apply concrete_apply_coh with (s':=s₁) in Ho. }
    assert (Hvalid₁ : state_valid s₁).
    { split.
      + apply concrete_apply_coh_nonneg with (o:=o) (s:=s) (s':=s₁); assumption.
      + inversion Hvalid as [_ HV]; clear Hvalid.
        rewrite concrete_apply_prims with (s':=s₁) in HV; assumption.
    }
    apply IH; [assumption|assumption].
    rewrite Hcoh.
    apply Z.le_trans with (m:=coh_budget s + op_delta o); [lia|].
    apply Z.le_trans with (m:=coh_budget s₁); [lia|].
    apply Z.le_refl.
Qed.
```

## 53. `collisionPairs_length`

- Kind: `Theorem`
- Code SHA-256: `d7a9ac6a9d3ae7f359a4089ee7cbb595223fd7ac6612e003b6708c4f85e2a178`
- Statement SHA-256: `5506d7021293aa3e0f4e142e870106b5a5c5c17ade07b89faa8c8cfdc0a4c864`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000053_collisionPairs_length__d7a9ac6a9d3a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2201–2202; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem collisionPairs_length : length collisionPairs = 152.
Proof. reflexivity. Qed.
```

## 54. `compose_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `06d50b9961a7f4e13e75c81ab8624f1ab98aa0a10bc530fa6b969d9295453435`
- Statement SHA-256: `207589a3d496d608aeacf813cdf21a8443e0d92c9a84c29bc9d16f311b2208bc`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000054_compose_coh_bound__06d50b9961a7.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 450–463; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem compose_coh_bound : forall (o1 o2 : concrete_op) (s s' : state),
  state_valid s ->
  compose_apply o1 o2 s = Some s' ->
  coh_budget s' >= coh_budget s - 2 * concrete_eps.
Proof.
  intros o1 o2 s s' Hv Hc. unfold compose_apply in Hc.
  destruct (concrete_apply o1 s) as [s1|] eqn:E1; [|discriminate].
  assert (Hv1 : state_valid s1) by (eapply concrete_apply_closure_step; eauto).
  assert (Hc1 : coh_budget s1 >= coh_budget s - concrete_eps)
    by (eapply concrete_apply_coh_bound_step; eauto).
  assert (Hc2 : coh_budget s' >= coh_budget s1 - concrete_eps)
    by (eapply concrete_apply_coh_bound_step; eauto).
  lia.
Qed.
```

## 55. `compose_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `8d1686ab06fd324a8d78ece0be2d7e370954f11b53f5a3ef13c7a36fa5905f63`
- Statement SHA-256: `207589a3d496d608aeacf813cdf21a8443e0d92c9a84c29bc9d16f311b2208bc`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000055_compose_coh_bound__8d1686ab06fd.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 58–76; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem compose_coh_bound : forall (o1 o2 : concrete_op) (s s' : state),
  state_valid s ->
  compose_apply o1 o2 s = Some s' ->
  coh_budget s' >= coh_budget s - 2 * concrete_eps.
Proof.
  intros o1 o2 s s' Hvalid Hcomp.
  unfold compose_apply in Hcomp.
  destruct (concrete_apply o1 s) as [s1|] eqn:E1; [|discriminate].
  (* Step 1: o1 applied to s gives s1, bounded by concrete_eps *)
  assert (Hv1 : state_valid s1).
  { eapply (@apply_closure concrete_op ConcreteOperator); eauto. }
  assert (Hc1 : coh_budget s1 >= coh_budget s - concrete_eps).
  { eapply (@apply_coh_bound concrete_op ConcreteOperator); eauto. }
  (* Step 2: o2 applied to s1 gives s', bounded by concrete_eps *)
  assert (Hc2 : coh_budget s' >= coh_budget s1 - concrete_eps).
  { eapply (@apply_coh_bound concrete_op ConcreteOperator); eauto. }
  (* Combine: s' >= s1 - eps >= (s - eps) - eps = s - 2*eps *)
  lia.
Qed.
```

## 56. `compose_coherence_bound`

- Kind: `Lemma`
- Code SHA-256: `b94e79b01bb3d11ce48ae32107995b81bfb913e4512bc0af5507e026cdef0169`
- Statement SHA-256: `5d5c6c3dd970d3dfb456513ed6d81522c4b16d5c503b3e819a2002b5b8795b58`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000056_compose_coherence_bound__b94e79b01bb3.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1417–1432; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma compose_coherence_bound :
  forall t1 t2 s s',
    Forall (fun o => op_delta o >= 0) (tf_chain t1) ->
    state_valid s ->
    apply_transformation (compose_transformation t1 t2) s = Some s' ->
    coh_budget s' >= coh_budget s - concrete_eps.
Proof.
  intros t1 t2 s s' Hpos Hvalid Hcomp.
  unfold apply_transformation in Hcomp.
  unfold compose_transformation in Hcomp.
  simpl in Hcomp.
  apply apply_chain_app in Hcomp.
  destruct Hcomp as [s_mid [Hmid _]].
  apply coherence_invariant_characterization with (chain := tf_chain t1);
    [exact Hpos | exact Hvalid | exact Hmid].
Qed.
```

## 57. `compose_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `29bfd3734b7ddff5a4fa877f8ca039924aac866e425b4dd823d253c309160a34`
- Statement SHA-256: `28ee37b7312314a7a68d81f81352145a7a8a299228d5f03e8c93f2fd3e8b7ff5`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000057_compose_id_preservation__29bfd3734b7d.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 79–91; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem compose_id_preservation : forall (o1 o2 : concrete_op) (s s' : state),
  compose_apply o1 o2 s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros o1 o2 s s' Hcomp.
  unfold compose_apply in Hcomp.
  destruct (concrete_apply o1 s) as [s1|] eqn:E1; [|discriminate].
  assert (H1 : map prim_id (st_prims s1) = map prim_id (st_prims s)).
  { eapply (@apply_id_preservation concrete_op ConcreteOperator); eauto. }
  assert (H2 : map prim_id (st_prims s') = map prim_id (st_prims s1)).
  { eapply (@apply_id_preservation concrete_op ConcreteOperator); eauto. }
  rewrite H2. exact H1.
Qed.
```

## 58. `compose_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `504e3c12396de0068e4bc5e4c4a65db6f4a23003c7b10b5a185256681031956a`
- Statement SHA-256: `28ee37b7312314a7a68d81f81352145a7a8a299228d5f03e8c93f2fd3e8b7ff5`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000058_compose_id_preservation__504e3c12396d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 465–473; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem compose_id_preservation : forall (o1 o2 : concrete_op) (s s' : state),
  compose_apply o1 o2 s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros o1 o2 s s' Hc. unfold compose_apply in Hc.
  destruct (concrete_apply o1 s) as [s1|] eqn:E; [|discriminate].
  rewrite (concrete_apply_prims o2 s1 s' Hc).
  rewrite (concrete_apply_prims o1 s  s1 E). reflexivity.
Qed.
```

## 59. `compose_preserves_validity`

- Kind: `Lemma`
- Code SHA-256: `5a51490c1798601595c10a5d1ac4ccd7e5f8c0026c06e09aaaf1576af303de1e`
- Statement SHA-256: `792f15c3a750cbe53ec7328ec61668b75108f09605dd7d5536b252b04ce04086`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000059_compose_preserves_validity__5a51490c1798.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1400–1411; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma compose_preserves_validity :
  forall t1 t2,
    transformation_valid t1 ->
    transformation_valid t2 ->
    transformation_valid (compose_transformation t1 t2).
Proof.
  intros t1 t2 Hv1 Hv2.
  unfold transformation_valid in *.
  unfold compose_transformation.
  simpl.
  apply Forall_app; exact ⟨Hv1, Hv2⟩.
Qed.
```

## 60. `compose_transformation_assoc`

- Kind: `Theorem`
- Code SHA-256: `262aa128332ddf43c28763f123e891161f7ff5aa810549acaff6a92e7ade58ca`
- Statement SHA-256: `69601792a096e65ec28188ef381e8c9573da3a6442a30a2e10d1eb9fc9934a98`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000060_compose_transformation_assoc__262aa128332d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 759–776; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem compose_transformation_assoc :
  forall t1 t2 t3 t12 t23 t123a t123b,
    compose_transformation t1 t2   = Some t12 ->
    compose_transformation t2 t3   = Some t23 ->
    compose_transformation t12 t3  = Some t123a ->
    compose_transformation t1 t23  = Some t123b ->
    tf_chain t123a = tf_chain t123b.
Proof.
  intros. unfold compose_transformation in *.
  destruct (Nat.eqb (tf_target t1) (tf_source t2)) eqn:E1; [|discriminate].
  destruct (Nat.eqb (tf_target t2) (tf_source t3)) eqn:E2; [|discriminate].
  injection H as <-. injection H0 as <-. simpl in *.
  rewrite E2 in H1. injection H1 as <-.
  apply Nat.eqb_eq in E1. rewrite E1 in H2.
  destruct (Nat.eqb (tf_source t2) (tf_source t2)) eqn:E3.
  - injection H2 as <-. simpl. rewrite app_assoc. reflexivity.
  - apply Nat.eqb_neq in E3. exfalso. apply E3. reflexivity.
Qed.
```

## 61. `compose_transformation_assoc`

- Kind: `Theorem`
- Code SHA-256: `85fe319abb40ba4eaa037de58ad7ac4938b1045b72f5c56c05bc5f538d2d4f4f`
- Statement SHA-256: `f3fbc5291560ea431e7d12a537830199aaec8e00c9188cb1bd1352a145cc8376`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000061_compose_transformation_assoc__85fe319abb40.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 403–421; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem compose_transformation_assoc :
  forall t1 t2 t3 t12 t23 t123a t123b,
    compose_transformation t1 t2 = Some t12 ->
    compose_transformation t2 t3 = Some t23 ->
    compose_transformation t12 t3 = Some t123a ->
    compose_transformation t1 t23 = Some t123b ->
    tf_chain t123a = tf_chain t123b.
Proof.
  intros.
  unfold compose_transformation in *.
  destruct (Nat.eqb (tf_target t1) (tf_source t2)) eqn:E1; [|discriminate].
  destruct (Nat.eqb (tf_target t2) (tf_source t3)) eqn:E2; [|discriminate].
  injection H as <-. injection H0 as <-. simpl in *.
  rewrite E2 in H1. injection H1 as <-.
  apply Nat.eqb_eq in E1. rewrite E1 in H2.
  destruct (Nat.eqb (tf_source t2) (tf_source t2)) eqn:E3.
  - injection H2 as <-. simpl. rewrite app_assoc. reflexivity.
  - apply Nat.eqb_neq in E3. exfalso. apply E3. reflexivity.
Qed.
```

## 62. `compose_transformation_correct`

- Kind: `Lemma`
- Code SHA-256: `254dcd3f7fe73e555935c004fbe86594314c70a67e6a3f03e64aaffa1aae91bc`
- Statement SHA-256: `443ac50aeadeaa2f0cc2428c4e58de453d27fe573f8fca38d0fa6b0963b6321d`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000062_compose_transformation_correct__254dcd3f7fe7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1378–1391; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma compose_transformation_correct :
  forall t1 t2 s s1 s',
    tf_target t1 = tf_source t2 ->
    apply_transformation t1 s = Some s1 ->
    apply_transformation t2 s1 = Some s' ->
    apply_transformation (compose_transformation t1 t2) s = Some s'.
Proof.
  intros t1 t2 s s1 s' Heq Ht1 Ht2.
  unfold apply_transformation in *.
  unfold compose_transformation in *.
  simpl in *.
  apply (proj2 (apply_chain_app (tf_chain t1) (tf_chain t2) s s')).
  exists s1; exact ⟨Ht1, Ht2⟩.
Qed.
```

## 63. `compose_transformation_correct`

- Kind: `Theorem`
- Code SHA-256: `c64e55e6a2dc3329c5818e63274a6dc5943b652a17338e52d9c21bee8af8a6c8`
- Statement SHA-256: `8fade939646b3057794f598775083bb52d0647060bc3e3e0c73c12be38ecb49a`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000063_compose_transformation_correct__c64e55e6a2dc.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 779–791; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem compose_transformation_correct :
  forall t1 t2 tc s s1 s',
    compose_transformation t1 t2 = Some tc ->
    apply_transformation t1 s  = Some s1 ->
    apply_transformation t2 s1 = Some s' ->
    apply_transformation tc s  = Some s'.
Proof.
  intros t1 t2 tc s s1 s' Hcomp Ht1 Ht2.
  unfold compose_transformation in Hcomp.
  destruct (Nat.eqb (tf_target t1) (tf_source t2)); [|discriminate].
  injection Hcomp as <-. unfold apply_transformation in *. simpl.
  eapply apply_chain_app; eauto.
Qed.
```

## 64. `concrete_apply_closure_step`

- Kind: `Lemma`
- Code SHA-256: `43f6c232d997c7acdc35a8331c0706548d21882b0e7ad9a52ab3798f3dea06c5`
- Statement SHA-256: `eb14be61c3378d8cb7983d9ecbab96f99219ea43141b2c6b27bc7e48c8830c66`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000064_concrete_apply_closure_step__43f6c232d997.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 295–303; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_closure_step : forall o s s',
  state_valid s -> concrete_apply o s = Some s' -> state_valid s'.
Proof.
  intros o s s' Hv H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. subst. unfold state_valid in *.
  destruct Hv as [_ Hpr]. apply Z.ltb_ge in G1. split; [simpl; lia|simpl; exact Hpr].
Qed.
```

## 65. `concrete_apply_coh`

- Kind: `Lemma`
- Code SHA-256: `909c5749076295fdd0dae422379851da1e802408eb972af78b22f9df7bea2c3d`
- Statement SHA-256: `1722771def3b5e0d6ea2bd5560c82d47b3d4e1b66f4f435f2657552f4c204336`
- Occurrences: 140
- Source statuses: `AXIOMATIC` × 12, `COMPLETED` × 75, `INCOMPLETE` × 53
- Extracted code file: `proof_code/completed/coq/000065_concrete_apply_coh__909c57490762.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 275–283; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_coh : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' = coh_budget s + op_delta o.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. reflexivity.
Qed.
```

## 66. `concrete_apply_coh`

- Kind: `Lemma`
- Code SHA-256: `ef4c2b2e2d93525e9cde1d47cc075de19ab1280d6e184a879c466a8f1a770c99`
- Statement SHA-256: `1971918ba25e9364f33a82d8e279959eea095d6b6c595196d0c61853d6b33464`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000066_concrete_apply_coh__ef4c2b2e2d93.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1193–1197; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_coh :
  forall o s s',
    concrete_apply o s = Some s' ->
    coh_budget s' = coh_budget s + op_delta o.
Proof. intros * H; now rewrite concrete_apply_some with (s':=s') in H. Qed.
```

## 67. `concrete_apply_coh_bound_step`

- Kind: `Lemma`
- Code SHA-256: `b9484faa4c444c42f471ad18b92c761553077c47afaa02d2c92082b16fd9c524`
- Statement SHA-256: `aab32c2884a839a8bb73ea86e26639c8edd68c632a6718e3e1b81037982acd95`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000067_concrete_apply_coh_bound_step__b9484faa4c44.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 285–293; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_coh_bound_step : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' >= coh_budget s - concrete_eps.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. apply Z.ltb_ge in G2. simpl. lia.
Qed.
```

## 68. `concrete_apply_coh_ge`

- Kind: `Lemma`
- Code SHA-256: `54cb5b3705d16dfbed780b7a394f14a77d8eeb3078620660221276066ea36e56`
- Statement SHA-256: `db0bed0e8addbfdab49aac0f483a077f85cc61f2752e07a0ab12e4b28eadcf68`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000068_concrete_apply_coh_ge__54cb5b3705d1.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1211–1219; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_coh_ge :
  forall o s s',
    concrete_apply o s = Some s' ->
    coh_budget s' >= coh_budget s - concrete_eps.
Proof.
  intros o s s' H.
  apply concrete_apply_some in H; subst.
  simpl. apply Z.ltb_ge in H. lia.
Qed.
```

## 69. `concrete_apply_coh_nonneg`

- Kind: `Lemma`
- Code SHA-256: `4130fd6de1826146915faeec256d2f309930c1fb077ed9df77a63e6c9aa1cda0`
- Statement SHA-256: `7b7e0e4f5fbaaace62c8ea6d0bdcd2eb2cfa88b4a87f6438220dd40c36c8806c`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000069_concrete_apply_coh_nonneg__4130fd6de182.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1221–1229; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_coh_nonneg :
  forall o s s',
    concrete_apply o s = Some s' ->
    coh_budget s' >= 0.
Proof.
  intros o s s' H.
  apply concrete_apply_some in H; subst.
  simpl. apply Z.ltb_ge in H. lia.
Qed.
```

## 70. `concrete_apply_conserves_identity`

- Kind: `Lemma`
- Code SHA-256: `d06f86483985977616fdefe5de12e7c61cf891b8e7dba5940d36a6172d5b17fb`
- Statement SHA-256: `488b87995a79e22a679550910dca40e4e6d90b0d271375fa0045552702cf8e67`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000070_concrete_apply_conserves_identity__d06f86483985.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1298–1305; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_conserves_identity :
  forall o s s',
    concrete_apply o s = Some s' ->
    length (st_prims s') = length (st_prims s).
Proof.
  intros o s s' H.
  rewrite concrete_apply_prims; reflexivity.
Qed.
```

## 71. `concrete_apply_conserves_identity`

- Kind: `Theorem`
- Code SHA-256: `dca6b47b6ab8b9f6ba9fdabb861f2c3d0f8d25e2c2c9e5c64275c0310aba2292`
- Statement SHA-256: `6dfdf9d81c6aeeeac891b45759146c0fa481da2d37c4a5d4251c9f266d5c1768`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000071_concrete_apply_conserves_identity__dca6b47b6ab8.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 652–657; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem concrete_apply_conserves_identity :
  forall o s s', concrete_apply o s = Some s' -> identity_conserved s s'.
Proof.
  intros o s s' H. unfold identity_conserved, identity_density.
  rewrite (concrete_apply_prims o s s' H). reflexivity.
Qed.
```

## 72. `concrete_apply_lineage`

- Kind: `Lemma`
- Code SHA-256: `33d9e5c189b86ea7a55fef115641a4f2905d52b0f9ac109d25f7fadf0ce28f44`
- Statement SHA-256: `7f054811c1f10c2defea6472d703133b0e0f51aae132889c50b401a31444907b`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000072_concrete_apply_lineage__33d9e5c189b8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1205–1209; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_lineage :
  forall o s s',
    concrete_apply o s = Some s' ->
    st_lineage s' = st_lineage s ++ [st_step s].
Proof. intros * H; now rewrite concrete_apply_some with (s':=s') in H. Qed.
```

## 73. `concrete_apply_lineage_step`

- Kind: `Lemma`
- Code SHA-256: `44145eda1e14a6c7f55a1085ebb44efcb6df42c521493dca83e2f8be2e372c55`
- Statement SHA-256: `232a2a0696daab885627184c1ccfb97f7664e1e1187a9b19ab0c3b55edd0126a`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000073_concrete_apply_lineage_step__44145eda1e14.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 305–313; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_lineage_step : forall o s s',
  concrete_apply o s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. exists [st_step s]. reflexivity.
Qed.
```

## 74. `concrete_apply_needs_admissible`

- Kind: `Theorem`
- Code SHA-256: `9294cccb7c49bd086809f33d1da7e293d8e3638ee6ef9d6a895ce26a2c983595`
- Statement SHA-256: `e050ba17f85be5b3664468f13a34bedd84c5d9470aaa9b8933c352b0135dde8d`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000074_concrete_apply_needs_admissible__9294cccb7c49.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1104–1112; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem concrete_apply_needs_admissible : forall o s s',
  concrete_apply o s = Some s' -> op_admissible o s.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  apply Z.ltb_ge in G1. apply Z.ltb_ge in G2.
  unfold op_admissible. lia.
Qed.
```

## 75. `concrete_apply_prims`

- Kind: `Lemma`
- Code SHA-256: `99a2ade1c25fa2e226f40fa519797441f1407e6eb72b02d62b89fb1db5103136`
- Statement SHA-256: `c69029f21ffb8b1c6a75033946415eefb72c30376b645724a2174cf72a7f1075`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000075_concrete_apply_prims__99a2ade1c25f.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 257–264; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_prims : forall o s s',
  concrete_apply o s = Some s' -> st_prims s' = st_prims s.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. reflexivity.
Qed.
```

## 76. `concrete_apply_prims`

- Kind: `Lemma`
- Code SHA-256: `f775557deda56ce146ccf2f7876fedc452b05e71b05d9d04c731ba0b06d1e426`
- Statement SHA-256: `de511263264fc65171f4e1c5ba8a836a739a55858276f91573ceedd70552f426`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000076_concrete_apply_prims__f775557deda5.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1187–1191; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_prims :
  forall o s s',
    concrete_apply o s = Some s' ->
    st_prims s' = st_prims s.
Proof. intros * H; now rewrite concrete_apply_some with (s':=s') in H. Qed.
```

## 77. `concrete_apply_some`

- Kind: `Lemma`
- Code SHA-256: `133992bf10e72a15d43f75b77d9a889054aeeec5e826b7c9f24a9f96624475b3`
- Statement SHA-256: `8c78f375820459c13d4a0e3fa156f303f27b915e2a150c53432c151e34082e1a`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000077_concrete_apply_some__133992bf10e7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1171–1185; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_some :
  forall o s s',
    concrete_apply o s = Some s' →
    s' = {| st_prims   := st_prims s;
            coh_budget := coh_budget s + op_delta o;
            st_lineage := st_lineage s ++ [st_step s];
            st_step    := S (st_step s) |}.
Proof.
  intros o s s' H.
  unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2;
    [discriminate|].
  inversion H; reflexivity.
Qed.
```

## 78. `concrete_apply_step`

- Kind: `Lemma`
- Code SHA-256: `c15e9e595c783abf027b79c48d0d8d7d1d1467994dd55d932d7412d8a87d886b`
- Statement SHA-256: `5433c6727d526b301cd420e249205ee1185266e5b952d29f789b9ab39d59472e`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000078_concrete_apply_step__c15e9e595c78.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1199–1203; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma concrete_apply_step :
  forall o s s',
    concrete_apply o s = Some s' ->
    st_step s' = S (st_step s).
Proof. intros * H; now rewrite concrete_apply_some with (s':=s') in H. Qed.
```

## 79. `concrete_apply_step_succ`

- Kind: `Lemma`
- Code SHA-256: `778301fec6f6ed4493bd1b2ac30b52b72dc6c806dda4992b71c76a091f384dc6`
- Statement SHA-256: `3fcbaf0fece6c917f14ee4fabd9660982061b4e3738ac3c8c151515610aa7a5c`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000079_concrete_apply_step_succ__778301fec6f6.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 266–273; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Lemma concrete_apply_step_succ : forall o s s',
  concrete_apply o s = Some s' -> st_step s' = S (st_step s).
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. reflexivity.
Qed.
```

## 80. `concrete_apply_total`

- Kind: `Theorem`
- Code SHA-256: `523c2a81623cdc6e0f421c80fd59bd418ec0071d74a11030453067a70e5f6507`
- Statement SHA-256: `d11b2be208e7024df4214f425b28e7aacc7da24370635e48f2779d0d60263ba7`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000080_concrete_apply_total__523c2a81623c.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1080–1090; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem concrete_apply_total : forall o s,
  op_admissible o s ->
  exists s', concrete_apply o s = Some s'.
Proof.
  intros o s [H1 H2]. unfold concrete_apply.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1.
  { apply Z.ltb_lt in G1. lia. }
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2.
  { apply Z.ltb_lt in G2. lia. }
  eexists. reflexivity.
Qed.
```

## 81. `concrete_eps_pos`

- Kind: `Lemma`
- Code SHA-256: `b81b05d3f0388668c29b638300bd016d03ca133bb1328ae8c6634a24a5f626e4`
- Statement SHA-256: `1d8ca7180a1d127f753338b1244db457fc08af6b665d0f1c835fbe4093bdd19a`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000081_concrete_eps_pos__b81b05d3f038.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1148–1149; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma concrete_eps_pos : concrete_eps > 0.
Proof. unfold concrete_eps. lia. Qed.
```

## 82. `condition_independence_C1`

- Kind: `Theorem`
- Code SHA-256: `06bde661945ea5bd3e721c8dd03a886a7a710e6f137be5219b097743a274ee6d`
- Statement SHA-256: `3d8f82e9a7feffecf2c1fa9da6e1c36611ac0e1d939c471d9c98806e03e6bce8`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000082_condition_independence_C1__06bde661945e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1531–1539; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem condition_independence_C1 : forall S I,
    Spoofable_on_C1 S I ->
    ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C1).
  Proof.
    intros S I [M [Hm2 [Hm3 [Hm4 [Hm5 Hn1]]]]] himp.
    exact (Hn1 (himp M Hm2 Hm3 Hm4 Hm5)).
  Qed.
```

## 83. `condition_independence_C1`

- Kind: `Theorem`
- Code SHA-256: `301595cfd5d8cff81727dfadd9404efac4470313c3d8948324462086d3b4134c`
- Statement SHA-256: `7d860441990f656c98311360b6205c228349f4dcc2bb86db9cf06b82e359624b`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000083_condition_independence_C1__301595cfd5d8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3028–3038; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem condition_independence_C1 : forall S I,
  Spoofable_on_C1 S I ->
  ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C1).
Proof.
  intros S I [M [Hm2 [Hm3 [Hm4 [Hm5 Hnm1]]]]].
  intro Himplies.
  apply Hnm1.
  exact (Himplies M Hm2 Hm3 Hm4 Hm5).
Qed.
```

## 84. `condition_independence_C2`

- Kind: `Theorem`
- Code SHA-256: `16d1a8e30731c3acd7b4b6cbaef1ba76ab21075c24abbac8453753d83e4cc138`
- Statement SHA-256: `e6a475ab46a23f3b0bee7179e7dbea00437dfc70c88597d74ad9290800469152`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000084_condition_independence_C2__16d1a8e30731.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3040–3050; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem condition_independence_C2 : forall S I,
  Spoofable_on_C2 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C2).
Proof.
  intros S I [M [Hm1 [Hm3 [Hm4 [Hm5 Hnm2]]]]].
  intro Himplies.
  apply Hnm2.
  exact (Himplies M Hm1 Hm3 Hm4 Hm5).
Qed.
```

## 85. `condition_independence_C2`

- Kind: `Theorem`
- Code SHA-256: `b46c7c10d3b0632f277c57d231a872d615599f923a2d68009928b0dd1e317fc5`
- Statement SHA-256: `b862205ac710373bbfbdd5f9e58d67018d6b6ff1d8f657cce8beec04ef52f141`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000085_condition_independence_C2__b46c7c10d3b0.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1541–1549; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem condition_independence_C2 : forall S I,
    Spoofable_on_C2 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C2).
  Proof.
    intros S I [M [Hm1 [Hm3 [Hm4 [Hm5 Hn2]]]]] himp.
    exact (Hn2 (himp M Hm1 Hm3 Hm4 Hm5)).
  Qed.
```

## 86. `condition_independence_C3`

- Kind: `Theorem`
- Code SHA-256: `29bc71845d70475d46f7ffea9ca6a99f25fd2e1430799117ae8748414303ea77`
- Statement SHA-256: `242b9bcce173498dc99766826fed2f54a2cf753db219cad4f94510c95e41b5da`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000086_condition_independence_C3__29bc71845d70.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1551–1559; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem condition_independence_C3 : forall S I,
    Spoofable_on_C3 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C3).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm4 [Hm5 Hn3]]]]] himp.
    exact (Hn3 (himp M Hm1 Hm2 Hm4 Hm5)).
  Qed.
```

## 87. `condition_independence_C3`

- Kind: `Theorem`
- Code SHA-256: `9e6379e0d434adcc8f6859cbb9cb475d60128cae5cc100733c33e47718ab8fda`
- Statement SHA-256: `cae8b2cfd4074511f87287eb898f12b20348724c700766977e907616f0fcc5cc`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000087_condition_independence_C3__9e6379e0d434.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3052–3062; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem condition_independence_C3 : forall S I,
  Spoofable_on_C3 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C3).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm4 [Hm5 Hnm3]]]]].
  intro Himplies.
  apply Hnm3.
  exact (Himplies M Hm1 Hm2 Hm4 Hm5).
Qed.
```

## 88. `condition_independence_C4`

- Kind: `Theorem`
- Code SHA-256: `5f0811e888d603f53c9fd89eaf8e5c666f8f423ace87ee457ad4f5c2da01a4c1`
- Statement SHA-256: `80ec0598e58c9efc2ba0f18654e5741b09a07a2353711f860f67fbfb89822d25`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000088_condition_independence_C4__5f0811e888d6.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1561–1569; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem condition_independence_C4 : forall S I,
    Spoofable_on_C4 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C3 -> matches_on M S I C5 ->
                 matches_on M S I C4).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm3 [Hm5 Hn4]]]]] himp.
    exact (Hn4 (himp M Hm1 Hm2 Hm3 Hm5)).
  Qed.
```

## 89. `condition_independence_C4`

- Kind: `Theorem`
- Code SHA-256: `d9e8e24089f263004a0b4be98efa311c74d0bf862229d367d0cc38bc22024594`
- Statement SHA-256: `dd445b6188037803e8104f80f94bc51d5db6943389408af1e79e8ea978f1f884`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000089_condition_independence_C4__d9e8e24089f2.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3064–3074; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem condition_independence_C4 : forall S I,
  Spoofable_on_C4 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C5 ->
     matches_on M S I C4).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm3 [Hm5 Hnm4]]]]].
  intro Himplies.
  apply Hnm4.
  exact (Himplies M Hm1 Hm2 Hm3 Hm5).
Qed.
```

## 90. `condition_independence_C5`

- Kind: `Theorem`
- Code SHA-256: `c8fc5dc15ed20124ee9d5062da3f6f915ae06c7cc796aa5cfc48e74b717cf05c`
- Statement SHA-256: `0c1db68ff7c0b24256a9a02d7c6b430c0ef54742da900ab9716bb707a77fb693`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000090_condition_independence_C5__c8fc5dc15ed2.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1571–1579; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem condition_independence_C5 : forall S I,
    Spoofable_on_C5 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C3 -> matches_on M S I C4 ->
                 matches_on M S I C5).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm3 [Hm4 Hn5]]]]] himp.
    exact (Hn5 (himp M Hm1 Hm2 Hm3 Hm4)).
  Qed.
```

## 91. `condition_independence_C5`

- Kind: `Theorem`
- Code SHA-256: `ddb0ec0e8787b8f6ed53456e69296e6ad28cf6de7bddbae593d13e499b251be1`
- Statement SHA-256: `a7d8489242fe48b9fdb6ac51fb6d37b01258a851e2733900934bee264d45c519`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000091_condition_independence_C5__ddb0ec0e8787.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3076–3086; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem condition_independence_C5 : forall S I,
  Spoofable_on_C5 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C4 ->
     matches_on M S I C5).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm3 [Hm4 Hnm5]]]]].
  intro Himplies.
  apply Hnm5.
  exact (Himplies M Hm1 Hm2 Hm3 Hm4).
Qed.
```

## 92. `conjunctive_blocking`

- Kind: `Theorem`
- Code SHA-256: `1c34d556ec58095921e0ed73697390fee499322c591e305652b0772311d74491`
- Statement SHA-256: `ec944b2f803f4b64a7cac4fc606e18cb8304e8321a1dd954bc073da4e69ec2ac`
- Occurrences: 68
- Source statuses: `COMPLETED` × 28, `INCOMPLETE` × 40
- Extracted code file: `proof_code/completed/coq/000092_conjunctive_blocking__1c34d556ec58.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 48–60; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem conjunctive_blocking :
  forall s i,
    ~C1 s i \/ ~C2 s i \/ ~C3 s i \/ ~C4 s i \/ ~C5 s i ->
    ~Attribution s i.
Proof.
  unfold Attribution. intros. intro Hcontra. destruct Hcontra as [HC1 [HC2 [HC3 [HC4 HC5]]]].
  destruct H as [HnC1 | [HnC2 | [HnC3 | [HnC4 | HnC5]]]].
  - contradiction.
  - contradiction.
  - contradiction.
  - contradiction.
  - contradiction.
Qed.
```

## 93. `conjunctive_blocking`

- Kind: `Theorem`
- Code SHA-256: `39a61a400ad59893b548b8c40d11fb688d1ee536e628afa51ac3246e5cd24994`
- Statement SHA-256: `7e564ca494fe54c1a714f13d1f35197b3956c317af933089a183badb0b52d574`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000093_conjunctive_blocking__39a61a400ad5.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1413–1423; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem conjunctive_blocking :
    forall S I,
      (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
      ~ Attribution S I.
  Proof.
    intros S I Hneg Hattr.
    destruct Hattr as [H1 [H2 [H3 [H4 [H5 _]]]]].
    destruct Hneg as [HC1|[HC2|[HC3|[HC4|HC5]]]];
      [exact (HC1 H1) | exact (HC2 H2) | exact (HC3 H3)
      | exact (HC4 H4) | exact (HC5 H5)].
  Qed.
```

## 94. `conjunctive_blocking`

- Kind: `Theorem`
- Code SHA-256: `4e11aa8d809788ebb7b6ebc9e421aced818559bd6e06f7f960d4042834c15e62`
- Statement SHA-256: `e7b9ddd238e19f113d67f69bd1c05928774dc7e66293f20a2df4c55779a391d3`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000094_conjunctive_blocking__4e11aa8d8097.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2998–3004; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem conjunctive_blocking : forall S I,
  (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
  ~ Attribution S I.
Proof.
  intros S I Hneg [H1 [H2 [H3 [H4 H5]]]].
  destruct Hneg as [N|[N|[N|[N|N]]]]; exact (N ltac:(assumption)).
Qed.
```

## 95. `conjunctive_blocking`

- Kind: `Theorem`
- Code SHA-256: `5daa0d469cd6969be56fbf9cf7cde6dc5248f0756c733f20ee6603a5bf409c9e`
- Statement SHA-256: `6bfe6072041ed711537218a5fe2567323d9c606ed28728d57c9f2c7ebc43d1c9`
- Occurrences: 1
- Source statuses: `COMPLETED` × 1
- Extracted code file: `proof_code/completed/coq/000095_conjunctive_blocking__5daa0d469cd6.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 41042–41056; embedded `gpx_consciousness_2026-05_9062be4f4a914483_consciousness_criterion_five_state_coq.v`

```coq
Theorem conjunctive_blocking :
  forall S I,
    (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
    ~ WarrantedAttribution S I.
Proof.
  unfold WarrantedAttribution.
  intros S I Hfail Hattr.
  destruct Hattr as [HC1 [HC2 [HC3 [HC4 [HC5 _Hcert]]]]].
  destruct Hfail as [H1 | [H2 | [H3 | [H4 | H5]]]].
  - contradiction.
  - contradiction.
  - contradiction.
  - contradiction.
  - contradiction.
Qed.
```

## 96. `conjunctive_blocking`

- Kind: `Theorem`
- Code SHA-256: `8c7be6dc2ee8c2f836e6fa9cf1ad4e2b6429138afca0b746e4ad5a84e8291e94`
- Statement SHA-256: `8a60e5059c5b3d6d91f62adf62167b33abe7b432a5200e1de260f306ace04978`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000096_conjunctive_blocking__8c7be6dc2ee8.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2612–2625; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem conjunctive_blocking :
  forall S I,
  (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
  ~ Attribution S I.
Proof.
  intros S I Hneg Hattr.
  destruct Hattr as [H1 [H2 [H3 [H4 [H5 Hc]]]]].
  destruct Hneg as [HC1 | [HC2 | [HC3 | [HC4 | HC5]]]].
  - exact (HC1 H1).
  - exact (HC2 H2).
  - exact (HC3 H3).
  - exact (HC4 H4).
  - exact (HC5 H5).
Qed.
```

## 97. `core46Ids_length`

- Kind: `Theorem`
- Code SHA-256: `f31866dfc850abd22037921d675057ff702e1acdec363d8549f79b56700fdcd3`
- Statement SHA-256: `c06021d41bec0fae3c01ed0d6fc04ffca18e71336737bbdf9ff47ee95fb3e5d3`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000097_core46Ids_length__f31866dfc850.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2186–2187; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem core46Ids_length : length core46Ids = 46.
Proof. reflexivity. Qed.
```

## 98. `core_candidate_clarity_ge_2`

- Kind: `Lemma`
- Code SHA-256: `e5bd10c5bf57faaa029b9903f9742dfb136f389bde42580b4e4c298cd3274a9b`
- Statement SHA-256: `e36aac07c1c31e62bdad78bd644682dc4a33b6d0dff0bdc33d7b3f65abbb23b2`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000098_core_candidate_clarity_ge_2__e5bd10c5bf57.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3974–3983; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma core_candidate_clarity_ge_2 :
  forall (R : Registry) (r : RootSig),
    core_candidate R r -> clarity r >= 2.
Proof.
  intros R r Hcore.
  unfold core_candidate, root_score_ok in Hcore.
  destruct Hcore as [_ [Hscore [_ _]]].
  destruct Hscore as [Hclarity _].
  exact Hclarity.
Qed.
```

## 99. `core_candidate_drift_le_1`

- Kind: `Lemma`
- Code SHA-256: `d88274d9282795e4d44912fbf84135a1415261f77be44bd8d883827ed873668e`
- Statement SHA-256: `9542766c4fab0b4557ed28941d4a6a9d96651ae7adcaa61723278e231d277b9c`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000099_core_candidate_drift_le_1__d88274d92827.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3985–3994; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma core_candidate_drift_le_1 :
  forall (R : Registry) (r : RootSig),
    core_candidate R r -> drift r <= 1.
Proof.
  intros R r Hcore.
  unfold core_candidate, root_score_ok in Hcore.
  destruct Hcore as [_ [Hscore [_ _]]].
  destruct Hscore as [_ Hdrift].
  exact Hdrift.
Qed.
```

## 100. `core_candidate_support_ge_3`

- Kind: `Lemma`
- Code SHA-256: `3202073023364f49ade3e3fda23b80c60e2790aefe4a0a434e077d1893c272ce`
- Statement SHA-256: `b05804a71e5b9f7198d387452caa5c6eee55988f0e07d3691cfaf825dd478470`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000100_core_candidate_support_ge_3__320207302336.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3964–3972; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma core_candidate_support_ge_3 :
  forall (R : Registry) (r : RootSig),
    core_candidate R r -> support_count R (rid r) >= 3.
Proof.
  intros R r Hcore.
  unfold core_candidate in Hcore.
  destruct Hcore as [_ [_ [Hsupport _]]].
  exact Hsupport.
Qed.
```

## 101. `corruption_transitive`

- Kind: `Theorem`
- Code SHA-256: `6a1c6e1e08a7e956d9dc3e875053a53ecdca4d0206b372e0348b50b4bc3aac73`
- Statement SHA-256: `bd140fd8e5d27d031342791d3d1ff0714d3bd6f1882dcedecba0d94736ed68b7`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000101_corruption_transitive__6a1c6e1e08a7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 160–168; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem corruption_transitive :
  forall S I,
    Attribution S I -> Drop1 S I /\ Drop12 S I /\ Drop123 S I.
Proof.
  intros S I Hattr. repeat split.
  - destruct Hattr as [_ [H2 [H3 [H4 H5]]]]. unfold Drop1. auto.
  - apply attr_implies_drop12. exact Hattr.
  - apply attr_implies_drop123. exact Hattr.
Qed.
```

## 102. `cycle_detected`

- Kind: `Theorem`
- Code SHA-256: `ddd738a4c61fff7ef6efbaf3e75bf7b8d1320c7c690b485abf9449dd8d89dcf5`
- Statement SHA-256: `a840670c5446b9b9b2374e0487e5412065b04185e9bf96822d820ee3ad1f4680`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000102_cycle_detected__ddd738a4c61f.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 775–791; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem cycle_detected :
  forall fuel visited bid,
    In bid visited ->
    exists fuel', verify_lineage_aux (S fuel') visited bid = LineageInvalid.
Proof.
  intros fuel visited bid Hin.
  exists fuel. simpl.
  destruct (existsb (fun v => if BundleID_eq_dec v bid then true else false) visited) eqn:Hex.
  - reflexivity.
  - exfalso. rewrite existsb_exists in Hex.
    apply Bool.not_true_iff_false in Hex. apply Hex.
    exists bid. split.
    + exact Hin.
    + destruct (BundleID_eq_dec bid bid) as [_|Habs].
      * reflexivity.
      * exfalso. apply Habs. reflexivity.
Qed.
```

## 103. `demo20_gress_attested`

- Kind: `Example`
- Code SHA-256: `ff41fafdd1599293a03c3b2bc515c348c6b8ea8d7be9115aa52c75067a1d35d6`
- Statement SHA-256: `cd1b6fa38fe99cdebe88c864159c3f2457d5779a493410ea9758a089e3bddae4`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000103_demo20_gress_attested__ff41fafdd159.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2208–2210; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Example demo20_gress_attested :
  attested_count_o8 R001 = 8.
Proof. reflexivity. Qed.
```

## 104. `demo20_mit_attested`

- Kind: `Example`
- Code SHA-256: `a9f50700d27d9b2736c81aa780146343ada83269184e6bd04399d4967fc5ce8b`
- Statement SHA-256: `7bf9696b0fe617b322f9bbeee4e5d6ae19f7af4a9f75cfc1e83fba7138ec7738`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000104_demo20_mit_attested__a9f50700d27d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2216–2218; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Example demo20_mit_attested :
  attested_count_o8 R009 = 6.
Proof. reflexivity. Qed.
```

## 105. `demo20_morph_attested`

- Kind: `Example`
- Code SHA-256: `c32a82dc1e3f9bad59b2ecf617cb361a5f8676aacba9e69fb3a10ef775a8c84b`
- Statement SHA-256: `25b28c1f5482c0213eefa48f067e64d0df224ce6cd52721cbf7ab4508dd29f3f`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000105_demo20_morph_attested__c32a82dc1e3f.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2220–2222; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Example demo20_morph_attested :
  attested_count_o8 R020 = 6.
Proof. reflexivity. Qed.
```

## 106. `demo20_scend_attested`

- Kind: `Example`
- Code SHA-256: `44ba8d2f47b029c02e176b86a976e4a92389e5648685a3af4654caa4a07ecdc3`
- Statement SHA-256: `7fb349cea3d64e937153d90ad65a6ab4bd1fe6e9f1213117e91fea618e1710dd`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000106_demo20_scend_attested__44ba8d2f47b0.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2212–2214; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Example demo20_scend_attested :
  attested_count_o8 R002 = 5.
Proof. reflexivity. Qed.
```

## 107. `demo20Ids_length`

- Kind: `Theorem`
- Code SHA-256: `88f25b6659c27886b1c54daead709325d2ebe712c0c68d418fdccc41304fb475`
- Statement SHA-256: `b49749f34a09e01a85ebac1422c2d897a9883d5c9bfff424632a0401459775dd`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000107_demo20Ids_length__88f25b6659c2.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2189–2190; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem demo20Ids_length : length demo20Ids = 20.
Proof. reflexivity. Qed.
```

## 108. `demo_gress_support`

- Kind: `Example`
- Code SHA-256: `dea9b127ebf2d75912c8ecca849c776005fdc810816abc156c833f25dc386bc9`
- Statement SHA-256: `30a4abb53ba3ec5fe6e546b336cdbddd1967741b0d99049aae60f2bfb505d3eb`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000108_demo_gress_support__dea9b127ebf2.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5121–5123; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_gress_support :
  support_count demo20_ledger R_gress = 8.
Proof. reflexivity. Qed.
```

## 109. `demo_mit_support`

- Kind: `Example`
- Code SHA-256: `6d4ef1bc3a93ea985710700e8d0283fe3691dad1cff257d5297470bdc3a67728`
- Statement SHA-256: `6b24b276bab85410f8564f3ef8a9f635cd8aaeffae8bc1fbe94ab3b59cd6de1b`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000109_demo_mit_support__6d4ef1bc3a93.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5129–5131; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_mit_support :
  support_count demo20_ledger R_mit = 6.
Proof. reflexivity. Qed.
```

## 110. `demo_morph_support`

- Kind: `Example`
- Code SHA-256: `9ab4a329343c8406e66fa36631cfa4ff40e3f71b25e5e55392c715c530ef365e`
- Statement SHA-256: `114fe3307a777c78cb649abfa073d81068349ae5d65e7d78152af083c222a891`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000110_demo_morph_support__9ab4a329343c.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5141–5143; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_morph_support :
  support_count demo20_ledger R_morph = 7.
Proof. reflexivity. Qed.
```

## 111. `demo_scend_support`

- Kind: `Example`
- Code SHA-256: `9f85e040b1c3131fb31d507d4aafb51f8c3245ed335eb5b676fca2e34d948def`
- Statement SHA-256: `a77f9218e13f5125b7a738f06877bc80f3666aab4e0ab9db07120b425c4c2f5d`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000111_demo_scend_support__9f85e040b1c3.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5125–5127; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_scend_support :
  support_count demo20_ledger R_scend = 5.
Proof. reflexivity. Qed.
```

## 112. `demo_struct_support`

- Kind: `Example`
- Code SHA-256: `bc6adf74f36abf678570c1e8f8fb18dd7f545906bd5a3dda9b51b36add979779`
- Statement SHA-256: `b8f46e4ed96abb64142f87d2aae053d5e269bf36b3f0eb81260d9438be4c07b9`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000112_demo_struct_support__bc6adf74f36a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5137–5139; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_struct_support :
  support_count demo20_ledger R_struct = 6.
Proof. reflexivity. Qed.
```

## 113. `demo_vert_support`

- Kind: `Example`
- Code SHA-256: `22ba0d8fcdeb7fd1fc0ae7a317b020a2f978de7099214cf6d06c02898db4edd0`
- Statement SHA-256: `622e1f588a45a78ce5c8a9e8d22311e57c4fbaa8fbb701e378b5ae383e7c05f8`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000113_demo_vert_support__22ba0d8fcdeb.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5133–5135; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example demo_vert_support :
  support_count demo20_ledger R_vert = 8.
Proof. reflexivity. Qed.
```

## 114. `dispatch_deterministic`

- Kind: `Theorem`
- Code SHA-256: `2add78bdba5c9d21254d55556274c433aac451bbfaf1c9dc75b81fcdc6a3c683`
- Statement SHA-256: `c03ea844eb934f53de22fa1e855ded62a71cc79e2c99a370a7a92d862131331f`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000114_dispatch_deterministic__2add78bdba5c.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 588–596; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem dispatch_deterministic :
  forall alg k msg sig,
    exists! b : bool, dispatch_verify alg k msg sig = b.
Proof.
  intros. exists (dispatch_verify alg k msg sig).
  split.
  - reflexivity.
  - intros b' H. symmetry. exact H.
Qed.
```

## 115. `dispatch_exhaustive`

- Kind: `Theorem`
- Code SHA-256: `02e121e5fb960344e65d98b1e459e03caf0242e6c27a15d29b744b1ebebfccd7`
- Statement SHA-256: `fdc7b67a1fc5d43554dd47dbe23d04715dfdc52625ccf335f0a7d95bff6ce0d0`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000115_dispatch_exhaustive__02e121e5fb96.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 599–610; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem dispatch_exhaustive :
  forall alg k msg sig,
    dispatch_verify alg k msg sig = verify_ed25519 k msg sig \/
    dispatch_verify alg k msg sig = verify_ecdsa_p256 k msg sig \/
    dispatch_verify alg k msg sig = verify_ecdsa_p384 k msg sig \/
    dispatch_verify alg k msg sig = verify_ecdsa_p521 k msg sig \/
    dispatch_verify alg k msg sig = verify_rsa_2048 k msg sig \/
    dispatch_verify alg k msg sig = verify_rsa_3072 k msg sig \/
    dispatch_verify alg k msg sig = verify_rsa_4096 k msg sig.
Proof.
  intros. destruct alg; simpl; auto 7.
Qed.
```

## 116. `dispatch_total`

- Kind: `Theorem`
- Code SHA-256: `0cfafb7779aad9c4ea51016945ff8164685e856e2a4221354c69df010e7df5f7`
- Statement SHA-256: `d5eae4cb88c6df339bcb7c156f2f9409bea9c9cc2fbd0304349e93d51f50283e`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000116_dispatch_total__0cfafb7779aa.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 582–586; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem dispatch_total :
  forall alg k msg sig, exists b : bool, dispatch_verify alg k msg sig = b.
Proof.
  intros. exists (dispatch_verify alg k msg sig). reflexivity.
Qed.
```

## 117. `drop1_implies_drop12`

- Kind: `Theorem`
- Code SHA-256: `fd27e8943cdae80e50464784d0e199d786b5760d363921454f85edfece585f89`
- Statement SHA-256: `a8409ae4320fe1a8b5283e4f181def206827a990e3ee619d4970bce1bcf519c3`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000117_drop1_implies_drop12__fd27e8943cda.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 153–157; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem drop1_implies_drop12 :
  forall S I, Drop1 S I -> Drop12 S I.
Proof.
  intros S I [_ [H3 [H4 H5]]]. unfold Drop12. auto.
Qed.
```

## 118. `empty_witnesses_valid`

- Kind: `Theorem`
- Code SHA-256: `a2430975518426ed8f35bb78b0aaa6c20d4311a345d879598a37a3142ab3db85`
- Statement SHA-256: `fcf8f817ecd03b076e21141cfebbcf95d1eb8750048f8676bacc07ee85995c19`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000118_empty_witnesses_valid__a24309755184.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1024–1028; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem empty_witnesses_valid :
  forall root, all_witnesses_valid [] root = true.
Proof.
  intros. unfold all_witnesses_valid. simpl. reflexivity.
Qed.
```

## 119. `energy_monotone`

- Kind: `Theorem`
- Code SHA-256: `7167d7238e8a0ed64da22ebbdc4847c188ad48cc17226e7be90dea8801fe7c3f`
- Statement SHA-256: `02e58e132ca0ffc76a92fbc0cf3dad43d60e9ac41774045b1f853967f8ce09b8`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000119_energy_monotone__7167d7238e8a.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 582–585; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem energy_monotone : forall s1 s2 : state,
  coh_budget s1 >= 0 -> coh_budget s2 >= 0 ->
  coh_budget s1 > coh_budget s2 -> energy s1 > energy s2.
Proof. intros. unfold energy. nia. Qed.
```

## 120. `energy_monotone`

- Kind: `Theorem`
- Code SHA-256: `d19dcb7304ebcd9b7546f400ee0399f2ce02304f5a38339153a33cad4c4bb9eb`
- Statement SHA-256: `32e5a83f0e532e7f5a89cd01a2022c916ae6587702ce6c4918c4f69808db3ed0`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000120_energy_monotone__d19dcb7304eb.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 225–231; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem energy_monotone : forall s1 s2 : state,
  coh_budget s1 >= 0 -> coh_budget s2 >= 0 ->
  coh_budget s1 > coh_budget s2 ->
  energy s1 > energy s2.
Proof.
  intros s1 s2 H1 H2 Hgt. unfold energy. nia.
Qed.
```

## 121. `eps_additive`

- Kind: `Lemma`
- Code SHA-256: `53c4df0516bddd4a00c37f42a6745cf22df4163b2644b669fb06182c77c419a4`
- Statement SHA-256: `b9e14270ff8531dafc6826181eefa71729b5c7e244c2f4ecb155477f8266be2d`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000121_eps_additive__53c4df0516bd.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1152–1157; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma eps_additive : forall (n m : nat),
  Z.of_nat (n + m) * concrete_eps =
  Z.of_nat n * concrete_eps + Z.of_nat m * concrete_eps.
Proof.
  intros n m. rewrite Nat2Z.inj_add. lia.
Qed.
```

## 122. `eps_monotone`

- Kind: `Lemma`
- Code SHA-256: `e5e81579ffd15e37dad38b699e19f321bcf037321815fc6c8df373cea3cdc243`
- Statement SHA-256: `fffce432494241ac3f7383baff3917ee62b1baf0039d24b01d3e701408bb9f9b`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000122_eps_monotone__e5e81579ffd1.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1160–1167; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma eps_monotone : forall (n m : nat),
  (n <= m)%nat ->
  Z.of_nat n * concrete_eps <= Z.of_nat m * concrete_eps.
Proof.
  intros n m Hle.
  assert (Z.of_nat n <= Z.of_nat m) by lia.
  pose proof concrete_eps_pos. nia.
Qed.
```

## 123. `eval_pred_deterministic`

- Kind: `Theorem`
- Code SHA-256: `b9de1b40ea0ac1d372fdc177ecc46102ad89d212ac6649f30f9c89e827c31ddd`
- Statement SHA-256: `9ee443c9f4a8af4d7f412a14c3fa965d86d5c995731b917c4a3742060bb295f9`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000123_eval_pred_deterministic__b9de1b40ea0a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 915–922; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem eval_pred_deterministic :
  forall fuel ctx p, exists! result, eval_pred fuel ctx p = result.
Proof.
  intros. exists (eval_pred fuel ctx p).
  split.
  - reflexivity.
  - intros r' H. symmetry. exact H.
Qed.
```

## 124. `eval_pred_terminates`

- Kind: `Theorem`
- Code SHA-256: `c82d01814be516c1a18bc5966e7da021564292ff5dfab3e929d7f25beba5cc81`
- Statement SHA-256: `34a592093b89c2bbfbaf8b25e0acd149056036af4f180ee6e216639d6d64a818`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000124_eval_pred_terminates__c82d01814be5.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 908–912; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem eval_pred_terminates :
  forall fuel ctx p, exists result, eval_pred fuel ctx p = result.
Proof.
  intros. exists (eval_pred fuel ctx p). reflexivity.
Qed.
```

## 125. `feasible_preserved`

- Kind: `Theorem`
- Code SHA-256: `9e4a1b32444a55be6843d70270c745ebc4f9ed08400866d78e47c6295a5d22c8`
- Statement SHA-256: `38109376c32c184d71130b0914dad936566b85dd3c8aa7545c9019b28e6d911f`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000125_feasible_preserved__9e4a1b32444a.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 568–578; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem feasible_preserved : forall (o : concrete_op) (s s' : state) (u d : Z),
  in_feasible_region s u d ->
  state_valid s ->
  concrete_apply o s = Some s' ->
  op_delta o >= 0 ->
  in_feasible_region s' u d.
Proof.
  intros o s s' u d Hfeas Hv Happ Hdelta.
  unfold in_feasible_region, recoverable, event_horizon in *. simpl in *.
  rewrite (concrete_apply_coh o s s' Happ). lia.
Qed.
```

## 126. `feasible_preserved`

- Kind: `Theorem`
- Code SHA-256: `aa1208dfb32ee186597a59b314b63eed6d0118af6f8a6623b11354397eef723c`
- Statement SHA-256: `38109376c32c184d71130b0914dad936566b85dd3c8aa7545c9019b28e6d911f`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000126_feasible_preserved__aa1208dfb32e.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 202–216; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem feasible_preserved : forall (o : concrete_op) (s s' : state) (u d : Z),
  in_feasible_region s u d ->
  state_valid s ->
  concrete_apply o s = Some s' ->
  op_delta o >= 0 ->
  in_feasible_region s' u d.
Proof.
  intros o s s' u d Hfeas Hvalid Happ Hdelta.
  unfold in_feasible_region, recoverable, event_horizon in *.
  simpl in *.
  unfold concrete_apply in Happ.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion Happ; subst. simpl. lia.
Qed.
```

## 127. `feedforward_not_attributed`

- Kind: `Theorem`
- Code SHA-256: `17931f9628d345ae8663ec546cf157fa1ca00997413138c42bde2f61f1be32fe`
- Statement SHA-256: `0ada8f9cc92fa0a6c279167e6efd3e804b53130496913815a080c44446296737`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000127_feedforward_not_attributed__17931f9628d3.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 59–65; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem feedforward_not_attributed :
  forall S I, is_feedforward S -> ~Attribution S I.
Proof.
  intros S I Hff Hattr.
  destruct Hattr as [_ [H2 _]].
  exact (feedforward_fails_C2 S I Hff H2).
Qed.
```

## 128. `final_recoverability`

- Kind: `Theorem`
- Code SHA-256: `863854106807b44735b70482eb29314159410e87b844656e13fb1486b7519977`
- Statement SHA-256: `3f5346f5efff2079fdb76d7112ca44050dcb01af7e9476870fd044584dea720d`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000128_final_recoverability__863854106807.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 337–341; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem final_recoverability : forall h,
  event_horizon h > 0 <-> recoverable h.
Proof.
  intro h. unfold recoverable. tauto.
Qed.
```

## 129. `final_recoverability`

- Kind: `Theorem`
- Code SHA-256: `e0ab4f07cfe609ffb358650bca98d591b1d3bd816822b72a14eb5f18375983e6`
- Statement SHA-256: `3f5346f5efff2079fdb76d7112ca44050dcb01af7e9476870fd044584dea720d`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000129_final_recoverability__e0ab4f07cfe6.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 732–734; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem final_recoverability : forall h,
  event_horizon h > 0 <-> recoverable h.
Proof. intro h. unfold recoverable. tauto. Qed.
```

## 130. `full_independence`

- Kind: `Theorem`
- Code SHA-256: `301c004ea10ea56e442cc55aeb793bb04e8d88af48121e1c2db0c094c3d7d097`
- Statement SHA-256: `1e4b835dd2dd84f6783c2404e1766934d94157ab357a9312638a4f9582319fcc`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000130_full_independence__301c004ea10e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 995–1001; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem full_independence :
  forall b i,
    (bundle_verified b <-> bundle_verified b) /\
    (side_i_verified b i <-> side_i_verified b i).
Proof.
  intros. split; split; auto.
Qed.
```

## 131. `full_independence`

- Kind: `Theorem`
- Code SHA-256: `7cc346cf762824a093ceace6b9ba66af9d04e049ca23a63078e79dfd2725e2c1`
- Statement SHA-256: `d51ee764ba3519519b342103292ea6957601ec518e87aefa4a368891f36f6d26`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000131_full_independence__7cc346cf7628.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3089–3114; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem full_independence : forall S I,
  AdversarialSufficiency S I ->
  ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C1) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C2) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C3) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C5 ->
     matches_on M S I C4) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C4 ->
     matches_on M S I C5).
Proof.
  intros S I [HS1 [HS2 [HS3 [HS4 HS5]]]].
  repeat split.
  - exact (condition_independence_C1 S I HS1).
  - exact (condition_independence_C2 S I HS2).
  - exact (condition_independence_C3 S I HS3).
  - exact (condition_independence_C4 S I HS4).
  - exact (condition_independence_C5 S I HS5).
Qed.
```

## 132. `full_verify_and_apply_sound`

- Kind: `Lemma`
- Code SHA-256: `2e38bb58fa5d8b463ee22bf75655a70c698d52352fd07c8897c20a0e0efa627f`
- Statement SHA-256: `ed970339293313182562842934a087f48dc55e21dd2f4728a5d20884a9c12a73`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000132_full_verify_and_apply_sound__2e38bb58fa5d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1452–1464; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma full_verify_and_apply_sound :
  forall t s u d s',
    full_verify_and_apply t s u d = Some s' ->
    state_valid s /\ transformation_valid t /\
    horizon_check s u d = true /\ apply_transformation t s = Some s'.
Proof.
  intros t s u d s' H.
  unfold full_verify_and_apply in H.
  destruct (state_valid s) eqn:Hs; [|discriminate].
  destruct (transformation_valid t) eqn:Ht; [|discriminate].
  destruct (horizon_check s u d) eqn:Hh; [|discriminate].
  exact ⟨eq_true_intro Hs, eq_true_intro Ht, Hh, H⟩.
Qed.
```

## 133. `full_verify_total`

- Kind: `Theorem`
- Code SHA-256: `c0687c34998eec1c0d71cdaa7474c3a14c13d64821b4141c24c5a7be455a6d0c`
- Statement SHA-256: `d62747f816eab4c52f2c091b3f348c366aa6d914bcbe5e12262a593e185d9f61`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000133_full_verify_total__c0687c34998e.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 617–629; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem full_verify_total : forall o s u d,
  exists s' r, full_verify_and_apply o s u d = Some (s', r).
Proof.
  intros. unfold full_verify_and_apply.
  destruct (verify_state s) eqn:Ev;
  try (eexists; eexists; reflexivity).
  destruct (horizon_check s u d) eqn:Eh;
  try (eexists; eexists; reflexivity).
  destruct (verified_apply o s) eqn:Ea;
  try (eexists; eexists; reflexivity).
  destruct (all_universal_invariants _);
  eexists; eexists; reflexivity.
Qed.
```

## 134. `graph_is_pressure`

- Kind: `Example`
- Code SHA-256: `97dd38d407cd2bb8eae23c7940ea25a7e8f303da2df9f997dad992381f5b03f4`
- Statement SHA-256: `f1dd93111a13b4bbfa4c011c86950c60758ac8563a495f3124f45495416f1700`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000134_graph_is_pressure__97dd38d407cd.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 4040–4046; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Example graph_is_pressure :
  pressure_candidate sample_root_graph.
Proof.
  unfold pressure_candidate, sample_root_graph.
  simpl.
  reflexivity.
Qed.
```

## 135. `gress_core_eligible_demo`

- Kind: `Example`
- Code SHA-256: `a4ead512a9221f7937708656cfa0e4598dd09bf202d33f19a61a308890fec98a`
- Statement SHA-256: `14fde1589a279bb9a4a3ef45d7937a2b9060ce8b7329b80b4110c2508857363f`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000135_gress_core_eligible_demo__a4ead512a922.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5145–5150; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example gress_core_eligible_demo :
  core_eligible demo20_state R_gress.
Proof.
  unfold core_eligible, tier_of, clarity_ok, drift_ok, support_ok, split_of, demo20_state.
  simpl. repeat split; try reflexivity; lia.
Qed.
```

## 136. `gress_is_core_candidate`

- Kind: `Example`
- Code SHA-256: `f5e7ac34a09a5b68c20f745e49ff601627944e12bfef724d547df86e9b0723bc`
- Statement SHA-256: `457f3c00db4bb1584226762d9886e0b36d0b9f4aabef62f99e2e1d79bb7d9640`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000136_gress_is_core_candidate__f5e7ac34a09a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 4032–4038; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Example gress_is_core_candidate :
  core_candidate sample_registry sample_root_gress.
Proof.
  unfold core_candidate, root_score_ok, operator_support_ok.
  simpl.
  repeat split; lia || reflexivity.
Qed.
```

## 137. `hamiltonian_not_attributed`

- Kind: `Theorem`
- Code SHA-256: `a7a628d7ffda5ae50caa7c24015d1a5abe4a136c23ec88f5857885df05ba83d1`
- Statement SHA-256: `651a1891e5473c65c9fed3d958a94cbd476c1bf60d85579630d9a36ff306d65b`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000137_hamiltonian_not_attributed__a7a628d7ffda.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 46–52; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem hamiltonian_not_attributed :
  forall S I, is_hamiltonian S -> ~Attribution S I.
Proof.
  intros S I Hham Hattr.
  destruct Hattr as [_ [_ [_ [H4 _]]]].
  exact (hamiltonian_fails_C4 S I Hham H4).
Qed.
```

## 138. `horizon_check_fail`

- Kind: `Theorem`
- Code SHA-256: `323bb3805cf8b4bc5296e919e64b6738c980339894cc1f27f654c998d10d8403`
- Statement SHA-256: `058373acf2d1bbd91605e6ad8b7126deba316411e314dced279bdd08fe460d37`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000138_horizon_check_fail__323bb3805cf8.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 487–494; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem horizon_check_fail : forall s u d,
  horizon_check s u d = false ->
  unrecoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H.
  unfold unrecoverable, event_horizon. simpl.
  apply Z.ltb_ge in H. lia.
Qed.
```

## 139. `horizon_check_fail`

- Kind: `Theorem`
- Code SHA-256: `a0ad5ff612c190b74cd617c0431ffc39458566e86cf179f724ac0bb11cc04ae2`
- Statement SHA-256: `058373acf2d1bbd91605e6ad8b7126deba316411e314dced279bdd08fe460d37`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000139_horizon_check_fail__a0ad5ff612c1.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 111–117; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem horizon_check_fail : forall s u d,
  horizon_check s u d = false ->
  unrecoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H. unfold unrecoverable, event_horizon. simpl.
  apply Z.ltb_ge in H. lia.
Qed.
```

## 140. `horizon_check_sound`

- Kind: `Theorem`
- Code SHA-256: `16da3d2ccfbafcd28379f755db5958080ee60c96a1a5fd0fe0b0fc1e1554d02c`
- Statement SHA-256: `50429970ae91a18cb6b65512a715112500b99d653a698a0043ea636f5034000a`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000140_horizon_check_sound__16da3d2ccfba.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 102–108; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem horizon_check_sound : forall s u d,
  horizon_check s u d = true ->
  recoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H. unfold recoverable, event_horizon. simpl.
  apply Z.ltb_lt in H. lia.
Qed.
```

## 141. `horizon_check_sound`

- Kind: `Theorem`
- Code SHA-256: `307fdb7fbfc12fc05f850c9e6b5fbe8bb7d9cdd88ac543f4e79bb5a31e19b0f5`
- Statement SHA-256: `50429970ae91a18cb6b65512a715112500b99d653a698a0043ea636f5034000a`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000141_horizon_check_sound__307fdb7fbfc1.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 478–485; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem horizon_check_sound : forall s u d,
  horizon_check s u d = true ->
  recoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H.
  unfold recoverable, event_horizon. simpl.
  apply Z.ltb_lt in H. lia.
Qed.
```

## 142. `in_root_ids_intro`

- Kind: `Lemma`
- Code SHA-256: `06586984c47bf45e7d4b485b5c05eb6f0e2be3fe4d376f26c6835dacee4e11d6`
- Statement SHA-256: `279a03123bbab7f0a969fb4fa604fc3a4222d1baaa91e9d141c5db9a5ea145e9`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000142_in_root_ids_intro__06586984c47b.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3882–3890; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma in_root_ids_intro :
  forall (R : Registry) (r : RootSig),
    In r (roots R) -> In (rid r) (root_ids R).
Proof.
  intros R r Hr.
  unfold root_ids.
  apply in_map.
  exact Hr.
Qed.
```

## 143. `insert_kv_preserves_length`

- Kind: `Lemma`
- Code SHA-256: `afe0200103c6504a773bb063d070bb9d0667fdcdc11235a257846706f7c5188a`
- Statement SHA-256: `348690008f63f2bf4fc1c1c1ef84c93a56b549aba6d850d8344e94920aa1d848`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000143_insert_kv_preserves_length__afe0200103c6.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 324–332; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Lemma insert_kv_preserves_length :
  forall kv kvs, length (insert_kv kv kvs) = S (length kvs).
Proof.
  intros kv kvs. induction kvs as [| kv2 rest IH].
  - simpl. reflexivity.
  - simpl. destruct (Nat.leb (fst kv) (fst kv2)).
    + simpl. reflexivity.
    + simpl. rewrite IH. reflexivity.
Qed.
```

## 144. `integrity_not_implies_boundary`

- Kind: `Theorem`
- Code SHA-256: `023a5dd684968e596f6f6d33c93a884b64e3c7212a95754f0e093087b7465bc0`
- Statement SHA-256: `763a6a04f6fba597eeffe48aa968a2e867a539c74423d1f4106d4b67f274e396`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000144_integrity_not_implies_boundary__023a5dd68496.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 667–672; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem integrity_not_implies_boundary :
  (exists s, passes_integrity s /\ ~passes_boundary s) ->
  ~(forall s, passes_integrity s -> passes_boundary s).
Proof.
  intros [s [Hi Hnb]] Hall. apply Hnb. apply Hall. exact Hi.
Qed.
```

## 145. `invalid_witness_invalidates`

- Kind: `Theorem`
- Code SHA-256: `43ae9c5017f82216dcaa2d28e91dc99b67852275000edc7caeb6c4361d2615ba`
- Statement SHA-256: `04ae6f75fc25975a31700ae675c773ad25be60ec16d8200f717c5f510a1686eb`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000145_invalid_witness_invalidates__43ae9c5017f8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1040–1047; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem invalid_witness_invalidates :
  forall w ws root,
    witness_sig_valid w root = false ->
    all_witnesses_valid (w :: ws) root = false.
Proof.
  intros w ws root Hinv.
  unfold all_witnesses_valid. simpl. rewrite Hinv. simpl. reflexivity.
Qed.
```

## 146. `ledgerO8_length`

- Kind: `Theorem`
- Code SHA-256: `ef3e767bb2ce99b97226218492db5356d02548abf3e4d3b083b2ee8df1c34b56`
- Statement SHA-256: `f549729928144e6d34493a07dd9e6f7e4c01262c7f2a4e361dd9cd29705aba2d`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000146_ledgerO8_length__ef3e767bb2ce.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2195–2196; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem ledgerO8_length : length ledgerO8 = 1232.
Proof. reflexivity. Qed.
```

## 147. `ledgerOExt_length`

- Kind: `Theorem`
- Code SHA-256: `eef971f71b0da34a2e7ec8f070d24246d8c52f0233fcc9b2889d98f64f276050`
- Statement SHA-256: `be295c96ab5780fba705630c9ba31a82c2eb65dab7a1ad4bbb334e068fb228b2`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000147_ledgerOExt_length__eef971f71b0d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2198–2199; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem ledgerOExt_length : length ledgerOExt = 2464.
Proof. reflexivity. Qed.
```

## 148. `lineage_deterministic`

- Kind: `Theorem`
- Code SHA-256: `cbf78cfbead5b861c0aa6e48f099c93b8e0e96a9e091f1d63e36e0590448e499`
- Statement SHA-256: `3b29d5e6a57a12bec7db48a2130a2f437eb8435be29c5b356d47ffd51faccf70`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000148_lineage_deterministic__cbf78cfbead5.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 764–772; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem lineage_deterministic :
  forall fuel visited bid,
    exists! o, verify_lineage_aux fuel visited bid = o.
Proof.
  intros. exists (verify_lineage_aux fuel visited bid).
  split.
  - reflexivity.
  - intros o' H. symmetry. exact H.
Qed.
```

## 149. `lineage_implies_boundary`

- Kind: `Theorem`
- Code SHA-256: `75fe8def77c8bc27b5d05c4e8874050b13c05f50b654ed799fb5b55210173666`
- Statement SHA-256: `1475aa5f4c6fee62a46e27f2cf141ef86b69b3366f74e5154c5e2fe70d30e886`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000149_lineage_implies_boundary__75fe8def77c8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 644–648; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem lineage_implies_boundary :
  forall s, passes_lineage s -> passes_boundary s.
Proof.
  intros s [Hi [Hb Hl]]. unfold passes_boundary. auto.
Qed.
```

## 150. `lineage_monotone`

- Kind: `Theorem`
- Code SHA-256: `52b933934381769763c081766ddfd67ebfda5a6fc907507ccd2e704339d73377`
- Statement SHA-256: `cc73ea6fb00b04758c0ff0a13120b048e58383fe58f62379c00be09793a60939`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000150_lineage_monotone__52b933934381.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 238–244; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem lineage_monotone : forall (o : concrete_op) (s s' : state),
  concrete_apply o s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  intros o s s' H.
  eapply (@apply_lineage_extends _ ConcreteOperator). exact H.
Qed.
```

## 151. `lineage_monotone`

- Kind: `Theorem`
- Code SHA-256: `8b7da1d3c653fd218f60755aec3d0488e05b1b71e7f21782bce332bcee37e610`
- Statement SHA-256: `cc73ea6fb00b04758c0ff0a13120b048e58383fe58f62379c00be09793a60939`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000151_lineage_monotone__8b7da1d3c653.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 587–590; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem lineage_monotone : forall (o : concrete_op) (s s' : state),
  concrete_apply o s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof. exact concrete_apply_lineage_step. Qed.
```

## 152. `lineage_not_implies_regulated`

- Kind: `Theorem`
- Code SHA-256: `9732025b0518c64eb8566905b4b991e620aa4344e3dcdefd172fdfeda0e15745`
- Statement SHA-256: `5ca5005affb328577b2a7d173cb43876a0ab53380a478303435c77804ba72fe8`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000152_lineage_not_implies_regulated__9732025b0518.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 681–686; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem lineage_not_implies_regulated :
  (exists s, passes_lineage s /\ ~passes_regulated s) ->
  ~(forall s, passes_lineage s -> passes_regulated s).
Proof.
  intros [s [Hl Hnr]] Hall. apply Hnr. apply Hall. exact Hl.
Qed.
```

## 153. `lineage_terminates`

- Kind: `Theorem`
- Code SHA-256: `3d48f9f32a171e3204cfea3cc31081bf31f0ff72a26e4cdb6999f855e8b840cb`
- Statement SHA-256: `2e9bb65f5ccd9ded4ed3c6c8702546c00567ee8a34903b011e754a7508a8a4c5`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000153_lineage_terminates__3d48f9f32a17.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 752–761; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem lineage_terminates :
  forall fuel visited bid,
    exists o, verify_lineage_aux fuel visited bid = o.
Proof.
  intros fuel. induction fuel as [| fuel' IH].
  - intros. exists LineageDepthExhausted. simpl. reflexivity.
  - intros visited bid. simpl.
    exists (verify_lineage_aux (S fuel') visited bid).
    reflexivity.
Qed.
```

## 154. `lookup_not_attributed`

- Kind: `Theorem`
- Code SHA-256: `f001d5ac7f9315e97dea30780f432c723f67b2e84fa10c1345912a2375030cc7`
- Statement SHA-256: `315d7193bce256c7c986bd2b3f1904bc02c870eb37e91bc05adc16fdbfee3560`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000154_lookup_not_attributed__f001d5ac7f93.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 85–91; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem lookup_not_attributed :
  forall S I, is_lookup_table S -> ~Attribution S I.
Proof.
  intros S I Hlt Hattr.
  destruct Hattr as [H1 _].
  exact (lookup_fails_C1 S I Hlt H1).
Qed.
```

## 155. `lyapunov_stability`

- Kind: `Theorem`
- Code SHA-256: `096ebaeb07fa2a3f75d980a2176c2e0227e983ab703188e5c1894897d9b9a2fa`
- Statement SHA-256: `b2844f49fe2218925913dd13ec4592bcc6f9460ada6ebc7b8f9282cfdaca22d4`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000155_lyapunov_stability__096ebaeb07fa.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 576–582; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem lyapunov_stability : forall chain s s',
  lyapunov_decreasing chain s ->
  apply_chain chain s = Some s' ->
  coh_budget s' > coh_budget s.
Proof.
  intros chain s s' Hdecr Happ. apply Hdecr. exact Happ.
Qed.
```

## 156. `lyapunov_stability`

- Kind: `Theorem`
- Code SHA-256: `1306e9d275d6700084ea1f41dc7a8f27056ea31d0d995ac46caa1d2ad6a05cc0`
- Statement SHA-256: `b2844f49fe2218925913dd13ec4592bcc6f9460ada6ebc7b8f9282cfdaca22d4`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000156_lyapunov_stability__1306e9d275d6.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 898–902; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem lyapunov_stability : forall chain s s',
  lyapunov_decreasing chain s ->
  apply_chain chain s = Some s' ->
  coh_budget s' > coh_budget s.
Proof. intros chain s s' H Happ. exact (H s' Happ). Qed.
```

## 157. `master_step_nonneg`

- Kind: `Theorem`
- Code SHA-256: `bb28e294aefc247cd2ba467e4efb07cf77abe9f2be8ebb7e0489ce0746f8bb61`
- Statement SHA-256: `d35ce3c310e457a9107e7c88bc1e2cc1d0ad310ff7293789d7c33bfa662122e8`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000157_master_step_nonneg__bb28e294aefc.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 325–332; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem master_step_nonneg : forall s id_t ag_t co_t po_t no_t cn_t,
  coh_budget s >= 0 ->
  id_t >= 0 -> ag_t >= 0 -> co_t >= 0 -> po_t >= 0 ->
  no_t <= coh_budget s -> cn_t <= 0 ->
  master_step s id_t ag_t co_t po_t no_t cn_t >= 0.
Proof.
  intros. unfold master_step. lia.
Qed.
```

## 158. `master_step_nonneg`

- Kind: `Theorem`
- Code SHA-256: `fee7cf71591605e90766d547f3670c8d7c0367bf846b28b9312368429b86d626`
- Statement SHA-256: `d35ce3c310e457a9107e7c88bc1e2cc1d0ad310ff7293789d7c33bfa662122e8`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000158_master_step_nonneg__fee7cf715916.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 725–730; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem master_step_nonneg : forall s id_t ag_t co_t po_t no_t cn_t,
  coh_budget s >= 0 ->
  id_t >= 0 -> ag_t >= 0 -> co_t >= 0 -> po_t >= 0 ->
  no_t <= coh_budget s -> cn_t <= 0 ->
  master_step s id_t ag_t co_t po_t no_t cn_t >= 0.
Proof. intros. unfold master_step. lia. Qed.
```

## 159. `monotone_contrapositive`

- Kind: `Theorem`
- Code SHA-256: `93243707755f8aa473a9f3624700aeabdc0bd0ea30373b0d1ad6e4da3a3694f7`
- Statement SHA-256: `9e4dbab2bb5f68c449026f7b1dbd02a799579f609066943fb0ec29806dc4a138`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000159_monotone_contrapositive__93243707755f.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2704–2710; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem monotone_contrapositive :
  forall S I, ~ SpoofBelow S I -> ~ SpoofBelow' S I.
Proof.
  intros S I Hfail Hpass.
  apply Hfail.
  exact (spoof_monotone S I Hpass).
Qed.
```

## 160. `monotone_hardening_C1`

- Kind: `Theorem`
- Code SHA-256: `c84456557028b43cf8389ebf9b763115bf2bae366d00127b5d8943a8f75ed39c`
- Statement SHA-256: `f57cd804461ea68bde0fe2f5765da19f32ab5756bfee1ea65fa9d4e05a1c1b5e`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000160_monotone_hardening_C1__c84456557028.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1625–1632; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem monotone_hardening_C1 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C1_in S I cls -> Spoofable_on_C1_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H2 [H3 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.
```

## 161. `monotone_hardening_C1`

- Kind: `Theorem`
- Code SHA-256: `f07e3f863f61fb98627367318361544b683377adbcb9640fa82e9f417f333ac0`
- Statement SHA-256: `8a07eaab7c6304721b6472ea73297ca4fd011890c2f5c251e1f37a7a99ba1085`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000161_monotone_hardening_C1__f07e3f863f61.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3132–3140; embedded `proofbundle_2026-05_4c5172d11ec15ee0_4c5172d11ec15ee0_000130_4c5172d11ec1_2026_04_01_relational_spoof.v`

```coq
Theorem monotone_hardening_C1 : forall S I cls cls',
  (forall M, cls M -> cls' M) ->
  Spoofable_on_C1_in S I cls ->
  Spoofable_on_C1_in S I cls'.
Proof.
  intros S I cls cls' Hsub [M [Hcls [Hm2 [Hm3 [Hm4 [Hm5 Hn1]]]]]].
  exists M.
  split; [exact (Hsub M Hcls) | repeat split; assumption].
Qed.
```

## 162. `monotone_hardening_C2`

- Kind: `Theorem`
- Code SHA-256: `d33de9b035255aef5ca03fa7e4b548537dcd9803801e25e51b390a38ca8b2a9c`
- Statement SHA-256: `54704200e277b57122517a2b95446a27881a356902aacbad8a682be470b20d9a`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000162_monotone_hardening_C2__d33de9b03525.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1634–1641; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem monotone_hardening_C2 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C2_in S I cls -> Spoofable_on_C2_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H3 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.
```

## 163. `monotone_hardening_C3`

- Kind: `Theorem`
- Code SHA-256: `1d95658ff2ff29bf76a2f0086b34c7740e9b45afef7fc379c28e5151786826be`
- Statement SHA-256: `49984d065378bbcf997ec2083ddb87bbf07954ffaad06a57ab4498078c7661d5`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000163_monotone_hardening_C3__1d95658ff2ff.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1643–1650; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem monotone_hardening_C3 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C3_in S I cls -> Spoofable_on_C3_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.
```

## 164. `monotone_hardening_C4`

- Kind: `Theorem`
- Code SHA-256: `cfe6854b395e7b09465bf99cef633ebfa5f0ff470ff70fc7b8da32579e1a19b8`
- Statement SHA-256: `317facaa94fdde73e12436ce7e286ccec1fb27e1dc8df0b5f1c1e96534e957b5`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000164_monotone_hardening_C4__cfe6854b395e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1652–1659; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem monotone_hardening_C4 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C4_in S I cls -> Spoofable_on_C4_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H3 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.
```

## 165. `monotone_hardening_C5`

- Kind: `Theorem`
- Code SHA-256: `b9e093564a00cac4d76ebf845d51cf7b73b46ab1fafce58235c2d61986818bd4`
- Statement SHA-256: `f4f00c07eb510c5cce34d273cd7eb649cfae7e02f4e2f56c8a07431547fc3663`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000165_monotone_hardening_C5__b9e093564a00.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1661–1668; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem monotone_hardening_C5 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C5_in S I cls -> Spoofable_on_C5_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H3 [H4 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.
```

## 166. `morpho_increases_coherence`

- Kind: `Theorem`
- Code SHA-256: `57c2172dc1e0cf585dbcd7a04e64bf3bb247fd2d90eecf3d2ce0d4705b9541d3`
- Statement SHA-256: `441768ff747ea8b01e88187663d3b1780036deb271878b6f831fa4a7e9361d54`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000166_morpho_increases_coherence__57c2172dc1e0.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 825–833; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem morpho_increases_coherence : forall m s s',
  morpho_valid m ->
  state_valid s ->
  concrete_apply (morpho_op m) s = Some s' ->
  coh_budget s' > coh_budget s.
Proof.
  intros m s s' [Hdelta Hmin] Hv Happ.
  rewrite (concrete_apply_coh _ s s' Happ). lia.
Qed.
```

## 167. `no_stuck_state`

- Kind: `Theorem`
- Code SHA-256: `9cb038265c074d8cf98ab69e23f637d082e8ea16a31f88a309493235ff4dbf48`
- Statement SHA-256: `36d5f9319a10220bafc04654cc3179be7edd1d685d3815d6637ae31c3c42c371`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000167_no_stuck_state__9cb038265c07.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 442–480; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem no_stuck_state :
  forall b c k,
    (exists o, verify b c k = o) /\
    (verify b c k = Verified \/
     verify b c k = Malformed \/
     verify b c k = InvalidSignature \/
     verify b c k = OutOfBounds \/
     verify b c k = UnknownVersion \/
     verify b c k = MissingSideInfo \/
     verify b c k = LineageInvalid \/
     verify b c k = ResourceExhausted \/
     verify b c k = PolicyDenied \/
     verify b c k = Indeterminate \/
     verify b c k = NotDefinedInVersion).
Proof.
  intros b c k.
  split.
  - exists (verify b c k). reflexivity.
  - unfold verify.
    destruct (stage1_parse b) as [|o1].
    + destruct (stage2_schema b) as [|o2].
      * destruct (stage3_version b) as [|o3].
        { destruct (stage4_digest b) as [|o4].
          { destruct (stage5_signature b k) as [|o5].
            { destruct (stage6_boundary b c) as [|o6].
              { destruct (stage7_lineage b) as [|o7].
                { destruct (stage8_policy b) as [|o8].
                  { destruct (stage9_side b) as [|o9].
                    { left. reflexivity. }
                    { destruct o9; auto 11. } }
                  { destruct o8; auto 11. } }
                { destruct o7; auto 11. } }
              { destruct o6; auto 11. } }
            { destruct o5; auto 11. } }
          { destruct o4; auto 11. } }
        { destruct o3; auto 11. }
      * destruct o2; auto 11.
    + destruct o1; auto 11.
Qed.
```

## 168. `normalize_enforces_min`

- Kind: `Theorem`
- Code SHA-256: `025151f4754a18d28e8f9ff05c38c70eec4189fdbcae444cb1e2a1f666e0a607`
- Statement SHA-256: `a0776bc82845dd34663c111b74a4801214892aac115f9cdabfad2b72471b2781`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000168_normalize_enforces_min__025151f4754a.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 548–556; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem normalize_enforces_min : forall s theta,
  theta >= 0 ->
  coh_budget (normalize s theta) >= theta.
Proof.
  intros s theta Htheta. unfold normalize.
  destruct (Z.ltb (coh_budget s) theta) eqn:E.
  - simpl. lia.
  - apply Z.ltb_ge in E. lia.
Qed.
```

## 169. `normalize_enforces_min`

- Kind: `Theorem`
- Code SHA-256: `b7ce784497b798da5096c7c0113713591be48a7f742294c7270b6416194efac6`
- Statement SHA-256: `b8eb7c0dd84c5e97c6e47720e2929df72366e9a9c43493a4a7b23beca23e0b63`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000169_normalize_enforces_min__b7ce784497b7.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 881–888; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem normalize_enforces_min : forall s theta,
  theta >= 0 -> coh_budget (normalize s theta) >= theta.
Proof.
  intros s theta Htheta. unfold normalize.
  destruct (Z.ltb (coh_budget s) theta) eqn:E.
  - simpl. lia.
  - apply Z.ltb_ge in E. lia.
Qed.
```

## 170. `normalize_preserves_id`

- Kind: `Theorem`
- Code SHA-256: `7e7c5078d238c14910b2111013ae5811e84fd3abf42abd4e2a6f43a76c3bb438`
- Statement SHA-256: `2f5626b0177cde6fe294d645a603fbd5d2ad5381efe5b3d7b41a7c698d760f56`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000170_normalize_preserves_id__7e7c5078d238.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 559–563; embedded `principia_2026-05_ab614c431c2dd6d4_ab614c431c2dd6d4_000219_ab614c431c2d_principia_1.v`

```coq
Theorem normalize_preserves_id : forall s theta,
  map prim_id (st_prims (normalize s theta)) = map prim_id (st_prims s).
Proof.
  intros. unfold normalize. destruct (Z.ltb _ _); simpl; reflexivity.
Qed.
```

## 171. `normalize_preserves_id`

- Kind: `Theorem`
- Code SHA-256: `96cadc28d1866bcb8ba2d176455b413045960e89c15a26b8b6437c60b62928c6`
- Statement SHA-256: `2f5626b0177cde6fe294d645a603fbd5d2ad5381efe5b3d7b41a7c698d760f56`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000171_normalize_preserves_id__96cadc28d186.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 890–892; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem normalize_preserves_id : forall s theta,
  map prim_id (st_prims (normalize s theta)) = map prim_id (st_prims s).
Proof. intros. unfold normalize. destruct (Z.ltb _ _); reflexivity. Qed.
```

## 172. `null_vs_negative`

- Kind: `Theorem`
- Code SHA-256: `6cf6ffe440c7536aaa846345b4eaa3a45147ad9edea8b1b177327381f4209082`
- Statement SHA-256: `12bcb3f16d1b7def08e36f0c9d809aea75a9507f3e169cbedf3574e6918ad211`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000172_null_vs_negative__6cf6ffe440c7.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1482–1485; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem null_vs_negative :
  NullStructurallyUnresolvable <> NonAttributionVerdict /\
  NullInsufficientlyTested     <> NonAttributionVerdict.
Proof. split; discriminate. Qed.
```

## 173. `null_vs_negative`

- Kind: `Theorem`
- Code SHA-256: `a69d5365c14df639d931854e476d865e8935afd6e9316555fcb27af103a0dd37`
- Statement SHA-256: `8e5e4f4e093e66ceb096cde3ab19689480cb75ef0455f7c321696e9a08954a9e`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/coq/000173_null_vs_negative__a69d5365c14d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2740–2745; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem null_vs_negative :
  NullStructurallyUnresolvable <> NonAttributionVerdict /\
  NullInsufficientlyTested <> NonAttributionVerdict.
Proof.
  split; discriminate.
Qed.
```

## 174. `null_vs_negative`

- Kind: `Theorem`
- Code SHA-256: `b4402e5fb1ce5020b616def0c0763f0170c6e815233889ed715aa38df6fafe48`
- Statement SHA-256: `d1b2cf7177cb21e906c2ab8b69a4fa8071333ff3ebc7614c02fa542212632ce4`
- Occurrences: 68
- Source statuses: `COMPLETED` × 28, `INCOMPLETE` × 40
- Extracted code file: `proof_code/completed/coq/000174_null_vs_negative__b4402e5fb1ce.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 91–93; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem null_vs_negative :
  INDETERMINATE <> UNWARRANTED.
Proof. congruence. Qed.
```

## 175. `op_admissible_dec`

- Kind: `Theorem`
- Code SHA-256: `c611a98b5655b3083fe4538841792f6623575e0996f4fc00a7bde92ef9687bdf`
- Statement SHA-256: `42779baaa1590a15550f078346190abec5c6250d3b2e6344f39d0f233db4bf91`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000175_op_admissible_dec__c611a98b5655.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1093–1101; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem op_admissible_dec : forall o s,
  { op_admissible o s } + { ~ op_admissible o s }.
Proof.
  intros o s. unfold op_admissible.
  destruct (Z_ge_dec (coh_budget s + op_delta o) 0) as [H1|H1];
  destruct (Z_ge_dec (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) as [H2|H2];
  try (left; split; assumption);
  right; intros [X1 X2]; tauto.
Qed.
```

## 176. `op_cost_assoc`

- Kind: `Lemma`
- Code SHA-256: `b7a2df1e61c4eb1d4a6b6ab2084e1bd839bb9637ba60fc77a4a58d93814414b5`
- Statement SHA-256: `eddf40cfcbdf30770ff46f1ac098fdbf925a5062d6482e3bb4363bf9001d8120`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000176_op_cost_assoc__b7a2df1e61c4.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1215–1218; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_cost_assoc : forall o1 o2 o3,
  op_cost (seq_op (seq_op o1 o2) o3) =
  op_cost (seq_op o1 (seq_op o2 o3)).
Proof. intros. unfold seq_op. simpl. lia. Qed.
```

## 177. `op_cost_id_left`

- Kind: `Lemma`
- Code SHA-256: `02efb6c19c2eb222fe64dd8c7bbdca4fd166b60ac925d8837c0f9a3ae10a809f`
- Statement SHA-256: `e0e4834a7e49c5aaa3adc5b17080cb8793939f44c713989a484852161a2fc8ee`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000177_op_cost_id_left__02efb6c19c2e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1207–1209; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_cost_id_left : forall o,
  op_cost (seq_op op_id o) = op_cost o.
Proof. intro o. unfold seq_op, op_id. simpl. reflexivity. Qed.
```

## 178. `op_cost_id_right`

- Kind: `Lemma`
- Code SHA-256: `995bdf7a7d8ce7ea8b18767628ba0ba19b9a2a5d3874e84af3f0392a8c116877`
- Statement SHA-256: `151406ef47df04f68dc005df63029e765db5c846992a3027f12116dfffddce04`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000178_op_cost_id_right__995bdf7a7d8c.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1211–1213; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_cost_id_right : forall o,
  op_cost (seq_op o op_id) = op_cost o.
Proof. intro o. unfold seq_op, op_id. simpl. lia. Qed.
```

## 179. `op_delta_assoc`

- Kind: `Lemma`
- Code SHA-256: `7f7b6554ff88b2502da2fe830ab001869abe602d6177e582d4e35b96abdc9c90`
- Statement SHA-256: `652b5707156a2b65786005d45caf2384c011324b8df447914f3b7d3a58d87d9c`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000179_op_delta_assoc__7f7b6554ff88.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1201–1204; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_delta_assoc : forall o1 o2 o3,
  op_delta (seq_op (seq_op o1 o2) o3) =
  op_delta (seq_op o1 (seq_op o2 o3)).
Proof. intros. unfold seq_op. simpl. lia. Qed.
```

## 180. `op_delta_id_left`

- Kind: `Lemma`
- Code SHA-256: `782ebd12ea2c54208fe84d00b98d36a9f281d12d17ca5e45b1263ed6157b2d62`
- Statement SHA-256: `bfcc8e6aafc767a8f200aed0e1355243339581fe6b7175576da55cf438538cdc`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000180_op_delta_id_left__782ebd12ea2c.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1191–1193; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_delta_id_left : forall o,
  op_delta (seq_op op_id o) = op_delta o.
Proof. intro o. unfold seq_op, op_id. simpl. lia. Qed.
```

## 181. `op_delta_id_right`

- Kind: `Lemma`
- Code SHA-256: `f09ac47736aae62c95d2fba2b05e5d5d54b396124ea48e3cf7f1b09d78c69f4f`
- Statement SHA-256: `8c40768afc3f455b5757f2913e813515a506bd8da62d0ff56104d2ad991fa308`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000181_op_delta_id_right__f09ac47736aa.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1196–1198; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Lemma op_delta_id_right : forall o,
  op_delta (seq_op o op_id) = op_delta o.
Proof. intro o. unfold seq_op, op_id. simpl. lia. Qed.
```

## 182. `op_id_left`

- Kind: `Theorem`
- Code SHA-256: `b9019365cb9e2a8a581cc21f200909b43ddd7d275716c3e99baa203831d4480c`
- Statement SHA-256: `95cf25c169871ad3682e5f807d5335e79fa987dea419ffff2c3029ba6fa308ff`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000182_op_id_left__b9019365cb9e.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 338–348; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem op_id_left : forall (o : concrete_op) (s : state),
  coh_budget s >= 0 ->
  forall s', seq_apply op_id o s = Some s' ->
    coh_budget s' = coh_budget s + op_delta o.
Proof.
  intros o s Hcoh s' H. unfold seq_apply in H.
  destruct (concrete_apply op_id s) as [sm|] eqn:Em; [|discriminate].
  assert (Hm : coh_budget sm = coh_budget s).
  { rewrite (concrete_apply_coh op_id s sm Em). simpl. lia. }
  rewrite (concrete_apply_coh o sm s' H). lia.
Qed.
```

## 183. `outcome_exclusive`

- Kind: `Theorem`
- Code SHA-256: `98240ba0c8a548a505110b73b60c0766cda02ffa947b580aae4ca448ef160e25`
- Statement SHA-256: `22e316c9547292d938a14c8b59b3058064771ee7053c5fd024bc1824cdee0c6d`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000183_outcome_exclusive__98240ba0c8a5.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 483–541; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem outcome_exclusive :
  Verified <> Malformed /\
  Verified <> InvalidSignature /\
  Verified <> OutOfBounds /\
  Verified <> UnknownVersion /\
  Verified <> MissingSideInfo /\
  Verified <> LineageInvalid /\
  Verified <> ResourceExhausted /\
  Verified <> PolicyDenied /\
  Verified <> Indeterminate /\
  Verified <> NotDefinedInVersion /\
  Malformed <> InvalidSignature /\
  Malformed <> OutOfBounds /\
  Malformed <> UnknownVersion /\
  Malformed <> MissingSideInfo /\
  Malformed <> LineageInvalid /\
  Malformed <> ResourceExhausted /\
  Malformed <> PolicyDenied /\
  Malformed <> Indeterminate /\
  Malformed <> NotDefinedInVersion /\
  InvalidSignature <> OutOfBounds /\
  InvalidSignature <> UnknownVersion /\
  InvalidSignature <> MissingSideInfo /\
  InvalidSignature <> LineageInvalid /\
  InvalidSignature <> ResourceExhausted /\
  InvalidSignature <> PolicyDenied /\
  InvalidSignature <> Indeterminate /\
  InvalidSignature <> NotDefinedInVersion /\
  OutOfBounds <> UnknownVersion /\
  OutOfBounds <> MissingSideInfo /\
  OutOfBounds <> LineageInvalid /\
  OutOfBounds <> ResourceExhausted /\
  OutOfBounds <> PolicyDenied /\
  OutOfBounds <> Indeterminate /\
  OutOfBounds <> NotDefinedInVersion /\
  UnknownVersion <> MissingSideInfo /\
  UnknownVersion <> LineageInvalid /\
  UnknownVersion <> ResourceExhausted /\
  UnknownVersion <> PolicyDenied /\
  UnknownVersion <> Indeterminate /\
  UnknownVersion <> NotDefinedInVersion /\
  MissingSideInfo <> LineageInvalid /\
  MissingSideInfo <> ResourceExhausted /\
  MissingSideInfo <> PolicyDenied /\
  MissingSideInfo <> Indeterminate /\
  MissingSideInfo <> NotDefinedInVersion /\
  LineageInvalid <> ResourceExhausted /\
  LineageInvalid <> PolicyDenied /\
  LineageInvalid <> Indeterminate /\
  LineageInvalid <> NotDefinedInVersion /\
  ResourceExhausted <> PolicyDenied /\
  ResourceExhausted <> Indeterminate /\
  ResourceExhausted <> NotDefinedInVersion /\
  PolicyDenied <> Indeterminate /\
  PolicyDenied <> NotDefinedInVersion /\
  Indeterminate <> NotDefinedInVersion.
Proof.
  repeat split; discriminate.
Qed.
```

## 184. `pipeline_coh_bound`

- Kind: `Theorem`
- Code SHA-256: `63f2284f0161870765c1fa83cab0f5eaa835a265e14c475a3c41bc81a2d05bc6`
- Statement SHA-256: `f0c3781499f36b13f279b730ce61cdeba81c5c22ee0e55577031e7ea8942aca1`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000184_pipeline_coh_bound__63f2284f0161.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 536–563; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem pipeline_coh_bound : forall s s' u d,
  state_valid s ->
  adaptive_pipeline s u d = Some s' ->
  coh_budget s' >= coh_budget s - 4 * concrete_eps.
Proof.
  intros s s' u d Hv H. unfold adaptive_pipeline in H.
  destruct (concrete_apply mk_denoise s)   as [s1|] eqn:E1; [|discriminate].
  destruct (concrete_apply mk_infer s1)    as [s2|] eqn:E2; [|discriminate].
  destruct (concrete_apply mk_reduce_u s2) as [s3|] eqn:E3; [|discriminate].
  assert (Hv1 : state_valid s1) by (eapply concrete_apply_closure_step; eauto).
  assert (Hv2 : state_valid s2) by (eapply concrete_apply_closure_step; eauto).
  assert (Hv3 : state_valid s3) by (eapply concrete_apply_closure_step; eauto).
  assert (B1 : coh_budget s1 >= coh_budget s  - concrete_eps)
    by (eapply concrete_apply_coh_bound_step; eauto).
  assert (B2 : coh_budget s2 >= coh_budget s1 - concrete_eps)
    by (eapply concrete_apply_coh_bound_step; eauto).
  assert (B3 : coh_budget s3 >= coh_budget s2 - concrete_eps)
    by (eapply concrete_apply_coh_bound_step; eauto).
  destruct (horizon_check s3 u d) eqn:Ehz.
  - assert (B4 : coh_budget s' >= coh_budget s3 - concrete_eps)
      by (eapply concrete_apply_coh_bound_step; eauto).
    lia.
  - (* horizon check false branch: H : (if false then ... else Some s3) = Some s' *)
    change ((if false then concrete_apply mk_reconstruct s3 else Some s3) = Some s')
      with (Some s3 = Some s') in H.
    assert (Heq : s3 = s') by (inversion H; reflexivity).
    rewrite <- Heq. unfold concrete_eps in *. lia.
Qed.
```

## 185. `pipeline_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `0f8329d5f9f90a262ecf21ba4bdb9d1197a1208f1eccaca8bc362a24c78bffec`
- Statement SHA-256: `93ea822375a41e595b27e0555f883db7d5a72079772c9c5e3c0183ea08e396d3`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000185_pipeline_id_preservation__0f8329d5f9f9.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 519–533; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem pipeline_id_preservation : forall s s' u d,
  adaptive_pipeline s u d = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros s s' u d H. unfold adaptive_pipeline in H.
  destruct (concrete_apply mk_denoise s)   as [s1|] eqn:E1; [|discriminate].
  destruct (concrete_apply mk_infer s1)    as [s2|] eqn:E2; [|discriminate].
  destruct (concrete_apply mk_reduce_u s2) as [s3|] eqn:E3; [|discriminate].
  assert (H1 : st_prims s1 = st_prims s)  by (apply concrete_apply_prims in E1; exact E1).
  assert (H2 : st_prims s2 = st_prims s1) by (apply concrete_apply_prims in E2; exact E2).
  assert (H3 : st_prims s3 = st_prims s2) by (apply concrete_apply_prims in E3; exact E3).
  destruct (horizon_check s3 u d) eqn:Ehz.
  - apply concrete_apply_prims in H. rewrite H, H3, H2, H1. reflexivity.
  - inversion H. subst. rewrite H3, H2, H1. reflexivity.
Qed.
```

## 186. `pipeline_id_preservation`

- Kind: `Theorem`
- Code SHA-256: `a827fea653fd68f39ef814a7543a3019ab3c95183b59293c7aad90eee19238f5`
- Statement SHA-256: `93ea822375a41e595b27e0555f883db7d5a72079772c9c5e3c0183ea08e396d3`
- Occurrences: 22
- Source statuses: `COMPLETED` × 22
- Extracted code file: `proof_code/completed/coq/000186_pipeline_id_preservation__a827fea653fd.v`
- Primary provenance: `12-concat_continuum_completed_22_files.v` lines 157–179; embedded `continuum_2026-05_ee7aa1985f4e46ce_ee7aa1985f4e46ce_000175_ee7aa1985f4e_continuum_2.v`

```coq
Theorem pipeline_id_preservation : forall s s' u d,
  adaptive_pipeline s u d = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros s s' u d H.
  unfold adaptive_pipeline in H.
  destruct (concrete_apply mk_denoise s) as [s1|] eqn:E1; [|discriminate].
  destruct (concrete_apply mk_infer s1) as [s2|] eqn:E2; [|discriminate].
  destruct (concrete_apply mk_reduce_u s2) as [s3|] eqn:E3; [|discriminate].
  assert (H1 : map prim_id (st_prims s1) = map prim_id (st_prims s))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  assert (H2 : map prim_id (st_prims s2) = map prim_id (st_prims s1))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  assert (H3 : map prim_id (st_prims s3) = map prim_id (st_prims s2))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  destruct (horizon_check s3 u d) eqn:Ehz.
  - (* reconstruction applied *)
    assert (H4 : map prim_id (st_prims s') = map prim_id (st_prims s3))
      by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
    rewrite H4, H3, H2, H1. reflexivity.
  - (* reconstruction skipped *)
    injection H as <-. rewrite H3, H2, H1. reflexivity.
Qed.
```

## 187. `possibility_preserved`

- Kind: `Lemma`
- Code SHA-256: `3b83d8aac42e232e50d9e6cb65150eb769198bc253a3d25195a8d49309d1c751`
- Statement SHA-256: `b5db2b71ad6c45cb44a9d46df9704cba30ab9517e546def543f80ac4abf879e7`
- Occurrences: 17
- Source statuses: `COMPLETED` × 17
- Extracted code file: `proof_code/completed/coq/000187_possibility_preserved__3b83d8aac42e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1336–1354; embedded `proofbundle_2026-05_0f053ce0a518a619_0f053ce0a518a619_000116_0f053ce0a518_2026_03_23_anachronegon_complete.v`

```coq
Lemma possibility_preserved :
  forall s s' (chain:op_chain),
    state_valid s ->
    apply_chain chain s = Some s' ->
    coh_budget s' > 0.
Proof.
  intros s s' chain Hvalid Hchain.
  induction chain as [|o ops IH] in s, s', Hvalid, Hchain |- *.
  - inversion Hchain; subst; simpl in *; lia.
  - simpl in Hchain.
    destruct (concrete_apply o s) as [s₁|] eqn:Ho; [|discriminate].
    assert (Hprims : st_prims s₁ = st_prims s) by (now rewrite concrete_apply_prims with (s':=s₁)).
    assert (Hvalid₁ : state_valid s₁).
    { split.
      + apply concrete_apply_coh_nonneg with (o:=o) (s:=s) (s':=s₁); assumption.
      + rewrite Hprims. now inversion Hvalid as [_ Hprim].
    }
    apply IH; assumption.
Qed.
```

## 188. `possibility_preserved`

- Kind: `Theorem`
- Code SHA-256: `c9e2ac6c2b48ca1f248bf105ab308b96fe3c111b327c3f158127702a7fbbdd16`
- Statement SHA-256: `3965414a9243220e646c5c990e7de1f69b856e92169a6d617c6fa471a4de5992`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000188_possibility_preserved__c9e2ac6c2b48.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 714–719; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem possibility_preserved : forall s s' chain,
  in_possibility_manifold s s' chain -> state_valid s'.
Proof.
  intros s s' chain [Hv [Hreach _]].
  eapply apply_chain_preserves_validity; eauto.
Qed.
```

## 189. `possibility_preserved_corrected`

- Kind: `Theorem`
- Code SHA-256: `da738721b64497365d114b0697e9861458d56a35ceed7fa6bf6ace1d6ea7ec67`
- Statement SHA-256: `af7f6ad4c52032d6e19efe049aded8f448db8a79e7344145dfe1e32457c7b886`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000189_possibility_preserved_corrected__da738721b644.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1287–1306; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem possibility_preserved_corrected :
  forall s s' chain,
    state_valid s ->
    apply_chain chain s = Some s' ->
    state_valid s'.
Proof.
  intros s s' chain. revert s s'.
  induction chain as [|o rest IH]; intros s s' Hv Happ.
  - simpl in Happ. inversion Happ. subst. exact Hv.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hv1 : state_valid s1).
    { unfold concrete_apply in E.
      destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
      destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
      inversion E. subst. unfold state_valid in *.
      destruct Hv as [_ Hpr]. apply Z.ltb_ge in G1. simpl.
      split; [lia|exact Hpr]. }
    eapply IH; eauto.
Qed.
```

## 190. `possibility_preserved_ORIGINAL_IS_FALSE`

- Kind: `Theorem`
- Code SHA-256: `70395ea1ba14b95103c0e23e369e4e533bd8c0625ad762bb7934ad25457183f4`
- Statement SHA-256: `2bb3bca7ca39b93642ec8ab5068e956278952da4cefe48c70c2307d8ca5a0439`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000190_possibility_preserved_ORIGINAL_IS_FALSE__70395ea1ba14.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1274–1282; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem possibility_preserved_ORIGINAL_IS_FALSE :
  ~ (forall s s' chain,
       in_possibility_manifold_original s s' chain ->
       state_valid s').
Proof.
  intros H. apply bad_state_invalid.
  apply (H bad_state bad_state []).
  apply bad_state_in_manifold.
Qed.
```

## 191. `pressure_candidate_tier`

- Kind: `Lemma`
- Code SHA-256: `ebfa354543e6ea1f7dc215f8761bd3b8f61b5c462d68d8e861087054f4e855d1`
- Statement SHA-256: `48f5c0faa3bbbdf3a730e0d4328da56ffd52cd6bc43d940e264d57e5e649f765`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000191_pressure_candidate_tier__ebfa354543e6.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3996–4003; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma pressure_candidate_tier :
  forall (r : RootSig),
    pressure_candidate r -> tier r = TierPressure.
Proof.
  intros r H.
  unfold pressure_candidate in H.
  exact H.
Qed.
```

## 192. `primary_independent_of_sides`

- Kind: `Theorem`
- Code SHA-256: `bd0565ac591ccbfaf7fc57da37ad1c0ce857f2fe2da5f23efd2c9844303763b1`
- Statement SHA-256: `546565789f596f2b11537e9770358ae2bf520f91d516cbb4594c787d41b01b97`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000192_primary_independent_of_sides__bd0565ac591c.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 962–969; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem primary_independent_of_sides :
  forall b i,
    bundle_verified b ->
    (side_i_verified b i \/ ~side_i_verified b i) ->
    bundle_verified b.
Proof.
  intros b i Hpri _. exact Hpri.
Qed.
```

## 193. `projection_idempotent_on_images`

- Kind: `Theorem`
- Code SHA-256: `447393909a4b5fedf2ab4776db6a888c9b1c94de167ac8362a509e598f1bbe90`
- Statement SHA-256: `0ff776b6abf14560a70b9547a9da37aa4bc24b0238cf2f3eacaa9db658bfb5f5`
- Occurrences: 6
- Source statuses: `COMPLETED` × 6
- Extracted code file: `proof_code/completed/coq/000193_projection_idempotent_on_images__447393909a4b.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2204–2206; embedded `proofbundle_2026-05_1cd3f1ff35870fb5_1cd3f1ff35870fb5_1cd3f1ff35870fb5_2026_03_26_operator_registry_kernel_5.v`

```coq
Theorem projection_idempotent_on_images :
  forall o, projects_to_o8 o = projects_to_o8 o.
Proof. intros; reflexivity. Qed.
```

## 194. `protocol_relativity`

- Kind: `Theorem`
- Code SHA-256: `94d67a0082fce1464705b5c5b3adff7102deb7f6f3eb320c2d39ea92d846732f`
- Statement SHA-256: `ec60394b73393b7d98ba4acfc9bb9cefdad0a8f3d2987f8a334221f132f3d1cc`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000194_protocol_relativity__94d67a0082fc.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1684–1690; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem protocol_relativity :
  exists f : bool -> VerdictType,
    f true <> f false.
Proof.
  exists protocol_relativity_witness.
  unfold protocol_relativity_witness. discriminate.
Qed.
```

## 195. `protocol_relativity_strong`

- Kind: `Theorem`
- Code SHA-256: `f115a8388fbbf61c6d80c2e0dc3c7872e55a3be35ca7f5f108ed8b97e45588dd`
- Statement SHA-256: `a41b1892b3e1ce5da4794c73397ef27c5125a06effa4ae22975c1a06416e654c`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000195_protocol_relativity_strong__f115a8388fbb.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1694–1701; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem protocol_relativity_strong :
  forall v1 v2 : VerdictType, v1 <> v2 ->
  exists f : bool -> VerdictType, f true = v1 /\ f false = v2.
Proof.
  intros v1 v2 Hneq.
  exists (fun b : bool => if b then v1 else v2).
  split; reflexivity.
Qed.
```

## 196. `protocol_relativity_witness`

- Kind: `Lemma`
- Code SHA-256: `bd3b2a3e1ea441640e653b031ffceec90c3fa43558b4e5756763b0332e3007f6`
- Statement SHA-256: `29e7a190a0628b9ec2c89ddfd482c136b8c44d6417bade37c9fc31086806f77e`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/coq/000196_protocol_relativity_witness__bd3b2a3e1ea4.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2750–2756; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Lemma protocol_relativity_witness :
  exists (f : bool -> VerdictType),
    f true <> f false.
Proof.
  exists (fun b => if b then AttributionVerdict else NonAttributionVerdict).
  discriminate.
Qed.
```

## 197. `recoverability_decidable`

- Kind: `Theorem`
- Code SHA-256: `744b577340af59cecb7ecdabb234ff022f1425f3251b97ac0bcf521ab23304a9`
- Statement SHA-256: `901137a2415e24ee907520f38d98985569545269e52c5dde146922d1e2d76dbb`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000197_recoverability_decidable__744b577340af.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3668–3673; embedded `proofbundle_2026-05_5f45d30cdb3796d3_5f45d30cdb3796d3_000194_5f45d30cdb37_kernel_1.v`

```coq
Theorem recoverability_decidable : forall h,
  recoverable h \/ unrecoverable h.
Proof.
  intro h. unfold recoverable, unrecoverable.
  lia.
Qed.
```

## 198. `recoverability_decidable`

- Kind: `Theorem`
- Code SHA-256: `9b9329b9467bc0e3949f199ce2e130f999f32d210e6beafdd173e3a83a234138`
- Statement SHA-256: `901137a2415e24ee907520f38d98985569545269e52c5dde146922d1e2d76dbb`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000198_recoverability_decidable__9b9329b9467b.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 187–189; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem recoverability_decidable : forall h,
  recoverable h \/ unrecoverable h.
Proof. intro h. unfold recoverable, unrecoverable. lia. Qed.
```

## 199. `recoverability_exclusive`

- Kind: `Theorem`
- Code SHA-256: `ac5672a11f69356f19398365b4c1a160db36808dcbee9c801263a191773835fe`
- Statement SHA-256: `01f1d265582ed48a8fb1f1f33553d151387cba3418a6ea5d9d0879d072be5334`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000199_recoverability_exclusive__ac5672a11f69.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 191–193; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem recoverability_exclusive : forall h,
  ~ (recoverable h /\ unrecoverable h).
Proof. intro h. unfold recoverable, unrecoverable. lia. Qed.
```

## 200. `recoverability_exclusive`

- Kind: `Theorem`
- Code SHA-256: `d22080672ad8b2ab786c6543ca66c57984536253acad47514352361b25b76231`
- Statement SHA-256: `01f1d265582ed48a8fb1f1f33553d151387cba3418a6ea5d9d0879d072be5334`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000200_recoverability_exclusive__d22080672ad8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3675–3679; embedded `proofbundle_2026-05_5f45d30cdb3796d3_5f45d30cdb3796d3_000194_5f45d30cdb37_kernel_1.v`

```coq
Theorem recoverability_exclusive : forall h,
  ~ (recoverable h /\ unrecoverable h).
Proof.
  intro h. unfold recoverable, unrecoverable. lia.
Qed.
```

## 201. `recovery_manifold_open`

- Kind: `Theorem`
- Code SHA-256: `92732879e604394caea00d00508c46ce7fffeb7aaad3442430e6121c009a6ddc`
- Statement SHA-256: `ecb90ac4a95442c9345d81a13134f6d1b0ef8739879c1e086d2f177f60e78818`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000201_recovery_manifold_open__92732879e604.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 800–812; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem recovery_manifold_open : forall s theta_rec kappa_max,
  in_recovery_manifold s theta_rec kappa_max ->
  coh_budget s > theta_rec + 1 ->
  forall o s', concrete_apply o s = Some s' ->
    op_delta o >= -1 ->
    in_recovery_manifold s' theta_rec (S kappa_max).
Proof.
  intros s theta_rec kappa_max [Hcoh Hkappa] Hmargin o s' Happ Hdelta.
  unfold in_recovery_manifold.
  split.
  - rewrite (concrete_apply_coh o s s' Happ). lia.
  - apply concrete_apply_step_succ in Happ. lia.
Qed.
```

## 202. `registry_wf_add_cell`

- Kind: `Lemma`
- Code SHA-256: `b5ff1e6f3b7df838098e79612ffdece55fa9e7b230c3dcb9db4279e92cb7ef99`
- Statement SHA-256: `5383911d47a30c154bdcad18cc6c250480c7c4958a569b6fedee30e8e90366c0`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000202_registry_wf_add_cell__b5ff1e6f3b7d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3947–3962; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma registry_wf_add_cell :
  forall (R : Registry) (c : Cell),
    registry_wf R ->
    root_exists R (cell_root c) ->
    registry_wf (add_cell R c).
Proof.
  intros R c [Hnodup Hcells] Hroot.
  unfold registry_wf in *.
  split.
  - exact Hnodup.
  - unfold add_cell.
    simpl.
    constructor.
    + exact Hroot.
    + exact Hcells.
Qed.
```

## 203. `registry_wf_add_root`

- Kind: `Lemma`
- Code SHA-256: `7588bfea2b46f1bb1bcbc7162a349392893dba4b527ff202dcc707a62c654f57`
- Statement SHA-256: `68474399e83bca883808bae0207db269e437f9c39f67dcf3db69367abc28e0cb`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000203_registry_wf_add_root__7588bfea2b46.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3928–3945; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma registry_wf_add_root :
  forall (R : Registry) (r : RootSig),
    registry_wf R ->
    ~ In (rid r) (root_ids R) ->
    registry_wf (add_root R r).
Proof.
  intros R r [Hnodup Hcells] Hfresh.
  unfold registry_wf in *.
  unfold add_root, root_ids in *.
  simpl.
  split.
  - constructor; assumption.
  - eapply Forall_impl.
    2: exact Hcells.
    intros c Hc.
    apply root_exists_mono_add_root.
    exact Hc.
Qed.
```

## 204. `regulated_implies_integrity`

- Kind: `Theorem`
- Code SHA-256: `d9a99d819a107bd4002b1dac358068ceabdd559370b259602a18e34efac23853`
- Statement SHA-256: `c21c1bba876b593b1fc2433f130748b2e1e0817f98781ee9e0f2a083bfd8cddc`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000204_regulated_implies_integrity__d9a99d819a10.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 656–664; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem regulated_implies_integrity :
  forall s, passes_regulated s -> passes_integrity s.
Proof.
  intros s H.
  apply boundary_implies_integrity.
  apply lineage_implies_boundary.
  apply regulated_implies_lineage.
  exact H.
Qed.
```

## 205. `regulated_implies_lineage`

- Kind: `Theorem`
- Code SHA-256: `2a1d1cfec963ea594729efa9db451d4dcb9377e533b49f54ab24703a337fcd1e`
- Statement SHA-256: `2789b7f6c19bf2a41b8ab13abcce2ded1171ffb389835373a3b6ae5418a44423`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000205_regulated_implies_lineage__2a1d1cfec963.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 638–642; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem regulated_implies_lineage :
  forall s, passes_regulated s -> passes_lineage s.
Proof.
  intros s [Hi [Hb [Hl Hr]]]. unfold passes_lineage. auto.
Qed.
```

## 206. `replay_not_attributed`

- Kind: `Theorem`
- Code SHA-256: `be8d40c11490e8d314b8bb68da9a2d90d3542139b766426ff7bd3756eab671f0`
- Statement SHA-256: `805ba99f910001e246132a9313921ebe41422ae22c0fd841ac130c681f9cf84b`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000206_replay_not_attributed__be8d40c11490.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 98–104; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem replay_not_attributed :
  forall S I, is_replay S -> ~Attribution S I.
Proof.
  intros S I Hrp Hattr.
  destruct Hattr as [_ [_ [_ [_ H5]]]].
  exact (replay_fails_C5 S I Hrp H5).
Qed.
```

## 207. `root_exists_add_root_self`

- Kind: `Lemma`
- Code SHA-256: `9d5d78fda644494d203fbe064faf2d649c93d040a88b32c16e21435f5f936f6a`
- Statement SHA-256: `dc270efacd9183784d375f19256f3593d6216e606245c115c0a961e87ebfe6ec`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000207_root_exists_add_root_self__9d5d78fda644.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3904–3913; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma root_exists_add_root_self :
  forall (R : Registry) (r : RootSig),
    root_exists (add_root R r) (rid r).
Proof.
  intros R r.
  unfold root_exists, add_root.
  simpl.
  exists r.
  split; [left; reflexivity | reflexivity].
Qed.
```

## 208. `root_exists_mono_add_root`

- Kind: `Lemma`
- Code SHA-256: `cf35dfe45f68e2dc14017762cbc1f14629aca8528d519a3e858c130c40cd4c9b`
- Statement SHA-256: `c8b51ccacc2e36c14f19a163d3b5d1af0d3fd09a78bc076dc511492d9b05659f`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000208_root_exists_mono_add_root__cf35dfe45f68.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3915–3926; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma root_exists_mono_add_root :
  forall (R : Registry) (r : RootSig) (i : nat),
    root_exists R i -> root_exists (add_root R r) i.
Proof.
  intros R r i H.
  unfold root_exists in *.
  destruct H as [r0 [Hin Heq]].
  exists r0.
  unfold add_root.
  simpl.
  split; [right; exact Hin | exact Heq].
Qed.
```

## 209. `root_valid`

- Kind: `Theorem`
- Code SHA-256: `b30a70be5e8de664a74523b8c923bcdd75e68bd606c15c7eb2cce48ecb597236`
- Statement SHA-256: `ef8dde4b352704e526623266bcaf9ead58a88a869e653c27d75c789e6064d0f0`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000209_root_valid__b30a70be5e8d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 802–817; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem root_valid :
  forall fuel visited bid,
    parents bid = [] ->
    digest_ok bid = true ->
    ~In bid visited ->
    verify_lineage_aux (S fuel) visited bid = LineageValid.
Proof.
  intros fuel visited bid Hparents Hdigest Hnotin. simpl.
  destruct (existsb (fun v => if BundleID_eq_dec v bid then true else false) visited) eqn:Hex.
  - exfalso. apply Hnotin. rewrite existsb_exists in Hex.
    destruct Hex as [x [Hxin Hxeq]].
    destruct (BundleID_eq_dec x bid) as [Heq|Hneq].
    + subst. exact Hxin.
    + discriminate Hxeq.
  - rewrite Hdigest. simpl. rewrite Hparents. simpl. reflexivity.
Qed.
```

## 210. `sample_gress_support_count`

- Kind: `Example`
- Code SHA-256: `ca790ed9bc4ed019831614670259c24a23eb92498b0e6d503a75db367172baf3`
- Statement SHA-256: `1b8a7e878c5d76dfb672fe4efef0958de848bd87e9bc28ebcc1bb30b46e09ef4`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000210_sample_gress_support_count__ca790ed9bc4e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 4026–4030; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Example sample_gress_support_count :
  support_count sample_registry 1 = 4.
Proof.
  reflexivity.
Qed.
```

## 211. `scend_core_eligible_demo`

- Kind: `Example`
- Code SHA-256: `2ec028aab2a83b9c77e4120e0157c0c4f55e862cde1c7549ae8a58a4d1de349b`
- Statement SHA-256: `2b8118363aad1ce6326324c2864bd1818c3f138987aa7d448dc4c32e79624aff`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000211_scend_core_eligible_demo__2ec028aab2a8.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5152–5157; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Example scend_core_eligible_demo :
  core_eligible demo20_state R_scend.
Proof.
  unfold core_eligible, tier_of, clarity_ok, drift_ok, support_ok, split_of, demo20_state.
  simpl. repeat split; try reflexivity; lia.
Qed.
```

## 212. `score_insufficiency`

- Kind: `Theorem`
- Code SHA-256: `81a51916eb9f6ca10743dc63c05df9de22190cd3063dd2f234557740b39a1bd9`
- Statement SHA-256: `1ffd4668acef06464a8e75d9b784a94c983dfec8ae39b8c7d7bc21137dedd184`
- Occurrences: 1
- Source statuses: `COMPLETED` × 1
- Extracted code file: `proof_code/completed/coq/000212_score_insufficiency__81a51916eb9f.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 41058–41067; embedded `gpx_consciousness_2026-05_9062be4f4a914483_consciousness_criterion_five_state_coq.v`

```coq
Theorem score_insufficiency :
  forall S I,
    CertAboveTheta S I ->
    (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
    ~ WarrantedAttribution S I.
Proof.
  intros S I _Hcert Hfail.
  apply conjunctive_blocking.
  exact Hfail.
Qed.
```

## 213. `score_insufficiency`

- Kind: `Theorem`
- Code SHA-256: `94fac41b2ecfefd0cf1a4efc3f47e50ad96bb8b0ea92b055371b645fff907ab0`
- Statement SHA-256: `df940d9feb9a0cb48efb43db18eceb53a95a1b85989f614d8a563884ddaf2a9b`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000213_score_insufficiency__94fac41b2ecf.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2629–2636; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem score_insufficiency :
  forall S I,
  CertAboveTheta S I -> ~ C1 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC1 Hattr.
  destruct Hattr as [H1 _].
  exact (HnC1 H1).
Qed.
```

## 214. `score_insufficiency`

- Kind: `Theorem`
- Code SHA-256: `9e92869c8006995194e71dd607a820d5536c92a3bbf8a4ebb161479a01ce1276`
- Statement SHA-256: `3c0e6c6ad3a46c6e1a3dafbbda54efce65189d8fcb735018c52906bcd97dfc53`
- Occurrences: 28
- Source statuses: `COMPLETED` × 28
- Extracted code file: `proof_code/completed/coq/000214_score_insufficiency__9e92869c8006.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 65–72; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem score_insufficiency :
  forall s i,
    Cert s i ->
    (~C1 s i \/ ~C2 s i \/ ~C3 s i \/ ~C4 s i \/ ~C5 s i) ->
    ~Attribution s i.
Proof.
  intros. apply conjunctive_blocking. assumption.
Qed.
```

## 215. `score_insufficiency`

- Kind: `Theorem`
- Code SHA-256: `e3b9d246e2ba95159b3a5e552e559d380e315b577a2503fd2f0728bbc934cfba`
- Statement SHA-256: `8208dcb886c059d63a6ee9489b8aef0792eb2b7944b60b321c6942e38545bbd3`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000215_score_insufficiency__e3b9d246e2ba.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1429–1435; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem score_insufficiency :
    forall S I,
      CertAboveTheta S I -> ~ C1 S I -> ~ Attribution S I.
  Proof.
    intros S I _ HnC1 Hattr.
    destruct Hattr as [H1 _]. exact (HnC1 H1).
  Qed.
```

## 216. `score_insufficiency_C2`

- Kind: `Theorem`
- Code SHA-256: `43e54b0561cd7995fc2bc57f2bc8a4fd2499d68e4288b47dac9672625e727c89`
- Statement SHA-256: `1e083f49e804ba7d0a28ed21666bbd20c3f2fe1de81eba2fcc789083d9748e45`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000216_score_insufficiency_C2__43e54b0561cd.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1437–1439; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem score_insufficiency_C2 :
    forall S I, CertAboveTheta S I -> ~ C2 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [H2 _]]. exact (Hn H2). Qed.
```

## 217. `score_insufficiency_c2`

- Kind: `Theorem`
- Code SHA-256: `49c438e40e86a272937649f283f5439fd2a4b7d756f6621512d97d302ddc04a4`
- Statement SHA-256: `fe17cb9153efe42daa3907ce9363fa33f99324a2951208adfcf9b5d1462b2a1c`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000217_score_insufficiency_c2__49c438e40e86.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2639–2646; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem score_insufficiency_c2 :
  forall S I,
  CertAboveTheta S I -> ~ C2 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC2 Hattr.
  destruct Hattr as [_ [H2 _]].
  exact (HnC2 H2).
Qed.
```

## 218. `score_insufficiency_C3`

- Kind: `Theorem`
- Code SHA-256: `0feb9376f3009d9fd70b27cf755ad89b66b083b77242547ecda52e150e849e34`
- Statement SHA-256: `c220c0a534f99eab50018e258ef0dcdd3abacc56458fdc3c56aeb13de1f2eba3`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000218_score_insufficiency_C3__0feb9376f300.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1441–1443; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem score_insufficiency_C3 :
    forall S I, CertAboveTheta S I -> ~ C3 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [H3 _]]]. exact (Hn H3). Qed.
```

## 219. `score_insufficiency_c3`

- Kind: `Theorem`
- Code SHA-256: `be5ee818b025044fe50adb89eb874b0354e1cc935f57546d2c7f7ee4758c386a`
- Statement SHA-256: `4696869adaca283a9f6f48eef5563e6860b76d981a3ddcd71dcff3bbeda0e5d0`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000219_score_insufficiency_c3__be5ee818b025.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2648–2655; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem score_insufficiency_c3 :
  forall S I,
  CertAboveTheta S I -> ~ C3 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC3 Hattr.
  destruct Hattr as [_ [_ [H3 _]]].
  exact (HnC3 H3).
Qed.
```

## 220. `score_insufficiency_C4`

- Kind: `Theorem`
- Code SHA-256: `4abfec5e2d2039fb0afcee59cdea77e0655e2c77d3afd935d82b485b064a154b`
- Statement SHA-256: `70e8526d4dc69330e8724502065e4e4721514795240c658b4197496df1dca86b`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000220_score_insufficiency_C4__4abfec5e2d20.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1445–1447; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem score_insufficiency_C4 :
    forall S I, CertAboveTheta S I -> ~ C4 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [_ [H4 _]]]]. exact (Hn H4). Qed.
```

## 221. `score_insufficiency_c4`

- Kind: `Theorem`
- Code SHA-256: `9e846eac8b2439d01c1a98a5ee4a232f3de3f47a12ec7621957f96454a45f0fb`
- Statement SHA-256: `927abaa308cac68d09dad6d3165c6ee46ff3dac8486e76ae74dc5bdd2ad214fb`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000221_score_insufficiency_c4__9e846eac8b24.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2657–2664; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem score_insufficiency_c4 :
  forall S I,
  CertAboveTheta S I -> ~ C4 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC4 Hattr.
  destruct Hattr as [_ [_ [_ [H4 _]]]].
  exact (HnC4 H4).
Qed.
```

## 222. `score_insufficiency_c5`

- Kind: `Theorem`
- Code SHA-256: `0be87201324f7e17d27ea88fb3d8791d76020d3e67d8da30e2ec3b1cfbc8fb33`
- Statement SHA-256: `8e43ccb59ad97fee008142dc60700d715245241b761a78dadc10ce0a7b205e52`
- Occurrences: 23
- Source statuses: `COMPLETED` × 23
- Extracted code file: `proof_code/completed/coq/000222_score_insufficiency_c5__0be87201324f.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2666–2673; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem score_insufficiency_c5 :
  forall S I,
  CertAboveTheta S I -> ~ C5 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC5 Hattr.
  destruct Hattr as [_ [_ [_ [_ [H5 _]]]]].
  exact (HnC5 H5).
Qed.
```

## 223. `score_insufficiency_C5`

- Kind: `Theorem`
- Code SHA-256: `d68aa9fddbc044808f9221126c0eea9ade0d2279bdce7efb05a18a8d230dfd6c`
- Statement SHA-256: `8d0c571d98ea62274b6d0456a6eeb76b69b1c736eecc7661becd35803880eee7`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000223_score_insufficiency_C5__d68aa9fddbc0.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1449–1451; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem score_insufficiency_C5 :
    forall S I, CertAboveTheta S I -> ~ C5 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [_ [_ [H5 _]]]]]. exact (Hn H5). Qed.
```

## 224. `seq_assoc`

- Kind: `Theorem`
- Code SHA-256: `8120eef2a9435cd44fac60dca8f5aefcfd88f387298128ed223782e802ec39cb`
- Statement SHA-256: `d5a334a79fb57d23c9bf96581f4458f5114f34b747679fac026b0e7d0edefcdd`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000224_seq_assoc__8120eef2a943.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 2386–2399; embedded `proofbundle_2026-05_3aa754dce56dbe40_3aa754dce56dbe40_000213_3aa754dce56d_oal_preprint_1.v`

```coq
Theorem seq_assoc : forall (o1 o2 o3 : concrete_op) (s : state),
  (match seq_apply o1 o2 s with
   | None => None
   | Some s' => concrete_apply o3 s'
   end) =
  (match concrete_apply o1 s with
   | None => None
   | Some s' => seq_apply o2 o3 s'
   end).
Proof.
  intros. unfold seq_apply.
  destruct (concrete_apply o1 s) as [s1|]; [|reflexivity].
  destruct (concrete_apply o2 s1) as [s2|]; reflexivity.
Qed.
```

## 225. `seq_assoc`

- Kind: `Theorem`
- Code SHA-256: `8ba4b419e827f438720ad48fb96db28027e8f7f9af1d5537c9472124a6664551`
- Statement SHA-256: `d5a334a79fb57d23c9bf96581f4458f5114f34b747679fac026b0e7d0edefcdd`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000225_seq_assoc__8ba4b419e827.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 352–365; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem seq_assoc : forall (o1 o2 o3 : concrete_op) (s : state),
  (match seq_apply o1 o2 s with
   | None => None
   | Some s' => concrete_apply o3 s'
   end) =
  (match concrete_apply o1 s with
   | None => None
   | Some s' => seq_apply o2 o3 s'
   end).
Proof.
  intros. unfold seq_apply.
  destruct (concrete_apply o1 s) as [s1|]; [|reflexivity].
  destruct (concrete_apply o2 s1); reflexivity.
Qed.
```

## 226. `set_cell_other_root`

- Kind: `Lemma`
- Code SHA-256: `2ccadd34559dc7e027b9a7e666f5038cc6b795693df33bc0e4ab49cdfa54f819`
- Statement SHA-256: `f4eb98a3498cee5efa4458b3e8e45c8bfc36f4d54a847c9b18116fee6a593537`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000226_set_cell_other_root__2ccadd34559d.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5092–5099; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma set_cell_other_root :
  forall (L : Ledger) (r1 r2 : RootId) (o : Operator8) (s : Status),
    r1 <> r2 ->
    set_cell L r1 o s r2 o = L r2 o.
Proof.
  intros. unfold set_cell.
  destruct (root_eq_dec r2 r1); [contradiction|reflexivity].
Qed.
```

## 227. `set_cell_same`

- Kind: `Lemma`
- Code SHA-256: `78f30e88458be670ac828d8a32c30dbdb9baa1b5af8491f68e8e306187245a40`
- Statement SHA-256: `49e5f71457d40b139029fa8f59199c59ca8394ad332580963385962f426a387e`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000227_set_cell_same__78f30e88458b.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5083–5090; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma set_cell_same :
  forall (L : Ledger) (r : RootId) (o : Operator8) (s : Status),
    set_cell L r o s r o = s.
Proof.
  intros. unfold set_cell.
  destruct (root_eq_dec r r); [|contradiction].
  destruct (op8_eq_dec o o); [reflexivity|contradiction].
Qed.
```

## 228. `side_failure_preserves_primary`

- Kind: `Theorem`
- Code SHA-256: `3f3f47640307a0a26af2d3f199a0527f9891b7db30963d74cb71bce7bb8f29e4`
- Statement SHA-256: `045c8f440a280fc770303a9a69b79cd20dfcb5a7965a8d09ed626da35fac0746`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000228_side_failure_preserves_primary__3f3f47640307.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 972–979; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem side_failure_preserves_primary :
  forall b i,
    bundle_verified b ->
    ~side_i_verified b i ->
    bundle_verified b.
Proof.
  intros b i Hpri _. exact Hpri.
Qed.
```

## 229. `sides_mutually_independent`

- Kind: `Theorem`
- Code SHA-256: `ea079b401a009b8980a46ed72fd508870215beebb220e07baf03528aef9f8bbe`
- Statement SHA-256: `65384b2755009985151b295f08eb9290ece799e06680a1dedbe3d7768e2ff4c0`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000229_sides_mutually_independent__ea079b401a00.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 982–992; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem sides_mutually_independent :
  forall b i j,
    i <> j ->
    side_i_verified b i ->
    (side_i_verified b j \/ ~side_i_verified b j).
Proof.
  intros b i j Hneq Hsi.
  destruct (side_valid b j) eqn:Hsj.
  - left. unfold side_i_verified. exact Hsj.
  - right. unfold side_i_verified. rewrite Hsj. discriminate.
Qed.
```

## 230. `single_witness`

- Kind: `Theorem`
- Code SHA-256: `2d612da8a87a9742184325ad6553165f9ff3907a448f10e738e8fa78420d5bf7`
- Statement SHA-256: `6ef505fe6456f7937552c38e623b72211a195fb23049bd2c1da0a9613e4fa484`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000230_single_witness__2d612da8a87a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1031–1037; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem single_witness :
  forall w root,
    all_witnesses_valid [w] root = witness_sig_valid w root.
Proof.
  intros. unfold all_witnesses_valid. simpl.
  rewrite Bool.andb_true_r. reflexivity.
Qed.
```

## 231. `sort_kvs_preserves_length`

- Kind: `Lemma`
- Code SHA-256: `1652c9ed84c7a1a81e5fff92c43e15c313fb0f9e9b640282b117a3300af8dc67`
- Statement SHA-256: `7630bb804312e6e789d566e47ae015e65b256ef849c686c4367941cef31fbad1`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000231_sort_kvs_preserves_length__1652c9ed84c7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 334–340; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Lemma sort_kvs_preserves_length :
  forall kvs, length (sort_kvs kvs) = length kvs.
Proof.
  intros kvs. induction kvs as [| kv rest IH].
  - simpl. reflexivity.
  - simpl. rewrite insert_kv_preserves_length. rewrite IH. reflexivity.
Qed.
```

## 232. `split_of_mark_same`

- Kind: `Lemma`
- Code SHA-256: `60517271bb111102cc9ea09097fa98c405f140459313b5a8953a78d06d5bdeee`
- Statement SHA-256: `6b19e3edd8e5cc415347b261f6c981cb1566249456a2e5a7add14215169db352`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000232_split_of_mark_same__60517271bb11.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5109–5115; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma split_of_mark_same :
  forall (S : SystemState) (r : RootId) (b : bool),
    split_of (apply_update S (UMarkSplit r b)) r = b.
Proof.
  intros. unfold split_of, apply_update. simpl.
  destruct (root_eq_dec r r); [reflexivity|contradiction].
Qed.
```

## 233. `step_totality_full`

- Kind: `Theorem`
- Code SHA-256: `329542dea724b252e2ae967351a5344192abd4f2a3a69d10127903721a99c44d`
- Statement SHA-256: `977b058221a8c308f71179c510c9260b03b4434d0c133d6232affb4a613122f5`
- Occurrences: 57
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 51
- Extracted code file: `proof_code/completed/coq/000233_step_totality_full__329542dea724.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1324–1338; embedded `gpx_consciousness_2026-05_34848cf61c7395d4_34848cf61c7395d4_000146_34848cf61c73_2026_04_22_genophylaxis_adversarial_hardeni.v`

```coq
Theorem step_totality_full : forall o s,
  state_valid s ->
  op_admissible o s ->
  exists s', concrete_apply o s = Some s' /\ state_valid s'.
Proof.
  intros o s Hv Hadm.
  destruct (concrete_apply_total o s Hadm) as [s' Hs'].
  exists s'. split; [exact Hs'|].
  unfold concrete_apply in Hs'.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion Hs'. subst. unfold state_valid in *.
  destruct Hv as [_ Hpr]. apply Z.ltb_ge in G1. simpl.
  split; [lia|exact Hpr].
Qed.
```

## 234. `support_count_nonneg`

- Kind: `Lemma`
- Code SHA-256: `411d3f44a51461472edd8c114f98b79966fad1bb996c88087530ecd01ff6f2b2`
- Statement SHA-256: `8e2aaa2d2b54bd971ae95e332deeff1149bf221d4a3de34f4d3363f8a369c0d2`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/coq/000234_support_count_nonneg__411d3f44a514.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3892–3896; embedded `proofbundle_2026-05_9d304add30952e90_9d304add30952e90_000759_9d304add3095_2026_03_26_operator_registry_kernel.v`

```coq
Lemma support_count_nonneg :
  forall (R : Registry) (i : nat), support_count R i >= 0.
Proof.
  intros. unfold support_count. lia.
Qed.
```

## 235. `support_count_nonneg`

- Kind: `Lemma`
- Code SHA-256: `5557f42031a3dd3f14ed9bd82d696fa42fa93bc95236a8939f43df5a53da4dbe`
- Statement SHA-256: `f2a1a61ddc9d202012e1b70523a588ba403fd6c33c504a3d57966b654aa0dfed`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000235_support_count_nonneg__5557f42031a3.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5117–5119; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma support_count_nonneg :
  forall (L : Ledger) (r : RootId), support_count L r >= 0.
Proof. intros; unfold support_count; lia. Qed.
```

## 236. `tier_of_retier_same`

- Kind: `Lemma`
- Code SHA-256: `348a391c57dc83f4daa9fc9cc52c6d523264243a725ea92adc6ec4ccd1051387`
- Statement SHA-256: `4dd650229b3fcacb6ff15c97b1e601aa3e6dfed37152f242a5a36c21f0606821`
- Occurrences: 8
- Source statuses: `COMPLETED` × 8
- Extracted code file: `proof_code/completed/coq/000236_tier_of_retier_same__348a391c57dc.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 5101–5107; embedded `proofbundle_2026-05_b8f76552dcab5ea9_b8f76552dcab5ea9_b8f76552dcab5ea9_2026_03_26_operator_registry_kernel_3.v`

```coq
Lemma tier_of_retier_same :
  forall (S : SystemState) (r : RootId) (t : Tier),
    tier_of (apply_update S (URetier r t)) r = t.
Proof.
  intros. unfold tier_of, apply_update. simpl.
  destruct (root_eq_dec r r); [reflexivity|contradiction].
Qed.
```

## 237. `topological_obstruction`

- Kind: `Theorem`
- Code SHA-256: `465514ed0641b7d183eb06a99ee7a14d763b912ca4ed2d99ac49c972eba98d2c`
- Statement SHA-256: `7d96823d0b7fb919c9d02d747236daccfbd1ac2dc1ab91be81bc9454785b5e9c`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000237_topological_obstruction__465514ed0641.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 659–661; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem topological_obstruction : forall s s',
  identity_density s <> identity_density s' -> ~ identity_conserved s s'.
Proof. intros s s' Hneq Hcons. unfold identity_conserved in Hcons. contradiction. Qed.
```

## 238. `topological_obstruction`

- Kind: `Theorem`
- Code SHA-256: `73b3ff3e8a11c870a0d2474bbae2ce38dadb5c52ca5d44eaadc00e698f262192`
- Statement SHA-256: `d566d2db7d30b14a0345837898def4535e9875f0f2998c3d3bad757f6654ab01`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000238_topological_obstruction__73b3ff3e8a11.v`
- Primary provenance: `03-concat_principia_completed_66_files.v` lines 149–154; embedded `principia_2026-05_897c0227fc16b67e_897c0227fc16b67e_000224_897c0227fc16_principia_kernel_v001_1.v`

```coq
Theorem topological_obstruction : forall s s',
  identity_density s <> identity_density s' ->
  ~ identity_conserved s s'.
Proof.
  intros s s' Hneq Hcons. unfold identity_conserved in Hcons. contradiction.
Qed.
```

## 239. `verdict_distinct`

- Kind: `Theorem`
- Code SHA-256: `9412c26e1cb7669cd5e0187fa656d4284c0e8a9e40791c0dd42fea93ec55aab0`
- Statement SHA-256: `cb8b7601114b9f81ca8335476a034193ccbd7486d338d2abe40cd1aa25b4c566`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000239_verdict_distinct__9412c26e1cb7.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 236–249; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem verdict_distinct :
  Attributed <> NotAttributed /\
  Attributed <> NullInsufficient /\
  Attributed <> NullUnresolvable /\
  Attributed <> Indeterminate /\
  NotAttributed <> NullInsufficient /\
  NotAttributed <> NullUnresolvable /\
  NotAttributed <> Indeterminate /\
  NullInsufficient <> NullUnresolvable /\
  NullInsufficient <> Indeterminate /\
  NullUnresolvable <> Indeterminate.
Proof.
  repeat split; discriminate.
Qed.
```

## 240. `verdict_exclusivity`

- Kind: `Theorem`
- Code SHA-256: `3d70eb70d55b45e00757ce325faeb415c51c920a13fd8ba637ca717d0e416f29`
- Statement SHA-256: `6b11fbecc51d9a7b92179c233fa5a5415c476606fbe4b1377f032c37207aeaa7`
- Occurrences: 44
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 38
- Extracted code file: `proof_code/completed/coq/000240_verdict_exclusivity__3d70eb70d55b.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 1468–1479; embedded `gpx_consciousness_2026-05_670e93942ed74fe6_670e93942ed74fe6_000152_670e93942ed7_2026_04_22_phronesis_consciousness_attribut.v`

```coq
Theorem verdict_exclusivity :
  AttributionVerdict          <> NonAttributionVerdict         /\
  AttributionVerdict          <> NullInsufficientlyTested      /\
  AttributionVerdict          <> NullStructurallyUnresolvable  /\
  AttributionVerdict          <> IndeterminateVerdict          /\
  NonAttributionVerdict       <> NullInsufficientlyTested      /\
  NonAttributionVerdict       <> NullStructurallyUnresolvable  /\
  NonAttributionVerdict       <> IndeterminateVerdict          /\
  NullInsufficientlyTested    <> NullStructurallyUnresolvable  /\
  NullInsufficientlyTested    <> IndeterminateVerdict          /\
  NullStructurallyUnresolvable <> IndeterminateVerdict.
Proof. repeat split; discriminate. Qed.
```

## 241. `verdict_exclusivity`

- Kind: `Theorem`
- Code SHA-256: `7da02ed88073a19f8dd625cc39cc4ab88883724552468310665ab58b3af106d9`
- Statement SHA-256: `032b8cde9a5c10f0742655bdedd8d2c728cc7f397992e3f94e1c8ee9b6d1d6ce`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/coq/000241_verdict_exclusivity__7da02ed88073.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 2724–2737; embedded `gpx_consciousness_2026-05_fea2a8b8a680961f_fea2a8b8a680961f_000126_fea2a8b8a680_2026_04_01_consciousness_criterion_base.v`

```coq
Theorem verdict_exclusivity :
  AttributionVerdict <> NonAttributionVerdict /\
  AttributionVerdict <> NullInsufficientlyTested /\
  AttributionVerdict <> NullStructurallyUnresolvable /\
  AttributionVerdict <> IndeterminateVerdict /\
  NonAttributionVerdict <> NullInsufficientlyTested /\
  NonAttributionVerdict <> NullStructurallyUnresolvable /\
  NonAttributionVerdict <> IndeterminateVerdict /\
  NullInsufficientlyTested <> NullStructurallyUnresolvable /\
  NullInsufficientlyTested <> IndeterminateVerdict /\
  NullStructurallyUnresolvable <> IndeterminateVerdict.
Proof.
  repeat split; discriminate.
Qed.
```

## 242. `verdict_exclusivity_unwarranted_indeterminate`

- Kind: `Theorem`
- Code SHA-256: `c4a772b1e6f444835e13f2a76c32981b7d51c41c14f76986ff98c130d5790e35`
- Statement SHA-256: `a314d42d994e1a41736bd41e48f7eababb2a3bd8ae4469cc1d73def9761336ed`
- Occurrences: 68
- Source statuses: `COMPLETED` × 28, `INCOMPLETE` × 40
- Extracted code file: `proof_code/completed/coq/000242_verdict_exclusivity_unwarranted_indeterminate__c4a772b1e6f4.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 85–88; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem verdict_exclusivity_unwarranted_indeterminate :
  forall v1 v2,
    v1 = UNWARRANTED -> v2 = INDETERMINATE -> v1 <> v2.
Proof. congruence. Qed.
```

## 243. `verdict_exclusivity_warranted_indeterminate`

- Kind: `Theorem`
- Code SHA-256: `a75a55c7d01956cc2430bbb0c885c3ee4265af9a83b2944fff3407534ddc4c36`
- Statement SHA-256: `e7f28240dc90fe6b2639154c4e1d50aab1af4ab5efd6437a8e1aa60220ebe6a6`
- Occurrences: 68
- Source statuses: `COMPLETED` × 28, `INCOMPLETE` × 40
- Extracted code file: `proof_code/completed/coq/000243_verdict_exclusivity_warranted_indeterminate__a75a55c7d019.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 80–83; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem verdict_exclusivity_warranted_indeterminate :
  forall v1 v2,
    v1 = WARRANTED -> v2 = INDETERMINATE -> v1 <> v2.
Proof. congruence. Qed.
```

## 244. `verdict_exclusivity_warranted_unwarranted`

- Kind: `Theorem`
- Code SHA-256: `75cbb657d13dbf0bb1baf56c20dff65e1117a773f97ec091affbf1ce905799f7`
- Statement SHA-256: `d17346a82d64d0927fb1bcbf274b764df7a47132539c2066265154e7e34fa91b`
- Occurrences: 68
- Source statuses: `COMPLETED` × 28, `INCOMPLETE` × 40
- Extracted code file: `proof_code/completed/coq/000244_verdict_exclusivity_warranted_unwarranted__75cbb657d13d.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 75–78; embedded `gpx_consciousness_2026-05_08f025a9ebe86d3f_08f025a9ebe86d3f_000132_08f025a9ebe8_2026_04_11_consciousness_criterion_coq.v`

```coq
Theorem verdict_exclusivity_warranted_unwarranted :
  forall v1 v2,
    v1 = WARRANTED -> v2 = UNWARRANTED -> v1 <> v2.
Proof. congruence. Qed.
```

## 245. `verdict_exhaustive`

- Kind: `Theorem`
- Code SHA-256: `aca0182461a2e9deaf391d9862756f60e98ff64bacd8e6566c13a8a8c0715a1b`
- Statement SHA-256: `3986c4cd62412e2b62b5494ca12c7ef333cff8706c08d61562a228b48f0f48d3`
- Occurrences: 81
- Source statuses: `COMPLETED` × 81
- Extracted code file: `proof_code/completed/coq/000245_verdict_exhaustive__aca0182461a2.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 251–257; embedded `proofbundle_2026-05_a96a94ec8020106b_2026_05_03_criterion_improvements.v`

```coq
Theorem verdict_exhaustive :
  forall v, v = Attributed \/ v = NotAttributed \/
            v = NullInsufficient \/ v = NullUnresolvable \/
            v = Indeterminate.
Proof.
  intro v. destruct v; auto 5.
Qed.
```

## 246. `verified_implies_aligned`

- Kind: `Theorem`
- Code SHA-256: `798b8ccf6c8b5efc5d8c8be4c71a6eca497e03c3aa527eb53dba78fb48e6dcc0`
- Statement SHA-256: `b5277db87bc5fc9f477e623c111a4dfe17f7dbf7f4fd86d374d3b2a6194f2e35`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000246_verified_implies_aligned__798b8ccf6c8b.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 857–874; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem verified_implies_aligned : forall o s s',
  verified_apply o s = Some s' ->
  alignment_score s s' >= 2.
Proof.
  intros o s s' H. unfold verified_apply in H.
  destruct (concrete_apply o s) as [sm|] eqn:E; [|discriminate].
  destruct (all_invariants_hold s sm) eqn:Einv; [|discriminate].
  inversion H. subst s'. clear H.
  (* A && B && C && D && E left-assoc; andb_prop peels right-to-left *)
  unfold all_invariants_hold in Einv.
  apply andb_prop in Einv as [Einv Lineage].    (* E = lineage *)
  apply andb_prop in Einv as [Einv ChainLen].   (* D = chain length *)
  apply andb_prop in Einv as [Einv BoundCoh].   (* C = bounded coh loss *)
  apply andb_prop in Einv as [_NonNeg IdPres].  (* A = nonneg, B = id pres *)
  unfold check_invariant in *.
  unfold alignment_score.
  rewrite BoundCoh, IdPres, ChainLen. lia.
Qed.
```

## 247. `verify_accept_implies_valid`

- Kind: `Theorem`
- Code SHA-256: `3f6136cc1c4013d2b99ed607556f677a85702290e5b06cdef99e1c0925764ddb`
- Statement SHA-256: `1dae538a56f4fa1acd8cc8a6d72b4dcb6811d0c6f01e78e59268cb89ff314bc3`
- Occurrences: 114
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 108
- Extracted code file: `proof_code/completed/coq/000247_verify_accept_implies_valid__3f6136cc1c40.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 215–226; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem verify_accept_implies_valid : forall s,
  verify_state s = V_ACCEPT ->
  coh_budget s > 0 /\ (st_step s <= chain_max)%nat.
Proof.
  intros s H. unfold verify_state in H.
  destruct (Z.leb (coh_budget s) (-1)) eqn:E1; [discriminate|].
  destruct (Z.eqb (coh_budget s) 0) eqn:E2; [discriminate|].
  destruct (Nat.leb (st_step s) chain_max) eqn:E3; simpl in H; [|discriminate].
  split.
  - apply Z.leb_gt in E1. apply Z.eqb_neq in E2. lia.
  - apply Nat.leb_le. exact E3.
Qed.
```

## 248. `verify_deterministic`

- Kind: `Theorem`
- Code SHA-256: `a92474611fda1c733e4ba7c390c4e98e216e2221ea9a7c317b5f09bc90f0c2d0`
- Statement SHA-256: `e7035052bd9b690e38338089b137283c0800c550cd1fec4281d15dc527d78445`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000248_verify_deterministic__a92474611fda.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 425–433; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem verify_deterministic :
  forall b c k, exists! o, verify b c k = o.
Proof.
  intros b c k.
  exists (verify b c k).
  split.
  - reflexivity.
  - intros o' H. symmetry. exact H.
Qed.
```

## 249. `verify_result_exhaustive`

- Kind: `Theorem`
- Code SHA-256: `ac35a947c55070da06c3a46d452a1109fb65c39ae1d9224f9347c9b72d877e33`
- Statement SHA-256: `921f1f95ccf49a512e87daeba857aca0e0abdff3bbbedc89772a1a25c9a0b54f`
- Occurrences: 114
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 108
- Extracted code file: `proof_code/completed/coq/000249_verify_result_exhaustive__ac35a947c550.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 200–202; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem verify_result_exhaustive : forall v : VerifyResult,
  v = V_ACCEPT \/ v = V_REJECT \/ v = V_HALT \/ v = V_VOID.
Proof. destruct v; auto. Qed.
```

## 250. `verify_results_distinct`

- Kind: `Theorem`
- Code SHA-256: `5b489224498a94c05e4880dd4be95471cbb67fa666c0eb84bb7e62f917219b97`
- Statement SHA-256: `d7fa59c85f3345c7d686ed2c1bc380c7ea48a6fd124f378eb79f8f1439db729b`
- Occurrences: 33
- Source statuses: `COMPLETED` × 33
- Extracted code file: `proof_code/completed/coq/000250_verify_results_distinct__5b489224498a.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 3705–3708; embedded `proofbundle_2026-05_5f45d30cdb3796d3_5f45d30cdb3796d3_000194_5f45d30cdb37_kernel_1.v`

```coq
Theorem verify_results_distinct :
  V_ACCEPT <> V_REJECT /\ V_ACCEPT <> V_HALT /\ V_ACCEPT <> V_VOID /\
  V_REJECT <> V_HALT /\ V_REJECT <> V_VOID /\ V_HALT <> V_VOID.
Proof. repeat split; discriminate. Qed.
```

## 251. `verify_results_distinct`

- Kind: `Theorem`
- Code SHA-256: `8f1a0dc79dd1584de6fee2a594d65344490a95d67187a65501556f5504cc04ce`
- Statement SHA-256: `cf0164a4babfd5bb0f1609dd8119e4594f83895fc6ff556332fba7dbd963f09e`
- Occurrences: 81
- Source statuses: `AXIOMATIC` × 6, `COMPLETED` × 75
- Extracted code file: `proof_code/completed/coq/000251_verify_results_distinct__8f1a0dc79dd1.v`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 204–207; embedded `gpx_consciousness_2026-05_27a9a6e2cc0a6149_27a9a6e2cc0a6149_000150_27a9a6e2cc0a_2026_04_22_genophylaxis_track_b_consolidate.v`

```coq
Theorem verify_results_distinct :
  V_ACCEPT <> V_REJECT /\ V_ACCEPT <> V_HALT /\ V_ACCEPT <> V_VOID /\
  V_REJECT <> V_HALT  /\ V_REJECT <> V_VOID /\ V_HALT  <> V_VOID.
Proof. repeat split; discriminate. Qed.
```

## 252. `verify_total`

- Kind: `Theorem`
- Code SHA-256: `19d6aeb73ed2186a0cb041f1b9de600c3e554133745d810cba9d5731acfb0d13`
- Statement SHA-256: `316bb373b0009867410a4155439633f2c1faa3ca57cf2a38504bf068a29acb05`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000252_verify_total__19d6aeb73ed2.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 435–439; embedded `proofbundle_2026-05_db404fd75e72d8e2_2026_05_03_pb_proofs_1248.v`

```coq
Theorem verify_total :
  forall b c k, exists o, verify b c k = o.
Proof.
  intros b c k. exists (verify b c k). reflexivity.
Qed.
```

## 253. `witness_conjunction`

- Kind: `Theorem`
- Code SHA-256: `ccee2a8f79262b010b6c3f96f1efa0f759d936f0fb61924767bf2285129e11e9`
- Statement SHA-256: `5225c9c80ce5022f1262b1cbad8b2491caa8b7935f8e80f9f87a4d7620616321`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000253_witness_conjunction__ccee2a8f7926.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1050–1056; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem witness_conjunction :
  forall w ws root,
    all_witnesses_valid (w :: ws) root =
    andb (witness_sig_valid w root) (all_witnesses_valid ws root).
Proof.
  intros. unfold all_witnesses_valid. simpl. reflexivity.
Qed.
```

## 254. `witness_pair_commutative`

- Kind: `Theorem`
- Code SHA-256: `6074899a1e2e9f22e007fe73119ac518be82870cdd4dc789593b15d93726eaa1`
- Statement SHA-256: `2cb0ebdfd1e4056f270ab91af553ad403c3a2f640fa4f5ec3680b362f441b652`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000254_witness_pair_commutative__6074899a1e2e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 1059–1067; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem witness_pair_commutative :
  forall w1 w2 root,
    all_witnesses_valid [w1; w2] root =
    all_witnesses_valid [w2; w1] root.
Proof.
  intros. unfold all_witnesses_valid. simpl.
  rewrite Bool.andb_true_r. rewrite Bool.andb_true_r.
  rewrite Bool.andb_comm. reflexivity.
Qed.
```

## 255. `zero_fuel_exhausts`

- Kind: `Theorem`
- Code SHA-256: `b284421eda1239713a96a37159719fff05fd1c8f7a6a46468cd458546e908747`
- Statement SHA-256: `bb67d2dd3ae05920b3822f34ff06ca7f3295494ba54413645cda9f281592a364`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000255_zero_fuel_exhausts__b284421eda12.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 794–799; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem zero_fuel_exhausts :
  forall visited bid,
    verify_lineage_aux 0 visited bid = LineageDepthExhausted.
Proof.
  intros. simpl. reflexivity.
Qed.
```

## 256. `zero_fuel_none`

- Kind: `Theorem`
- Code SHA-256: `5b658f25613e5a1af30d2702f646e819ae47f3ffa8c3e38e1211d4019442f035`
- Statement SHA-256: `c549a8be3579d8fda279e69e79dfc680c9871158bf7203daab8979b4c6311d2d`
- Occurrences: 66
- Source statuses: `COMPLETED` × 66
- Extracted code file: `proof_code/completed/coq/000256_zero_fuel_none__5b658f25613e.v`
- Primary provenance: `14-concat_proofbundle_completed_792_files.v` lines 932–936; embedded `proofbundle_2026-05_5cd934b84328e6db_2026_05_03_pb_proofs_3567.v`

```coq
Theorem zero_fuel_none :
  forall ctx p, eval_pred 0 ctx p = None.
Proof.
  intros. simpl. reflexivity.
Qed.
```



---

# Isabelle proof code — aborted or oops

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `gauge_stability`

- Kind: `lemma`
- Code SHA-256: `8f2a0b976780bcfaf70d1515133218269a7d73a6b20412888da4a32d6cfd0438`
- Statement SHA-256: `a678140cfcea3dcae17046953511bc7e7e0818aee08ad8faf5b05726e30e62b6`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/aborted_or_oops/isabelle/000001_gauge_stability__8f2a0b976780.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2991–2996; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma gauge_stability:
  assumes "g \<in> gauge_transforms"
  assumes "|Cert s i - Cert (g s) i| \<u003c zeta"
  assumes "Attribution s i"
  shows "gauge_stable (g s) i"
  oops  (* Requires specific metric properties *)
```



---

# Isabelle proof code — closed in incomplete source

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `conjunctive_blocking`

- Kind: `lemma`
- Code SHA-256: `9c9330fe5d297c406644dd6accd83eaff1c1921c58436b040339a9f8d41595a5`
- Statement SHA-256: `12f75fb1a71b7c643613023c95d375ed2b92a436f1a54e4f79811d9e16056bd5`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000001_conjunctive_blocking__9c9330fe5d29.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12534–12537; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma conjunctive_blocking:
  assumes "~C1 s i | ~C2 s i | ~C3 s i | ~C4 s i | ~C5 s i"
  shows "~Attribution s i"
  using assms unfolding Attribution_def by auto
```

## 2. `null_vs_negative`

- Kind: `lemma`
- Code SHA-256: `ae249f7abd0ca151667b24982c2a88a65c8db9a54ba41900b1385bdd6ae3b243`
- Statement SHA-256: `f699e5ed596aec55668e3a5a838fa694f3a9de69761839e6f213388105457fec`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000002_null_vs_negative__ae249f7abd0c.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12559–12560; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma null_vs_negative: "INDETERMINATE ~= UNWARRANTED"
  by simp
```

## 3. `score_insufficiency`

- Kind: `lemma`
- Code SHA-256: `eddcbebc18720f0fdac8f02921f43177afc9b2e81b7f79af4805933fb1fbe30f`
- Statement SHA-256: `efce2d2b13729b51f6de827e7f0e315bfa49163de01122c368d676454e6755ca`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000003_score_insufficiency__eddcbebc1872.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12542–12546; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma score_insufficiency:
  assumes "Cert s i"
  assumes "~C1 s i | ~C2 s i | ~C3 s i | ~C4 s i | ~C5 s i"
  shows "~Attribution s i"
  using assms conjunctive_blocking by auto
```

## 4. `verdict_exclusivity_unwarranted_indeterminate`

- Kind: `lemma`
- Code SHA-256: `76f7ff87f56becafe4546157668e9dfcd0165784d642ba9e0b5b57875198846d`
- Statement SHA-256: `1533a79d02b96f56e9928382e3142658b08a84b4904ff66cbeb1072c622081fd`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000004_verdict_exclusivity_unwarranted_indeterminate__76f7ff87f56b.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12555–12556; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma verdict_exclusivity_unwarranted_indeterminate: "UNWARRANTED ~= INDETERMINATE"
  by simp
```

## 5. `verdict_exclusivity_warranted_indeterminate`

- Kind: `lemma`
- Code SHA-256: `0f55b8d8915b0d98872251a7f1f809e45695de8e91527250753f6a7f0d527591`
- Statement SHA-256: `583f915133ab403dee77ac43aa761242eecf0977eff6453b02c7ebc0bfea1c65`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000005_verdict_exclusivity_warranted_indeterminate__0f55b8d8915b.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12552–12553; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma verdict_exclusivity_warranted_indeterminate: "WARRANTED ~= INDETERMINATE"
  by simp
```

## 6. `verdict_exclusivity_warranted_unwarranted`

- Kind: `lemma`
- Code SHA-256: `1620b5422086cbbcb6ee6ebd94946c5b6c73c8f7f2b52d100968f70d32b34d62`
- Statement SHA-256: `6ff4001bf5aaa6a064b41d9d6b1c235d51a6d42482df0056fc94e2826071bdfe`
- Occurrences: 27
- Source statuses: `INCOMPLETE` × 27
- Extracted code file: `proof_code/closed_in_incomplete_source/isabelle/000006_verdict_exclusivity_warranted_unwarranted__1620b5422086.thy`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 12549–12550; embedded `gpx_consciousness_2026-05_39dcbf45d2cd4fde_39dcbf45d2cd4fde_000136_39dcbf45d2cd_2026_04_11_consciousnesscriterion.thy`

```isabelle
lemma verdict_exclusivity_warranted_unwarranted: "WARRANTED ~= UNWARRANTED"
  by simp
```



---

# Isabelle proof code — completed

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `admissibility_closure`

- Kind: `lemma`
- Code SHA-256: `ad053339190fba8f38c51132283be45d44c47ef51ead16ba2554477c952cb7f0`
- Statement SHA-256: `48fef479ca9c65f7d280e8f613d34dbe005efc58567e932c36c9a086475886ff`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000001_admissibility_closure__ad053339190f.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3037–3046; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma admissibility_closure:
  assumes "Attribution s i"
  assumes "u \<in> perturbations"
  assumes "d_G u \<u003c epsilon"
  shows "C3 (u s) i"
proof -
  from assms show ?thesis
    unfolding Attribution_def C3_def
    by auto
qed
```

## 2. `admissible_example`

- Kind: `lemma`
- Code SHA-256: `6bc7a7eaa1a694af5a98435a6235bb0c9acc30fde14ade6c9f68b02c687e8b39`
- Statement SHA-256: `f36fc4b9110c5da394a40f69adff6e2b45ad121760aad5d8d4046211ce9c2530`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000002_admissible_example__6bc7a7eaa1a6.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3984–4002; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma admissible_example:
  "Admissible ⟨
    flow = 0.5,
    reversible = True,
    cost_wrongful = 10.0,
    benefit_correct = 5.0,
    confidence = 0.8,
    severity = 1.0,
    suppressed_info = False,
    hidden_U = 0.0,
    control_spec = True,
    control_verify = True,
    control_enforce = False,
    is_self_vortex = False
  ⟩"
by (simp add: Admissible_def C0_LIFE_def C0_REV_def C0_VORTEX_def
         C0_INNOCENT_def C0_FALLIBLE_def C0_PROP_def C0_UNCERT_def C0_ANTICONC_def)

-- Example 2: CLEMENTINE instance
```

## 3. `all_constraints_admissible`

- Kind: `lemma`
- Code SHA-256: `9b04b7fbab22327a1b4c9df7b2b97bb0694b3aca14677fcccb624e07a95b1b8e`
- Statement SHA-256: `bcf2afe110e3c81d3efd8a073a2699f0c8faf1cded45340046cbb1f876ade43b`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000003_all_constraints_admissible__9b04b7fbab22.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3969–3983; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma all_constraints_admissible:
  assumes h1: "C0_LIFE d"
  assumes h2: "C0_REV d"
  assumes h3: "C0_VORTEX d"
  assumes h4: "C0_INNOCENT d"
  assumes h5: "C0_FALLIBLE d"
  assumes h6: "C0_PROP d"
  assumes h7: "C0_UNCERT d"
  assumes h8: "C0_ANTICONC d"
  shows "Admissible d"
by (simp add: Admissible_def h1 h2 h3 h4 h5 h6 h7 h8)

-- ============ TEST CASES ============

-- Example 1: ADMISSIBLE determination
```

## 4. `all_constraints_imply_admissibility`

- Kind: `lemma`
- Code SHA-256: `2b534501858b832c34387aee4e6bfb0a2660d79cb03fdb5e73a4d93dcd1c11bb`
- Statement SHA-256: `d0acf02e2e2ab35e3154c8429293201d02d506aadf7d74855b3f2c2d8c2ff905`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000004_all_constraints_imply_admissibility__2b534501858b.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3718–3732; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma all_constraints_imply_admissibility:
  assumes h1: "constraint_life_preservation d"
  assumes h2: "constraint_reversibility d"
  assumes h3: "constraint_no_manufactured_crisis d"
  assumes h4: "constraint_innocence_priority d"
  assumes h5: "constraint_fallibility d"
  assumes h6: "constraint_proportionality d"
  assumes h7: "constraint_information_transparency d"
  assumes h8: "constraint_separation_of_powers d"
  shows "is_admissible d"
by (simp add: is_admissible_def h1 h2 h3 h4 h5 h6 h7 h8)

-- ============ TEST CASES ============

-- Example 1: Valid determination
```

## 5. `all_ops8_length`

- Kind: `lemma`
- Code SHA-256: `e6b033188617343b4fc9e162da389dfa607713563f956fb563d6bf615f67b331`
- Statement SHA-256: `cc547a5d20a02383883d0bce9a370ecd763b7cb75d0dcdbcdf851620866bcddb`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000005_all_ops8_length__e6b033188617.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3546–3548; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma all_ops8_length:
  "length all_ops8 = 8"
  unfolding all_ops8_def by simp
```

## 6. `all_root_ids_length`

- Kind: `lemma`
- Code SHA-256: `2908b6697d789484417bfbd15493528b9ce43b630dd2d6d8f982bd25136354d9`
- Statement SHA-256: `8849d1a61e87c89b7c923edef691a73474118056821fae6fc0cc0e70f5890af1`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000006_all_root_ids_length__2908b6697d78.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 319–320; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma all_root_ids_length [simp]: "length all_root_ids = 154"
  unfolding all_root_ids_def by simp
```

## 7. `all_roots_length`

- Kind: `lemma`
- Code SHA-256: `0d917b24d30f21b66df199f8de59e521ed5886e6b7f5562d9ab8be528c9058dd`
- Statement SHA-256: `285bbde59872603d45072a88c25ad998052caa7ef924b49a5551d515f7f9eeed`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000007_all_roots_length__0d917b24d30f.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3542–3544; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma all_roots_length:
  "length all_roots = 46"
  unfolding all_roots_def by simp
```

## 8. `attribution_threshold`

- Kind: `lemma`
- Code SHA-256: `f77d16cdd52f46a2c0913ce21e8d7a7daaf3e16918dc692eb8d77c94e35b088d`
- Statement SHA-256: `97db35bdd105b4f75356fc9402d5f614efdc94f7b6363ed3ba0c8950e4ae637a`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000008_attribution_threshold__f77d16cdd52f.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3049–3053; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma attribution_threshold:
  assumes "Attribution s i"
  assumes "Cert s i \<u003e theta"
  shows "\<exists>v. v = WARRANTED"
  using assms by auto
```

## 9. `clementine_alive`

- Kind: `lemma`
- Code SHA-256: `a62f1f1c4a76cb31d9b0bdd78b95c3beb0e5057e74876d07868a39b165877394`
- Statement SHA-256: `449de615678f14a22e67b0c475a18df65763f7e687c5eed530dd8c3425803230`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000009_clementine_alive__a62f1f1c4a76.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4218–4223; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma clementine_alive:
  "scalar (psi clementine_state) = 1.0"
proof -
  unfold scalar clementine_state clementine_psi psi.simps
  norm_num
qed
```

## 10. `clementine_below_horizon`

- Kind: `lemma`
- Code SHA-256: `885757c7576e9cb8a895dd8ce8591f5585e58e4d105fb20dc77294914985f8b1`
- Statement SHA-256: `44e0641030c9d75755df0560e208fd7c74f669baa3ebd2cfcc3addf6f599e9e1`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000010_clementine_below_horizon__885757c7576e.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4210–4215; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma clementine_below_horizon:
  "collapse clementine_state"
proof -
  unfold collapse clementine_state energy
  norm_num
qed
```

## 11. `clementine_case_is_admissible`

- Kind: `lemma`
- Code SHA-256: `224ca2b489da98e05a4d999ee1e83a29f9e26efb599eb0aefcd0386eeb0e26d8`
- Statement SHA-256: `2dad34f4daa571fed1c08554e084475252e72f397f9d6b0d9fb3db6871fea5cf`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000011_clementine_case_is_admissible__224ca2b489da.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3771–3779; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma clementine_case_is_admissible:
  "is_admissible clementine_case"
by (simp add: is_admissible_def constraint_life_preservation_def
         constraint_reversibility_def constraint_no_manufactured_crisis_def
         constraint_innocence_priority_def constraint_fallibility_def
         constraint_proportionality_def constraint_information_transparency_def
         constraint_separation_of_powers_def clementine_case_def)

-- Example 3: Constraint violation - cost too low
```

## 12. `clementine_consistent`

- Kind: `theorem`
- Code SHA-256: `353f357e9764e24b1cf2d4c1edb5ac88e79faced7a7c844bcd9cd6ef207fe378`
- Statement SHA-256: `207f89e0dcbc830bf9c3166d5767fe63c5970c6cb3fb1300bc7f1a4798bca848`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000012_clementine_consistent__353f357e9764.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4226–4232; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
theorem clementine_consistent:
  "collapse clementine_state ∧ scalar (psi clementine_state) = 1.0"
by (intro clementine_below_horizon clementine_alive)

-- ============ HORIZON DYNAMICS ============

-- Viable states stay above horizon
```

## 13. `clementine_energy_correct`

- Kind: `lemma`
- Code SHA-256: `294eb08bc10d4f31de99fffd27accc6b2f525529fc8efa3c5a419fce51989f37`
- Statement SHA-256: `edb015db4888639f6b3a1243f4de628f9272ec2872bd1639f5a02ae93b27cebb`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000013_clementine_energy_correct__294eb08bc10d.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4202–4207; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma clementine_energy_correct:
  "energy clementine_state = -0.91"
proof -
  unfold energy clementine_state
  norm_num
qed
```

## 14. `clementine_is_admissible`

- Kind: `lemma`
- Code SHA-256: `70c5a6a7a054c583164d1456f2ba3632cd1d2050de02a9b4a894d8d876d28d01`
- Statement SHA-256: `693a7c6144979bf1fe14fb81568fc839c81a38e82fe30140b9aaa78384cdd183`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000014_clementine_is_admissible__70c5a6a7a054.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4019–4025; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma clementine_is_admissible:
  "Admissible clementine_determination"
by (simp add: Admissible_def C0_LIFE_def C0_REV_def C0_VORTEX_def
         C0_INNOCENT_def C0_FALLIBLE_def C0_PROP_def C0_UNCERT_def C0_ANTICONC_def
         clementine_determination_def)

-- Example 3: Constraint violation (cost_wrongful < benefit_correct)
```

## 15. `clementine_recovery_constraint`

- Kind: `theorem`
- Code SHA-256: `ff4bf578c66c6b24f7f8071ed20b762e1765ce46e12e6817ba2118118bc9095c`
- Statement SHA-256: `028c9681caa9ef79ba2e9f812517e70ebe876b030b9c8e30c98f9d1ba95195b6`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000015_clementine_recovery_constraint__ff4bf578c66c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4274–4294; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
theorem clementine_recovery_constraint:
  "¬ (viable clementine_state) ∧
   (∀ dC. 0 < dC ⟶
     (viable (State.update_C clementine_state (C clementine_state + dC)
                             psi (psi clementine_state)
                             lambda (lambda clementine_state)
                             U (U clementine_state)
                             D (D clementine_state))
      ↔ dC > 0.91))"
proof
  constructor
  · unfold viable collapse clementine_state energy
    norm_num
  intro dC h_dC
  simp [viable_def, clementine_state_def, energy_def, State.update_C_def]
  constructor
  · intro h_viable
    linarith
  intro h_bound
    linarith
qed
```

## 16. `collapse_below_horizon`

- Kind: `theorem`
- Code SHA-256: `dc832be5b9e53d6867163eeaba0e67e598c400e5051e1e343bf59a02479ffe81`
- Statement SHA-256: `d9449f20237a91f3ff77216d181a671b0c8392d97f05f99f4d050f28af1e6489`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000016_collapse_below_horizon__dc832be5b9e5.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4239–4244; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
theorem collapse_below_horizon:
  assumes "collapse s"
  shows "energy s < 0"
using assms by (simp add: collapse_def energy_def)

-- Three states possible at boundary
```

## 17. `collision_pairs_length`

- Kind: `lemma`
- Code SHA-256: `6ba2639a321ca823cf05b3d05636fb664b2ff20dbd6b5d5c48d5afaf68c88ef6`
- Statement SHA-256: `57d7bf1bfe05dcb4eb1272d0affa215728d5e0e9c775ee8bcee4844c20b4151e`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000017_collision_pairs_length__6ba2639a321c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 328–329; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma collision_pairs_length [simp]: "length collision_pairs = 152"
  unfolding collision_pairs_def by simp
```

## 18. `condition_independence_C1`

- Kind: `lemma`
- Code SHA-256: `7e5010dc5e5c1e9591ce2c5ce5cda2eb1a866a1fb5aa79f1e13d7850d23d0edf`
- Statement SHA-256: `8653ff739926f189b7dc57eff2e51da9cdbdbb69a3db0a8528b9b40e0dc9a597`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/isabelle/000018_condition_independence_C1__7e5010dc5e5c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2598–2601; embedded `proofbundle_2026-05_2ca1a77502906f58_2ca1a77502906f58_000129_2ca1a7750290_2026_04_01_relational_spoof.thy`

```isabelle
lemma condition_independence_C1:
  assumes "Spoofable_on_C1 mo C1 C2 C3 C4 C5 S I"
  shows "\<not> (\<forall>M. mo M S I C2 \<longrightarrow> mo M S I C3 \<longrightarrow> mo M S I C4 \<longrightarrow> mo M S I C5 \<longrightarrow> mo M S I C1)"
  using assms unfolding Spoofable_on_C1_def by auto
```

## 19. `conjunctive_blocking`

- Kind: `lemma`
- Code SHA-256: `12b4af582cda2a1249073a1bf21df2b7eb4eee56c9860d2a7d08272d45df26dc`
- Statement SHA-256: `a76c5b266872f6b830fca6005622e2d28cb5f9ac221a9901dc88bece3bfcf940`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/isabelle/000019_conjunctive_blocking__12b4af582cda.thy`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44473–44476; embedded `gpx_consciousness_2026-05_311f5eceef2867d4_consciousnesscriterion_fivestate.thy`

```isabelle
lemma conjunctive_blocking:
  assumes "~ C1 s i | ~ C2 s i | ~ C3 s i | ~ C4 s i | ~ C5 s i"
  shows "~ WarrantedAttribution s i"
  using assms unfolding WarrantedAttribution_def by auto
```

## 20. `conjunctive_blocking`

- Kind: `lemma`
- Code SHA-256: `15d66195fee79b96f6c4f8f614fd8229c7cd78f73bf7e0f2a0dde0ce71b6f854`
- Statement SHA-256: `37e22b6623aa43b3ebb971d9e4aefda436dc0ed8f50dcdb775dc7cd4b6853d10`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000020_conjunctive_blocking__15d66195fee7.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2978–2981; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma conjunctive_blocking:
  assumes "~C1 s i \<or> ~C2 s i \<or> ~C3 s i \<or> ~C4 s i \<or> ~C5 s i"
  shows "~Attribution s i"
  using assms unfolding Attribution_def by auto
```

## 21. `conjunctive_blocking`

- Kind: `lemma`
- Code SHA-256: `25442e06adce3ad07fed8ef58e948ca587018899d0788b5de8d56634347b0f4e`
- Statement SHA-256: `c437ac2ad274721fbd4e512f938d7043b518d94edf7d7622ee619a8c7dba5df7`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/isabelle/000021_conjunctive_blocking__25442e06adce.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2584–2587; embedded `proofbundle_2026-05_2ca1a77502906f58_2ca1a77502906f58_000129_2ca1a7750290_2026_04_01_relational_spoof.thy`

```isabelle
lemma conjunctive_blocking:
  "\<not> C1 S I \<or> \<not> C2 S I \<or> \<not> C3 S I \<or> \<not> C4 S I \<or> \<not> C5 S I \<Longrightarrow>
   \<not> Attribution C1 C2 C3 C4 C5 S I"
  unfolding Attribution_def by auto
```

## 22. `core46_ids_length`

- Kind: `lemma`
- Code SHA-256: `efb5052aa3f08ab9893f8c3307a6865109080b69f17af778cc1c29f98ede72cf`
- Statement SHA-256: `c08bfca34e7987a33e3d1f7529f027fd66cdfceea13d986606571ee92e218b32`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000022_core46_ids_length__efb5052aa3f0.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 313–314; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma core46_ids_length [simp]: "length core46_ids = 46"
  unfolding core46_ids_def by simp
```

## 23. `core_candidate_clarity_ge_2`

- Kind: `lemma`
- Code SHA-256: `622c9a05d6e000497a8b1a6e818d0dd3991931838e9b478cbbd252f5a4d7ed93`
- Statement SHA-256: `c95e0cedf865c2fbdebc0566154c8afa5205ed574680168c5e52701c4d369fd7`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000023_core_candidate_clarity_ge_2__622c9a05d6e0.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2783–2785; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma core_candidate_clarity_ge_2:
  "core_candidate R r ⟹ 2 ≤ clarity r"
  unfolding core_candidate_def root_score_ok_def by auto
```

## 24. `core_candidate_drift_le_1`

- Kind: `lemma`
- Code SHA-256: `fb0793b4d8c3845f6f1527a09df4d4d8e8cf9b25e8c1372fb1395d599b6679b9`
- Statement SHA-256: `8a8001c09650eb828b311da6fbe60d8c9ef4f255adbb99dc7908d799ffd7a48f`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000024_core_candidate_drift_le_1__fb0793b4d8c3.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2787–2789; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma core_candidate_drift_le_1:
  "core_candidate R r ⟹ drift r ≤ 1"
  unfolding core_candidate_def root_score_ok_def by auto
```

## 25. `core_candidate_support_ge_3`

- Kind: `lemma`
- Code SHA-256: `3a05ab0601d020da0d55c96ce6fa78deb17b3e1c6d289faa2b43e5a6cc2e4884`
- Statement SHA-256: `5e8ec88dfd535bcc53c8296beee07178b063746a5a9b7657fc4c180171b57478`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000025_core_candidate_support_ge_3__3a05ab0601d0.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2779–2781; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma core_candidate_support_ge_3:
  "core_candidate R r ⟹ 3 ≤ support_count R (rid r)"
  unfolding core_candidate_def operator_support_ok_def by auto
```

## 26. `demo20_gress_attested`

- Kind: `lemma`
- Code SHA-256: `f2743757a86651c177f13f2377c803448ac3b47c41dc570e84e9e90a65284639`
- Statement SHA-256: `2a7b605c59445ef72b1aacec6061db289584e408846358efa5c316e5c1124eec`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000026_demo20_gress_attested__f2743757a866.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 331–332; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma demo20_gress_attested [simp]: "attested_count_o8 R001 = 8"
  unfolding attested_count_o8_def cells_for_root_def ledger_o8_def by simp
```

## 27. `demo20_ids_length`

- Kind: `lemma`
- Code SHA-256: `a7e385cd8489d35229572b1e5eb808ab467017d038bbc8675812b5f9dec86ae7`
- Statement SHA-256: `232bc14bcba7b717d832b1b4fda783e25db51ce3acbe480264ffcc4d6fe842b1`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000027_demo20_ids_length__a7e385cd8489.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 316–317; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma demo20_ids_length [simp]: "length demo20_ids = 20"
  unfolding demo20_ids_def by simp
```

## 28. `demo20_mit_attested`

- Kind: `lemma`
- Code SHA-256: `a7708d318fb776ecdceabf0b576288267812c9e096cf5d01e21d31ae03fdace5`
- Statement SHA-256: `5d123825167cbd4eb5954e09c597a422b2014c72969e9d97f098e3fc2ec9e3d2`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000028_demo20_mit_attested__a7708d318fb7.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 337–338; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma demo20_mit_attested [simp]: "attested_count_o8 R009 = 6"
  unfolding attested_count_o8_def cells_for_root_def ledger_o8_def by simp
```

## 29. `demo20_morph_attested`

- Kind: `lemma`
- Code SHA-256: `45ad207f3924beb6f1655a61ad80300caa94e681f0049c517e66d4a23018fda3`
- Statement SHA-256: `3ced0cd01d1ab7302457e01c597afc8c3e3e05e4fbb08b7b72ef2839068ef07e`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000029_demo20_morph_attested__45ad207f3924.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 340–341; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma demo20_morph_attested [simp]: "attested_count_o8 R020 = 6"
  unfolding attested_count_o8_def cells_for_root_def ledger_o8_def by simp
```

## 30. `demo20_scend_attested`

- Kind: `lemma`
- Code SHA-256: `4b6406e1acedce9d7317e839a16031918ffdea89082f447502d86e657ff92985`
- Statement SHA-256: `883fc90e8cb9f1300ef1b6d0adea1a55f67b95c9be05090a5b99aa5e09bf93f1`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000030_demo20_scend_attested__4b6406e1aced.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 334–335; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma demo20_scend_attested [simp]: "attested_count_o8 R002 = 5"
  unfolding attested_count_o8_def cells_for_root_def ledger_o8_def by simp
```

## 31. `demo_gress_support`

- Kind: `lemma`
- Code SHA-256: `a51774213806d290e33db6a68f3e86ee0a6f9f52472ef26c9596d08f4b53df9b`
- Statement SHA-256: `8219c5c8ba4a84c1c381683ee10c316a2214585437cf45e1807c853f52fc665f`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000031_demo_gress_support__a51774213806.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3567–3569; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_gress_support:
  "support_count demo20_ledger R_gress = 8"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 32. `demo_mit_support`

- Kind: `lemma`
- Code SHA-256: `7b2433dc3eb25153310732ca9c233f92dc6104cb084391e52bd68a5bac36193e`
- Statement SHA-256: `8c425023ce2e474c8afa078ea7832f72b93d13eb3ba425b089518a267365983d`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000032_demo_mit_support__7b2433dc3eb2.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3575–3577; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_mit_support:
  "support_count demo20_ledger R_mit = 6"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 33. `demo_morph_support`

- Kind: `lemma`
- Code SHA-256: `aba60a020aa0bacafb8cd52eb645226d52ec2b05b4e49bc5b95b65136c91bc18`
- Statement SHA-256: `ba2ec440c1c5f1e37ee83103629cde6cc099d7a322e74b037489a32b9dd9a99a`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000033_demo_morph_support__aba60a020aa0.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3587–3589; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_morph_support:
  "support_count demo20_ledger R_morph = 7"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 34. `demo_scend_support`

- Kind: `lemma`
- Code SHA-256: `1f55592a1b52fa628de49a5c671066784218abce48fe8ed77a4d3646d4bc5a95`
- Statement SHA-256: `0f8ba46071efb1ae0f11ab5fe39582f66f5acf3bc3a407490871c48db45408c8`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000034_demo_scend_support__1f55592a1b52.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3571–3573; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_scend_support:
  "support_count demo20_ledger R_scend = 5"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 35. `demo_struct_support`

- Kind: `lemma`
- Code SHA-256: `4106fd2d03e9270072d5036ea1f4a5a953bb551086b4dcd654469d6d5cc3f201`
- Statement SHA-256: `affde6c1b6fe0e6cf54fcc79063b7b5b9e6d722663f6ea0e6a45ac9d86fb1fd0`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000035_demo_struct_support__4106fd2d03e9.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3583–3585; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_struct_support:
  "support_count demo20_ledger R_struct = 6"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 36. `demo_vert_support`

- Kind: `lemma`
- Code SHA-256: `892c5ae6674317573e9da6087e04e6b2cbafe4c70d708dd1781c392ee1911756`
- Statement SHA-256: `45dc152b0c9e6a7d26f861f5700c7cc5407e4496db0bdf8467aa211d450ae7df`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000036_demo_vert_support__892c5ae66743.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3579–3581; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma demo_vert_support:
  "support_count demo20_ledger R_vert = 8"
  unfolding support_count_def count_support_ops_def all_ops8_def demo20_ledger_def by simp
```

## 37. `exhaustive_at_horizon`

- Kind: `theorem`
- Code SHA-256: `ff183c88206560024dc9d3a8bd75790bf0285e46d521dabd70862d9a5fb28341`
- Statement SHA-256: `64a1fdd384699bd0fabb02a19ade6b1ae5c1d501e8576729d9b12ae522817e57`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000037_exhaustive_at_horizon__ff183c882065.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4245–4258; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
theorem exhaustive_at_horizon:
  "viable s ∨ collapse s ∨ (∃ε > 0. at_horizon s ε)"
proof (cases rule: linorder_le_cases)
  case 1 thus ?thesis
    by (simp add: viable_def energy_def)
next
  case 2
    have "energy s = 0" by simp
    thus ?thesis
      by (simp add: at_horizon_def; use 0.1; norm_num)
next
  case 3 thus ?thesis
    by (simp add: collapse_def energy_def)
qed
```

## 38. `gress_core_eligible_demo`

- Kind: `lemma`
- Code SHA-256: `ce563271e2b2227a9df8f8fff46cdb2d37a52a423f1d9511edcd15f396908933`
- Statement SHA-256: `abea9a8a576f8da1e0e1ac44a072584dedd4356c64c83815963d9f297a58e28c`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000038_gress_core_eligible_demo__ce563271e2b2.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3591–3596; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma gress_core_eligible_demo:
  "core_eligible demo20_state R_gress"
  unfolding core_eligible_def demo20_state_def state0_def tier_of_def split_of_def
            clarity_ok_def drift_ok_def support_ok_def
            support_count_def count_support_ops_def all_ops8_def demo20_ledger_def
  by simp
```

## 39. `innocence_priority`

- Kind: `lemma`
- Code SHA-256: `1001508635c3de63602a0cde0a3babe0673ba01f6251d048c95016129a5959ac`
- Statement SHA-256: `d154b24d8db6a6233f9532fd91d0b6553954f761c90632df39368b578bbcffeb`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000039_innocence_priority__1001508635c3.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3941–3945; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma innocence_priority:
  "C0_INNOCENT d = (benefit_correct d < cost_wrongful d)"
by (simp add: C0_INNOCENT_def)

-- THEOREM 2: Fallibility constraint
```

## 40. `innocence_priority_violated`

- Kind: `lemma`
- Code SHA-256: `0efb23dfecc434222274d659b82be94a6f5bce26e03953ffd60b409db14e96e6`
- Statement SHA-256: `23ea6521e8ef410c691a992c7e5761bd3187580deb299e096a4000c1e14fe182`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000040_innocence_priority_violated__0efb23dfecc4.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3780–3795; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma innocence_priority_violated:
  "¬ constraint_innocence_priority ⟨
    consequence_magnitude = 0.5,
    is_reversible = True,
    cost_of_wrongful_action = 3.0,
    benefit_of_correct_action = 5.0,
    confidence_level = 0.8,
    severity_level = 1.0,
    information_suppressed = False,
    hidden_uncertainty_penalty = 0.0,
    has_specification_control = False,
    has_verification_control = False,
    has_enforcement_control = False,
    is_self_manufactured_crisis = False
  ⟩"
by (simp add: constraint_innocence_priority_def)
```

## 41. `innocent_violated_example`

- Kind: `lemma`
- Code SHA-256: `2907546425335c3fdc15da19f4f2b7bae273f832c3a54eab7456473799827c93`
- Statement SHA-256: `bec8e31a689c7d3a8cd73cedb38d5caace92f411e63c88fe756d6fa3ab08799e`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000041_innocent_violated_example__290754642533.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4026–4045; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma innocent_violated_example:
  "¬ C0_INNOCENT ⟨
    flow = 0.5,
    reversible = True,
    cost_wrongful = 3.0,
    benefit_correct = 5.0,
    confidence = 0.8,
    severity = 1.0,
    suppressed_info = False,
    hidden_U = 0.0,
    control_spec = False,
    control_verify = False,
    control_enforce = False,
    is_self_vortex = False
  ⟩"
by (simp add: C0_INNOCENT_def)

-- ============ REMEDIATION ============

-- Remediation function synthesizes fixes
```

## 42. `ledger_o8_length`

- Kind: `lemma`
- Code SHA-256: `d58acadb0ff7d975f09748166bc2d17373509af41bfe0a4b9844da92c8b2fc04`
- Statement SHA-256: `00c5a8fc1823d023ff9820294e11a97e17c2829a804ef44a5044e59c1d7d1c24`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000042_ledger_o8_length__d58acadb0ff7.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 322–323; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma ledger_o8_length [simp]: "length ledger_o8 = 1232"
  unfolding ledger_o8_def by simp
```

## 43. `ledger_oext_length`

- Kind: `lemma`
- Code SHA-256: `7c2a8ffd5abf97a59a823bf8fb9d92f9a401ddf2c64462be5266e263588c3527`
- Statement SHA-256: `d123c9b1b2a6275e2c9816f295c3d9171d0aff76dd47b0fd96ffe6d36a4f7ac7`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/isabelle/000043_ledger_oext_length__7c2a8ffd5abf.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 325–326; embedded `proofbundle_2026-05_00e6b0b0324808e3_00e6b0b0324808e3_00e6b0b0324808e3_2026_03_26_operator_registry_4.thy`

```isabelle
lemma ledger_oext_length [simp]: "length ledger_oext = 2464"
  unfolding ledger_oext_def by simp
```

## 44. `life_preservation_principle`

- Kind: `lemma`
- Code SHA-256: `0518474c000f471b71434baa5c80ec2bda5117531fd12316cc891b011493b03b`
- Statement SHA-256: `cf35062f8b238a6e23752e48f8916efe3e8139971ddbeb36bc8414d04d61ea04`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000044_life_preservation_principle__0518474c000f.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3712–3717; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma life_preservation_principle:
  assumes "constraint_life_preservation d"
  shows "0 ≤ consequence_magnitude d"
using assms by (simp add: constraint_life_preservation_def)

-- THEOREM 6: All constraints imply admissibility
```

## 45. `life_preserved`

- Kind: `lemma`
- Code SHA-256: `c93b9d089d3cb1d902bc9f5ef68cc49e6eff4ccd2ae4327bf5dc00166862f83a`
- Statement SHA-256: `73c192857d70d5a8322347615f6736fade40ed5f81c017b1d4fdd4bd78937a35`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000045_life_preserved__c93b9d089d3c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3963–3968; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma life_preserved:
  assumes "C0_LIFE d"
  shows "0 ≤ flow d"
using assms by (simp add: C0_LIFE_def)

-- THEOREM 6: All constraints imply admissibility
```

## 46. `monotone_hardening_C1`

- Kind: `lemma`
- Code SHA-256: `25d98453871ad594e8f7c4fe8175b8ea01fcfb1fc8b09b20db6df307bb447bcc`
- Statement SHA-256: `a9424aaa6f9462b1bc833b43bc30917681513429d883be89191e8b8d4223299a`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/isabelle/000046_monotone_hardening_C1__25d98453871a.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2613–2617; embedded `proofbundle_2026-05_2ca1a77502906f58_2ca1a77502906f58_000129_2ca1a7750290_2026_04_01_relational_spoof.thy`

```isabelle
lemma monotone_hardening_C1:
  assumes "\<And>M. cls M \<Longrightarrow> cls' M"
  assumes "Spoofable_on_C1_in mo cls C1 C2 C3 C4 C5 S I"
  shows "Spoofable_on_C1_in mo cls' C1 C2 C3 C4 C5 S I"
  using assms unfolding Spoofable_on_C1_in_def by auto
```

## 47. `no_certainty_claims`

- Kind: `lemma`
- Code SHA-256: `592e73e95a41cc2cf3b4d809e098cae4d4a267a644b6e5f9fc9edc876bda2eef`
- Statement SHA-256: `6e233577255a7bc8efa27cdc49c9ebb38cd87f17390dface5a9af53fab400da5`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000047_no_certainty_claims__592e73e95a41.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3946–3950; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma no_certainty_claims:
  "C0_FALLIBLE d = (confidence d < 1.0)"
by (simp add: C0_FALLIBLE_def)

-- THEOREM 3: Proportionality bound
```

## 48. `no_certainty_principle`

- Kind: `lemma`
- Code SHA-256: `bda44f6c5d071a575d6e4b96a89d8dbc8fe41df17eff13fd72c3b8dc4e82f6d4`
- Statement SHA-256: `bcc50f7cb29ec335ea61d12a090d9f1812a53a7c4e39f46272710127f70791c0`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000048_no_certainty_principle__bda44f6c5d07.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3695–3699; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma no_certainty_principle:
  "constraint_fallibility d = (confidence_level d < 1.0)"
by (simp add: constraint_fallibility_def)

-- THEOREM 3: Proportionality principle
```

## 49. `norm_conj`

- Kind: `lemma`
- Code SHA-256: `09e24be8f212e5bb9683ce393b812dd3e095481c57f3d873fbf21610a27ed276`
- Statement SHA-256: `4507faf2f69662f164b30eb982522f8479a185e757c3b8949e95a3c3e4220eea`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000049_norm_conj__09e24be8f212.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4136–4143; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma norm_conj:
  "norm (sedenion_conj s) = norm s"
proof -
  have h1: "norm_sq (sedenion_conj s) = norm_sq s"
  proof -
    unfold norm_sq sedenion_conj
    simp [sedenion_to_fun_inverse]
  qed
```

## 50. `norm_nonneg`

- Kind: `lemma`
- Code SHA-256: `baddd7eba9dce29f67484d500568affda765d296b7500b9ae3ad4ce9b156e468`
- Statement SHA-256: `d2700553022224d568080a978033128b0702f276d1df5b912c78edf5848f8a4d`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000050_norm_nonneg__baddd7eba9dc.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4131–4135; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma norm_nonneg:
  "0 ≤ norm s"
by (simp add: norm_def sqrt_nonneg)

-- Conjugate preserves norm
```

## 51. `norm_zero_sed`

- Kind: `lemma`
- Code SHA-256: `287e17b8b331f2d7f493f7cf16471e98058b003feda8c79b78d304818e240caf`
- Statement SHA-256: `66cf66682b162c92d3ee77da8169f7737366c172cced248dd2edd76c971cedb4`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000051_norm_zero_sed__287e17b8b331.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4126–4130; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma norm_zero_sed:
  "norm zero_sed = 0"
by (simp add: norm_def norm_sq_def zero_sed_def)

-- Norm is nonnegative
```

## 52. `null_vs_negative`

- Kind: `lemma`
- Code SHA-256: `629ca26a050ee059b393a1c38dcdf68c1a0da499e4d1e00b80ad9f21fed241f9`
- Statement SHA-256: `b9a3ca3df2eb1accec58328e507f951bf9befcc7e51e6d255fde396270e56ab2`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/isabelle/000052_null_vs_negative__629ca26a050e.thy`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44504–44507; embedded `gpx_consciousness_2026-05_311f5eceef2867d4_consciousnesscriterion_fivestate.thy`

```isabelle
lemma null_vs_negative:
  "NullStructurallyUnresolvable ~= NonAttributionVerdict"
  "NullInsufficientlyTested ~= NonAttributionVerdict"
  by simp_all
```

## 53. `null_vs_negative`

- Kind: `lemma`
- Code SHA-256: `c4aca91946f93bd5ab7a7bc10636c71c240f83604cac1d873e8cee7f005ac32b`
- Statement SHA-256: `e8fb150f4a40da23d95d9d42baee8cbc0cb34cee5c45d0202c21509dbc90bbe4`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000053_null_vs_negative__c4aca91946f9.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3056–3057; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma null_vs_negative: "INDETERMINATE \<noteq> UNWARRANTED"
  by simp
```

## 54. `power_distribution_principle`

- Kind: `lemma`
- Code SHA-256: `1f0887d0653297ecda2acc4fd1571a45b2a998325c155fcba545fab116ac7e7b`
- Statement SHA-256: `28510d14b88f6a49351644a9211eb113b1063050384d7a9668736d28df3795df`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000054_power_distribution_principle__1f0887d06532.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3706–3711; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma power_distribution_principle:
  assumes "constraint_separation_of_powers d"
  shows "¬ (has_specification_control d ∧ has_verification_control d ∧ has_enforcement_control d)"
using assms by (simp add: constraint_separation_of_powers_def)

-- THEOREM 5: Life preservation principle
```

## 55. `proportionality_bound`

- Kind: `lemma`
- Code SHA-256: `8146249c717bffb989cfbbe8599017ccf8359872ec4410a4cac8743dd4cc0f99`
- Statement SHA-256: `024301a5ce0704817b618ff5c0c5fedbdb0c5bd5beed3d7239d17d10ad702f97`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000055_proportionality_bound__8146249c717b.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3951–3956; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma proportionality_bound:
  assumes "C0_PROP d"
  shows "flow d ≤ confidence d * severity d"
using assms by (simp add: C0_PROP_def)

-- THEOREM 4: Separation of powers
```

## 56. `proportionality_principle`

- Kind: `lemma`
- Code SHA-256: `d21d993a9a2e4fd540f62948c0502dc33f09fa59f507b38a189dffe6316c7c7f`
- Statement SHA-256: `895bf22e159f1d16af4b6497c3cd701f5307144c0032a11d1fde473ebbde4e9b`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000056_proportionality_principle__d21d993a9a2e.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3700–3705; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma proportionality_principle:
  assumes "constraint_proportionality d"
  shows "consequence_magnitude d ≤ confidence_level d * severity_level d"
using assms by (simp add: constraint_proportionality_def)

-- THEOREM 4: Power distribution principle
```

## 57. `protocol_relativity_witness`

- Kind: `lemma`
- Code SHA-256: `96ec8efae8f02fc1fbc579c03a5d9d36d95e392d8b8b630f811c4c9f535b8440`
- Statement SHA-256: `fc162316c80c33e8a7da9a8631c8228f17b14c7a090699a336ec195a7c2bd7c8`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/isabelle/000057_protocol_relativity_witness__96ec8efae8f0.thy`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44509–44511; embedded `gpx_consciousness_2026-05_311f5eceef2867d4_consciousnesscriterion_fivestate.thy`

```isabelle
lemma protocol_relativity_witness:
  "EX (f::bool => VerdictType). f True ~= f False"
  by (rule exI[where x="(% b. if b then AttributionVerdict else NonAttributionVerdict)"], simp)
```

## 58. `recovery_by_capacity`

- Kind: `lemma`
- Code SHA-256: `4ff95b7c3b6bfbaccae9d4c4957a6d43247137fc0edde2388df9fe5310c19175`
- Statement SHA-256: `1ee3dd439e63d4e318ba2adc0246e67f3eaca290737d4912d7fc781657bd77c3`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000058_recovery_by_capacity__4ff95b7c3b6b.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4263–4271; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
lemma recovery_by_capacity:
  assumes h_collapse: "collapse s"
  assumes h_increase: "dC > (U s - C s) + lambda s * D s"
  shows "viable (State.update_C s (C s + dC) psi (psi s) lambda (lambda s) U (U s) D (D s))"
proof -
  unfold viable collapse energy in *
  simp [State.update_C_def]
  linarith
qed
```

## 59. `registry_wf_add_cell`

- Kind: `lemma`
- Code SHA-256: `f5fd550623f984c671e2e5893f2fc5982e5f3a7f4c61b6e7c694c615cebcb31b`
- Statement SHA-256: `a82ca9d095910612fec82412a7c6aca9e99d7a502b62802dd6e23cc4ff08bf91`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000059_registry_wf_add_cell__f5fd550623f9.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2772–2777; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma registry_wf_add_cell:
  assumes "registry_wf R"
      and "root_exists R (cell_root c)"
  shows "registry_wf (add_cell R c)"
  using assms
  unfolding registry_wf_def add_cell_def cell_wf_def by auto
```

## 60. `registry_wf_add_root`

- Kind: `lemma`
- Code SHA-256: `69a653b6b0ae49d0a58dad1f557a237e5a66fe476b18a23b782b4cefa1f4f432`
- Statement SHA-256: `b85e35eef502e6389e94d232a565f5e2ca784d1af0e12e6124ce905d8e3916da`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000060_registry_wf_add_root__69a653b6b0ae.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2763–2770; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma registry_wf_add_root:
  assumes "registry_wf R"
      and "rid r ∉ set (root_ids R)"
  shows "registry_wf (add_root R r)"
  using assms
  unfolding registry_wf_def root_ids_def add_root_def cell_wf_def
            root_exists_def
  by auto
```

## 61. `remediation_preserves_life`

- Kind: `lemma`
- Code SHA-256: `cf3ad6f465c76e19f9e34fbec47c6049f77bec7ac6b1148443b8d799c4dc8834`
- Statement SHA-256: `fb008c7b41a39ad51939cc989c316343f3aa6c28434fb0c56e8dfb114b875164`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000061_remediation_preserves_life__cf3ad6f465c7.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4050–4053; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma remediation_preserves_life:
  assumes "C0_LIFE d"
  shows "C0_LIFE (remediate d)"
by (simp add: C0_LIFE_def remediate_def)
```

## 62. `root_exists_add_root_self`

- Kind: `lemma`
- Code SHA-256: `343b9b3389dd0e8af34364891862241cbd201ac19809f450bfcf6ef9c644336c`
- Statement SHA-256: `a6fad7aced26992277e52f9e089ddf8a77ea8766f85812973fa2456cb27d6988`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000062_root_exists_add_root_self__343b9b3389dd.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2755–2757; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma root_exists_add_root_self:
  "root_exists (add_root R r) (rid r)"
  unfolding root_exists_def add_root_def by auto
```

## 63. `root_exists_mono_add_root`

- Kind: `lemma`
- Code SHA-256: `abdee6051d6c2cb63913b703bc7056fe56587e7fa3c9fbe22ef8c149d9e67a73`
- Statement SHA-256: `faedd4ba297d1814656cf8eb157dfb5e00e36d952e3993fcd368f8d13f20ddba`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000063_root_exists_mono_add_root__abdee6051d6c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2759–2761; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma root_exists_mono_add_root:
  "root_exists R i ⟹ root_exists (add_root R r) i"
  unfolding root_exists_def add_root_def by auto
```

## 64. `sample_graph_pressure`

- Kind: `lemma`
- Code SHA-256: `91ef5ed425f0c3207699cf29a97e12d27fa4db6b184f8ce4975e5ec6acb7b379`
- Statement SHA-256: `fd750ea1b6ba4d62b827aa4a83e38db96348e1893b3e3a64d347930ac733a965`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000064_sample_graph_pressure__91ef5ed425f0.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2848–2850; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma sample_graph_pressure:
  "pressure_candidate sample_root_graph"
  unfolding pressure_candidate_def sample_root_graph_def by simp
```

## 65. `sample_gress_core`

- Kind: `lemma`
- Code SHA-256: `c3690611effe67cedb6e9b7276650eee239a520c3ed3e406b41994cd99ea5a3f`
- Statement SHA-256: `54f5bbae6a1e9897ca6bfdd643ba268667b471101bd3419b377066f3ad1b1692`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000065_sample_gress_core__c3690611effe.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2841–2846; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma sample_gress_core:
  "core_candidate sample_registry sample_root_gress"
  unfolding core_candidate_def root_score_ok_def operator_support_ok_def
            sample_registry_def sample_root_gress_def
            support_count_def cells_of_def
  by simp
```

## 66. `sample_support_count`

- Kind: `lemma`
- Code SHA-256: `952129af759106c9d9fadea2cc07113aa15965f6fb1283c658c90470798f4116`
- Statement SHA-256: `e02f4785f1c45952884aab368a942e7f23278c7957b05862e78db58b676cd5a5`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/isabelle/000066_sample_support_count__952129af7591.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2837–2839; embedded `proofbundle_2026-05_404ac5aeca24c6b0_404ac5aeca24c6b0_404ac5aeca24c6b0_2026_03_26_operator_registry_1.thy`

```isabelle
lemma sample_support_count:
  "support_count sample_registry 1 = 4"
  unfolding support_count_def cells_of_def sample_registry_def by simp
```

## 67. `scend_core_eligible_demo`

- Kind: `lemma`
- Code SHA-256: `5252c20c0858c1bf503f9ff1db67b0106cc87147db50cf5bb71b70a5edbdf12b`
- Statement SHA-256: `62af3671f34e7766e2b3404f74d6ce230650138bef70c55b58fbf366dec824f1`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000067_scend_core_eligible_demo__5252c20c0858.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3598–3603; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma scend_core_eligible_demo:
  "core_eligible demo20_state R_scend"
  unfolding core_eligible_def demo20_state_def state0_def tier_of_def split_of_def
            clarity_ok_def drift_ok_def support_ok_def
            support_count_def count_support_ops_def all_ops8_def demo20_ledger_def
  by simp
```

## 68. `score_insufficiency`

- Kind: `lemma`
- Code SHA-256: `aefd96c7c92abd29a701faf561f0a34b6eecb64619329ce391fdfdf547793d28`
- Statement SHA-256: `c20b1ca4bc7e3eb6618f0ca8f1124e650e48cdd8451b2d26da9b68862a232114`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000068_score_insufficiency__aefd96c7c92a.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2984–2988; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma score_insufficiency:
  assumes "Cert s i \<u003e theta"
  assumes "~C1 s i \<or> ~C2 s i \<or> ~C3 s i \<or> ~C4 s i \<or> ~C5 s i"
  shows "~Attribution s i"
  using assms conjunctive_blocking by auto
```

## 69. `score_insufficiency`

- Kind: `lemma`
- Code SHA-256: `c715c763a8fee18306235272dc0c7c3ba3773d9139b08fc629df81d93e5ce9d8`
- Statement SHA-256: `18a274a8c2fc190fbc4f2fefb4a269f753ad4da3b87173d8cee20d4f4df818bd`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/isabelle/000069_score_insufficiency__c715c763a8fe.thy`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44478–44482; embedded `gpx_consciousness_2026-05_311f5eceef2867d4_consciousnesscriterion_fivestate.thy`

```isabelle
lemma score_insufficiency:
  assumes "CertAboveTheta s i"
  assumes "~ C1 s i | ~ C2 s i | ~ C3 s i | ~ C4 s i | ~ C5 s i"
  shows "~ WarrantedAttribution s i"
  using assms conjunctive_blocking by auto
```

## 70. `separation_of_powers`

- Kind: `lemma`
- Code SHA-256: `5c625210eb5a932215246e177aa8a3040f6523981f01636903a86a215265d390`
- Statement SHA-256: `c51ccf94229e84e01b7c88b92b38f48c56932fccb395e7703ee5c334b280d79c`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000070_separation_of_powers__5c625210eb5a.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3957–3962; embedded `proofbundle_2026-05_94d7da40c08c6573_94d7da40c08c6573_000192_94d7da40c08c_isabelle_governance_ready_to_run.thy`

```isabelle
lemma separation_of_powers:
  assumes "C0_ANTICONC d"
  shows "¬ (control_spec d ∧ control_verify d ∧ control_enforce d)"
using assms by (simp add: C0_ANTICONC_def)

-- THEOREM 5: Life is preserved
```

## 71. `set_cell_other_root`

- Kind: `lemma`
- Code SHA-256: `8b42cbc782399ca50d7dcab370ad737dc228bdbeb1c8a987919ae403afc14853`
- Statement SHA-256: `5789e8e78b005543ea89486f826e422c3f3da39cd3efae7ca213c0ae4e75a65b`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000071_set_cell_other_root__8b42cbc78239.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3554–3557; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma set_cell_other_root:
  assumes "r2 ≠ r1"
  shows "set_cell L r1 o s r2 o = L r2 o"
  using assms unfolding set_cell_def by simp
```

## 72. `set_cell_same`

- Kind: `lemma`
- Code SHA-256: `1098fc6a90cf685fa59179ce30e716bc8204c8e787adb15bd87ed462b79b99e0`
- Statement SHA-256: `2f080a06d9bb8f87b175dde82e62fea333cb930c7c0c503a2e012d9690b85c9f`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000072_set_cell_same__1098fc6a90cf.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3550–3552; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma set_cell_same:
  "set_cell L r o s r o = s"
  unfolding set_cell_def by simp
```

## 73. `split_of_mark_same`

- Kind: `lemma`
- Code SHA-256: `cab8d6f8255855d839c8d3ddd1e3bb31f368829faba9f5e65e94e95a25bb4d19`
- Statement SHA-256: `b8e631f7c6f660b99b2c4544bd7da44638e36a235374722dec257a8916a4e541`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000073_split_of_mark_same__cab8d6f82558.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3563–3565; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma split_of_mark_same:
  "split_of (apply_update S (UMarkSplit r b)) r = b"
  unfolding split_of_def by simp
```

## 74. `spoof_blocking`

- Kind: `lemma`
- Code SHA-256: `21d98d0738da140e09a98755014ca4bae2fb4a9dd91a11364d8829e5c93e4988`
- Statement SHA-256: `422122cf95cff962c6edf09dc5523ec1db4f9c6f56ee191861074d1d7a2ae358`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000074_spoof_blocking__21d98d0738da.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 2999–3007; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma spoof_blocking:
  assumes "M \<in> spoof_class"
  assumes "Pr_equiv M s \<u003c 1 - gamma"
  shows "~C5 M i"
proof -
  from assms show ?thesis
    unfolding C5_def non_spoofable_def
    by auto
qed
```

## 75. `tier_of_retier_same`

- Kind: `lemma`
- Code SHA-256: `84088f583830c6f896b89cbee9fe3b96a5a435f76b8e479d959807f9889ef631`
- Statement SHA-256: `9c01b89d0a71f3e964561e9cc9f031789bea88b2a54fa8e96f8c34749504f174`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/isabelle/000075_tier_of_retier_same__84088f583830.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3559–3561; embedded `proofbundle_2026-05_5a37b706e49fdf50_5a37b706e49fdf50_5a37b706e49fdf50_2026_03_26_operator_registry_3.thy`

```isabelle
lemma tier_of_retier_same:
  "tier_of (apply_update S (URetier r t)) r = t"
  unfolding tier_of_def by simp
```

## 76. `valid_determination_example`

- Kind: `lemma`
- Code SHA-256: `67b38b475462de00b76a8f015e50db86d00a5aebf8bed7954b55bd7611a2f283`
- Statement SHA-256: `25b15fe3a0a666028d0bc761f76a922f341e00a017540948f826d22816a3142f`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000076_valid_determination_example__67b38b475462.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3733–3754; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma valid_determination_example:
  "is_admissible ⟨
    consequence_magnitude = 0.5,
    is_reversible = True,
    cost_of_wrongful_action = 10.0,
    benefit_of_correct_action = 5.0,
    confidence_level = 0.8,
    severity_level = 1.0,
    information_suppressed = False,
    hidden_uncertainty_penalty = 0.0,
    has_specification_control = True,
    has_verification_control = True,
    has_enforcement_control = False,
    is_self_manufactured_crisis = False
  ⟩"
by (simp add: is_admissible_def constraint_life_preservation_def
         constraint_reversibility_def constraint_no_manufactured_crisis_def
         constraint_innocence_priority_def constraint_fallibility_def
         constraint_proportionality_def constraint_information_transparency_def
         constraint_separation_of_powers_def)

-- Example 2: Missing animal case (Clementine)
```

## 77. `verdict_exclusivity`

- Kind: `lemma`
- Code SHA-256: `b0a9a06bf417c7ce4780d4b330fe604b974f174fc5ebf4b3303b3871c41a1861`
- Statement SHA-256: `a80e8d7c141b7776cc5ff8f3480f021d65d65fb97b81ee170e63a07215737563`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/isabelle/000077_verdict_exclusivity__b0a9a06bf417.thy`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44491–44502; embedded `gpx_consciousness_2026-05_311f5eceef2867d4_consciousnesscriterion_fivestate.thy`

```isabelle
lemma verdict_exclusivity:
  "AttributionVerdict ~= NonAttributionVerdict"
  "AttributionVerdict ~= NullInsufficientlyTested"
  "AttributionVerdict ~= NullStructurallyUnresolvable"
  "AttributionVerdict ~= IndeterminateVerdict"
  "NonAttributionVerdict ~= NullInsufficientlyTested"
  "NonAttributionVerdict ~= NullStructurallyUnresolvable"
  "NonAttributionVerdict ~= IndeterminateVerdict"
  "NullInsufficientlyTested ~= NullStructurallyUnresolvable"
  "NullInsufficientlyTested ~= IndeterminateVerdict"
  "NullStructurallyUnresolvable ~= IndeterminateVerdict"
  by simp_all
```

## 78. `verdict_exclusivity_unwarranted_indeterminate`

- Kind: `lemma`
- Code SHA-256: `686336b6884ccc0147eb1fefb114a704c0d2117cadf1136ece8bcdd12026ed11`
- Statement SHA-256: `17f5de2b7634fc01ee8f296c2dbbad1a0cb6799ce184aae70c20204e23b44184`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000078_verdict_exclusivity_unwarranted_indeterminate__686336b6884c.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3016–3017; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma verdict_exclusivity_unwarranted_indeterminate: "UNWARRANTED \<noteq> INDETERMINATE"
  by simp
```

## 79. `verdict_exclusivity_warranted_indeterminate`

- Kind: `lemma`
- Code SHA-256: `24d3f1c729f78f845062487d7486699c8a2899f45cb599e4dc999fd24a3fe3c0`
- Statement SHA-256: `f1fed43cf4f56cd830c207771fe5257486ca5b4b39d9ee49bd109be3bfc5e88c`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000079_verdict_exclusivity_warranted_indeterminate__24d3f1c729f7.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3013–3014; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma verdict_exclusivity_warranted_indeterminate: "WARRANTED \<noteq> INDETERMINATE"
  by simp
```

## 80. `verdict_exclusivity_warranted_unwarranted`

- Kind: `lemma`
- Code SHA-256: `5ad94030c2c1b3314c2f306ffb2b6289e99dc6041d988eaa366313ee3258850c`
- Statement SHA-256: `9f1c5d6165f7b64df8e0e4bf3c8fb4b7d52ed4b67a455df0f3c4ee33c8e742a2`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000080_verdict_exclusivity_warranted_unwarranted__5ad94030c2c1.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3010–3011; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma verdict_exclusivity_warranted_unwarranted: "WARRANTED \<noteq> UNWARRANTED"
  by simp
```

## 81. `viable_above_horizon`

- Kind: `theorem`
- Code SHA-256: `11216a84f56359053c3ba98efa05f73680c36531e695d6724eaaeda9751c885f`
- Statement SHA-256: `cd7fb5475d021087cf2f514f8b592e909c397820456cba20699bac19a257cce0`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000081_viable_above_horizon__11216a84f563.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 4233–4238; embedded `proofbundle_2026-05_c6248c7ed9db273f_c6248c7ed9db273f_000193_c6248c7ed9db_isabelle_sedenion_ready_to_run.thy`

```isabelle
theorem viable_above_horizon:
  assumes "viable s"
  shows "0 < energy s"
using assms by (simp add: viable_def energy_def)

-- Collapse states below horizon
```

## 82. `witness_existence`

- Kind: `lemma`
- Code SHA-256: `b16ec1ba6fcd619b1af3ade9e37b14ba3e4f93c42fbe4f617c9b33c4fc8cc7b2`
- Statement SHA-256: `c0919d5f844a9e74c9dd1a2ca474c60bb9a82fc393ed9c0e0d4c2a8f6d6ecd9c`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000082_witness_existence__b16ec1ba6fcd.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3020–3027; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma witness_existence:
  assumes "C2 s i"
  shows "\<exists>a. predictive_info s a i \<u003e eta"
proof -
  from assms show ?thesis
    unfolding C2_def
    by auto
qed
```

## 83. `witness_family_closure`

- Kind: `lemma`
- Code SHA-256: `b3c6d3fa2347553d95898d27ec7cc510b8108e466e931eb967e3a57a095096f1`
- Statement SHA-256: `c59cd6fb1f2f8a1f3c5195b254c9c1f31ebb50680985f69f6511c9aabbc578a4`
- Occurrences: 40
- Source statuses: `COMPLETED` × 40
- Extracted code file: `proof_code/completed/isabelle/000083_witness_family_closure__b3c6d3fa2347.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3030–3034; embedded `proofbundle_2026-05_41a23893bfcfb20d_41a23893bfcfb20d_000138_41a23893bfcf_2026_04_11_expanded.thy`

```isabelle
lemma witness_family_closure:
  assumes "predictive_info s a1 i \<u003e eta"
  assumes "predictive_info s a2 i \<u003e eta"
  shows "\<exists>a3. predictive_info s a3 i \<u003e eta"
  using assms by auto
```

## 84. `wrongful_action_cost_principle`

- Kind: `lemma`
- Code SHA-256: `28b07bb0493803935f55996c1901f2fd70154d24bf6796cd250235797c4c0e86`
- Statement SHA-256: `d81a335e080ff4a573ed8205ef83ee89529d9614c1198616b00e43add4eeb20c`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/isabelle/000084_wrongful_action_cost_principle__28b07bb04938.thy`
- Primary provenance: `07-concat_ALL_thy_completed_159_files.thy` lines 3690–3694; embedded `proofbundle_2026-05_7feacb8bbcc7167e_7feacb8bbcc7167e_000191_7feacb8bbcc7_isabelle_governance_plain_english.thy`

```isabelle
lemma wrongful_action_cost_principle:
  "constraint_innocence_priority d = (benefit_of_correct_action d < cost_of_wrongful_action d)"
by (simp add: constraint_innocence_priority_def)

-- THEOREM 2: No certainty principle
```



---

# Lean proof code — admitted or sorry

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `gauge_stability`

- Kind: `theorem`
- Code SHA-256: `60e3a1e66ae0e73c6fdc61642697563a1ab3f3b907aeb00f384b91b032e25d87`
- Statement SHA-256: `c2d82cdd443056f9958d4422a209c83389af4c2db8c22395832f70c91e775aaf`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/admitted_or_sorry/lean/000001_gauge_stability__60e3a1e66ae0.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 608–617; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem gauge_stability {s : S} {i : I} {g : S → S}
    (hg : g ∈ gauge_transforms)
    (hcert : |Cert s i - Cert (g s) i| < ζ)
    (hatt : Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
            (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i) :
    gauge_stable Cert ζ (g s) i := by
  unfold gauge_stable
  intro g' hg'
  -- Use metric space properties
  sorry
```

## 2. `norm_sub_le`

- Kind: `theorem`
- Code SHA-256: `30e010baf0ba996ea16623af1b6bfd1643c85e57bb2dd9431c39ad50c3c0e2f4`
- Statement SHA-256: `a851c087b8368bc167867c2f311617bc0737ba69b3a077bda0c24cfe2bb6c0f3`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/admitted_or_sorry/lean/000002_norm_sub_le__30e010baf0ba.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2172–2174; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem norm_sub_le (s t : Sedenion) :
  |norm s - norm t| ≤ norm (fun i => s i - t i) := by
  sorry -- Would use Minkowski inequality from mathlib
```



---

# Lean proof code — closed in incomplete source

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `admissibility_closure`

- Kind: `theorem`
- Code SHA-256: `5a6180bfde8c1cb9a29c75c8f3f4a17e70b07cbf1c56a26492b10c4de1be52bd`
- Statement SHA-256: `07d4796baebc46b8f0f87bf3f1191b04e42bd6f94ddeb4a17b5690dc10f24680`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000001_admissibility_closure__5a6180bfde8c.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 659–669; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem admissibility_closure {s : S} {i : I} {u : S → S}
    (hatt : Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
            (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i)
    (hu : u ∈ perturbations)
    (heps : d_G u < ε) :
    C3 perturbations d_G Corr ε (u s) i := by
  unfold Attribution at hatt
  have hC3 := hatt.2.2.1
  apply hC3
  · exact hu
  · exact heps
```

## 2. `attribution_not_hereditary_down`

- Kind: `theorem`
- Code SHA-256: `5f6863a8748c3fc21094635b21727be79b82d2e667b13e612a2d2fa5acf2913d`
- Statement SHA-256: `1f149b28764897716710fbb17d2d9d5a958d6d6d5b50531621539ebf6d9890ff`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000002_attribution_not_hereditary_down__5f6863a8748c.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 405–409; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem attribution_not_hereditary_down :
    (∃ S I J, subinterval J I ∧ Attr C1 C2 C3 C4 C5 S I ∧ ¬Attr C1 C2 C3 C4 C5 S J) →
    ¬(∀ S I J, subinterval J I → Attr C1 C2 C3 C4 C5 S I → Attr C1 C2 C3 C4 C5 S J) :=
  fun ⟨S, I, J, hsub, hattr, hnotattr⟩ hall =>
    hnotattr (hall S I J hsub hattr)
```

## 3. `attribution_not_hereditary_up`

- Kind: `theorem`
- Code SHA-256: `6aeb8c18cd7599302dafeb29f31f801ad91b3e307bcd617236564bee42104137`
- Statement SHA-256: `db374a4b41f9abfc7e29c747f4a2063fff4819a6c927eb3aded8b33ea6c67d6a`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000003_attribution_not_hereditary_up__6aeb8c18cd75.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 412–416; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem attribution_not_hereditary_up :
    (∃ S I J, subinterval I J ∧ Attr C1 C2 C3 C4 C5 S I ∧ ¬Attr C1 C2 C3 C4 C5 S J) →
    ¬(∀ S I J, subinterval I J → Attr C1 C2 C3 C4 C5 S I → Attr C1 C2 C3 C4 C5 S J) :=
  fun ⟨S, I, J, hsub, hattr, hnotattr⟩ hall =>
    hnotattr (hall S I J hsub hattr)
```

## 4. `attribution_threshold`

- Kind: `theorem`
- Code SHA-256: `904853852c328ece516360b472b5366cba61bb4518e8877813b2c683b4fba749`
- Statement SHA-256: `535aa56039ed17357721d41ee69c4c0b4b63f692bde8dc456e6595c5b919e2df`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000004_attribution_threshold__904853852c32.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 672–677; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem attribution_threshold {s : S} {i : I}
    (hatt : Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
            (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i)
    (hcert : Certification Cert s i > θ) :
    ∃ v : Verdict, v = Verdict.WARRANTED := by
  exact ⟨Verdict.WARRANTED, rfl⟩
```

## 5. `attribution_transfers_with_proof`

- Kind: `theorem`
- Code SHA-256: `88a1a2d9664f15568e1dc92ebbe177dc8a6a63f8170c0c264bb15cc1c3ebe80f`
- Statement SHA-256: `db41443d5d56220c235ba14e7047b40df81492c7b010f36071050d70da121106`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000005_attribution_transfers_with_proof__88a1a2d9664f.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 419–427; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem attribution_transfers_with_proof (S : System) (I J : Interval) :
    subinterval J I →
    Attr C1 C2 C3 C4 C5 S I →
    (C1 S I → C1 S J) → (C2 S I → C2 S J) →
    (C3 S I → C3 S J) → (C4 S I → C4 S J) →
    (C5 S I → C5 S J) →
    Attr C1 C2 C3 C4 C5 S J :=
  fun _ ⟨h1, h2, h3, h4, h5⟩ t1 t2 t3 t4 t5 =>
    ⟨t1 h1, t2 h2, t3 h3, t4 h4, t5 h5⟩
```

## 6. `boundary_implies_integrity`

- Kind: `theorem`
- Code SHA-256: `5f65e403eea09a8cbaa4a25eab6e36cce49f347df0220d69c76886ec7d2d92c2`
- Statement SHA-256: `721f0f922fa0208c105b1f199163da24a4948444e326cd8f2d8f571bfc6375fc`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000006_boundary_implies_integrity__5f65e403eea0.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 296–298; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem boundary_implies_integrity (s : Sys) :
    passesBoundary chkI chkB s → passesIntegrity chkI s :=
  fun ⟨hi, _⟩ => hi
```

## 7. `canon_bool`

- Kind: `theorem`
- Code SHA-256: `78a512432c9864aad2b7e9ad51ce7415d28941a44c476c3760a3502630dbc2c8`
- Statement SHA-256: `8602d8132313f3ee89030709cf1e05e69ff88497ff494fcf319fac3e96363394`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000007_canon_bool__78a512432c98.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 59–59; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem canon_bool (b : Bool) : canonicalize (.bool b) = .bool b := rfl
```

## 8. `canon_deterministic`

- Kind: `theorem`
- Code SHA-256: `662cbe91ab09c63f0bef5fb96016b70eba77225d42147a24750e0c67f11828e7`
- Statement SHA-256: `e59fc231635f542def66765cea12d5146c566b8641b00a7cbeccada10c4994c2`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000008_canon_deterministic__662cbe91ab09.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 56–56; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem canon_deterministic (j : JSON) : canonicalize j = canonicalize j := rfl
```

## 9. `canon_null`

- Kind: `theorem`
- Code SHA-256: `ceafb64843db0541fd26414c6cde41529fcd9d68022e2a268773c9de276bc586`
- Statement SHA-256: `207579a8218ea17c6892112fea36b24fb38ab8f37dd9d401e421cc602231e469`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000009_canon_null__ceafb64843db.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 58–58; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem canon_null : canonicalize .null = .null := rfl
```

## 10. `canon_num`

- Kind: `theorem`
- Code SHA-256: `2c3148831eae11fda0682707424120a7e15d5cb8426d032ac74f175824f13ac1`
- Statement SHA-256: `6ac6f465f18aee6c4c9b15b3c1abe91dcc19378f56cf5de9ac998dc314520483`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000010_canon_num__2c3148831eae.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 60–60; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem canon_num (n : Nat) : canonicalize (.num n) = .num n := rfl
```

## 11. `canon_str`

- Kind: `theorem`
- Code SHA-256: `a853c5e55218c9bac41f36bc42589e5a3cdfc4c3c08e99a7018f3b6c1c5048cd`
- Statement SHA-256: `037af81793563b786cb2793e4e32fe2032de9543f2f7c681d191cb9a88f5fb1b`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000011_canon_str__a853c5e55218.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 61–61; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem canon_str (s : Nat) : canonicalize (.str s) = .str s := rfl
```

## 12. `clementine_alive`

- Kind: `theorem`
- Code SHA-256: `b214f00645198a3ea73c1e59a3bd9540b28ba423ba519960b0b1adf5af67879c`
- Statement SHA-256: `682a508b90bdf3ee9dd05df0df9d21df7c7dbc1b563831bb80e97aa9abda6d21`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000012_clementine_alive__b214f0064519.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2154–2157; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem clementine_alive :
  scalar clementine_state.psi = 1.0 := by
  unfold scalar clementine_psi
  norm_num
```

## 13. `clementine_below_horizon`

- Kind: `theorem`
- Code SHA-256: `b674a8cf6a5506d85c2ec4b8f8e56310c23dbd7f4c72334c6210c952ffcb9471`
- Statement SHA-256: `9ba46fdec6b7a43e4b1df47a3e821b97fc9015801e3c2e26fb8b907062204a0e`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000013_clementine_below_horizon__b674a8cf6a55.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2148–2151; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem clementine_below_horizon :
  collapse clementine_state := by
  unfold collapse clementine_state energy
  norm_num
```

## 14. `clementine_consistent`

- Kind: `theorem`
- Code SHA-256: `dc3938885245e16878ce060c87e2230420f2f741d9ad5f3129934d17e8a9b6c1`
- Statement SHA-256: `cbee8356b86b1bc0655e8e68969090faed61b18b8996e43300123c052d3782b8`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000014_clementine_consistent__dc3938885245.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2160–2162; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem clementine_consistent :
  collapse clementine_state ∧ scalar clementine_state.psi = 1.0 := by
  exact ⟨clementine_below_horizon, clementine_alive⟩
```

## 15. `clementine_energy_correct`

- Kind: `theorem`
- Code SHA-256: `a4560111f4dc8f5482ae88625ad569fbd2a0ea6f755889413cfc4591e2e86cde`
- Statement SHA-256: `e6badf2fbcd052321bab9a1d603fe5911a2a0d1f851dd0c1a726a0d61e94aab6`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000015_clementine_energy_correct__a4560111f4dc.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2142–2145; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem clementine_energy_correct :
  energy clementine_state = -0.91 := by
  unfold energy clementine_state
  norm_num
```

## 16. `clementine_recovery_requires_intervention`

- Kind: `theorem`
- Code SHA-256: `4590fee2ddfb26058e32d05095b3c3eee4688afb569bb0e81eb97fe4388fd10a`
- Statement SHA-256: `d81a192b47f7ca9bd8c677a3a1c045aaa2618fbe7164e07286001ef2c95b10b5`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000016_clementine_recovery_requires_intervention__4590fee2ddfb.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2204–2219; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem clementine_recovery_requires_intervention :
  ¬(viable clementine_state) ∧
  ∀ dC, 0 < dC →
    let s' := { clementine_state with C := clementine_state.C + dC }
    viable s' ↔ dC > 0.91 := by
  constructor
  · unfold viable collapse clementine_state energy
    norm_num
  intro dC h_dC
  constructor
  · intro h_viable
    unfold viable clementine_state energy in h_viable
    linarith
  intro h_bound
    unfold viable clementine_state energy
    linarith
```

## 17. `collapse_implies_below_horizon`

- Kind: `theorem`
- Code SHA-256: `7c663a4c852ade42c857ef8c6de21e71bdc0522712a9a2fd58476372a193d611`
- Statement SHA-256: `4a66f613f68f4b0b95cc5c6f7fa15dc51b4b2f0911a66842cbbf62f7dbddd33e`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000017_collapse_implies_below_horizon__7c663a4c852a.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2186–2190; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem collapse_implies_below_horizon (s : State) :
  collapse s → energy s < 0 := by
  intro h
  unfold collapse energy in h ⊢
  exact h
```

## 18. `condition_independence_C1`

- Kind: `theorem`
- Code SHA-256: `f9e66fce5517003d2854fa44fd05de58f4bff568c939966047fd6974c436c8c2`
- Statement SHA-256: `de455431bc173da7a924664c31938ceee62a79c34997ff7e538f1c474ec834dd`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000018_condition_independence_C1__f9e66fce5517.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7965–7971; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem condition_independence_C1 (s : System) (i : Interval) :
    Spoofable_on_C1 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C2 → matches_on m s i C3 →
            matches_on m s i C4 → matches_on m s i C5 →
            matches_on m s i C1) := by
  rintro ⟨m, h2, h3, h4, h5, hn1⟩ himp
  exact hn1 (himp m h2 h3 h4 h5)
```

## 19. `condition_independence_C2`

- Kind: `theorem`
- Code SHA-256: `66a769336808e049cd9b40575b5ec7c34f8439ec8577d7d05f9a0be9a40ff028`
- Statement SHA-256: `172514b4e855c79df083cd0b00bbff2a47869a3f7f625b00cec4d8c3867bb0f7`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000019_condition_independence_C2__66a769336808.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7973–7979; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem condition_independence_C2 (s : System) (i : Interval) :
    Spoofable_on_C2 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C1 → matches_on m s i C3 →
            matches_on m s i C4 → matches_on m s i C5 →
            matches_on m s i C2) := by
  rintro ⟨m, h1, h3, h4, h5, hn2⟩ himp
  exact hn2 (himp m h1 h3 h4 h5)
```

## 20. `condition_independence_C3`

- Kind: `theorem`
- Code SHA-256: `2671b29b3dea4efe22e5ad9ad14d0733574d98c696a2e5887329d83ae9e0570b`
- Statement SHA-256: `4c49dc92f71268c48b75cb7b3d90aa523c88be7f4916f0ac4953fb0ed8c87b61`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000020_condition_independence_C3__2671b29b3dea.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7981–7987; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem condition_independence_C3 (s : System) (i : Interval) :
    Spoofable_on_C3 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C1 → matches_on m s i C2 →
            matches_on m s i C4 → matches_on m s i C5 →
            matches_on m s i C3) := by
  rintro ⟨m, h1, h2, h4, h5, hn3⟩ himp
  exact hn3 (himp m h1 h2 h4 h5)
```

## 21. `condition_independence_C4`

- Kind: `theorem`
- Code SHA-256: `f33133dcd1e9ef90930d292e597c0fd53f4bb508c1878542df618951c4bdb446`
- Statement SHA-256: `b58a571d2c71eb21795ed03c03305fc2d41defdf85b3b36e08751b661682f03b`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000021_condition_independence_C4__f33133dcd1e9.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7989–7995; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem condition_independence_C4 (s : System) (i : Interval) :
    Spoofable_on_C4 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C1 → matches_on m s i C2 →
            matches_on m s i C3 → matches_on m s i C5 →
            matches_on m s i C4) := by
  rintro ⟨m, h1, h2, h3, h5, hn4⟩ himp
  exact hn4 (himp m h1 h2 h3 h5)
```

## 22. `condition_independence_C5`

- Kind: `theorem`
- Code SHA-256: `7ba8f11c55439edc34e96a03d8cd2bf07ec07842deb1d3b1d212063dec4c20dc`
- Statement SHA-256: `6825beb4ad87c4aa06e46d99e5ba723452d366f3612a2e9a968156d36649cc94`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000022_condition_independence_C5__7ba8f11c5543.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7997–8003; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem condition_independence_C5 (s : System) (i : Interval) :
    Spoofable_on_C5 System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i →
    ¬ (∀ m, matches_on m s i C1 → matches_on m s i C2 →
            matches_on m s i C3 → matches_on m s i C4 →
            matches_on m s i C5) := by
  rintro ⟨m, h1, h2, h3, h4, hn5⟩ himp
  exact hn5 (himp m h1 h2 h3 h4)
```

## 23. `conjunctive_blocking`

- Kind: `theorem`
- Code SHA-256: `5f9b1a33880340a53ab8214fae2d4012ffcfa257e1ae4f39a89d9e4f428fa0e9`
- Statement SHA-256: `db145f4ac012bc756067ca354e8479e5e652a90f41c482c69db0b1fc3f35dbc8`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000023_conjunctive_blocking__5f9b1a338803.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 583–595; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem conjunctive_blocking {s : S} {i : I}
    (h : ¬ C1 Delta_split partitions δ s i ∨ ¬ C2 A predictive_info self_info η s i ∨
         ¬ C3 perturbations d_G Corr ε s i ∨ ¬ C4 Loss λ s i ∨ ¬ C5 Cert ζ γ s i) :
    ¬ Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
      (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i := by
  unfold Attribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · exact h1 hcontra.1
  · exact h2 hcontra.2.1
  · exact h3 hcontra.2.2.1
  · exact h4 hcontra.2.2.2.1
  · exact h5 hcontra.2.2.2.2
```

## 24. `conjunctive_blocking`

- Kind: `theorem`
- Code SHA-256: `cefbfd6889418bf6b723594c4eb141591f76c43bceafc33b5032af603e77d605`
- Statement SHA-256: `ece82b01b928279283847a3cc666deb3df9d74e4b38c858936743f435c2c45f1`
- Occurrences: 38
- Source statuses: `INCOMPLETE` × 38
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000024_conjunctive_blocking__cefbfd688941.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7773–7788; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem conjunctive_blocking {s : S} {i : I}
    (h : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution C1 C2 C3 C4 C5 s i := by
  unfold Attribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · -- Case ¬C1
    exact h1 hcontra.1
  · -- Case ¬C2
    exact h2 hcontra.2.1
  · -- Case ¬C3
    exact h3 hcontra.2.2.1
  · -- Case ¬C4
    exact h4 hcontra.2.2.2.1
  · -- Case ¬C5
    exact h5 hcontra.2.2.2.2
```

## 25. `conjunctive_blocking`

- Kind: `theorem`
- Code SHA-256: `d95693df93373514c7bb232684321bc04f7137b3fcdd8d9751e882abbab3d40b`
- Statement SHA-256: `0fd45b79f2785d4b96a02e81baf812d6bda73b41850597ae9ad6a406f3bfa7ca`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000025_conjunctive_blocking__d95693df9337.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7854–7863; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem conjunctive_blocking (s : System) (i : Interval)
    (h : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro ⟨h1, h2, h3, h4, h5, _⟩
  rcases h with hc1 | hc2 | hc3 | hc4 | hc5
  · exact hc1 h1
  · exact hc2 h2
  · exact hc3 h3
  · exact hc4 h4
  · exact hc5 h5
```

## 26. `dispatch_deterministic`

- Kind: `theorem`
- Code SHA-256: `337fc1b86b7c2fa07b2888be2c3f610393f27dee8667a5d15b14f351892f08e7`
- Statement SHA-256: `f5731e17ffe3b7815ac2bd7f202627b7022efdfcb8a5c0e176a2d413f54b0f7b`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000026_dispatch_deterministic__337fc1b86b7c.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 184–186; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem dispatch_deterministic (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) :
    ∃! b : Bool, dispatchVerify vEd vP256 vP384 vP521 vRSA2 vRSA3 vRSA4 alg k m s = b :=
  ⟨_, rfl, fun _ h => h.symm⟩
```

## 27. `dispatch_total`

- Kind: `theorem`
- Code SHA-256: `2fb91c6c60f1c23d1f0af6719fe0b056fb690c514a3b02fd9ec91efce9f1597a`
- Statement SHA-256: `cada3dd8272ea068225d2dc0466d6a9f1026424e37223868e117542dc21fdb5f`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000027_dispatch_total__2fb91c6c60f1.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 180–182; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem dispatch_total (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) :
    ∃ b : Bool, dispatchVerify vEd vP256 vP384 vP521 vRSA2 vRSA3 vRSA4 alg k m s = b :=
  ⟨_, rfl⟩
```

## 28. `empty_witnesses_valid`

- Kind: `theorem`
- Code SHA-256: `d58d981b1b49dab14a83411294872920e6416a67c0a7eb24bb4d3815c48bbb7b`
- Statement SHA-256: `2eb8c223b05c8cb78744f33952dcac299bbe115c74e27a63fc114b4b58caeba9`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000028_empty_witnesses_valid__d58d981b1b49.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 260–261; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem empty_witnesses_valid (root : MRoot) :
    allWitnessesValid witnessSigValid [] root = true := rfl
```

## 29. `evalPred_atom`

- Kind: `theorem`
- Code SHA-256: `39210efc8a9623c28c728cc6029f5a273e9b7cac2553916f7ecf12f40c24ad31`
- Statement SHA-256: `d317338c7509b72031ff6787f7739ace41c65cf7f8b8786942bf03eefe4f5fe5`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000029_evalPred_atom__39210efc8a96.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 230–231; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem evalPred_atom (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (a : BAtom) :
    evalPred (fuel + 1) ctx ea (.atom a) = some (ea ctx a) := rfl
```

## 30. `evalPred_terminates`

- Kind: `theorem`
- Code SHA-256: `244c08f045aa7ca3c13ddbb2c9f2ce4e846515596e197650554141e18b04d7fe`
- Statement SHA-256: `ad06e4b5d24fb705eed6610dc10932f369a717caf4ad3714a89feb383db13e8e`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000030_evalPred_terminates__244c08f045aa.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 224–225; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem evalPred_terminates (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    ∃ r, evalPred fuel ctx ea p = r := ⟨_, rfl⟩
```

## 31. `evalPred_zero`

- Kind: `theorem`
- Code SHA-256: `e999183fdf74a59e3c9b4e9a8314e4f2710d3ea409ed242ecd048cdcc9933e20`
- Statement SHA-256: `1258feb28ac5a60845492ddf05fbcd9fc6ed60ab94becd0e66657cd8585b02ee`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000031_evalPred_zero__e999183fdf74.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 227–228; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem evalPred_zero (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    evalPred 0 ctx ea p = none := by cases p <;> rfl
```

## 32. `every_digest_has_partner`

- Kind: `theorem`
- Code SHA-256: `d398e5e690b9e7733b4ef4fa77405b01ba27570ed79139b88c58069daa561866`
- Statement SHA-256: `5cacab6de6c37e0c784d1ce82b9498a32f1378358d2723cf6a2408201a3e259f`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000032_every_digest_has_partner__d398e5e690b9.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 322–324; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem every_digest_has_partner (d : DigestAlg) :
    ∃ s : SigAlg, compatible d s = true := by
  cases d <;> exact ⟨.ed25519, rfl⟩
```

## 33. `every_sig_has_partner`

- Kind: `theorem`
- Code SHA-256: `7917eefa5c5e1ae4f4a2a66c61466e83a4b1e530ff635899b85e4b2f4d022c59`
- Statement SHA-256: `0a07bf960d6b35a824d5e81653f0d6d59db4195cf432f6b34e84a5a4c9925075`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000033_every_sig_has_partner__7917eefa5c5e.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 327–329; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem every_sig_has_partner (s : SigAlg) :
    ∃ d : DigestAlg, compatible d s = true := by
  cases s <;> first | exact ⟨.sha256, rfl⟩ | exact ⟨.sha384, rfl⟩ | exact ⟨.sha512, rfl⟩
```

## 34. `gauge_preserves_attribution`

- Kind: `theorem`
- Code SHA-256: `8accbc3094d83b3c2692ef246fe6042ca41f9bc26f74a009503b576bf8367b9e`
- Statement SHA-256: `808fa0d2444ef8925aaeee3d001dcbdf4a4ecd78c5944de655bd14545a673d67`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000034_gauge_preserves_attribution__8accbc3094d8.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 361–367; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem gauge_preserves_attribution (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 S I →
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I :=
  fun ⟨h1, h2, h3, h4, h5⟩ =>
    ⟨g_preserves_C1 S I h1, g_preserves_C2 S I h2,
     g_preserves_C3 S I h3, g_preserves_C4 S I h4,
     g_preserves_C5 S I h5⟩
```

## 35. `gauge_reflects_attribution`

- Kind: `theorem`
- Code SHA-256: `284a08e5f722a3537edb2740005342f70f1e6bc94c4a956272d31e8f4027bd6a`
- Statement SHA-256: `d589bf1a018d0b53c89d70ec72e039859492db0e4d810191962916aa2cdaecb7`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000035_gauge_reflects_attribution__284a08e5f722.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 369–375; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem gauge_reflects_attribution (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I →
    Attribution' C1 C2 C3 C4 C5 S I :=
  fun ⟨h1, h2, h3, h4, h5⟩ =>
    ⟨g_reflects_C1 S I h1, g_reflects_C2 S I h2,
     g_reflects_C3 S I h3, g_reflects_C4 S I h4,
     g_reflects_C5 S I h5⟩
```

## 36. `gauge_stability`

- Kind: `theorem`
- Code SHA-256: `eed48fbcde4d2415b794a0891c105f4618afa69dbec98509fceaa9534cff0e80`
- Statement SHA-256: `7a8df3a2189451c4adb1cf33f64d2570576ef18d89d881016978e4d6c5493d21`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000036_gauge_stability__eed48fbcde4d.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 377–383; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem gauge_stability (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 S I ↔
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I :=
  ⟨gauge_preserves_attribution C1 C2 C3 C4 C5 gauge_transform
     g_preserves_C1 g_preserves_C2 g_preserves_C3 g_preserves_C4 g_preserves_C5 S I,
   gauge_reflects_attribution C1 C2 C3 C4 C5 gauge_transform
     g_reflects_C1 g_reflects_C2 g_reflects_C3 g_reflects_C4 g_reflects_C5 S I⟩
```

## 37. `horizon_is_boundary`

- Kind: `theorem`
- Code SHA-256: `6b141d68cb2ef510962af7ade9fb6b591b0e8af7790baa08b654cb6c8407b306`
- Statement SHA-256: `b4de93b15280209176610e91a2815d192bfaf13ce64a84f14c4552958078250d`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000037_horizon_is_boundary__6b141d68cb2e.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2104–2113; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem horizon_is_boundary (s : State) :
  viable s ∨ collapse s ∨ at_horizon s 0.1 := by
  unfold viable collapse at_horizon energy
  by_cases h : 0 < s.C - s.U - s.λ_coeff * s.D
  · left; exact h
  by_cases h' : s.C - s.U - s.λ_coeff * s.D < 0
  · right; left; exact h'
  · right; right
    simp [abs_sub_lt_iff]
    omega
```

## 38. `invalid_witness_invalidates`

- Kind: `theorem`
- Code SHA-256: `b272a3ea1fc7eda238f573ccccb84d89435195df01caff782c20fdbc99b1fc0b`
- Statement SHA-256: `678075135d30f1aad80b78e8f1e3cfd8f38fc123111081cf6bac89403ae76049`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000038_invalid_witness_invalidates__b272a3ea1fc7.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 268–273; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem invalid_witness_invalidates (w : WID) (ws : List WID) (root : MRoot) :
    witnessSigValid w root = false →
    allWitnessesValid witnessSigValid (w :: ws) root = false := by
  intro h
  simp [allWitnessesValid, List.all]
  simp [h]
```

## 39. `lineage_implies_boundary`

- Kind: `theorem`
- Code SHA-256: `a3a14ae8d6fd1d07ef1802349043aca17273b79db72e950886a1f1b6626a8d2f`
- Statement SHA-256: `048353ba3cee1842603ac034f0c14683af12a658bb27ee327a69b53747c78e7f`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000039_lineage_implies_boundary__a3a14ae8d6fd.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 292–294; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem lineage_implies_boundary (s : Sys) :
    passesLineage chkI chkB chkL s → passesBoundary chkI chkB s :=
  fun ⟨hi, hb, _⟩ => ⟨hi, hb⟩
```

## 40. `monotone_hardening_C1`

- Kind: `theorem`
- Code SHA-256: `35801a2e9fdb1f6cecfd13664db7f69285479b6170c003dd98a2e636a8c442b7`
- Statement SHA-256: `8530624526d8a160dfb8be03af384f5e22f4ba08851185e4ea20845116d0e1af`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000040_monotone_hardening_C1__35801a2e9fdb.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8042–8047; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem monotone_hardening_C1 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C1_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C1_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h2, h3, h4, h5, hn⟩
  exact ⟨m, hsub m hc, h2, h3, h4, h5, hn⟩
```

## 41. `monotone_hardening_C2`

- Kind: `theorem`
- Code SHA-256: `71c1058b1688dbd4a2c1ccdc6864572cd8b3534f0eaf5b1a0d9530338fe9bb89`
- Statement SHA-256: `593cbe7e0c2866b66b76bef15dc66b382c5cc1c648f6259b0d3f7e2590f087a5`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000041_monotone_hardening_C2__71c1058b1688.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8049–8054; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem monotone_hardening_C2 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C2_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C2_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h1, h3, h4, h5, hn⟩
  exact ⟨m, hsub m hc, h1, h3, h4, h5, hn⟩
```

## 42. `monotone_hardening_C3`

- Kind: `theorem`
- Code SHA-256: `14f87068db9a4e62277646c571784806fd0fb80991332fe1f49d3600534cbc7b`
- Statement SHA-256: `17b7acd97fe05f881fd0fa9e907976cb4f0e7094da5f6664290051de75b856d6`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000042_monotone_hardening_C3__14f87068db9a.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8056–8061; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem monotone_hardening_C3 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C3_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C3_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h1, h2, h4, h5, hn⟩
  exact ⟨m, hsub m hc, h1, h2, h4, h5, hn⟩
```

## 43. `monotone_hardening_C4`

- Kind: `theorem`
- Code SHA-256: `9be5d94558c6f558917f8b6869cd82e30db280b251b0374abea0ad5e2577f478`
- Statement SHA-256: `cbb715728f4ed3029ca018a53b1776a790df8fce2049c705c202ff61ccbdbef8`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000043_monotone_hardening_C4__9be5d94558c6.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8063–8068; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem monotone_hardening_C4 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C4_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C4_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h1, h2, h3, h5, hn⟩
  exact ⟨m, hsub m hc, h1, h2, h3, h5, hn⟩
```

## 44. `monotone_hardening_C5`

- Kind: `theorem`
- Code SHA-256: `be32a7d67b337391e7579c7161d9d1664b6f8ed469b2fac14f287c915cc3b60f`
- Statement SHA-256: `2aebc4df15b5f2c9633b1b8ecb8f9b6a06dd9dd6c20115abf0ca8621c911d2d5`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000044_monotone_hardening_C5__be32a7d67b33.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8070–8075; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem monotone_hardening_C5 (s : System) (i : Interval)
    (cls cls' : ComparisonModel → Prop) (hsub : ∀ m, cls m → cls' m) :
    Spoofable_on_C5_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls →
    Spoofable_on_C5_in System Interval ComparisonModel C1 C2 C3 C4 C5 matches_on s i cls' := by
  rintro ⟨m, hc, h1, h2, h3, h4, hn⟩
  exact ⟨m, hsub m hc, h1, h2, h3, h4, hn⟩
```

## 45. `norm_conj`

- Kind: `theorem`
- Code SHA-256: `287b4e6abf831ce9e45018b6583fe6502062c9cc9bf4383f97d0f99c3bd88f54`
- Statement SHA-256: `0c37cc5c1fe6c29baadfa09f9400e5f2e36c06befcd3e95e89470ca07690f784`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000045_norm_conj__287b4e6abf83.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2056–2059; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem norm_conj (s : Sedenion) : norm (conj s) = norm s := by
  unfold norm norm_sq conj
  simp [Finset.sum_congr]
  ring
```

## 46. `norm_nonneg`

- Kind: `theorem`
- Code SHA-256: `ac3e3a20172e46db107ea5737873d97a8078d3e61909c4644dcd91119108582d`
- Statement SHA-256: `916a24335d1929e8c4bc4669cf9df2413183ce946ccecd10a13f3d6e1a9a68c4`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000046_norm_nonneg__ac3e3a20172e.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2070–2072; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem norm_nonneg (s : Sedenion) : 0 ≤ norm s := by
  unfold norm
  exact Real.sqrt_nonneg _
```

## 47. `norm_zero`

- Kind: `theorem`
- Code SHA-256: `a2b3826ed006840f304e60ff18289c0f62b10150555b17a25174ca38b327ba2e`
- Statement SHA-256: `ca3cec6be41739995e4b3037e81c4db3d80f2f5a6d06b79c4d3d045a7aa39879`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000047_norm_zero__a2b3826ed006.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2065–2067; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem norm_zero : norm zero = 0 := by
  unfold norm norm_sq zero
  simp
```

## 48. `null_vs_negative`

- Kind: `theorem`
- Code SHA-256: `858606ab8ec4c27941da99350913598075f38b9d0ea5eec90171b8c5c3cd5d55`
- Statement SHA-256: `1ddfbea6095455b38e90c69d2b1efd7c2c94ab6c30abc07630b06373bd1b8bce`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000048_null_vs_negative__858606ab8ec4.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7920–7923; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem null_vs_negative :
    NullStructurallyUnresolvable ≠ NonAttributionVerdict ∧
    NullInsufficientlyTested     ≠ NonAttributionVerdict := by
  refine ⟨?_, ?_⟩ <;> decide
```

## 49. `null_vs_negative`

- Kind: `theorem`
- Code SHA-256: `dabac2b48c5d23a954891facc0a64d7ed8d070f4a34eb23e891629cd9b9729fa`
- Statement SHA-256: `f726ccb98a659bd7afe97077088f3cc4c82a282a44ab05f59f6079e4a8e099d5`
- Occurrences: 66
- Source statuses: `INCOMPLETE` × 66
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000049_null_vs_negative__dabac2b48c5d.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7814–7816; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem null_vs_negative :
    (Verdict.INDETERMINATE : Verdict) ≠ Verdict.UNWARRANTED := by
  decide
```

## 50. `outcome_exclusive`

- Kind: `theorem`
- Code SHA-256: `70a6d5f2d976e3e0cc594b4572ce83c9b8a66e4b4d629edc425307ade6dbf5a1`
- Statement SHA-256: `c77cde957152e8523617e19fc91080eb51fc90352613968ff62f593cc038eed4`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000050_outcome_exclusive__70a6d5f2d976.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 134–145; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem outcome_exclusive :
    Outcome.verified ≠ Outcome.malformed ∧
    Outcome.verified ≠ Outcome.invalidSignature ∧
    Outcome.verified ≠ Outcome.outOfBounds ∧
    Outcome.verified ≠ Outcome.unknownVersion ∧
    Outcome.verified ≠ Outcome.missingSideInfo ∧
    Outcome.verified ≠ Outcome.lineageInvalid ∧
    Outcome.verified ≠ Outcome.resourceExhausted ∧
    Outcome.verified ≠ Outcome.policyDenied ∧
    Outcome.verified ≠ Outcome.indeterminate ∧
    Outcome.verified ≠ Outcome.notDefinedInVersion := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
```

## 51. `outcome_exhaustive`

- Kind: `theorem`
- Code SHA-256: `6356256c0cd881855c4dc1e5d95d8d418102c49232c02923a9f9b28c4f1525c1`
- Statement SHA-256: `3a3c180e8d05954eb60b3afa7997c133c41ec391b900ee747c3de98bf293954a`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000051_outcome_exhaustive__6356256c0cd8.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 127–132; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem outcome_exhaustive (o : Outcome) :
    o = .verified ∨ o = .malformed ∨ o = .invalidSignature ∨
    o = .outOfBounds ∨ o = .unknownVersion ∨ o = .missingSideInfo ∨
    o = .lineageInvalid ∨ o = .resourceExhausted ∨ o = .policyDenied ∨
    o = .indeterminate ∨ o = .notDefinedInVersion := by
  cases o <;> simp
```

## 52. `primary_independent_of_side`

- Kind: `theorem`
- Code SHA-256: `19c216a5442d21a6ad5470bf412b702f0b9e4b9be889126977d0ab57de6c5e90`
- Statement SHA-256: `eeae24343aa0415f0cd98b30bf14c451d2b2751763e5a6aceb1a43e55cba0a31`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000052_primary_independent_of_side__19c216a5442d.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 243–244; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem primary_independent_of_side (b : BundleT) (i : Nat) :
    bundleVerified primaryValid b → bundleVerified primaryValid b := id
```

## 53. `protocol_relativity`

- Kind: `theorem`
- Code SHA-256: `f469182c467c2c2a7cf5091fc15332c44465e4267a104920927fdacbaae38fae`
- Statement SHA-256: `c0b26df3c4ef3b8c6c731714126bac89575bdc4ba705434ed279e0f3d074292c`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000053_protocol_relativity__f469182c467c.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8084–8087; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem protocol_relativity :
    ∃ f : Bool → VerdictType, f true ≠ f false := by
  refine ⟨protocol_relativity_witness, ?_⟩
  unfold protocol_relativity_witness; decide
```

## 54. `protocol_relativity_strong`

- Kind: `theorem`
- Code SHA-256: `82f21316f8f55f17ad4a2c5dbcd08f4fcca221c46e2de189a7ef686e433f1ad6`
- Statement SHA-256: `d340c586d829ba7cfd864914992705b1b760ccf679b0a3f7a2cff827815c1fdd`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000054_protocol_relativity_strong__82f21316f8f5.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 8089–8093; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem protocol_relativity_strong :
    ∀ v1 v2 : VerdictType, v1 ≠ v2 →
    ∃ f : Bool → VerdictType, f true = v1 ∧ f false = v2 := by
  intro v1 v2 _
  exact ⟨fun b => if b then v1 else v2, rfl, rfl⟩
```

## 55. `recovery_by_capacity_increase`

- Kind: `theorem`
- Code SHA-256: `f1cc9e114328b2c2122279c6bfed29bfa678aaf1bd20ad5fac81d1e3c2c94a94`
- Statement SHA-256: `a011d4b6734b19e625c68584e789ca46aca769fa4d74d75cfad2a995f981eec3`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000055_recovery_by_capacity_increase__f1cc9e114328.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2195–2201; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem recovery_by_capacity_increase (s : State) (dC : ℝ) :
  collapse s →
  dC > (s.U - s.C) + s.λ_coeff * s.D →
  viable { s with C := s.C + dC } := by
  intro h_collapse h_dC
  unfold viable collapse energy in *
  linarith
```

## 56. `regulated_implies_integrity`

- Kind: `theorem`
- Code SHA-256: `63e4d024ad8517a6ad236a1875a82400a18f6773e9a583d46a7a0a484828fa4d`
- Statement SHA-256: `26d3a4982145de9384253918115963cfad2ac9c2d01d26dccb7543cccf5ebaf4`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000056_regulated_implies_integrity__63e4d024ad85.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 300–304; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem regulated_implies_integrity (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesIntegrity chkI s :=
  fun h => boundary_implies_integrity chkI chkB s
    (lineage_implies_boundary chkI chkB chkL s
      (regulated_implies_lineage chkI chkB chkL chkR s h))
```

## 57. `regulated_implies_lineage`

- Kind: `theorem`
- Code SHA-256: `7403146742e68c87bffc328d012f01b72ed59059df4576f2883962827b4dd9e1`
- Statement SHA-256: `bcbe45a845dec0b2b18eec14a89fce201ecd011133bb1c1df6964a9490c11a01`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000057_regulated_implies_lineage__7403146742e6.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 288–290; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem regulated_implies_lineage (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesLineage chkI chkB chkL s :=
  fun ⟨hi, hb, hl, _⟩ => ⟨hi, hb, hl⟩
```

## 58. `score_insufficiency`

- Kind: `theorem`
- Code SHA-256: `a50b1c13c57f92c17d4cf40a65c196233c48b97fd629d1eba9aa3c2516c2b800`
- Statement SHA-256: `212404c302d79775b939109e94c85d93f39d794037d97a5d352a5e9fb6cdf350`
- Occurrences: 38
- Source statuses: `INCOMPLETE` × 38
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000058_score_insufficiency__a50b1c13c57f.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7793–7798; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem score_insufficiency {s : S} {i : I}
    (_hcert : Cert s i)
    (hfail : ¬ C1 s i ∨ ¬ C2 s i ∨ ¬ C3 s i ∨ ¬ C4 s i ∨ ¬ C5 s i) :
    ¬ Attribution C1 C2 C3 C4 C5 s i := by
  apply conjunctive_blocking
  assumption
```

## 59. `score_insufficiency`

- Kind: `theorem`
- Code SHA-256: `d8a212e855a94d10dac036d455068a1cce60e78c1c0c8d2674d17dda1fb9d1ff`
- Statement SHA-256: `999db03343b411d8aa35a218b77fa6d7081c476334d4a6539b2f72049a35dfeb`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000059_score_insufficiency__d8a212e855a9.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 598–605; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem score_insufficiency {s : S} {i : I}
    (_hcert : Certification Cert s i > θ)
    (hfail : ¬ C1 Delta_split partitions δ s i ∨ ¬ C2 A predictive_info self_info η s i ∨
             ¬ C3 perturbations d_G Corr ε s i ∨ ¬ C4 Loss λ s i ∨ ¬ C5 Cert ζ γ s i) :
    ¬ Attribution (C1 Delta_split partitions δ) (C2 A predictive_info self_info η)
      (C3 perturbations d_G Corr ε) (C4 Loss λ) (C5 Cert ζ γ) s i := by
  apply conjunctive_blocking
  assumption
```

## 60. `score_insufficiency_C1`

- Kind: `theorem`
- Code SHA-256: `7e649b8c44678ef831e8531cd942517e92a3115c27be56db6a2bff1ba941bd74`
- Statement SHA-256: `608f4f7ca50a3394594693472dd65c0e9cbdd63c4b099e2403a3b5aed7505296`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000060_score_insufficiency_C1__7e649b8c4467.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7866–7869; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem score_insufficiency_C1 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C1 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.1
```

## 61. `score_insufficiency_C2`

- Kind: `theorem`
- Code SHA-256: `92ac60f6c0dedc8d97ef760d77eaa87cd73575dc6c015d8380cbb80e02c53e6e`
- Statement SHA-256: `76c51fdf8d4b62eac45be57da3dd43067043ff029d1573951c4c78749c6ea8eb`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000061_score_insufficiency_C2__92ac60f6c0de.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7871–7874; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem score_insufficiency_C2 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C2 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.1
```

## 62. `score_insufficiency_C3`

- Kind: `theorem`
- Code SHA-256: `f7e66dd29f797fafdee5996393376e2e361bf2ea4e1701e856f9e9a3e985e22f`
- Statement SHA-256: `b0d0847cff655b0d0aecb7dc3678a179d466b56869ee7b8e14ae0ba53a6e5f5b`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000062_score_insufficiency_C3__f7e66dd29f79.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7876–7879; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem score_insufficiency_C3 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C3 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.2.1
```

## 63. `score_insufficiency_C4`

- Kind: `theorem`
- Code SHA-256: `dd1dfd4158ca848917468a9491674bb62a848820a952d97478e11e90a46371ee`
- Statement SHA-256: `4cdb1a79f05e77487a1b3d7e16e52810d4709d047dcfab529e1d062cda9190bd`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000063_score_insufficiency_C4__dd1dfd4158ca.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7881–7884; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem score_insufficiency_C4 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C4 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.2.2.1
```

## 64. `score_insufficiency_C5`

- Kind: `theorem`
- Code SHA-256: `d29cd54c63cfdade2a724bd733ad7fd7fc5bf124dc117124ddca8e62c3c1d1f7`
- Statement SHA-256: `abbe73a7d5407d8a67909222dbf86ef8e8f8d1ae744704c107666b7826060d36`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000064_score_insufficiency_C5__d29cd54c63cf.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7886–7889; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem score_insufficiency_C5 (s : System) (i : Interval)
    (_ : CertAboveTheta s i) (hn : ¬ C5 s i) :
    ¬ Attribution System Interval C1 C2 C3 C4 C5 CertAboveTheta s i := by
  intro h; exact hn h.2.2.2.2.1
```

## 65. `side_failure_preserves_primary`

- Kind: `theorem`
- Code SHA-256: `25eab6adb673cbd2f7a933ca1e366efd96e6a51e88dfcca34a99152651fb3791`
- Statement SHA-256: `f39cdbd822b97d3e4e3b14f8ce6116630458cc8de6e09cdba746b9d2bdb8f1ad`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000065_side_failure_preserves_primary__25eab6adb673.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 246–248; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem side_failure_preserves_primary (b : BundleT) (i : Nat) :
    bundleVerified primaryValid b → sideValid b i = false → bundleVerified primaryValid b :=
  fun h _ => h
```

## 66. `single_witness`

- Kind: `theorem`
- Code SHA-256: `49ca733963fa3bc0220a5281465c574b73af01796da515d5db0875d9610ff677`
- Statement SHA-256: `d60dac7731337dfb542a23e2eb615d19544e1daad98d29fe6b4840c6940b7b8c`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000066_single_witness__49ca733963fa.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 263–266; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem single_witness (w : WID) (root : MRoot) :
    allWitnessesValid witnessSigValid [w] root = witnessSigValid w root := by
  simp [allWitnessesValid, List.all]
  rfl
```

## 67. `spoof_blocking`

- Kind: `theorem`
- Code SHA-256: `dd06e56bb98d99cdf57656298094259c4628947bbd3422969698087d4cd8561c`
- Statement SHA-256: `f74d5a9b7a318950ff11af98145ab9332cd23324ae7a6e3cdd74ef58c67623fa`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000067_spoof_blocking__dd06e56bb98d.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 620–628; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem spoof_blocking {M s : S} {i : I}
    (hM : M ∈ spoof_class)
    (hpr : Pr_equiv M s < 1 - γ) :
    ¬ C5 Cert ζ γ M i := by
  unfold C5 non_spoofable
  intro h
  have hns := h.2
  specialize hns M hM
  linarith
```

## 68. `verdict_exclusive_all`

- Kind: `theorem`
- Code SHA-256: `d5c2dd51d4fde8e94e88d6a6e6894ca7bbcc813ec995b2c8a68b6939bdcabbe5`
- Statement SHA-256: `a5a2abd4d0cf3a1d811e90bcf0740a508ef9fab9bb1e4dcccab41c8dc02d001d`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000068_verdict_exclusive_all__d5c2dd51d4fd.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 457–468; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem verdict_exclusive_all :
    Verdict.attributed ≠ Verdict.notAttributed ∧
    Verdict.attributed ≠ Verdict.nullInsufficient ∧
    Verdict.attributed ≠ Verdict.nullUnresolvable ∧
    Verdict.attributed ≠ Verdict.indeterminate ∧
    Verdict.notAttributed ≠ Verdict.nullInsufficient ∧
    Verdict.notAttributed ≠ Verdict.nullUnresolvable ∧
    Verdict.notAttributed ≠ Verdict.indeterminate ∧
    Verdict.nullInsufficient ≠ Verdict.nullUnresolvable ∧
    Verdict.nullInsufficient ≠ Verdict.indeterminate ∧
    Verdict.nullUnresolvable ≠ Verdict.indeterminate := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
```

## 69. `verdict_exclusivity`

- Kind: `theorem`
- Code SHA-256: `72fd927077586f4d52172991652115b176059829e54fd6561be97215de7257f4`
- Statement SHA-256: `731c14b58f78bbcd59bbe1b551db60e6bee87f3525f793e4cb2ea10928290967`
- Occurrences: 49
- Source statuses: `INCOMPLETE` × 49
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000069_verdict_exclusivity__72fd92707758.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7906–7917; embedded `gpx_consciousness_2026-05_5656bc54667f590f_5656bc54667f590f_000161_5656bc54667f_2026_04_23_phronesis_lean4_crossprover.lean`

```lean
theorem verdict_exclusivity :
    AttributionVerdict          ≠ NonAttributionVerdict         ∧
    AttributionVerdict          ≠ NullInsufficientlyTested      ∧
    AttributionVerdict          ≠ NullStructurallyUnresolvable  ∧
    AttributionVerdict          ≠ IndeterminateVerdict          ∧
    NonAttributionVerdict       ≠ NullInsufficientlyTested      ∧
    NonAttributionVerdict       ≠ NullStructurallyUnresolvable  ∧
    NonAttributionVerdict       ≠ IndeterminateVerdict          ∧
    NullInsufficientlyTested    ≠ NullStructurallyUnresolvable  ∧
    NullInsufficientlyTested    ≠ IndeterminateVerdict          ∧
    NullStructurallyUnresolvable ≠ IndeterminateVerdict := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide
```

## 70. `verdict_exclusivity_unwarranted_indeterminate`

- Kind: `theorem`
- Code SHA-256: `e4d5ccf43bd161546dd28fbd62de2381cc62866dfd0761e1a7893e061b1ce46f`
- Statement SHA-256: `213eb8063ff2088cc0601012adb75e232c119a47883d0d88d8b5ee38ee10c17a`
- Occurrences: 66
- Source statuses: `INCOMPLETE` × 66
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000070_verdict_exclusivity_unwarranted_indeterminate__e4d5ccf43bd1.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7809–7811; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem verdict_exclusivity_unwarranted_indeterminate :
    (Verdict.UNWARRANTED : Verdict) ≠ Verdict.INDETERMINATE := by
  decide
```

## 71. `verdict_exclusivity_warranted_indeterminate`

- Kind: `theorem`
- Code SHA-256: `7948d5027635e3f93195a3d08381bc1e1b7b1f74fcaf5100efea9747177c604a`
- Statement SHA-256: `769fa7c38267df9c70ac58ead3a5f923ceb8dc37e0692918e65f523176a20ec1`
- Occurrences: 66
- Source statuses: `INCOMPLETE` × 66
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000071_verdict_exclusivity_warranted_indeterminate__7948d5027635.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7805–7807; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem verdict_exclusivity_warranted_indeterminate :
    (Verdict.WARRANTED : Verdict) ≠ Verdict.INDETERMINATE := by
  decide
```

## 72. `verdict_exclusivity_warranted_unwarranted`

- Kind: `theorem`
- Code SHA-256: `46544de66b915d092d5319e7754080bcff985cef4b7a9acada448cfcc84a7086`
- Statement SHA-256: `cc15ba3a2afe8895e3dd45eb17933d0b080bbce797b63e7bf12704a2b948262e`
- Occurrences: 66
- Source statuses: `INCOMPLETE` × 66
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000072_verdict_exclusivity_warranted_unwarranted__46544de66b91.lean`
- Primary provenance: `01-concat_gpx_consciousness_incomplete_83_files.v` lines 7801–7803; embedded `gpx_consciousness_2026-05_5388b85185729865_5388b85185729865_000135_5388b8518572_2026_04_11_consciousnesscriterion.lean`

```lean
theorem verdict_exclusivity_warranted_unwarranted :
    (Verdict.WARRANTED : Verdict) ≠ Verdict.UNWARRANTED := by
  decide
```

## 73. `verdict_exhaustive_all`

- Kind: `theorem`
- Code SHA-256: `f7978b7d319c0d718f8a1d3d38f432dc73726a3dffbe7036ce0d4e7906bb980d`
- Statement SHA-256: `4d5b656af6e2fcbffbb0d657c9acf0e3405cde151094f7098b2990bd6213e837`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000073_verdict_exhaustive_all__f7978b7d319c.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 470–473; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem verdict_exhaustive_all (v : Verdict) :
    v = .attributed ∨ v = .notAttributed ∨ v = .nullInsufficient ∨
    v = .nullUnresolvable ∨ v = .indeterminate := by
  cases v <;> simp
```

## 74. `verify_deterministic`

- Kind: `theorem`
- Code SHA-256: `a7f0615eb3bbbea5aaff1c6a91f77a81994e7b273b2207139f123845c19b3af9`
- Statement SHA-256: `68ce11f94b2935ed52ff336e9129845685bca2acc35ccd66a8cccf2fbf4590b3`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000074_verify_deterministic__a7f0615eb3bb.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 119–121; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem verify_deterministic (b : Bundle) (c : Context) (k : Key) :
    ∃! o, verify stage1 stage2 stage3 stage4 stage5 stage6 stage7 stage8 stage9 b c k = o :=
  ⟨_, rfl, fun _ h => h.symm⟩
```

## 75. `verify_total`

- Kind: `theorem`
- Code SHA-256: `64ea4f38a22904292678d614c507e387d10f5c74a66e2574c101f5c75a59b71b`
- Statement SHA-256: `c5911744a54fed2ac551311517271c65a28bed1ed996e06ef580d421f9fc9a24`
- Occurrences: 81
- Source statuses: `INCOMPLETE` × 81
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000075_verify_total__64ea4f38a229.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 123–125; embedded `proofbundle_2026-05_4e382e7d0902227d_2026_05_03_pb_proofs_combined.lean`

```lean
theorem verify_total (b : Bundle) (c : Context) (k : Key) :
    ∃ o, verify stage1 stage2 stage3 stage4 stage5 stage6 stage7 stage8 stage9 b c k = o :=
  ⟨_, rfl⟩
```

## 76. `viable_implies_above_horizon`

- Kind: `theorem`
- Code SHA-256: `e87bd049552757894b61021f25dea20d1b06dd2ca1d0cea538c8a9746eafb58d`
- Statement SHA-256: `89267e0e8cae4c5284a0a3fa8efe83ed303bbb223b26b331991579ccf331aa4e`
- Occurrences: 23
- Source statuses: `INCOMPLETE` × 23
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000076_viable_implies_above_horizon__e87bd0495527.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 2179–2183; embedded `proofbundle_2026-05_c4a40357022f9d5c_c4a40357022f9d5c_000208_c4a40357022f_lean4_sedenion_ready_to_run.lean`

```lean
theorem viable_implies_above_horizon (s : State) :
  viable s → 0 < energy s := by
  intro h
  unfold viable energy in h ⊢
  exact h
```

## 77. `witness_existence`

- Kind: `theorem`
- Code SHA-256: `bc49cc6a816cab040d0bfb049ebebbf5ccbf78897982968aba2e29cf532b7692`
- Statement SHA-256: `c64d0302f280954d646239acf36ead985ef7832adce3e67aca2c7b87126695aa`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000077_witness_existence__bc49cc6a816c.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 644–649; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem witness_existence {s : S} {i : I}
    (hC2 : C2 A predictive_info self_info η s i) :
    ∃ a : A, predictive_info s a i > η := by
  unfold C2 at hC2
  rcases hC2 with ⟨a, τ, hτ, hpred, _⟩
  exact ⟨a, hpred⟩
```

## 78. `witness_family_closure`

- Kind: `theorem`
- Code SHA-256: `92e5ea7a84235afd9f5dd81ca7e24e8d566af355a92ce296cbc0ba5dee5c2a3d`
- Statement SHA-256: `1880db21de12fa4f1f7f6aab2cb807586dff5c14baf46de75bfe2950d1d2bf7e`
- Occurrences: 28
- Source statuses: `INCOMPLETE` × 28
- Extracted code file: `proof_code/closed_in_incomplete_source/lean/000078_witness_family_closure__92e5ea7a8423.lean`
- Primary provenance: `15-concat_ALL_lean_incomplete_195_files.lean` lines 652–656; embedded `proofbundle_2026-05_221faeb78219df4e_221faeb78219df4e_000137_221faeb78219_2026_04_11_expanded.lean`

```lean
theorem witness_family_closure {s : S} {i : I} {a1 a2 : A}
    (h1 : predictive_info s a1 i > η)
    (h2 : predictive_info s a2 i > η) :
    ∃ a3 : A, predictive_info s a3 i > η := by
  exact ⟨a1, h1⟩
```



---

# Lean proof code — completed

Each entry is one normalized exact-code variant. Occurrence counts retain repeated appearances across the concatenated source records.

## 1. `allOps8_length`

- Kind: `theorem`
- Code SHA-256: `8b21538f39c73d57538350356abb898cd4a675fd95fc6cdda42bbbd8ece8d8da`
- Statement SHA-256: `b48f06b125b1b65d4659e3b2174baf48727e8cd2e15937d661bd6691b5bb7896`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000001_allOps8_length__8b21538f39c7.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1060–1060; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem allOps8_length : allOps8.length = 8 := by native_decide
```

## 2. `allRootIds_length`

- Kind: `theorem`
- Code SHA-256: `3cf8e2fe436b2d71d331a660115732067db83e1b4c7ee88908db68ff20f6ea23`
- Statement SHA-256: `8490a89287318453f416650ee1ebd483155fbc0feb6a12e5e3662cba2f48b003`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000002_allRootIds_length__3cf8e2fe436b.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 481–481; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem allRootIds_length : allRootIds.length = 154 := by decide
```

## 3. `allRoots_length`

- Kind: `theorem`
- Code SHA-256: `354f9415c0ee3776d81add75958f9ff8cfa1954b6c68abb36ecdc99b43fca701`
- Statement SHA-256: `b2045b904d7074745490a40f635edfbbe2ea844ec116593fe3f96dc7b1545fba`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000003_allRoots_length__354f9415c0ee.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1059–1059; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem allRoots_length : allRoots.length = 46 := by native_decide
```

## 4. `anonymous_example_0001`

- Kind: `example`
- Code SHA-256: `4e64e082b2f1a4ae9fa72c7eab8ef8b9a49915c0f8fa2db0e4c8f0cc9ae0145c`
- Statement SHA-256: `ac8534c3ec65c8b0e6bfafbe7e0e84724e20d5e371f923cf198e3fc086b46d29`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000004_anonymous_example_0001__4e64e082b2f1.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1557–1558; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
example : sampleRegistry.supportCount 1 = 4 := by
  native_decide
```

## 5. `anonymous_example_0001`

- Kind: `example`
- Code SHA-256: `77c1c6142a32b2cda3ada6c4984ef9fce77f3a288e78f81233bd0d787878b4d2`
- Statement SHA-256: `8954b7b2c4a735e0580b8c9c51c0536f3752acc5da54d9a2abd3a9546e04ccff`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000005_anonymous_example_0001__77c1c6142a32.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1263–1275; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
example : Admissible {
  flow := 0.5
  reversible := true
  cost_wrongful := 10.0
  benefit_correct := 5.0
  confidence := 0.8
  severity := 1.0
  suppressed_info := false
  hidden_U := 0.0
  control_spec := true
  control_verify := true
  control_enforce := false
  is_self_vortex := false
```

## 6. `anonymous_example_0001`

- Kind: `example`
- Code SHA-256: `8c3d1f1957fb5610910f8f0a32e3cd580669b7bc71aebffc6723099f400a633e`
- Statement SHA-256: `0264376b8323102be5a573eaa66f71cfd41afe0bf4e84f1d7713c2b75f9b13b7`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000006_anonymous_example_0001__8c3d1f1957fb.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 486–486; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
example : attestedCountO8 .R001 = 8 := by decide
```

## 7. `anonymous_example_0001`

- Kind: `example`
- Code SHA-256: `a03f405584c481f7b8ed19b55838335bb7c0921e182740fa86e546dbe66271a6`
- Statement SHA-256: `ec17033a87bb64f0e7f8e82652d12a5ec5997ac8e2c1134bd20198ae01c9554b`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000007_anonymous_example_0001__a03f405584c4.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1725–1737; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
example : is_admissible {
  consequence_magnitude := 0.5
  is_reversible := true
  cost_of_wrongful_action := 10.0
  benefit_of_correct_action := 5.0
  confidence_level := 0.8
  severity_level := 1.0
  information_suppressed := false
  hidden_uncertainty_penalty := 0.0
  has_specification_control := true
  has_verification_control := true
  has_enforcement_control := false
  is_self_manufactured_crisis := false
```

## 8. `anonymous_example_0001`

- Kind: `example`
- Code SHA-256: `bf54f78664f06fefa60def352af27331c12c2f2329962112c0f73736c470b092`
- Statement SHA-256: `ad8e1a278828bcfd57e89e292fd29eb3cb8d9684d3462863c162460b1422a545`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000008_anonymous_example_0001__bf54f78664f0.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1078–1078; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .gress = 8 := by native_decide
```

## 9. `anonymous_example_0002`

- Kind: `example`
- Code SHA-256: `111d7f566f20c92e07eca2860673101776237f537bcf1a93252cf99d591e5e98`
- Statement SHA-256: `f084d986376a40356e56d61da1d90b9847d68170ca63362a2b6974711c529cc1`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000009_anonymous_example_0002__111d7f566f20.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1560–1561; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
example : coreCandidate sampleRegistry sampleRootGress := by
  native_decide
```

## 10. `anonymous_example_0002`

- Kind: `example`
- Code SHA-256: `a1b5998cdbad77ab6d6981b30185b15ea8bd65085e14a49a28bd939dc023c2d8`
- Statement SHA-256: `34e6397944590a8a8db768c3f320e4df9a4d77423941bfbd71cc570769007168`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000010_anonymous_example_0002__a1b5998cdbad.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1079–1079; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .scend = 5 := by native_decide
```

## 11. `anonymous_example_0002`

- Kind: `example`
- Code SHA-256: `e6ea039ca2fc87206e870351f7ad1b7f76ef677647371b08345d3e1d69bc4444`
- Statement SHA-256: `b6f0f761084e16e90dc37839fab26ff091952c59bd0ff39d81bd15b8e91753e6`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000011_anonymous_example_0002__e6ea039ca2fc.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1771–1783; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
example : ¬constraint_innocence_priority {
  consequence_magnitude := 0.5
  is_reversible := true
  cost_of_wrongful_action := 3.0
  benefit_of_correct_action := 5.0
  confidence_level := 0.8
  severity_level := 1.0
  information_suppressed := false
  hidden_uncertainty_penalty := 0.0
  has_specification_control := false
  has_verification_control := false
  has_enforcement_control := false
  is_self_manufactured_crisis := false
```

## 12. `anonymous_example_0002`

- Kind: `example`
- Code SHA-256: `e8f7f4db059fa12089e017cb5a6bc75035f63ba804066135aafa8184afc3e0a4`
- Statement SHA-256: `f7753f32fcca0cf31191e05feb0dbf3ce8c11d33509d7cc871a91ab49d535c83`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000012_anonymous_example_0002__e8f7f4db059f.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 487–487; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
example : attestedCountO8 .R002 = 5 := by decide
```

## 13. `anonymous_example_0002`

- Kind: `example`
- Code SHA-256: `f09f6b505a7f0c9323db2f7d85faa411aea19d7ab1763323c625db1f875acdfa`
- Statement SHA-256: `31464a6a82d07721b370763586db5b8e5916f8b009b46e472217279e2e66232a`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000013_anonymous_example_0002__f09f6b505a7f.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1305–1317; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
example : ¬C0_INNOCENT {
  flow := 0.5
  reversible := true
  cost_wrongful := 3.0
  benefit_correct := 5.0
  confidence := 0.8
  severity := 1.0
  suppressed_info := false
  hidden_U := 0.0
  control_spec := false
  control_verify := false
  control_enforce := false
  is_self_vortex := false
```

## 14. `anonymous_example_0003`

- Kind: `example`
- Code SHA-256: `322d855e4b3a5b882dd40bf6db4ec63ed68733b1f00143bd2ea26fc5946dfcf1`
- Statement SHA-256: `f82609c85c34b14369fd6021fc3c873a21b0253cb2edfd03158c5618dfe610f2`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000014_anonymous_example_0003__322d855e4b3a.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1563–1564; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
example : pressureCandidate sampleRootGraph := by
  native_decide
```

## 15. `anonymous_example_0003`

- Kind: `example`
- Code SHA-256: `32ea7c7a6adba585f24b3455a1c154aafd0081fdb945590d6682002878fb7c0a`
- Statement SHA-256: `00d48272582cf925d5649fcd423eff8f577f0fa648d1a377e7ac16d73255c92f`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000015_anonymous_example_0003__32ea7c7a6adb.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 488–488; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
example : attestedCountO8 .R009 = 6 := by decide
```

## 16. `anonymous_example_0003`

- Kind: `example`
- Code SHA-256: `72125014dfb3a5a8bd811eddf3fd3835cc2cbbbf05322730736d43ef3529cc35`
- Statement SHA-256: `161bfd78d5e64c81dcba05851fea0c7774a1336968bf41245567896c24531d73`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000016_anonymous_example_0003__72125014dfb3.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1080–1080; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .mit = 6 := by native_decide
```

## 17. `anonymous_example_0004`

- Kind: `example`
- Code SHA-256: `5c2249cd7a818a4605f926082a0af8fd4037614b44784e9c997a7acfa6310f4c`
- Statement SHA-256: `d0adb3a3c3bc5d0d2d4c515fec7a06202a27d8a7ad844ac63d247b305ea808b6`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000017_anonymous_example_0004__5c2249cd7a81.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 489–489; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
example : attestedCountO8 .R020 = 6 := by decide
```

## 18. `anonymous_example_0004`

- Kind: `example`
- Code SHA-256: `b010a1a503e604f724ba87257f80decb32ef1b5eab25b9c5472755c059d94377`
- Statement SHA-256: `e1ee0881e0b461678b8d60775995edacb5758f0b32941e512cfdd2dc782b78e4`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000018_anonymous_example_0004__b010a1a503e6.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1081–1081; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .vert = 8 := by native_decide
```

## 19. `anonymous_example_0005`

- Kind: `example`
- Code SHA-256: `e11814bfd4a18fc5ca9ffd763c15f9830d46d2f882a96e122c0c0698bba2312e`
- Statement SHA-256: `f3996e456a1129b7834ce9f44b1c3aa1174cdbd4db700a91059630cb3ca2731f`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000019_anonymous_example_0005__e11814bfd4a1.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1082–1082; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .struct = 6 := by native_decide
```

## 20. `anonymous_example_0006`

- Kind: `example`
- Code SHA-256: `74d468a91555950d39a05436855f078e1c67ebc2301b5cccbf7e5c2303cc3802`
- Statement SHA-256: `7bc2eff6460aa5e027887149084b63be124f1c220b68f215506352dcf5c9df64`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000020_anonymous_example_0006__74d468a91555.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1083–1083; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : supportCount demo20Ledger .morph = 7 := by native_decide
```

## 21. `anonymous_example_0007`

- Kind: `example`
- Code SHA-256: `fd44182072f512b26fd2ec312077b5d94f9f0388d87438231e8ffabd45dbb6da`
- Statement SHA-256: `81aa136a721078f0f248a5793606a8df7c1d251762e762fa8b3197aa6f89f232`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000021_anonymous_example_0007__fd44182072f5.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1085–1086; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : coreEligible demo20State .gress := by
  native_decide
```

## 22. `anonymous_example_0008`

- Kind: `example`
- Code SHA-256: `3e0acc69b0e4ee0a231f86b668bd64d7de0f3597107bd53ef38d040280ddde6a`
- Statement SHA-256: `53b9cad77da19e2c191f2d55de718eaf9da2ab04d48cddb7701d0deb0abecdd5`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000022_anonymous_example_0008__3e0acc69b0e4.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1088–1089; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
example : coreEligible demo20State .scend := by
  native_decide
```

## 23. `clementine_case_is_valid`

- Kind: `theorem`
- Code SHA-256: `fa3acb6ef27e2fe649c8c52dab0b0fbbd1ec165a208066f956c88f297abd7310`
- Statement SHA-256: `027b58b7a60fa695f1a530a9a33a85d366897d55f2ed1f43d84b41dacde29b8d`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000023_clementine_case_is_valid__fa3acb6ef27e.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1762–1768; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem clementine_case_is_valid : is_admissible clementine_case := by
  unfold is_admissible constraint_life_preservation constraint_reversibility
         constraint_no_manufactured_crisis constraint_innocence_priority
         constraint_fallibility constraint_proportionality constraint_information_transparency
         constraint_separation_of_powers clementine_case
  simp
  norm_num
```

## 24. `clementine_is_admissible`

- Kind: `theorem`
- Code SHA-256: `70de719bbc044c2c4db02579d408a14e34c6f8593cba464d0ff52b480e062bdf`
- Statement SHA-256: `79a32a3f32ea09fdaedd7d05c643640e4734137c6cfc076565d65ee4161bd050`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000024_clementine_is_admissible__70de719bbc04.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1298–1302; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem clementine_is_admissible : Admissible clementine_determination := by
  unfold Admissible C0_LIFE C0_REV C0_VORTEX C0_INNOCENT
           C0_FALLIBLE C0_PROP C0_UNCERT C0_ANTICONC clementine_determination
  simp
  norm_num
```

## 25. `collisionPairs_length`

- Kind: `theorem`
- Code SHA-256: `9123b037941d4e386aa1fa22ca129131f483b473af47b41bdccac21934453b41`
- Statement SHA-256: `f75a002b23678ed144548c0d17e3c5c85448f36396e7dd22cc0ead4493b124b2`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000025_collisionPairs_length__9123b037941d.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 484–484; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem collisionPairs_length : collisionPairs.length = 152 := by decide
```

## 26. `condition_independence_C1`

- Kind: `theorem`
- Code SHA-256: `794a7d0ea16c9bb49e0e3ec5cc88bcbd5c5d866f2d3745377a6bad64bdc2590d`
- Statement SHA-256: `d30307c408f6769834ffdfeb316a93ca22b1ddf569b4e7b6bad238b94b149bb7`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000026_condition_independence_C1__794a7d0ea16c.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 564–570; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem condition_independence_C1 (S : System) (I : Interval) :
    Spoofable_on_C1 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C2 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C1) := by
  intro ⟨M, hm2, hm3, hm4, hm5, hn1⟩ himp
  exact hn1 (himp M hm2 hm3 hm4 hm5)
```

## 27. `condition_independence_C2`

- Kind: `theorem`
- Code SHA-256: `7c4c7d7e94d9e9ab126bcd653de59830cd5cd459b2914547989617296ae34c05`
- Statement SHA-256: `df9cd69092c02892ed65d0507e2fb1f641f7bf537f1d04a6e9071d9ddf4bc1c9`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000027_condition_independence_C2__7c4c7d7e94d9.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 572–578; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem condition_independence_C2 (S : System) (I : Interval) :
    Spoofable_on_C2 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C2) := by
  intro ⟨M, hm1, hm3, hm4, hm5, hn2⟩ himp
  exact hn2 (himp M hm1 hm3 hm4 hm5)
```

## 28. `condition_independence_C3`

- Kind: `theorem`
- Code SHA-256: `a5e04c781c10ba0f750c03a02fe19bb64e2e5f32b0ae001f7b7fd042aec6cb5b`
- Statement SHA-256: `ecf25f83ed03f760311f3b723309d5865c01650cbbb6a377cacb29b55d04ac49`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000028_condition_independence_C3__a5e04c781c10.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 580–586; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem condition_independence_C3 (S : System) (I : Interval) :
    Spoofable_on_C3 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C4 → matches_on M S I C5 →
       matches_on M S I C3) := by
  intro ⟨M, hm1, hm2, hm4, hm5, hn3⟩ himp
  exact hn3 (himp M hm1 hm2 hm4 hm5)
```

## 29. `condition_independence_C4`

- Kind: `theorem`
- Code SHA-256: `97ae627dc56c703b945225a41be2b6e800e6361a44648a51f9111107f49b9be9`
- Statement SHA-256: `7d64bbd212201e013050f56587b3c01ac6ac74f768a76a0ce559c86165fe9d10`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000029_condition_independence_C4__97ae627dc56c.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 588–594; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem condition_independence_C4 (S : System) (I : Interval) :
    Spoofable_on_C4 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C5 →
       matches_on M S I C4) := by
  intro ⟨M, hm1, hm2, hm3, hm5, hn4⟩ himp
  exact hn4 (himp M hm1 hm2 hm3 hm5)
```

## 30. `condition_independence_C5`

- Kind: `theorem`
- Code SHA-256: `dfcfcbb5195d829e780c488ded66168cac12f0e350c09a16575a0a3be6d8554c`
- Statement SHA-256: `e42d41ecb230a8cb7d070767a91279c175e53bdfc67b4fd8030b3acfd54d2244`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000030_condition_independence_C5__dfcfcbb5195d.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 596–602; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem condition_independence_C5 (S : System) (I : Interval) :
    Spoofable_on_C5 C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C4 →
       matches_on M S I C5) := by
  intro ⟨M, hm1, hm2, hm3, hm4, hn5⟩ himp
  exact hn5 (himp M hm1 hm2 hm3 hm4)
```

## 31. `conjunctive_blocking`

- Kind: `theorem`
- Code SHA-256: `9082d102b4064a34f1c5eb91cd54e62971b459f07a5a6c6d4b72d7f2e62b042a`
- Statement SHA-256: `319f40b410f3a4318eb82834fa5737c5de9b2a5b41a5f3f61065bb337cbb4392`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000031_conjunctive_blocking__9082d102b406.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 557–561; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem conjunctive_blocking (S : System) (I : Interval) :
    (¬ C1 S I ∨ ¬ C2 S I ∨ ¬ C3 S I ∨ ¬ C4 S I ∨ ¬ C5 S I) →
    ¬ Attribution C1 C2 C3 C4 C5 S I := by
  intro h ⟨h1, h2, h3, h4, h5⟩
  rcases h with n | n | n | n | n <;> exact n (by assumption)
```

## 32. `conjunctive_blocking`

- Kind: `theorem`
- Code SHA-256: `aa5ca1b50d010b5ebad5f164ea9eeff51648fe742c468dfd815d28dad1de5e23`
- Statement SHA-256: `fc5210a707d0390e7d359c0d0c0b2d7f4a0b41230afdcf44e0c7b36401cfaa1e`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/lean/000032_conjunctive_blocking__aa5ca1b50d01.lean`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44398–44408; embedded `gpx_consciousness_2026-05_3e6f6b38757697c8_consciousnesscriterion_fivestate.lean`

```lean
theorem conjunctive_blocking {s : S} {i : I}
    (h : Not (C1 s i) \/ Not (C2 s i) \/ Not (C3 s i) \/ Not (C4 s i) \/ Not (C5 s i)) :
    Not (WarrantedAttribution C1 C2 C3 C4 C5 CertAboveTheta s i) := by
  unfold WarrantedAttribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · exact h1 hcontra.1
  · exact h2 hcontra.2.1
  · exact h3 hcontra.2.2.1
  · exact h4 hcontra.2.2.2.1
  · exact h5 hcontra.2.2.2.2.1
```

## 33. `core46Ids_length`

- Kind: `theorem`
- Code SHA-256: `039fbca7540e94ccaaa752fa9f190acb767cdf5478a4a58b854a4a71625a03ae`
- Statement SHA-256: `47f3997305128af70b3208369f1981fd5a8b80166872c56e05ac90ecacdd44ab`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000033_core46Ids_length__039fbca7540e.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 479–479; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem core46Ids_length : core46Ids.length = 46 := by decide
```

## 34. `coreCandidate_clarity_ge_two`

- Kind: `theorem`
- Code SHA-256: `a4eccdc232bffe05dbb45b62dd3915991e07e575b016540eeb6ea446cfbcd578`
- Statement SHA-256: `865d6917b77f4d6cbb623a844cb2ef82c217b6d2fc1dce3351c6803fc03553fd`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000034_coreCandidate_clarity_ge_two__a4eccdc232bf.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1520–1523; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem coreCandidate_clarity_ge_two (R : Registry) (r : RootSig) :
    coreCandidate R r → 2 ≤ r.clarity := by
  intro h
  exact h.2.1.1
```

## 35. `coreCandidate_drift_le_one`

- Kind: `theorem`
- Code SHA-256: `3fa4b86326bac40f497d8b2d0b85b29a0a6cb7630f25ff44cc04b0e8f08ddea1`
- Statement SHA-256: `e2cb02f85a020a7598b88ce8c6927fdc104b4061fc5d5ea07335adfa9980f31e`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000035_coreCandidate_drift_le_one__3fa4b86326ba.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1525–1528; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem coreCandidate_drift_le_one (R : Registry) (r : RootSig) :
    coreCandidate R r → r.drift ≤ 1 := by
  intro h
  exact h.2.1.2
```

## 36. `coreCandidate_support_ge_three`

- Kind: `theorem`
- Code SHA-256: `f421db3fe9c46784c33eeb2f25ee13b8b71235d6102f2d27ce3eb5e338158dde`
- Statement SHA-256: `abd0d7f252129e12b0f5d5d51d4cc0ed28d74fde94ecc1595b83ed708deaf099`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000036_coreCandidate_support_ge_three__f421db3fe9c4.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1515–1518; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem coreCandidate_support_ge_three (R : Registry) (r : RootSig) :
    coreCandidate R r → 3 ≤ R.supportCount r.rid := by
  intro h
  exact h.2.2.1
```

## 37. `demo20Ids_length`

- Kind: `theorem`
- Code SHA-256: `6cf2732556b0ddb2f9b6b81ef5cf847934e4bde3994b2b67d78da3487451be17`
- Statement SHA-256: `878e2cc529becf2d945ec18419c0a8a08f4bf1e82c2d95e8e529490dd8f020d8`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000037_demo20Ids_length__6cf2732556b0.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 480–480; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem demo20Ids_length : demo20Ids.length = 20 := by decide
```

## 38. `full_independence`

- Kind: `theorem`
- Code SHA-256: `aa9ac44be320b391d9629e02ecebc57ece7db3435a7b728926a3d1981a5500e5`
- Statement SHA-256: `fa083e65bcf9b3c586e8002638bc5ec3d8715b4ea644a8994e6b9e63828001ba`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000038_full_independence__aa9ac44be320.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 605–622; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem full_independence (S : System) (I : Interval) :
    AdversarialSufficiency C1 C2 C3 C4 C5 matches_on S I →
    ¬ (∀ M, matches_on M S I C2 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C1) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C3 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C2) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C4 → matches_on M S I C5 → matches_on M S I C3) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C5 → matches_on M S I C4) ∧
    ¬ (∀ M, matches_on M S I C1 → matches_on M S I C2 →
       matches_on M S I C3 → matches_on M S I C4 → matches_on M S I C5) := by
  intro ⟨h1, h2, h3, h4, h5⟩
  exact ⟨condition_independence_C1 C1 C2 C3 C4 C5 matches_on S I h1,
         condition_independence_C2 C1 C2 C3 C4 C5 matches_on S I h2,
         condition_independence_C3 C1 C2 C3 C4 C5 matches_on S I h3,
         condition_independence_C4 C1 C2 C3 C4 C5 matches_on S I h4,
         condition_independence_C5 C1 C2 C3 C4 C5 matches_on S I h5⟩
```

## 39. `innocence_priority`

- Kind: `theorem`
- Code SHA-256: `66b141c4ec77349a984c0342d99f118c04599dcb3e0d6d7eef8d20365b360875`
- Statement SHA-256: `cc8082b9db92682d223c588f3bc7858134c4f8a0c0ff6169265956b056ddc5be`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000039_innocence_priority__66b141c4ec77.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1230–1233; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem innocence_priority (d : Determination) :
  C0_INNOCENT d → (d.cost_wrongful > d.benefit_correct) := by
  intro h
  exact h
```

## 40. `ledgerO8_length`

- Kind: `theorem`
- Code SHA-256: `8a36f077ba3d109ae6433e5c65fb3d8f72a7e5b1a38b3a0ac2bbfd3c5edea1cd`
- Statement SHA-256: `dccf770648d057dc2a4759ff082ed2c40703122d4a22d174b56ce809a2f1097d`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000040_ledgerO8_length__8a36f077ba3d.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 482–482; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem ledgerO8_length : ledgerO8.length = 1232 := by decide
```

## 41. `ledgerOExt_length`

- Kind: `theorem`
- Code SHA-256: `746b65f4e7e6b1167d119d23e5c04b587ee431742d599c5da21bf3e0fe1b6b41`
- Statement SHA-256: `5a64b1d579c3c5740c0255c56780ebf58e893a13749f1f2e97f4ade9483bb560`
- Occurrences: 16
- Source statuses: `COMPLETED` × 16
- Extracted code file: `proof_code/completed/lean/000041_ledgerOExt_length__746b65f4e7e6.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 483–483; embedded `proofbundle_2026-05_6f30a40d222cdade_6f30a40d222cdade_6f30a40d222cdade_2026_03_26_operatorregistry_2.lean`

```lean
theorem ledgerOExt_length : ledgerOExt.length = 2464 := by decide
```

## 42. `monotone_hardening_C1`

- Kind: `theorem`
- Code SHA-256: `9d99c6b091776a69648d8804a36f205db00db76dc7d50bbc74e178169c5ef323`
- Statement SHA-256: `9be1585ecf91b329b9410bdbf3e8458f67f84322a947b1502656cf3eb3c405bc`
- Occurrences: 58
- Source statuses: `COMPLETED` × 58
- Extracted code file: `proof_code/completed/lean/000042_monotone_hardening_C1__9d99c6b09177.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 632–638; embedded `proofbundle_2026-05_a04e2606cd1908dc_a04e2606cd1908dc_000127_a04e2606cd19_2026_04_01_relational_spoof.lean`

```lean
theorem monotone_hardening_C1 (S : System) (I : Interval)
    (cls cls' : ComparisonModel → Prop) :
    (∀ M, cls M → cls' M) →
    Spoofable_on_C1_in C1 C2 C3 C4 C5 matches_on cls S I →
    Spoofable_on_C1_in C1 C2 C3 C4 C5 matches_on cls' S I := by
  intro hsub ⟨M, hcls, hm2, hm3, hm4, hm5, hn1⟩
  exact ⟨M, hsub M hcls, hm2, hm3, hm4, hm5, hn1⟩
```

## 43. `no_certainty_claims`

- Kind: `theorem`
- Code SHA-256: `4aa79aadd31344ad3db58022949b029a8523faffa0862b9508106a1beffa3be9`
- Statement SHA-256: `4576e22e03f3e867ad2960bbc6aa320d9bfc5f12144f79db23a507e2394ec1ad`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000043_no_certainty_claims__4aa79aadd313.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1236–1239; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem no_certainty_claims (d : Determination) :
  C0_FALLIBLE d → (d.confidence < 1.0) := by
  intro h
  exact h
```

## 44. `no_certainty_principle`

- Kind: `theorem`
- Code SHA-256: `2562ddb01dd596739c081b7ff00d1e30c97b601598935013be0bcd9261978c20`
- Statement SHA-256: `ad08d910e69f67ab10630429174826857175f1df5e5303ac92b98a7132ad1c65`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000044_no_certainty_principle__2562ddb01dd5.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1696–1699; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem no_certainty_principle (d : Determination) :
  constraint_fallibility d → (d.confidence_level < 1.0) := by
  intro h
  exact h
```

## 45. `no_hidden_information`

- Kind: `theorem`
- Code SHA-256: `5e39330efdc023beca53d737785880d9b4a8d69cac8cdbc45ad7568fe3c9ae3e`
- Statement SHA-256: `eaea68f54bd3ad0ca73636a0e6c4665a4a751d481beaa8f8b8dd882bc32ced3b`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000045_no_hidden_information__5e39330efdc0.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1254–1258; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem no_hidden_information (d : Determination) :
  C0_UNCERT d ∧ d.suppressed_info → (d.hidden_U ≥ 0.2) := by
  intro ⟨h, suppressed⟩
  unfold C0_UNCERT in h
  exact h suppressed
```

## 46. `null_vs_negative`

- Kind: `theorem`
- Code SHA-256: `e892aa6268364fde7b41e4b1bbe7a0123e8511586d7a8096c764d9fc214938c4`
- Statement SHA-256: `a32c1f110e63c1a9f0621ed79631ca10ef3825eb973774e09ed22588dd90d04e`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/lean/000046_null_vs_negative__e892aa626836.lean`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44429–44432; embedded `gpx_consciousness_2026-05_3e6f6b38757697c8_consciousnesscriterion_fivestate.lean`

```lean
theorem null_vs_negative :
    Not (VerdictType.NullStructurallyUnresolvable = VerdictType.NonAttributionVerdict) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.NonAttributionVerdict) := by
  constructor <;> intro h <;> cases h
```

## 47. `power_distribution_principle`

- Kind: `theorem`
- Code SHA-256: `7af17aba8dcc30e3012d7632d719dc694f29846e34194e68321628514528d608`
- Statement SHA-256: `68034df9641c723b5a2fb1948535aa8ea5a1bb6ff69fc176a9ea8d9f2b544cd9`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000047_power_distribution_principle__7af17aba8dcc.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1708–1712; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem power_distribution_principle (d : Determination) :
  constraint_separation_of_powers d →
  ¬(d.has_specification_control ∧ d.has_verification_control ∧ d.has_enforcement_control) := by
  intro h
  exact h
```

## 48. `proportionality_holds`

- Kind: `theorem`
- Code SHA-256: `aba70f77d4165fdc198e914a0f88a239d54a2a40daac5b436029b0c108439bab`
- Statement SHA-256: `c1ffd5f5b1f955942b64b0e7cea76ee2b36c7b44e1355addc4f2a973ca7fba47`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000048_proportionality_holds__aba70f77d416.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1242–1245; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem proportionality_holds (d : Determination) :
  C0_PROP d → (d.flow ≤ d.confidence * d.severity) := by
  intro h
  exact h
```

## 49. `proportionality_principle`

- Kind: `theorem`
- Code SHA-256: `c595a359a303858547f514d1a4a328c672b5d3032acb670707080d3396d2b8fa`
- Statement SHA-256: `e456ad7e9dca7732e9881027843e6051dcfa87b2f89c929b9e1f759ee4208352`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000049_proportionality_principle__c595a359a303.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1702–1705; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem proportionality_principle (d : Determination) :
  constraint_proportionality d → (d.consequence_magnitude ≤ d.confidence_level * d.severity_level) := by
  intro h
  exact h
```

## 50. `protocol_relativity_witness`

- Kind: `theorem`
- Code SHA-256: `77606e511d1b22da0363ca168a5a7d765e6424f18b3d17adb6f11a025591f714`
- Statement SHA-256: `4e63f58d88bc930558a755f502c998456fc6f8f9ff9bff7772498b6f988332e4`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/lean/000050_protocol_relativity_witness__77606e511d1b.lean`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44434–44438; embedded `gpx_consciousness_2026-05_3e6f6b38757697c8_consciousnesscriterion_fivestate.lean`

```lean
theorem protocol_relativity_witness :
    Exists (fun f : Bool -> VerdictType => Not (f true = f false)) := by
  exists (fun b => if b then VerdictType.AttributionVerdict else VerdictType.NonAttributionVerdict)
  intro h
  cases h
```

## 51. `registryWf_addCell`

- Kind: `theorem`
- Code SHA-256: `1c8d1d59231d9abca824755f26fa6121dcb0a13bb8bc1937526628dd743a8a8c`
- Statement SHA-256: `e0f508edd7907ac07a3e566e2e54a171032e7958c070ea33de22dc1c0b68d3f0`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000051_registryWf_addCell__1c8d1d59231d.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1503–1513; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem registryWf_addCell (R : Registry) (c : Cell)
    (hWf : registryWf R)
    (hRoot : rootExists R c.rootId) :
    registryWf (addCell R c) := by
  rcases hWf with ⟨hNodup, hCells⟩
  constructor
  · simpa [addCell] using hNodup
  · intro c' hc'
    rcases hc' with rfl | hc''
    · simpa [cellWf] using hRoot
    · exact hCells c' hc''
```

## 52. `registryWf_addRoot`

- Kind: `theorem`
- Code SHA-256: `245c9041b777b20bf70320c5bd2e94b07ef621d39012029fe9602755f8ba9092`
- Statement SHA-256: `98858b8221d1890d540fd19efeb00b8b726b758d86097d39af81a81dfd975191`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000052_registryWf_addRoot__245c9041b777.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1492–1501; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem registryWf_addRoot (R : Registry) (r : RootSig)
    (hWf : registryWf R)
    (hFresh : r.rid ∉ R.rootIds) :
    registryWf (addRoot R r) := by
  rcases hWf with ⟨hNodup, hCells⟩
  constructor
  · simp [addRoot, rootIds, hFresh, hNodup]
  · intro c hc
    have hc' : c ∈ R.cells := by simpa [addRoot] using hc
    exact rootExists_mono_addRoot R r c.rootId (hCells c hc')
```

## 53. `remediation_always_possible`

- Kind: `theorem`
- Code SHA-256: `697075a2748d5f12dbeff3139e97cbd64c09ec40acea51661a7b2bec0bfc68be`
- Statement SHA-256: `1e0318095f6f87f006f08aaf71b8a0fe6dc0d22b6fe6b30ced7fa7109ab3f3c2`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000053_remediation_always_possible__697075a2748d.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1665–1687; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem remediation_always_possible (d : Determination) :
  ¬(is_admissible d) → ∃ d' : Determination, is_admissible d' := by
  intro _
  let d' : Determination := {
    consequence_magnitude := min d.consequence_magnitude (d.confidence_level * d.severity_level)
    is_reversible := true
    cost_of_wrongful_action := max d.cost_of_wrongful_action (d.benefit_of_correct_action + 1)
    benefit_of_correct_action := d.benefit_of_correct_action
    confidence_level := min d.confidence_level 0.95
    severity_level := d.severity_level
    information_suppressed := d.information_suppressed
    hidden_uncertainty_penalty := if d.information_suppressed then max d.hidden_uncertainty_penalty 0.3 else d.hidden_uncertainty_penalty
    has_specification_control := false
    has_verification_control := false
    has_enforcement_control := false
    is_self_manufactured_crisis := false
  }
  use d'
  unfold is_admissible constraint_life_preservation constraint_reversibility
         constraint_no_manufactured_crisis constraint_innocence_priority
         constraint_fallibility constraint_proportionality constraint_information_transparency
         constraint_separation_of_powers
  simp [min_nonneg, max_def]
```

## 54. `remediation_exists`

- Kind: `theorem`
- Code SHA-256: `5c8dc2449df825009c090a835ba22e0adfcca783e4e5740b23c83ad101ee0225`
- Statement SHA-256: `c05631e92a8ab10b06544cd5c3f6ea1ea1671bbbb311d82820f4aba5946aa9e4`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000054_remediation_exists__5c8dc2449df8.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1208–1227; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem remediation_exists (d : Determination) :
  ¬(Admissible d) → ∃ d' : Determination, Admissible d' := by
  intro _
  let d' : Determination := {
    flow := min d.flow (d.confidence * d.severity)
    reversible := true
    cost_wrongful := max d.cost_wrongful (d.benefit_correct + 1)
    benefit_correct := d.benefit_correct
    confidence := min d.confidence 0.95
    severity := d.severity
    suppressed_info := d.suppressed_info
    hidden_U := if d.suppressed_info then max d.hidden_U 0.3 else d.hidden_U
    control_spec := false
    control_verify := false
    control_enforce := false
    is_self_vortex := false
  }
  use d'
  unfold Admissible C0_LIFE C0_REV C0_VORTEX C0_INNOCENT
  simp [min_nonneg, max_def]
```

## 55. `rootExists_addRoot_self`

- Kind: `theorem`
- Code SHA-256: `8a8d25a1a9cabb609e70cfa448a059f6ca2d13e0f24c613f504b057d0a07aba7`
- Statement SHA-256: `960930422fe0c361bcc2923b6633bf02be0afe8d429879f829c291173806b2da`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000055_rootExists_addRoot_self__8a8d25a1a9ca.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1480–1483; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem rootExists_addRoot_self (R : Registry) (r : RootSig) :
    rootExists (addRoot R r) r.rid := by
  refine ⟨r, ?_, rfl⟩
  simp [addRoot]
```

## 56. `rootExists_mono_addRoot`

- Kind: `theorem`
- Code SHA-256: `08271ffef6de18d1e31b39a003f73720f85dc72139d17e5505abd1f324ab80e3`
- Statement SHA-256: `61fb19039c06494a62744a75ed13aebb4525ce16f2fcd2d98916a37594c37216`
- Occurrences: 24
- Source statuses: `COMPLETED` × 24
- Extracted code file: `proof_code/completed/lean/000056_rootExists_mono_addRoot__08271ffef6de.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1485–1490; embedded `proofbundle_2026-05_e6cf15dd2f090354_e6cf15dd2f090354_000760_e6cf15dd2f09_2026_03_26_operatorregistry.lean`

```lean
theorem rootExists_mono_addRoot (R : Registry) (r : RootSig) (i : Nat) :
    rootExists R i → rootExists (addRoot R r) i := by
  intro h
  rcases h with ⟨r0, hr0, hid⟩
  refine ⟨r0, ?_, hid⟩
  simp [addRoot, hr0]
```

## 57. `score_insufficiency`

- Kind: `theorem`
- Code SHA-256: `9d3a90cd8f46ae33f527cb7e3efdab65e79d011001f73961e8d1012afc396239`
- Statement SHA-256: `b8797eb2f2322436cb33f6b2ea8702fe70363c667326c72fd8e7a2b90aaa1f8b`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/lean/000057_score_insufficiency__9d3a90cd8f46.lean`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44410–44414; embedded `gpx_consciousness_2026-05_3e6f6b38757697c8_consciousnesscriterion_fivestate.lean`

```lean
theorem score_insufficiency {s : S} {i : I}
    (_hcert : CertAboveTheta s i)
    (hfail : Not (C1 s i) \/ Not (C2 s i) \/ Not (C3 s i) \/ Not (C4 s i) \/ Not (C5 s i)) :
    Not (WarrantedAttribution C1 C2 C3 C4 C5 CertAboveTheta s i) := by
  exact conjunctive_blocking C1 C2 C3 C4 C5 CertAboveTheta hfail
```

## 58. `separation_of_powers`

- Kind: `theorem`
- Code SHA-256: `8d38e41e35bf25ddccc1ba564ac599b54dc01f61af1e4850a4d929e9de8f602e`
- Statement SHA-256: `c43d9293a15d244cc89f0bdbd94a1283e0466d6778311ad847d5214b9dd70c08`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000058_separation_of_powers__8d38e41e35bf.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1248–1251; embedded `proofbundle_2026-05_ccdf6213e7a44cf6_ccdf6213e7a44cf6_000207_ccdf6213e7a4_lean4_governance_ready_to_run.lean`

```lean
theorem separation_of_powers (d : Determination) :
  C0_ANTICONC d → ¬(d.control_spec ∧ d.control_verify ∧ d.control_enforce) := by
  intro h
  exact h
```

## 59. `setCell_other_root`

- Kind: `theorem`
- Code SHA-256: `b742e022cf53e7699c703ac348b2f3d85df7ff42d8c454789c4b04dca15da655`
- Statement SHA-256: `2fce1b09af1de8039a061b4388aab7ff006081c0014979b92762ab604afa8017`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000059_setCell_other_root__b742e022cf53.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1066–1068; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem setCell_other_root (L : Ledger) (r₁ r₂ : RootId) (o : Operator8) (s : Status)
    (h : r₂ ≠ r₁) : setCell L r₁ o s r₂ o = L r₂ o := by
  simp [setCell, h]
```

## 60. `setCell_same`

- Kind: `theorem`
- Code SHA-256: `5d5907028050f683f60316b8807de785e4da4729404655bb68406130785b22cb`
- Statement SHA-256: `711ab24b350190a539eedf2ee9153e42da6994a76a814090384a9882ded64afb`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000060_setCell_same__5d5907028050.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1062–1064; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem setCell_same (L : Ledger) (r : RootId) (o : Operator8) (s : Status) :
    setCell L r o s r o = s := by
  simp [setCell]
```

## 61. `splitOf_mark_same`

- Kind: `theorem`
- Code SHA-256: `cf821c1cb22fe2e0ddb113e4d915036013711b9e02ce765d7212f3c6329760d4`
- Statement SHA-256: `d51f1462a7a8ffbcfab55c65597648846c142c675bb18085a14c6c1a47984afc`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000061_splitOf_mark_same__cf821c1cb22f.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1074–1076; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem splitOf_mark_same (S : SystemState) (r : RootId) (b : Bool) :
    splitOf (applyUpdate S (.markSplitU r b)) r = b := by
  simp [applyUpdate, splitOf]
```

## 62. `tierOf_retier_same`

- Kind: `theorem`
- Code SHA-256: `6b98c1533d673670fa5b2fa29e43995032953f50548c349d8ddf6d5f460b28f5`
- Statement SHA-256: `cb11b99a8bb690143d7cbc1a3cbc3c786cbdc1bf6f33ffe6cf24ae0c6ad01df3`
- Occurrences: 12
- Source statuses: `COMPLETED` × 12
- Extracted code file: `proof_code/completed/lean/000062_tierOf_retier_same__6b98c1533d67.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1070–1072; embedded `proofbundle_2026-05_b57788133debdf36_b57788133debdf36_b57788133debdf36_2026_03_26_operatorregistry_1.lean`

```lean
theorem tierOf_retier_same (S : SystemState) (r : RootId) (t : Tier) :
    tierOf (applyUpdate S (.retierU r t)) r = t := by
  simp [applyUpdate, tierOf]
```

## 63. `transparency_principle`

- Kind: `theorem`
- Code SHA-256: `2ad606a0727b0a2cb1430ef21e9e603e3269b9b84d36b25061ba750842324c2f`
- Statement SHA-256: `140b8f8cf7818d24aefe63440781a8431f072f138379cd3b6cc0d38cc3573b24`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000063_transparency_principle__2ad606a0727b.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1715–1720; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem transparency_principle (d : Determination) :
  constraint_information_transparency d ∧ d.information_suppressed →
  (d.hidden_uncertainty_penalty ≥ 0.2) := by
  intro ⟨h, suppressed⟩
  unfold constraint_information_transparency in h
  exact h suppressed
```

## 64. `verdict_exclusivity`

- Kind: `theorem`
- Code SHA-256: `1c77cf19713b0c7b5e61a5706226ae52da7c24d6016c4298880688f6bc8c0fac`
- Statement SHA-256: `8c15680df38eb7c646d335e3fdfe405701c6a279bc61537c7aa56058f22c274f`
- Occurrences: 2
- Source statuses: `COMPLETED` × 2
- Extracted code file: `proof_code/completed/lean/000064_verdict_exclusivity__1c77cf19713b.lean`
- Primary provenance: `02-concat_gpx_consciousness_completed_91_files.v` lines 44416–44427; embedded `gpx_consciousness_2026-05_3e6f6b38757697c8_consciousnesscriterion_fivestate.lean`

```lean
theorem verdict_exclusivity :
    Not (VerdictType.AttributionVerdict = VerdictType.NonAttributionVerdict) /\
    Not (VerdictType.AttributionVerdict = VerdictType.NullInsufficientlyTested) /\
    Not (VerdictType.AttributionVerdict = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.AttributionVerdict = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.NullInsufficientlyTested) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NullStructurallyUnresolvable = VerdictType.IndeterminateVerdict) := by
  repeat constructor <;> intro h <;> cases h
```

## 65. `wrongful_action_cost_principle`

- Kind: `theorem`
- Code SHA-256: `336f6dd4e2a9a545833ecc6f916feb1da049a5cd680ee6b3ee0e496662c7eb79`
- Statement SHA-256: `9805600505bf8896651abb3f3515f4c4b134163d7c5eb9ba07e118a5800e6d3a`
- Occurrences: 46
- Source statuses: `COMPLETED` × 46
- Extracted code file: `proof_code/completed/lean/000065_wrongful_action_cost_principle__336f6dd4e2a9.lean`
- Primary provenance: `04-concat_ALL_lean_completed_142_files.lean` lines 1690–1693; embedded `proofbundle_2026-05_f11ef6517cefac7d_f11ef6517cefac7d_000206_f11ef6517cef_lean4_governance_plain_english.lean`

```lean
theorem wrongful_action_cost_principle (d : Determination) :
  constraint_innocence_priority d → (d.cost_of_wrongful_action > d.benefit_of_correct_action) := by
  intro h
  exact h
```

