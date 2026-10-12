// SPDX-License-Identifier: GPL-3.0-or-later
const fs=require('node:fs');
const {join}=require('node:path');
module.exports=async({win,state,localCall})=>{
  await win.webContents.executeJavaScript('window.ALETHEIA_READY');
  const attempted=await win.webContents.executeJavaScript('Aletheia.checkpoint().then(receipt=>({ok:true,receipt}),error=>({ok:false,error:{name:error?.name,message:error?.message,stack:error?.stack}}))');
  if(!attempted.ok)throw new Error(JSON.stringify(attempted.error));
  const checkpoint=attempted.receipt;
  console.log(JSON.stringify({storage_verification:'record checkpoint complete',checkpoint}));
  const exported=await win.webContents.executeJavaScript('Aletheia.exportNativeArchive()');
  const inspected=await localCall('inspectArchiveZip',{path:exported.path});
  const seal=await win.webContents.executeJavaScript('verifyCore('+JSON.stringify(inspected.bundle)+',{})');
  if(seal.outcome!=='VERIFIED')throw new Error('Exported archive manifest signature failed');
  const staged=await localCall('stageArchiveZip',{path:exported.path,bundle:inspected.bundle});
  const report={schema:'ProofBundleNativeArchiveStorageVerification/v1',observed_at:new Date().toISOString(),checkpoint,exported,
    seal_outcome:seal.outcome,validated_collections:staged.snapshot.counts,scope:'Actual retained archive checkpointed record by record; portable native sealed ZIP exported, reopened, and every packaged record and blob hash checked. Renderer restoration has a separate receipt.'};
  fs.writeFileSync(join(state,'proofbundle-archive-storage-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({storage_verification:'PASSED',report:join(state,'proofbundle-archive-storage-verification.json'),exported}));
  return report;
};
