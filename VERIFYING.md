# Verifying a ProofBundle release

Every release artifact in this repository is cryptographically signed. This page shows how
to confirm that a file you downloaded is authentic and unmodified.

## What you need

- The release artifact, e.g. `proofbundle.html`
- Its detached signature, e.g. `proofbundle.html.sig` (or `.bundle` for cosign)
- The project **public key**, published in this repo as [`cosign.pub`](cosign.pub)

> **Start here:** the current release is **v1.0.0**, and its receipt, checksums and
> public key are in [`release/`](release/). [`release/RELEASE.md`](release/RELEASE.md)
> walks through verifying it with no tools at all, or with the app itself. That is the
> fastest path and it works offline.

## Two signing mechanisms, and which one applies

`release.yml` is configured for **Sigstore keyless** signing: identity comes from the
CI runner's OIDC token and the signature is recorded in Rekor, the public transparency
log. Nothing to generate, store, or protect. That path applies to releases cut through
CI.

Releases cut outside CI are signed with an Ed25519 key whose public half ships in
[`release/`](release/). Both are verifiable offline; the keyless one additionally
leaves a public transparency-log record. **Check `release/RELEASE.md` for which
mechanism signed the release you have** — it says so explicitly.

The `cosign` instructions below apply to the keyless path.

## Verify with cosign (recommended)

```bash
cosign verify-blob \
  --key cosign.pub \
  --signature proofbundle.html.sig \
  proofbundle.html
```

A successful check prints `Verified OK`. Any modification to the file — even one byte —
fails verification.

## Verify with ProofBundle itself (dogfood)

Each release also ships a ProofBundle receipt (`proofbundle.html.pb.json`). Open
`proofbundle.html`, go to **Verify**, and drop in the receipt. A genuine, unmodified
release returns `VERIFIED`; a tampered one returns `INVALID-SIGNATURE`.

## Why this matters

ProofBundle's entire purpose is letting people verify artifacts without trusting the
source. Holding its own releases to that same standard is not decoration — it is the
product demonstrating itself.
