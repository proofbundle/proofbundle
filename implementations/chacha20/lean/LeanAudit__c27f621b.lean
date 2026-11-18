import Assembled

def auditWord32OfNat (n : Nat) : Word32 :=
  mkWord32
    (n.testBit 31) (n.testBit 30) (n.testBit 29) (n.testBit 28)
    (n.testBit 27) (n.testBit 26) (n.testBit 25) (n.testBit 24)
    (n.testBit 23) (n.testBit 22) (n.testBit 21) (n.testBit 20)
    (n.testBit 19) (n.testBit 18) (n.testBit 17) (n.testBit 16)
    (n.testBit 15) (n.testBit 14) (n.testBit 13) (n.testBit 12)
    (n.testBit 11) (n.testBit 10) (n.testBit 9)  (n.testBit 8)
    (n.testBit 7)  (n.testBit 6)  (n.testBit 5)  (n.testBit 4)
    (n.testBit 3)  (n.testBit 2)  (n.testBit 1)  (n.testBit 0)

def auditWord32ToNat (w : Word32) : Nat :=
  (word32ToBits w).foldl (fun acc bit => acc * 2 + bit) 0

def auditQuarterRound :=
  quarter_round
    (auditWord32OfNat 0x11111111)
    (auditWord32OfNat 0x01020304)
    (auditWord32OfNat 0x9b8d6f43)
    (auditWord32OfNat 0x01234567)

def auditQuarterRoundActual : List Nat :=
  [ auditWord32ToNat (cfst auditQuarterRound)
  , auditWord32ToNat (cfst (csnd auditQuarterRound))
  , auditWord32ToNat (cfst (csnd (csnd auditQuarterRound)))
  , auditWord32ToNat (csnd (csnd (csnd auditQuarterRound)))
  ]

def auditQuarterRoundExpected : List Nat :=
  [0xea2a92f4, 0xcb1cf8ce, 0x4581472e, 0x5881c4bb]

def auditKey : CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 (CPair Word32 Word32)))))) :=
  cpair (auditWord32OfNat 0x03020100)
    (cpair (auditWord32OfNat 0x07060504)
      (cpair (auditWord32OfNat 0x0b0a0908)
        (cpair (auditWord32OfNat 0x0f0e0d0c)
          (cpair (auditWord32OfNat 0x13121110)
            (cpair (auditWord32OfNat 0x17161514)
              (cpair (auditWord32OfNat 0x1b1a1918)
                (auditWord32OfNat 0x1f1e1d1c)))))))

def auditNonce : CPair Word32 (CPair Word32 Word32) :=
  cpair (auditWord32OfNat 0x09000000)
    (cpair (auditWord32OfNat 0x4a000000)
      (auditWord32OfNat 0x00000000))

def auditBlock :=
  chacha20_block auditKey auditNonce (auditWord32OfNat 1)

def auditBlockActual : List Nat :=
  [ auditWord32ToNat (ch0 auditBlock), auditWord32ToNat (ch1 auditBlock)
  , auditWord32ToNat (ch2 auditBlock), auditWord32ToNat (ch3 auditBlock)
  , auditWord32ToNat (ch4 auditBlock), auditWord32ToNat (ch5 auditBlock)
  , auditWord32ToNat (ch6 auditBlock), auditWord32ToNat (ch7 auditBlock)
  , auditWord32ToNat (ch8 auditBlock), auditWord32ToNat (ch9 auditBlock)
  , auditWord32ToNat (ch10 auditBlock), auditWord32ToNat (ch11 auditBlock)
  , auditWord32ToNat (ch12 auditBlock), auditWord32ToNat (ch13 auditBlock)
  , auditWord32ToNat (ch14 auditBlock), auditWord32ToNat (ch15 auditBlock)
  ]

def auditBlockExpected : List Nat :=
  [ 0xe4e7f110, 0x15593bd1, 0x1fdd0f50, 0xc47120a3
  , 0xc7f4d1c7, 0x0368c033, 0x9aaa2204, 0x4e6cd4c3
  , 0x466482d2, 0x09aa9f07, 0x05d7c214, 0xa2028bd9
  , 0xd19c12b5, 0xb94e16de, 0xe883d0cb, 0x4e3c50a2
  ]

def auditElemToWords (x : Poly1305Elem) : List Nat :=
  [ auditWord32ToNat (p1305_h0 x), auditWord32ToNat (p1305_h1 x)
  , auditWord32ToNat (p1305_h2 x), auditWord32ToNat (p1305_h3 x)
  , auditWord32ToNat (p1305_h4 x)
  ]

def auditZeroElem : Poly1305Elem :=
  mkPoly1305Elem zero32 zero32 zero32 zero32 zero32

def auditOneElem : Poly1305Elem :=
  mkPoly1305Elem one32 zero32 zero32 zero32 zero32

def auditTwoElem : Poly1305Elem :=
  mkPoly1305Elem (auditWord32OfNat 2) zero32 zero32 zero32 zero32

def auditAbcBlock : MsgBlock :=
  mkMsgBlock
    (auditWord32OfNat 0x61626380)
    zero32 zero32 zero32 zero32 zero32 zero32 zero32
    zero32 zero32 zero32 zero32 zero32 zero32 zero32
    (auditWord32OfNat 0x00000018)

def auditAbcDigest := sha256_block auditAbcBlock

def auditAbcActual : List Nat :=
  [ auditWord32ToNat (s8a auditAbcDigest), auditWord32ToNat (s8b auditAbcDigest)
  , auditWord32ToNat (s8c auditAbcDigest), auditWord32ToNat (s8d auditAbcDigest)
  , auditWord32ToNat (s8e auditAbcDigest), auditWord32ToNat (s8f auditAbcDigest)
  , auditWord32ToNat (s8g auditAbcDigest), auditWord32ToNat (s8h auditAbcDigest)
  ]

def auditAbcExpected : List Nat :=
  [ 0xba7816bf, 0x8f01cfea, 0x414140de, 0x5dae2223
  , 0xb00361a3, 0x96177a9c, 0xb410ff61, 0xf20015ad
  ]

#eval auditQuarterRoundActual
#eval auditQuarterRoundActual == auditQuarterRoundExpected
#eval [auditWord32ToNat cc_sigma0, auditWord32ToNat cc_sigma1,
  auditWord32ToNat cc_sigma2, auditWord32ToNat cc_sigma3]
#eval [auditWord32ToNat cc_sigma0, auditWord32ToNat cc_sigma1,
  auditWord32ToNat cc_sigma2, auditWord32ToNat cc_sigma3] ==
  [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
#eval auditWord32ToNat (ROTL7 (auditWord32OfNat 1))
#eval auditWord32ToNat (ROTR2 (auditWord32OfNat 1))
#eval auditBlockActual
#eval auditBlockActual == auditBlockExpected
#eval auditAbcActual
#eval auditAbcActual == auditAbcExpected
#eval auditElemToWords p1305_prime
#eval auditElemToWords (p1305_mul auditOneElem auditZeroElem)
#eval auditElemToWords (p1305_mul auditOneElem auditTwoElem)
#eval auditElemToWords (p1305_mul auditOneElem auditZeroElem) ==
  auditElemToWords (p1305_mul auditOneElem auditTwoElem)
#eval auditElemToWords (poly1305_mac auditOneElem auditZeroElem auditTwoElem) ==
  auditElemToWords (poly1305_mac auditTwoElem auditZeroElem auditTwoElem)
