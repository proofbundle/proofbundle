"""Execute a hash-pinned captured Python provider inside a read-only/no-network sandbox."""
import importlib.util,json,sys,hashlib,resource,contextlib,io,subprocess,re
resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,768*1024*1024))
resource.setrlimit(resource.RLIMIT_CPU,(12,12))
spec=json.load(sys.stdin); path=spec['provider_path']; raw=open(path,'rb').read()
if hashlib.sha256(raw).hexdigest()!=spec['provider_sha256']:raise ValueError('Provider bytes changed')
m_spec=importlib.util.spec_from_file_location('captured_provider',path);m=importlib.util.module_from_spec(m_spec);sys.modules[m_spec.name]=m
with contextlib.redirect_stdout(io.StringIO()):m_spec.loader.exec_module(m)
def hx(s):
 if not isinstance(s,str):raise LookupError('Vector does not supply an explicit hex input for the mapped operation')
 try:return bytes.fromhex(s)
 except ValueError:raise LookupError('Input has no unambiguous hex encoding; no provider invocation inferred')
def invoke(v):
 if hasattr(m,'hash_bytes'):
  data=v.get('input_hex',v.get('input'));data=data if isinstance(data,str) else (data or {}).get('message_hex')
  return 'hash_bytes',m.hash_bytes(hx(data)).hex(),None
 aead=next((c for c in vars(m).values() if isinstance(c,type) and c.__module__==m.__name__ and hasattr(c,'encrypt') and hasattr(c,'decrypt')),None)
 if aead:
  cipher=aead(hx(v.get('key')))
  if 'nonce' not in v:
   if v.get('expected')=='REJECT_INVALID_KEY_LENGTH':return 'constructor',None,'accepted key'
   raise LookupError('No nonce for the declared operation; constructor success is not vector coverage')
  if 'plaintext_length' in v and 'plaintext' not in v:raise LookupError('Length-only vector omits the payload bytes')
  nonce=hx(v['nonce']);aad=hx(v.get('aad',''));pt=hx(v.get('plaintext',''))
  if 'tag' in v and 'plaintext' not in v:
   out=cipher.decrypt(nonce,aad,hx(v.get('ciphertext','')),hx(v['tag']));return 'decrypt',out.hex(),None
  ct,tag=cipher.encrypt(nonce,aad,pt);return 'encrypt',{'ciphertext':ct.hex(),'tag':tag.hex()},None
 if hasattr(m,'encrypt_block'):
  # This is explicitly a primitive-block observation, not CBC/CFB/CTR mode execution.
  key=hx(v.get('key'));data=hx(v.get('plaintext',v.get('input')))
  if len(data)!=m.BLOCK_SIZE:raise LookupError('Provider exports only encrypt_block; vector requires a mode/length policy')
  return 'encrypt_block',m.encrypt_block(m.key_expansion(key),data).hex(), 'primitive block only; declared mode not executed'
 raise LookupError('No explicit adapter for this provider API and vector operation')
results=[]
for item in spec['cases']:
 v=item['vector'];expected=v.get('expected_verdict',v.get('expected',v.get('expected_behavior')));answer=v.get('expected_digest_hex',v.get('expected_output_hex',v.get('expected_output')))
 row={k:item[k] for k in ['index','label','source_path','source_sha256']};row.update(expected=expected,expected_output=answer,standing='blocked',executed=False,actual=None,comparison='not evaluated',reason=None)
 try:
  operation,computed,note=invoke(v);row.update(executed=True,operation=operation,computed=computed,actual='RETURNED',reason=note)
  if answer and answer!='computed_at_runtime':
   row.update(standing='passed' if computed==answer else 'failed',comparison='source known-answer bytes')
  elif isinstance(computed,dict) and 'ciphertext' in v and 'tag' in v:
   row.update(standing='passed' if computed=={k:v[k] for k in ['ciphertext','tag']} else 'failed',comparison='source ciphertext and tag bytes')
  elif expected in ['produce_valid_output','encrypt_successfully','VALID_EMPTY'] and not note:
   row.update(standing='passed',comparison='source behavioral expectation only')
  elif isinstance(expected,str) and (expected=='reject' or expected.startswith('REJECT_')):
   row.update(standing='failed',comparison='source rejection expectation')
  else:row.update(standing='observed',reason=note or 'No precise executable source oracle; output retained without a conformance pass')
 except LookupError as e:row['reason']=str(e)
 except Exception as e:
  row.update(executed=True,actual='EXCEPTION',error_type=type(e).__name__,error=str(e)[:600])
  rejection=isinstance(e,(ValueError,TypeError)) or type(e).__name__ in ['InvalidInputError','InvalidLengthError','NullInputError','TagMismatchError']
  wants_reject=isinstance(expected,str) and (expected=='reject' or expected.startswith('REJECT_'))
  row.update(standing='passed' if rejection and wants_reject else 'failed' if answer or expected in ['produce_valid_output','VALID_EMPTY'] or wants_reject else 'observed',comparison='source rejection expectation' if wants_reject else 'execution error; no inferred oracle')
 results.append(row)
# Independent probes distinguish a source's own oracle from actual standard conformance.
probes=[]
if hasattr(m,'hash_bytes'):
 for data in [b'',b'abc']:
  name=spec['algorithm_id'].lower();name=name.replace('-','_') if name.startswith('sha3-') else name.replace('-','');reference=None
  try:
   h=hashlib.new(name,data);reference=h.digest(m.DIGEST_BYTES).hex() if name.startswith('shake') else h.hexdigest()
  except (ValueError,AttributeError):pass
  if reference is not None:
   got=m.hash_bytes(data).hex();probes.append({'kind':'independent known-answer','input_hex':data.hex(),'expected':reference,'actual':got,'standing':'passed' if got==reference else 'failed','reference_provider':'Python hashlib/OpenSSL'})
if hasattr(m,'encrypt_block'):
 match=re.match(r'aes-(128|192|256)-',spec['algorithm_id'].lower())
 cipher='aes-'+match[1]+'-ecb' if match else 'des-ede3' if spec['algorithm_id'].lower().startswith('3des-') else None
 if cipher:
  try:
   key=bytes(m.KEY_SIZE);data=bytes(m.BLOCK_SIZE)
   reference=subprocess.run(['/usr/bin/openssl','enc','-'+cipher,'-K',key.hex(),'-nosalt','-nopad'],input=data,capture_output=True,check=True,timeout=3).stdout.hex()
   computed=m.encrypt_block(m.key_expansion(key),data).hex()
   probes.append({'kind':'independent underlying block primitive; mode not executed','input_hex':data.hex(),'key_hex':key.hex(),'expected':reference,'actual':computed,'standing':'passed' if computed==reference else 'failed','reference_provider':'OpenSSL enc '+cipher})
  except Exception as e:probes.append({'kind':'independent block primitive','standing':'blocked','reason':str(e)})
if hasattr(m,'sign') and hasattr(m,'PublicKey'):
 try:
  pk,sk=m.keygen(bytes(32));sig=m.sign(b'original message',sk)
  accepted=m.verify(sig,b'altered message',pk);probes.append({'kind':'signature message binding','expected':False,'actual':accepted,'standing':'failed' if accepted else 'passed'})
 except Exception as e:probes.append({'kind':'signature message binding','standing':'blocked','reason':str(e)})
print(json.dumps({'cases':results,'independent_probes':probes}))
