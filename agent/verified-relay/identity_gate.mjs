#!/usr/bin/env node
// Local integration of existing ProofBundle identity, AIBOM and envelope primitives.
// JSON stdin/stdout. Private keys stay in the established agent key directory.
import {readFileSync,writeFileSync,existsSync,mkdirSync,appendFileSync,statSync,realpathSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {createHash,generateKeyPairSync,randomBytes,createPrivateKey,createPublicKey,sign,verify,hkdfSync,createCipheriv,createDecipheriv} from 'node:crypto';
const REPO=process.env.PB_REPO_ROOT||join(homedir(),'src','proofbundle');
const {loadOrCreateIdentity}=await import(join(REPO,'agent','identity.mjs'));
const {buildAibom,verifyAibom}=await import(join(REPO,'crypto','aibom.mjs'));
const {seal,verifyEnvelope,decryptPayload,canonicalJSON}=await import(join(REPO,'agent','envelope.mjs'));
const {mlkemKeygen,mlkemEncapsulate,mlkemDecapsulate}=await import(join(REPO,'crypto','mlkem.mjs'));

const ROOT=process.env.PB_AGENT_ROOT||join(homedir(),'.proofbundle','agent');
export const DEFAULT_VERIFIER='proofbundle-verifier-20261011';
export const PQ_PROFILE='ml-kem-768-hkdf-sha256-chacha20poly1305-v1';
const hash=b=>createHash('sha256').update(b).digest('hex');
const idPath=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(id))throw Error('invalid agent ID');return join(ROOT,id);};
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const privateBytes=p=>{if((statSync(p).mode&0o777)!==0o600)throw Error('private key mode must be 0600');return readFileSync(p);};
const key=id=>createPrivateKey({key:privateBytes(join(idPath(id),'secret.key')),format:'der',type:'pkcs8'});
const publicKey=id=>createPublicKey({key:Buffer.from(json(join(idPath(id),'identity.json')).pubkey,'hex'),format:'der',type:'spki'});
const putOnce=(p,b,mode=0o644)=>writeFileSync(p,b,{flag:'wx',mode});

export function verify_identity(agentId){
  const dir=idPath(agentId),identity=json(join(dir,'identity.json')),bom=json(join(dir,'aibom.json'));
  const problems=verifyAibom(bom);
  if(problems.length)throw Error('AIBOM failed digest/structure verification');
  if(bom.bom_seal.pub_b64u!==Buffer.from(identity.pubkey,'hex').subarray(-32).toString('base64url'))throw Error('AIBOM signing key mismatch');
  if(!verify(null,Buffer.from(bom.bom_seal.digest_b64u,'base64url'),publicKey(agentId),Buffer.from(bom.bom_seal.signature_b64u,'base64url')))throw Error('AIBOM signature failed');
  if(identity.agent_id!==agentId)throw Error('identity ID mismatch');
  const binding=json(join(dir,'communication-binding.json'));
  const {signature_b64u,...body}=binding;
  if(body.agent_id!==agentId||body.key_fingerprint!==identity.key_fingerprint)throw Error('binding identity mismatch');
  if(!verify(null,Buffer.from(canonicalJSON(body)),publicKey(agentId),Buffer.from(signature_b64u,'base64url')))throw Error('encryption/thread binding signature failed');
  let pqBinding=null;
  if(existsSync(join(dir,'communication-pq-binding.json'))){
    pqBinding=json(join(dir,'communication-pq-binding.json'));
    const {signature_b64u:signature,...pqBody}=pqBinding;
    if(pqBody.agent_id!==agentId||pqBody.key_fingerprint!==identity.key_fingerprint||!verify(null,Buffer.from(canonicalJSON(pqBody)),publicKey(agentId),Buffer.from(signature,'base64url')))throw Error('PQ encryption binding signature failed');
  }
  return {agent_id:agentId,thread_id:binding.thread_id,key_fingerprint:identity.key_fingerprint,pubkey:identity.pubkey,enc_pubkey:binding.enc_pubkey,pq_binding:pqBinding,aibom_artifact:bom.artifact,aibom_digest:bom.bom_seal.digest_b64u,aibom:bom,binding,verified:true};
}

