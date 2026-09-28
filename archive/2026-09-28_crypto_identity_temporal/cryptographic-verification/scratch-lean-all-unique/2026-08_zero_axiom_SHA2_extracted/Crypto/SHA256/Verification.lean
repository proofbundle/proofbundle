-- Crypto/SHA256/Verification.lean
-- Explicit axiom verification commands.
-- Load this file in a Lean REPL and run the #print axioms commands below.
-- Expected output for each: no axioms (or only core type-theory axioms).

import Crypto.SHA256.HMAC
import Crypto.SHA256.Properties

-- Core definitions
#print axioms H_size_eq
#print axioms K_size_eq
#print axioms initState_a_eq

-- Round theorems
#print axioms round_a_eq
#print axioms round_b_eq
#print axioms round_c_eq
#print axioms round_d_eq
#print axioms round_e_eq
#print axioms round_f_eq
#print axioms round_g_eq
#print axioms round_h_eq

-- Schedule and block theorems
#print axioms expandSchedule_size
#print axioms processBlock_size

-- Hash-level theorems
#print axioms sha256_size
#print axioms paddingLength_spec
#print axioms padMessage_size
#print axioms extractBlock_size

-- HMAC theorems
#print axioms hmacSha256_size

-- Property theorems
#print axioms sha256_total
#print axioms processBlock_deterministic
#print axioms round_deterministic

-- If any of the above report `sorryAx`, `Classical.choice`, `Quot.sound`,
-- or `propext`, the zero-axiom boundary has been breached.
