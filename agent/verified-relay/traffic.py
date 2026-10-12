"""pb-rail live traffic - merge() over the four real traffic sources.

Owner: rail-traffic.  Contract: SPEC2.md section "traffic.py".

Every source is re-read live on every call.  Nothing is cached, nothing is
synthesised, and no placeholder row is ever produced: a source that cannot be
read is reported as such through source_status rather than faked.

  bus        ~/pb/live/bus/messages.ndjson       kind=<bus kind>, dir=lane->lane
  deliver    ~/pb/live/deliver.log                dir=rail->lane
  api        ~/pb/live/rail/api.log              dir=ops->rail
  transcript ~/.cline/data/sessions/*/*.messages.json
             newest 25 dirs by mtime; last user message + last assistant
             text, 400 chars each, HTML-unescaped.

Hard 3s budget: the transcript scan runs in a worker thread and is abandoned at
the deadline, leaving an honest partial result with
source_status {"transcript": "timeout"}.
"""

import glob
import html
import json
import os
import re
import sys
import threading
import time
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
BUS_FILE = os.path.join(HOME, "pb/live/bus/messages.ndjson")
DELIVER_LOG = os.path.join(HOME, "pb/live/deliver.log")
API_LOG = os.path.join(HOME, "pb/live/rail/api.log")
SESSION_GLOB = os.path.join(HOME, ".cline/data/sessions/*/*.messages.json")

BUDGET_S = 3.0            # hard wall for the whole merge
TRANSCRIPT_SLACK_S = 0.5  # keep this much room to return
TRANSCRIPT_DIRS = 25      # newest 25 session dirs by mtime
TRANSCRIPT_CHARS = 400    # per extracted message
BUS_KINDS = {"msg", "rail", "register", "ack", "reply", "handoff", "result"}
MAX_LINE_CHARS = 1200
TAIL_BYTES = 1 << 20      # read at most the last 1MiB of a line-oriented log

_ISO_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6})\d*)?"
    r"(Z|[+-]\d{2}:?\d{2})?$")
_TS_LINE_RE = re.compile(
    r"(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)")
_TS_AFTER_RE = re.compile(r"ts[\"']?\s*[:=]\s*[\"']?(\d{10,13}(?:\.\d+)?)")
_EPOCH_RE = re.compile(r"^(\d{10})(?:\.(\d{1,9}))?$")
_SEQ_RE = re.compile(r"\bseq (\d+)\b")
_UNWRAP_RE = re.compile(r"<user_input[^>]*>(.*?)</user_input>", re.S | re.I)
_RELAY_RE = re.compile(r"\[LANE-BUS[^\]]*\]")
_LANE_RE = re.compile(r"\((?:lane|to) ([A-Za-z0-9_.-]+)\)")
_WS_RE = re.compile(r"\s+")
_STATUS_LOCK = threading.Lock()
_LAST_STATUS = {}


# ---------------------------------------------------------------- primitives

