theorem score_insufficiency {s : S} {i : I}
    (_hcert : CertAboveTheta s i)
    (hfail : Not (C1 s i) \/ Not (C2 s i) \/ Not (C3 s i) \/ Not (C4 s i) \/ Not (C5 s i)) :
    Not (WarrantedAttribution C1 C2 C3 C4 C5 CertAboveTheta s i) := by
  exact conjunctive_blocking C1 C2 C3 C4 C5 CertAboveTheta hfail
