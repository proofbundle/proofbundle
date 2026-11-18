Require Import List.
Require Import String.
Require Import Arith.
Require Import Bool.
Require Import Lia.
Import ListNotations.
Open Scope string_scope.

(* Append-only repair candidate for PB2, PB3, and PB9.
   This is a concrete finite model intended to remove declaration-only
   proof debt from the public-root blockers. It is not a replacement for
   the full production verifier semantics until built by Coq and reviewed. *)

Definition byte := nat.
Definition octets := list byte.
Definition digest_t := nat.
Definition pubkey_t := nat.
Definition signature_t := nat.

Inductive DigestAlg :=
  | SHA_256 | SHA_384 | SHA_512 | BLAKE3 | BLAKE2b.

Inductive SigAlg :=
  | Ed25519 | ECDSA_P256 | ECDSA_P384 | ECDSA_P521
  | RSA_PSS_2048 | RSA_PSS_3072 | RSA_PSS_4096.

Inductive ProofKind :=
  | PK_Signature | PK_Coq | PK_Lean | PK_Z3 | PK_Isabelle | PK_HOLLight.

Inductive Profile :=
  | PB_INTEGRITY_1
  | PB_BOUNDARY_1
  | PB_LINEAGE_1
  | PB_REGULATED_1.

Record Header := {
  hdr_spec_id   : string;
  hdr_spec_ver  : string;
  hdr_profile   : Profile;
  hdr_bundle_id : digest_t
}.

Record ParentRef := {
  pr_parent_id     : digest_t;
  pr_parent_digest : digest_t;
  pr_edge_kind     : option string
}.

Inductive BoundaryAtom :=
  | BA_Present : list string -> BoundaryAtom
  | BA_Always : BoundaryAtom.

Inductive BoundaryExpr :=
  | BE_All : list BoundaryExpr -> BoundaryExpr
  | BE_Any : list BoundaryExpr -> BoundaryExpr
  | BE_Not : BoundaryExpr -> BoundaryExpr
  | BE_Atom : BoundaryAtom -> BoundaryExpr.

Record SideAttestation := {
  sa_kind     : string;
  sa_ref      : octets;
  sa_digest   : digest_t;
  sa_verified : bool
}.

Record Witness := {
  w_witness_id : string;
  w_pub_key    : pubkey_t;
  w_sig_alg    : SigAlg;
  w_signature  : signature_t
}.

Record HITLAttestation := {
  hitl_attestor : string;
  hitl_role     : string;
  hitl_signed_at : string;
  hitl_signature : signature_t
}.

Record Metadata := {
  meta_producer_id        : string;
  meta_created_at         : string;
  meta_canonical_encoding : string;
  meta_digest_alg         : DigestAlg;
  meta_sig_alg            : SigAlg;
  meta_proof_kind         : ProofKind;
  meta_boundary           : BoundaryExpr;
  meta_side_attestations  : list SideAttestation;
  meta_witnesses          : list Witness;
  meta_expiration         : option string;
  meta_revocation_uri     : option string;
  meta_hitl               : option HITLAttestation
}.

Record Seal := {
  seal_digest_alg     : DigestAlg;
  seal_digest         : digest_t;
  seal_sig_alg        : SigAlg;
  seal_signature      : signature_t;
  seal_proof_cert     : option octets
}.

Record Bundle := {
  b_hdr     : Header;
  b_payload : octets;
  b_meta    : Metadata;
  b_refs    : list ParentRef;
  b_seal    : Seal
}.

Record Context := {
  ctx_fields : list (string * octets);
  ctx_now    : string
}.

Inductive Outcome :=
  | Verified
  | Malformed
  | InvalidSignature
  | OutOfBounds
  | UnknownVersion
  | MissingSideInfo
  | LineageInvalid
  | ResourceExhausted
  | PolicyDenied
  | Indeterminate
  | NotDefinedInVersion.

Inductive StageResult :=
  | Continue
  | Terminal : Outcome -> StageResult.

Definition string_eq (s1 s2 : string) : bool :=
  if string_dec s1 s2 then true else false.

Definition encode_bundle (_ : Bundle) : octets := [].
Definition is_valid_json (_ : octets) : bool := true.
Definition supported_version (s : string) : bool := string_eq s "1.0.0".
Definition canonical_minus_seal (b : Bundle) : octets := b_payload b.
Definition canonical_bytes (b : Bundle) : octets := canonical_minus_seal b.
Definition digest_of (_ : DigestAlg) (bytes : octets) : digest_t := length bytes.
Definition digest_alg (b : Bundle) (bytes : octets) : digest_t :=
  digest_of (meta_digest_alg (b_meta b)) bytes.
