2026-08-21 CRYPTO VERIFICATION ARTIFACTS — CURATED

This package removes artifacts from the earlier handoffs that were redundant,
misleading, superseded, or rejected.

REMOVED
- the rejected sandbox terminal-completeness calculus and its manifests;
- redundant prior handoff/frontier ZIPs;
- the misleading partially-populated sibling Lean-closure directory;
- status prose that framed the 128-declaration target as literal zero-axiom closure;
- duplicate wrappers where the underlying evidence is already preserved directly.

KEPT
- original Lean sources and ground-truth inputs;
- actual compiled ECDSAP256.olean and SHA256.olean outputs;
- raw GitHub Actions evidence;
- SHA-512 independent validation;
- ML-KEM-768 forensic reproduction/classification;
- the complete 120-file atomic Lean package, preserved as its original ZIP and extracted;
- the 128-declaration theorem proof-tactic audit.

CURRENT CLAIM BOUNDARY
- ECDSAP256 and SHA256 base modules compiled under the documented compatibility working-copy conditions.
- SHA-512 supplied vectors were independently reproduced.
- ML-KEM-768 supplied vectors were forensically reproduced and classified.
- The 128 theorem declarations are fully enumerated.
- 109/128 declarations use native_decide and therefore are NOT strict empty-axiom proofs as written.
- 19/128 declarations do not use native_decide and require actual kernel/axiom audit before any strict zero-axiom claim.
- The 120 atomic Lean files are present in the preserved nested package and their hashes match ATOMIC_MATRIX.json.
- No claim is made here that the 109 native_decide theorems have already been rewritten or discharged without native_decide.
