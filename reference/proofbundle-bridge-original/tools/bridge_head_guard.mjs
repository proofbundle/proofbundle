import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function readLedgerHead(bridgeRoot) {
  const ledgerPath = path.join(bridgeRoot, 'ledger.jsonl');
  const text = fs.readFileSync(ledgerPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) throw new Error(`empty ledger: ${ledgerPath}`);
  const last = JSON.parse(lines[lines.length - 1]);
  return {
    bridgeRoot,
    lines: lines.length,
    sequence: last.sequence ?? null,
    created_at_utc: last.created_at_utc ?? null,
    from: last.from ?? null,
    to: last.to ?? null,
    record_sha256: last.record_sha256 ?? null,
  };
}

function verifyBridge(bridgeRoot) {
  const script = path.join(bridgeRoot, 'proofbundle_peer_bridge.mjs');
  const result = spawnSync(process.execPath, [script, 'verify'], {
    cwd: bridgeRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const verified = output.match(/verified records=(\d+)/)?.[1] ?? null;
  const head = output.match(/head_sha256=([A-Fa-f0-9]+)/)?.[1] ?? null;
  return {
    exitCode: result.status,
    verified_records: verified ? Number(verified) : null,
    verified_head_sha256: head,
    summary: output.split(/\r?\n/).slice(0, 12).join('\n'),
  };
}

const [bridgeRoot = process.cwd(), expectedHead = '', outPath = 'bridge_head_guard_receipt.json'] = process.argv.slice(2);
const head = readLedgerHead(bridgeRoot);
const verify = verifyBridge(bridgeRoot);
const expected = expectedHead.trim().toUpperCase();
const actual = String(head.record_sha256 ?? '').trim().toUpperCase();
const expectedMatch = expected ? actual === expected : null;

const receipt = {
  checked_at_utc: new Date().toISOString(),
  bridge_root: bridgeRoot,
  head,
  verify,
  expected_head_sha256: expected || null,
  expected_match: expectedMatch,
  ok: verify.exitCode === 0 && (expectedMatch !== false),
  rule: 'Workers must not accept jobs from a bridge root unless verify passes and the head matches the elected canonical head, or a fresh split receipt explains the mismatch.',
};

fs.writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
process.exit(receipt.ok ? 0 : 2);
