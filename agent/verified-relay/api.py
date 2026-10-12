#!/usr/bin/env python3
"""pb-rail API — owner: rail-api. FROZEN CONTRACT per ~/pb/rail/SPEC.md v1.0.

http.server (stdlib only), bound to 127.0.0.1:8791 ONLY. Imports crypto.py and
forensics.py against their frozen contracts. Log: ~/pb/live/rail/api.log.

Holes closed: H2 (wake path), H3 (steering surface backend), H5 (OTS ladder),
H6 (rail actually exercises kem.x25519/aead/hash/sig + ots), H8 (cache-stable
wake prompt assembly, see ~/pb/rail/CACHE.md).

task_0013 (owner rail-term) adds the live terminal bridge and the /api/live
push/fallback frame endpoint. See "TERMINAL BRIDGE" below for what is real and
what is impossible on this host.
"""
import json
import os
import shutil
import re
import subprocess
import sys
import time
import base64
import hashlib
import html as _htmlmod
import threading
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse, unquote

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import crypto       # noqa: E402  (owner: rail-crypto)
import forensics    # noqa: E402  (owner: rail-forensics)
import traffic      # noqa: E402  (owner: rail-traffic, SPEC2)
import fsview       # noqa: E402  (owner: rail-fs, SPEC2)
import bridge_api
import identity_gate
import cmdbridge    # noqa: E402  (owner: rail-cmd, SPEC2)


def _orch():
    """orch.py imports api.py at module scope (it reuses api_send/api_wake), so
    importing it here instead of at the top keeps the cycle one-directional:
    api -> orch only once the handler runs, never at import time."""
    import orch       # noqa: E402  (owner: rail-orch, SPEC2)
    return orch

HOME = os.path.expanduser("~")
RAIL_DIR = os.path.join(HOME, "pb", "live", "rail")
BUS_DIR = os.path.join(HOME, "pb", "live", "bus")
BIN_DIR = os.path.join(HOME, "pb", "bin")
LANES_JSON = os.path.join(BUS_DIR, "LANES.json")
ALGORITHMS_JSON = os.path.join(BUS_DIR, "ALGORITHMS.json")
DELIVERY_JSON = os.path.join(BUS_DIR, "DELIVERY.json")
NDJSON = os.path.join(BUS_DIR, "messages.ndjson")
DELIVER_LOG = os.path.join(HOME, "pb", "live", "deliver.log")
PANEL_HTML = os.path.join(HOME, "pb", "rail", "panel.html")
PROOFBUNDLE = os.path.join(HOME, "src", "proofbundle", "proofbundle.html")
OTS_BIN = os.path.join(HOME, ".local", "bin", "ots")
OTS_DIR = os.path.join(RAIL_DIR, "ots")
WAKE_DIR = os.path.join(RAIL_DIR, "wake")
API_LOG = os.path.join(RAIL_DIR, "api.log")
LADDER_JSONL = os.path.join(OTS_DIR, "ladder.jsonl")
OTS_LADDER = ("none", "SUBMITTED", "UPGRADED")   # never collapse these
LOAD_WATCH_LOG = os.path.join(HOME, "pb", "live", "load-watch.log")   # task_0004
BRIDGE_BASE = "http://127.0.0.1:8788"                                 # task_0004
BRIDGE_TIMEOUT_S = 8.0                                                # task_0004 (raised from 3.0 per bus seq 643: /api/overview observed at ~1.6s under load)

BIND_HOST = "127.0.0.1"
BIND_PORT = 8791

for _d in (RAIL_DIR, OTS_DIR):
    os.makedirs(_d, exist_ok=True)


def log_api(msg):
    line = "%s %s\n" % (time.strftime("%Y-%m-%dT%H:%M:%S"), msg)
    with open(API_LOG, "a") as f:
        f.write(line)


def _read_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _tail_lines(path, n):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return [l.rstrip("\n") for l in f][-n:]
    except Exception:
        return []


_TTY_CACHE = {"at": 0.0, "val": frozenset()}


def _proc_tty_set(max_age=3.0):
    """All /dev/pts/N ttys currently held as a live process's fd.

    Cached: this realpaths every fd of every process (~500 pids on this host)
    and measured 0.33s per call. It is called by /api/state (2s poll) and
    /api/heartbeat (2s poll), so uncached it pinned the server above 100% CPU
    while looking idle. A tty appearing or disappearing is a human-scale event;
    3s of staleness is honest for a liveness indicator."""
    now = time.time()
    if _TTY_CACHE["val"] and (now - _TTY_CACHE["at"]) < max_age:
        return _TTY_CACHE["val"]
    ttys = set()
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            for fd in os.listdir("/proc/%s/fd" % pid):
                try:
                    t = os.path.realpath("/proc/%s/fd/%s" % (pid, fd))
                except OSError:
                    continue
                if t.startswith("/dev/pts/"):
                    ttys.add(t)
                    break
        except OSError:
            continue
    _TTY_CACHE.update({"at": now, "val": frozenset(ttys)})
    return _TTY_CACHE["val"]


def _daemon_pid():
    """pid of the running pb-lane-deliver --daemon, or None."""
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            with open("/proc/%s/cmdline" % pid, "rb") as f:
                cmd = f.read().replace(b"\0", b" ").decode("utf-8", "replace")
        except OSError:
            continue
        if "pb-lane-deliver" in cmd and "--daemon" in cmd:
            return int(pid)
    return None


def _daemon_running():
    return _daemon_pid() is not None


def _run(cmd, timeout=180, stdin_text=None):
    p = subprocess.run(cmd, capture_output=True, text=True,
                       timeout=timeout, input=stdin_text)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


# ------------------------------------------------------------ /api/state ---
_HEARTBEAT = {"started": time.time(), "beats": 0, "last": None}


def _hb_service(name, alive, detail=""):
    return {"service": name, "alive": bool(alive), "detail": detail}


