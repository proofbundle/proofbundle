import hashlib
import importlib.util
import io
import json
import pathlib
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / 'control'))
from aletheia_store import CustodyStore
from aletheia_worker import dispatch


class CustodyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        self.source = self.root / 'native.sqlite3'
        with sqlite3.connect(self.source) as db:
            db.executescript('''CREATE TABLE memory_items(id TEXT PRIMARY KEY,kind TEXT,content TEXT,summary TEXT,meta_json TEXT,parent_ids_json TEXT,tags_json TEXT,created_at REAL,updated_at REAL);
                CREATE VIRTUAL TABLE memory_fts USING fts5(item_id UNINDEXED,title,content);''')
            db.execute('INSERT INTO memory_items VALUES (?,?,?,?,?,?,?,?,?)', ('native-id','source','ProofBundle native provenance text','summary','{"source_id":"original.txt"}','[]','[]',1.0,2.0))
            db.execute('INSERT INTO memory_fts VALUES (?,?,?)', ('native-id','Original source','ProofBundle native provenance text'))
        self.source_bytes = self.source.read_bytes()
        self.store = CustodyStore(self.root / 'custody', {'fixture': self.source})

    def tearDown(self): self.tmp.cleanup()

    def test_native_capture_is_readonly_and_durable(self):
        result = self.store.search('fixture', 'ProofBundle provenance')
        self.assertEqual(result['records'][0]['native']['content'], 'ProofBundle native provenance text')
        self.assertEqual(result['records'][0]['id'], 'native-id')
        self.assertEqual(result['query']['native_lookup_parameters'], [['native-id']])
        self.assertEqual(self.source.read_bytes(), self.source_bytes)
        restarted = CustodyStore(self.root / 'custody', {'fixture': self.source})
        self.assertEqual(restarted.status()['captures'], 1)

    def test_immutable_blob_and_atomic_checkpoint_membership(self):
        key = hashlib.sha256(b'content-reference').hexdigest()
        result = self.store.put_blob(key, io.BytesIO(b'original'), 8)
        with self.assertRaises(ValueError): self.store.put_blob(key, io.BytesIO(b'changed'), 7)
        snapshot = {'schema':'AletheiaCustodySnapshot/v1','state':{},'events':[], 'artifacts':[
            {'id':'artifact','blob_ref':key,'blob_sha256':result['sha256'],'size':8}]}
        receipt = self.store.save_snapshot(snapshot)
        self.assertEqual(self.store.latest()['id'], receipt['id'])
        snapshot['artifacts'][0]['blob_sha256'] = 'wrong'
        with self.assertRaises(ValueError): self.store.save_snapshot(snapshot)
        self.assertEqual(self.store.status()['snapshots'], 1)

    def test_chunked_stdio_blob_transport(self):
        key = hashlib.sha256(b'chunked').hexdigest()
        import base64
        upload = dispatch(self.store, 'beginBlob', {'key':key})
        for piece in [b'first', b'second']:
            dispatch(self.store, 'appendBlob', {'upload_id':upload['upload_id'],'chunk_b64':base64.b64encode(piece).decode()})
        result = dispatch(self.store, 'finishBlob', {'upload_id':upload['upload_id']})
        self.assertEqual(result['sha256'], hashlib.sha256(b'firstsecond').hexdigest())
        self.assertEqual((self.store.blobs / key).read_bytes(), b'firstsecond')


    def test_record_checkpoint_is_bounded_immutable_and_restartable(self):
        header={'schema':'AletheiaCustodySnapshot/v1','state':{'claims':[]},'state_sha256':'fixture'}
        draft=self.store.begin_record_checkpoint(header)
        record='{"id":"native-1","original":{"message":"Unicode Ω 😺"}}'
        saved=self.store.put_checkpoint_record(draft['id'],'retained',0,record)
        self.assertEqual(saved['sha256'],hashlib.sha256(record.encode()).hexdigest())
        with self.assertRaises(ValueError): self.store.put_checkpoint_record(draft['id'],'retained',0,'{"id":"different"}')
        with self.assertRaises(ValueError): self.store.finish_record_checkpoint(draft['id'],{'artifacts':0,'events':0,'retained':2})
        self.assertEqual(self.store.status()['snapshots'],0)
        receipt=self.store.finish_record_checkpoint(draft['id'],{'artifacts':0,'events':0,'retained':1})
        restarted=CustodyStore(self.root/'custody',{'fixture':self.source})
        self.assertEqual(restarted.latest()['id'],receipt['id'])
        self.assertEqual(restarted.latest()['snapshot']['storage_layout'],'record-checkpoint-v1')
        self.assertEqual(restarted.checkpoint_record_page(receipt['id'],'retained')['records'][0]['raw_json'],record)


    def test_record_batch_is_atomic_immutable_and_restartable(self):
        draft=self.store.begin_record_checkpoint({'schema':'AletheiaCustodySnapshot/v1','state':{}})
        rows=[{'kind':'retained','ordinal':i,'raw_json':json.dumps({'id':str(i),'message':'Ω😺'})} for i in range(3)]
        result=self.store.put_checkpoint_records(draft['id'],rows)
        self.assertEqual(len(result['records']),3)
        with self.assertRaises(ValueError):self.store.put_checkpoint_records(draft['id'],[{'kind':'retained','ordinal':3,'raw_json':'{"id":"would-roll-back"}'},{**rows[0],'raw_json':'{"id":"conflict"}'}])
        self.assertEqual(len(self.store.checkpoint_record_page(draft['id'],'retained')['records']),3)
        receipt=self.store.finish_record_checkpoint(draft['id'],{'artifacts':0,'events':0,'retained':3})
        restarted=CustodyStore(self.root/'custody',{'fixture':self.source})
        self.assertEqual(restarted.latest()['id'],receipt['id'])

    def test_chunked_checkpoint_record_preserves_exact_unicode_json(self):
        draft=self.store.begin_record_checkpoint({'schema':'AletheiaCustodySnapshot/v1','state':{},'state_sha256':'fixture'})
        raw='{"id":"large-source","message":"'+('Ω😺abc'*80000)+'"}'
        upload=dispatch(self.store,'beginCheckpointRecord',{'id':draft['id'],'kind':'retained','ordinal':0})
        for offset in range(0,len(raw),262144):dispatch(self.store,'appendCheckpointRecord',{'upload_id':upload['upload_id'],'chunk':raw[offset:offset+262144]})
        stored=dispatch(self.store,'finishCheckpointRecord',{'upload_id':upload['upload_id']})
        self.assertEqual(stored['sha256'],hashlib.sha256(raw.encode()).hexdigest())
        info=self.store.checkpoint_record_info(draft['id'],'retained',0)
        chunks=[]
        for offset in range(0,info['characters'],262144):chunks.append(self.store.checkpoint_record_chunk(draft['id'],'retained',0,offset)['chunk'])
        self.assertEqual(''.join(chunks),raw)


if __name__ == '__main__': unittest.main()
