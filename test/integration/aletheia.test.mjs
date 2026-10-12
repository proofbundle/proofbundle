// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto, generateKeyPairSync, sign } from 'node:crypto';
import { File, Blob } from 'node:buffer';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory, IDBDatabase, IDBObjectStore } from 'fake-indexeddb';

const html = readFileSync(new URL('../../proofbundle.html', import.meta.url), 'utf8');
const pair = generateKeyPairSync('ed25519');
const publicBytes = pair.publicKey.export({ type: 'spki', format: 'der' });
const identity = { id: 'aletheia-regression-test', public_key_raw_b64u: publicBytes.subarray(-32).toString('base64url'),
  public_key_spki_b64u: publicBytes.toString('base64url'), scope: 'Regression test only' };

async function boot(factory = new IDBFactory(), legacy = null) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', e => { if (!/canvas/i.test(e.message)) errors.push(e.message); });
  const dom = new JSDOM(html, { url: 'https://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: console, beforeParse(w) {
      const U8 = w.Uint8Array;
      w.TextEncoder = class { encode(v) { return new U8(new TextEncoder().encode(v)); } };
      w.TextDecoder = TextDecoder;
      Object.defineProperty(w, 'crypto', { value: { subtle: webcrypto.subtle,
        getRandomValues: b => { const v = webcrypto.getRandomValues(new Uint8Array(b.length)); b.set(v); return b; },
        randomUUID: () => webcrypto.randomUUID() } });
      w.Blob = Blob; w.File = File; w.indexedDB = factory;
      w.fetch = async () => ({ ok: false, status: 404, json: async () => ({ error: 'offline fixture' }), text: async () => '{}' });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.confirm = () => true; w.prompt = () => 'retained,test';
      if (legacy) w.localStorage.setItem('proofbundle.v2.state', JSON.stringify(legacy));
      w.aletheiaDesktop = { identity: async () => identity, clipboardWrite: async () => true,
        signEvent: async text => ({ algorithm: 'Ed25519', signer_id: identity.id,
          public_key_raw_b64u: identity.public_key_raw_b64u,
          signature_b64u: sign(null, Buffer.from('ALETHEIA-CUSTODY-EVENT-1\0' + text), pair.privateKey).toString('base64url') }),
        call: async operation => {
          if (operation === 'status') return null;
          if (operation === 'sources') return { sources: [], scripts: [] };
          throw new Error('offline fixture');
        } };
    } });
  const w = dom.window;
  await w.ALETHEIA_READY;
  await w.Aletheia.flush();
  for (let i = 0; i < 120 && !w.PB_SELFTEST; i++) await new Promise(resolve => setTimeout(resolve, 10));
  return { dom, w, errors, factory };
}

