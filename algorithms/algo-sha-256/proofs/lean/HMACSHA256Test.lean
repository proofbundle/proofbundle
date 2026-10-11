/-
HMAC-SHA-256 RFC 4231 test runner

Run with `lake exe hmac-test`.  Returns exit code 0 if all vectors match,
1 otherwise.  This keeps the slow known-answer tests out of the default
`lake build` path.
-/ 

import Crypto.HMACSHA256

open Crypto.HMACSHA256
open Crypto.SHA256

-- RFC 4231 vectors (kept at file root to avoid namespace-related miscompilation)

def tc1Key : List Nat := List.replicate 20 0x0b
def tc1Msg : List Nat := [72, 105, 32, 84, 104, 101, 114, 101]
def tc1Expected : List Nat := hexDecode "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"

def tc2Key : List Nat := [74, 101, 102, 101]
def tc2Msg : List Nat := [119, 104, 97, 116, 32, 100, 111, 32, 121, 97, 32, 119, 97, 110, 116, 32, 102, 111, 114, 32, 110, 111, 116, 104, 105, 110, 103, 63]
def tc2Expected : List Nat := hexDecode "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"

def tc3Key : List Nat := List.replicate 20 0xaa
def tc3Msg : List Nat := List.replicate 50 0xdd
def tc3Expected : List Nat := hexDecode "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe"

def tc4Key : List Nat :=
  [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
   0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
   0x15, 0x16, 0x17, 0x18, 0x19]
def tc4Msg : List Nat := List.replicate 50 0xcd
def tc4Expected : List Nat := hexDecode "82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b"

def check (name : String) (actual expected : List Nat) : IO Bool := do
  if actual == expected then
    IO.println s!"{name}: PASS"
    return true
  else
    IO.println s!"{name}: FAIL"
    return false

/-- Verify all RFC 4231 vectors. -/
def main : IO UInt32 := do
  let ok1 ← check "RFC4231 TC1" (hmacSha256 tc1Key tc1Msg) tc1Expected
  let ok2 ← check "RFC4231 TC2" (hmacSha256 tc2Key tc2Msg) tc2Expected
  let ok3 ← check "RFC4231 TC3" (hmacSha256 tc3Key tc3Msg) tc3Expected
  let ok4 ← check "RFC4231 TC4" (hmacSha256 tc4Key tc4Msg) tc4Expected
  if ok1 && ok2 && ok3 && ok4 then
    IO.println "All HMAC-SHA-256 vectors passed."
    return 0
  else
    IO.println "Some HMAC-SHA-256 vectors failed."
    return 1
