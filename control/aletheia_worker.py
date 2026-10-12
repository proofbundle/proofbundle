#!/usr/bin/env python3
"""Child-process JSON-lines adapter. No listening sockets, server, or daemon."""
import argparse
import base64
import io
import json
import pathlib
import sys
import tempfile
import uuid
import subprocess
from aletheia_store import CustodyStore, SOURCE_PATHS, canonical
from aletheia_store import digest


def bridge_snapshot(limit=100):
    source = pathlib.Path('/home/falsealias/pb/bridge-live/ledger.jsonl')
    if not source.is_file(): raise FileNotFoundError('Local native bridge ledger is unavailable')
    stat = source.stat()
    start = max(0, stat.st_size - 2 * 1024 * 1024)
    with source.open('rb') as file:
        file.seek(start)
        if start:
            file.readline(); start = file.tell()
        raw = file.read()
    records, errors = [], 0
    for line in raw.splitlines():
        if not line.strip(): continue
        try:
            record = json.loads(line)
            records.append(record)
        except (ValueError, UnicodeDecodeError): errors += 1
    return {'schema': 'AletheiaNativeBridgeWindow/v1',
            'source': {'path': str(source), 'size': stat.st_size, 'mtime_ns': stat.st_mtime_ns, 'byte_start': start},
            'entries': records[-max(1, min(int(limit), 500)):], 'parse_errors': errors,
            'raw_window_sha256': digest(raw),
            'coverage': 'Bounded native ledger observation. Source records and signatures retain their native schemas; whole-chain and signer verification are not inferred.'}


