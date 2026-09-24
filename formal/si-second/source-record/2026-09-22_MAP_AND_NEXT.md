# 2026-09-22 — Corpus map, verification record, next steps

Labels: **[checked]** run in this session, command and result on record. **[inference]** reasoning from checked facts. **[not run]** possible, not done here.

## 1. What arrived

Twelve distinct files on disk. The upload list showed fourteen because two zips were listed twice. There are 30,805 files after extraction, and 28,897 of them have distinct content. Of 5,560 Lean files, 5,151 are distinct. Full per-file listing with SHA-256 is in `2026-09-22_INVENTORY.csv`. [checked]

| Container | Files | Unique to it | Reading |
|---|---|---|---|
| theorems_individual_20260811 | 28,503 | all | Main theorem corpus: 22,149 `.v`, 4,903 `.lean`, 1,449 `.thy`. Has a CSV index with sorry/admit/axiom/native_decide/classical flags per theorem. That index is the natural seed for the registry. |
| 2026-07-23_individual_theorem_files_corrected_names | 1,045 | all | Markdown theorem write-ups plus index. |
| Pbid_pbis_20260917 | 346 | 89 of 147 | Handover of the SI-second witness build, flattened. |
| 2026-09-15_SI_SECOND_WITNESS_BUNDLE | 184 | 101 of 152 | Witness, twins, Coq checker, tamper control. Contains macOS ` 2` copies (e.g. `MANIFEST 2.json`). |
| 2026-09-15_SI_SECOND_BUNDLE | 12 | **0** | Fully contained in the witness/handover sets. It's a subset, not a separate artifact. |
| crypto_verification_artifacts_curated (v0.1) | 159 | 3 | Effectively superseded by v0.3.0. |
| crypto_verification_artifacts_curated_v0_3_0 | 193 | 31 | Current curated crypto set. |
| 2026_CRYPTO_SCRATCH_LEAN_PROOFS_ALL_UNIQUE | 302 | 146 | Scratch Lean. |
| 2026-08_ACTUAL_LEAN_PROOFS_ONLY | 42 | 6 | Mostly duplicated elsewhere. |
| 2026-08-25_Recognition_Custody_Defensive_Epistemics_BUNDLE | 11 | all | Paper-side bundle. |
| 2026-09-14_identity_patch_scratch | 8 | all | Patch source, harness, **private test keys**. |
| 2026-09-14_proofbundle_identity.html | 1 | — | The patched app. `module.js` is present verbatim. |

## 2. SI second — reproduced independently [checked]

Fresh Lean 4.34.0 (commit 293d5d0) and Lake 5.0.0 were installed with elan in this container. `2026-09-15_BUILD.sh` was run unmodified.

- The build succeeds from an empty `.lake`. Source hashes match the 09-15 manifest byte for byte.
- The audit uses `collectAxioms` over every constant: kernel 461, ledger 82, **0 with any axiom**. Of the 172 kernel constants that name `Nat` directly, all are Lean-generated and none is hand-written. `IsSecond`, `IsDuration`, `Pos.mul`, and `caesiumPeriodsPerSecond` do not reach `Nat`.
- The negative sketches behave as declared. The defects file passes 10/10 with no axioms. `sorry` shows up as `sorryAx`. The `from` field fails to parse with exit 1. The unary probe reproduces the recursion wall.
- The witness module (`SI_SECOND_WITNESS.lean`) compiles against the rebuilt kernel. Every declaration is axiom-free, including the four twin rejections.
- Independent of Lean: I re-parsed the `Pos` term in Python and it decodes to **9 192 631 770**. The witness JSON `periods` string also decodes to 9 192 631 770.
- Handover manifest: 111 of 111 entries match SHA-256 against the flattened files. The main 09-15 manifest shows 178 "missing", but it lists pre-flatten paths (`coq/`, `coq/runs/`). That's a layout artifact, not loss. [inference]
- The README hash `42e6c949…` equals SHA-256 of `witness.pb.json`.
- **Coq checker: [not run].** There is no Coq in this container. The logs claim `coqchk` passed. I have not replicated that.

## 3. Identity patch — three defects found, two fixed and confirmed [checked]

The baseline on the uploaded HTML ran in headless Chromium: self-test **73/74**, conformance matrix **900/0**, and the verify-report fails after a JSON round trip.

