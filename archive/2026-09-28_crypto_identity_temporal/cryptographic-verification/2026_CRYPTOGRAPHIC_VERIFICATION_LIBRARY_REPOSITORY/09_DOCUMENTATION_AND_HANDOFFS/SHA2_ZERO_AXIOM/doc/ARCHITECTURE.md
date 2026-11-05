
# Architecture of the Zero-Axiom SHA-2 Library

## Design Principles

1. **Type-Driven Bounds**: Every array access carries its bounds proof via `Fin n`.
   There are no partial functions, no panic paths, no runtime exceptions.

2. **Zero Axioms**: No `sorry`, no `admit`, no `classical`, no `propext`.
   The only axioms permitted are those intrinsic to Lean's type theory
   (e.g., `Quot.sound` for quotient types, which we do not use).

3. **Structural Recursion**: All loops are expressed as structurally recursive
   functions with explicit fuel parameters. This ensures totality without
   requiring well-founded recursion axioms.

4. **Domain Partitioning**: Code is organized by algorithm (SHA-224/256/384/512)
   and by concern (Core, Hash, HMAC, Properties, TestVectors).

## Module Graph

```
Crypto.Vec
  ├── Crypto.SHA256.Core
  │     ├── Crypto.SHA256.Hash
  │     │     ├── Crypto.SHA256.HMAC
  │     │     └── Crypto.SHA256.TestVectors
  │     ├── Crypto.SHA256.Properties
  │     └── Crypto.SHA256.Defective (provenance only)
  ├── Crypto.SHA224.Core
  │     └── Crypto.SHA224.Hash
  ├── Crypto.SHA512.Core
  │     ├── Crypto.SHA512.Hash
  │     └── Crypto.SHA512.TestVectors
  └── Crypto.SHA384.Core
        └── Crypto.SHA384.Hash

Crypto.Util (hex encoding, shared utilities)
```

## The Vec Abstraction

`Vec α n` is the foundational data structure:

```lean
structure Vec (α : Type) (n : Nat) where
  data : Array α
  size_eq : data.size = n
```

The `size_eq` field is a proof term that is erased at runtime but checked
at compile time. Access is via:

```lean
def Vec.get (v : Vec α n) (i : Fin n) : α
```

`Fin n` is the type of natural numbers strictly less than `n`. It is
impossible to construct `Fin n` values outside the range `[0, n-1]`.
Therefore, `Vec.get` is totally safe.

## Fuel-Based Recursion

Lean requires structural recursion for total functions. Since SHA-2
algorithms iterate a fixed number of times (64 or 80 rounds), we use
a fuel parameter that decreases on each recursive call:

```lean
def expandSchedule (block : Vec Word 16) : Vec Word 64 :=
  let rec go (fuel : Nat) (i : Nat) (acc : Array Word)
             (h : acc.size = i) (h2 : i ≤ 64) (h3 : i + fuel = 64) : Vec Word 64 :=
    match fuel with
    | 0 => ...
    | fuel + 1 => ...
  go 64 0 #[] (by rfl) (by decide) (by rfl)
```

The invariant `i + fuel = 64` ensures termination. When `fuel = 0`,
we must have `i = 64`, meaning the accumulator has exactly 64 words.

## Padding Proofs

The padding functions are accompanied by proofs that the output is always
a multiple of the block size:

```lean
theorem padMessage_size (msg : ByteArray) : (padMessage msg).size % 64 = 0
```

This proof uses elementary number theory (division algorithm) and is
completely constructive.

## Defective Predecessor

The file `Crypto/SHA256/Defective.lean` preserves an earlier version that
used Lean's `!` panic operator for array access. This operator is
implemented via `sorryAx` in Lean core, making it an axiomatic escape
hatch. The defective version is retained to document exactly where the
boundary failed: not in the mathematics of SHA-256, but in the
admissibility of indexing operations.
