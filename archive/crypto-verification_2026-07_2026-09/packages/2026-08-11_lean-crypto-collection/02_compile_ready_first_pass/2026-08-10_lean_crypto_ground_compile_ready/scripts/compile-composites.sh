#!/usr/bin/env bash
set -uo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/reports/build"
mkdir -p "$out"
printf 'file\texit_code\n' > "$out/summary.tsv"
rc_all=0
for f in \
  P256FieldHardened.lean \
  P256PointOps.lean \
  Ed25519Core.lean \
  Ed25519SignVerifySkeleton.lean \
  ChaCha20Core.lean \
  Poly1305Core.lean \
  MLKEM768Skeleton.lean
do
  log="$out/${f%.lean}.log"
  (cd "$root/composites" && lean -o "$out/${f%.lean}.olean" "$f") >"$log" 2>&1
  rc=$?
  printf '%s\t%s\n' "$f" "$rc" >> "$out/summary.tsv"
  if [ "$rc" -ne 0 ]; then rc_all=1; fi
done
exit "$rc_all"
