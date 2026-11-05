# Prior coverage/axiom sweep — 2026-08-19 (found on primary source drive, not produced by me)

These files were not generated this session. They were found on
`raid2tb/Crypto_Accumulation_Algorithms/lean_axiom_sweep_20260819T183116Z/`
and `.../algo_coverage_20260819T185213Z/`, timestamped a month before this
session, produced by the user's own prior tooling. Copied here as
corroborating evidence, not as something I ran.

## Why this matters to this session's findings

`lean-crypto-sha2.build.log` (dated 2026-08-19, toolchain
`leanprover/lean4:v4.8.0` — the same version I tested) shows the SHA-2
Lean project **already failing to build a month ago**, under the same
toolchain, with the same class of error I found fresh today
(`unknown constant 'ByteArray.size_append'`, rewrite pattern misses,
type mismatches). `sweep.log` records the same run's result plainly:
`lean-crypto-sha2 build exit=1`, `RESULT: 0 clean / 0 depend-on-axioms`
— nothing could even be checked because the build itself failed. This
independently corroborates `sha2_zero_axiom_build_log_v4.8.0_pinned-toolchain.txt`
in this same directory, produced by a fresh recompile this session.

One real discrepancy worth flagging: this 2026-08-19 build got further
than my fresh one before failing — it succeeded on `Crypto.Vec` and
`Crypto.Util` (marked ✔ in the log) and only failed later, on
`Crypto.SHA512.Core` and `Crypto.SHA256.Hash`. My fresh recompile
(this session) failed immediately on `Crypto.Vec` itself. Both are real
results, from real compiles, against the same toolchain version — the
difference means there is more than one variant of `Vec.lean` on this
drive, and the specific copy bundled in the "extracted archive" I
tested is not the same file (or not in the same state) as whatever
`Vec.lean` this 2026-08-19 sweep compiled successfully. This wasn't
resolved further this session (see "Open, not chased further" below).

`coverage.tsv` / `coverage.log`: a per-primitive verdict table across
22 named algorithms, with a blunt, non-euphemistic verdict column
(`PROOF_FAILS_STANDARD`, `PROOF_ONLY_NO_IMPL`, `IMPL_ONLY_NO_PROOF`,
`BOTH_CLEAN`, `ABSENT`). Directly corroborates two things checked fresh
this session:

- `sha256: ... sorry=46 native_decide=133 -> PROOF_FAILS_STANDARD`
  (across 166 Lean files) — consistent with the SHA2 build failure
  found fresh in this session.
- `ecdsa: ... sorry=59 native_decide=59 -> PROOF_ONLY_NO_IMPL`,
  `p256: ... sorry=59 native_decide=59 -> PROOF_ONLY_NO_IMPL` — every
  one of 59 Lean files apparently carries both a sorry and a
  native_decide marker. Consistent with the ECDSA-P256 build failure
  found fresh in this session, and with the "candidate, requires actual
  #print axioms" / "NO: expected Lean.ofReduceBool dependency"
  self-audit already documented in `ecdsa_p256_README.md`.

Three verdicts flagged `BOTH_CLEAN` (no sorry/native_decide markers in
source) that were **not** tested fresh this session: `sha512` (lean=3
files), `ed25519` (lean=6 files), `mlkem` (lean=3 files). Flagging this
precisely: `BOTH_CLEAN` means the source text contains no `sorry` or
`native_decide` token — it is not the same claim as "compiles" (this
session found files elsewhere in this archive with zero literal `sorry`
text that the compiler still flagged as using `sorry` via
error-recovery — see `README.md`'s SHA2 finding) and not the same claim
as "matches the external standard" (this session's `FORENSIC_RESULTS.json`
finding shows an ML-KEM implementation that is internally consistent,
free of both markers, and still not FIPS-203 compatible). These three
are open leads for a future pass, not confirmed results.

`lean-crypto.build.log` (the broader, non-crypto-specific Lean library —
likely the operator-registry/philosophical proof corpus mentioned
elsewhere in this archive, not the crypto primitives) built clean under
v4.29.1 with an honest axiom audit result of "6 clean / 2
depend-on-axioms" — not chased further this session; out of scope for
the crypto-specific verification this directory otherwise covers.

## Open, not chased further

Where the actual live/current Lean project directories for
`sha512`, `ed25519`, and `mlkem` (Lean) live on the drive, and whether
they build clean under a fresh compile the way `SI_SECOND_CHECKER`
did — not resolved this session. `crypto_core_active` and
`crypto_core_archive/crypto_core_from_scratch_20260727` were checked
and contain the JS crypto-core layer (already verified separately, see
`js_crypto_core_README.md`) and per-agent worklogs, not the Lean/Rocq
project trees this coverage sweep refers to. A further pass would need
to actually locate those directories rather than assume their state
from this sweep's verdict column.
