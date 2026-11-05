theorem innocence_priority (d : Determination) :
  C0_INNOCENT d → (d.cost_wrongful > d.benefit_correct) := by
  intro h
  exact h
