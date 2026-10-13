#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('proofbundle.html');html=p.read_text()
source=Path('src/browser-native.js').read_text()
block='<!-- PB BROWSER NATIVE START -->\n<script>\n'+source.replace('</script','<\\/script')+'\n</script>\n<!-- PB BROWSER NATIVE END -->'
if '<!-- PB BROWSER NATIVE START -->' in html:html=re.sub(r'<!-- PB BROWSER NATIVE START -->[\s\S]*?<!-- PB BROWSER NATIVE END -->',lambda _:block,html)
else:html=html.replace('<!-- ALETHEIA SCRIPT -->',block+'\n<!-- ALETHEIA SCRIPT -->')
html=html.replace("if (window.aletheiaDesktop) signingIdentity = await aletheiaDesktop.identity();", "signingIdentity = window.aletheiaDesktop ? await aletheiaDesktop.identity() : await PBLocalIdentity.identity();")
identity_call="signingIdentity = window.aletheiaDesktop ? await aletheiaDesktop.identity() : await PBLocalIdentity.identity();"
key_call="if(!window.aletheiaDesktop&&!_currentKey)await PBLocalIdentity.useSigningKey();"
html=re.sub(re.escape(identity_call)+'(?:'+re.escape(key_call)+')*',lambda _:identity_call+key_call,html)
html=html.replace('if (signingIdentity && window.aletheiaDesktop) {','if (signingIdentity) {')
html=html.replace('event.attestation = await aletheiaDesktop.signEvent(canonicalJSON(event));','event.attestation = await (window.aletheiaDesktop ? aletheiaDesktop : PBLocalIdentity).signEvent(canonicalJSON(event));')
if 'id="panel-browser-files"' not in html:
 panels='''<div class="tab-panel" id="panel-browser-files">
 <div class="workspace-heading"><div><span class="eyebrow">LOCAL WORKSPACE</span><h2>File browser</h2><p>Open a folder, inspect its contents, and bring selected files into custody.</p></div><button class="btn btn-primary" onclick="PBBrowserFiles.choose()">Choose folder</button></div>
 <div class="card"><div class="btn-row"><button class="btn btn-secondary" onclick="PBBrowserFiles.parent()">Parent folder</button><button class="btn btn-secondary" onclick="PBBrowserFiles.render()">Refresh</button><button class="btn btn-primary" onclick="PBBrowserFiles.capture()">Prepare file receipts</button></div><h3 id="native-folder-name">No folder selected</h3><p id="native-folder-status" role="status">Choose a folder to access its files locally.</p><div id="native-folder-list" class="native-file-list"></div><input id="native-folder-input" type="file" webkitdirectory multiple hidden onchange="PBBrowserFiles.fallback(this)"></div>
</div>
<div class="tab-panel" id="panel-local-identity">
 <span class="eyebrow">IDENTITY &amp; CUSTODY</span><h2>Signing identity</h2><p>Your browser keeps a local Ed25519 key and signed identity record. The same identity signs custody events across reloads.</p>
 <div class="card"><h3>Local recorder</h3><p id="native-identity-summary" class="identity-fingerprint">Loading identity…</p><div class="btn-row"><button class="btn btn-primary" onclick="PBLocalIdentity.exportPublic()">Export public identity &amp; AI-BOM</button><button class="btn btn-secondary" onclick="PBLocalIdentity.refresh()">Check identity</button></div><p class="algo-note">The public export contains no private key. A recorder signature attributes this browser’s custody action; source authorship and operator endorsement are separate.</p></div>
</div>
'''
 html=html.replace('<div class="tab-panel" id="panel-seal">',panels+'\n<div class="tab-panel" id="panel-seal">')
 nav='''<button data-title="File browser" onclick="switchTab('browser-files',this);PBBrowserFiles.restore()"><span class="sb-ico">▤</span><span>Files</span></button>
    <button data-title="Signing identity" onclick="switchTab('local-identity',this);PBLocalIdentity.refresh()"><span class="sb-ico">◇</span><span>Identity</span></button>
    '''
 html=html.replace('<button class="active" data-title="Seal a file"',nav+'<button class="active" data-title="Seal a file"')
 html=html.replace("computerNavigation.dataset.title='This computer'", "computerNavigation.className='sb-adv-only';computerNavigation.dataset.title='Desktop files'")
