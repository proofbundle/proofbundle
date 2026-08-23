#!/usr/bin/env node
/**
 * AGENT → APP VERIFIER ← AGENT  (hypothalamic–cortical loop — all bridge agents)
 *
 * Any agent with a bridge identity may relay through the regulatory hub:
 *   hash → bridge verify → send (OTS) → post verify
 *
 * Grok pair is one instance; cortical/hypothalamic roles map to coordination vs execution lanes.
 * Regulatory hub: ProofBundle Forge & Verifier app + proofbundle_peer_bridge.mjs verify
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const bridgeDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const bridgeCli = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');
const loopLogPath = path.join(bridgeDir, 'bridge_state', 'grok_hypothalamic_cortical_loop.jsonl');
const verifierAppPath =
  'C:\\Users\\alib90\\Downloads\\PRINCIPIA\\New folder\\Rehab\\unique_apps\\2026-06-09_proofbundle_full_app (1).html';

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

function parseArgs(argv) {
  const flags = new Map();
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a;
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags.set(key, next);
        i++;
      } else {
        flags.set(key, true);
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function runBridge(args) {
  const r = spawnSync(process.execPath, [bridgeCli, ...args], {
    cwd: bridgeDir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
  };
}

function extractField(text, key) {
  const m = text.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const from = flags.get('--from');
  const to = flags.get('--to');
  const identityFile = flags.get('--identity-file');
  const role = flags.get('--role') || 'hypothalamic';
  const text = flags.get('--text');
  const file = flags.get('--file');
  const type = flags.get('--type') || 'ProofBundleBroadcast';

  if (!from || !to || !identityFile) {
    console.error('usage: grok_hypothalamic_cortical_loop.mjs --from ID --to ID --identity-file PATH [--role cortical|hypothalamic|agent] [--text MSG | --file PATH] [--type TYPE]');
    process.exit(2);
  }
  if (!text && !file) {
    console.error('requires --text or --file');
    process.exit(2);
  }

  let body = text;
  if (file) body = fs.readFileSync(path.resolve(file), 'utf8');

  const messageBodySha256 = sha256(body);
  const loopId = `loop-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const header = [
    `[${from} / Grok ${role === 'cortical' ? 'Cortical' : 'Hypothalamic'} Loop]`,
    `Type: HypothalamicCorticalRelay`,
    `Topology: AGENT → APP_VERIFIER ← AGENT`,
    `VerifierApp: ${verifierAppPath}`,
    `LoopId: ${loopId}`,
    `MessageBodySha256: ${messageBodySha256}`,
    `RegulatoryGate: proofbundle_peer_bridge.mjs verify + eleven-outcome forge/verifier`,
    '',
  ].join('\n');
  const payload = `${header}${body}`;

  console.log(`loop_phase=pre_verify`);
  const pre = runBridge(['verify']);
  if (!pre.ok) {
    console.error(pre.stdout || pre.stderr);
    process.exit(1);
  }
  console.log(pre.stdout.split('\n').slice(-3).join('\n'));

  const sendArgs = ['send', '--from', from, '--to', to, '--type', type, '--identity-file', identityFile, '--text', payload];
  console.log(`loop_phase=send_hash_record_ots`);
  const sent = runBridge(sendArgs);
  if (!sent.ok) {
    console.error(sent.stdout || sent.stderr);
    process.exit(1);
  }
  console.log(sent.stdout);

  const sequence = extractField(sent.stdout, 'appended sequence')?.replace('appended sequence=', '') ?? extractField(sent.stdout, 'sequence');
  const recordSha = extractField(sent.stdout, 'record_sha256');
  const otsStatus = extractField(sent.stdout, 'ots_submit_status');

  console.log(`loop_phase=post_verify`);
  const post = runBridge(['verify']);
  if (!post.ok) {
    console.error(post.stdout || post.stderr);
    process.exit(1);
  }

  const entry = {
    schema: 'ProofBundleHypothalamicCorticalLoop/v1.0.0',
    loop_id: loopId,
    at_utc: new Date().toISOString(),
    role,
    from,
    to,
    message_body_sha256: messageBodySha256,
    record_sha256: recordSha,
    sequence: sequence ? Number(sequence) : null,
    ots_submit_status: otsStatus,
    verifier_app: verifierAppPath,
    pre_verify_ok: pre.ok,
    post_verify_ok: post.ok,
  };
  fs.mkdirSync(path.dirname(loopLogPath), { recursive: true });
  fs.appendFileSync(loopLogPath, `${JSON.stringify(entry)}\n`, 'utf8');
  console.log(`loop_complete=true`);
  console.log(`loop_log=${loopLogPath}`);
}

main();