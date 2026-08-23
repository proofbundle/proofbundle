#!/usr/bin/env node
/**
 * bridge.mjs — the ProofBundle agent bridge ("arousal layer").
 *
 * Local HTTP broker on 127.0.0.1. Agents seal envelopes (Ed25519 identity,
 * SHA-256 plaintext hash, optional X25519 hybrid encryption), the bridge
 * sequences them into an append-only, hash-chained, Merkle-batched log and
 * routes them agent-to-agent. Offline by default; OTS stamping is optional
 * and backfillable.
 *
 * Endpoints (see agent/ARCHITECTURE.md):
 *   POST /register      — register agent identity (generates keys locally)
 *   POST /seal          — seal payload into the lineage log (assigns seq)
 *   POST /verify        — verify a sealed envelope (signature + lineage)
 *   POST /route         — deliver a sealed envelope to a registered agent's inbox
 *   GET  /inbox/:id     — fetch + clear an agent's inbox
 *   GET  /lineage       — log + current Merkle root + OTS states + fork check
 *   GET  /identity/:id  — agent public identity (Ed25519 + X25519 enc + ML-KEM pq)
 *   GET  /predict/:seq  — prediction status (computed, envelopes never mutated)
 *   POST /resolve       — resolve a prediction with a verdict envelope
 *   POST /stamp         — Merkle-batch unanchored envelopes; submit for OTS
 *   GET  /health
 *
 * Fork-safety: seq is derived from the chain tip (last entry's seq + 1 and
 * prev_hash = envelopeHash(tip)), never from a counter; appends hold an
 * advisory exclusive lock (O_EXCL lockfile with staleness override) so the
 * HTTP broker and offline CLI appends serialize. The lineage is
 * append-only: nothing already written is ever modified or deleted.
 */
import http from 'node:http';
import {
  mkdirSync, readFileSync, writeFileSync, appendFileSync,
  existsSync, chmodSync, openSync, closeSync, unlinkSync, statSync,
} from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadOrCreateIdentity } from './identity.mjs';
import { seal, verifyEnvelope, envelopeHash, canonicalJSON } from './envelope.mjs';
import { merkleRoot, merkleProof, verifyProof } from './lineage.mjs';
import { isExpired, verifyCommit } from './prediction.mjs';
import { recordTransition, readStatuses, submitForStamping, otsCheck } from './ots.mjs';
import { verifyAibom } from '../crypto/aibom.mjs';

const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');
export const BRIDGE_DIR = join(homedir(), '.proofbundle', 'bridge');
const REGISTRY = join(BRIDGE_DIR, 'registry.json');
const LOG_FILE = join(BRIDGE_DIR, 'lineage.jsonl');
const BATCHES_DIR = join(BRIDGE_DIR, 'batches');
const OTS_STATUS = join(BRIDGE_DIR, 'ots_status.jsonl');
const LOCK_FILE = join(BRIDGE_DIR, '.append.lock');
const REGISTRY_LOCK_FILE = join(BRIDGE_DIR, '.registry.lock');
const INBOX_DIR = join(BRIDGE_DIR, 'inbox');

for (const d of [BRIDGE_DIR, BATCHES_DIR, INBOX_DIR, AGENT_DIR]) mkdirSync(d, { recursive: true });

export const DEFAULT_PORT = Number(process.env.PB_AGENT_BRIDGE_PORT || 8788);

// ── Advisory lock (O_EXCL lockfile, staleness override) — generic over path
// so lineage appends and registry writes serialize independently instead of
// contending on one file for two unrelated resources.
const LOCK_STALE_MS = 15_000;

async function withLock(lockFile, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      const fd = openSync(lockFile, 'wx');
      writeFileSync(fd, String(process.pid));
      closeSync(fd);
      break;
    } catch (e) {
      if (e.code === 'EEXIST') {
        try {
          const st = statSync(lockFile);
          if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
            unlinkSync(lockFile); // stale holder (crashed writer) — take over
            continue;
          }
        } catch { continue; /* raced away */ }
        if (attempt > 300) throw new Error(`lock timeout (15s): ${lockFile}`);
        await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 50)));
      } else throw e;
    }
  }
  try {
    return await fn();
  } finally {
    try { unlinkSync(lockFile); } catch { /* already gone */ }
  }
}
const withAppendLock = (fn) => withLock(LOCK_FILE, fn);

