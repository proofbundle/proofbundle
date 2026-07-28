From Coq Require Import List String Bool Arith Lia.
Import ListNotations.
Open Scope string_scope.
Set Implicit Arguments.

Inductive Tier : Type := TierCore | TierReserve | TierPressure.

Inductive Family : Type :=
| GRAD | BOUND | ROT | MAG | CONT | FLOW | BUILD | BREAK | META
| TRACE | SPEECH | PERCEPT | COGN | TIME | MEASURE | FORCE | GOVERN | VALENCE.

Inductive Operator8 : Type :=
| O_toward | O_away | O_around | O_beside | O_upward | O_downward | O_together | O_against.

Inductive OperatorExt : Type :=
| E_toward | E_away | E_through | E_into | E_outof | E_around | E_beside | E_upward
| E_downward | E_over | E_under | E_inon | E_before | E_after | E_together | E_against.

Inductive Status : Type := Attested | Admissible | Blocked | Undecidable | Diachronic.

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

Definition collapse_ext (o : OperatorExt) : Operator8 :=
  match o with
  | E_toward | E_through | E_into => O_toward
  | E_away | E_outof => O_away
  | E_around => O_around
  | E_beside => O_beside
  | E_upward | E_over => O_upward
  | E_downward | E_under => O_downward
  | E_together | E_before | E_after | E_inon => O_together
  | E_against => O_against
  end.
Inductive RootId : Type :=
 | R_gress
 | R_scend
 | R_tract
 | R_pel
 | R_cede
 | R_ject
 | R_port
 | R_fer
 | R_mit
 | R_vert
 | R_volv
 | R_trop
 | R_cresc
 | R_pand
 | R_clud
 | R_capt
 | R_flu
 | R_struct
 | R_fract
 | R_morph
 | R_duc
 | R_mov
 | R_vad
 | R_tend
 | R_curr
 | R_flect
 | R_clin
 | R_stroph
 | R_press
 | R_aug
 | R_minu
 | R_pon
 | R_sert
 | R_tect
 | R_velop
 | R_lig
 | R_nect
 | R_tex
 | R_fac
 | R_rupt
 | R_scind
 | R_solv
 | R_sever
 | R_sect
 | R_fus
 | R_mut.


Definition root_eq_dec : forall (x y : RootId), {x = y} + {x <> y}.
Proof. decide equality. Defined.

Definition op8_eq_dec : forall (x y : Operator8), {x = y} + {x <> y}.
Proof. decide equality. Defined.

