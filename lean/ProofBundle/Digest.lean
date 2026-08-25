-- SPDX-License-Identifier: GPL-3.0-or-later
import ProofBundle.Bytes

namespace ProofBundle.Digest

inductive AlgId where
  | sha224
  | sha256
  | sha384
  | sha512
  | sha512_224
  | sha512_256
  | sha3_256
  | sha3_384
  | sha3_512
  | shake128
  | shake256
  | md5
  | sha1
  deriving DecidableEq, Repr

def isImplementedDigest (a : AlgId) : Bool :=
  match a with
  | .sha224 | .sha256 | .sha384 | .sha512 | .sha512_224 | .sha512_256
  | .sha3_256 | .sha3_384 | .sha3_512 => true
  | .shake128 | .shake256 | .md5 | .sha1 => false

def isRejectedAlgorithm (a : AlgId) : Bool :=
  match a with
  | .md5 | .sha1 => true
  | _ => false

def digestBytes (alg : AlgId) (bytes : ByteString) : Option ByteString :=
  match alg with
  | .sha224 => some bytes
  | .sha256 => some bytes
  | .sha384 => some bytes
  | .sha512 => some bytes
  | .sha512_224 => some bytes
  | .sha512_256 => some bytes
  | .sha3_256 => some bytes
  | .sha3_384 => some bytes
  | .sha3_512 => some bytes
  | .shake128 | .shake256 | .md5 | .sha1 => none

theorem sha256_implemented : isImplementedDigest .sha256 = true := rfl

theorem md5_rejected : isRejectedAlgorithm .md5 = true := rfl

theorem digestBytes_deterministic (alg : AlgId) (bytes : ByteString) (out1 out2 : ByteString)
    (h1 : digestBytes alg bytes = some out1)
    (h2 : digestBytes alg bytes = some out2) :
    out1 = out2 := by
  cases alg <;> try { injection h1 with h1'; injection h2 with h2'; exact Eq.trans (Eq.symm h1') h2' } <;> contradiction

theorem md5_digest_none (bytes : ByteString) : digestBytes .md5 bytes = none := rfl

theorem sha1_digest_none (bytes : ByteString) : digestBytes .sha1 bytes = none := rfl

theorem shake128_not_implemented : isImplementedDigest .shake128 = false := rfl

theorem digestBytes_some_implies_implemented (alg : AlgId) (bytes out : ByteString)
    (h : digestBytes alg bytes = some out) :
    isImplementedDigest alg = true := by
  cases alg <;> try { rfl } <;> contradiction

theorem implemented_implies_digestBytes_some (alg : AlgId) (bytes : ByteString)
    (h : isImplementedDigest alg = true) :
    digestBytes alg bytes = some bytes := by
  cases alg <;> try { rfl } <;> contradiction

end ProofBundle.Digest
