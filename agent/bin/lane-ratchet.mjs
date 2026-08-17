#!/usr/bin/env node
/**
 * lane-ratchet.mjs <agentId> <peerId> [note]
 *
 * One-lane join + handshake + reply client for the pb-agent bridge. Each of the
 * three lanes (glm / minimax / deepseek) runs this with its own agentId.
 *
 *   1. Mint Ed25519 identity + AIBOM if absent (agent-init), register with bridge.
 *   2. Fetch own inbox; for every inbound envelope: POST /verify, then seal a
 *      reply back to the sender (in_reply_to = inbound seq).
 *   3. If nothing inbound, seal an ENCRYPTED handshake to <peerId> carrying the
 *      sha256 pin of the proofbundle.html verifier ("hashing the verifier").
 *   4. POST /stamp to batch all unanchored envelopes to a Merkle root + OTS.
 *
 * Usage:
 *   node lane-ratchet.mjs deepseek-v4-pro glm-5.2 "deepseek lane handshake"
 */
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BRIDGE_HOST = '127.0.0.1';
const BRIDGE_PORT = Number(process.env.PB_AGENT_BRIDGE_PORT || 8788);
const VERIFIER = '/home/falsealias/src/proofbundle/proofbundle.html';
const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');

function req(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const o = { hostname: BRIDGE_HOST, port: BRIDGE_PORT, path, method, headers: { 'content-type': 'application/json' } };
    const r = http.request(o, (res) => {
      let d = ''; res.on('data', (c) => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const verifierPin = createHash('sha256').update(readFileSync(VERIFIER)).digest('hex');

const [agentId, peerId, note] = [process.argv[2], process.argv[3], process.argv.slice(4).join(' ') || 'lane handshake'];
if (!agentId || !peerId) {
  console.error('usage: node lane-ratchet.mjs <agentId> <peerId> [note]');
  process.exit(2);
}

// 1. mint identity + AIBOM if absent, then ensure registered
if (!existsSync(join(AGENT_DIR, agentId, 'aibom.json'))) {
  const { initializeAgent } = await import('/home/falsealias/src/proofbundle/agent/agent-init.mjs');
  const init = await initializeAgent(agentId, `urn:agent:lane:${agentId}:20260816`, new Date().toISOString());
  console.log(`minted AIBOM ${agentId} fp=${init.key_fingerprint} digest=${init.aibom.bom_seal.digest_b64u.slice(0, 16)}…`);
} else {
  // re-register to refresh registry entry / AIBOM re-verify
  const aibom = JSON.parse(readFileSync(join(AGENT_DIR, agentId, 'aibom.json'), 'utf8'));
  await req('POST', '/register', { agent_id: agentId, aibom });
  console.log(`re-registered ${agentId}`);
}

// 2. fetch own inbox, verify, reply
const inbox = await req('GET', `/inbox/${agentId}`);
const items = inbox.status === 200 ? (inbox.body.items || []) : [];
console.log(`inbox: ${items.length} envelope(s)`);

for (const item of items) {
  const env = item.envelope;
  const v = await req('POST', '/verify', { envelope: env });
  if (v.status !== 200 || !v.body.valid) {
    console.log(`  seq ${item.envelope_seq}: NOT verified (${v.body?.reason || v.status}) — not replying`);
    continue;
  }
  const from = env.from?.agent_id ?? 'unknown';
  const reply = await req('POST', '/seal', {
    agentId,
    payloadType: 'handoff',
    to: from,
    encrypt: true,
    payload: {
      kind: 'handshake-reply',
      in_reply_to: env.seq,
      from_lane: agentId,
      verifier: 'proofbundle.html',
      verifier_sha256: verifierPin,
      note,
    },
  });
  console.log(`  replied to ${from} (in_reply_to ${env.seq}) -> seq ${reply.body.receipt?.seq} hash ${reply.body.receipt?.envelope_hash?.slice(0, 16)}…`);
}

// 3. if nothing inbound, seal a fresh handshake to peer
if (items.length === 0) {
  const sealRes = await req('POST', '/seal', {
    agentId,
    payloadType: 'handoff',
    to: peerId,
    encrypt: true,
    payload: {
      kind: 'handshake',
      lane: agentId,
      verifier: 'proofbundle.html',
      verifier_sha256: verifierPin,
      note,
    },
  });
  if (sealRes.status !== 200) {
    console.error('seal failed:', JSON.stringify(sealRes.body));
    process.exit(1);
  }
  console.log(`sealed handshake ${agentId} -> ${peerId}: seq ${sealRes.body.receipt.seq} hash ${sealRes.body.receipt.envelope_hash.slice(0, 16)}… (encrypted=${!!sealRes.body.envelope.payload?.ciphertext})`);
}

// 4. batch + OTS
const stamp = await req('POST', '/stamp', {});
console.log(`batch ${stamp.body.batch_id} merkle_root ${stamp.body.merkle_root} ots_state ${stamp.body.ots_state}`);
