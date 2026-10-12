"""Native registry -> immutable source capture -> actual provider execution.
Source declarations remain untouched. Execution and standard-reference probes are separate.
"""
import base64,struct,ast,concurrent.futures,hashlib,io,json,pathlib,subprocess,time,uuid,os,tempfile,sqlite3
REGISTRY=pathlib.Path('/home/falsealias/pb/ProofBundle-Crypto-Skeletons/ALGORITHM_REGISTRY.json')
RUNNER=pathlib.Path(__file__).with_name('linked_case_runner.py').resolve()
def sha(raw):return hashlib.sha256(raw).hexdigest()
def extract(raw,path):
 if path.suffix=='.txt':
  result=[]
  for n,line in enumerate(raw.decode().splitlines()):
   if '|' not in line or line.lstrip().startswith('#'):continue
   left,right=(s.strip() for s in line.split('|',1))
   try:bytes.fromhex(left);bytes.fromhex(right)
   except ValueError:continue
   result.append({'id':'line-'+str(n+1),'input_hex':left,'expected_output_hex':right})
  return result
 try:value=json.loads(raw)
 except (ValueError,UnicodeDecodeError):return []
 def walk(v):
  if isinstance(v,list):
   for x in v:
    if isinstance(x,dict) and any(k in x for k in ['expected','expected_behavior','expected_output_hex','expected_digest_hex','plaintext','input_hex']):yield x
    else:yield from walk(x)
  elif isinstance(v,dict):
   if any(k in v for k in ['expected','expected_behavior','expected_output_hex','expected_digest_hex']) and any(k in v for k in ['input','data_hex','key','plaintext','input_hex']):
    yield v
    return
   for k in ['vectors','test_vectors','cases','tests','categories']:
    if k in v:yield from walk(v[k])
   if not any(k in v for k in ['vectors','test_vectors','cases','tests','categories']):
    for x in v.values():
     if isinstance(x,(list,dict)):yield from walk(x)
 return list(walk(value))
def native_commitment(raw,chunk_size=1048576):
 leaves=[hashlib.sha256(b'\0'+raw[i:i+chunk_size]).digest() for i in range(0,max(1,len(raw)),chunk_size)]
 chunks=len(leaves)
 while len(leaves)>1:leaves=[hashlib.sha256(b'\1'+leaves[i]+leaves[i+1]).digest() if i+1<len(leaves) else leaves[i] for i in range(0,len(leaves),2)]
 return {'root_b64u':base64.urlsafe_b64encode(leaves[0]).decode().rstrip('='),'chunks':chunks,'content_address':hashlib.sha3_384(b'artifact.content\0'+struct.pack('<Q',len(raw))+raw).hexdigest(),'provider':'Python hashlib; native ProofBundle byte domains and odd-node promotion'}

def capture(store,path,kind,algorithm_id=None):
 raw=path.read_bytes();key=sha(raw)
 existing=store.blobs/key
 if existing.is_file():
  if sha(existing.read_bytes())!=key:raise ValueError('Captured source blob integrity failure')
  with store.connect() as db: prior=db.execute('SELECT sha256,size FROM blobs WHERE key=?',(key,)).fetchone()
  if prior and (prior['sha256']!=key or prior['size']!=len(raw)):raise ValueError('Captured source blob metadata mismatch')
  if not prior:
   if hasattr(store,'_source_capture_pending'):store._source_capture_pending[key]=raw
   else:store.put_blob(key,io.BytesIO(raw),len(raw))
 else:
  if hasattr(store,'_source_capture_pending'):store._source_capture_pending[key]=raw
  else:store.put_blob(key,io.BytesIO(raw),len(raw))
 return {'path':str(path),'name':path.name,'sha256':key,'blob_ref':key,'size':len(raw),'kind':kind,'algorithm_id':algorithm_id,'native_commitment':native_commitment(raw)}
