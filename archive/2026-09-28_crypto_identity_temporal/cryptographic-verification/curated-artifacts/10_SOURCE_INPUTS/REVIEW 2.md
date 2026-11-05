# Hostile Review — SHA-256 Lean 4 Proof Bundle

Scope: `SHA256.lean`, `SHA256Theorems.lean`, `SHA256Hostile.lean` (Lean 4 stable, `import Std`, no Mathlib).
Method: line-by-line audit + independent recomputation of every constant and every expected digest with a reference SHA-256/HMAC implementation (Python `hashlib`/`hmac`). No Lean toolchain was present in the environment, so proofs were checked by hand; residual risks are noted.

## SHA256.lean — 2 defects (FIXED)

1. **[Line 480] Wrong constant in `natToBe64` byte 0 — semantic FIPS bug.**
   `UInt8.ofNat (n / 72057594037929036)` used 72057594037929036, but 2^56 = **72057594037927936** (digits transposed: ...929036 vs ...927936).
   Impact: (a) for any bit length ≥ 2^56 the most significant length-field byte is wrong (FIPS 180-4 §5.1.1 violation — latent, unreachable at realistic sizes); (b) it made the theorem `natToBe64_mod_inj` in SHA256Theorems.lean **false** — counterexample with the wrong constant: `natToBe64 0 = natToBe64 (2^56)` (both byte-0 quotients are 0), yet `0 % 2^64 ≠ 2^56 % 2^64`, so the closing `omega` would fail (unprovable).
   **Fix applied:** `72057594037929036` → `72057594037927936`.

2. **[Line 1060] Wrong comment in Appendix A.5.** "padZeros 56 = 55" — actually `padZeros 56 = (64 - (56+9)%64)%64 = 63` (matches the block dump immediately below the comment, which shows 63 zero bytes).
   **Fix applied:** comment changed to `padZeros 56 = 63`.

Everything else audited clean:
- `K` table (lines 163–292): all 64 constants match FIPS 180-4 §4.2.2 (machine-checked against the reference table).
- `H0` (lines 311–328): all 8 words match §4.2.1.
- `rotr`/`shr` (lines 88–96): shift-composition rotation is the documented fallback; all rotation amounts are in (0,32), so the expansion is exact. `UInt32.shiftLeft/shiftRight` exist in core; `32 - n` is `UInt32` subtraction — fine.
- `ch`, `maj`, `bigSigma0/1`, `smallSigma0/1` (lines 104–143): match FIPS equations 4.2–4.7 exactly (rotation amounts 2/13/22, 6/11/25, 7/18/SHR3, 17/19/SHR10 ✓).
- `schedule` (373–385): W[0..15] big-endian via `bytesToWord` (MSB-first shifts 24/16/8/0 ✓); recurrence `σ1(W[t-2]) + W[t-7] + σ0(W[t-15]) + W[t-16]` ✓; `get!` indices in bounds for t ∈ [16,64) ✓.
- `round` (411–430): T1 = h + Σ1(e) + Ch(e,f,g) + K + W, T2 = Σ0(a) + Maj(a,b,c); rotation of variables and e := d+T1, a := T1+T2 ✓. `Fin 8` application and `if i = 0` chains elaborate (DecidableEq instance); `round_uses_temps`' `⟨rfl, rfl⟩` should hold definitionally (literals reduce through the Decidable instances) — see residual risk note.
- `compress` (438–446): 64-round fold + feed-forward `s i + st i` ✓.
- `padZeros` (470): `(64 - (n+9)%64)%64` correct for 0x80 + zeros + 8-byte length (verified at boundaries 0, 55, 56, 63, 64, 119, 120).
- `padList` (493): message ++ [0x80] ++ zeros ++ BE64(8·len) ✓ per §5.1.1.
- `hashBlocksAux`/`hashBlocks`: fuel `len/64 + 1` sufficient; blocks taken in order ✓.
- `wordToBytes`/`stateToBytes`: big-endian, 32 bytes ✓.
- Hex utilities: `nibbleChar`, `hexVal` (0-9: 48–57; a-f: 97–102, -87; A-F: 65–70, -55 ✓), `hexDecode` two chars/byte high-nibble-first ✓.
- `hmacSha256` (635): key-hashing branch `64 < key.size`, right zero-pad to 64, ipad 0x36 / opad 0x5c ✓ RFC 2104. `64 - klist.length` can't underflow (length ≤ 64 after hashing) ✓.
- `Array.mkArray` argument order (n, v) correct everywhere; `List.range n : List Nat` mapped with `.toUInt8` correct; `String.toUTF8 : String → ByteArray` used correctly; no ByteArray/Array coercion misuse (`ByteArray.mk (Array.mk l)` used consistently).

