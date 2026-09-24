#!/usr/bin/env python3
"""2026-09-15_MAKE_MANIFEST.py

Writes 2026-09-15_MANIFEST.txt (size, SHA-256, SHA-512, BLAKE3 of every file in the bundle,
sorted by path) and 2026-09-15_MANIFEST_VERIFICATION.txt (the same hashes of the manifest).
Not listed in the manifest: the manifest, its verification file, 2026-09-15_VERIFY_RUN.txt,
and 2026-09-15_ASSEMBLY_LOG.txt, which are produced after the manifest. The zip hash covers them.
"""
import hashlib, os, sys
import blake3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCLUDED = {"2026-09-15_MANIFEST.txt", "2026-09-15_MANIFEST_VERIFICATION.txt",
            "2026-09-15_VERIFY_RUN.txt", "2026-09-15_ASSEMBLY_LOG.txt"}

def block(rel):
    data = open(os.path.join(ROOT, rel), "rb").read()
    return (f"file:    {rel}\nbytes:   {len(data)}\nsha256:  {hashlib.sha256(data).hexdigest()}\n"
            f"sha512:  {hashlib.sha512(data).hexdigest()}\nblake3:  {blake3.blake3(data).hexdigest()}\n")

files = sorted(os.path.relpath(os.path.join(dp, fn), ROOT) for dp, _, fns in os.walk(ROOT) for fn in fns)
files = [f for f in files if f not in EXCLUDED]
head = ("2026-09-15_MANIFEST.txt\n"
        "Every file in 2026-09-15_SI_SECOND_WITNESS_BUNDLE except the four named in\n"
        "scripts/2026-09-15_MAKE_MANIFEST.py. Hashes: SHA-256, SHA-512 (Python hashlib),\n"
        f"BLAKE3 (Python blake3 {blake3.__version__}). These implementations are not formally verified.\n"
        f"files: {len(files)}\n\n")
open(os.path.join(ROOT, "2026-09-15_MANIFEST.txt"), "w", encoding="utf-8").write(head + "\n".join(block(f) for f in files))
ver = ("2026-09-15_MANIFEST_VERIFICATION.txt\nHashes of 2026-09-15_MANIFEST.txt.\n\n" + block("2026-09-15_MANIFEST.txt"))
open(os.path.join(ROOT, "2026-09-15_MANIFEST_VERIFICATION.txt"), "w", encoding="utf-8").write(ver)
print(f"manifest entries: {len(files)}")
print(ver)
