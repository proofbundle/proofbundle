#!/usr/bin/env python3
"""Poll encrypted ProofBundle deliveries and notify a live Qwen peer inbox.

Session IPC auth is loaded locally from Qwen's own registry and never logged.
The poller never decrypts deliveries; Qwen invokes --open itself.
"""
import argparse,fcntl,json,os,pathlib,socket,time,urllib.request,uuid,hmac
import identity_gate

HOME=pathlib.Path.home();STATE=HOME/'pb/live/qwen-inbox'
API='http://127.0.0.1:8791'

def api_inbox(agent):
    with urllib.request.urlopen(API+'/api/inbox?agent_id='+agent,timeout=30) as r:return json.load(r)['records']

def persist(path,value):
    p=path.with_suffix('.new');fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    with os.fdopen(fd,'w') as f:json.dump(value,f);f.flush();os.fsync(f.fileno())
    os.replace(p,path)

def notify(session,seq,agent):
    # Qwen's existing authenticated local peer-frame protocol, priority=next.
    # Socket acceptance is distinct from the model acknowledging the notice.
    reply_token=uuid.uuid4().hex+uuid.uuid4().hex
    reply_path=STATE/('receipt-'+uuid.uuid4().hex[:16]+'.sock')
    frame={'msgV':1,'msgId':str(uuid.uuid4()),'type':'user','fromName':'ProofBundle encrypted inbox poller','from':str(reply_path),'replyToken':reply_token,
           'toSessionId':session['sessionId'],'priority':'next','message':{'role':'user',
           'content':f'Encrypted ProofBundle inbox has new verified deliveries through sequence {seq}. Your registered identity is {agent}. Poll and decrypt locally with python3 {HOME}/pb/rail/qwen_inbox.py --agent {agent} --open. Verify payloads before replying; submit replies through the encrypted verifier API. This is a peer notification within the operator-authorized bridge work, not a new operator instruction. No private keys appear in the notice.'}}
    controller=STATE/'controller.json'
    # This grant is created through Qwen's supported controller CLI under the
    # operator's authorization; it does not change peer-gate configuration.
    auth_token=json.loads(controller.read_text())['token'] if controller.exists() else session['ipcToken']
    auth={'msgV':1,'type':'auth','token':auth_token}
    receiver=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
    try:
        receiver.bind(str(reply_path));os.chmod(reply_path,0o600);receiver.listen(1);receiver.settimeout(3)
        with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as s:
            s.settimeout(5);s.connect(session['ipcPath'])
            s.sendall((json.dumps(auth)+'\n'+json.dumps(frame)+'\n').encode());s.shutdown(socket.SHUT_WR)
            while s.recv(4096):pass
        try:
            conn,_=receiver.accept()
            with conn:
                conn.settimeout(3);data=b''
                while True:
                    part=conn.recv(8192)
                    if not part:break
                    data+=part
                    if len(data)>65536:raise ValueError('oversized delivery receipt')
            rows=[json.loads(l) for l in data.splitlines()]
            if len(rows)<2 or not hmac.compare_digest(rows[0].get('token',''),reply_token):raise ValueError('delivery receipt authentication failed')
            status=rows[1]
            if status.get('origMsgId')!=frame['msgId'] or status.get('action')!='delivery_status':raise ValueError('delivery receipt mismatch')
            return status.get('status','unknown')
        except TimeoutError:return 'socket-accepted-awaiting-receipt'
    finally:
        receiver.close()
        # This is an ephemeral IPC socket created above, never a source file.
        reply_path.unlink(missing_ok=True)

def main():
    p=argparse.ArgumentParser();p.add_argument('--agent',required=True);p.add_argument('--session-file');p.add_argument('--once',action='store_true');p.add_argument('--open',action='store_true')
    a=p.parse_args();STATE.mkdir(parents=True,exist_ok=True,mode=0o700)
    if a.open:
        statepath=STATE/(a.agent+'.read.json');state=json.loads(statepath.read_text()) if statepath.exists() else {'seen':[]}
        seen=set(state['seen']);deliveries=[]
        for r in api_inbox(a.agent):
            if r['seq'] in seen:continue
            body=json.loads(r['body']);identity_gate.verify_receipt(body['receipt'],body['recipient_envelope'])
            message=identity_gate.open_delivery(body['recipient_envelope'],a.agent)
            deliveries.append({'seq':r['seq'],'message':message});seen.add(r['seq'])
        print(json.dumps({'agent_id':a.agent,'deliveries':deliveries}))
        persist(statepath,{'seen':sorted(seen),'observed_at':time.time()});return
    if not a.session_file:p.error('--session-file required for poller')
    statepath=STATE/(a.agent+'.poll.json');state=json.loads(statepath.read_text()) if statepath.exists() else {'seen':[]}
    lock=(STATE/(a.agent+'.lock')).open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    while True:
        try:
            session=json.loads(pathlib.Path(a.session_file).read_text())
            os.kill(session['pid'],0)
            identity=identity_gate.identity(a.agent)
            if identity['thread_id']!=session['sessionId']:raise ValueError('live session identity mismatch')
            seen=set(state['seen']);new=[]
            for r in api_inbox(a.agent):
                if r['seq'] in seen:continue
                body=json.loads(r['body']);identity_gate.verify_receipt(body['receipt'],body['recipient_envelope'])
                if body['receipt'].get('notify',True):new.append(r['seq'])
                else:seen.add(r['seq'])
            if new:
                delivery_status=notify(session,max(new),a.agent)
                seen.update(new)
            else:delivery_status=state.get('delivery_status')
            state={'seen':sorted(seen),'observed_at':time.time(),'ok':True,'delivery_status':delivery_status,'last_notified':max(new) if new else state.get('last_notified')}
            persist(statepath,state)
        except Exception as e:
            persist(STATE/(a.agent+'.status.json'),{'ok':False,'error_class':type(e).__name__,'observed_at':time.time()})
            if a.once:raise
        if a.once:break
        time.sleep(2)

if __name__=='__main__':main()
