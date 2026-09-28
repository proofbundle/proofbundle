import ECDSAP256
set_option maxRecDepth 4000000
set_option maxHeartbeats 0
open ProofBundle.Crypto.ECDSAP256

def s0 : State := initState
def s1 : State := round s0 0x428a2f98 0x61626380
def s2 : State := round s1 0x428a2f98 0x61626380
def s3 : State := round s2 0x428a2f98 0x61626380
def s4 : State := round s3 0x428a2f98 0x61626380
def s5 : State := round s4 0x428a2f98 0x61626380
def s6 : State := round s5 0x428a2f98 0x61626380
def s7 : State := round s6 0x428a2f98 0x61626380
def s8 : State := round s7 0x428a2f98 0x61626380

theorem probe8 : (s8 0 == s8 0) = true := by decide
#print axioms probe8
