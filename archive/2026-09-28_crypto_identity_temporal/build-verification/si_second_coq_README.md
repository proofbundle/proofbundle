# Build verification — SI_SECOND temporal checker (Coq/Rocq)

Different toolchain, different source tree, different result from
everything else in this directory. Real, fresh compile with Coq 8.18.0
(installed via apt this session), not a relayed claim.

## Target

`identity-proofs/ca095126-Pbid_pbis_20260917_extracted/Pbid20260915/
SI_SECOND_CHECKER_2026_09_15.v` — an independent (non-Lean) Coq checker
for the "SI-second" witness condition: that a claimed time-standard
record genuinely describes the Cs-133 hyperfine transition definition
of the second (species, level pair, correction structure, the exact
period count 9192631770), parsed from a constrained JSON grammar with
no whitespace and sorted keys.

The file's own header states "Coq 8.18.0" and gives exact build
instructions. Followed them verbatim.

## What was actually done

1. `coqc -Q . SIC SI_SECOND_CHECKER_2026_09_15.v` — compiled clean, zero
   errors. The file ends with two `Print Assumptions` calls
   (`check`, the main verifier; `code_string_is_lock`, a supporting
   lemma). Both printed **"Closed under the global context"** — Coq's
   canonical statement of zero axiom dependency. Real output, this
   session, this toolchain.
2. Built `run_check.v` exactly per the header's instructions (embed
   `witness.json`'s literal bytes as a Coq string, doubling internal
   quotes, then `Eval vm_compute in check input.`), compiled it, and got
   `Some true` — the archive's own `witness.json` passes the check for
   real, under a freshly built, zero-axiom-confirmed verifier.
3. Compiled and ran all six adversarial/twin test cases already present
   in the archive (not written by me):
   - `run_malformed_extra_key.v` → `None` (unexpected key correctly
     causes parse failure)
   - `run_malformed_trailing_space.v` → `None` (trailing whitespace
     correctly causes parse failure — the grammar is genuinely strict)
   - `run_twin_empty_corrections.v` → `Some false` (empty corrections
     list correctly rejected)
   - `run_twin_other_species.v` → `Some false` (wrong species string
     correctly rejected)
   - `run_twin_same_level.v` → `Some false` (levelA == levelB correctly
     rejected — the transition must be between two distinct levels)
   - `run_twin_succ_periods.v` → `Some false` (period count off by one
     bit correctly rejected)
   - `run_witness.v` (the canonical witness re-run in this harder form)
     → `Some true`, matching step 2
   Every one of these seven files also states and proves
   `result = check input` and runs `Print Assumptions` on that equality
   lemma — all seven report **"Closed under the global context."** Zero
   axioms, across the whole adversarial suite, confirmed fresh.

This is a materially different outcome from every other build attempt
in this directory (SHA2 Lean, ECDSA-P256 Lean, both of which failed to
compile). Different source tree, different toolchain, and it holds up.

## Open discrepancy — reported, not resolved

`witness.pb.json` (the outer wrapper) declares, for its one payload
artifact (`witness.json`, `digest_alg: SHA-256`):
`merkle_root_b64u: "DHEe099YVlUS09P_m8hKQjim8vtN7JPohdzug0ukvWY"`.

Computed the actual SHA-256 of the `witness.json` file used in every
test above: `93eaba9a33faddba2ee2ecc45498dd6f5a496a2b6d67d43ae62121c1a0a1bd3d`
(via `sha256sum`, confirmed by a second, independent computation from
Python's `hashlib` — matched). Converted to base64url:
`k-q6mjP63bou4uzEVJjdb1pJaittZ9Q65iEhwaChvT0`. **This does not match**
the `merkle_root_b64u` value above.

Checked before treating this as suspicious: the file's byte count
(540) matches `witness.pb.json`'s own declared artifact `size` exactly,
so this is not a trailing-newline or truncation issue — the file used
here is the right size and the right content (it's the same
`witness.json` that produces `Some true` under the checker that also
produces `Some true` for the un-tampered canonical case, and the
adversarial variants derived from it behave correctly).

Two honest possibilities, not distinguished by anything available in
this session:
1. `merkle_root_b64u` in this ProofBundle schema is not a bare SHA-256
   of the raw artifact bytes — it may involve a domain-separation
   prefix, a chunk-index binding, or some other construction specific
   to `PB-CANON-JSON-1` / the ProofBundle spec that isn't documented
   anywhere in this archive.
2. Or there is a genuine provenance mismatch between the `witness.json`
   bytes in this extracted copy and whatever bytes the original
   `merkle_root_b64u` was computed from.

This is reported precisely rather than resolved either way, because
resolving it would require either a reference implementation of the
exact Merkle-leaf construction (not present in this archive) or an
assumption I have no basis for. Note: my own `session-identity/`
witness, built earlier this session, made the simplifying assumption
"single-artifact bundle: root == leaf SHA-256" — this finding means
that assumption is not confirmed to match whatever the real ProofBundle
spec's convention is. That assumption was already disclosed as a
simplification in that directory's README; this is the reason it
matters.

## What this establishes

- The SI_SECOND checker's core logic (`check`) and a supporting lemma
  are genuinely axiom-free under a real, independent recompile.
- The archive's canonical `witness.json` genuinely passes the check.
- The adversarial test suite genuinely does what it claims: reject
  malformed JSON, reject wrong species, reject non-distinct levels,
  reject wrong period counts, reject empty corrections — all six,
  correctly, under fresh compilation.

## What this does not establish

- That `merkle_root_b64u` in `witness.pb.json` is trustworthy as
  written, or that the outer Ed25519 seal on that file (a different
  keypair from this session's) is meaningful, given the unresolved
  hash discrepancy above.
- Anything about the Lean-side `SI_SECOND` files in the same directory
  (`2026-09-15_SI_SECOND_KERNEL.lean`, `2026-09-15_SI_SECOND_LEDGER.lean`,
  the `.c` implementation) — not tested in this session. Given the
  pattern already found in the SHA2/ECDSA Lean trees, their build status
  should not be assumed from this Coq result.
