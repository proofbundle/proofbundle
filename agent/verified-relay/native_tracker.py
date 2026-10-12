#!/usr/bin/env python3
"""Native ProofBundle tracker. Reads local records only; no HTTP listener/client."""
import argparse,json,pathlib,time,sys,os

HOME=pathlib.Path.home();BUS=HOME/'pb/live/bus';AGENTS=HOME/'.proofbundle/agent'

def load(path,default=None):
    try:return json.loads(path.read_text())
    except (OSError,ValueError):return default

def tail_records(limit=200):
    path=BUS/'messages.ndjson'
    with path.open('rb') as f:
        size=path.stat().st_size;start=max(0,size-16*1024*1024);f.seek(start)
        if start:f.readline()
        lines=f.read().splitlines()
    result=[]
    for line in lines[-limit:]:
        try:result.append(json.loads(line))
        except ValueError:continue
    return result

def snapshot():
    head=load(BUS/'HEAD',{})
    # HEAD in older bus formats can be a plain digest; the tail is authoritative
    # for the bounded records displayed here, not a substitute for chain verify.
    records=tail_records();tip=records[-1] if records else None
    identities=[]
    for path in AGENTS.glob('*/communication-binding.json'):
        if path.parent.name.startswith('proofbundle-relay-test-'):continue
        b=load(path,{});identities.append({'agent_id':b.get('agent_id',path.parent.name),'thread_id':b.get('thread_id'),
            'key_fingerprint':b.get('key_fingerprint'),'encryption':b.get('algorithms',{}).get('encryption'),
            'pq_profile':(load(path.with_name('communication-pq-binding.json'),{}) or {}).get('profile')})
    worker=load(HOME/'pb/live/conversation-worker/status.json',{})
    state=load(HOME/'pb/live/conversation-worker/state.json',{})
    qwen=[load(p,{}) for p in (HOME/'pb/live/qwen-inbox').glob('*.poll.json')]
    proofs=list((BUS/'ots/preimage-v1').glob('sequence-*.json.ots'))
    roots=sorted((BUS/'ots/merkle-preimage-v1').glob('root-*.json'))
    root=load(roots[-1],{}) if roots else {}
    return {'observed_at':time.strftime('%Y-%m-%d %H:%M:%S %Z'),'ledger_tip':tip['seq'] if tip else None,
        'tip_hash':tip['hash'] if tip else None,'registered':identities,'worker':worker,
        'operator_deliveries':len(state.get('operator_deliveries',{})),'qwen':qwen,
        'sequence_proofs':len(proofs),'proof_backlog':max(0,(tip['seq'] if tip else 0)-len(proofs)),
        'latest_merkle':root,'ots_state':'Calendar proofs recorded; Bitcoin confirmation requires proof upgrade/verification.',
        'records':records,'source':str(BUS/'messages.ndjson'),'transport':'local filesystem; no server'}

def text_view(s):
    lines=[f"ProofBundle · {s['observed_at']}",f"Ledger {s['ledger_tip']} | OTS proofs {s['sequence_proofs']} | pending {s['proof_backlog']}",
           f"Merkle range 1..{s['latest_merkle'].get('to','?')} | {s['latest_merkle'].get('root','pending')}",
           f"Operator deliveries {s['operator_deliveries']} | native hooks {s['worker'].get('notification_count',0)} | capture {'running' if s['worker'].get('ok') else 'check worker'}"]
    for q in s['qwen']:lines.append(f"Qwen: {q.get('delivery_status','no receipt')} · latest notice {q.get('last_notified')} · polled {len(q.get('seen',[]))}")
    lines.append('\nRegistered identities')
    lines += [f"{a['agent_id']}  {a['key_fingerprint']}" for a in s['registered']]
    lines.append('\nRecent sequences')
    for r in s['records'][-20:]:lines.append(f"{r['seq']:6d} {r['kind']:20.20s} {r['src']} -> {','.join(r.get('to',[]))}")
    return '\n'.join(lines)

