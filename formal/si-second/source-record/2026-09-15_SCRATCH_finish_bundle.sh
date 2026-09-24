#!/bin/bash
set -u
export PATH="$HOME/.elan/bin:$PATH"
B=/home/claude/2026-09-15_SI_SECOND_WITNESS_BUNDLE
cd "$B"
python3 2026-09-15_VERIFY.py --rerun --proofbundle-repo /tmp/pb > 2026-09-15_VERIFY_RUN.txt 2>&1
echo "verify exit $?" >> 2026-09-15_VERIFY_RUN.txt
{ cat /home/claude/assembly_part1.txt
  echo "== cmd: python3 2026-09-15_VERIFY.py --rerun --proofbundle-repo /tmp/pb > 2026-09-15_VERIFY_RUN.txt"
  tail -1 2026-09-15_VERIFY_RUN.txt
  echo "== cmd: deterministic zip of the bundle directory"; } > 2026-09-15_ASSEMBLY_LOG.txt
python3 - <<'PY' >> 2026-09-15_ASSEMBLY_LOG.txt 2>&1
import os, zipfile, hashlib, blake3
root = "/home/claude/2026-09-15_SI_SECOND_WITNESS_BUNDLE"
top = os.path.basename(root)
out = "/home/claude/2026-09-15_SI_SECOND_WITNESS_BUNDLE.zip"
files = sorted(os.path.relpath(os.path.join(dp, fn), root) for dp, _, fns in os.walk(root) for fn in fns)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for rel in files:
        if rel == "2026-09-15_ASSEMBLY_LOG.txt":
            continue
        info = zipfile.ZipInfo(f"{top}/{rel}", date_time=(2026, 9, 15, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o755 if rel.endswith((".sh", ".py")) else 0o644) << 16
        z.writestr(info, open(os.path.join(root, rel), "rb").read())
print("zip entries:", len(files) - 1, "(all files except this assembly log, which is written after the zip)")
d = open(out, "rb").read()
print("zip bytes", len(d)); print("zip sha256", hashlib.sha256(d).hexdigest())
print("zip sha512", hashlib.sha512(d).hexdigest()); print("zip blake3", blake3.blake3(d).hexdigest())
PY
echo "FINISHED" >> 2026-09-15_ASSEMBLY_LOG.txt
