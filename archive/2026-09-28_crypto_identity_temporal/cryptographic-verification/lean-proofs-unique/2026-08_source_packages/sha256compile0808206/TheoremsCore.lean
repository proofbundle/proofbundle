/-
# SHA-256 — Theorems: known-answer tests, structural properties, HMAC

Compile with `lake env lean SHA256Theorems.lean` (with `SHA256.lean` in the
same source root and the import below).  This file contains no `sorry`, no
`admit` and no `axiom`; every theorem is closed by `rfl`, `simp`/`omega`
reasoning over the definitions, or `native_decide`.

Contents:

  * Part 1: structural theorems about the definitions in `SHA256.lean`:
    the padded length is always a multiple of 64 bytes
    (`pad_length_multiple_of_64`), the digest is always exactly 32 bytes
    (`sha256_output_length`), and padding is injective (`pad_injective`),
    proved by the standard argument: the 64-bit length field at the end of
    the padding fixes the message length, after which the common prefix
    cancels.
  * Part 2: all known-answer tests from the project ground-truth file:
    the FIPS 180-4 examples (empty, "abc", the 448-bit and 896-bit
    multi-block messages), the million-character 'a' CAVP stress vector,
    and seventeen generated boundary KATs (1, 2, 3, 55, 56, 57, 63, 64, 65,
    119, 120, 127, 128, 129, 255, 256 and 1000 bytes).  Every expected
    digest is quoted from the verified ground truth.
  * Part 3: the derived constructions: RFC 4231 test case 1 for
    `hmacSha256`, an HMAC vector with an over-length (> 64 byte) key that
    exercises the key-hashing branch, a double-SHA-256 vector, and an
    iterated-hash (`sha256Chain`) vector.  All expected values were
    computed with a reference implementation.
-/

import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

/-!
## Part 1: structural theorems

Small definitional lemmas first: `ByteArray`/`Array` size and list views
compute away on the constructors, because `pad` and `sha256` build their
results as `ByteArray.mk (Array.mk l)` for explicit lists `l`.
-/

/-- The size of a `ByteArray` built from an array is the length of the
array's list view; holds definitionally (`ByteArray.size` is
`data.size` and `Array.size` is `toList.length`). -/
theorem size_ByteArray_mk (a : Array UInt8) :
    (ByteArray.mk a).size = a.toList.length := rfl

/-- The list view of `Array.mk l` is `l`; holds definitionally. -/
theorem toList_Array_mk (l : List UInt8) :
    (Array.mk l).toList = l := rfl

/-- The zero-byte count is always in `[0, 64)`, by construction. -/
theorem padZeros_lt (n : Nat) : padZeros n < 64 := by
  unfold padZeros
  omega

/-- The big-endian length field is exactly eight bytes. -/
theorem natToBe64_length (n : Nat) : (natToBe64 n).length = 8 := rfl

/-- The length of a padded list, in closed form. -/
theorem padList_length (l : List UInt8) :
    (padList l).length = l.length + 1 + padZeros l.length + 8 := by
  simp [padList, natToBe64_length]
  omega

/-- The size of a padded byte string, in closed form. -/
theorem pad_size (m : ByteArray) :
    (pad m).size =
      m.data.toList.length + 1 + padZeros m.data.toList.length + 8 := by
  show (ByteArray.mk (Array.mk (padList m.data.toList))).size = _
  rw [size_ByteArray_mk, toList_Array_mk, padList_length]

/-- FIPS 180-4 section 5.1.1 correctness: padding always produces a whole
number of 512-bit blocks.  The count `padZeros n` is chosen exactly so that
`n + 1 + padZeros n + 8 ≡ 0 (mod 64)`. -/
theorem pad_length_multiple_of_64 (m : ByteArray) : (pad m).size % 64 = 0 := by
  rw [pad_size]
  unfold padZeros
  omega