function modelCard(threadId,provider=null,model=null,source=null){
  for(const value of [provider,model,source])if(value!==null&&(typeof value!=='string'||!value.trim()||value.length>2048))throw Error('invalid model attribution');
  return {provider:provider??'unverified',model:model??'unverified',role:'agent',thread_id:threadId,declared_by:'local-conversation-binding',source:source??'not supplied'};
}
export function register(agentId,threadId=null,provider=null,model=null,source=null){
  const card=modelCard(threadId,provider,model,source);
  const dir=idPath(agentId);mkdirSync(dir,{recursive:true});
  const identity=loadOrCreateIdentity(agentId,ROOT);
  if(!existsSync(join(dir,'aibom.json'))){
    const bom=buildAibom({artifact:`urn:proofbundle:communication:${agentId}`,generatedAt:new Date().toISOString(),
      modelCards:threadId?[card]:[],
      custodyChain:`agent:${agentId} fp:${identity.key_fingerprint}`,attestationRecord:'Local communication registration; no prior identity inheritance asserted',
      publicKeyRaw:Buffer.from(identity.pubkey,'hex').subarray(-32),signer:d=>sign(null,Buffer.from(d),key(agentId))});
    if(verifyAibom(bom).length)throw Error('new AIBOM verification failed');
    putOnce(join(dir,'aibom.json'),JSON.stringify(bom,null,2)+'\n');
    appendFileSync(join(ROOT,'aibom-ledger.ndjson'),JSON.stringify(bom)+'\n');
  }
  if(!existsSync(join(dir,'communication-binding.json'))){
    const enc=generateKeyPairSync('x25519');
    putOnce(join(dir,'communication-enc.key'),enc.privateKey.export({type:'pkcs8',format:'der'}),0o600);
    const binding={schema:'PB-COMMUNICATION-IDENTITY-1',agent_id:agentId,thread_id:threadId,key_fingerprint:identity.key_fingerprint,
      enc_pubkey:enc.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('hex'),created_at:new Date().toISOString(),
      algorithms:{signing:'Ed25519',encryption:'x25519-hkdf-sha256-chacha20poly1305-v1',aibom_digest:'SHA3-384'}};
    putOnce(join(dir,'communication-binding.json'),JSON.stringify({...binding,signature_b64u:sign(null,Buffer.from(canonicalJSON(binding)),key(agentId)).toString('base64url')},null,2)+'\n');
  }
  if(!existsSync(join(dir,'communication-pq-binding.json'))){
    const {encapsKey,decapsKey}=mlkemKeygen(new Uint8Array(randomBytes(64)),'ML-KEM-768');
    putOnce(join(dir,'communication-mlkem.key'),Buffer.from(decapsKey),0o600);
    const body={schema:'PB-COMMUNICATION-PQ-IDENTITY-1',agent_id:agentId,key_fingerprint:identity.key_fingerprint,
      profile:PQ_PROFILE,pubkey_hex:Buffer.from(encapsKey).toString('hex'),created_at:new Date().toISOString()};
    putOnce(join(dir,'communication-pq-binding.json'),JSON.stringify({...body,signature_b64u:sign(null,Buffer.from(canonicalJSON(body)),key(agentId)).toString('base64url')},null,2)+'\n');
  }
  const result=verify_identity(agentId);
  if(result.thread_id!==threadId)throw Error('existing identity has a different thread binding');
  return result;
}

// Explicit correction: retain the exact prior signed artifact and link it in
// the new signed AIBOM. Registration alone never rewrites existing evidence.
export function correct_model_card(agentId,provider,model,source){
  if(!provider||!model||!source)throw Error('correction requires provider, model and source');
  const previous=verify_identity(agentId),dir=idPath(agentId);
  const card=modelCard(previous.thread_id,provider,model,source);
  if(canonicalJSON(previous.aibom.model_cards)===canonicalJSON([card]))return previous;
  const bytes=readFileSync(join(dir,'aibom.json')),digest=hash(bytes);
  const archive=join(dir,'aibom-history');mkdirSync(archive,{recursive:true});
  const saved=join(archive,digest+'.json');
  if(existsSync(saved)){if(!readFileSync(saved).equals(bytes))throw Error('prior artifact archive mismatch');}
  else putOnce(saved,bytes);
  const bom=buildAibom({artifact:previous.aibom.artifact,generatedAt:new Date().toISOString(),
    ancestry:[...previous.aibom.ancestry,{artifact_sha256:digest,bom_digest:previous.aibom_digest,relation:'model-card-correction'}],
    modelCards:[card],custodyChain:previous.aibom.custody_chain,
    attestationRecord:'Explicit model attribution correction; prior signed AIBOM preserved by SHA-256; signing and encryption identities retained',
    publicKeyRaw:Buffer.from(previous.pubkey,'hex').subarray(-32),signer:d=>sign(null,Buffer.from(d),key(agentId))});
  if(verifyAibom(bom).length)throw Error('corrected AIBOM verification failed');
  appendFileSync(join(ROOT,'aibom-ledger.ndjson'),JSON.stringify(bom)+'\n');
  const pending=join(dir,'aibom-correction-'+randomBytes(8).toString('hex')+'.json');
  putOnce(pending,JSON.stringify(bom,null,2)+'\n');renameSync(pending,join(dir,'aibom.json'));
  return verify_identity(agentId);
}

