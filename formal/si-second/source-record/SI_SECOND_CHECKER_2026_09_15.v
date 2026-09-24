(* SI_SECOND_CHECKER_2026_09_15.v

   Second checker for the SI-second witness. Coq 8.18.0.
   File name: Coq requires a module name that starts with a letter, so the date is at the end.
   Comments in this file contain no double-quote characters, because Coq reads them as string
   delimiters inside comments.

   Independent of Lean: it does not call Lean, read Lean files, or reuse Lean's encoder.
   It uses Coq's own binary type positive and parses 9192631770 with Coq's own numeral parser.

   What is_second checks, on a record parsed from witness.json (same conditions as the Lean
   kernel's IsSecond): species is caesium133; the two levels differ; each of the four reports is
   heldAtLimit, or correctedToLimit with a listed correction for its effect; periods = 9192631770.

   JSON accepted (anything else parses to None): no whitespace; keys in sorted order; exactly the
   fields atRest, corrections, isolated, noStaticFields, noThermalRadiation, periods, species,
   sublevels, transition with levelA and levelB; corrections as objects with effect, shift,
   uncertainty; shift and uncertainty only the token zero; periods as the kernel's Pos.encode
   written with 0, 1, and a final period.

   Coq cannot read files. From a directory holding this file and witness.json, in bash:
     coqc -Q . SIC SI_SECOND_CHECKER_2026_09_15.v
     { printf 'From Coq Require Import String.\nFrom SIC Require Import SI_SECOND_CHECKER_2026_09_15.\n'
       printf 'Definition input : String.string := \042'
       sed 's/\x22/\x22\x22/g' witness.json
       printf '\042%%string.\nEval vm_compute in check input.\n'; } > run_check.v
     coqc -Q . SIC run_check.v
     sha256sum witness.json
   The sed step doubles each quote character, which is how Coq writes one inside a string.
   The Boolean is computed by Coq. The SHA-256 line comes from sha256sum, not from Coq. *)

From Coq Require Import String Ascii Bool List PArith.
Import ListNotations.
Local Open Scope string_scope.
Local Open Scope bool_scope.

Inductive species := Caesium133 | OtherSpecies.
Inductive level := FThree | FFour.
Inductive report := HeldAtLimit | CorrectedToLimit | NotControlled.
Inductive effect := Motion | StaticFields | ThermalRadiation | Collisions | OtherEffect.
(* This serialization carries only zero shifts and zero uncertainties. *)
Inductive shift := ShiftZero.
Inductive magnitude := MagnitudeZero.
Inductive sublevels := ZeroToZero | OtherPair.

Record correction := mkCorrection {
  c_effect : effect; c_shift : shift; c_uncertainty : magnitude }.

Record realization := mkRealization {
  r_atRest : report;
  r_corrections : list correction;
  r_isolated : report;
  r_noStaticFields : report;
  r_noThermalRadiation : report;
  r_periods : positive;
  r_species : species;
  r_sublevels : sublevels;
  r_levelA : level;
  r_levelB : level }.

(** The fixed number, parsed from decimal by Coq. *)
Definition lock : positive := 9192631770%positive.

Definition species_eqb (a b : species) : bool :=
  match a, b with
  | Caesium133, Caesium133 => true
  | OtherSpecies, OtherSpecies => true
  | _, _ => false
  end.

Definition level_eqb (a b : level) : bool :=
  match a, b with
  | FThree, FThree => true
  | FFour, FFour => true
  | _, _ => false
  end.

Definition effect_eqb (a b : effect) : bool :=
  match a, b with
  | Motion, Motion => true
  | StaticFields, StaticFields => true
  | ThermalRadiation, ThermalRadiation => true
  | Collisions, Collisions => true
  | OtherEffect, OtherEffect => true
  | _, _ => false
  end.

Fixpoint listed (e : effect) (cs : list correction) : bool :=
  match cs with
  | [] => false
  | c :: rest => effect_eqb (c_effect c) e || listed e rest
  end.

Definition addressed (r : report) (e : effect) (cs : list correction) : bool :=
  match r with
  | HeldAtLimit => true
  | CorrectedToLimit => listed e cs
  | NotControlled => false
  end.

Definition is_second (w : realization) : bool :=
  species_eqb (r_species w) Caesium133
  && negb (level_eqb (r_levelA w) (r_levelB w))
  && addressed (r_atRest w) Motion (r_corrections w)
  && addressed (r_noStaticFields w) StaticFields (r_corrections w)
  && addressed (r_noThermalRadiation w) ThermalRadiation (r_corrections w)
  && addressed (r_isolated w) Collisions (r_corrections w)
  && Pos.eqb (r_periods w) lock.

(** Strict parser for the canonical JSON above. *)

Definition bind {A B : Type} (o : option A) (f : A -> option B) : option B :=
  match o with Some a => f a | None => None end.

Fixpoint expect (lit s : string) : option string :=
  match lit with
  | EmptyString => Some s
  | String a lit' =>
      match s with
      | String b s' => if Ascii.eqb a b then expect lit' s' else None
      | EmptyString => None
      end
  end.

(* Characters up to a double quote; returns the token and the text after the quote. *)
Fixpoint read_token (s : string) : option (string * string) :=
  match s with
  | EmptyString => None
  | String c s' =>
      if Ascii.eqb c "034"%char then Some (EmptyString, s')
      else match read_token s' with
           | Some (t, rest) => Some (String c t, rest)
           | None => None
           end
  end.

Definition field (lit s : string) : option (string * string) :=
  bind (expect lit s) read_token.

(* Pos.encode read back: digit 0 is twice, digit 1 is twice plus one, the period is one;
   lowest binary digit first. *)
Fixpoint decode_periods (s : string) : option (positive * string) :=
  match s with
  | EmptyString => None
  | String c s' =>
      if Ascii.eqb c "0"%char then
        match decode_periods s' with Some (p, r) => Some (xO p, r) | None => None end
      else if Ascii.eqb c "1"%char then
        match decode_periods s' with Some (p, r) => Some (xI p, r) | None => None end
      else if Ascii.eqb c "."%char then Some (xH, s')
      else None
  end.

Definition species_of (t : string) : option species :=
  if String.eqb t "caesium133" then Some Caesium133
  else if String.eqb t "otherSpecies" then Some OtherSpecies
  else None.

Definition level_of (t : string) : option level :=
  if String.eqb t "fThree" then Some FThree
  else if String.eqb t "fFour" then Some FFour
  else None.

Definition report_of (t : string) : option report :=
  if String.eqb t "heldAtLimit" then Some HeldAtLimit
  else if String.eqb t "correctedToLimit" then Some CorrectedToLimit
  else if String.eqb t "notControlled" then Some NotControlled
  else None.

Definition effect_of (t : string) : option effect :=
  if String.eqb t "motion" then Some Motion
  else if String.eqb t "staticFields" then Some StaticFields
  else if String.eqb t "thermalRadiation" then Some ThermalRadiation
  else if String.eqb t "collisions" then Some Collisions
  else if String.eqb t "otherEffect" then Some OtherEffect
  else None.

Definition shift_of (t : string) : option shift :=
  if String.eqb t "zero" then Some ShiftZero else None.

Definition magnitude_of (t : string) : option magnitude :=
  if String.eqb t "zero" then Some MagnitudeZero else None.

Definition sublevels_of (t : string) : option sublevels :=
  if String.eqb t "zeroToZero" then Some ZeroToZero
  else if String.eqb t "otherPair" then Some OtherPair
  else None.

Definition parse_correction (s : string) : option (correction * string) :=
  bind (field "{""effect"":""" s) (fun p1 =>
  bind (effect_of (fst p1)) (fun e =>
  bind (field ",""shift"":""" (snd p1)) (fun p2 =>
  bind (shift_of (fst p2)) (fun sh =>
  bind (field ",""uncertainty"":""" (snd p2)) (fun p3 =>
  bind (magnitude_of (fst p3)) (fun u =>
  bind (expect "}" (snd p3)) (fun rest =>
  Some (mkCorrection e sh u, rest)))))))).

Fixpoint corrections_tail (fuel : nat) (acc : list correction) (s : string)
  : option (list correction * string) :=
  match fuel with
  | O => None
  | S f =>
      match expect "]" s with
      | Some rest => Some (rev acc, rest)
      | None =>
          bind (expect "," s) (fun s1 =>
          bind (parse_correction s1) (fun pc =>
          corrections_tail f (fst pc :: acc) (snd pc)))
      end
  end.

Definition parse_corrections (s : string) : option (list correction * string) :=
  match expect "]" s with
  | Some rest => Some ([], rest)
  | None =>
      bind (parse_correction s) (fun pc =>
      corrections_tail (String.length s) [fst pc] (snd pc))
  end.

Definition parse (s : string) : option realization :=
  bind (field "{""atRest"":""" s) (fun a =>
  bind (report_of (fst a)) (fun atRest =>
  bind (expect ",""corrections"":[" (snd a)) (fun s1 =>
  bind (parse_corrections s1) (fun cs =>
  bind (field ",""isolated"":""" (snd cs)) (fun b =>
  bind (report_of (fst b)) (fun isolated =>
  bind (field ",""noStaticFields"":""" (snd b)) (fun c =>
  bind (report_of (fst c)) (fun nsf =>
  bind (field ",""noThermalRadiation"":""" (snd c)) (fun d =>
  bind (report_of (fst d)) (fun ntr =>
  bind (expect ",""periods"":""" (snd d)) (fun s2 =>
  bind (decode_periods s2) (fun pr =>
  bind (expect """" (snd pr)) (fun s3 =>
  bind (field ",""species"":""" s3) (fun e =>
  bind (species_of (fst e)) (fun sp =>
  bind (field ",""sublevels"":""" (snd e)) (fun g =>
  bind (sublevels_of (fst g)) (fun sub =>
  bind (field ",""transition"":{""levelA"":""" (snd g)) (fun h =>
  bind (level_of (fst h)) (fun la =>
  bind (field ",""levelB"":""" (snd h)) (fun k =>
  bind (level_of (fst k)) (fun lb =>
  bind (expect "}}" (snd k)) (fun rest =>
  match rest with
  | EmptyString =>
      Some (mkRealization atRest (fst cs) isolated nsf ntr (fst pr) sp sub la lb)
  | _ => None
  end)))))))))))))))))))))).

Definition check (s : string) : option bool := option_map is_second (parse s).

(** The period code in witness.json decodes to Coq's own parse of 9192631770. *)
Example code_string_is_lock :
  decode_periods "010110111011011000110111110001000." = Some (lock, EmptyString).
Proof. reflexivity. Qed.

Print Assumptions check.
Print Assumptions code_string_is_lock.
