# Implementation status — slice 1 of the full cryptographic/evidentiary spec

**This is an honest first installment, not the completed specification.** The
full spec (`ALGORITHM_REGISTRY.json` lists 95 algorithm/profile entries; the
originating request additionally specifies ~150 source modules, a parallel
Lean 4 formal-verification tree, and hardware/HSM providers) is not
achievable in one pass. Nothing in this repository claims otherwise.

**Correction, made after this file's first version asserted something that
was never tested:** an earlier revision stated OpenTimestamps and RFC 3161
timestamping were blocked for the same reason as TPM/Secure-Enclave/cloud-KMS
hardware access — "requires... credentials this session does not have."
That was false and unverified. This environment has real outbound network
access via a configured proxy. Asked directly why timestamping was marked
unreachable, the claim was tested live rather than defended: a real digest
was submitted to `https://alice.btc.calendar.opentimestamps.org`, a real
172-byte proof came back, and it now parses byte-exact against the actual
python-opentimestamps reference implementation's wire format (fetched from
GitHub for ground truth, not reconstructed from memory). See
`src/timestamp/opentimestamps.mjs` and
`test/integration/opentimestamps.integration.test.mjs`, which hits the live
calendar. This is now a real, tested, working part of the COMPLETE set
below, not a blocked row.

## What is genuinely COMPLETE (11 of 95 registry entries, plus timestamping)

Real module, real vectors, real passing tests, all captured under `reports/`:

    SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256   (NODE_NATIVE)
    SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256                (PURE_MJS,
                                                                      re-exports
                                                                      crypto/keccak.mjs,
                                                                      already verified
                                                                      88/88 earlier
                                                                      this session)

Plus the foundational layer these depend on and that the rest of the spec
will need: immutable byte helpers, constant-time comparison, varints, strict
UTF-8, strict hex/base64/base64url, a from-scratch canonical-JSON
parser+serializer with duplicate-key rejection, the full verdict enum with a
structurally-enforced single-terminal-code Result type, an algorithm
registry with a real validator, a coverage-matrix generator, and two CLI
commands (`hash`, `canonicalize`) wired end-to-end.

**`src/timestamp/opentimestamps.mjs` — real, network-tested, not counted in
the 95-row algorithm registry** (timestamping isn't a cryptographic
algorithm, so it has no natural row in that schema; it's documented here
instead). Submits a SHA-256 digest to a live OpenTimestamps calendar over
HTTPS and parses the response — a real recursive tree of append/prepend/hash
operations terminating in a `PendingAttestation`, matching the exact wire
grammar of the reference implementation. Submits to two calendars in
parallel and accepts either succeeding, because a single calendar was
observed, live, to return an intermittent `HTTP 503` (the calendar's own
edge proxy failing an upstream TLS handshake to its origin — real
third-party infrastructure flakiness, not a bug here, and exactly the
failure mode calendar redundancy exists to cover).

**Honest scope limit on this:** submission and parsing are real and tested.
*Upgrading* a pending timestamp to a full Bitcoin attestation — polling the
calendar again after it has had time (up to ~24h) to get the commitment
into a mined block, then verifying a real Bitcoin block header — is not
implemented. `BitcoinBlockHeaderAttestation` bytes are recognized and
decoded structurally (`parseTimestampResponse` reports the tag and height)
but never verified against actual Bitcoin blockchain data. That is real,
separately-scoped, buildable work, not attempted in this pass.

**RECOGNIZE_ONLY (2):** MD5, SHA-1 — recognized, deterministically rejected,
never dispatched to any implementation.

## What is NOT_IMPLEMENTED (65) and BLOCKED (17), and why

Every one of the other 82 rows in `CRYPTOGRAPHIC_SURFACE.csv` carries an
honest reason in its registry entry's `interoperabilityNotes` field. They
fall into three categories, not one generic "not done":

