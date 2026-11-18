theorem wrongful_action_cost_principle (d : Determination) :
  constraint_innocence_priority d → (d.cost_of_wrongful_action > d.benefit_of_correct_action) := by
  intro h
  exact h
