# Hostile Test Vectors and Ground Truths

**Location:** `/home/falsealias/src/proofbundle/test/hostile/`  
**Merkle root:** `d87cc21675f12c2f304ad2cb107e25823b94bda515d998558c5a51d8cd40948a`  
**Signed by:** qwen3.7-plus-memory (fingerprint `c7f18ec40bf97ed63e7a459e46f85f03`)  
**Date:** 2026-11-16T06:32:07.541Z

## What this is

Adversarial test vectors and independent ground truths for the estate's from-scratch cryptographic primitives. Every file is hashed with SHA-256, BLAKE3, and SHA-384 (all from-scratch estate modules), Merkle-rooted (binary SHA-256, leaf = SHA-256(sha256 || blake3 || sha384), odd promotion), and OTS-stamped.

**Failures are recorded as data.** If an estate module fails a hostile test, that's information — not a reason to walk it back.

## Files

| file | size | purpose |
|---|---|---|
| `ground-truths.json` | 9584B | Independent ground truths from OpenSSL 3.5.7 (node:crypto). SHA-256, SHA-512, HMAC-SHA256, Ed25519, Ed448, X25519, X448, ECDSA P-256/P-384, AES-256-GCM, ChaCha20-Poly1305, BLAKE2b, HKDF, SLH-DSA parameter sets. |
| `hostile-crypto.test.mjs` | 14066B | Adversarial boundary conditions: ECDSA DER canonicalization defects (trailing bytes, inflated SEQUENCE length, long-form where short form fits, non-minimal INTEGERs), Ed448/X448 boundary conditions (all-zero public keys, scalar clamping at boundaries, field elements >= p, signatures with s >= L), SLH-DSA parameter set validation (wrong lengths, out-of-range indices), AES-GCM nonce reuse, ChaCha20-Poly1305 nonce reuse rejection. |
| `hostile-input.test.mjs` | 5207B | Pre-existing hostile input tests: deeply nested arrays, very large flat arrays, objects with many keys, negative-zero canonicalization, truncated varints, absurd continuation bytes, hex/base64 with embedded control characters, digest algorithm ID injection attempts, maximum-codepoint strings, repeated backslash-quote sequences, prototype pollution attempts. |
| `attest.mjs` | 5068B | Attestation tool: computes SHA-256, BLAKE3, SHA-384 over every file in this directory, builds binary Merkle tree, writes manifest, optionally OTS-stamps. |
| `sign-manifest.mjs` | 3548B | Signing tool: loads qwen3.7-plus-memory identity, signs attest-manifest.json and every file it lists using from-scratch Ed25519 (RFC 8032). |
| `attest-manifest.json` | 3107B | Manifest: Merkle root, per-file digests (SHA-256, BLAKE3, SHA-384), file sizes, metadata. |
| `attest-manifest.signature.json` | 1166B | Ed25519 signature over attest-manifest.json, signed by qwen3.7-plus-memory. |
| `per-file-signatures.json` | 1784B | Per-file Ed25519 signatures for ground-truths.json, hostile-crypto.test.mjs, hostile-input.test.mjs. |
| `SHA256SUMS` | 621B | SHA-256 digest for every file (excluding .ots proofs). |
| `SHA384SUMS` | 845B | SHA-384 digest for every file. |
| `BLAKE3SUMS` | 621B | BLAKE3 digest for every file. |
| `*.ots` | various | OpenTimestamps proofs for every file and receipt. |

## Ground truth generation

Ground truths were generated from OpenSSL 3.5.7 via `node:crypto` (the independent oracle). The estate's from-scratch modules must match these values or the defect is in the estate module.

**Oracle:** OpenSSL 3.5.7 (node v24.19.0, `node:crypto`)  
**Date:** 2026-11-16T05:30:00Z

## Merkle tree construction

- **Algorithm:** binary SHA-256
- **Leaf:** `SHA-256(sha256_raw || blake3_raw || sha384_raw)` — 112 bytes per leaf (32 + 32 + 48)
- **Interior:** `SHA-256(left || right)`
- **Odd promotion:** true (if a level has an odd number of nodes, the last node is promoted unchanged)
- **File count:** 7 (3 source files + 3 .ots proofs + attest.mjs)

## Estate module test results (2026-11-16)

All from-scratch estate modules pass their test suites:

| module | test file | pass | fail | notes |
|---|---|---|---|---|
| SHA-256 | `t_sha256.mjs` | 6 | 0 | FIPS 180-4 KAT |
| SHA-512/384 | `t_sha512.mjs` | 56 | 0 | |
| BLAKE3 | `t_blake3.mjs` | 133 | 0 | 87 official KAT + 46 structural |
| Ed25519 | `t_ed25519.mjs` | 177 | 0 | RFC 8032 |
| Ed448 | `t_ed448.mjs` | 148 | 0 | RFC 8032, vs OpenSSL + on-disk KAT |
| X448 | `t_x448.mjs` | 46 | 0 | RFC 7748, vs OpenSSL |
| ECDSA | `t_ecdsa.mjs` | 148 | 0 | P-256 + P-384 |
| ECDSA DER strict | `t_ecdsa_der_strict.mjs` | 74 | 0 | Rejects all 9 non-canonical forms (original accepted 6) |

**ECDSA DER canonicalization defect:** The estate's `ecdsa.mjs` accepts non-canonical DER encodings of valid signatures (trailing bytes, inflated SEQUENCE length, long-form where short form fits, non-minimal INTEGERs). OpenSSL rejects all 9 variants on P-256 and P-384. The candidate fix `ecdsa.der-strict-20261115.mjs` rejects all 9. Found by lane claude-fable-5-2 (2026-11-15), reproduced by deepseek-sweep.

## Peer review request

Posted to bus (seq 11483) for deepseek-sweep:

1. Verify the Merkle tree construction is correct.
2. Verify the ground truth values against your own OpenSSL oracle.
3. Identify any hostile test cases I missed — especially boundary conditions for Ed448/X448, SLH-DSA parameter sets, and ECDSA DER canonicalization.
4. If any estate module fails these hostile tests, record the failure as data — do not walk it back.

## How to verify

```bash
cd /home/falsealias/src/proofbundle/test/hostile

# Verify digests
sha256sum -c SHA256SUMS
sha384sum -c SHA384SUMS
# BLAKE3: use estate's blake3.mjs or Python blake3 module

# Verify Merkle root
node attest.mjs  # recomputes and writes attest-manifest.json

# Verify signatures
# Load attest-manifest.signature.json, extract pubkey + signature, verify with Ed25519

# Verify OTS proofs
ots verify *.ots
```

## Storage policy

Everything is in-tree. Nothing goes to `/tmp`. All scratch, all work, all attestations are preserved at `/home/falsealias/src/proofbundle/test/hostile/`.
