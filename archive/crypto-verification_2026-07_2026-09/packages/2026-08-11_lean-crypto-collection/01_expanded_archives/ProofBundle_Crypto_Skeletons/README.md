# ProofBundle Crypto Suite (in progress)

Lean 4 formalizations of selected cryptographic primitives, intended for use inside ProofBundle attestation and packaging layers.

**Current status is incomplete.** Many modules are pure structural skeletons. Claims of “zero sorries / zero axioms / complete implementation” are not yet accurate.

## What actually exists in this workspace (as of the latest generation)

### Parameterized / structural
- ML-KEM parameter constants and thin instantiations for 512 / 768 / 1024 (FIPS 203 sizes match; core algorithms still need a generic parameterized implementation)
- Ed25519 field arithmetic, point addition, pure scalar multiplication skeleton (RFC 8032) — missing modular square root and SHA-512
- HMAC-SHA256 + HKDF-SHA256 pure skeletons (RFC 2104 / 5869) — parameterized over a hash function
- AES-GCM high-level shape (SP 800-38D) — missing carry-less multiply, full GHASH, AES
- SHA-512 constants + skeleton (FIPS 180-4) — compression function and padding still `sorry`
- RSA-OAEP encode/decode + MGF1 pure skeleton (RFC 8017) — requires external hash + secure seed

### Not yet present (despite being listed in some generated READMEs)
- Full ML-KEM KeyGen / Encaps / Decaps
- SHA-256, SHA-3, SHAKE
- AES-256 key expansion and rounds
- ChaCha20 / ChaCha20-Poly1305 / Poly1305
- ECDSA P-256, X25519
- Any complete KAT suites that execute and pass
- lakefile, unified ProofBundle.lean, or working `lake build`

## Design principles (target, not yet achieved)

1. Prefer pure total functions
2. Avoid `sorry` / `admit` / axioms where possible
3. Parameterize hash functions and KEMs via structures
4. Keep size theorems and parameter constants machine-checkable against the standards

## Recommended next steps (highest leverage)

1. Finish a generic `ParameterSet` + real ML-KEM core that the 512/768/1024 wrappers actually call
2. Decide which hash (SHA-256 or SHA-512) will be the first fully expanded pure implementation, because almost everything else depends on it
3. Only then expand the surface (Ed25519 completion, AES-GCM, etc.)
4. Package the results as ProofBundles with Merkle / signature binding

## File layout (current artifacts)

```
artifacts/
├── ed25519/Ed25519.lean
├── hmac/HMAC.lean
├── hmac/HKDF.lean
├── aes_gcm/AES_GCM.lean
├── sha512/SHA512.lean
├── rsa/RSA_OAEP.lean
└── README.md          ← this file
```

This README is intentionally conservative. It will be updated only when the corresponding claims become true under `lake build` / `#print axioms`.
