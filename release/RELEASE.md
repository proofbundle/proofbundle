# v1.0.0 — verifying this release

This release was signed by ProofBundle itself. No CI, no build server, no
third-party signing service was involved in producing the receipt in this
directory — the tool sealed its own artifact, which is the claim it makes about
everything else.

## Files

    SHA256SUMS                    checksums for the shipped files
    SHA512SUMS                    the same, SHA-512
    proofbundle.html.pb.json      the signed receipt over proofbundle.html
    proofbundle-release.pub       the Ed25519 public key that signed it

## Tier 1 — no tools at all

Compare the digest by eye. Open `SHA256SUMS`, find the line for
`proofbundle.html`, and check it against the `sha256` field inside
`proofbundle.html.pb.json`. They are the same string, and both describe the file
you downloaded.

On any machine with a shell:

```bash
sha256sum -c SHA256SUMS
```

This proves the file is intact. It does not prove who produced it — that is tier 2.

## Tier 2 — verify the signature, offline

Open `proofbundle.html` in a browser, go to **Verify**, and drop in
`proofbundle.html.pb.json`. You will see `VERIFIED`.

Or from a shell:

```bash
node cli/proofbundle-cli.mjs verify release/proofbundle.html.pb.json
```

Either path returns `VERIFIED` for a genuine, unmodified release, and
`INVALID-SIGNATURE` if a single byte has changed. Nothing is uploaded and no
network access is required.

The signature is Ed25519 over a Merkle-committed digest with RFC 6962 domain
separation. The public key is `proofbundle-release.pub`, committed in this
repository so it can be checked against the receipt.

## What this release contains

    engine self-test        65/65
    conformance             660/660 across 9 digests x 10 signature schemes
    crypto core             269 checks — FIPS 202, FIPS 203, confidential provenance
    Coq proofs              83 theorems, 0 axioms, 0 admits (see coq/)

## A note on the signing key

This release is signed with a key generated for it. `release.yml` in this
repository is configured for **Sigstore keyless** signing, which needs no key at
all — identity comes from the CI runner's OIDC token and the signature is
recorded in Rekor, the public transparency log. That path activates when the
repository's Actions are available.

Until then, releases are signed with the key whose public half is in this
directory. Both mechanisms are verifiable offline; the keyless one additionally
leaves a public transparency-log record. Anyone verifying a release should use
the method matching the receipt they were given, and this file will say which.

## Honest limitations

ProofBundle proves integrity and provenance — that a file is exactly what it was
when sealed, and who sealed it. It does not prove the artifact is safe, correct,
or fit for purpose. See [SECURITY.md](../SECURITY.md) for the full model and
[AUDIT.md](../AUDIT.md) for every defect found in this codebase, including those
found by outside reference implementations rather than by us.
