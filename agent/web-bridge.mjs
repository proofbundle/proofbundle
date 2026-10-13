#!/usr/bin/env node
/**
 * web-bridge.mjs — sealing ProofBundle web bridge for all agents on this machine.
 *
 * Commissioned by the operator 2026-10-01 ("build a sealing proofbundle web
 * bridge for all of the agents on this machine"). This is a NEW entrypoint.
 * It does NOT un-revoke or modify the guarded pre-revocation entrypoints
 * (`bin/agent-bridge.mjs`, direct `node bridge.mjs` — both still exit 81).
 * Per the 2026-09-23 revocation addendum, `bridge.mjs`'s library exports were
 * deliberately left importable; this file uses exactly those exports, so the
 * seal math, lineage format, fork detection, Merkle batching, and OTS flow
 * are byte-identical to how the bridge always ran.
 *
 * What this adds on top of the library: a local web dashboard (GET /) and a
 * few aggregate read endpoints (/api/overview, /api/agents,
 * /api/lineage/tail). Every pre-revocation API path (/register, /seal,
 * /verify, /route, /inbox/:id, /lineage, /identity/:id, /predict/:seq,
 * /proof/:seq, /resolve, /stamp, /ots-check, /health) is delegated UNCHANGED
 * to the library's own request handler — old agent integrations keep working.
 *
 * Boundaries kept from the revocation (this is a tool, not a law):
 *   - 127.0.0.1 only, no auth (loopback trust, same as before)
 *   - no hooks, no prompt injection, nothing mandatory for any agent
 *   - no writes under /tmp, /mnt/pb-work, /dev/shm, /var/tmp (state lives in
 *     ~/.proofbundle/{bridge,agent} as it always has)
 *
 * Run:  node web-bridge.mjs [--port N]     (default 8788, env PB_AGENT_BRIDGE_PORT)
 */
import http from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  createServer, DEFAULT_PORT, BRIDGE_DIR,
  loadLog, checkLog, getIdentity,
} from './bridge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const UI_FILE = join(HERE, 'web-bridge-ui.html');
const APP_FILE = join(HERE,'..','proofbundle.html');

// The library's own request handler, created but never listened on directly —
// unmatched paths are delegated to it so the historical API is served verbatim.
const inner = createServer({ port: DEFAULT_PORT });
const innerHandler = inner.listeners('request')[0];
inner.removeAllListeners('request');

function json(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}


// ── Known local agent launchers (proofbundle-agents VS Code extension table) ──
function knownLaunchers() {
  const extRoot = join(homedir(), '.vscode', 'extensions');
  try {
    const dirs = readdirSync(extRoot)
      .filter(d => d.startsWith('falsealias.proofbundle-agents-'))
      .sort();
    for (let i = dirs.length - 1; i >= 0; i--) {
      const f = join(extRoot, dirs[i], 'agents.json');
      if (existsSync(f)) {
        const table = JSON.parse(readFileSync(f, 'utf8'));
        return {
          source: f,
          agents: Object.entries(table.agents || {})
            .map(([id, a]) => ({ id, command: a.command, enabled: !!a.enabled })),
        };
      }
    }
  } catch { /* extension absent — launchers list is advisory only */ }
  return { source: null, agents: [] };
}

function registeredAgents() {
  const f = join(BRIDGE_DIR, 'registry.json');
  try {
    const reg = JSON.parse(readFileSync(f, 'utf8'));
    return Object.entries(reg.agents || {}).map(([id, a]) => ({
      id,
      fingerprint: a.key_fingerprint ?? a.fingerprint ?? null,
      registered_at: a.registered_at ?? null,
      aibom_verified: a.aibom_verified ?? null,
      has_enc: !!a.enc_pubkey,
      pq_alg: a.pq_alg ?? null,
    }));
  } catch { return []; }
}

// ── Lineage tail with mtime cache — the real log is tens of MB; don't reparse
// per dashboard poll, and never ship the whole thing to a browser. ──
let logCache = { mtimeMs: -1, log: null };
function cachedLog() {
  const f = join(BRIDGE_DIR, 'lineage.jsonl');
  let mtimeMs = -1;
  try { mtimeMs = statSync(f).mtimeMs; } catch { return []; }
  if (mtimeMs !== logCache.mtimeMs || !logCache.log)
    logCache = { mtimeMs, log: loadLog() };
  return logCache.log;
}


const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;
  if(req.method==='GET'&&(path==='/proofbundle.html'||path==='/app')){
    try{const bytes=readFileSync(APP_FILE);res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'});return res.end(bytes);}
    catch{res.writeHead(503,{'content-type':'text/plain; charset=utf-8'});return res.end('ProofBundle application file is unavailable.');}
  }
  try {
    // ── Web UI ──
    if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
      let html;
      try { html = readFileSync(UI_FILE, 'utf8'); }
      catch {
        return json(res, 500, { error: 'UI_MISSING', detail: `web-bridge-ui.html not found next to ${fileURLToPath(import.meta.url)}` });
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    }

    // ── Aggregate read endpoints (new; additive only) ──
    if (req.method === 'GET' && path === '/api/overview') {
      const log = cachedLog();
      const check = checkLog(log);
      const last = log[log.length - 1] || null;
      return json(res, 200, {
        ok: true,
        service: 'pb-web-bridge',
        version: 'PB-AGENT-1',
        state_dir: BRIDGE_DIR,
        entries: check.entries,
        chain_ok: check.chain_ok,
        forked: check.forked,
        last_seq: last ? last.seq : null,
        agents_registered: registeredAgents().length,
      });
    }

    if (req.method === 'GET' && path === '/api/agents')
      return json(res, 200, {
        schema: 'PB-WEB-AGENTS-1',
        registered: registeredAgents(),
        launchers: knownLaunchers(),
      });

    if (req.method === 'GET' && path === '/api/lineage/tail') {
      const n = Math.min(Math.max(Number(url.searchParams.get('n')) || 50, 1), 500);
      const log = cachedLog();
      const tail = log.slice(-n).map(e => ({
        seq: e.seq,
        ts: e.ts ?? e.timestamp ?? null,
        agent: e.from?.agent_id ?? null,
        payload_type: e.payload_type ?? e.payload?.type ?? null,
        to: e.to ?? null,
        hash_preview: (e.payload?.plaintext_hash ?? '').slice(0, 16) || null,
      }));
      return json(res, 200, { schema: 'PB-WEB-TAIL-1', total: log.length, tail: tail.reverse() });
    }

    if (req.method === 'GET' && path.startsWith('/api/identity/')) {
      const id = decodeURIComponent(path.slice('/api/identity/'.length));
      const ident = getIdentity(id);
      return ident
        ? json(res, 200, ident)
        : json(res, 404, { error: 'NOT_FOUND', detail: id });
    }

    // ── Everything else: the historical bridge handler, unchanged ──
    return innerHandler(req, res);
  } catch (e) {
    return json(res, 500, { error: 'INTERNAL', detail: e.message });
  }
});

export function startWebBridge({ port = DEFAULT_PORT } = {}) {
  server.listen(port, '127.0.0.1', () => {
    console.error(`pb-web-bridge listening on http://127.0.0.1:${port}`);
    console.error(`dashboard: http://127.0.0.1:${port}/   state: ${BRIDGE_DIR}`);
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]))) {
  const pi = process.argv.indexOf('--port');
  startWebBridge({ port: pi >= 0 ? Number(process.argv[pi + 1]) : DEFAULT_PORT });
}
