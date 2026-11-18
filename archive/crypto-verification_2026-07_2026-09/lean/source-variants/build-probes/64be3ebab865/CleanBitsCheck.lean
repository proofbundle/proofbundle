import CleanBits
open Clean
theorem c1 : xor32 0xdeadbeef 0x12345678 = 0xcc99e897 := by decide
theorem c2 : and32 0xdeadbeef 0x12345678 = 0x12241668 := by decide
theorem c3 : not32 0xdeadbeef = 0x21524110 := by decide
theorem c4 : rotr32 0xdeadbeef 8 = 0xefdeadbe := by decide
theorem c5 : add32 0xffffffff 2 = 1 := by decide
#print axioms Clean.xor32
#print axioms Clean.and32
#print axioms Clean.not32
#print axioms Clean.rotr32
#print axioms c1
#print axioms c2
#print axioms c3
#print axioms c4
#print axioms c5
