# Implementation status

Status terms:

- **Operational**: implemented and exercised in this packet.
- **Policy-gated**: implemented, but rejected unless the caller explicitly
  authorizes a review-required suite.
- **Adapter**: compile-ready interface to an external implementation; the
  cryptographic/trust operation is not implemented here.
- **Reference only**: useful independent evidence, not selected for production
  secret-key operations.

## Primitive and protocol coverage

| Function | Coverage | Status / implementation |
|---|---|---|
| Fixed hashes | SHA-256, SHA-384, SHA-512, SHA-512/256, SHA3-256/384/512, BLAKE3-256, BLAKE2b-512, BLAKE2s-256 | Operational; Node crypto except BLAKE3 via pinned `@noble/hashes` |
| XOF and keyed hashing | SHAKE256, cSHAKE256, KMAC256 | Operational; bounded output, required cSHAKE customization, minimum KMAC key |
| Merkle algorithms | BLAKE3-256, SHA-256, SHA3-256, or any registered fixed-output hash | Operational; tagged leaves/nodes, recursive split, exact proof shape |
| Classical signatures | Ed25519, Ed448, ECDSA P-256/P-384 P1363, RSA-PSS 3072/4096 | Operational through Node/OpenSSL |
| PQ signatures | ML-DSA-44/65/87 and all 12 exact FIPS 205 SLH-DSA SHA2/SHAKE sets | Operational through Node/OpenSSL |
| Hybrid signatures | Ed25519+ML-DSA-65, Ed448+ML-DSA-87, P-384+ML-DSA-87 | Operational; exact ordered list and all components required |
| KEM | ML-KEM-512/768/1024 | Operational through Node/OpenSSL |
| Hybrid KEM | X25519+ML-KEM-768, P-384 ECDH+ML-KEM-768 | Policy-gated; fixed component order, canonical transcript, SHA-512 commitment, HKDF-SHA512 |
| AEAD | AES-256-GCM, AES-256-GCM-SIV, ChaCha20-Poly1305, XChaCha20-Poly1305 | Operational; Node or pinned `@noble/ciphers`; OS nonce by default |
| KDF | HKDF-SHA256/384/512 | Operational; nonempty context required |
| Password KDF | Argon2id; PBKDF2-HMAC-SHA256 | Operational; exact Argon2id profiles; PBKDF2 creation is legacy-only and requires an override |
| Randomness | OS CSPRNG; HMAC_DRBG-SHA512 state machine; raw-source health-test monitor | OS randomness operational; DRBG is intentionally fixture/protocol-test only; health thresholds require a source assessment |
| Timestamping | RFC 3161 request DER; OpenSSL verification bridge; OpenTimestamps CLI bridge; independent-authority threshold | Request/policy operational; trust verification is adapter-based |
| X.509 | DER/PEM inspection, fingerprint/key ID, validity window, direct issuer signature | Partial operational; full path, revocation, CT, and jurisdiction policy require external validation |
| CMS/CAdES/COSE/JWS | Strict external verifier contract returning exact verified payload and protected bytes | Adapter |
| Hardware keys | Software provider plus callback contracts for PKCS#11, TPM2, Secure Enclave, Android Keystore, FIDO2, PIV, HSM service | Software operational; hardware integrations are adapters |
| Canonical encoding | Deterministic CBOR strict subset; strict JCS-compatible JSON subset; timestamp ASN.1 DER | Operational |
| Binary/text encodings | Base64url, multibase base16/base32/base58btc/base64url, canonical uint64 varints | Operational |
| Content addressing | Multihash, CIDv1 raw/dag-cbor/json | Operational; local registry records code status |
| Integrity structures | Merkle trees, MMR accumulator/root, hash chains, DAG commitments | Operational |
| Bundle structures | Signed manifests, detached signatures, embedded public verification keys, parent-CID lineage | Operational |
| Nested attestations | A bundle can be a payload and parent bundle CIDs form a checked DAG | Operational at content/protocol layer |

The registry contains 60 versioned entries: 10 hashes, 2 XOFs, 1 MAC, 21
single signatures, 3 hybrid signatures, 3 KEMs, 2 key exchanges, 2 hybrid KEMs,
4 AEADs, 5 KDF/password-KDF entries, 3 encryption suites, 2 encodings, and 2
timestamp adapter identifiers.

## What is deliberately not claimed

- No formal proof of SHA, BLAKE3, EdDSA, ECDSA, RSA-PSS, ML-DSA, SLH-DSA,
  ML-KEM, AEAD, or KDF cryptographic security.
- No machine-checked refinement proof connecting the Coq model to the `.mjs`
  implementation.
- No FIPS module validation or hardware security certification.
- No complete RFC 5280 path builder, OCSP/CRL client, CT log client, or
  trust-list policy.
- No native CMS, CAdES, COSE, or JWS parser/verifier.
- No RFC 3161 or OpenTimestamps network submission client.
- No evidence that an embedded public key belongs to a named person or entity.
- No jurisdiction-specific admissibility opinion.

## Test evidence recorded in this packet

- Full local matrix: every test and every signature parameter set passed with
  no skips in the recorded Node 24.14.0 / OpenSSL 3.5.5 environment.
- Preserved Keccak reference: 88 pass, 0 fail.
- Preserved ML-KEM property suite: 40 pass, 0 fail.
- Preserved external-vector comparison: 45 pass, 0 fail.
- Fresh Node-to-independent-pure-JS ML-KEM interoperability: 30 pass, 0 fail.
- Four Coq files type-checked with JSCoq 0.17.1; 26 printed theorem checks were
  closed under the global context.

Run the commands in [OPUS_REVIEW.md](OPUS_REVIEW.md) instead of relying only on
these recorded results.
