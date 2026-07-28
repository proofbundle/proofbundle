<div align="center">

# ProofBundle

**A signed, Merkle-committed provenance envelope for any digital artifact.**
Seal, verify, and timestamp — offline, single-file, no trust required.

[![ci](https://github.com/proofbundle/proofbundle/actions/workflows/ci.yml/badge.svg)](https://github.com/proofbundle/proofbundle/actions/workflows/ci.yml)
[![coq](https://img.shields.io/badge/coq%208.18.0-83%20theorems%2C%200%20axioms-brightgreen)](coq/)
[![offline](https://img.shields.io/badge/runs-100%25%20offline-blue)](#what-it-is)
[![License](https://img.shields.io/badge/license-Apache--2.0%20OR%20MIT-blue)](#license)
[![Signed releases](https://img.shields.io/badge/releases-cryptographically%20signed-brightgreen)](VERIFYING.md)

[Live app](https://proofbundle.org) · [Verify a release](VERIFYING.md) · [Security policy](SECURITY.md)

</div>

> **Status: v1.0.0.** The engine passes its own suites (65/65 self-test, 660/660
> conformance), the CLI round-trips, and the Coq proofs close — 83 theorems, zero
> axioms. Nothing here is overstated — see [Honest limitations](#honest-limitations)
> and [AUDIT.md](AUDIT.md), which logs every defect found in this codebase including
> the ones found against outside reference implementations.

---

## What it is

ProofBundle is a **single HTML file** that runs entirely in your browser. Drop in a
document, model, dataset, or any file, and it produces a cryptographically **sealed
receipt** — a tamper-evident record that anyone can independently verify later, offline,
with nothing but the receipt and a public key.

Nothing is uploaded. No account. No server. Your private key never leaves the page.

## What it actually does — provable, not marketing

- **Seal any artifact** with a signature over a Merkle-committed digest (RFC 6962-style
  domain separation).
- **9 digest algorithms** (SHA-2, SHA-3, BLAKE2/BLAKE3) × **10 signature schemes**,
  including **post-quantum** (Dilithium/ML-DSA, Falcon, SPHINCS+/SLH-DSA).
- **Typed verification outcomes** — a receipt returns a named verdict
  (`VERIFIED`, `INVALID-SIGNATURE`, `OUT-OF-BOUNDS`, `EXPIRED`, `LINEAGE-INVALID`, …),
  not a guess.
- **Compliance profiles** — ready-made rule sets for regulated verticals (healthcare,
  finance, autonomous systems, and more), each expressed as plain-language requirements.
- **EU AI Act Article 50** machine-readable transparency marking.
- **65/65 self-test** that runs live in your own browser on load.
- **660/660 conformance cases** across 9 digest algorithms and 10 signature
  schemes, classical and post-quantum.
- A legacy fixture file of 1,097 vectors is included. **436 pass under the
  current schema**, and all 108 vectors of kind `verified` pass cleanly. The
  remainder is documented schema drift from `spec_ver 1.0.0` — missing
  `bundle.seal.pub_b64u` and `bundle.merkleRoot`, and SPKI-wrapped keys where
  the engine expects raw. See [AUDIT.md](AUDIT.md) entry PB-2026-07-15-002.

Every claim above is verifiable in the app or in this repo. See [Honest limitations](#honest-limitations).

## Try it in 10 seconds

Open [`proofbundle.html`](proofbundle.html) in any modern browser — or visit
[proofbundle.org](https://proofbundle.org). Drop a file onto **Seal**. Download the
receipt. Drop that receipt onto **Verify**. You'll see `VERIFIED`.

## Verify from the command line

```bash
npm ci
node cli/proofbundle-cli.mjs selftest      # runs the 65/65 self-test headlessly
node cli/proofbundle-cli.mjs verify receipt.pb.json
```

## Cryptographically signed releases

Every published release artifact is signed. The public key lives in this repo, and
[VERIFYING.md](VERIFYING.md) walks through checking a download end to end. A provenance
tool should hold itself to its own standard — so this one does.

## Honest limitations

ProofBundle proves **integrity and provenance** — that a file is exactly what it was when
it was sealed, and who sealed it. It does **not**:

- prove an AI system is safe, unbiased, or fit for purpose (those are separate assessments);
- guarantee regulatory compliance — it produces *evidence of traceability*, which a
  notified body or auditor evaluates;
- protect against a compromised input (it faithfully seals whatever it is given).

Temporal checks trust the local clock. See [SECURITY.md](SECURITY.md) for the full model.

## Formal verification and the proof corpus

The formal-methods work behind this project lives in a separate corpus. Its verified
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

Dual-licensed under **Apache-2.0 OR MIT** — your choice. See
[LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).

---

<div align="center">
<sub>ProofBundle — provenance you can check yourself.</sub>
</div>