1. **Ed25519 fallback KAT fails because the test is wrong, not the library.** The fallback's `verify` takes `(sig, msg, pub)`. The self-test calls it as `(msg, sig, pub)`. The derived pubkey and signature both match RFC 8032 vector 1. Only the argument order is wrong. Side effect: the self-test marks the fallback **poisoned**, so Ed25519 goes away in any browser without WebCrypto Ed25519. Fix: swap the arguments.
2. **Verify reports cannot survive download.** `buildVerifyReport` maps `t.step, t.detail`, but trace entries carry `title, body, outcome, ms`. Every report trace is therefore `{step: undefined, detail: undefined}`. It seals fine in memory, becomes `{}` after `JSON.stringify`, and the digest no longer matches. Fix: map the real fields.
3. **Root cause under #2:** `canonicalJSON` returns the bare token `undefined`, which isn't JSON. Any sealed object with an undefined field produces a digest no serialized copy can reproduce. Fix: throw on undefined, function, symbol, bigint, and non-finite numbers. With the guard in place, the old trace shape is **rejected** instead of silently mis-sealed.

After all three edits: self-test **74/74**, conformance **900/0**, report **VERIFIED** both in memory and via JSON. The trace now carries its content. The diff is 31 lines: `2026-09-22_identity_fixes.patch`.

Found and **not changed**. These are decisions for you:

- **Merkle leaves are hashed from `JSON.stringify(l)`, not `canonicalJSON(l)`.** Two producers with different key order get different roots for the same object leaf. Switching changes existing roots, so it needs a spec version bump (2.1.0 → 2.2.0) and should not be a silent patch. [inference]
- **Scratch registry and keyring don't form a pair.** `registry.pb.json` seal-verifies [checked]. But neither its `anthropic/claude-opus-5` key (`33106b8d…`) nor its operator key (`9b84b1d0…`) is in `keyring.json`. They came from different key generations. Fine for scratch; not usable as evidence of the flow.
- **Page fetches `http://127.0.0.1:8788/lineage/export` on load.** That is the one console error. It's harmless when nothing is listening, but a self-contained verifier should make it opt-in.
- `keyring.json` holds **private keys**. They are throwaway, but it shouldn't sit in any bundle that might go public. The schema flags it `sensitive`.

## 4. Registry and standardization

Two files:

- `2026-09-22_PB-CORPUS-REGISTRY-1.schema.json` — a JSON Schema draft for the payload of a new profile. It sits inside your existing envelope (`hdr/meta/payload/merkleRoot/seal`, PB-CANON-JSON-1) and does not replace it.
- `2026-09-22_EXAMPLE_SI_SECOND.registry.payload.json` — 10 entries and 6 runs, built from **today's actual runs**. It validates against the schema. The negative control (a `checked` claim with no run reference) is **rejected** by the schema. [checked]

Design choices:

- **Entry ID = content hash.** The 1,908 duplicate files collapse into `locations[]` on one entry and don't spawn new entries. Supersession (v0.1 → v0.3.0, SI_SECOND_BUNDLE ⊂ witness bundle) becomes a relation, not a folder name.
- **Evidence labels are yours:** source / recalled / checked / inference / interpretation, lifted from the SI analysis. The schema enforces that `checked` must cite a run.
- **Runs are the input/output standard.** Each run pins inputs by hash and the toolchain by version and commit, declares `expect` before execution, records what it `observed`, and gets a `result` of `as_expected` or `unexpected`. That makes negative controls first-class: a twin that fails is `as_expected`. `replicates` links an independent rerun to the original. Today's runs replicate the 09-15 ones.
- **Operator is a label.** A model name in `environment.operator` is explicitly not an attestation. Attestation is PB-MODEL-ATTEST-1's job.

## 5. Next, in order

1. **Adopt the three-edit fix.** Diff it against your canonical copy, re-seal, and publish. Small and confirmed.
2. **Decide the Merkle-leaf encoding** and, if you change it, bump the spec. Do it before more roots get anchored under the current behavior.
3. **Replicate the Coq checker** on your PC, or here via opam if you want me to try. It's the one leg of the SI second I couldn't close.
4. **Seed the registry from `theorems_individual_20260811`'s index CSV.** Its flag columns map directly onto `declares` and onto pre-run `claims` labeled `source`. Then batch-build on the PC and attach runs. 27,212 files make this a PC job, not a phone job.
5. **Retire what the registry marks as superseded or subset:** curated v0.1, SI_SECOND_BUNDLE as a standalone, the ` 2` copies. Quarantine the scratch keyring.
6. **Regenerate the identity scratch pair in one session** so the registry and keyring match, then add it to the registry as a witness of the flow.
7. **Pull the remaining Drive and GitHub material** into the same inventory pass, so the whole surface gets one content-addressed map instead of one map per upload.
