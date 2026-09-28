# Independent Verification Report

**Subject:** ProofBundle crypto corpus — ground truth vectors and formal artifacts
**Date:** 2026-08-17
**Verifier:** Third-party recomputation using implementations not authored by the bundle author
**Scope:** Ground-truth known-answer vectors; Coq axiom audit; Lean proof-method census

---

## Summary

Seventy-one known-answer vectors were recomputed against three independent
implementations. All seventy-one matched. Formal artifacts were audited
separately and are reported by proof method, since the corpus mixes
kernel-checked proofs with compiler-trusted evaluation and these carry
different assurance.

---

## 1. Ground truth — independently reproduced

| Primitive | Vectors | Independent implementation | Result |
|---|---|---|---|
| SHA-256 | 22 published + 24 hostile | CPython `hashlib` | 46/46 match |
| ECDSA P-256 | 9 | `python-ecdsa` 0.19.2 | 9/9 match |
| Ed25519 | 16 | `pyca/cryptography` 46.0.6 | 16/16 match |

**ECDSA detail.** For each of the nine vectors, three quantities were
independently regenerated and compared:

- RFC 6979 §3.2 deterministic nonce `k` — 9/9
- Signature pair `(r, s)` — 9/9
- Public key from scalar multiplication `d·G` — 9/9

**Ed25519 detail.** Public key derivation and signature generation, 16/16,
including length-boundary cases at 63, 64, 65, 255 and 1024 bytes.

**SHA-256 detail.** Cited sources — FIPS 180-4 examples 1–5 and NIST CAVP
`SHA256ShortMsg` — were confirmed to produce the recorded digests.

### Reproduction

```python
import json, hashlib
from ecdsa import NIST256p
from ecdsa.rfc6979 import generate_k
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

# SHA-256
d = json.load(open('ground_truth_4.json'))
for x in d['vectors'] + d['hostile']:
    assert hashlib.sha256(bytes.fromhex(x['message_hex'])).hexdigest() == x['expected'].lower()

# ECDSA P-256
d = json.load(open('ground_truth_3.json'))
for x in d['vectors']:
    priv = int(x['private_key'], 16)
    h = hashlib.sha256(bytes.fromhex(x['message']) if x['message'] else b'').digest()
    assert generate_k(NIST256p.order, priv, hashlib.sha256, h) == int(x['k_rfc6979'], 16)
    P = priv * NIST256p.generator
    assert (P.x(), P.y()) == (int(x['public_key_x'], 16), int(x['public_key_y'], 16))

# Ed25519
d = json.load(open('ed25519_ground_truth.json'))
for x in d['vectors']:
    sk = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(x['secret_key']))
    assert sk.public_key().public_bytes_raw().hex() == x['public_key'].lower()
    assert sk.sign(bytes.fromhex(x['message']) if x['message'] else b'').hex() == x['signature'].lower()
```

---

## 2. Ground truth — not externally anchored

**ML-KEM 512 / 768 / 1024.** The bundle labels these as a *naive
negacyclic-convolution model, self-consistent FIPS 203 structure*. This is
accurate and was disclosed by the author.

Confirmed correct: parameter sets (K = 2/3/4, η₁ = 3/2/2, d_u = 10/10/11,
d_v = 4/4/5) and encoded byte lengths (ek 800/1184/1568, ct 768/1088/1568,
ss 32). The three parameter sets are genuinely distinct, not copies.

Not established: agreement with NIST ACVP vectors. These KATs test internal
self-consistency, not FIPS 203 conformance. Conformance requires running
against the published ACVP set.

---

## 3. Formal artifacts, by assurance level

### 3.1 Kernel-checked — Coq

161 objects across 7 modules. `Print Assumptions` emitted for every one;
all report *Closed under the global context*, with zero non-closed lines.
`Qed` counts in source match audit-log line counts module by module.

| Module | Objects |
|---|---|
| TrackB | 43 |
| Structural | 40 |
| Hardening | 22 |
| Phronesis | 20 |
| Dimensional | 16 |
| Recovery | 10 |
| BoundaryPredicates | 10 |

Substance varies. `T1_DAG_acyclicity` performs genuine reachability
reasoning — path decomposition on the inserted edge, case analysis,
composition via `reach_trans`. By contrast, all ten `BoundaryPredicates`
theorems have the form `A ∧ B → B` with proof `exact (snd H)`; the content
resides in the definitions and the theorems re-export it. Recommend
partitioning the 161 by whether the proof body does work beyond `unfold`
plus projection.

