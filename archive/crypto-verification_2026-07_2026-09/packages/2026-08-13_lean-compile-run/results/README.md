# 2026-08-13 Crypto Verification Batch

This directory is an append-only verification lane for the ten source files supplied on 2026-08-13.

- `payload/part_*` is a base64-encoded XZ custody stream reconstructed by CI.
- `INPUT_SHA256SUMS.txt` fixes the payload hash and every original-file SHA-256 before execution.
- CI reconstructs byte-for-byte originals under `00_ORIGINALS/`, then creates normalized-name execution copies under `10_WORKING/`.
- Ground truth, review material, run logs, and receipts are separated into `20_GROUND_TRUTH/`, `30_REVIEWS/`, `40_RUN_LOGS/`, and `50_RECEIPTS/`.
- No original is overwritten by the workflow. Compilation failures are recorded rather than silently repaired.

Workflow: `.github/workflows/verify-2026-08-13-crypto-batch.yml`
