import ECDSAP256
set_option maxRecDepth 1000000
open ProofBundle.Crypto.ECDSAP256

-- THE RISK: SHA-256 uses Array ops and `State := Fin 8 → UInt32` (a function type).
-- Repeated functional state update over 64 rounds may not reduce in the kernel.
theorem probe_sha : sha256Hex "abc" =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" := by decide
#print axioms probe_sha