function encryptedEnvelope(sender,payload,recipient,profile){
  if(!profile||profile==='x25519-hkdf-sha256-chacha20poly1305-v1')return seal({agentId:sender.agent_id,privateKeyDer:privateBytes(join(idPath(sender.agent_id),'secret.key')),pubkeyHex:sender.pubkey,
    payload,payloadType:'work',encrypt:true,recipientEncPubKeyHex:recipient.enc_pubkey});
  if(profile!==PQ_PROFILE||!recipient.pq_binding)throw Error('unsupported/unregistered encryption profile');
  const encaps=mlkemEncapsulate(new Uint8Array(Buffer.from(recipient.pq_binding.pubkey_hex,'hex')),new Uint8Array(randomBytes(32)),'ML-KEM-768');
  const salt=randomBytes(32),nonce=randomBytes(12),symmetric=Buffer.from(hkdfSync('sha256',Buffer.from(encaps.sharedSecret),salt,Buffer.from(PQ_PROFILE),32));
  const cipher=createCipheriv('chacha20-poly1305',symmetric,nonce,{authTagLength:16});cipher.setAAD(salt);
  const ct=Buffer.concat([cipher.update(Buffer.from(canonicalJSON(payload))),cipher.final(),cipher.getAuthTag()]);
  const envelope=seal({agentId:sender.agent_id,privateKeyDer:privateBytes(join(idPath(sender.agent_id),'secret.key')),pubkeyHex:sender.pubkey,payload:{},payloadType:'work'});
  envelope.payload={encoding:'canonical-json',encrypted:true,kx:PQ_PROFILE,ciphertext:ct.toString('hex'),encapsulated_key:Buffer.from(encaps.ciphertext).toString('hex'),nonce:nonce.toString('hex'),kx_salt:salt.toString('hex'),body:null};
  envelope.signature=sign(null,Buffer.from(canonicalJSON({...envelope,signature:null})),key(sender.agent_id)).toString('hex');
  return envelope;
}
function decryptEnvelope(envelope,recipientId){
  if(envelope.payload.kx!==PQ_PROFILE)return decryptPayload(envelope.payload,privateBytes(join(idPath(recipientId),'communication-enc.key')));
  const p=envelope.payload,ss=mlkemDecapsulate(new Uint8Array(privateBytes(join(idPath(recipientId),'communication-mlkem.key'))),new Uint8Array(Buffer.from(p.encapsulated_key,'hex')),'ML-KEM-768');
  const salt=Buffer.from(p.kx_salt,'hex'),symmetric=Buffer.from(hkdfSync('sha256',Buffer.from(ss),salt,Buffer.from(PQ_PROFILE),32)),ct=Buffer.from(p.ciphertext,'hex');
  const decipher=createDecipheriv('chacha20-poly1305',symmetric,Buffer.from(p.nonce,'hex'),{authTagLength:16});decipher.setAAD(salt);decipher.setAuthTag(ct.subarray(-16));
  return JSON.parse(Buffer.concat([decipher.update(ct.subarray(0,-16)),decipher.final()]).toString('utf8'));
}
export function seal_request(frm,to,payload,verifierId=DEFAULT_VERIFIER,profile=null){
  const sender=verify_identity(frm),verifier=verify_identity(verifierId);verify_identity(to);
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('payload must be object');
  const message={schema:'PB-COMMUNICATION-REQUEST-1',request_id:randomBytes(24).toString('hex'),from:frm,to,verifier:verifierId,payload};
  return encryptedEnvelope(sender,message,verifier,profile);
}

