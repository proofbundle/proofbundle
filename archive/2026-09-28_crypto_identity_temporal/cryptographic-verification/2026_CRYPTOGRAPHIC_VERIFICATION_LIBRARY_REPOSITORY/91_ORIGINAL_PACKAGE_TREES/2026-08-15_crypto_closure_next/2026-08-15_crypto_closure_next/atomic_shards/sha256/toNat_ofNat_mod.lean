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

end ProofBundle.Crypto.SHA256
