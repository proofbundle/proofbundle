-- Crypto/SHA224/Core.lean
-- SHA-224 core. Identical round logic to SHA-256; differs only in initial
-- hash values and final truncation to 7 words (224 bits).
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA256.Core

-- SHA-224 initial hash values (H0..H7)
-- First 32 bits of fractional parts of square roots of 9th through 16th primes.
def H224 : Vec Word 8 := ⟨#[
  0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
  0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
], by decide⟩

structure Digest224 where
  words : Vec Word 7

-- Process block with SHA-224 initial values, truncate final state to 7 words.
def processBlock224 (block : Block) (hash : Digest) : Digest :=
  -- Reuse SHA-256 processBlock but with H224 initial state on first block
  processBlock block hash

-- Truncate a 256-bit digest to 224 bits by dropping the last word.
def truncate224 (d : Digest) : Digest224 :=
  Digest224.mk ⟨#[
    d.words.get ⟨0, by decide⟩,
    d.words.get ⟨1, by decide⟩,
    d.words.get ⟨2, by decide⟩,
    d.words.get ⟨3, by decide⟩,
    d.words.get ⟨4, by decide⟩,
    d.words.get ⟨5, by decide⟩,
    d.words.get ⟨6, by decide⟩
  ], by decide⟩
