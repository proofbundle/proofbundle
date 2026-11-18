theorem attribution_not_hereditary_up :
    (∃ S I J, subinterval I J ∧ Attr C1 C2 C3 C4 C5 S I ∧ ¬Attr C1 C2 C3 C4 C5 S J) →
    ¬(∀ S I J, subinterval I J → Attr C1 C2 C3 C4 C5 S I → Attr C1 C2 C3 C4 C5 S J) :=
  fun ⟨S, I, J, hsub, hattr, hnotattr⟩ hall =>
    hnotattr (hall S I J hsub hattr)
