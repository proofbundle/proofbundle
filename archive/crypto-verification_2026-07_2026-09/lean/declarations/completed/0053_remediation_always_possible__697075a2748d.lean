theorem remediation_always_possible (d : Determination) :
  ¬(is_admissible d) → ∃ d' : Determination, is_admissible d' := by
  intro _
  let d' : Determination := {
    consequence_magnitude := min d.consequence_magnitude (d.confidence_level * d.severity_level)
    is_reversible := true
    cost_of_wrongful_action := max d.cost_of_wrongful_action (d.benefit_of_correct_action + 1)
    benefit_of_correct_action := d.benefit_of_correct_action
    confidence_level := min d.confidence_level 0.95
    severity_level := d.severity_level
    information_suppressed := d.information_suppressed
    hidden_uncertainty_penalty := if d.information_suppressed then max d.hidden_uncertainty_penalty 0.3 else d.hidden_uncertainty_penalty
    has_specification_control := false
    has_verification_control := false
    has_enforcement_control := false
    is_self_manufactured_crisis := false
  }
  use d'
  unfold is_admissible constraint_life_preservation constraint_reversibility
         constraint_no_manufactured_crisis constraint_innocence_priority
         constraint_fallibility constraint_proportionality constraint_information_transparency
         constraint_separation_of_powers
  simp [min_nonneg, max_def]
