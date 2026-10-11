/-
HMAC-SHA-256 test vectors and structural theorems

RFC 4231 vectors are validated by `lake exe hmac-test` rather than `rfl` because
the underlying SHA-256 compression is currently not kernel-reducible for
multi-block inputs.  Structural theorems (lengths, block sizes) are `rfl`.
-/ 

import Crypto.HMACSHA256

namespace Crypto.HMACSHA256

open Crypto.SHA256

-- RFC 4231 Test Case 1
-- key  = 0x0b * 20
-- data = "Hi There"
-- expected = b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7

def tc1Key : List Nat := List.replicate 20 0x0b
def tc1Msg : List Nat := [72, 105, 32, 84, 104, 101, 114, 101]
def tc1Expected : List Nat := hexDecode "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"

-- RFC 4231 Test Case 2
-- key  = "Jefe"
-- data = "what do ya want for nothing?"
-- expected = 5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843

def tc2Key : List Nat := [74, 101, 102, 101]
def tc2Msg : List Nat := [119, 104, 97, 116, 32, 100, 111, 32, 121, 97, 32, 119, 97, 110, 116, 32, 102, 111, 114, 32, 110, 111, 116, 104, 105, 110, 103, 63]
def tc2Expected : List Nat := hexDecode "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"

-- RFC 4231 Test Case 3
-- key  = xAA * 20
-- data = xDD * 50
-- expected = 773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe

def tc3Key : List Nat := List.replicate 20 0xaa
def tc3Msg : List Nat := List.replicate 50 0xdd
def tc3Expected : List Nat := hexDecode "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe"

-- RFC 4231 Test Case 4
-- key  = 0x0102030405060708090a0b0c0d0e0f10111213141516171819 (25 bytes)
-- data = xCD * 50
-- expected = 82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b

def tc4Key : List Nat :=
  [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
   0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
   0x15, 0x16, 0x17, 0x18, 0x19]
def tc4Msg : List Nat := List.replicate 50 0xcd
def tc4Expected : List Nat := hexDecode "82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b"

-- Structural theorems

theorem blockSize_eq_64 : blockSize = 64 := rfl

theorem ipadBlock_length : ipadBlock.length = 64 := rfl

theorem opadBlock_length : opadBlock.length = 64 := rfl

end Crypto.HMACSHA256
