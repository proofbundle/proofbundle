theorem protocol_relativity_witness :
    Exists (fun f : Bool -> VerdictType => Not (f true = f false)) := by
  exists (fun b => if b then VerdictType.AttributionVerdict else VerdictType.NonAttributionVerdict)
  intro h
  cases h