def flush_sources(store):
 pending=list(store._source_capture_pending.items())
 def write(item):
  key,raw=item
  target=store.blobs/key
  if target.exists():
   if sha(target.read_bytes())!=key:raise ValueError('Existing source bytes differ')
   return key,len(raw)
  fd,name=tempfile.mkstemp(prefix='.source-',dir=store.blobs)
  try:
   with os.fdopen(fd,'wb') as f:f.write(raw);f.flush();os.fsync(f.fileno())
   target=store.blobs/key
   if target.exists():
    if sha(target.read_bytes())!=key:raise ValueError('Existing source bytes differ')
   else:os.replace(name,target)
  finally:pathlib.Path(name).unlink(missing_ok=True)
  return key,len(raw)
 for offset in range(0,len(pending),100):
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:written=list(pool.map(write,pending[offset:offset+100]))
  fd=os.open(store.blobs,os.O_DIRECTORY)
  try:os.fsync(fd)
  finally:os.close(fd)
  db=sqlite3.connect(store.database,timeout=120);db.row_factory=sqlite3.Row
  try:
   db.execute('PRAGMA synchronous=FULL')
   with db:
    db.execute('BEGIN IMMEDIATE')
    for key,size in written:
     prior=db.execute('SELECT sha256,size FROM blobs WHERE key=?',(key,)).fetchone()
     if prior and (prior['sha256']!=key or prior['size']!=size):raise ValueError('Immutable source reference conflict')
     if not prior:db.execute('INSERT INTO blobs VALUES (?,?,?,?)',(key,key,size,time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())))
  finally:db.close()
 del store._source_capture_pending

