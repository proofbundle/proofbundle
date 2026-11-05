
-- Crypto/Util.lean
-- Shared utilities: hex encoding, byte manipulation, debugging helpers.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

-- ========================================================================
-- Hex encoding
-- ========================================================================

def hexDigit (n : Nat) : Char :=
  if n < 10 then Char.ofNat (n + 48) else Char.ofNat (n + 87)

def byteToHex (b : UInt8) : String :=
  let n := b.toNat
  String.mk [hexDigit (n / 16), hexDigit (n % 16)]

def wordToHex (w : UInt32) : String :=
  let n := w.toNat
  String.mk [
    hexDigit ((n >>> 28) % 16), hexDigit ((n >>> 24) % 16),
    hexDigit ((n >>> 20) % 16), hexDigit ((n >>> 16) % 16),
    hexDigit ((n >>> 12) % 16), hexDigit ((n >>> 8) % 16),
    hexDigit ((n >>> 4) % 16), hexDigit (n % 16)
  ]

def word512ToHex (w : UInt64) : String :=
  let n := w.toNat
  String.mk [
    hexDigit ((n >>> 60) % 16), hexDigit ((n >>> 56) % 16),
    hexDigit ((n >>> 52) % 16), hexDigit ((n >>> 48) % 16),
    hexDigit ((n >>> 44) % 16), hexDigit ((n >>> 40) % 16),
    hexDigit ((n >>> 36) % 16), hexDigit ((n >>> 32) % 16),
    hexDigit ((n >>> 28) % 16), hexDigit ((n >>> 24) % 16),
    hexDigit ((n >>> 20) % 16), hexDigit ((n >>> 16) % 16),
    hexDigit ((n >>> 12) % 16), hexDigit ((n >>> 8) % 16),
    hexDigit ((n >>> 4) % 16), hexDigit (n % 16)
  ]

def digestToHex {n : Nat} (d : Vec UInt32 n) : String :=
  d.data.foldl (fun acc w => acc ++ wordToHex w) ""

def digest512ToHex {n : Nat} (d : Vec UInt64 n) : String :=
  d.data.foldl (fun acc w => acc ++ word512ToHex w) ""

-- ========================================================================
-- ByteArray utilities
-- ========================================================================

def byteArrayToHex (ba : ByteArray) : String :=
  ba.data.foldl (fun acc b => acc ++ byteToHex b) ""

def byteArrayOfString (s : String) : ByteArray :=
  s.toUTF8

-- ========================================================================
-- Vec utilities
-- ========================================================================

def vecToHex {n : Nat} (v : Vec UInt8 n) : String :=
  v.data.foldl (fun acc b => acc ++ byteToHex b) ""