def now_iso():
    """Current wall clock, UTC, millisecond precision, Z-suffixed."""
    return (datetime.now(timezone.utc).isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"))


def normalize_ts(raw):
    """Accept ISO-8601, epoch seconds or epoch millis; emit ISO Z.

    Returns (iso_string, sort_key) or (None, None) when nothing parses.
    A bare int of 11+ digits is millis, which is the shape the transcript
    files actually use.
    """
    if raw is None:
        return (None, None)
    if isinstance(raw, (int, float)) and not isinstance(raw, bool):
        value = float(raw)
        if abs(value) >= 1e11:      # epoch millis
            value /= 1000.0
        elif abs(value) >= 1e12:    # epoch micros
            value /= 1e6
        try:
            dt = datetime.fromtimestamp(value, timezone.utc)
        except (OverflowError, OSError, ValueError):
            return (None, None)
        return (dt.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
                dt.timestamp())
    text = str(raw).strip()
    if not text:
        return (None, None)
    match = _ISO_RE.match(text)
    if match:
        date, clock, frac, offset = match.groups()
        norm = "%sT%s.%s" % (date, clock, (frac or "0").ljust(6, "0")[:6])
        if offset and offset not in ("Z", "z"):
            digits = offset.replace(":", "")
            norm += "%s%02d:%02d" % (digits[0], int(digits[1:3]), int(digits[3:5]))
        else:
            norm += "+00:00"
        try:
            dt = datetime.fromisoformat(norm)
        except ValueError:
            return (None, None)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
        return (dt.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
                dt.timestamp())
    if _EPOCH_RE.match(text):
        return normalize_ts(float(text))
    return (None, None)


def _clip(text, limit):
    if text is None:
        return ""
    text = _WS_RE.sub(" ", str(text)).strip()
    return text[:limit] if len(text) > limit else text


def _mtime_iso(path):
    try:
        return normalize_ts(os.stat(path).st_mtime)[0]
    except OSError:
        return None


def _row(ts, sort_key, source, lane, kind, direction, text, seq=None, note=None):
    row = {"ts": ts, "source": source, "lane": lane, "kind": kind,
           "dir": direction, "text": text}
    if seq is not None:
        row["seq"] = seq
    if note is not None:
        row["mtime"] = note
    row["_k"] = sort_key if sort_key is not None else 0.0
    return row



def _read_tail_lines(path):
    """Last TAIL_BYTES of a text file as lines (oldest first), or None."""
    try:
        with open(path, "rb") as handle:
            try:
                handle.seek(-TAIL_BYTES, os.SEEK_END)
            except OSError:
                handle.seek(0)
            data = handle.read()
    except OSError:
        return None
    if not data:
        return []
    clipped = len(data) == TAIL_BYTES
    if clipped:
        data = data.split(b"\n", 1)[-1]
    text = data.decode("utf-8", "replace")
    lines = text.splitlines()
    if text.endswith("\n") and lines:
        lines.pop()
    if clipped and lines and not text[:1] == "\n":
        lines.pop(0)  # the first line is a partial fragment
    return lines


def _session_files_newest(count):
    """Newest `count` session dirs by mtime, each expanded to its message file."""
    parent = os.path.dirname(os.path.dirname(SESSION_GLOB))  # strip * / *.json
    picked = []
    try:
        entries = list(os.scandir(parent))
    except OSError:
        return picked
    for entry in entries:
        try:
            if not entry.is_dir():
                continue
            picked.append((entry.stat().st_mtime, entry.path))
        except OSError:
            continue
    picked.sort(key=lambda item: (item[0], item[1]), reverse=True)
    out = []
    for mtime, dpath in picked[:count]:
        for fpath in sorted(glob.glob(os.path.join(dpath, "*.messages.json"))):
            out.append((mtime, fpath))
    return out


def _text_of(content):
    """Flatten a content string or list-of-parts into plain text."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        content = [content]
    if not isinstance(content, (list, tuple)):
        return str(content)
    parts = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict):
            text = block.get("text")
            if text is None:
                text = block.get("content")
            if isinstance(text, (list, tuple)):
                parts.extend(t for t in text if isinstance(t, str))
            elif text is not None:
                parts.append(str(text))
    return "\n".join(parts)


# ------------------------------------------------------------------- sources

def _bus_rows():
    """~/pb/live/bus/messages.ndjson -> rows, kind=bus kind, dir=lane->lane."""
    try:
        with open(BUS_FILE, "rb") as handle:
            try:
                handle.seek(-TAIL_BYTES, os.SEEK_END)
            except OSError:
                handle.seek(0)
            blob = handle.read()
    except OSError as exc:
        return [], "error:%s" % (getattr(exc, "strerror", None) or "unreadable")
    if not blob:
        return [], "empty"
    if len(blob) == TAIL_BYTES:
        blob = blob.split(b"\n", 1)[-1]
    rows = []
    bad = 0
    for line in blob.decode("utf-8", "replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except ValueError:
            bad += 1
            continue
        if not isinstance(rec, dict):
            bad += 1
            continue
        kind = str(rec.get("kind") or "msg")
        seq = rec.get("seq")
        subject = html.unescape(str(rec.get("subject") or "")).strip()
        if kind == "msg":
            body = rec.get("body")
            if not isinstance(body, str):
                try:
                    body = json.dumps(body, separators=(",", ":"))
                except (TypeError, ValueError):
                    body = str(body)
            body = html.unescape(body).strip()
            text = " - ".join(p for p in (subject, body) if p) or "(no body)"
        else:
            text = subject or "(no subject)"
        ts, key = normalize_ts(rec.get("ts"))
        if ts is None:
            ts, key = normalize_ts(seq)
        lane = str(rec.get("src") or "").strip() or "bus"
        rows.append(_row(ts, key, "bus", lane, kind, "lane->lane",
                          _clip(text, MAX_LINE_CHARS),
                          seq if isinstance(seq, int) else None))
    if rows:
        return rows, "ok"
    return rows, ("no_valid_records" if bad else "empty")


def _log_rows(path, source, lane, direction, kind):
    """A line-oriented log -> rows, ts taken from the line itself."""
    if not os.path.exists(path):
        return [], "error:missing"
    lines = _read_tail_lines(path)
    if lines is None:
        return [], "error:unreadable"
    file_ts = None
    file_key = 0.0
    prev_ts = None
    prev_key = 0.0
    rows = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        match = _TS_LINE_RE.match(line)
        if match:
            ts, key = normalize_ts(match.group(1))
        else:
            found = _TS_AFTER_RE.search(line)
            if found:
                ts, key = normalize_ts(found.group(1))
            else:
                ts, key = None, None
        if ts is None:
            # A continuation of the previous record (traceback / stack frame):
            # it belongs to that record, and must not become a row of its own.
            if rows:
                joined = rows[-1]["text"]
                if len(joined) < MAX_LINE_CHARS:
                    rows[-1]["text"] = _clip(joined + " | " + html.unescape(line),
                                            MAX_LINE_CHARS)
                continue
            if file_ts is None:
                file_ts = _mtime_iso(path)
                try:
                    file_key = os.stat(path).st_mtime
                except OSError:
                    file_key = 0.0
            ts, key = file_ts, file_key
        if ts is None:
            continue
        prev_ts, prev_key = ts, key
        seq = None
        found = _SEQ_RE.search(line)
        if found:
            seq = int(found.group(1))
        kind_out = kind
        if source == "deliver":
            low = line.lower()
            for pattern, name in (("ingested", "ingested"), ("delivered", "delivered"),
                                  ("route status", "route"), ("dropped", "dropped"),
                                  ("queued", "queued")):
                if pattern in low:
                    kind_out = name
                    break
        lane_out = lane
        found = _LANE_RE.search(line)
        if found:
            lane_out = found.group(1)
        rows.append(_row(ts, key, source, lane_out, kind_out, direction,
                          _clip(html.unescape(line), MAX_LINE_CHARS), seq))
    return rows, ("ok" if rows else "empty")


def _transcript_rows():
    """Newest 25 session dirs by mtime -> last user + last assistant text."""
    rows = []
    scanned = 0
    for dir_mtime, path in _session_files_newest(TRANSCRIPT_DIRS):
        try:
            with open(path, "rb") as handle:
                raw = handle.read()
        except OSError:
            continue
        try:
            data = json.loads(raw.decode("utf-8", "replace"))
        except ValueError:
            continue
        if isinstance(data, dict):
            messages = data.get("messages")
        elif isinstance(data, list):
            messages = data
        else:
            messages = None
        if not isinstance(messages, list):
            continue
        stem = os.path.basename(path)[:-len(".messages.json")]
        lane = stem.split("__")[0] or "cline"
        last_user = None
        last_assistant = None
        for message in messages:
            if not isinstance(message, dict):
                continue
            role = str(message.get("role") or "").lower()
            if role == "user" and last_user is None:
                last_user = message
            elif role == "assistant" and last_assistant is None:
                # an assistant turn of pure thinking/tool_use carries no text
                if _text_of(message.get("content")).strip():
                    last_assistant = message
            if last_user is not None and last_assistant is not None:
                break
        if last_user is None and last_assistant is None:
            continue
        scanned += 1
        for kind, message in (("user", last_user), ("assistant", last_assistant)):
            if message is None:
                continue
            body = html.unescape(_text_of(message.get("content"))).strip()
            body = _UNWRAP_RE.sub(r"\1", body)
            body = _RELAY_RE.sub("[LANE-BUS relay]", body)
            if not body.strip():
                body = "(%s message with no text)" % kind
            ts, key = normalize_ts(message.get("ts"))
            if ts is None:
                ts, key = normalize_ts(dir_mtime)
            rows.append(_row(ts, key, "transcript", lane, kind, "lane->rail",
                              _clip(body, TRANSCRIPT_CHARS),
                              note=message.get("id")))
    return rows, ("ok" if rows else "no_sessions"), scanned



# ------------------------------------------------- deadline + public merge()

def _transcript_job(store, done):
    """Worker body: scan transcripts, then publish the result and `done`.

    The payload is written BEFORE `done` is raised, so a reader that sees
    `done` is guaranteed to see a complete result.
    """
    try:
        rows, status, scanned = _transcript_rows()
        payload = {"rows": rows, "status": status, "scanned": scanned}
    except Exception as exc:                     # a worker never dies silently
        payload = {"rows": [], "scanned": 0,
                   "status": "error:%s" % (exc.__class__.__name__)}
    store.update(payload)
    done.set()


def _transcript_within(budget_s):
    """Run the transcript scan under a hard deadline; abandon it if late.

    `budget_s` is the time available to this scan, measured from now.
    Returns (rows, status, elapsed_s).  On overrun the rows are dropped and the
    status is "timeout" - an honest partial, never a fake.
    """
    store = {}
    done = threading.Event()
    started = time.monotonic()
    thread = threading.Thread(target=_transcript_job, args=(store, done),
                              name="pb-rail-transcript", daemon=True)
    thread.start()
    thread.join(max(0.0, float(budget_s)))
    elapsed = time.monotonic() - started
    if not done.is_set():
        return [], "timeout", elapsed
    return store.get("rows", []), store.get("status", "error:no_result"), elapsed


def _fair_tail(rows, limit, floor_ratio=0.15, cap_ratio=0.5, key="_k"):
    """Newest `limit` rows, but reserving a quota per source so every live
    source is represented. Each source gets at least floor_ratio*limit rows
    (when it has them) and at most cap_ratio*limit; the remainder goes to the
    globally newest rows. Returns a re-sorted (oldest-first) list."""
    if len(rows) <= limit:
        return rows
    by_source = {}
    for row in rows:
        by_source.setdefault(row.get("source", "?"), []).append(row)
    floor = max(1, int(limit * floor_ratio))
    cap = max(floor, int(limit * cap_ratio))
    chosen, overflow = [], []
    for src, srows in by_source.items():
        srows = sorted(srows, key=lambda r: r[key])
        take = min(len(srows), cap)
        chosen.extend(srows[-take:] if take else [])
        if len(srows) > take:
            overflow.extend(srows[:-take])
    if len(chosen) < limit:
        overflow.sort(key=lambda r: r[key])
        chosen.extend(overflow[-(limit - len(chosen)):])
    elif len(chosen) > limit:
        # trim the largest source first, keeping every source represented
        chosen.sort(key=lambda r: r[key])
        chosen = chosen[-limit:]
    chosen.sort(key=lambda r: r[key])
    return chosen


_MERGE_CACHE = {"at": 0.0, "rows": None, "status": None, "limit": None}
_MERGE_LOCK = threading.Lock()


def merge(limit=200, budget_s=None, fair_share=True, cache_ttl=0.0):
    """Merged live traffic from all four sources, newest LAST.

    Row shape: {ts, source, lane, kind, dir, text, seq?, mtime?}; `mtime` here
    is the message id for transcript rows.  No row is ever synthesised.

    The 3s budget is enforced against `budget_s` (default BUDGET_S).  If the
    transcript scan overruns it, bus+deliver+api are still returned and
    merge.last_status()["transcript"] == "timeout".

    cache_ttl > 0 shares one real scan across concurrent/near-simultaneous
    callers.  The panel polls every 2s and each poll re-reads every transcript;
    measured at 0.18s per call, 420 calls, that pinned a core at 45% CPU on
    this host.  Traffic is a live view, so a sub-second cache is honest; pass
    cache_ttl=0 for an uncached read.
    """
    global _LAST_STATUS
    # limit <= 0 means "no cap" (the panel omits the param on some views);
    # a naive rows[-0:] would return the whole list, so normalise here.
    lim = int(limit) if limit is not None else 0
    if lim <= 0:
        lim = 2000
    if cache_ttl and cache_ttl > 0:
        with _MERGE_LOCK:
            fresh = (_MERGE_CACHE["rows"] is not None
                     and (time.monotonic() - _MERGE_CACHE["at"]) < cache_ttl)
            if fresh and _MERGE_CACHE["rows"] is not None:
                cached = _MERGE_CACHE["rows"]
                if lim >= len(cached):
                    rows = cached
                else:
                    rows = _fair_tail(cached, lim, key="ts")
                _LAST_STATUS = dict(_MERGE_CACHE["status"])
                _LAST_STATUS["cached"] = True
                return rows

    rows = _merge_uncached(2000, budget_s, fair_share)
    # Always store the wide merge, then slice for this caller. The previous
    # version only cached when `lim >= len(rows)`; with the wide merge at 2000
    # rows and any real panel limit (200/400) that condition was never true, so
    # the cache never populated and every 2s poll re-scanned every transcript
    # (measured 0.7-1.8s per call, api.py pinned at 112% CPU).
    if cache_ttl and cache_ttl > 0:
        with _MERGE_LOCK:
            _MERGE_CACHE.update({"at": time.monotonic(), "rows": rows,
                                 "status": dict(_LAST_STATUS),
                                 "limit": 2000})
    if lim >= len(rows):
        return rows
    # _merge_uncached strips the private sort key, so re-slice on ts (the same
    # ordering the rows already have) rather than on the removed _k.
    return _fair_tail(rows, lim, key="ts") if fair_share else rows[-lim:]


def _merge_uncached(limit=200, budget_s=None, fair_share=True):
    """Merged live traffic from all four sources, newest LAST.

    Row shape: {ts, source, lane, kind, dir, text, seq?, mtime?}; `mtime` here
    is the message id for transcript rows.  No row is ever synthesised.

    The 3s budget is enforced against `budget_s` (default BUDGET_S).  If the
    transcript scan overruns it, bus+deliver+api are still returned and
    merge.last_status()["transcript"] == "timeout".
    """
    global _LAST_STATUS
    budget = float(budget_s) if budget_s else BUDGET_S
    started = time.monotonic()
    source_status = {}
    rows = []

    bus_rows, status = _bus_rows()
    source_status["bus"] = status
    rows.extend(bus_rows)

    deliver_rows, status = _log_rows(DELIVER_LOG, "deliver", "rail", "rail->lane", "log")
    source_status["deliver"] = status
    rows.extend(deliver_rows)

    api_rows, status = _log_rows(API_LOG, "api", "rail", "ops->rail", "http")
    source_status["api"] = status
    rows.extend(api_rows)

    # The transcript scan is the only unbounded work.  It runs in a worker
    # thread under the remaining wall clock; on overrun the honest partial
    # above is returned and the source is marked "timeout".
    elapsed = time.monotonic() - started
    remaining = budget - TRANSCRIPT_SLACK_S - elapsed
    if remaining > 0.02:
        t_rows, t_status, t_elapsed = _transcript_within(remaining)
        source_status["transcript"] = t_status
        source_status["transcript_ms"] = round(t_elapsed * 1000.0, 1)
        rows.extend(t_rows)
    else:
        source_status["transcript"] = "skipped:no_budget"
        source_status["transcript_ms"] = 0.0

    rows.sort(key=lambda row: row["_k"])
    if limit is not None and int(limit) > 0 and len(rows) > int(limit):
        if fair_share:
            # Per-source quota. Without this the chatty sources (bus, api)
            # fill the whole window and the slow, sparse, high-value sources
            # (transcript) never appear -- observed 198 bus / 2 transcript at
            # limit=200 while the same call with a larger limit showed 53
            # transcript rows. A traffic view that hides agent conversation is
            # worse than one that shows a little less of everything.
            keep = _fair_tail(rows, int(limit))
        else:
            keep = rows[-int(limit):]
        rows = keep
    for row in rows:
        row.pop("_k", None)


    elapsed_ms = (time.monotonic() - started) * 1000.0
    source_status["rows"] = len(rows)
    source_status["elapsed_ms"] = round(elapsed_ms, 1)
    source_status["over_budget"] = elapsed_ms > budget * 1000.0
    with _STATUS_LOCK:
        _LAST_STATUS = source_status
    return rows


def merge_with_status(limit=200, budget_s=None, cache_ttl=0.0):
    """merge() plus the source_status dict for this call."""
    rows = merge(limit=limit, budget_s=budget_s, cache_ttl=cache_ttl)
    with _STATUS_LOCK:
        return rows, dict(_LAST_STATUS)


def last_status():
    """The source_status dict recorded by the most recent merge() call."""
    with _STATUS_LOCK:
        return dict(_LAST_STATUS)



# ------------------------------------------------------------------ self-test

def _selftest(limit=50):
    started = time.monotonic()
    rows, status = merge_with_status(limit=limit)
    wall = time.monotonic() - started
    counts = {}
    for row in rows:
        counts[row["source"]] = counts.get(row["source"], 0) + 1
    print("merge(limit=%d) -> %d rows in %.3fs wall (budget %.1fs)"
          % (limit, len(rows), wall, BUDGET_S))
    print("source_status: %s" % json.dumps(status, sort_keys=True))
    print("distinct sources (%d): %s" % (len(counts), ", ".join(sorted(counts))))
    for name in sorted(counts):
        seen = [r for r in rows if r["source"] == name]
        print("  %-11s rows=%-4d oldest=%s newest=%s"
              % (name, counts[name], min(r["ts"] for r in seen),
                 max(r["ts"] for r in seen)))
    print("last 6 rows (newest last):")
    for row in rows[-6:]:
        print("  %-25s %-11s %-10s %-11s %s"
              % (row["ts"], row["source"], row["lane"], row["kind"], row["text"][:78]))
    # every row must carry a real parsed timestamp, ordered ascending
    stamps = [row["ts"] for row in rows]
    ordered = all(stamps[i] <= stamps[i + 1] for i in range(len(stamps) - 1))
    shaped = all({"ts", "source", "lane", "kind", "dir", "text"} <= set(row)
                 and row["text"] and row["ts"] for row in rows)
    # every timestamp must be a real, parseable ISO-8601 instant
    parsed = all(normalize_ts(row["ts"])[1] is not None for row in rows)
    ok = (len(counts) >= 3 and wall < BUDGET_S and ordered and shaped and parsed
          and not status.get("over_budget"))
    print("ordering ascending: %s | row shape ok: %s | all ts parse: %s"
          % (ordered, shaped, parsed))
    print("SELFTEST %s: %d distinct real sources, %.3fs < %.1fs budget"
          % ("PASS" if ok else "FAIL", len(counts), wall, BUDGET_S))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(_selftest(int(sys.argv[1]) if len(sys.argv) > 1 else 50))

