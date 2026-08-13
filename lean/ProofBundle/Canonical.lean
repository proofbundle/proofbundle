import ProofBundle.Bytes
open ProofBundle

namespace ProofBundle.Canonical

inductive SimpleValue where
  | null
  | bool (b : Bool)
  deriving DecidableEq, Repr

def canonicalize (v : SimpleValue) : ByteString :=
  match v with
  | .null => [0x6e, 0x75, 0x6c, 0x6c]
  | .bool true => [0x74, 0x72, 0x75, 0x65]
  | .bool false => [0x66, 0x61, 0x6c, 0x73, 0x65]

def parse (bs : ByteString) : Option SimpleValue :=
  match bs with
  | [0x6e, 0x75, 0x6c, 0x6c] => some .null
  | [0x74, 0x72, 0x75, 0x65] => some (.bool true)
  | [0x66, 0x61, 0x6c, 0x73, 0x65] => some (.bool false)
  | _ => none

theorem canonicalize_injective (v1 v2 : SimpleValue) :
    canonicalize v1 = canonicalize v2 → v1 = v2 := by
  intro h
  cases v1 with
  | null =>
    cases v2 with
    | null => rfl
    | bool b =>
      cases b <;> try { injection h } <;> contradiction
  | bool b1 =>
    cases v2 with
    | null =>
      cases b1 <;> try { injection h } <;> contradiction
    | bool b2 =>
      cases b1 <;> cases b2 <;> try { rfl } <;> try { injection h } <;> contradiction

theorem parse_canonicalize_idempotent (v : SimpleValue) :
    parse (canonicalize v) = some v := by
  cases v <;> try { rfl }
  cases ‹Bool› <;> rfl

end ProofBundle.Canonical
