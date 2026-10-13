import fs from 'node:fs';
import {sha256hex} from '../crypto/sha256.mjs';
import {mlkemKeygen,mlkemEncapsulate,mlkemDecapsulate,mlkemCheckEncapsulationKey,mlkemCheckDecapsulationKey} from '../crypto/mlkem.mjs';
import {mldsaKeygen,mldsaSign,mldsaVerify} from '../crypto/mldsa.mjs';
const root='vectors/nist-acvp',source=JSON.parse(fs.readFileSync(root+'/SOURCE_MANIFEST.json','utf8'));
const bytes=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16)),hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
for(const file of source.files)if(sha256hex(fs.readFileSync(file.path))!==file.sha256)throw new Error('NIST source hash mismatch: '+file.path);
const results=[],failures=[];
const implementationSources=['crypto/mlkem.mjs','crypto/mldsa.mjs','crypto/keccak.mjs','crypto/sha256.mjs','crypto/sha512.mjs'].map(path=>({path,sha256:sha256hex(fs.readFileSync(path))}));
for(const suite of ['ML-KEM-keyGen-FIPS203','ML-KEM-encapDecap-FIPS203','ML-DSA-keyGen-FIPS204','ML-DSA-sigGen-FIPS204','ML-DSA-sigVer-FIPS204']){
 const prompt=JSON.parse(fs.readFileSync(`${root}/${suite}/prompt.json`,'utf8')),expected=JSON.parse(fs.readFileSync(`${root}/${suite}/expectedResults.json`,'utf8'));
 const expectedCases=new Map(expected.testGroups.flatMap(g=>g.tests.map(t=>[t.tcId,t])));let passed=0,failed=0;
 for(const group of prompt.testGroups)for(const test of group.tests){const e=expectedCases.get(test.tcId),param=group.parameterSet;let good=false;
  try{
   if(suite==='ML-KEM-keyGen-FIPS203'){const kp=mlkemKeygen(bytes(test.d+test.z),param);good=hex(kp.encapsKey)===e.ek&&hex(kp.decapsKey)===e.dk;}
   else if(suite==='ML-KEM-encapDecap-FIPS203'){
    if(group.function==='encapsulation'){const encaps=mlkemEncapsulate(bytes(test.ek),bytes(test.m),param);good=hex(encaps.ciphertext)===e.c&&hex(encaps.sharedSecret)===e.k;}
    else if(group.function==='decapsulation')good=hex(mlkemDecapsulate(bytes(test.dk),bytes(test.c),param))===e.k;
    else if(group.function==='encapsulationKeyCheck')good=mlkemCheckEncapsulationKey(bytes(test.ek),param)===e.testPassed;
    else if(group.function==='decapsulationKeyCheck')good=mlkemCheckDecapsulationKey(bytes(test.dk),param)===e.testPassed;
   }else if(suite==='ML-DSA-keyGen-FIPS204'){const kp=mldsaKeygen(bytes(test.seed),param);good=hex(kp.publicKey)===e.pk&&hex(kp.privateKey)===e.sk;}
   else{
    const options={context:bytes(test.context||''),internal:group.signatureInterface==='internal',externalMu:!!group.externalMu,preHash:group.preHash==='preHash'?test.hashAlg:null},message=bytes(test.mu||test.message),randomness=group.deterministic?new Uint8Array(32):bytes(test.rnd||'00'.repeat(32));
    if(suite==='ML-DSA-sigGen-FIPS204')good=hex(mldsaSign(bytes(test.sk),message,randomness,param,options))===e.signature;
    else good=mldsaVerify(bytes(test.pk),message,bytes(test.signature),param,options)===e.testPassed;
   }
  }catch(error){failures.push({suite,group:group.tgId,test:test.tcId,parameter:param,error:error.message});}
  if(good)passed++;else{failed++;if(!failures.some(f=>f.suite===suite&&f.test===test.tcId))failures.push({suite,group:group.tgId,test:test.tcId,parameter:param,error:'Expected result mismatch'});}
 }
 results.push({suite,passed,failed});console.log(suite,passed+' passed',failed+' failed');
}
const receipt={schema:'ProofBundleConformanceReceipt/v1',source_repository:source.source_repository,source_commit:source.source_commit,implementation_sources:implementationSources,executed_at:new Date().toISOString(),scope:'NIST ACVP published sample vectors; not CAVP or FIPS module certification',results,failures};
fs.mkdirSync('reports/native-repair-20261013',{recursive:true});fs.writeFileSync('reports/native-repair-20261013/nist-acvp.json',JSON.stringify(receipt,null,2)+'\n');
if(failures.length){console.log(JSON.stringify(failures.slice(0,8)));process.exitCode=1;}
