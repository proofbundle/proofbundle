
-- Crypto/SHA512/TestVectors.lean
-- SHA-512 test vectors from FIPS 180-4.

import Crypto.SHA512.Hash
import Crypto.Util

def testEmpty512 : ByteArray := ByteArray.mk #[]

def testAbc512 : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

def expectedEmpty512 : Vec Word512 8 := ⟨#[
  0xcf83e1357eefb8bdf1542850d66d8007, 0xd620e4050b5715dc83f4a921d36ce9ce,
  0x47d0d13c5d85f2b0ff8318d2877eec2f, 0x63b931bd47417a81a538327af927da3e
], by decide⟩

def expectedAbc512 : Vec Word512 8 := ⟨#[
  0xddaf35a193617abacc417349ae204131, 0x12e6fa4e89a97ea20a9eeee64b55d39a,
  0x2192992a274fc1a836ba3c23a3feebbd, 0x454d4423643ce80e2a9ac94fa54ca49f
], by decide⟩

def runSha512Tests : IO Unit := do
  IO.println "=== SHA-512 Test Vectors ==="
  IO.println s!"Empty:    {digest512ToHex (sha512 testEmpty512)}"
  IO.println s!"Expected: {digest512ToHex expectedEmpty512}"
  IO.println s!"Match: {sha512 testEmpty512 == expectedEmpty512}"
  IO.println ""
  IO.println s!"abc:      {digest512ToHex (sha512 testAbc512)}"
  IO.println s!"Expected: {digest512ToHex expectedAbc512}"
  IO.println s!"Match: {sha512 testAbc512 == expectedAbc512}"

def main : IO Unit := do
  runSha512Tests