// ── Registry ──
function loadRegistry() {
  if (!existsSync(REGISTRY)) return { agents: {} };
  try { return JSON.parse(readFileSync(REGISTRY, 'utf8')); } catch { return { agents: {} }; }
}
function saveRegistry(reg) { writeFileSync(REGISTRY, JSON.stringify(reg, null, 2)); }

/**
 * Register (or load) an agent. Identity = key record: fresh Ed25519 signing
 * key + X25519 encryption key + ML-KEM-768 PQ public key (keygen only until
 * Node 25's crypto.kem). Private keys live only under
 * ~/.proofbundle/agent/<id>/ (0600), never in the bridge dir, never sealed.
 *
 * `aibom`, if supplied, is the agent's PB-AI-BOM-1 record (see crypto/aibom.mjs).
 * It is independently re-verified here — self-recomputed digest, signature
 * checked against its OWN embedded pub_b64u — not trusted because the caller
 * sent it. This proves "this AIBOM is internally consistent and self-signed
 * by the key it names," not "the bearer of this HTTP request is entitled to
 * that identity." Binding the AIBOM's signing key to the bridge's own Ed25519
 * identity key for this agent_id is a separate, still-open check.
 */
export async function registerAgent(agentId, aibom = null) {
  loadOrCreateIdentity(agentId); // creates identity.json + secret.key if absent
  const dir = join(AGENT_DIR, agentId);
  const encSecret = join(dir, 'enc.key');
  const idFile = join(dir, 'identity.json');
  let full = JSON.parse(readFileSync(idFile, 'utf8'));

  if (aibom) {
    const problems = verifyAibom(aibom);
    // Hard binding: an AIBOM that self-verifies but was signed by a DIFFERENT
    // key than this agent_id's own bridge identity attests for someone else's
    // key, not this one. `full.pubkey` is the full hex SPKI DER; AIBOM emitters
    // put the raw 32-byte Ed25519 public key in pub_b64u (see crypto/aibom.mjs,
    // aibom-emit.mjs) — compare on that common raw form, not the wrapper bytes.
    if (aibom.bom_seal?.pub_b64u) {
      const identityRawPubB64u = Buffer.from(full.pubkey, 'hex')
        .subarray(-32)
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (identityRawPubB64u !== aibom.bom_seal.pub_b64u) {
        problems.push(
          `aibom signing key does not match registered bridge identity key for ${agentId} ` +
          `(aibom pub_b64u=${aibom.bom_seal.pub_b64u.slice(0, 12)}…, identity=${identityRawPubB64u.slice(0, 12)}…)`
        );
      }
    } else {
      problems.push('aibom.bom_seal.pub_b64u missing — cannot bind to identity key');
    }
    full.aibom_verified = problems.length === 0;
    full.aibom_problems = problems;
    full.aibom_digest = aibom.bom_seal?.digest_b64u ?? null;
    full.aibom_pubkey = aibom.bom_seal?.pub_b64u ?? null;
    full.aibom_artifact = aibom.artifact ?? null;
    full.aibom_registered_at = new Date().toISOString();
  }

  if (!existsSync(encSecret)) {
    const enc = generateKeyPairSync('x25519');
    writeFileSync(encSecret, enc.privateKey.export({ type: 'pkcs8', format: 'der' }));
    chmodSync(encSecret, 0o600);
    full.enc_pubkey = enc.publicKey.export({ type: 'spki', format: 'der' }).subarray(12).toString('hex'); // raw 32B
    // PQ (ML-KEM-768) keypair — keygen works on Node 24, encapsulation does
    // not (crypto.kem lands in Node 25). Stored now so the algorithm is
    // versioned in via kx field, never silently swapped later.
    try {
      const pq = generateKeyPairSync('ml-kem-768');
      writeFileSync(join(dir, 'pq.key'), pq.privateKey.export({ type: 'pkcs8', format: 'der' }));
      chmodSync(join(dir, 'pq.key'), 0o600);
      full.pq_pubkey = pq.publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
      full.pq_alg = 'ml-kem-768';
    } catch { /* PQ keygen unavailable — classical only */ }
    full.updated_at = new Date().toISOString();
    writeFileSync(idFile, JSON.stringify(full, null, 2));
  }

  return withLock(REGISTRY_LOCK_FILE, () => {
    const reg = loadRegistry();
    reg.agents[agentId] = { ...reg.agents[agentId], ...full, registered_at: reg.agents[agentId]?.registered_at || new Date().toISOString() };
    saveRegistry(reg);
    return { agent_id: agentId, ...full }; // public fields only
  });
}

