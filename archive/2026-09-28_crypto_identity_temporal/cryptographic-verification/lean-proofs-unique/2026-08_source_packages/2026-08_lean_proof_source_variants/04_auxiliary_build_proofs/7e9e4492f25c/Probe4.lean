import ECDSAP256
set_option maxRecDepth 20000000
set_option maxHeartbeats 0   -- unlimited
open ProofBundle.Crypto.ECDSAP256

theorem probe_sha : sha256Hex "abc" =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" := by decide
#print axioms probe_sha