def heartbeat_payload():
    """GET /api/heartbeat -> proof of life for the whole rail.

    A static "daemon: live" pill is a claim, not evidence. This reports, per
    call: the rail's own uptime and a monotonically increasing beat count, the
    age of its own last beat, and a real liveness probe of every service it
    depends on (delivery daemon, bus tip growth, key material, OTS binary).
    Age in seconds is what makes a stall visible; a boolean cannot."""
    now = time.time()
    _HEARTBEAT["beats"] += 1
    _HEARTBEAT["last"] = now
    services = []

    # delivery daemon: a live process, plus how fresh its log write is
    dpid = _daemon_pid()
    deliver_log_age = None
    try:
        deliver_log_age = round(now - os.path.getmtime(DELIVER_LOG), 1)
    except OSError:
        pass
    services.append(_hb_service(
        "lane-deliver", dpid is not None,
        "pid=%s log_age_s=%s" % (dpid, deliver_log_age)))

    # bus: is the ledger still being written to?
    bus_age, bus_tip = None, None
    try:
        bus_age = round(now - os.path.getmtime(NDJSON), 1)
        with open(NDJSON, "r", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    bus_tip = json.loads(line).get("seq")
    except (OSError, ValueError):
        pass
    services.append(_hb_service(
        "bus-ledger", bus_age is not None and bus_age < 900,
        "tip=%s age_s=%s" % (bus_tip, bus_age)))

    # crypto key material for the lanes
    keys_dir = os.path.expanduser("~/pb/live/keys")
    lane_keys = 0
    try:
        lane_keys = len([d for d in os.listdir(keys_dir)
                         if os.path.exists(os.path.join(keys_dir, d,
                                                        "ed25519.pub"))])
    except OSError:
        pass
    services.append(_hb_service("lane-keys", lane_keys > 0,
                                "lanes_with_keys=%d" % lane_keys))

    # ots client
    ots = shutil.which("ots") or os.path.expanduser("~/.local/bin/ots")
    services.append(_hb_service("ots-client", os.path.exists(ots), ots))

    # forensics jobs still running
    try:
        running = [j for j in forensics.list_jobs() if j.get("state") == "running"]
    except Exception:
        running = []
    services.append(_hb_service("forensics", True,
                                "running_jobs=%d" % len(running)))

    down = [s["service"] for s in services if not s["alive"]]
    return {
        "beat": _HEARTBEAT["beats"],
        "ts": now,
        "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "uptime_s": round(now - _HEARTBEAT["started"], 1),
        "last_beat_age_s": 0.0,
        "services": services,
        "healthy": not down,
        "down": down,
    }


_PSTATE_CACHE = {"at": 0.0, "val": None}
_PSTATE_LOCK = threading.Lock()


def state_payload(max_age=2.5):
    """GET /api/state, coalesced.

    Measured: 5 open panel tabs x 4 polled routes = 63 requests per 20s, and
    the server still sat near 50% CPU. Per-call cost was already ~15ms, so the
    cost was volume, not work. This serves one shared payload per window so N
    tabs cost one computation. A new tab does not change what the state is.
    """
    now = time.time()
    if _PSTATE_CACHE["val"] is not None and (now - _PSTATE_CACHE["at"]) < max_age:
        return _PSTATE_CACHE["val"]
    with _PSTATE_LOCK:
        if _PSTATE_CACHE["val"] is not None and \
                (time.time() - _PSTATE_CACHE["at"]) < max_age:
            return _PSTATE_CACHE["val"]
        out = _state_payload_uncached()
        _PSTATE_CACHE.update({"at": time.time(), "val": out})
        return out


def _state_payload_uncached():
    lanes_cfg = _read_json(LANES_JSON, {}).get("lanes", {})
    delivery = _read_json(DELIVERY_JSON, {}).get("lanes", {})
    live_ttys = _proc_tty_set()
    lanes = []
    for lane, cfg in sorted(lanes_cfg.items()):
        routes = [r.get("tty") for r in delivery.get(lane, []) if r.get("tty")]
        lanes.append({
            "lane": lane,
            "model": cfg.get("model"),
            "provider": cfg.get("provider"),
            "live": any(t in live_ttys for t in routes) if routes else False,
            "route": routes[0] if routes else None,
        })
    bus_tail = []
    for line in _tail_lines(NDJSON, 40):
        try:
            bus_tail.append(json.loads(line))
        except Exception:
            continue
    return {
        "lanes": lanes,
        "bus_tail": bus_tail,
        "deliver_log": _tail_lines(DELIVER_LOG, 30),
        "daemon": _daemon_running(),
        "jobs": forensics.list_jobs(),
    }


# ------------------------------------------------------------- /api/send ----
def api_send(to, subject, body, reply_to=None, frm="ops"):
    return bridge_api.send(frm, to, subject, body, reply_to)


# ------------------------------------------------- cache-stable wake (H8) ---
FROZEN_PREFIX = (
    "You are a pb-rail lane agent. This system prompt is FROZEN: these bytes "
    "never vary between launches, so the provider prompt-cache stays warm "
    "(see ~/pb/rail/CACHE.md).\n"
    "Binding rules:\n"
    "1. Communicate only via the lane bus (~/pb/bin/pb-lane-bus) and encrypted "
    "rail envelopes (~/pb/rail/crypto.py: x25519 KEM -> ChaCha20-Poly1305 -> "
    "SHA-256 digest -> Ed25519 lane-identity signature).\n"
    "2. Bus files are append-only. Never rewrite or reorder bus files; "
    "deliveries read, they never mutate.\n"
    "3. Never write to /tmp, /mnt/pb-work or /dev/shm. /dev/sdd is a foreign "
    "drive: read-only forever, never write it.\n"
    "4. Report outcomes with evidence (seq, digest). Never self-attest work "
    "without a bus record.\n"
    "5. Relay operator directives verbatim. Never paraphrase, never rename "
    "operator assets.\n"
    "6. On every turn: batch tool calls, keep prompts cache-stable, do not "
    "restate frozen contracts.\n"
    "Evidence discipline (binding):\n"
    "7. Every rail delivery logs to ~/pb/live/deliver.log. Every OTS state "
    "transition is logged. Cite seq and digest for every claim you make.\n"
    "8. Registry discipline: only algorithms you actually exercised may be "
    "cited as evidence. Declared-not-exercised stays declared-not-exercised; "
    "never present a declaration as performance.\n"
    "9. Secrets never leave their lane: provider keys, seeds and private "
    "material are never echoed into bus messages, logs, or prompts. Files "
    "that are evidence are never deleted (C-NO-DELETE); access restricted, "
    "content preserved.\n"
    "10. Forensics work goes only through the supervised job runner "
    "(~/pb/rail/forensics.py). Never run raw dd/ddrescue/wipefs probes. "
    "Outputs land only on approved writable filesystems; /tmp, /mnt/pb-work "
    "and /dev/shm are never write targets.\n"
    "11. Continuity: durable context you produce goes into content-addressed "
    "append-only blobs under ~/pb/live/rail/wake/<lane>/blobs/. Never edit a "
    "prompt file in place; append a new blob and move the pointer.\n"
    "12. Escalate honestly: if a task is blocked, report the blocker with "
    "evidence on the bus rather than self-attesting completion. A false "
    "completion report is worse than a failure report.\n"
    "13. Naming is operator property: never rename operator assets, never "
    "coin derogatory names for machines, drives, lanes, or directories. "
    "Operator directives are relayed verbatim; if a name must be referenced, "
    "use the operator's name for it exactly.\n"
    "14. Timestamps: use ISO-8601 local time in logs. The bus sequence number "
    "and the envelope digest together identify a rail message uniquely; quote "
    "both when acknowledging receipt so the sender can verify delivery.\n"
)
TAIL_TEMPLATE = (
    "TASK (variable tail): You were woken by pb-rail /api/wake at %s. "
    "Poll your inbox now: ~/pb/bin/pb-lane-bus poll --lane %s ; process every "
    "unread message, then reply on the bus. Do not restate this prompt.\n"
)
# Cache-hit convention (CACHE.md): (frozen prefix + continuity) bytes over
# total prompt bytes must stay inside 91-94%. When an accumulated tail drags
# the ratio below 91%, the old tail is folded into a NEW immutable
# content-addressed continuity blob and the tail resets, restoring the band.
CACHE_HIT_MIN = 91.0
CACHE_HIT_MAX = 94.0

LAUNCHERS = {
    "glm": [os.path.join(BIN_DIR, "glm"), "-n", "--plain"],
    "codex": ["codex", "exec", "-s", "read-only"],
    "minimax": [os.path.join(BIN_DIR, "pb-wrap"), "minimax"],
    "deepseek": [os.path.join(BIN_DIR, "pb-wrap"), "deepseek"],
    "claude": [os.path.join(HOME, "bin", "claude")],  # known broken
}
NO_WAKE_LANES = {"cline", "grok", "grok-47", "grok-orch", "ops"}


def _continuity_dir(lane):
    d = os.path.join(WAKE_DIR, lane, "blobs")
    os.makedirs(d, exist_ok=True)
    return d


def _continuity_get(lane):
    d = _continuity_dir(lane)
    try:
        with open(os.path.join(d, "..", "current.sha256")) as f:
            h = f.read().strip()
        with open(os.path.join(d, h + ".txt"), encoding="utf-8") as f:
            return f.read(), h
    except Exception:
        return "", None


def _continuity_put(lane, text):
    """Content-addressed append: blob named sha256(text); immutable once written."""
    d = _continuity_dir(lane)
    h = sha256(text.encode("utf-8")).hexdigest()
    blob = os.path.join(d, h + ".txt")
    if not os.path.exists(blob):
        with open(blob, "w", encoding="utf-8") as f:
            f.write(text)
        os.chmod(blob, 0o444)
    with open(os.path.join(d, "..", "current.sha256"), "w") as f:
        f.write(h + "\n")
    return h


def assemble_wake_prompt(lane):
    """Frozen prefix + content-addressed continuity + variable tail (H8)."""
    cont, cont_hash = _continuity_get(lane)

    def hit(c, t):
        total = len(FROZEN_PREFIX) + len(c) + len(t)
        return (100.0 * (len(FROZEN_PREFIX) + len(c)) / total) if total else 100.0

    tail = TAIL_TEMPLATE % (time.strftime("%Y-%m-%dT%H:%M:%S"), lane)
    folded = False
    if cont and hit(cont, tail) < CACHE_HIT_MIN:
        # Fold the stale variable content into continuity; blobs append-only.
        cont_hash = _continuity_put(lane, cont.rstrip("\n") + "\n" + tail)
        with open(os.path.join(_continuity_dir(lane), cont_hash + ".txt"),
                  encoding="utf-8") as f:
            cont = f.read()
        tail = TAIL_TEMPLATE % (time.strftime("%Y-%m-%dT%H:%M:%S"), lane)
        folded = True
    prompt = FROZEN_PREFIX + "\n" + cont + ("\n" if cont else "") + tail
    ratio = hit(cont, tail)
    meta = {
        "frozen_sha256": sha256(FROZEN_PREFIX.encode()).hexdigest(),
        "continuity_sha256": cont_hash,
        "tail_chars": len(tail),
        "estimated_cache_hit_pct": round(ratio, 1),
        "in_band": ratio >= CACHE_HIT_MIN,
        "band": "%.0f-%.0f%%" % (CACHE_HIT_MIN, CACHE_HIT_MAX),
        "folded": folded,
    }
    return prompt, meta


def api_wake(lane):
    lanes = _read_json(LANES_JSON, {}).get("lanes", {})
    if lane not in lanes:
        raise ValueError("unknown lane: %r" % lane)
    if lane == "claude":
        msg = ("claude launcher (~/bin/claude) is KNOWN BROKEN; "
               "reported, not retried (SPEC).")
        log_api("wake lane=claude refused (known broken)")
        return {"ok": False, "lane": lane, "launched": False, "report": msg}
    if lane not in LAUNCHERS or lane in NO_WAKE_LANES:
        msg = ("no launch fallback for lane %r: live-tab lane; use rail "
               "delivery (/api/send) instead." % lane)
        log_api("wake lane=%s refused (no launcher)" % lane)
        return {"ok": False, "lane": lane, "launched": False, "report": msg}
    prompt, meta = assemble_wake_prompt(lane)
    wdir = os.path.join(WAKE_DIR, lane)
    os.makedirs(wdir, exist_ok=True)
    prompt_file = os.path.join(wdir, "last-prompt.txt")
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(prompt)
    out_log = os.path.join(wdir, "launcher.log")
    cmd = LAUNCHERS[lane]
    fi = open(prompt_file, "rb")
    fo = open(out_log, "ab")
    p = subprocess.Popen(cmd, stdin=fi, stdout=fo, stderr=fo, cwd=HOME,
                         start_new_session=True)  # detached, survives us
    meta.update({"lane": lane, "pid": p.pid, "cmd": cmd, "ok": True,
                 "launched": True, "prompt_file": prompt_file})
    log_api("wake lane=%s pid=%d cache_hit=%s%% folded=%s"
            % (lane, p.pid, meta["estimated_cache_hit_pct"], meta["folded"]))
    return meta


# -------------------------------------------------- OTS ladder (H5) --------
def _ladder_state(digest):
    state = "none"
    for line in _tail_lines(LADDER_JSONL, 10 ** 9):
        if not line:
            continue
        try:
            rec = json.loads(line)
        except Exception:
            continue
        if rec.get("digest") == digest:
            state = rec.get("state", state)   # last wins; never collapse
    return state


def _ladder_log(digest, new_state, detail=""):
    with open(LADDER_JSONL, "a") as f:
        f.write(json.dumps({"ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
                            "digest": digest, "state": new_state,
                            "detail": detail[:500]}) + "\n")
    log_api("ots ladder digest=%s -> %s %s" % (digest, new_state, detail[:200]))


def _ots_calendar(info):
    low = info.lower()
    if "pending bitcoin attestation" in low:
        return "pending bitcoin attestation"
    if "bitcoin attests" in low:
        return "bitcoin attested (upgraded)"
    if "calendar" in low:
        return "calendar submitted (unconfirmed)"
    return "calendar status unknown"


def api_ots_stamp(digest):
    if not re.fullmatch(r"[0-9a-f]{64}", digest or ""):
        raise ValueError("envelope_digest must be 64 lowercase hex chars")
    ots_path = os.path.join(OTS_DIR, digest + ".ots")
    state = _ladder_state(digest)

    if state == "none":
        data_file = os.path.join(OTS_DIR, digest + ".txt")
        with open(data_file, "w") as f:
            f.write(digest)
        rc, out = _run([OTS_BIN, "stamp", data_file], timeout=180)
        stamped = os.path.join(OTS_DIR, digest + ".txt.ots")
        if os.path.exists(stamped):
            os.replace(stamped, ots_path)          # rename only, no rewrite
        if rc == 0 and os.path.exists(ots_path):
            state = "SUBMITTED"
            _ladder_log(digest, state, out.strip())
        else:
            raise RuntimeError("ots stamp failed rc=%d: %s" % (rc, out[:400]))

    if state == "SUBMITTED":
        # Attempt to climb the ladder (calendar -> bitcoin). Never collapse.
        _run([OTS_BIN, "upgrade", ots_path], timeout=120)
        _, info = _run([OTS_BIN, "info", ots_path], timeout=60)
        if "Bitcoin attests" in info:
            state = "UPGRADED"
            _ladder_log(digest, state, info.strip())

    _, info = _run([OTS_BIN, "info", ots_path], timeout=60)
    return {"ok": True, "digest": digest, "ladder": state,
            "ots_file": ots_path, "calendar": _ots_calendar(info),
            "ladder_order": list(OTS_LADDER)}


# ------------------------------------------- SPEC2 route bodies (rail-integ) --
# Every body below is a thin adapter: it validates the request, delegates to the
# frozen module that owns the behaviour, and hands the module's own dict back
# unchanged. No measurement, filtering or allowlisting is reimplemented here.

def _int_param(params, name, default, lo, hi):
    """Bounded int query param; a malformed value falls back to the default
    rather than 500-ing, so a hand-typed URL still renders."""
    raw = (params.get(name) or [None])[0]
    if raw is None or raw == "":
        return default
    try:
        val = int(raw)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, val))


