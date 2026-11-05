# Build verification — ECDSA-P256 (curated-artifacts-v0.3.0)

Second independent compile attempt, same session, different crypto
primitive. Cross-checked against the archive's own honest self-audit
before running anything, not instead of it.

## What the archive already says about this file

`40_VALIDATION/LEAN_SHARD_STATUS.txt`: a CI run (31877809574) compiling
this module was cancelled. Base compile succeeded; the theorem-shard
target never returned before cancellation; the axiom audit
(`#print axioms`) never ran (`axiom_audit_exit_code: None`). A follow-up
run (31882966824) was created to finish the job but **never started**
because GitHub refused runner allocation on the account's billing
status. So the archive's own record already says: this was never
actually confirmed zero-axiom. It says so honestly, in its own words,
before I touched anything.

`70_THEOREM_AUDIT/2026-08-15_theorem_proof_tactic_audit.tsv` (self-hash
verified: file's own recorded SHA-256 matches its actual computed
SHA-256): 128 theorem rows, zero use `sorry`. Several computational
witness theorems (`p_eq`, `a_eq`, SHA-256/HMAC known-answer tests) use
`native_decide` and are explicitly marked `NO: expected
Lean.ofReduceBool dependency` under the audit's own
`strict_zero_axiom_status` column — the archive is not claiming these
are axiom-free; it says plainly they aren't. The `rfl`/`exact`-tactic
theorems are marked `candidate; requires actual #print axioms` — again,
explicitly not yet confirmed, not overclaimed.

## What I attempted

Tried to finish what the cancelled CI run didn't: get `ECDSAP256.lean`
to actually compile so `#print axioms` could run for real.

- Source: `curated-artifacts-v0.3.0/10_SOURCE_INPUTS/ECDSAP256.lean`
  (sha256 `897cc0bf...`), confirmed identical to the source copy paired
  with the precompiled `ECDSAP256.olean` (sha256 `c606657b...`) used to
  produce the shard-status record above — same content across 10 copies
  of this file scattered through the archive, so this is the canonical
  version, not a stray variant.
- The `.olean`'s embedded Lean version header: `4.29.1` (same version as
  the SHA2 evidence checked earlier).
- Compiled directly (`lean ECDSAP256.lean`) under
  `leanprover/lean4:v4.29.1`, the exact version the evidence claims.

## Result

11 errors, all the same class:
`Invalid field 'get!': The environment does not contain 'Array.get!'`
— on `H0.get!`, `block.get!`, `w.get!`, `K.get!` at lines 376, 411, 412,
415, 416, 417, 477. Full log:
`ecdsa_p256_compile_log_v4.29.1_olean-embedded-version.txt`.

Checked precisely rather than just asserting absence: `get!` is not
gone from Lean 4.29.1 — it exists as part of the generic `GetElem!`
typeclass (`Init/GetElem.lean`), reachable via `arr[i]!` notation. What
no longer exists is the direct dot-notation form `Array.get!` this
source calls. This is a real, documented Lean 4 core API migration
(direct `Array.get`/`get!`/`get?` methods retired in favor of the
generic `GetElem`/`GetElem!`/`GetElem?` typeclass), not an artifact of
how this was tested.

## Why this matters beyond this one file

This is the second crypto module tested this session (after
SHA2 `Vec.lean`) that fails to compile under the exact toolchain
version embedded in its own archived `.olean` evidence, and fails for
the same *class* of reason both times: the source uses an Array API
surface (`get`, `get!`, `mkArray`, `size_mkArray`, `size_append`,
`append_get_left`, `append_get_right`) that does not exist in the
public Lean 4 release matching the version string embedded in the
archive's own compiled evidence. Two independent modules, same pattern,
is enough to say this is systemic to how this archive's toolchain
versioning was recorded, not a one-off typo in a single file.

## What this does not establish

That the ECDSA-P256 formalization is mathematically wrong. Every error
here is a syntax/API-surface mismatch at the elaboration stage; the
proof never reaches a point where its logical content is checked. The
underlying math claims are neither confirmed nor refuted by this.

## What this does establish, on top of the SHA2 finding

The archive's `40_VALIDATION/LEAN_SHARD_STATUS.txt` was right to flag
this as unverified rather than claiming success — its honesty is
corroborated, not contradicted, by this result. What's now added: even
compiling this module from scratch today, in a clean environment,
against the toolchain version the archive itself points to, does not
succeed. Whatever environment last compiled these `.olean` files
successfully is not reproducible from the toolchain-identifying
information present in this archive.
