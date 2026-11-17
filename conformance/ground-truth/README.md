# Ground truth for the verifier

Results here compare the client's verifier with things the client did not write for itself: the May 2026 conformance
corpus and the independent Python reference that passes it, external vector sets (Wycheproof, BLAKE3, NIST, RFC),
and mutation testing of `verify_bundle`. The client's own generated definition (17,822 cases) is a regression gate
only; it is not used as ground truth here.

## Layout

- `corpus-v1/` — `vectors_v1.json`, the May 2026 corpus (300 vectors, sha256 `11aef10b…cfb3`), with its README.
- `tools/`
  - `ref_v1_0_0.py` — independent Python reference for spec 1.0.0 (needs `cryptography` and `blake3`).
  - `extract_core.mjs` — extracts the verifier core verbatim from a client build into `pb_core_extract.js`.
  - `pb_core.mjs` — loads that extract in an isolated realm for Node.
  - `run_definition_node.mjs` — runs a conformance definition through the extract.
  - `corpus-v1_on-verify-bundle.mjs` — runs the May corpus through `verify_bundle`, recording each vector's class beside the client's verdict code.
  - `mutation-verify-bundle.mjs` — one-token mutants of `verify_bundle` (`===`/`!==`, `<`/`<=`, `>`/`>=`, `&&`/`||`, `true`/`false`, dropped `!`), each run against a definition; a mutant is detected when any case's verdict changes or the run fails.
- `results/2026-11-17/` — the runs below.

## Results, 2026-11-17 (published client c1d85fd6, core extract `cafdfd70…`)

1. **May corpus on the independent reference:** `ref_v1_0_0.py` passes 300 of 300 (`2026-11-17_corpus-v1_ref_v1_0_0.tsv`). The corpus also passed on the Python and TypeScript reference implementations in August and on the corpus-v1 build on 2026-10-30.
2. **May corpus on the published client:** all 300 return a verdict (`2026-11-17_corpus-v1_published-c1d85fd6.tsv`). 290 fall in the verdict family of the corpus class. **10 diverge:** CV0191–CV0200, malformed boundary atoms (wrong arity, non-numeric range bounds, non-timestamps, non-durations), where the corpus and the reference give `indeterminate` and the client gives `MALFORMED` (`atom.arity` / `atom.operand`). The class-to-code mapping used for the 290 is a reading of the families and is still to be checked against the 1.0.0 outcome list.
3. **Mutation testing of `verify_bundle`, all 361 sites**, against the 373 cases of pairs SHA-256|Ed25519 and SHA3-384|ML-DSA-65 plus 18 new cases (`2026-11-17_verify-bundle_361-mutants.tsv`, `…_not-detected.json`): 319 detected (one by crash), 42 not detected, score 88.4%. On 2026-11-16, 240 sampled sites without the new cases gave 80.8%.
   - The 18 new cases (`detection_cases.json`, results in `detection_cases_results.json`) were built for 15 mutants the 11-16 run did not detect; each matches the unmutated core and changes verdict under its mutant. Their expected verdicts are this session's reading of the verifier and are **not yet** confirmed against the reference implementation.
   - Of the 42 not detected, most change only message text, cause fields or timing. Those that change behaviour and still need cases: 0218/0220/0239 (a throwing signature or witness check), 0012 (`require_supplied_time`), 0033 (raw byte limit), 0046–0052 (legacy envelope classification), 0081 (witness fields), 0144 (NFC walk), 0219 (provider unavailable), 0243 (Ed25519 branch), 0301/0302 (aux items), 0322 (key-beside parent).

## To reproduce

```
node tools/extract_core.mjs proofbundle.html tools/pb_core_extract.js
node tools/corpus-v1_on-verify-bundle.mjs corpus-v1/vectors_v1.json out.tsv
python3 tools/ref_v1_0_0.py corpus-v1/vectors_v1.json ref.tsv
node tools/mutation-verify-bundle.mjs <definition.json> <out-dir> 361 3
```
(`mutation-verify-bundle.mjs` and `extract_core.mjs` need `acorn`.)
