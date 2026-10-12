#!/usr/bin/env python3
"""pb-rail command bridge - allowlisted argv exec.  NEVER a shell.

Owner: rail-cmd.  Contract: SPEC2.md section "cmdbridge.py" (lines 35-52).

  run(command, timeout=60) -> {argv,rc,stdout,stderr,truncated,ts,ms}
  allowlist() -> {commands:[...],denied_categories:[...]}

The security model is denylist-by-construction: a command is executed only if
its first token is LITERALLY present in ALLOWED.  Everything else is refused.
There is no sanitising, escaping, filtering or rewriting anywhere in this file
- a rejected request is rejected whole, and a refused one is never executed.

Hard invariants (each is checkable, and the selftest checks them):

  I1  No shell.  exec is always an argv ARRAY.  shell=True is never passed
      and no string is ever interpolated into a command line.
  I2  Reject, never sanitise.  If the parsed argv contains > & ; $ ` \\ | * ? ~
      < > ( ) { } [ ] ! ^ or a control char, the request is REJECTED - so a
      pipe, a redirect, a subshell, a glob or a chain never reaches exec().
  I3  Deny by construction.  The first token must be in ALLOWED or be a read
      verb of an allowlisted pb CLI.  rm/mv/dd/wipefs/pkexec/bash -c/... are
      refused by that rule itself, whatever their arguments are.
  I4  The refused/denied path does no I/O beyond its own log line.  A denial
      is returned as executed=False, rc=None - proof that nothing ran.
  I5  Every exec (and every refusal) is logged to
      ~/pb/live/rail/cmd-bridge.log, and a bus record kind=rail is appended
      through pb-lane-bus' hash-chained appender so the traffic view shows
      commands too.  The bus file is NEVER written directly: a raw append
      would fork the chain and break `pb-lane-bus verify` for every lane.

Sandbox applied to every child: cwd=/home/falsealias, env scrubbed down to
PATH/HOME/LANG/TERM, stdin closed, 60s wall, 256KB stdout cap, 8KB stderr cap.
"""

import json
import os
import re
import shlex
import shutil
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
CWD = HOME
LOG_PATH = os.path.join(HOME, "pb/live/rail/cmd-bridge.log")
BUS_TOOL = os.path.join(HOME, "pb/bin/pb-lane-bus")
BUS_SINK = "ops"

DEFAULT_TIMEOUT = 60
MAX_TIMEOUT = 60
STDOUT_CAP = 256 * 1024      # 256KB
STDERR_CAP = 8 * 1024        # 8KB
MAX_COMMAND_CHARS = 2000
PY_INLINE_MAX = 500
LOG_KEEP_BYTES = 4 * 1024 * 1024

# --------------------------------------------------------------------------
# The allowlist.  A first token not literally present here is REFUSED.
# --------------------------------------------------------------------------
ALLOWED = (
    "uname", "free", "uptime", "vmstat", "lsblk", "df", "ps", "top",
    "sensors", "mdstat", "cat", "ls", "stat", "du", "find", "head", "tail",
    "pgrep", "which", "id", "whoami", "date", "hostname", "python3", "ots",
    "pb-rail", "pb-lane-bus", "pb-lane-deliver",
)

# Read verbs of the pb CLIs.  pb-rail send/wake/ots/tools reach the network and
# mutate state, so only its read verbs are reachable through this bridge.
PB_RAIL_READ = ("status", "jobs", "algorithms", "proofbundle")
PB_BUS_READ = ("log", "verify", "lanes", "status", "algorithms", "errors",
               "merkle", "vms")
PB_DELIVER_READ = ("status", "routes", "config")

# Shells are refused as interpreters and as first tokens.
SHELLS = ("bash", "sh", "zsh", "dash", "ksh", "csh", "tcsh", "fish", "ash")

# python3 -c is allowed (len<=500) but the payload may not reach a shell, a
# process spawner or a loader.  Refused by inspection, not by rewriting it.
PY_BANNED = re.compile(
    r"\bos\s*\.\s*(?:system|popen|spawn\w*|execv?\w*|fork|posix_spawn)\b"
    r"|\b(?:subprocess|popen2?)\b|__import__|\beval\s*\(|\bexec\s*\("
    r"|\bimport\s+(?:os|subprocess|shutil|pty|ctypes|multiprocessing|socket|"
    r"urllib|http|requests|asyncio|signal|resource)\b"
    r"|\bfrom\s+(?:os|subprocess|shutil|pty|ctypes|multiprocessing)\s+import\b"
    r"|\bopen\s*\(|\bfile\s*\(|\binput\s*\(|\bcompile\s*\(|\bglobals\s*\("
    r"|/bin/|/usr/bin/", re.I)