test('native identity-patch guards reject unrepresentable values and preserve trace fields', async () => {
  const { dom, w } = await boot();
  try {
    for (const value of ['undefined', 'Infinity', 'NaN', '(() => {})', 'Symbol("x")', '1n'])
      assert.throws(() => w.eval('canonicalJSON(' + value + ')'), /PB-CANON-JSON-1/);
    assert.match(html, /trace: trace\.map\(t => \(\{ title: String/);
    assert.match(html, /async function verify\(msg, sig, pub\)/);
    assert.match(html, /_ed\.verify\(new Uint8Array\(0\), h2b\(rfcSig\), h2b\(rfcPub\)\)/);
  } finally { dom.window.close(); }
});

test('legacy state migration, reload, signed custody, retirement, and immutable supplements', async () => {
  const factory = new IDBFactory();
  const first = await boot(factory, { claims: [{ id: 'legacy-claim', status: 'pending', bundleId: 'legacy-bundle',
    type: 'general', assertion: 'Native fixture claim', evidence: 'source.txt', standing: 'direct', createdAt: '2026-10-11T00:00:00Z' }], predictions: [], store: [], chain: [],
    agentReceipts: [{ schema: 'original-source', record_sha256: 'source-observation' }] });
  let archiveId;
  try {
    const file = new File(['Aletheia retained source bytes.'], 'source.txt', { type: 'text/plain' });
    await first.w.libraryImport([file]);
    await first.w.updateClaimStatus(0, 'accepted');
    const artifact = (await first.w.libraryAll())[0]; archiveId = artifact.id;
    await first.w.libraryTag(artifact.id);
    const snapshot = await first.w.Aletheia.readSnapshot();
    assert.equal(snapshot.state.agentReceipts.length, 1);
    assert.equal(snapshot.state.claims[0].status, 'accepted');
    assert.equal(snapshot.state.origins.length, 1);
    assert.equal(snapshot.artifacts[0].blob.size, file.size);
    assert.ok(snapshot.events.every(e => e.attestation?.algorithm === 'Ed25519'));
    assert.ok(snapshot.events.some(e => e.action === 'claim-status-transition'));
    await first.w.Aletheia.verifyEvents(snapshot.events);
  } finally { first.dom.window.close(); }
  const second = await boot(factory);
  try {
    const artifact = await second.w.libraryGet(archiveId);
    assert.equal(await artifact.blob.text(), 'Aletheia retained source bytes.');
    assert.equal(second.w.Aletheia.stateSnapshot().claims[0].status, 'accepted');
    await second.w.libraryRemove(archiveId);
    assert.equal((await second.w.libraryAll()).length, 0);
    assert.equal((await second.w.libraryGet(archiveId)).blob.size, artifact.size);
    const snapshot = await second.w.Aletheia.readSnapshot();
    assert.equal(snapshot.artifacts.length, 1);
    assert.ok(snapshot.artifacts[0].retired);
  } finally { second.dom.window.close(); }
});

test('complete signed archive retains bytes and extended native state; altered bytes or chains are refused atomically', async () => {
  const { dom, w } = await boot();
  try {
    await w.libraryImport([new File(['archive byte fixture'], 'archive.txt')]);
    w.eval(`STATE.agentReceipts.push({schema:'native-test', payload_sha256:'observed'});
      STATE.bridgeActions.push({phase:'failed',action_id:'action-fixture'});
      STATE.rlmCaptures.push({schema:'native-result',id:'row-fixture',records:[{native:{body:'original text'}}]});
      ORCH_STATE.messages.push({seq:1,body:'native bus message'});`);
    await w.persistState();
    const key = await w.eval("sigKeygen('Ed25519')");
    w.__key = key;
    const bundle = await w.eval("buildArchiveBundle(STATE,'SHA3-256','Ed25519',window.__key)");
    assert.equal(bundle.payload.archive_format_version, 3);
    assert.equal(bundle.payload.artifacts.length, 1);
    assert.ok(bundle.payload.artifacts[0].blob_b64u);
    assert.equal(bundle.payload.state.agentReceipts.length, 1);
    assert.equal(bundle.payload.state.bridgeActions.length, 1);
    assert.equal(bundle.payload.state.rlmCaptures.length, 1);
    assert.equal(bundle.payload.state.orchestrator.messages.length, 1);
    const altered = JSON.parse(JSON.stringify(bundle));
    altered.payload.artifacts[0].blob_b64u = Buffer.from('different bytes').toString('base64url');
    w.__altered = altered;
    await w.eval("sealCore(window.__altered,'SHA3-256','Ed25519',window.__key)");
    const before = await w.Aletheia.readSnapshot();
    await assert.rejects(w.Aletheia.restoreArchive(altered), /size mismatch|committed Merkle root/);
    assert.equal((await w.Aletheia.readSnapshot()).events.length, before.events.length);
    const corrupted = JSON.parse(JSON.stringify(bundle));
    corrupted.payload.custody.events[0].payload.source = 'changed';
    w.__altered = corrupted;
    await w.eval("sealCore(window.__altered,'SHA3-256','Ed25519',window.__key)");
    await assert.rejects(w.Aletheia.restoreArchive(corrupted), /Custody event mismatch/);
    const restored = await w.Aletheia.restoreArchive(bundle);
    assert.ok(restored.complete);
    assert.equal(await (await w.libraryAll())[0].blob.text(), 'archive byte fixture');
    assert.ok((await w.Aletheia.readSnapshot()).retained.some(r => r.reason === 'pre-restoration'));
  } finally { dom.window.close(); }
});

test('failed storage never reports a custody success or produces an archive', async () => {
  const { dom, w } = await boot();
  const native = IDBDatabase.prototype.transaction;
  try {
    IDBDatabase.prototype.transaction = function (stores, mode, ...rest) {
      if (mode === 'readwrite') throw new Error('simulated quota failure');
      return native.call(this, stores, mode, ...rest);
    };
    await assert.rejects(w.Aletheia.retain('must-not-commit', null, { fixture: true }), /quota failure/);
    await assert.rejects(w.Aletheia.archivePayload(), /quota failure/);
    assert.equal(w.Aletheia.status.local, 'failed');
  } finally { IDBDatabase.prototype.transaction = native; dom.window.close(); }
});

test('clipboard absence falls back to a visible selected value without a false success', async () => {
  const { dom, w } = await boot();
  try {
    w.aletheiaDesktop.clipboardWrite = async () => { throw new Error('clipboard denied'); };
    const result = await w.Aletheia.copyValue('retained manual copy');
    assert.equal(result, false);
    assert.equal(w.document.getElementById('aletheia-manual-copy').value, 'retained manual copy');
    assert.equal(w.document.getElementById('aletheia-manual-copy').hidden, false);
  } finally { dom.window.close(); }
});


test('display refreshes and custody append do not load the full event history', async () => {
  const { dom, w } = await boot();
  const getAll = IDBObjectStore.prototype.getAll;
  try {
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'events') throw new Error('Full event history loaded on a display or append path');
      return getAll.apply(this, args);
    };
    await Promise.all(Array.from({length:20}, () => w.Aletheia.refresh()));
    await w.Aletheia.retain('display-regression', null, {scope:'bounded display regression'});
    await w.Aletheia.flush();
    await w.Aletheia.refresh();
    assert.equal(w.Aletheia.status.error, null);
    assert.equal(w.document.querySelector('#aletheia-count-events').textContent, '2');
  } finally { IDBObjectStore.prototype.getAll = getAll; dom.window.close(); }
});
