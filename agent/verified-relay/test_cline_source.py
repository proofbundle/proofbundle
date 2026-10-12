import base64
import hashlib
import json
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import conversation_worker as worker
from cline_source import message_spans

class ClineCaptureChecks(unittest.TestCase):
    def test_operator_fanout_preserves_bytes_without_self_notice_or_tool_misattribution(self):
        base=Path.home()/'pb/work/bridge-reestablish-20261011'
        with tempfile.TemporaryDirectory(dir=base) as td:
            root=Path(td);source=root/'native.json'
            messages=[{'role':'user','ts':1000,'content':[{'type':'text','text':'<user_input mode="act">é</user_input>'}]},
                {'role':'user','ts':1001,'content':[{'type':'tool_result','content':'output'}]},
                {'role':'user','ts':1002,'content':[{'type':'text','text':'<user_input mode="act">ProofBundle relay notification from Codex lane B: peer notice</user_input>'}]}]
            raw=json.dumps({'messages':messages},ensure_ascii=False).encode();source.write_bytes(raw)
            config={'witness_agent':'witness','sources':[{'path':str(source),'thread_id':'native','agent_id':'own','transport':'cline'}]}
            state={'operator_notify_from':0};accepted=[]
            def accept(route,value):
                accepted.append(value['envelope']);return {'accepted':True,'seq':len(accepted)}
            def registry(*args,**kwargs):return io.StringIO(json.dumps({'registered':[{'agent_id':'own'},{'agent_id':'peer'}]}))
            with patch.object(worker,'STATE',root),patch.object(worker.urllib.request,'urlopen',side_effect=registry),patch.object(worker.identity_gate,'seal_request',side_effect=lambda a,b,p:{'to':b,'payload':p}),patch.object(worker,'request',side_effect=accept):
                worker.operator_fanout(config,state)
                worker.operator_fanout(config,state)
            self.assertEqual(len(accepted),2)
            by_recipient={e['to']:e['payload'] for e in accepted}
            self.assertFalse(by_recipient['own']['notify']);self.assertTrue(by_recipient['peer']['notify'])
            payload=by_recipient['peer'];span=base64.b64decode(payload['raw_base64'])
            self.assertEqual(raw[payload['source_offset']:payload['source_offset']+len(span)],span)
            self.assertEqual(json.loads(span),messages[0])
            self.assertEqual(payload['source_snapshot_sha256'],hashlib.sha256(raw).hexdigest())

    def test_exact_unicode_spans(self):
        raw=b'{"note":"messages", "messages": [ {"role":"user","text":"\xc3\xa9"},\n {"role":"assistant","text":"} [,"} ],"other":true}'
        rows=list(message_spans(raw))
        self.assertEqual([r for _,_,r in rows],json.loads(raw)['messages'])
        for start,part,row in rows:
            self.assertEqual(raw[start:start+len(part)],part)
            self.assertEqual(json.loads(part),row)

    def test_retry_completes_original_snapshot_after_source_rewrite(self):
        # Mock only cryptography/transport; exercise actual chunk retention and
        # state recovery against a changed native document.
        base=Path.home()/'pb/work/bridge-reestablish-20261011'
        with tempfile.TemporaryDirectory(dir=base) as td:
            root=Path(td);source=root/'source.json';meta=root/'meta.json'
            raw=json.dumps({'messages':[{'role':'assistant','content':'x'*220000}]}).encode()
            source.write_bytes(raw);meta.write_text('{"status":"idle"}')
            spec={'path':str(source),'session_file':str(meta),'thread_id':'test','agent_id':'test','transport':'cline'}
            cursor={};state={'sources':{'test':cursor}};accepted=[]
            def accept(route,value):
                accepted.append(value['envelope']);return {'accepted':True,'seq':len(accepted)}
            with patch.object(worker,'STATE',root),patch.object(worker.identity_gate,'seal_request',side_effect=lambda a,b,p:p),patch.object(worker,'request',side_effect=accept):
                self.assertTrue(worker.capture_cline(spec,'witness',cursor,state))
                self.assertIn('snapshot_pending',cursor)
                source.write_bytes(b'{"messages":[]}')
                self.assertTrue(worker.capture_cline(spec,'witness',cursor,state))
            self.assertNotIn('snapshot_pending',cursor)
            recovered=b''.join(base64.b64decode(e['raw_base64']) for e in accepted)
            self.assertEqual(recovered,raw)
            self.assertEqual(cursor['snapshot_sha256'],hashlib.sha256(raw).hexdigest())

if __name__=='__main__':unittest.main()
