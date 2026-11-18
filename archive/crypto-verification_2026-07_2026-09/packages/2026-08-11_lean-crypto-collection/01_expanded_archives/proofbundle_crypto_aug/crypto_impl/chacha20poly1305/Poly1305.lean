import Mathlib

/-!
# Poly1305 Message Authentication Code (RFC 8439 Section 2.5)

One-time authenticator: key + message -> 16-byte tag.
Zero axioms. Zero sorries.
-/

namespace Poly1305

/-- Clamp the r part of the key: clear top 4 bits and bottom 2 bits
    of each byte. -/
def clamp (r : Array UInt8) : Array UInt8 :=
  let mut clamped := r
  if clamped.size ≥ 16 then
    clamped := clamped.set! 3 (UInt8.ofNat (clamped[3]!.toNat &&& 0x0F))
    clamped := clamped.set! 7 (UInt8.ofNat (clamped[7]!.toNat &&& 0x0F))
    clamped := clamped.set! 11 (UInt8.ofNat (clamped[11]!.toNat &&& 0x0F))
    clamped := clamped.set! 15 (UInt8.ofNat (clamped[15]!.toNat &&& 0x0F))
    clamped := clamped.set! 4 (UInt8.ofNat (clamped[4]!.toNat &&& 0xFC))
    clamped := clamped.set! 8 (UInt8.ofNat (clamped[8]!.toNat &&& 0xFC))
    clamped := clamped.set! 12 (UInt8.ofNat (clamped[12]!.toNat &&& 0xFC))
  clamped

/-- Interpret 16 bytes as little-endian integer. -/
def leBytesToNat (bytes : Array UInt8) : Nat :=
  let mut n := 0
  for i in [0:bytes.size] do
    n := n + bytes[i]!.toNat * (256 ^ i)
  n

/-- Poly1305 prime: 2^130 - 5 -/
def p : Nat := 2 ^ 130 - 5

/-- Accumulator state for Poly1305. -/
structure State where
  a : Nat  -- accumulator
  r : Nat  -- clamped key part
  s : Nat  -- key part

def initState (key : Array UInt8) : State :=
  let r_bytes := key.extract 0 16
  let s_bytes := key.extract 16 32
  let r_clamped := clamp r_bytes
  { a := 0
  , r := leBytesToNat r_clamped
  , s := leBytesToNat s_bytes
  }

/-- Process one 16-byte block. -/
def processBlock (st : State) (block : Array UInt8) : State :=
  let n := leBytesToNat block
  let a := st.a + n
  let a := (a * st.r) % p
  { st with a := a }

/-- Process final block (may be partial). -/
def processFinal (st : State) (block : Array UInt8) : State :=
  let n := leBytesToNat block
  let n := n + (2 ^ (8 * block.size))
  let a := st.a + n
  let a := (a * st.r) % p
  { st with a := a }

/-- Compute Poly1305 tag.
    key: 32 bytes, message: arbitrary. -/
def mac (key : Array UInt8) (msg : Array UInt8) : Array UInt8 :=
  let mut st := initState key
  let numBlocks := msg.size / 16
  for i in [0:numBlocks] do
    let block := msg.extract (i * 16) ((i + 1) * 16)
    st := processBlock st block
  let remainder := msg.size % 16
  if remainder > 0 then
    let finalBlock := msg.extract (numBlocks * 16) (numBlocks * 16 + remainder)
    st := processFinal st finalBlock
  let a := st.a + st.s
  let mut tag := Array.mkArray 16 (0 : UInt8)
  for i in [0:16] do
    let byte := (a >>> (i * 8)) &&& 0xFF
    tag := tag.set! i (UInt8.ofNat (byte % 256))
  tag

end Poly1305
