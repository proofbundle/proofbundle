-- Crypto/SHA384/Core.lean
-- SHA-384 core. Identical round logic to SHA-512; differs only in initial
-- hash values and final truncation to 6 words (384 bits).
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA512.Core

-- SHA-384 initial hash values (H0..H7)
-- First 64 bits of fractional parts of square roots of 9th through 16th primes.
def H384 : Vec Word512 8 := ⟨#[
  0xcbbb9d5dc1059ed8, 0x629a292a367cd507, 0x9159015a3070dd17, 0x152fecd8f70e5939,
  0x67332667ffc00b31, 0x8eb44a8768581511, 0xdb0c2e0d64f98fa7, 0x47b5481dbefa4fa4
], by decide⟩

structure Digest384 where
  words : Vec Word512 6

-- Truncate a 512-bit digest to 384 bits by dropping the last two words.
def truncate384 (d : Digest512) : Digest384 :=
  Digest384.mk ⟨#[
    d.words.get ⟨0, by decide⟩,
    d.words.get ⟨1, by decide⟩,
    d.words.get ⟨2, by decide⟩,
    d.words.get ⟨3, by decide⟩,
    d.words.get ⟨4, by decide⟩,
    d.words.get ⟨5, by decide⟩
  ], by decide⟩