## SHA256Theorems.lean — 1 defect (FIXED)

1. **[Line 138] Same transposed constant inside `natToBe64_mod_inj`.** `have g0 : a / 72057594037929036 % 256 = ...` had to track the (wrong) `natToBe64`; after fixing the constant both sides are consistent and the digit decomposition g0..g7 (2^56, 2^48, …, 2^0 — all verified correct) determines `a % 2^64`.
   **Fix applied:** both occurrences on line 138 → `72057594037927936`.

Everything else audited clean:
- `size_ByteArray_mk`, `toList_Array_mk`, `natToBe64_length`, `stateToBytes_length`, `K_size`, `H0_size`: hold definitionally (`rfl`) — list shapes are concrete literals; `Array.size`/`ByteArray.size` reduce to `toList.length`.
- `padZeros_lt` (`unfold; omega`), `padList_length` (`simp; omega`), `pad_size` (rw chain closes by rfl), `pad_length_multiple_of_64` (`unfold padZeros; omega`): all valid tactic usage for linear mod arithmetic.
- `append_cancel_aux`: structural recursion on `l1`; case analysis correct; core lemma names `List.length_eq_zero`, `List.cons_append` valid.
- `toNat_ofNat_mod` := `UInt8.toNat_ofNat'` (exists in core; `UInt8.size` reduces to 256 definitionally).
- `pad_injective`: argument structure sound — equal paddings ⇒ equal bit lengths mod 2^64 (via `natToBe64_mod_inj`) + zero-run < 64 ⇒ equal lengths (`omega`), then three rounds of append cancellation; `rw [e1, e2, hml]` rebuilds the ByteArrays correctly (structure eta).
- All 4 FIPS/CAVP vectors, 17 generated KATs (katMsg byte i = (11+37i) mod 256), RFC 4231 case 1, the 100-byte-key HMAC vector, double-SHA-256 of "", and `sha256Chain "abc" 3`: **recomputed independently — all 24 expected values match a reference implementation exactly.**
- `native_decide` applicability: every such theorem is a closed equality of `String`/`ByteArray` with `DecidableEq`, no free variables — applicable. The two 10^6-byte vectors are heavy but evaluable natively.

## SHA256Hostile.lean — 0 defects (PASS)

- All 24 hostile vectors: message constructions (`Array.mkArray`, `List.range` maps, `patMsg n step`, `hexDecode` literals) re-derived and every expected digest recomputed against a reference implementation — **all 24 match** (incl. `million_a`, `sequential_0_255` ascending/descending, `alternating_aa_55_100`, `patMsg 1000 13`, `patMsg 4096 7`).
- Padding-analysis doc comments (zero-byte counts, block counts) verified against `padZeros` for every vector: all correct (e.g. len_56 → 63 zeros/2 blocks; len_119 → 0 zeros/2 blocks; len_4096 → 55 zeros/65 blocks).
- `fun i => if i % 2 = 0 then 0xaa else 0x55` elaborates to `UInt8` via the `ByteArray.mk (Array.mk …)` expected type ✓; `(255 - i).toUInt8` ✓.
- All `native_decide` goals are closed `ByteArray` equalities — applicable.

## Fixes applied (recorded)

| File | Line | Change |
|---|---|---|
| SHA256.lean | 480 | `72057594037929036` → `72057594037927936` (2^56) |
| SHA256Theorems.lean | 138 | both occurrences `72057594037929036` → `72057594037927936` |
| SHA256.lean | 1060 | comment `padZeros 56 = 55` → `padZeros 56 = 63` |

## Residual risks (no Lean toolchain available to compile)

- `round_uses_temps` (SHA256.lean:688) relies on `rfl` reducing `if`-chains over `Fin 8` literals through Decidable instances — expected to work but not machine-verified.
- `natToBe64_mod_inj`'s closing `omega` (div/mod by constants 2^56..2^0 → equality mod 2^64) is standard omega territory but not machine-verified.
- `simpa [pad, toList_Array_mk] using congrArg Array.toList e` in `pad_injective` relies on simp reducing structure projections of constructors — expected, not machine-verified.

VERDICT: FAIL (3 defects) — all fixed in place; files expected to compile and all test vectors verified against reference implementations.
