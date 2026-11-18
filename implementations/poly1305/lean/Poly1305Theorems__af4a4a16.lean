/-
# Poly1305 structural / single-block theorems (RFC 8439 §2.5)

Same discipline as `CleanSpec/ChaCha20Theorems.lean` and the existing
HMAC theorems: structural constants (clamp, lengths) close by `rfl`,
single-block tags close by `rfl`, and multi-block tags are validated at
runtime by `lake exe poly1305-kat` (see `Poly1305KAT.lean`).

No `native_decide`, no `sorry`, no `admit`, no `axiom`.
-/

import CleanSpec.Poly1305
import CleanSpec.RFC8439Vectors

namespace CleanSpec.Poly1305

open CleanSpec.NatBits
open CleanSpec.RFC8439

set_option maxRecDepth 100000
set_option maxHeartbeats 0

-- ---------------------------------------------------------------------------
-- Structural facts (closed, `rfl`)
-- ---------------------------------------------------------------------------

/-- The Poly1305 prime, RFC 8439 §2.5 (2^130 - 5). -/
theorem P_eq : P = 0x3fffffffffffffffffffffffffffffffb := rfl

/-- The 128-bit modulus for tag serialization. -/
theorem TWO128_eq : TWO128 = 0x100000000000000000000000000000000 := rfl

/-- A 32-byte key is accepted. -/
theorem hasLength_key_32 : hasLength (List.replicate 32 0) 32 = true := rfl

/-- A 31-byte key is rejected (hasLength false). -/
theorem hasLength_key_31 : hasLength (List.replicate 31 0) 32 = false := rfl

/-- A 33-byte key is rejected. -/
theorem hasLength_key_33 : hasLength (List.replicate 33 0) 32 = false := rfl

/-- An empty key is rejected. -/
theorem hasLength_key_0 : hasLength ([] : List Nat) 32 = false := rfl

/-- `mac` on a malformed (31-byte) key returns `[]`. -/
theorem mac_short_key_empty : mac (List.replicate 31 0) [1] = [] := rfl

/-- `mac` on a malformed (33-byte) key returns `[]`. -/
theorem mac_long_key_empty : mac (List.replicate 33 0) [1] = [] := rfl

/-- `mac` on an empty key returns `[]`. -/
theorem mac_empty_key_empty : mac ([] : List Nat) [1] = [] := rfl

/-- The accumulator on an empty message is 0. -/
theorem accumulate_empty_msg :
    accumulate 5 0x1234 0 ([] : List Nat) = 0 := rfl

/-- The accumulator on a 15-byte message (one partial block) is the
    single-block case: read 15 bytes + 0x01 byte, add to 0, multiply by r. -/
theorem accumulate_one_partial_block :
    accumulate 1 1 0 [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] =
      (leBytesToNat ([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 1] : List Nat) * 1) % P := rfl

/-- The clamp on the §2.5.2 key material matches the RFC's published value.
    This is the RFC's first published check (`polyClampedR` in the
    vectors file). -/
theorem clamp_2_5_2 : clamp polyKey = polyClampedR := rfl

-- ---------------------------------------------------------------------------
-- Single-block RFC 8439 A.3 KATs (all 16-byte messages, 1 block)
-- ---------------------------------------------------------------------------

/-- A.3 #1: all-zero key, all-zero message -- tag is all zeros. -/
theorem a3_1_rfl : mac a3Key1 a3Msg1 = a3Tag1 := rfl

/-- A.3 #5: 16-byte single-block vector (tag is reduced form of (R*2^128 mod p + S) mod 2^128). -/
theorem a3_5_rfl : mac a3Key5 a3Msg5 = a3Tag5 := rfl

/-- A.3 #6: 16-byte single-block vector. -/
theorem a3_6_rfl : mac a3Key6 a3Msg6 = a3Tag6 := rfl

/-- A.3 #7: 16-byte single-block vector. -/
theorem a3_7_rfl : mac a3Key7 a3Msg7 = a3Tag7 := rfl

/-- A.3 #8: 48-byte single-block vector (3 blocks of 16). -/
theorem a3_8_rfl : mac a3Key8 a3Msg8 = a3Tag8 := rfl

/-- A.3 #9: 16-byte single-block vector. -/
theorem a3_9_rfl : mac a3Key9 a3Msg9 = a3Tag9 := rfl

/-- A.3 #10: 64-byte single-block vector. -/
theorem a3_10_rfl : mac a3Key10 a3Msg10 = a3Tag10 := rfl

/-- A.3 #11: 48-byte single-block vector. -/
theorem a3_11_rfl : mac a3Key11 a3Msg11 = a3Tag11 := rfl

end CleanSpec.Poly1305
