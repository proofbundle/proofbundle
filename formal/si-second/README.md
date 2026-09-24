# SI-second formal record

This directory preserves the complete textual Lean/Rocq formalization record supplied in `20260924_SI_second_claude_raw.zip`, plus the later serialisation formalization and its audit. `SOURCE_MANIFEST.json` binds every imported file to its exact source member and SHA-256 digest.

`source-record/` deliberately retains successful sources, failed sketches, probes, malformed-input cases, negative controls, build logs, and correction evidence. A failed or adversarial file is evidence and is not promoted as a theorem. `CORRECTION_LEDGER.jsonl` gives those records an explicit local scope; later transcript-derived corrections append separate scoped entries rather than rewriting this record.

The HTML identity repair is carried separately in the repository history. Its two retained edits reject values outside the canonical JSON domain and preserve verifier trace fields. The proposed Ed25519 argument swap remains excluded because it broke the repository's actual verifier signature and reduced the self-test count.
