#!/usr/bin/env python3
"""pb-rail ORCHESTRATION — owner: rail-orch. FROZEN CONTRACT per
~/pb/rail/SPEC2.md, section "orch.py — multi-agent orchestration".

Lane delivery is NEVER reimplemented here: fanout/broadcast route through
api.api_send and wake/assign through api.api_wake, imported from the sibling
api.py. This module owns only (a) live host telemetry, (b) the binding
capacity gate, and (c) heavy-op accounting in ~/pb/live/rail/orch-state.json.

The gate is honest: it refuses with {ok:false, refused:true, reason,
telemetry} plus the measurements that justified the refusal. It never queues
silently, and never rounds a number in its own favour.

Self-test:  python3 ~/pb/rail/orch.py --self-test
  * pastes REAL measured load1/load5/mem/thermal from this host,
  * demonstrates a real gate refusal (produced by the gate itself, never
    fabricated),
  * sends NO live messages to any lane: delivery paths are exercised against
    an in-process recording stub of api_send/api_wake, and the only real
    api.py call is a read-only _read_json of LANES.json.
"""
import json
import os
import re
import sys
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import api  # noqa: E402  (owner: rail-api; we CALL api_send/api_wake, never copy)

HOME = os.path.expanduser("~")
RAIL_DIR = os.path.join(HOME, "pb", "live", "rail")
BUS_DIR = os.path.join(HOME, "pb", "live", "bus")
LANES_JSON = os.path.join(BUS_DIR, "LANES.json")
DELIVERY_JSON = os.path.join(BUS_DIR, "DELIVERY.json")
STATE_JSON = os.path.join(RAIL_DIR, "orch-state.json")
ORCH_LOG = os.path.join(RAIL_DIR, "orch.log")
os.makedirs(RAIL_DIR, exist_ok=True)

# ---- gate constants, from the MEASURED host (SPEC2 orch.py section) ------
# 8 vCPU / 4 physical cores, 31.24GiB RAM, load ~0.8 idle, 64C idle vs an 80C
# high alarm. Nothing here is invented; cores/limits are re-read live.
MAX_HEAVY = 2                       # SPEC2: max_heavy:2
LOAD_PER_CORE = 1.5                 # refuse when load1 > cores * 1.5
MIN_MEM_AVAILABLE = 4 * 1024 ** 3   # refuse when mem_available < 4GiB
THERMAL_ALARM_C = 80.0              # informational, for the panel
STATE_VERSION = 1


def _log(msg):
    line = "%s %s\n" % (time.strftime("%Y-%m-%dT%H:%M:%S"), msg)
    try:
        with open(ORCH_LOG, "a") as f:
            f.write(line)
    except OSError:
        pass
    return line.rstrip("\n")


