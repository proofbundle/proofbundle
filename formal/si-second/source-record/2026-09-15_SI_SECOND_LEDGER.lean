import «2026-09-15_SI_SECOND_KERNEL»

/-
  2026-09-15_SI_SECOND_LEDGER.lean

  Counting layer. The standard library's natural numbers are used here and not in the
  kernel. The kernel's integers enter only through `Pos.toNat`, checked against decimal
  literals below. Proof standard is the same as the kernel: every declaration in this
  module has an empty axiom set (no propext, no Quot.sound, no Classical.choice,
  no sorry, no native_decide). Tactics and lemmas that carry propext in Lean 4.34.0
  (omega, simp, Nat.add_mul, Nat.mul_assoc, Nat.right_distrib, the div/mod lemmas) are
  not used. Generated constructor injectivity equations are switched off for the
  same reason as in the kernel.
-/

set_option genInjectivity false

namespace SISecond

namespace Pos

/-- The integer a `Pos` term writes. -/
def toNat : Pos → Nat
  | .one => 1
  | .twice p => 2 * p.toNat
  | .twicePlusOne p => 2 * p.toNat + 1

/-! ### The two integers have the stated decimal values -/

theorem caesiumPeriodsPerSecond_value : caesiumPeriodsPerSecond.toNat = 9192631770 := by decide

theorem lightSpeedMetresPerSecond_value : lightSpeedMetresPerSecond.toNat = 299792458 := by decide

/-! ### The kernel's arithmetic computes addition and multiplication -/

def carry : Bool → Nat
  | false => 0
  | true => 1

theorem toNat_succ : ∀ p : Pos, (succ p).toNat = p.toNat + 1
  | .one => rfl
  | .twice _ => rfl
  | .twicePlusOne p => by
      show 2 * (succ p).toNat = 2 * p.toNat + 1 + 1
      rw [toNat_succ p, Nat.mul_add, Nat.mul_one, Nat.add_assoc]

theorem toNat_addCarry : ∀ (c : Bool) (p q : Pos),
    (addCarry c p q).toNat = p.toNat + q.toNat + carry c
  | false, .one, q => by
      show (succ q).toNat = 1 + q.toNat + 0
      rw [toNat_succ, Nat.add_zero, Nat.add_comm 1 q.toNat]
  | true, .one, q => by
      show (succ (succ q)).toNat = 1 + q.toNat + 1
      rw [toNat_succ, toNat_succ, Nat.add_comm 1 q.toNat]
  | false, .twice p, .one => by
      show 2 * p.toNat + 1 = 2 * p.toNat + 1 + 0
      rfl
  | true, .twice p, .one => by
      show 2 * (succ p).toNat = 2 * p.toNat + 1 + 1
      rw [toNat_succ, Nat.mul_add, Nat.mul_one, Nat.add_assoc]
  | false, .twicePlusOne p, .one => by
      show 2 * (succ p).toNat = 2 * p.toNat + 1 + 1 + 0
      rw [toNat_succ, Nat.mul_add, Nat.mul_one, Nat.add_zero]
  | true, .twicePlusOne p, .one => by
      show 2 * (succ p).toNat + 1 = 2 * p.toNat + 1 + 1 + 1
      rw [toNat_succ, Nat.mul_add, Nat.mul_one]
  | false, .twice p, .twice q => by
      show 2 * (addCarry false p q).toNat = 2 * p.toNat + 2 * q.toNat + 0
      rw [toNat_addCarry false p q, Nat.mul_add, Nat.mul_add]
      rfl
  | true, .twice p, .twice q => by
      show 2 * (addCarry false p q).toNat + 1 = 2 * p.toNat + 2 * q.toNat + 1
      rw [toNat_addCarry false p q, Nat.mul_add, Nat.mul_add]
      rfl
  | false, .twice p, .twicePlusOne q => by
      show 2 * (addCarry false p q).toNat + 1 = 2 * p.toNat + (2 * q.toNat + 1) + 0
      rw [toNat_addCarry false p q, Nat.mul_add, Nat.mul_add]
      rfl
  | true, .twice p, .twicePlusOne q => by
      show 2 * (addCarry true p q).toNat = 2 * p.toNat + (2 * q.toNat + 1) + 1
      rw [toNat_addCarry true p q, Nat.mul_add, Nat.mul_add]
      rfl
  | false, .twicePlusOne p, .twice q => by
      show 2 * (addCarry false p q).toNat + 1 = 2 * p.toNat + 1 + 2 * q.toNat + 0
      rw [toNat_addCarry false p q, Nat.mul_add, Nat.mul_add,
          Nat.add_right_comm (2 * p.toNat) 1 (2 * q.toNat)]
      rfl
  | true, .twicePlusOne p, .twice q => by
      show 2 * (addCarry true p q).toNat = 2 * p.toNat + 1 + 2 * q.toNat + 1
      rw [toNat_addCarry true p q, Nat.mul_add, Nat.mul_add,
          Nat.add_right_comm (2 * p.toNat) 1 (2 * q.toNat)]
      rfl
  | false, .twicePlusOne p, .twicePlusOne q => by
      show 2 * (addCarry true p q).toNat = 2 * p.toNat + 1 + (2 * q.toNat + 1) + 0
      rw [toNat_addCarry true p q, Nat.mul_add, Nat.mul_add,
          Nat.add_add_add_comm (2 * p.toNat) 1 (2 * q.toNat) 1]
      rfl
  | true, .twicePlusOne p, .twicePlusOne q => by
      show 2 * (addCarry true p q).toNat + 1 = 2 * p.toNat + 1 + (2 * q.toNat + 1) + 1
      rw [toNat_addCarry true p q, Nat.mul_add, Nat.mul_add,
          Nat.add_add_add_comm (2 * p.toNat) 1 (2 * q.toNat) 1]
      rfl