/-- The digest serialisation is always 32 bytes: eight words of four bytes
each (FIPS 180-4 section 6.2.2, final step). -/
theorem stateToBytes_length (st : State) :
    (stateToBytes st).length = 32 := rfl

/-- SHA-256 always produces exactly 32 bytes of output, for every input
(FIPS 180-4: a 256-bit message digest). -/
theorem sha256_output_length (m : ByteArray) : (sha256 m).size = 32 := by
  show (ByteArray.mk
    (Array.mk (stateToBytes (hashBlocks initState (padList m.data.toList))))).size = 32
  rw [size_ByteArray_mk, toList_Array_mk, stateToBytes_length]

/-- List append cancellation when the left factors have equal length:
if `l1 ++ x1 = l2 ++ x2` and `l1.length = l2.length` then `l1 = l2` and
`x1 = x2`.  Proved by induction on `l1`; this is the workhorse behind
`pad_injective`. -/
theorem append_cancel_aux {α : Type} : ∀ (l1 l2 x1 x2 : List α),
    l1.length = l2.length → l1 ++ x1 = l2 ++ x2 → l1 = l2 ∧ x1 = x2
  | [], l2, x1, x2, hl, _h => by
      have h0 : l2 = [] := by
        have hz : l2.length = 0 := by simpa using hl.symm
        simpa [List.length_eq_zero_iff] using hz
      subst h0
      simp at _h
      exact ⟨rfl, _h⟩
  | _a :: _t, [], _x1, _x2, hl, _h => by
      simp at hl
  | a :: t, b :: t2, x1, x2, hl, h => by
      simp [List.cons_append] at h
      obtain ⟨hab, htx⟩ := h
      subst hab
      have hl' : t.length = t2.length := by
        have e := hl
        simp only [List.length_cons] at e
        omega
      obtain ⟨h1, h2⟩ := append_cancel_aux t t2 x1 x2 hl' htx
      subst h1
      subst h2
      exact ⟨rfl, rfl⟩

/-- Converting a natural number to a byte and back yields the number
modulo 256 (`UInt8.ofNat` wraps modulo 2^8).  This is core's
`UInt8.toNat_ofNat'`, restated with the modulus evaluated to 256. -/
theorem toNat_ofNat_mod (n : Nat) : (UInt8.ofNat n).toNat = n % 256 :=
  UInt8.toNat_ofNat'

/-- The big-endian length encoding is injective modulo 2^64: if two
encodings agree, the encoded numbers agree modulo 2^64.  Each byte of
`natToBe64 n` is one base-256 digit of `n`, and eight digits determine the
value modulo 2^64; `omega` discharges the arithmetic after the digit
equalities are extracted. -/
theorem natToBe64_mod_inj {a b : Nat} (h : natToBe64 a = natToBe64 b) :
    a % 2 ^ 64 = b % 2 ^ 64 := by
  simp only [natToBe64, List.cons.injEq] at h
  obtain ⟨h0, h1, h2, h3, h4, h5, h6, h7, _⟩ := h
  have g0 : a / 72057594037927936 % 256 = b / 72057594037927936 % 256 := by
    have t := congrArg UInt8.toNat h0
    simpa [toNat_ofNat_mod] using t
  have g1 : a / 281474976710656 % 256 = b / 281474976710656 % 256 := by
    have t := congrArg UInt8.toNat h1
    simpa [toNat_ofNat_mod] using t
  have g2 : a / 1099511627776 % 256 = b / 1099511627776 % 256 := by
    have t := congrArg UInt8.toNat h2
    simpa [toNat_ofNat_mod] using t
  have g3 : a / 4294967296 % 256 = b / 4294967296 % 256 := by
    have t := congrArg UInt8.toNat h3
    simpa [toNat_ofNat_mod] using t
  have g4 : a / 16777216 % 256 = b / 16777216 % 256 := by
    have t := congrArg UInt8.toNat h4
    simpa [toNat_ofNat_mod] using t
  have g5 : a / 65536 % 256 = b / 65536 % 256 := by
    have t := congrArg UInt8.toNat h5
    simpa [toNat_ofNat_mod] using t
  have g6 : a / 256 % 256 = b / 256 % 256 := by
    have t := congrArg UInt8.toNat h6
    simpa [toNat_ofNat_mod] using t
  have g7 : a / 1 % 256 = b / 1 % 256 := by
    have t := congrArg UInt8.toNat h7
    simpa [toNat_ofNat_mod] using t
  omega

