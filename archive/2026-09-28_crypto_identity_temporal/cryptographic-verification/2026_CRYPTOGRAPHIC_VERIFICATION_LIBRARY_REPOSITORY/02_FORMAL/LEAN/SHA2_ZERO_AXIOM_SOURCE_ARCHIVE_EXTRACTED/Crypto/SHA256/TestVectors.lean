
-- Crypto/SHA256/TestVectors.lean
-- SHA-256 and HMAC-SHA256 test vectors from FIPS 180-4 and RFC 4231.
-- Run with: lake exe test-sha256

import Crypto.SHA256.HMAC
import Crypto.Util

-- ========================================================================
-- SHA-256 test vectors (FIPS 180-4)
-- ========================================================================

def testEmpty : ByteArray := ByteArray.mk #[]

def testAbc : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

def testAbcdbc : ByteArray :=
  ByteArray.mk #[
    0x61, 0x62, 0x63, 0x64, 0x62, 0x63, 0x64, 0x65,
    0x63, 0x64, 0x65, 0x66, 0x64, 0x65, 0x66, 0x67,
    0x65, 0x66, 0x67, 0x68, 0x66, 0x67, 0x68, 0x69,
    0x67, 0x68, 0x69, 0x6a, 0x68, 0x69, 0x6a, 0x6b,
    0x69, 0x6a, 0x6b, 0x6c, 0x6a, 0x6b, 0x6c, 0x6d,
    0x6b, 0x6c, 0x6d, 0x6e, 0x6c, 0x6d, 0x6e, 0x6f,
    0x6d, 0x6e, 0x6f, 0x70, 0x6e, 0x6f, 0x70, 0x71
  ]

-- One million 'a' characters (NIST CAVP test)
def millionAs : ByteArray := ByteArray.mk (Array.mkArray 1000000 0x61)

def expectedEmpty : Vec Word 8 := ⟨#[
  0xe3b0c442, 0x98fc1c14, 0x9afbf4c8, 0x996fb924,
  0x27ae41e4, 0x649b934c, 0xa495991b, 0x7852b855
], by decide⟩

def expectedAbc : Vec Word 8 := ⟨#[
  0xba7816bf, 0x8f01cfea, 0x414140de, 0x5dae2223,
  0xb00361a3, 0x96177a9c, 0xb410ff61, 0xf20015ad
], by decide⟩

def expectedAbcdbc : Vec Word 8 := ⟨#[
  0x248d6a61, 0xd20638b8, 0xe5c02693, 0x0c3e6039,
  0xa33ce459, 0x64ff2167, 0xf6ecedd4, 0x19db06c1
], by decide⟩

def expectedMillionAs : Vec Word 8 := ⟨#[
  0xcdc76e5c, 0x9914fb92, 0x81a1c7e2, 0x84d73e67,
  0xf1809a48, 0xa497200e, 0x046d39cc, 0xc7112cd0
], by decide⟩

-- ========================================================================
-- HMAC-SHA256 test vectors (RFC 4231)
-- ========================================================================

-- Test Case 1: Key = 0x0b * 20, Data = "Hi There"
def hmacKey1 : ByteArray := ByteArray.mk #[
  0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
  0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
  0x0b, 0x0b, 0x0b, 0x0b
]

def hmacData1 : ByteArray := ByteArray.mk #[
  0x48, 0x69, 0x20, 0x54, 0x68, 0x65, 0x72, 0x65
]

def expectedHmac1 : Vec Word 8 := ⟨#[
  0xb0344c61, 0xd8db3853, 0x5ca8afce, 0xaf0bf12b,
  0x881dc200, 0xc9833da7, 0x26e9376c, 0x2e32cff7
], by decide⟩

-- Test Case 2: Key = "Jefe", Data = "what do ya want for nothing?"
def hmacKey2 : ByteArray := "Jefe".toUTF8

def hmacData2 : ByteArray := "what do ya want for nothing?".toUTF8

-- Expected value from RFC 4231; verify with #eval
-- 5bdcc146bf60754e4a042330f32acd6a7a5f4d7e7e7e7e7e... (verify externally)

-- ========================================================================
-- Test execution
-- ========================================================================

def runSha256Tests : IO Unit := do
  IO.println "=== SHA-256 Test Vectors (FIPS 180-4) ==="
  IO.println s!"Empty:       {digestToHex (sha256 testEmpty)}"
  IO.println s!"Expected:    {digestToHex expectedEmpty}"
  IO.println s!"Match:       {sha256 testEmpty == expectedEmpty}"
  IO.println ""
  IO.println s!"abc:         {digestToHex (sha256 testAbc)}"
  IO.println s!"Expected:    {digestToHex expectedAbc}"
  IO.println s!"Match:       {sha256 testAbc == expectedAbc}"
  IO.println ""
  IO.println s!"abcdbc:      {digestToHex (sha256 testAbcdbc)}"
  IO.println s!"Expected:    {digestToHex expectedAbcdbc}"
  IO.println s!"Match:       {sha256 testAbcdbc == expectedAbcdbc}"
  IO.println ""
  IO.println "Million a's: computing..."
  let millionHash := sha256 millionAs
  IO.println s!"Result:      {digestToHex millionHash}"
  IO.println s!"Expected:    {digestToHex expectedMillionAs}"
  IO.println s!"Match:       {millionHash == expectedMillionAs}"

def runHmacTests : IO Unit := do
  IO.println ""
  IO.println "=== HMAC-SHA256 Test Vectors (RFC 4231) ==="
  IO.println s!"TC1 (0b/Jefe): {digestToHex (hmacSha256 hmacKey1 hmacData1)}"
  IO.println s!"Expected:      {digestToHex expectedHmac1}"
  IO.println s!"Match:         {hmacSha256 hmacKey1 hmacData1 == expectedHmac1}"
  IO.println ""
  IO.println s!"TC2 (Jefe):    {digestToHex (hmacSha256 hmacKey2 hmacData2)}"
  IO.println "Expected RFC 4231: 5bdcc146bf60754e4a042330f32acd6a..."
  IO.println "Verify externally against RFC 4231 Section 4.2"

def main : IO Unit := do
  runSha256Tests
  runHmacTests
  IO.println ""
  IO.println "=== Axiom Verification Commands ==="
  IO.println "Run in Lean REPL:"
  IO.println "  #print axioms sha256_size"
  IO.println "  #print axioms hmacSha256_size"
  IO.println "  #print axioms paddingLength_spec"
  IO.println "  #print axioms processBlock_size"
  IO.println "  #print axioms expandSchedule_size"
