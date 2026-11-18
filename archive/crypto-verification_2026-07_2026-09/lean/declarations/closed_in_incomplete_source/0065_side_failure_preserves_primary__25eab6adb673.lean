theorem side_failure_preserves_primary (b : BundleT) (i : Nat) :
    bundleVerified primaryValid b → sideValid b i = false → bundleVerified primaryValid b :=
  fun h _ => h
