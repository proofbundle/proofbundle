# PB-CONFORMANCE-1.0.0 — executed, not estimated

Result: **17,822 of 17,822 cases pass, 0 fail, all 45 constructed verdict codes reached.**
Run of 2026-11-18, 17:41:04Z → 17:45:28Z (264 s), Node v24.19.0, jsdom 31, this client's own
`verify_bundle` — no reimplementation and no expected value supplied by this repo.

## What was executed, and the identity of everything involved

| object | sha256 | note |
|---|---|---|
| definition (operator copy) | `256de0b9fa36d8e0e56ffc52a836a56caa4bc265dba89dd78642e5b5e83d177f` | 77,536,059 bytes, 17,822 cases, generated 2026-11-02T08:33:18.706Z |
| definition embedded in the client | decompresses to the same `256de0b9…` | gzip body `43dc754597ed1614662c4f85b0eddb24b207c23c663d7476ce9f622a2c286762` |
| client build on this host | `2047b90c6f5d8af55965040128300fe03e87273bae2ebe232dd96df51ac74800` | `proofbundle-1.0.0-20261102T084002Z.html`, 19,741,429 bytes, mtime 2026-11-05 |
| client build cited by the 2026-11-02 note | `7602f2aa101cb1e6cbe6239b48cf9be340f2b4f2144e42670cbaf674f66e5623` | **not on this host** |
| `verify_bundle` function text as run | `33b847d756e802aaf596cf3a4189da3a551463aa070d92135c72b177489b43d5` | 40,484 bytes of source, extracted from the client |
| definition's declared `verifier_sha256` | `b8f0c904664922c59863f2d2846f38f7ecdb7745dd02a2f5f297ac651f628cfa` | no file on this host hashes to it; it is a claim carried by the definition, not something this run could confirm |

Two independent copies of the definition agree byte-for-byte, which is why the operator copy
was not trusted on its own word: the client carries the same 77,536,059 bytes compressed
inside itself. The client *build* does not agree with the note: the file present on this host
is a later rebuild (2026-11-05, "lockout fix: silent keygen at 10 sites" per its claim file)
bearing the same filename as the 2026-11-02 build the note certifies. The result above is
therefore a statement about `2047b90c…`, not about the certified `7602f2aa…`.

## The two places the harness had to adapt, stated plainly

1. **Realm.** The client's canonicaliser (`admit`, `canonicalize_object`) accepts only objects
   whose prototype is its own `Object.prototype`. Cases handed in from Node's realm were
   refused and every one of them surfaced as `INTERNAL_ERROR` — 16 of the first 30 smoke cases.
   The runner now round-trips each case through `window.JSON` before calling. This was a
   harness defect; it produced no claim about the client.
2. **Time.** The client gates on `Number.isFinite(o.now)`: it wants epoch milliseconds. The
   definition stores ISO 8601 strings. Unconverted, every case silently fell back to
   `Date.now()` and the three deprecation cases (2032, 2037) returned `VERIFIED` /
   `VERIFIED_WITH_WARNINGS` instead of `DEPRECATED_ALGORITHM`. The runner converts ISO to
   epoch ms; no option is invented and no case is skipped.

Both adaptations are in `run_conformance.mjs` next to this file, in the comments where they
belong, so a reader can challenge them rather than take them on trust.

## What the definition cannot cover

The definition is a 2026-11-02 artifact for the algorithms that existed then: 15 digests and
10 signature schemes, 150 pairs. `COVERAGE-GAP.tsv` maps all 311 registry entries in this
repo against it:

| section | entries | with corpus cases | implemented |
|---|---|---|---|
| 01-hash | 33 | 13 | 20 |
| 02-hash-xof | 7 | 2 | 3 |
| 03-kdf | 11 | 0 | 5 |
| 04-mac | 7 | 0 | 5 |
| 05-block-cipher | 21 | 0 | 1 |
| 06-mode | 8 | 0 | 6 |
| 07-aead | 14 | 0 | 3 |
| 08-stream-cipher | 14 | 0 | 2 |
| 09-pke | 8 | 0 | 1 |
| 10-key-exchange | 13 | 0 | 1 |
| 11-signature | 19 | 1 | 4 |
| 12-curve | 29 | 0 | 1 |
| 13-post-quantum | 14 | 1 | 0 |
| 14-commitment | 15 | 0 | 2 |
| 15-content-addressing | 21 | 0 | 0 |
| 16-rng | 9 | 0 | 0 |
| 17-encoding | 12 | 0 | 0 |
| 18-verified-impl | 15 | 0 | 0 |
| 19-deprecated | 17 | 0 | 0 |
| 20-unclassified | 19 | 0 | 0 |
| 21-timestamp | 5 | 0 | 0 |
| **total** | **311** | **17** | **54** |

**294 of 311 entries have no case in this definition at all** — not a failure of the
definition, a statement of when it was written. Coverage for those entries has to come from
`repo/vectors/` (published, adversarial, hostile) or from ACVP, and must never be inferred
from a green conformance run. A passing conformance run says nothing about KEMs, MACs, AEADs,
stream ciphers, curves, commitments or PQ signatures.

## Mutation evidence carried alongside

`MUTATION-RUN.ndjson` is the operator-supplied mechanical mutation log: 1,126 distinct
mutant builds of the verifier, 936 killed and **190 survivors, every one of which ran all
17,822 cases**. Survivors cluster on the base64url guard (`if (... x.length % 4 === 1)`) and
on warning-only and redundant branches: the definition does not discriminate those paths,
because the same value is checked again downstream. The survival of a mutant is not a defect
in the client; it is a measured limit of this definition's discriminating power, and it is the
honest counterpart to the note's "35 of 35 planted faults caught" — a hand-planted set of 35
is a weaker instrument than 1,126 mechanical mutants, and it is the mechanical run that
produced 190 survivors.

## Reproduce

```sh
node repo/verify/conformance/run_conformance.mjs \
  --out <dir>            # PB_CLIENT and PB_DEFINITION override the default paths
```

The runner writes `RESULTS.tsv` (one row per case: id, digest, sig, expected, got, status,
construction), `SUMMARY.json` (identity, per-verdict tally, up to 400 failure records) and
prints the four totals. It refuses to invent a verdict: a case that throws is recorded as
`THREW` with its stack, never as a pass.
