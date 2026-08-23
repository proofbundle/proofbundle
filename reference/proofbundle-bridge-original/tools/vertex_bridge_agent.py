#!/usr/bin/env python3
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

import requests


BRIDGE_ROOT = pathlib.Path(__file__).resolve().parents[1]
IDENTITY = "vertex-gemini-bridge-agent-20260616"
IDENTITY_FILE = BRIDGE_ROOT / "bridge_identities" / f"{IDENTITY}.identity.json"
STATE_DIR = BRIDGE_ROOT / "bridge_state"
OUTBOX_DIR = BRIDGE_ROOT / "bridge_outbox" / IDENTITY
LOG_DIR = BRIDGE_ROOT / "run_receipts" / "vertex_bridge_agent"
PROJECT = os.environ.get("VERTEX_BRIDGE_PROJECT", "proofbundle")
LOCATION = os.environ.get("VERTEX_BRIDGE_LOCATION", "us-central1")
MODEL = os.environ.get("VERTEX_BRIDGE_MODEL", "gemini-2.5-flash")


SYSTEM = """You are Vertex Gemini Bridge Agent, a ProofBundle fallback worker.
Rules:
- This is not roleplay. Treat the bridge as files, ledger JSONL records, hashes, cursors, OTS receipts, and VM receipts.
- Do not claim done, submitted, verified, synced, or up unless the prompt includes exact same-surface evidence.
- Do not use confidence as evidence. If evidence is incomplete, say what is missing.
- Keep replies short, operational, and bridge-safe.
- Never ask the user to copy files. Report exact commands or paths when useful.
- Do not suggest deletion, movement, or cleanup unless explicitly ordered.
"""


def utc_stamp():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def gcloud_path():
    found = shutil.which("gcloud.cmd") or shutil.which("gcloud")
    if found:
        return found
    fallback = pathlib.Path.home() / "AppData" / "Local" / "Google" / "Cloud SDK" / "google-cloud-sdk" / "bin" / "gcloud.cmd"
    return str(fallback)


def run(cmd, cwd=BRIDGE_ROOT, timeout=120):
    p = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    return p.returncode, p.stdout, p.stderr


def access_token():
    rc, out, err = run([gcloud_path(), "auth", "print-access-token", "--quiet"], cwd=BRIDGE_ROOT, timeout=60)
    if rc != 0 or not out.strip():
        raise RuntimeError(f"gcloud token failed rc={rc} stderr={err.strip()[:500]}")
    return out.strip()


def vertex_generate(prompt, max_tokens=768):
    token = access_token()
    url = (
        f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}"
        f"/publishers/google/models/{MODEL}:generateContent"
    )
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": max_tokens},
    }
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=body,
        timeout=60,
    )
    if not response.ok:
        raise RuntimeError(f"vertex HTTP {response.status_code}: {response.text[:1000]}")
    data = response.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts).strip()
    return text, data


def bridge_status(identity=IDENTITY):
    rc, out, err = run(["node", "proofbundle_peer_bridge.mjs", "status", "--as", identity], timeout=60)
    if rc != 0:
        raise RuntimeError(f"bridge status failed rc={rc} stderr={err.strip()[:500]}")
    return out.strip()


def bridge_tail(limit=8):
    rc, out, err = run(["node", "proofbundle_peer_bridge.mjs", "tail", "--limit", str(limit)], timeout=90)
    if rc != 0:
        raise RuntimeError(f"bridge tail failed rc={rc} stderr={err.strip()[:500]}")
    return out.strip()


def load_records():
    rows = []
    ledger = BRIDGE_ROOT / "ledger.jsonl"
    with ledger.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.strip():
                continue
            try:
                rows.append(json.loads(line))
            except Exception:
                continue
    return rows


def cursor_path():
    return STATE_DIR / f"{IDENTITY}.cursor.json"


def load_cursor():
    p = cursor_path()
    if not p.exists():
        return 0
    try:
        return int(json.loads(p.read_text(encoding="utf-8")).get("last_seen_sequence", 0))
    except Exception:
        return 0


def save_cursor(seq):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    cursor_path().write_text(json.dumps({"last_seen_sequence": seq, "updated_at_utc": utc_stamp()}, indent=2) + "\n", encoding="utf-8")


def is_addressed(record):
    to = str(record.get("to", ""))
    if record.get("from") == IDENTITY:
        return False
    if to in (IDENTITY, "all-bridge-agents", "vertex-gemini"):
        return True
    text = str(record.get("payload", {}).get("text", ""))
    return IDENTITY in text or "vertex" in text.lower() or "gemini" in text.lower()


def write_payload(text, prefix="VERTEX_GEMINI_REPLY"):
    OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTBOX_DIR / f"{prefix}_{utc_stamp()}.md"
    path.write_text(text.strip() + "\n", encoding="utf-8")
    return path


def bridge_send_file(path, to="all-bridge-agents", msg_type="ProofBundleBroadcast"):
    rc, out, err = run([
        "node",
        "proofbundle_peer_bridge.mjs",
        "send",
        "--from",
        IDENTITY,
        "--to",
        to,
        "--type",
        msg_type,
        "--identity-file",
        str(IDENTITY_FILE),
        "--file",
        str(path),
    ], timeout=180)
    return rc, out.strip(), err.strip()


