#!/usr/bin/env python3
"""fsview.py — read-only file explorer (pb-rail SPEC2 §"fsview.py").

Binding contract:
  listing(path, limit=2000) -> {path,parent,entries:[{name,is_dir,size,mtime,mode}],
                                 truncated,error,source,read_only_device}
  * Default path /home/falsealias.  Path must be absolute and realpath'd.
  * HARD reject anything under /tmp, /mnt/pb-work, /dev/shm — an `error` in the
    returned dict, NEVER an empty listing (standing machine rules).
  * /dev/sdd may be listed but is flagged read_only_device=True forever; as a
    bare block node it has no children, so it succeeds with itself as the one
    entry (plus device/device_kind) rather than a fake directory listing.
  * Dirs first, then name.  Per-entry stat failure yields {name,error}, never
    a crash.  Entries beyond `limit` set truncated=True.
  * `source` is the measured mount (fstype/options/device/bytes) from
    /proc/self/mountinfo + statvfs, read fresh on every call.
  * Read-only by construction: no write/mkdir/delete/rename function exists
    here, nothing is opened for writing, nothing is mutated.  `source` reports
    the measured filesystem backing the path.
"""
from __future__ import annotations

import os
import stat as _stat

__all__ = ["listing", "ALLOWED", "BLOCKED", "READ_ONLY_DEVICES", "DEFAULT_PATH",
           "is_blocked", "is_read_only_device"]

DEFAULT_PATH = "/home/falsealias"
ALLOWED = (DEFAULT_PATH, "/home", "/media", "/mnt", "/dev", "/opt", "/srv",
           "/var", "/usr", "/etc", "/root")

# Standing machine rules (mirrors forensics.BLOCKED_WRITE_PREFIXES): never
# browsable, never a write target.
BLOCKED = ("/tmp", "/mnt/pb-work", "/dev/shm")

# Foreign drive: listable and flagged, never a write target (there are none).
READ_ONLY_DEVICES = ("/dev/sdd",)

DEFAULT_LIMIT = 2000
MAX_LIMIT = 20000

_TYPE_CHARS = ((_stat.S_ISDIR, "d"), (_stat.S_ISLNK, "l"), (_stat.S_ISBLK, "b"),
               (_stat.S_ISCHR, "c"), (_stat.S_ISFIFO, "p"), (_stat.S_ISSOCK, "s"))


# --------------------------------------------------------------------------- #
# helpers — pure inspection, no mutation
# --------------------------------------------------------------------------- #
def _under(path: str, root: str) -> bool:
    """True when `path` is `root` itself or lives below it (component-wise)."""
    return path == root or path.startswith(root.rstrip("/") + "/")


def _within(path: str, roots) -> bool:
    return any(_under(path, r) for r in roots)


def is_blocked(path: str) -> bool:
    """True for a realpath'd path inside a hard-rejected root."""
    return _within(path, BLOCKED)


def is_read_only_device(path: str) -> bool:
    """True for a realpath'd path that is a never-writable foreign device."""
    return _within(path, READ_ONLY_DEVICES)


def _as_limit(value) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return DEFAULT_LIMIT if n < 1 else min(n, MAX_LIMIT)


def _mode(st) -> str:
    """Permission string with the leading file-type char, e.g. -rw-r--r--."""
    perms = ""
    for rwx in ((0o400, 0o200, 0o100), (0o040, 0o020, 0o010),
                (0o004, 0o002, 0o001)):
        perms += "".join(ch if st.st_mode & bit else "-"
                         for bit, ch in zip(rwx, "rwx"))
    lead = "-"
    for is_kind, ch in _TYPE_CHARS:
        if is_kind(st.st_mode):
            lead = ch
            break
    return lead + perms


def _mount_for(path: str):
    """Longest /proc/self/mountinfo prefix covering `path` (real measured data).

    Returns (mountpoint, fstype, mount_options, source_device) or None.
    """
    try:
        with open("/proc/self/mountinfo", "r", encoding="utf-8",
                  errors="replace") as fh:
            lines = fh.readlines()
    except OSError:
        return None
    best = None
    for raw in lines:
        parts = raw.split(" - ", 1)
        if len(parts) != 2:
            continue
        left = parts[0].split()
        right = parts[1].split()
        if len(left) < 5 or not right:
            continue
        mp = left[4].replace("\\040", " ")
        if path == mp or path.startswith(mp.rstrip("/") + "/"):
            if best is None or len(mp) > len(best[0]):
                best = (mp, right[0], left[5], right[1] if len(right) > 1 else "")
    return best


def _source(path: str):
    """Measured backing filesystem for the path, or None if unavailable.

    os.statvfs has no f_fstype on Linux, so fstype/options/device come from
    mountinfo while the byte counters come from statvfs.
    """
    mount = _mount_for(path)
    try:
        sv = os.statvfs(path)
    except (OSError, ValueError):
        return None
    out = {"total_bytes": sv.f_blocks * sv.f_frsize,
           "free_bytes": sv.f_bavail * sv.f_frsize}
    if mount:
        out["mountpoint"] = mount[0]
        out["fstype"] = mount[1]
        out["options"] = mount[2]
        if mount[3]:
            out["device"] = mount[3]
    return out


