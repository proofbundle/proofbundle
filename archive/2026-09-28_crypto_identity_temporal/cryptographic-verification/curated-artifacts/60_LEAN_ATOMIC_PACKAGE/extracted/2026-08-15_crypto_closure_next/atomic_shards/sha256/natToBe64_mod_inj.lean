import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

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

end ProofBundle.Crypto.SHA256
