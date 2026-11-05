theorem tierOf_retier_same (S : SystemState) (r : RootId) (t : Tier) :
    tierOf (applyUpdate S (.retierU r t)) r = t := by
  simp [applyUpdate, tierOf]
