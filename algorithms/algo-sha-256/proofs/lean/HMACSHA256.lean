/-
Pure, list-based HMAC-SHA-256 (RFC 2104 / RFC 4231)

Built on top of `Crypto.SHA256`.  Words and bytes are natural numbers; all data
structures are `List Nat`.  No arrays, no `UInt32`/`UInt8`, no mutable state,
no `native_decide`, no `sorry`/`admit`/`axiom`, no `Classical`.

The byte XOR uses `Crypto.NatBits.bitXor`, keeping the bitwise path
first-principles and avoiding core `Nat.xor`.

Limitation: because the underlying `sha256Bytes` is not yet kernel-computable
for multi-block inputs, HMAC-SHA-256 known-answer tests are currently validated
by `lake exe hmac-test` against RFC 4231 reference vectors, not by `rfl`.
-/ 

import Crypto.NatBits
import Crypto.SHA256

namespace Crypto.HMACSHA256

open Crypto.NatBits
open Crypto.SHA256

/-- Block size in bytes for SHA-256 (B = 64). -/
def blockSize : Nat := 64

/-- Inner padding byte `0x36` repeated for the block size. -/
def ipadBlock : List Nat := List.replicate blockSize 0x36

/-- Outer padding byte `0x5C` repeated for the block size. -/
def opadBlock : List Nat := List.replicate blockSize 0x5C

/-- XOR two byte lists elementwise using first-principles `bitXor`. -/
def xorBytes (xs ys : List Nat) : List Nat :=
  match xs, ys with
  | x :: xs', y :: ys' => bitXor x y :: xorBytes xs' ys'
  | x :: xs', [] => x :: xorBytes xs' []
  | [], y :: ys' => y :: xorBytes [] ys'
  | [], [] => []

/-- Key K padded to exactly `blockSize` bytes.  If |K| > blockSize, K is first
    hashed with SHA-256 and the result padded; otherwise it is zero-padded. -/
def prepareKey (key : List Nat) : List Nat :=
  let k : List Nat :=
    if key.length > blockSize then
      sha256Bytes key
    else
      key
  k ++ List.replicate (blockSize - k.length) 0x00

/-- HMAC-SHA-256 of `msg` under `key`, returning the raw 32-byte digest. -/
def hmacSha256 (key : List Nat) (msg : List Nat) : List Nat :=
  let k := prepareKey key
  let inner := sha256Bytes (xorBytes k ipadBlock ++ msg)
  sha256Bytes (xorBytes k opadBlock ++ inner)

end Crypto.HMACSHA256
