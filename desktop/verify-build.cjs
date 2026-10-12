// SPDX-License-Identifier: GPL-3.0-or-later
// Verification runs in the actual local-file renderer and native IPC boundary.
const fs = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

module.exports = async function verifyBuild({ win, localCall, state, root }) {
  const checks = [];
  const check = (name, value) => { checks.push({ name, passed: Boolean(value) }); if (!value) throw new Error(name); };
  await win.webContents.executeJavaScript('window.ALETHEIA_READY');
  check('loaded local file without an HTTP application service', win.webContents.getURL().startsWith('file:'));
  const basic = await win.webContents.executeJavaScript(`(async () => {
    await libraryImport([new File(['native desktop custody fixture'], 'desktop-custody.txt', {type:'text/plain'})]);
    await Aletheia.flush();
    const snapshot = await Aletheia.readSnapshot();
    await Aletheia.verifyEvents(snapshot.events);
    return { artifacts:snapshot.artifacts.length, signed:snapshot.events.every(e=>e.attestation?.algorithm==='Ed25519') };
  })()`);
  check('real IndexedDB retains file bytes', basic.artifacts > 0);
  check('new native custody events have valid individual Ed25519 signatures', basic.signed);
  const archive = await win.webContents.executeJavaScript(`(async () => {
    const key = await sigKeygen('Ed25519');
    const bundle = await buildArchiveBundle(STATE,'SHA3-256','Ed25519',key);
    const verified = await verifyCore(bundle,{});
    await Aletheia.restoreArchive(bundle);
    return {outcome:verified.outcome, format:bundle.payload.archive_format_version,
      bytes:bundle.payload.coverage.included_bytes, events:bundle.payload.custody.events.length};
  })()`);
  check('native sealed archive verifies and restores artifact bytes', archive.outcome === 'VERIFIED' && archive.format === 3 && archive.bytes > 0);
  await win.webContents.reload();
  await new Promise(resolve => win.webContents.once('did-finish-load', resolve));
  await win.webContents.executeJavaScript('window.ALETHEIA_READY');
  check('native desktop reload restores captured artifacts', await win.webContents.executeJavaScript('(async()=> (await libraryAll()).length > 0)()'));
  const catalogue = await localCall('catalogue');
  check('native registry supports hundreds of original algorithm records', catalogue.algorithms.length > 500);
  check('native vector files are captured independently of implementation claims', catalogue.vector_sets.length > 500);
  const catalogueCount = catalogue.vector_sets.reduce((sum, v) => sum + (v.vector_count || 0), 0);
  check('native catalogue contains thousands of vector cases', catalogueCount > 1000);
  if (process.argv.includes('--append-corpus')) {
    await win.webContents.executeJavaScript('Aletheia.appendCatalogue()');
    await win.webContents.executeJavaScript('Aletheia.flush()');
    const captured = await win.webContents.executeJavaScript(`({algorithms:STATE.algorithmSources.length,
      vector_sets:STATE.vectorSets.length, vectors:STATE.vectorSets.reduce((n,v)=>n+(v.vector_count||0),0)})`);
    check('larger native archive appended to the shipped GUI', captured.algorithms >= 583 && captured.vector_sets > 500);
    check('larger archive remains separately counted from boot diagnostics', captured.vectors > 1000);
  }
  await win.webContents.executeJavaScript('Aletheia.mirror()');
  const storage = await localCall('status');
  check('direct local SQLite checkpoint retained', storage.snapshots > 0);
  const source = fs.readFileSync(join(root, 'proofbundle.html'));
  const report = { schema:'AletheiaNativeDesktopBuildVerification/v1', observed_at:new Date().toISOString(),
    artifact_sha256:createHash('sha256').update(source).digest('hex'), entry:'proofbundle.html',
    runtime: {electron:process.versions.electron,node:process.versions.node}, checks,
    catalogue: {algorithms:catalogue.algorithms.length,vector_sets:catalogue.vector_sets.length,
      vector_cases:catalogueCount, unavailable_references:catalogue.unavailable_references.length},
    archive, storage: {snapshots:storage.snapshots,blobs:storage.blobs.length},
    scope:'Native desktop persistence, signatures, archive and source capture. No whole-estate conformance or chat-wide tool signing claim.' };
  const out = join(state, 'desktop-build-verification.json');
  fs.writeFileSync(out, JSON.stringify(report,null,2)+'\n');
  await win.webContents.executeJavaScript("document.querySelector('[data-title=\"ProofBundle workbench\"]').click()");
  const screenshot = await win.webContents.capturePage();
  fs.writeFileSync(join(state,'aletheia-desktop.png'),screenshot.toPNG());
  return {report,out};
};