Record RootMeta : Type := mkRootMeta
{
  stem : string;
  fam : Family;
  invariant_gloss : string;
  default_tier : Tier;
  default_split : bool;
  clarity : nat;
  drift : nat
}.
Definition root_meta (r : RootId) : RootMeta :=
  match r with
  | R_gress => mkRootMeta "-gress-" GRAD "step / advance along gradient" TierCore false 3 0
  | R_scend => mkRootMeta "-scend-" GRAD "climb / descend along gradient" TierCore false 3 0
  | R_tract => mkRootMeta "-tract-" GRAD "pull / draw" TierCore false 3 0
  | R_pel => mkRootMeta "-pel-" GRAD "push / drive" TierCore false 3 0
  | R_cede => mkRootMeta "-cede-" GRAD "go / yield" TierCore false 3 0
  | R_ject => mkRootMeta "-ject-" BOUND "throw across boundary" TierCore false 3 0
  | R_port => mkRootMeta "-port-" BOUND "carry across / transfer" TierCore false 3 0
  | R_fer => mkRootMeta "-fer-" BOUND "bear / carry" TierCore false 3 0
  | R_mit => mkRootMeta "-mit-" BOUND "send / let go across" TierCore false 3 0
  | R_vert => mkRootMeta "-vert-" ROT "turn / reorient" TierCore false 3 0
  | R_volv => mkRootMeta "-volv-" ROT "roll / revolve" TierCore false 3 0
  | R_trop => mkRootMeta "-trop-" ROT "turn toward orientation" TierCore false 3 0
  | R_cresc => mkRootMeta "-cresc-" MAG "grow / increase" TierCore false 3 0
  | R_pand => mkRootMeta "-pand-" MAG "spread / expand" TierCore false 3 0
  | R_clud => mkRootMeta "-clud-" CONT "close / shut" TierCore false 3 0
  | R_capt => mkRootMeta "-capt-" CONT "take / seize" TierCore false 3 0
  | R_flu => mkRootMeta "-flu-" FLOW "flow" TierCore false 3 0
  | R_struct => mkRootMeta "-struct-" BUILD "build / arrange" TierCore false 3 0
  | R_fract => mkRootMeta "-fract-" BREAK "break / rupture" TierCore false 3 0
  | R_morph => mkRootMeta "-morph-" META "form / change shape" TierCore false 3 0
  | R_duc => mkRootMeta "-duc-" GRAD "lead / draw forward" TierCore false 3 0
  | R_mov => mkRootMeta "-mov-" GRAD "move" TierCore false 3 0
  | R_vad => mkRootMeta "-vad-" GRAD "go / advance" TierCore false 3 0
  | R_tend => mkRootMeta "-tend-" GRAD "stretch / aim toward" TierCore false 3 0
  | R_curr => mkRootMeta "-curr-" GRAD "run / course" TierCore false 3 0
  | R_flect => mkRootMeta "-flect-" ROT "bend / deflect" TierCore false 3 0
  | R_clin => mkRootMeta "-clin-" ROT "lean / incline" TierCore false 3 0
  | R_stroph => mkRootMeta "-stroph-" ROT "turn / twist orientation" TierCore false 3 0
  | R_press => mkRootMeta "-press-" GRAD "press / drive by pressure" TierCore false 3 0
  | R_aug => mkRootMeta "-aug-" MAG "increase / augment" TierCore false 3 0
  | R_minu => mkRootMeta "-minu-" MAG "lessen / diminish" TierCore false 3 0
  | R_pon => mkRootMeta "-pon/pos-" BOUND "place / set" TierCore false 3 0
  | R_sert => mkRootMeta "-sert-" BOUND "insert / join by placing" TierCore false 3 0
  | R_tect => mkRootMeta "-tect-" CONT "cover / shelter" TierCore false 3 0
  | R_velop => mkRootMeta "-velop-" CONT "wrap / enfold" TierCore false 3 0
  | R_lig => mkRootMeta "-lig-" CONT "bind / tie" TierCore false 3 0
  | R_nect => mkRootMeta "-nect-" CONT "tie / connect" TierCore false 3 0
  | R_tex => mkRootMeta "-tex/text-" BUILD "weave / compose" TierCore false 3 0
  | R_fac => mkRootMeta "-fac/fect-" BUILD "make / do" TierCore false 3 0
  | R_rupt => mkRootMeta "-rupt-" BREAK "break / burst" TierCore false 3 0
  | R_scind => mkRootMeta "-scind-" BREAK "split / cut apart" TierCore false 3 0
  | R_solv => mkRootMeta "-solv-" BREAK "loosen / release / dissolve" TierCore false 3 0
  | R_sever => mkRootMeta "-sever-" BREAK "separate" TierCore false 3 0
  | R_sect => mkRootMeta "-sect-" BREAK "cut / divide" TierCore false 3 0
  | R_fus => mkRootMeta "-fus-" FLOW "pour / fuse by flow" TierCore false 3 0
  | R_mut => mkRootMeta "-mut-" META "change / exchange state" TierCore false 3 0
  end.


Definition root_stem (r : RootId) : string := stem (root_meta r).
Definition root_family (r : RootId) : Family := fam (root_meta r).
Definition root_invariant (r : RootId) : string := invariant_gloss (root_meta r).
Definition root_default_tier (r : RootId) : Tier := default_tier (root_meta r).
Definition root_default_split (r : RootId) : bool := default_split (root_meta r).
Definition root_clarity (r : RootId) : nat := clarity (root_meta r).
Definition root_drift (r : RootId) : nat := drift (root_meta r).

Definition all_roots : list RootId :=
  [R_gress; R_scend; R_tract; R_pel; R_cede; R_ject; R_port; R_fer; R_mit; R_vert; R_volv; R_trop; R_cresc; R_pand; R_clud; R_capt; R_flu; R_struct; R_fract; R_morph; R_duc; R_mov; R_vad; R_tend; R_curr; R_flect; R_clin; R_stroph; R_press; R_aug; R_minu; R_pon; R_sert; R_tect; R_velop; R_lig; R_nect; R_tex; R_fac; R_rupt; R_scind; R_solv; R_sever; R_sect; R_fus; R_mut].


