theorem gauge_stability (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 S I ↔
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I :=
  ⟨gauge_preserves_attribution C1 C2 C3 C4 C5 gauge_transform
     g_preserves_C1 g_preserves_C2 g_preserves_C3 g_preserves_C4 g_preserves_C5 S I,
   gauge_reflects_attribution C1 C2 C3 C4 C5 gauge_transform
     g_reflects_C1 g_reflects_C2 g_reflects_C3 g_reflects_C4 g_reflects_C5 S I⟩
