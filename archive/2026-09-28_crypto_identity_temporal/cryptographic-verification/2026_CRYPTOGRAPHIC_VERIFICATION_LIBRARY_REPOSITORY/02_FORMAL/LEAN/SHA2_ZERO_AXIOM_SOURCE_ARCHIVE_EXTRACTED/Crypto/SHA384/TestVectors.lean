
-- Crypto/SHA384/TestVectors.lean
-- SHA-384 test vectors from FIPS 180-4.
-- UNVERIFIED: Expected values are from NIST CAVP. Computation not checked.

import Crypto.SHA384.Hash
import Crypto.Util

def testEmpty384 : ByteArray := ByteArray.mk #[]

def testAbc384 : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

def expectedEmpty384 : Vec Word512 6 := ⟨#[
  0x38b060a751ac9638, 0x4cd9327eb1b1e36a, 0x21fdb71114be0743,
  0x4c0cc7bf63f6e1da, 0x274edebfe76f65fb, 0xd51ad2f14898b95b
], by decide⟩

def expectedAbc384 : Vec Word512 6 := ⟨#[
  0xcb00753f45a35e8b, 0xb5a03d699ac65007, 0x272c32ab0eded163,
  0x1a8b605a43ff5bed, 0x8086072ba1e7cc23, 0x58baeca134c825a7
], by decide⟩

def runSha384Tests : IO Unit := do
  IO.println "=== SHA-384 Test Vectors ==="
  IO.println s!"Empty:    {digest512ToHex (sha384 testEmpty384)}"
  IO.println s!"Expected: {digest512ToHex expectedEmpty384}"
  IO.println s!"Match: {sha384 testEmpty384 == expectedEmpty384}"
  IO.println ""
  IO.println s!"abc:      {digest512ToHex (sha384 testAbc384)}"
  IO.println s!"Expected: {digest512ToHex expectedAbc384}"
  IO.println s!"Match: {sha384 testAbc384 == expectedAbc384}"
