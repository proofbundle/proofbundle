# Cryptographic basis and proof obligations

The repaired standalone application performs digest, signature, KEM, key derivation and authenticated encryption computation in embedded source modules. It requires no Node runtime or cryptographic computation service. OS entropy remains `crypto.getRandomValues`; eliminating entropy is not a cryptographic substitution. Optional Node tools still perform transport, filesystem and development tasks. Falcon and SLH-DSA compatibility providers remain bundled third-party code and are separately identified.

## Ground truths and evidence scope

The normative specifications and pinned vector bytes are the external basis. Source files, their hashes, executable tests and exact results establish the current implementation record. A registry declaration is not execution evidence. An operator signature, a recorder signature, and a model-authored claim establish different attribution facts.

The [NIST receipt](reports/native-repair-20261013/nist-acvp.json) records 855 passing published sample cases with zero failures: ML-KEM key generation (75), encapsulation/decapsulation and input checks (165), ML-DSA key generation (75), signature generation (360), and verification (180). All three parameter sets are exercised. The [source manifest](vectors/nist-acvp/SOURCE_MANIFEST.json) pins upstream commit, URL, size and SHA-256. These results are conformance evidence, not CAVP validation or FIPS module certification.

[Six RFC 6979 signatures](reports/native-repair-20261013/rfc6979.json) match the published scalar values exactly. The native profile tests compare SHA-2 and both AEADs against an independent test-only platform implementation and check published RFC 8439, AES-256 and GCM vectors. Streaming hash and envelope interoperability checks have their own suite. Browser boot diagnostics are a separate instrument and are not a count of these cases.

The [Lean audit](lean/NativeBasisAudit.lean) reports eight abstract interface/model theorems without axiom dependencies. Its [actual output](reports/native-repair-20261013/lean-native-basis-axioms.txt) is retained. Those theorems do not prove refinement of the JavaScript primitives. The broader existing audit initially failed because the root module had not been built. After the complete build, all 84 declarations in that audit reported no axiom dependencies; both outputs are retained. Those declarations also include architecture and agent-policy models. A theorem about a policy definition does not establish operator adoption or runtime enforcement. No implementation-refinement claim is made.

## Commitments and encryption composition

Receipt commitments hash the UTF-8 bytes of the specified canonical JSON body. Canonicalization rejects duplicate keys on text input and rejects unsupported object values, lone surrogates, cycles, sparse arrays and non-finite numbers. RFC 8785 property ordering and the ECMAScript number domain remain explicit. Pretty printing is an interchange presentation and is never the commitment representation.

`PB-ENCRYPTED-1` encapsulates a recipient secret with ML-KEM, derives an AEAD key with HKDF-SHA-256, and authenticates the canonical header as AAD. The header binds the parameter set, cipher, KEM ciphertext, salt, nonce and recipient fingerprint. A signed `PB-INTEGRITY-1` outer receipt binds the encrypted envelope to its recorder. Opening checks that signature and then the AEAD tag before releasing plaintext. Public-key encapsulation alone is not sender authentication. The browser file workflow reads one file into memory; it does not promise arbitrary-size streaming.

`PB-VAULT-1` retains its existing streaming record format and custom SHAKE-based record KDF. That KDF is not relabelled as standardized HKDF. Compatibility, truncation/order detection and cryptographic composition need separate evidence. The relay's X25519/HKDF/ChaCha envelope retains its existing wire format and rejects an all-zero shared secret.

OTS submission means a calendar accepted a commitment. Displaying a block-height attestation is insufficient. The adapter requires detached target verification with successful Bitcoin attestation output; failure and silent zero exit remain unverified. This repair does not create or claim a new Bitcoin anchor. A browser signing key does not prove model identity, operator endorsement, or a prior spawn registration.

## Primitive-by-primitive obligations

Implementation refinement is **OPEN** for every primitive below. Variable-time JavaScript BigInt/table arithmetic has no established timing guarantee. Testing the same implementation against itself is not independent conformance evidence.

### SHA-2

Scratch JavaScript implementation.

Sources: [crypto/sha256.mjs](crypto/sha256.mjs), [crypto/sha512.mjs](crypto/sha512.mjs).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/180-4/upd1/final).

Evidence: [t_sha256.txt](reports/native-repair-20261013/t_sha256.txt), [t_sha512.txt](reports/native-repair-20261013/t_sha512.txt), [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt).

Necessary obligations:

- Compression function and padding refinement.
- Streaming/one-shot equivalence for arbitrary chunk boundaries.
- Length limits and counter overflow.

### Keccak / SHA-3 / SHAKE

Scratch JavaScript implementation.

Sources: [crypto/keccak.mjs](crypto/keccak.mjs).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/202/final).

Evidence: [t_keccak.txt](reports/native-repair-20261013/t_keccak.txt), [nist-acvp.json](reports/native-repair-20261013/nist-acvp.json).

Necessary obligations:

