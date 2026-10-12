// SPDX-License-Identifier: GPL-3.0-or-later
// A local file window and a child-process storage boundary; HTTP is separate.
const { app, BrowserWindow, Menu, ipcMain, clipboard, shell } = require('electron');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID, generateKeyPairSync, createPrivateKey, createPublicKey, sign, createHash } = require('node:crypto');
const fs = require('node:fs');
const root = resolve(__dirname, '..');
const entry = join(root, 'proofbundle.html');
app.setName('ProofBundle');
const stateArgument = process.argv.indexOf('--state-dir');
if (stateArgument >= 0) app.setPath('userData', join(resolve(process.argv[stateArgument + 1]), 'browser-profile'));
if (process.platform === 'linux' && !process.argv.some(a => a.startsWith('--ozone-platform')))
  app.commandLine.appendSwitch('ozone-platform', 'x11');
let win, worker, identity, key, counter = 0;
const pending = new Map();

function requireFrame(event) {
  if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame ||
      event.senderFrame.url !== pathToFileURL(entry).href) throw new Error('Untrusted workbench frame');
}

function localCall(operation, args = {}) {
  return new Promise((resolve, reject) => {
    const id = ++counter;
    pending.set(id, { resolve, reject });
    worker.stdin.write(JSON.stringify({ id, operation, args }) + '\n', error => {
      if (error) { pending.delete(id); reject(error); }
    });
  });
}

