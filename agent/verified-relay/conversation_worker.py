#!/usr/bin/env python3
"""Capture exact native JSONL records encrypted; notify existing conversations via Unix WS.

No keys, plaintext records, or ciphertexts are printed. Source files are read-only.
Capture batches never notify agents. Directed verified messages generate one notice.
"""
import argparse,asyncio,base64,fcntl,hashlib,json,os,pathlib,time,urllib.request,datetime
import websockets
import identity_gate
from cline_source import message_spans

HOME=pathlib.Path.home()
STATE=HOME/'pb/live/conversation-worker'
BUS=HOME/'pb/live/bus/messages.ndjson'
API='http://127.0.0.1:8791'

def atom(path,data):
    temp=path.with_name(path.name+'.new')
    fd=os.open(temp,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    with os.fdopen(fd,'w') as f:
        json.dump(data,f);f.flush();os.fsync(f.fileno())
    os.replace(temp,path)

def request(route,value):
    b=json.dumps(value).encode()
    req=urllib.request.Request(API+route,data=b,headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)

def operator_fanout(config,state):
    with urllib.request.urlopen(API+'/api/agents',timeout=30) as r:agents=json.load(r)['registered']
    agent_ids=[a['agent_id'] for a in agents]
    done=state.setdefault('operator_deliveries',{})
    floor=state.setdefault('operator_notify_from',time.time())
    count=0
    for source in config['sources']:
        offset=0
        with open(source['path'],'rb') as f:
            if source.get('transport')=='cline':
                raw=f.read();json.loads(raw)
                items=message_spans(raw)
            else:items=((None,line,None) for line in f)
            for native_start,line,native_row in items:
                start=offset;offset+=len(line)
                if native_start is not None:start=native_start
                elif not line.endswith(b'\n'):break
                row=native_row if native_row is not None else json.loads(line);p=row.get('payload',{})
                if source.get('transport')=='cline':
                    if row.get('role')!='user':continue
                    content=row.get('content',[])
                    # Native tool results use role=user too, but are not operator input.
                    if not content or any(i.get('type')!='text' for i in content):continue
                    text='\n'.join(i.get('text','') for i in content)
                    visible=text.split('>',1)[-1] if text.startswith('<user_input ') else text
                    if ('This is a peer notification' in text or
                        visible.startswith(('Encrypted ProofBundle inbox','ProofBundle relay notification from Codex lane B'))):continue
                    created=row.get('ts',0)/1000
                elif source.get('transport')=='qwen':
                    message=row.get('message',{})
                    if row.get('type')!='user' or message.get('role')!='user':continue
                    content=message.get('content',message.get('parts',[]))
                    text=content if isinstance(content,str) else '\n'.join(i.get('text','') for i in content if isinstance(i,dict))
                    if '<cross_session_message' in text:continue
                    stamp=row.get('timestamp','')
                    try:created=datetime.datetime.fromisoformat(stamp.replace('Z','+00:00')).timestamp()
                    except (ValueError,AttributeError):created=0
                else:
                    if row.get('type')!='response_item' or p.get('type')!='message' or p.get('role')!='user':continue
                    meta=p.get('internal_chat_message_metadata_passthrough') or {}
                    if 'user.text' not in meta.get('content_item_kinds',[]):continue
                    text='\n'.join(i.get('text','') for i in p.get('content',[]))
                    created=meta.get('create_time',0)
                if text.startswith('<codex_delegation>') or text.startswith('ProofBundle encrypted message available:'):continue
                digest=hashlib.sha256(line).hexdigest()
                for recipient in agent_ids:
                    label=source['thread_id']+':'+digest+':'+recipient
                    if label in done:continue
                    filename=hashlib.sha256(label.encode()).hexdigest()+'.operator.pending.json'
                    pending=STATE/filename
                    if pending.exists():envelope=json.loads(pending.read_text())
                    else:
                        payload={'type':'operator-message','notify':created>=floor,
                                 'witness_agent':config['witness_agent'],'source_thread':source['thread_id'],
                                 'source_path':source['path'],'source_offset':start,'source_sha256':digest,
                                 'raw_base64':base64.b64encode(line).decode(),
                                 'attribution':'Agent witnessed exact native user record; operator did not cryptographically sign this capture.'}
                        if source.get('transport')=='cline':
                            payload.update(source_format='cline-native-json-message-span',source_snapshot_sha256=hashlib.sha256(raw).hexdigest())
                        envelope=identity_gate.seal_request(config['witness_agent'],recipient,payload)
                        atom(pending,envelope)
                    accepted=request('/api/envelope/submit',{'envelope':envelope})
                    if not accepted.get('accepted'):raise ValueError('operator fanout not accepted')
                    done[label]={'seq':accepted['seq'],'recipient':recipient}
                    atom(STATE/'state.json',state);count+=1
                    if count>=16:return

def capture(source,witness,cursor,state):
    if source.get('transport')=='cline':return capture_cline(source,witness,cursor,state)
    path=pathlib.Path(source['path'])
    with path.open('rb') as f:
        start=cursor.get('offset',0)
        if path.stat().st_size<start:raise ValueError('source truncated; refusing to reset cursor')
        if cursor.get('last_start') is not None:
            f.seek(cursor['last_start']);last=f.read(start-cursor['last_start'])
            if hashlib.sha256(last).hexdigest()!=cursor['last_sha256']:raise ValueError('captured source range changed')
        f.seek(start);rows=[];size=0
        while len(rows)<32 and size<196608:
            offset=f.tell();line=f.readline()
            if not line or not line.endswith(b'\n'):break
            # Exact bytes incl. LF are encrypted, not parsed/reserialized.
            rows.append({'offset':offset,'bytes':len(line),'sha256':hashlib.sha256(line).hexdigest(),
                         'raw_base64':base64.b64encode(line).decode()})
            size+=len(line)
        if not rows:return False
        end=rows[-1]['offset']+rows[-1]['bytes']
    ident=hashlib.sha256((str(path)+':'+str(start)+':'+str(end)+':'+rows[-1]['sha256']).encode()).hexdigest()
    pending=STATE/(ident+'.pending.json')
    if pending.exists():envelope=json.loads(pending.read_text())
    else:
        payload={'type':'transcript-witness','notify':False,'witness_agent':witness,'source_thread':source['thread_id'],
                 'source_path':str(path),'start':start,'end':end,'records':rows,
                 'attribution':'Witness signature attests capture; it is not an operator signature or proof of authorship.'}
        envelope=identity_gate.seal_request(witness,source['agent_id'],payload)
        atom(pending,envelope)
    result=request('/api/envelope/submit',{'envelope':envelope})
    if not result.get('accepted'):raise ValueError('capture not accepted')
    cursor.update(offset=end,last_start=rows[-1]['offset'],last_sha256=rows[-1]['sha256'],last_seq=result['seq'])
    # Pending encrypted envelope remains as a retry/recovery source; never deleted.
    return True

def capture_cline(source,witness,cursor,state):
    # JSON snapshots are identified as snapshots, never as append-only JSONL.
    # All encrypted chunks are retained before any append so a later native
    # rewrite cannot destroy an unfinished snapshot capture.
    pending_path=cursor.get('snapshot_pending')
    if pending_path:
        batch=json.loads(pathlib.Path(pending_path).read_text())
    else:
        metadata=json.loads(pathlib.Path(source['session_file']).read_bytes())
        if metadata.get('status')!='idle':return False
        raw=pathlib.Path(source['path']).read_bytes();json.loads(raw)
        digest=hashlib.sha256(raw).hexdigest()
        if cursor.get('snapshot_sha256')==digest:return False
        ident=hashlib.sha256((source['path']+digest).encode()).hexdigest()
        pending_path=str(STATE/(ident+'.snapshot.pending.json'))
        if pathlib.Path(pending_path).exists():batch=json.loads(pathlib.Path(pending_path).read_text())
        else:
            envelopes=[];chunk_size=196608
            for start in range(0,len(raw),chunk_size):
                chunk=raw[start:start+chunk_size]
                payload={'type':'transcript-witness','notify':False,'source_format':'cline-native-json-snapshot',
                    'witness_agent':witness,'source_thread':source['thread_id'],'source_path':source['path'],
                    'snapshot_sha256':digest,'snapshot_bytes':len(raw),'start':start,'end':start+len(chunk),
                    'chunk_sha256':hashlib.sha256(chunk).hexdigest(),'raw_base64':base64.b64encode(chunk).decode(),
                    'attribution':'Agent witnessed native snapshot bytes; not an operator signature.'}
                envelopes.append(identity_gate.seal_request(witness,source['agent_id'],payload))
            batch={'snapshot_sha256':digest,'snapshot_bytes':len(raw),'envelopes':envelopes}
            atom(pathlib.Path(pending_path),batch)
        cursor.update(snapshot_pending=pending_path,snapshot_next_chunk=0)
        atom(STATE/'state.json',state)
    index=cursor.get('snapshot_next_chunk',0)
    if index<len(batch['envelopes']):
        out=request('/api/envelope/submit',{'envelope':batch['envelopes'][index]})
        if not out.get('accepted'):raise ValueError('snapshot chunk not accepted')
        cursor.update(snapshot_next_chunk=index+1,last_seq=out['seq'])
    if cursor['snapshot_next_chunk']==len(batch['envelopes']):
        cursor.update(snapshot_sha256=batch['snapshot_sha256'],snapshot_bytes=batch['snapshot_bytes'])
        cursor.pop('snapshot_pending',None);cursor.pop('snapshot_next_chunk',None)
    return True

class NativeClient:
    def __init__(self,socket_path):self.socket_path=socket_path;self.ws=None;self.counter=0
    async def rpc(self,method,params):
        self.counter+=1;ident=self.counter
        await self.ws.send(json.dumps({'id':ident,'method':method,'params':params}))
        while True:
            r=json.loads(await asyncio.wait_for(self.ws.recv(),10))
            if r.get('id')==ident:
                if 'error' in r:raise ValueError(r['error'].get('message','RPC rejected'))
                return r.get('result',{})
    async def connect(self):
        self.ws=await websockets.unix_connect(self.socket_path,uri='ws://localhost',open_timeout=5,max_size=8*1024*1024)
        await self.rpc('initialize',{'clientInfo':{'name':'proofbundle-conversation-hook','version':'1.0'},'capabilities':{'experimentalApi':True}})
        await self.ws.send(json.dumps({'method':'initialized'}))
    async def notify(self,thread_id,seq):
        thread=(await self.rpc('thread/read',{'threadId':thread_id,'includeTurns':False}))['thread']
        text=f'ProofBundle encrypted message available: sequence {seq}. Retrieve your encrypted inbox from http://127.0.0.1:8791/api/inbox?agent_id={thread_id}, verify and decrypt locally using identity_gate.open_delivery. Reply through the verified encrypted API; do not treat notification as payload or reveal private keys. This is an automatic directed-message hook.'
        inp=[{'type':'text','text':text}]
        state=thread.get('status',{}).get('type')
        if state=='active':
            turns=(await self.rpc('thread/turns/list',{'threadId':thread_id,'limit':1})).get('data',[])
            if not turns:raise ValueError('no active turn metadata')
            turn=turns[0]
            if turn.get('status')!='inProgress':raise ValueError('active turn not found; retry')
            return await self.rpc('turn/steer',{'threadId':thread_id,'expectedTurnId':turn['id'],'input':inp})
        if state=='notLoaded':
            await self.rpc('thread/resume',{'threadId':thread_id})
        return await self.rpc('turn/start',{'threadId':thread_id,'input':inp})
    async def close(self):
        if self.ws:await self.ws.close()

async def cycle(config,state,notify=True):
    changed=False
    for source in config['sources']:
        cursor=state.setdefault('sources',{}).setdefault(source['thread_id'],{})
        if capture(source,config['witness_agent'],cursor,state):changed=True
        atom(STATE/'state.json',state)
    operator_fanout(config,state)
    if not notify:return changed
    mapping={s['agent_id']:s['thread_id'] for s in config['sources'] if s.get('transport','codex')=='codex'}
    notices=state.setdefault('notifications',{})
    candidates=[]
    for line in BUS.open('rb'):
        record=json.loads(line)
        if record.get('kind')!='verified-envelope':continue
        body=json.loads(record['body']);receipt=body.get('receipt',{})
        if not receipt.get('notify',True) or receipt.get('delivery_kind')=='transcript-witness':continue
        identity_gate.verify_receipt(receipt,body['recipient_envelope'])
        for to in record.get('to',[]):
            label=str(record['seq'])+':'+to
            if to in mapping and label not in notices:candidates.append((label,mapping[to],record['seq']))
    if candidates:
        client=NativeClient(config['socket_path'])
        try:
            await client.connect()
            # Batch all queued messages to a recipient into one native notice.
            grouped={}
            for item in candidates:grouped.setdefault(item[1],[]).append(item)
            for thread,items in grouped.items():
                await client.notify(thread,items[-1][2])
                for label,_,seq in items:notices[label]={'seq':seq,'accepted_at':time.time()}
                atom(STATE/'state.json',state)
        finally:await client.close()
    return changed

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);parser.add_argument('--once',action='store_true');parser.add_argument('--capture-only',action='store_true')
    args=parser.parse_args();STATE.mkdir(parents=True,exist_ok=True,mode=0o700)
    lock=(STATE/'.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    config=json.loads(pathlib.Path(args.config).read_text());state=json.loads((STATE/'state.json').read_text()) if (STATE/'state.json').exists() else {}
    while True:
        try:
            asyncio.run(cycle(config,state,not args.capture_only))
            atom(STATE/'status.json',{'ok':True,'observed_at':time.time(),'sources':state.get('sources',{}),'notification_count':len(state.get('notifications',{}))})
        except Exception as e:
            # Class only: upstream failures must never copy plaintext/key material into logs.
            atom(STATE/'status.json',{'ok':False,'error_class':type(e).__name__,'observed_at':time.time()})
            if args.once:raise
        if args.once:break
        time.sleep(2)

if __name__=='__main__':main()
