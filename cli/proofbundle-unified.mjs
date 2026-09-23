#!/usr/bin/env node
/* ProofBundle Unified CLI — extends the existing engine CLI with two new
   subcommands that were not present before:

     console   — interactive REPL that drops into the engine (its own console)
     itinerary — emit HTML derived from a signed action-set envelope

   It RE-USES the engine path resolution, JSDOM bootstrap, and sealCore /
   verifyCore / digestBytes / sigKeygen calls that the existing
   cli/proofbundle-cli.mjs already wires. There is no engine reimplementation
   here — anything that runs in the browser runs here, byte-for-byte.

   The other commands (selftest, seal, verify, keygen, bridge-watch) are
   delegated to the existing CLI by re-invoking it as a child process.
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as readline from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = process.env.PROOFBUNDLE_ENGINE
  || (existsSync(join(__dirname, '..', 'proofbundle.html')) && join(__dirname, '..', 'proofbundle.html'))
  || join(__dirname, '..', 'pwa', 'proofbundle.html');
const DELEGATE = process.env.PROOFBUNDLE_DELEGATE
  || join(__dirname, 'proofbundle-cli.mjs');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { args[key] = true; }
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function delegate(sub, rest) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DELEGATE, sub, ...rest], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve(0) : reject(new Error(`delegate ${sub} exited ${code}`))));
    child.on('error', reject);
  });
}

/* ─────────────────────────── CONSOLE (REPL) ───────────────────────────── */

async function bootEngineForConsole() {
  const { JSDOM, VirtualConsole } = await import('jsdom');
  const { webcrypto } = await import('node:crypto');
  const html = readFileSync(ENGINE_PATH, 'utf-8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/canvas|clearRect/i.test(e.message)) console.error('[engine]', e.message); });
  const dom = new JSDOM(html, {
    url: 'https://localhost/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(window) {
      const PageU8 = window.Uint8Array;
      const ne = new TextEncoder(), nd = new TextDecoder();
      if (!window.TextEncoder) window.TextEncoder = class { encode(s) { const b = ne.encode(s); const o = new PageU8(b.length); o.set(b); return o; } };
      if (!window.TextDecoder) window.TextDecoder = class { decode(b) { return nd.decode(b); } };
      const grv = (a) => { const t = new Uint8Array(a.length); webcrypto.getRandomValues(t); a.set(t); return a; };
      try { Object.defineProperty(window, 'crypto', { configurable: true, value: { getRandomValues: grv, subtle: webcrypto.subtle, randomUUID: () => webcrypto.randomUUID() } }); } catch {}
      if (!window.matchMedia) window.matchMedia = () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent() { return false; } });
      window.HTMLCanvasElement.prototype.getContext = () => null;
      if (!window.CryptoKey) window.CryptoKey = globalThis.CryptoKey;
    },
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  let st = null;
  for (let i = 0; i < 120 && !(st = dom.window.PB_SELFTEST); i++) await new Promise((r) => setTimeout(r, 250));
  return { win: dom.window, selfTests: st };
}

const CONSOLE_HELP = `ProofBundle console — every command runs the SAME engine that ships
in proofbundle.html. There is no separate codebase; what runs here is
exactly what runs in the browser.

Available commands (case-insensitive):
  help                                 show this help
  selftest                             re-run the engine self-tests
  algs                                 list available digest + signature algorithms
  keygen <algorithm>                    generate a key (use "algs" for IDs)
  digest <alg> <text-or-file>          SHA/SHAKE/BLAKE the input, print hex
  seal <input.json> [--digest D] [--sig S] [--out sealed.json] [--key k.json]
  verify <bundle.json> [--context ctx.json]
  load <file.json>                     pretty-print a bundle
  echo <text>                          echo (for testing the pipe)
  quit | exit                          leave the console
`;

async function cmdConsole(args) {
  const noTty = !!args['no-tty'];
  if (!process.stdin.isTTY && !noTty) {
    console.error('[console] stdin is not a TTY — running once with piped input instead.');
  }
  console.log(`[console] booting engine from ${ENGINE_PATH}`);
  const { win, selfTests } = await bootEngineForConsole();
  if (selfTests) {
    const pass = selfTests.filter((r) => r.ok).length;
    console.log(`[console] engine self-tests: ${pass}/${selfTests.length} pass`);
  } else {
    console.log('[console] engine self-tests not yet ready (continuing anyway)');
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !noTty });
  const prompt = 'proofbundle> ';
  const ask = () => new Promise((resolve) => rl.question(prompt, resolve));
  console.log(CONSOLE_HELP);
  if (noTty || !process.stdin.isTTY) {
    const drained = [];
    for await (const chunk of rl) drained.push(chunk);
    for (const ln of drained.join('\n').split('\n')) {
      const out = await evalConsoleLine(ln.trim(), win);
      if (out === '__QUIT__') break;
      if (out) console.log(out);
    }
    rl.close();
    win.close();
    return 0;
  }
  for (;;) {
    const line = (await ask()).trim();
    if (!line) continue;
    const out = await evalConsoleLine(line, win);
    if (out === '__QUIT__') { rl.close(); win.close(); return 0; }
    if (out !== '') console.log(out);
  }
}