if 'id="panel-native-encryption"' not in html:
 encryption='''<div class="tab-panel" id="panel-native-encryption">
 <span class="eyebrow">LOCAL ENCRYPTION</span><h2>Encrypt a file</h2><p>Encrypt for a recipient with ML-KEM and authenticated encryption. The downloaded receipt binds the encrypted bytes to your signing identity.</p>
 <div class="card"><div class="form-grid"><div><label class="label" for="native-kem">Key encapsulation</label><select id="native-kem"><option>ML-KEM-768</option><option>ML-KEM-512</option><option>ML-KEM-1024</option></select></div><div><label class="label" for="native-aead">Authenticated encryption</label><select id="native-aead"><option>ChaCha20-Poly1305</option><option>AES-256-GCM</option></select></div></div>
 <div class="btn-row" style="margin-top:20px"><button class="btn btn-primary" onclick="PBEncryption.createRecipient()">Create or load recipient key</button><button class="btn btn-secondary" onclick="PBEncryption.exportRecipient()">Export decryption key</button><label class="btn btn-secondary">Import decryption key<input type="file" hidden onchange="PBEncryption.importRecipient(this.files[0])"></label></div>
 <label class="label" for="native-recipient-public">Recipient public key</label><textarea id="native-recipient-public" rows="3" spellcheck="false" placeholder="Create a recipient key or paste its public key"></textarea>
 <div class="form-row" style="margin-top:20px"><label class="label" for="native-encrypt-file">File to encrypt</label><input id="native-encrypt-file" type="file"></div><div class="btn-row"><button class="btn btn-primary" onclick="PBEncryption.encryptFile()">Encrypt &amp; download receipt</button><label class="btn btn-secondary">Open encrypted receipt<input type="file" hidden accept=".json" onchange="PBEncryption.decryptFile(this.files[0])"></label></div>
 <p id="native-encryption-status" role="status">Files and keys are processed locally. Keep the recipient’s decryption key to reopen the file.</p></div>
 <details class="card"><summary>Implementation and scope</summary><p>This file workflow uses a single authenticated envelope and reads the selected file into memory. Large streaming archives use the separate PB-VAULT-1 implementation. JavaScript timing resistance and implementation-refinement proofs remain explicit obligations in the cryptographic evidence ledger.</p></details>
</div>
'''
 html=html.replace('<div class="tab-panel" id="panel-seal">',encryption+'\n<div class="tab-panel" id="panel-seal">')
 html=html.replace('<button data-title="Signing identity"','<button data-title="Encrypt files" onclick="switchTab(\'native-encryption\',this)"><span class="sb-ico">⌑</span><span>Encrypt</span></button>\n    <button data-title="Signing identity"')
if 'id="native-agent-id"' not in html:
 registration='''<div class="card"><h3>Register an agent session</h3><p>Create a distinct Ed25519 identity, signed AI-BOM, and state packet locally. Known model and provider fields can be supplied; unknown fields remain empty.</p><div class="form-row"><label class="label" for="native-agent-id">Agent identifier</label><input id="native-agent-id" type="text" maxlength="160"></div><div class="form-row"><label class="label" for="native-session-id">Session identifier</label><input id="native-session-id" type="text" maxlength="160"></div><div class="form-grid"><div><label class="label" for="native-agent-model">Model, if known</label><input id="native-agent-model" type="text"></div><div><label class="label" for="native-agent-provider">Provider, if known</label><input id="native-agent-provider" type="text"></div></div><button class="btn btn-primary" style="margin-top:20px" onclick="PBLocalIdentity.registerFromForm()">Register &amp; export public record</button><p id="native-agent-status" role="status" style="margin-top:16px">Keys stay in this browser. The exported record contains the public identity, AI-BOM, and state packet.</p></div>'''
 html=html.replace('<div class="tab-panel" id="panel-local-identity">','<div class="tab-panel" id="panel-local-identity">'+registration)
