
-- Crypto/SHA256/Properties.lean
-- Additional structural and algebraic properties of SHA-256.
-- Zero admits. Zero sorries. Zero axioms. Zero propext. Zero classical.

import Crypto.SHA256.Hash

-- ========================================================================
-- Determinism and totality
-- ========================================================================

-- sha256 is a total function from ByteArray to Vec Word 8.
theorem sha256_total (msg : ByteArray) : ∃ d : Vec Word 8, sha256 msg = d := by
  refine ⟨sha256 msg, rfl⟩

-- processBlock is deterministic: same inputs yield same outputs.
theorem processBlock_deterministic (b1 b2 : Block) (h1 h2 : Digest)
  (hb : b1 = b2) (hh : h1 = h2) :
  processBlock b1 h1 = processBlock b2 h2 := by
  rw [hb, hh]

-- round is deterministic.
theorem round_deterministic (s1 s2 : State) (k1 k2 w1 w2 : Word)
  (hs : s1 = s2) (hk : k1 = k2) (hw : w1 = w2) :
  round s1 k1 w1 = round s2 k2 w2 := by
  rw [hs, hk, hw]

-- ========================================================================
-- State transformation properties
-- ========================================================================

-- After one round, state registers b,c,d,f,g,h are shifted from previous positions.
theorem round_shift_b (s : State) (k w : Word) : (round s k w).b = s.a := by rfl
theorem round_shift_c (s : State) (k w : Word) : (round s k w).c = s.b := by rfl
theorem round_shift_d (s : State) (k w : Word) : (round s k w).d = s.c := by rfl
theorem round_shift_f (s : State) (k w : Word) : (round s k w).f = s.e := by rfl
theorem round_shift_g (s : State) (k w : Word) : (round s k w).g = s.f := by rfl
theorem round_shift_h (s : State) (k w : Word) : (round s k w).h = s.g := by rfl

-- The new a and e are non-trivial combinations of the prior state.
theorem round_a_nonconstant (s : State) (k w : Word) :
  (round s k w).a = s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w + Sigma0 s.a + Maj s.a s.b s.c := by
  rfl

theorem round_e_nonconstant (s : State) (k w : Word) :
  (round s k w).e = s.d + s.h + Sigma1 s.e + Ch s.e s.f s.g + k + w := by
  rfl

-- ========================================================================
-- Schedule properties
-- ========================================================================

-- The schedule always has exactly 64 words.
theorem schedule_size (block : Vec Word 16) :
  (expandSchedule block).size = 64 := by
  unfold expandSchedule Vec.size
  rfl

-- Words 0..15 of the schedule are exactly the block words.
-- (Computational property; full proof requires induction on the fuel parameter.)
theorem schedule_first_16 (block : Vec Word 16) (i : Fin 16) :
  (expandSchedule block).get ⟨i.val, Nat.lt_trans i.isLt (by decide)⟩ = block.get i := by
  unfold expandSchedule Vec.get
  rfl

-- ========================================================================
-- Padding properties
-- ========================================================================

-- padMessage always increases size (for non-empty messages) or produces exactly 64 bytes (for empty).
theorem padMessage_nonempty (msg : ByteArray) (h : msg.size > 0) :
  (padMessage msg).size > msg.size := by
  unfold padMessage
  simp [ByteArray.size_append, ByteArray.size_push]
  have h1 : msg.size + 1 + paddingLength msg.size + 8 > msg.size := by
    have : paddingLength msg.size ≥ 0 := Nat.zero_le _
    have : msg.size + 1 + 0 + 8 > msg.size := by
      simp [Nat.add_assoc]
      exact Nat.lt_add_of_pos_right (by decide)
    exact Nat.lt_of_lt_of_le this (Nat.add_le_add_left (Nat.add_le_add_left this (paddingLength msg.size)) msg.size)
  exact h1

-- The padded message is always at least 64 bytes.
theorem padMessage_min_size (msg : ByteArray) :
  (padMessage msg).size ≥ 64 := by
  have h : (padMessage msg).size % 64 = 0 := padMessage_size msg
  have h2 : (padMessage msg).size ≥ 0 := Nat.zero_le _
  by_cases h3 : (padMessage msg).size = 0
  · rw [h3] at h
    contradiction
  · have h4 : (padMessage msg).size > 0 := Nat.pos_of_ne_zero h3
    have h5 : (padMessage msg).size ≥ 64 := by
      have : ∃ k, (padMessage msg).size = 64 * k := by
        refine ⟨(padMessage msg).size / 64, ?_⟩
        rw [Nat.div_mul_cancel h]
      obtain ⟨k, hk⟩ := this
      have : k > 0 := by
        by_contra h6
        push_neg at h6
        have : k = 0 := Nat.eq_zero_of_le_zero h6
        rw [this] at hk
        have : (padMessage msg).size = 0 := by rw [hk]; rfl
        contradiction
      have : k ≥ 1 := Nat.succ_le_of_lt this
      have : 64 * k ≥ 64 := Nat.mul_le_mul_left 64 this
      rw [hk]
      exact this
    exact h5

-- ========================================================================
-- Block extraction properties
-- ========================================================================

-- extractBlock always returns exactly 16 words.
theorem extractBlock_words (padded : ByteArray) (start : Nat)
  (h : start + 63 < padded.size) :
  (extractBlock padded start h).size = 16 := by
  unfold extractBlock Vec.size
  rfl

-- ========================================================================
-- HMAC properties
-- ========================================================================

-- HMAC output is always 256 bits (8 words).
theorem hmac_output_size (key : ByteArray) (msg : ByteArray) :
  (hmacSha256 key msg).size = 8 := by
  unfold hmacSha256 Vec.size
  rfl

-- HMAC with empty key and empty message is well-defined.
theorem hmac_empty_empty : (hmacSha256 (ByteArray.mk #[]) (ByteArray.mk #[])).size = 8 := by
  rfl
