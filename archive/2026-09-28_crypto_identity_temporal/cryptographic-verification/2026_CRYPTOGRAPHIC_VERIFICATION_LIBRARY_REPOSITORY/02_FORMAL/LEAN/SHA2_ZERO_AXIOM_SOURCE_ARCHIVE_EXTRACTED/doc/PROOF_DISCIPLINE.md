
# Proof Discipline

## The Zero-Axiom Boundary

A theorem in this library is considered valid only if `#print axioms`
reports no dependencies on:

- `sorryAx` — the axiom introduced by `sorry` or `admit`
- `Classical.choice` — the axiom of choice
- `Quot.sound` — quotient type soundness (used for propext and function extensionality)
- `propext` — propositional extensionality

The expected output of `#print axioms <theorem_name>` is:
```
-- no axioms
```

or, in some cases, only the core axioms of dependent type theory that
are unavoidable (e.g., `Lean.ofReduceBool` for native_decide, which we
do not use in proofs).

## What We Avoid

### 1. The Panic Operator (`!`)

Lean's array indexing operator `a[i]!` is partial. On out-of-bounds access,
it invokes `panic!`, which is defined as:

```lean
def panic! {α : Type} (msg : String) : α := @panic α msg
```

where `panic` is implemented via `sorryAx`. Therefore, any code using `!`
is axiomatically compromised, even if the index happens to be in bounds
at runtime.

**Repair**: Replace `a[i]!` with `Vec.get ⟨i, proof⟩` where `proof : i < n`.

### 2. Classical Reasoning

We do not import `Classical` or use `by_contra`, `by_cases`, or other
tactics that depend on excluded middle. All proofs are constructive.

**Repair**: Use case analysis on decidable predicates (`if c then ... else ...`)
with explicit proofs in each branch.

### 3. Well-Founded Recursion Axioms

Lean's default well-founded recursion tactic may introduce axioms. We avoid
this by using fuel-based structural recursion.

**Repair**: Explicit fuel parameters with decreasing measures.

### 4. Native Decider

`native_decide` uses the Lean compiler and may introduce `ofReduceBool`.
We do not use `native_decide` in proofs.

**Repair**: Use `by decide` for decidable propositions, `by rfl` for
definitional equalities, and explicit `Nat` lemmas for arithmetic.

## Verification Workflow

After adding any new theorem, run:

```lean
#print axioms my_new_theorem
```

If any forbidden axiom appears, the theorem must be rewritten.