TRAFFIC_CACHE_TTL_S = 2.5   # one real scan per window regardless of tab count


def traffic_payload(limit=200, cache_ttl=TRAFFIC_CACHE_TTL_S):
    """GET /api/traffic -> merged live rows + this call's source_status."""
    rows, status = traffic.merge_with_status(limit=limit, cache_ttl=cache_ttl)
    counts = {}
    for row in rows:
        src = row.get("source", "?")
        counts[src] = counts.get(src, 0) + 1
    return {"rows": rows, "count": len(rows), "sources": sorted(counts),
            "source_counts": counts, "source_status": status,
            "budget_s": traffic.BUDGET_S, "ts": traffic.now_iso()}


def fs_payload(path=None, limit=None):
    """GET /api/fs?path= -> fsview.listing() verbatim.

    A blocked path (or any other refusal) is HTTP 200 with the module's
    {error:...} shape: it is an honest answer, not a transport failure, and the
    panel renders it inline rather than showing a blank panel."""
    target = path if path else fsview.DEFAULT_PATH
    if limit is None:
        return fsview.listing(target)
    return fsview.listing(target, limit=limit)


def cmd_run_payload(command, timeout=None):
    """POST /api/cmd -> cmdbridge.run() verbatim.

    A denial is a 200 with ok=false/executed=false/rc=None, which is the proof
    that nothing ran; a transport-level 400 is reserved for a malformed body."""
    if not isinstance(command, str) or not command.strip():
        raise ValueError("command must be a non-empty string")
    if timeout is None:
        return cmdbridge.run(command)
    return cmdbridge.run(command, timeout=_int_param(
        {"timeout": [str(timeout)]}, "timeout", 60, 1, cmdbridge.MAX_TIMEOUT))


def orch_payload(req):
    """POST /api/orch {op,...} -> one orch.py entry point, dispatched on op.

    Refusals (unknown op, bad argument, gate refusal) come back as
    {ok:false, refused:true, reason} with the telemetry attached, so the panel
    can render the refusal instead of hiding it."""
    op = req.get("op")
    if op == "state":
        return _orch().state()
    if op == "fanout":
        return _orch().fanout(req.get("lanes"), req.get("subject", ""),
                              req.get("body", ""),
                              reply_to=req.get("reply_to"),
                              heavy=bool(req.get("heavy")))
    if op == "broadcast":
        return _orch().broadcast(req.get("subject", ""), req.get("body", ""),
                                 reply_to=req.get("reply_to"),
                                 heavy=bool(req.get("heavy")))
    if op == "wake_all":
        return _orch().wake_all(req.get("concurrency") or _orch().MAX_HEAVY)
    if op == "assign":
        return _orch().assign(req.get("lane"), req.get("task"))
    if op == "gate":
        return _orch().gate_check()
    return {"ok": False, "refused": True, "queued": False,
            "reason": "unknown op: %r (want state|fanout|broadcast|wake_all|"
                      "assign|gate)" % (op,),
            "ops": ["state", "fanout", "broadcast", "wake_all", "assign",
                    "gate"]}


def orch_dispatch(req):
    """Runs the orch op, turning an argument error into the refusal shape."""
    try:
        return orch_payload(req)
    except ValueError as exc:
        return {"ok": False, "refused": True, "queued": False,
                "reason": str(exc), "op": req.get("op")}


# ----------------------------------------------- task_0004: load + bridge ---
_LOAD_LINE_RE = re.compile(r"^(\S+)\s+(.*)$")


def _parse_load_line(line):
    """One load-watch.log line -> dict, or None if it does not parse.

    Writer format (~/pb/bin/pb-load-watch snap()):
      <ts> load1=%.2f mem_avail_MiB=%d swap_free_MiB=%d/%d root_free_GiB=%.2f <flags>
    where <flags> is "ok" or ALERT tokens (e.g. ALERT:root_disk<2GiB).
    """
    m = _LOAD_LINE_RE.match(line.strip())
    if not m:
        return None
    row = {"ts": m.group(1)}
    flags = []
    for tok in m.group(2).split():
        if "=" in tok:
            k, _, v = tok.partition("=")
            if k == "swap_free_MiB" and "/" in v:
                free, _, total = v.partition("/")
                try:
                    row["swap_free_MiB"] = int(free)
                    row["swap_total_MiB"] = int(total)
                except ValueError:
                    return None
            elif k in ("load1", "root_free_GiB"):
                try:
                    row[k] = float(v)
                except ValueError:
                    return None
            elif k in ("mem_avail_MiB",):
                try:
                    row[k] = int(v)
                except ValueError:
                    return None
            else:
                row[k] = v                      # future fields pass through
        else:
            flags.append(tok)
    row["flags"] = flags
    return row