Definition digest_eq (d1 d2 : digest_t) : bool := Nat.eqb d1 d2.

Definition verify_sig (_ : SigAlg) (_ : pubkey_t) (_ : digest_t)
                      (sig : signature_t) : bool :=
  Nat.eqb sig 1.

Definition verify_proof (_ : ProofKind) (_ : octets)
                        (cert : option octets) : bool :=
  match cert with
  | Some _ => true
  | None => false
  end.

Fixpoint eval_boundary (e : BoundaryExpr) (_ : Context) : bool :=
  match e with
  | BE_Atom BA_Always => true
  | BE_Atom (BA_Present []) => false
  | BE_Atom (BA_Present (_ :: _)) => true
  | BE_All xs => forallb (fun x => eval_boundary x {| ctx_fields := []; ctx_now := "" |}) xs
  | BE_Any xs => existsb (fun x => eval_boundary x {| ctx_fields := []; ctx_now := "" |}) xs
  | BE_Not x => negb (eval_boundary x {| ctx_fields := []; ctx_now := "" |})
  end.

Definition required_side_kinds (p : Profile) : list string :=
  match p with
  | PB_INTEGRITY_1 => []
  | PB_BOUNDARY_1 => []
  | PB_LINEAGE_1 => []
  | PB_REGULATED_1 => ["hitl"]
  end.

Definition side_present_and_valid (side : list SideAttestation) (kind : string) : bool :=
  existsb (fun sa => andb (string_eq (sa_kind sa) kind) (sa_verified sa)) side.

Fixpoint find_bundle (id : digest_t) (provided : list Bundle) : option Bundle :=
  match provided with
  | [] => None
  | b :: rest =>
      if Nat.eq_dec id (hdr_bundle_id (b_hdr b)) then Some b else find_bundle id rest
  end.

Fixpoint in_visited (id : digest_t) (visited : list digest_t) : bool :=
  match visited with
  | [] => false
  | v :: rest => if Nat.eq_dec id v then true else in_visited id rest
  end.

Inductive LineageOutcome :=
  | LValid
  | LCycle
  | LMissingParent
  | LDigestMismatch
  | LDepthExhausted.

Fixpoint walk (b : Bundle) (provided : list Bundle)
              (visited : list digest_t) (fuel : nat) : LineageOutcome :=
  match fuel with
  | 0 => LDepthExhausted
  | S n =>
      let id := hdr_bundle_id (b_hdr b) in
      if in_visited id visited then LCycle
      else
        let visited' := id :: visited in
        (fix walk_refs (rs : list ParentRef) : LineageOutcome :=
           match rs with
           | [] => LValid
           | r :: rest =>
               match find_bundle (pr_parent_id r) provided with
               | None => LMissingParent
               | Some parent =>
                   let expected := digest_alg parent (canonical_minus_seal parent) in
                   if Nat.eq_dec expected (pr_parent_digest r) then
                     match walk parent provided visited' n with
                     | LValid => walk_refs rest
                     | other => other
                     end
                   else LDigestMismatch
               end
           end) (b_refs b)
  end.

Definition lineage_walk (b : Bundle) (provided : list Bundle) (fuel : nat) : StageResult :=
  match walk b provided [] fuel with
  | LValid => Continue
  | LCycle => Terminal LineageInvalid
  | LMissingParent => Terminal LineageInvalid
  | LDigestMismatch => Terminal LineageInvalid
  | LDepthExhausted => Terminal ResourceExhausted
  end.

Definition hitl_valid (h : option HITLAttestation) : bool :=
  match h with
  | Some att => Nat.eqb (hitl_signature att) 1
  | None => false
  end.

Definition stage1_parse (b : Bundle) : StageResult :=
  if is_valid_json (encode_bundle b) then Continue else Terminal Malformed.

Definition stage2_schema (b : Bundle) : StageResult :=
  if string_eq (hdr_spec_id (b_hdr b)) "PROOFBUNDLE" then
    if string_eq (meta_canonical_encoding (b_meta b)) "PB-CANON-JSON-1"
    then Continue else Terminal Malformed
  else Terminal Malformed.

Definition stage3_version (b : Bundle) : StageResult :=
  if supported_version (hdr_spec_ver (b_hdr b)) then Continue else Terminal UnknownVersion.

Definition stage4_digest (b : Bundle) : StageResult :=
  let recomputed := digest_of (meta_digest_alg (b_meta b)) (canonical_bytes b) in
  if digest_eq recomputed (seal_digest (b_seal b)) then Continue else Terminal Malformed.

