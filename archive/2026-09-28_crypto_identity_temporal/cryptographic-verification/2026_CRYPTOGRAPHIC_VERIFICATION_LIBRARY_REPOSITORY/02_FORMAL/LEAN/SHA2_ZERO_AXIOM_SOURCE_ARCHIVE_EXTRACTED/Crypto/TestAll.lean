
-- Crypto/TestAll.lean
-- Unified test runner for the entire zero-axiom SHA-2 family.

import Crypto.SHA256.TestVectors
import Crypto.SHA512.TestVectors
import Crypto.Util

def runAllTests : IO Unit := do
  IO.println "╔══════════════════════════════════════════════════════════════════╗"
  IO.println "║  Zero-Axiom SHA-2 Family Test Suite                              ║"
  IO.println "╚══════════════════════════════════════════════════════════════════╝"
  IO.println ""
  runSha256Tests
  IO.println ""
  runSha512Tests
  IO.println ""
  IO.println "=== SHA-224 Quick Check ==="
  let abc224 := sha224String "abc"
  IO.println s!"SHA-224(\"abc\"): {digestToHex abc224}"
  IO.println "Expected: 23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7"
  IO.println ""
  IO.println "=== SHA-384 Quick Check ==="
  let abc384 := sha384String "abc"
  IO.println s!"SHA-384(\"abc\"): {digest512ToHex abc384}"
  IO.println "Expected: cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7"
  IO.println ""
  IO.println "╔══════════════════════════════════════════════════════════════════╗"
  IO.println "║  All tests completed. Verify axiom independence manually.        ║"
  IO.println "╚══════════════════════════════════════════════════════════════════╝"

def main : IO Unit := do
  runAllTests