Definition all_ops8 : list Operator8 :=
  [O_toward; O_away; O_around; O_beside; O_upward; O_downward; O_together; O_against].

Definition Ledger : Type := RootId -> Operator8 -> Status.

Definition empty_ledger : Ledger := fun _ _ => Undecidable.

Definition set_cell (L : Ledger) (r : RootId) (o : Operator8) (s : Status) : Ledger :=
  fun r' o' =>
    if root_eq_dec r' r then
      if op8_eq_dec o' o then s else L r' o'
    else L r' o'.

Fixpoint count_support_ops (L : Ledger) (r : RootId) (ops : list Operator8) : nat :=
  match ops with
  | [] => 0
  | o :: ops' =>
      (if supports (L r o) then 1 else 0) + count_support_ops L r ops'
  end.

Fixpoint count_caveat_ops (L : Ledger) (r : RootId) (ops : list Operator8) : nat :=
  match ops with
  | [] => 0
  | o :: ops' =>
      (if caveat (L r o) then 1 else 0) + count_caveat_ops L r ops'
  end.

Definition support_count (L : Ledger) (r : RootId) : nat :=
  count_support_ops L r all_ops8.

Definition caveat_count (L : Ledger) (r : RootId) : nat :=
  count_caveat_ops L r all_ops8.

Record SystemState : Type := mkSystemState
{
  ledger : Ledger;
  tier_override : RootId -> option Tier;
  split_override : RootId -> option bool
}.

Definition state0 : SystemState :=
  mkSystemState empty_ledger (fun _ => None) (fun _ => None).

Definition tier_of (S : SystemState) (r : RootId) : Tier :=
  match tier_override S r with
  | Some t => t
  | None => root_default_tier r
  end.

Definition split_of (S : SystemState) (r : RootId) : bool :=
  match split_override S r with
  | Some b => b
  | None => root_default_split r
  end.

Definition clarity_ok (r : RootId) : Prop := root_clarity r >= 2.
Definition drift_ok (r : RootId) : Prop := root_drift r <= 1.
Definition support_ok (S : SystemState) (r : RootId) : Prop := support_count (ledger S) r >= 3.

Definition core_eligible (S : SystemState) (r : RootId) : Prop :=
  tier_of S r = TierCore /\ clarity_ok r /\ drift_ok r /\ support_ok S r /\ split_of S r = false.

Definition reserve_eligible (S : SystemState) (r : RootId) : Prop :=
  tier_of S r = TierReserve /\ root_clarity r >= 1 /\ support_count (ledger S) r >= 1.

Definition pressure_flagged (S : SystemState) (r : RootId) : Prop :=
  tier_of S r = TierPressure.

Inductive Update : Type :=
| USetCell : RootId -> Operator8 -> Status -> Update
| URetier : RootId -> Tier -> Update
| UMarkSplit : RootId -> bool -> Update.

