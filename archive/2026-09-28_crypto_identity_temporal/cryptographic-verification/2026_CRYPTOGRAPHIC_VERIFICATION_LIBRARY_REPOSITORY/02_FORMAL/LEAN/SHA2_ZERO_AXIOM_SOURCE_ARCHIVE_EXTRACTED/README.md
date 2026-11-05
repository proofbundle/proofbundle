
# Zero-Axiom SHA-2 Family in Lean 4

A complete, zero-axiom implementation of the SHA-2 family (SHA-224, SHA-256,
SHA-384, SHA-512) and HMAC-SHA256 in Lean 4. Every array access is
bounds-checked via `Fin n` indices. No `panic!`, no `sorry`, no `admit`,
no `classical`, no `propext`.

## Algorithms

| Algorithm | Block Size | Digest Size | Status |
|-----------|-----------|-------------|--------|
| SHA-256   | 512 bits  | 256 bits    | Complete with HMAC |
| SHA-512   | 1024 bits | 512 bits    | Complete |
| SHA-224   | 512 bits  | 224 bits    | Complete (truncated SHA-256) |
| SHA-384   | 1024 bits | 384 bits    | Complete (truncated SHA-512) |
| HMAC-SHA256 | 512 bits | 256 bits   | Complete |

## Structure

```
Crypto/
  Vec.lean              -- Fixed-size vectors with intrinsic size invariants
  Util.lean             -- Hex encoding, byte utilities
  SHA256/
    Core.lean           -- Word ops, constants, state, round, schedule, block
    Hash.lean           -- Padding, block extraction, full iterative hash
    HMAC.lean           -- HMAC-SHA256 with fixed-size key blocks
    Properties.lean     -- Structural and algebraic theorems
    TestVectors.lean    -- FIPS 180-4 and RFC 4231 test vectors
    Defective.lean      -- Preserved flawed predecessor (see below)
  SHA224/
    Core.lean           -- SHA-224 initial values and truncation
    Hash.lean           -- Full SHA-224 hash
  SHA512/
    Core.lean           -- SHA-512 core (64-bit words, 80 rounds)
    Hash.lean           -- Padding, block extraction, full hash
    TestVectors.lean    -- SHA-512 test vectors
  SHA384/
    Core.lean           -- SHA-384 initial values and truncation
    Hash.lean           -- Full SHA-384 hash
```

## Build

```bash
lake build
lake exe test-sha256
lake exe test-sha512
```

## Verify Zero Axioms

In a Lean REPL or file:

```lean
import Crypto.SHA256.HMAC
import Crypto.SHA512.Hash

#print axioms sha256_size
#print axioms sha512_size
#print axioms hmacSha256_size
#print axioms paddingLength_spec
#print axioms processBlock_size
```

Expected: no `sorryAx`, no `Classical.choice`, no `Quot.sound`, no `propext`.

## Architecture

- **Vec α n**: A dependent vector carrying a proof that `data.size = n`.
  Access is via `Fin n`, eliminating all out-of-bounds paths.
- **Block / Block512**: `Vec Word 16` — exactly one 512-bit or 1024-bit block.
- **Digest / Digest512**: Fixed-size output vectors.
- **expandSchedule / expandSchedule512**: Fuel-based recursion with invariant
  `i + fuel = 64` (or 80). Every schedule word is constructed with a proof
  that its index is valid.
- **padMessage / padMessage512**: Proven to always produce a multiple of the
  block size.
- **HMAC**: Key is padded to exactly 64 bytes via `padTo64`. Inner and outer
  keys are `Vec UInt8 64`. XOR is structurally total.

## Defective Predecessor

An earlier version used the `!` panic operator for array access:
`H[0]!`, `K[i]!`, `W[i - 2]!`. This introduced `panic!`, which is implemented
via an axiom in Lean core, violating the stated zero-axiom boundary.

The corrected version replaces all `!` access with `Fin`-indexed `get` on
fixed-size `Vec` types. The defective file is preserved in
`Crypto/SHA256/Defective.lean` as provenance.

## Test Vectors

- SHA-256: Empty, "abc", 56-byte string, 1,000,000 'a' characters (FIPS 180-4)
- SHA-512: Empty, "abc" (FIPS 180-4)
- HMAC-SHA256: RFC 4231 Test Cases 1 and 2
