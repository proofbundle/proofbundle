/-
  2026-09-22_SI_SECOND_SERIAL.lean

  Record-level serialization for `SISecond.Realization`, over the kernel's three-symbol
  alphabet, with a proof that the code is prefix-free and injective: two records that
  serialize to the same symbol string (with any tails) are the same record, and the tails
  are equal. This is the item listed as "possible, not built" in
  2026-09-15_SI_SECOND_ANALYSIS.md, section 1; `Pos.encode_append_inj` is its base case.

  Discipline carried over from the kernel:
    * only the prelude and the kernel module are imported
    * no rewriting automation or arithmetic deciders; no hand-written use of the natural-number type
    * generated injectivity theorems are switched off; every declaration is audited for axioms

  Encoders are written in tail-prepending form, `enc x tail`, so a record's code is the
  fields' codes chained in order and injectivity composes field by field without any
  lemma about list append.

  What this does not do: hash, sign, or say anything about bytes on disk. A serialization
  that is injective is what a hash is applied to; that the hash is collision-resistant is
  a separate, unproved assumption.
-/
import «2026-09-15_SI_SECOND_KERNEL»

set_option genInjectivity false

namespace SISecond
namespace Serial

open Symbol

/-- `enc` is prefix-free and injective with tails. -/
def PrefixFree {X : Type} (enc : X → List Symbol → List Symbol) : Prop :=
  ∀ (a b : X) (s t : List Symbol), enc a s = enc b t → a = b ∧ s = t

/-! ## Field encoders -/

def posE (p : Pos) (s : List Symbol) : List Symbol := p.encode ++ s

theorem posE_pf : PrefixFree posE := Pos.encode_append_inj

def speciesE : Species → List Symbol → List Symbol
  | .caesium133, s => digitZero :: s
  | .otherSpecies, s => digitOne :: s

def levelE : GroundLevel → List Symbol → List Symbol
  | .fThree, s => digitZero :: s
  | .fFour, s => digitOne :: s

def sublevelsE : Sublevels → List Symbol → List Symbol
  | .zeroToZero, s => digitZero :: s
  | .otherPair, s => digitOne :: s

def signE : Sign → List Symbol → List Symbol
  | .plus, s => digitZero :: s
  | .minus, s => digitOne :: s

def reportE : Report → List Symbol → List Symbol
  | .heldAtLimit, s => digitZero :: s
  | .correctedToLimit, s => digitOne :: s
  | .notControlled, s => stop :: s

def effectE : Effect → List Symbol → List Symbol
  | .motion, s => digitZero :: digitZero :: s
  | .staticFields, s => digitZero :: digitOne :: s
  | .thermalRadiation, s => digitOne :: digitZero :: s
  | .collisions, s => digitOne :: digitOne :: s
  | .otherEffect, s => stop :: s

