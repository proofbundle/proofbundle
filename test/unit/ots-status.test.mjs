import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {checkUpgrade} from '../../agent/ots.mjs';
// The adapter only needs an existing path; mocked instrument outputs are
// explicit contract tests, never actual Bitcoin attestations.
const fixture=fileURLToPath(import.meta.url);
test('OTS info alone, failed verify, or silent zero exit cannot establish anchoring',async()=>{
 for(const verify of [async()=>({stdout:'',stderr:''}),async()=>{throw new Error('file mismatch');},async()=>({stdout:'To verify manually, check Bitcoin block 123',stderr:''})]){
  const out=await checkUpgrade(fixture,{run:async(_,args)=>args[0]==='info'?{stdout:'Bitcoin block 123'}:verify()});
  assert.equal(out.state,'submitted');assert.equal(out.verified,false);
 }
});
test('OTS success marker comes from detached verify output, including stderr',async()=>{
 const out=await checkUpgrade(fixture,{run:async(_,args)=>args[0]==='info'?{stdout:'Bitcoin block 123'}:{stdout:'',stderr:'Success! Bitcoin block 123 attests existence as of 2026-10-13 PDT\n'}});
 assert.equal(out.state,'upgraded');assert.equal(out.verified,true);assert.equal(out.block_height,123);
});
test('pending calendar and missing proof remain unverified',async()=>{
 assert.deepEqual(await checkUpgrade(fixture,{run:async()=>({stdout:'Pending attestation https://calendar.example'})}),{state:'submitted',block_height:null});
 assert.equal(await checkUpgrade(fixture+'.missing'),null);
});
