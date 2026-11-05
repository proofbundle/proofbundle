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
        simpa [List.length_eq_zero] using hz
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

/-- Message of the generated boundary KATs: `n` bytes, byte `i` equal to
`(11 + 37 * i) mod 256`.  Matches the ground-truth generator. -/
def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/
theorem kat_empty :
    sha256Hex "" =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" := by
  native_decide

/-- FIPS 180-4 example 2 / NIST CAVP: the one-block message "abc". -/
theorem kat_abc :
    sha256Hex "abc" =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" := by
  native_decide

/-- FIPS 180-4 example 3: the 448-bit (56-byte) message, which pads to two
blocks because the length field no longer fits in the first block. -/
theorem kat_fips_ex3_448bit :
    sha256Hex "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq" =
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1" := by
  native_decide

/-- FIPS 180-4 example 4: the 896-bit (112-byte) message, which pads to
three blocks. -/
theorem kat_fips_ex4_896bit :
    sha256Hex "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu" =
      "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1" := by
  native_decide

/-- NIST CAVP long-message vector: one million copies of the character 'a'
(byte 0x61).  This exercises the 64-bit length counter (8,000,000 bits)
and 15,626 compression invocations. -/
theorem kat_million_a :
    sha256 (ByteArray.mk (Array.mkArray 1000000 0x61)) =
      hexDecode "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0" := by
  native_decide

/-- Generated boundary KAT (1 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_1B : sha256 (katMsg 1) = hexDecode "e7cf46a078fed4fafd0b5e3aff144802b853f8ae459a4f0c14add3314b7cc3a6" := by
  native_decide

/-- Generated boundary KAT (2 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_2B : sha256 (katMsg 2) = hexDecode "cdc63a6325d5fa92515578c0b418e6eeec1c6d085937a24fc43c2126ea517457" := by
  native_decide

/-- Generated boundary KAT (3 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_3B : sha256 (katMsg 3) = hexDecode "b39fad1a1075f64570b3226d339ea818f9c66ecd2f1c59fd8b9c5a32b54c513f" := by
  native_decide

/-- Generated boundary KAT (55 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_55B : sha256 (katMsg 55) = hexDecode "2900465fcb533e05a158fd2b3be0e5e3b03740d83060aa3580e0d98a96bf2384" := by
  native_decide

/-- Generated boundary KAT (56 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_56B : sha256 (katMsg 56) = hexDecode "31454ff48ef36af2f08fd511bdc37d9d5855ac23e992e5ff5445cb6b7674a674" := by
  native_decide

/-- Generated boundary KAT (57 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_57B : sha256 (katMsg 57) = hexDecode "bcc0a5d3791b985b7550e04ca660a6c63a589ba1edd2283c8e110e5b515df124" := by
  native_decide

/-- Generated boundary KAT (63 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_63B : sha256 (katMsg 63) = hexDecode "5f6401b96532c36de4e65beec0409b69b1d181864c8009b7a04f43e5d56350d1" := by
  native_decide

/-- Generated boundary KAT (64 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_64B : sha256 (katMsg 64) = hexDecode "94eb5de4943613fd048dc93393ab06877405faa39c11f53e9386083339833e7e" := by
  native_decide

/-- Generated boundary KAT (65 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_65B : sha256 (katMsg 65) = hexDecode "fc518669b6eb4b4dd91827ecacef86689c725bd5bab888fd3b26dbb196eec954" := by
  native_decide

/-- Generated boundary KAT (119 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_119B : sha256 (katMsg 119) = hexDecode "b0dc41b1a384e2f1203f0351b38fbeaafceef577ce1191d5bfc25da39f721eae" := by
  native_decide

/-- Generated boundary KAT (120 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_120B : sha256 (katMsg 120) = hexDecode "5df24dd802ac26132ce608dcb5f09841eef039ee0f152acf98d26d17fe4e88e6" := by
  native_decide

/-- Generated boundary KAT (127 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_127B : sha256 (katMsg 127) = hexDecode "0fe729ff19257bd6fec853acc2ea355f6b34b58e6c0f684c3e188fcdfcd9baae" := by
  native_decide

/-- Generated boundary KAT (128 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_128B : sha256 (katMsg 128) = hexDecode "0aedd4856f8eba0963627336ad5144a9a7dbe12498e6066f0165fc97d8ddee4c" := by
  native_decide

/-- Generated boundary KAT (129 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_129B : sha256 (katMsg 129) = hexDecode "4f1757ae4bffbae86d775b831765b75af154d52f7deaa46dd378051a2d3ad57f" := by
  native_decide

/-- Generated boundary KAT (255 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_255B : sha256 (katMsg 255) = hexDecode "3c835ac0bba7147eaa568a76183d465e72ac456df24b55e01d44dc87be05a971" := by
  native_decide

/-- Generated boundary KAT (256 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_256B : sha256 (katMsg 256) = hexDecode "3ef33734daae0e353f132ff5f3241d8f86ba81f851c0b9685149f079c16eb45b" := by
  native_decide

/-- Generated boundary KAT (1000 bytes, message byte `i` = `(11 + 37*i) mod 256`,
source: generated KAT (hashlib-verified)).  Expected digest from the verified ground truth. -/
theorem kat_1000B : sha256 (katMsg 1000) = hexDecode "57799de80e3dd6e2ac4d40c41a150d1662f7f87d0d994776a2fdc37c39b0ea4e" := by
  native_decide

/-!
## Part 3: derived constructions (HMAC, double hash, hash chains)

Expected values below were computed with a reference implementation
(RFC 4231 test case 1 for the first one, which is also the well-known
published value `b0344c61...32cff7`).
-/

/-- RFC 4231 test case 1: key = 0x0b repeated 20 times, data = "Hi There".
This exercises the short-key branch of `hmacSha256` (key shorter than the
64-byte block size, zero-padded on the right). -/
theorem hmac_sha256_rfc4231_case1 :
    hmacSha256 (ByteArray.mk (Array.mkArray 20 0x0b)) (String.toUTF8 "Hi There") =
      hexDecode "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7" := by
  native_decide

/-- HMAC-SHA-256 with an over-length key (100 bytes, key `i` = `i mod 256`,
message "msg"), exercising the branch of RFC 2104 that first hashes the key
down to 32 bytes before padding.  Expected value from a reference
implementation. -/
theorem hmac_sha256_long_key :
    hexEncode (hmacSha256
        (ByteArray.mk (Array.mk ((List.range 100).map (fun i => i.toUInt8))))
        (String.toUTF8 "msg")) =
      "f85da02f25a44a117825adec49678dd31f98d263ba21680c07fd30c161cda4ec" := by
  native_decide

/-- Double SHA-256 of the empty message: `sha256 (sha256 "")`.  Expected
value from a reference implementation. -/
theorem double_sha256_empty :
    hexEncode (doubleSha256 (String.toUTF8 "")) =
      "5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456" := by
  native_decide

/-- Iterated hashing: `sha256` applied three times to "abc"
(`sha256Chain "abc" 3`).  Expected value from a reference implementation. -/
theorem sha256_chain_abc_3 :
    hexEncode (sha256Chain (String.toUTF8 "abc") 3) =
      "f2a778f1a6ed3d5bc59a5d79104c598f3f07093f240ca4e91333fb09ed4f36da" := by
  native_decide

end ProofBundle.Crypto.SHA256
