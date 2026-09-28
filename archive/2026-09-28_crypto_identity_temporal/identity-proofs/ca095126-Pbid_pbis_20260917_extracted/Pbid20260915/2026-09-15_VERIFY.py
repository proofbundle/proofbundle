#!/usr/bin/env python3
"""2026-09-15_VERIFY.py

Checks the 2026-09-15 SI-second witness bundle.
  python3 2026-09-15_VERIFY.py
  python3 2026-09-15_VERIFY.py --rerun --proofbundle-repo /path/to/proofbundle

Always:
  1. every file listed in 2026-09-15_MANIFEST.txt: size, SHA-256, SHA-512, BLAKE3
  2. 2026-09-15_MANIFEST.txt against 2026-09-15_MANIFEST_VERIFICATION.txt
  3. files present in the bundle that the manifest does not list
  4. data/witness.pb.json binds data/witness.json: size, Merkle root, content address
  5. the hash in 2026-09-15_README.md equals SHA-256 of data/witness.pb.json
With --rerun, in a temporary directory (the bundle is not modified):
  6. Lean 4.34.0: build kernel and ledger, compile the witness, read its 9 axiom reports
  7. Coq: compile the checker, run it on data/witness.json, coqchk both modules
  8. ProofBundle: node <repo>/cli/proofbundle-cli.mjs verify data/witness.pb.json
Tool output is printed unedited. Each check prints PASS, FAIL, or NOT RUN with the reason.
Exit status: 1 if any check failed; 2 if none failed but some did not run; 0 otherwise.
"""
import argparse, base64, hashlib, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST = "2026-09-15_MANIFEST.txt"
VERIFICATION = "2026-09-15_MANIFEST_VERIFICATION.txt"
NOT_IN_MANIFEST = {MANIFEST, VERIFICATION, "2026-09-15_VERIFY_RUN.txt", "2026-09-15_ASSEMBLY_LOG.txt"}
counts = {"PASS": 0, "FAIL": 0, "NOT RUN": 0}

try:
    import blake3 as _blake3
except ImportError:
    _blake3 = None


def report(state, name, detail=""):
    counts[state] += 1
    print(f"[{state}] {name}" + (f" -- {detail}" if detail else ""), flush=True)


def digests(path):
    data = open(path, "rb").read()
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
            "sha512": hashlib.sha512(data).hexdigest(),
            "blake3": _blake3.blake3(data).hexdigest() if _blake3 else None}


ENTRY = re.compile(r"file:\s+(.+)\nbytes:\s+(\d+)\nsha256:\s+([0-9a-f]{64})\n"
                   r"sha512:\s+([0-9a-f]{128})\nblake3:\s+([0-9a-f]{64})")


def entries(path):
    return {m.group(1): {"bytes": int(m.group(2)), "sha256": m.group(3), "sha512": m.group(4), "blake3": m.group(5)}
            for m in ENTRY.finditer(open(path, encoding="utf-8").read())}


def mismatches(rel, exp):
    p = os.path.join(ROOT, rel)
    if not os.path.isfile(p):
        return ["file missing"]
    got = digests(p)
    keys = ["bytes", "sha256", "sha512"] + (["blake3"] if got["blake3"] else [])
    return [k for k in keys if got[k] != exp[k]]


def check_hashes():
    if _blake3 is None:
        report("NOT RUN", "BLAKE3 comparisons", "python module blake3 not installed; size, SHA-256, SHA-512 still compared")
    for f in (MANIFEST, VERIFICATION):
        if not os.path.isfile(os.path.join(ROOT, f)):
            report("FAIL", f"{f} present", "missing")
            return
    ver = entries(os.path.join(ROOT, VERIFICATION))
    if MANIFEST in ver:
        bad = mismatches(MANIFEST, ver[MANIFEST])
        report("FAIL" if bad else "PASS", f"{MANIFEST} against {VERIFICATION}", ", ".join(bad))
    else:
        report("FAIL", f"{VERIFICATION} lists {MANIFEST}")
    man = entries(os.path.join(ROOT, MANIFEST))
    failed = {rel: mismatches(rel, exp) for rel, exp in man.items()}
    failed = {rel: bad for rel, bad in failed.items() if bad}
    for rel, bad in sorted(failed.items()):
        report("FAIL", f"manifest entry {rel}", ", ".join(bad))
    if not failed:
        report("PASS", f"all {len(man)} manifest entries match",
               "size, SHA-256, SHA-512" + (", BLAKE3" if _blake3 else ""))
    present = {os.path.relpath(os.path.join(dp, fn), ROOT) for dp, _, fns in os.walk(ROOT) for fn in fns}
    extra = sorted(present - set(man) - NOT_IN_MANIFEST)
    report("FAIL" if extra else "PASS", "no files outside the manifest except its own outputs",
           ("unlisted: " + ", ".join(extra[:25])) if extra else "")