/-- Case split on both enumeration values, then either peel equal leading symbols or
refute by distinct leading symbols. -/
macro "enum_pf" : tactic => `(tactic|
  (intro a b s t h
   cases a <;> cases b <;>
   first
   | exact ⟨rfl, (List.cons.inj h).2⟩
   | exact ⟨rfl, (List.cons.inj (List.cons.inj h).2).2⟩
   | (have h1 := (List.cons.inj h).1; contradiction)
   | (have h2 := (List.cons.inj (List.cons.inj h).2).1; contradiction)))

theorem speciesE_pf : PrefixFree speciesE := by enum_pf
theorem levelE_pf : PrefixFree levelE := by enum_pf
theorem sublevelsE_pf : PrefixFree sublevelsE := by enum_pf
theorem signE_pf : PrefixFree signE := by enum_pf
theorem reportE_pf : PrefixFree reportE := by enum_pf
theorem effectE_pf : PrefixFree effectE := by enum_pf

def shiftE : Shift → List Symbol → List Symbol
  | .zero, s => digitZero :: s
  | .nonzero sg m e, s => digitOne :: signE sg (posE m (posE e s))

theorem shiftE_pf : PrefixFree shiftE
  | .zero, .zero, _, _, h => ⟨rfl, (List.cons.inj h).2⟩
  | .zero, .nonzero _ _ _, _, _, h => nomatch (List.cons.inj h).1
  | .nonzero _ _ _, .zero, _, _, h => nomatch (List.cons.inj h).1
  | .nonzero sg m e, .nonzero sg' m' e', _, _, h =>
    match signE_pf sg sg' _ _ (List.cons.inj h).2 with
    | ⟨rfl, h⟩ => match posE_pf m m' _ _ h with
      | ⟨rfl, h⟩ => match posE_pf e e' _ _ h with
        | ⟨rfl, h⟩ => ⟨rfl, h⟩

def magnitudeE : Magnitude → List Symbol → List Symbol
  | .zero, s => digitZero :: s
  | .nonzero m e, s => digitOne :: posE m (posE e s)

theorem magnitudeE_pf : PrefixFree magnitudeE
  | .zero, .zero, _, _, h => ⟨rfl, (List.cons.inj h).2⟩
  | .zero, .nonzero _ _, _, _, h => nomatch (List.cons.inj h).1
  | .nonzero _ _, .zero, _, _, h => nomatch (List.cons.inj h).1
  | .nonzero m e, .nonzero m' e', _, _, h =>
    match posE_pf m m' _ _ (List.cons.inj h).2 with
    | ⟨rfl, h⟩ => match posE_pf e e' _ _ h with
      | ⟨rfl, h⟩ => ⟨rfl, h⟩

def transitionE (tr : Transition) (s : List Symbol) : List Symbol :=
  levelE tr.levelA (levelE tr.levelB s)

theorem transitionE_pf : PrefixFree transitionE
  | ⟨a, b⟩, ⟨a', b'⟩, _, _, h =>
    match levelE_pf a a' _ _ h with
    | ⟨rfl, h⟩ => match levelE_pf b b' _ _ h with
      | ⟨rfl, h⟩ => ⟨rfl, h⟩

def correctionE (c : Correction) (s : List Symbol) : List Symbol :=
  effectE c.effect (shiftE c.shift (magnitudeE c.uncertainty s))

theorem correctionE_pf : PrefixFree correctionE
  | ⟨e, sh, u⟩, ⟨e', sh', u'⟩, _, _, h =>
    match effectE_pf e e' _ _ h with
    | ⟨rfl, h⟩ => match shiftE_pf sh sh' _ _ h with
      | ⟨rfl, h⟩ => match magnitudeE_pf u u' _ _ h with
        | ⟨rfl, h⟩ => ⟨rfl, h⟩

/-- A list is written as `1 c₁ 1 c₂ … 0`: a continue mark before each entry, a stop mark
after the last. -/
def correctionsE : List Correction → List Symbol → List Symbol
  | [], s => digitZero :: s
  | c :: cs, s => digitOne :: correctionE c (correctionsE cs s)

theorem correctionsE_pf : PrefixFree correctionsE
  | [], [], _, _, h => ⟨rfl, (List.cons.inj h).2⟩
  | [], _ :: _, _, _, h => nomatch (List.cons.inj h).1
  | _ :: _, [], _, _, h => nomatch (List.cons.inj h).1
  | c :: cs, c' :: cs', s, t, h =>
    match correctionE_pf c c' _ _ (List.cons.inj h).2 with
    | ⟨rfl, h⟩ => match correctionsE_pf cs cs' s t h with
      | ⟨rfl, h⟩ => ⟨rfl, h⟩

/-! ## The record -/

/-- Field order is the declaration order of `Realization`. -/
def realizationE (r : Realization) (s : List Symbol) : List Symbol :=
  speciesE r.species <| transitionE r.transition <| posE r.periods <|
  reportE r.atRest <| reportE r.noStaticFields <| reportE r.noThermalRadiation <|
  reportE r.isolated <| correctionsE r.corrections <| sublevelsE r.sublevels s

theorem realizationE_pf : PrefixFree realizationE
  | ⟨sp, tr, p, a, n, th, i, cs, sl⟩, ⟨sp', tr', p', a', n', th', i', cs', sl'⟩, _, _, h =>
    match speciesE_pf sp sp' _ _ h with
    | ⟨rfl, h⟩ => match transitionE_pf tr tr' _ _ h with
    | ⟨rfl, h⟩ => match posE_pf p p' _ _ h with
    | ⟨rfl, h⟩ => match reportE_pf a a' _ _ h with
    | ⟨rfl, h⟩ => match reportE_pf n n' _ _ h with
    | ⟨rfl, h⟩ => match reportE_pf th th' _ _ h with
    | ⟨rfl, h⟩ => match reportE_pf i i' _ _ h with
    | ⟨rfl, h⟩ => match correctionsE_pf cs cs' _ _ h with
    | ⟨rfl, h⟩ => match sublevelsE_pf sl sl' _ _ h with
    | ⟨rfl, h⟩ => ⟨rfl, h⟩

/-- The whole-record code, with nothing after it. -/
def encode (r : Realization) : List Symbol := realizationE r []

/-- Distinct records give distinct codes. -/
theorem encode_inj (r r' : Realization) (h : encode r = encode r') : r = r' :=
  (realizationE_pf r r' [] [] h).1

theorem encode_ne {r r' : Realization} (h : r ≠ r') : encode r ≠ encode r' :=
  fun he => h (encode_inj r r' he)

/-- A concatenation of two records reads back uniquely: framing needs no length field. -/
theorem encode_pair_inj (r₁ r₂ q₁ q₂ : Realization)
    (h : realizationE r₁ (encode r₂) = realizationE q₁ (encode q₂)) : r₁ = q₁ ∧ r₂ = q₂ :=
  match realizationE_pf r₁ q₁ _ _ h with
  | ⟨h1, h⟩ => ⟨h1, encode_inj r₂ q₂ h⟩

/-! ## Checks on concrete records -/

/-- The kernel's form-only record and its successor-count twin serialize differently. -/
theorem formOnly_code_ne_succ :
    encode formOnlyRecord ≠ encode { formOnlyRecord with periods := Pos.succ caesiumPeriodsPerSecond } := by
  decide

/-- Direction twin: swapping the two levels changes the code even though both pass `IsSecond`. -/
theorem formOnly_code_ne_reversed :
    encode formOnlyRecord ≠ encode { formOnlyRecord with transition := ⟨.fFour, .fThree⟩ } := by
  decide

end Serial
end SISecond
