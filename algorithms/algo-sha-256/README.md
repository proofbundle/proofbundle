# SHA-256

**Family:** DIGEST  
**Status:** ACTIVE  
**License:** AGPL-3.0-or-later (copyleft)

## Structure

- `src/` - Reference implementations (C, Rust, Python, JavaScript)
- `proofs/` - Formal proofs in Lean 4, Rocq, F*, Isabelle
- `vectors/` - Test vectors (standard and hostile)
- `ground-truths/` - Ground truth verification package
- `zk-proofs/` - Zero-knowledge proofs
- `docs/` - Documentation and specifications

## Requirements

- Zero axioms in formal proofs
- Zero sorry/admit in formal proofs
- Comprehensive hostile test vectors
- Complete ground truth package
- ZK proofs of correctness and security

## Verification

```bash
# Verify formal proofs
cd proofs/lean && lake build
cd proofs/rocq && coq_makefile -f _CoqProject && make
cd proofs/fstar && fstar.exe *.fst
cd proofs/isabelle && isabelle build -D .

# Run test vectors
cd vectors && ./run-all.sh

# Verify ground truths
cd ground-truths && ./verify.sh

# Verify ZK proofs
cd zk-proofs && ./verify.sh
```
