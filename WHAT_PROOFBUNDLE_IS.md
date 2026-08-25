# What ProofBundle Is

ProofBundle is a cryptographically signed certification system that resolves
claims against a canonical registry, binds them to artifacts, implementations,
identities, policies, formal proofs, assumptions, lineage, and time, and emits
independently verifiable evidence of what was evaluated, what passed, what
failed, and what remains externally assumed.

It is machine-verifiable compliance infrastructure: computational claims are
certified from reproducible evidence instead of being accepted through
institutional assertion alone.

## The system

ProofBundle joins disciplines that are normally separated:

- a canonical registry identifies algorithms, constructions, protocols,
  profiles, security states, providers, and permitted operations;
- implementations and providers expose the executable operations actually
  used;
- formal definitions and theorem packages state the properties claimed of
  those operations;
- known-answer, structural, negative, hostile-input, interoperability, and
  conformance tests record what was exercised;
- printed assumptions identify every dependency the proof chain does not
  discharge;
- artifact commitments, identity keys, timestamps, lineage, AI-BOMs, and
  policy profiles bind the evaluation to a particular act and state;
- a signed certification carries the result and the evidence required for an
  independent verifier to reproduce it.

The resulting chain is:

```text
registry identity
    -> normative specification
    -> formal definition
    -> implementation or provider
    -> tests and independent comparisons
    -> theorem identifiers and printed assumptions
    -> profile evaluation
    -> signed certification
    -> independent verification
```

## What a certification says

ProofBundle does not emit an unscoped universal `compliant` bit. A
certification states that a declared claim was evaluated under an identified
profile, against identified evidence, using identified algorithms,
implementations, providers, identities, assumptions, and temporal conditions.

It records both successful and unsuccessful outcomes. A verifier can inspect
and challenge the artifact digest, signature, identity, registry snapshot,
profile, provider, vector result, theorem reference, assumption set, lineage,
boundary environment, temporal anchor, and asserted external fact.

## The registry is not a feature list

An algorithm may be planned, identified, source-present, provider-available,
wired, executable, vector-tested, interoperability-tested, formally defined,
theorem-linked, kernel-audited, verification-only, prohibited for generation,
blocked, deprecated, broken, or release-enabled. These are different states.

In particular, “not wired into one dispatcher” does not mean “not
implemented,” and “source present” does not mean “certified.” ProofBundle keeps
those distinctions machine-readable so that implementation, verification, and
release claims cannot be laundered across layers.

## The product boundary

The standalone HTML client is one instrument for creating and verifying
bundles. The website is the public entrance. A dispatcher registry is one
projection. The product is the accumulated system: the registry, cryptographic
implementations, formalizations, verification evidence, custody records,
profiles, identities, and signed certification protocol operating together.

ProofBundle therefore sits at the intersection of formal methods,
cryptographic engineering, software supply-chain security, AI provenance,
machine identity, policy-as-code, compliance evidence, and independent
verification.
