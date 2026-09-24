inductive Polarity : Type where
  | lo : Polarity
  | hi : Polarity
structure Line where
  from : Polarity
  to   : Polarity
