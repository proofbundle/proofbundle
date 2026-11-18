theorem attribution_transfers_with_proof (S : System) (I J : Interval) :
    subinterval J I →
    Attr C1 C2 C3 C4 C5 S I →
    (C1 S I → C1 S J) → (C2 S I → C2 S J) →
    (C3 S I → C3 S J) → (C4 S I → C4 S J) →
    (C5 S I → C5 S J) →
    Attr C1 C2 C3 C4 C5 S J :=
  fun _ ⟨h1, h2, h3, h4, h5⟩ t1 t2 t3 t4 t5 =>
    ⟨t1 h1, t2 h2, t3 h3, t4 h4, t5 h5⟩
