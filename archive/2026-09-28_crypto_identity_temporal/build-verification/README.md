# Build verification log — SHA-2 zero-axiom Lean library

> Snapshot result: describes the inputs as compiled on 2026-09-28, not the current project state. See ../SNAPSHOT_SCOPE.md.

This is a real, adversarial compile attempt, not a relayed claim. It
contradicts the archive's own header claims for this file. It is
reported here in full rather than fixed silently, because writing new
proofs myself to make this pass would be self-graded verification —
authoring both the fix and the test of the fix — which is not
verification.

## Target

`cryptographic-verification/.../02_FORMAL/LEAN/SHA2_ZERO_AXIOM_SOURCE_ARCHIVE_EXTRACTED/`

`Crypto/Vec.lean` header states: *"Fixed-size vectors with intrinsic size
invariants. Zero admits. Zero sorries. Zero axioms. Zero propext. Zero
classical."*

## What was actually done

1. Installed Lean 4 (elan) and the toolchain this project's own
   `lean-toolchain` file pins: `leanprover/lean4:v4.8.0`.
2. Copied the project to a scratch build workspace (archive copy left
   untouched as evidence). The extracted `lean-toolchain` file itself
   carried an archival concatenation footer (`END OF ARCHIVE`) making it
   unparseable by elan; rewrote it to contain only the pinned toolchain
   string. Same footer problem existed on `lakefile.lean`'s neighbor
   copy, though `lakefile.lean` itself was clean.
3. `lake build` against v4.8.0 failed at the package-config level:
   `version` is not a valid field of `Lake.PackageConfig` in this Lake
   release (confirmed by reading
   `Lake/Config/Package.lean` in the installed v4.8.0 toolchain source
   directly, not assumed). Removed the field to proceed — logged as a
   real discrepancy between the pinned toolchain and the lakefile's
   assumed Lake API.
4. With that fixed, build failed on `Crypto.Vec` and `Crypto.Util`:
   `unknown constant 'Array.size_append'`, `'Array.append_get_left'`,
   `'Array.append_get_right'`; unsolved goals; a type-inference failure
   in `Util.lean` (`Vec` treated as an unbound autoImplicit rather than
   the defined structure). Full log:
   `sha2_zero_axiom_build_log_v4.8.0_pinned-toolchain.txt`.
5. Before assuming the source was simply wrong, checked whether the
   pinned toolchain matched what actually produced this archive's own
   "compiled" evidence. Found a precompiled `SHA256.olean` elsewhere in
   the archive (under `10_ERRORS_FAILURES_AND_STATUS/.../00_COMPILED/`)
   and read its binary header directly: it embeds Lean version
   `4.29.1`, not `4.8.0`. **The archive's `lean-toolchain` file does not
   match the toolchain that produced its own compiled evidence.**
6. Installed `leanprover/lean4:v4.29.1` and rebuilt against that
   instead. Result, unchanged in kind: `Crypto.Util` fails on the same
   `Vec`-as-unbound-identifier error; `Crypto.Vec` fails with
   `Array.get` no longer existing as a field-projectable member,
   `Array.mkArray`/`Array.size_mkArray` unresolved, a `rewrite` pattern
   miss — **and two declarations the compiler itself flags with
   `declaration uses 'sorry'`**: `append_get_left` (line 48) and
   `append_get_right` (line 53). Checked directly: the literal string
   `sorry` does not appear anywhere in `Vec.lean` (`grep -n sorry` —
   zero matches). The compiler is synthesizing the sorry itself as
   error-recovery because `simp [Array.append_get_left, ...]` and
   `simp [Array.append_get_right, ...]` reference lemma names that do
   not exist under this toolchain either — confirmed by reading
   `Init/Data/Array/Lemmas.lean` in the installed v4.29.1 toolchain
   source directly: no `size_append`, `append_get_left`, or
   `append_get_right` lemma exists in core Lean's Array API under
   either version tested. Full log:
   `sha2_zero_axiom_build_log_v4.29.1_olean-embedded-version.txt`.

## What this establishes

- The `Crypto/Vec.lean` file's own header claim ("Zero sorries. Zero
  axioms.") is compiler-falsified under the one toolchain version most
  plausibly tied to this archive's own compiled evidence (v4.29.1): the
  compiler itself reports `sorry` usage on two declarations, as
  automatic recovery from unresolved lemma names.
- This is not a stylistic or environmental gap. `Array.size_append`,
  `Array.append_get_left`, `Array.append_get_right`, `Array.mkArray`,
  and `Array.size_mkArray` are referenced as if they are core Lean 4
  lemmas/functions. They are not present in `Init.Data.Array.Lemmas` or
  `Init.Data.Array.Basic` under Lean 4.8.0 or 4.29.1 — checked by
  reading the actual installed toolchain source, not by assumption.
- Whatever toolchain or library environment originally allowed this file
  to type-check (if one ever did) is not reproducible from what's in
  this archive: not the pinned `lean-toolchain`, and not the version
  embedded in the archive's own compiled `.olean`.

## What this does not establish

- That the underlying mathematical claims (SHA-2 correctness) are false.
  The build never got far enough to reach `SHA256Core.lean` or the hash
  function proofs themselves — it fails in the foundational `Vec`
  utility module both depend on.
- That every file in this archive has the same problem. Only
  `SHA2_ZERO_AXIOM_SOURCE_ARCHIVE_EXTRACTED` was tested. Other Lean
  source trees in this archive (`lean-proofs-unique`,
  `scratch-lean-all-unique`, curated-artifacts variants) have not yet
  been build-tested and may be in better or worse shape — that is
  separate, undone work, not something this finding should be read as
  covering.

## Explicitly not done

No changes were made to `Vec.lean`, `Util.lean`, or any proof content to
make this build pass. Writing replacement lemmas myself and then
reporting the file as "verified" would mean I authored both the fix and
the check of the fix — the exact pattern objected to. If someone wants
this library actually fixed, that is separate work, done in the open,
with the fix and its justification both visible — not folded into a
"verification" pass silently.
