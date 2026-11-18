# ProofBundle crypto — complete prebuilt handoff

This directory is a provenance-preserving superset of the crypto/formal material supplied in the conversation through 2026-08-11.

## Layout

- `00_raw_uploads/` — every standalone `.lean` file and both source ZIP archives, byte-for-byte as supplied.
- `01_expanded_archives/` — both supplied source ZIPs expanded into their original directory structures.
- `02_compile_ready_first_pass/` — the complete earlier static-repair package, including originals, repaired sources, composites, scripts, and reports.
- `03_workspace/` — convenient categorized copies of the later standalone implementations; copies only, not semantic rewrites.
- `04_reports/` — whole-tree manifests and future compile logs.
- `scripts/` — Lean bootstrap, inventory, and standalone compile runner.

## Current boundary

This tarball is a complete assembled source folder. It is not represented as kernel-compiled in this runtime. The earlier repaired layer remains separately identifiable and its reports are preserved under `02_compile_ready_first_pass/`.

## First commands on a machine with network access

```bash
./scripts/inventory.sh
./scripts/install-lean.sh
./scripts/compile_standalone.sh
```

Do not overwrite `00_raw_uploads/`; use it as the custody layer.