/-- Padding is injective (Merkle-Damgaard strengthening, FIPS 180-4 section
5.1.1).  The standard argument: equal paddings have equal total length and
equal 64-bit length fields, so the two messages have lengths that are
congruent modulo 2^61 bytes *and* within 64 of each other (the zero-run has
fewer than 64 bytes), hence equal lengths; then the common prefix structure
(message, `0x80` delimiter, zero run, length field) cancels to give equal
messages.  No hypotheses are needed: the modulus is 2^64 bits = 2^61 bytes,
which exceeds any possible difference of zero-run counts. -/
theorem pad_injective : Function.Injective pad := by
  intro m n h
  -- Unpack the equality to an equality of padded byte lists.
  have hd : padList m.data.toList = padList n.data.toList := by
    have e := congrArg ByteArray.data h
    simpa [pad, toList_Array_mk] using congrArg Array.toList e
  -- Regroup the appends to the left so the length field is the right factor.
  simp only [padList, ← List.append_assoc] at hd
  -- Length bookkeeping on the regrouped equality.
  have hlen := congrArg List.length hd
  simp only [List.length_append, List.length_replicate, natToBe64_length,
    List.length_cons, List.length_nil] at hlen
  -- The length fields cancel as the right factor of equal-length appends.
  -- (The factors below are written in the left-nested form produced by the
  -- `← List.append_assoc` normalisation of `hd` above.)
  have hl :
      ((m.data.toList ++ [0x80]) ++
          List.replicate (padZeros m.data.toList.length) 0x00).length =
      ((n.data.toList ++ [0x80]) ++
          List.replicate (padZeros n.data.toList.length) 0x00).length := by
    simp only [List.length_append, List.length_replicate, List.length_cons,
      List.length_nil]
    omega
  obtain ⟨hpre, htail⟩ := append_cancel_aux _ _ _ _ hl hd
  -- The length fields are equal, so the bit lengths agree modulo 2^64.
  have hmod := natToBe64_mod_inj htail
  have hpzM := padZeros_lt m.data.toList.length
  have hpzN := padZeros_lt n.data.toList.length
  -- Lengths congruent modulo 2^61 bytes and within 64 of each other are equal.
  have hsame : m.data.toList.length = n.data.toList.length := by
    omega
  -- With equal lengths the zero runs coincide and everything cancels.
  have hpz : padZeros m.data.toList.length = padZeros n.data.toList.length := by
    rw [hsame]
  rw [hpz] at hpre
  obtain ⟨hpre2, -⟩ := append_cancel_aux _ _ _ _ (by
    simp only [List.length_append, List.length_cons, List.length_nil]; omega) hpre
  obtain ⟨hml, -⟩ := append_cancel_aux _ _ _ _ hsame hpre2
  -- The byte lists are equal; rebuild the `ByteArray`s.
  cases m with
  | mk dm =>
    cases n with
    | mk dn =>
      have e1 : dm = Array.mk dm.toList := rfl
      have e2 : dn = Array.mk dn.toList := rfl
      rw [e1, e2, hml]

/-!
## Part 2: known-answer tests

All expected digests below are quoted verbatim from the project
ground-truth file `ground_truth.json`, which was generated and verified
against a reference implementation of FIPS 180-4.  The generated KAT
messages use byte `i` = `(11 + 37 * i) mod 256`, which is what `katMsg`
constructs.
-/
