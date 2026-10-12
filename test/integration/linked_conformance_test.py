import importlib.util,json,pathlib,subprocess,tempfile,unittest,sys,hashlib
CONTROL=pathlib.Path(__file__).resolve().parents[2]/'control';sys.path.insert(0,str(CONTROL))
from linked_conformance import extract
from aletheia_store import CustodyStore
from aletheia_worker import dispatch
import io
class LinkedConformanceTests(unittest.TestCase):
 def test_nested_and_record_vectors_preserve_expectations(self):
  raw=json.dumps({'categories':{'negative':[{'id':'n','key':'','expected':'REJECT_INVALID_KEY_LENGTH'}]},'vectors':[{'input_hex':'','expected_output_hex':'00'}]}).encode()
  rows=extract(raw,pathlib.Path('vectors.json'));self.assertEqual(len(rows),2);self.assertEqual(rows[1]['expected'],'REJECT_INVALID_KEY_LENGTH')
  rows=extract(json.dumps({'named':{'data_hex':'00','expected_behavior':'reject or handle gracefully'}}).encode(),pathlib.Path('v.json'));self.assertEqual(len(rows),1)
 def test_source_match_and_independent_failure_are_distinct(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'provider.py';p.write_text('DIGEST_BYTES=32\ndef hash_bytes(data): return bytes(32)\n')
   spec={'provider_path':str(p),'provider_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'algorithm_id':'sha256','cases':[{'index':0,'label':'placeholder','source_path':'source.txt','source_sha256':'sourcehash','vector':{'input_hex':'','expected_output_hex':'00'*32}}]}
   r=subprocess.run([sys.executable,'-B',str(CONTROL/'linked_case_runner.py')],input=json.dumps(spec),text=True,capture_output=True,check=True);result=json.loads(r.stdout)
   self.assertEqual(result['cases'][0]['standing'],'passed');self.assertEqual([r['standing'] for r in result['independent_probes']],['failed','failed'])
   spec['provider_sha256']='00'*32;r=subprocess.run([sys.executable,'-B',str(CONTROL/'linked_case_runner.py')],input=json.dumps(spec),text=True,capture_output=True);self.assertNotEqual(r.returncode,0)
 def test_source_alias_is_byte_verified_immutable_and_survives_restart(self):
  with tempfile.TemporaryDirectory() as d:
   store=CustodyStore(d);raw=b'original provider bytes';key=hashlib.sha256(raw).hexdigest();store.put_blob(key,io.BytesIO(raw),len(raw));alias='a'*64
   binding={'key':alias,'source_key':key,'sha256':key,'size':len(raw)}
   self.assertEqual(dispatch(store,'bindSourceAliases',{'bindings':[binding]})['bound'],1)
   self.assertEqual((CustodyStore(d).blobs/alias).read_bytes(),raw)
   with self.assertRaises(ValueError):dispatch(store,'bindSourceAliases',{'bindings':[{**binding,'sha256':'b'*64}]})

 def test_no_oracle_never_becomes_a_pass(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'provider.py';p.write_text('def hash_bytes(data): return b"x"\n')
   spec={'provider_path':str(p),'provider_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'algorithm_id':'unregistered','cases':[{'index':0,'label':'no oracle','source_path':'v.json','source_sha256':'sourcehash','vector':{'input_hex':'00'}}]}
   r=subprocess.run([sys.executable,'-B',str(CONTROL/'linked_case_runner.py')],input=json.dumps(spec),text=True,capture_output=True,check=True);result=json.loads(r.stdout);self.assertEqual(result['cases'][0]['standing'],'observed');self.assertTrue(result['cases'][0]['executed'])
if __name__=='__main__':unittest.main()
