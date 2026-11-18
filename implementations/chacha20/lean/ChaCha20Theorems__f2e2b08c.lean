/-
ChaCha20 known-answer theorems (RFC 8439)

Every vector below is the RFC 8439 data in `Crypto/RFC8439Vectors.lean`
(mechanically transcribed by `tools/gen_rfc8439_vectors.py` and
cross-checked against OpenSSL by `tools/crosscheck_rfc8439_vectors.py`).
Vector source: RFC 8439, "ChaCha20 and Poly1305 for IETF Protocols",
https://www.rfc-editor.org/rfc/rfc8439.txt -- §2.1.1, §2.2.1, §2.3.2,
§2.4.2, Appendix A.1 and A.2.

All closed by `rfl` (kernel computation).  No `native_decide`, no `sorry`,
no `admit`, no `axiom`.
-/

import Crypto.ChaCha20
import Crypto.RFC8439Vectors

namespace Crypto.ChaCha20

open Crypto.RFC8439

set_option maxRecDepth 100000
set_option maxHeartbeats 0

-- ---------------------------------------------------------------------------
-- Structural facts (closed, `rfl`)
-- ---------------------------------------------------------------------------

/-- The constants serialize to the ASCII bytes of "expand 32-byte k". -/
theorem sigma_ascii :
    serialize sigma =
      [0x65, 0x78, 0x70, 0x61, 0x6e, 0x64, 0x20, 0x33,
       0x32, 0x2d, 0x62, 0x79, 0x74, 0x65, 0x20, 0x6b] := rfl

/-- RFC 8439 §2.1 worked example: 0x7998bfda <<< 7 = 0xcc5fed3c. -/
theorem rotl32_example : rotl32 0x7998bfda 7 = 0xcc5fed3c := rfl

/-- RFC 8439 §2.1 worked example: 0x01020304 ^ 0x789abcde = 0x7998bfda. -/
theorem xor32_example : xor32 0x01020304 0x789abcde = 0x7998bfda := rfl

/-- RFC 8439 §2.1 worked example: 0x77777777 + 0x01234567 = 0x789abcde. -/
theorem add32_example : add32 0x77777777 0x01234567 = 0x789abcde := rfl

/-- Addition wraps modulo 2^32. -/
theorem add32_wrap : add32 0xffffffff 1 = 0 := rfl

/-- Encrypting the empty message gives the empty message, for every key,
    counter and nonce (a universally quantified statement, closed by `rfl`). -/
theorem encrypt_nil (key : List Nat) (counter : Nat) (nonce : List Nat) :
    encrypt key counter nonce [] = [] := rfl

-- ---------------------------------------------------------------------------
-- RFC 8439 §2.1.1 and §2.2.1
-- ---------------------------------------------------------------------------

/-- RFC 8439 §2.1.1: quarter round test vector. -/
theorem kat_2_1_1_quarterRound : quarterRoundList qrIn = qrOut := rfl

/-- RFC 8439 §2.2.1: QUARTERROUND(2, 7, 8, 13) on the sample state. -/
theorem kat_2_2_1_quarterRound_state : qr2_7_8_13 qrStateIn = qrStateOut := rfl

-- ---------------------------------------------------------------------------
-- RFC 8439 §2.3.2 -- every intermediate value the RFC prints
-- ---------------------------------------------------------------------------

/-- RFC 8439 §2.3.2: state after key setup. -/
theorem kat_2_3_2_setup : initState blockKey blockCounter blockNonce = blockStateSetup := rfl

/-- RFC 8439 §2.3.2: state after 20 rounds. -/
theorem kat_2_3_2_rounds : rounds blockKey blockCounter blockNonce = blockStateRounds := rfl

/-- RFC 8439 §2.3.2: state at the end of the block function. -/
theorem kat_2_3_2_final : blockWords blockKey blockCounter blockNonce = blockStateFinal := rfl

/-- RFC 8439 §2.3.2: the serialization step alone. -/
theorem kat_2_3_2_serialize : serialize blockStateFinal = blockSerialized := rfl

/-- RFC 8439 §2.3.2: the full block function. -/
theorem kat_2_3_2_block : block blockKey blockCounter blockNonce = blockSerialized := rfl

-- ---------------------------------------------------------------------------
-- RFC 8439 §2.4.2 -- two-block encryption ("sunscreen")
-- ---------------------------------------------------------------------------

/-- RFC 8439 §2.4.2: the keystream (= encryption of 114 zero bytes). -/
theorem kat_2_4_2_keystream :
    encrypt sunKey sunCounter sunNonce (List.replicate 114 0) = sunKeystream := rfl

/-- RFC 8439 §2.4.2: encryption. -/
theorem kat_2_4_2_encrypt : encrypt sunKey sunCounter sunNonce sunPlaintext = sunCiphertext := rfl

/-- RFC 8439 §2.4.2: decryption (the same function) recovers the plaintext. -/
theorem kat_2_4_2_decrypt : encrypt sunKey sunCounter sunNonce sunCiphertext = sunPlaintext := rfl

-- ---------------------------------------------------------------------------
-- RFC 8439 Appendix A.1 -- block function
-- ---------------------------------------------------------------------------

/-- RFC 8439 A.1 test vector #1 (all-zero key and nonce, counter 0). -/
theorem kat_A1_1 : block a1Key1 a1Counter1 a1Nonce1 = a1Keystream1 := rfl

/-- RFC 8439 A.1 test vector #2 (all-zero key and nonce, counter 1). -/
theorem kat_A1_2 : block a1Key2 a1Counter2 a1Nonce2 = a1Keystream2 := rfl

/-- RFC 8439 A.1 test vector #3 (key = ...01, counter 1). -/
theorem kat_A1_3 : block a1Key3 a1Counter3 a1Nonce3 = a1Keystream3 := rfl

/-- RFC 8439 A.1 test vector #4 (key = 00 ff 00..., counter 2). -/
theorem kat_A1_4 : block a1Key4 a1Counter4 a1Nonce4 = a1Keystream4 := rfl

/-- RFC 8439 A.1 test vector #5 (nonce = ...02, counter 0). -/
theorem kat_A1_5 : block a1Key5 a1Counter5 a1Nonce5 = a1Keystream5 := rfl

-- ---------------------------------------------------------------------------
-- RFC 8439 Appendix A.2 -- encryption
-- ---------------------------------------------------------------------------

/-- RFC 8439 A.2 test vector #1 (64 zero bytes, one block). -/
theorem kat_A2_1 : encrypt a2Key1 a2Counter1 a2Nonce1 a2Plaintext1 = a2Ciphertext1 := rfl

/-- RFC 8439 A.2 test vector #3 (127 bytes, two blocks, counter 42). -/
theorem kat_A2_3 : encrypt a2Key3 a2Counter3 a2Nonce3 a2Plaintext3 = a2Ciphertext3 := rfl

/-- RFC 8439 A.2 test vector #2 (375 bytes, six blocks, last one partial). -/
theorem kat_A2_2 : encrypt a2Key2 a2Counter2 a2Nonce2 a2Plaintext2 = a2Ciphertext2 := rfl

end Crypto.ChaCha20
