import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem kat_fips_ex4_896bit :
    sha256Hex "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu" =
      "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1" := by
  native_decide

/-- NIST CAVP long-message vector: one million copies of the character 'a'
(byte 0x61).  This exercises the 64-bit length counter (8,000,000 bits)
and 15,626 compression invocations. -/

end ProofBundle.Crypto.SHA256
