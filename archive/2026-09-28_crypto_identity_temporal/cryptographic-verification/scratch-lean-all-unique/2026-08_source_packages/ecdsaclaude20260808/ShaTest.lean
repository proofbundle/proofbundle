import CleanSha
set_option maxRecDepth 4000000
open Clean CleanSha

def Kc : List Nat :=
[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
 0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
 0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
 0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
 0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
 0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
 0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]

def H0c : St := ⟨0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
                 0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19⟩

-- padded block for "abc": 0x61626380, twelve zero words, then bit length 24
def blk : List Nat :=
  [0x61626380,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24]

def win0 : Win := ⟨0x61626380,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24⟩
def sched : List Nat := blk ++ expand 48 win0
def final : St := rounds H0c Kc sched

-- SHA-256("abc") = ba7816bf 8f01cfea 414140de 5dae2223 b00361a3 96177a9c b410ff61 f20015ad
def digest : List Nat :=
  [add32 final.a 0x6a09e667, add32 final.b 0xbb67ae85,
   add32 final.c 0x3c6ef372, add32 final.d 0xa54ff53a,
   add32 final.e 0x510e527f, add32 final.f 0x9b05688c,
   add32 final.g 0x1f83d9ab, add32 final.h 0x5be0cd19]

-- SHA-256("abc") = ba7816bf 8f01cfea 414140de 5dae2223 b00361a3 96177a9c b410ff61 f20015ad
theorem sha_abc :
    digest = [0xba7816bf, 0x8f01cfea, 0x414140de, 0x5dae2223,
              0xb00361a3, 0x96177a9c, 0xb410ff61, 0xf20015ad] := by decide

#print axioms sha_abc
