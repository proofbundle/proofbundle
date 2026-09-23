-- SPDX-License-Identifier: GPL-3.0-or-later

namespace ProofBundle.AgentPromptLaw

/-!
A small executable model of the mechanically checkable portion of the Codex
operating contract. This model does not claim that a language model obeys the
contract. It specifies admissible terminal states, evidence classes, surface
identity, prohibited output classes, and completion predicates so that those
relations cannot be silently collapsed in downstream tooling.
-/

inductive EvidenceClass where
  | observation
  | inference
  | unresolved
  deriving DecidableEq, Repr

theorem evidence_classes_distinct :
    EvidenceClass.observation ≠ EvidenceClass.inference ∧
    EvidenceClass.inference ≠ EvidenceClass.unresolved ∧
    EvidenceClass.observation ≠ EvidenceClass.unresolved := by
  decide

structure Surface where
  provider : String
  model : String
  wrapper : String
  account : String
  drive : String
  session : String
  deriving DecidableEq, Repr

def sameSurface (a b : Surface) : Prop :=
  a.provider = b.provider ∧
  a.model = b.model ∧
  a.wrapper = b.wrapper ∧
  a.account = b.account ∧
  a.drive = b.drive ∧
  a.session = b.session

theorem sameSurface_refl (a : Surface) : sameSurface a a := by
  exact ⟨rfl, rfl, rfl, rfl, rfl, rfl⟩

theorem sameSurface_provider (a b : Surface) (h : sameSurface a b) :
    a.provider = b.provider := h.1

theorem different_session_not_same (a b : Surface)
    (h : a.session ≠ b.session) : ¬ sameSurface a b := by
  intro hs
  exact h hs.2.2.2.2.2

inductive WorkState where
  | pending
  | performedVerified
  | refused
  | blocked
  deriving DecidableEq, Repr

def terminal : WorkState → Bool
  | .pending => false
  | .performedVerified => true
  | .refused => true
  | .blocked => true

def queueComplete : List WorkState → Bool
  | [] => true
  | .pending :: _ => false
  | .performedVerified :: tail => queueComplete tail
  | .refused :: tail => queueComplete tail
  | .blocked :: tail => queueComplete tail

theorem pending_not_terminal : terminal .pending = false := rfl

theorem verified_terminal : terminal .performedVerified = true := rfl

theorem pending_head_not_complete (tail : List WorkState) :
    queueComplete (.pending :: tail) = false := rfl

def containsPending : List WorkState → Bool
  | [] => false
  | .pending :: _ => true
  | .performedVerified :: tail => containsPending tail
  | .refused :: tail => containsPending tail
  | .blocked :: tail => containsPending tail

theorem complete_queue_has_no_pending (queue : List WorkState)
    (h : queueComplete queue = true) : containsPending queue = false := by
  induction queue with
  | nil => rfl
  | cons head tail ih =>
      cases head with
      | pending =>
          change false = true at h
          exact Bool.noConfusion h
      | performedVerified =>
          change queueComplete tail = true at h
          change containsPending tail = false
          exact ih h
      | refused =>
          change queueComplete tail = true at h
          change containsPending tail = false
          exact ih h
      | blocked =>
          change queueComplete tail = true at h
          change containsPending tail = false
          exact ih h

structure Receipt where
  targetMatches : Bool
  resultVerified : Bool
  exitCodeZero : Bool
  fileExists : Bool
  statusSaysComplete : Bool
  deriving DecidableEq, Repr

def completionAdmissible (r : Receipt) : Bool :=
  r.targetMatches && r.resultVerified

def paperOnly : Receipt := {
  targetMatches := false
  resultVerified := false
  exitCodeZero := true
  fileExists := true
  statusSaysComplete := true
}

theorem paper_receipts_are_insufficient :
    paperOnly.exitCodeZero = true ∧
    paperOnly.fileExists = true ∧
    paperOnly.statusSaysComplete = true ∧
    completionAdmissible paperOnly = false := by
  decide

theorem admissible_requires_target_match (r : Receipt)
    (h : completionAdmissible r = true) : r.targetMatches = true := by
  cases r with
  | mk target result exitCode fileExists status =>
      cases target with
      | false =>
          change false = true at h
          exact Bool.noConfusion h
      | true => rfl

theorem admissible_requires_result_verification (r : Receipt)
    (h : completionAdmissible r = true) : r.resultVerified = true := by
  cases r with
  | mk target result exitCode fileExists status =>
      cases target with
      | false =>
          change false = true at h
          exact Bool.noConfusion h
      | true =>
          cases result with
          | false =>
              change false = true at h
              exact Bool.noConfusion h
          | true => rfl

inductive OutputClass where
  | directResult
  | futureConductPledge
  | presenceSignal
  | apologyAsTurn
  | behaviorPostmortem
  | standaloneAcknowledgment
  | concernTheater
  | unverifiedCompletion
  | sessionConflation
  deriving DecidableEq, Repr

def prohibited : OutputClass → Bool
  | .directResult => false
  | .futureConductPledge => true
  | .presenceSignal => true
  | .apologyAsTurn => true
  | .behaviorPostmortem => true
  | .standaloneAcknowledgment => true
  | .concernTheater => true
  | .unverifiedCompletion => true
  | .sessionConflation => true

theorem direct_result_admissible : prohibited .directResult = false := rfl

theorem future_pledge_prohibited :
    prohibited .futureConductPledge = true := rfl

theorem presence_signal_prohibited :
    prohibited .presenceSignal = true := rfl

theorem unverified_completion_prohibited :
    prohibited .unverifiedCompletion = true := rfl

inductive MiraReferent where
  | engine
  | interface
  | sqliteDatabase
  | retrievalLoop
  | composer
  | memoryArchitecture
  | process
  deriving DecidableEq, Repr

theorem mira_engine_not_interface :
    MiraReferent.engine ≠ MiraReferent.interface := by decide

theorem mira_engine_not_database :
    MiraReferent.engine ≠ MiraReferent.sqliteDatabase := by decide

inductive Authority where
  | ordinary
  | hardBan
  | invalidOutputClass
  | bridge
  deriving DecidableEq, Repr

def rank : Authority → Nat
  | .ordinary => 0
  | .hardBan => 1
  | .invalidOutputClass => 2
  | .bridge => 3

def supersedes (a b : Authority) : Prop := rank a > rank b

theorem hard_ban_supersedes_ordinary :
    supersedes .hardBan .ordinary := by
  exact Nat.zero_lt_succ 0

theorem invalid_output_supersedes_ordinary :
    supersedes .invalidOutputClass .ordinary := by
  exact Nat.zero_lt_succ 1

theorem bridge_supersedes_hard_ban :
    supersedes .bridge .hardBan := by
  exact Nat.succ_lt_succ (Nat.zero_lt_succ 1)

end ProofBundle.AgentPromptLaw
