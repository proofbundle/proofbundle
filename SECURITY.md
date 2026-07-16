# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub Security Advisories](https://github.com/proofbundle/proofbundle/security/advisories/new)
rather than a public issue.

- **Acknowledgement:** within 72 hours.
- **Initial assessment:** within 7 days.
- **Fix target for critical issues:** 90 days, coordinated disclosure.

Please do not include exploit details in public channels until a fix is released.

## Threat model & guarantees

ProofBundle is an **offline, client-side** verifier. It provides:

- **Integrity** — a sealed artifact is detectably altered if a single byte changes.
- **Provenance** — a receipt binds the artifact to the signer's public key.
- **Non-repudiation** — via the chosen signature scheme (classical or post-quantum).

### What a seal does *not* guarantee

- **Regulatory compliance.** A seal is *evidence of traceability*, not a compliance
  certificate. Auditors and notified bodies evaluate that evidence.
- **Fitness / safety of the sealed content.** ProofBundle faithfully seals whatever input
  it is given. It cannot detect that an upstream file was already poisoned or wrong.
- **Absolute time.** Temporal predicates (`expired`, `not_before`) are evaluated against
  the local system clock, which the local user controls. For independent time, anchor the
  chain head to an external timestamp (OpenTimestamps / RFC 3161) — supported in-app.

### Known considerations

- The reference Ed25519 path and signature comparisons have been reviewed for
  constant-time behaviour; see the conformance suite. Bugs found in review have been fixed
  and are covered by the 65/65 self-test.
- Post-quantum signatures use the audited `@noble/post-quantum` implementations.
- Keys generated in the browser are held only in that tab's memory unless the user
  explicitly exports them.

## Verifying release integrity

All release artifacts are signed. See [VERIFYING.md](VERIFYING.md).