async function evalConsoleLine(line, win) {
  if (!line) return '';
  const [cmd, ...rest] = line.split(/\s+/);
  const sub = cmd.toLowerCase();
  if (sub === 'quit' || sub === 'exit') return '__QUIT__';
  try {
    switch (sub) {
      case 'help': return CONSOLE_HELP;
      case 'echo': return rest.join(' ');
      case 'selftest': {
        const r = await win.PB_SELFTEST || [];
        const pass = r.filter((x) => x.ok).length;
        return `self-tests: ${pass}/${r.length} pass` + (pass === r.length ? '' : '\n' + r.filter((x) => !x.ok).map((x) => `  FAIL: ${x.name}`).join('\n'));
      }
      case 'algs': {
        const out = await win.eval('JSON.stringify({ digests: PB_DIGESTS.map(d => d.id), sigs: PB_SIGS.map(s => s.id) })');
        return JSON.stringify(JSON.parse(out), null, 2);
      }
      case 'keygen': {
        const alg = rest[0] || 'Ed25519';
        const key = await win.eval(`sigKeygen(${JSON.stringify(alg)})`);
        return JSON.stringify(key, null, 2);
      }
      case 'digest': {
        const alg = rest[0];
        let target = rest.slice(1).join(' ');
        if (!alg) return 'usage: digest <alg> <text-or-file>';
        if (target && existsSync(target)) target = readFileSync(target, 'utf-8');
        const out = await win.eval(`digestBytes(${JSON.stringify(alg)}, new TextEncoder().encode(${JSON.stringify(target || '')})).then(b => Array.from(b).map(x => x.toString(16).padStart(2,'0')).join(''))`);
        return `${alg}(${target.length} bytes) = ${out}`;
      }
      case 'seal': {
        const inputPath = rest[0];
        if (!inputPath) return 'usage: seal <input.json> [--digest D] [--sig S] [--out sealed.json] [--key k.json]';
        const parsed = parseArgs(rest.slice(1));
        const digestAlg = parsed.digest || 'SHA-256';
        const sigAlg = parsed.sig || 'Ed25519';
        if (!existsSync(inputPath)) return `error: ${inputPath} not found`;
        const bundle = JSON.parse(readFileSync(inputPath, 'utf-8'));
        bundle.hdr = bundle.hdr || {};
        if (!bundle.hdr.profile) bundle.hdr.profile = 'PB-INTEGRITY-1';
        let key;
        if (parsed.key && existsSync(parsed.key)) key = JSON.parse(readFileSync(parsed.key, 'utf-8'));
        else {
          key = await win.eval(`sigKeygen(${JSON.stringify(sigAlg)})`);
          writeFileSync('proofbundle-key.json', JSON.stringify(key, null, 2));
        }
        win.__PB_BUNDLE__ = bundle; win.__PB_KEY__ = key;
        const sealed = await win.eval(`sealCore(window.__PB_BUNDLE__, ${JSON.stringify(digestAlg)}, ${JSON.stringify(sigAlg)}, window.__PB_KEY__)`);
        const outJson = JSON.stringify(sealed, null, 2);
        if (parsed.out) { writeFileSync(parsed.out, outJson); return `sealed → ${parsed.out}`; }
        return outJson;
      }
      case 'verify': {
        const bundlePath = rest[0];
        if (!bundlePath) return 'usage: verify <bundle.json> [--context ctx.json]';
        const parsed = parseArgs(rest.slice(1));
        if (!existsSync(bundlePath)) return `error: ${bundlePath} not found`;
        const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
        const ctx = parsed.context && existsSync(parsed.context) ? JSON.parse(readFileSync(parsed.context, 'utf-8')) : {};
        win.__PB_BUNDLE__ = bundle; win.__PB_CTX__ = ctx;
        const out = await win.eval(`verifyCore(window.__PB_BUNDLE__, { context: window.__PB_CTX__ })`);
        return JSON.stringify(out, null, 2);
      }
      case 'load': {
        if (!rest[0]) return 'usage: load <file.json>';
        if (!existsSync(rest[0])) return `error: ${rest[0]} not found`;
        return JSON.stringify(JSON.parse(readFileSync(rest[0], 'utf-8')), null, 2);
      }
      default:
        return `unknown command: ${cmd} (try 'help')`;
    }
  } catch (e) {
    return `error: ${e.message}`;
  }
}

