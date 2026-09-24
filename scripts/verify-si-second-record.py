#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'formal' / 'si-second'
doc = json.loads((root / 'SOURCE_MANIFEST.json').read_text())
seen = set()
for entry in doc['entries']:
    rel = entry['repository_path']
    if rel in seen:
        raise SystemExit(f'duplicate manifest path: {rel}')
    seen.add(rel)
    path = root.parents[1] / rel
    data = path.read_bytes()
    actual = hashlib.sha256(data).hexdigest()
    if actual != entry['sha256'] or len(data) != entry['bytes']:
        raise SystemExit(f'manifest mismatch: {rel}')

lean = {p.name for p in (root / 'source-record').glob('*.lean')}
rocq = {p.name for p in (root / 'source-record').glob('*.v')}
manifest_lean = {Path(e['repository_path']).name for e in doc['entries'] if e['class'] == 'lean4'}
manifest_rocq = {Path(e['repository_path']).name for e in doc['entries'] if e['class'] == 'rocq'}
if lean != manifest_lean:
    raise SystemExit(f'Lean manifest coverage mismatch: files={sorted(lean-manifest_lean)} manifest={sorted(manifest_lean-lean)}')
if rocq != manifest_rocq:
    raise SystemExit(f'Rocq manifest coverage mismatch: files={sorted(rocq-manifest_rocq)} manifest={sorted(manifest_rocq-rocq)}')

ledger = [json.loads(line) for line in (root / 'CORRECTION_LEDGER.jsonl').read_text().splitlines() if line.strip()]
scopes = {row['scope'] for row in ledger}
signals = ('FAIL', 'DEFECT', 'SORRY', 'MALFORMED', 'NEGATIVE', 'TAMPER', 'ERROR')
expected = {e['repository_path'] for e in doc['entries'] if any(s in e['member'].upper() for s in signals)}
if scopes != expected:
    raise SystemExit(f'correction ledger coverage mismatch: missing={sorted(expected-scopes)} extra={sorted(scopes-expected)}')

print(json.dumps({'entries': len(seen), 'lean': len(lean), 'rocq': len(rocq), 'corrections': len(ledger)}))
