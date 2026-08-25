<div align="center">

# ProofBundle

**Machine-verifiable compliance infrastructure.**
Certify computational claims from reproducible evidence—not institutional
assertion alone.

[![ci](https://github.com/proofbundle/proofbundle/actions/workflows/ci.yml/badge.svg)](https://github.com/proofbundle/proofbundle/actions/workflows/ci.yml)
[![coq](https://img.shields.io/badge/coq%208.18.0-83%20theorems%2C%200%20axioms-brightgreen)](coq/)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/proofbundle/proofbundle)
[![License](https://img.shields.io/badge/license-GPL--3.0--or--later-243746)](#license)
[![Signed releases](https://img.shields.io/badge/releases-cryptographically%20signed-brightgreen)](VERIFYING.md)

[Live app](https://proofbundle.org) · [Verify a release](VERIFYING.md) · [Security policy](SECURITY.md)

Institutional role-signing keys and AI-BOM bindings are published in
[`AGENT_ROLE_KEYS.json`](AGENT_ROLE_KEYS.json); private signing keys remain in
protected local custody and are never committed.

</div>

> **ProofBundle is a cryptographically signed certification system that resolves
> claims against a canonical registry, binds them to artifacts, implementations,
> identities, policies, formal proofs, assumptions, lineage, and time, and emits
> independently verifiable evidence of what was evaluated, what passed, what
> failed, and what remains externally assumed.**

Read the complete public product definition in
[WHAT_PROOFBUNDLE_IS.md](WHAT_PROOFBUNDLE_IS.md).

> **Evidence is reported by instrument and scope.** Boot checks, generated
> conformance cases, frozen vectors, modular tests, interoperability runs,
> formal builds, axiom audits, and registry validation are distinct evidence
> sets. No one counter represents ProofBundle's verification surface. See
> [CURRENT_STATE_PROOFS.md](CURRENT_STATE_PROOFS.md),
> [ASSUMPTIONS.md](ASSUMPTIONS.md), and [AUDIT.md](AUDIT.md).

---

## What it certifies

ProofBundle evaluates declared compliance requirements and issues a cryptographically
signed **certification of compliance**. The certification binds the applicable profile,
compliance vector, threshold vector, gate result, score, artifact commitment, registry
state, AI-BOM, verification trace, issuer identity, signature, timestamp, and lineage.

## Certification and verification operations

- **Seal any artifact** with a signature over a Merkle-committed digest (RFC 6962-style
  domain separation).
- **9 digest algorithms** (SHA-2, SHA-3, BLAKE2/BLAKE3) × **10 signature schemes**,
  including **post-quantum** (Dilithium/ML-DSA, Falcon, SPHINCS+/SLH-DSA).
- **Typed verification outcomes** — a receipt returns a named verdict
  (`VERIFIED`, `INVALID-SIGNATURE`, `OUT-OF-BOUNDS`, `EXPIRED`, `LINEAGE-INVALID`, …),
  not a guess.
- **Compliance profiles** — formal rule sets for regulated verticals, with explicit
  predicates, thresholds, decision procedures, and typed failure results.
- **Signed compliance certification** — issue a portable, machine-verifiable result
  bound to the evaluated requirements, evidence, artifact state, AI-BOM, and issuer.
- **EU AI Act Article 50** machine-readable transparency marking.
- A **standalone boot harness** that checks the browser client at load; its
  legacy counter is one instrument and is not the system-wide verification
  total.
- **Up to 630 live classical conformance cases** across 9 digests, 7 classical
  signatures, and 10 outcome classes.
- A legacy fixture file of 1,097 vectors is included. **436 pass under the
  current schema**, and all 108 vectors of kind `verified` pass cleanly. The
  remainder is documented schema drift from `spec_ver 1.0.0` — missing
  `bundle.seal.pub_b64u` and `bundle.merkleRoot`, and SPKI-wrapped keys where
  the engine expects raw. See [AUDIT.md](AUDIT.md) entry PB-2026-07-15-002.

Every visible conclusion is connected to its machine-verifiable basis. See
[CURRENT_STATE_PROOFS.md](CURRENT_STATE_PROOFS.md).

## Try it in 10 seconds

Open [`proofbundle.html`](proofbundle.html) in any modern browser — or visit
[proofbundle.org](https://proofbundle.org). Drop a file onto **Seal**. Download the
receipt. Drop that receipt onto **Verify**. You'll see `VERIFIED`.

## Verify from the command line

```bash
npm ci
node cli/proofbundle-cli.mjs selftest      # runs the legacy standalone boot harness
node cli/proofbundle-cli.mjs verify receipt.pb.json
```

## Develop in GitHub Codespaces

A ready-to-use dev container is included. Click **Open in GitHub Codespaces** above
or run `Code: Rebuild and Reopen in Container` locally with the Dev Containers
extension. The container ships Coq 8.18, Lean 4.11.0, and Node 22, installs `npm`
dependencies automatically, and can run the full surface test suite plus the Coq
proof checks without any local toolchain installation.

```bash
npm run test:surface        # unit / negative / hostile / vector / registry checks
npm run test:crypto         # from-scratch Keccak + ML-KEM tests
node cli/proofbundle-cli.mjs selftest
cd coq && make check        # 83 theorems, 0 axioms
cd lean && lake build       # pinned Lean 4.11.0 formal tree
```

## Install toolchains locally

If you prefer a local environment, run:

```bash
bash tools/install-toolchains.sh
```

This idempotent script installs the exact versions used by CI: Node dependencies,
Coq 8.18.0 via `opam`, and Lean 4.11.0 via `elan`.

## Cryptographically signed releases

Every published release artifact is signed. The public key lives in this repo, and
[VERIFYING.md](VERIFYING.md) walks through checking a download end to end. A provenance
tool should hold itself to its own standard — so this one does.

## Certification scope and assumptions

The certification states the result of the selected formal compliance profile over the
declared evidence and committed artifact state. Its scope, inputs, thresholds, registry
state, issuer, assumptions, and verification trace are carried with the result. Temporal
claims identify their clock or external anchor. See [ASSUMPTIONS.md](ASSUMPTIONS.md),
[TRUST_BOUNDARY.md](TRUST_BOUNDARY.md), and [SECURITY.md](SECURITY.md).

## Formal verification and the proof archive

The formal-methods work behind this project lives in a separate archive. Its verified
state — which numbers are checked, which are relayed, and which are in circulation but
should not be published — is recorded in **[docs/CORPUS-STATE.md](docs/CORPUS-STATE.md)**.
Read that first before quoting any theorem count.

[`crypto/`](crypto/) holds the from-scratch FIPS 202 (SHA-3/SHAKE) and FIPS 203 (ML-KEM)
implementations, written from the specifications with no external crypto library:

```bash
npm run test:crypto     # 173 pass — incl. 45 byte-exact checks vs an independent FIPS 203 impl
```

Note that *zero dependencies* is not yet true of the project as a whole. Accurate today:
every hash and the KEM are ours and verified against independent implementations;
the signature schemes still use `noble`/WebCrypto. See [crypto/README.md](crypto/README.md).

## License

**GPL-3.0-or-later** — copyleft. See [LICENSE-GPL](LICENSE-GPL).

Every Lean formalization under [`lean/`](lean/) is published under
**GPL-3.0-or-later** and carries an SPDX identifier in the source file. Generated
Lean downloads emitted by the standalone client carry the same copyleft notice.

A verifier is only worth what its source is worth. Copyleft keeps every
downstream modification of the verification path open to the same inspection
the artifacts themselves demand: a closed fork of a provenance tool is a
provenance tool nobody can check.

**Prior releases remain dual-licensed under Apache-2.0 OR MIT**
([LICENSE-APACHE](LICENSE-APACHE), [LICENSE-MIT](LICENSE-MIT)). Those grants are
irrevocable for code already published under them; the copyleft terms apply
going forward. Both files are retained deliberately rather than deleted, so the
licensing history stays legible.

---

<div align="center">
<sub>ProofBundle — formal compliance certification with independent verification.</sub>
</div>