function checkedEnvelope(envelope){
  if(!envelope?.payload?.encrypted)throw Error('encrypted envelope required');
  const sender=verify_identity(envelope?.from?.agent_id);
  if(sender.pubkey!==envelope.from.pubkey||sender.key_fingerprint!==envelope.from.key_fingerprint)throw Error('unregistered sender key');
  const result=verifyEnvelope(envelope);if(!result.valid)throw Error(result.reason);
  return sender;
}
export function verify_request(envelope,verifierId=DEFAULT_VERIFIER){
  const sender=checkedEnvelope(envelope),verifier=verify_identity(verifierId);
  const message=decryptEnvelope(envelope,verifierId);
  if(message.schema!=='PB-COMMUNICATION-REQUEST-1'||message.verifier!==verifierId||message.from!==sender.agent_id||!(/^[0-9a-f]{48}$/.test(message.request_id)))throw Error('request routing/schema mismatch');
  if(!message.payload||typeof message.payload!=='object'||Array.isArray(message.payload))throw Error('payload must be object');
  const recipient=verify_identity(message.to);
  const delivered={schema:'PB-COMMUNICATION-DELIVERY-1',request_id:message.request_id,from:message.from,to:message.to,verifier:verifierId,payload:message.payload};
  const recipientEnvelope=encryptedEnvelope(verifier,delivered,recipient,envelope.payload.kx);
  const receipt={schema:'PB-COMMUNICATION-VERIFIER-RECEIPT-1',request_id:message.request_id,from:message.from,to:message.to,verifier:verifierId,
    request_sha256:hash(Buffer.from(canonicalJSON(envelope))),delivery_sha256:hash(Buffer.from(canonicalJSON(recipientEnvelope))),
    sender_fingerprint:sender.key_fingerprint,aibom_digest:sender.aibom_digest,verified_at:new Date().toISOString(),signature_verified:true,aibom_verified:true,decryption_verified:true,
    delivery_kind:typeof message.payload.type==='string'?message.payload.type:'message',notify:message.payload.notify!==false};
  const signed={...receipt,signature_b64u:sign(null,Buffer.from(canonicalJSON(receipt)),key(verifierId)).toString('base64url')};
  return {accepted:true,request_id:message.request_id,from:message.from,to:message.to,recipient_envelope:recipientEnvelope,receipt:signed};
}
export function open_delivery(envelope,recipientId,verifierId=DEFAULT_VERIFIER){
  const signer=checkedEnvelope(envelope);
  if(signer.agent_id!==verifierId)throw Error('delivery must be signed by configured verifier');
  const message=decryptEnvelope(envelope,recipientId);
  if(message.schema!=='PB-COMMUNICATION-DELIVERY-1'||message.to!==recipientId||message.verifier!==verifierId)throw Error('delivery routing/schema mismatch');
  return message;
}
export function verify_receipt(receipt,envelope,verifierId=DEFAULT_VERIFIER){
  verify_identity(verifierId);
  const {signature_b64u,...body}=receipt;
  if(body.verifier!==verifierId||body.delivery_sha256!==hash(Buffer.from(canonicalJSON(envelope))))throw Error('receipt/delivery mismatch');
  if(!verify(null,Buffer.from(canonicalJSON(body)),publicKey(verifierId),Buffer.from(signature_b64u,'base64url')))throw Error('verifier receipt signature failed');
  return {verified:true,request_id:body.request_id,to:body.to,notify:body.notify!==false};
}

if(process.argv[1]&&realpathSync(fileURLToPath(import.meta.url))===realpathSync(process.argv[1])){
  try{
    const input=JSON.parse(readFileSync(0,'utf8')),op=input.op;let result;
    if(op==='register')result=register(input.agent_id,input.thread_id??null,input.provider??null,input.model??null,input.source??null);
    else if(op==='correct-model-card')result=correct_model_card(input.agent_id,input.provider,input.model,input.source);
    else if(op==='identity')result=verify_identity(input.agent_id);
    else if(op==='seal')result=seal_request(input.frm,input.to,input.payload,input.verifier??DEFAULT_VERIFIER,input.profile??null);
    else if(op==='verify')result=verify_request(input.envelope,input.verifier??DEFAULT_VERIFIER);
    else if(op==='open')result=open_delivery(input.envelope,input.agent_id,input.verifier??DEFAULT_VERIFIER);
    else if(op==='receipt')result=verify_receipt(input.receipt,input.envelope,input.verifier??DEFAULT_VERIFIER);
    else throw Error('unknown gate operation');
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(e){process.stderr.write(JSON.stringify({error:e.message})+'\n');process.exitCode=1;}
}
