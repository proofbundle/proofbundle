#!/usr/bin/env node
/* ProofBundle CLI — runs the exact same engine that ships in the browser,
   headlessly, via jsdom + Node's native WebCrypto. No reimplementation,
   no drift: this calls the same sealCore/verifyCore/runSelfTests functions
   that the HTML page calls, so CLI-sealed and browser-sealed bundles are
   byte-for-byte interchangeable.

   Usage:
     proofbundle selftest
     proofbundle seal <input.json> --digest SHA-256 --sig Ed25519 [--key keyfile.json] [--out sealed.json]
     proofbundle verify <bundle.json> [--context ctx.json]
     proofbundle keygen --sig Ed25519 [--out keyfile.json]
*/
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = process.env.PROOFBUNDLE_ENGINE || join(__dirname, '..', 'pwa', 'proofbundle.html');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { args[a.slice(2)] = argv[i + 1]; i++; }
    else args._.push(a);
  }
  return args;
}

async function bootEngine() {
  if (!existsSync(ENGINE_PATH)) {
    console.error(`Engine file not found: ${ENGINE_PATH}`);
    console.error(`Set PROOFBUNDLE_ENGINE=/path/to/proofbundle.html or run from the repo root.`);
    process.exit(2);
  }
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
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  return dom.window;
}

async function cmdSelftest() {
  const win = await bootEngine();
  let st = null;
  for (let i = 0; i < 120 && !(st = win.PB_SELFTEST); i++) await new Promise((r) => setTimeout(r, 250));
  if (!st) { console.error('FAIL: self-tests never completed'); process.exit(1); }
  const pass = st.filter((r) => r.ok).length;
  console.log(`self-test: ${pass}/${st.length} pass`);
  for (const r of st.filter((r) => !r.ok)) console.log(`  FAIL: ${r.name} ${r.note || ''}`);
  process.exit(pass === st.length ? 0 : 1);
}

async function cmdKeygen(args) {
  const sigAlg = args.sig || 'Ed25519';
  const win = await bootEngine();
  const key = await win.eval(`sigKeygen(${JSON.stringify(sigAlg)})`);
  const out = JSON.stringify(key, null, 2);
  if (args.out) { writeFileSync(args.out, out); console.log(`Key written to ${args.out}`); }
  else console.log(out);
}

async function cmdSeal(args) {
  const inputPath = args._[0];
  if (!inputPath) { console.error('usage: proofbundle seal <input.json> --digest SHA-256 --sig Ed25519 [--key keyfile.json] [--out sealed.json]'); process.exit(2); }
  const digestAlg = args.digest || 'SHA-256';
  const sigAlg = args.sig || 'Ed25519';
  const bundleJson = readFileSync(inputPath, 'utf-8');
  const win = await bootEngine();

  let key;
  if (args.key && existsSync(args.key)) {
    key = JSON.parse(readFileSync(args.key, 'utf-8'));
  } else {
    key = await win.eval(`sigKeygen(${JSON.stringify(sigAlg)})`);
    const keyOut = args.key || 'proofbundle-key.json';
    writeFileSync(keyOut, JSON.stringify(key, null, 2));
    console.error(`No key supplied — generated new ${sigAlg} keypair, saved to ${keyOut}`);
  }

  win.__PB_CLI_BUNDLE__ = JSON.parse(bundleJson);
  win.__PB_CLI_KEY__ = key;
  const sealed = await win.eval(`sealCore(window.__PB_CLI_BUNDLE__, ${JSON.stringify(digestAlg)}, ${JSON.stringify(sigAlg)}, window.__PB_CLI_KEY__)`);
  const out = JSON.stringify(sealed, null, 2);
  if (args.out) { writeFileSync(args.out, out); console.log(`Sealed bundle written to ${args.out}`); }
  else console.log(out);
}

async function cmdVerify(args) {
  const bundlePath = args._[0];
  if (!bundlePath) { console.error('usage: proofbundle verify <bundle.json> [--context ctx.json]'); process.exit(2); }
  const bundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
  const context = args.context && existsSync(args.context) ? JSON.parse(readFileSync(args.context, 'utf-8')) : {};
  const win = await bootEngine();
  win.__PB_CLI_BUNDLE__ = bundle;
  win.__PB_CLI_CTX__ = context;
  const result = await win.eval(`verifyCore(window.__PB_CLI_BUNDLE__, { context: window.__PB_CLI_CTX__ })`);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.outcome === 'VERIFIED' ? 0 : 1);
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);
  switch (cmd) {
    case 'selftest': return cmdSelftest();
    case 'seal': return cmdSeal(args);
    case 'verify': return cmdVerify(args);
    case 'keygen': return cmdKeygen(args);
    default:
      console.log(`ProofBundle CLI

Usage:
  proofbundle selftest
  proofbundle keygen --sig Ed25519 [--out keyfile.json]
  proofbundle seal <input.json> --digest SHA-256 --sig Ed25519 [--key keyfile.json] [--out sealed.json]
  proofbundle verify <bundle.json> [--context ctx.json]`);
      process.exit(cmd ? 2 : 0);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
