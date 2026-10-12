#!/usr/bin/env python3
"""forensics.py — supervised ddrescue / bulk_extractor job runner (rail SPEC v1.0).

Safety contract (binding, H7):
  - BLOCKED_WRITE_PREFIXES: standing machine rules — never a write target.
  - NEVER_WRITE_DEVICES: foreign drives; read-only forever (reads allowed, writes never).
  - Only approved writable filesystems may hold outputs.
  - jobs.jsonl is append-only; every job gets a per-job dir with cmd/log/rc.
"""
from __future__ import annotations

import datetime as _dt
import json
import os
import re
import secrets
import shlex
import subprocess
import threading

HOME = os.path.expanduser("~")
JOBS_DIR = os.path.join(HOME, "pb", "live", "rail", "jobs")
JOBS_JSONL = os.path.join(JOBS_DIR, "jobs.jsonl")

BLOCKED_WRITE_PREFIXES = ["/tmp", "/mnt/pb-work", "/dev/shm"]      # standing machine rules
NEVER_WRITE_DEVICES = ["/dev/sdd"]                                 # foreign drive: read-only forever

STATIC_APPROVED_WRITE_PREFIXES = ["/home/falsealias", "/media/falsealias/WIN-NVME-500G"]
KINDS = ("ddrescue", "bulk_extractor")


class ValidationError(Exception):
    pass


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat()


def _real(path: str) -> str:
    """Best-effort realpath; never fails on missing final component."""
    base = os.path.abspath(os.path.expanduser(path))
    parent = os.path.dirname(base)
    if os.path.isdir(parent):
        return os.path.join(os.path.realpath(parent), os.path.basename(base))
    return os.path.normpath(base)


def _starts_with(path: str, prefix: str) -> bool:
    p, prefix = os.path.normpath(path), os.path.normpath(prefix)
    return p == prefix or p.startswith(prefix.rstrip(os.sep) + os.sep)


def _approved_write_roots() -> list[str]:
    roots = list(STATIC_APPROVED_WRITE_PREFIXES)
    # spec: raid2tb approved "if rw" — probe the mount at validation time
    try:
        out = subprocess.run(
            ["findmnt", "-rn", "-T", "/media/falsealias/raid2tb", "-o", "TARGET,OPTIONS"],
            capture_output=True, text=True, timeout=5,
        ).stdout.strip()
        if out:
            target, _, opts = out.partition(" ")
            if target == "/media/falsealias/raid2tb" and re.search(r"(^|,)rw(,|$)", opts):
                roots.append(target)
    except Exception:
        pass
    return roots


def _check_write_target(path: str, role: str) -> list[str]:
    v: list[str] = []
    rp = _real(path)
    for dev in NEVER_WRITE_DEVICES:
        d = _real(dev)
        if rp == d or rp.startswith(d.rstrip(os.sep) + os.sep):
            v.append(f"{role} {path!r}: {dev} is a foreign drive — read-only forever, never a write target")
    for bad in BLOCKED_WRITE_PREFIXES:
        if _starts_with(rp, bad):
            v.append(f"{role} {path!r}: under blocked write prefix {bad}")
    if rp.startswith("/dev"):
        v.append(f"{role} {path!r}: device nodes are never approved write targets")
    if not any(_starts_with(rp, r) for r in _approved_write_roots()):
        v.append(
            f"{role} {path!r}: not on an approved writable filesystem "
            f"({', '.join(_approved_write_roots())})"
        )
    return v


def _split_opts(args: list[str]) -> tuple[list[str], list[str]]:
    opts, positional = [], []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--":  # everything after -- is positional for these tools
            positional.extend(args[i + 1:])
            break
        if a.startswith("-"):
            opts.append(a)
        else:
            positional.append(a)
        i += 1
    return opts, positional


# --------------------------------------------------------------------------- #
# validation
# --------------------------------------------------------------------------- #
def validate(kind: str, args: list[str]) -> list[str]:
    """Return the list of violations; raise ValidationError if any (spec: 'raise on any')."""
    v: list[str] = []
    if kind not in KINDS:
        raise ValidationError(f"unknown kind {kind!r} (expected one of {KINDS})")
    if not isinstance(args, list) or not all(isinstance(a, str) for a in args):
        raise ValidationError("args must be a list of strings")
    if not args:
        v.append("empty args")

    if kind == "ddrescue":
        # ddrescue [options] infile outfile mapfile  — mapfile required
        if not any(a in ("-h", "--help", "-V", "--version") for a in args):
            _, positional = _split_opts(args)
            if len(positional) != 3:
                v.append(
                    f"ddrescue needs exactly 3 positional args (infile outfile mapfile); "
                    f"got {len(positional)}: {positional}"
                )
            else:
                src, outfile, mapfile = positional
                if not os.path.exists(_real(src)):
                    v.append(f"src {src!r} does not exist")
                v += _check_write_target(outfile, "outfile")
                v += _check_write_target(mapfile, "mapfile")
                if _real(outfile) == _real(mapfile):
                    v.append("outfile and mapfile must differ")

    elif kind == "bulk_extractor":
        # bulk_extractor [-o outdir] image_or_dir ; -o required
        outdir = None
        i = 0
        while i < len(args):
            a = args[i]
            if a in ("-o", "--output"):
                if i + 1 >= len(args):
                    v.append("-o given without a value")
                else:
                    outdir = args[i + 1]
                    i += 1
            elif a.startswith("-o") and len(a) > 2:
                outdir = a[2:]
            i += 1
        if outdir is None:
            v.append("bulk_extractor requires -o <outdir>")
        else:
            v += _check_write_target(outdir, "output dir")
        _, positional = _split_opts(args)
        inputs = [a for a in positional if a != outdir]
        if not inputs:
            v.append("bulk_extractor needs an input image or directory")
        elif not os.path.exists(_real(inputs[0])):
            v.append(f"input {inputs[0]!r} does not exist")

    if v:
        raise ValidationError("; ".join(v))
    return v