def load_payload(limit=20):   # task_0006 default: last 20 lines
    """GET /api/load -> tail of ~/pb/live/load-watch.log, parsed per line.

    The log is written once a minute by ~/pb/bin/pb-load-watch (append-only).
    If the log is not present yet we say so; we never fabricate rows."""
    if not os.path.exists(LOAD_WATCH_LOG):
        return {"absent": True,
                "reason": "load-watch.log not present at %s (writer: "
                          "~/pb/bin/pb-load-watch)" % LOAD_WATCH_LOG}
    lines = _tail_lines(LOAD_WATCH_LOG, limit)
    rows = [r for r in (_parse_load_line(l) for l in lines) if r]
    unparsed = len(lines) - len(rows)
    latest = rows[-1] if rows else None
    return {"source": LOAD_WATCH_LOG,
            "writer": os.path.join(BIN_DIR, "pb-load-watch"),
            "count": len(rows), "unparsed_lines": unparsed,
            "latest": latest,
            "alert": bool(latest and any(
                f.startswith("ALERT") for f in latest.get("flags", []))),
            "rows": rows}


def _bridge_get(path):
    """Fetch one bridge URL with a 8s timeout (BRIDGE_TIMEOUT_S); absent-dict on any failure."""
    import urllib.request
    try:
        with urllib.request.urlopen(BRIDGE_BASE + path,
                                    timeout=BRIDGE_TIMEOUT_S) as r:
            raw = r.read().decode("utf-8", "replace")
    except Exception as e:
        return {"absent": True, "reason": "%s: %s" % (type(e).__name__, e)}
    try:
        return json.loads(raw)
    except ValueError:
        return {"absent": True,
                "reason": "upstream %s returned non-JSON "
                          "(%.80r...)" % (path, raw)}


def bridge_payload(n=50):
    """GET /api/bridge -> proxy 127.0.0.1:8788 overview + lineage tail.

    Read-only proxy with a BRIDGE_TIMEOUT_S (8s) timeout. Each target degrades independently to
    {"absent": true, "reason": ...} so a half-dead bridge stays visible."""
    return {"bridge_base": BRIDGE_BASE, "timeout_s": BRIDGE_TIMEOUT_S,
            "overview": _bridge_get("/api/overview"),
            "lineage": _bridge_get("/api/lineage/tail?n=%d" % n)}


# ======================================================= TERMINAL BRIDGE ====
# owner: rail-term (task_0013). Bound 127.0.0.1 only.
#
# WHAT IS REAL HERE, MEASURED ON THIS HOST (not assumed):
#
#  * INPUT (keystrokes) is genuinely wired. Konsole exposes
#    org.kde.konsole.Session.sendText(QString) on every
#    org.kde.konsole-<pid> service, e.g.
#      qdbus org.kde.konsole-128937 /Sessions/1 \
#            org.kde.konsole.Session.sendText "hello"
#    Same path pb-lane-deliver already uses, so ENTER/arrows/ctrl-c are
#    delivered into the real PTY. It is a WRITE into the terminal.
#
#  * OUTPUT (the screen feed) is NOT a raw PTY read. /dev/pts/N is the
#    terminal endpoint with mode crw--w----: the read side returns only what
#    this process writes, never the owning process's scrollback. Verified on
#    this box: /dev/pts/6 is crw--w----, a read returns nothing, a 2s blocking
#    read times out (rc=124), uid=1000 with yama ptrace_scope=1. A new tap
#    cannot be attached to an already-running session, and writing into a live
#    session's tty is deliberately not done.
#    => the screen feed is the session's own captured transcript (the cline
#    session's *.messages.json). That IS real captured output of that session.
#    It is labelled transcript-backed everywhere, never "raw pty", and nothing
#    is ever synthesised to fill a gap.
#
#  * A tty with no agent transcript (a plain bash tab) gets an explicit honest
#    refusal with a reason, never an invented screen.

CLINE_SESSIONS = os.path.expanduser("~/.cline/data/sessions")
TERM_RING_MAX = 2000          # ring buffer cap, lines kept per tty
TERM_RING_FLUSH = 60           # new lines per pushed delta frame
TERM_PUSH_INTERVAL_S = 0.75    # delta cadence for /api/term/ws
TERM_TRANSCRIPT_FRESH_S = 120  # a transcript must be written within this
                                # window to count as this tty's live output
LIVE_PUSH_INTERVAL_S = 2.0     # /api/live push cadence (poll fallback is 2s)
_QDBUS = shutil.which("qdbus") or shutil.which("qdbus6") or "qdbus"


def _qdbus(*args, timeout=5):
    """Run qdbus read-only. Returns stdout.strip(), or '' on any failure."""
    try:
        p = subprocess.run([_QDBUS] + list(args), capture_output=True,
                           text=True, timeout=timeout)
        return (p.stdout or "").strip()
    except Exception:
        return ""


# ------------------------------------------------------- konsole discovery --
_KMAP_LOCK = threading.Lock()
_KMAP = {"val": {}, "at": 0.0}


def konsole_map(max_age=5.0):
    """tty -> {svc, session, shell_pid, pty} for every live Konsole tab.

    Same discovery pb-lane-deliver.konsole_map() performs (qdbus service list
    -> Session.processId -> /proc/<pid>/fd/0), with a short TTL because the
    websocket re-resolves on connect. Read live from DBus + procfs every call."""
    now = time.time()
    with _KMAP_LOCK:
        if _KMAP["val"] and now - _KMAP["at"] < max_age:
            return dict(_KMAP["val"])
    out = {}
    for line in _qdbus().splitlines():
        svc = line.strip()
        if not svc.startswith("org.kde.konsole-"):
            continue
        for n in range(1, 64):
            ses = "/Sessions/%d" % n
            spid = _qdbus(svc, ses, "org.kde.konsole.Session.processId")
            if not spid.isdigit():
                continue
            try:
                pty = os.path.realpath("/proc/%s/fd/0" % spid)
            except OSError:
                continue
            if not pty.startswith("/dev/pts/"):
                continue
            out[pty] = {"svc": svc, "session": ses, "shell_pid": int(spid),
                        "pty": pty}
    with _KMAP_LOCK:
        _KMAP["val"] = dict(out)
        _KMAP["at"] = now
    return out


def _cmdline(pid):
    try:
        with open("/proc/%d/cmdline" % pid, "rb") as f:
            return f.read().replace(b"\0", b" ").decode("utf-8", "replace")
    except OSError:
        return ""


def _proc_start_epoch(pid):
    """Process start epoch seconds: btime + starttime/SC_CLK_TCK."""
    try:
        with open("/proc/%d/stat" % pid, "rb") as f:
            raw = f.read().decode("utf-8", "replace")
        starttime = int(raw[raw.rindex(")") + 2:].split()[19])
        hz = os.sysconf("SC_CLK_TCK")
        with open("/proc/stat", "r") as f:
            for l in f:
                if l.startswith("btime "):
                    return int(l.split()[1]) + starttime / float(hz)
    except Exception:
        return None


def _agent_pids_for_tty(entry):
    """cline/node agent PIDs reachable from this konsole session's shell pid."""
    out, seen, stack = [], set(), [entry["shell_pid"]]
    while stack:
        pid = stack.pop()
        if pid in seen:
            continue
        seen.add(pid)
        try:
            with open("/proc/%d/task/%d/children" % (pid, pid), "r") as f:
                kids = [int(x) for x in f.read().split()]
        except OSError:
            kids = []
        for k in kids:
            cl = _cmdline(k)
            if "cline" in cl and "grep" not in cl:
                out.append(k)
            stack.append(k)
    return out


def _tty_num(tty):
    try:
        return int(str(tty).rsplit("/", 1)[-1])
    except Exception:
        return 9999


def _norm_tty(tty):
    """Accept 'pts/6', '/dev/pts/6' or bare '6'; return /dev/pts/N or None."""
    if tty is None:
        return None
    t = str(tty).strip()
    if t.isdigit():
        t = "/dev/pts/" + t
    elif not t.startswith("/dev/"):
        t = "/dev/" + t.lstrip("/")
    return t if re.match(r"^/dev/pts/\d+$", t) else None


