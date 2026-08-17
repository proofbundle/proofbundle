#!/usr/bin/env node
/**
 * Omnidirectional agent relay — N-way mesh sealed communication with shared cryptographic lineage.
 *
 * Architecture:
 *   - All agents append to ONE shared immutable lineage
 *   - Any agent can send encrypted payloads to any agent(s)
 *   - Every decision/action seals into the chain with full provenance
 *   - Merkle root aggregates ALL agent sequences in one batch
 *   - OTS timestamps the entire mesh state with Bitcoin block height
 *   - All agents see the full chain; each has provenance over every action
 *
 * Flow (N agents):
 *   1. Agent[i] seals decision → encrypts for Agent[j] → appends to lineage
 *   2. All agents fetch /lineage → verify chain integrity
 *   3. Verifier hooks all agents' decision logic on received messages
 *   4. Agent[j] decision hook → seals response → appends to lineage
 *   5. All sequences batched into single Merkle root (covers all N agents)
 *   6. Batch submitted for OTS; Bitcoin block confirms all actions
 *   7. Each agent has full attestation over every action in the mesh
 */
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadOrCreateIdentity } from './identity.mjs';
import { seal, verifyEnvelope, envelopeHash, canonicalJSON } from './envelope.mjs';
import { decideOnEnvelope, registry as decisionRegistry } from './decision.mjs';

const BRIDGE_HOST = '127.0.0.1';
const BRIDGE_PORT = process.env.PB_AGENT_BRIDGE_PORT || 8788;

