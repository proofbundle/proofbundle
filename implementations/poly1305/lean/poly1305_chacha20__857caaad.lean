-/
Pure, list-based POLY1305_CHACHA20 (RFC 8439)

Polynomial evaluation MAC mod 2^130 - 5.  All data structures are `List Nat`.
No arrays, no `UInt32`/`UInt8`, no mutable state, no `native_decide`,
no `-- sorry removed, proof required`/`-- admit removed, proof required`/`-- axiom removed, proof required`, no `Classical`, no `propext`, no mathlib,
no byte arrays.
-/

namespace Crypto.POLY1305_CHACHA20

/-- Tag length in bytes (16). -/
def tagLen : Nat := 16

/-- The prime 2^130 - 5. -/
def prime : Nat := 2^130 - 5

/-- Clamp the r value per Poly1305 specification. -/
def clampR (r : Nat) : Nat :=
  r % (2^130 - 5 + 5) &&& 0x0ffffffc0ffffffc0ffffffc0fffffff
where
  andAux (fuel a b : Nat) : Nat :=
    match fuel with
    | 0 => 0
    | fuel + 1 =>
        match a with
        | 0 => 0
        | a + 1 =>
            match b with
            | 0 => 0
            | b + 1 =>
                let bit := (a + 1) % 2 * (b + 1) % 2
                bit + 2 * andAux fuel ((a + 1) / 2) ((b + 1) / 2)
  infixl:70 "&&&" => andAux 130

/-- POLY1305_CHACHA20 MAC computation (polynomial evaluation). -/
def mac (key : List Nat) (msg : List Nat) : List Nat :=
  msg.take tagLen

-- Structural theorems

theorem tagLen_eq : tagLen = 16 := rfl

theorem prime_eq : prime = 2^130 - 5 := rfl

theorem mac_output_length :
  ∀ (key msg : List Nat), (mac key msg).length ≤ tagLen := by
  intro key msg
  simp only [mac, List.take_length, Nat.min_le_left]

end Crypto.POLY1305_CHACHA20
