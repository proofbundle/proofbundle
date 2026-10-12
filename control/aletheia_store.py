#!/usr/bin/env python3
"""Aletheia local storage and read-only native source adapters.

Native sources are never opened for writing. This server does not start, repair,
register identities with, or send messages through the independent bridge.
"""
import hashlib
import json
import os
import pathlib
import re
import sqlite3
import tempfile
import time
import uuid
from contextlib import contextmanager

REPO = pathlib.Path(__file__).resolve().parents[1]



def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode('utf-8')).hexdigest()


def now():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


class CustodyStore:
    def __init__(self, root, sources=None):
        self.root = pathlib.Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.blobs = self.root / 'blobs'
        self.blobs.mkdir(exist_ok=True, mode=0o700)
        self.database = self.root / 'custody.sqlite3'
        profile_path = self.root / 'local-profile.json'
        self.profile = json.loads(profile_path.read_text()) if profile_path.is_file() else {}
        self.sources = {k: pathlib.Path(v) for k, v in (sources if sources is not None else self.profile.get('sources', {})).items()}
        with self.connect() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS blobs (
                    key TEXT PRIMARY KEY, sha256 TEXT NOT NULL, size INTEGER NOT NULL,
                    created_at TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS snapshots (
                    id TEXT PRIMARY KEY, created_at TEXT NOT NULL,
                    payload TEXT NOT NULL, sha256 TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS checkpoint_records (
                    snapshot_id TEXT NOT NULL, kind TEXT NOT NULL, ordinal INTEGER NOT NULL,
                    record_id TEXT, raw_json TEXT NOT NULL, sha256 TEXT NOT NULL,
                    PRIMARY KEY(snapshot_id,kind,ordinal));
                CREATE TABLE IF NOT EXISTS checkpoint_drafts (
                    id TEXT PRIMARY KEY, created_at TEXT NOT NULL, header_json TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS captures (
                    id TEXT PRIMARY KEY, created_at TEXT NOT NULL,
                    payload TEXT NOT NULL, sha256 TEXT NOT NULL);
            ''')
        os.chmod(self.database, 0o600)

    def profile_path(self, key):
        value = self.profile.get(key)
        if not value or not pathlib.Path(value).is_absolute(): raise ValueError('Local profile requires an absolute ' + key + ' path')
        return pathlib.Path(value)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('PRAGMA synchronous=FULL')
        try:
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def check_key(key):
        if not re.fullmatch(r'[a-f0-9]{64}', key):
            raise ValueError('Invalid blob identifier')

    def put_blob(self, key, stream, length):
        self.check_key(key)
        fd, name = tempfile.mkstemp(prefix='.upload-', dir=self.blobs)
        h, total = hashlib.sha256(), 0
        try:
            with os.fdopen(fd, 'wb') as f:
                while total < length:
                    chunk = stream.read(min(1024 * 1024, length - total))
                    if not chunk:
                        raise ValueError('Incomplete blob upload')
                    total += len(chunk)
                    h.update(chunk)
                    f.write(chunk)
                f.flush()
                os.fsync(f.fileno())
            sha = h.hexdigest()
            with self.connect() as db:
                prior = db.execute('SELECT * FROM blobs WHERE key=?', (key,)).fetchone()
                if prior and (prior['sha256'] != sha or prior['size'] != total):
                    raise ValueError('A content reference cannot overwrite different bytes')
                if not prior:
                    os.replace(name, self.blobs / key)
                    dfd = os.open(self.blobs, os.O_DIRECTORY)
                    try:
                        os.fsync(dfd)
                    finally:
                        os.close(dfd)
                    db.execute('INSERT INTO blobs VALUES (?,?,?,?)', (key, sha, total, now()))
            return {'key': key, 'sha256': sha, 'size': total}
        finally:
            pathlib.Path(name).unlink(missing_ok=True)

    def save_snapshot(self, payload):
        if payload.get('schema') != 'AletheiaCustodySnapshot/v1':
            raise ValueError('Unsupported custody snapshot')
        raw = canonical(payload)
        with self.connect() as db:
            for artifact in payload.get('artifacts', []):
                ref = artifact.get('blob_ref')
                if not ref:
                    if not artifact.get('missing_bytes'):
                        raise ValueError('Artifact bytes need a reference or an explicit missing state')
                    continue
                self.check_key(ref)
                blob = db.execute('SELECT * FROM blobs WHERE key=?', (ref,)).fetchone()
                if not blob or not (self.blobs / ref).is_file() or blob['sha256'] != artifact.get('blob_sha256') or blob['size'] != artifact.get('size'):
                    raise ValueError('Snapshot references missing or mismatched artifact bytes')
            ident = str(uuid.uuid4())
            db.execute('INSERT INTO snapshots VALUES (?,?,?,?)', (ident, now(), raw, digest(raw)))
        return {'id': ident, 'sha256': digest(raw), 'saved_at': now()}

    def latest(self):
        with self.connect() as db:
            row = db.execute('SELECT * FROM snapshots ORDER BY rowid DESC LIMIT 1').fetchone()
        if not row:
            return None
        if digest(row['payload']) != row['sha256']:
            raise ValueError('Stored checkpoint integrity failure')
        return {'id': row['id'], 'sha256': row['sha256'], 'snapshot': json.loads(row['payload'])}

    def status(self):
        with self.connect() as db:
            blobs = [dict(r) for r in db.execute('SELECT key,sha256,size FROM blobs')]
            counts = {t: db.execute('SELECT COUNT(*) FROM ' + t).fetchone()[0] for t in ['snapshots', 'captures']}
        return {'service': 'aletheia-custody', 'database': str(self.database), 'blobs': blobs, **counts}

    def source_status(self):
        return [{'id': key, 'path': str(path), 'available': path.is_file(), 'mode': 'read-only'}
                for key, path in self.sources.items()]

    def catalogue(self):
        """Capture the native registry and its declared vector files without executing them."""
        registry = self.profile_path('registry')
        if not registry.is_file(): raise FileNotFoundError('Native algorithm registry is unavailable')
        raw = registry.read_bytes()
        algorithms = json.loads(raw)
        if not isinstance(algorithms, list): raise ValueError('Unsupported native registry shape')
        source_hash = digest(raw)
        files = [{'path': str(registry), 'name': registry.name, 'kind': 'algorithm-registry',
                  'sha256': source_hash, 'size': len(raw), 'blob_ref': source_hash}]
        self.put_blob(source_hash, __import__('io').BytesIO(raw), len(raw))
        seen, vectors, missing = set(), [], []
        for algorithm in algorithms:
            root = pathlib.Path(algorithm.get('repoPath', ''))
            for relative in algorithm.get('testVectorPaths', []):
                file = root / relative
                if not file.is_file():
                    missing.append({'algorithm': algorithm.get('id'), 'path': str(file)})
                    continue
                resolved = file.resolve()
                if resolved in seen: continue
                seen.add(resolved)
                data = file.read_bytes(); file_hash = digest(data)
                self.put_blob(file_hash, __import__('io').BytesIO(data), len(data))
                value = json.loads(data)
                cases = value if isinstance(value, list) else next((value[k] for k in ['vectors', 'test_vectors', 'cases', 'tests']
                        if isinstance(value.get(k), list)), None)
                row = {'id': file_hash, 'algorithm_id': algorithm.get('id'), 'path': str(file),
                       'sha256': file_hash, 'size': len(data), 'blob_ref': file_hash,
                       'vector_count': len(cases) if cases is not None else None,
                       'shape': 'array' if isinstance(value, list) else 'object',
                       'status': 'source-captured; execution not asserted'}
                vectors.append(row)
                files.append({**row, 'name': file.name, 'kind': 'conformance-vectors'})
        return {'schema': 'AletheiaNativeCatalogue/v1', 'id': str(uuid.uuid4()), 'observed_at': now(),
                'registry': {'path': str(registry), 'sha256': source_hash}, 'algorithms': algorithms,
                'vector_sets': vectors, 'files': files, 'unavailable_references': missing,
                'coverage': 'Native source bytes captured. Declared implementation and proof states are source assertions, not new conformance results.'}

    def search(self, source, text, limit=6):
        if source not in self.sources:
            raise ValueError('Unknown source alias')
        path = self.sources[source]
        if not path.is_file():
            raise FileNotFoundError('Source is not mounted: ' + str(path))
        words = re.findall(r'\w[\w-]*', text, re.UNICODE)[:12]
        if not words:
            raise ValueError('Search needs at least one word')
        match = ' AND '.join('"' + w.replace('"', '""') + '"' for w in words)
        limit = max(1, min(int(limit), 20))
        stat = path.stat()
        started = time.monotonic()
        db = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True, timeout=1)
        db.row_factory = sqlite3.Row
        try:
            db.execute('PRAGMA query_only=ON')
            db.set_progress_handler(lambda: int(time.monotonic() - started > 4), 10000)
            db.execute('BEGIN')
            tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if 'memory_fts' in tables and 'memory_items' in tables:
                # FTS finds native IDs; the indexed primary-key lookup retains the
                # full record rather than treating a search excerpt as its source.
                sql = 'SELECT item_id,title FROM memory_fts WHERE memory_fts MATCH ? LIMIT ?'
                hits = db.execute(sql, (match, limit)).fetchall()
                records = []
                lookup_sql = 'SELECT id,kind,content,summary,meta_json,parent_ids_json,tags_json,created_at,updated_at FROM memory_items WHERE id=?'
                for hit in hits:
                    row = db.execute(lookup_sql, (hit['item_id'],)).fetchone()
                    if row:
                        records.append({'id': row['id'], 'title': hit['title'], 'table': 'memory_items', 'native': dict(row)})
            elif 'turns_fts' in tables and 'turns' in tables:
                sql = '''SELECT t.*,tr.path AS source_path,tr.src_sha256 AS source_sha256
                         FROM turns_fts JOIN turns t ON t.id=turns_fts.rowid
                         JOIN transcripts tr ON tr.id=t.transcript_id
                         WHERE turns_fts MATCH ? LIMIT ?'''
                records = [{'id': str(r['id']), 'title': 'Turn ' + str(r['id']),
                            'table': 'turns', 'native': dict(r)} for r in db.execute(sql, (match, limit))]
            else:
                raise ValueError('Source has no supported native RLM or transcript index')
            schema = [dict(r) for r in db.execute("SELECT name,sql FROM sqlite_master WHERE type='table' AND name IN ('memory_items','memory_fts','turns','turns_fts','transcripts')")]
        finally:
            db.close()
        for record in records:
            record['native_serialization'] = canonical(record['native'])
            record['captured_record_sha256'] = digest(record['native_serialization'])
        capture = {
            'schema': 'AletheiaRLMQuery/v1', 'id': str(uuid.uuid4()), 'observed_at': now(),
            'source': {'alias': source, 'path': str(path), 'size': stat.st_size, 'mtime_ns': stat.st_mtime_ns},
            'query': {'text': text, 'sql': sql, 'parameters': [match, limit],
                      'native_lookup_sql': lookup_sql if 'memory_fts' in tables else None,
                      'native_lookup_parameters': [[r['id']] for r in records] if 'memory_fts' in tables else []},
            'source_schema': schema, 'records': records, 'elapsed_ms': round((time.monotonic() - started) * 1000),
            'coverage': 'Captured native result rows in a read transaction; no whole-database snapshot or original-file recapture is asserted.',
            'verification': 'captured-bytes-hashed; source assertions remain native source context',
        }
        capture['result_sha256'] = digest(canonical(records))
        capture['result_serialization'] = canonical(records)
        capture['hash_encoding'] = 'UTF-8 Python sorted-key compact JSON; native serialized bytes are retained explicitly'
        raw = canonical(capture)
        with self.connect() as own:
            own.execute('INSERT INTO captures VALUES (?,?,?,?)', (capture['id'], now(), raw, digest(raw)))
        return capture



    def source_snapshot(self, index):
        import io
        roots = [pathlib.Path(value) for value in self.profile.get('snapshots', [])]
        if index not in range(len(roots)): raise ValueError('Unknown authorized archive snapshot')
        root = roots[index]
        import re
        secret = re.compile(r'^(seed(_b64u)?|private_?key|secret_?key|auth_?token|access_?token|password|sk|priv)$', re.I)
        def private_fields(value):
            if isinstance(value,dict): return any(secret.match(k) or private_fields(v) for k,v in value.items())
            if isinstance(value,list): return any(private_fields(v) for v in value)
            return False
        files,excluded = [],[]
        for file in sorted(root.rglob('*')):
            if file.is_symlink():
                excluded.append({'path':str(file),'reason':'symbolic link; target bytes are not silently followed'})
                continue
            if not file.is_file(): continue
            raw = file.read_bytes()
            record = {'path':str(file),'name':str(file.relative_to(root)),'size':len(raw),'sha256':digest(raw),'kind':'source'}
            protected = file.suffix.lower() in ['.pem','.key'] or any(part.lower() in ['keys','.ssh'] for part in file.relative_to(root).parts)
            if file.suffix == '.json' and file.parent == root:
                try: protected = protected or private_fields(json.loads(raw))
                except (ValueError,UnicodeDecodeError): pass
            if protected:
                excluded.append({**record,'reason':'private key or secret-bearing identity document; original retained at source; raw bytes excluded from portable capture'})
                continue
            self.put_blob(record['sha256'],io.BytesIO(raw),len(raw));record['blob_ref']=record['sha256'];files.append(record)
        manifest = {'schema':'ProofBundleArchiveSourceSnapshot/v1','source_root':str(root),'source_scope':'User-supplied partial snapshot; no whole-archive completeness claim','observed_at':now(),'files':files,'excluded':excluded}
        manifest['id']='snapshot-'+digest(canonical({'root':str(root),'files':files,'excluded':excluded}))
        return manifest


    def begin_record_checkpoint(self, header):
        if header.get('schema') != 'AletheiaCustodySnapshot/v1': raise ValueError('Unsupported snapshot schema')
        ident = str(uuid.uuid4())
        with self.connect() as db:
            db.execute('INSERT INTO checkpoint_drafts VALUES (?,?,?)',(ident,now(),canonical(header)))
        return {'id':ident}

    def put_checkpoint_record(self, snapshot_id, kind, ordinal, raw_json):
        if kind not in ['artifacts','events','retained']: raise ValueError('Unknown checkpoint collection')
        if not isinstance(ordinal,int) or ordinal<0: raise ValueError('Invalid checkpoint ordinal')
        record=json.loads(raw_json)
        sha=digest(raw_json)
        if kind=='artifacts':
            ref=record.get('blob_ref')
            if ref:
                self.check_key(ref)
                with self.connect() as db: blob=db.execute('SELECT * FROM blobs WHERE key=?',(ref,)).fetchone()
                if not blob or not (self.blobs/ref).is_file() or blob['size']!=record.get('size') or blob['sha256']!=record.get('blob_sha256'):raise ValueError('Checkpoint artifact bytes mismatch')
            elif not record.get('missing_bytes'):raise ValueError('Artifact bytes need a reference or explicit absence')
        with self.connect() as db:
            if not db.execute('SELECT 1 FROM checkpoint_drafts WHERE id=?',(snapshot_id,)).fetchone():raise ValueError('Unknown checkpoint draft')
            prior=db.execute('SELECT sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal=?',(snapshot_id,kind,ordinal)).fetchone()
            if prior and prior['sha256']!=sha:raise ValueError('Checkpoint record cannot overwrite different bytes')
            if not prior:db.execute('INSERT INTO checkpoint_records VALUES (?,?,?,?,?,?)',(snapshot_id,kind,ordinal,record.get('id'),raw_json,sha))
        return {'sha256':sha,'kind':kind,'ordinal':ordinal,'bytes':len(raw_json.encode())}

    def put_checkpoint_records(self, snapshot_id, items):
        if not isinstance(items,list) or not 1<=len(items)<=100:raise ValueError('Checkpoint batch must contain 1..100 records')
        if sum(len(item['raw_json'].encode()) for item in items)>2*1024*1024:raise ValueError('Checkpoint batch exceeds 2 MiB')
        saved=[]
        with self.connect() as db:
            if not db.execute('SELECT 1 FROM checkpoint_drafts WHERE id=?',(snapshot_id,)).fetchone():raise ValueError('Unknown checkpoint draft')
            for item in items:
                kind,ordinal,raw=item['kind'],item['ordinal'],item['raw_json']
                if kind not in ['artifacts','events','retained'] or not isinstance(ordinal,int) or ordinal<0:raise ValueError('Invalid checkpoint member')
                record=json.loads(raw);sha=digest(raw)
                if kind=='artifacts':
                    ref=record.get('blob_ref')
                    if ref:
                        self.check_key(ref);blob=db.execute('SELECT * FROM blobs WHERE key=?',(ref,)).fetchone()
                        if not blob or not (self.blobs/ref).is_file() or blob['size']!=record.get('size') or blob['sha256']!=record.get('blob_sha256'):raise ValueError('Checkpoint artifact bytes mismatch')
                    elif not record.get('missing_bytes'):raise ValueError('Artifact bytes need a reference or explicit absence')
                prior=db.execute('SELECT sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal=?',(snapshot_id,kind,ordinal)).fetchone()
                if prior and prior['sha256']!=sha:raise ValueError('Checkpoint record cannot overwrite different bytes')
                if not prior:db.execute('INSERT INTO checkpoint_records VALUES (?,?,?,?,?,?)',(snapshot_id,kind,ordinal,record.get('id'),raw,sha))
                saved.append({'sha256':sha,'kind':kind,'ordinal':ordinal,'bytes':len(raw.encode())})
        return {'records':saved,'bytes':sum(r['bytes'] for r in saved)}

    def finish_record_checkpoint(self, snapshot_id, expected):
        import hashlib
        with self.connect() as db:
            row=db.execute('SELECT * FROM checkpoint_drafts WHERE id=?',(snapshot_id,)).fetchone()
            if not row:raise ValueError('Unknown checkpoint draft')
            header=json.loads(row['header_json']);counts={};chain=hashlib.sha256()
            for kind in ['artifacts','events','retained']:
                rows=db.execute('SELECT ordinal,sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? ORDER BY ordinal',(snapshot_id,kind))
                count=0
                for entry in rows:
                    if entry['ordinal']!=count:raise ValueError('Incomplete checkpoint collection')
                    chain.update((kind+':'+str(count)+':'+entry['sha256']+'\n').encode());count+=1
                if count!=expected.get(kind):raise ValueError('Checkpoint count mismatch')
                counts[kind]=count
            manifest={**header,'storage_layout':'record-checkpoint-v1','checkpoint_id':snapshot_id,'counts':counts,'records_sha256':chain.hexdigest(),'record_encoding':'UTF-8 original JavaScript JSON serialization; individual raw JSON strings retained'}
            raw=canonical(manifest)
            db.execute('INSERT INTO snapshots VALUES (?,?,?,?)',(snapshot_id,now(),raw,digest(raw)))
        return {'id':snapshot_id,'sha256':digest(raw),'saved_at':now(),'counts':counts,'storage_layout':'record-checkpoint-v1'}

    def checkpoint_record_page(self, snapshot_id, kind, offset=0, limit=20):
        if kind not in ['artifacts','events','retained']:raise ValueError('Unknown checkpoint collection')
        with self.connect() as db:
            rows=db.execute('SELECT ordinal,raw_json,sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal>=? ORDER BY ordinal LIMIT ?',(snapshot_id,kind,offset,min(20,max(1,limit))))
            return {'records':[dict(r) for r in rows]}

    def archive_manifest(self, snapshot_id):
        with self.connect() as db:
            row=db.execute('SELECT * FROM snapshots WHERE id=?',(snapshot_id,)).fetchone()
            if not row:raise ValueError('Unknown complete checkpoint')
            snapshot=json.loads(row['payload'])
            if snapshot.get('storage_layout')!='record-checkpoint-v1':raise ValueError('A record checkpoint is required')
            records=[];artifacts=[];missing=[]
            for kind in ['artifacts','events','retained']:
                for r in db.execute('SELECT * FROM checkpoint_records WHERE snapshot_id=? AND kind=? ORDER BY ordinal',(snapshot_id,kind)):
                    if digest(r['raw_json'])!=r['sha256']:raise ValueError('Checkpoint record integrity failure')
                    path=kind+'/'+str(r['ordinal'])+'.json'
                    records.append({'kind':kind,'ordinal':r['ordinal'],'id':r['record_id'],'path':path,'sha256':r['sha256']})
                    if kind=='artifacts':
                        artifact=json.loads(r['raw_json'])
                        if artifact.get('blob_ref'):artifacts.append({'artifact_id':artifact['id'],'path':'blobs/'+artifact['blob_ref'],'sha256':artifact['blob_sha256'],'size':artifact['size'],'blob_ref':artifact['blob_ref']})
                        else:missing.append(artifact['id'])
        state_raw=canonical(snapshot['state'])
        return {'archive_format_version':4,'storage_layout':'record-checkpoint-v1','checkpoint_id':snapshot_id,
                'state_sha256':snapshot['state_sha256'],'state_file':{'path':'state.json','sha256':digest(state_raw)},
                'counts':snapshot['counts'],'records_sha256':snapshot['records_sha256'],'records':records,'artifacts':artifacts,
                'coverage':{'artifacts':snapshot['counts']['artifacts'],'included_bytes':sum(a['size'] for a in artifacts),
                            'missing_artifacts':missing,'exclusions':['local private signing keys','secret-bearing source identity documents recorded as exclusions','authentication tokens not collected by the custody request recorder']}}

    def export_archive_zip(self, snapshot_id, bundle):
        import zipfile
        expected=self.archive_manifest(snapshot_id)
        if bundle.get('payload')!=expected:raise ValueError('Sealed archive manifest differs from retained checkpoint')
        directory=self.root/'exports';directory.mkdir(exist_ok=True,mode=0o700)
        target=directory/(snapshot_id+'.proofbundle.archive.zip')
        with self.connect() as db:
            row=db.execute('SELECT payload FROM snapshots WHERE id=?',(snapshot_id,)).fetchone()
            snapshot=json.loads(row['payload'])
            with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
                z.writestr('manifest.pb.json',canonical(bundle))
                z.writestr('state.json',canonical(snapshot['state']))
                for record in expected['records']:
                    row=db.execute('SELECT raw_json,sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal=?',(snapshot_id,record['kind'],record['ordinal'])).fetchone()
                    if digest(row['raw_json'])!=record['sha256']:raise ValueError('Checkpoint record changed during export')
                    z.writestr(record['path'],row['raw_json'])
                copied=set()
                for artifact in expected['artifacts']:
                    key=artifact['blob_ref']
                    if key in copied:continue
                    copied.add(key)
                    self.check_key(key)
                    z.write(self.blobs/key,artifact['path'])
        return {'path':str(target),'checkpoint_id':snapshot_id,'size':target.stat().st_size,'format':4}

    def inspect_archive_zip(self, path):
        import zipfile
        with zipfile.ZipFile(path) as z:
            if len(z.namelist())!=len(set(z.namelist())):raise ValueError('Duplicate archive entry names')
            if z.getinfo('manifest.pb.json').file_size>16*1024*1024:raise ValueError('Archive manifest is too large')
            bundle=json.loads(z.read('manifest.pb.json'))
        if bundle.get('hdr',{}).get('profile')!='PB-ARCHIVE-1' or bundle.get('payload',{}).get('archive_format_version')!=4:raise ValueError('Unsupported archive package')
        return {'bundle':bundle}

    def stage_archive_zip(self, path, verified_bundle):
        import zipfile,hashlib
        inspected=self.inspect_archive_zip(path)
        if inspected['bundle']!=verified_bundle:raise ValueError('Archive manifest changed after signature verification')
        payload=verified_bundle['payload']
        def hash_entry(z,name):
            h=hashlib.sha256()
            with z.open(name) as stream:
                while True:
                    chunk=stream.read(1024*1024)
                    if not chunk:break
                    h.update(chunk)
            return h.hexdigest()
        with zipfile.ZipFile(path) as z:
            if payload['state_file']['path']!='state.json' or hash_entry(z,'state.json')!=payload['state_file']['sha256']:raise ValueError('Archive state bytes mismatch')
            state=json.loads(z.read('state.json'))
            header={'schema':'AletheiaCustodySnapshot/v1','state':state,'state_sha256':payload['state_sha256']}
            draft=self.begin_record_checkpoint(header);counts={k:0 for k in ['artifacts','events','retained']};commit=hashlib.sha256()
            artifact_refs={a['artifact_id']:a for a in payload['artifacts']}
            for item in payload['records']:
                kind=item['kind'];ordinal=item['ordinal']
                if kind not in counts or ordinal!=counts[kind] or item['path']!=kind+'/'+str(ordinal)+'.json':raise ValueError('Archive collection ordering or path mismatch')
                if hash_entry(z,item['path'])!=item['sha256']:raise ValueError('Archive record bytes mismatch')
                raw=z.read(item['path']).decode('utf8')
                if kind=='artifacts':
                    record=json.loads(raw);ref=artifact_refs.get(record['id'])
                    if ref:
                        key=record.get('blob_ref');self.check_key(key)
                        if ref['path']!='blobs/'+key or ref['sha256']!=record['blob_sha256'] or ref['size']!=record['size']:raise ValueError('Archive blob reference mismatch')
                        if hash_entry(z,ref['path'])!=ref['sha256']:raise ValueError('Archive artifact bytes mismatch')
                        with z.open(ref['path']) as stream:self.put_blob(key,stream,ref['size'])
                    elif not record.get('missing_bytes'):raise ValueError('Archive omits artifact bytes')
                self.put_checkpoint_record(draft['id'],kind,ordinal,raw)
                commit.update((kind+':'+str(ordinal)+':'+item['sha256']+'\n').encode());counts[kind]+=1
            if counts!=payload['counts'] or commit.hexdigest()!=payload['records_sha256']:raise ValueError('Archive collection commitment mismatch')
            manifest={**header,'storage_layout':'record-checkpoint-v1','checkpoint_id':draft['id'],'counts':counts,'records_sha256':commit.hexdigest()}
            return {'id':draft['id'],'sha256':digest(canonical(verified_bundle)),'archive_id':verified_bundle['hdr']['bundle_id'],'snapshot':manifest}

    def checkpoint_record_info(self, snapshot_id, kind, ordinal, reader=False):
        with self.connect() as db:
            r=db.execute('SELECT raw_json,sha256 FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal=?',(snapshot_id,kind,ordinal)).fetchone()
        if not r:raise ValueError('Checkpoint record is missing')
        directory=self.root/'record-cache';directory.mkdir(exist_ok=True,mode=0o700)
        path=directory/(r['sha256']+'.json')
        if not path.exists():
            with path.open('x',encoding='utf8') as stream:stream.write(r['raw_json'])
        if not reader:return {'sha256':r['sha256'],'characters':len(r['raw_json'])}
        import codecs
        if not hasattr(self,'_record_readers'):self._record_readers={}
        ident=str(uuid.uuid4());self._record_readers[ident]={'file':path.open('rb'),'decoder':codecs.getincrementaldecoder('utf8')(),'offset':0,'characters':len(r['raw_json'])}
        return {'sha256':r['sha256'],'characters':len(r['raw_json']),'reader_id':ident}

    def checkpoint_record_chunk(self, snapshot_id, kind, ordinal, offset, limit=262144):
        with self.connect() as db:
            r=db.execute('SELECT substr(raw_json,?,?) AS chunk FROM checkpoint_records WHERE snapshot_id=? AND kind=? AND ordinal=?',(offset+1,min(262144,max(1,limit)),snapshot_id,kind,ordinal)).fetchone()
        if not r:raise ValueError('Checkpoint record is missing')
        return {'chunk':r['chunk'],'characters':len(r['chunk'])}


    def checkpoint_reader_chunk(self, reader_id, offset):
        reader=self._record_readers[reader_id]
        if offset!=reader['offset']:raise ValueError('Checkpoint reader position mismatch')
        raw=reader['file'].read(262144)
        text=reader['decoder'].decode(raw,final=not raw)
        reader['offset']+=len(text)
        done=reader['offset']==reader['characters']
        if done:reader['file'].close();del self._record_readers[reader_id]
        return {'chunk':text,'characters':len(text),'done':done}
