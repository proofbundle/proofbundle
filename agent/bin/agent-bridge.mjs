#!/usr/bin/env node
/**
 * agent-bridge — CLI for the ProofBundle agent bridge.
 *
 *   agent-bridge start [--port N]        start the local broker (127.0.0.1)
 *   agent-bridge register <agent_id>...  register identities (generates keys)
 *   agent-bridge seal <agent_id> <payload.json> [--type work] [--to <id>] [--encrypt]
 *                                        offline seal+append (same lock as broker)
 *   agent-bridge verify <envelope.json>  verify signature + lineage membership
 *   agent-bridge status                  log tip, fork check, OTS states
 *   agent-bridge stamp                   Merkle-batch + submit unanchored entries
 *   agent-bridge ots-check               scan .ots files; upgrade states w/ block height
 *   agent-bridge proof <seq>             Merkle inclusion proof for a seq
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const lib = await import(pathToFileURL(join(here, '..', 'bridge.mjs')).href);

const [cmd, ...rest] = process.argv.slice(2);

const usage = () => { console.error('usage: see header of agent-bridge'); process.exit(2); };
if (!cmd) usage();

if (cmd === 'start') {
  const pi = rest.indexOf('--port');
  lib.startBridge({ port: pi >= 0 ? Number(rest[pi + 1]) : lib.DEFAULT_PORT });
} else if (cmd === 'register') {
  if (!rest.length) usage();
  for (const id of rest) {
    const r = await lib.registerAgent(id);
    console.log(`registered ${id} fp=${r.key_fingerprint} enc=${(r.enc_pubkey || '').slice(0, 12)}… pq=${r.pq_alg || 'none'}`);
  }
} else if (cmd === 'seal') {
  const [agentId, file] = rest;
  if (!agentId || !file) usage();
  const payload = JSON.parse(readFileSync(file, 'utf8'));
  const type = rest[rest.indexOf('--type') + 1] || 'work';
  const to = rest[rest.indexOf('--to') + 1] || null;
  const encrypt = rest.includes('--encrypt');
  const r = await lib.sealAndAppend({ agentId, payload, payloadType: type, to, encrypt });
  if (r.error) { console.error(`ERROR ${r.error}: ${r.detail}`); process.exit(1); }
  console.log(JSON.stringify({ receipt: r.receipt, envelope: r.envelope }, null, 2));
} else if (cmd === 'verify') {
  const envelope = JSON.parse(readFileSync(rest[0], 'utf8'));
  console.log(JSON.stringify(lib.verifyAgainstLog(envelope), null, 2));
} else if (cmd === 'status') {
  const log = lib.loadLog();
  const check = lib.checkLog(log);
  console.log(JSON.stringify({
    ...check,
    last_seq: log.length ? log[log.length - 1].seq : null,
  }, null, 2));
} else if (cmd === 'stamp') {
  console.log(JSON.stringify(await lib.stamp({}), null, 2));
} else if (cmd === 'ots-check') {
  const { otsCheck } = await import(pathToFileURL(join(here, '..', 'ots.mjs')).href);
  console.log(JSON.stringify(await otsCheck({
    batchesDir: join(lib.BRIDGE_DIR, 'batches'),
    statusFile: join(lib.BRIDGE_DIR, 'ots_status.jsonl'),
  }), null, 2));
} else if (cmd === 'proof') {
  console.log(JSON.stringify(lib.inclusionProof(Number(rest[0])), null, 2));
} else {
  usage();
}
