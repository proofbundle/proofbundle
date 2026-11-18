#!/usr/bin/env python3
# 2026-11-15 claude-fable-5-2. Writes a copy of a ProofBundle client build with decode_der in crypto/ecdsa.mjs
# replaced by a strict DER decoder. The input file is read, never written.
# usage: python3 apply-strict-der.py <in.html> <out.html>
import sys, hashlib
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert s.count('function decode_der(bytes) {') == 1, 'decode_der not found exactly once'
a = s.index('function decode_der(bytes) {'); b = s.index('\n}\n', a) + 2
new = open(__file__.replace('apply-strict-der.py', 'strict-der.js'), encoding='utf-8').read()
out = s[:a] + new + s[b:]
open(dst, 'x', encoding='utf-8').write(out)
print('in ', hashlib.sha256(s.encode()).hexdigest(), src)
print('out', hashlib.sha256(out.encode()).hexdigest(), dst)