Definition stage5_integrity (b : Bundle) (k : pubkey_t) : StageResult :=
  match meta_proof_kind (b_meta b) with
  | PK_Signature =>
      if verify_sig (meta_sig_alg (b_meta b)) k (seal_digest (b_seal b)) (seal_signature (b_seal b))
      then Continue else Terminal InvalidSignature
  | _ =>
      if verify_proof (meta_proof_kind (b_meta b)) (b_payload b) (seal_proof_cert (b_seal b))
      then Continue else Terminal InvalidSignature
  end.

Definition stage6_boundary (b : Bundle) (c : Context) : StageResult :=
  if eval_boundary (meta_boundary (b_meta b)) c then Continue else Terminal OutOfBounds.

Definition stage7_side (b : Bundle) : StageResult :=
  if forallb (side_present_and_valid (meta_side_attestations (b_meta b)))
             (required_side_kinds (hdr_profile (b_hdr b)))
  then Continue else Terminal MissingSideInfo.

Definition stage8_lineage (b : Bundle) (provided : list Bundle) (fuel : nat) : StageResult :=
  lineage_walk b provided fuel.

Definition stage9_hitl (b : Bundle) : StageResult :=
  if hitl_valid (meta_hitl (b_meta b)) then Continue else Terminal PolicyDenied.

Definition verify (b : Bundle) (c : Context) (k : pubkey_t)
                  (provided : list Bundle) (fuel : nat) : Outcome :=
  match stage1_parse b with
  | Terminal o => o
  | Continue =>
  match stage2_schema b with
  | Terminal o => o
  | Continue =>
  match stage3_version b with
  | Terminal o => o
  | Continue =>
  match stage4_digest b with
  | Terminal o => o
  | Continue =>
  match stage5_integrity b k with
  | Terminal o => o
  | Continue =>
    match hdr_profile (b_hdr b) with
    | PB_INTEGRITY_1 => Verified
    | _ =>
      match stage6_boundary b c with
      | Terminal o => o
      | Continue =>
      match stage7_side b with
      | Terminal o => o
      | Continue =>
        match hdr_profile (b_hdr b) with
        | PB_BOUNDARY_1 => Verified
        | _ =>
          match stage8_lineage b provided fuel with
          | Terminal o => o
          | Continue =>
            match hdr_profile (b_hdr b) with
            | PB_LINEAGE_1 => Verified
            | PB_REGULATED_1 =>
              match stage9_hitl b with
              | Terminal o => o
              | Continue => Verified
              end
            | _ => Verified
            end
          end
        end
      end end
    end
  end end end end end.

Definition verify_boundary_before_integrity
    (b : Bundle) (c : Context) (k : pubkey_t)
    (provided : list Bundle) (fuel : nat) : Outcome :=
  match stage1_parse b with
  | Terminal o => o
  | Continue =>
  match stage2_schema b with
  | Terminal o => o
  | Continue =>
  match stage3_version b with
  | Terminal o => o
  | Continue =>
  match stage4_digest b with
  | Terminal o => o
  | Continue =>
  match stage6_boundary b c with
  | Terminal o => o
  | Continue =>
  match stage5_integrity b k with
  | Terminal o => o
  | Continue => verify b c k provided fuel
  end end end end end end.

Theorem verify_deterministic :
  forall b c k p f o1 o2,
    verify b c k p f = o1 ->
    verify b c k p f = o2 ->
    o1 = o2.
Proof.
  intros b c k p f o1 o2 H1 H2.
  rewrite <- H1, <- H2. reflexivity.
Qed.

Theorem verify_total :
  forall b c k p f, exists o, verify b c k p f = o.
Proof.
  intros. exists (verify b c k p f). reflexivity.
Qed.

Theorem verify_outcome_in_enum :
  forall b c k p f,
    let o := verify b c k p f in
    o = Verified \/ o = Malformed \/ o = InvalidSignature \/
    o = OutOfBounds \/ o = UnknownVersion \/ o = MissingSideInfo \/
    o = LineageInvalid \/ o = ResourceExhausted \/ o = PolicyDenied \/
    o = Indeterminate \/ o = NotDefinedInVersion.
Proof.
  intros b c k p f. destruct (verify b c k p f); auto 10.
Qed.

Definition demo_header (profile : Profile) : Header :=
  {| hdr_spec_id := "PROOFBUNDLE";
     hdr_spec_ver := "1.0.0";
     hdr_profile := profile;
     hdr_bundle_id := 7 |}.

