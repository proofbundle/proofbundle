# Notes, decisions, and corrections — 2026-09-28 archive pass

This file is the running log of every non-obvious decision, mistake, and
correction made while organizing this archive. It exists because
provenance on the work done here matters as much as provenance on the
cryptographic artifacts themselves.

## Mistakes

- **Cleanup commit initially failed silently mid-session.** A `cd ../../../`
  after deleting `__MACOSX`/AppleDouble files landed outside the git root
  (`fatal: not a git repository`), so the deletions were made on disk but
  never committed. Caught on resume by running `git status` from the
  actual repo root before doing anything else, which showed the 101
  pending deletions were still staged and intact. Committed as `4a8a099`.
- **Claimed a commit included files it didn't.** Committed
  `js_crypto_core_README.md` and said the paired test-run logs
  (`js_crypto_core_test_logs/*.log`) were included in the same commit
  (`1de864e`). They weren't: the repo's `.gitignore` has a blanket
  `*.log` rule, and a plain `git add` on the directory silently dropped
  them rather than erroring. Caught immediately after by running
  `git ls-files` against what the commit message claimed, rather than
  trusting that the add-then-commit sequence did what it was meant to.
  Force-added and committed separately as `9bf708d`. The lesson: verify
  a commit's actual tree against the intended file list when a repo has
  ignore rules broad enough to eat evidence file extensions like `.log`.
- **Overclaiming risk on the identity witness, corrected before it shipped
  as prose but not before it shipped as unnecessary caveat text.** The
  first draft of the session-identity README over-explained, at length,
  that a generated keypair doesn't establish persistent identity — true,
  but aimed at someone who has spent months building provenance and
  identity-attestation systems and does not need the 101-level version.
  Called out directly by the user; not repeated.

## Decisions

- **Duplicate content: recorded, not deleted.** 1526 of 2246 files in
  this archive are exact-content duplicates of another file elsewhere in
  it (489 distinct duplicate clusters). The overwhelming majority are the
  source library's own intentional multi-view structure — the same file
  appearing under an implementation directory, an original-package
  archive, and a curated-evidence view — which that library's own README
  states as policy: "Curated evidence views duplicate bytes for
  discoverability... Distinct historical variants are retained." Deleting
  those copies would override a preservation decision that came bundled
  with the source material, not clean up thrash. Instead, built
  `provenance-registry/DUPLICATE_CONTENT_MAP.json`, which the source
  README already named as the expected artifact for this
  (`99_CATALOG/DUPLICATE_CONTENT_MAP.json`) — every cluster, every path,
  SHA-256, so the duplication is now auditable rather than either hidden
  or destroyed.
  - Checked the largest duplicate cluster (23 copies, all hashing to the
    empty-string SHA-256) before assuming it was junk: they are real Lean
    `.vok`/`.vos` sidecar files (validly zero-byte) and one empty
    `REPRODUCER_STDERR.txt` meaning "no error occurred" — evidence, not
    noise.
- **Cringe/narrational directory names renamed, not deleted.** Two
  directories were named as a claim about the model's own prior output
  rather than as a description of content:
  `2026-08_ACTUAL_LEAN_PROOFS_ONLY` (two identical copies, under
  `lean-proofs-unique/` and `scratch-lean-all-unique/`) and `FINAL/`
  (under `scratch-lean-all-unique/2026-08_buildpacks/files (1)/`). Names
  like this only get written after an earlier attempt was insufficient —
  they narrate "this one is real, unlike before" instead of saying what's
  in the directory, pushing the cost of a prior model's failure onto
  whoever has to navigate the archive later. Renamed via `git mv`
  (history preserved, content untouched):
  - `2026-08_ACTUAL_LEAN_PROOFS_ONLY` → `2026-08_lean_proof_source_variants`
  - `FINAL/` → `2026-08_proofpack_and_sha_audit_sources/` (named for its
    actual contents: `proofpack/{Audit,Pack}.lean`, `sha/{NameCheck,Risk1}.lean`)

## Explicitly not done, and why

- The uploaded `2026-09-14_proofbundle_identity.diff` was not applied to
  reconstruct `2026-09-14_proofbundle_identity.html`. That patch and its
  target file are already present, hash-verified, in
  `identity-proofs/ca095126-Pbid_pbis_20260917_extracted/`. Reapplying it
  would only reproduce bytes already in the archive under a different
  key's signature — it would not constitute new identity work. Instead, a
  new, independently generated keypair and signed witness were built in
  `session-identity/`, with an honest account of what a session-scoped
  keypair does and doesn't establish.
- No new formalization repositories have been created yet (lean-ecdsa-p256,
  rocq-ml-kem, etc.). This is still open. The source material for most of
  these exists in the archive but has not yet been checked for whether it
  actually compiles under a real Lean/Coq toolchain — creating a repo from
  source that doesn't build, under a name implying it does, would repeat
  the exact naming-dishonesty pattern this file documents fixing above.
  Each one will be built (or explicitly logged as not-yet-buildable) rather
  than assumed.

## Repo creation blocked by session binding (2026-09-28)
User confirmed permission to create `proofbundle/rocq-si-second`. `POST /orgs/proofbundle/repos` was refused by the
session: "sessions are bound to their configured repositories." Not worked around. SI_SECOND sources and run outputs
live in this repo under build-verification/si_second_coq_run/ (sources/ added) until a separate repo is created
by the user and attached to the session.

## Prior rocqchk audit read (2026-09-28)
12 of 13 sections show `Axioms: <none>`; the `mldsa` section is truncated with no verdict. See
build-verification/prior_rocqchk_and_lean_audit_202608/README.md. Not re-run this session.

## 2026-05-18 combined bundle: reading results (snapshot, 2026-09-28)
Zip SHA-256 `921c94f42f1941784c52d5a893a74f38835e6d75752625865d95a782412f9c18`, 21 files, not committed here.
- Duplicates: the two large `.html` copies are byte-identical (same SHA-256); the `.txt` is a separate text rendering.
- Embedded hashes: the v1.1 thread file states four embedded digests (SHA-256, SHA-384, SHA3-384, SHA-512) computed after zeroing
  the four hash values. Recomputed independently (Python hashlib; SHA-256 and SHA3-384 also with sha256sum/openssl): all four match.
- Coq files (coqc 8.18.0, flat directory): kernel, oal_preprint, fold_real, continuum_final and the consolidation file compile;
  core_v0.02, kernel_v2 and both Anachronegon files do not. oal_preprint has 4 `Admitted`; continuum_final has 1 `Admitted` Instance and 5 axioms/parameters.
- The bundle README says the consolidation file fails on unmatched `End` directives. Those close `Module` blocks (6 Modules, 2 Sections);
  the file compiles under 8.18.0 and its 151 `Print Assumptions` outputs read "Closed under the global context".
- Spec PDF: 36 clauses and 150 subclauses are all present (apparent numbering gaps in a text extract were extraction artifacts).
  Metric claims (107 vectors, 20 operators) are stated consistently; not checked against an implementation.
- Clementine RLM v0.3.1 runs. Its own benchmark output reports motion discrimination 0.0, intra-formal and cross-group similarity both
  0.9941 (no separation), and L3/L5 as STUB. It prints "v0.3.0" in a v0.3.1 file.
- The Qwen transcript is speculative chat with no verifiable claims; the Kimi page is a chat export.
- Not read in full: the 89k-line html/txt rendering and the continuum PDF.