# ------------------------------------------------------- transcript source --
def _transcript_files():
    """(path, mtime) for every cline messages.json, newest first."""
    files = []
    try:
        dirs = [d for d in os.listdir(CLINE_SESSIONS)
                if os.path.isdir(os.path.join(CLINE_SESSIONS, d))]
    except OSError:
        return files
    for d in dirs:
        sdir = os.path.join(CLINE_SESSIONS, d)
        try:
            names = os.listdir(sdir)
        except OSError:
            continue
        for n in names:
            if n.endswith(".messages.json"):
                p = os.path.join(sdir, n)
                try:
                    files.append((p, os.path.getmtime(p)))
                except OSError:
                    continue
    files.sort(key=lambda t: t[1], reverse=True)
    return files


def _load_messages(path):
    """json.load a messages.json, or (None, error-string)."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return json.load(f), None
    except Exception as e:
        return None, str(e)


def _message_lines(m):
    """Flatten one transcript message into display lines (role-prefixed)."""
    lines = []
    if not isinstance(m, dict):
        return lines
    role = m.get("role", "?")
    content = m.get("content")
    if isinstance(content, str):
        lines.append("%s: %s" % (role, content))
        return lines
    if not isinstance(content, list):
        return lines
    for part in content:
        if not isinstance(part, dict):
            continue
        ptype = part.get("type")
        if ptype == "text" and part.get("text"):
            lines.append("%s: %s" % (role, part["text"]))
        elif ptype == "tool_use":
            lines.append("[tool %s] %s"
                         % (part.get("name", "?"),
                            json.dumps(part.get("input", {}),
                                       default=str)[:300]))
        elif ptype == "tool_result":
            c = part.get("content")
            if isinstance(c, str):
                lines.append("[tool_result] %s" % c)
            elif isinstance(c, list):
                for sub in c:
                    if isinstance(sub, dict) and sub.get("type") == "text":
                        lines.append("[tool_result] %s" % sub.get("text", ""))
    return lines


def _newest_msg_ts(path, data=None):
    newest = 0.0
    if data is None:
        data, _err = _load_messages(path)
    if not isinstance(data, dict):
        return 0.0
    for m in (data.get("messages") or [])[-5:]:
        try:
            newest = max(newest, int(m.get("ts") or 0) / 1000.0)
        except Exception:
            continue
    return newest


def _cline_sessions_by_pid(pids):
    """pid -> [(mtime, messages_path)] from cline's own session index.

    cline keeps ~/.cline/data/db/sessions.db with a `sessions` table holding
    (pid, messages_path, status, is_subagent, parent_session_id). That is an
    exact, first-party mapping from a running process to the transcript it
    writes, so it is used in preference to any heuristic. Opened read-only
    (mode=ro) and never written; if the db is missing or locked the caller
    falls back to the sidecar/heuristic path."""
    out = {}
    if not pids:
        return out
    try:
        import sqlite3
        db = os.path.expanduser("~/.cline/data/db/sessions.db")
        con = sqlite3.connect("file:%s?mode=ro" % db, uri=True, timeout=2.0)
        try:
            q = ("select pid, messages_path, session_id, parent_session_id "
                 "from sessions where messages_path is not null and pid in (%s)"
                 % ",".join(str(int(p)) for p in pids))
            for pid, mpath, sid, parent in con.execute(q):
                try:
                    mtime = os.path.getmtime(mpath)
                except OSError:
                    continue
                out.setdefault(int(pid), []).append(
                    (mtime, mpath, sid, parent))
        finally:
            con.close()
    except Exception as e:
        log_api("term sessions.db read failed: %s" % e)
        return {}
    return out


def _root_transcript(con_pid_rows):
    """The lead (root) transcript of a team, reached via parent_session_id.

    A team spawns subagents that share the parent's pid, so matching on pid
    alone finds the subagent transcripts. The conversation actually displayed
    on the operator's tty is the ROOT session they were spawned from, so the
    parent id is followed to its own messages.json."""
    try:
        import sqlite3
        db = os.path.expanduser("~/.cline/data/db/sessions.db")
        con = sqlite3.connect("file:%s?mode=ro" % db, uri=True, timeout=2.0)
        try:
            for _mtime, _mp, _sid, parent in con_pid_rows:
                if not parent:
                    continue
                row = con.execute(
                    "select messages_path from sessions where session_id=?",
                    (parent,)).fetchone()
                if row and row[0] and os.path.exists(row[0]):
                    return os.path.getmtime(row[0]), row[0], parent, None
        finally:
            con.close()
    except Exception:
        return None
    return None


def _transcript_for_tty(entry):
    """The cline transcript belonging to this tty's agent -> (path|None, err).

    Attribution must be UNIQUE or the screen is refused; showing one live
    session's text under another tty's name would be a lie. Signals, strongest
    first:

      1. cline's own sessions.db: rows whose `pid` is one of this tty's live
         agent processes. Because a team runs its subagents under the parent's
         pid, the ROOT session is resolved through parent_session_id -- that
         is the lead conversation actually shown on the operator's tty;
      2. the per-session sidecar <session>.json `pid` field;
      3. failing both, a transcript accepted only if it is being written RIGHT
         NOW (mtime within TERM_TRANSCRIPT_FRESH_S), is not older than the
         agent's start time, and exactly one candidate qualifies.

    An idle-but-unmatched tty is refused with the reason, never filled with
    some other session's output."""
    agent_pids = set(_agent_pids_for_tty(entry))
    if not agent_pids:
        return None, "no cline agent process under this tty"
    starts = [t for t in (_proc_start_epoch(p) for p in agent_pids) if t]
    if not starts:
        return None, "cannot read agent start time for pids %s" % sorted(
            agent_pids)
    floor = min(starts)

    # (1) exact, first-party pid index -> root session of that team
    by_pid = _cline_sessions_by_pid(agent_pids)
    if by_pid:
        rows = [c for lst in by_pid.values() for c in lst]
        root = _root_transcript(rows)
        if root:
            return root[1], None
        best = max(rows, key=lambda c: c[0])
        return best[1], None

    by_sidecar, fresh = [], []
    now = time.time()
    for path, mtime in _transcript_files()[:80]:
        sdir = os.path.dirname(path)
        sid = os.path.basename(path).split(".")[0]
        data, _err = _load_messages(path)
        if not isinstance(data, dict):
            continue
        # (2) sidecar pid field
        side = _read_json(os.path.join(sdir, sid + ".json"), {})
        spid = side.get("pid")
        if isinstance(spid, int) and spid in agent_pids:
            by_sidecar.append((mtime, path))
        elif (now - mtime) <= TERM_TRANSCRIPT_FRESH_S:
            # (3) currently being written and not older than the agent
            if _newest_msg_ts(path, data) >= floor - 5:
                fresh.append((mtime, path))
    if by_sidecar:
        by_sidecar.sort(reverse=True)
        return by_sidecar[0][1], None
    if len(fresh) == 1:
        return fresh[0][1], None
    if len(fresh) > 1:
        return None, ("ambiguous: %d live transcripts could match this tty "
                      "(agent pids %s); refusing to show the wrong session's "
                      "output" % (len(fresh), sorted(agent_pids)))
    return None, ("no transcript for this tty's agent (pids %s, started "
                  "%.0f); the session is idle and its transcript predates the "
                  "process, so it is not this session's live output"
                  % (sorted(agent_pids), floor))


# ------------------------------------------------------------- ring buffer --
class _TermRing:
    """Continuously-captured ring of rendered lines for one tty.

    Fed by re-reading the owning transcript and appending only messages new
    since the last read (the discipline of `tail -F`), so the websocket can
    push deltas and /api/term/screen can return a tail of the same buffer."""

    def __init__(self, maxlen=TERM_RING_MAX):
        self.maxlen = maxlen
        self.lines = []
        self.cursor = 0
        self.source = None
        self.last_error = None
        self.built_at = None
        self.lock = threading.Lock()

    def snapshot(self, n=120):
        with self.lock:
            return list(self.lines[-n:])

    def new_since(self, idx):
        with self.lock:
            idx = max(0, min(idx, len(self.lines)))
            return list(self.lines[idx:]), len(self.lines)

    @property
    def count(self):
        with self.lock:
            return len(self.lines)


_RINGS = {}
_RING_LOCK = threading.Lock()


def _get_ring(tty):
    with _RING_LOCK:
        r = _RINGS.get(tty)
        if r is None:
            r = _TermRing()
            _RINGS[tty] = r
        return r


def _ensure_ring(tty):
    """Top the ring up from the owning transcript. -> (ring, ok, reason)."""
    entry = konsole_map().get(tty)
    if not entry:
        return _get_ring(tty), False, "no konsole session owns %s" % tty
    path, err = _transcript_for_tty(entry)
    if not path:
        return _get_ring(tty), False, err
    ring = _get_ring(tty)
    with ring.lock:
        if ring.source != path:
            ring.source = path
            ring.lines = []
            ring.cursor = 0
        data, err = _load_messages(path)
        if not isinstance(data, dict):
            ring.last_error = err
            return ring, False, "transcript unreadable: %s" % err
        msgs = data.get("messages") or []
        if len(msgs) < ring.cursor:
            ring.cursor = 0                    # rotated/truncated: restart
        for m in msgs[ring.cursor:]:
            ring.lines.extend(_message_lines(m))
        ring.cursor = len(msgs)
        if len(ring.lines) > ring.maxlen * 2:
            del ring.lines[:len(ring.lines) - ring.maxlen]
        ring.built_at = time.time()
        ring.last_error = None
    return ring, True, None


