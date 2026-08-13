-- NOT COMPILED — see the header comment in Bytes.lean; the same caveat
-- applies here in full. This models the admitted semantic-value domain
-- from src/canonical/canonical-json.mjs, so that a future canonicalization
-- proof (determinism, idempotence, injectivity over this domain — none of
-- which is proved yet, see ../../THEOREM_INDEX.json) has a domain to state
-- those properties about.

import ProofBundle.Bytes

namespace ProofBundle

/-- The admitted semantic value domain, matching the comment at the top of
    `src/canonical/canonical-json.mjs`: null | boolean | finite number |
    string | array | object. `Value.num` carries an `Int` rather than a
    float, deliberately: this models only the safe-integer path the MJS
    canonicalizer implements exactly (see FORMAT_SPECIFICATION.md's scope
    note on non-integer numbers going through native `Number::toString`
    instead) rather than modeling IEEE-754 float canonicalization, which
    is not something this slice claims to have specified precisely enough
    to prove anything about yet. -/
inductive Value where
  | null   : Value
  | bool   : Bool → Value
  | num    : Int → Value
  | str    : String → Value
  | arr    : List Value → Value
  | obj    : List (String × Value) → Value  -- entries; see wellFormed below for the no-duplicate-key invariant

/- The invariant `strictParseJSON`'s parser enforces at parse time by
    throwing on a duplicate key (see the `map.has(key)` check in
    canonical-json.mjs's `parseObject`): no key appears twice in an
    object's entry list. Stated as a separate predicate rather than baked
    into `Value.obj`'s constructor, so a *malformed* value (one that
    violates this) is still representable and namable — which is what lets
    a future rejection theorem talk about the malformed case at all,
    rather than making it type-theoretically nonexistent and therefore
    nothing to reject.

    Stated via the mutually-recursive `wellFormedList` / `wellFormedEntries`
    rather than directly as `∀ v ∈ vs, wellFormed v`, because `Value` is a
    *nested* inductive (it recurses through `List Value`) and Lean cannot infer
    a structural termination measure through a `∀ _ ∈ _` binder. The pair is
    destructured in `wellFormedEntries`' pattern for the same reason: `e.snd`
    is a projection and is not recognised as a structural subterm, whereas the
    `v` bound by `(_, v) :: es` is. The two `_iff` lemmas below recover the
    original membership phrasing, so nothing downstream has to know this. -/
mutual

/-- No key appears twice in an object's entry list, recursively. -/
def wellFormed : Value → Prop
  | .null => True
  | .bool _ => True
  | .num _ => True
  | .str _ => True
  | .arr vs => wellFormedList vs
  | .obj entries => (entries.map Prod.fst).Nodup ∧ wellFormedEntries entries

def wellFormedList : List Value → Prop
  | [] => True
  | v :: vs => wellFormed v ∧ wellFormedList vs

def wellFormedEntries : List (String × Value) → Prop
  | [] => True
  | (_, v) :: es => wellFormed v ∧ wellFormedEntries es

end

-- These four are proved by explicit introduction and case analysis rather
-- than `simp`. `simp` closes them in one line each, but rewrites propositions
-- via `propext` and quotient-normalises via `Quot.sound`, so the resulting
-- theorems report those two axioms. Everything else in this repository is
-- axiom-free, and four `propext` dependencies for what are definitional
-- restatements would be the only blemish in the set.

theorem wellFormedList_iff (vs : List Value) :
    wellFormedList vs ↔ ∀ v ∈ vs, wellFormed v := by
  induction vs with
  | nil =>
      constructor
      · intro _ v hv; cases hv
      · intro _; exact True.intro
  | cons v vs ih =>
      constructor
      · intro h w hw
        cases hw with
        | head        => exact h.1
        | tail _ hmem => exact (ih.mp h.2) w hmem
      · intro h
        exact ⟨h v (List.Mem.head _), ih.mpr (fun w hw => h w (List.Mem.tail _ hw))⟩

theorem wellFormedEntries_iff (es : List (String × Value)) :
    wellFormedEntries es ↔ ∀ e ∈ es, wellFormed e.snd := by
  induction es with
  | nil =>
      constructor
      · intro _ e he; cases he
      · intro _; exact True.intro
  | cons e es ih =>
      obtain ⟨k, v⟩ := e
      constructor
      · intro h w hw
        cases hw with
        | head        => exact h.1
        | tail _ hmem => exact (ih.mp h.2) w hmem
      · intro h
        exact ⟨h (k, v) (List.Mem.head _), ih.mpr (fun w hw => h w (List.Mem.tail _ hw))⟩

/-- `wellFormed` on an array, in the original membership phrasing.
    `wellFormed (.arr vs)` is definitionally `wellFormedList vs`. -/
theorem wellFormed_arr (vs : List Value) :
    wellFormed (.arr vs) ↔ ∀ v ∈ vs, wellFormed v :=
  wellFormedList_iff vs

/-- `wellFormed` on an object, in the original membership phrasing: no
    duplicate keys, and every value well-formed. -/
theorem wellFormed_obj (entries : List (String × Value)) :
    wellFormed (.obj entries) ↔
      (entries.map Prod.fst).Nodup ∧ ∀ e ∈ entries, wellFormed e.snd := by
  constructor
  · intro h; exact ⟨h.1, (wellFormedEntries_iff entries).mp h.2⟩
  · intro h; exact ⟨h.1, (wellFormedEntries_iff entries).mpr h.2⟩

end ProofBundle