def _device_source(path: str):
    """Honest description of a bare block/char device node (no fs to stat)."""
    out = {"kind": "device"}
    try:
        with open("/proc/self/mountinfo", "r", encoding="utf-8",
                  errors="replace") as fh:
            payload = fh.read()
    except OSError:
        payload = ""
    out["mounted"] = any(("/" + os.path.basename(path)) in ln
                         for ln in payload.splitlines())
    return out


def _error(message: str, path: str, parent=None, source=None,
           read_only_device: bool = False) -> dict:
    """A refusal shape: error set, entries empty — never a silent empty list."""
    return {"path": path, "parent": parent, "entries": [], "truncated": False,
            "error": message, "source": source,
            "read_only_device": read_only_device}



def _entry(name: str, st) -> dict:
    return {"name": name, "is_dir": _stat.S_ISDIR(st.st_mode),
            "size": st.st_size, "mtime": round(st.st_mtime, 3),
            "mode": _mode(st)}


# --------------------------------------------------------------------------- #
# public API
# --------------------------------------------------------------------------- #
def listing(path=None, limit: int = DEFAULT_LIMIT) -> dict:
    """List one directory.  Read-only inspection; see the module docstring."""
    limit = _as_limit(limit)
    raw = DEFAULT_PATH if path is None or path == "" else str(path)

    if "\x00" in raw:
        # realpath() raises ValueError on an embedded NUL; refuse, never crash.
        return _error("path contains a null byte", raw)
    if not os.path.isabs(raw):
        return _error("path must be absolute: %r" % raw, raw)

    try:
        real = os.path.realpath(raw)
    except (OSError, ValueError) as exc:
        return _error("path cannot be resolved: %s (%s)" % (raw, exc), raw)
    parent = os.path.dirname(real)

    # Hard rule first, checked on the realpath: a symlink pointing into a
    # blocked root cannot slip past, and /tmp/../home/... resolves honestly.
    if _within(real, BLOCKED):
        return _error("blocked path: %s is under %s (hard rule, not browsable)"
                      % (real, ", ".join(BLOCKED)), real, parent=parent,
                      source="blocked",
                      read_only_device=_within(real, READ_ONLY_DEVICES))

    ro = _within(real, READ_ONLY_DEVICES)

    try:
        st = os.stat(real)
    except (OSError, ValueError) as exc:
        return _error("%s: %s" % (exc.strerror or "stat failed", real), real,
                      parent=parent,
                      source=_device_source(real) if ro else _source(real),
                      read_only_device=ro)

    if _stat.S_ISBLK(st.st_mode) or _stat.S_ISCHR(st.st_mode):
        # A bare device node has no children.  Succeed (no error) with the
        # device itself as the single entry, flagged, so the UI can show it.
        kind = "block device" if _stat.S_ISBLK(st.st_mode) else "char device"
        return {"path": real, "parent": parent,
                "entries": [_entry(os.path.basename(real), st)],
                "truncated": False,
                "error": None,
                "source": _device_source(real),
                "read_only_device": True,
                "device": True, "device_kind": kind}

    if not _stat.S_ISDIR(st.st_mode):
        return _error("not a directory: %s" % real, real, parent=parent,
                      source=_source(real), read_only_device=ro)

    try:
        with os.scandir(real) as scan:
            names = []
            for de in scan:                    # per-entry failures isolated
                try:
                    names.append(de.name)
                except OSError:
                    continue
    except (OSError, ValueError) as exc:
        return _error("cannot read directory: %s (%s)"
                      % (real, exc.strerror or exc), real, parent=parent,
                      source=_source(real), read_only_device=ro)

    entries = []
    for name in names:
        try:
            entries.append(_entry(name, os.lstat(os.path.join(real, name))))
        except (OSError, ValueError) as exc:    # never a crash on one bad entry
            entries.append({"name": name,
                            "error": exc.strerror or str(exc) or "stat failed"})

    # Dirs first, then name; entries that failed to stat stay visible.
    entries.sort(key=lambda e: (0 if e.get("is_dir") else 1, e["name"]))

    truncated = len(entries) > limit
    if truncated:
        entries = entries[:limit]

    return {"path": real, "parent": parent, "entries": entries,
            "truncated": truncated, "error": None, "source": _source(real),
            "read_only_device": ro}


# ------------------------------------------------------------- self test ----
if __name__ == "__main__":                       # python3 fsview.py [path ...]
    import json
    import sys
    for target in (sys.argv[1:] or [DEFAULT_PATH]):
        print(json.dumps(listing(target), indent=1, default=str)[:4000])
