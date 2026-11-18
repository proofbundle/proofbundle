# corpus-v1 — ProofBundle spec 1.0.0 conformance vectors (May 2026)

`vectors_v1.json` — 300 vectors, sha256 `11aef10b061ee9c1cdf417f6dd7117b5ab83492b7ffe814f8cbe5d5699f5cfb3`.
Source: `conformance/vectors_v1.json` of the May 13 2026 TypeScript repository (September copy `proofbundle-original-ts-20260901`).

All signatures are real (independently verified with Python `cryptography`): Ed25519; ECDSA P-256/384/521
(raw point keys, raw r‖s signatures, hash paired with curve); RSA-PSS 2048/3072/4096 (SPKI DER keys, MGF1
hash and salt paired with modulus: SHA-256/32, SHA-384/48, SHA-512/64). Digests: SHA-256/384/512, BLAKE2b-512,
BLAKE3-256. Digest preimage: canonical JSON of the bundle without `seal`; the signature is over the digest.

Vector shape: `{id, category, description, input:{bundle, public_key_b64u, context, parent_bundles,
max_bundle_bytes?, profile}, expected_outcome}`. 13 classes: verified, out-of-bounds, invalid-signature,
malformed, unknown-version, not-defined-in-this-version, missing-side-info, indeterminate, lineage-invalid,
resource-exhausted, policy-denied (temporal-boundary and lineage-valid vectors resolve to verified/out-of-bounds).

Run:  `node scripts/run-corpus-v1.mjs`  (app engine)   ·   `python3 scripts/ref_v1_0_0.py vectors/corpus-v1/vectors_v1.json out.tsv`  (independent reference)
Or paste the file into the app's Vectors → Import box (accepts this shape since 2026-10-30).

Results 2026-10-30: proofbundle.corpus-v1 build 300/300; ref_v1_0_0.py 300/300; the two agree on all 300
and on 477 mutants. Unpatched build ddf4699e… scores 32/300 (it cannot read a 1.0.0 envelope).
