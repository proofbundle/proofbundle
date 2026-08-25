-- SPDX-License-Identifier: GPL-3.0-or-later
-- Compiled with the repository's pinned Lean 4.11.0 toolchain on 2026-08-24.
-- This models the byte/varint layer implemented and tested in ../../src/bytes/.

namespace ProofBundle

/-- A finite byte string: the same domain `src/bytes/bytes.mjs` operates
    on, modeled here as a list of bytes rather than an array. -/
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
