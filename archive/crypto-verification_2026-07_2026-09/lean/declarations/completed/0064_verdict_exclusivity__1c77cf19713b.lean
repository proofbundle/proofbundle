theorem verdict_exclusivity :
    Not (VerdictType.AttributionVerdict = VerdictType.NonAttributionVerdict) /\
    Not (VerdictType.AttributionVerdict = VerdictType.NullInsufficientlyTested) /\
    Not (VerdictType.AttributionVerdict = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.AttributionVerdict = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.NullInsufficientlyTested) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.NonAttributionVerdict = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.NullStructurallyUnresolvable) /\
    Not (VerdictType.NullInsufficientlyTested = VerdictType.IndeterminateVerdict) /\
    Not (VerdictType.NullStructurallyUnresolvable = VerdictType.IndeterminateVerdict) := by
  repeat constructor <;> intro h <;> cases h
