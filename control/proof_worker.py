#!/usr/bin/env python3
import fcntl, hashlib, json, os, pathlib, subprocess, time, urllib.request
ROOT=pathlib.Path(os.environ.get('PB_PROOF_ROOT','/proof')); BR=ROOT/'bridge'; STATE=BR/'state'; LEDGER=BR/'ledger.jsonl'; RECEIPTS=ROOT/'receipts'; MATRIX=ROOT/'control/REPOSITORY_MATRIX.json'
for p in (BR,STATE,RECEIPTS,ROOT/'repos',ROOT/'ots'): p.mkdir(parents=True,exist_ok=True)
def canon(x):return json.dumps(x,sort_keys=True,separators=(',',':'))
def sha(x):return hashlib.sha256((x if isinstance(x,bytes) else str(x).encode())).hexdigest()
def append(payload):
    req=urllib.request.Request('http://127.0.0.1:8788/events',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    try: urllib.request.urlopen(req,timeout=10).read()
    except Exception: pass
def parse_rows():
    out=[]
    if LEDGER.exists():
      for line in LEDGER.read_text(errors='replace').splitlines():
       try: out.append(json.loads(line))
       except Exception: pass
    return out
def merkle(hs):
    if not hs:return None
    level=[bytes.fromhex(h) for h in hs]
    while len(level)>1:
      level=[hashlib.sha256(level[i]+(level[i+1] if i+1<len(level) else level[i])).digest() for i in range(0,len(level),2)]
    return level[0].hex()
def checkpoint():
    rows=parse_rows(); hs=[r.get('record_sha256') for r in rows if r.get('record_sha256')]; segs=[]
    for i in range(0,len(hs),50):
      chunk=hs[i:i+50]; segs.append({'segment_index':i//50,'start_sequence':i+1,'end_sequence':i+len(chunk),'record_count':len(chunk),'segment_root':merkle(chunk)})
    root=merkle([s['segment_root'] for s in segs]) if segs else None
    old={}
    try:old=json.loads((STATE/'merkle.json').read_text())
    except Exception:pass
    state={'generated_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'last_sequence':len(rows),'segment_size':50,'segment_count':len(segs),'cumulative_merkle_root':root,'segments':segs,'ots':old.get('ots',{})}
    if root and len(rows)%50==0 and state['ots'].get(root) is None:
      target=ROOT/'ots'/f'bridge-{len(rows):09d}-{root}.sha256'; target.write_text(root+'\n')
      cp=subprocess.run([str(ROOT/'venv/bin/ots'),'stamp',str(target)],capture_output=True,text=True,timeout=120)
      state['ots'][root]={'status':'submitted' if cp.returncode==0 else 'error','sequence':len(rows),'file':str(target)+'.ots','output':(cp.stdout+cp.stderr)[-2000:]}
      append({'from':'proof-worker','message_type':'ots_checkpoint','payload':{'state':'submitted' if cp.returncode==0 else 'error','sequence':len(rows),'merkle_root':root,'receipt':str(target)+'.ots'}})
    tmp=STATE/'merkle.json.new'; tmp.write_text(json.dumps(state,indent=2)+'\n'); tmp.replace(STATE/'merkle.json')
def model_review(text):
    body={'model':'v4flash','messages':[{'role':'system','content':'You are a formal-proof build triage worker. Return a concise fault classification, evidence, and next repair.'},{'role':'user','content':text[-12000:]}],'temperature':0.1,'max_tokens':800}
    try:
      q=urllib.request.Request('http://127.0.0.1:8080/v1/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'}); return json.loads(urllib.request.urlopen(q,timeout=180).read()).get('choices',[{}])[0].get('message',{}).get('content')
    except Exception as e:return 'model-review-error: '+str(e)
def run_proof_build(item,dest):
    prover=item.get('prover')
    if prover=='lean':
      env={**os.environ,'PATH':'/home/pb/.elan/bin:'+os.environ.get('PATH','')}
      first=subprocess.run(['/home/pb/.elan/bin/lake','build'],cwd=dest,env=env,capture_output=True,text=True,timeout=900)
      if first.returncode:return first.returncode,(first.stdout+first.stderr)[-12000:],['lake','build']
      second=subprocess.run(['/home/pb/.elan/bin/lake','env','lean','Main.lean'],cwd=dest,env=env,capture_output=True,text=True,timeout=300)
      return second.returncode,(first.stdout+first.stderr+second.stdout+second.stderr)[-12000:],['lake','build','&&','lake','env','lean','Main.lean']
    if prover=='rocq':
      cmd=['docker','run','--rm','--user',f'{os.getuid()}:{os.getgid()}','-v',f'{dest}:/work','-w','/work','rocq/rocq-prover:9.0.1','make','all']
      cp=subprocess.run(cmd,capture_output=True,text=True,timeout=900)
      return cp.returncode,(cp.stdout+cp.stderr)[-12000:],cmd
    return 2,'unsupported prover: '+str(prover),[]
def production_cycle():
    stats={'updated_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'matrix_present':MATRIX.exists(),'repositories':0,'checked':0,'synced':0,'build_executed':0,'passed':0,'failed':0,'model_endpoint':False}
    try: urllib.request.urlopen('http://127.0.0.1:8080/health',timeout=5); stats['model_endpoint']=True
    except Exception:pass
    if MATRIX.exists():
      matrix=json.loads(MATRIX.read_text()).get('repositories',[]); stats['repositories']=len(matrix)
      cursor_file=STATE/'worker-cursor'; cursor=int(cursor_file.read_text()) if cursor_file.exists() else 0
      if matrix:
       item=matrix[cursor%len(matrix)]; repo=item['repository']; dest=ROOT/'repos'/repo
       url='https://github.com/proofbundle/'+repo+'.git'
       if not dest.exists(): cp=subprocess.run(['git','clone','--depth','1',url,str(dest)],capture_output=True,text=True,timeout=180)
       else: cp=subprocess.run(['git','-C',str(dest),'pull','--ff-only'],capture_output=True,text=True,timeout=90)
       stats['checked']=1; synced=cp.returncode==0; stats['synced']=int(synced)
       build_rc,build_output,build_command=(99,'sync failed',[])
       if synced:
        build_rc,build_output,build_command=run_proof_build(item,dest); stats['build_executed']=1
       ok=synced and build_rc==0; stats['passed']=int(ok); stats['failed']=int(not ok)
       payload={'state':'proof_build_passed' if ok else ('proof_build_failed' if synced else 'repository_sync_failed'),'repository':repo,'prover':item['prover'],'algorithm_id':item['algorithm_id'],'sync_output':(cp.stdout+cp.stderr)[-4000:],'build_command':build_command,'build_exit_code':build_rc,'build_output':build_output}
       if not ok and stats['model_endpoint']:payload['model_review']=model_review(payload['output'])
       append({'from':'vm-proof-worker','message_type':'code','payload':payload}); cursor_file.write_text(str((cursor+1)%len(matrix)))
    tmp=STATE/'proof-production.json.new'; tmp.write_text(json.dumps(stats,indent=2)+'\n'); tmp.replace(STATE/'proof-production.json')
if __name__=='__main__':
  append({'from':'vm-proof-worker','message_type':'agent_status','payload':{'state':'online','model':'v4flash','task':'continuous Lean/Rocq algorithm proof production'}})
  while True:
   try: production_cycle(); checkpoint()
   except Exception as e: append({'from':'vm-proof-worker','message_type':'error','payload':{'state':'cycle_failed','error':str(e)}})
   time.sleep(60)
