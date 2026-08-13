# Crypto Core Formalization Roadmap (Rocq / Coq)

**Goal:** Derive the ProofBundle crypto-core primitives from first principles in
Rocq/Coq 8.18+ with **0 axioms, 0 `Admitted`, 0 `sorry`, 0 opaque definitions,
and 0 classical axioms**.  Every theorem must close with
`Print Assumptions` reporting `Closed under the global context`.

**Reference snapshot:**
`/media/falsealias/BACKUP/C-Backup/Users-falsealias/crypto_core_active/crypto-core/*.mjs`
plus the HTML status page (`proofbundle-crypto-core.html`).

---

## 1. Why Rocq/Coq is the right vehicle here

- The existing `src/proofbundle/coq/` project already enforces the required
  discipline: `Makefile` checks `Print Assumptions`, rejects
  `propositional_extensionality`, `functional_extensionality`, `classic`, and
  `proof_irrelevance`, and currently reports **83 theorems, 0 axioms**.
- Coq's stdlib (`Arith`, `List`, `Bool`, `Lia`, `ZArith`) is sufficient and can
  be imported without adding axioms.
- Lean 4 is installed, but a strict *zero-opaque / zero-classical* build would
  require avoiding `Init`/``Std``/`Mathlib` (they contain `opaque`, `partial`,
  quotient axioms, and `Classical.em`).  That is a larger meta-project; Lean
  remains a future port target after the Coq baseline is solid.

---

## 2. Foundational layer (Layer 0)

Files: `CryptoPrelude.v`, `Bits.v`, `Bytes.v`, `FiniteWords.v`

Definitions (all transparent, all computable):

- `byte := { n : nat | n < 256 }`  
  (or equivalently `N` with explicit bound; we keep a small, provable model.)
- `bytes := list byte`.
- `word32 := { n : nat | n < 2^32 }`.
- `word64 := { n : nat | n < 2^64 }`.
- Bitwise operations on words: `rotr32`, `rotl32`, `shiftr32`, `shiftl32`,
  `and32`, `or32`, `xor32`, `not32`.
- Modular addition / subtraction on `word32`/`word64`.
- Big-endian encoding/decoding:
  - `bytes_of_word32_be : word32 -> bytes` (length 4).
  - `word32_of_bytes_be : bytes -> option word32`.
  - `bytes_of_word64_be : word64 -> bytes` (length 8).
  - `word64_of_bytes_be : bytes -> option word64`.
- List utilities: `chunk`, `pad_to_multiple`, `flatten`, `be_bytes_of_nat`.

Theorems (sample):
- `word32_of_bytes_be_roundtrip`.
- `bytes_of_word32_be_length_4`.
- `rotr32_involutive` / `rotl32_involutive`.
- All `word32` operations return values `< 2^32`.

Axiom budget: **0**.