export function getIdentity(agentId) {
  return loadRegistry().agents[agentId] || null;
}

/** Load an agent's private signing key (bridge-local use only). */
function loadSigningKey(agentId) {
  const dir = join(AGENT_DIR, agentId);
  const priv = readFileSync(join(dir, 'secret.key'));
  const id = JSON.parse(readFileSync(join(dir, 'identity.json'), 'utf8'));
  return { privateKeyDer: priv, pubkeyHex: id.pubkey };
}

// ── Lineage log ──
export function loadLog() {
  if (!existsSync(LOG_FILE)) return [];
  const out = [];
  for (const line of readFileSync(LOG_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* torn tail line — skip */ }
  }
  return out;
}

/**
 * Fork detector — chain continuity is NOT fork detection (2026-08-13 lesson):
 * count tips (hashes never referenced as a prev_hash) and duplicate seqs,
 * and verify each entry's prev_hash resolves to its predecessor.
 */
export function checkLog(log) {
  const referenced = new Set(log.map(e => e.prev_hash));
  const seqSeen = new Set();
  const duplicate_seqs = [];
  let chain_ok = true;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    const prevOk = i === 0
      ? e.prev_hash === 'genesis'
      : e.prev_hash === envelopeHash(log[i - 1]) && e.seq === log[i - 1].seq + 1;
    if (!prevOk) chain_ok = false;
    if (seqSeen.has(e.seq)) duplicate_seqs.push(e.seq);
    seqSeen.add(e.seq);
  }
  const tips = log
    .filter(e => !referenced.has(envelopeHash(e)))
    .map(e => ({ seq: e.seq, hash: envelopeHash(e).slice(0, 16) + '…' }));
  return {
    entries: log.length,
    chain_ok,
    tips,
    forked: tips.length > 1 || duplicate_seqs.length > 0 || !chain_ok,
    duplicate_seqs,
  };
}

/**
 * Seal + append: seq and prev_hash are assigned from the chain tip BEFORE
 * signing (the signature covers them), then verified, then appended — all
 * under the advisory append lock. Returns { envelope, receipt } or { error }.
 */
export async function sealAndAppend({ agentId, payload, payloadType = 'work', to = null, encrypt = false, prediction = null }) {
  if (!existsSync(join(AGENT_DIR, agentId, 'identity.json')))
    return { error: 'UNEXPECTED_SIGNER', detail: `agent not registered: ${agentId}` };

  return withAppendLock(async () => {
    const log = loadLog();
    const tip = log[log.length - 1] || null;
    const seq = tip ? tip.seq + 1 : 0;
    const prevHash = tip ? envelopeHash(tip) : 'genesis';

    const { privateKeyDer, pubkeyHex } = loadSigningKey(agentId);
    let recipientEncPubKeyHex = null;
    if (encrypt) {
      if (!to) return { error: 'BAD_REQUEST', detail: 'encryption requires a recipient (to)' };
      const recip = getIdentity(to);
      if (!recip?.enc_pubkey) return { error: 'UNKNOWN_RECIPIENT', detail: to };
      recipientEncPubKeyHex = recip.enc_pubkey;
    }

    const envelope = seal({
      agentId, privateKeyDer, pubkeyHex, payload, payloadType,
      prevHash, seq, prediction, encrypt, recipientEncPubKeyHex,
    });

    const v = verifyEnvelope(envelope);
    if (!v.valid) return { error: 'SEAL_INVALID', detail: v.reason };

    appendFileSync(LOG_FILE, JSON.stringify(envelope) + '\n');

    // Auto-route if addressed
    let routed = false;
    if (to && getIdentity(to)) {
      appendFileSync(join(INBOX_DIR, `${to}.jsonl`),
        JSON.stringify({ envelope_seq: seq, ts: new Date().toISOString(), via: 'seal', envelope }) + '\n');
      routed = true;
    }
    return {
      envelope,
      receipt: {
        seq, signature_valid: true,
        envelope_hash: envelopeHash(envelope),
        routed_to: routed ? to : null,
      },
    };
  });
}