/* ─────────────────────────── ITINERARY ─────────────────────────────────── */

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function buildItinerary(args) {
  const actionsPath = args.actions || args.input;
  if (!actionsPath) {
    console.error('usage: proofbundle itinerary --actions actions.jsonl [--out itinerary.html] [--title "..."]');
    process.exit(2);
  }
  if (!existsSync(actionsPath)) {
    console.error(`error: ${actionsPath} not found`);
    process.exit(2);
  }
  const title = args.title || 'ProofBundle session itinerary';
  const out = args.out || 'proofbundle-itinerary.html';
  const text = readFileSync(actionsPath, 'utf-8');
  let actions;
  if (actionsPath.endsWith('.jsonl')) {
    actions = text.split('\n').filter(Boolean).map((l, i) => {
      try { return JSON.parse(l); } catch (e) { throw new Error(`bad JSONL on line ${i + 1}: ${e.message}`); }
    });
  } else {
    actions = JSON.parse(text);
  }
  if (!Array.isArray(actions)) throw new Error('actions input must be an array or JSONL');

  const { win } = await bootEngineForConsole();
  const key = await win.eval('sigKeygen("Ed25519")');
  const builtAt = new Date().toISOString();
  const enriched = [];
  for (const a of actions) {
    const ts = a.ts || builtAt;
    const summary = a.summary || a.command || a.kind || 'action';
    const record = { ...a, ts, summary };
    win.__PB_ACTION__ = record;
    const fp = await win.eval('digestBytes("SHA3-384", utf8(canonicalJSON(window.__PB_ACTION__))).then(hexOf)');
    enriched.push({ ...record, sha3_384: fp });
  }
  const env = {
    schema: 'PB-ARTIFACT-1',
    spec_ver: '2.1.0',
    hdr: { profile: 'PB-INTEGRITY-1', bundle_id: `itinerary-${builtAt.replace(/[^0-9]/g, '')}` },
    meta: {
      subject: title,
      issued_at: builtAt,
      kind: 'itinerary',
      action_digest_alg: 'SHA3-384',
      action_digest_encoding: 'PB-CANON-JSON-1',
      action_digest_scope: 'normalized action object excluding sha3_384',
    },
    payload: { kind: 'itinerary', title, actions: enriched },
  };
  env.hdr.profile = 'PB-INTEGRITY-1';
  win.__PB_ENV__ = env; win.__PB_KEY__ = key;
  const sealed = await win.eval('sealCore(window.__PB_ENV__, "SHA3-384", "Ed25519", window.__PB_KEY__)');
  win.__PB_SEALED__ = sealed;
  const verification = await win.eval('verifyCore(window.__PB_SEALED__, {})');
  if (verification.outcome !== 'VERIFIED') {
    throw new Error(`generated itinerary envelope did not verify: ${verification.outcome}`);
  }

  const envJson = JSON.stringify(sealed, null, 2);
  const rows = enriched.map((a, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="ts">${escapeHtml(a.ts)}</td>
      <td class="kind">${escapeHtml(a.kind || '')}</td>
      <td class="summary">${escapeHtml(a.summary)}</td>
      <td class="cmd"><pre>${escapeHtml(a.command || '')}</pre></td>
      <td class="fp mono">${escapeHtml(a.sha3_384.slice(0, 32))}…</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { --bg:#0d1117; --bg2:#161b22; --bg3:#1c2330; --border:#2a3341; --text:#e6edf3; --text2:#9aa7b8; --blue:#4d8eff; --green:#3fb950; --red:#f85149; --mono:'JetBrains Mono','SF Mono',Consolas,monospace; --ui:Inter,'SF Pro Display',system-ui,sans-serif; }
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--ui);background:var(--bg);color:var(--text);padding:32px;line-height:1.45}
h1{font-size:22px;margin-bottom:8px}
h2{font-size:16px;margin:24px 0 8px;color:var(--text2);font-weight:600}
.meta{color:var(--text2);font-size:13px;margin-bottom:24px;font-family:var(--mono)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:8px 10px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
th{background:var(--bg2);font-weight:600;color:var(--text2);position:sticky;top:0}
tr:hover td{background:var(--bg3)}
.num{color:var(--text2);width:32px}
.ts{font-family:var(--mono);white-space:nowrap;color:var(--text2);width:200px}
.kind{font-family:var(--mono);color:var(--blue);width:120px}
.summary{font-weight:500}
.cmd pre{margin:0;font-family:var(--mono);font-size:12px;color:var(--text);white-space:pre-wrap;word-break:break-all;max-width:520px;overflow:hidden}
.fp{color:var(--green);font-size:12px;width:280px}
details{margin-top:24px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:12px 16px}
details summary{cursor:pointer;font-weight:600;color:var(--text2)}
details pre{margin-top:12px;font-family:var(--mono);font-size:12px;max-height:480px;overflow:auto;background:var(--bg);padding:12px;border-radius:4px;border:1px solid var(--border)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-family:var(--mono);background:var(--bg3);color:var(--green);border:1px solid var(--green)}
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">
  Built ${escapeHtml(builtAt)} ·
  Engine <span class="badge">${escapeHtml(ENGINE_PATH.split('/').pop())}</span> ·
  ${enriched.length} action${enriched.length === 1 ? '' : 's'} ·
  Embedded payload <span class="badge">VERIFIED</span> as PB-ARTIFACT-1,
  profile <span class="badge">PB-INTEGRITY-1</span>, SHA3-384 + Ed25519
</div>
<table>
<thead><tr><th>#</th><th>Timestamp</th><th>Kind</th><th>Summary</th><th>Command / record</th><th>Record SHA3-384 (32 hex)</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<details>
  <summary>Signed embedded payload (PB-ARTIFACT-1) — verify with a ProofBundle verifier</summary>
  <pre>${escapeHtml(envJson)}</pre>
</details>
<p class="meta" id="render-check" style="margin-top:12px">Checking rendered rows against the embedded payload…</p>
<script>
// Presentation consistency check only: compare every rendered value with the
// signed payload embedded below the table. Cryptographic verification remains
// the verifier's job; this script and the surrounding HTML are not themselves
// covered by the embedded signature.
const env = JSON.parse(document.querySelector('details pre').textContent);
let mismatches = 0;
document.querySelectorAll('tbody tr').forEach((tr, i) => {
  const action = env.payload.actions[i];
  const cells = tr.querySelectorAll('td');
  const expected = action && [
    String(i + 1), action.ts || '', action.kind || '', action.summary || '',
    action.command || '', (action.sha3_384 || '').slice(0, 32) + '…'
  ];
  const matches = expected && expected.every((value, j) => cells[j] && cells[j].textContent === value);
  if (!matches) {
    mismatches++;
    tr.style.background = 'rgba(248,81,73,.12)';
    const fp = tr.querySelector('.fp');
    if (fp) fp.style.color = 'var(--red)';
  }
});
if (env.payload.actions.length !== document.querySelectorAll('tbody tr').length) mismatches++;
const status = document.getElementById('render-check');
status.textContent = mismatches
  ? 'Rendered-table mismatch: ' + mismatches + ' inconsistency(s). Use the signed embedded payload.'
  : 'Rendered rows match the embedded payload. Cryptographic status: verify the payload with ProofBundle.';
status.style.color = mismatches ? 'var(--red)' : 'var(--green)';
</script>
</body>
</html>`;

  const envelopeOut = args['envelope-out'] || (out.toLowerCase().endsWith('.html')
    ? out.slice(0, -5) + '.envelope.json'
    : out + '.envelope.json');
  writeFileSync(out, html);
  writeFileSync(envelopeOut, envJson + '\n');
  console.log(`[itinerary] wrote ${out}`);
  console.log(`[itinerary] wrote ${envelopeOut}`);
  console.log(`[itinerary] actions: ${enriched.length}`);
  console.log(`[itinerary] bundle_id: ${sealed.hdr.bundle_id}`);
  console.log(`[itinerary] verification: ${verification.outcome}`);
  console.log(`[itinerary] sealed envelope signature_b64u: ${sealed.seal.signature_b64u}`);
  win.close();
  return 0;
}

/* ─────────────────────────── MAIN ─────────────────────────────────────── */

function usage() {
  console.log(`ProofBundle Unified CLI

Usage:
  proofbundle selftest
  proofbundle keygen --sig Ed25519 [--out keyfile.json]
  proofbundle seal <input.json> --digest SHA-256 --sig Ed25519 [--key keyfile.json] [--out sealed.json]
  proofbundle verify <bundle.json> [--context ctx.json]
  proofbundle bridge-watch [--from SEQ] [--agent ID] [--json]
  proofbundle console [--no-tty]      # interactive REPL; runs the engine
  proofbundle itinerary --actions actions.jsonl [--out itinerary.html] [--envelope-out itinerary.envelope.json] [--title "..."]

All subcommands run the SAME engine that ships in proofbundle.html.
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const [cmd, ...rest] = argv;
  const args = parseArgs(rest);
  if (!cmd || cmd === '--help' || cmd === '-h') { usage(); process.exit(0); }
  switch (cmd) {
    case 'console': return cmdConsole(args);
    case 'itinerary': return buildItinerary(args);
    case 'selftest':
    case 'seal':
    case 'verify':
    case 'keygen':
    case 'bridge-watch':
      return delegate(cmd, rest);
    default:
      usage();
      process.exit(2);
  }
}

main().catch((e) => { console.error(e.stack || e); process.exit(1); });