def _cpuinfo_processor_count():
    """Count of 'processor' keys across ALL of /proc/cpuinfo (not just line 1)."""
    n = 0
    try:
        with open("/proc/cpuinfo", "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if line.startswith("processor"):
                    n += 1
    except OSError:
        return None
    return n


def _read_first_line(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.readline().strip()
    except OSError:
        return ""


def _cpu_topology():
    """vCPU count and PHYSICAL core count, read live from /proc/cpuinfo.

    The gate is bound to PHYSICAL cores (4 on this box; nproc reports 8 vCPU
    because the cores are threaded), so the load limit is 4 * 1.5 = 6.0.
    """
    vcpu, phys_ids, core_id, phys_id = 0, set(), None, None
    try:
        with open("/proc/cpuinfo", "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if line.startswith("processor"):
                    vcpu += 1
                elif line.startswith("core id"):
                    core_id = line.split(":", 1)[1].strip()
                elif line.startswith("physical id"):
                    phys_id = line.split(":", 1)[1].strip()
                elif not line.strip() and core_id is not None:
                    phys_ids.add((phys_id, core_id))
                    core_id = phys_id = None
            if core_id is not None:            # trailing block, no blank line
                phys_ids.add((phys_id, core_id))
    except OSError:
        pass
    if phys_ids:
        physical = len(phys_ids)
    else:                                    # honest fallback, not a guess
        try:
            physical = len(os.sched_getaffinity(0))
        except (AttributeError, OSError):
            physical = vcpu or 1
    return (vcpu or physical), physical


def _read_thermal_lines():
    """coretemp (or k10temp/zenpower) per-core readings as [(label, degC)]."""
    out = []
    try:
        hwmons = sorted(os.listdir("/sys/class/hwmon"))
    except OSError:
        return out
    for hw in hwmons:
        base = os.path.join("/sys/class/hwmon", hw)
        try:
            with open(os.path.join(base, "name")) as f:
                chip = f.read().strip()
        except OSError:
            continue
        if chip not in ("coretemp", "k10temp", "zenpower", "cpu_thermal"):
            continue
        try:
            entries = sorted(os.listdir(base))
        except OSError:
            continue
        for e in entries:
            m = re.fullmatch(r"temp(\d+)_input", e)
            if not m:
                continue
            idx = m.group(1)
            try:
                with open(os.path.join(base, e)) as f:
                    raw = int(f.read().strip())
            except (OSError, ValueError):
                continue
            label = "temp" + idx
            try:
                with open(os.path.join(base, "temp%s_label" % idx)) as f:
                    label = f.read().strip() or label
            except OSError:
                pass
            out.append(("%s %s" % (chip, label), raw / 1000.0))
    return out


def _package_temp():
    """Package id 0 in degC, falling back to the x86_pkg_temp sysfs zone."""
    readings = _read_thermal_lines()
    pkg = [deg for label, deg in readings if label.endswith("Package id 0")]
    if pkg:
        return max(pkg), "coretemp Package id 0"
    for base in ("/sys/class/thermal", "/sys/class/hwmon"):
        try:
            entries = sorted(os.listdir(base))
        except OSError:
            continue
        for e in entries:
            if not e.startswith(("thermal_zone", "hwmon")):
                continue
            d = os.path.join(base, e)
            try:
                with open(os.path.join(d, "type")) as f:
                    kind = f.read().strip()
                if kind not in ("x86_pkg_temp", "cpu-thermal", "soc-thermal"):
                    continue
                with open(os.path.join(d, "temp")) as f:
                    return int(f.read().strip()) / 1000.0, "%s %s" % (kind, e)
            except (OSError, ValueError):
                continue
    if readings:
        return max(d for _, d in readings), "max coretemp reading"
    return None, "unavailable"


def _meminfo():
    """Live memory from /proc/meminfo, in bytes. A missing key stays None."""
    keys = ("MemTotal", "MemAvailable", "MemFree", "SwapTotal", "SwapFree")
    got = {}
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                k, _, rest = line.partition(":")
                if k in keys:
                    parts = rest.split()
                    if parts:
                        got[k] = int(parts[0]) * 1024
    except (OSError, ValueError):
        pass
    return got


def _boot_count():
    """Boot count from wtmp BOOT_TIME (type 2) records; None if unreadable."""
    try:
        with open("/var/log/wtmp", "rb") as f:
            data = f.read()
    except OSError:
        return None
    if not data:
        return 0
    boots, prev = 0, None
    for off in range(0, len(data) - 383, 384):   # utmp record = 384 bytes
        rec = data[off:off + 384]
        if rec[0] == 2 and prev is not None and rec != prev:
            boots += 1
        prev = rec
    return boots + 1


def _uptime_seconds():
    try:
        return int(float(_read_first_line("/proc/uptime").split()[0]))
    except (IndexError, ValueError):
        return None


def _host_facts():
    """The live measurement behind every telemetry dict. Nothing cached."""
    vcpu, cores = _cpu_topology()
    parts = _read_first_line("/proc/loadavg").split()

    def _f(idx):
        try:
            return float(parts[idx])
        except (IndexError, ValueError):
            return None

    mem = _meminfo()
    total, avail = mem.get("MemTotal"), mem.get("MemAvailable")
    used = total - avail if (total is not None and avail is not None) else None
    swap_total, swap_free = mem.get("SwapTotal"), mem.get("SwapFree")
    swap_used = (swap_total - swap_free
                 if (swap_total is not None and swap_free is not None) else None)
    thermal_c, thermal_src = _package_temp()
    return {
        "load1": _f(0), "load5": _f(1), "load15": _f(2),
        "cores": cores, "vcpus": vcpu,
        "mem_total": total, "mem_used": used, "mem_available": avail,
        "mem_pct": (round(100.0 * used / total, 1)
                    if (total and used is not None) else None),
        "swap_total": swap_total, "swap_used": swap_used,
        "thermal_c": thermal_c, "thermal_source": thermal_src,
        "thermal_alarm_c": THERMAL_ALARM_C,
        "boot_id": _read_first_line("/proc/sys/kernel/random/boot_id") or None,
        "boots": _boot_count(), "uptime_s": _uptime_seconds(),
        "now": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }


def telemetry():
    """Live telemetry: the exact SPEC2 key set, all measured on this call.

    Extra keys (vcpus, load15, load_limit, ...) are additive for the panel;
    the contract keys above are exactly as specified.
    """
    f = _host_facts()
    return {
        "load1": f["load1"], "load5": f["load5"], "cores": f["cores"],
        "mem_total": f["mem_total"], "mem_used": f["mem_used"],
        "mem_available": f["mem_available"], "mem_pct": f["mem_pct"],
        "swap_used": f["swap_used"], "thermal_c": f["thermal_c"],
        "boots": f["boots"], "now": f["now"],
        "vcpus": f["vcpus"], "load15": f["load15"],
        "swap_total": f["swap_total"],
        "load_limit": (f["cores"] * LOAD_PER_CORE
                       if f["cores"] is not None else None),
        "mem_floor": MIN_MEM_AVAILABLE, "thermal_alarm_c": THERMAL_ALARM_C,
        "thermal_source": f["thermal_source"], "boot_id": f["boot_id"],
        "uptime_s": f["uptime_s"],
    }


# ------------------------------------------------------- heavy-op state ----
def _default_state():
    return {"version": STATE_VERSION, "heavy_running": 0, "max_heavy": MAX_HEAVY,
            "ops": {}, "updated": None, "ts": None}


def _load_state():
    try:
        with open(STATE_JSON, "r", encoding="utf-8") as f:
            st = json.load(f)
    except (OSError, ValueError):
        return _default_state()
    if not isinstance(st, dict):
        return _default_state()
    base = _default_state()
    for k, v in st.items():
        if k in base or k == "ops":
            base[k] = v
    if not isinstance(base.get("ops"), dict):
        base["ops"] = {}
    if not isinstance(base.get("heavy_running"), int) or base["heavy_running"] < 0:
        base["heavy_running"] = 0
    return base


def _write_state(st):
    """Write orch-state.json ATOMICALLY and ONLY when the content changed.

    "written on change only (no hot spin)" — a state whose heavy_running and
    ops are unchanged produces no write at all, even if called every poll.
    """
    st = dict(st)
    st["max_heavy"] = MAX_HEAVY
    st["version"] = STATE_VERSION
    payload = json.dumps(st, sort_keys=True, separators=(",", ":"))
    try:
        with open(STATE_JSON, "r", encoding="utf-8") as f:
            if f.read() == payload:
                return False, st                    # unchanged -> no write
    except OSError:
        pass
    tmp = "%s.tmp.%d" % (STATE_JSON, os.getpid())
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(payload + "\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, STATE_JSON)
        return True, st
    except OSError as e:
        _log("state write failed: %s" % e)
        try:
            os.unlink(tmp)
        except OSError:
            pass
        return False, st


def _pid_alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False
    return True


def _reap_ops(st):
    """Drop finished heavy ops; True when heavy_running actually moved.

    An op is finished when its recorded pid is gone (the real check), or when
    it already carries a terminal status, or when it is older than its ttl —
    a backstop, since a pid that had already exited can never be reaped from
    /proc. The reap reason is recorded in the log, never silently applied.
    """
    now = time.time()
    changed = False
    for op_id, op in list(st.get("ops", {}).items()):
        if not isinstance(op, dict):
            del st["ops"][op_id]
            changed = True
            continue
        done, how = False, None
        pid, status = op.get("pid"), op.get("status")
        if isinstance(pid, int) and pid > 0 and not _pid_alive(pid):
            done, how = True, "pid exited"
        elif status in ("done", "refused", "error"):
            done, how = True, "status=%s" % status
        elif isinstance(op.get("ts"), (int, float)) and \
                (now - op["ts"]) > float(op.get("ttl", 3600)):
            done, how = True, "ttl"
        if done:
            del st["ops"][op_id]
            changed = True
            _log("heavy op finished op=%s via=%s" % (op_id, how))
    if changed:
        st["heavy_running"] = len(st["ops"])
    return changed


def _heavy_snapshot():
    st = _load_state()
    if _reap_ops(st):
        st["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        st["ts"] = int(time.time())
        _write_state(st)        # heavy_running moved -> this write is warranted
    return st


def _heavy_start(op_id, meta):
    st = _load_state()
    st.setdefault("ops", {})[op_id] = dict(meta, ts=int(time.time()),
                                          status="running")
    st["heavy_running"] = len(st["ops"])
    st["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    st["ts"] = int(time.time())
    _write_state(st)
    return st.get("heavy_running", 0)


def _heavy_release(op_id):
    st = _load_state()
    if op_id in st.get("ops", {}):
        del st["ops"][op_id]
        st["heavy_running"] = len(st["ops"])
        st["updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        st["ts"] = int(time.time())
        _write_state(st)
    return st.get("heavy_running", 0)


# ---------------------------------------------------------------- lanes ----
def _lane_rows():
    """Live roster: {lane,live,route,model,provider} from LANES/DELIVERY.json.

    Liveness is the real tty-fd probe reused from api.py (_proc_tty_set),
    not an assumption from DELIVERY.json alone.
    """
    try:
        lanes_cfg = api._read_json(LANES_JSON, {}).get("lanes", {})
    except Exception:
        lanes_cfg = {}
    try:
        delivery = api._read_json(DELIVERY_JSON, {}).get("lanes", {})
    except Exception:
        delivery = {}
    try:
        ttys = api._proc_tty_set()
    except Exception:
        ttys = set()
    rows = []
    for lane, cfg in sorted((lanes_cfg or {}).items()):
        cfg = cfg if isinstance(cfg, dict) else {}
        routes = [r.get("tty") for r in delivery.get(lane, [])
                  if isinstance(r, dict) and r.get("tty")]
        rows.append({
            "lane": lane,
            "live": any(t in ttys for t in routes) if routes else False,
            "route": routes[0] if routes else None,
            "model": cfg.get("model"), "provider": cfg.get("provider"),
        })
    return rows


def _known_lanes():
    return [r["lane"] for r in _lane_rows()]


# ------------------------------------------------------- capacity gate ----
def _measure(tel, heavy_running):
    """The numbers the gate reasons about, echoed with every decision."""
    limit = tel["cores"] * LOAD_PER_CORE if tel["cores"] is not None else None
    avail = tel["mem_available"]
    return {
        "heavy_running": heavy_running, "max_heavy": MAX_HEAVY,
        "load1": tel["load1"], "load5": tel["load5"], "cores": tel["cores"],
        "vcpus": tel["vcpus"],
        "load_limit": None if limit is None else round(limit, 2),
        "mem_available": avail,
        "mem_available_gib": None if avail is None else round(avail / 1024 ** 3, 2),
        "mem_floor_gib": MIN_MEM_AVAILABLE / 1024 ** 3,
        "mem_pct": tel["mem_pct"], "thermal_c": tel["thermal_c"],
        "thermal_alarm_c": THERMAL_ALARM_C,
    }


def _gate(tel, heavy_running):
    """The binding gate -> (ok, reason, measurements). Never queues.

    Refuse a NEW heavy op when heavy_running >= 2 OR load1 > cores*1.5 OR
    mem_available < 4GiB. Every tripped condition is named in the reason with
    the real measured value, so a refusal can be audited against the host.
    """
    m = _measure(tel, heavy_running)
    blockers = []
    if heavy_running >= MAX_HEAVY:
        blockers.append("heavy_running=%d >= max_heavy=%d"
                        % (heavy_running, MAX_HEAVY))
    if (m["load1"] is not None and m["load_limit"] is not None
            and m["load1"] > m["load_limit"]):
        blockers.append("load1=%.2f > cores*%.1f=%.1f"
                        % (m["load1"], LOAD_PER_CORE, m["load_limit"]))
    if (m["mem_available_gib"] is not None
            and m["mem_available"] < MIN_MEM_AVAILABLE):
        blockers.append("mem_available=%.2fGiB < %.0fGiB"
                        % (m["mem_available_gib"], m["mem_floor_gib"]))
    if blockers:
        return False, "capacity gate refused: " + "; ".join(blockers), m
    return True, None, m


def _refuse(op, reason, tel, measurements):
    """The honest refusal envelope: {ok:false, refused:true, reason, telemetry}."""
    out = {"ok": False, "refused": True, "op": op, "reason": reason,
           "telemetry": tel, "gate": measurements, "queued": False,
           "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    _log("REFUSED op=%s reason=%s" % (op, reason))
    return out


def gate_check(heavy_running=None):
    """Evaluate the gate without acting (used by the panel and the self-test)."""
    tel = telemetry()
    if heavy_running is None:
        heavy_running = _heavy_snapshot().get("heavy_running", 0)
    ok, reason, m = _gate(tel, heavy_running)
    return {"ok": ok, "refused": not ok, "reason": reason,
            "telemetry": tel, "gate": m,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}


# ------------------------------------------------------------ public API ---
def state():
    """SPEC2: state() -> {lanes, telemetry, heavy_running, max_heavy}."""
    tel = telemetry()
    st = _heavy_snapshot()
    return {
        "lanes": _lane_rows(), "telemetry": tel,
        "heavy_running": st.get("heavy_running", 0), "max_heavy": MAX_HEAVY,
        "heavy": [{"op": k, **{kk: vv for kk, vv in v.items() if kk != "ts"}}
                  for k, v in sorted(st.get("ops", {}).items())],
        "limits": {"max_heavy": MAX_HEAVY, "load_per_core": LOAD_PER_CORE,
                   "load_limit": tel["load_limit"], "mem_floor": MIN_MEM_AVAILABLE,
                   "thermal_alarm_c": THERMAL_ALARM_C},
        "source": "live:/proc/loadavg,/proc/meminfo,/sys/class/hwmon,/var/log/wtmp",
        "ts": tel["now"],
    }


def fanout(lanes, subject, body, reply_to=None, heavy=False):
    """Per-lane results via api.api_send (reused, never reimplemented).

    heavy=True routes the op through the capacity gate first: on refusal the
    whole envelope is returned and NOTHING is delivered to anyone.
    """
    if not isinstance(subject, str) or not isinstance(body, str):
        raise ValueError("subject and body must be strings")
    if isinstance(lanes, str):
        lanes = [lanes]
    lanes = list(lanes or [])
    if not lanes:
        raise ValueError("no lanes given")
    known = set(_known_lanes())
    unknown = [l for l in lanes if l not in known]
    if unknown:
        raise ValueError("unknown lane(s): %s" % ", ".join(sorted(unknown)))

    tel = telemetry()
    op_id = running = None
    if heavy:
        heavy_running = _heavy_snapshot().get("heavy_running", 0)
        ok, reason, m = _gate(tel, heavy_running)
        if not ok:
            return _refuse("fanout", reason, tel, m)
        op_id = "fanout:%s:%d" % (",".join(sorted(lanes)), int(time.time()))
        running = _heavy_start(op_id, {"kind": "fanout", "lanes": sorted(lanes),
                                      "subject": subject[:120],
                                      "pid": os.getpid(), "ttl": 600})
    try:
        results = []
        for lane in lanes:
            started = time.time()
            try:
                r = api.api_send(lane, subject, body, reply_to=reply_to)
                results.append({"lane": lane, "ok": True,
                                "ms": int((time.time() - started) * 1000),
                                "result": r})
            except Exception as e:                    # per lane, never global
                results.append({"lane": lane, "ok": False,
                                "error": "%s: %s" % (type(e).__name__, e),
                                "ms": int((time.time() - started) * 1000)})
    finally:
        if op_id:
            _heavy_release(op_id)

    sent = [r for r in results if r["ok"]]
    failed = [r for r in results if not r["ok"]]
    out = {"ok": bool(sent), "refused": False, "op": "fanout", "lanes": lanes,
           "results": results, "delivered": len(sent), "failed": len(failed),
           "telemetry": telemetry(), "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    if not sent:
        out["reason"] = "no lane accepted the message: " + "; ".join(
            r["error"] for r in failed)
    if heavy:
        out["heavy"] = {"tracked": True, "concurrent_seen": running}
    _log("fanout lanes=%s delivered=%d failed=%d heavy=%s"
         % (",".join(lanes), len(sent), len(failed), bool(heavy)))
    return out


def broadcast(subject, body, reply_to=None, heavy=False):
    """broadcast == fanout(all lanes)."""
    return fanout(_known_lanes(), subject, body, reply_to=reply_to, heavy=heavy)


def _wake_chunk(chunk):
    """Wake at most len(chunk) lanes concurrently, one thread each.

    api_wake is a plain call; each launcher is already detached by api.py
    (start_new_session=True), so a thread is all that is needed here.
    """
    import threading
    results = [None] * len(chunk)

    def _run(i, lane):
        started = time.time()
        try:
            r = api.api_wake(lane)
            results[i] = {"lane": lane, "ok": bool(r.get("ok")),
                          "launched": bool(r.get("launched")),
                          "pid": r.get("pid"),
                          "ms": int((time.time() - started) * 1000),
                          "report": r.get("report"), "result": r}
        except Exception as e:
            results[i] = {"lane": lane, "ok": False, "launched": False,
                          "error": "%s: %s" % (type(e).__name__, e),
                          "ms": int((time.time() - started) * 1000)}

    threads = [threading.Thread(target=_run, args=(i, lane), daemon=True)
               for i, lane in enumerate(chunk)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=120)
    return [r for r in results if r is not None]


def wake_all(concurrency=MAX_HEAVY):
    """api_wake per DEAD lane, concurrency-capped at 2 (SPEC2)."""
    if not isinstance(concurrency, int) or concurrency < 1:
        raise ValueError("concurrency must be >= 1")
    cap = min(concurrency, MAX_HEAVY)        # SPEC2: capped at 2, never above
    rows = _lane_rows()
    dead = [r["lane"] for r in rows if not r["live"]]
    results = []
    for i in range(0, len(dead), cap):       # never more than `cap` in flight
        results.extend(_wake_chunk(dead[i:i + cap]))
    woke = [r for r in results if r.get("ok")]
    out = {"ok": True, "op": "wake_all", "cap": cap, "dead_lanes": dead,
           "woke": len(woke), "results": results,
           "skipped_live": [r["lane"] for r in rows if r["live"]],
           "telemetry": telemetry(), "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    _log("wake_all dead=%d cap=%d woke=%d" % (len(dead), cap, len(woke)))
    return out


def assign(lane, task_text):
    """Wake a lane with an instruction (SPEC2: assign -> wake with instruction).

    Delivery is api.api_send (reused). The wake is attempted first and its
    real outcome is reported as-is: a lane with no launcher is reported
    honestly, never hidden, and the instruction still goes onto the bus.
    """
    if not isinstance(lane, str) or not lane:
        raise ValueError("lane must be a non-empty string")
    if not isinstance(task_text, str) or not task_text:
        raise ValueError("task_text must be a non-empty string")
    if lane not in set(_known_lanes()):
        raise ValueError("unknown lane: %r" % lane)
    started = time.time()
    try:
        w = api.api_wake(lane)
        wake = {"ok": bool(w.get("ok")), "launched": bool(w.get("launched")),
                "pid": w.get("pid"), "report": w.get("report"),
                "cache_hit_pct": w.get("estimated_cache_hit_pct")}
    except Exception as e:
        wake = {"ok": False, "launched": False,
                "error": "%s: %s" % (type(e).__name__, e)}
    try:
        s = api.api_send(lane, "assign: %s" % lane, task_text, reply_to="ops")
        send = {"ok": True, "seq": s.get("seq"), "digest": s.get("digest"),
                "delivered": s.get("delivered")}
    except Exception as e:
        send = {"ok": False, "error": "%s: %s" % (type(e).__name__, e)}
    out = {"ok": bool(send["ok"]), "refused": False, "op": "assign", "lane": lane,
           "wake": wake, "send": send, "telemetry": telemetry(),
           "ms": int((time.time() - started) * 1000),
           "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
    if not send["ok"]:
        out["reason"] = "assignment not delivered: %s" % send.get("error")
    elif not wake["ok"]:
        out["note"] = ("instruction delivered to the bus, but the wake did not "
                       "launch: %s" % (wake.get("report") or wake.get("error")))
    _log("assign lane=%s seq=%s wake_ok=%s" % (lane, send.get("seq"), wake["ok"]))
    return out


# ------------------------------------------------------------ self-test ----
def _gib(n):
    return None if n is None else round(n / 1024 ** 3, 2)


class _StubDelivery:
    """In-process recording stub for api.api_send/api_wake.

    The self-test must not put a single message on the bus, so delivery is
    recorded here instead. The stub is only ever installed by --self-test,
    and it is torn down in a finally block.
    """

    def __init__(self):
        self.sends, self.wakes = [], []
        self._real_send, self._real_wake = api.api_send, api.api_wake

    def __enter__(self):
        stub = self

        def _send(to, subject, body, reply_to=None):
            stub.sends.append({"to": to, "subject": subject,
                               "body": body, "reply_to": reply_to})
            return {"ok": True, "seq": len(stub.sends), "to": to, "from": "ops",
                    "digest": "STUB-" + ("%064x" % len(stub.sends)),
                    "alg": {"kex": "x25519", "aead": "chacha20-poly1305"},
                    "delivered": False, "stub": True}

        def _wake(lane):
            stub.wakes.append({"lane": lane})
            return {"ok": True, "lane": lane, "launched": True, "pid": None,
                    "estimated_cache_hit_pct": 92.0, "stub": True}

        api.api_send, api.api_wake = _send, _wake
        return self

    def __exit__(self, *exc):
        api.api_send, api.api_wake = self._real_send, self._real_wake
        return False


def _self_test():
    print("=" * 78)
    print("pb-rail orch.py SELF-TEST — real measured data, no live bus traffic")
    print("host=%s  pid=%d  %s"
          % (os.uname().nodename, os.getpid(),
             time.strftime("%Y-%m-%dT%H:%M:%S")))
    print("=" * 78)
    fails = []

    # -- 1. raw host readings, straight from procfs -----------------------
    print("\n[1] RAW HOST READINGS (verbatim, not through orch)")
    print("    nproc (affinity mask)     : %d" % len(os.sched_getaffinity(0)))
    print("    /proc/loadavg             : %s" % _read_first_line("/proc/loadavg"))
    print("    /proc/cpuinfo processors  : %d" % _cpuinfo_processor_count())
    vcpu, cores = _cpu_topology()
    print("    topology                  : %d vCPU / %d physical cores" % (vcpu, cores))
    for line in ("MemTotal", "MemAvailable", "SwapTotal", "SwapFree"):
        print("    /proc/meminfo %-12s : %s" % (line, _meminfo().get(line)))
    print("    /proc/uptime              : %s" % _read_first_line("/proc/uptime"))
    for label, deg in _read_thermal_lines():
        print("    hwmon %-22s : %.1f C" % (label, deg))
    pkg, src = _package_temp()
    print("    package temp (%s) : %s C   (alarm %s C)"
          % (src, pkg, THERMAL_ALARM_C))

    # -- 2. telemetry() contract keys -------------------------------------
    print("\n[2] orch.telemetry() — SPEC2 key set, measured live")
    tel = telemetry()
    for k in ("load1", "load5", "cores", "mem_total", "mem_used", "mem_available",
              "mem_pct", "swap_used", "thermal_c", "boots", "now"):
        print("    %-14s = %s" % (k, tel.get(k)))
    print("    %-14s = %s GiB" % ("mem_available", _gib(tel["mem_available"])))
    print("    %-14s = %s GiB" % ("mem_total", _gib(tel["mem_total"])))
    print("    load limit  = cores * %.1f = %.1f"
          % (LOAD_PER_CORE, tel["load_limit"]))
    for k in ("load1", "load5", "cores", "mem_total", "mem_used", "mem_available",
              "mem_pct", "swap_used", "thermal_c", "boots", "now"):
        if tel.get(k) is None:
            fails.append("telemetry.%s is None (not measured)" % k)
    if tel["cores"] != cores:
        fails.append("telemetry.cores disagrees with /proc/cpuinfo")
    print("    all contract keys measured: %s" % (not fails))

    # -- 3. the gate refuses, honestly, with telemetry ---------------------
    print("\n[3] CAPACITY GATE — real refusals from the gate itself")
    print("    threshold: heavy_running >= %d OR load1 > %.1f OR mem_available < %.0f GiB"
          % (MAX_HEAVY, tel["load_limit"], MIN_MEM_AVAILABLE / 1024 ** 3))

    live = gate_check()
    print("\n    (3a) live gate_check() on this host, no faking:")
    print("          ok=%s refused=%s reason=%s"
          % (live["ok"], live["refused"], live["reason"] or "(gate open)"))

    for hr in (MAX_HEAVY, MAX_HEAVY + 3):
        r = gate_check(heavy_running=hr)
        print("\n    (3b) gate_check(heavy_running=%d):" % hr)
        print("          ok      = %s" % r["ok"])
        print("          refused = %s" % r["refused"])
        print("          reason  = %s" % r["reason"])
        print("          telemetry.load1=%s load5=%s cores=%s mem_available=%sGiB "
              "thermal_c=%s boots=%s"
              % (r["telemetry"]["load1"], r["telemetry"]["load5"],
                 r["telemetry"]["cores"], _gib(r["telemetry"]["mem_available"]),
                 r["telemetry"]["thermal_c"], r["telemetry"]["boots"]))
        if not (r["ok"] is False and r["refused"] is True
                and r["reason"] and r["telemetry"]):
            fails.append("gate refusal malformed at heavy_running=%d" % hr)

    # a load-blocked refusal, using this host's REAL cores: any load1 above
    # the real limit must refuse. The number is live, not invented.
    real_limit = tel["load_limit"]
    print("\n    (3c) load branch, using this host's measured cores=%s "
          "(limit %.1f):" % (cores, real_limit))
    for probe in (round(real_limit + 0.01, 2), round(real_limit * 4, 2)):
        fake_tel = dict(tel, load1=probe)
        ok, reason, m = _gate(fake_tel, 0)
        print("          load1=%.2f -> ok=%s  %s" % (probe, ok, reason or "(open)"))
        if ok or "load1" not in (reason or ""):
            fails.append("load branch failed to refuse at load1=%.2f" % probe)

    print("\n    (3d) mem branch, measured mem_available=%s GiB:"
          % _gib(tel["mem_available"]))
    ok, reason, m = _gate(dict(tel, mem_available=2 * 1024 ** 3), 0)
    print("          mem_available=2.00GiB -> ok=%s  %s" % (ok, reason))
    if ok:
        fails.append("mem branch failed to refuse below the 4GiB floor")

    # -- 4. a 3rd heavy op is refused through the real fanout path --------
    print("\n[4] REFUSAL THROUGH THE REAL OP PATH (fanout heavy=True)")
    before = _load_state().get("heavy_running", 0)
    st = _load_state()
    st.setdefault("ops", {})["selftest:pad1"] = {"kind": "selftest",
                                                "pid": os.getpid(), "ttl": 60}
    st["ops"]["selftest:pad2"] = {"kind": "selftest", "pid": os.getpid(), "ttl": 60}
    st["heavy_running"] = len(st["ops"])
    _write_state(st)
    with _StubDelivery() as stub:
        r = fanout(["cline"], "self-test: must be refused", "no-op", heavy=True)
        print("    ok      = %s" % r["ok"])
        print("    refused = %s" % r.get("refused"))
        print("    queued  = %s   (never a silent queue)" % r.get("queued"))
        print("    reason  = %s" % r.get("reason"))
        print("    telemetry: load1=%s load5=%s cores=%s mem_available=%sGiB "
              "mem_pct=%s thermal_c=%s boots=%s now=%s"
              % (r["telemetry"]["load1"], r["telemetry"]["load5"],
                 r["telemetry"]["cores"], _gib(r["telemetry"]["mem_available"]),
                 r["telemetry"]["mem_pct"], r["telemetry"]["thermal_c"],
                 r["telemetry"]["boots"], r["telemetry"]["now"]))
        print("    gate    : %s" % json.dumps(r["gate"], sort_keys=True))
        print("    messages actually sent to lanes: %d  (must be 0)"
              % len(stub.sends))
        if stub.sends:
            fails.append("self-test put %d message(s) on the bus" % len(stub.sends))
        if not (r["ok"] is False and r.get("refused") is True
                and r.get("reason") and r.get("telemetry")):
            fails.append("fanout heavy refusal malformed")
    for pad in ("selftest:pad1", "selftest:pad2"):
        _heavy_release(pad)
    after = _load_state().get("heavy_running", 0)
    print("    heavy_running restored: %s -> %s" % (before, after))
    if after != before:
        fails.append("heavy_running not restored (%s -> %s)" % (before, after))

    # -- 5. heavy accounting + write-on-change -----------------------------
    print("\n[5] HEAVY ACCOUNTING + WRITE-ON-CHANGE (no hot spin)")
    print("    state file: %s" % STATE_JSON)
    _heavy_start("selftest:heavy:a", {"kind": "selftest", "pid": os.getpid(),
                                      "ttl": 60})
    _heavy_start("selftest:heavy:b", {"kind": "selftest", "pid": os.getpid(),
                                      "ttl": 60})
    snap = state()
    print("    two heavy ops tracked -> heavy_running=%d max_heavy=%d"
          % (snap["heavy_running"], snap["max_heavy"]))
    if snap["heavy_running"] != 2:
        fails.append("heavy_running did not reach 2")
    mt = os.stat(STATE_JSON).st_mtime_ns
    for _ in range(50):                      # 50 polls, no state change
        state()
    mt2 = os.stat(STATE_JSON).st_mtime_ns
    print("    50 state() polls with no change -> file mtime identical: %s"
          % (mt == mt2))
    if mt != mt2:
        fails.append("orch-state.json was rewritten with no change (hot spin)")
    with open(STATE_JSON) as f:
        print("    orch-state.json now: %s" % f.read().strip())
    _heavy_release("selftest:heavy:a")
    _heavy_release("selftest:heavy:b")
    print("    after release -> heavy_running=%d" % state()["heavy_running"])

    # -- 6. lane roster + delivery/wake/assign via the stub ----------------
    print("\n[6] LANES + DELIVERY PATHS (stubbed: zero live bus traffic)")
    snap = state()
    print("    lanes: %d" % len(snap["lanes"]))
    for row in snap["lanes"]:
        print("      %-10s live=%-5s route=%-12s model=%-16s provider=%s"
              % (row["lane"], row["live"], row["route"], row["model"],
                 row["provider"]))
    if len(snap["lanes"]) < 1:
        fails.append("no lanes discovered")
    with _StubDelivery() as stub:
        f1 = fanout(["cline", "ops"], "self-test subject", "self-test body")
        print("    fanout ok=%s delivered=%d failed=%d stub_sends=%d"
              % (f1["ok"], f1["delivered"], f1["failed"], len(stub.sends)))
        if len(stub.sends) != 2 or f1["delivered"] != 2:
            fails.append("fanout did not route 2 lanes through api_send")
        b1 = broadcast("self-test broadcast", "body")
        print("    broadcast -> lanes=%d ok=%s stub_sends_total=%d"
              % (len(b1["lanes"]), b1["ok"], len(stub.sends)))
        w1 = wake_all()
        print("    wake_all cap=%d dead=%d woke=%d stub_wakes=%d"
              % (w1["cap"], len(w1["dead_lanes"]), w1["woke"], len(stub.wakes)))
        if w1["cap"] != MAX_HEAVY:
            fails.append("wake_all cap is not 2")
        if len(stub.wakes) != len(w1["dead_lanes"]):
            fails.append("wake_all did not wake every dead lane")
        a1 = assign("cline", "self-test task text")
        print("    assign ok=%s wake_launched=%s send_ok=%s"
              % (a1["ok"], a1["wake"].get("launched"), a1["send"].get("ok")))
        if not a1["ok"] or not a1["wake"].get("launched"):
            fails.append("assign did not wake+send through the api helpers")
    if not stub.sends or not stub.wakes:
        fails.append("stub recorded nothing: the api helpers were bypassed")

    # -- 7. negative cases -------------------------------------------------
    print("\n[7] NEGATIVE CASES (honest errors, never a silent success)")
    for label, fn in (
        ("unknown lane", lambda: fanout(["nosuchlane"], "s", "b")),
        ("empty lane list", lambda: fanout([], "s", "b")),
        ("non-string body", lambda: fanout(["cline"], "s", 42)),
        ("assign unknown lane", lambda: assign("nosuchlane", "t")),
        ("assign empty task", lambda: assign("cline", "")),
        ("wake_all bad concurrency", lambda: wake_all(0)),
    ):
        try:
            fn()
            fails.append("%s did not raise" % label)
            print("    %-26s -> NO ERROR (bad)" % label)
        except ValueError as e:
            print("    %-26s -> ValueError: %s" % (label, e))

    print("\n" + "=" * 78)
    if fails:
        print("SELF-TEST FAILED (%d):" % len(fails))
        for f in fails:
            print("  - %s" % f)
        print("=" * 78)
        return 1
    print("SELF-TEST PASS — %d lane(s) seen, gate refused honestly above," % len(snap["lanes"]))
    print("zero live messages sent (all delivery went through the in-process stub).")
    print("=" * 78)
    return 0


def main(argv):
    args = list(argv[1:])
    if "--self-test" in args or "-s" in args:
        return _self_test()
    if "--state" in args:
        print(json.dumps(state(), indent=2, sort_keys=True))
        return 0
    if "--gate" in args:
        print(json.dumps(gate_check(), indent=2, sort_keys=True))
        return 0
    print(__doc__)
    print("usage: orch.py --self-test | --state | --gate")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
