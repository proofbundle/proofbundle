# Standards and identifier notes

The local `pb.*.v1` identifiers are ProofBundle identifiers. They name an exact
profile inside this packet; they are not IANA or NIST assignments.

## Primary references

| Area | Reference |
|---|---|
| SHA-2 | [NIST FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) |
| SHA-3 / SHAKE | [NIST FIPS 202](https://csrc.nist.gov/pubs/fips/202/final) |
| cSHAKE / KMAC | [NIST SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final) |
| Digital Signature Standard | [NIST FIPS 186-5](https://csrc.nist.gov/pubs/fips/186-5/final) |
| ML-KEM | [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) |
| ML-DSA | [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) |
| SLH-DSA | [NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) |
| KEM guidance | [NIST SP 800-227](https://csrc.nist.gov/pubs/sp/800/227/final) |
| EdDSA | [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) |
| RSA-PSS | [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) |
| X25519 | [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) |
| BLAKE2 | [RFC 7693](https://www.rfc-editor.org/rfc/rfc7693) |
| AES-GCM | [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) |
| AES-GCM-SIV | [RFC 8452](https://www.rfc-editor.org/rfc/rfc8452) |
| ChaCha20-Poly1305 | [RFC 8439](https://www.rfc-editor.org/rfc/rfc8439) |
| HKDF | [RFC 5869](https://www.rfc-editor.org/rfc/rfc5869) |
| Argon2 | [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106) |
| JCS | [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) |
| CBOR | [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949) |
| RFC 3161 timestamps | [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161) |
| X.509 / CRL | [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) |
| OCSP | [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960) |
| Certificate Transparency v2 | [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162) |
| CMS | [RFC 5652](https://www.rfc-editor.org/rfc/rfc5652) |
| COSE | [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052) |
| JWS | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) |
| Node crypto API used here | [Node.js v24 crypto documentation](https://nodejs.org/docs/latest-v24.x/api/crypto.html) |

## Qualification notes

- FIPS 203, 204, and 205 standardize algorithms and parameter sets. They do not
  validate this runtime or application.
- FIPS 205 names both a hash family and a parameter set. Generic names such as
  `SLH-DSA-128s` are insufficient for an exact identifier.
- KMAC is a keyed MAC/PRF construction from SP 800-185, not a plain digest.
- XOF output length and cSHAKE customization are part of the local object
  semantics.
- XChaCha20-Poly1305 is widely deployed, but the cited IRTF XChaCha document
  remains a draft; the registry records that qualification.
- [RFC 9954](https://www.rfc-editor.org/rfc/rfc9954) specifies the
  X25519MLKEM768 construction for TLS 1.3. It informs ordering and concatenation
  review but does not assign a generic ProofBundle KEM. The local hybrid KEMs
  therefore remain review-required.
- The JSON implementation is a strict JCS-compatible subset: it additionally
  rejects integer values outside the interoperable safe-integer range.
- The CBOR implementation is a strict deterministic subset: text-key maps,
  integers through uint64, bytes, text, arrays, booleans, and null. Floats,
  tags, indefinite lengths, and non-text map keys are rejected.
- Multihash/multicodec numeric status changes independently of this packet.
  The local registry records whether a code was treated as permanent or draft;
  recheck the authoritative multicodec table before protocol registration.