Definition apply_update (S : SystemState) (u : Update) : SystemState :=
  match u with
  | USetCell r o s =>
      mkSystemState (set_cell (ledger S) r o s) (tier_override S) (split_override S)
  | URetier r t =>
      mkSystemState (ledger S)
        (fun r' => if root_eq_dec r' r then Some t else tier_override S r')
        (split_override S)
  | UMarkSplit r b =>
      mkSystemState (ledger S) (tier_override S)
        (fun r' => if root_eq_dec r' r then Some b else split_override S r')
  end.
Definition demo20_ledger : Ledger :=
  fun r o =>
    match r with
    | R_gress =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_scend =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Blocked
        | O_downward => Blocked
        | O_together => Attested
        | O_against => Blocked
        end
    | R_tract =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_pel =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_cede =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_ject =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_port =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_fer =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_mit =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Blocked
        | O_against => Blocked
        end
    | R_vert =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_volv =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_trop =>
        match o with
        | O_toward => Blocked
        | O_away => Blocked
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_cresc =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_pand =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_clud =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_capt =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_flu =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Blocked
        end
    | R_struct =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Blocked
        | O_against => Blocked
        end
    | R_fract =>
        match o with
        | O_toward => Attested
        | O_away => Attested
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Blocked
        | O_against => Blocked
        end
    | R_morph =>
        match o with
        | O_toward => Attested
        | O_away => Blocked
        | O_around => Attested
        | O_beside => Attested
        | O_upward => Attested
        | O_downward => Attested
        | O_together => Attested
        | O_against => Attested
        end
    | R_duc => Undecidable
    | R_mov => Undecidable
    | R_vad => Undecidable
    | R_tend => Undecidable
    | R_curr => Undecidable
    | R_flect => Undecidable
    | R_clin => Undecidable
    | R_stroph => Undecidable
    | R_press => Undecidable
    | R_aug => Undecidable
    | R_minu => Undecidable
    | R_pon => Undecidable
    | R_sert => Undecidable
    | R_tect => Undecidable
    | R_velop => Undecidable
    | R_lig => Undecidable
    | R_nect => Undecidable
    | R_tex => Undecidable
    | R_fac => Undecidable
    | R_rupt => Undecidable
    | R_scind => Undecidable
    | R_solv => Undecidable
    | R_sever => Undecidable
    | R_sect => Undecidable
    | R_fus => Undecidable
    | R_mut => Undecidable
    end.


Definition demo20_state : SystemState :=
  mkSystemState demo20_ledger (fun _ => None) (fun _ => None).

Lemma all_roots_length : List.length all_roots = 46.
Proof. reflexivity. Qed.

Lemma all_ops8_length : List.length all_ops8 = 8.
Proof. reflexivity. Qed.

Lemma set_cell_same :
  forall (L : Ledger) (r : RootId) (o : Operator8) (s : Status),
    set_cell L r o s r o = s.
Proof.
  intros. unfold set_cell.
  destruct (root_eq_dec r r); [|contradiction].
  destruct (op8_eq_dec o o); [reflexivity|contradiction].
Qed.

Lemma set_cell_other_root :
  forall (L : Ledger) (r1 r2 : RootId) (o : Operator8) (s : Status),
    r1 <> r2 ->
    set_cell L r1 o s r2 o = L r2 o.
Proof.
  intros. unfold set_cell.
  destruct (root_eq_dec r2 r1); [congruence|reflexivity].
Qed.

Lemma tier_of_retier_same :
  forall (S : SystemState) (r : RootId) (t : Tier),
    tier_of (apply_update S (URetier r t)) r = t.
Proof.
  intros. unfold tier_of, apply_update. simpl.
  destruct (root_eq_dec r r); [reflexivity|contradiction].
Qed.

Lemma split_of_mark_same :
  forall (S : SystemState) (r : RootId) (b : bool),
    split_of (apply_update S (UMarkSplit r b)) r = b.
Proof.
  intros. unfold split_of, apply_update. simpl.
  destruct (root_eq_dec r r); [reflexivity|contradiction].
Qed.

Lemma support_count_nonneg :
  forall (L : Ledger) (r : RootId), support_count L r >= 0.
Proof. intros; unfold support_count; lia. Qed.

Example demo_gress_support :
  support_count demo20_ledger R_gress = 8.
Proof. reflexivity. Qed.

Example demo_scend_support :
  support_count demo20_ledger R_scend = 5.
Proof. reflexivity. Qed.

Example demo_mit_support :
  support_count demo20_ledger R_mit = 6.
Proof. reflexivity. Qed.

Example demo_vert_support :
  support_count demo20_ledger R_vert = 8.
Proof. reflexivity. Qed.

Example demo_struct_support :
  support_count demo20_ledger R_struct = 6.
Proof. reflexivity. Qed.

Example demo_morph_support :
  support_count demo20_ledger R_morph = 7.
Proof. reflexivity. Qed.

Example gress_core_eligible_demo :
  core_eligible demo20_state R_gress.
Proof.
  unfold core_eligible, tier_of, clarity_ok, drift_ok, support_ok, split_of, demo20_state.
  repeat split; try reflexivity; try (vm_compute; lia); try lia.
Qed.

Example scend_core_eligible_demo :
  core_eligible demo20_state R_scend.
Proof.
  unfold core_eligible, tier_of, clarity_ok, drift_ok, support_ok, split_of, demo20_state.
  repeat split; try reflexivity; try (vm_compute; lia); try lia.
Qed.
