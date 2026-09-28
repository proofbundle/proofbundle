import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem append_cancel_aux {α : Type} : ∀ (l1 l2 x1 x2 : List α),
    l1.length = l2.length → l1 ++ x1 = l2 ++ x2 → l1 = l2 ∧ x1 = x2
  | [], l2, x1, x2, hl, _h => by
      have h0 : l2 = [] := by
        have hz : l2.length = 0 := by simpa using hl.symm
        simpa [List.length_eq_zero] using hz
      subst h0
      simp at _h
      exact ⟨rfl, _h⟩
  | _a :: _t, [], _x1, _x2, hl, _h => by
      simp at hl
  | a :: t, b :: t2, x1, x2, hl, h => by
      simp [List.cons_append] at h
      obtain ⟨hab, htx⟩ := h
      subst hab
      have hl' : t.length = t2.length := by
        have e := hl
        simp only [List.length_cons] at e
        omega
      obtain ⟨h1, h2⟩ := append_cancel_aux t t2 x1 x2 hl' htx
      subst h1
      subst h2
      exact ⟨rfl, rfl⟩

/-- Converting a natural number to a byte and back yields the number
modulo 256 (`UInt8.ofNat` wraps modulo 2^8).  This is core's
`UInt8.toNat_ofNat'`, restated with the modulus evaluated to 256. -/

end ProofBundle.Crypto.SHA256
