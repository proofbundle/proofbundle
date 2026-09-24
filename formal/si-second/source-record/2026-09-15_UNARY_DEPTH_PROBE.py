#!/usr/bin/env python3
"""2026-09-15_UNARY_DEPTH_PROBE.py

Measures whether Lean 4 accepts a unary numeral written as nested `succ (... one)` at
increasing depths, the form the source text's third sketch proposes for 9 192 631 770.
Two series: Lean's default settings, then `set_option maxRecDepth 100000000` to separate a
settings limit from a resource limit. Each depth runs in a fresh process with a time limit.
Prints one line per run and the source size the full numeral would need.
"""
import os, shutil, subprocess, tempfile, time

LEAN = shutil.which("lean") or os.path.expanduser("~/.elan/bin/lean")
HEADER = ("inductive Tick : Type where\n  | one : Tick\n  | succ : Tick → Tick\n"
          "open Tick\n")
SERIES = [("default settings", "", [100, 1000, 10000, 100000]),
          ("maxRecDepth raised", "set_option maxRecDepth 100000000\n", [1000, 10000, 100000, 1000000])]
LIMIT_S = 120
FULL_DEPTH = 9192631770 - 1  # succ applications around `one`

def source(depth, option):
    return option + HEADER + "def lock : Tick := " + "succ (" * depth + "one" + ")" * depth + "\n"

RUNS = [(label, option, depth) for label, option, depths in SERIES for depth in depths]

with tempfile.TemporaryDirectory() as d:
    for label, option, depth in RUNS:
        text = source(depth, option)
        path = os.path.join(d, f"unary_{depth}.lean")
        with open(path, "w") as f:
            f.write(text)
        start = time.time()
        try:
            p = subprocess.run([LEAN, path], capture_output=True, text=True, timeout=LIMIT_S)
            code, out = p.returncode, (p.stdout + p.stderr).strip()
        except subprocess.TimeoutExpired:
            code, out = "timeout", f"no result within {LIMIT_S} s"
        elapsed = time.time() - start
        first = out.splitlines()[0][:200] if out else "(no output)"
        status = "accepted" if code == 0 and "error" not in out else "not accepted"
        print(f"[{label}] depth {depth:>7}: {status}; exit={code}; {elapsed:.2f} s; "
              f"{len(text.encode()):,} bytes; first message: {first}", flush=True)

per_level = len("succ (") + len(")")
print(f"bytes per nesting level with `open Tick`: {per_level}")
print(f"source size for the full numeral: {FULL_DEPTH * per_level:,} bytes "
      f"(about {FULL_DEPTH * per_level / 1e9:.1f} GB)")
