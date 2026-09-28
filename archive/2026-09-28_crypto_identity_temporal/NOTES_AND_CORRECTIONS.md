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
