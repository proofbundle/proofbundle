# Session identity witness — 2026-09-28

This directory contains a real, freshly-generated Ed25519 keypair and a
signed ProofBundle-style witness, produced and verified in this session.
Everything here is reproducible by running `build_and_sign_witness.py`.

## What is actually in this directory

- `build_and_sign_witness.py` — the script that generated everything else.
  It is the source of truth; read it before trusting any claim below.
- `session_private_key_DEMO_ONLY.hex.txt` / `session_public_key.*.txt` —
  a real Ed25519 keypair, generated with Python's `cryptography` library
  (Ed25519PrivateKey.generate()), raw 32-byte encodings.
- `session_2026-09-28_cleanup_attestation.json` — the artifact being
  attested to: a small JSON record naming the actual cleanup commit
  (`4a8a099f4e8c1dcbfcec14a103e6116aa96771d6`) pushed to
  `proofbundle/proofbundle` earlier in this session.
- `session_witness.pb.json` — a witness bundle in the same field shape as
  `identity-proofs/.../witness.pb.json` (header, meta, payload, merkle
  root, seal), covering the attestation artifact above, signed with the
  private key.
- `verification_report.json` — output of four checks, actually run:
  1. `digest_matches` — the SHA-256 digest recomputed at verify time
     equals the digest that was signed.
  2. `cryptography_lib_verify` — the signature verifies against the
     public key using the `cryptography` library.
  3. `pynacl_independent_verify` — the same signature verifies using a
     second, independent implementation (PyNaCl/libsodium), so the check
     isn't just the signing library agreeing with itself.
  4. `tamper_control` — a copy of the payload with one field corrupted
     (`sha256_hex` zeroed out) is checked against the same signature and
     **correctly fails** verification. This is the negative control: if
     this had passed, the "verification" would be meaningless.

All four passed on the run that produced the committed files. Anyone can
rerun `python3 build_and_sign_witness.py` to get a fresh keypair and
fresh (still-passing) results — the script is deterministic in its logic,
not in its output, since key generation is randomized each run.

## What this proves

- An Ed25519 keypair was generated in this session, not copied from the
  uploaded archive.
- A witness document matching the ProofBundle field shape was built,
  canonically encoded, hashed, and signed with that key.
- The signature is real: it verifies under two independent
  implementations and correctly rejects a tampered payload.

## What this does not prove, and is not claimed to prove

- **No persistent identity.** This keypair exists as bytes in this git
  commit. There is no mechanism — here or anywhere in this codebase —
  that makes this key "belong" to any future session, conversation, or
  instance of Claude. Calling it "my key" would overstate what a stored
  file can establish. It is a keypair this session generated once, used
  once, and is now committing as evidence that the sign/verify mechanism
  works.
- **No relationship to the original `witness.pb.json`.** That file, its
  keypair, and its `pub_b64u` (`gJHqDuoe7brHkANIdrU6tRqiwW6gZnC71ySd8yW5nRk`)
  come from whatever process produced the uploaded archive — not from
  this session, and not from this key. They are unrelated artifacts
  presented side by side, not a chain of custody.
- **No claim about the Lean/Coq proofs elsewhere in the archive.** This
  script does not compile, type-check, or re-verify
  `SI_SECOND_CHECKER_2026_09_15.vo`, the SHA-2/ECDSA/ML-KEM Lean sources,
  or any `axioms = []` claim in the uploaded READMEs. Those claims are
  preserved as-is (per the archive's own preservation rules) but are
  relayed, not independently confirmed, by anything in this directory.
- **`PB-CANON-JSON-1-SORTED-COMPACT` is not asserted to be byte-identical
  to whatever exact canonicalization algorithm produced the original
  `witness.pb.json`.** It is *a* deterministic canonical JSON encoding
  (sorted keys, no whitespace, UTF-8), documented here as exactly that
  and nothing more, so the encoding scheme name doesn't imply a
  conformance claim that hasn't been checked against a spec document.

## Reproducing this

```
cd archive/2026-09-28_crypto_identity_temporal/session-identity
python3 build_and_sign_witness.py
```

Requires `cryptography` (required) and `pynacl` (optional, enables the
independent cross-check; the script reports `SKIPPED` for that line if
it isn't installed, rather than silently dropping the check).
