# Formal proof scope

The Coq layer proves small protocol invariants. It does not prove primitive
security or establish a refinement relation to the JavaScript.

## Checked files and theorem groups

| File | Proven model properties | Printed closed checks |
|---|---|---:|
| `ProofBundleRegistry.v` | deterministic lookup, unknown fail-closed, active/legacy/review policy, exact resolved-profile arity | 6 |
| `ProofBundleHybrid.v` | exact ordered classical/PQ acceptance, both-required non-compensability, reversal rejection, protected-header and payload binding | 6 |
| `ProofBundleMerkle.v` | deterministic symbolic commitment, empty/leaf/node domain separation, symbolic injectivity, structural tamper detection, ordered inclusion reconstruction | 8 |
| `ProofBundleVerifier.v` | all gates necessary/sufficient, verdict exclusivity, missing-payload scope, fuel/resource bound, signature failure gate | 6 |

Every printed theorem reported `Closed under the global context` in the included
JSCoq logs. The hygiene checker rejects `Axiom`, `Axioms`, `Parameter`,
`Parameters`, `Hypothesis`, `Hypotheses`, `Admitted`, and `admit` commands after
removing nested comments.

## What the models mean

- The registry model demonstrates the intended fail-closed control flow for
  exact identifiers and creation-policy states.
- The hybrid model makes all-of-two acceptance and component order structural.
  Signed-object binding uses an injective constructor model.
- The Merkle model uses a free symbolic digest algebra. Its injectivity theorem
  demonstrates unambiguous leaf/node/empty construction. It is not a
  collision-resistance proof for a real hash.
- The verifier model treats checks as Boolean gates and proves that success
  requires every gate. A list checker proves accepted work cannot exceed its
  supplied fuel.

## Explicit non-goals

- Computational, game-based, or reduction proofs for cryptographic primitives.
- A proof that the local hybrid KEM is secure under any named composition
  theorem.
- Parser correctness for all CBOR, JSON, ASN.1, X.509, or container inputs.
- Extraction of executable code from Coq.
- A verified compiler or verified Node/OpenSSL runtime.
- A machine-checked correspondence between source functions and Coq
  definitions.
- A legal proof of evidence authenticity or admissibility.

## Recheck

Native Coq compilation:

```sh
cd proofs/coq
make
```

Headless JSCoq type-check:

```sh
JSCOQ=/absolute/path/to/jscoq npm run proofs:jscoq
```

The JSCoq script uses `Load`, not the defective JSCoq 0.17.1 `--compile`
wiring. It records version, command, exit status, theorem assumption notices,
stdout, and stderr under `evidence/proof-checks/`.

An independent reviewer should additionally define and prove a refinement map
from canonical JavaScript objects/branches to these models before describing
the implementation itself as formally verified.
