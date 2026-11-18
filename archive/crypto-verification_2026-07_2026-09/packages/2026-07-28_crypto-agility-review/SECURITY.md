# Security and assurance boundary

This is a production-oriented review packet, not a production authorization.
Use it as an auditable base for cryptographic, implementation, operational,
trust-service, and legal review.

## Trust claims are separate

A successful bundle verification proves the selected cryptographic checks over
the supplied bytes in the reported scope. It does not by itself prove:

- who controlled an embedded key;
- that a certificate path was trusted or unrevoked at a relevant time;
- that timestamp bytes came from a trusted authority;
- that a runtime or hardware device holds a certification;
- that evidence collection was lawful, complete, or forensically sound; or
- that a court will admit the evidence.

Pin verification keys externally or validate certificate/attestation evidence
under a documented policy. Preserve acquisition procedure, operator identity,
chain of custody, clocks, and original media outside this code.

## High-priority review items

1. **Hybrid KEM combiner.** The two hybrid KEM identifiers are local
   ProofBundle suites. Ordered component secrets are length-framed and
   domain-separated; a canonical transcript binds the recipient keys and
   ciphertexts; SHA-512 commits the transcript; HKDF-SHA512 produces the final
   secret. They remain `review-required` pending independent cryptographic
   review and protocol assignment.
2. **Model correspondence.** Coq proves protocol invariants in small models.
   It does not prove that the JavaScript implements those models. Review
   `src/registry.mjs`, `src/signatures.mjs`, `src/kem.mjs`,
   `src/encryption.mjs`, `src/structures.mjs`, and `src/verifier.mjs` against
   the proof statements.
3. **Runtime assurance.** Node/OpenSSL supplies classical and PQ private-key
   operations. Confirm the exact runtime build, provider configuration,
   security policy, and validation status for the deployment.
4. **JavaScript side channels.** JavaScript cannot guarantee constant-time
   execution or reliable zeroization. The pure-JS ML-KEM code is reference
   evidence only. Noble is used for BLAKE3, cSHAKE/KMAC, AES-GCM-SIV, and
   XChaCha20-Poly1305; independently review dependency versions and audit
   scope.
5. **Identity and timestamp trust.** Embedded keys and raw timestamp tokens are
   not trust decisions. Enforced timestamp policy requires validated adapter
   results from distinct authority identifiers.

## Fail-closed choices

- Unknown identifiers fail.
- Legacy-only PBKDF2 creation requires explicit authorization.
- Hybrid KEM and its encryption profile require explicit
  `allowReviewRequired`.
- Hybrid signatures have an exact ordered component count and require every
  signature.
- Canonical decoders reject duplicate keys, non-minimal lengths/integers,
  indefinite CBOR, floats/tags outside the subset, malformed Unicode, and
  trailing bytes.
- Bundle verification never upgrades missing payloads to full verification.
- Raw timestamp evidence never upgrades to validated time evidence.
- External AEAD nonce injection requires `allowExternalNonce`; otherwise the
  OS CSPRNG is used.
- Resource ceilings bound bundle, manifest, metadata, path, entry, payload, XOF,
  KDF, AEAD, and DRBG operations.

## Determinism boundary

Canonical manifests, protected headers, algorithm ordering, Merkle structure,
CID construction, and verification decisions are deterministic for identical
inputs. Signature generation, OS randomness, KEM encapsulation, and encryption
may be randomized. Therefore the signed envelope is not promised to have
identical bytes across independent creation runs.

ECDSA is supplied for compatibility. The profile uses P1363 encoding but does
not promise deterministic nonce generation or a unique low-S representation.
The default profile avoids ECDSA.

## Key and nonce handling

- Production key generation delegates to Node/OpenSSL or a provider adapter.
- Private DER in the software provider is best-effort overwritten on
  `destroy`, but garbage-collected copies may exist.
- Hardware adapters must enforce mechanism selection, key binding, user
  presence/PIN policy, session cleanup, and attestation validation.
- AES-GCM and ChaCha20-Poly1305 nonce reuse is catastrophic. Do not authorize
  externally supplied nonces unless a reviewed nonce allocation mechanism owns
  uniqueness. GCM-SIV improves misuse resistance but does not make arbitrary
  nonce practice acceptable.
- Passwords and derived keys cannot be reliably erased from all JavaScript
  runtime copies.

## Algorithm migration

Do not edit an existing identifier's meaning. Add a new versioned identifier
and profile, retain old verification support, mark creation policy separately,
and cross-sign or nest migration attestations. The registry's `implementation`
field is evidence metadata, not part of the cryptographic algorithm identity.

## Deployment prerequisites

- Independent cryptographic and secure-code review.
- Reproducible runtime/dependency build and vulnerability monitoring.
- Deployment-specific key lifecycle, backup, rotation, revocation, and
  compromise procedures.
- Validated trust-service and revocation adapters where identity/time claims are
  required.
- Test vectors from authoritative sources for every enabled parameter set.
- Jurisdiction-specific evidence and electronic-signature advice.
- Operational entropy, clock, logging, retention, and disaster-recovery policy.
