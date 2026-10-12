# Algorithm synthesis — October 12, 2026

The Algorithms panel now exposes the recovered algorithm records alongside the current application implementation registry. `ALGORITHM_SYNTHESIS.json` binds the inputs by SHA-256. Its embedded copy works when the operator opens `proofbundle.html` directly from a file URL.

The recovered records answer different questions:

| Source | Observed content | What its status applies to |
|---|---|---|
| Current application registry | 95 entries: 45 COMPLETE, 31 NOT_IMPLEMENTED, 17 BLOCKED, 2 RECOGNIZE_ONLY | The named application modules; schema/path checks are not security proofs |
| Git commit `3c199c2` | 621 rows, 566 distinct identifiers, 55 repeated identifier rows | Historical registry declarations; all rows retained with source indices |
| RAID descriptive catalogs | 346 rows from seven valid files, plus 7 entries in the existing recovered subset | Algorithm descriptions, not a claim that the host implements them |
| Separate proof registry | 32 rows and 10 open defects | Particular proof/implementation lineages and their recorded evidence |
| Recovered Rust workspace | 32 crate directories, 27 declared workspace members | Source manifests; no Cargo build has been replayed in this synthesis |
| Agent and relay profiles | X25519/HKDF/ChaCha20-Poly1305 and ML-KEM-768/HKDF/ChaCha20-Poly1305 paths | Existing envelope integration, distinct from application registry dispatch |

The catalog has 353 rows and 350 distinct name strings across all files. The publication dataset's reported 352 entries use a different per-category keying rule. These counts must not be presented as interchangeable. The malformed eighth original catalog is preserved; the existing seven-entry repaired subset is separately attributed. Nothing fills in its lost identity-based-cryptography category.

## Composition and correspondence

Digests, MACs, KDFs, signatures, key agreement/encapsulation and authenticated encryption perform different jobs. The synthesis keeps each algorithm's parameter set and implementation lineage visible. Signing identities are not decryption keys. X25519 and ML-KEM establish encryption material; HKDF derives subkeys; ChaCha20-Poly1305 authenticates ciphertext; Ed25519 signs the envelope. SHA-256 binds exact content and the ledger's specified preimages. Merkle trees and OTS proofs add their own encoding and timestamp evidence.

`PB-CONF-1` is a separate existing construction using ML-KEM with a custom SHAKE stream and MAC. It is not ChaCha20-Poly1305 and is not silently merged with that profile. Its source's caveats remain applicable. Neither the existence of its modules nor a round-trip proves an arbitrary composition secure.

The application registry marks ChaCha20-Poly1305 NOT_IMPLEMENTED while the inspected agent/relay profiles invoke a native provider. This is an integration discrepancy to reconcile through explicit dispatch/provider records. It is not a reason to advertise the entire application AEAD surface as operational.

Likewise, an application JavaScript ML-KEM or ECDSA declaration and a hollow Lean scaffold can both exist. Proof status belongs to the exact source and theorem dependency environment. The source readback found 32 matching provenance references and one mismatch: the current SHA-256 Lean file differs from the earlier registry's recorded hash. Both hashes remain in the synthesis; the older proof status is not transferred to the changed file.

## Verification performed

The current 95-row JSON matches the exported module registry. Its schema validation has no errors and all referenced module, vector and formal paths are present. Existing local checks were replayed: vector/canonicalization checks 265/265, BLAKE3 133/133, ECDSA 148/148 and ML-DSA 51/51. Exact outputs and their hashes are retained under `reports/algorithm-synthesis/`. These tests cover their stated inputs, not a general cryptographic security proof.

Five UI tests cover separated implementation/proof statuses, search and source selection, combined conflicting-evidence display, untrusted text rendering, and exact file-origin embedded data. The view uses text nodes for source material and paginates records.

The existing HTML crypto audit passes 66 boot checks, 24 functional checks and 660 conformance cases, with no engine errors. It still reproduces PBHTML-F004: the RFC 3161 time extraction path does not verify the CMS signature or certificate chain. The audit's zero exit status does not close that finding. The exact report is retained as `reports/algorithm-synthesis/html-audit.json`; its artifact hash identifies the page actually tested.

## Git reconciliation

At initial inspection, local `main` was `3b6cf5b`; cached `github/main` was `56c5cb7`; cached `origin/main` was `7d44e7c`. Local main and cached github/main had 8 and 23 exclusive commits respectively. Relative to cached github/main, the local tree lacked 2,227 archive paths, plus one script. Independent ancestry review identifies these as additions on the cached GitHub branch after the common ancestor, rather than deletions of shared ancestral files. Those cached refs are not a fresh remote observation. The synthesis commit subsequently adds another local commit.

The historical registry survives in Git even though the current JSON has 95 rows. This synthesis recovers its declarations without overwriting the operational registry. The separate `/home/falsealias/proofbundle-registry` working tree had no commits at initial inspection. Source preservation subsequently committed 30 registry/tool/document files there and 582 source/configuration files in four algorithm repositories. The exact per-file hashes, parent heads and resulting commits are retained in `reports/algorithm-synthesis/source-gitback.json` and linked by the synthesis. Scratch directories, key stores and compiler outputs were excluded from those source commits; originals remain in place. No proof status was upgraded by committing source.

The separate reconciliation branch `reconcile/algorithm-synthesis-20261012` preserves both local main and cached GitHub main as parents. Its sole HTML conflict was resolved by retaining Registry Manager and the current application initialization. Cached-branch archive additions remain in its tree. This candidate has not been pushed or made the active workbench.

Remaining reconciliation work is to preserve both branch lineages, select missing source work by exact paths and hashes, resolve incompatible changes, retain archive custody, and review a concrete additive integration before publishing. No force-push, historical rewrite or external publication was performed for this synthesis. Existing unrelated identity/browser changes were preserved.

## Regeneration

From this repository, with the original source volumes available:

```sh
python3 scripts/synthesize-algorithms.py
python3 scripts/embed-algorithm-synthesis.py
node --test test/unit/algorithm-synthesis.test.mjs
```

The generator reads the specific source registries and manifests. It does not access agent secrets, wallets, cloud accounts or source transcripts. Preserve raw sources independently of this derivative. Machine-wide conversation capture and OTS coverage are maintained by the bridge workers and are not established by the algorithm synthesis.
