
-- Crypto/SHA224/TestVectors.lean
-- SHA-224 test vectors from FIPS 180-4.
-- UNVERIFIED: Expected values are from NIST CAVP. Computation not checked.

import Crypto.SHA224.Hash
import Crypto.Util

def testEmpty224 : ByteArray := ByteArray.mk #[]

def testAbc224 : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

def expectedEmpty224 : Vec Word 7 := ⟨#[
  0xd14a028c, 0x2a3a2bc9, 0x476102bb, 0x288234c4,
  0x15a2b01f, 0x828ea62a, 0xc5b3e42f
], by decide⟩

def expectedAbc224 : Vec Word 7 := ⟨#[
  0x23097d22, 0x3405d822, 0x8642a477, 0xbda255b3,
  0x2aadbce4, 0xbda0b3f7, 0xe36c9da7
], by decide⟩

def runSha224Tests : IO Unit := do
  IO.println "=== SHA-224 Test Vectors ==="
  IO.println s!"Empty:    {digestToHex (sha224 testEmpty224)}"
  IO.println s!"Expected: {digestToHex expectedEmpty224}"
  IO.println s!"Match: {sha224 testEmpty224 == expectedEmpty224}"
  IO.println ""
  IO.println s!"abc:      {digestToHex (sha224 testAbc224)}"
  IO.println s!"Expected: {digestToHex expectedAbc224}"
  IO.println s!"Match: {sha224 testAbc224 == expectedAbc224}"