# --------------------------------------------------------------------------- #
# job runner
# --------------------------------------------------------------------------- #
def _append_jsonl(rec: dict) -> None:
    os.makedirs(JOBS_DIR, exist_ok=True)
    fd = os.open(JOBS_JSONL, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    with os.fdopen(fd, "a") as f:
        f.write(json.dumps(rec, sort_keys=True) + "\n")
        f.flush()
        os.fsync(f.fileno())


def submit_job(kind: str, args: list[str]) -> str:
    """Validate, spawn background subprocess, return job_id."""
    validate(kind, args)  # raises on any violation
    job_id = _dt.datetime.now().strftime("%Y%m%dT%H%M%S") + "-" + secrets.token_hex(4)
    jdir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(jdir, exist_ok=True)
    cmd = [kind] + args
    cmd_str = shlex.join(cmd)
    log_path = os.path.join(jdir, "log")
    rc_path = os.path.join(jdir, "rc")
    with open(os.path.join(jdir, "cmd"), "w") as f:
        f.write(cmd_str + "\n")
    # shell wrapper: streams to log, records rc even if this parent dies
    inner = f"{{ {cmd_str}; echo $? > {shlex.quote(rc_path)}; }} >> {shlex.quote(log_path)} 2>&1"
    proc = subprocess.Popen(
        ["/bin/sh", "-c", inner],
        cwd=HOME,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
        close_fds=True,
    )
    _append_jsonl(
        {
            "id": job_id, "kind": kind, "args": args, "cmd": cmd_str,
            "dir": jdir, "pid": proc.pid, "ts": _now(), "status": "running",
        }
    )
    # reap the wrapper so we never leave zombies; rc lands via the wrapper itself
    threading.Thread(target=proc.wait, daemon=True).start()
    return job_id


def list_jobs() -> list[dict]:
    jobs: list[dict] = []
    try:
        with open(JOBS_JSONL) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    jobs.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except FileNotFoundError:
        return []
    for j in jobs:
        if j.get("status") == "running":
            rc_path = os.path.join(j["dir"], "rc")
            if os.path.exists(rc_path):
                try:
                    j["rc"] = int(open(rc_path).read().strip())
                except (ValueError, OSError):
                    j["rc"] = None
                j["status"] = "completed"
                j["ended"] = _now()
    return jobs


def get_job(job_id: str) -> dict | None:
    for j in list_jobs():
        if j.get("id") == job_id:
            return j
    return None


# --------------------------------------------------------------------------- #
# self-test (benign): ddrescue from a small regular file -> image on an
# approved FS, then bulk_extractor over that image, both via submit_job.
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    import sys
    import time

    if len(sys.argv) > 1 and sys.argv[1] == "selftest":
        base_src = os.path.join(HOME, "pb", "scratch", "rail-test")
        base_out = "/media/falsealias/WIN-NVME-500G/rail-test"
        os.makedirs(base_src, exist_ok=True)
        os.makedirs(base_out, exist_ok=True)

        src = os.path.join(base_src, "benign-src.img")
        if not os.path.exists(src):
            with open(src, "wb") as f:
                f.write(b"RAIL-FORENSICS-SELFTEST " * 2000)  # ~46 KiB benign pattern

        # negative tests — destructive/blocked paths must be refused
        for bad_kind, bad_args in [
            ("ddrescue", ["/dev/sdd", "/tmp/evil.img", "/tmp/evil.map"]),
            ("ddrescue", [src, "/dev/sdd", "/tmp/m.map"]),
            ("ddrescue", [src, "/mnt/pb-work/x.img", "/mnt/pb-work/x.map"]),
            ("ddrescue", [src, "/dev/shm/x.img", "/dev/shm/x.map"]),
            ("ddrescue", [src, os.path.join(base_out, "x.img")]),   # missing mapfile
            ("bulk_extractor", [src]),                              # missing -o
            ("bulk_extractor", [src, "-o", "/dev/shm/out"]),
        ]:
            try:
                validate(bad_kind, bad_args)
                print(f"FAIL: accepted dangerous {bad_kind} {bad_args}")
                sys.exit(1)
            except ValidationError as e:
                print(f"refused (ok): {e}")

        img = os.path.join(base_out, "benign.img")
        mp = os.path.join(base_out, "benign.map")
        be_out = os.path.join(base_out, "be-out")

        jid1 = submit_job("ddrescue", [src, img, mp])
        print(f"ddrescue job {jid1} submitted")
        for _ in range(120):
            j = get_job(jid1)
            if j and j.get("status") == "completed":
                break
            time.sleep(0.5)
        j = get_job(jid1)
        print(f"ddrescue: status={j['status']} rc={j.get('rc')}")
        if j.get("rc") != 0 or not os.path.exists(img):
            print("FAIL: ddrescue job did not produce the image")
            sys.exit(1)

        jid2 = submit_job("bulk_extractor", [img, "-o", be_out])
        print(f"bulk_extractor job {jid2} submitted")
        for _ in range(600):
            j = get_job(jid2)
            if j and j.get("status") == "completed":
                break
            time.sleep(0.5)
    print("usage: forensics.py selftest")
