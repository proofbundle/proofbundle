"""Verified encrypted relay over existing lane-bus; no private material in HTTP output."""
import datetime,fcntl,hashlib,json,os,pathlib,re,subprocess
import identity_gate
HOME=pathlib.Path.home();BUS=HOME/'pb/live/bus';STORE=HOME/'pb/live/verified-relay';STORE.mkdir(parents=True,exist_ok=True)
def canon(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False)
def records():
 with open(BUS/'messages.ndjson') as f:return [json.loads(l) for l in f if l.strip()]
def attestations():
 r=subprocess.run([str(HOME/'pb/bin/pb-bridge-attest'),'status'],capture_output=True,text=True,timeout=10,check=True)
 return json.loads(r.stdout)
def agents():
 result=[]
 for p in (HOME/'.proofbundle/agent').glob('*/communication-binding.json'):
  if p.parent.name.startswith('proofbundle-relay-test-'):continue
  try:result.append(identity_gate.identity(p.parent.name))
  except ValueError:continue
 return result

def submit(envelope):
 verified=identity_gate.verify_request(envelope)
 if not verified.get('accepted'):raise ValueError('verifier rejected payload')
 rid=verified['request_id']
 if not isinstance(rid,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,160}',rid):raise ValueError('invalid request ID')
 digest=hashlib.sha256(canon(envelope).encode()).hexdigest()
 with open(STORE/'.lock','a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX)
  for r in records():
   if r.get('kind')=='verified-envelope':
    b=json.loads(r['body'])
    if b.get('request_id')==rid:
     if b.get('request_sha256')!=digest:raise ValueError('request ID reused with different bytes')
     return {'ok':True,'accepted':True,'seq':r['seq'],'hash':r['hash'],'duplicate':True,'receipt':b['receipt'],'recipient_envelope':b['recipient_envelope']}
  artifact={'schema':'ProofBundleVerifiedCommunication/v1','request_id':rid,'request_sha256':digest,'request_envelope':envelope,**verified}
  body=canon(artifact);path=STORE/(rid+'.json')
  if path.exists():
   prior=json.loads(path.read_text())
   if prior['request_sha256']!=digest:raise ValueError('stored request ID collision')
  else:
   fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
   with os.fdopen(fd,'w') as f:f.write(body)
  cmd=[str(HOME/'pb/bin/pb-lane-bus'),'send','--from',verified['from'],'--to',verified['to'],'--kind','verified-envelope','--subject','verified encrypted communication','--body-file',str(path),'--ref',digest]
  result=subprocess.run(cmd,capture_output=True,text=True,timeout=30,check=True)
  seq=int(re.search(r'seq (\d+)',result.stdout).group(1));r=next(r for r in records() if r['seq']==seq)
  return {'ok':True,'accepted':True,'seq':seq,'hash':r['hash'],'duplicate':False,'receipt':json.loads(r['body'])['receipt'],'recipient_envelope':json.loads(r['body'])['recipient_envelope'],'attestation':'pending background OTS'}

def send(frm,to,subject,body,reply_to=None):
 env=identity_gate.seal_request(frm,to,{'subject':subject,'body':body,'reply_to':reply_to})
 return submit(env)
def inbox(agent_id):
 identity_gate.identity(agent_id)
 return {'agent_id':agent_id,'records':[r for r in records() if r.get('kind')=='verified-envelope' and agent_id in r.get('to',[])]}
def lineage():
 recs=records();entries=[]
 for r in recs:
  entries.append({'sequence':r['seq'],'from':r['src'],'to':','.join(r.get('to',[])),'message_type':r['kind'],'payload_sha256':r.get('body_sha256'),'record_sha256':r['hash'],'created_at_utc':r['ts'],'continuity':{'predecessor_sha256':r['prev_hash']},'payload':{'message':'Encrypted verified payload' if r['kind']=='verified-envelope' else r['subject']}})
 a=attestations();return {'entries':entries,'tip_hash':recs[-1]['hash'] if recs else 'genesis','merkle_root':(a.get('latest_root') or {}).get('root'),'attestations':a}
def snapshot():
 data=lineage();aa=agents();a=data['attestations']
 return {'agents':[{'id':x['agent_id'],'state':'registered','task':'AIBOM signature and identity binding verified','last_seen':x['binding'].get('created_at','')} for x in aa],'events':data['entries'][-250:],'tip':data['entries'][-1] if data['entries'] else None,'merkle':{'cumulative_merkle_root':data['merkle_root'],'segment_count':a['root_files'],'ots':{'sequence_proofs':a['sequence_proofs'],'status':a['status']}},'proof_production':{}}

def tracker():
 recs=records();a=attestations();root=HOME/'pb/live/conversation-worker'
 def read(path):
  try:return json.loads(path.read_text())
  except (OSError,ValueError):return {}
 st=read(root/'state.json');worker=read(root/'status.json')
 qwen=[]
 for path in (HOME/'pb/live/qwen-inbox').glob('*.poll.json'):
  row=read(path);qwen.append({'agent_id':path.name[:-10],'ok':row.get('ok'),'last_poll':row.get('observed_at'),'last_notified':row.get('last_notified'),'seen':len(row.get('seen',[])),'delivery_status':row.get('delivery_status')})
 traffic=[]
 for r in recs[-150:]:
  b=json.loads(r['body']) if r['kind']=='verified-envelope' else {}
  traffic.append({'seq':r['seq'],'ts':r['ts'],'from':r['src'],'to':r['to'],'kind':b.get('receipt',{}).get('delivery_kind',r['kind']),'hash':r['hash'],'receipt_verified':b.get('accepted',False),'ots':(BUS/'ots/preimage-v1'/('sequence-%08d.json.ots'%r['seq'])).exists(),'encrypted':r['kind']=='verified-envelope'})
 delivered=st.get('operator_deliveries',{})
 counts={}
 for item in delivered.values():counts[item['recipient']]=counts.get(item['recipient'],0)+1
 return {'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'tip':recs[-1]['seq'] if recs else 0,'agents':agents(),'attestations':a,'pending_sequence_proofs':max(0,len(recs)-a['sequence_proofs']),'capture_status':worker,'operator_deliveries':counts,'notification_count':len(st.get('notifications',{})),'qwen':qwen,'traffic':traffic}