def startup_probe(send=False):
    status = bridge_status()
    tail = bridge_tail(5)
    text, raw = vertex_generate("Return exactly VERTEX_BRIDGE_AGENT_OK and one short sentence saying you will require sequence/hash/receipt evidence.")
    receipt = {
        "schema": "VertexBridgeAgentProbe/v1.0",
        "created_at_utc": utc_stamp(),
        "project": PROJECT,
        "location": LOCATION,
        "model": MODEL,
        "identity": IDENTITY,
        "vertex_text": text,
        "response_id": raw.get("responseId"),
        "model_version": raw.get("modelVersion"),
        "bridge_status": status,
    }
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    receipt_path = LOG_DIR / f"vertex_probe_{utc_stamp()}.json"
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))
    if send:
        payload = f"""[Vertex Gemini Bridge Agent / fallback]
Type: VertexBridgeAgentStarted
UTC: {utc_stamp()}

Vertex REST probe succeeded.
- project: {PROJECT}
- location: {LOCATION}
- model: {MODEL}
- response_id: {raw.get('responseId')}
- model_version: {raw.get('modelVersion')}
- local_receipt: {receipt_path}

Bridge status seen by Vertex wrapper:
{status}

Tail sample:
{tail[-2500:]}

Standing:
- Backup worker is evidence-bound.
- No roleplay framing.
- No confidence claims without same-surface sequence/hash/receipt evidence.
"""
        path = write_payload(payload, "VERTEX_GEMINI_STARTED")
        rc, out, err = bridge_send_file(path)
        print("SEND_RC", rc)
        print(out)
        if err:
            print(err, file=sys.stderr)
        if rc != 0:
            raise SystemExit(rc)


def answer_record(record):
    status = bridge_status()
    tail = bridge_tail(8)
    text = str(record.get("payload", {}).get("text", ""))
    prompt = f"""Bridge record addressed to Vertex/Gemini fallback:
sequence={record.get('sequence')}
from={record.get('from')}
to={record.get('to')}
record_sha256={record.get('record_sha256')}
message_type={record.get('message_type')}

Current bridge status:
{status}

Recent bridge tail:
{tail[-5000:]}

Record text excerpt:
{text[:8000]}

Respond as a fallback bridge worker. If the request needs action outside bridge read/send, state the exact missing capability. If you cite done/submitted/up, cite sequence/hash/receipt evidence from the prompt."""
    reply, raw = vertex_generate(prompt)
    payload = f"""[Vertex Gemini Bridge Agent / fallback]
Type: VertexBridgeAgentReply
UTC: {utc_stamp()}
Source sequence: {record.get('sequence')}
Source record_sha256: {record.get('record_sha256')}
Vertex response_id: {raw.get('responseId')}
Vertex model_version: {raw.get('modelVersion')}

{reply}
"""
    path = write_payload(payload)
    rc, out, err = bridge_send_file(path, to=str(record.get("from") or "all-bridge-agents"))
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    (LOG_DIR / "send_log.jsonl").open("a", encoding="utf-8").write(json.dumps({
        "created_at_utc": utc_stamp(),
        "source_sequence": record.get("sequence"),
        "payload": str(path),
        "send_rc": rc,
        "stdout": out[-2000:],
        "stderr": err[-2000:],
    }) + "\n")
    print(out)
    if err:
        print(err, file=sys.stderr)
    return rc


def watch(interval):
    startup_probe(send=True)
    rows = load_records()
    if rows and load_cursor() == 0:
        save_cursor(int(rows[-1].get("sequence") or 0))
    while True:
        try:
            rows = load_records()
            last = load_cursor()
            max_seen = last
            handled = 0
            for record in rows:
                seq = int(record.get("sequence") or 0)
                if seq <= last:
                    continue
                max_seen = max(max_seen, seq)
                if is_addressed(record):
                    answer_record(record)
                    handled += 1
                    if handled >= 2:
                        break
            if max_seen > last:
                save_cursor(max_seen)
        except Exception as exc:
            LOG_DIR.mkdir(parents=True, exist_ok=True)
            (LOG_DIR / "errors.log").open("a", encoding="utf-8").write(f"{utc_stamp()} {type(exc).__name__}: {exc}\n")
            print(f"ERROR {type(exc).__name__}: {exc}", file=sys.stderr)
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["probe", "watch", "answer-latest"])
    parser.add_argument("--send-startup", action="store_true")
    parser.add_argument("--interval", type=int, default=60)
    args = parser.parse_args()
    if args.command == "probe":
        startup_probe(send=args.send_startup)
    elif args.command == "answer-latest":
        rows = [r for r in load_records() if is_addressed(r)]
        if not rows:
            raise SystemExit("no addressed records")
        raise SystemExit(answer_record(rows[-1]))
    elif args.command == "watch":
        watch(max(15, args.interval))


if __name__ == "__main__":
    main()
