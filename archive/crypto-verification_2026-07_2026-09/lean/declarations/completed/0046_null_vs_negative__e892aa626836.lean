theorem null_vs_negative :
    Not (VerdictType.NullStructurallyUnresolvable = VerdictType.NonAttributionVerdict) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.NonAttributionVerdict) := by
  constructor <;> intro h <;> cases h
