#!/usr/bin/env python3
import argparse, fcntl, hashlib, json, os, pathlib, subprocess, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT=pathlib.Path(os.environ.get('PB_PROOF_ROOT','/proof'))
BRIDGE=ROOT/'bridge'; LEDGER=BRIDGE/'ledger.jsonl'; STATE=BRIDGE/'state'; RECEIPTS=ROOT/'receipts'; REPOS=ROOT/'repos'
for p in (BRIDGE,STATE,RECEIPTS,REPOS): p.mkdir(parents=True,exist_ok=True)

def canon(v): return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def sha(v): return hashlib.sha256((v if isinstance(v,bytes) else str(v).encode())).hexdigest()
def rows():
    out=[]
    if not LEDGER.exists(): return out
    with LEDGER.open(errors='replace') as f:
        for line in f:
            try: out.append(json.loads(line))
            except Exception: pass
    return out
def verify_rows(rr):
    errors=[]; expected_prev=None; expected_sequence=1
    for line_number,r in enumerate(rr,1):
        recorded=r.get('record_sha256'); core=dict(r); core.pop('record_sha256',None)
        computed=sha(canon(core))
        if recorded != computed: errors.append({'line':line_number,'sequence':r.get('sequence'),'kind':'record_sha256','recorded':recorded,'computed':computed})
        predecessor=(r.get('continuity') or {}).get('predecessor_sha256')
        if predecessor != expected_prev: errors.append({'line':line_number,'sequence':r.get('sequence'),'kind':'predecessor','recorded':predecessor,'expected':expected_prev})
        if r.get('sequence') != expected_sequence: errors.append({'line':line_number,'sequence':r.get('sequence'),'kind':'sequence','expected':expected_sequence})
        payload_hash=sha(canon(r.get('payload')))
        if r.get('payload_sha256') != payload_hash: errors.append({'line':line_number,'sequence':r.get('sequence'),'kind':'payload_sha256','recorded':r.get('payload_sha256'),'computed':payload_hash})
        expected_prev=recorded; expected_sequence += 1
    return {'valid':not errors,'checked_records':len(rr),'error_count':len(errors),'errors':errors[:100],'tip_sha256':expected_prev}
def append_event(payload):
    BRIDGE.mkdir(parents=True,exist_ok=True)
    with LEDGER.open('a+',encoding='utf-8') as f:
        fcntl.flock(f,fcntl.LOCK_EX); f.seek(0); prev=None; seq=0
        for line in f:
            try: r=json.loads(line); prev=r.get('record_sha256'); seq=int(r.get('sequence',seq))
            except Exception: continue
        core={'schema':'ProofBundleBridgeEvent/v2','sequence':seq+1,'created_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'from':str(payload.get('from') or 'unknown'),'to':str(payload.get('to') or 'all'),'message_type':str(payload.get('message_type') or payload.get('type') or 'activity'),'continuity':{'predecessor_sha256':prev},'payload':payload.get('payload') if isinstance(payload.get('payload'),dict) else payload}
        core['payload_sha256']=sha(canon(core['payload'])); core['record_sha256']=sha(canon(core)); f.write(canon(core)+'\n'); f.flush(); os.fsync(f.fileno()); fcntl.flock(f,fcntl.LOCK_UN)
    return core
def load_json(p,default=None):
    try:return json.loads(p.read_text())
    except Exception:return default
def snapshot(limit=250):
    rr=rows(); tail=rr[-limit:]; agents={}; verification=verify_rows(rr)
    for r in rr:
        p=r.get('payload') or {}; aid=r.get('from') or p.get('agent_id')
        if aid: agents[aid]={'id':aid,'last_seen':r.get('created_at_utc'),'state':p.get('state') or p.get('status') or 'active','model':p.get('model'),'repository':p.get('repository') or p.get('repo'),'task':p.get('task') or p.get('summary')}
    merkle=load_json(STATE/'merkle.json',{}) or {}; proof=load_json(STATE/'proof-production.json',{}) or {}; tunnel=load_json(STATE/'local-link.json',{}) or {}
    return {'schema':'ProofBundleBridgeSnapshot/v2','generated_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'entries':len(rr),'tip':rr[-1] if rr else None,'ledger_verification':verification,'events':tail,'agents':list(agents.values()),'merkle':merkle,'proof_production':proof,'local_link':tunnel}

class H(BaseHTTPRequestHandler):
    def sendj(self,status,obj):
        raw=json.dumps(obj,ensure_ascii=False).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','content-type'); self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS'); self.end_headers(); self.wfile.write(raw)
    def do_OPTIONS(self): self.sendj(200,{})
    def do_GET(self):
        u=urlparse(self.path); q=parse_qs(u.query)
        if u.path=='/health': return self.sendj(200,{'status':'ok','service':'proofbundle-bridge','version':'2.0','proof_root':str(ROOT)})
        if u.path=='/verify':
            rr=rows(); result=verify_rows(rr); return self.sendj(200 if result['valid'] else 409,result)
        if u.path in ('/snapshot','/workspace'): return self.sendj(200,snapshot(int(q.get('limit',['250'])[0])))
        if u.path=='/lineage/export':
            s=snapshot(500); return self.sendj(200,{'entries':s['events'],'tip_hash':(s['tip'] or {}).get('record_sha256'),'merkle_root':s['merkle'].get('cumulative_merkle_root')})
        if u.path=='/events':
            after=int(q.get('after',['0'])[0]); return self.sendj(200,{'events':[r for r in rows() if int(r.get('sequence',0))>after]})
        if u.path=='/code':
            repo=(q.get('repo') or [''])[0]; p=(REPOS/repo).resolve()
            if not repo or REPOS.resolve() not in p.parents: return self.sendj(400,{'error':'invalid repo'})
            try:
                log=subprocess.run(['git','-C',str(p),'log','--oneline','-12'],capture_output=True,text=True,timeout=10).stdout
                diff=subprocess.run(['git','-C',str(p),'diff','--stat'],capture_output=True,text=True,timeout=10).stdout
                return self.sendj(200,{'repo':repo,'log':log,'diff_stat':diff})
            except Exception as e:return self.sendj(500,{'error':str(e)})
        return self.sendj(404,{'error':'not found'})
    def do_POST(self):
        n=int(self.headers.get('Content-Length','0')); raw=self.rfile.read(n)
        try: body=json.loads(raw or b'{}')
        except Exception:return self.sendj(400,{'error':'invalid json'})
        if self.path in ('/events','/append'):
            try:return self.sendj(201,append_event(body))
            except Exception as e:return self.sendj(500,{'error':str(e)})
        return self.sendj(404,{'error':'not found'})
    def log_message(self,fmt,*args): pass

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--listen',default='127.0.0.1'); ap.add_argument('--port',type=int,default=8788); a=ap.parse_args(); ThreadingHTTPServer((a.listen,a.port),H).serve_forever()