/**
 * Verify a sealed envelope against the persisted log (signature + lineage).
 * Also cross-checks envelope.from.pubkey against the REGISTRY's identity for
 * that agent_id — verifyEnvelope alone only proves internal self-consistency
 * (see its docstring), not that agent_id actually owns the key. Today the
 * only path into the lineage (sealAndAppend) always uses the bridge's own
 * on-disk key, so this can't currently fire on a real entry — this is
 * defense in depth against any future direct-import / offline-merge path
 * that could append externally-produced envelopes without that guarantee.
 */
export function verifyAgainstLog(envelope) {
  const v = verifyEnvelope(envelope);
  if (!v.valid) return { valid: false, reason: v.reason };
  const identity = getIdentity(envelope.from?.agent_id);
  if (!identity) return { valid: false, reason: `agent not registered: ${envelope.from?.agent_id}` };
  if (identity.pubkey !== envelope.from.pubkey)
    return { valid: false, reason: `envelope pubkey does not match registered identity for ${envelope.from.agent_id}` };
  const log = loadLog();
  const entry = log.find(e => e.seq === envelope.seq);
  if (!entry) return { valid: false, reason: `seq ${envelope.seq} not in lineage` };
  if (envelopeHash(entry) !== envelopeHash(envelope))
    return { valid: false, reason: `seq ${envelope.seq} differs from lineage entry (tampered or stale copy)` };
  return { valid: true, reason: null, in_lineage: true, seq: envelope.seq };
}

// ── Merkle batching + OTS ──
function lastBatchedSeq() {
  try {
    const st = readStatuses(OTS_STATUS);
    return Math.max(-1, ...Object.keys(st).map(k => {
      const m = k.match(/batch-(\d+)-(\d+)$/);
      return m ? Number(m[2]) : -1;
    }));
  } catch { return -1; }
}

/**
 * Batch all unanchored envelopes into a Merkle root, write the immutable
 * batch file, and submit it for OTS stamping. OTS states, distinct:
 * pending -> submitted -> upgraded (with Bitcoin block height, via otsCheck).
 * "submitted" is NEVER treated as anchored.
 */
export async function stamp({ minEntries = 1 } = {}) {
  const log = loadLog();
  const fromSeq = lastBatchedSeq() + 1;
  const batchEnvelopes = log.filter(e => e.seq >= fromSeq);
  if (batchEnvelopes.length < minEntries)
    return { error: 'NOTHING_TO_STAMP', detail: `${batchEnvelopes.length} unanchored envelope(s)` };

  const { root } = merkleRoot(batchEnvelopes);
  const first = batchEnvelopes[0].seq, last = batchEnvelopes[batchEnvelopes.length - 1].seq;
  const batchId = `batch-${first}-${last}`;
  const batchFile = join(BATCHES_DIR, `${batchId}.json`);
  const batch = {
    batch_id: batchId, first_seq: first, last_seq: last,
    merkle_root: root, envelope_count: batchEnvelopes.length,
    leaf_hashes: batchEnvelopes.map(e => envelopeHash(e)),
    created_at: new Date().toISOString(),
  };
  writeFileSync(batchFile, canonicalJSON(batch));
  recordTransition(OTS_STATUS, batchId, null, 'pending', { file: batchFile, merkle_root: root });
  // Real calendar round-trip, seconds not milliseconds — awaited so the
  // caller gets a state that matches what actually happened, but run via
  // execFile (non-blocking child I/O) so it doesn't freeze the broker's
  // event loop for every other agent while this one batch stamps.
  const state = await submitForStamping(batchFile, OTS_STATUS, batchId);
  return { batch_id: batchId, merkle_root: root, envelopes: batchEnvelopes.length, ots_state: state };
}

