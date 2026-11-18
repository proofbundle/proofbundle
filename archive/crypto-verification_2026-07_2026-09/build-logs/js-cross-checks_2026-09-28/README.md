# Drive-side crypto accumulation snapshot (uploaded 2026-09-29)

Scope: the uploaded folder `Crypto_Accumulation_Algorithms/` (32 files; SHA-256 of every file in `results/upload_sha256.txt`). It is a snapshot; results below describe only these bytes, run 2026-09-29 with Node v22.22.2, OpenSSL 3.0.13 via `node:crypto`, `kyber-py` 1.2.0, `dilithium-py` 1.4.0 (pure-Python FIPS 203/204 implementations, used as independent oracles).

## Independent cross-checks (scripts in `scripts/`)
| Check | Result |
|---|---|
| Bundled `*.test.mjs` (blake2, blake3, ecdsa, keccak, mldsa, mlkem, sha256, sha512) | all 0 fail (55, 133, 148, 102, 51, 35, 5, 36 pass) |
| ML-KEM-512/768/1024 keygen/encaps/decaps, fixed seeds, vs `kyber-py` internal API | ek, dk, ciphertext, shared secret byte-identical; decaps = encaps secret |
| ML-DSA-44/65/87 keygen (pk, sk byte-identical) and JS signature verified by `dilithium-py` | all True |
| SHA-256/384/512, SHA3-256/512, SHAKE128/256, BLAKE2b/2s, message lengths 0-300, random bytes, vs `node:crypto` | 2769 comparisons incl. Ed25519, 0 mismatches |
| Ed25519 pk/signature/verify, 20 random keys vs `node:crypto` | 0 mismatches |
| ECDSA P-256/P-384: pubkey derivation, JS-signed verified by OpenSSL, OpenSSL-signed verified by JS, tampered message and tampered signature rejected (40 keys each) | 80/80 accept, 0 wrong accepts |

Not covered: constant-time behaviour, side channels, non-empty ML-DSA contexts/hedged signing, BLAKE3 (only the bundle's own upstream-KAT test ran).

## What the accompanying evidence files say (read, not re-run)
- `FORENSIC_RESULTS.json` (schema proofbundle-mlkem768-forensic-closure/1.0): an earlier ML-KEM-768 was a wrong-domain KEM, not FIPS-203 compatible (0/6 supplied public keys matched OpenSSL). The `mlkem.mjs` in `crypto_core_active/` is a different file and passes the check above; the two must not be conflated.
- `LEAN_SHARD_STATUS.txt`: an `ecdsa-sanity` shard run was cancelled; base compile ok, theorem target and axiom audit did not run; the successor run never started (runner refused on billing status). No ECDSA Lean theorem result exists in this snapshot.
- `lean4291_base_axiom_audit.txt` (byte-identical to the copy already archived): `ECDSAP256.p_eq` and `a_eq` depend on `native_decide` axioms (compiler-trusting), `round_uses_temps` on `propext`, `Quot.sound`.
- `coverage.tsv` (2026-08-19): sha256 Lean = PROOF_FAILS_STANDARD (46 `sorry`, 133 `native_decide`); ecdsa/p256 Lean files carry 59 `sorry` each; `lean-crypto-sha2` (v4.8.0) build exit=1 with type errors. Stale against this upload: it lists blake2, blake3, ecdsa impl as absent/0 while `crypto_core_active/` now contains them.
- `print_assumptions_rocq_full.txt`: 0 bytes. It contains no evidence.
- `ecdsa_agent_worklog.sealed.json` / `ecdsa_agent_identity.json`: seal not verified here (no verification procedure supplied); the identity file is an Ed25519 keypair including the private part.

## Consequence for admissibility
The JS implementations of the ML-KEM, ML-DSA, SHA-2/3, BLAKE2, Ed25519 and ECDSA (P-256/P-384) paths agree with independent implementations on these inputs. No machine-checked proof of any of them exists in this snapshot; the Lean crypto proofs listed above are failing, sorry-bearing, or native_decide-dependent.
