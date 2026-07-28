# Verification semantics — slice 1

## What exists

`src/verdict/verdict.mjs` defines the full 45-code verdict enum from the
originating specification. `src/verdict/cause.mjs` defines `Result`, whose
constructor accepts exactly one verdict `code` — there is no way to
construct a `Result` carrying two terminal codes, which is what "exactly
one terminal verdict" means enforced by the type rather than only asserted
in prose. `Result#isVerified` / `#isFailure` are the only ways downstream
code should branch on outcome, and `warnings` never participates in that
computation (see the file's own comment for why).

No verifier function exists yet — `src/verifier/*` from the originating
specification is not implemented in this slice. What's here is the
*vocabulary* (verdicts, causes, the Result shape) a verifier would return,
built first and separately so it can be reused without redefinition once a
verifier is written.

## What is asserted about `digestBytes`/`digestBytesXOF` specifically,
## since they are the only "verification-adjacent" logic in this slice

- Given an unrecognized algorithm identifier, both throw
  `UnknownAlgorithmError` — never silently pick a default.
- Given `MD5` or `SHA-1`, both throw `ForbiddenAlgorithmError` — the
  identifier is recognized (it appears in the registry with a real
  `implementationClass: 'RECOGNIZE_AND_REJECT'` entry) but is never
  dispatched to any implementation, satisfying "recognized so a
  deterministic rejection can be issued" without "manufacturing
  cryptographic output" for a forbidden algorithm.
- Neither function ever returns a partial or best-effort result; every
  path is either a correct digest or a thrown, classified error.

## Not yet connected

Nothing in `src/verdict/` is yet wired to `digestBytes` — there is no
`digestBytesAsResult(algId, bytes) -> Result` in this slice returning
`Result.of('UNKNOWN_ALGORITHM', ...)` instead of throwing. The throw-based
API and the `Result`-based verdict vocabulary exist in parallel, not yet
unified. That unification is the natural next step once a real verifier
(`src/verifier/verifier.mjs`) is built to consume it.