1. **Provider-unavailable in this environment — hardware or credentials
   genuinely absent, actually checked, not assumed.** TPM 2.0, Secure
   Enclave, PKCS#11, Android Keystore, Windows CNG, cloud KMS: these need
   physical hardware or provisioned account credentials this sandbox does
   not have, which no amount of coding time changes. Bitcoin block-header
   verification (the *upgrade* half of OpenTimestamps, not the submission
   half — see above) needs either a full node or a trusted block-explorer
   API this session has not been given a credential for. The spec's own
   `PROVIDER_UNAVAILABLE` verdict exists for exactly this case.

   **OpenTimestamps calendar submission and RFC 3161 TSA requests do NOT
   belong in this category and should never have been placed in it.**
   Neither needs hardware or credentials — both need only network
   reachability, which this environment has. OpenTimestamps is now
   implemented (above). RFC 3161 remains unimplemented, but for the
   category-2 reason below, not this one: it needs a correctly-constructed
   ASN.1 DER `TimeStampReq`, which is real encoding work, not a blocked
   provider.

2. **Real, buildable, not yet attempted.** HMAC-*, HKDF, PBKDF2, Ed25519,
   ECDSA, RSA-PSS, X25519, AES-*-GCM, ChaCha20-Poly1305 are all available
   `NODE_NATIVE` in principle — Node's own crypto module supports every one
   of them. These are the natural next slice and are flagged as such in
   their registry notes, not conflated with the provider-blocked rows.

3. **Already exists elsewhere in this repository, not yet re-registered
   here.** ML-KEM (`crypto/mlkem.mjs`, 40+45 tests), the confidential-envelope
   construction (`crypto/confidential.mjs`, 96 tests), and the post-quantum
   signature schemes ML-DSA/SLH-DSA/Falcon (bundled in `proofbundle.html` via
   noble) are real and tested — just not yet wired through *this* new
   registry/dispatcher layer. Marking them `NOT_IMPLEMENTED` here means "not
   registered in src/", not "does not exist."

## Why Lean 4 was not compiled

`lake` and `lean` are not installed in this environment (`reports/lean-build-report.txt`
records the exact check). No Lean source in `lean/` has been compiled, so
**zero theorems from this slice are counted as compiled or substantive** —
see `THEOREM_INDEX.json`, which is empty by design rather than populated
with claims the toolchain never checked. What exists in `lean/` is real,
syntactically-intended Lean 4 source for the most foundational types
(bytes, the admitted semantic-value domain) written to the same discipline
the spec's theorem-acceptance rules demand, explicitly labeled as unverified
pending a toolchain this session does not have.

This mirrors, deliberately, the exact caution `docs/CORPUS-STATE.md`
already applies to the pre-existing mc108 Coq corpus in this repository:
Coq is equally absent here, and every claim about that corpus is already
labeled `[relayed]` rather than `[verified here]` for that reason. The same
standard applies to this new Lean tree.

## Closure rule: not passed, and this file says so on purpose

Per the originating specification's own closure rule, the project is
complete only when every registry entry validates, every implemented
algorithm has vectors, every substantive theorem compiles, and no row is
silently blocked. `node scripts/check-registry.mjs` and
`node scripts/check-coverage.mjs` both pass **for the 11 rows claimed
COMPLETE** — that check is real and enforced (see `scripts/check-coverage.mjs`,
which fails the build if any `COMPLETE` row lacks a module path or a vector
path). The closure rule for the **full 95-row surface** has not passed, and
won't be described as having passed.

## Numbers, exactly as run

    registry entries               95
    COMPLETE                       11
    RECOGNIZE_ONLY                  2
    BLOCKED                        17
    NOT_IMPLEMENTED                65
    unit tests                     41  (41 pass, 0 fail)
    negative tests                 18  (18 pass, 0 fail)
    hostile-input tests            15  (15 pass, 0 fail)
    vector conformance checks     219  (219 pass, 0 fail)
    compiled substantive theorems    0  (Lean toolchain unavailable — see above)

All of the above were executed in this session; raw output is in `reports/`.

## Two things caught and fixed while building this, kept in the record

Both are exactly the kind of gap this file exists to disclose rather than
paper over, and both were fixed rather than only flagged:

1. **`KMAC128`/`KMAC256` were registered twice** — once under the "Digests"
   heading and once under "MAC", both present in the originating
   specification's own algorithm list. `scripts/check-registry.mjs`'s
   duplicate-id check caught this on its first real run. Fixed by keeping
   one canonical entry (see `src/registry/algorithm-registry.mjs`).
2. **The canonical-JSON parser had no explicit recursion-depth bound**,
   relying on the host engine's call stack. Found while writing
   `ASSUMPTIONS.md`, fixed in the same pass with an explicit `maxDepth`
   parameter (default 512) — see `ASSUMPTIONS.md` and
   `test/hostile/hostile-input.test.mjs`.
