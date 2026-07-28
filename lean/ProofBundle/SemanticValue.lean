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

/-- The invariant `strictParseJSON`'s parser enforces at parse time by
    throwing on a duplicate key (see the `map.has(key)` check in
    canonical-json.mjs's `parseObject`): no key appears twice in an
    object's entry list. Stated as a separate predicate rather than baked
    into `Value.obj`'s constructor, so a *malformed* value (one that
    violates this) is still representable and namable — which is what lets
    a future rejection theorem talk about the malformed case at all,
    rather than making it type-theoretically nonexistent and therefore
    nothing to reject. -/
def wellFormed : Value → Prop
  | .null => True
  | .bool _ => True
  | .num _ => True
  | .str _ => True
  | .arr vs => vs.Forall wellFormed
  | .obj entries =>
      (entries.map Prod.fst).Nodup ∧ entries.Forall (fun e => wellFormed e.snd)

end ProofBundle
