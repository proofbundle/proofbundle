<div align="center">

# ProofBundle

**A signed, Merkle-committed provenance envelope for any digital artifact.**
Seal, verify, and timestamp — offline, single-file, no trust required.

[![self-test](https://img.shields.io/badge/self--test-65%2F65%20live%20in%20browser-brightgreen)](#try-it-in-10-seconds)
[![offline](https://img.shields.io/badge/runs-100%25%20offline-blue)](#what-it-is)
[![License](https://img.shields.io/badge/license-Apache--2.0%20OR%20MIT-blue)](#license)
[![Signed releases](https://img.shields.io/badge/releases-cryptographically%20signed-brightgreen)](VERIFYING.md)

[Live app](https://proofbundle.org) · [Verify a release](VERIFYING.md) · [Security policy](SECURITY.md)

</div>

> **Status: public preview (v0.9).** The engine is verified (65/65 self-test) and the
> app is fully usable. Final polish is in progress; the signed **v1.0.0** release will be
> cut when it is ready. Nothing here is overstated — see [Honest limitations](#honest-limitations).

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
- **65/65 self-test** that runs live in your own browser on load, plus a
  **1,097-case conformance suite** you can run yourself.

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

## License

Dual-licensed under **Apache-2.0 OR MIT** — your choice. See
[LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).

---

<div align="center">
<sub>ProofBundle — provenance you can check yourself.</sub>
</div>
