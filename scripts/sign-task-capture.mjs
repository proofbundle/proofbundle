#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Native HTML key generation and per-record signatures for retrospective task
// captures. This does not claim signatures existed when tool actions executed.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, webcrypto, createPrivateKey, createPublicKey, randomUUID } from 'node:crypto';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';
const [stateArgument, sourceArgument, outputArgument] = process.argv.slice(2);
if (!stateArgument || !sourceArgument || !outputArgument) throw new Error('state directory, source JSON, and output bundle are required');
const state = resolve(stateArgument), artifact = resolve('proofbundle.html');
mkdirSync(state, { recursive: true, mode: 0o700 });
const html = readFileSync(artifact);
const dom = new JSDOM(html.toString('utf8'), { url:'https://localhost/', runScripts:'dangerously', pretendToBeVisual:true,
  virtualConsole:new VirtualConsole(), beforeParse(w) {
    const U8=w.Uint8Array;
    w.TextEncoder=class {encode(v){return new U8(new TextEncoder().encode(v));}};w.TextDecoder=TextDecoder;
    Object.defineProperty(w,'crypto',{value:{subtle:webcrypto.subtle,getRandomValues:b=>{b.set(webcrypto.getRandomValues(new Uint8Array(b.length)));return b;},randomUUID:()=>randomUUID()}});
    w.indexedDB=new IDBFactory();w.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});
    w.HTMLCanvasElement.prototype.getContext=()=>null;
    w.fetch=async()=>({ok:false,status:404,text:async()=> '{}',json:async()=>({})});
  }});
const w=dom.window;
try {
  await w.ALETHEIA_READY;
  for(let i=0;i<120&&!w.PB_SELFTEST;i++)await new Promise(r=>setTimeout(r,10));
  const keyFile=join(state,'native-key.secret.json');
  let key;
  if(existsSync(keyFile))key=JSON.parse(readFileSync(keyFile,'utf8'));
  else {key=await w.eval("sigKeygen('Ed25519')");writeFileSync(keyFile,JSON.stringify(key)+'\n',{mode:0o600,flag:'wx'});}
  const seed=Buffer.from(key.priv,'base64url');
  const privateKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]),format:'der',type:'pkcs8'});
  const pub=createPublicKey(privateKey).export({format:'der',type:'spki'}).subarray(-32);
  if(pub.toString('base64url')!==key.pub)throw new Error('Native HTML seed does not reproduce its declared public key');
  writeFileSync(join(state,'native-key.pkcs8.pem'),privateKey.export({format:'pem',type:'pkcs8'}),{mode:0o600});
  const source=JSON.parse(readFileSync(resolve(sourceArgument),'utf8'));
  const scope='Retrospective capture signatures authenticate local transcript bytes at capture time. Per-action signing at execution time and external bridge registration are not established.';
  const aibom={schema:'ProofBundleTaskCaptureAIBOM/v1',actor_id:'codex-task-'+source.chat_id,algorithm:'Ed25519',
    public_key_b64u:key.pub,key_generation:{artifact_sha256:createHash('sha256').update(html).digest('hex'),function:"sigKeygen('Ed25519')",runtime:process.version},
    source_chat_id:source.chat_id,observed_at:new Date().toISOString(),scope,external_bridge_registration:'not-established'};
  const captures=[];
  for(const record of source.records){
    const capture={schema:'ProofBundleToolObservation/v1',observed_at:new Date().toISOString(),native:record,scope};
    w.__capture=capture;w.__key=key;
    const bytes=w.eval("utf8('PROOFBUNDLE-TOOL-OBSERVATION-1\\0'+canonicalJSON(window.__capture))");
    const signature=await w.sigSign('Ed25519',bytes,key.priv);
    if(!await w.sigVerify('Ed25519',bytes,signature,key.pub))throw new Error('Native observation signature failed');
    captures.push({...capture,signature:{algorithm:'Ed25519',public_key_b64u:key.pub,signature_b64u:w.b64uEncode(signature)}});
  }
  const bundle={hdr:{bundle_id:'task-capture-'+randomUUID(),profile:'PB-INTEGRITY-1',spec_id:'PROOFBUNDLE',spec_ver:'1.0.0'},
    meta:{created_at:new Date().toISOString(),producer_id:aibom.actor_id,proof_kind:'source-observation',boundary:{all:[]}},
    payload:{schema:'ProofBundleSignedTaskCapture/v1',aibom,captures,source_commitment:source.source_commitment||null}};
  await w.sealCore(bundle,'SHA3-256','Ed25519',key);
  const verified=await w.verifyCore(bundle,{});
  if(verified.outcome!=='VERIFIED')throw new Error('Native task bundle refused: '+verified.outcome);
  writeFileSync(resolve(outputArgument),JSON.stringify(bundle,null,2)+'\n');
  writeFileSync(join(state,'aibom.json'),JSON.stringify(aibom,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({bundle:resolve(outputArgument),observations:captures.length,signature:'Ed25519',
    outcome:verified.outcome,scope}));
} finally {dom.window.close();}
