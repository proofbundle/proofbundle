import Lake
open Lake DSL

package crypto where

@[default_target]
lean_lib Crypto where

lean_exe «hmac-test» where
  root := `Crypto.HMACSHA256Test