### 3.2 Kernel-checked — Lean

`crypto_sha2_zero_axiom`: 114 theorems, closed by 120 `rfl` and 186
`decide`, with 3 `native_decide`. `rfl` and `decide` reduce in the kernel
and do not introduce axioms.

**Documented self-correction.** The bundle preserves a defective
predecessor with a written diagnosis: array indexing via `a[i]!` invokes
`panic!`, implemented in Lean core via `sorryAx`, silently violating the
stated zero-axiom boundary. Repair replaced `Array` with `Vec α n` and
`a[i]!` with `Vec.get ⟨i, proof⟩`, carrying the safety invariant in the
type. Both pre- and post-repair SHA-256 hashes are recorded. This is a
genuine audit finding, found and disclosed by the author.

### 3.3 Compiler-trusted — Lean `native_decide`

| File | Theorems | via `native_decide` |
|---|---|---|
| ECDSAP256Theorems | 55 | 55 |
| Ed25519Theorems | 59 | 59 |
| ECDSAP256Hostile | 27 | 27 |

`native_decide` compiles the proposition to native code, executes it, and
accepts the result. It introduces `Lean.ofReduceBool` and
`Lean.trustCompiler` into the dependency set and bypasses kernel checking.
The trusted base becomes the Lean compiler, the C toolchain, the runtime,
and any `@[extern]` or `@[implemented_by]` override.

**These file headers state "no `sorry`, no `admit` and no `axiom`."** That
holds at the token level but not at the dependency level. No `#print
axioms` command appears in any of the 87 Lean files in the bundle.

**Recommended action.** Run `#print axioms` on one representative theorem
per file and record the output. Expected result is *depends on axioms*, not
*does not depend on any axioms*.

Semantically these are known-answer tests expressed in theorem syntax:
each asserts a point evaluation at fixed literals. Given §1, the values
being tested are correct. No theorem in these files states a universally
quantified property of the scheme — no soundness result, no
verify-accepts-iff-valid, no specification conformance.

---

## 4. Findings requiring correction

**4.1 `mu_barrett` is wrong in `mlkem768.lean`.** The Barrett constant
should be ⌊2³²/3329⌋ = 1290167 = 0x13AFB7. Three inconsistent values appear:

| Source | Value | Correction steps required |
|---|---|---|
| Correct | 1290167 | 1 |
| Comment, decimal | 1289923 | 1 |
| Comment, hex `0x13A723` | 1287971 | 6 |
| Compiled bit literal | 1274423 | 41 |

The comment's own decimal and hexadecimal disagree, and neither matches the
bits compiled into the definition. `modq_reduce_once` performs exactly one
conditional subtraction, so `modq_mul` silently returns values up to ~41q
rather than a reduced residue.

**4.2 `mlkem768.lean` contains no theorems.** 430 definitions, zero
theorems. The header claim of zero axioms is vacuously true of a file with
no proofs. `mlkem768_keygen`, `mlkem768_encaps` and `mlkem768_decaps` return
hardcoded zero values with their algorithms written as comments; the file's
own footer describes the state as skeletal.

**4.3 Aggregate entry counts are not theorem counts.** A figure of 1,036,024
identified entries derives from grep extraction over a concatenated source
corpus and includes repeated matches of the same declaration. It is not
comparable to a count of compiled, independently verified theorems. The
verified figure is 161 (Coq, kernel-checked) plus 114 (Lean, kernel-checked)
plus 141 (Lean, compiler-trusted known-answer tests).

---

## 5. Terminology

The corpus applies one word to three assurance levels. Separating them
strengthens every individual claim:

- **Kernel-verified** — 161 Coq objects, 114 Lean objects
- **Tested against independently confirmed vectors** — 141 Lean
  `native_decide` known-answer tests over the 71 vectors verified in §1
- **Self-consistent, not externally anchored** — ML-KEM vectors

---

## 6. Recommended next steps

1. Run `#print axioms` across the Lean theorem files; publish the output as-is.
2. Retitle `native_decide` files as conformance test suites rather than proofs.
3. Fix `mu_barrett`; add a `decide`-checked theorem pinning the constant.
4. Run ML-KEM against the NIST ACVP vector set to establish conformance.
5. Partition the 161 Coq objects by whether the proof does work beyond projection.
6. Obtain review from a cryptographer or a Lean/Coq practitioner. The
   verification in §1 is reproducible in under a minute by any third party
   and is a suitable opening artifact for that request.