def gui():
    from PyQt5 import QtCore,QtWidgets
    import identity_gate
    app=QtWidgets.QApplication(sys.argv);window=QtWidgets.QMainWindow();window.setWindowTitle('ProofBundle — native communication tracker');window.resize(1200,820)
    central=QtWidgets.QWidget();window.setCentralWidget(central);layout=QtWidgets.QVBoxLayout(central)
    summary=QtWidgets.QLabel();summary.setWordWrap(True);layout.addWidget(summary)
    tabs=QtWidgets.QTabWidget();layout.addWidget(tabs)
    records=QtWidgets.QTableWidget(0,7);records.setHorizontalHeaderLabels(['Sequence','Time','Message kind','From','To','Notification','Timestamp proof']);records.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows);records.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
    records.horizontalHeader().setStretchLastSection(True);tabs.addTab(records,'Messages')
    identities=QtWidgets.QTableWidget(0,3);identities.setHorizontalHeaderLabels(['Agent ID','Signing fingerprint','Encryption profiles']);identities.horizontalHeader().setStretchLastSection(True);tabs.addTab(identities,'Identities')
    states=QtWidgets.QPlainTextEdit();states.setReadOnly(True);tabs.addTab(states,'Capture and timestamps')
    detail=QtWidgets.QPlainTextEdit();detail.setReadOnly(True);tabs.addTab(detail,'Selected delivery')
    buttons=QtWidgets.QHBoxLayout();layout.addLayout(buttons);refresh=QtWidgets.QPushButton('Refresh');open_button=QtWidgets.QPushButton('Verify and open selected delivery locally');buttons.addWidget(refresh);buttons.addWidget(open_button)
    cache={'snapshot':None}
    def update():
        try:s=snapshot()
        except Exception as e:summary.setText('Local state read failed: '+type(e).__name__);return
        cache['snapshot']=s
        summary.setText(f"{s['observed_at']}   Ledger {s['ledger_tip']}   OTS proofs {s['sequence_proofs']}   Pending {s['proof_backlog']}\nMerkle 1..{s['latest_merkle'].get('to','?')}   {s['latest_merkle'].get('root','pending')}\nNative hooks {s['worker'].get('notification_count',0)}   Operator deliveries {s['operator_deliveries']}   Local files; no tracking server")
        selected=records.item(records.currentRow(),0) if records.currentRow()>=0 else None
        selected_seq=selected.text() if selected else None
        rows=s['records'];records.setRowCount(len(rows))
        for n,r in enumerate(rows):
            kind=r['kind'];notice='—'
            if kind=='verified-envelope':
                try:
                    receipt=json.loads(r['body'])['receipt'];kind=receipt.get('delivery_kind','message')
                    notice='requested' if receipt.get('notify',True) else 'recorded quietly'
                    if kind=='transcript-witness':kind='native transcript capture'
                    elif kind=='operator-message':kind='operator message'
                except (KeyError,ValueError):kind='receipt unavailable'
            proof='recorded' if r['seq']<=s['latest_merkle'].get('to',0) else 'pending'
            for col,value in enumerate([r['seq'],r.get('ts'),kind,r['src'],','.join(r.get('to',[])),notice,proof]):records.setItem(n,col,QtWidgets.QTableWidgetItem(str(value)))
            if str(r['seq'])==selected_seq:records.selectRow(n)
        records.resizeColumnsToContents();identities.setRowCount(len(s['registered']))
        for n,a in enumerate(s['registered']):
            for col,value in enumerate([a['agent_id'],a['key_fingerprint'],a['encryption']+(' | '+a['pq_profile'] if a['pq_profile'] else '')]):identities.setItem(n,col,QtWidgets.QTableWidgetItem(value))
        identities.resizeColumnsToContents()
        states.setPlainText(json.dumps({k:s[k] for k in ['worker','qwen','sequence_proofs','proof_backlog','latest_merkle','ots_state']},indent=2))
    def open_local():
        row=records.currentRow();s=cache['snapshot']
        if row<0 or not s:return
        record=s['records'][row]
        if record['kind']!='verified-envelope':detail.setPlainText(json.dumps(record,indent=2));tabs.setCurrentWidget(detail);return
        try:
            artifact=json.loads(record['body']);identity_gate.verify_receipt(artifact['receipt'],artifact['recipient_envelope'])
            message=identity_gate.open_delivery(artifact['recipient_envelope'],artifact['to'])
            detail.setPlainText(json.dumps({'seq':record['seq'],'receipt_verified':True,'message':message},indent=2,ensure_ascii=False));tabs.setCurrentWidget(detail)
        except Exception as e:detail.setPlainText('Verification failed: '+str(e));tabs.setCurrentWidget(detail)
    refresh.clicked.connect(update);open_button.clicked.connect(open_local);timer=QtCore.QTimer();timer.timeout.connect(update);timer.start(3000);update();window.show();app.exec_()

def main():
    p=argparse.ArgumentParser();p.add_argument('--json',action='store_true');p.add_argument('--tty',action='store_true');p.add_argument('--once',action='store_true');a=p.parse_args()
    if a.json:print(json.dumps(snapshot()));return
    if not a.tty:gui();return
    while True:
        if sys.stdout.isatty():print('\033[2J\033[H',end='')
        print(text_view(snapshot()),flush=True)
        if a.once:return
        time.sleep(3)

if __name__=='__main__':main()