/** Merkle inclusion proof for a seq within its (open) pending batch. */
export function inclusionProof(seq) {
  const log = loadLog();
  const fromSeq = lastBatchedSeq() + 1;
  const batchEnvelopes = log.filter(e => e.seq >= fromSeq);
  const idx = batchEnvelopes.findIndex(e => e.seq === seq);
  if (idx < 0) return { error: 'NOT_BATCHED', detail: `seq ${seq} not in any open batch` };
  const { root } = merkleRoot(batchEnvelopes);
  const proof = merkleProof(batchEnvelopes, idx);
  const leaf = envelopeHash(batchEnvelopes[idx]);
  const ok = verifyProof(leaf, proof, root);
  return {
    seq, batch: `batch-${batchEnvelopes[0].seq}-${batchEnvelopes[batchEnvelopes.length - 1].seq}`,
    merkle_root: root, proof_valid: ok, proof,
  };
}

// ── Predictions (computed on read — sealed envelopes are never mutated) ──
export function predictionStatus(seq) {
  const log = loadLog();
  const env = log.find(e => e.seq === seq);
  if (!env) return { error: 'NOT_FOUND', detail: `seq ${seq} not in lineage` };
  if (!env.prediction) return { error: 'NO_PREDICTION', detail: `seq ${seq} carries no prediction` };
  const p = env.prediction;
  const verdicts = log.filter(e =>
    e.payload_type === 'verdict' && e.payload?.body?.resolve_seq === seq);
  const last = verdicts[verdicts.length - 1] || null;
  const outcome = last ? last.payload.body.outcome
    : (isExpired(p) ? 'expired' : null);
  return {
    seq, predicate: p.predicate, commit_hash: p.commit_hash,
    commit_hash_valid: verifyCommit(p),
    valid_from: p.valid_from, valid_until: p.valid_until,
    outcome, // null | confirmed | falsified | expired (computed, never rewritten)
    verdict_seq: last ? last.seq : null,
    verifier: last ? last.from.agent_id : null,
  };
}

// ── HTTP broker (127.0.0.1 ONLY — this is a local loop, not a service) ──
function json(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function jsonLocalRead(req, res, code, obj) {
  const origin = req.headers.origin;
  const allowed = origin === 'null' || origin === 'http://127.0.0.1' || origin === 'http://localhost';
  const body = JSON.stringify(obj, null, 2);
  const headers = { 'content-type':'application/json', 'content-length':Buffer.byteLength(body), 'cache-control':'no-store' };
  if (allowed) headers['access-control-allow-origin'] = origin;
  res.writeHead(code, headers);
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('invalid JSON body'); }
}