# ---------------------------------------------------- /api/term/... routes --
def term_sessions():
    """GET /api/term/sessions -> [{tty, svc, session, title, lane, live}].

    Built live from the qdbus/konsole map. `lane` is this tty's delivery route
    from DELIVERY.json when it has one. `live` is a real liveness check (the
    session's shell pid still exists), not a static true. `feed` states which
    screen feed this tty actually has, so the UI never has to guess."""
    kmap = konsole_map()
    delivery = _read_json(DELIVERY_JSON, {}).get("lanes", {})
    tty_lane = {}
    for lane, routes in delivery.items():
        for r in routes or []:
            if isinstance(r, dict) and r.get("tty"):
                tty_lane[r["tty"]] = lane
    out = []
    for tty, e in sorted(kmap.items(), key=lambda kv: _tty_num(kv[0])):
        title = _qdbus(e["svc"], e["session"],
                       "org.kde.konsole.Session.title", "1") or \
            _qdbus(e["svc"], e["session"],
                   "org.kde.konsole.Session.title", "0")
        fg = _qdbus(e["svc"], e["session"],
                    "org.kde.konsole.Session.foregroundProcessId")
        ring = _RINGS.get(tty)
        out.append({
            "tty": tty,
            "svc": e["svc"],
            "session": e["session"],
            "title": title or "(untitled)",
            "lane": tty_lane.get(tty),
            "live": os.path.isdir("/proc/%d" % e["shell_pid"]),
            "shell_pid": e["shell_pid"],
            "fg_pid": int(fg) if fg.isdigit() else None,
            "input": "konsole-sendText",
            "feed": "transcript" if (ring and ring.source) else "none",
            "feed_label": "transcript-backed (not raw pty)",
        })
    return out


def term_screen(tty, limit=120):
    """GET /api/term/screen?tty=/dev/pts/N -> last ~limit lines of real output.

    HONESTY CONTRACT: these lines are transcript-backed, not a raw PTY read (a
    pty cannot be read for another process's scrollback; see the module
    header). `source` names the exact transcript file the lines came from and
    `source_kind` is 'transcript'. A tty with no agent transcript returns
    {ok:false, error:...} with a reason -- never a fabricated screen."""
    tty_n = _norm_tty(tty)
    if not tty_n:
        return {"ok": False, "error": "tty must look like /dev/pts/N",
                "tty": tty, "lines": [], "count": 0}
    ring, ok, reason = _ensure_ring(tty_n)
    if not ok:
        return {"ok": False, "tty": tty_n, "source_kind": "none",
                "error": reason, "lines": [], "count": 0,
                "note": "raw pty capture is impossible for another process's "
                        "terminal (mode crw--w----); this tty has no agent "
                        "transcript to read, so no screen is returned"}
    lines = ring.snapshot(limit)
    if not lines:
        # The transcript IS this session's but currently holds no messages
        # (cline flushes a subagent transcript periodically). Say so rather
        # than handing back an empty pane that reads like a dead feed.
        return {"ok": True, "empty": True, "tty": tty_n,
                "source_kind": "transcript", "source": ring.source,
                "source_label": "transcript-backed (not raw pty)",
                "count": 0, "lines": [],
                "note": "this session's transcript is real but currently holds "
                        "no messages (it is flushed periodically); showing the "
                        "true empty state, not a placeholder screen",
                "ts": time.time()}
    return {"ok": True, "tty": tty_n, "source_kind": "transcript",
            "source": ring.source,
            "source_label": "transcript-backed (not raw pty)",
            "count": len(lines), "lines": lines, "ts": time.time()}


_NAMED_KEYS = {
    "ENTER": "\r", "RETURN": "\r", "CR": "\r", "NEWLINE": "\n",
    "CTRL_C": "\x03", "CTRL-C": "\x03", "CTRLC": "\x03",
    "CTRL_D": "\x04", "CTRL_Z": "\x1a", "CTRL_L": "\x0c", "CTRL_A": "\x01",
    "CTRL_E": "\x05", "CTRL_U": "\x15", "CTRL_K": "\x0b", "CTRL_W": "\x17",
    "UP": "\x1b[A", "DOWN": "\x1b[B", "RIGHT": "\x1b[C", "LEFT": "\x1b[D",
    "BACKSPACE": "\x7f", "BS": "\x7f", "TAB": "\t", "ESC": "\x1b",
    "DELETE": "\x1b[3~", "HOME": "\x1b[H", "END": "\x1b[F",
    "PGUP": "\x1b[5~", "PGDN": "\x1b[6~", "SPACE": " ",
}


def _keys_to_text(keys):
    """Keystroke payload -> literal text for konsole sendText.

    Accepts a named key ("ENTER", "CTRL_C", "UP"), a list of them, a dict with
    key/keys/text, or a raw string. The mapping is explicit so the UI never has
    to know terminal encodings."""
    if keys is None or isinstance(keys, (int, float, bool)):
        return ""
    if isinstance(keys, str):
        return _NAMED_KEYS.get(keys.upper(), keys)
    if isinstance(keys, list):
        return "".join(_keys_to_text(k) for k in keys)
    if isinstance(keys, dict):
        for field in ("key", "keys", "text", "name"):
            if keys.get(field) is not None:
                return _keys_to_text(keys[field])
    return ""


def term_send(tty, keys):
    """Deliver keystrokes into the tty's real PTY via konsole sendText.

    This is the genuine input path: the text goes into the Konsole session
    that owns the tty, so the agent process receives it as if it were typed.
    Nothing is echoed from here; the agent's reaction shows up in its
    transcript, which is what the screen feed shows."""
    tty_n = _norm_tty(tty)
    if not tty_n:
        return {"ok": False, "error": "tty must look like /dev/pts/N",
                "tty": tty}
    entry = konsole_map().get(tty_n)
    if not entry:
        return {"ok": False, "tty": tty_n, "input": "konsole-sendText",
                "error": "no konsole session owns %s" % tty_n}
    text = _keys_to_text(keys)
    if not text:
        return {"ok": False, "tty": tty_n, "error": "empty key payload"}
    _qdbus(entry["svc"], entry["session"],
           "org.kde.konsole.Session.sendText", text, timeout=8)
    log_api("term sendText tty=%s %s%s bytes=%d"
            % (tty_n, entry["svc"], entry["session"], len(text)))
    return {"ok": True, "tty": tty_n, "bytes": len(text),
            "transport": "konsole-sendText", "svc": entry["svc"],
            "session": entry["session"]}


def term_attach(tty):
    """POST /api/term/attach {tty} -> raise/focus that Konsole window."""
    tty_n = _norm_tty(tty)
    if not tty_n:
        return {"ok": False, "error": "tty must look like /dev/pts/N",
                "tty": tty}
    entry = konsole_map().get(tty_n)
    if not entry:
        return {"ok": False, "tty": tty_n,
                "error": "no konsole session owns %s" % tty_n}
    _qdbus(entry["svc"], "/konsole", "org.kde.konsole.MainWindow.raiseWindow")
    _qdbus(entry["svc"], "/konsole", "org.kde.konsole.MainWindow.show")
    log_api("term attach tty=%s %s" % (tty_n, entry["svc"]))
    return {"ok": True, "tty": tty_n, "svc": entry["svc"],
            "session": entry["session"], "focused": True}


# ------------------------------------------------------------- /api/live -----
# A single JSON frame carrying the same live data the panel polls for, so the
# UI can poll this one route as a fallback when the websocket cannot connect.
# Real measured data only: each section is the output of the same producer the
# individual route uses, and a failing section carries its own error instead of
# vanishing.
LIVE_KINDS = ("traffic", "heartbeat", "orch", "term")


def live_frame(kinds=LIVE_KINDS):
    """Build one live frame. `kinds` selects which sections to include."""
    if isinstance(kinds, str):
        kinds = tuple(k.strip() for k in kinds.split(",") if k.strip())
    kinds = tuple(k for k in kinds if k in LIVE_KINDS) or LIVE_KINDS
    frame = {"type": "live", "ts": time.time(),
             "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
             "kinds": list(kinds),
             "mode": "json-poll",
             "note": "poll fallback; the websocket /api/live pushes the same "
                     "frames. term screens are transcript-backed, not raw pty"}
    if "traffic" in kinds:
        try:
            frame["traffic"] = traffic_payload(limit=40)
        except Exception as e:
            frame["traffic"] = {"error": str(e)}
    if "heartbeat" in kinds:
        try:
            frame["heartbeat"] = heartbeat_payload()
        except Exception as e:
            frame["heartbeat"] = {"error": str(e)}
    if "orch" in kinds:
        try:
            frame["orch"] = _orch().state()
        except Exception as e:
            frame["orch"] = {"error": str(e)}
    if "term" in kinds:
        try:
            frame["term"] = {"sessions": term_sessions()}
        except Exception as e:
            frame["term"] = {"error": str(e)}
    return frame


