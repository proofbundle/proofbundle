#!/usr/bin/env node
/**
 * Agent initialization — AIBOM generation + Ed25519 registration.
 *
 * Every agent MUST:
 *   1. Generate Ed25519 keypair (identity root)
 *   2. Build AIBOM (artifact + compliance + sealed signature)
 *   3. Register state packet / identity packet with bridge
 *   4. Only then can agent seal/route messages
 */
import { generateKeyPairSync, sign as nodeSign, createPrivateKey } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import http from 'node:http';
import { buildAibom, verifyAibom } from '../crypto/aibom.mjs';
import { loadOrCreateIdentity } from './identity.mjs';

const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');
const BRIDGE_HOST = '127.0.0.1';
const BRIDGE_PORT = process.env.PB_AGENT_BRIDGE_PORT || 8788;

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

/**
 * Initialize agent: AIBOM + Ed25519 registration.
 * Returns { agentId, aibom, identity, registered }.
 */
export async function initializeAgent(agentId, artifactUrn, generatedAt) {
  const agentPath = join(AGENT_DIR, agentId);
  mkdirSync(agentPath, { recursive: true });

  // 1. Create/load Ed25519 identity
  const identity = loadOrCreateIdentity(agentId);
  const privateKeyDer = readFileSync(join(agentPath, 'secret.key'));
  const publicKeyDer = Buffer.from(identity.pubkey, 'hex');

  // 2. Build AIBOM with Ed25519 signature
  const aibom = buildAibom({
    artifact: artifactUrn,
    generatedAt,
    ancestry: [],
    riskTier: 'high',
    modelCards: [],
    custodyChain: 'bridge lineage',
    attestationRecord: 'agent provenance over all decisions',
    kappa: 1,
    complianceVector: new Array(10).fill(0),
    theta: new Array(10).fill(1),
    publicKeyRaw: publicKeyDer.slice(-32), // raw 32-byte Ed25519 public key
    signer: (digest) => {
      const privateKey = createPrivateKey({
        key: privateKeyDer,
        format: 'der',
        type: 'pkcs8',
      });
      return nodeSign(null, Buffer.from(digest), privateKey);
    },
  });

  // Verify AIBOM self-seals correctly
  const problems = verifyAibom(aibom);
  if (problems.length) {
    throw new Error(`AIBOM verification failed: ${problems.join('; ')}`);
  }

  // Store AIBOM
  const aibomFile = join(agentPath, 'aibom.json');
  writeFileSync(aibomFile, JSON.stringify(aibom, null, 2));

  // 3. Register with bridge (identity registration packet)
  const registerRes = await bridgeRequest('POST', '/register', {
    agent_id: agentId,
    aibom, // include AIBOM in registration
    artifact_urn: artifactUrn,
  });

  if (registerRes.status !== 200) {
    throw new Error(`bridge registration failed: ${registerRes.body.error}`);
  }

  return {
    agentId,
    aibom,
    identity: registerRes.body,
    registered: true,
    aibom_file: aibomFile,
    key_fingerprint: identity.key_fingerprint,
  };
}

/**
 * State packet: agent's current lineage state, AIBOM digest, registered keys.
 * Sent to bridge on every connection to establish continuity.
 */
export async function statePacket(agentId) {
  const agentPath = join(AGENT_DIR, agentId);
  const aibomFile = join(agentPath, 'aibom.json');

  if (!existsSync(aibomFile)) {
    throw new Error(`agent not initialized: ${agentId}`);
  }

  const aibom = JSON.parse(readFileSync(aibomFile, 'utf8'));
  const identity = JSON.parse(readFileSync(join(agentPath, 'identity.json'), 'utf8'));

  return {
    agent_id: agentId,
    aibom_digest: aibom.bom_seal.digest_b64u,
    aibom_pubkey: aibom.bom_seal.pub_b64u,
    identity_fingerprint: identity.key_fingerprint,
    registered_at: identity.created_at,
  };
}

// Example: init two agents with AIBOM
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const now = new Date().toISOString();
    console.log('Initializing agents with AIBOM + Ed25519…\n');

    try {
      const alice = await initializeAgent(
        'alice',
        'urn:agent:claude:omnidirectional-relay:20260815',
        now
      );
      console.log('✓ Alice initialized');
      console.log(`  AIBOM: ${alice.aibom.bom_seal.digest_b64u.slice(0, 16)}…`);
      console.log(`  Key:   ${alice.key_fingerprint}`);
      console.log(`  File:  ${alice.aibom_file}\n`);

      const bob = await initializeAgent(
        'bob',
        'urn:agent:claude:omnidirectional-relay:20260815',
        now
      );
      console.log('✓ Bob initialized');
      console.log(`  AIBOM: ${bob.aibom.bom_seal.digest_b64u.slice(0, 16)}…`);
      console.log(`  Key:   ${bob.key_fingerprint}`);
      console.log(`  File:  ${bob.aibom_file}\n`);

      const aliceState = await statePacket('alice');
      const bobState = await statePacket('bob');
      console.log('State packets:');
      console.log(JSON.stringify({ alice: aliceState, bob: bobState }, null, 2));
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  })();
}