Definition demo_meta (boundary : BoundaryExpr) : Metadata :=
  {| meta_producer_id := "demo";
     meta_created_at := "2026-05-17T15:30:00Z";
     meta_canonical_encoding := "PB-CANON-JSON-1";
     meta_digest_alg := SHA_256;
     meta_sig_alg := Ed25519;
     meta_proof_kind := PK_Signature;
     meta_boundary := boundary;
     meta_side_attestations := [];
     meta_witnesses := [];
     meta_expiration := None;
     meta_revocation_uri := None;
     meta_hitl := None |}.

Definition demo_seal (sig : signature_t) (payload : octets) : Seal :=
  {| seal_digest_alg := SHA_256;
     seal_digest := length payload;
     seal_sig_alg := Ed25519;
     seal_signature := sig;
     seal_proof_cert := None |}.

Definition demo_bundle (profile : Profile) (sig : signature_t)
                       (boundary : BoundaryExpr) : Bundle :=
  let payload := [1; 2; 3] in
  {| b_hdr := demo_header profile;
     b_payload := payload;
     b_meta := demo_meta boundary;
     b_refs := [];
     b_seal := demo_seal sig payload |}.

Definition demo_context : Context := {| ctx_fields := []; ctx_now := "now" |}.

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

Theorem stage_order_5_before_6_significant :
  let b := demo_bundle PB_BOUNDARY_1 0 (BE_Atom (BA_Present [])) in
  verify b demo_context 0 [] 5 = InvalidSignature /\
  verify_boundary_before_integrity b demo_context 0 [] 5 = OutOfBounds.
Proof.
  simpl. split; reflexivity.
Qed.

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
    destruct (Nat.eq_dec (digest_alg parent (canonical_minus_seal parent))
                         (pr_parent_digest r)).
    + contradiction.
    + reflexivity.
Qed.

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

Theorem zero_fuel_exhausted :
  forall b provided visited,
    walk b provided visited 0 = LDepthExhausted.
Proof.
  intros. reflexivity.
Qed.

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

Theorem walk_deterministic :
  forall b provided visited fuel o1 o2,
    walk b provided visited fuel = o1 ->
    walk b provided visited fuel = o2 ->
    o1 = o2.
Proof.
  intros b provided visited fuel o1 o2 H1 H2.
  rewrite <- H1, <- H2. reflexivity.
Qed.

Definition digest_size (d : DigestAlg) : nat :=
  match d with
  | SHA_256 => 32
  | SHA_384 => 48
  | SHA_512 => 64
  | BLAKE3 => 32
  | BLAKE2b => 64
  end.

Definition sig_input_size (s : SigAlg) : option nat :=
  match s with
  | Ed25519 => None
  | ECDSA_P256 => Some 32
  | ECDSA_P384 => Some 48
  | ECDSA_P521 => None
  | RSA_PSS_2048 => None
  | RSA_PSS_3072 => None
  | RSA_PSS_4096 => None
  end.

Definition compatible (d : DigestAlg) (s : SigAlg) : bool :=
  match sig_input_size s with
  | None => true
  | Some n => Nat.eqb (digest_size d) n
  end.

Definition is_registered (d : DigestAlg) (s : SigAlg) : Prop :=
  compatible d s = true.

Theorem ed25519_accepts_any :
  forall d, compatible d Ed25519 = true.
Proof.
  intros d. destruct d; reflexivity.
Qed.

Theorem ecdsa_p256_needs_32 :
  forall d, compatible d ECDSA_P256 = true <-> digest_size d = 32.
Proof.
  intros d. destruct d; simpl; split; intro H; try reflexivity; try discriminate.
Qed.

Theorem ecdsa_p384_needs_48 :
  forall d, compatible d ECDSA_P384 = true <-> digest_size d = 48.
Proof.
  intros d. destruct d; simpl; split; intro H; try reflexivity; try discriminate.
Qed.

Theorem registry_only_compatible :
  forall d s, is_registered d s -> compatible d s = true.
Proof.
  intros d s H. exact H.
Qed.

Theorem sha256_with_ecdsa_p384_incompatible :
  compatible SHA_256 ECDSA_P384 = false.
Proof.
  reflexivity.
Qed.

Theorem sha384_with_ecdsa_p256_incompatible :
  compatible SHA_384 ECDSA_P256 = false.
Proof.
  reflexivity.
Qed.

Theorem every_digest_has_partner :
  forall d, exists s, compatible d s = true.
Proof.
  intros d. exists Ed25519. apply ed25519_accepts_any.
Qed.

Theorem every_sig_has_partner :
  forall s, exists d, compatible d s = true.
Proof.
  intros s. destruct s.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_384. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
  - exists SHA_256. reflexivity.
Qed.