- Permutation round and lane-index refinement.
- Domain suffix and multi-rate padding correctness.
- XOF absorb/squeeze equivalence; SHA-3 is not raw Keccak.

### BLAKE2 / BLAKE3

Scratch JavaScript implementation.

Sources: [crypto/blake2.mjs](crypto/blake2.mjs), [crypto/blake3.mjs](crypto/blake3.mjs).

Normative basis: [rfc7693.html](https://www.rfc-editor.org/rfc/rfc7693.html), [BLAKE3-specs](https://github.com/BLAKE3-team/BLAKE3-specs).

Evidence: [t_blake2.txt](reports/native-repair-20261013/t_blake2.txt), [t_blake3.txt](reports/native-repair-20261013/t_blake3.txt).

Necessary obligations:

- Counter, final-block and tree-combination refinement.
- Streaming equivalence and supported digest lengths.

### Ed25519 / local identity

Scratch JavaScript implementation.

Sources: [crypto/ed25519.mjs](crypto/ed25519.mjs), [crypto/aibom.mjs](crypto/aibom.mjs), [agent/identity.mjs](agent/identity.mjs).

Normative basis: [rfc8032.html](https://www.rfc-editor.org/rfc/rfc8032.html).

Evidence: [t_ed25519.txt](reports/native-repair-20261013/t_ed25519.txt), [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt), [surface.txt](reports/native-repair-20261013/surface.txt).

Necessary obligations:

- Curve arithmetic, scalar reduction and encoding refinement.
- Canonical point and low-order rejection profile.
- Entropy and persistent key binding.
- Recorder signature does not prove source authorship or operator endorsement.

### ECDSA P-256/384/521

Scratch JavaScript implementation.

Sources: [crypto/ecdsa.mjs](crypto/ecdsa.mjs), [crypto/der.mjs](crypto/der.mjs).

Normative basis: [rfc6979.html](https://www.rfc-editor.org/rfc/rfc6979.html), [final](https://csrc.nist.gov/pubs/fips/186-5/final).

Evidence: [rfc6979.json](reports/native-repair-20261013/rfc6979.json), [t_ecdsa.txt](reports/native-repair-20261013/t_ecdsa.txt), [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt).

Necessary obligations:

- Curve and group arithmetic refinement.
- RFC6979 curve-selected HMAC nonce derivation.
- DER/key validation and scalar bounds.
- Variable-time BigInt: no timing guarantee.

### RSA-PSS / SHA-256

Scratch JavaScript implementation.

Sources: [crypto/rsa-pss.mjs](crypto/rsa-pss.mjs).

Normative basis: [rfc8017.html](https://www.rfc-editor.org/rfc/rfc8017.html).

Evidence: [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt), [rsa-keygen.json](reports/native-repair-20261013/rsa-keygen.json), [html-audit.txt](reports/native-repair-20261013/html-audit.txt).

Necessary obligations:

- PSS encoding, salt length and modulus-bit boundaries.
- Imported DER key validation.
- Probable-prime key generation, CRT and blinding correctness.
- Variable-time modular arithmetic.

### X25519 / relay envelope

Scratch JavaScript implementation.

Sources: [crypto/x25519.mjs](crypto/x25519.mjs), [agent/envelope.mjs](agent/envelope.mjs).

Normative basis: [rfc7748.html](https://www.rfc-editor.org/rfc/rfc7748.html).

Evidence: [surface.txt](reports/native-repair-20261013/surface.txt).

Necessary obligations:

- Ladder refinement, clamping and input high-bit mask.
- All-zero shared-secret rejection.
- Composition with HKDF, AEAD and signed envelope.
- Legacy wire format compatibility.

### ML-KEM-512/768/1024

Scratch JavaScript implementation.

Sources: [crypto/mlkem.mjs](crypto/mlkem.mjs).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/203/final).

Evidence: [nist-acvp.json](reports/native-repair-20261013/nist-acvp.json), [SOURCE_MANIFEST.json](vectors/nist-acvp/SOURCE_MANIFEST.json).

Necessary obligations:

- NTT/polynomial arithmetic, sampling, compression and encoding refinement.
- Key input checks and implicit rejection.
- Encapsulation randomness and domain separation.
- Track normative errata and revision changes.

### ML-DSA-44/65/87

Scratch JavaScript implementation.

Sources: [crypto/mldsa.mjs](crypto/mldsa.mjs).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/204/final).

Evidence: [nist-acvp.json](reports/native-repair-20261013/nist-acvp.json), [SOURCE_MANIFEST.json](vectors/nist-acvp/SOURCE_MANIFEST.json).

Necessary obligations:

- NTT, hint/decomposition and rejection-sampling refinement.
- Pure/prehash/context/external-mu profiles remain explicit.
- Canonical signature encoding and bounds.
- Timing and randomness analysis.

### ChaCha20 / Poly1305 / AEAD

Scratch JavaScript implementation.

Sources: [crypto/chacha20-poly1305.mjs](crypto/chacha20-poly1305.mjs).

Normative basis: [rfc8439.html](https://www.rfc-editor.org/rfc/rfc8439.html).

Evidence: [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt).

Necessary obligations:

- Quarter-round and block-function refinement.
- Poly1305 clamp, arithmetic and reduction.
- AAD/ciphertext pad and length encoding.
- Key/nonce uniqueness and counter bounds.
- Authentication before plaintext release; timing analysis.

### AES-256 / GCM

Scratch JavaScript implementation.

Sources: [crypto/aes256-gcm.mjs](crypto/aes256-gcm.mjs).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/197/final), [final](https://csrc.nist.gov/pubs/sp/800/38/d/final).

Evidence: [t_native_profile.txt](reports/native-repair-20261013/t_native_profile.txt).

Necessary obligations:

- S-box, AES key schedule and 14-round refinement.
- GHASH field representation and length encoding.
- 96-bit nonce / 128-bit tag profile only.
- Nonce uniqueness, per-key bounds and authentication before release.
- Table/BigInt timing remains unproven.

### HKDF / encryption layers

Scratch JavaScript implementation.

Sources: [crypto/hkdf.mjs](crypto/hkdf.mjs), [crypto/hmac.mjs](crypto/hmac.mjs), [crypto/vault-stream.mjs](crypto/vault-stream.mjs), [src/browser-native.js](src/browser-native.js).

Normative basis: [rfc5869.html](https://www.rfc-editor.org/rfc/rfc5869.html).

Evidence: [t_vault_stream.txt](reports/native-repair-20261013/t_vault_stream.txt), [surface.txt](reports/native-repair-20261013/surface.txt).

Necessary obligations:

- Canonical header binds algorithm, recipient, KEM ciphertext, salt and nonce as AAD.
- Signed outer encrypted receipt binds ciphertext; key encapsulation alone does not authenticate sender.
- KDF output/limit and protocol domain separation.
- PB-VAULT-1 custom SHAKE record KDF is not standardized HKDF.
- Streaming finalization, truncation, order and record reuse.

### Canonical JSON / commitments / receipts

Scratch JavaScript implementation.

Sources: [src/canonical/canonical-json.mjs](src/canonical/canonical-json.mjs), [src/encoding/base64url.mjs](src/encoding/base64url.mjs).

Normative basis: [rfc8785.html](https://www.rfc-editor.org/rfc/rfc8785.html), [rfc6962.html](https://www.rfc-editor.org/rfc/rfc6962.html).

Evidence: [surface.txt](reports/native-repair-20261013/surface.txt), [html-audit.txt](reports/native-repair-20261013/html-audit.txt).

Necessary obligations:

- Hash UTF-8 bytes of canonical JSON; never hash a pretty-printed object interchangeably.
- Reject duplicates, lone surrogates, cycles, sparse arrays, undefined and non-finite numbers.
- Explicit ECMAScript numeric domain and UTF-16 property ordering.
- Bind profile and exclude only specified seal fields; Merkle domain separation.
- JavaScript serializer/parser refinement remains open.

### OpenTimestamps

Optional external verifier adapter; not a scratch Bitcoin verifier.

Sources: [agent/ots.mjs](agent/ots.mjs).

Normative basis: [opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client).

Evidence: [surface.txt](reports/native-repair-20261013/surface.txt).

Necessary obligations:

- Bind exact detached target bytes to .ots file.
- Calendar submission is not Bitcoin verification.
- Verify operation path, Bitcoin header Merkle root and chain evidence.
- Instrument success marker is an adapter contract; transcript text alone is not an anchor.
- RFC3161 response retention is unverified; CMS, imprint/nonce and certificate-chain verification are not implemented.
- No external timestamp was submitted or Bitcoin anchor established by this repair.

### File browser / custody

Browser permission and custody workflow.

Sources: [src/browser-native.js](src/browser-native.js).

Normative basis: [showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker).

Evidence: [browser-workflows.json](reports/native-repair-20261013/browser-workflows.json).

Necessary obligations:

- Bounded read-only folder permission and preserved relative paths.
- Original file bytes remain unchanged.
- Persistent key and receipt continuity across reloads.
- Captured bytes, source attribution, declaration and verification are separate states.

### Falcon / SLH-DSA compatibility

Bundled third-party compatibility providers; separate from native basis.

Sources: [proofbundle.html](proofbundle.html).

Normative basis: [final](https://csrc.nist.gov/pubs/fips/205/final).

Evidence: [html-audit.txt](reports/native-repair-20261013/html-audit.txt).

Necessary obligations:

- Bundled providers are not scratch implementations.
- Legacy algorithm names do not establish final-standard conformance.
- Full vector and implementation-refinement evidence required per exact profile.

The [machine-readable ledger](CRYPTOGRAPHIC_BASIS.json) binds these entries to source hashes. The [embedded source manifest](CRYPTO_SOURCE_MANIFEST.json) records the native modules. A final release receipt must bind the complete shipped HTML and the tests performed against that exact artifact.