def run_linked(store):
 store._source_capture_pending={}
 raw=REGISTRY.read_bytes();registry=capture(store,REGISTRY,'algorithm-registry');algorithms=json.loads(raw)
 dispatcher=capture(store,pathlib.Path(__file__).resolve(),'execution-dispatcher')
 files=[registry,dispatcher];jobs=[];mappings=[]
 for a in algorithms:
  root=pathlib.Path(a['repoPath']);providers=[];vector_files=[];cases=[]
  for p in sorted((root/'src').rglob('*')):
   if p.is_file() and p.suffix in ['.py','.js','.mjs','.c','.h','.rs','.toml']:
    providers.append(capture(store,p,'implementation-source',a['id']))
  paths={root/p for p in a.get('testVectorPaths',[]) if (root/p).is_file()}
  paths.update(p for p in (root/'vectors').rglob('*') if p.is_file() and p.suffix in ['.json','.txt'])
  for p in sorted(paths):
   f=capture(store,p,'conformance-vectors',a['id']);vs=extract(p.read_bytes(),p);f['vector_count']=len(vs);vector_files.append(f)
   for i,v in enumerate(vs):cases.append({'index':i,'label':v.get('id',v.get('name',str(i))),'source_path':f['path'],'source_sha256':f['sha256'],'vector':v})
  determinations=[]
  for p in sorted((root/'ground-truths').rglob('*')):
   if p.is_file() and p.suffix in ['.json','.md']:determinations.append(capture(store,p,'source-determination',a['id']))
  primary=next((p for p in providers if p['path'].endswith('.py') and not p['path'].endswith('/__init__.py')),None)
  mapping={'algorithm_id':a['id'],'source_determination':a,'registry_sha256':registry['sha256'],'providers':providers,'selected_provider':primary,'vector_files':vector_files,'determination_files':determinations,'cases_captured':len(cases),'missing_declared_vectors':[str(root/p) for p in a.get('testVectorPaths',[]) if not (root/p).is_file()]}
  mappings.append(mapping);files.extend(providers+vector_files+determinations);jobs.append((mapping,cases))
 runner_raw=RUNNER.read_bytes();runner=capture(store,RUNNER,'execution-adapter');files.append(runner)
 flush_sources(store)
 def execute(job):
  mapping,cases=job;primary=mapping['selected_provider'];row={'algorithm_id':mapping['algorithm_id'],'provider':primary,'provider_runtime':'Python 3; bubblewrap no-network/read-only filesystem','adapter_sha256':runner['sha256'],'cases':[],'independent_probes':[]}
  if primary:
   # Only captured bytes are executed. No access to source/private keys/network/writeable host paths.
   package={'algorithm_id':mapping['algorithm_id'],'provider_path':'/provider.py','provider_sha256':primary['sha256'],'cases':cases}
   command=['bwrap','--unshare-all','--die-with-parent','--new-session','--ro-bind','/usr','/usr','--ro-bind','/lib','/lib','--ro-bind','/lib64','/lib64','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--ro-bind',str(store.blobs/primary['blob_ref']),'/provider.py','--ro-bind',str(store.blobs/runner['blob_ref']),'/runner.py','/usr/bin/python3','-B','/runner.py']
   try:
    p=subprocess.run(command,input=json.dumps(package).encode(),capture_output=True,timeout=20)
    if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[:1000])
    row.update(json.loads(p.stdout))
   except Exception as e:row['provider_error']=str(e)
  else:row['provider_error']='No Python entry point captured; other language implementations retain their paths and hashes'
  if not row['cases']:
   row['cases']=[{k:v[k] for k in ['index','label','source_path','source_sha256']}|{'standing':'blocked','executed':False,'expected':v['vector'].get('expected',v['vector'].get('expected_behavior')),'actual':None,'reason':row.get('provider_error','Provider unavailable')} for v in cases]
  row['totals']={k:sum(v['standing']==k for v in row['cases']) for k in ['passed','failed','observed','blocked']};row['executed']=sum(v['executed'] for v in row['cases']);return row
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(execute,jobs))
 report={'schema':'ProofBundleLinkedConformance/v1','id':str(uuid.uuid4()),'observed_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'registry':registry,'adapter':runner,'dispatcher':dispatcher,'algorithms':mappings,'files':files,'results':results,'scope':'One explicitly adapted Python provider per registry algorithm. All captured language sources remain linked. Source-answer comparisons, behavioral observations, and independent reference probes are distinct; no source proof declaration is promoted by execution.'}
 report['totals']={k:sum(r['totals'][k] for r in results) for k in ['passed','failed','observed','blocked']};report['totals'].update(executed=sum(r['executed'] for r in results),captured=sum(len(r['cases']) for r in results),algorithms_with_execution=sum(r['executed']>0 for r in results),providers_loaded=sum('provider_error' not in r for r in results))
 repo=pathlib.Path(__file__).resolve().parents[1]
 digest_sources=[capture(store,p,'ProofBundle-runtime-source') for p in sorted((repo/'src/digest').glob('*.mjs'))]
 digest_sources.append(capture(store,repo/'desktop/linked-digest-runner.mjs','execution-adapter'))
 files.extend(digest_sources)
 jobs=[{'algorithm_id':m['algorithm_id'],'vector_files':[{**f,'blob_path':str(store.blobs/f['blob_ref'])} for f in m['vector_files']]} for m in mappings]
 p=subprocess.run(['node',str(repo/'desktop/linked-digest-runner.mjs')],input=json.dumps({'jobs':jobs,'provider_sources':digest_sources}).encode(),capture_output=True,timeout=120)
 if p.returncode:raise RuntimeError(p.stderr.decode(errors='replace')[:1000])
 report['proofbundle_digest_execution']={**json.loads(p.stdout),'provider_sources':digest_sources}
 probes=[p for r in results for p in r['independent_probes']];report['independent_probe_totals']={k:sum(p['standing']==k for p in probes) for k in ['passed','failed','blocked']}
 out=store.root/'linked-conformance';out.mkdir(exist_ok=True);receipt=out/(report['id']+'.json')
 with receipt.open('w') as f:
  json.dump(report,f,separators=(',',':'));f.flush();os.fsync(f.fileno())
 fd=os.open(out,os.O_DIRECTORY)
 try:os.fsync(fd)
 finally:os.close(fd)
 report['receipt_path']=str(receipt)
 return report
