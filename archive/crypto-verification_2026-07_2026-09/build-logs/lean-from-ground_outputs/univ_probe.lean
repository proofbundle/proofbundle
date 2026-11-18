-- Probe: can Church-encoded data built only from Sort/Pi select between values of its own encoded types?
universe u
def CBool : Type 1 := ∀ (X : Type), X → X → X
def cif (b : CBool) {X : Type} (t f : X) : X := b X t f
def CPair (A B : Type 1) : Type 2 := ∀ (X : Type 1), (A → B → X) → X
def Word2 : Type 2 := CPair CBool CBool
-- 1. a bit selecting between two bits: needs X := CBool : Type 1, but b eliminates only into Type
def sel_bit (b : CBool) (t f : CBool) : CBool := cif b t f
-- 2. Word2 is Type 2, so a pair of Word2 cannot be built with the same CPair
def Word4 : Type 3 := CPair Word2 Word2