function loadIdentity(state) {
  const privateFile = join(state, 'signing-key.pkcs8.pem'), identityFile = join(state, 'identity.json');
  fs.mkdirSync(state, { recursive: true, mode: 0o700 });
  if (fs.existsSync(privateFile) && fs.existsSync(identityFile)) {
    key = createPrivateKey(fs.readFileSync(privateFile));
    identity = JSON.parse(fs.readFileSync(identityFile));
    const pub = createPublicKey(key).export({ type: 'spki', format: 'der' }).toString('base64url');
    if (pub !== identity.public_key_spki_b64u) throw new Error('Local signing identity does not match its key');
    identity.runtime_context = { entry_path: entry, artifact_sha256: createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),
      electron: process.versions.electron, node: process.versions.node, observed_at: new Date().toISOString() };
    return;
  }
  const pair = generateKeyPairSync('ed25519'); key = pair.privateKey;
  const publicBytes = pair.publicKey.export({ type: 'spki', format: 'der' });
  identity = { schema: 'AletheiaSigningIdentity/v1', id: 'aletheia-' + randomUUID(),
    algorithm: 'Ed25519', public_key_spki_b64u: publicBytes.toString('base64url'),
    public_key_raw_b64u: publicBytes.subarray(-32).toString('base64url'),
    fingerprint_sha256: createHash('sha256').update(publicBytes).digest('hex'), created_at: new Date().toISOString(),
    scope: 'This local workbench custody recorder; no external agent identity or handshake is asserted.',
    aibom: { application: 'ProofBundle', engine: 'Electron', electron: process.versions.electron,
      node: process.versions.node, entry_path: entry, artifact_sha256: createHash('sha256').update(fs.readFileSync(entry)).digest('hex'),
      actor_kind: 'local-application', external_agent_registration: 'not-established' } };
  fs.writeFileSync(privateFile, key.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(identityFile, JSON.stringify(identity, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  identity.runtime_context = { artifact_sha256: identity.aibom.artifact_sha256,
    electron: process.versions.electron, node: process.versions.node, observed_at: new Date().toISOString() };
}

app.whenReady().then(async () => {
  const stateIndex = process.argv.indexOf('--state-dir');
  const state = stateIndex >= 0 ? resolve(process.argv[stateIndex + 1]) : join(app.getPath('userData'), 'custody');
  loadIdentity(state);
  worker = spawn('python3', [join(root, 'control/aletheia_worker.py'), '--state-dir', state], {
    stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  createInterface({ input: worker.stdout }).on('line', line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    const promise = pending.get(message.id); if (!promise) return;
    pending.delete(message.id);
    if (message.ok) promise.resolve(message.result); else promise.reject(new Error(message.error));
  });
  worker.on('exit', () => { for (const p of pending.values()) p.reject(new Error('Local custody process exited')); pending.clear(); });
  worker.on('error', error => { for (const p of pending.values()) p.reject(error); pending.clear(); });
  win = new BrowserWindow({ width: 1440, height: 960, title: 'ProofBundle', show: !process.argv.includes('--verify-build') && !process.argv.includes('--verify-archive-restore'),
    backgroundColor: '#07101d', webPreferences: { preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: !process.argv.includes('--verify-archive-restore') } });
  win.webContents.on('console-message', (_event,level,message) => {const text=typeof message==='string'?message:_event.message;if(typeof text==='string'&&text.startsWith('PB-DIAG'))console.log(text);});
  win.webContents.on('render-process-gone', (_event, details) => {
    const record = { schema: 'AletheiaDesktopFailure/v1', observed_at: new Date().toISOString(), details,
      entry_path: entry, signer_id: identity.id };
    const canonical = JSON.stringify(record);
    record.signature_b64u = sign(null, Buffer.from('ALETHEIA-DESKTOP-FAILURE-1\0' + canonical), key).toString('base64url');
    fs.appendFileSync(join(state, 'desktop-failures.jsonl'), JSON.stringify(record) + '\n', {mode:0o600});
    console.error(JSON.stringify(record));
  });
  win.on('closed', () => console.log(JSON.stringify({window:'closed',observed_at:new Date().toISOString()})));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => { if (url !== pathToFileURL(entry).href) event.preventDefault(); });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'fileMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]));
  ipcMain.handle('aletheia:local', (event, operation, args) => {
    requireFrame(event);
    if (!['status', 'latest', 'sources', 'search', 'checkpoint', 'putBlob', 'getBlob', 'beginBlob', 'appendBlob', 'finishBlob', 'abortBlob', 'catalogue', 'bridgeSnapshot', 'runVectors', 'runArchiveVectors', 'sourceSnapshot', 'snapshotTestReport','beginRecordCheckpoint','checkpointRecord','finishRecordCheckpoint','checkpointRecordPage','archiveManifest','exportArchiveZip','inspectArchiveZip','stageArchiveZip','beginCheckpointRecord','appendCheckpointRecord','finishCheckpointRecord','checkpointRecordInfo','checkpointRecordChunk','checkpointReaderChunk','cryptoAuditReport','runLinkedConformance','linkedConformanceReport','outcomeDefinitions','bindSourceAliases','checkpointRecords'].includes(operation)) throw new Error('Unsupported local operation');
    return localCall(operation, args);
  });
  ipcMain.handle('aletheia:clipboard-write', async (event, text) => {
    requireFrame(event); if (typeof text !== 'string') throw new Error('Clipboard text is required');
    await clipboard.writeText(text); return true;
  });
  ipcMain.handle('aletheia:identity', event => { requireFrame(event); return identity; });
  ipcMain.handle('aletheia:sign-event', (event, text) => {
    requireFrame(event); if (typeof text !== 'string') throw new Error('Canonical signing bytes are required');
    return { algorithm: 'Ed25519', signer_id: identity.id, public_key_raw_b64u: identity.public_key_raw_b64u,
      signature_b64u: sign(null, Buffer.from('ALETHEIA-CUSTODY-EVENT-1\0' + text, 'utf8'), key).toString('base64url'),
      scope: 'Local custody recorder signature; external source authorship is separate.' };
  });
  ipcMain.handle('aletheia:catalogue', event => { requireFrame(event); return localCall('catalogue', {}); });
  let profileReady;
  if(process.argv.includes('--profile-startup')) {
    profileReady=(async()=>{
    win.webContents.debugger.attach('1.3');
    await win.webContents.debugger.sendCommand('Profiler.enable');
    await win.webContents.debugger.sendCommand('Profiler.start');
    setTimeout(async()=>{try{const result=await win.webContents.debugger.sendCommand('Profiler.stop');fs.writeFileSync(join(state,'startup-cpu-profile.json'),JSON.stringify(result));console.log('PB-DIAG startup CPU profile saved');win.webContents.debugger.detach();}catch(error){console.error(error);}},15000);
    })();
  }
  await win.loadFile(entry);
  if (!process.argv.includes('--verify-build') && !process.argv.includes('--verify-archive-restore')) {
    await win.webContents.executeJavaScript("document.querySelector('[data-title=\"ProofBundle workbench\"]').click()");
    win.show(); win.focus();
  }
  if (process.argv.includes('--show-source')) shell.showItemInFolder(entry);
  if (process.argv.includes('--observe-workbench')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    setTimeout(async () => {
      try {
        const memory = await win.webContents.executeJavaScript('performance.memory ? ({used:performance.memory.usedJSHeapSize,limit:performance.memory.jsHeapSizeLimit}) : null');
        fs.writeFileSync(join(state,'workbench-current.png'), (await win.webContents.capturePage()).toPNG());
        console.log(JSON.stringify({workbench:'visible', screenshot:join(state,'workbench-current.png'), memory}));
      } catch(error) { console.error(error); }
    }, 10000);
  }
  if(process.argv.includes('--verify-archive-restore')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    console.log('PB-DIAG independent renderer ready');
    const index=process.argv.indexOf('--import-archive');
    const path=resolve(process.argv[index+1]);
    console.log('PB-DIAG inspecting independent restore archive');
    const inspected=await localCall('inspectArchiveZip',{path});
    const verified=await win.webContents.executeJavaScript('verifyCore('+JSON.stringify(inspected.bundle)+',{})');
    if(verified.outcome!=='VERIFIED')throw new Error('Archive manifest seal failed');
    console.log('PB-DIAG independent archive manifest verified');
    const staged=await localCall('stageArchiveZip',{path,bundle:inspected.bundle});
    console.log('PB-DIAG independent archive records staged');
    await win.webContents.executeJavaScript('Aletheia.restoreRecordCheckpoint('+JSON.stringify(staged)+')');
    const counts=await win.webContents.executeJavaScript('(async()=>{const db=await libraryDb();return await new Promise((resolve,reject)=>{const r=db.transaction(\"artifacts\").objectStore(\"artifacts\").count();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});})()');
    if(counts!==staged.snapshot.counts.artifacts)throw new Error('Restored artifact count mismatch');
    fs.writeFileSync(join(state,'proofbundle-archive-restore-verification.json'),JSON.stringify({schema:'ProofBundleNativeArchiveRestoreVerification/v1',observed_at:new Date().toISOString(),outcome:'PASSED',seal_outcome:verified.outcome,source:path,restored_artifacts:counts,collections:staged.snapshot.counts,scope:'Independent native renderer; all original custody signatures, state checksum, record hashes, and artifact native Merkle/content-address commitments checked before publication.'},null,2)+'\n');
    console.log('Archive restoration PASSED');worker.kill();app.exit(0);return;
  }
  if (process.argv.includes('--measure-outcomes')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    const result=await win.webContents.executeJavaScript('Aletheia.runOutcomeCoverage()');
    fs.writeFileSync(join(state,'native-outcome-coverage.json'),JSON.stringify(result));
    console.log(JSON.stringify({native_outcome_coverage:result.matrix}));
  }
  if (process.argv.includes('--connect-implementations')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    const report=await win.webContents.executeJavaScript('Aletheia.connectImplementations(false)');
    console.log(JSON.stringify({linked_conformance:report.totals,independent_probes:report.independent_probe_totals}));
    const outcomes=await win.webContents.executeJavaScript('Aletheia.runOutcomeCoverage()');
    console.log(JSON.stringify({outcome_coverage:outcomes.matrix}));
    fs.writeFileSync(join(state,'linked-workbench.png'),(await win.webContents.capturePage()).toPNG());
  }
  if (process.argv.includes('--append-snapshots')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    await win.webContents.executeJavaScript('Aletheia.appendSnapshots()');
  }
  if(process.argv.includes('--diagnose-archive')) {
    await win.webContents.executeJavaScript('window.ALETHEIA_READY');
    const records=await win.webContents.executeJavaScript('(async()=>{const db=await libraryDb();const result=[];for(let sequence=1144;sequence<=1184;sequence++){const event=await new Promise((resolve,reject)=>{const r=db.transaction(\"events\").objectStore(\"events\").index(\"sequence\").get(sequence);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(event)result.push({sequence:event.sequence,action:event.action,payload_fields:Object.entries(event.payload||{}).map(([key,value])=>({key,type:typeof value,length:typeof value===\"string\"||Array.isArray(value)?value.length:null})),serialized_bytes:JSON.stringify(event).length});}return result;})()');
    console.log(JSON.stringify({archive_diagnostic:records}));
  }
  if(process.argv.includes('--checkpoint-once')){await win.webContents.executeJavaScript('window.ALETHEIA_READY');const receipt=await win.webContents.executeJavaScript('Aletheia.checkpoint()');console.log(JSON.stringify({completed_checkpoint:receipt}));fs.writeFileSync(join(state,'current-checkpoint-receipt.json'),JSON.stringify(receipt));}
  if(process.argv.includes('--verify-archive-storage')) await require('./archive-storage-verification.cjs')({win,state,localCall});
  if (process.argv.includes('--verify-archive-stability')) {
    require('./archive-stability.cjs')({win,localCall,state,identity,key}).catch(error => console.error('Archive stability failed: ' + error.stack));
  }
  if (process.argv.includes('--verify-build')) {
    try {
      const result = await require('./verify-build.cjs')({win,localCall,state,root});
      console.log(JSON.stringify({verification:result.out,checks:result.report.checks.length,catalogue:result.report.catalogue}));
      worker.kill(); app.exit(0);
    } catch (e) { console.error('Native build verification failed: ' + e.stack); worker.kill(); app.exit(1); }
  }
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => worker?.kill());
