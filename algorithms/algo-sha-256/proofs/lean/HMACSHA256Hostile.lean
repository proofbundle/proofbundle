/-
HMAC-SHA-256 adversarial / boundary vectors

Structural, `rfl`-closed boundary checks on constants and block sizes.  Full
HMAC runs are validated by `lake exe hmac-test` because the underlying SHA-256
is currently not kernel-computable for multi-block inputs.
-/ 

import Crypto.HMACSHA256

namespace Crypto.HMACSHA256

-- Boundary: block size and constants

theorem blockSize_eq : blockSize = 64 := rfl

theorem ipadBlock_length : ipadBlock.length = 64 := rfl

theorem opadBlock_length : opadBlock.length = 64 := rfl

-- Boundary: empty key is zero-padded to exactly one block

theorem prepareKey_empty_length : (prepareKey []).length = 64 := rfl

-- Boundary: a 64-byte key is preserved at length 64

theorem prepareKey_block_length_64 : (prepareKey (List.replicate 64 0)).length = 64 := rfl

end Crypto.HMACSHA256