def dispatch(store, operation, args):
    if operation == 'status': return store.status()
    if operation == 'latest': return store.latest()
    if operation == 'sources':
        return {'sources': store.source_status(), 'scripts': [
            {'path': p, 'available': pathlib.Path(p).is_file()} for p in
            ['/home/falsealias/pb/bin/pb-memory-recall', '/home/falsealias/pb/bin/pb-memory-resolve']]}
    if operation == 'search': return store.search(args['source'], args['query'], args.get('limit', 6))
    if operation == 'sourceSnapshot': return store.source_snapshot(int(args['index']))
    if operation == 'cryptoAuditReport':
        path=pathlib.Path('/home/falsealias/.local/share/ChatGPT-Separate-Account/isolated-home/Documents/Codex/2026-10-11/w-2/work/proofbundle-current-crypto-audit.json')
        return json.loads(path.read_text())
    if operation == 'snapshotTestReport':
        report = pathlib.Path('/home/falsealias/.local/share/ChatGPT-Separate-Account/isolated-home/Documents/Codex/2026-10-11/w-2/work/archive-snapshot-checks/report.json')
        return json.loads(report.read_text())
    if operation == 'runArchiveVectors':
        sets = args['sets']
        for item in sets: store.check_key(item['blob_ref'])
        manifests = [{**item, 'blob_path':str(store.blobs/item['blob_ref'])} for item in sets]
        result = subprocess.run(['node',str(pathlib.Path(__file__).resolve().parents[1]/'desktop/vector-runner.mjs'),'--batch'], input=json.dumps(manifests).encode(),capture_output=True,timeout=180)
        if result.returncode: raise ValueError(result.stderr.decode(errors='replace')[:1000])
        return json.loads(result.stdout)
    if operation == 'catalogue': return store.catalogue()
    if operation == 'bridgeSnapshot': return bridge_snapshot(args.get('limit', 100))
    if operation == 'runVectors':
        store.check_key(args['key'])
        source = store.blobs / args['key']
        with source.open('rb') as stream:
            result = subprocess.run(['node', str(pathlib.Path(__file__).resolve().parents[1] / 'desktop/vector-runner.mjs')],
                stdin=stream, capture_output=True, timeout=120)
        if result.returncode: raise ValueError('Native vector executor failed: ' + result.stderr.decode(errors='replace')[:1000])
        return json.loads(result.stdout)
    if operation == 'inspectArchiveZip': return store.inspect_archive_zip(args['path'])
    if operation == 'stageArchiveZip': return store.stage_archive_zip(args['path'],args['bundle'])
    if operation == 'archiveManifest': return store.archive_manifest(args['id'])
    if operation == 'exportArchiveZip': return store.export_archive_zip(args['id'],args['bundle'])
    if operation == 'beginRecordCheckpoint': return store.begin_record_checkpoint(args['header'])
    if operation == 'beginCheckpointRecord':
        file=tempfile.NamedTemporaryFile(prefix='.record-',dir=store.root,delete=False)
        if not hasattr(store,'_record_uploads'):store._record_uploads={}
        upload_id=str(uuid.uuid4());store._record_uploads[upload_id]=(file,args['id'],args['kind'],args['ordinal'])
        return {'upload_id':upload_id}
    if operation == 'appendCheckpointRecord':
        file,*_=store._record_uploads[args['upload_id']]
        if len(args['chunk'])>262144:raise ValueError('Checkpoint text chunk is too large')
        raw=args['chunk'].encode('utf8');file.write(raw);return {'bytes':len(raw)}
    if operation == 'finishCheckpointRecord':
        file,snapshot_id,kind,ordinal=store._record_uploads.pop(args['upload_id']);file.close();path=pathlib.Path(file.name)
        try:return store.put_checkpoint_record(snapshot_id,kind,ordinal,path.read_text())
        finally:path.unlink(missing_ok=True)
    if operation == 'checkpointRecordInfo':return store.checkpoint_record_info(args['id'],args['kind'],args['ordinal'],reader=True)
    if operation == 'checkpointReaderChunk':return store.checkpoint_reader_chunk(args['reader_id'],args['offset'])
    if operation == 'checkpointRecordChunk':return store.checkpoint_record_chunk(args['id'],args['kind'],args['ordinal'],args['offset'])
    if operation == 'checkpointRecord': return store.put_checkpoint_record(args['id'],args['kind'],args['ordinal'],args['raw_json'])
    if operation == 'finishRecordCheckpoint': return store.finish_record_checkpoint(args['id'],args['counts'])
    if operation == 'checkpointRecordPage': return store.checkpoint_record_page(args['id'],args['kind'],args.get('offset',0),args.get('limit',20))
    if operation == 'checkpoint': return store.save_snapshot(args['snapshot'])
    if operation == 'putBlob':
        raw = base64.b64decode(args['bytes_b64'], validate=True)
        return store.put_blob(args['key'], io.BytesIO(raw), len(raw))
    if operation == 'beginBlob':
        store.check_key(args['key'])
        ident = str(uuid.uuid4())
        f = tempfile.NamedTemporaryFile(prefix='.ipc-', dir=store.blobs, delete=False)
        if not hasattr(store, '_uploads'): store._uploads = {}
        store._uploads[ident] = (args['key'], f)
        return {'upload_id': ident}
    if operation == 'appendBlob':
        key, file = store._uploads[args['upload_id']]
        raw = base64.b64decode(args['chunk_b64'], validate=True)
        if len(raw) > 1024 * 1024: raise ValueError('IPC blob chunk exceeds 1 MiB')
        file.write(raw)
        return {'written': len(raw)}
    if operation in ['finishBlob', 'abortBlob']:
        key, file = store._uploads.pop(args['upload_id']); file.close()
        path = pathlib.Path(file.name)
        try:
            if operation == 'abortBlob': return {'aborted': True}
            with path.open('rb') as stream: return store.put_blob(key, stream, path.stat().st_size)
        finally: path.unlink(missing_ok=True)
    if operation == 'getBlob':
        store.check_key(args['key'])
        return {'bytes_b64': base64.b64encode((store.blobs / args['key']).read_bytes()).decode('ascii')}
    raise ValueError('Unsupported local operation: ' + str(operation))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state-dir', required=True)
    a = p.parse_args()
    store = CustodyStore(a.state_dir)
    for line in sys.stdin:
        ident = None
        try:
            request = json.loads(line); ident = request['id']
            result = dispatch(store, request['operation'], request.get('args') or {})
            response = {'id': ident, 'ok': True, 'result': result}
        except Exception as error:
            response = {'id': ident, 'ok': False, 'error': type(error).__name__ + ': ' + str(error)}
        print(canonical(response), flush=True)


if __name__ == '__main__': main()
