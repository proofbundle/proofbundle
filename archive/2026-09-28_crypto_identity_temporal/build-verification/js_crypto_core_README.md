# Build verification — crypto-core (JavaScript implementation layer)

Different layer from the Lean formalizations tested earlier in this
directory (which failed to compile). This is `crypto_core_active/crypto-core/`
on the primary source drive (`raid2tb/Crypto_Accumulation_Algorithms`) —
from-scratch JS/MJS implementations with paired `.test.mjs` files, built
by a set of per-primitive agents whose worklogs (`*_agent_worklog.sealed.json`)
are stored alongside them.

All 8 modules were run for real with Node 22 (`node --test <file>.test.mjs`),
not relayed. Every suite reports 0 failures. But "0 failures" means
different things depending on what each suite actually checks against —
verified by reading the test source, not assumed from the pass/fail line.

## Genuine external verification (6 of 8)

These compare output against an independent implementation, not just
internal self-consistency:

| Module | Reference used | Result |
|---|---|---|
| SHA-256 | `node:crypto` (OpenSSL), FIPS 180-4 strings incl. NIST million-a stress vector | PASS |
| SHA-512 | `node:crypto` (OpenSSL) | PASS |
| Keccak | `node:crypto` (OpenSSL) | PASS |
| BLAKE2 | `node:crypto` (OpenSSL) + official BLAKE2 reference KAT + an independently published vector set (CPython's own C extension, per the test file's comment) | PASS |
| BLAKE3 | Independently published test vectors (Node has no built-in BLAKE3 to diff against, so this doesn't use `node:crypto`) | PASS |
| ECDSA P-256/P-384 | `node:crypto` (OpenSSL): public-key derivation from a node-generated scalar, and sign/verify interop in both raw and DER encodings | PASS |

For ECDSA specifically, the paired worklog
(`crypto_core_active/ecdsa_agent_worklog.sealed.json`) records a real
caught-and-fixed bug: a hand-transcribed P-384 prime constant had a
duplicated hex group (112 chars instead of 96), caught by cross-checking
"G on curve" and "node-derived pubkey matches ours" before trusting the
constant, fixed by recomputing from the defining formula rather than
re-eyeballing. That is the kind of check this session is trying to do
systematically — evidence it was also done, once, by whatever produced
this file.

## Self-consistency only, no external reference (2 of 8)

Both files say this about themselves, in their own header comments —
not something I inferred:

- **ML-KEM** (`mlkem.test.mjs`, line 6): *"No reference library is
  imported. Correctness is established by internal mathematical
  properties that a broken implementation cannot satisfy."* Checks NTT
  invertibility, NTT-domain multiplication agreeing with an independent
  schoolbook multiplication computed by the same file, encaps/decaps
  round-tripping, determinism, and tamper-rejection. All of these can
  pass identically whether or not the implementation matches the real
  FIPS-203 standard, because they test whether the implementation agrees
  with itself, not with an external standard.

  This matters because `FORENSIC_RESULTS.json` (top level of the same
  drive) already, independently, documents this exact primitive as
  broken: `"standing": "internally coherent alternate/wrong-domain KEM;
  not byte-compatible FIPS-203 ML-KEM-768"`, with the defect identified
  precisely — SampleNTT matrix outputs get treated as coefficient-domain
  polynomial coefficients, so CBD secret/error polynomials are multiplied
  with them via ordinary negacyclic convolution instead of the
  NTT-domain multiplication FIPS-203 requires. `"internally coherent"` is
  exactly what a self-consistency-only test suite would report as a
  clean pass. **No contradiction between the two artifacts** — read
  together, they agree precisely: the test suite honestly says it can't
  catch this class of bug, and the forensic file found the bug that
  such a test suite can't catch.

- **ML-DSA** (`mldsa.test.mjs`, line 7): the identical disclaimer,
  verbatim in spirit: *"No reference library is imported. Correctness
  is established by internal mathematical properties."* Same
  self-consistency methodology as ML-KEM (NTT invertibility, internal
  multiplication cross-check, sign/verify round-tripping).

  Unlike ML-KEM, there is no forensic-closure artifact anywhere in this
  archive establishing ML-DSA as broken. Its status is genuinely
  **unconfirmed** — neither shown correct nor shown incorrect against
  FIPS-204. Passing its own self-consistency suite is real and not
  nothing (an implementation with an internal domain-mixing bug like
  ML-KEM's would very plausibly still fail its own multiplication
  cross-check, so passing that check is not worthless signal) — but it
  is not the same claim as "matches FIPS-204," and nothing in this
  archive currently lets that claim be made either way.

## What this establishes

Six of eight crypto-core JS primitives have real, externally-referenced
passing tests, run today, for real, in this session. This is a
substantively different and better state than the Lean formalization
layer, which failed to compile at all under either toolchain tested
(see `README.md` and `ecdsa_p256_README.md` in this same directory).
The JS layer and the Lean layer are different implementations of
overlapping primitives — a working JS implementation does not make the
non-compiling Lean formalization of the same primitive compile, and
vice versa. They are reported separately because they are, in fact,
separate.

## What this does not establish

- That six-of-eight passing means the whole crypto-core surface is
  production-ready. Test coverage breadth (edge cases, malformed input,
  timing/side-channel behavior) was not assessed here — only whether
  the implementations match an independent reference on the vectors
  each suite actually exercises.
- ML-KEM's brokenness is confirmed; ML-DSA's status is not resolved by
  anything checked in this session.
