/* SPDX-License-Identifier: GPL-3.0-or-later
 * Aletheia custody workbench, embedded into the standalone ProofBundle client.
 * Source records retain their native schemas. No external provenance ontology.
 */
(() => {
  'use strict';
  // Hidden/minimized windows must still make progress during archive checks.
  pbYieldToUi=()=>new Promise(resolve=>{const timer=setTimeout(resolve,25);if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{clearTimeout(timer);setTimeout(resolve,0);});});
  const DB_NAME = 'aletheia-proofbundle-custody-v1';
  const FIELDS = ['claims', 'predictions', 'store', 'chain', 'agentReceipts',
    'bridgeActions', 'bridgeObservations', 'rlmCaptures', 'origins', 'supplements',
    'catalogueSources', 'algorithmSources', 'vectorSets', 'conformanceRuns', 'implementationRuns', 'outcomeRuns'];
  const original = { persistState, restoreState, chainAppend, buildArchiveBundle,
    libraryDb, bridgeFetch, bridgeLog, refreshOrchestrator, submitClaim,
    updateClaimStatus, removeStored, clearLedger, registerBundle };
  original.heroSeal = heroSeal; original.addFiles = addFiles; original.verifyBundle = verifyBundle;
  const status = { local: 'loading', mirror: 'connecting', error: null, pending: 0 };
  for (const key of FIELDS) if (!Array.isArray(STATE[key])) STATE[key] = [];
  let db, ready, tail = Promise.resolve(), chainTail = Promise.resolve();
  let nativeCheckpointFlight=null, checkpointHold=0;
  let mirrorTimer, mirrorRunning = false, mirrorDirty = false, serverAvailable = false;
  let selected = null, inspectorRows = [], signingIdentity = null, observationHashes = new Map();
  let cryptoAudit=null;
  let page = 0, renderFlight = null, renderAgain = false, bridgeFlight = null;
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const hash = async value => hexOf(await digestBytes('SHA-256',
    typeof value === 'string' ? utf8(value) : utf8(canonicalJSON(value))));
  const byId = id => typeof document === 'undefined' ? null : document.getElementById(id);
  const secretNames = /^(seed(_b64u)?|private_?key|secret_?key|auth_?token|access_?token|password)$/i;

  const byteBase64 = bytes => {
    let text = '';
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(text);
  };
  async function api(path, options = {}) {
    if (!window.aletheiaDesktop) {
      if (location.protocol === 'file:') throw new Error('Direct native access is provided by the desktop application; file custody remains local');
      return fetch(path, options); // Explicitly separate optional HTTP layer.
    }
    let operation, args = {}, bytes;
    if (path.endsWith('/status')) operation = 'status';
    else if (path.endsWith('/latest')) operation = 'latest';
    else if (path.endsWith('/sources')) operation = 'sources';
    else if (path.endsWith('/search')) { operation = 'search'; args = JSON.parse(options.body); }
    else if (path.endsWith('/checkpoint')) { operation = 'checkpoint'; args = { snapshot: JSON.parse(options.body) }; }
    else if (path.includes('/blob/')) {
      const key = path.split('/').at(-1);
      if (options.method === 'POST') {
        const upload = await aletheiaDesktop.call('beginBlob', { key });
        try {
          for (let offset = 0; offset < options.body.size; offset += 1048576) {
            const chunk = new Uint8Array(await options.body.slice(offset, offset + 1048576).arrayBuffer());
            await aletheiaDesktop.call('appendBlob', { upload_id: upload.upload_id, chunk_b64: byteBase64(chunk) });
          }
          const result = await aletheiaDesktop.call('finishBlob', { upload_id: upload.upload_id });
          return { ok: true, json: async () => result };
        } catch (e) { await aletheiaDesktop.call('abortBlob', { upload_id: upload.upload_id }).catch(() => {}); throw e; }
      }
      const result = await aletheiaDesktop.call('getBlob', { key });
      bytes = Uint8Array.from(atob(result.bytes_b64), c => c.charCodeAt(0));
      return { ok: true, arrayBuffer: async () => bytes.buffer };
    } else throw new Error('Unsupported local transport operation');
    const result = await aletheiaDesktop.call(operation, args);
    return { ok: result !== null, status: result === null ? 404 : 200, json: async () => result };
  }

  function publicRecord(value, path = '', excluded = []) {
    if (Array.isArray(value)) return value.map((v, i) => publicRecord(v, path + '.' + i, excluded));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, v] of Object.entries(value)) {
        if (secretNames.test(key)) { excluded.push(path + '.' + key); continue; }
        out[key] = publicRecord(v, path + '.' + key, excluded);
      }
      return out;
    }
    return value;
  }

  function stateSnapshot() {
    const state = {};
    for (const key of FIELDS) state[key] = clone(STATE[key] || []);
    state.bridge = { lastEnvelope: BRIDGE_STATE.lastEnvelope,
      lastLineage: BRIDGE_STATE.lastLineage, configuration: bridgeCfg() };
    state.orchestrator = { messages: ORCH_STATE.messages, lanes: ORCH_STATE.lanes,archive_ref:ORCH_STATE.archive_ref||null };
    return clone(state);
  }

  function applyState(state) {
    for (const key of FIELDS) STATE[key] = Array.isArray(state[key]) ? state[key] : [];
    if (state.bridge) {
      BRIDGE_STATE.lastEnvelope = state.bridge.lastEnvelope || null;
      BRIDGE_STATE.lastLineage = state.bridge.lastLineage || null;
    }
    if (state.orchestrator) {
      ORCH_STATE.messages = state.orchestrator.messages || [];
      ORCH_STATE.lanes = state.orchestrator.lanes || {};
      ORCH_STATE.archive_ref=state.orchestrator.archive_ref||null;
    }
  }

  function transaction(stores, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(tx.error || new Error('Custody transaction failed'));
      try { result = fn(tx); } catch (e) { tx.abort(); reject(e); }
    });
  }

  const request = req => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  function storageFailure(error) {
    status.local = 'failed'; status.error = error.message || String(error);
    renderStatus();
  }

  function enqueue(fn) {
    status.pending++;
    const op = tail.catch(() => {}).then(() => ready).then(fn);
    tail = op;
    op.then(() => {
      status.pending--; status.local = 'saved'; status.error = null;
      renderStatus(); scheduleMirror();
    }, error => { status.pending--; storageFailure(error); });
    return op;
  }

  async function flush() {
    await ready; await chainTail; await tail;
    if (status.error) throw new Error(status.error);
  }

  async function makeEvent(action, ref, payload, stateHash) {
    let head = (await request(db.transaction('meta').objectStore('meta').get('event-head')))?.event;
    if (!head) {
      const tx = db.transaction('events');
      await new Promise((resolve, reject) => {
        const cursor = tx.objectStore('events').openCursor();
        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = () => { const row = cursor.result; if (!row) return resolve();
          if (!head || row.value.sequence > head.sequence) head = row.value; row.continue(); };
      });
    }
    const event = { schema: 'AletheiaCustodyEvent/v1', id: makeId(), sequence: (head?.sequence || 0) + 1,
      observed_at: now(), action, ref: ref || null,
      predecessor_sha256: head?.record_sha256 || null,
      payload: clone(payload), payload_sha256: await hash(payload), state_sha256: stateHash };
    if (signingIdentity && window.aletheiaDesktop) {
      event.actor = clone(signingIdentity);
      event.attestation = await aletheiaDesktop.signEvent(canonicalJSON(event));
    }
    event.record_sha256 = await hash(event);
    return event;
  }

  async function commitDirect(action, ref, payload, artifact, extra) {
    const state = stateSnapshot();
    const stateHash = await hash(state);
    const event = await makeEvent(action, ref, payload, stateHash);
    await transaction(['events', 'artifacts', 'meta', 'retained'], 'readwrite', tx => {
      tx.objectStore('events').add(event);
      tx.objectStore('meta').put({ id: 'event-head', event });
      if (artifact) tx.objectStore('artifacts').put(artifact);
      if (extra) extra(tx);
      tx.objectStore('meta').put({ id: 'workspace', state, state_sha256: stateHash, saved_at: now() });
    });
    renderWorkbench();
    return event;
  }

  function retain(action, ref, payload, artifact, extra) {
    return enqueue(() => commitDirect(action, ref, payload, artifact, extra));
  }

  async function readSnapshot() {
    const tx = db.transaction(['meta', 'events', 'artifacts', 'retained']);
    const [meta, events, artifacts, retained] = await Promise.all([
      request(tx.objectStore('meta').get('workspace')),
      request(tx.objectStore('events').getAll()),
      request(tx.objectStore('artifacts').getAll()),
      request(tx.objectStore('retained').getAll()),
    ]);
    return { schema: 'AletheiaCustodySnapshot/v1', state: meta?.state || stateSnapshot(), state_sha256: meta?.state_sha256 || null,
      artifacts, events: events.sort((a, b) => a.sequence - b.sequence), retained };
  }

  async function verifyEvents(events,context={offset:0,previous:null}) {
    let previous = context.previous;
    for (let i = 0; i < events.length; i++) {
      const event = events[i], { record_sha256, ...core } = event;
      if (event.sequence !== context.offset + i + 1 || event.predecessor_sha256 !== previous ||
          await hash(event.payload) !== event.payload_sha256 || await hash(core) !== record_sha256)
        throw new Error('Custody event mismatch at sequence ' + (i + 1));
      if (event.attestation) {
        const { attestation, ...unsigned } = core;
        if (attestation.signer_id !== event.actor?.id || attestation.public_key_raw_b64u !== event.actor?.public_key_raw_b64u ||
            !await sigVerify('Ed25519', utf8('ALETHEIA-CUSTODY-EVENT-1\0' + canonicalJSON(unsigned)),
              b64uDecode(attestation.signature_b64u), attestation.public_key_raw_b64u))
          throw new Error('Custody signature mismatch at sequence ' + (i + 1));
      }
      previous = record_sha256;
    }
    return { previous_sha256:previous, checked: events.length, head: previous };
  }

  async function validateArtifact(artifact) {
    if (!artifact || typeof artifact.name !== 'string' || !Array.isArray(artifact.tags || []))
      throw new Error('Malformed artifact metadata');
    if (artifact.id !== 'sha256:' + artifact.merkle_root_b64u ||
        !/^[A-Za-z0-9_-]+$/.test(artifact.merkle_root_b64u || '') ||
        artifact.digest_alg !== 'SHA-256' || !Number.isSafeInteger(artifact.size) || artifact.size < 0 ||
        !Number.isSafeInteger(artifact.chunk_size) || artifact.chunk_size < 1)
      throw new Error('Artifact commitment is malformed');
    if (artifact.blob) {
      if (artifact.blob.size !== artifact.size) throw new Error('Artifact size mismatch: ' + artifact.name);
      const commitment = await hashFileEntry({ file: artifact.blob, size: artifact.size }, 'SHA-256', artifact.chunk_size);
      if (commitment.root_b64u !== artifact.merkle_root_b64u || commitment.chunks !== artifact.chunks)
        throw new Error('Artifact bytes do not match the committed Merkle root: ' + artifact.name);
      if (artifact.content_address && commitment.content_address !== artifact.content_address)
        throw new Error('Artifact content address mismatch: ' + artifact.name);
    }
  }

  async function originFor(artifact, method, source) {
    const origin = { schema: 'AletheiaProvenanceRecord/v1', id: makeId(), artifact_id: artifact.id,
      origin: { creator: 'Unknown', creation_method: method, source_system: source },
      captured_by: signingIdentity?.id || 'browser-capture',
      authority: { license: 'Unknown', consent: 'Unknown' },
      observed_at: now(), source_created_at: artifact.imported_at || null,
      integrity: 'local hash; no origin signature asserted' };
    origin.record_sha256 = await hash(origin);
    return origin;
  }

  async function exportNativeArchive() {
    await retain('archive-export-request',null,{format:'PB-ARCHIVE-1',archive_format_version:4,scope:'Complete retained archive in a streamed ZIP with a native ProofBundle sealed manifest'});
    const checkpoint=await mirrorRecords();
    const payload=await aletheiaDesktop.call('archiveManifest',{id:checkpoint.id});
    if(!_currentKey)_currentKey=await sigKeygen('Ed25519');
    const bundle={hdr:{bundle_id:makeId(),profile:'PB-ARCHIVE-1',spec_id:'PROOFBUNDLE',spec_ver:PB_SPEC_VER},meta:{created_at:now(),application:'ProofBundle'},payload};
    await sealCore(bundle,'SHA3-256',_currentKey.alg,_currentKey);
    const result=await verifyCore(bundle,{});if(result.outcome!=='VERIFIED')throw new Error('Archive manifest seal failed');
    const receipt=await aletheiaDesktop.call('exportArchiveZip',{id:checkpoint.id,bundle});
    byId('aletheia-archive-status').textContent='Sealed complete archive saved: '+receipt.path;
    await retain('archive-export-completed',bundle.hdr.bundle_id,{...receipt,manifest:bundle,seal_outcome:result.outcome});
    return receipt;
  }

  async function recoverRecordCheckpoint(receipt) {
    const manifest=receipt.snapshot;console.info('PB-DIAG recovery start '+JSON.stringify(manifest.counts));
    if(await hash(manifest.state)!==manifest.state_sha256)throw new Error('Checkpoint state checksum mismatch');
    const chain=await verifyChain(manifest.state.chain||[]);if(!chain.ok)throw new Error('Checkpoint native chain is broken');
    await transaction('recovery-staging','readwrite',tx=>tx.objectStore('recovery-staging').clear());
    console.info('PB-DIAG recovery state verified');
    let eventContext={offset:0,previous:null},eventHead=null,descriptor='';
    try {
      for(const kind of ['artifacts','events','retained']) {
        const count=manifest.counts[kind];let offset=0;console.info('PB-DIAG recovery collection '+kind+' '+count);
        while(offset<count) {
          const info=await aletheiaDesktop.call('checkpointRecordInfo',{id:manifest.checkpoint_id,kind,ordinal:offset});
          let raw='';for(let at=0;at<info.characters;){const part=await aletheiaDesktop.call('checkpointReaderChunk',{reader_id:info.reader_id,offset:at});if(!part.characters)throw new Error('Checkpoint text chunk is missing');raw+=part.chunk;at+=part.characters;}
          const row={ordinal:offset,raw_json:raw,sha256:info.sha256};
          if(row.ordinal!==offset||await hash(row.raw_json)!==row.sha256)throw new Error('Checkpoint record checksum mismatch');
          descriptor+=kind+':'+offset+':'+row.sha256+'\n';
          const record=JSON.parse(row.raw_json);
          if(kind==='events') {
            const checked=await verifyEvents([record],eventContext);
            eventContext={offset:offset+1,previous:checked.previous_sha256};eventHead=record;
          }
          if(kind==='artifacts'&&record.blob_ref) {
            const response=await api('/api/aletheia/blob/'+record.blob_ref);
            const bytes=await response.arrayBuffer();
            if(hexOf(await digestBytes('SHA-256',new Uint8Array(bytes)))!==record.blob_sha256)throw new Error('Checkpoint blob checksum mismatch');
            record.blob=new Blob([bytes],{type:record.mime});await validateArtifact(record);
          }
          await transaction('recovery-staging','readwrite',tx=>tx.objectStore('recovery-staging').put({id:kind+':'+offset,kind,record}));
          offset++;if(offset%100===0)console.info('PB-DIAG validated restore '+kind+' '+offset+'/'+count);
        }
      }
      if(await hash(descriptor)!==manifest.records_sha256)throw new Error('Checkpoint collection commitment mismatch');
      console.info('PB-DIAG recovery all record hashes verified');
      const prior=await request(db.transaction('meta').objectStore('meta').get('workspace'));
      const mergeArchive=Boolean(receipt.archive_id);
      const priorEvents=mergeArchive?[]:await request(db.transaction('events').objectStore('events').getAll());
      await transaction(['meta','events','artifacts','retained','recovery-staging'],'readwrite',tx=>{
        tx.objectStore('retained').add({id:makeId(),reason:'Original fresh-renderer state before checkpoint recovery',observed_at:now(),state:prior?.state,imported_custody:priorEvents});
        if(!mergeArchive)tx.objectStore('events').clear();
        const cursor=tx.objectStore('recovery-staging').openCursor();
        cursor.onsuccess=()=>{const row=cursor.result;if(!row)return;
          const {kind,record}=row.value;
          if(mergeArchive&&kind==='events')tx.objectStore('retained').put({id:'imported-event:'+receipt.archive_id+':'+record.id,reason:'Original imported archive custody event',observed_at:record.observed_at,archive_id:receipt.archive_id,original:record});
          else {
            const target=tx.objectStore(kind);
            if(mergeArchive){const old=target.get(record.id);old.onsuccess=()=>{if(old.result)tx.objectStore('retained').put({id:'pre-import:'+receipt.archive_id+':'+kind+':'+record.id,reason:'Original record before archive import',observed_at:now(),original:old.result});};}
            target.put(record);
          }row.continue();};
        tx.objectStore('meta').put({id:'workspace',state:manifest.state,state_sha256:manifest.state_sha256,saved_at:now()});
        if(!mergeArchive){if(eventHead)tx.objectStore('meta').put({id:'event-head',event:eventHead});else tx.objectStore('meta').delete('event-head');}
      });
      console.info('PB-DIAG recovery publication transaction complete');
      applyState(manifest.state);
      await commitDirect(mergeArchive?'archive-restoration':'checkpoint-recovery',receipt.archive_id||receipt.id,{storage_layout:manifest.storage_layout,checkpoint_sha256:receipt.sha256,counts:manifest.counts});
    } finally {await transaction('recovery-staging','readwrite',tx=>tx.objectStore('recovery-staging').clear());}
  }

  async function compactBridgeState(previousStateHash) {
    const compacted=[];let count=0;console.info('PB-DIAG normalizing '+STATE.bridgeObservations.length+' retained bridge observations');
    for(const observation of STATE.bridgeObservations) {
      if(!observation.raw){compacted.push(observation);continue;}
      status.local='Opening retained archive records: '+(count+1)+'/'+STATE.bridgeObservations.length;renderStatus();
      const id='native-observation:'+observation.id;
      await transaction('retained','readwrite',tx=>tx.objectStore('retained').put({id,reason:'Original native bridge observation',observed_at:observation.observed_at,original:observation}));
      const {raw,...metadata}=observation;compacted.push({...metadata,raw_ref:id});count++;if(count%10===0)console.info('PB-DIAG native observations retained '+count);
    }
    STATE.bridgeObservations=compacted;
    if(BRIDGE_STATE.lastLineage?.entries) {
      const data=BRIDGE_STATE.lastLineage;
      const id='native-lineage:'+await hash(data);
      await transaction('retained','readwrite',tx=>tx.objectStore('retained').put({id,reason:'Original native lineage window',observed_at:now(),original:data}));
      BRIDGE_STATE.lastLineage={schema:data.schema,source:data.source,raw_window_sha256:data.raw_window_sha256,raw_ref:id};count++;
    }
    if(ORCH_STATE.messages.length>100){
      const originalCount=ORCH_STATE.messages.length;
      const range=IDBKeyRange.bound(['orchestrator-observation',0],['orchestrator-observation',Number.MAX_SAFE_INTEGER]);
      const cursor=await request(db.transaction('events').objectStore('events').index('action-sequence').openKeyCursor(range,'prev'));
      ORCH_STATE.archive_ref={event_id:cursor?.primaryKey||null,original_message_count:originalCount,scope:'Original full observation remains in the signed custody archive; active feed is a bounded view'};
      ORCH_STATE.messages=ORCH_STATE.messages.slice(-50);count++;
    }
    if(count) await commitDirect('archive-view-normalization',null,{previous_state_sha256:previousStateHash,records_moved_to_retained:count,scope:'Native source records remain byte-equivalent JSON values in the retained archive; active display state holds references. Prior signed events and SQLite checkpoints are preserved.'});
  }

  async function bootstrap() {
    if (!window.indexedDB) throw new Error('IndexedDB is unavailable; durable custody cannot be confirmed');
    if (window.aletheiaDesktop) signingIdentity = await aletheiaDesktop.identity();
    db = await new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 4);
      open.onupgradeneeded = () => {
        for (const name of ['meta', 'events', 'artifacts', 'retained', 'recovery-staging'])
          if (!open.result.objectStoreNames.contains(name)) open.result.createObjectStore(name, { keyPath: 'id' });
        const events = open.transaction.objectStore('events');
        if(!events.indexNames.contains('action-sequence'))events.createIndex('action-sequence',['action','sequence']);
        if (!events.indexNames.contains('sequence')) events.createIndex('sequence', 'sequence', {unique:true});
      };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
      open.onblocked = () => reject(new Error('Custody database upgrade is blocked by another tab'));
    });
    const saved = await request(db.transaction('meta').objectStore('meta').get('workspace'));
    if (saved) {
      if (saved.state_sha256 && await hash(saved.state) !== saved.state_sha256) throw new Error('Saved application-state checksum mismatch');
      applyState(saved.state);
      for (const observation of STATE.bridgeObservations) observationHashes.set(observation.kind, observation.captured_record_sha256);
    } else {
      try {
        const legacy = JSON.parse(localStorage.getItem(PB_LS_KEY) || 'null');
        if (legacy) applyState(legacy);
      } catch { /* existing in-memory state remains a migration source */ }
      const legacyDb = await original.libraryDb();
      const rows = await request(legacyDb.transaction(PB_LIBRARY_STORE).objectStore(PB_LIBRARY_STORE).getAll());
      legacyDb.close();
      for (const row of rows) {
        // Preserve native legacy metadata verbatim as source context. The active
        // catalog uses the neutral content_address field.
        const legacyAddress = Object.entries(row).find(([key]) => key.endsWith('_content_address'))?.[1];
        if (!row.content_address && legacyAddress) row.content_address = legacyAddress;
        const origin = await originFor(row, 'LegacyImportDocumented', 'existing ProofBundle browser library');
        row.origin_id = origin.id; STATE.origins.push(origin);
        await transaction('artifacts', 'readwrite', tx => tx.objectStore('artifacts').put(row));
      }
      await commitDirect('workspace-migration', null, { source: 'ProofBundle browser state', artifacts: rows.length,
        coverage: 'Historical bytes and native metadata retained; unobserved prior actions are not reconstructed.' });
    }
    await compactBridgeState(saved?.state_sha256 || null);
    status.local = 'saved';
    try {
      const res = await api('/api/aletheia/status', { cache: 'no-store' });
      if (res.ok) {
        serverAvailable = true; status.mirror = 'retained local SQLite checkpoints available';
        const tx = db.transaction(['artifacts', 'events']);
        const [artifactCount, eventCount] = await Promise.all([request(tx.objectStore('artifacts').count()), request(tx.objectStore('events').count())]);
        if (!artifactCount && !STATE.claims.length && !STATE.store.length &&
            !STATE.rlmCaptures.length && eventCount <= 1) {
          const response = await api('/api/aletheia/latest', { cache: 'no-store' });
          if (response.ok) {
            const retained = await response.json(), recovered = retained.snapshot;
            if(recovered.storage_layout==='record-checkpoint-v1'){
              await recoverRecordCheckpoint(retained);
            } else {
            await verifyEvents(recovered.events || []);
            if (recovered.state_sha256 && await hash(recovered.state) !== recovered.state_sha256)
              throw new Error('Server checkpoint application-state checksum mismatch');
            const nativeChain = await verifyChain(recovered.state.chain || []);
            if (!nativeChain.ok) throw new Error('Server checkpoint native action chain is invalid');
            for (const artifact of recovered.artifacts) {
              if (artifact.blob_ref) {
                const bytes = await api('/api/aletheia/blob/' + artifact.blob_ref);
                if (!bytes.ok) throw new Error('Server checkpoint artifact bytes are missing');
                artifact.blob = new Blob([await bytes.arrayBuffer()], { type: artifact.mime });
                await validateArtifact(artifact);
              }
            }
            applyState(recovered.state);
            await transaction(['meta', 'artifacts', 'events', 'retained'], 'readwrite', tx => {
              tx.objectStore('events').clear();
              tx.objectStore('meta').delete('event-head');
              for (const event of recovered.events || []) tx.objectStore('events').add(event);
              for (const artifact of recovered.artifacts || []) tx.objectStore('artifacts').put(artifact);
              for (const record of recovered.retained || []) tx.objectStore('retained').put(record);
              tx.objectStore('meta').put({ id: 'workspace', state: clone(recovered.state),
                state_sha256: recovered.state_sha256, saved_at: now() });
            });
            await commitDirect('checkpoint-recovery', retained.id, { checkpoint_sha256: retained.sha256 });
            }
          }
        }
      } else status.mirror = 'browser only';
    } catch (e) { status.mirror = 'unavailable: ' + e.message; }
    renderClaims(); renderPredictions(); renderLedgerPanel(); renderOrchLanes(); renderOrchFeed();
    renderStatus(); renderWorkbench(); loadSources();
    if(window.aletheiaDesktop)aletheiaDesktop.call('cryptoAuditReport').then(report=>{cryptoAudit=report;renderCurrentEvidence();}).catch(()=>{});
    // Native bridge capture runs on explicit refresh or the Bridge polling control.
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    if (!saved) scheduleMirror();
    return true;
  }

  persistState = function () {
    const snapshot = stateSnapshot();
    // IndexedDB is authoritative. Small v3 state remains readable by the legacy
    // client as a migration source; localStorage quota never silently drops IDB.
    try { localStorage.setItem(PB_LS_KEY, JSON.stringify({ v: 3, ...snapshot })); } catch {}
    const op = enqueue(async () => {
      const checksum = await hash(snapshot);
      return transaction('meta', 'readwrite', tx =>
        tx.objectStore('meta').put({ id: 'workspace', state: snapshot, state_sha256: checksum, saved_at: now() }));
    });
    op.catch(() => {});
    return op;
  };

  restoreState = function () {
    try {
      const state = JSON.parse(localStorage.getItem(PB_LS_KEY) || 'null');
      if (state) { applyState(state); return true; }
    } catch {}
    return false;
  };

  chainAppend = function (...args) {
    const op = chainTail.catch(() => {}).then(async () => {
      await ready;
      const event = await original.chainAppend(...args);
      await tail;
      await retain('native-action-chain-entry', event.hash, { native_event: event });
      return event;
    });
    chainTail = op;
    return op;
  };

  libraryDb = async () => { await ready; return db; };
  libraryTx = (mode, fn) => mode === 'readwrite'
      ? enqueue(async () => {
        const state = stateSnapshot(), checksum = await hash(state);
        return transaction(['artifacts', 'meta'], mode, tx => {
      const result = fn(tx.objectStore('artifacts'));
      tx.objectStore('meta').put({ id: 'workspace', state, state_sha256: checksum, saved_at: now() });
      return result;
        });
      })
    : ready.then(() => transaction('artifacts', mode, tx => fn(tx.objectStore('artifacts'))));
  libraryGet = async id => { await ready; return request(db.transaction('artifacts').objectStore('artifacts').get(id)); };
  libraryAll = async () => { await ready; return (await request(db.transaction('artifacts').objectStore('artifacts').getAll())).filter(x => !x.retired); };

  libraryImport = async files => {
    await ready;
    const list = Array.from(files), indicator = byId('library-status');
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i]; indicator.textContent = 'Capturing ' + (i + 1) + '/' + list.length + ': ' + file.name;
        const h = await hashFileEntry({ file, size: file.size }, 'SHA-256', 1048576);
        const id = 'sha256:' + h.root_b64u, prior = await libraryGet(id);
        let sourcePath = '';
        try { sourcePath = window.aletheiaDesktop?.sourcePath?.(file) || ''; } catch {}
        const record = { id, name: file.name, size: file.size, mime: file.type || 'application/octet-stream',
          kind: libraryKind(file.name, file.type), tags: prior?.tags || [], notes: prior?.notes || '',
          imported_at: prior?.imported_at || now(), updated_at: now(), digest_alg: 'SHA-256',
          chunk_size: 1048576, chunks: h.chunks, merkle_root_b64u: h.root_b64u,
          content_address: h.content_address, custody_bundle: prior?.custody_bundle || null,
          origin_id: prior?.origin_id, source_ref: prior?.source_ref || null, blob: file, retired: false };
        if (!record.origin_id) {
          const origin = await originFor(record, 'Collected', sourcePath || 'file import; original filesystem path unavailable');
          STATE.origins.push(origin); record.origin_id = origin.id;
        }
        if (/\.json$/i.test(file.name) && file.size <= 32 * 1024 * 1024) {
          try {
            const value = JSON.parse(await file.text());
            const bytesHash = hexOf(await digestBytes('SHA-256', new Uint8Array(await file.arrayBuffer())));
            const algorithms = Array.isArray(value) && value.length && value.every(v => v.id && v.primitiveFamily)
              ? value : Array.isArray(value.algorithms) ? value.algorithms : null;
            if (algorithms) {
              const present = new Set(STATE.algorithmSources.map(a => a.capture?.registry_sha256 + ':' + a.id));
              for (const algorithm of algorithms) if (!present.has(bytesHash + ':' + algorithm.id))
                STATE.algorithmSources.push({ ...algorithm, capture: { registry_sha256: bytesHash,
                  source_path: sourcePath || file.name, artifact_id: id, observed_at: now() } });
              record.kind = 'algorithm-registry';
            } else {
              const vectors = Array.isArray(value) && value.length && value.some(v => v.input_hex || v.expected_verdict)
                ? value : ['vectors','test_vectors','cases','tests'].map(k => value[k]).find(Array.isArray);
              if (vectors && !STATE.vectorSets.some(v => v.id === bytesHash)) {
                STATE.vectorSets.push({ id: bytesHash, sha256: bytesHash, blob_ref: await hash(id),
                  artifact_id: id, algorithm_id: value.algorithm || vectors[0]?.algorithm || 'native source',
                  path: sourcePath || file.name, observed_at: now(), vector_count: vectors.length,
                  status: 'source-captured; execution not asserted' });
                record.kind = 'conformance-vectors';
              }
            }
          } catch (e) {
            // Opaque files remain captured. Indexing failure is a visible state,
            // never permission to omit their original bytes from custody.
            record.indexing_note = 'Native structured indexing unavailable: ' + e.message;
          }
        }
        const { blob, ...metadata } = record;
        await retain('artifact-import', id, { artifact: metadata, bytes_retained: true }, record);
      }
      indicator.textContent = list.length + ' artifact(s) retained with origin and custody events.';
      await renderLibrary(); renderWorkbench();
    } catch (e) { indicator.textContent = 'Capture incomplete: ' + e.message; notifyError(indicator.textContent); throw e; }
  };

  libraryTag = async id => {
    const record = await libraryGet(id); if (!record) return;
    const text = prompt('Comma-separated tags', (record.tags || []).join(', '));
    if (text === null) return;
    const before = clone(record.tags || []);
    record.tags = [...new Set(text.split(',').map(v => v.trim()).filter(Boolean))]; record.updated_at = now();
    await retain('artifact-metadata-supplement', id, { before, after: record.tags, origin_id: record.origin_id }, record);
    await renderLibrary();
  };

  libraryRemove = async id => {
    const record = await libraryGet(id); if (!record) return;
    record.retired = true; record.retired_at = now();
    await retain('artifact-retirement', id, { bytes_retained: true, origin_id: record.origin_id }, record);
    await renderLibrary();
  };

  libraryImportIndex = async file => {
    if (!file) return;
    const doc = JSON.parse(await file.text());
    if (doc.schema !== 'PB-ARTIFACT-LIBRARY-INDEX-1' || !Array.isArray(doc.artifacts)) throw new Error('Unsupported library index');
    // Validate every candidate before any catalog update. A metadata-only index
    // can never replace the commitment attached to different existing bytes.
    const candidates = [];
    for (const metadata of doc.artifacts) {
      const prior = await libraryGet(metadata.id);
      const record = { ...metadata, blob: prior?.blob || null, missing_bytes: !prior?.blob, updated_at: now() };
      await validateArtifact(record);
      candidates.push(record);
    }
    for (const record of candidates) {
      const { blob, ...metadata } = record;
      await retain('artifact-index-import', record.id, { artifact: metadata, bytes_retained: !!blob }, record);
    }
    await renderLibrary();
  };

  submitClaim = async () => {
    await ready; const before = STATE.claims.length;
    original.submitClaim();
    if (STATE.claims.length > before) {
      const claim = STATE.claims.at(-1);
      await retain('claim-submission', claim.id, { claim });
    }
  };

  updateClaimStatus = async (index, outcome) => {
    await ready;
    const claim = STATE.claims[index]; if (!claim) throw new Error('Claim is unavailable');
    const before = clone(claim); original.updateClaimStatus(index, outcome);
    await retain('claim-status-transition', claim.id, { before, after: clone(claim) });
  };

  removeStored = async index => {
    await ready; const prior = STATE.store[index]; if (!prior) return;
    original.removeStored(index);
    await retain('bundle-store-removal', prior.bundle?.hdr?.bundle_id, { retained_record: prior });
    renderLedgerPanel();
  };

  clearLedger = async () => {
    await ready;
    const previous = stateSnapshot();
    original.clearLedger();
    if (STATE.chain.length === previous.chain.length && STATE.store.length === previous.store.length) return;
    await retain('ledger-reset', null, { previous_state_retained: true }, null, tx =>
      tx.objectStore('retained').add({ id: makeId(), reason: 'ledger-reset', observed_at: now(), state: previous }));
  };

  registerBundle = async (bundle, source) => {
    await ready; const result = await original.registerBundle(bundle, source);
    const roots = new Set((bundle.payload?.artifacts || []).map(a => a.merkle_root_b64u));
    const candidates = await libraryAll();
    for (const artifact of candidates) if (roots.has(artifact.merkle_root_b64u)) {
      artifact.custody_bundle = bundle.hdr.bundle_id;
      await retain('artifact-custody-binding', artifact.id, { bundle_id: bundle.hdr.bundle_id, source }, artifact);
    }
    return result;
  };

  heroSeal = async list => {
    await libraryImport(Array.from(list || []));
    return original.heroSeal(list);
  };
  addFiles = list => {
    original.addFiles(list);
    libraryImport(Array.from(list || [])).catch(e => notifyError('File custody incomplete: ' + e.message));
  };
  verifyBundle = async () => {
    await ready;
    const raw = byId('verify-bundle-json').value;
    if (raw.trim()) await retain('verification-input', null, { raw_bundle: raw,
      raw_context: byId('verify-context').value, raw_ancestors: byId('verify-bundles').value });
    return original.verifyBundle();
  };

  function redacted(value) {
    const exclusions = [], retained = publicRecord(value, '', exclusions);
    return { retained, excluded_private_fields: exclusions };
  }

  async function observe(kind, raw) {
    const identity = await hash(raw);
    if (observationHashes.get(kind) === identity) return false;
    observationHashes.set(kind, identity);
    const observation = { id: makeId(), kind, observed_at: now(), source: bridgeCfg().endpoint,
      raw: clone(raw), captured_record_sha256: identity, verification: 'source observation; native signature evaluation not inferred' };
    const {raw:rawValue,...observationMetadata}=observation;
    const rawRef='native-observation:'+observation.id;
    STATE.bridgeObservations.push({...observationMetadata,raw_ref:rawRef});
    const entries = Array.isArray(raw.entries) ? raw.entries : Array.isArray(raw.events) ? raw.events : [];
    const existing = new Set(STATE.agentReceipts.map(e => e.record_sha256 || canonicalJSON(e)));
    for (const entry of entries) {
      const key = entry.record_sha256 || canonicalJSON(entry);
      if (!existing.has(key)) { STATE.agentReceipts.push(clone(entry)); existing.add(key); }
    }
    await retain('bridge-observation', observation.id, observation,null,tx=>tx.objectStore('retained').put({id:rawRef,reason:'Original native bridge observation',observed_at:observation.observed_at,original:observation}));
    return true;
  }

  bridgeFetch = async (path, opts) => {
    await ready;
    const method = (opts?.method || 'GET').toUpperCase(), actionId = makeId();
    const mutation = method !== 'GET';
    if (mutation) {
      let body; try { body = JSON.parse(opts.body || '{}'); } catch { body = { raw: opts.body || '' }; }
      const record = { action_id: actionId, phase: 'request-retained', path, method,
        endpoint: bridgeCfg().endpoint, observed_at: now(), ...redacted(body) };
      STATE.bridgeActions.push(record);
      await retain('bridge-action-request', actionId, record);
    }
    try {
      const data = await original.bridgeFetch(path, opts);
      if (mutation) {
        const record = { action_id: actionId, phase: 'response-observed', path,
          observed_at: now(), ...redacted(data) };
        STATE.bridgeActions.push(record); await retain('bridge-action-response', actionId, record);
      } else if (path === '/lineage/export' || path.startsWith('/snapshot') || path === '/lineage') {
        await observe(path, data);
      }
      return data;
    } catch (e) {
      if (mutation) {
        const record = { action_id: actionId, phase: 'failed', path, observed_at: now(),
          error: e.message, status: e.status || null, ...redacted(e.data || {}) };
        STATE.bridgeActions.push(record); await retain('bridge-action-failure', actionId, record);
      }
      throw e;
    }
  };

  bridgeLog = (message, kind) => {
    original.bridgeLog(message, kind);
    const record = { message, kind: kind || 'observation', observed_at: now() };
    const op = retain('bridge-console-note', null, record); op.catch(() => {});
  };

  refreshOrchestrator = async () => {
    await ready;
    if(window.aletheiaDesktop){
      const data=await aletheiaDesktop.call('bridgeSnapshot',{limit:100});
      await observe('native-orchestrator-window',data);
      ORCH_STATE.messages=data.entries.slice(-50).map((entry,index)=>({id:entry.id||String(entry.sequence||entry.seq||index),timestamp:entry.observed_at||entry.ts||'',sender:typeof entry.from==='string'?entry.from:entry.from?.agent_id||entry.agent_id||'source identity not supplied',message:entry.payload?.message||entry.payload?.summary||entry.message_type||entry.kind||'native record',native:entry}));
      ORCH_STATE.archive_ref={source:data.source,window_sha256:data.raw_window_sha256,scope:data.coverage};
      renderOrchLanes();renderOrchFeed();await persistState();return;
    }
    // An unavailable bus must never erase a previously retained observation.
    try {
      const [lanesResponse, busResponse] = await Promise.all([
        fetch('agent/live-bus/LANES.json', { cache: 'no-store' }),
        fetch('agent/live-bus/messages.ndjson', { cache: 'no-store' }),
      ]);
      if (!lanesResponse.ok || !busResponse.ok) throw new Error('Orchestrator bus unavailable; retained observations remain available');
      const lanes = (await lanesResponse.json()).lanes || {}, raw = await busResponse.text();
      const messages = raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
      const identity = await hash({ lanes, messages });
      ORCH_STATE.lanes = lanes; ORCH_STATE.messages = messages;
      if (observationHashes.get('orchestrator') !== identity) {
        observationHashes.set('orchestrator', identity);
        await retain('orchestrator-observation', identity, { lanes, messages,
          verification: 'native bus observation; hash/signature verification is not inferred' });
      }
      byId('orch-stat-lanes').textContent = Object.keys(lanes).length;
      byId('orch-stat-messages').textContent = messages.length;
      renderOrchLanes(); renderOrchFeed(); renderWorkbench();
    } catch (e) { byId('orch-feed').innerHTML = '<div class="notice">' + esc(e.message) + '</div>'; }
  };

  const remoteBridgeRefresh = refreshBridgeConsole;
  refreshBridgeConsole = () => {
    if (!window.aletheiaDesktop) return remoteBridgeRefresh();
    if (bridgeFlight) return bridgeFlight;
    bridgeFlight = refreshNativeBridge().finally(() => { bridgeFlight = null; });
    return bridgeFlight;
  };
  async function refreshNativeBridge() {
    await ready;
    try {
      const data = await aletheiaDesktop.call('bridgeSnapshot', { limit: 100 });
      const changed = await observe('native-ledger-window', data);
      if (!changed) return;
      const captured=STATE.bridgeObservations.at(-1);
      BRIDGE_STATE.lastLineage={schema:data.schema,source:data.source,raw_window_sha256:data.raw_window_sha256,raw_ref:captured?.raw_ref};
      byId('bridge-status').textContent = 'Local native ledger available. Remote relay capability is a separate layer.';
      byId('bridge-flow-verifier').textContent = 'remote relay not checked';
      const entries = data.entries, sender = e => typeof e.from === 'string' ? e.from :
        e.from?.agent_id || e.agent_id || e.actor || 'identity not supplied';
      byId('bridge-agent-count').textContent = new Set(entries.map(sender)).size;
      byId('bridge-live-agents').textContent = [...new Set(entries.map(sender))].join('\n');
      byId('bridge-live-feed').innerHTML = entries.slice(-30).reverse().map(e =>
        '<article class="bridge-event"><b>' + esc(String(sender(e))) + '</b><div class="bridge-event-message">' +
        esc(String(e.payload?.message || e.payload?.text || e.payload?.summary || e.message_type || e.cls || e.kind || 'native record')) +
        '</div><div class="algo-note">sequence ' + esc(String(e.sequence ?? e.seq ?? 'not supplied')) +
        ' · source signature retained; verification not inferred</div></article>').join('');
      byId('bridge-entries-v').textContent = entries.length + ' observed';
      byId('bridge-tip-v').textContent = String(entries.at(-1)?.sequence ?? entries.at(-1)?.seq ?? 'not supplied');
      byId('bridge-root-v').textContent = 'full-chain verification separate';
      renderWorkbench();
    } catch (e) { byId('bridge-status').textContent = 'Local bridge source unavailable: ' + e.message; }
  };
  const remoteAgentRefresh = refreshAgentLineage;
  refreshAgentLineage = async () => {
    if (!window.aletheiaDesktop) return remoteAgentRefresh();
    await refreshBridgeConsole();
    byId('agent-live').textContent = STATE.agentReceipts.length + ' native agent records retained. Native signatures and whole-chain verification have separate scope.';
  };

  async function blobBase64(blob) {
    const pieces = [], block = 3 * 65536;
    for (let offset = 0; offset < blob.size; offset += block) {
      const bytes = new Uint8Array(await blob.slice(offset, offset + block).arrayBuffer());
      let text = '';
      for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
      pieces.push(btoa(text));
    }
    return pieces.join('').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function archivePayload() {
    await flush(); const snapshot = await readSnapshot(), artifacts = [];
    for (const artifact of snapshot.artifacts) {
      const { blob, ...metadata } = artifact;
      artifacts.push({ ...metadata, missing_bytes: !blob,
        ...(blob ? { blob_b64u: await blobBase64(blob) } : {}) });
    }
    return { archive_format_version: 3, state: snapshot.state, state_sha256: await hash(snapshot.state), artifacts,
      custody: { events: snapshot.events, retained: snapshot.retained },
      coverage: { artifacts: artifacts.length, included_bytes: artifacts.reduce((n, a) => n + (a.missing_bytes ? 0 : a.size), 0),
        missing_artifacts: artifacts.filter(a => a.missing_bytes).map(a => a.id),
        exclusions: ['private signing keys', 'authentication tokens', 'unobserved external operations'] } };
  }

  buildArchiveBundle = async (state, digestAlg, sigAlg, key) => {
    if (state !== STATE) return original.buildArchiveBundle(state, digestAlg, sigAlg, key);
    const payload = await archivePayload();
    const bundle = { hdr: { bundle_id: makeId(), profile: 'PB-ARCHIVE-1', spec_id: 'PROOFBUNDLE', spec_ver: PB_SPEC_VER },
      meta: { created_at: now(), application: 'ProofBundle', archive: payload.coverage }, payload };
    await sealCore(bundle, digestAlg, sigAlg, key);
    return bundle;
  };

  exportArchive = async () => {
    try {
      await ready;
      if(window.aletheiaDesktop){await exportNativeArchive();return;}
      await chainAppend('export-archive-request', null, 'Complete ProofBundle custody archive');
      await retain('archive-export-request', null, { format: 'PB-ARCHIVE-1', archive_format_version: 3 });
      if (!_currentKey) _currentKey = await sigKeygen('Ed25519');
      const bundle = await buildArchiveBundle(STATE, 'SHA3-256', _currentKey.alg, _currentKey);
      dlText(bundle.hdr.bundle_id + '.aletheia.archive.pb.json', JSON.stringify(bundle, null, 2));
      byId('aletheia-archive-status').textContent = 'Sealed archive prepared: ' + bundle.payload.artifacts.length +
        ' artifacts, ' + bundle.payload.custody.events.length + ' custody events, ' +
        fmtBytes(bundle.payload.coverage.included_bytes) + ' of retained bytes.';
    } catch (e) { notifyError('Archive export incomplete: ' + e.message); throw e; }
  };

  async function restoreArchive(bundle) {
    await flush();
    const { outcome } = await verifyCore(bundle, {});
    if (outcome !== 'VERIFIED') throw new Error('Archive seal refused: ' + outcome);
    if (bundle.hdr.profile !== 'PB-ARCHIVE-1' || !bundle.payload?.state) throw new Error('Unsupported archive profile');
    const payload = bundle.payload, state = payload.state;
    const nativeChain = await verifyChain(state.chain || []);
    if (!nativeChain.ok) throw new Error('Archive native chain is broken at ' + nativeChain.brokenAt);
    const complete = payload.archive_format_version === 3;
    if (payload.archive_format_version && !complete) throw new Error('Unsupported archive format version');
    if (complete) await verifyEvents(payload.custody?.events || []);
    if (complete && await hash(state) !== payload.state_sha256) throw new Error('Archive application-state checksum mismatch');
    if (complete && (!Array.isArray(payload.artifacts) || !Array.isArray(payload.custody?.events) ||
        !Array.isArray(payload.custody?.retained) || FIELDS.some(field => state[field] !== undefined && !Array.isArray(state[field]))))
      throw new Error('Complete archive omits a required native custody collection');
    const artifacts = [];
    for (const encoded of payload.artifacts || []) {
      const { blob_b64u, ...metadata } = encoded;
      const artifact = { ...metadata, blob: blob_b64u !== undefined ? new Blob([b64uDecode(blob_b64u)], { type: metadata.mime }) : null };
      if (!artifact.blob && !artifact.missing_bytes) throw new Error('Archive silently omits artifact bytes');
      await validateArtifact(artifact); artifacts.push(artifact);
    }
    const previous = await readSnapshot();
    const previousState = stateSnapshot();
    // Legacy four-collection archives restore only their declared collections.
    // Provenance collections outside the legacy scope are retained.
    const nextState = complete ? state : { ...previousState, ...state };
    applyState(nextState);
    try {
      await retain('archive-restoration', bundle.hdr.bundle_id, {
        seal_outcome: outcome, archive_format_version: payload.archive_format_version || 2,
        included_artifacts: artifacts.length, legacy_scope: !complete }, null, tx => {
        const retainedStore = tx.objectStore('retained');
        retainedStore.add({ id: makeId(), reason: 'pre-restoration', observed_at: now(),
          state: previous.state, artifacts: previous.artifacts.map(({ blob, ...metadata }) => metadata),
          imported_custody: previous.events });
        retainedStore.add({ id: makeId(), reason: 'imported-archive', observed_at: now(),
          archive_id: bundle.hdr.bundle_id, state, imported_custody: payload.custody?.events || [] });
        for (const record of payload.custody?.retained || [])
          retainedStore.add({ ...record, id: makeId(), source_record_id: record.id });
        if (complete) {
          const included = new Set(artifacts.map(a => a.id));
          for (const old of previous.artifacts) if (!included.has(old.id))
            tx.objectStore('artifacts').put({ ...old, retired: true, retired_at: now() });
        }
        for (const artifact of artifacts) tx.objectStore('artifacts').put(artifact);
      });
    } catch (e) { applyState(previousState); throw e; }
    renderClaims(); renderPredictions(); renderLedgerPanel(); await renderLibrary(); renderWorkbench();
    return { outcome, complete, artifacts: artifacts.length, missing: artifacts.filter(a => !a.blob).length };
  }

  importArchive = async () => {
    const box = byId('ledger-import-result'); box.style.display = 'block';
    try {
      const file = byId('ledger-import-file').files[0];
      if(file&&window.aletheiaDesktop&&file.name.endsWith('.zip')) {
        const path=aletheiaDesktop.sourcePath(file);
        const inspected=await aletheiaDesktop.call('inspectArchiveZip',{path});
        const verified=await verifyCore(inspected.bundle,{});
        if(verified.outcome!=='VERIFIED')throw new Error('Archive manifest seal refused: '+verified.outcome);
        const staged=await aletheiaDesktop.call('stageArchiveZip',{path,bundle:inspected.bundle});
        await recoverRecordCheckpoint(staged);
        renderWorkbench();box.textContent='Native archive seal, record hashes, custody signatures, and artifact commitments verified; restoration committed.';return;
      }
      const bundle = JSON.parse(file ? await file.text() : byId('ledger-import-json').value);
      const result = await restoreArchive(bundle);
      box.textContent = 'Archive seal verified; restoration committed. ' + result.artifacts + ' artifacts restored; ' +
        result.missing + ' artifact(s) explicitly lack bytes.' + (result.complete ? '' : ' Legacy archive scope: existing extended custody retained.');
    } catch (e) { box.textContent = 'Restoration refused: ' + e.message; }
  };

  function mirrorRecords(){
    if(nativeCheckpointFlight)return nativeCheckpointFlight;
    nativeCheckpointFlight=mirrorRecordsOnce().finally(()=>{nativeCheckpointFlight=null;});return nativeCheckpointFlight;
  }
  async function mirrorRecordsOnce() {
    await flush();
    const response=await api('/api/aletheia/status',{cache:'no-store'});
    const server=await response.json(),known=new Map(server.blobs.map(b=>[b.key,b]));
    const tx=db.transaction(['meta','artifacts','events','retained']);
    let keeping=true;const actions=[];
    const active=fn=>new Promise((resolve,reject)=>actions.push({fn,resolve,reject}));
    const keepalive=()=>{if(!keeping)return;const r=tx.objectStore('meta').get('checkpoint-keepalive');r.onsuccess=()=>{for(const action of actions.splice(0)){try{action.resolve(action.fn());}catch(error){action.reject(error);}}keepalive();};r.onerror=()=>{for(const action of actions.splice(0))action.reject(r.error);};};keepalive();
    try {
      const meta=await request(tx.objectStore('meta').get('workspace'));
      const header={schema:'AletheiaCustodySnapshot/v1',state:meta.state,state_sha256:meta.state_sha256};
      const draft=await aletheiaDesktop.call('beginRecordCheckpoint',{header});
      const counts={artifacts:0,events:0,retained:0};let totalBytes=0,recordBatch=[],batchBytes=0;
      const flushBatch=async()=>{if(!recordBatch.length)return;const records=recordBatch;recordBatch=[];batchBytes=0;const result=await aletheiaDesktop.call('checkpointRecords',{id:draft.id,items:records});totalBytes+=result.bytes;};
      for(const kind of ['artifacts','events','retained']) {
        await new Promise((resolve,reject)=>{
          active(()=>{
          const source=kind==='events'?tx.objectStore(kind).index('sequence'):tx.objectStore(kind);
          const cursor=source.openCursor();cursor.onerror=()=>reject(cursor.error);
          cursor.onsuccess=()=>{const row=cursor.result;if(!row)return resolve();
            (async()=>{
              let record=row.value;
              if(kind==='artifacts') {
                const {blob,...metadata}=record;record=metadata;
                if(blob) {
                  const key=await hash(record.id);let stored=known.get(key);
                  if(!stored){const uploaded=await api('/api/aletheia/blob/'+key,{method:'POST',body:blob});stored=await uploaded.json();known.set(key,stored);}
                  record.blob_ref=key;record.blob_sha256=stored.sha256;
                } else record.missing_bytes=true;
              }
              const raw=JSON.stringify(record);
              let receipt;
              if(raw.length>262144){
                await flushBatch();
                const upload=await aletheiaDesktop.call('beginCheckpointRecord',{id:draft.id,kind,ordinal:counts[kind]});
                for(let offset=0;offset<raw.length;){let end=Math.min(raw.length,offset+262144);if(end<raw.length&&raw.charCodeAt(end-1)>=0xD800&&raw.charCodeAt(end-1)<=0xDBFF)end--;await aletheiaDesktop.call('appendCheckpointRecord',{upload_id:upload.upload_id,chunk:raw.slice(offset,end)});offset=end;}
                receipt=await aletheiaDesktop.call('finishCheckpointRecord',{upload_id:upload.upload_id});
              }else{recordBatch.push({kind,ordinal:counts[kind],raw_json:raw});batchBytes+=utf8(raw).length;if(recordBatch.length>=100||batchBytes>=1048576)await flushBatch();receipt={bytes:0};}
              totalBytes+=receipt.bytes;counts[kind]++;await active(()=>row.continue());
            })().catch(reject);
          };
          }).catch(reject);
        });
        await flushBatch();
        console.info('PB-DIAG SQLite checkpoint '+kind+' '+counts[kind]+' records; serialized bytes so far '+totalBytes);
      }
      const receipt=await aletheiaDesktop.call('finishRecordCheckpoint',{id:draft.id,counts});
      status.mirror='local SQLite record checkpoint saved '+receipt.saved_at;
      return receipt;
    } finally {keeping=false;}
  }

  async function mirror() {
    if (!serverAvailable || mirrorRunning) return;
    mirrorRunning = true; mirrorDirty = false;
    try {
      if(window.aletheiaDesktop){await mirrorRecords();return;}
      await flush(); const snapshot = await readSnapshot();
      const response = await api('/api/aletheia/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('Local custody service unavailable');
      const server = await response.json(), known = new Map(server.blobs.map(b => [b.key, b]));
      const metadata = [];
      for (const artifact of snapshot.artifacts) {
        const { blob, ...record } = artifact;
        if (blob) {
          const key = await hash(artifact.id);
          let stored = known.get(key);
          if (!stored) {
            const uploaded = await api('/api/aletheia/blob/' + key, { method: 'POST', body: blob });
            stored = await uploaded.json(); if (!uploaded.ok) throw new Error(stored.error || 'Blob backup failed');
          }
          record.blob_ref = key; record.blob_sha256 = stored.sha256;
        } else record.missing_bytes = true;
        metadata.push(record);
      }
      const payload = { ...snapshot, artifacts: metadata };
      const result = await api('/api/aletheia/checkpoint', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const receipt = await result.json(); if (!result.ok) throw new Error(receipt.error || 'Checkpoint backup failed');
      status.mirror = 'local SQLite checkpoint saved ' + receipt.saved_at;
    } catch (e) { status.mirror = 'backup pending: ' + e.message; }
    finally {
      mirrorRunning = false; renderStatus();
      if (mirrorDirty) scheduleMirror();
    }
  }

  function scheduleMirror() {
    if (!serverAvailable) return;
    mirrorDirty = true;
    if(checkpointHold)return;
    clearTimeout(mirrorTimer); mirrorTimer = setTimeout(mirror, 500);
  }

  async function copyValue(text) {
    try {
      if (window.aletheiaDesktop) await aletheiaDesktop.clipboardWrite(String(text));
      else {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(String(text));
      }
      flashToast('Copy request accepted.'); return true;
    } catch {
      const box = byId('aletheia-manual-copy'); box.value = String(text); box.hidden = false;
      box.focus(); box.select();
      flashToast('Selected value available for Ctrl+C or Cmd+C.'); return false;
    }
  }
  copyText = copyValue;
  copyEl = id => copyValue(byId(id)?.innerText || byId(id)?.textContent || '');
  heroCopyText = text => copyValue(text);
  orchCopyCommand = async () => { orchBuildCommand(); return copyValue(byId('orch-command').value); };

  function renderStatus() {
    const el = byId('aletheia-save-state'); if (!el) return;
    el.textContent = status.error ? 'Custody not confirmed: ' + status.error :
      (status.pending ? 'Custody commits pending: ' + status.pending : 'Browser custody ' + status.local) + ' · ' + status.mirror;
    el.className = 'notice ' + (status.error ? 'notice-error' : '');
  }

  function recordPreview(value) {
    let nodes=0;
    function view(item,depth=0) {
      if(++nodes>2000)return '[Preview limit; original record retained]';
      if(typeof item==='string')return item.length>4096?item.slice(0,4096)+'… [original string retained]':item;
      if(item===null||typeof item!=='object')return item;
      if(depth>=8)return '[Nested original retained]';
      if(Array.isArray(item))return item.slice(0,20).map(x=>view(x,depth+1)).concat(item.length>20?['['+(item.length-20)+' further original entries retained]']:[]);
      const result={};for(const [key,child] of Object.entries(item).slice(0,80))result[key]=view(child,depth+1);return result;
    }
    return JSON.stringify(view(value),null,2);
  }
  async function selectRecord(index) {
    selected = inspectorRows[index];
    if (selected?.category === 'Custody') selected = {...selected,record:await request(db.transaction('events').objectStore('events').get(selected.record.id))};
    if (selected?.category === 'Bridge' && selected.record.raw_ref) {const native=await request(db.transaction('retained').objectStore('retained').get(selected.record.raw_ref));if(native?.original)selected={...selected,record:native.original};}
    if (selected?.category === 'Historical state') selected = {...selected,record:await request(db.transaction('retained').objectStore('retained').get(selected.record.id))};
    const title = byId('aletheia-inspector-title'), raw = byId('aletheia-inspector');
    title.textContent = selected?.title || 'Native record';
    raw.textContent = selected ? recordPreview(selected.record) : 'No record selected.';
    byId('aletheia-run-vector').hidden = selected?.category !== 'Vector set';
    const summary = byId('aletheia-record-summary');
    if (selected) {
      const record = selected.record, source = record.source || record.registry || record.origin?.origin || {};
      const description = record.statement || record.native?.summary || record.summary || record.scope || record.coverage ||
        record.payload?.coverage || record.status || selected.verification || 'Native evidence record';
      summary.innerHTML = '<p>' + esc(String(description).slice(0, 600)) + '</p><dl class="aletheia-record-facts">' +
        [['Layer', selected.category || 'Native record'], ['Source', source.path || source.source_system || record.path || 'recorded local operation'],
         ['Identity', record.actor?.id || record.origin?.creator || record.from || 'source identity not supplied'],
         ['Evidence state', selected.verification || record.verification || 'not evaluated'],
         ['Algorithm / profile', record.algorithm_id || record.primitiveFamily || record.profile || record.schema || 'native source'],
         ['Source-declared implementation', record.implementationStatus || 'not declared'],
         ['Source-declared proof status', record.proofStatus ? JSON.stringify(record.proofStatus) : 'not supplied'],
         ['Boundary / authority', record.boundary ? JSON.stringify(record.boundary) : 'no new boundary or authority verdict asserted']]
          .map(([key, value]) => '<dt>' + esc(key) + '</dt><dd>' + esc(String(value)) + '</dd>').join('') + '</dl>';
    }
  }

  function renderWorkbench() {
    if (renderFlight) { renderAgain = true; return renderFlight; }
    renderFlight = (async () => {
      do { renderAgain = false; await renderWorkbenchOnce(); } while (renderAgain);
    })().catch(storageFailure).finally(() => { renderFlight = null; });
    return renderFlight;
  }

  async function renderWorkbenchOnce() {
    if (!db || !byId('aletheia-timeline')) return;
    // Display queries omit the full workspace and historical snapshot payloads.
    const tx = db.transaction(['artifacts', 'events', 'retained']);
    const artifactsRequest = request(tx.objectStore('artifacts').getAll());
    const countRequest = request(tx.objectStore('events').count());
    const events = [], retained = [];
    const scan = (name, receive) => new Promise((resolve, reject) => {
      const cursor = name === 'events' ? tx.objectStore(name).index('sequence').openCursor(null,'prev') : tx.objectStore(name).openKeyCursor();
      cursor.onerror = () => reject(cursor.error);
      cursor.onsuccess = () => { const row = cursor.result; if (!row) return resolve(); receive(name === 'retained' ? {id:row.primaryKey,reason:'Retained original archive record'} : row.value); if(name === 'events' && events.length >= 60) return resolve(); row.continue(); };
    });
    const [, , artifacts, eventCount] = await Promise.all([
      scan('events', event => { const {payload,actor,...metadata}=event; events.unshift({...metadata,actor:actor?{id:actor.id}:null}); }),
      scan('retained', record => retained.push({id:record.id,reason:record.reason,observed_at:record.observed_at})),
      artifactsRequest, countRequest]);
    const snapshot = { artifacts, events, retained };
    if (!byId('aletheia-timeline')) return;
    const active = snapshot.artifacts.filter(a => !a.retired), missing = snapshot.artifacts.filter(a => !a.blob);
    byId('aletheia-count-artifacts').textContent = active.length;
    byId('aletheia-count-receipts').textContent = (STATE.agentReceipts || []).length;
    byId('aletheia-count-rlm').textContent = (STATE.rlmCaptures || []).length;
    byId('aletheia-count-events').textContent = eventCount;
    byId('aletheia-count-algorithms').textContent = STATE.algorithmSources.length;
    byId('aletheia-count-vectors').textContent = STATE.implementationRuns.at(-1)?.totals.captured ?? STATE.vectorSets.reduce((n, set) => n + (set.vector_count || 0), 0);
    renderCurrentEvidence();
    byId('aletheia-entry-path').textContent = signingIdentity?.runtime_context?.entry_path || location.href;
    byId('aletheia-signing-status').textContent = signingIdentity ? 'Local custody key fingerprint: ' + (signingIdentity.fingerprint_sha256 || signingIdentity.public_key_raw_b64u) +
      '. External agent authorship and handshake remain separate.' : 'Custody hashes recorded; no local signing identity in this browser mode.';
    byId('aletheia-coverage').textContent = missing.length + ' artifact(s) lack captured bytes. ' +
      'Origin assertions, authorization, boundary results, proof assumptions, and signature verdicts retain their native scope.';
    inspectorRows = [
      ...snapshot.events.slice(-60).reverse().map(e => ({ title: e.action, category: 'Custody',
        time: e.observed_at, reference: e.ref || e.id, verification: 'local event hash', record: e })),
      ...(STATE.rlmCaptures || []).slice(-20).reverse().map(e => ({ title: e.query?.text || 'RLM capture',
        category: 'RLM', time: e.observed_at, reference: e.id, verification: e.verification, record: e })),
      ...snapshot.artifacts.map(a => ({ title: a.name, category: a.retired ? 'Retained artifact' : 'Artifact',
        time: a.imported_at, reference: a.id, verification: a.blob ? 'bytes retained' : 'bytes unavailable',
        record: { ...a, blob: undefined, origin: STATE.origins.find(o => o.id === a.origin_id),
          supplements: STATE.supplements.filter(s => s.artifact_id === a.id) } })),
      ...snapshot.retained.map(record => ({ title: record.reason || 'Retained snapshot', category: 'Historical state',
        time: record.observed_at, reference: record.id, verification: 'retained native history; original loads on selection', record })),
      ...STATE.algorithmSources.map(record => ({ title: record.canonicalName || record.id, category: 'Algorithm',
        time: record.capture?.observed_at, reference: record.id, verification: 'registered source; execution status separate', record })),
      ...STATE.vectorSets.map(record => ({ title: (record.algorithm_id || 'vectors') + ' · ' + record.path.split('/').at(-1),
        category: 'Vector set', time: record.observed_at, reference: record.id,
        verification: (record.vector_count ?? 'unknown') + ' cases captured; execution not asserted', record })),
      ...STATE.bridgeObservations.slice(-20).reverse().map(record => ({ title: record.kind,
        category: 'Bridge', time: record.observed_at, reference: record.id, verification: record.verification, record })),
      ...STATE.implementationRuns.flatMap(run=>run.results.map(record=>({title:'Linked provider · '+record.algorithm_id,category:'Execution result',time:run.observed_at,reference:record.provider?.sha256,verification:record.executed+' invoked · '+record.totals.failed+' source mismatches',record}))),
      ...STATE.outcomeRuns.map(record=>({title:'Native typed outcome matrix',category:'Execution result',time:record.observed_at,reference:record.artifact_sha256,verification:record.matrix.length+' outcomes measured',record})),
      ...STATE.conformanceRuns.map(record => ({ title: 'Vector execution · ' + record.algorithm_id,
        category: 'Execution result', time: record.observed_at, reference: record.source_sha256,
        verification: record.passed + ' passed · ' + record.failed + ' failed · ' + record.unsupported + ' unsupported', record })),
    ];
    const filter = byId('aletheia-filter')?.value || '';
    const query = byId('aletheia-record-query').value.trim().toLowerCase();
    const rows = inspectorRows.map((row, index) => ({ row, index })).filter(({ row }) =>
      (!filter || row.category === filter) && (!query || (row.title + ' ' + row.reference + ' ' + row.verification).toLowerCase().includes(query)));
    page = Math.max(0, Math.min(page, Math.max(0, Math.ceil(rows.length / 100) - 1)));
    byId('aletheia-page-status').textContent = rows.length ? (page * 100 + 1) + '–' + Math.min(rows.length, (page + 1) * 100) + ' of ' + rows.length : '0 records';
    byId('aletheia-timeline').innerHTML = rows.length ? '<table class="mini-table"><thead><tr><th>Record</th><th>Source layer</th><th>Evidence state</th><th>Observed</th></tr></thead><tbody>' +
      rows.slice(page * 100, (page + 1) * 100).map(({ row, index }) => '<tr><td><button class="aletheia-record-link" onclick="Aletheia.select(' + index + ')">' +
        esc(row.title) + '</button>' + (row.record.source_ref?.path ? '<div class="algo-note mono">' + esc(row.record.source_ref.path) + '</div>' : '') + '<div class="algo-note mono">' + esc(String(row.reference)) + '</div></td><td>' +
        esc(row.category) + '</td><td>' + esc(row.verification || 'not evaluated') + '</td><td>' + esc(row.time || '') + '</td></tr>').join('') +
      '</tbody></table>' : '<div class="empty">No records in this view.</div>';
    const selector = byId('aletheia-origin-artifact'), previous = selector.value;
    selector.innerHTML = active.map(a => '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>').join('');
    if (active.some(a => a.id === previous)) selector.value = previous;
    if (selected) byId('aletheia-inspector').textContent = recordPreview(selected.record);
  }

  async function loadSources() {
    try {
      const response = await api('/api/aletheia/sources', { cache: 'no-store' });
      if (!response.ok) throw new Error('RLM capture service unavailable');
      const data = await response.json();
      if (!byId('aletheia-source')) return;
      byId('aletheia-source').innerHTML = data.sources.map(s => '<option value="' + esc(s.id) + '" ' +
        (!s.available ? 'disabled' : '') + '>' + esc(s.id) + (s.available ? ' · read-only' : ' · not mounted') + '</option>').join('');
      byId('aletheia-source-status').textContent = data.sources.map(s => s.id + ': ' + s.path + (s.available ? '' : ' (not mounted)')).join('\n') +
        '\nEstablished RLM scripts: ' + data.scripts.map(s => s.path + (s.available ? '' : ' (unavailable)')).join(', ');
    } catch (e) { if (byId('aletheia-source-status')) byId('aletheia-source-status').textContent = e.message + '. Previously captured native records remain inspectable and exportable.'; }
  }

  async function searchRlm(event) {
    event?.preventDefault(); await ready;
    const source = byId('aletheia-source').value, query = byId('aletheia-query').value.trim();
    const el = byId('aletheia-query-status');
    if (!query) { el.textContent = 'A query is required.'; return; }
    el.textContent = 'Native source query in progress.';
    const requestId = makeId();
    await retain('rlm-query-request', requestId, { source, query });
    try {
      const response = await api('/api/aletheia/search', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, query, limit: 6 }) });
      const capture = await response.json(); if (!response.ok) throw new Error(capture.error || 'Query failed');
      STATE.rlmCaptures.push(capture);
      await retain('rlm-native-result-capture', capture.id, capture);
      el.textContent = capture.records.length + ' native record(s) retained, including full content and source references. ' + capture.coverage;
      inspectorRows.unshift({ title: query, category: 'RLM', record: capture }); selectRecord(0);
      renderWorkbench();
    } catch (e) {
      await retain('rlm-query-failure', requestId, { source, query, error: e.message });
      el.textContent = 'Query incomplete: ' + e.message;
    }
  }

  async function addSupplement(event) {
    event?.preventDefault(); await ready;
    const artifactId = byId('aletheia-origin-artifact').value;
    const statement = byId('aletheia-origin-statement').value.trim();
    if (!artifactId || !statement) return;
    const supplement = { schema: 'AletheiaProvenanceSupplement/v1', id: makeId(), artifact_id: artifactId,
      observed_at: now(), statement, standing: 'operator assertion; no authority or signature verdict inferred' };
    supplement.record_sha256 = await hash(supplement);
    STATE.supplements.push(supplement);
    await retain('provenance-supplement', artifactId, supplement);
    byId('aletheia-origin-statement').value = '';
    flashToast('Provenance supplement retained; origin record preserved.');
  }

  async function verifyCustody() {
    try {
      await flush(); const snapshot = await readSnapshot();
      const checked = await verifyEvents(snapshot.events);
      if (snapshot.state_sha256 && await hash(snapshot.state) !== snapshot.state_sha256)
        throw new Error('Application-state checksum mismatch');
      const native = await verifyChain(snapshot.state.chain || []);
      if (!native.ok) throw new Error('Native action chain mismatch at ' + native.brokenAt);
      for (const artifact of snapshot.artifacts) if (artifact.blob) await validateArtifact(artifact);
      byId('aletheia-archive-status').textContent = checked.checked + ' custody events and ' + native.length +
        ' native action entries checked; captured artifact bytes match their native commitments. Origin assertions and external signatures have separate verdicts.';
    } catch (e) { byId('aletheia-archive-status').textContent = 'Custody check failed: ' + e.message; }
  }

  async function appendCatalogue() {
    await ready;
    const indicator = byId('aletheia-catalogue-status');
    if (!window.aletheiaDesktop) { indicator.textContent = 'Native catalogue capture is available in the local desktop application.'; return; }
    indicator.textContent = 'Reading the native registry and its declared vector files.';
    const catalogue = await aletheiaDesktop.catalogue();
    const present = new Set(STATE.algorithmSources.map(a => a.capture.registry_sha256 + ':' + a.id));
    for (const algorithm of catalogue.algorithms) {
      const id = catalogue.registry.sha256 + ':' + algorithm.id;
      if (!present.has(id)) STATE.algorithmSources.push({ ...algorithm,
        capture: { registry_sha256: catalogue.registry.sha256, source_path: catalogue.registry.path, observed_at: catalogue.observed_at } });
    }
    const vectorIds = new Set(STATE.vectorSets.map(v => v.id));
    for (const set of catalogue.vector_sets) if (!vectorIds.has(set.id))
      STATE.vectorSets.push({ ...set, observed_at: catalogue.observed_at });
    STATE.catalogueSources.push({ ...catalogue, algorithms: undefined, files: undefined });
    // Native source bytes become ordinary ProofBundle Library artifacts. Their
    // commitments and bytes therefore participate in the existing full archive.
    for (let i = 0; i < catalogue.files.length; i++) {
      const source = catalogue.files[i];
      indicator.textContent = 'Retaining native source ' + (i + 1) + '/' + catalogue.files.length + ': ' + source.name;
      const response = await api('/api/aletheia/blob/' + source.blob_ref);
      const bytes = await response.arrayBuffer();
      if (hexOf(await digestBytes('SHA-256', new Uint8Array(bytes))) !== source.sha256)
        throw new Error('Native source byte hash mismatch: ' + source.path);
      const file = new File([bytes], source.name, { type: 'application/json' });
      await libraryImport([file]);
      const h = await hashFileEntry({ file, size: file.size }, 'SHA-256', 1048576);
      const artifact = await libraryGet('sha256:' + h.root_b64u);
      artifact.kind = source.kind; artifact.source_ref = source; artifact.tags = [...new Set([...artifact.tags, source.kind])];
      await retain('native-source-binding', artifact.id, { source }, artifact);
    }
    await retain('native-catalogue-append', catalogue.id, { registry: catalogue.registry,
      algorithm_records: catalogue.algorithms.length, vector_sets: catalogue.vector_sets.length,
      unavailable_references: catalogue.unavailable_references, coverage: catalogue.coverage });
    indicator.textContent = catalogue.algorithms.length + ' algorithm records and ' + catalogue.vector_sets.length +
      ' vector sets appended with retained native bytes. ' + catalogue.unavailable_references.length + ' declared references are unavailable. ' + catalogue.coverage;
    renderWorkbench();
  }

  async function runSelectedVectors() {
    if (selected?.category !== 'Vector set' || !window.aletheiaDesktop) return;
    const vector = selected.record;
    await retain('conformance-execution-request', vector.id, { source: vector });
    byId('aletheia-catalogue-status').textContent = 'Native vector execution in progress: ' + vector.algorithm_id;
    try {
      await mirror();
      const result = await aletheiaDesktop.call('runVectors', { key: vector.blob_ref });
      if (result.source_sha256 !== vector.sha256) throw new Error('Executor source hash differs from captured vector bytes');
      result.algorithm_id = vector.algorithm_id; STATE.conformanceRuns.push(result);
      await retain('conformance-execution-result', vector.id, result);
      byId('aletheia-catalogue-status').textContent = result.passed + ' passed; ' + result.failed + ' failed; ' + result.unsupported +
        ' unsupported. Results apply only to the named provider and captured vector bytes.';
      renderWorkbench();
    } catch (e) {
      await retain('conformance-execution-failure', vector.id, { error: e.message });
      byId('aletheia-catalogue-status').textContent = 'Vector execution incomplete: ' + e.message;
    }
  }

  async function appendSnapshots() {
    await ready;
    const indicator=byId('aletheia-catalogue-status');
    for(let sourceIndex=0;sourceIndex<2;sourceIndex++) {
      let source=await aletheiaDesktop.call('sourceSnapshot',{index:sourceIndex});
      if(STATE.catalogueSources.some(s=>s.id===source.id&&s.capture_status==='complete')) continue;
      const priorSource=STATE.catalogueSources.find(s=>s.id===source.id);if(priorSource){Object.assign(priorSource,source);source=priorSource;}else STATE.catalogueSources.push(source);
      source.capture_status='capturing';console.info('PB-DIAG capturing source snapshot '+sourceIndex+' files '+source.files.length);
      let batch=[];
      const commitBatch=async()=>{
        const records=batch; batch=[];
        await retain('archive-source-batch',source.id,{source_root:source.source_root,files:records.map(a=>({artifact_id:a.id,source_refs:a.source_refs}))},null,
          tx=>{for(const record of records)tx.objectStore('artifacts').put(record);});
      };
      for(let index=0;index<source.files.length;index++) {
        const fileSource=source.files[index];
        indicator.textContent='Retaining archive snapshot '+(sourceIndex+1)+': '+(index+1)+'/'+source.files.length+' · '+fileSource.name;
        const response=await api('/api/aletheia/blob/'+fileSource.blob_ref);
        const bytes=await response.arrayBuffer();
        if(hexOf(await digestBytes('SHA-256',new Uint8Array(bytes)))!==fileSource.sha256) throw new Error('Source capture hash mismatch');
        const file=new File([bytes],fileSource.name,{type:'application/octet-stream'});
        const commitment=await hashFileEntry({file,size:file.size},'SHA-256',1048576);
        const id='sha256:'+commitment.root_b64u;
        const prior=batch.find(a=>a.id===id)||await libraryGet(id);
        const record={...prior,id,name:prior?.name||fileSource.name,size:file.size,mime:prior?.mime||file.type,
          kind:prior?.kind||'source',tags:prior?.tags||['archive snapshot'],notes:prior?.notes||'',
          imported_at:prior?.imported_at||now(),updated_at:now(),digest_alg:'SHA-256',chunk_size:1048576,
          chunks:commitment.chunks,merkle_root_b64u:commitment.root_b64u,content_address:commitment.content_address,
          custody_bundle:prior?.custody_bundle||null,blob:file,source_ref:fileSource,
          source_refs:[...(prior?.source_refs|| (prior?.source_ref?[prior.source_ref]:[]))]};
        if(!record.source_refs.some(r=>r.path===fileSource.path&&r.sha256===fileSource.sha256)) record.source_refs.push(fileSource);
        if(!prior) {const origin=await originFor(record,'CollectedArchiveSnapshot',fileSource.path);record.origin_id=origin.id;STATE.origins.push(origin);}
        const at=batch.findIndex(a=>a.id===id);if(at<0)batch.push(record);else batch[at]=record;
        if(batch.length>=100){await commitBatch();console.info('PB-DIAG captured snapshot files '+(index+1));}
      }
      if(batch.length) await commitBatch();
      source.capture_status='complete';
      await retain('archive-source-capture',source.id,{source_root:source.source_root,files:source.files.length,excluded:source.excluded,source_scope:source.source_scope});
    }
    const report=await aletheiaDesktop.call('snapshotTestReport');
    for(const result of report.test_determinations) {
      const identity=result.source_sha256+':'+result.test_path+':'+result.observed_at;
      if(!STATE.conformanceRuns.some(r=>r.receipt_id===identity)) STATE.conformanceRuns.push({...result,receipt_id:identity,kind:'snapshot-test',algorithm_id:result.test_path.split('/').at(-1)});
    }
    await retain('snapshot-test-determinations',null,{source_snapshots:report.source_snapshots,determinations:report.test_determinations,scope:'Fresh program assertion executions, with repeated snapshot runs retained separately.'});
    indicator.textContent='Both supplied archive snapshots retained. Private-key source documents remain recorded as explicit exclusions; originals remain at source.';
    await runArchiveVectors();
    await mirror(); await renderWorkbench();
  }
  async function runArchiveVectors() {
    await ready;
    const result=await aletheiaDesktop.call('runArchiveVectors',{sets:STATE.vectorSets});
    for(let i=0;i<result.results.length;i++) {
      const run=result.results[i],source=STATE.vectorSets[i];
      if(run.source_sha256!==source.sha256)throw new Error('Archive vector executor source hash mismatch');
      STATE.conformanceRuns.push({...run,kind:'vector-file',vector_set_id:source.id});
    }
    await retain('archive-conformance-determinations',null,result);
    await renderWorkbench();return result;
  }
  async function executionTransaction(name,run) {
    await ready;checkpointHold++;clearTimeout(mirrorTimer);
    try{return await run();}catch(error){await retain(name+'-failure',null,{error:error.message});byId('aletheia-catalogue-status').textContent='Execution incomplete: '+error.message;throw error;}
    finally{checkpointHold--;if(mirrorDirty&&!checkpointHold)scheduleMirror();}
  }
  const connectImplementations=execute=>executionTransaction('linked-conformance',()=>connectImplementationsInner(execute));
  const runOutcomeCoverage=()=>executionTransaction('native-outcome',runOutcomeCoverageInner);
  async function captureExecutionSources(files, sourceId) {
    let batch=[];
    const commit=async()=>{const records=batch;batch=[];await retain('implementation-source-batch',sourceId,{files:records.map(r=>({artifact_id:r.id,source_refs:r.source_refs}))},null,tx=>{for(const r of records)tx.objectStore('artifacts').put(r);});};
    for(let i=0;i<files.length;i++) {
      const source=files[i];
      const response=await api('/api/aletheia/blob/'+source.blob_ref),bytes=await response.arrayBuffer();
      if(hexOf(await digestBytes('SHA-256',new Uint8Array(bytes)))!==source.sha256)throw new Error('Implementation source byte mismatch: '+source.path);
      const file=new File([bytes],source.name,{type:'application/octet-stream'});
      let h=source.native_commitment;
      if(h){const leaves=[];for(let offset=0;offset<Math.max(1,bytes.byteLength);offset+=1048576)leaves.push(await leafHashBytes(new Uint8Array(bytes.slice(offset,offset+1048576)),'SHA-256'));const root=b64uEncode(await rootFromLeafHashes(leaves,'SHA-256'));if(root!==h.root_b64u||leaves.length!==h.chunks)throw new Error('Native Merkle commitment mismatch');}
      else h=await hashFileEntry({file,size:file.size},'SHA-256',1048576);
      const id='sha256:'+h.root_b64u;
      const prior=batch.find(r=>r.id===id)||await libraryGet(id);
      const refs=[...(prior?.source_refs||(prior?.source_ref?[prior.source_ref]:[]))];
      if(refs.some(r=>r.path===source.path&&r.sha256===source.sha256))continue;
      refs.push(source);
      const record={...prior,id,name:prior?.name||source.name,size:file.size,mime:file.type,kind:source.kind,
        tags:[...new Set([...(prior?.tags||[]),source.kind])],notes:prior?.notes||'',imported_at:prior?.imported_at||now(),updated_at:now(),digest_alg:'SHA-256',chunk_size:1048576,
        chunks:h.chunks,merkle_root_b64u:h.root_b64u,content_address:h.content_address,blob:file,source_ref:prior?.source_ref||source,source_refs:refs};
      const at=batch.findIndex(r=>r.id===id);if(at<0)batch.push(record);else batch[at]=record;
      if(batch.length>=100){await commit();console.info('PB-DIAG implementation sources captured '+(i+1)+'/'+files.length);}
      byId('aletheia-catalogue-status').textContent='Implementation source capture '+(i+1)+'/'+files.length+' · '+source.path;
      if(i%50===0)await pbYieldToUi();
    }
    if(batch.length)await commit();
  }
  async function connectImplementationsInner(execute=true) {
    await ready;
    if(!window.aletheiaDesktop)throw new Error('Local desktop execution required');
    await retain('linked-conformance-request',null,{operation:execute?'execute captured providers':'retain existing execution receipt'});
    const report=await aletheiaDesktop.call(execute?'runLinkedConformance':'linkedConformanceReport');
    await captureExecutionSources(report.files,report.id);
    const aliases=[];for(const source of report.files){if(source.native_commitment)aliases.push({key:await hash('sha256:'+source.native_commitment.root_b64u),source_key:source.blob_ref,sha256:source.sha256,size:source.size});}
    for(let offset=0;offset<aliases.length;offset+=100)await aletheiaDesktop.call('bindSourceAliases',{bindings:aliases.slice(offset,offset+100)});
    const definitions=await aletheiaDesktop.call('outcomeDefinitions');
    await captureExecutionSources([definitions.source],report.id);
    const capturedPaths=new Set(STATE.vectorSets.map(v=>v.path+':'+v.sha256));
    for(const f of report.files.filter(f=>f.kind==='conformance-vectors'))if(!capturedPaths.has(f.path+':'+f.sha256)){STATE.vectorSets.push({...f,id:f.sha256,algorithm_id:f.algorithm_id,observed_at:report.observed_at,status:'source captured; linked execution receipt separate'});capturedPaths.add(f.path+':'+f.sha256);}
    const registryIds=new Set(STATE.algorithmSources.map(a=>a.capture.registry_sha256+':'+a.id));
    for(const a of report.algorithms){const d=a.source_determination;if(!registryIds.has(report.registry.sha256+':'+d.id))STATE.algorithmSources.push({...d,capture:{registry_sha256:report.registry.sha256,source_path:report.registry.path,observed_at:report.observed_at}});}
    STATE.implementationRuns.push({...report,outcome_definitions:definitions});
    await retain('linked-conformance-result',report.id,{...report,outcome_definitions:definitions});
    byId('aletheia-catalogue-status').textContent=report.totals.executed+' actual vector invocations; '+report.totals.blocked+' cases blocked with per-case reasons. Provider and vector bytes retained.';
    await renderWorkbench();return report;
  }
  async function runOutcomeCoverageInner() {
    await ready;
    const started=now();await retain('native-outcome-execution-request',null,{provider:'Current renderer verifyCore',scopes:['classical','pq'],additional:'Dual-signature disagreement'});
    const cases=[];
    for(const scope of ['classical','pq'])for(const [digest,signature] of PB_RUN_SCOPES[scope].pairs) {
      byId('aletheia-catalogue-status').textContent='Native outcome execution · '+digest+' × '+signature+' · '+cases.length+' completed cases';
      const built=await buildRunnerCases(digest,signature);
      for(const c of built){const actual=await verifyCore(c.bundle,c.opts);cases.push({scope,digest,signature,expected:c.expected,actual:actual.outcome,standing:actual.outcome===c.expected?'passed':'failed',bundle:c.bundle,options:c.opts,trace:actual.trace});}
      await pbYieldToUi();
    }
    const built=await buildRunnerCases('SHA-256','Ed25519');
    const bundle=JSON.parse(JSON.stringify(built[0].bundle));
    const witnessKey=await sigKeygen('Ed25519');
    bundle.seal.witness={sig_alg:'Ed25519',pub_b64u:witnessKey.pub,signature_b64u:b64uEncode(await sigSign('Ed25519',b64uDecode(bundle.seal.digest_b64u),witnessKey.priv))};
    // Corrupt only the witness signature; the primary and covered envelope remain valid.
    const sig=bundle.seal.witness.signature_b64u;bundle.seal.witness.signature_b64u=(sig[0]==='A'?'B':'A')+sig.slice(1);
    const actual=await verifyCore(bundle,built[0].opts);
    cases.push({scope:'dual-signature disagreement',digest:'SHA-256',signature:'Ed25519',expected:'INDETERMINATE',actual:actual.outcome,standing:actual.outcome==='INDETERMINATE'?'passed':'failed',bundle,options:built[0].opts,trace:actual.trace});
    const native=['VERIFIED','INVALID-SIGNATURE','MALFORMED','UNKNOWN-VERSION','EXPIRED','OUT-OF-BOUNDS','MISSING-SIDE-INFO','RESOURCE-EXHAUSTED','LINEAGE-INVALID','POLICY-DENIED','INDETERMINATE'];
    const matrix=native.map(outcome=>({outcome,expected:cases.filter(c=>c.expected===outcome).length,observed:cases.filter(c=>c.actual===outcome).length,passed:cases.filter(c=>c.expected===outcome&&c.standing==='passed').length,failed:cases.filter(c=>c.expected===outcome&&c.standing==='failed').length}));
    const result={schema:'ProofBundleNativeOutcomeCoverage/v1',id:makeId(),started_at:started,observed_at:now(),provider:'Current local renderer verifyCore',artifact_sha256:signingIdentity?.runtime_context?.artifact_sha256||null,matrix,cases,
      source_manifest:{anchor:PB_MANIFEST_ANCHOR,source_sha256:PB_MANIFEST_SOURCE_SHA,expected_counts:vecTallies(loadVectorManifest()).expected},scope:'Generated live engine cases; frozen manifest rows remain historical source declarations, not replayed original payloads. Native HTML outcomes and modular verdict enum remain separate namespaces.'};
    STATE.outcomeRuns.push(result);await retain('native-outcome-execution-result',result.id,result);byId('aletheia-catalogue-status').textContent=cases.length+' native engine cases completed · '+matrix.filter(r=>r.observed>0).length+' terminal outcomes observed · '+matrix.reduce((n,r)=>n+r.failed,0)+' outcome mismatches';await renderWorkbench();return result;
  }
  function renderLinkedEvidence() {
    const report=STATE.implementationRuns.at(-1),outcomes=STATE.outcomeRuns.at(-1),target=byId('proofbundle-linked-execution');if(!target)return;
    let html='<h3>Implementation execution and typed outcomes</h3>';
    if(outcomes)html+='<h4>Native HTML verifier outcomes</h4><p>Provider artifact SHA-256 ('+(outcomes.artifact_sha256===signingIdentity?.runtime_context?.artifact_sha256?'current loaded artifact':'earlier loaded artifact')+'): '+esc(outcomes.artifact_sha256||'unavailable')+'</p><table class="mini-table"><thead><tr><th>Outcome</th><th>Expected</th><th>Observed</th><th>Matched</th><th>Mismatch</th></tr></thead><tbody>'+outcomes.matrix.map(r=>'<tr><td>'+esc(r.outcome)+'</td><td>'+r.expected+'</td><td>'+r.observed+'</td><td>'+r.passed+'</td><td>'+r.failed+'</td></tr>').join('')+'</tbody></table><p>'+esc(outcomes.scope)+'</p>';
    else html+='<p>Native typed outcome execution has no retained receipt yet.</p>';
    if(report){const t=report.totals;html+='<p>'+t.executed+' actual vector invocations across '+t.algorithms_with_execution+' algorithms · '+t.passed+' source expectations matched · '+t.failed+' source expectations failed · '+t.observed+' observations without a precise oracle · '+t.blocked+' blocked cases. Archive retention is separate from execution coverage.</p><p>Independent standard and message-binding probes: '+report.independent_probe_totals.passed+' passed · '+report.independent_probe_totals.failed+' failed. A source-answer match does not establish standard conformance.</p><label class="label">Find an implementation or execution discrepancy</label><input id="proofbundle-provider-search" placeholder="algorithm, status, source path" oninput="Aletheia.renderProviders(this.value)"><div id="proofbundle-provider-table" style="max-height:550px;overflow:auto"></div>';
      const digestRuns=report.proofbundle_digest_execution?.results||[];if(digestRuns.length)html+='<h4>Actual ProofBundle modular digest provider</h4><table class="mini-table"><thead><tr><th>Algorithm</th><th>Invoked</th><th>Source match</th><th>Source mismatch</th><th>Blocked</th></tr></thead><tbody>'+digestRuns.map(r=>'<tr><td>'+esc(r.algorithm)+'</td><td>'+r.executed+'</td><td>'+r.passed+'</td><td>'+r.failed+'</td><td>'+r.blocked+'</td></tr>').join('')+'</tbody></table><p>These results use ProofBundle src/digest, with captured provider hashes checked before and after execution. They remain separate from the archived Python provider.</p>';
      const defs=report.outcome_definitions;html+='<details><summary>'+defs.outcomes.length+' modular verdict definitions · separate source namespace</summary><p>'+defs.outcomes.map(esc).join(' · ')+'</p><p>'+esc(defs.source.path)+' · '+esc(defs.source.sha256)+'</p><p>Definition retention does not establish an executable verifier branch or an observed result.</p></details>';
    }else html+='<p>No linked provider execution receipt retained.</p>';
    target.innerHTML=html;if(report)renderProviders('');
  }
  function renderProviders(query='') {
    const report=STATE.implementationRuns.at(-1),target=byId('proofbundle-provider-table');if(!report||!target)return;
    const snapshotFiles=STATE.catalogueSources.flatMap(s=>s.files||[]);
    const rows=report.algorithms.map((m,i)=>{const id=m.algorithm_id.toLowerCase();const family=id==='sha256'?'sha256':/^sha(384|512)$/.test(id)?'sha512':id==='blake3'?'blake3':id.startsWith('blake2')?'blake2':/^(sha3|shake|keccak)/.test(id)?'keccak':id.includes('ecdsa')?'ecdsa':id.startsWith('ml-kem')?'mlkem':id.startsWith('ml-dsa')?'mldsa':null;const snapshotLinks=family?snapshotFiles.filter(f=>(f.name===family+'.mjs'||f.name===family+' (1).mjs')):[];const snapshotTests=family?STATE.conformanceRuns.filter(r=>r.kind==='snapshot-test'&&r.test_path?.endsWith('/'+family+'.test.mjs')):[];return {m,r:report.results[i],snapshotLinks,snapshotTests};}).filter(({m,r})=>JSON.stringify([m.algorithm_id,m.source_determination.implementationStatus,m.selected_provider?.path,r.totals,r.independent_probes]).toLowerCase().includes(query.toLowerCase()));
    target.innerHTML='<p>'+rows.length+' matching algorithms; first 50 shown. Complete results retained in each expandable record.</p><table class="mini-table"><thead><tr><th>Algorithm / source declaration</th><th>Actual provider</th><th>Execution</th></tr></thead><tbody>'+rows.slice(0,50).map(({m,r,snapshotLinks,snapshotTests})=>'<tr><td>'+esc(m.algorithm_id)+'<br>'+esc(m.source_determination.implementationStatus)+'</td><td>'+esc(m.selected_provider?.path||'No mapped Python provider')+'<br><small>'+esc(m.selected_provider?.sha256||'')+'</small></td><td>'+r.executed+' invoked; '+r.totals.passed+' matched; '+r.totals.failed+' failed; '+r.totals.blocked+' blocked<details><summary>Provider links, determinations, case outcomes, and blockers</summary><pre style="max-height:320px;overflow:auto;white-space:pre-wrap">'+esc(JSON.stringify({source_determination:m.source_determination,snapshot_family_source_links:snapshotLinks,snapshot_program_receipts:snapshotTests,snapshot_link_scope:'Family source links and their program receipts; these do not assert execution of the skeleton vectors by a snapshot module',providers:m.providers,vector_files:m.vector_files,determination_files:m.determination_files,provider_error:r.provider_error,independent_probes:r.independent_probes,cases:r.cases.slice(0,20),case_count:r.cases.length,preview_scope:'First 20 cases; complete per-algorithm record retained in Execution result inspector'},null,2))+'</pre></details></td></tr>').join('')+'</tbody></table>';
  }

  function renderCurrentEvidence() {
    renderLinkedEvidence();
    const snapshotRuns=STATE.conformanceRuns.filter(r=>r.kind==='snapshot-test');
    const vectorRuns=new Map();for(const run of STATE.conformanceRuns.filter(r=>r.kind!=='snapshot-test')) vectorRuns.set(run.source_path||run.vector_set_id||run.source_sha256,run);
    const current=[...vectorRuns.values()],totals=Object.fromEntries(['passed','failed','unsupported'].map(k=>[k,current.reduce((n,r)=>n+(r[k]||0),0)]));
    const captured=STATE.implementationRuns.at(-1)?.totals.captured ?? STATE.vectorSets.reduce((n,r)=>n+(r.vector_count||0),0);
    const executed=current.reduce((n,r)=>n+(r.cases?.filter(c=>c.standing==='passed'||c.standing==='failed').length||0),0);
    const linked=STATE.implementationRuns.at(-1);
    const text=linked?'Execution: '+linked.totals.executed+' invoked · '+linked.totals.failed+' source mismatches':'Adapter: '+executed+' executed · '+totals.unsupported+' blocked';
    const badge=byId('selftest-badge');if(badge&&badge.textContent!==text){badge.textContent=text;badge.className='selftest-badge '+((linked?.totals.failed||totals.failed)?'st-bad':'');badge.title='Latest execution per captured vector file; archived cases: '+captured+'; executed cases: '+executed;}
    const boot=window.PB_SELFTEST||[];
    const summary='<h3>Retained adapter and test receipts</h3><p><b>'+captured.toLocaleString()+' archived vector cases</b> in '+STATE.vectorSets.length+' source files. '+current.length+' files submitted to the digest/canonical adapter; '+executed.toLocaleString()+' case executions.</p><p>'+totals.passed+' passed · '+totals.failed+' failed · '+totals.unsupported+' unsupported. Unsupported cases remain unresolved.</p><p>'+snapshotRuns.length+' snapshot test-program runs: '+snapshotRuns.reduce((n,r)=>n+(r.passed||0),0)+' passing assertion executions, '+snapshotRuns.reduce((n,r)=>n+(r.failed||0),0)+' failing assertions. Repeated snapshots remain separate runs, not distinct test definitions.</p><p>Current browser boot diagnostics: '+boot.filter(r=>r.ok).length+' passed, '+boot.filter(r=>!r.ok).length+' failed. Boot diagnostics are one limited suite.</p>';
    let auditSummary='';if(cryptoAudit){const current=cryptoAudit.artifact.sha256===signingIdentity?.runtime_context?.artifact_sha256;const open=cryptoAudit.findings.filter(f=>!String(f.status||'').startsWith('CLOSED'));auditSummary='<p>Native HTML audit ('+(current?'current loaded artifact':'earlier artifact; source hash differs')+'): '+cryptoAudit.summary.conformance_passed+'/'+cryptoAudit.summary.conformance_cases+' executed conformance cases; '+cryptoAudit.summary.functional_audit_checks.passed+'/'+cryptoAudit.summary.functional_audit_checks.total+' functional checks. '+open.length+' unresolved assurance finding(s): '+open.map(f=>esc(f.id+' · '+f.title)).join('; ')+'.</p>'; }
    byId('proofbundle-current-tests').innerHTML=summary+auditSummary;
    const vectorPanel=byId('proofbundle-vector-current');if(vectorPanel)vectorPanel.innerHTML=summary+auditSummary;
    const algorithmPanel=byId('authoritative-registry');
    if(algorithmPanel&&STATE.algorithmSources.length){
      const statuses={};for(const a of STATE.algorithmSources)statuses[a.implementationStatus||'UNDECLARED']=(statuses[a.implementationStatus||'UNDECLARED']||0)+1;
      algorithmPanel.innerHTML='<h3>Archived algorithm determinations</h3><p>'+STATE.algorithmSources.length+' source registrations. Source-declared implementation status: '+Object.entries(statuses).map(([k,v])=>esc(k)+' '+v).join(' · ')+'. Proof status, constraints, ground-truth paths, and vector sources remain in each native record.</p><p>Registration statements retain their source scope. Fresh execution determinations appear in Current tests and conformance.</p><button class="btn btn-secondary" onclick="switchTab(\'aletheia\',document.querySelector(\'[data-title=&quot;ProofBundle workbench&quot;]\'));document.getElementById(\'aletheia-filter\').value=\'Algorithm\';Aletheia.refresh()">Browse all algorithm determinations</button>';
    }
  }

  window.Aletheia = { select: selectRecord, refresh: renderWorkbench, search: searchRlm,
    supplement: addSupplement, verify: verifyCustody, flush, archivePayload, restoreArchive,
    readSnapshot: async () => { await flush(); return readSnapshot(); }, verifyEvents,
    retain, stateSnapshot, status, mirror, copyValue, restoreRecordCheckpoint:recoverRecordCheckpoint, checkpoint:mirrorRecords, exportNativeArchive, appendCatalogue, appendSnapshots, runArchiveVectors, runSelectedVectors, connectImplementations, runOutcomeCoverage, renderProviders,
    page: direction => { page = Math.max(0, page + direction); renderWorkbench(); } };
  window.ProofBundle = window.Aletheia;
  ready = bootstrap();
  window.ALETHEIA_READY = ready;
  ready.catch(storageFailure);
  byId('aletheia-query-form').addEventListener('submit', searchRlm);
  byId('aletheia-origin-form').addEventListener('submit', addSupplement);
  byId('aletheia-filter').addEventListener('change', () => { page = 0; renderWorkbench(); });
  byId('aletheia-record-query').addEventListener('input', () => { page = 0; renderWorkbench(); });
  document.querySelector('[data-title="ProofBundle workbench"]').click();
  new MutationObserver(()=>{if(db)renderCurrentEvidence();}).observe(byId('selftest-badge'),{childList:true,characterData:true,subtree:true});
})();
