# ProofBundle 1.0.0 conformance definitions

A definition is a plain JSON file. Each case carries its bundle, its options, its parents and the verdict fixed by
the way the case was built; no expected verdict was read back from the verifier. Verification time is fixed at
2026-11-01T00:00:00Z inside both files, so a run gives the same result on any date.

| file | cases | digest × signature pairs | generated (UTC) | bytes | SHA-256 |
|---|---:|---|---|---:|---|
| definition_2026-11-02_17822-cases.json | 17,822 | 150 (15 × 10) | 2026-11-02T08:33:18Z | 77,536,059 | 256de0b9fa36d8e0e56ffc52a836a56caa4bc265dba89dd78642e5b5e83d177f |
| definition_2026-11-01_6015-cases.json | 6,015 | 72 (9 × 8) | 2026-11-01T01:00:53Z | 12,967,641 | b24fe9a47e692f148bce53f09736437c4bdc965d00501ab2164651e565aca81a |

Both definitions construct 45 of the 46 verdicts; INTERNAL_ERROR is reached only when the verifier itself throws and
no input is built to cause that.

## Sources recorded by the 2026-11-02 definition

The definition records the SHA-256 of the generator and of the verifier that produced it. Both files are here and
their digests equal the recorded values.

| file | SHA-256 | field in the definition |
|---|---|---|
| generator_2026-11-02.js | 8b0fded851d339b5bc27523f332794df254a5bbd0b473e9fc2a67f0bbf69f00e | generator_sha256 |
| verifier_2026-11-02.js | b8f0c904664922c59863f2d2846f38f7ecdb7745dd02a2f5f297ac651f628cfa | verifier_sha256 |

The engine the definition records (engine_sha256 6065f5d8f2d2d318…) is the client build that generated it; that
build is not in this directory. The 2026-11-01 definition records generator 86074f5d1967…, verifier 191efb53ab75…
and engine a3793cee9950…; those three files are not in this directory either.

test-suite_2026-11-02.js is the source of the client's test-suite page of the same date.

Text of these sources found verbatim in the client at the repository root (proofbundle.html, SHA-256
c1d85fd6225f09dd…, published 2026-11-16): verifier=True generator=False testsuite=False.

## Run records

| file | what it records |
|---|---|
| independent-signature-check.log | Signatures of passing cases checked outside the client, per scheme and envelope form: 0 failures. The log names a definition with SHA-256 61e25ba1d77a5c7f…; that definition is not in this directory. |
| planted-faults.json | 46 faults, each disabling one check in the verifier; every entry names the first case that caught it. |
| mutation-run.ndjson | 1,126 mechanical mutants of the verifier (negated conditions, flipped comparisons, swapped connectives, dropped calls): 936 killed, 190 survived. One line per mutant with the mutant's SHA-256. |
| june-2026-set_results.ndjson | The 1,097 vectors of the June 2026 set under the 1.0.0 verifier, one line per vector with the first cause. |

The two documents that describe these builds and runs are in docs/release-1.0.0/.