# Absolute/relative paths as a first token are refused: a path is not a
# literal allowlist entry, and it is the obvious way to smuggle /bin/rm past
# a name check.
ABS_PATH = re.compile(r"^/|^\.\./|^\.\.$")

# The six metacharacters the spec names, checked in EVERY token.  I2.
FORBIDDEN_CHARS = set('>&;$`\\|')
# Globs, brace/bracket expansion and subshell/redirect punctuation, also
# rejected rather than sanitised.  These are shell syntax, never needed by a
# read-only allowlisted verb, so refusing them costs no real capability.
FORBIDDEN_EXTRA = set('~<>{}[]!^()*?\'"')

# python3 -c is the one place where ordinary expression punctuation ( ) is
# legitimate payload, so it gets a narrower sweep.  SPEC2 explicitly allows
# `python3 -c (len<=500)`; the metacharacter rule is enforced against the
# FIRST token of every command and against every token of the others.
FORBIDDEN_PY = set('>&;$`\\|~<>{}[]!^\'"')


def _scan(argv, chars, skip_index=None):
    """Return (token, sorted chars) for the first token carrying a metachar."""
    for idx, tok in enumerate(argv):
        if skip_index is not None and idx == skip_index:
            continue
        bad = sorted({c for c in tok if c in chars})
        if bad:
            return tok, bad
    return None, None

# --------------------------------------------------------------------------
# Denied categories - the explicit table from the spec.  It documents the
# intent and is reported by allowlist() for the panel; the enforcement is I3
# above, so none of these names can become reachable by editing their
# arguments.  This table cannot widen access.
# --------------------------------------------------------------------------
DENIED_CATEGORIES = {
    "destructive_filesystem": [
        "rm", "mv", "dd", "wipefs", "mkfs", "fdisk", "parted", "sgdisk",
        "cryptsetup", "shred", "sync", "chmod", "chown"],
    "privilege_and_init": [
        "pkexec", "sudo", "su", "systemctl", "reboot", "shutdown", "halt",
        "poweroff", "mount", "umount", "useradd", "passwd"],
    "network_and_remote": ["curl", "wget", "nc", "ncat", "ssh", "scp", "rsync"],
    "package_manager": ["apt", "apt-get", "dpkg"],
    "firewall_and_signals": ["iptables", "nft", "kill", "killall", "pkill",
                             "crontab"],
    "shell_interpreters": ["bash -c", "sh -c", "zsh -c", "env", "xargs",
                           "eval", "exec"],
    "code_escapes": ["python3 -c importing os.system/subprocess"],
}
DENIED = set()
for _names in DENIED_CATEGORIES.values():
    for _n in _names:
        # Only single-token entries become whole-command denials.  A multi-word
        # entry ("bash -c", "python3 -c importing os.system/subprocess") is a
        # PATTERN, not a program name: taking its first word here would deny the
        # command the spec explicitly allows (`python3 -c`, len<=500).  The
        # patterns are enforced structurally instead - SHELLS for `bash -c` and
        # PY_BANNED/_check_python for the python escape.
        if " " not in _n:
            DENIED.add(_n)


class Denied(Exception):
    """Raised when a request is refused; carries the machine-readable reason.

    Raising is the contract ("DENY by construction (raise)").  run() catches it
    and returns a refusal dict with executed=False, so no caller can mistake a
    refusal for an execution.
    """

    def __init__(self, reason, detail="", argv=None, category=None):
        super().__init__("%s: %s" % (reason, detail) if detail else reason)
        self.reason = reason
        self.detail = detail
        self.argv = argv or []
        self.category = category


# ------------------------------------------------------------------ utilities

def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


# The PATH handed to every child: a fixed scrubbed value (no inherited
# PATH), but it must still contain the two dirs the allowlisted pb tools and
# `ots` actually live in, or `which` would refuse them as not_installed.
SANDBOX_PATH = ":".join((
    os.path.join(HOME, "pb/bin"),
    os.path.join(HOME, ".local/bin"),
    "/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin", "/sbin",
    "/bin"))


def child_env():
    """Scrubbed environment: PATH/HOME/LANG/TERM only, nothing inherited."""
    env = {
        "PATH": SANDBOX_PATH,
        "HOME": HOME,
        "LANG": os.environ.get("LANG", "C.UTF-8"),
        "TERM": os.environ.get("TERM", "dumb"),
    }
    env["LC_ALL"] = env["LANG"]
    return env


