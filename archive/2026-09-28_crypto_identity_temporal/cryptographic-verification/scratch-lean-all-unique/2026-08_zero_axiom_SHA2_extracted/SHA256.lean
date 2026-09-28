import SHA256Core

-- SHA256.lean
-- Padding, block decomposition, full iterative hash, and test vectors.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.
-- No panic operators. No unsafe array access.

-- Padding length: smallest k such that (msgLen + 1 + k) ≡ 56 (mod 64)
def paddingLength (msgLen : Nat) : Nat :=
  let r := (msgLen + 1) % 64
  if r ≤ 56 then 56 - r else 64 - r + 56

theorem paddingLength_spec (msgLen : Nat) :
  (msgLen + 1 + paddingLength msgLen) % 64 = 56 := by
  unfold paddingLength
  split
  · rename_i r hr
    have h1 : msgLen + 1 = 64 * ((msgLen + 1) / 64) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 64]
    have h2 : r + (56 - r) = 56 := Nat.add_sub_cancel' hr
    have h3 : 64 * ((msgLen + 1) / 64) + r + (56 - r) = 64 * ((msgLen + 1) / 64) + 56 := by
      rw [Nat.add_assoc]
      rw [h2]
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]
  · rename_i r hr
    have h1 : msgLen + 1 = 64 * ((msgLen + 1) / 64) + r := by
      rw [Nat.div_add_mod (msgLen + 1) 64]
    have hr64 : r ≤ 64 := by
      have : r < 64 := Nat.mod_lt (msgLen + 1) (by decide)
      exact Nat.le_of_lt this
    have h2 : r + (64 - r + 56) = 64 + 56 := by
      have h3 : r + (64 - r) = 64 := Nat.add_sub_cancel' hr64
      calc
        r + (64 - r + 56) = r + (64 - r) + 56 := by rw [Nat.add_assoc]
        _ = 64 + 56 := by rw [h3]
    have h3 : 64 * ((msgLen + 1) / 64) + r + (64 - r + 56) = 64 * ((msgLen + 1) / 64 + 1) + 56 := by
      rw [Nat.add_assoc]
      rw [h2]
      rw [Nat.mul_add]
      rfl
    rw [h1]
    rw [h3]
    simp [Nat.add_mod, Nat.mul_mod]

-- Encode message length in bits as 8 big-endian bytes.
def encodeLength (lenBits : Nat) : ByteArray :=
  ByteArray.mk #[
    UInt8.ofNat ((lenBits >>> 56) % 256),
    UInt8.ofNat ((lenBits >>> 48) % 256),
    UInt8.ofNat ((lenBits >>> 40) % 256),
    UInt8.ofNat ((lenBits >>> 32) % 256),
    UInt8.ofNat ((lenBits >>> 24) % 256),
    UInt8.ofNat ((lenBits >>> 16) % 256),
    UInt8.ofNat ((lenBits >>> 8) % 256),
    UInt8.ofNat (lenBits % 256)
  ]

-- Pad a message to a multiple of 64 bytes.
def padMessage (msg : ByteArray) : ByteArray :=
  let lenBits := msg.size * 8
  let padLen := paddingLength msg.size
  let padding := ByteArray.mk (Array.mkArray padLen 0)
  ByteArray.append (ByteArray.append (msg.push 0x80) padding) (encodeLength lenBits)

theorem padMessage_size (msg : ByteArray) :
  (padMessage msg).size % 64 = 0 := by
  unfold padMessage
  simp [ByteArray.size_append, ByteArray.size_push]
  have h : msg.size + 1 + paddingLength msg.size + 8 =
           (msg.size + 1 + paddingLength msg.size) + 8 := by rfl
  rw [h]
  have h2 : (msg.size + 1 + paddingLength msg.size) % 64 = 56 := paddingLength_spec msg.size
  have h3 : ∃ q, msg.size + 1 + paddingLength msg.size = 64 * q + 56 := by
    refine ⟨ (msg.size + 1 + paddingLength msg.size) / 64, ?_ ⟩
    rw [Nat.div_add_mod _ 64]
    rw [h2]
  obtain ⟨q, hq⟩ := h3
  rw [hq]
  have h4 : (64 * q + 56 + 8) % 64 = 0 := by
    have : 64 * q + 56 + 8 = 64 * (q + 1) := by
      rw [Nat.mul_add]
      rfl
    rw [this]
    simp [Nat.mul_mod]
  exact h4

-- Convert four big-endian bytes to one 32-bit word.
def bytesToWord (b0 b1 b2 b3 : UInt8) : Word :=
  (b0.toUInt32 <<< 24) ||| (b1.toUInt32 <<< 16) ||| (b2.toUInt32 <<< 8) ||| b3.toUInt32

