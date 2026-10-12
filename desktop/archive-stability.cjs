// SPDX-License-Identifier: GPL-3.0-or-later
// A visible-window soak with the complete retained IndexedDB archive resident.
const fs = require('node:fs');
const { join } = require('node:path');
const { sign, createHash } = require('node:crypto');
module.exports = async function ({win,state,identity,key}) {
  const started = Date.now(), samples = [], checks = [];
  const reportPath = join(state,'proofbundle-archive-stability.json');
  let failure = null;
  const fail = (_event, details) => { failure = details; };
  win.webContents.on('render-process-gone', fail);
  const publish = (status, archive) => {
    const record = {schema:'ProofBundleArchiveStability/v1',status,started_at:new Date(started).toISOString(),
      observed_at:new Date().toISOString(),elapsed_seconds:(Date.now()-started)/1000,
      application_file:win.webContents.getURL(),artifact_sha256:identity.runtime_context?.artifact_sha256,archive,checks,samples,failure,
      scope:'The complete retained local custody archive is open through bounded queries: all IndexedDB stores and captured bytes remain available. Large archive records are not all duplicated in the renderer heap. External archive portions not yet supplied or captured are outside this measurement.',
      signer_id:identity.id,public_key_raw_b64u:identity.public_key_raw_b64u};
    const bytes = JSON.stringify(record);
    const attestation = {algorithm:'Ed25519',domain:'PROOFBUNDLE-ARCHIVE-STABILITY-1',
      signature_b64u:sign(null,Buffer.from('PROOFBUNDLE-ARCHIVE-STABILITY-1\0'+bytes),key).toString('base64url'),
      report_sha256:createHash('sha256').update(bytes).digest('hex')};
    fs.writeFileSync(reportPath,JSON.stringify({record,attestation},null,2)+'\n');
  };
  await win.webContents.executeJavaScript('window.ALETHEIA_READY');
  console.log(JSON.stringify({stability:'loading complete retained archive'}));
  const archive = await win.webContents.executeJavaScript(`(async()=>{
    const db=await libraryDb();
    const tx=db.transaction(['artifacts','events','retained','meta']);
    const count=name=>new Promise((resolve,reject)=>{const r=tx.objectStore(name).count();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    let artifactBytes=0,missing=0;
    const scan=new Promise((resolve,reject)=>{const r=tx.objectStore('artifacts').openCursor();r.onerror=()=>reject(r.error);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();artifactBytes+=c.value.blob?.size||0;if(!c.value.blob)missing++;c.continue();};});
    const [artifacts,events,retained]=await Promise.all([count('artifacts'),count('events'),count('retained'),scan]);
    window.__ProofBundleArchiveLoaded={artifacts,events,retained};
    return {artifacts,artifact_bytes:artifactBytes,missing_bytes:missing,custody_events:events,retained_histories:retained,
      source_snapshots:STATE.catalogueSources.length,algorithm_records:STATE.algorithmSources.length,
      vector_files:STATE.vectorSets.length,vector_cases:STATE.vectorSets.reduce((n,x)=>n+(x.vector_count||0),0)};
  })()`);
  checks.push({name:'Complete local archive opened with bounded display access and retained original records',passed:true});
  publish('RUNNING',archive);
  console.log(JSON.stringify({stability:'full archive open',archive}));
  for (let i=0; i<=120; i++) {
    if(failure || win.isDestroyed()) { publish('FAILED',archive); throw new Error('Visible archive window lost'); }
    const sample = await win.webContents.executeJavaScript(`(async()=>{
      const start=performance.now(); await Aletheia.refresh();
      if(!window.__ProofBundleArchiveLoaded) throw new Error('Archive connection was unloaded');
      return {ui_response_ms:performance.now()-start,heap:performance.memory ? performance.memory.usedJSHeapSize:null,
        displayed_artifacts:Number(document.querySelector('#aletheia-count-artifacts').textContent),
        displayed_events:Number(document.querySelector('#aletheia-count-events').textContent),
        title:document.title};
    })()`);
    const processStatus = fs.readFileSync('/proc/' + win.webContents.getOSProcessId() + '/status','utf8');
    const memory = {residentSet:Number(processStatus.match(/^VmRSS:\s+(\d+)/m)?.[1] || 0)};
    samples.push({elapsed_seconds:(Date.now()-started)/1000,...sample,process_memory_kib:memory});
    if(i%4===0) {
      fs.writeFileSync(join(state,'proofbundle-visible.png'),(await win.webContents.capturePage()).toPNG());
      console.log(JSON.stringify({stability:'RUNNING',sample:samples.at(-1),sample_count:samples.length}));
    }
    publish(i===120?'PASSED':'RUNNING',archive);
    if(i<120) await new Promise(resolve=>setTimeout(resolve,15000));
  }
  win.webContents.removeListener('render-process-gone',fail);
  console.log(JSON.stringify({stability:'PASSED',report:reportPath,elapsed_seconds:(Date.now()-started)/1000}));
};