def check_binding_and_readme():
    B = open(os.path.join(ROOT, "data", "witness.json"), "rb").read()
    C = open(os.path.join(ROOT, "data", "witness.pb.json"), "rb").read()
    art = json.loads(C)["payload"]["artifacts"][0]
    root = base64.urlsafe_b64encode(hashlib.sha256(b"\x00" + B).digest()).rstrip(b"=").decode()
    gpx = hashlib.sha3_384(b"artifact.content\x00" + len(B).to_bytes(8, "little") + B).hexdigest()
    report("PASS" if art["size"] == len(B) else "FAIL", "receipt size equals witness.json size", f"{art['size']} vs {len(B)}")
    report("PASS" if root == art["merkle_root_b64u"] else "FAIL",
           "receipt Merkle root equals base64url(SHA-256(0x00 || witness.json))", root)
    report("PASS" if gpx == art["gpx_content_address"] else "FAIL",
           "receipt content address equals SHA3-384(artifact.content || 0x00 || LE64(size) || witness.json)")
    readme = open(os.path.join(ROOT, "2026-09-15_README.md"), encoding="utf-8").read()
    hc = hashlib.sha256(C).hexdigest()
    found = re.findall(r"\b[0-9a-f]{64}\b", readme)
    report("PASS" if found == [hc] else "FAIL", "README hash equals SHA-256 of data/witness.pb.json",
           f"README {found}; computed {hc}")
    report("PASS" if "form-only" in readme.lower() else "FAIL", "README says form-only")
    return readme


def run(cmd, cwd, env=None, timeout=1800):
    print(f"$ cd {cwd} && {' '.join(cmd)}", flush=True)
    try:
        p = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        print(f"could not run: {e}", flush=True)
        return None, ""
    out = p.stdout + p.stderr
    sys.stdout.write(out if out.endswith("\n") or not out else out + "\n")
    print(f"exit {p.returncode}", flush=True)
    return p.returncode, out


def rerun_lean(tmp, readme):
    if not shutil.which("lake"):
        report("NOT RUN", "Lean rerun", "lake not on PATH (install elan and leanprover/lean4:v4.34.0)")
        return
    env = dict(os.environ, ELAN_TOOLCHAIN="leanprover/lean4:v4.34.0")
    d = os.path.join(tmp, "lean")
    os.makedirs(d)
    for f in ("2026-09-15_SI_SECOND_KERNEL.lean", "2026-09-15_SI_SECOND_LEDGER.lean",
              "2026-09-15_LAKEFILE.lean", "2026-09-15_SI_SECOND_WITNESS.lean"):
        shutil.copy(os.path.join(ROOT, "lean", f), d)
    rc, _ = run(["lake", "-f", "2026-09-15_LAKEFILE.lean", "build"], d, env)
    if rc != 0:
        report("FAIL", "Lean build of kernel and ledger", f"exit {rc}")
        return
    rc, out = run(["lake", "-f", "2026-09-15_LAKEFILE.lean", "env", "lean", "2026-09-15_SI_SECOND_WITNESS.lean"], d, env)
    reports = [l for l in out.splitlines() if l.startswith("'SISecond.Witness.")]
    empty = [l for l in reports if l.endswith("does not depend on any axioms")]
    src = open(os.path.join(d, "2026-09-15_SI_SECOND_WITNESS.lean"), encoding="utf-8").read()
    states_true = "theorem witness_isSecond : IsSecond witness" in src and "Lean IsSecond = true" in readme
    ok = rc == 0 and len(reports) == 9 and len(empty) == 9 and "error" not in out and states_true
    report("PASS" if ok else "FAIL", "Lean witness compiles, 9 axiom reports empty, IsSecond theorem matches README",
           f"exit {rc}; {len(empty)} of {len(reports)} reports empty; README/theorem agree: {states_true}")