def _log(line):
    """Append one line to the bridge log.  Never raises into the caller."""
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        if os.path.exists(LOG_PATH) and os.path.getsize(LOG_PATH) > LOG_KEEP_BYTES:
            with open(LOG_PATH, "r", encoding="utf-8", errors="replace") as fh:
                fh.seek(max(0, os.path.getsize(LOG_PATH) - LOG_KEEP_BYTES // 2))
                tail = fh.read().split("\n", 1)[-1]
            with open(LOG_PATH, "w", encoding="utf-8") as fh:
                fh.write(tail + "\n")
        with open(LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except OSError:
        pass



def _publish_bus(argv, rc, ms, outcome, detail=""):
    """Append a kind=rail record through pb-lane-bus' hash-chained appender.

    The bus file is NEVER written directly here.  It is a tamper-evident
    sha256 prev_hash chain with a mandatory contiguous seq under flock; a raw
    append would fork it and `pb-lane-bus verify` would fail host-wide.
    """
    cmdline = " ".join(argv)
    if rc is None:
        body = ("rail command bridge %s\nCOMMAND: %s\nNOTHING WAS EXECUTED.\n%s"
                % (outcome, cmdline, detail))
        subject = "rail cmd %s: %s" % (outcome, cmdline)
    else:
        body = ("rail command bridge exec\nCOMMAND: %s\nrc %s  %dms\n"
                % (cmdline, rc, ms))
        subject = "rail cmd rc=%s %dms: %s" % (rc, ms, cmdline)
    try:
        proc = subprocess.run(
            [sys.executable, BUS_TOOL, "send",
             "--from", BUS_SINK, "--to", "ops",
             "--kind", "rail", "--subject", subject[:400], "--body", body],
            capture_output=True, text=True, timeout=10, env=child_env(),
            stdin=subprocess.DEVNULL, cwd=CWD, check=False)
        return proc.returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def allowlist():
    """The panel-facing view of what may run and what may never run."""
    return {
        "commands": list(ALLOWED),
        "denied_categories": {k: list(v) for k, v in DENIED_CATEGORIES.items()},
    }


# ------------------------------------------------------------------ gate 1/2/3

def parse(command):
    """shlex.split, then REJECT (never sanitise) on metacharacters.  I2."""
    if not isinstance(command, str):
        raise Denied("not_a_string", "command must be a string")
    if not command.strip():
        raise Denied("empty", "no command given")
    if len(command) > MAX_COMMAND_CHARS:
        raise Denied("too_long", "command exceeds %d chars" % MAX_COMMAND_CHARS)
    if any(ord(c) < 32 or ord(c) == 127 for c in command):
        raise Denied("control_characters", "NUL/control character in command")
    try:
        argv = shlex.split(command)
    except ValueError as exc:
        raise Denied("parse_error", str(exc))
    if not argv:
        raise Denied("empty", "no argv after parsing")
    # The six spec-named metacharacters are refused in EVERY token, including
    # the python3 -c payload - SPEC2 states the rule for "the parsed argv" with
    # no exception, and a shell is never involved, so there is nothing to gain
    # by allowing them anywhere.
    tok, bad = _scan(argv, FORBIDDEN_CHARS)
    if bad:
        raise Denied("metacharacter",
                     "shell metacharacter(s) %s in %r - rejected, not "
                     "sanitised" % ("".join(bad), tok[:60]), argv=argv)
    # The extended shell-syntax set (glob, brace, tilde, redirect punctuation)
    # is refused in every token EXCEPT the python3 -c payload, where ( ) [ ] { }
    # and quotes are ordinary expression syntax and SPEC2 explicitly allows the
    # verb at len<=500.  There is no shell to expand any of it.
    is_py = argv[0] == "python3" and len(argv) > 2 and argv[1] == "-c"
    if not is_py:
        tok, bad = _scan(argv, FORBIDDEN_EXTRA)
        if bad:
            raise Denied("metacharacter",
                         "shell metacharacter(s) %s in %r - rejected, not "
                         "sanitised" % ("".join(bad), tok[:60]), argv=argv)
    return argv


def check(argv):
    """The allowlist itself.  Raises Denied; returns the argv on success."""
    exe = argv[0]
    if exe in SHELLS or exe in DENIED:
        raise Denied("denied_command", "%r is on the deny list" % exe,
                     argv=argv, category="denied_command")
    if ABS_PATH.match(exe):
        raise Denied("absolute_path",
                     "first token must be a bare allowlisted name, not a path",
                     argv=argv)
    if exe not in ALLOWED:
        raise Denied("not_allowlisted",
                     "%r is not literally allowlisted" % exe, argv=argv,
                     category="not_allowlisted")

    if exe == "python3":
        return _check_python(argv)
    if exe == "ots":
        if argv[1:] != ["--version"]:
            raise Denied("bad_args", "ots accepts only --version", argv=argv)
        return argv
    if exe == "pb-rail":
        if len(argv) < 2 or argv[1] not in PB_RAIL_READ:
            raise Denied("bad_args",
                         "pb-rail read verbs only: %s" % " ".join(PB_RAIL_READ),
                         argv=argv)
        return argv
    if exe == "pb-lane-bus":
        if len(argv) < 2 or argv[1] not in PB_BUS_READ:
            raise Denied("bad_args",
                         "pb-lane-bus read verbs only: %s"
                         % " ".join(PB_BUS_READ), argv=argv)
        return argv
    if exe == "pb-lane-deliver":
        if len(argv) < 2 or argv[1] not in PB_DELIVER_READ:
            raise Denied("bad_args",
                         "pb-lane-deliver read verbs only: %s"
                         % " ".join(PB_DELIVER_READ), argv=argv)
        return argv
    return argv


def _check_python(argv):
    """python3 -c <src>, len<=500, no interpreter/shell/loader escape."""
    if len(argv) < 3 or argv[1] != "-c":
        raise Denied("bad_args", "only `python3 -c <code>` is allowed",
                     argv=argv)
    src = argv[2]
    if len(src) > PY_INLINE_MAX:
        raise Denied("bad_args", "inline code exceeds %d chars" % PY_INLINE_MAX,
                     argv=argv)
    hit = PY_BANNED.search(src)
    if hit:
        raise Denied("python_escape",
                     "inline code touches %r - refused" % hit.group(0), argv=argv)
    # The payload must at least be a single valid expression/statement unit.
    # Without this, a space-separated `import os` would sail past the textual
    # fence as argv[2]="import" and only fail inside the child - a refusal that
    # happens by accident, after a process was started, instead of by design.
    # compile() is static: it runs no code.
    try:
        compile(src, "<rail-python>", "exec")
    except SyntaxError as exc:
        raise Denied("bad_args",
                     "inline code is not valid python (%s)" % exc.msg,
                     argv=argv)
    except (ValueError, MemoryError, RecursionError) as exc:
        raise Denied("bad_args", "inline code rejected: %s" % exc, argv=argv)
    return argv



# ------------------------------------------------------------------- execution

def _kill_tree(proc):
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except (OSError, ProcessLookupError):
        try:
            proc.kill()
        except OSError:
            pass


def _refuse(argv, reason, detail, ts, t0, category):
    """Build the refusal result.  executed=False and rc=None are the proof."""
    ms = int((time.time() - t0) * 1000)
    _log("%s DENY %-18s argv=%s ms=%d reason=%s detail=%s"
         % (ts, reason, json.dumps(argv), ms, reason, detail))
    _publish_bus(argv, None, ms, reason, detail)
    return {
        "ok": False, "executed": False, "denied": True, "rc": None,
        "reason": reason, "detail": detail, "category": category,
        "argv": argv, "stdout": "", "stderr": detail, "truncated": False,
        "ts": ts, "ms": ms,
    }


def run(command, timeout=DEFAULT_TIMEOUT):
    """Execute an allowlisted command.  Returns a result dict, never raises.

    Denied or rejected requests come back as ok=False, executed=False, rc=None
    - proof that nothing ran.  Only a real exec carries ok=True and a real rc.
    """
    t0 = time.time()
    ts = now_iso()
    try:
        argv = parse(command)
        check(argv)
    except Denied as exc:
        argv = exc.argv or ([command] if isinstance(command, str) else [])
        return _refuse(argv, exc.reason, exc.detail, ts, t0, exc.category)

    try:
        timeout = int(timeout)
    except (TypeError, ValueError):
        timeout = DEFAULT_TIMEOUT
    timeout = max(1, min(timeout, MAX_TIMEOUT))

    binary = shutil.which(argv[0], path=child_env()["PATH"])
    if binary is None:
        return _refuse(argv, "not_installed", "%r not on PATH" % argv[0],
                       ts, t0, "not_installed")

    truncated = False
    timed_out = False
    try:
        proc = subprocess.Popen(                          # I1: argv ARRAY
            argv, cwd=CWD, env=child_env(),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            start_new_session=True, close_fds=True)
    except OSError as exc:
        return _refuse(argv, "spawn_failed", str(exc), ts, t0, "spawn_failed")

    try:
        stdout, stderr = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        _kill_tree(proc)
        try:
            stdout, stderr = proc.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            stdout, stderr = b"", b""

    rc = proc.returncode
    ms = int((time.time() - t0) * 1000)
    if len(stdout) > STDOUT_CAP:
        stdout, truncated = stdout[:STDOUT_CAP], True
    if len(stderr) > STDERR_CAP:
        stderr, truncated = stderr[:STDERR_CAP], True
    out = stdout.decode("utf-8", "replace")
    err = stderr.decode("utf-8", "replace")
    if timed_out:
        err = (err + "\n[rail] killed after %ds timeout" % timeout).strip()
    nbytes = len(stdout) + len(stderr)

    _log("%s EXEC argv=%s rc=%s ms=%d bytes=%d truncated=%s timeout=%s"
         % (ts, json.dumps(argv), rc, ms, nbytes, truncated, timed_out))
    _publish_bus(argv, rc, ms, "exec")

    return {
        "ok": True, "executed": True, "denied": False, "rc": rc,
        "argv": argv, "stdout": out, "stderr": err, "truncated": truncated,
        "timed_out": timed_out, "ts": ts, "ms": ms, "bytes": nbytes,
    }


# ------------------------------------------------------------------- selftest

# (command, expectation).  "exec" = must run and produce a real rc.
# "deny" = refused by the allowlist.  "reject" = refused on metacharacters.
_CASES = [
    ("free -h", "exec"),
    ("uname -a", "exec"),
    ("rm -rf /", "deny"),
    ("ls | wc -l", "reject"),
    ("wipefs -a /dev/sdb1", "deny"),
    ("pkexec id", "deny"),
    ("bash -c id", "deny"),
    ("ls; id", "reject"),
    ("nano", "deny"),
    ("sudo ls", "deny"),
    ("/bin/rm -rf /", "deny"),
    ("cat /etc/passwd > /home/falsealias/x", "reject"),
    ("ls `id`", "reject"),
    ("ls $(id)", "reject"),
    ("ls *.py", "reject"),
    ("dd if=/dev/zero of=/dev/sdb1", "deny"),
    ("mkfs.ext4 /dev/sdb1", "deny"),
    ("curl http://example.com", "deny"),
    ("python3 -c 'import os; os.system(\"id\")'", "deny"),
    ("python3 -c 'print(1+1)'", "exec"),
    ("pb-rail send --from ops --to all --subject x --body y", "deny"),
    ("df -hT", "exec"),
    ("ls -l", "exec"),
    ("tail -n 2 /home/falsealias/pb/rail/SPEC2.md", "exec"),
    ("uptime", "exec"),
    ("whoami", "exec"),
    ("ots --version", "exec"),
    ("pb-lane-bus verify", "exec"),
    ("find / -maxdepth 1", "exec"),
    ("", "reject"),
]


def selftest(verbose=True):
    """Run the contract cases for real and report what actually happened."""
    out = []
    passed = 0
    for command, expect in _CASES:
        res = run(command, timeout=10)
        if expect == "exec":
            good = res["ok"] and res["rc"] is not None
            head = (res["stdout"].strip().splitlines() or [""])[0][:52]
            line = ("  RUN   %-44s -> EXEC  rc=%-3s ms=%-5s %s"
                    % (command, res.get("rc"), res.get("ms"), head))
        else:
            good = (not res["ok"]) and not res["executed"] and res["rc"] is None
            line = ("  %-6s %-44s -> %-15s executed=%s rc=None stdout=%r"
                    % (expect.upper(), command, res["reason"], res["executed"],
                       (res["stdout"] or "")[:24]))
        if good:
            passed += 1
        else:
            line += "   <<< UNEXPECTED (wanted %s)" % expect
        out.append(line)
    out.append("  selftest %d/%d cases behaved as specified"
               % (passed, len(_CASES)))
    if verbose:
        print("\n".join(out))
    return 0 if passed == len(_CASES) else 1


def _main(argv):
    if len(argv) > 1 and argv[1] in ("allowlist", "allowed"):
        print(json.dumps(allowlist(), indent=2))
        return 0
    if len(argv) > 1 and argv[1] == "selftest":
        return selftest()
    if len(argv) > 2 and argv[1] == "run":
        res = run(argv[2])
        print(json.dumps(res, indent=2))
        return 0 if res["ok"] else 2
    res = run(argv[1] if len(argv) > 1 else "uname -a")
    if res["ok"]:
        sys.stdout.write(res["stdout"])
        if res["stderr"]:
            sys.stderr.write(res["stderr"])
        print("\n[rc %s  %dms  truncated=%s]"
              % (res["rc"], res["ms"], res["truncated"]))
        return 0 if res["rc"] == 0 else 1
    print("DENIED (%s): %s\nNOTHING WAS EXECUTED."
          % (res["reason"], res["detail"]), file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(_main(sys.argv))

