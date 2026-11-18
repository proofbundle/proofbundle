import Keccak

/-!
# Sponge Construction and Padding (FIPS 202)

Absorb-squeeze paradigm with multi-rate padding.
Zero axioms. Zero sorries.
-/

namespace Keccak

/-- Convert byte array to Keccak state.
    Bytes are XORed into state in little-endian lane order. -/
def bytesToState (bytes : Array UInt8) : State :=
  fun x y z =>
    let laneIdx := y.val * 5 + x.val
    let byteIdx := laneIdx * 8 + z.val / 8
    let bitIdx := z.val % 8
    if byteIdx < bytes.size then
      let byte := bytes[byteIdx]!.toNat
      ((byte >>> bitIdx) &&& 1) = 1
    else
      false

/-- Convert Keccak state to byte array.
    Returns exactly `len` bytes in little-endian lane order. -/
def stateToBytes (S : State) (len : Nat) : Array UInt8 :=
  let mut bytes := Array.mkArray len (0 : UInt8)
  for byteIdx in [0:len] do
    let laneIdx := byteIdx / 8
    let x := ⟨laneIdx % 5, by omega⟩
    let y := ⟨laneIdx / 5, by omega⟩
    let byteBit := byteIdx % 8
    let mut byte := 0
    for bitIdx in [0:8] do
      let z := ⟨byteBit * 8 + bitIdx, by omega⟩
      if z.val < 64 then
        let bit := if S x y z then 1 else 0
        byte := byte ||| (bit <<< bitIdx)
    bytes := bytes.set! byteIdx (UInt8.ofNat (byte % 256))
  bytes

/-- Multi-rate padding: pad10*1.
    Append `0x80` then `0x00`...`0x00` then `0x01` to fill block.
    `rate` is in bytes. -/
def pad10s1 (msg : Array UInt8) (rate : Nat) : Array UInt8 :=
  let mut padded := msg
  padded := padded.push (0x80 : UInt8)
  while (padded.size % rate) ≠ 0 do
    padded := padded.push (0x00 : UInt8)
  -- Replace last byte: set LSB to 1 (was 0x00, becomes 0x01)
  let lastIdx := padded.size - 1
  let lastByte := padded[lastIdx]!.toNat ||| 1
  padded := padded.set! lastIdx (UInt8.ofNat (lastByte % 256))
  padded

/-- SHA-3 domain separation: pad10*1 with suffix 0x02 (for SHA3-256/512).
    FIPS 202: SHA3-256 uses suffix 01, then pad10*1.
    Actually: the suffix is appended BEFORE padding.
    SHA3-256: msg || 0x02 || pad10*1
    Wait: FIPS 202 Section 6.1 says SHA3-256 uses suffix 01.
    Let me check: NIST FIPS 202 Table 3:
    SHA3-256: capacity=512, rate=1088, suffix=01
    SHA3-512: capacity=1024, rate=576, suffix=01
    SHAKE128: capacity=256, rate=1344, suffix=1111
    SHAKE256: capacity=512, rate=1088, suffix=1111

    The suffix is appended to the message, then pad10*1 is applied.
    For SHA3: suffix = 0b01 = 0x02 in little-endian bit order? No.
    Actually in FIPS 202, the suffix is appended as bits at the end.
    SHA3-256: append bits "01" then pad10*1.
    In bytes: append 0x02 (since 01 in bits = 0x02 in little-endian byte).
    Wait no - let me be careful. FIPS 202 defines the suffix as bits.
    "01" means two bits: 0 then 1. In a byte, that's 0b00000010 = 0x02.
    "1111" means four bits: 1,1,1,1. In a byte, that's 0b00001111 = 0x0F.
    -/
def padWithSuffix (msg : Array UInt8) (rate : Nat) (suffix : Nat) : Array UInt8 :=
  let mut padded := msg
  -- Append suffix byte
  padded := padded.push (UInt8.ofNat suffix)
  -- Apply pad10*1
  pad10s1 padded rate

/-- Absorb blocks into state.
    `rateBytes`: block size in bytes.
    Returns final state after all blocks absorbed. -/
def absorb (msg : Array UInt8) (rateBytes : Nat) : State :=
  let mut S := fun (x : Fin 5) (y : Fin 5) (z : Fin 64) => false
  let numBlocks := msg.size / rateBytes
  for blockIdx in [0:numBlocks] do
    let block := msg.extract (blockIdx * rateBytes) ((blockIdx + 1) * rateBytes)
    let blockState := bytesToState block
    -- XOR block into state
    S := fun x y z => S x y z ≠ blockState x y z
    -- Apply Keccak-f
    S := keccakF S
  S

/-- Squeeze output from state.
    `rateBytes`: block size in bytes.
    `outputLen`: desired output length in bytes. -/
def squeeze (S : State) (rateBytes : Nat) (outputLen : Nat) : Array UInt8 :=
  let mut output := Array.mkArray outputLen (0 : UInt8)
  let mut state := S
  let mut outputIdx := 0
  while outputIdx < outputLen do
    let block := stateToBytes state (min rateBytes (outputLen - outputIdx))
    for j in [0:block.size] do
      if outputIdx + j < outputLen then
        output := output.set! (outputIdx + j) (block[j]!)
    outputIdx := outputIdx + rateBytes
    if outputIdx < outputLen then
      state := keccakF state
  output

/-- Sponge construction: absorb then squeeze.
    `rateBytes`: rate in bytes.
    `suffix`: domain separation suffix.
    `outputLen`: desired output length. -/
def sponge (msg : Array UInt8) (rateBytes : Nat) (suffix : Nat)
  (outputLen : Nat) : Array UInt8 :=
  let padded := padWithSuffix msg rateBytes suffix
  let S := absorb padded rateBytes
  squeeze S rateBytes outputLen

end Keccak
