// Browser facilities around the scratch providers. Cryptographic operations
// use PB_CORE; crypto.getRandomValues supplies OS entropy only.
if(window.aletheiaDesktop)document.body.classList.add('has-native-desktop');
window.PBLocalIdentity=(()=>{
 const database=typeof indexedDB==='undefined'?Promise.reject(new Error('Local identity requires IndexedDB storage')):new Promise((resolve,reject)=>{const req=indexedDB.open('proofbundle-local-identities',1);req.onupgradeneeded=()=>{req.result.createObjectStore('identities',{keyPath:'id'});req.result.createObjectStore('folders',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 database.catch(()=>{});
 let selected=null,pending=null;
 const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 const bytesHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
 async function put(store,value){const db=await database;return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Identity storage aborted'));});}
 async function keepIdentity(value){const db=await database;try{await new Promise((resolve,reject)=>{const tx=db.transaction('identities','readwrite');tx.objectStore('identities').add(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Identity storage aborted'));});return value;}catch(error){if(error.name!=='ConstraintError')throw error;return request(db.transaction('identities').objectStore('identities').get(value.id));}}
 async function load(){
  if(selected)return selected;const db=await database;let value=await request(db.transaction('identities').objectStore('identities').get('browser-custody'));
  if(!value){const seed=nativeRandom(32),kp=PB_CORE['crypto/ed25519.mjs'].keyPairFromSeed(seed),fingerprint=bytesHex(PB_CORE['crypto/sha256.mjs'].sha256(kp.publicKey));
   const identity={id:'browser-'+fingerprint.slice(0,24),algorithm:'Ed25519',public_key_raw_b64u:b64uEncode(kp.publicKey),fingerprint_sha256:fingerprint,created_at:new Date().toISOString(),scope:'Local browser custody recorder; model authorship and operator endorsement are separate.'};
   const aibom=PB_CORE['crypto/aibom.mjs'].buildAibom({artifact:'urn:proofbundle:browser:'+identity.id,riskTier:'unclassified',generatedAt:identity.created_at,ancestry:[],modelCards:[],custodyChain:'Local browser custody events',attestationRecord:identity.scope,publicKeyRaw:kp.publicKey,signer:digest=>PB_CORE['crypto/ed25519.mjs'].sign(digest,seed)});
   value=await keepIdentity({id:'browser-custody',identity,seed_b64u:b64uEncode(seed),aibom});
  }
  const seed=b64uDecode(value.seed_b64u),pub=PB_CORE['crypto/ed25519.mjs'].keyPairFromSeed(seed).publicKey;
  if(b64uEncode(pub)!==value.identity.public_key_raw_b64u)throw new Error('Stored identity key binding mismatch');
  if(PB_CORE['crypto/aibom.mjs'].verifyAibom(value.aibom).length||value.aibom.bom_seal.pub_b64u!==value.identity.public_key_raw_b64u)throw new Error('Stored AI-BOM signature mismatch');
  selected=value;return selected;
 }
 function get(){if(selected)return Promise.resolve(selected);if(!pending)pending=load().catch(error=>{pending=null;throw error;});return pending;}
 async function identity(){return (await get()).identity;}
 async function signEvent(text){const record=await get();return {algorithm:'Ed25519',signer_id:record.identity.id,public_key_raw_b64u:record.identity.public_key_raw_b64u,signature_b64u:b64uEncode(PB_CORE['crypto/ed25519.mjs'].sign(utf8('ALETHEIA-CUSTODY-EVENT-1\0'+text),b64uDecode(record.seed_b64u))),scope:record.identity.scope};}
 async function exportPublic(){const record=await get();dlText('proofbundle-identity-'+record.identity.id+'.json',JSON.stringify({identity:record.identity,aibom:record.aibom},null,2));}
 async function refresh(){const record=await get(),el=document.getElementById('native-identity-summary');if(el)el.textContent=record.identity.id+' · '+record.identity.fingerprint_sha256;}
 async function sealPayload(payload){const record=await get(),bundle={hdr:{bundle_id:'pb-'+bytesHex(nativeRandom(16)),profile:'PB-INTEGRITY-1'},meta:{created_at:new Date().toISOString(),signer_id:record.identity.id},payload};await sealCore(bundle,'SHA3-384','Ed25519',{alg:'Ed25519',priv:record.seed_b64u,pub:record.identity.public_key_raw_b64u});return bundle;}
 async function useSigningKey(){const record=await get();_currentKey={alg:'Ed25519',priv:record.seed_b64u,pub:record.identity.public_key_raw_b64u};return record.identity;}
 async function registerAgent({agent_id,session_id,model=null,provider=null}){
  if(typeof agent_id!=='string'||!agent_id.trim()||agent_id.length>160||typeof session_id!=='string'||!session_id.trim()||session_id.length>160)throw new Error('Agent and session identifiers are required');
  const id='agent:'+bytesHex(PB_CORE['crypto/sha256.mjs'].sha256(utf8(canonicalJSON({agent_id,session_id})))),db=await database,existing=await request(db.transaction('identities').objectStore('identities').get(id));
  if(existing){if(existing.state_packet.body.model!==model||existing.state_packet.body.provider!==provider)throw new Error('Existing registration has different declared metadata');return {identity:existing.identity,aibom:existing.aibom,state_packet:existing.state_packet};}
  const seed=nativeRandom(32),kp=PB_CORE['crypto/ed25519.mjs'].keyPairFromSeed(seed),created=new Date().toISOString(),fingerprint=bytesHex(PB_CORE['crypto/sha256.mjs'].sha256(kp.publicKey));
  const actor={id:agent_id,session_id,algorithm:'Ed25519',public_key_raw_b64u:b64uEncode(kp.publicKey),fingerprint_sha256:fingerprint,registered_at:created,scope:'Local application registration; registration time is not spawn-time proof.'};
  const body={schema:'ProofBundleAgentStatePacket/v1',agent_id,session_id,model,provider,registered_at:created,public_key_raw_b64u:actor.public_key_raw_b64u,metadata_basis:'Supplied at registration',continuity_evidence:null};
  const aibom=PB_CORE['crypto/aibom.mjs'].buildAibom({artifact:'urn:agent:'+encodeURIComponent(agent_id)+':session:'+encodeURIComponent(session_id),riskTier:'unclassified',generatedAt:created,ancestry:[],modelCards:[{model,provider,session_id}],custodyChain:'Local application registry',attestationRecord:actor.scope,publicKeyRaw:kp.publicKey,signer:digest=>PB_CORE['crypto/ed25519.mjs'].sign(digest,seed)});
  const state_packet={body,digest_alg:'SHA3-384',signature_algorithm:'Ed25519',signature_b64u:b64uEncode(PB_CORE['crypto/ed25519.mjs'].sign(PB_CORE['crypto/keccak.mjs'].sha3_384(utf8(canonicalJSON(body))),seed))};
  const saved=await keepIdentity({id,identity:actor,seed_b64u:b64uEncode(seed),aibom,state_packet});
  if(saved.state_packet.body.model!==model||saved.state_packet.body.provider!==provider)throw new Error('Existing registration has different declared metadata');
  return {identity:saved.identity,aibom:saved.aibom,state_packet:saved.state_packet};
 }
 async function registerFromForm(){const el=document.getElementById('native-agent-status');try{const record=await registerAgent({agent_id:document.getElementById('native-agent-id').value.trim(),session_id:document.getElementById('native-session-id').value.trim(),model:document.getElementById('native-agent-model').value.trim()||null,provider:document.getElementById('native-agent-provider').value.trim()||null});el.textContent=record.identity.id+' · '+record.identity.fingerprint_sha256;dlText('proofbundle-agent-'+record.identity.fingerprint_sha256.slice(0,16)+'.json',JSON.stringify(record,null,2));}catch(e){el.textContent=e.message;}}
 return {identity,signEvent,exportPublic,refresh,sealPayload,useSigningKey,registerAgent,registerFromForm,keepIdentity,put,database};
})();

window.PBBrowserFiles=(()=>{
 let root=null,current=null,parents=[],entries=[];
 function status(text){const el=document.getElementById('native-folder-status');if(el)el.textContent=text;}
 async function choose(){
  if(!window.showDirectoryPicker){document.getElementById('native-folder-input').click();return;}
  try{root=await showDirectoryPicker({mode:'read'});current=root;parents=[];await PBLocalIdentity.put('folders',{id:'last-folder',handle:root});await render();}catch(e){if(e.name!=='AbortError')status(e.message);}
 }
 async function restore(){try{const db=await PBLocalIdentity.database;const value=await new Promise((resolve,reject)=>{const r=db.transaction('folders').objectStore('folders').get('last-folder');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(value?.handle&&await value.handle.queryPermission({mode:'read'})==='granted'){root=value.handle;current=root;await render();}}catch(e){status('Choose a folder to browse its files.');}}
 async function render(){
  if(!current)return;entries=[];for await(const [name,handle] of current.entries())entries.push({name,handle});entries.sort((a,b)=>(a.handle.kind==='directory'?0:1)-(b.handle.kind==='directory'?0:1)||a.name.localeCompare(b.name));
  document.getElementById('native-folder-name').textContent=[root.name,...parents.map(x=>x.name).slice(1),...(current!==root?[current.name]:[])].join(' / ');
  const list=document.getElementById('native-folder-list');list.replaceChildren();
  for(const [i,item] of entries.entries()){const row=document.createElement('button');row.className='native-file-row';row.type='button';const name=document.createElement('span');name.textContent=item.name;const kind=document.createElement('span');kind.textContent=item.handle.kind==='directory'?'Folder':'File';row.append(name,kind);row.onclick=()=>open(i).catch(e=>status(e.message));list.append(row);}
  status(entries.length+' entries · selected folder access · originals unchanged');
 }
 function relativeFile(file){const path=[root.name,...parents.map(x=>x.name).slice(1),...(current!==root?[current.name]:[]),file.name].join('/');Object.defineProperty(file,'webkitRelativePath',{value:path});return file;}
 async function open(i){const item=entries[i];if(item.handle.kind==='directory'){parents.push(current);current=item.handle;await render();}else{const file=relativeFile(await item.handle.getFile());await addFiles([file]);switchTab('files',document.querySelector('[data-title^="Files"]'));}}
 async function parent(){if(parents.length){current=parents.pop();await render();}}
 async function capture(){if(!current)return;const files=[];for(const item of entries)if(item.handle.kind==='file')files.push(relativeFile(await item.handle.getFile()));await addFiles(files);switchTab('files',document.querySelector('[data-title^="Files"]'));}
 async function fallback(input){if(!input.files.length)return;await addFiles(Array.from(input.files));status(input.files.length+' files selected · original relative paths retained');switchTab('files',document.querySelector('[data-title^="Files"]'));}
 return {choose,restore,render,parent,capture,fallback};
})();

window.PBEncryption=(()=>{
 const cat=PB_CORE['crypto/der.mjs'].concatBytes;
 function key(shared,salt,header){return PB_CORE['crypto/hkdf.mjs'].hkdfSha256(shared,32,salt,utf8('PB-ENCRYPTED-1\0'+canonicalJSON(header)));}
 function aead(name){if(name==='ChaCha20-Poly1305')return {seal:PB_CORE['crypto/chacha20-poly1305.mjs'].chacha20poly1305Seal,open:PB_CORE['crypto/chacha20-poly1305.mjs'].chacha20poly1305Open};if(name==='AES-256-GCM')return {seal:PB_CORE['crypto/aes256-gcm.mjs'].aes256gcmSeal,open:PB_CORE['crypto/aes256-gcm.mjs'].aes256gcmOpen};throw new Error('Unsupported AEAD');}
 function keygen(parameter='ML-KEM-768'){return PB_CORE['crypto/mlkem.mjs'].mlkemKeygen(nativeRandom(64),parameter);}
 function seal(plaintext,recipientKey,{parameter='ML-KEM-768',cipher='ChaCha20-Poly1305'}={}){
  const kem=PB_CORE['crypto/mlkem.mjs'].mlkemEncapsulate(recipientKey,nativeRandom(32),parameter),salt=nativeRandom(32),nonce=nativeRandom(12);
  const header={schema:'PB-ENCRYPTED-1',kem:parameter,aead:cipher,kem_ciphertext_b64u:b64uEncode(kem.ciphertext),salt_b64u:b64uEncode(salt),nonce_b64u:b64uEncode(nonce),recipient_sha256:hexOf(PB_CORE['crypto/sha256.mjs'].sha256(recipientKey))};
  const encrypted=aead(cipher).seal(key(kem.sharedSecret,salt,header),nonce,plaintext,utf8(canonicalJSON(header)));
  return {...header,ciphertext_b64u:b64uEncode(encrypted.ciphertext),tag_b64u:b64uEncode(encrypted.tag)};
 }
 function open(envelope,recipientSecret){
  const {ciphertext_b64u,tag_b64u,...header}=envelope;if(header.schema!=='PB-ENCRYPTED-1')throw new Error('Unknown encrypted envelope');
  const shared=PB_CORE['crypto/mlkem.mjs'].mlkemDecapsulate(recipientSecret,b64uDecode(header.kem_ciphertext_b64u),header.kem);
  return aead(header.aead).open(key(shared,b64uDecode(header.salt_b64u),header),b64uDecode(header.nonce_b64u),b64uDecode(ciphertext_b64u),b64uDecode(tag_b64u),utf8(canonicalJSON(header)));
 }
 let recipient=null;
 async function createRecipient(){const parameter=document.getElementById('native-kem').value;const db=await PBLocalIdentity.database;recipient=await new Promise((resolve,reject)=>{const r=db.transaction('identities').objectStore('identities').get('recipient-'+parameter);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(!recipient){const kp=keygen(parameter);recipient=await PBLocalIdentity.keepIdentity({id:'recipient-'+parameter,parameter,encaps_b64u:b64uEncode(kp.encapsKey),decaps_b64u:b64uEncode(kp.decapsKey),created_at:new Date().toISOString()});}document.getElementById('native-recipient-public').value=recipient.encaps_b64u;document.getElementById('native-encryption-status').textContent='Recipient key ready · '+parameter+' · stored in this browser';}
 function exportRecipient(){if(!recipient)throw new Error('Create a recipient key first');dlText('proofbundle-decryption-key-'+recipient.parameter+'.json',JSON.stringify({schema:'PB-DECRYPTION-KEY-1',...recipient},null,2));}
 async function importRecipient(file){const key=parseNativeJSON(await file.text());if(key.schema!=='PB-DECRYPTION-KEY-1'||!PB_CORE['crypto/mlkem.mjs'].PARAMS[key.parameter])throw new Error('Unsupported decryption key');recipient=key;document.getElementById('native-kem').value=key.parameter;document.getElementById('native-recipient-public').value=key.encaps_b64u;document.getElementById('native-encryption-status').textContent='Decryption key loaded locally.';}
 async function encryptFile(){
  const status=document.getElementById('native-encryption-status');try{
   const file=document.getElementById('native-encrypt-file').files[0];if(!file)throw new Error('Choose a file to encrypt');
   const parameter=document.getElementById('native-kem').value,cipher=document.getElementById('native-aead').value,publicKey=b64uDecode(document.getElementById('native-recipient-public').value.trim());
   status.textContent='Encrypting locally…';const plaintext=new Uint8Array(await file.arrayBuffer()),envelope=seal(plaintext,publicKey,{parameter,cipher});
   const bundle=await PBLocalIdentity.sealPayload({encrypted_file:envelope});await registerBundle(bundle,'native-encryption');dlText(file.name+'.encrypted.pb.json',JSON.stringify(bundle,null,2));status.textContent='Encrypted receipt downloaded · '+parameter+' / '+cipher;
  }catch(e){status.textContent=e.message;}
 }
 async function decryptFile(file){const status=document.getElementById('native-encryption-status');try{
  if(!recipient)throw new Error('Create or import the recipient decryption key first');const bundle=parseNativeJSON(await file.text()),result=await verifyCore(bundle,{});if(result.outcome!=='VERIFIED')throw new Error('Encrypted receipt verification: '+result.outcome);
  const plaintext=open(bundle.payload.encrypted_file,b64uDecode(recipient.decaps_b64u)),url=URL.createObjectURL(new Blob([plaintext]));const a=document.createElement('a');a.href=url;a.download=file.name.replace(/\.encrypted\.pb\.json$/, '')||'decrypted-file';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Signature and authentication checked · decrypted file downloaded';
 }catch(e){status.textContent=e.message;}}
 return {keygen,seal,open,createRecipient,exportRecipient,importRecipient,encryptFile,decryptFile};
})();

window.PBNativeBasis={render(){
 const ledger=parseNativeJSON(document.getElementById('native-crypto-basis').textContent),target=document.getElementById('native-basis-profiles');target.replaceChildren();
 for(const profile of ledger.profiles){const details=document.createElement('details');details.className='card';const summary=document.createElement('summary');summary.textContent=profile.id;details.append(summary);const scope=document.createElement('p');scope.textContent=profile.scope+' · implementation refinement '+profile.formal_implementation_refinement;details.append(scope);
  const sources=document.createElement('p');for(const entry of profile.sources){const link=document.createElement('a');link.href='https://github.com/proofbundle/proofbundle/blob/main/'+entry.path;link.target='_blank';link.rel='noopener noreferrer';link.textContent=entry.path;sources.append(link,document.createElement('br'));if(entry.sha256){const code=document.createElement('code');code.style.overflowWrap='anywhere';code.textContent='SHA-256 '+entry.sha256;sources.append(code,document.createElement('br'));}}details.append(sources);
  const list=document.createElement('ul');for(const text of profile.obligations){const item=document.createElement('li');item.textContent=text;list.append(item);}details.append(list);
  const refs=document.createElement('p');for(const url of profile.normative_sources){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Normative source ↗';refs.append(link,document.createElement('br'));}for(const path of profile.evidence){const link=document.createElement('a');link.href='https://github.com/proofbundle/proofbundle/blob/main/'+path;link.textContent='Evidence: '+path.split('/').at(-1);link.target='_blank';link.rel='noopener noreferrer';refs.append(link,document.createElement('br'));}details.append(refs);target.append(details);
 }
}};