html=html.replace('ProofBundle custody · verifier relay · native RLM evidence','Files, cryptographic receipts, and verifiable history')
html=html.replace('tamper-proof seal','cryptographic receipt')
html=html.replace('const BRIDGE_STATE = { polling: !window.aletheiaDesktop,', 'const BRIDGE_STATE = { polling: false,')
html=html.replace("if (!window.aletheiaDesktop && !roomRequested) {", "if (!window.aletheiaDesktop && new URLSearchParams(location.search).get('tab') === 'bridge') {")
html=html.replace('<button id="bridge-poll-btn"', '<button id="bridge-poll-btn"')
html=html.replace('id="bridge-poll-btn" onclick="toggleBridgePolling()">Pause', 'id="bridge-poll-btn" onclick="toggleBridgePolling()">Resume')

html=html.replace("document.querySelector('[data-title=\"ProofBundle workbench\"]').click();", "document.querySelector('[data-title=\"Seal a file\"]').click();")
html=html.replace('<button data-title="ProofBundle workbench"','<button class="sb-adv-only" data-title="ProofBundle workbench"')
for title in ('Conversations','Bridge','Multi-agent orchestration'):
 html=html.replace('<button data-title="'+title+'"','<button class="sb-adv-only" data-title="'+title+'"')
html=html.replace('Native registry · conformance archive · custody','Local files · signed receipts')
html=html.replace('or click to choose — any file type, any size, sealed on your device','or click to choose files — processed on your device')
html=html.replace("batch: files.length > 1 ? { count: files.length } : undefined", "...(files.length > 1 ? {batch:{count:files.length}} : {})")
html=html.replace("if (!_currentKey || _currentKey.alg !== 'Ed25519') _currentKey = await sigKeygen('Ed25519');", "if (!_currentKey || _currentKey.alg !== 'Ed25519') { if(window.aletheiaDesktop)_currentKey=await sigKeygen('Ed25519');else await PBLocalIdentity.useSigningKey(); }")
html=html.replace("heroSeal(e.target.files); e.target.value = '';", "heroSeal(Array.from(e.target.files)); e.target.value = '';")
html=html.replace("heroSeal = async list => {\n    await libraryImport(Array.from(list || []));\n    return original.heroSeal(list);", "heroSeal = async list => {\n    const files=Array.from(list || []);\n    await libraryImport(files);\n    return original.heroSeal(files);")
html=html.replace('Custody hashes recorded; no local signing identity in this browser mode.','Local signing identity unavailable; see identity status.')
# Inline ledger: available in the downloaded standalone app, without a fetch.
basis=Path('CRYPTOGRAPHIC_BASIS.json').read_text()
evidence_block='<!-- PB BASIS START -->\n<script type="application/json" id="native-crypto-basis">'+basis.replace('</','<\\/')+'</script>\n<!-- PB BASIS END -->'
if '<!-- PB BASIS START -->' in html:html=re.sub(r'<!-- PB BASIS START -->[\s\S]*?<!-- PB BASIS END -->',lambda _:evidence_block,html)
else:html=html.replace('<!-- ALETHEIA SCRIPT -->',evidence_block+'\n<!-- ALETHEIA SCRIPT -->')
if 'id="panel-native-basis"' not in html:
 panel='<div class="tab-panel" id="panel-native-basis"><span class="eyebrow">SOURCE, TESTS &amp; PROOFS</span><h2>Cryptographic basis</h2><p>Inspect each implementation, its normative source, measured evidence, and remaining proof obligations.</p><div class="card"><p><strong>855 NIST published sample cases pass.</strong> This is sample-vector conformance, not CAVP validation or FIPS module certification.</p><p>Eight abstract Lean interface/model theorems were audited without axiom dependencies. JavaScript implementation refinement and timing resistance remain open.</p></div><div id="native-basis-profiles"></div></div>'
 html=html.replace('<div class="tab-panel" id="panel-seal">',panel+'\n<div class="tab-panel" id="panel-seal">')
 html=html.replace('<button data-title="History"','<button data-title="Cryptographic basis" onclick="switchTab(\'native-basis\',this);PBNativeBasis.render()"><span class="sb-ico">◈</span><span>Evidence</span></button>\n    <button data-title="History"')