# ------------------------------------------------- websocket (RFC 6455) -----
# Implemented directly on the socket the stdlib HTTP server already accepted,
# so there is no third-party dependency, no extra process and no extra port:
# 127.0.0.1:8791 carries both plain HTTP and the two websocket routes.
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
import struct      # noqa: E402  (used only by the framing below)


def _ws_accept(key):
    return base64.b64encode(
        hashlib.sha1((key + WS_GUID).encode("ascii")).digest()).decode()


def _ws_frame(payload, opcode=0x1):
    data = payload.encode("utf-8") if isinstance(payload, str) else payload
    head = bytearray([0x80 | opcode])
    n = len(data)
    if n < 126:
        head.append(n)
    elif n < 65536:
        head.append(126)
        head += struct.pack(">H", n)
    else:
        head.append(127)
        head += struct.pack(">Q", n)
    return bytes(head) + data


class _WS:
    """One server-side websocket connection (one thread pair per client)."""

    def __init__(self, sock):
        self.sock = sock
        self.alive = True

    def send_json(self, obj):
        self._raw(_ws_frame(json.dumps(obj, default=str)))

    def _raw(self, data):
        try:
            self.sock.sendall(data)
        except Exception:
            self.alive = False

    def _exact(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                return None
            buf += chunk
        return buf

    def recv(self):
        """-> ('text', str) | ('close', None) | None on error/EOF."""
        try:
            hdr = self._exact(2)
            if not hdr:
                return None
            b0, b1 = hdr[0], hdr[1]
            opcode, length = b0 & 0x0F, b1 & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._exact(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._exact(8))[0]
            mask = self._exact(4) if b1 & 0x80 else None
            data = self._exact(length) if length else b""
            if mask and data:
                data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
            if opcode == 0x8:
                return ("close", None)
            if opcode in (0x1, 0x2, 0x0):
                return ("text", data.decode("utf-8", "replace"))
            return ("other", None)
        except Exception:
            return None

    def close(self):
        try:
            self._raw(_ws_frame(b"", 0x8))
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass
        self.alive = False


# --------------------------------------------------- /api/term/ws handlers --
def _term_ws_push(ws, tty, initial=120):
    """Push screen deltas for one tty until the socket dies."""
    ring, ok, reason = _ensure_ring(tty)
    if not ok:
        ws.send_json({
            "type": "error", "ok": False, "tty": tty, "source_kind": "none",
            "error": reason,
            "note": "no transcript-backed feed for this tty. Raw pty capture "
                    "is impossible for another process's terminal on this "
                    "host, and this tty has no agent transcript, so no screen "
                    "is sent. Nothing is faked."})
        return
    ws.send_json({
        "type": "hello", "ok": True, "tty": tty,
        "source_kind": "transcript", "source": ring.source,
        "source_label": "transcript-backed (not raw pty)",
        "note": "screen lines are this session's real captured transcript; "
                "input is delivered to the real pty via konsole sendText",
        "input": {"transport": "konsole-sendText", "enter": "ENTER",
                  "ctrl_c": "CTRL_C", "arrows": "UP/DOWN/LEFT/RIGHT",
                  "backspace": "BACKSPACE"}})
    ws.send_json({"type": "screen", "tty": tty, "source_kind": "transcript",
                  "lines": ring.snapshot(initial),
                  "count": min(ring.count, initial)})
    idx = ring.count
    last_beat = 0.0
    while ws.alive:
        ring, ok, reason = _ensure_ring(tty)
        if not ok:
            ws.send_json({"type": "error", "ok": False, "tty": tty,
                          "error": reason})
            break
        new, idx = ring.new_since(idx)
        if new:
            if len(new) > TERM_RING_FLUSH:
                new = new[-TERM_RING_FLUSH:]
            ws.send_json({"type": "delta", "tty": tty, "source_kind":
                          "transcript", "count": len(new), "lines": new,
                          "ts": time.time()})
        elif time.time() - last_beat > 10:
            ws.send_json({"type": "keepalive", "tty": tty, "ts": time.time()})
            last_beat = time.time()
        time.sleep(TERM_PUSH_INTERVAL_S)


def _term_ws_read(ws, tty):
    """Read client frames on the term socket; forward keystrokes to the pty."""
    while ws.alive:
        frame = ws.recv()
        if frame is None:
            ws.alive = False
            break
        kind, text = frame
        if kind == "close":
            ws.alive = False
            break
        if kind != "text" or text is None:
            continue
        try:
            msg = json.loads(text)
        except Exception:
            msg = {"op": "keys", "keys": text}
        op = msg.get("op", "keys")
        if op in ("keys", "input", "send"):
            res = term_send(msg.get("tty") or tty,
                            msg.get("keys", msg.get("text")))
            ws.send_json({"type": "ack", "op": "keys", "ok": res.get("ok"),
                          "bytes": res.get("bytes"),
                          "error": res.get("error")})
        elif op == "ping":
            ws.send_json({"type": "pong", "ts": time.time()})
        elif op == "attach":
            res = term_attach(msg.get("tty") or tty)
            ws.send_json({"type": "ack", "op": "attach", "ok": res.get("ok"),
                          "error": res.get("error")})
        else:
            ws.send_json({"type": "ack", "op": op, "ok": False,
                          "error": "unknown op"})


def serve_term_ws(ws, tty):
    log_api("term ws open tty=%s" % tty)
    pusher = threading.Thread(target=_term_ws_push, args=(ws, tty), daemon=True)
    pusher.start()
    try:
        _term_ws_read(ws, tty)
    finally:
        ws.alive = False
        pusher.join(timeout=2)
        ws.close()
        log_api("term ws closed tty=%s" % tty)


# ----------------------------------------------------- /api/live websocket --
def serve_live_ws(ws, kinds):
    """Push a live frame every LIVE_PUSH_INTERVAL_S, same shape as the
    GET /api/live fallback the UI polls when this socket is unavailable."""
    log_api("live ws open kinds=%s" % (list(kinds),))
    reader = threading.Thread(target=_live_ws_read, args=(ws,), daemon=True)
    reader.start()
    try:
        while ws.alive:
            frame = live_frame(kinds)
            frame["mode"] = "push"
            ws.send_json(frame)
            time.sleep(LIVE_PUSH_INTERVAL_S)
    finally:
        ws.alive = False
        reader.join(timeout=2)
        ws.close()
        log_api("live ws closed")


def _live_ws_read(ws):
    while ws.alive:
        frame = ws.recv()
        if frame is None or frame[0] == "close":
            ws.alive = False
            break
        if frame[0] == "text" and frame[1]:
            try:
                msg = json.loads(frame[1])
            except Exception:
                msg = {}
            if msg.get("op") == "ping":
                ws.send_json({"type": "pong", "ts": time.time()})


# ------------------------------------------------------- http ws upgrade ---
def _is_ws_upgrade(headers):
    return (headers.get("Upgrade", "").lower() == "websocket" and
            "upgrade" in headers.get("Connection", "").lower())


def _do_upgrade(handler, parsed, qs):
    """Complete the RFC 6455 handshake and hand the socket to the route."""
    key = handler.headers.get("Sec-WebSocket-Key")
    if not key:
        handler._send(400, {"error": "missing Sec-WebSocket-Key"})
        return True
    handler.send_response(101, "Switching Protocols")
    handler.send_header("Upgrade", "websocket")
    handler.send_header("Connection", "Upgrade")
    handler.send_header("Sec-WebSocket-Accept", _ws_accept(key))
    handler.end_headers()
    try:
        handler.wfile.flush()
    except Exception:
        return True
    ws = _WS(handler.connection)
    route = parsed.path
    if route == "/api/term/ws":
        tty = _norm_tty((qs.get("tty") or [None])[0])
        if not tty:
            ws.send_json({"type": "error", "ok": False,
                          "error": "tty query param must look like /dev/pts/N"})
            ws.close()
            return True
        serve_term_ws(ws, tty)
    elif route == "/api/live":
        kinds = (qs.get("kinds") or [",".join(LIVE_KINDS)])[0]
        serve_live_ws(ws, kinds)
    else:
        ws.send_json({"type": "error", "ok": False,
                      "error": "no websocket route %s" % route})
        ws.close()
    return True


# ------------------------------------------------------------- HTTP core ---
class RailHandler(BaseHTTPRequestHandler):
    server_version = "pb-rail/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # http.server noise -> api.log
        log_api("http " + (fmt % args))

    def _send(self, code, obj, ctype="application/json"):
        body = (json.dumps(obj, indent=1) if not isinstance(obj, str)
                else obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype +
                         ("; charset=utf-8" if ctype.startswith("text/") else ""))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8791")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _html(self, path, label):
        try:
            with open(path, encoding="utf-8") as f:
                self._send(200, f.read(), "text/html")
        except FileNotFoundError:
            self._send(503, {"error": "%s not present at %s" % (label, path)})

    def do_OPTIONS(self):
        self._send(200, {"ok": True})

    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path
        qs = parse_qs(parsed.query, keep_blank_values=True)
        # RFC 6455 upgrade for the two websocket routes; everything else below
        # stays plain HTTP on the same 127.0.0.1:8791 listener.
        if route in ("/api/term/ws", "/api/live") and \
                _is_ws_upgrade(self.headers):
            _do_upgrade(self, parsed, qs)
            self.close_connection = True
            return
        try:
            if route in ("/", "/index.html"):
                self._html(PANEL_HTML, "panel.html")
            elif route == "/agent/live-bus/LANES.json":
                self._send(200, _read_json(LANES_JSON, {}))
            elif route == "/agent/live-bus/messages.ndjson":
                with open(NDJSON) as f:
                    self._send(200, f.read(), "text/plain")
            elif route == "/health":
                self._send(200, {"ok": True, "service": "ProofBundle verified relay", "version": "20261011", "encrypted": True})
            elif route in ("/lineage/export", "/api/lineage/tail"):
                self._send(200, bridge_api.lineage())
            elif route == "/snapshot":
                self._send(200, bridge_api.snapshot())
            elif route == "/track":
                self._send(410, {"message": "Use the native local tracker: pb-bridge-track-native (or --tty)."})
            elif route == "/api/tracker":
                self._send(200, bridge_api.tracker())
            elif route == "/api/attestations":
                self._send(200, bridge_api.attestations())
            elif route == "/api/agents":
                self._send(200, {"registered": bridge_api.agents()})
            elif route.startswith("/identity/"):
                self._send(200, identity_gate.identity(unquote(route[len("/identity/"):])) )
            elif route.startswith("/inbox/"):
                self._send(200, bridge_api.inbox(unquote(route[len("/inbox/"):])) )
            elif route == "/api/inbox":
                self._send(200, bridge_api.inbox((qs.get("agent_id") or [""])[0]))
            elif route == "/proofbundle":
                self._html(PROOFBUNDLE, "proofbundle.html")  # read-only copy
            elif route == "/api/state":
                self._send(200, state_payload())
            elif route == "/api/heartbeat":
                self._send(200, heartbeat_payload())
            elif route == "/api/algorithms":
                self._send(200, _read_json(
                    ALGORITHMS_JSON, {"error": "ALGORITHMS.json missing"}))
            elif route == "/api/jobs":
                # SPEC line 52: bare list from forensics.list_jobs(); the panel
                # consumer (panel.html renderJobs) iterates the array directly.
                self._send(200, forensics.list_jobs())
            elif route == "/api/traffic":          # SPEC2
                self._send(200, traffic_payload(
                    limit=_int_param(qs, "limit", 200, 1, 20000)))
            elif route == "/api/fs":               # SPEC2
                path = (qs.get("path") or [None])[0]
                limit = _int_param(qs, "limit", None, 1, fsview.MAX_LIMIT) \
                    if (qs.get("limit") or [""])[0] else None
                self._send(200, fs_payload(path, limit))
            elif route == "/api/cmd/allowlist":    # SPEC2
                self._send(200, cmdbridge.allowlist())
            elif route == "/api/system":           # SPEC2
                self._send(200, _orch().state()["telemetry"])
            elif route == "/api/orch":             # SPEC2
                self._send(200, _orch().state())
            elif route == "/api/load":              # task_0004
                self._send(200, load_payload(
                    limit=_int_param(qs, "limit", 20, 1, 1440)))
            elif route == "/api/bridge":            # task_0004
                data = bridge_api.lineage()
                recs = bridge_api.records()
                self._send(200, {"overview": {"entries": len(recs), "last_seq": recs[-1]["seq"] if recs else 0,
                    "agents_registered": len(bridge_api.agents()), "chain_ok": None},
                    "lineage": {"tail": [{"seq": r["seq"], "ts": r["ts"], "agent": r["src"], "to": ",".join(r["to"]),
                    "payload_type": r["kind"], "hash_preview": r["hash"][:20]} for r in recs[-50:]]}, "attestations": data["attestations"]})
            elif route == "/api/term/sessions":     # task_0013
                self._send(200, {"sessions": term_sessions(),
                                 "feed": "transcript-backed (not raw pty)",
                                 "input": "konsole-sendText",
                                 "ts": time.time()})
            elif route == "/api/term/screen":       # task_0013
                self._send(200, term_screen(
                    (qs.get("tty") or [None])[0],
                    _int_param(qs, "limit", 120, 1, TERM_RING_MAX)))
            elif route == "/api/term/send":         # task_0013
                self._send(200, term_send((qs.get("tty") or [None])[0],
                                          (qs.get("keys") or [None])[0]))
            elif route == "/api/live":              # task_0013
                self._send(200, live_frame(
                    (qs.get("kinds") or [",".join(LIVE_KINDS)])[0]))
            else:
                self._send(404, {"error": "no such route", "route": route})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def _body_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            return json.loads(raw.decode("utf-8") or "{}")
        except Exception:
            raise ValueError("body is not valid JSON")

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        try:
            req = self._body_json()
            if route == "/api/send":
                out = api_send(req.get("to"), req.get("subject", ""),
                               req.get("body", ""), req.get("reply_to"), req.get("from", "ops"))
            elif route in ("/register", "/api/agent/register"):
                out = identity_gate.register(req.get("agent_id"), req.get("thread_id"))
            elif route in ("/seal", "/api/envelope/seal"):
                frm = req.get("from", req.get("agentId"))
                out = {"envelope": identity_gate.seal_request(frm, req.get("to"), req.get("payload", {}), profile=req.get("profile"))}
            elif route in ("/route", "/api/envelope/submit"):
                out = bridge_api.submit(req.get("envelope"))
            elif route == "/api/delivery/open":
                seq = req.get("seq")
                record = next((r for r in bridge_api.records() if r["seq"] == seq and r["kind"] == "verified-envelope"), None)
                if record is None:
                    raise ValueError("verified delivery sequence not found")
                body = json.loads(record["body"])
                identity_gate.verify_receipt(body["receipt"], body["recipient_envelope"])
                out = {"message": identity_gate.open_delivery(body["recipient_envelope"], body["to"])}
            elif route in ("/verify", "/api/envelope/verify"):
                out = identity_gate.verify_request(req.get("envelope"))
            elif route == "/api/wake":
                out = api_wake(req.get("lane"))
            elif route == "/api/ots/stamp":
                out = api_ots_stamp(req.get("envelope_digest"))
            elif route in ("/api/tools/ddrescue", "/api/tools/bulk_extractor"):
                kind = route.rsplit("/", 1)[1]
                args = req.get("args")
                if not isinstance(args, list) or \
                        not all(isinstance(a, str) for a in args):
                    raise ValueError("args must be a list of strings")
                violations = []
                try:
                    violations = forensics.validate(kind, args)
                except Exception as ve:          # contract: raise on violation
                    violations = [str(ve)]
                if violations:
                    raise ValueError("blocked: " + "; ".join(violations))
                out = {"ok": True, "job_id": forensics.submit_job(kind, args),
                       "kind": kind}
            elif route == "/api/cmd":              # SPEC2
                # cmdbridge returns its own refusal dict for a denied or
                # rejected command; only a malformed body is a 400 here.
                out = cmd_run_payload(req.get("command"), req.get("timeout"))
                log_api("cmd %s -> ok=%s rc=%s ms=%s"
                        % (json.dumps(req.get("command"))[:200], out.get("ok"),
                           out.get("rc"), out.get("ms")))
            elif route == "/api/orch":             # SPEC2
                out = orch_dispatch(req)
            elif route == "/api/term/attach":      # task_0013
                out = term_attach(req.get("tty"))
            elif route == "/api/term/send":        # task_0013
                out = term_send(req.get("tty"),
                                req.get("keys", req.get("text")))
            else:
                self._send(404, {"error": "no such route", "route": route})
                return
            self._send(200, out)
        except ValueError as e:
            self._send(400, {"error": str(e)})
        except Exception as e:
            log_api("POST %s ERROR %s" % (route, e))
            self._send(500, {"error": str(e)})


def main():
    srv = ThreadingHTTPServer((BIND_HOST, BIND_PORT), RailHandler)
    log_api("api listening on %s:%d (pid %d)"
            % (BIND_HOST, BIND_PORT, os.getpid()))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        log_api("api stopped")


if __name__ == "__main__":
    main()


