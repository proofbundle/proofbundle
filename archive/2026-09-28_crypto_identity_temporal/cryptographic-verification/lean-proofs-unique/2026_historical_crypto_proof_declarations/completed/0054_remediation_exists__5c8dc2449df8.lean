theorem remediation_exists (d : Determination) :
  ¬(Admissible d) → ∃ d' : Determination, Admissible d' := by
  intro _
  let d' : Determination := {
    flow := min d.flow (d.confidence * d.severity)
    reversible := true
    cost_wrongful := max d.cost_wrongful (d.benefit_correct + 1)
    benefit_correct := d.benefit_correct
    confidence := min d.confidence 0.95
    severity := d.severity
    suppressed_info := d.suppressed_info
    hidden_U := if d.suppressed_info then max d.hidden_U 0.3 else d.hidden_U
    control_spec := false
    control_verify := false
    control_enforce := false
    is_self_vortex := false
  }
  use d'
  unfold Admissible C0_LIFE C0_REV C0_VORTEX C0_INNOCENT
  simp [min_nonneg, max_def]
