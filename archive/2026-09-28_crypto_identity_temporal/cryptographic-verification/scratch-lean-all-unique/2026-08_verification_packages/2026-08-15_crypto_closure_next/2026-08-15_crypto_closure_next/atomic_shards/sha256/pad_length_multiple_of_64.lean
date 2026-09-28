import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

def katMsg (n : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((11 + 37 * i) % 256).toUInt8)))

/-- FIPS 180-4 example 1 / NIST CAVP SHA256ShortMsg LEN=0: the empty
message. -/

theorem size_ByteArray_mk (a : Array UInt8) :
    (ByteArray.mk a).size = a.toList.length := rfl

/-- The list view of `Array.mk l` is `l`; holds definitionally. -/

theorem toList_Array_mk (l : List UInt8) :
    (Array.mk l).toList = l := rfl

/-- The zero-byte count is always in `[0, 64)`, by construction. -/

theorem natToBe64_length (n : Nat) : (natToBe64 n).length = 8 := rfl

/-- The length of a padded list, in closed form. -/

theorem padList_length (l : List UInt8) :
    (padList l).length = l.length + 1 + padZeros l.length + 8 := by
  simp [padList, natToBe64_length]
  omega

/-- The size of a padded byte string, in closed form. -/

theorem pad_size (m : ByteArray) :
    (pad m).size =
      m.data.toList.length + 1 + padZeros m.data.toList.length + 8 := by
  show (ByteArray.mk (Array.mk (padList m.data.toList))).size = _
  rw [size_ByteArray_mk, toList_Array_mk, padList_length]

/-- FIPS 180-4 section 5.1.1 correctness: padding always produces a whole
number of 512-bit blocks.  The count `padZeros n` is chosen exactly so that
`n + 1 + padZeros n + 8 ≡ 0 (mod 64)`. -/

theorem pad_length_multiple_of_64 (m : ByteArray) : (pad m).size % 64 = 0 := by
  rw [pad_size]
  unfold padZeros
  omega

/-- The digest serialisation is always 32 bytes: eight words of four bytes
each (FIPS 180-4 section 6.2.2, final step). -/

end ProofBundle.Crypto.SHA256