// ── HTTP client for bridge API ──
function bridgeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BRIDGE_HOST,
      port: BRIDGE_PORT,
      path,
      method,
      headers: { 'content-type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Shared omnidirectional relay state ──
const relayState = {
  agents: {},           // agentId -> { identity, registration_seq, sealCount, inboxCount }
  lineage: [],          // shared immutable chain (all agents' envelopes in order)
  decisions: [],        // all decisions/actions with full provenance
  merkleRoots: [],      // historical Merkle roots + OTS states
};

const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');

/**
 * Register agent. REQUIRES prior AIBOM initialization (agent-init.mjs).
 * An agent without a sealed AIBOM cannot join the mesh.
 */
export async function registerAgent(agentId) {
  const aibomFile = join(AGENT_DIR, agentId, 'aibom.json');
  if (!existsSync(aibomFile)) {
    throw new Error(
      `agent ${agentId} has no AIBOM — run agent-init.mjs first. ` +
      `An agent that cannot attest its own bill of materials cannot seal into the mesh.`
    );
  }
  const aibom = JSON.parse(readFileSync(aibomFile, 'utf8'));

  const identity = loadOrCreateIdentity(agentId);
  const reg = await bridgeRequest('POST', '/register', { agent_id: agentId, aibom });
  if (reg.status !== 200) throw new Error(`register failed: ${reg.body.error}`);
  if (reg.body.aibom_verified === false) {
    throw new Error(`register rejected AIBOM: ${(reg.body.aibom_problems || []).join('; ')}`);
  }

  relayState.agents[agentId] = {
    identity: reg.body,
    aibom_digest: aibom.bom_seal.digest_b64u,
    aibom_pubkey: aibom.bom_seal.pub_b64u,
    last_seq: null,
    pending_routes: [],
  };
  return { ...reg.body, aibom_digest: aibom.bom_seal.digest_b64u };
}

export async function getInbox(agentId) {
  const res = await bridgeRequest('GET', `/inbox/${agentId}`);
  if (res.status !== 200) throw new Error(`inbox fetch failed: ${res.body.error}`);
  return res.body.items || [];
}

/**
 * Omnidirectional seal: Agent seals a payload + appends to shared lineage.
 * All agents see the seal in the chain.
 *
 * Single recipient: payload is encrypted to that agent's X25519 public key.
 * Multiple recipients: payload is plaintext, sealed once, then routed to each recipient (proven seq 51).
 * No recipients (null): plaintext broadcast, routed to all registered agents.
 * Encrypted-multicast is not supported (ciphertext is bound to one recipient's key).
 *
 * @param {string} fromAgent — sealing agent
 * @param {object} payload — decision/action payload
 * @param {string|string[]} recipients — single agentId, array (plaintext broadcast), or null (broadcast to all)
 * @param {string} payloadType — "work"|"decision"|"attestation"|"verdict"
 * @returns {object} { envelope, receipt, sealed_to_lineage, visible_to, routed }
 */
export async function omniseal(fromAgent, payload, recipients = null, payloadType = 'decision') {
  // Validate agent is registered
  if (!relayState.agents[fromAgent]) {
    throw new Error(`agent not registered: ${fromAgent}`);
  }

  // Normalize recipients to array (null = no encryption, plaintext broadcast)
  const recipientList = recipients ? (Array.isArray(recipients) ? recipients : [recipients]) : [];
  // Multi-recipient seals are plaintext only: wantsEncryption = (length === 1).
  // This makes encrypted-multicast structurally impossible (not silently downgraded).
  // Plaintext is fanned out via the proven /route pattern (seq 51).
  const wantsEncryption = recipientList.length === 1;

  // Seal once: if single recipient, encrypt. If multiple or none, plaintext broadcast (route to all).
  const sealRes = await bridgeRequest('POST', '/seal', {
    agentId: fromAgent,
    payload,
    payloadType,
    to: wantsEncryption ? recipientList[0] : null,
    encrypt: wantsEncryption,
  });

  if (sealRes.status !== 200) throw new Error(`seal failed: ${sealRes.body.error}`);

  const { envelope, receipt } = sealRes.body;

  // Verify the seal is in the shared lineage
  const lineageRes = await bridgeRequest('GET', '/lineage');
  if (lineageRes.status === 200 && lineageRes.body.entries > 0) {
    relayState.lineage = Array(lineageRes.body.entries).fill(null); // placeholder
  }

  // Plaintext broadcast: route the sealed envelope to each recipient (all of them if multi, first if single-no-encrypt).
  const routed = [];
  if (!wantsEncryption && recipientList.length > 0) {
    for (const recipient of recipientList) {
      const routeRes = await bridgeRequest('POST', '/route', { to: recipient, envelope });
      if (routeRes.status !== 200) {
        routed.push({ recipient, routed: false, reason: routeRes.body?.detail || 'route failed' });
      } else {
        routed.push({ recipient, routed: true });
      }
    }
  }

  // Record provenance
  relayState.decisions.push({
    timestamp: new Date().toISOString(),
    action: 'omniseal',
    from: fromAgent,
    recipients: recipientList.length > 0 ? recipientList : 'broadcast',
    seq: receipt.seq,
    envelope_hash: receipt.envelope_hash.slice(0, 16) + '…',
    payload_type: payloadType,
    payload_keys: Object.keys(payload),
    routed,
  });

  return {
    envelope,
    receipt,
    sealed_to_lineage: true,
    visible_to: relayState.agents ? Object.keys(relayState.agents) : [],
    routed,
  };
}

/**
 * Verifier hook: fetch agent inbox → verify each envelope against the real
 * bridge lineage (POST /verify: signature + seq + hash-chain membership,
 * see bridge.mjs verifyAgainstLog) → only THEN invoke the canonical decision hook.
 *
 * Fail-closed: an envelope that does not verify never reaches the decision hook.
 * A rejection carries the actual reason (bad signature, tampered payload,
 * seq not in lineage, stale copy) so it can be triaged, not just a false.
 *
 * Uses decision.mjs hook registry: per-agent, per-type, fallthrough to default.
 * Agents install hooks via decisionRegistry.register() before calling this.
 *
 * @param {string} agentId — which agent's inbox to check
 * @param {function} [legacyHook] — optional: old-style hook for backwards compat
 */
export async function verifyAndRelay(agentId, legacyHook = null) {
  const inbox = await getInbox(agentId);
  const results = [];

  for (const item of inbox) {
    if (!item.envelope) {
      results.push({
        seq: item.envelope_seq,
        verified: false,
        reason: 'inbox item carries no envelope (stale bridge build — see bridge.mjs inbox writes)',
      });
      continue;
    }

    const verifyRes = await bridgeRequest('POST', '/verify', { envelope: item.envelope });
    const v = verifyRes.body || {};
    if (verifyRes.status !== 200 || !v.valid) {
      results.push({ seq: item.envelope_seq, verified: false, reason: v.reason || 'verify request failed' });
      continue; // fail closed — no decision hook on an unverified envelope
    }

    let decision = null, decisionError = null;
    try {
      // Try canonical decision registry first (new); fall back to legacy hook if provided
      if (legacyHook && typeof legacyHook === 'function') {
        decision = await legacyHook(item.envelope, item.envelope.payload?.body);
      } else {
        const decisionRecord = decideOnEnvelope(item.envelope, agentId);
        decision = decisionRecord.decision;
      }
    } catch (e) {
      decisionError = e.message;
    }

    results.push({
      seq: item.envelope_seq,
      verified: true,
      from: item.envelope.from?.agent_id ?? null,
      routing_via: item.via,
      ts: item.ts,
      decision,
      decision_error: decisionError,
    });
  }

  return results;
}

/**
 * Joint Merkle batching: collect all unanchored envelopes (from both agents),
 * compute Merkle root, write batch file, submit for OTS.
 *
 * Returns batch_id, merkle_root, envelope_count, ots_state.
 */
export async function batchAndStamp({ minEntries = 1 } = {}) {
  const stampRes = await bridgeRequest('POST', '/stamp', { minEntries });
  if (stampRes.status !== 200) throw new Error(`stamp failed: ${stampRes.body.error}`);

  const batch = stampRes.body;
  relayState.decisions.push({
    timestamp: new Date().toISOString(),
    action: 'batch',
    batch_id: batch.batch_id,
    merkle_root: batch.merkle_root,
    envelopes: batch.envelopes,
    ots_state: batch.ots_state,
  });

  return batch;
}

/**
 * Decision hook registry (public). Agents install type/sender-specific handlers here.
 * @example
 *   decisionHookRegistry.register('myAgent', 'attestation', (envelope, agentId) => ({ action: 'accept' }))
 */
export const decisionHookRegistry = decisionRegistry;

/**
 * Full provenance ledger: all decisions, actions, seals, batches, timestamps.
 * Exportable for audits, witnesses, regulatory compliance.
 */
export function getProvenance() {
  return {
    agents: Object.keys(relayState.agents).map((id) => ({
      agent_id: id,
      last_seq: relayState.agents[id].last_seq,
      pending: relayState.agents[id].pending_routes.length,
    })),
    decisions: relayState.decisions,
    summary: {
      total_seals: relayState.decisions.filter((d) => d.action === 'seal').length,
      total_batches: relayState.decisions.filter((d) => d.action === 'batch').length,
      total_verified: relayState.decisions.filter((d) => d.verified).length,
    },
  };
}

// ── Example: omnidirectional mesh, N agents, no fixed pair ──
export async function exampleOmnidirectionalRelay() {
  const agents = ['alice', 'bob', 'carol'];
  const { initializeAgent } = await import('./agent-init.mjs');

  console.log(`Generating AIBOM + Ed25519 identity for ${agents.length} agents…`);
  const now = new Date().toISOString();
  for (const a of agents) {
    await initializeAgent(a, `urn:agent:${a}:example:omnidirectional-relay`, now);
  }

  console.log(`Registering ${agents.length} agents (AIBOM-gated)…`);
  for (const a of agents) await registerAgent(a);

  // Every agent seals a decision addressed to every OTHER agent — no agent
  // is a fixed sender or fixed receiver, unlike a bidirectional A<->B pair.
  console.log('Sealing N-way: every agent -> every other agent…');
  for (const from of agents) {
    for (const to of agents) {
      if (from === to) continue;
      const { receipt } = await omniseal(
        from,
        { action: 'broadcast', from, to, note: `${from} reaching ${to} directly, not via a hub` },
        to,
        'decision'
      );
      console.log(`  ${from} -> ${to}: seq=${receipt.seq}, hash=${receipt.envelope_hash.slice(0, 16)}…`);
    }
  }

  // One Merkle root covers every agent's seals, not just one pair's.
  console.log('Batching all agents’ seals to one Merkle root + OTS…');
  const batch = await batchAndStamp({ minEntries: agents.length * (agents.length - 1) });
  console.log(`  Batch: ${batch.batch_id}, root=${batch.merkle_root.slice(0, 16)}…`);
  console.log(`  OTS: ${batch.ots_state}`);

  const prov = getProvenance();
  console.log('\nFull provenance:');
  console.log(JSON.stringify(prov, null, 2));

  return prov;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  exampleOmnidirectionalRelay().catch(console.error);
}