theorem toNat_add (p q : Pos) : (add p q).toNat = p.toNat + q.toNat :=
  toNat_addCarry false p q

/-- 2a × b = 2(a × b), without Nat.mul_assoc (which carries propext). -/
theorem two_mul_mul (a b : Nat) : 2 * a * b = 2 * (a * b) := by
  rw [Nat.mul_comm (2 * a) b, Nat.two_mul a, Nat.left_distrib, Nat.mul_comm b a,
      Nat.two_mul (a * b)]

theorem toNat_mul : ∀ p q : Pos, (mul p q).toNat = p.toNat * q.toNat
  | .one, q => by
      show q.toNat = 1 * q.toNat
      rw [Nat.one_mul]
  | .twice p, q => by
      show 2 * (mul p q).toNat = 2 * p.toNat * q.toNat
      rw [toNat_mul p q, two_mul_mul]
  | .twicePlusOne p, q => by
      show (addCarry false q (twice (mul p q))).toNat = (2 * p.toNat + 1) * q.toNat
      rw [toNat_addCarry]
      show q.toNat + 2 * (mul p q).toNat + 0 = (2 * p.toNat + 1) * q.toNat
      rw [toNat_mul p q, Nat.add_zero, Nat.add_one_mul (2 * p.toNat) q.toNat,
          two_mul_mul p.toNat q.toNat, Nat.add_comm q.toNat (2 * (p.toNat * q.toNat))]

/-! ### Distinct terms write distinct integers -/

theorem mul_two_inj : ∀ a b : Nat, 2 * a = 2 * b → a = b
  | 0, 0, _ => rfl
  | 0, _ + 1, h => nomatch h
  | _ + 1, 0, h => nomatch h
  | a + 1, b + 1, h => congrArg (· + 1) (mul_two_inj a b (Nat.succ.inj (Nat.succ.inj h)))

theorem twice_ne_twice_add_one : ∀ a b : Nat, 2 * a ≠ 2 * b + 1
  | 0, _, h => nomatch h
  | _ + 1, 0, h => nomatch Nat.succ.inj h
  | a + 1, b + 1, h => twice_ne_twice_add_one a b (Nat.succ.inj (Nat.succ.inj h))

