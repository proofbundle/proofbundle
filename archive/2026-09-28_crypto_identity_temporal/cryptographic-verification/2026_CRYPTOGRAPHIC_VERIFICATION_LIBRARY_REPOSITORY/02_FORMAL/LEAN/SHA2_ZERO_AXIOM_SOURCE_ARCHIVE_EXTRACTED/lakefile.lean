
import Lake
open Lake DSL

package «crypto-sha2» where
  version := "0.1.0"
  keywords := #["sha2", "sha256", "sha512", "hmac", "cryptography", "zero-axiom"]
  description := "Zero-axiom SHA-2 family and HMAC in Lean 4"

lean_lib «Crypto» where
  roots := #[`Crypto]

@[default_target]
lean_exe «test-all» where
  root := `Crypto.TestAll

lean_exe «test-sha256» where
  root := `Crypto.SHA256.TestVectors

lean_exe «test-sha512» where
  root := `Crypto.SHA512.TestVectors
