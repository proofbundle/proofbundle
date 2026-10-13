import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes as oracleRandom,createHash as oracleHash,createDecipheriv,createPrivateKey,createPublicKey,diffieHellman,hkdfSync} from 'node:crypto';
import {createHash} from '../../crypto/hash.mjs';
import {buildAibom,verifyAibom} from '../../crypto/aibom.mjs';
import {keyPairFromSeed,sign as edSign} from '../../crypto/ed25519.mjs';
import {encryptPayload,decryptPayload,KX_ALG} from '../../agent/envelope.mjs';
import {x25519Keygen} from '../../crypto/x25519.mjs';
import {canonicalizeObject,parseJSON} from '../../src/canonical/canonical-json.mjs';
test('scratch streaming hashes match independent references across block boundaries',()=>{
 for(const name of ['sha256','sha384','sha512','blake2b512'])for(const length of [0,1,55,56,63,64,111,112,127,128,129,511,4096])for(const chunk of [1,17,128,257]){
  const input=oracleRandom(length),hash=createHash(name);for(let at=0;at<length;at+=chunk)hash.update(input.subarray(at,at+chunk));assert.equal(hash.digest('hex'),oracleHash(name).update(input).digest('hex'));
 }
});
test('AI-BOM verification rejects signature-only alteration and forged low-order key',()=>{
 const seed=new Uint8Array(32).fill(9),key=keyPairFromSeed(seed),record=buildAibom({artifact:'urn:test:identity',generatedAt:'2026-10-13T00:00:00Z',publicKeyRaw:key.publicKey,signer:message=>edSign(message,seed)});
 assert.deepEqual(verifyAibom(record),[]);const modified=structuredClone(record),signature=Buffer.from(modified.bom_seal.signature_b64u,'base64url');signature[0]^=1;modified.bom_seal.signature_b64u=signature.toString('base64url');assert(verifyAibom(modified).includes('signature verification failed'));
});
test('relay encryption retains its wire format and authenticates before returning plaintext',()=>{
 const recipient=x25519Keygen(new Uint8Array(oracleRandom(32))),der=Buffer.concat([Buffer.from('302e020100300506032b656e04220420','hex'),Buffer.from(recipient.privateKey)]);
 const body={message:'source-bound native relay',revision:1},payload=encryptPayload(JSON.stringify(body),Buffer.from(recipient.publicKey).toString('hex'));assert.deepEqual(decryptPayload(payload,der),body);
 const shared=diffieHellman({privateKey:createPrivateKey({key:der,format:'der',type:'pkcs8'}),publicKey:createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b656e032100','hex'),Buffer.from(payload.encapsulated_key,'hex')]),format:'der',type:'spki'})}),salt=Buffer.from(payload.kx_salt,'hex'),key=hkdfSync('sha256',shared,salt,Buffer.from(KX_ALG),32),data=Buffer.from(payload.ciphertext,'hex'),oracle=createDecipheriv('chacha20-poly1305',key,Buffer.from(payload.nonce,'hex'),{authTagLength:16});oracle.setAAD(salt);oracle.setAuthTag(data.subarray(-16));assert.deepEqual(JSON.parse(Buffer.concat([oracle.update(data.subarray(0,-16)),oracle.final()]).toString()),body);
 const modified=structuredClone(payload);modified.ciphertext=(modified.ciphertext[0]==='0'?'1':'0')+modified.ciphertext.slice(1);assert.throws(()=>decryptPayload(modified,der),/authentication/);
 assert.throws(()=>encryptPayload('{}','00'.repeat(32)),/low-order/);
});
test('plain objects canonicalize without discarding unsupported values',()=>{
 const text=value=>new TextDecoder().decode(canonicalizeObject(value));assert.equal(text({b:1,a:-0}),'{"a":0,"b":1}');
 assert.throws(()=>text({a:undefined}));assert.throws(()=>text({a:'\ud800'}));assert.throws(()=>text({a:new Date()}));assert.throws(()=>text(Array(2)));assert.throws(()=>parseJSON('{"a":1,"a":2}'));
});

import {assertAgentId} from '../../agent/identity.mjs';
test('Agent filesystem identifiers cannot traverse custody roots',()=>{for(const id of ['../escape','a/b','a\\b','..','__proto__',''])assert.throws(()=>assertAgentId(id));assert.equal(assertAgentId('codex-qa.1'),'codex-qa.1');});
