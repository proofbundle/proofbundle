import MlKem768.Parameters
import MlKem768.Poly
import MlKem768.Ntt
import MlKem768.Sampling
import MlKem768.Encode
import MlKem768.Hash
import MlKem768.Kem
import MlKem768.KAT

/-!
# ML-KEM-768 Implementation in Lean 4

Complete specification of FIPS 203 Module-Lattice-Based Key-Encapsulation
Mechanism, security level 3 (ML-KEM-768).

## Design Principles
- Zero axioms. Zero sorries. Zero admits. Zero opaque.
- Parameterized over `HashSuite` for hash function independence.
- All definitions are total computable functions.
- All properties proven by decide, omega, or native_decide.

## File Structure
| File | Description |
|------|-------------|
| Parameters.lean | FIPS 203 constants, all proven |
| Poly.lean | Polynomial arithmetic over R_q |
| Ntt.lean | NTT/INTT with proven twiddle bounds |
| Sampling.lean | Parse, CBD, sampleUniform, sampleSmall |
| Encode.lean | Byte encoding/decoding, message encode/decode |
| Hash.lean | HashSuite structure (parameterized, no axioms) |
| Kem.lean | KeyGen, Encaps, Decaps with size proofs |
| KAT.lean | Size theorems for top-level API |

## Statistics
- Total definitions: 60+
- Theorems: 15+
- Axioms: 0
- Sorries: 0
- Admits: 0
- Opaque: 0

## Status
All core definitions complete. The KEM is fully specified.
The NTT correctness theorem (ring isomorphism) is future work
requiring the full polynomial factorization proof.
-/

namespace MlKem768
end MlKem768
