theorem conjunctive_blocking {s : S} {i : I}
    (h : Not (C1 s i) \/ Not (C2 s i) \/ Not (C3 s i) \/ Not (C4 s i) \/ Not (C5 s i)) :
    Not (WarrantedAttribution C1 C2 C3 C4 C5 CertAboveTheta s i) := by
  unfold WarrantedAttribution
  intro hcontra
  rcases h with h1 | h2 | h3 | h4 | h5
  · exact h1 hcontra.1
  · exact h2 hcontra.2.1
  · exact h3 hcontra.2.2.1
  · exact h4 hcontra.2.2.2.1
  · exact h5 hcontra.2.2.2.2.1
