# Scope: every input here is a snapshot

All material in this archive was supplied as dated snapshots: zips, exports, drive copies, and logs from earlier
runs. Nothing here is a live view of the current corpus.

Consequences for reading it:
- A build or compile result in `build-verification/` is a result **for the snapshot that was compiled**, on the
  toolchain named in that file, on 2026-09-28. It is not a statement about the present state of the project.
- Header claims inside a snapshot (theorem counts, "zero axioms") are claims as of that snapshot's date.
  Mismatches found are recorded as history, not as defects in current work.
- Prior-run evidence (2026-08-19 sweep, Aug rocqchk output) is dated by its own timestamps and was not re-run.
- Later snapshots supersede earlier ones. Where two disagree, the later one governs and the earlier stays as history.

Snapshot bundle received 2026-09-28: `combined_genophylaxis_bundle_20260518.zip`,
SHA-256 `921c94f42f1941784c52d5a893a74f38835e6d75752625865d95a782412f9c18` (not committed to this repo).
Compiled with coqc 8.18.0: kernel, oal_preprint, fold_real, continuum_final and AllConsolidated_broken exit 0;
genophylaxis_core_v0.02, kernel_v2 and both Anachronegon files fail to compile.
