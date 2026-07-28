
From Coq Require Import List String Bool Arith Lia.
Import ListNotations.
Open Scope string_scope.

Set Implicit Arguments.

Inductive Tier : Type :=
| TierCore
| TierReserve
| TierPressure.

Inductive Family : Type :=
| GRAD | BOUND | ROT | MAG | CONT | FLOW | BUILD | BREAK | META
| TRACE | SPEECH | PERCEPT | COGN | TIME | MEASURE | FORCE | GOVERN | VALENCE.

Inductive Operator : Type :=
| Toward | Away | Around | Beside | Upward | Downward | Together | Against.

Inductive Status : Type :=
| Attested
| Admissible
| Blocked
| Undecidable
| Diachronic.

Definition supports (s : Status) : bool :=
  match s with
  | Attested | Admissible | Diachronic => true
  | Blocked | Undecidable => false
  end.

Definition caveat (s : Status) : bool :=
  match s with
  | Admissible | Undecidable | Diachronic => true
  | Attested | Blocked => false
  end.

Record RootSig : Type := mkRootSig
{
  rid : nat;
  stem : string;
  fam : Family;
  invariant_gloss : string;
  clarity : nat;      (* 0..3 *)
  drift : nat;        (* 0..3 *)
  tier : Tier;
  split_flag : bool
}.

Record Cell : Type := mkCell
{
  cell_root : nat;
  cell_op : Operator;
  cell_status : Status
}.

Record Registry : Type := mkRegistry
{
  roots : list RootSig;
  cells : list Cell
}.

Definition root_ids (R : Registry) : list nat :=
  map rid (roots R).

Definition root_exists (R : Registry) (i : nat) : Prop :=
  exists r, In r (roots R) /\ rid r = i.

Definition cell_wf (R : Registry) (c : Cell) : Prop :=
  root_exists R (cell_root c).

Definition registry_wf (R : Registry) : Prop :=
  NoDup (root_ids R) /\ Forall (cell_wf R) (cells R).

Definition cells_of (R : Registry) (i : nat) : list Cell :=
  filter (fun c => Nat.eqb (cell_root c) i) (cells R).

Definition support_count (R : Registry) (i : nat) : nat :=
  List.length (filter (fun c => supports (cell_status c)) (cells_of R i)).

Definition caveat_count (R : Registry) (i : nat) : nat :=
  List.length (filter (fun c => caveat (cell_status c)) (cells_of R i)).

Definition root_score_ok (r : RootSig) : Prop :=
  clarity r >= 2 /\ drift r <= 1.

Definition operator_support_ok (R : Registry) (r : RootSig) : Prop :=
  support_count R (rid r) >= 3.

Definition core_candidate (R : Registry) (r : RootSig) : Prop :=
  tier r = TierCore /\
  root_score_ok r /\
  operator_support_ok R r /\
  split_flag r = false.

Definition reserve_candidate (R : Registry) (r : RootSig) : Prop :=
  tier r = TierReserve /\
  clarity r >= 1 /\
  support_count R (rid r) >= 1.

Definition pressure_candidate (r : RootSig) : Prop :=
  tier r = TierPressure.

Definition add_root (R : Registry) (r : RootSig) : Registry :=
  mkRegistry (r :: roots R) (cells R).

Definition add_cell (R : Registry) (c : Cell) : Registry :=
  mkRegistry (roots R) (c :: cells R).

Definition retier_root (t' : Tier) (i : nat) (r : RootSig) : RootSig :=
  if Nat.eqb (rid r) i then
    mkRootSig (rid r) (stem r) (fam r) (invariant_gloss r)
              (clarity r) (drift r) t' (split_flag r)
  else r.

Definition mark_split (b : bool) (i : nat) (r : RootSig) : RootSig :=
  if Nat.eqb (rid r) i then
    mkRootSig (rid r) (stem r) (fam r) (invariant_gloss r)
              (clarity r) (drift r) (tier r) b
  else r.

Definition retier_registry (R : Registry) (i : nat) (t' : Tier) : Registry :=
  mkRegistry (map (retier_root t' i) (roots R)) (cells R).

Definition split_registry (R : Registry) (i : nat) (b : bool) : Registry :=
  mkRegistry (map (mark_split b i) (roots R)) (cells R).

Inductive Update : Type :=
| AddRootU : RootSig -> Update
| AddCellU : Cell -> Update
| RetierU : nat -> Tier -> Update
| MarkSplitU : nat -> bool -> Update.

Definition apply_update (R : Registry) (u : Update) : Registry :=
  match u with
  | AddRootU r => add_root R r
  | AddCellU c => add_cell R c
  | RetierU i t' => retier_registry R i t'
  | MarkSplitU i b => split_registry R i b
  end.

Lemma in_root_ids_intro :
  forall (R : Registry) (r : RootSig),
    In r (roots R) -> In (rid r) (root_ids R).
Proof.
  intros R r Hr.
  unfold root_ids.
  apply in_map.
  exact Hr.
Qed.

Lemma support_count_nonneg :
  forall (R : Registry) (i : nat), support_count R i >= 0.
Proof.
  intros. unfold support_count. lia.
Qed.

Lemma caveat_count_nonneg :
  forall (R : Registry) (i : nat), caveat_count R i >= 0.
Proof.
  intros. unfold caveat_count. lia.
Qed.

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

Lemma core_candidate_support_ge_3 :
  forall (R : Registry) (r : RootSig),
    core_candidate R r -> support_count R (rid r) >= 3.
Proof.
  intros R r Hcore.
  unfold core_candidate in Hcore.
  destruct Hcore as [_ [_ [Hsupport _]]].
  exact Hsupport.
Qed.

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

Lemma pressure_candidate_tier :
  forall (r : RootSig),
    pressure_candidate r -> tier r = TierPressure.
Proof.
  intros r H.
  unfold pressure_candidate in H.
  exact H.
Qed.

Definition sample_root_gress : RootSig :=
  mkRootSig 1 "-gress-" GRAD "step / advance along gradient" 3 0 TierCore false.

Definition sample_root_ject : RootSig :=
  mkRootSig 2 "-ject-" BOUND "throw across boundary" 3 0 TierCore false.

Definition sample_root_graph : RootSig :=
  mkRootSig 97 "-graph-" TRACE "write / record / inscribe" 2 1 TierPressure false.

Definition sample_registry : Registry :=
  mkRegistry
    [sample_root_gress; sample_root_ject; sample_root_graph]
    [ mkCell 1 Toward Attested
    ; mkCell 1 Away Attested
    ; mkCell 1 Around Admissible
    ; mkCell 1 Beside Admissible
    ; mkCell 2 Toward Attested
    ; mkCell 2 Away Attested
    ; mkCell 2 Together Admissible
    ].

Example sample_gress_support_count :
  support_count sample_registry 1 = 4.
Proof.
  reflexivity.
Qed.

Example gress_is_core_candidate :
  core_candidate sample_registry sample_root_gress.
Proof.
  unfold core_candidate, root_score_ok, operator_support_ok.
  simpl.
  repeat split; try reflexivity; try (vm_compute; lia); try lia.
Qed.

Example graph_is_pressure :
  pressure_candidate sample_root_graph.
Proof.
  unfold pressure_candidate, sample_root_graph.
  simpl.
  reflexivity.
Qed.