style='''
/* PB WORKSPACE DESIGN */
:root { --font-ui:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; --radius:12px; --radius-sm:7px; }
[data-theme="light"] { --bg0:#f6f8fc;--bg1:#ffffff;--bg2:#edf2f8;--bg3:#e5ecf5;--border:#dce4ef;--border2:#bac9dd;--text0:#16243b;--text1:#506079;--text2:#65758c;--blue:#285fe5;--blue2:#1f50c8;--cyan:#285fe5; }
[data-theme="light"] body { background:var(--bg0); }
[data-theme="light"] #sidebar,[data-theme="light"] .topbar { background:#fff; }
[data-theme="light"] input[type=text],[data-theme="light"] input[type=number],[data-theme="light"] textarea { background:#fff;color:var(--text0); }
[data-theme="light"] .notice { background:#eef3fc;border-color:#dce4ef;color:var(--text1);border-left:0;border-radius:9px; }
[data-theme="light"] .btn-primary { background:#285fe5;color:white; }
.sb-brand::before { display:none; }.sb-brand { padding:24px 22px; }.logo { font-size:18px; }.version-badge { font-size:10px; }
#sidebar { width:230px; }.sb-nav { padding:14px 12px; }.sb-nav button { padding:12px 14px;margin-bottom:4px;line-height:1.3; }.sb-nav button.active { box-shadow:none;background:var(--bg2);color:var(--blue); }
.topbar { height:70px;padding:0 36px; }.topbar-title { font-size:16px; }.topbar-meta { font-size:11px; }.tab-panel { max-width:1280px;padding:38px 40px; }
h2 { font-size:30px;font-weight:650;letter-spacing:-.03em;line-height:1.2; }p { line-height:1.7; }
.btn { min-height:40px;padding:10px 16px; }.btn-secondary { color:var(--text0); }.card { padding:24px;box-shadow:0 2px 8px #16243b03; }
.eyebrow { display:block;font:600 10px/1.5 var(--font-mono);letter-spacing:.14em;color:var(--text2);margin-bottom:10px; }
.workspace-heading { display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px; }.workspace-heading p { margin-bottom:0; }
.identity-fingerprint { font:12px/1.8 var(--font-mono);overflow-wrap:anywhere; }
.native-file-list { display:grid; }.native-file-row { display:flex;justify-content:space-between;gap:20px;align-items:center;background:transparent;color:var(--text0);font:14px var(--font-ui);padding:15px 8px;border:0;border-bottom:1px solid var(--border);text-align:left;cursor:pointer; }.native-file-row span:first-child { overflow-wrap:anywhere; }.native-file-row span:last-child { color:var(--text2);font-size:12px; }.native-file-row:hover { background:var(--bg2); }
button:focus-visible,a:focus-visible,summary:focus-visible { outline:3px solid var(--blue);outline-offset:3px; }
.aletheia-stats { gap:12px;margin:24px 0; }.aletheia-stat { padding:20px;border-radius:10px;background:var(--bg1); }.aletheia-stat strong { font-size:24px; }
.aletheia-layer-actions { margin:20px 0; }.aletheia-workspace { gap:28px; }.aletheia-table-wrap { border:1px solid var(--border);border-radius:9px; }
#proofbundle-computer { display:none; }.notice:has(#aletheia-entry-path) { display:none; }
body.has-native-desktop #proofbundle-computer { display:block; }
@media(max-width:800px){#sidebar{width:190px}.tab-panel{padding:28px 24px}.topbar{padding:0 24px}.topbar-meta{display:none}.workspace-heading{align-items:flex-start;flex-direction:column}}
@media(max-width:560px){#sidebar{width:60px}.sb-brand{padding:20px 10px}.sb-nav{padding:10px 5px}.sb-nav button{padding:12px 8px}.tab-panel{padding:24px 16px}.topbar{padding:0 16px}h2{font-size:26px}}
'''
if '/* PB WORKSPACE DESIGN */' not in html:html=html.replace('</style>','\n'+style+'\n</style>',1)
# Apply corrected rules when rerunning this build script against prior output.
html=html.replace('#proofbundle-live-filesystem { display:none; }#aletheia-entry-path { display:none; }','#proofbundle-computer { display:none; }.notice:has(#aletheia-entry-path) { display:none; }body.has-native-desktop #proofbundle-computer { display:block; }')
p.write_text(html)
print('Embedded offline identity, file browser, encryption API and workspace styling.')
