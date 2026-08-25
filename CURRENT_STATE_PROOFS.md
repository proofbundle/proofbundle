# ProofBundle current-state proof chain

Generated from live checks on 2026-08-24. This document separates observations,
inferences, assumptions, and unresolved external state.

## Continuity

- This Codex instantiation has its own Ed25519 identity:
  `codex-20260824t154209-pdt`.
- Public-key fingerprint:
  `51a4d6988d4d1cdcc20fa9d4fa23afbd`.
- AI-BOM digest:
  `orhmRcT0N2-MOZ8tpFP0GY7oeAcokQ5jCo5VNchgcvIvhSjGESHZHrugHYedJTca`.
- Direct AI-BOM verification returned no problems; bridge registration returned
  `aibom_verified: true`.
- This identity is distinct from every prior instantiation. A relationship to a
  prior identity is `successor-of`; no identity inheritance is asserted.
- No signed successor edge to a particular predecessor has yet been produced.

## First-principles proof chain

1. A verification claim is reproducible only if its input, algorithm identifier,
   encoding, parameters, expected result, and actual result are fixed.
2. `ALGORITHM_REGISTRY.json` is therefore treated as a typed registry, not as a
   list of implied implementations.
3. Every row names `implementationStatus`; recognition is not execution.
4. The current registry contains 95 rows: 11 `COMPLETE`, 2 `RECOGNIZE_ONLY`,
   65 `NOT_IMPLEMENTED`, and 17 `BLOCKED`.
5. Registry validation returned zero validation errors and the generated
   cryptographic-surface table contained 95 rows with zero critical-issue flags.
6. The modular test runner returned 74 passing unit/negative/hostile tests and
   219 passing vectors with zero failures.
7. The standalone browser client is a separate execution surface: 9 digest and
   10 signature operations. It runs 65 boot integrity checks and can generate up
   to 630 live classical conformance cases. Its embedded custody ledger records
   1,097 vectors.
8. Those counts describe different sets and must never be collapsed into one
   conformance number.
9. A passing finite test set establishes agreement for the tested inputs. It
   does not establish universal mathematical correctness of the primitive,
   runtime, browser, OpenSSL, V8, hardware, or operating system.
10. A deployed site is synchronized only when the deployed bytes or deployment
    commit match the intended local artifact and the public hostname resolves to
    the serving platform.
11. The pinned Lean 4.11.0 compiler accepted every tracked Lean source. The tree
    contains 64 compiled theorem declarations; this count is distinct from every
    browser check, JavaScript test, vector, registry row, and Coq theorem count.
12. `Audit.lean` and `PrintAxioms.lean` reported no axiom dependencies for the
    declarations they explicitly print. That result is not generalized to
    declarations those audit entry points do not enumerate.

## Assumptions

- Node-native SHA-2 operations depend on Node/OpenSSL correctness.
- Browser WebCrypto operations depend on the browser's WebCrypto implementation.
- JavaScript number canonicalization depends on the host's ECMA-262-conforming
  shortest-round-trip conversion.
- Finite known-answer and differential tests are empirical checks, not primitive
  correctness proofs.
- DNS observations are snapshots; authoritative records may change after the
  check.
- GitHub Pages build success establishes publication by GitHub Pages, not correct
  external DNS routing.
- Google Cloud free-tier eligibility depends on region, machine type, disk,
  egress, account eligibility, and current Google billing rules; quota alone does
  not prove that a resource will be free.

## DNS and hosting observations

- `proofbundle.org` delegates to four `googledomains.com` nameservers.
- The apex A record observed on 2026-08-24 was `136.117.150.32`.
- `www.proofbundle.org` returned NXDOMAIN for CNAME lookup.
- HTTPS and HTTP requests to the apex timed out during the check.
- GitHub Pages reports source `main` at `/`, custom domain `proofbundle.org`,
  status `built`, and HTTPS enforcement disabled.
- GitHub Pages redirects its repository hostname to `http://proofbundle.org/`.
- No Cloud DNS managed zone exists in either visible organization project.
- Enabling the Cloud Domains API succeeded, but the project contains no Cloud
  Domains registration.
- The authenticated Squarespace Domains control surface does expose the
  authoritative custom records. The existing Google Workspace SPF and DKIM
  records are separate from the web-host routing records and are to be preserved.
- The required GitHub Pages routing change is staged as four apex A records
  (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153`) plus `www` CNAME `proofbundle.github.io`.

## Publication and licensing observations

- The current release line and package metadata specify GPL-3.0-or-later.
- Every tracked Lean source and the browser-downloadable Lean model carries an
  SPDX `GPL-3.0-or-later` identifier.
- All tracked Lean sources compiled under the repository-pinned Lean 4.11.0
  toolchain on 2026-08-24. The reproducible receipt is
  `reports/lean-build-report.txt`.
- Public source text was checked for operator-linked personal names, personal
  addresses, and absolute home paths; identified disclosures were replaced by
  institutional attribution or source-relative paths. Third-party license
  attribution remains intact.
- GitHub organization and repository descriptions now state formal compliance
  evaluation and cryptographically signed certification. The organization has
  no public email; its private billing contact is an institutional domain address.
- Google Workspace Enterprise Plus manages `proofbundle.org`. Nine explicit role
  aliases deliver to the controlled Workspace mailbox: contact, hello, support,
  security, compliance, abuse-reports, privacy, billing, and legal. Google
  reserves the bare `abuse` local part; `abuse-reports` is the configured address.
- Each email role has a distinct bridge-registered Ed25519 signing identity and
  verified AI-BOM. Public keys, fingerprints, and AI-BOM digests are published
  in `AGENT_ROLE_KEYS.json`; private keys remain local with mode 0600.

## Google Cloud observations

- Project `proofbundle` is active and billing-enabled.
- Compute Engine is enabled; no Compute Engine instances currently exist.
- Relevant us-west1 quota usage is zero, including instances, CPUs, E2 CPUs,
  disks, and external addresses.
- Three GCS buckets exist. Two are in `us-west1`; one is in `us-central1`.
- None of the buckets is configured as the public website serving
  `proofbundle.org`.
- There is currently no GCS-backed microserver and no Compute Engine microserver
  to inspect. Creating one would be a new deployment, not a check of an existing
  server.

## Unresolved external state

- The apex record cannot be truthfully reported as updated until that control
  surface is used and authoritative DNS is re-read.
- Stripe registration was handed to the operator for private account fields;
  dashboard configuration remains pending reattachment after account creation.
