-- NOT COMPILED. `lake`/`lean` are not installed in this session's
-- environment; this file has never been run through the Lean compiler.
-- Nothing in THEOREM_INDEX.json counts anything from this file, and
-- nothing in this repository should describe it as verified. It exists as
-- a real, carefully-written starting skeleton for the byte/varint layer
-- already implemented and tested in ../../src/bytes/, written so a future
-- session with a working toolchain has something concrete to compile
-- against rather than starting from nothing.

namespace ProofBundle

/-- A finite byte string: the same domain `src/bytes/bytes.mjs` operates
    on, modeled here as a list of bytes rather than an array, since list
    induction is what the accompanying (also uncompiled) proofs in
    `Theorems/` would need. -/
abbrev ByteString := List UInt8

/-- Concatenation, matching `concatBytes` in `src/bytes/bytes.mjs`. -/
def ByteString.concat (a b : ByteString) : ByteString := a ++ b

/-- Byte-wise equality, matching `equalBytes`. `List` equality on a
    `DecidableEq` element type is already exactly this, stated here as a
    named definition so later theorems can refer to `ByteString.eq`
    directly rather than to `List.beq` obliquely. -/
def ByteString.eq (a b : ByteString) : Bool := a == b

/-- A length-bounded byte string, matching `assertMaxLength`. The bound is
    carried in the type rather than checked by a runtime assertion, which
    is the one place this Lean model is deliberately stronger than the
    JavaScript it mirrors — src/bytes/bytes.mjs throws at call time;
    this makes an out-of-bound value unrepresentable at the type level. -/
structure BoundedByteString (maxLen : Nat) where
  bytes : ByteString
  bound : bytes.length ≤ maxLen

end ProofBundle
