#!/usr/bin/env node
// web-browser.mjs — universal browser access for all agent lanes, ProofBundle-sealed.
// Additive to web-bridge.mjs (owned separately); composes via /seal — never duplicates
// sealing. Tool, not law. 127.0.0.1 only. Zero deps. Single-flight chrome (capacity gate).
// Storage: /media/falsealias/WIN-NVME-500G/browser-bridge/ (root disk is 98% full).
import http from 'node:http';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';

const PORT = Number(process.env.PB_BROWSER_PORT || 8792);
const BRIDGE = process.env.PB_WEB_BRIDGE || 'http://127.0.0.1:8791';
const CHROME = '/opt/google/chrome/chrome';
const ROOT = process.env.PB_BROWSER_ROOT || path.join(homedir(), 'pb/live/browser-bridge');
const SHOTS = path.join(ROOT, 'shots');
const PROFILE = path.join(ROOT, 'profile');
for (const d of [ROOT, SHOTS, PROFILE]) fs.mkdirSync(d, { recursive: true });

const log = (...a) => console.log(new Date().toISOString(), ...a);

// single-flight queue: at most one chrome at a time (capacity gate: 2 heavy workers)
let chain = Promise.resolve();
const enqueue = (fn) => { const p = chain.then(fn); chain = p.catch(() => {}); return p; };

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

async function seal(payload, lane) {
  try {
    const res = await fetch(`${BRIDGE}/seal`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentId: lane, to: lane, payloadType: 'browse', payload: { ...payload, type: "browser-provenance", notify: false }, encrypt: true })
    });
    if (!res.ok) return { sealed: false, error: `bridge HTTP ${res.status}` };
    const ingress = await res.json();
    const accepted = await fetch(`${BRIDGE}/api/envelope/submit`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({envelope:ingress.envelope})});
    if(!accepted.ok) return {sealed:false,error:`verifier HTTP ${accepted.status}`};
    return {sealed:true,receipt:await accepted.json()};
  } catch (e) { return { sealed: false, error: String(e) }; }
}

function chrome(args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(CHROME, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${PROFILE}`, `--timeout=${timeoutMs || 25000}`, ...args
    ], { timeout: (timeoutMs || 25000) + 10000, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout, stderr) => resolve({ err, stdout, stderr: String(stderr).slice(0, 2000) }));
  });
}

function checkUrl(u) {
  try { const p = new URL(u); return ['http:', 'https:', 'data:', 'about:'].includes(p.protocol); }
  catch { return false; }
}

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function readBody(req) {
  let b = ''; for await (const c of req) b += c;
  try { return JSON.parse(b || '{}'); } catch { return null; }
}

function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'GET' && u.pathname === '/health') {
    let bridge = 'down';
    try { const r = await fetch(`${BRIDGE}/health`, { signal: AbortSignal.timeout(2000) }); if (r.ok) bridge = 'up'; } catch {}
    return json(res, 200, { ok: true, service: 'web-browser', port: PORT, bridge, chrome: CHROME, queue: 'single-flight' });
  }
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html' }); return res.end(`<!doctype html><meta charset=utf-8><title>pb browser bridge</title>
<body style="font:14px monospace;background:#111;color:#cfc;padding:2em;max-width:72em">
<h2>ProofBundle Browser Bridge</h2><p>Every action sealed to the lineage via web-bridge /seal.
Endpoints (POST, JSON):</p><pre>
{"lane":"glm","url":"https://example.com"}                -> /browse/text
{"lane":"glm","url":"https://example.com"}                -> /browse/screenshot
{"lane":"glm","url":"https://example.com","html":true}    -> /browse/open (text + raw html)
{"lane":"glm"}                                            -> /browse/status</pre>
<p>http/https/data/about only — file:// and chrome:// refused. One chrome at a time.
Artifacts: ${SHOTS}</p></body>`);
  }
  if (req.method !== 'POST' || !u.pathname.startsWith('/browse/')) return json(res, 404, { error: 'not found' });
  const body = await readBody(req);
  if (!body) return json(res, 400, { error: 'bad json' });
  const lane = String(body.lane || '');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(lane)) return json(res, 400, { error: 'lane required (registered lane id)' });
  const action = u.pathname.slice('/browse/'.length);

  if (action === 'status') {
    const s = await seal({ action: 'status', ts: new Date().toISOString() }, lane);
    return json(res, 200, { ok: true, seal: s });
  }
  const url = String(body.url || '');
  if (!checkUrl(url)) return json(res, 400, { error: 'url must be http/https/data/about' });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  const out = await enqueue(async () => {
    if (action === 'text' || action === 'open') {
      const r = await chrome(['--dump-dom', url], 25000);
      const ok = !r.err;
      const html = r.stdout || '';
      const payload = { action, url, ok, bytes: html.length };
      if (!ok) payload.error = String(r.err).slice(0, 500);
      const s = await seal(payload, lane);
      const resp = { ok, url, seal: s };
      if (ok) { resp.text = stripHtml(html).slice(0, body.max ? Number(body.max) : 20000); if (body.html || action === 'open') resp.html = html.slice(0, body.max || 200000); }
      return { code: ok ? 200 : 502, resp };
    }
    if (action === 'screenshot') {
      const w = Math.min(Number(body.width) || 1440, 3840), h = Math.min(Number(body.height) || 900, 2160);
      const file = path.join(SHOTS, `${ts}-${lane}.png`);
      const r = await chrome([`--screenshot=${file}`, `--window-size=${w},${h}`, '--hide-scrollbars', '--virtual-time-budget=8000', url], 40000);
      const ok = !r.err && fs.existsSync(file);
      const payload = { action, url, ok, file, width: w, height: h };
      if (ok) { const buf = fs.readFileSync(file); payload.sha256 = sha256(buf); payload.bytes = buf.length; }
      else payload.error = (r.err ? String(r.err) : r.stderr).slice(0, 500);
      const s = await seal(payload, lane);
      return { code: ok ? 200 : 502, resp: { ok, url, file, sha256: payload.sha256, seal: s } };
    }
    return { code: 404, resp: { error: 'unknown action: text|open|screenshot|status' } };
  });
  return json(res, out.code, out.resp);
});

server.listen(PORT, '127.0.0.1', () => log(`web-browser up on 127.0.0.1:${PORT} bridge=${BRIDGE}`));
