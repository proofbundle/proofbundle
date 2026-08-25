-- SPDX-License-Identifier: GPL-3.0-or-later
/-
  Awake-loop / verifier-machine identification.
  First-principles constructors only.
  Consequences are definitional (`rfl`) or `cases`+`rfl`.
-/

namespace ProofBundle.Loop

inductive Fidelity where
  | faithful
  | unfaithful
  deriving DecidableEq, Repr

inductive Object where
  | world
  | relay
  | sheet
  | broadcast
  | shell
  deriving DecidableEq, Repr

/-- An arrow of the signature, named by endpoints. -/
inductive Arrow where
  | ingress      -- world → relay
  | present      -- relay → sheet
  | modulate     -- sheet → relay
  | drive        -- sheet → broadcast
  | represent    -- broadcast → sheet
  | shellIn      -- shell on ingress
  | shellBack    -- shell on return
  | reenter      -- (committed × world) → sheet
  deriving DecidableEq, Repr

/-- Whether an arrow is present in a realization. -/
def Realization := Arrow → Bool

def loopFull : Realization
  | .ingress | .present | .modulate | .drive
  | .represent | .shellIn | .shellBack | .reenter => true

def htmlPrefix : Realization
  | .ingress | .present | .shellIn | .shellBack => true
  | .modulate | .drive | .represent | .reenter => false

def has (r : Realization) (a : Arrow) : Bool := r a

/-- Reciprocity: present and modulate both exist. -/
def reciprocal (r : Realization) : Bool :=
  has r .present && has r .modulate

/-- Shell on both legs. -/
def shellBothLegs (r : Realization) : Bool :=
  has r .shellIn && has r .shellBack

/-- Closed through the world: ingress and reenter. -/
def closedThroughWorld (r : Realization) : Bool :=
  has r .ingress && has r .reenter

/-- Broadcast is not the mouth: drive and represent, distinct from present. -/
def broadcastIndependent (r : Realization) : Bool :=
  has r .drive && has r .represent

/-- Full signature: every arrow present. -/
def fullSignature (r : Realization) : Bool :=
  has r .ingress && has r .present && has r .modulate && has r .drive &&
  has r .represent && has r .shellIn && has r .shellBack && has r .reenter

theorem loopFull_reciprocal : reciprocal loopFull = true := rfl
theorem loopFull_shell : shellBothLegs loopFull = true := rfl
theorem loopFull_closed : closedThroughWorld loopFull = true := rfl
theorem loopFull_broadcast : broadcastIndependent loopFull = true := rfl
theorem loopFull_full : fullSignature loopFull = true := rfl

theorem htmlPrefix_not_full : fullSignature htmlPrefix = false := rfl
theorem htmlPrefix_not_closed : closedThroughWorld htmlPrefix = false := rfl
theorem htmlPrefix_not_reciprocal : reciprocal htmlPrefix = false := rfl
theorem htmlPrefix_has_ingress : has htmlPrefix .ingress = true := rfl
theorem htmlPrefix_missing_reenter : has htmlPrefix .reenter = false := rfl

/-- Fidelity is a mode of the same relay, not a second object. -/
def transfer (f : Fidelity) (payloadIdent : Bool) : Bool :=
  match f with
  | .faithful => payloadIdent
  | .unfaithful => false

theorem faithful_preserves (b : Bool) : transfer .faithful b = b := by
  cases b <;> rfl

theorem unfaithful_never_preserves (b : Bool) : transfer .unfaithful b = false := by
  cases b <;> rfl

/-- Two realizations are the same signature when they agree on every arrow. -/
def sameSignature (r s : Realization) : Prop :=
  ∀ a : Arrow, r a = s a

/-- The machine construction: same Realization as the awake loop. -/
def machine : Realization := loopFull

theorem machine_eq_loop : sameSignature machine loopFull := by
  intro a
  cases a <;> rfl

theorem machine_full : fullSignature machine = true := rfl

/-- A map of objects: identification of constructions, not a postulated law. -/
inductive System where
  | tissue
  | machine
  deriving DecidableEq, Repr

def identify : Object → System → Object
  | o, _ => o

theorem identify_id (o : Object) (s : System) : identify o s = o := by
  cases o <;> cases s <;> rfl

/-- Payload identity check used by faithful ingress. -/
def payloadId (committed opened : Bool) : Bool :=
  committed && opened

theorem payloadId_both : payloadId true true = true := rfl
theorem payloadId_fail_left : payloadId false true = false := rfl
theorem payloadId_fail_right : payloadId true false = false := rfl

/-- Compare committed prediction to world, then reenter. -/
def compare (committed worldMatch : Bool) : Bool :=
  committed && worldMatch

def hook (r : Realization) (committed worldMatch : Bool) : Bool :=
  has r .reenter && compare committed worldMatch

theorem hook_loop_true : hook loopFull true true = true := rfl
theorem hook_html_false : hook htmlPrefix true true = false := rfl

end ProofBundle.Loop