theorem toNat_pos : ∀ p : Pos, 0 < p.toNat
  | .one => Nat.zero_lt_succ 0
  | .twice p => by
      show 0 < 2 * p.toNat
      rw [Nat.two_mul]
      exact Nat.lt_of_lt_of_le (toNat_pos p) (Nat.le_add_right p.toNat p.toNat)
  | .twicePlusOne p => Nat.zero_lt_succ (2 * p.toNat)

theorem toNat_inj : ∀ p q : Pos, p.toNat = q.toNat → p = q
  | .one, .one, _ => rfl
  | .one, .twice q, h => absurd h.symm (twice_ne_twice_add_one q.toNat 0)
  | .one, .twicePlusOne q, h =>
      absurd (mul_two_inj 0 q.toNat (Nat.succ.inj h)) (Nat.ne_of_lt (toNat_pos q))
  | .twice p, .one, h => absurd h (twice_ne_twice_add_one p.toNat 0)
  | .twice p, .twice q, h => congrArg twice (toNat_inj p q (mul_two_inj _ _ h))
  | .twice p, .twicePlusOne q, h => absurd h (twice_ne_twice_add_one p.toNat q.toNat)
  | .twicePlusOne p, .one, h =>
      absurd (mul_two_inj 0 p.toNat (Nat.succ.inj h.symm)) (Nat.ne_of_lt (toNat_pos p))
  | .twicePlusOne p, .twice q, h => absurd h.symm (twice_ne_twice_add_one q.toNat p.toNat)
  | .twicePlusOne p, .twicePlusOne q, h =>
      congrArg twicePlusOne (toNat_inj p q (mul_two_inj _ _ (Nat.succ.inj h)))

end Pos

/-! ### What `IsDuration` means in ordinary integers -/

theorem periodsFor_toNat (n : Pos) : (periodsFor n).toNat = n.toNat * 9192631770 := by
  show (Pos.mul n caesiumPeriodsPerSecond).toNat = n.toNat * 9192631770
  rw [Pos.toNat_mul, Pos.caesiumPeriodsPerSecond_value]

/-- The kernel accepts a record as `n` seconds exactly when it meets the definition's form
and declares n × 9 192 631 770 periods. -/
theorem isDuration_iff_count (n : Pos) (r : Realization) :
    IsDuration n r ↔ MeetsDefinitionForm r ∧ r.periods.toNat = n.toNat * 9192631770 :=
  ⟨fun ⟨hf, hp⟩ => ⟨hf, by rw [hp, periodsFor_toNat]⟩,
   fun ⟨hf, hc⟩ => ⟨hf, Pos.toNat_inj _ _ (by rw [hc, periodsFor_toNat])⟩⟩

/-! ## Software clock driven by an external tick

`step` runs once per incoming tick. Nothing here checks that ticks are evenly spaced or
have any period: `ticksPerSecond` is taken from the description of the tick source.
Correctness below is correctness of counting, conditional on nothing physical. -/

structure ClockState where
  seconds : Nat
  phase : Nat
  deriving DecidableEq, Repr

def step (ticksPerSecond : Nat) (s : ClockState) : ClockState :=
  if s.phase + 1 = ticksPerSecond then ⟨s.seconds + 1, 0⟩ else ⟨s.seconds, s.phase + 1⟩

/-- State after `k` ticks from zero. -/
def run (ticksPerSecond : Nat) : Nat → ClockState
  | 0 => ⟨0, 0⟩
  | k + 1 => step ticksPerSecond (run ticksPerSecond k)

theorem step_of_rollover (L : Nat) (s : ClockState) (h : s.phase + 1 = L) :
    step L s = ⟨s.seconds + 1, 0⟩ := ite_eq_left h

