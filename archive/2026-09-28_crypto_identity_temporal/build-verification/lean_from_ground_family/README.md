# Lean "from ground" files: compile results (snapshot, 2026-09-28)

Inputs: `02_FORMAL/LEAN/STANDALONE_SOURCES/` in this archive. Compiler: `lean` 4.29.1 (sha512 also on 4.8.0).
Files were compiled as given; nothing was patched. Lean stops printing at 101 errors, so only the first errors are
meaningful; the rest cascade.

| Input | Result | First error |
|---|---|---|
| sha512_from_ground.lean | fails (4.29.1 and 4.8.0) | line 13-15: `inductive Ground : Sort u` and `def CBool : Sort 1 := ∀ (X : Sort 1), ...` rejected (universe error) |
| sha256_from_ground.lean | fails | same preamble error, line 16 |
| p256_field_hardened.lean | fails | same preamble error, line 13 |
| p256_field_hardened + ed25519 (+ ed25519_sign_verify) | fails | same, line 13 |
| p256_field_hardened + p256_point_ops (+ mlkem768) | fails | same, line 13 |
| ed25519, ed25519_sign_verify, mlkem768 alone | fail | unknown identifiers: they are appendices, not standalone (headers say "APPEND TO p256_field_hardened.lean") |
| sha256_kernel.lean, unified_master 2(1).lean | fail | preamble variant `CBool : Type 1`: `Unknown constant lcAny` (line 17-21) |

Reading: the `Sort 1` preamble is a real in-file universe error (identical on 4.8.0, so not toolchain drift).
The `Type 1` variant fails differently, on `lcAny`. Neither variant produced a successful build, so no theorem in
these files was reached or audited.

The 2026-08-19 sweep marked sha512, ed25519 and mlkem `BOTH_CLEAN`. That was a text scan (no `sorry` or
`native_decide` tokens). This compile does not support "builds" for any of them at this snapshot.

Not tested: whether the other bundle files (`p256_field.lean`, `multi_agent_orchestration.lean`) build, and whether a
later snapshot has a fixed preamble. Raw outputs are in `outputs/`.
