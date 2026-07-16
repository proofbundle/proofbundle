# Contributing

Thanks for your interest in ProofBundle.

- **Bugs / security:** for anything security-sensitive, use the private advisory flow in
  [SECURITY.md](SECURITY.md). For ordinary bugs, open an issue with steps to reproduce.
- **The engine is a single file** (`proofbundle.html`). Any change must keep the built-in
  self-test at a full pass — CI runs it on every push and blocks merges that don't.
- **No new cryptographic claims without vectors.** If you add an algorithm or outcome,
  add conformance coverage for it.
- Commits should be signed where possible so they show as Verified.