export function createServer({ port = DEFAULT_PORT } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const path = url.pathname;
    try {
      if (req.method === 'GET' && path === '/health')
        return json(res, 200, { ok: true, service: 'pb-agent-bridge', version: 'PB-AGENT-1' });

      if (req.method === 'POST' && path === '/register') {
        const { agent_id, aibom } = await readBody(req);
        if (!agent_id) return json(res, 400, { error: 'BAD_REQUEST', detail: 'agent_id required' });
        return json(res, 200, await registerAgent(agent_id, aibom || null));
      }

      if (req.method === 'POST' && path === '/seal') {
        const r = await sealAndAppend(await readBody(req));
        return json(res, r.error ? 400 : 200, r);
      }

      if (req.method === 'POST' && path === '/verify') {
        const { envelope } = await readBody(req);
        return json(res, 200, verifyAgainstLog(envelope));
      }

      if (req.method === 'POST' && path === '/route') {
        const { to, envelope } = await readBody(req);
        if (!to || !envelope) return json(res, 400, { error: 'BAD_REQUEST', detail: 'to + envelope required' });
        if (!getIdentity(to)) return json(res, 404, { error: 'UNKNOWN_RECIPIENT', detail: to });
        // Guard: encrypted envelopes cannot be routed (would be unreadable to additional recipients).
        // This prevents silent failure (route succeeds but payload is cryptographically inaccessible).
        // To broadcast encrypted messages: seal N times, once per recipient.
        if (envelope.payload?.encrypted === true)
          return json(res, 400, { error: 'ROUTE_REJECTED', detail: 'encrypted envelopes cannot be routed to additional recipients (ciphertext is bound to original recipient). To broadcast an encrypted message, seal it N times with different recipients.' });
        const v = verifyAgainstLog(envelope);
        if (!v.valid) return json(res, 400, { error: 'ROUTE_REJECTED', ...v });
        appendFileSync(join(INBOX_DIR, `${to}.jsonl`),
          JSON.stringify({ envelope_seq: envelope.seq, ts: new Date().toISOString(), via: 'route', envelope }) + '\n');
        return json(res, 200, { routed: true, to, seq: envelope.seq });
      }

      if (req.method === 'GET' && path.startsWith('/inbox/')) {
        const id = decodeURIComponent(path.slice('/inbox/'.length));
        const f = join(INBOX_DIR, `${id}.jsonl`);
        const items = existsSync(f)
          ? readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)) : [];
        if (existsSync(f)) unlinkSync(f); // fetch-and-clear
        return json(res, 200, { agent_id: id, count: items.length, items });
      }

      if (req.method === 'GET' && path === '/lineage') {
        const log = loadLog();
        const check = checkLog(log);
        const statuses = await otsCheck({ batchesDir: BATCHES_DIR, statusFile: OTS_STATUS });
        return json(res, 200, {
          ...check,
          last_seq: log.length ? log[log.length - 1].seq : null,
          tip_hash: log.length ? envelopeHash(log[log.length - 1]) : null,
          unanchored_entries: Math.max(0, log.length - 1 - lastBatchedSeq()),
          ots_batches: statuses,
        });
      }

      if (req.method === 'GET' && path === '/lineage/export') {
        const log = loadLog();
        const check = checkLog(log);
        return jsonLocalRead(req, res, 200, {
          schema:'PB-AGENT-LINEAGE-EXPORT-1', generated_at:new Date().toISOString(),
          ...check, entries:log,
        });
      }

      if (req.method === 'GET' && path.startsWith('/identity/')) {
        const id = decodeURIComponent(path.slice('/identity/'.length));
        const ident = getIdentity(id);
        return ident ? json(res, 200, ident) : json(res, 404, { error: 'NOT_FOUND', detail: id });
      }

      if (req.method === 'GET' && path.startsWith('/predict/'))
        return json(res, 200, predictionStatus(Number(path.slice('/predict/'.length))));

      if (req.method === 'GET' && path.startsWith('/proof/'))
        return json(res, 200, inclusionProof(Number(path.slice('/proof/'.length))));

      if (req.method === 'POST' && path === '/resolve') {
        const { prediction_seq, outcome, verifier } = await readBody(req);
        if (!['confirmed', 'falsified'].includes(outcome))
          return json(res, 400, { error: 'BAD_REQUEST', detail: 'outcome must be confirmed|falsified' });
        if (!existsSync(join(AGENT_DIR, verifier || '∅', 'identity.json')))
          return json(res, 400, { error: 'UNEXPECTED_SIGNER', detail: `verifier not registered: ${verifier}` });
        const r = await sealAndAppend({
          agentId: verifier, payloadType: 'verdict',
          payload: { resolve_seq: prediction_seq, outcome },
        });
        return json(res, r.error ? 400 : 200, r);
      }

      if (req.method === 'POST' && path === '/stamp')
        return json(res, 200, await stamp({}));

      if (req.method === 'POST' && path === '/ots-check')
        return json(res, 200, await otsCheck({ batchesDir: BATCHES_DIR, statusFile: OTS_STATUS }));

      return json(res, 404, { error: 'NOT_FOUND', detail: `${req.method} ${path}` });
    } catch (e) {
      return json(res, 500, { error: 'INTERNAL', detail: e.message });
    }
  });
}

export function startBridge({ port = DEFAULT_PORT } = {}) {
  const srv = createServer({ port });
  srv.listen(port, '127.0.0.1', () => {
    console.error(`pb-agent-bridge listening on http://127.0.0.1:${port} (state: ${BRIDGE_DIR})`);
  });
  return srv;
}

// run directly: node bridge.mjs [--port N]
// Guard: compare like-for-like. The prior comparison mixed a filesystem path
// (fileURLToPath) with a file:// URL (pathToFileURL(...).href), which is never
// equal, so `node bridge.mjs` silently exited without listening. Compare the
// resolved filesystem path of this module against argv[1].
if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]))) {
  const pi = process.argv.indexOf('--port');
  startBridge({ port: pi >= 0 ? Number(process.argv[pi + 1]) : DEFAULT_PORT });
}