theorem step_of_no_rollover (L : Nat) (s : ClockState) (h : ¬ s.phase + 1 = L) :
    step L s = ⟨s.seconds, s.phase + 1⟩ := ite_eq_right h

/-- Each tick adds exactly one to seconds × ticksPerSecond + phase. -/
theorem step_total (L : Nat) (s : ClockState) :
    (step L s).seconds * L + (step L s).phase = s.seconds * L + s.phase + 1 := by
  by_cases h : s.phase + 1 = L
  · rw [step_of_rollover L s h]
    show (s.seconds + 1) * L + 0 = s.seconds * L + s.phase + 1
    rw [Nat.add_zero, Nat.add_one_mul s.seconds L, Nat.add_assoc, h]
  · rw [step_of_no_rollover L s h]
    show s.seconds * L + (s.phase + 1) = s.seconds * L + s.phase + 1
    rw [Nat.add_assoc]

/-- Phase stays below ticksPerSecond. -/
theorem step_phase_lt (L : Nat) (hL : 0 < L) (s : ClockState) (hs : s.phase < L) :
    (step L s).phase < L := by
  by_cases h : s.phase + 1 = L
  · rw [step_of_rollover L s h]; exact hL
  · rw [step_of_no_rollover L s h]; exact Nat.lt_of_le_of_ne (Nat.succ_le_of_lt hs) h

/-- After k ticks, seconds × ticksPerSecond + phase = k. -/
theorem run_total (L k : Nat) : (run L k).seconds * L + (run L k).phase = k := by
  induction k with
  | zero =>
      show 0 * L + 0 = 0
      exact Nat.zero_mul L
  | succ k ih =>
      show (step L (run L k)).seconds * L + (step L (run L k)).phase = k + 1
      rw [step_total, ih]

/-- After any number of ticks, phase < ticksPerSecond. With `run_total`, this says
`seconds` and `phase` are the quotient and remainder of the tick count. -/
theorem run_phase_lt (L : Nat) (hL : 0 < L) (k : Nat) : (run L k).phase < L := by
  induction k with
  | zero => exact hL
  | succ k ih => exact step_phase_lt L hL (run L k) ih

/-! ### Instance: each tick is one period of the caesium radiation -/

def caesiumTicksPerSecond : Nat := caesiumPeriodsPerSecond.toNat

theorem caesiumTicksPerSecond_pos : 0 < caesiumTicksPerSecond := by decide

theorem caesium_run_total (k : Nat) :
    (run caesiumTicksPerSecond k).seconds * 9192631770
      + (run caesiumTicksPerSecond k).phase = k := by
  have h := run_total caesiumTicksPerSecond k
  unfold caesiumTicksPerSecond at h
  rw [Pos.caesiumPeriodsPerSecond_value] at h
  unfold caesiumTicksPerSecond
  rw [Pos.caesiumPeriodsPerSecond_value]
  exact h

theorem caesium_run_phase_lt (k : Nat) : (run caesiumTicksPerSecond k).phase < 9192631770 := by
  have h := run_phase_lt caesiumTicksPerSecond caesiumTicksPerSecond_pos k
  unfold caesiumTicksPerSecond at h
  rw [Pos.caesiumPeriodsPerSecond_value] at h
  unfold caesiumTicksPerSecond
  rw [Pos.caesiumPeriodsPerSecond_value]
  exact h

/-- Small worked case: 10 ticks at 3 ticks per second is 3 seconds and 1 tick. -/
theorem run_three_ten : run 3 10 = ⟨3, 1⟩ := by decide

/-! ### Boundary facts for a fixed-width implementation -/

/-- A single 64-bit count of caesium periods wraps after 2 006 688 023 seconds
(about 63.6 years). -/
theorem raw64_caesium_count_wrap_seconds : 2 ^ 64 / 9192631770 = 2006688023 := by decide

/-- In the split state, phase always fits in 34 bits. -/
theorem caesium_phase_fits_34_bits : 9192631770 < 2 ^ 34 := by decide

end SISecond
