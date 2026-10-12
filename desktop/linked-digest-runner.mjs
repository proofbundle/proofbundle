// Execute archived digest input/output vectors against ProofBundle's actual modular provider.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {digestBytes,digestBytesXOF} from '../src/digest/digest.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const aliases={'sha256':'SHA-256','sha384':'SHA-384','sha512':'SHA-512','sha3-256':'SHA3-256','sha3-384':'SHA3-384','sha3-512':'SHA3-512','shake128':'SHAKE128','shake256':'SHAKE256','blake2b':'BLAKE2b','blake2s':'BLAKE2s'};
const request=JSON.parse(readFileSync(0));const jobs=request.jobs;const results=[];
for(const f of request.provider_sources)if(sha(readFileSync(f.path))!==f.sha256)throw new Error('Provider source hash differs from capture');
for(const job of jobs){
 const algorithm=aliases[job.algorithm_id.toLowerCase()];if(!algorithm)continue;
 const cases=[];
 for(const f of job.vector_files){
  const raw=readFileSync(f.blob_path);if(sha(raw)!==f.sha256)throw new Error('Vector source hash mismatch');
  let vectors;
  if(f.path.endsWith('.txt'))vectors=raw.toString().split('\n').filter(l=>l.includes('|')&&!l.trimStart().startsWith('#')).map((l,i)=>{const [input_hex,expected_output_hex]=l.split('|').map(s=>s.trim());return {id:'row-'+i,input_hex,expected_output_hex};});
  else {const d=JSON.parse(raw);vectors=Array.isArray(d)?d: d.vectors||d.test_vectors||d.cases||d.tests||[];}
  for(let index=0;index<vectors.length;index++){
   const v=vectors[index],input=v.input_hex??(typeof v.input==='string'?v.input:null),expected=v.expected_output_hex??v.expected_digest_hex;
   const row={index,label:v.id||String(index),source_path:f.path,source_sha256:f.sha256,expected,standing:'blocked',executed:false};
   if(input===null||!expected||!/^(?:[a-f\d]{2})*$/i.test(input)||!/^(?:[a-f\d]{2})*$/i.test(expected)){row.reason='No unambiguous input and expected digest bytes';cases.push(row);continue;}
   try{const data=Uint8Array.from(Buffer.from(input,'hex'));const out=algorithm.startsWith('SHAKE')?digestBytesXOF(algorithm,data,expected.length/2):digestBytes(algorithm,data);row.actual=Buffer.from(out).toString('hex');row.executed=true;row.standing=row.actual===expected?'passed':'failed';}
   catch(e){row.reason=e.message;row.actual=e.name;}
   cases.push(row);
  }
 }
 results.push({algorithm_id:job.algorithm_id,algorithm,provider:'ProofBundle src/digest',cases,executed:cases.filter(c=>c.executed).length,passed:cases.filter(c=>c.standing==='passed').length,failed:cases.filter(c=>c.standing==='failed').length,blocked:cases.filter(c=>c.standing==='blocked').length});
}
for(const f of request.provider_sources)if(sha(readFileSync(f.path))!==f.sha256)throw new Error('Provider source changed during execution');
console.log(JSON.stringify({schema:'ProofBundleLinkedDigestExecution/v1',results,provider_runtime:process.version,scope:'Actual modular digest provider compared with original archived source expectations; source inconsistencies remain failures. This provider is separate from the captured Python provider and the HTML engine.'}));