def rerun_coq(tmp, readme):
    if not (shutil.which("coqc") and shutil.which("coqchk")):
        report("NOT RUN", "Coq rerun", "coqc or coqchk not on PATH")
        return
    d = os.path.join(tmp, "coq")
    os.makedirs(d)
    shutil.copy(os.path.join(ROOT, "coq", "SI_SECOND_CHECKER_2026_09_15.v"), d)
    rc, out = run(["coqc", "-Q", ".", "SIC", "SI_SECOND_CHECKER_2026_09_15.v"], d)
    report("PASS" if rc == 0 and out.count("Closed under the global context") == 2 else "FAIL",
           "Coq checker compiles; both Print Assumptions report closed", f"exit {rc}")
    text = open(os.path.join(ROOT, "data", "witness.json"), encoding="ascii").read()
    src = ("From Coq Require Import String.\nFrom SIC Require Import SI_SECOND_CHECKER_2026_09_15.\n"
           'Definition input : String.string := "' + text.replace('"', '""') + '"%string.\n'
           "Eval vm_compute in check input.\n"
           "Definition result := Eval vm_compute in check input.\nPrint result.\n"
           "Lemma result_is_check_input : result = check input.\nProof. reflexivity. Qed.\n"
           "Print Assumptions result_is_check_input.\n")
    open(os.path.join(d, "run_witness.v"), "w", encoding="ascii").write(src)
    rc, out = run(["coqc", "-Q", ".", "SIC", "run_witness.v"], d)
    m = re.search(r"result = (Some true|Some false|None)", out)
    printed = m.group(1) if m else None
    expected = "Some true" if "Coq = true" in readme else ("Some false" if "Coq = false" in readme else None)
    report("PASS" if rc == 0 and printed is not None and printed == expected
           and "Closed under the global context" in out else "FAIL",
           "Coq result on data/witness.json matches README; lemma closed",
           f"printed {printed}; README implies {expected}")
    print("sha256(data/witness.json)", hashlib.sha256(text.encode("ascii")).hexdigest(), flush=True)
    rc, out = run(["coqchk", "-o", "-Q", ".", "SIC", "SIC.SI_SECOND_CHECKER_2026_09_15", "SIC.run_witness"], d)
    ok = rc == 0 and "Modules were successfully checked" in out and "* Axioms: <none>" in out
    report("PASS" if ok else "FAIL", "coqchk: modules checked, no axioms", f"exit {rc}")


def rerun_proofbundle(repo, readme):
    if not repo:
        report("NOT RUN", "ProofBundle verifyCore",
               "pass --proofbundle-repo PATH (clone of github.com/proofbundle/proofbundle, npm install run)")
        return
    cli = os.path.join(repo, "cli", "proofbundle-cli.mjs")
    if not (os.path.isfile(cli) and shutil.which("node")):
        report("NOT RUN", "ProofBundle verifyCore", f"node or {cli} missing")
        return
    for a, b in (("proofbundle.html", "proofbundle/proofbundle.html"),
                 ("cli/proofbundle-cli.mjs", "proofbundle/cli/proofbundle-cli.mjs")):
        same = open(os.path.join(repo, a), "rb").read() == open(os.path.join(ROOT, b), "rb").read()
        report("PASS" if same else "FAIL", f"repo {a} byte-identical to bundle {b}")
    rc, out = run(["node", cli, "verify", os.path.join(ROOT, "data", "witness.pb.json")], ROOT)
    m = re.search(r'^  "outcome": "([A-Z-]+)"', out, flags=re.M)
    outcome = m.group(1) if m else None
    wants = "VERIFIED" if "verifies" in readme else None
    report("PASS" if rc == 0 and outcome == wants else "FAIL", "verifyCore outcome matches README",
           f"outcome {outcome}; README implies {wants}; exit {rc}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rerun", action="store_true", help="rerun Lean, Coq, coqchk, and verifyCore")
    ap.add_argument("--proofbundle-repo", help="path to a ProofBundle clone with node_modules")
    args = ap.parse_args()
    print("bundle:", ROOT, flush=True)
    check_hashes()
    readme = check_binding_and_readme()
    if args.rerun:
        with tempfile.TemporaryDirectory() as tmp:
            rerun_lean(tmp, readme)
            rerun_coq(tmp, readme)
        rerun_proofbundle(args.proofbundle_repo, readme)
    else:
        report("NOT RUN", "Lean, Coq, coqchk, verifyCore reruns", "use --rerun")
    print(f"summary: {counts['PASS']} passed, {counts['FAIL']} failed, {counts['NOT RUN']} not run", flush=True)
    sys.exit(1 if counts["FAIL"] else (2 if counts["NOT RUN"] else 0))


if __name__ == "__main__":
    main()
