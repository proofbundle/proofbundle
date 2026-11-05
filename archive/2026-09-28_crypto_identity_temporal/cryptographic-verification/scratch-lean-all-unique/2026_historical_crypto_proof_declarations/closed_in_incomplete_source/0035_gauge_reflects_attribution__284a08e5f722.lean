theorem gauge_reflects_attribution (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I →
    Attribution' C1 C2 C3 C4 C5 S I :=
  fun ⟨h1, h2, h3, h4, h5⟩ =>
    ⟨g_reflects_C1 S I h1, g_reflects_C2 S I h2,
     g_reflects_C3 S I h3, g_reflects_C4 S I h4,
     g_reflects_C5 S I h5⟩