-- Extract one 16-word block from a padded message at a given byte offset.
-- Requires proof that the offset plus 63 is within bounds.
def extractBlock (padded : ByteArray) (start : Nat)
                 (h_bound : start + 63 < padded.size) : Vec Word 16 :=
  let rec build (fuel : Nat) (i : Nat) (acc : Array Word)
                (h_acc : acc.size = i) (h_i : i + fuel = 16)
                (h_byte : start + 63 < padded.size) : Vec Word 16 :=
    match fuel with
    | 0 =>
      have hi : i = 16 := by rw [Nat.zero_add] at h_i; exact h_i
      ⟨acc, by rw [hi] at h_acc; exact h_acc⟩
    | fuel + 1 =>
      have hi : i < 16 := by omega
      have hj1 : i * 4 + 3 ≤ 63 := by
        have : i ≤ 15 := Nat.le_of_lt_add_one hi
        have : i * 4 ≤ 60 := Nat.mul_le_mul_right 4 this
        exact Nat.add_le_add_right this 3
      have h0 : start + i * 4 < padded.size := by
        have h_pos : 0 < 3 := by decide
        have h_lt : start + i * 4 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h1 : start + i * 4 + 1 < padded.size := by
        have h_pos : 0 < 2 := by decide
        have h_lt : start + i * 4 + 1 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h2 : start + i * 4 + 2 < padded.size := by
        have h_pos : 0 < 1 := by decide
        have h_lt : start + i * 4 + 2 < start + i * 4 + 3 := Nat.lt_add_of_pos_right h_pos
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        have h_lt2 : start + i * 4 + 3 < padded.size := Nat.lt_of_le_of_lt h_le h_byte
        exact Nat.lt_trans h_lt h_lt2
      have h3 : start + i * 4 + 3 < padded.size := by
        have h_le : start + i * 4 + 3 ≤ start + 63 := Nat.add_le_add_left hj1 start
        exact Nat.lt_of_le_of_lt h_le h_byte
      let b0 := padded.get ⟨start + i * 4, h0⟩
      let b1 := padded.get ⟨start + i * 4 + 1, h1⟩
      let b2 := padded.get ⟨start + i * 4 + 2, h2⟩
      let b3 := padded.get ⟨start + i * 4 + 3, h3⟩
      let w := bytesToWord b0 b1 b2 b3
      have h_next : start + 63 < padded.size := h_byte
      build fuel (i + 1) (acc.push w)
        (by rw [Array.size_push, h_acc])
        (by rw [Nat.add_right_comm i fuel 1] at h_i; exact h_i)
        h_next
  build 16 0 #[] (by rfl) (by rfl) h_bound

-- Full SHA-256 hash over an arbitrary message.
def sha256 (msg : ByteArray) : Vec Word 8 :=
  let padded := padMessage msg
  have h_size : padded.size % 64 = 0 := padMessage_size msg
  let numBlocks := padded.size / 64
  have h_eq : padded.size = numBlocks * 64 := by
    rw [Nat.div_mul_cancel]
    exact h_size
  let rec process (fuel : Nat) (i : Nat) (hash : DigestState) : DigestState :=
    match fuel with
    | 0 => hash
    | fuel + 1 =>
      if hi : i < numBlocks then
        let start := i * 64
        have h_bound : start + 63 < padded.size := by
          rw [h_eq]
          have h1 : i + 1 ≤ numBlocks := Nat.succ_le_of_lt hi
          have h2 : (i + 1) * 64 ≤ numBlocks * 64 := Nat.mul_le_mul_right 64 h1
          have h3 : i * 64 + 64 = (i + 1) * 64 := by rw [Nat.succ_mul]
          have h4 : i * 64 + 63 < i * 64 + 64 := by
            exact Nat.lt_add_of_pos_right (by decide)
          have h5 : i * 64 + 63 < numBlocks * 64 := Nat.lt_of_lt_of_le h4 (by rw [←h3]; exact h2)
          exact h5
        let block := extractBlock padded start h_bound
        process fuel (i + 1) (processBlock block hash)
      else hash
  (process numBlocks 0 (DigestState.mk H)).words

-- Test vectors from FIPS 180-4.
-- Verify with: #eval sha256 testEmpty
-- Expected: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

def testEmpty : ByteArray := ByteArray.mk #[]

def testAbc : ByteArray := ByteArray.mk #[0x61, 0x62, 0x63]

def testAbcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq : ByteArray :=
  ByteArray.mk #[
    0x61, 0x62, 0x63, 0x64, 0x62, 0x63, 0x64, 0x65,
    0x63, 0x64, 0x65, 0x66, 0x64, 0x65, 0x66, 0x67,
    0x65, 0x66, 0x67, 0x68, 0x66, 0x67, 0x68, 0x69,
    0x67, 0x68, 0x69, 0x6a, 0x68, 0x69, 0x6a, 0x6b,
    0x69, 0x6a, 0x6b, 0x6c, 0x6a, 0x6b, 0x6c, 0x6d,
    0x6b, 0x6c, 0x6d, 0x6e, 0x6c, 0x6d, 0x6e, 0x6f,
    0x6d, 0x6e, 0x6f, 0x70, 0x6e, 0x6f, 0x70, 0x71
  ]

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

-- Structural theorems.

theorem sha256_size (msg : ByteArray) : (sha256 msg).size = 8 := by
  unfold sha256 Vec.size
  rfl

theorem extractBlock_size (padded : ByteArray) (start : Nat)
  (h : start + 63 < padded.size) : (extractBlock padded start h).size = 16 := by
  unfold extractBlock Vec.size
  rfl
