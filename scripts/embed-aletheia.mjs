#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
// Keep the editable UI sources and the offline, single-file client synchronized.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'proofbundle.html');
let html = readFileSync(file, 'utf8');
for (const kind of ['CSS', 'PANEL', 'SCRIPT'])
  html = html.replace(new RegExp(`\\n?<!-- ALETHEIA ${kind} -->[\\s\\S]*?<!-- END ALETHEIA ${kind} -->\\n?`, 'g'), '\n');
html = html.replace(/\n?\s*<button[^>]*data-title="(?:Aletheia|ProofBundle) workbench"[\s\S]*?<\/button>/g, '');
const wrap = (kind, value) => `\n<!-- ALETHEIA ${kind} -->\n${value}\n<!-- END ALETHEIA ${kind} -->\n`;
const css = readFileSync(join(root, 'ui/aletheia.css'), 'utf8');
const panel = readFileSync(join(root, 'ui/aletheia-panel.html'), 'utf8');
const script = readFileSync(join(root, 'ui/aletheia.js'), 'utf8');
if (script.includes('</script>')) throw new Error('Embedded source contains an unsafe script terminator');
const styleEnd = html.indexOf('</style>');
html = html.slice(0, styleEnd) + '</style>' + wrap('CSS', '<style>\n' + css + '</style>') + html.slice(styleEnd + 8);
html = html.replace('<nav class="sb-nav" id="tabs">', '<nav class="sb-nav" id="tabs">\n    <button data-title="ProofBundle workbench" onclick="switchTab(\'aletheia\',this);Aletheia.refresh()"><span class="sb-ico">◉</span><span>ProofBundle</span></button>');
html = html.replace('<main>', '<main>' + wrap('PANEL', panel));
// Initialize the original application only after its Library constants exist.
// Legacy-state rendering must not strand those declarations in their TDZ.
html = html.replaceAll('\ninit();\n', '\n');
const coreEnd = html.lastIndexOf('</script>');
html = html.slice(0, coreEnd) + '\ninit();\n' + html.slice(coreEnd);
const end = html.lastIndexOf('</body>');
html = html.slice(0, end) + wrap('SCRIPT', '<script>\n' + script + '\n</script>') + html.slice(end);
html = html.replace('<title>ProofBundle — Provenance & Compliance Verification</title>', '<title>ProofBundle · archive workbench</title>');
// Neutral naming for newly generated artifact metadata. Cryptographic domains,
// original signed source envelopes, and preserved historical bytes are unchanged.
html = html.replaceAll('gpx_content_address', 'content_address')
  .replace('const gpx = PBKECCAK.sha3_384.create();', 'const addressHasher = PBKECCAK.sha3_384.create();')
  .replaceAll('gpx.update(', 'addressHasher.update(').replaceAll('gpx.digest()', 'addressHasher.digest()');
html = html.replaceAll("'gpx-dual-seal'", "'dual-signature-seal'");
html = html.replace('<div class="topbar-meta">Registry 95 · client operations 19</div>', '<div class="topbar-meta">Native registry · conformance archive · custody</div>');
html = html.replaceAll('`self-test ${pass}/${R.length}', '`Legacy boot ${pass}/${R.length}');
html = html.replace('setInterval(refreshAgentLineage, 5000);', 'if (!window.aletheiaDesktop) setInterval(refreshAgentLineage, 5000);');
html = html.replace('polling: true, timer: null', 'polling: !window.aletheiaDesktop, timer: null');
html = html.replace('  refreshAgentLineage();\n  if (!window.aletheiaDesktop)', '  if (!window.aletheiaDesktop) refreshAgentLineage();\n  if (!window.aletheiaDesktop)');
html = html.replace('  initBridgeConsole();\n}', '  if (!window.aletheiaDesktop) initBridgeConsole(); else restoreBridgeConfig();\n}');
html = html.replace("${esc(x.mime)} \u00b7 ${esc(x.imported_at)}</div>", "${esc(x.mime)} \u00b7 ${esc(x.imported_at)}</div><div class=\"algo-note mono\" style=\"overflow-wrap:anywhere\">${esc(x.source_ref?.path || x.source_path || \"Original filesystem path unavailable\")}</div>");
html = html.replaceAll('Aletheia · ProofBundle custody workbench', 'ProofBundle · archive workbench').replaceAll('conformance corpus', 'conformance archive');
html = html.replaceAll('`Legacy boot ${pass}/${R.length}', '`Boot checks: ${pass} passed, ${R.length - pass} failed');
html = html.replace('<div class="tab-panel" id="panel-vectors">', '<div class="tab-panel" id="panel-vectors">'+(html.includes('id="proofbundle-vector-current"')?'':'<section id="proofbundle-vector-current" class="notice"></section>'));
html=html.replace('id="ledger-import-file" accept=".json,application/json"','id="ledger-import-file" accept=".json,.zip,application/json,application/zip"');
html=html.replace(/(<!-- END ALETHEIA CSS -->)\s+(<script>)/,'$1\n\n$2');
writeFileSync(file, html);
console.log('Aletheia sources embedded in proofbundle.html');
