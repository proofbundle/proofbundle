#!/usr/bin/env node
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { encryptRange } from './vault-stream.mjs';

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`unexpected argument: ${argv[i]}`);
    const k = argv[i].slice(2); if (i + 1 >= argv.length) throw new Error(`missing value for --${k}`);
    out[k] = argv[++i];
  }
  return out;
}

const a = args(process.argv.slice(2));
for (const k of ['source', 'output', 'recipient-identity']) if (!a[k]) throw new Error(`--${k} is required`);
const identity = JSON.parse(await readFile(a['recipient-identity'], 'utf8'));
if (typeof identity.pq_pubkey !== 'string') throw new Error('recipient identity has no public ML-KEM encapsulation key');
if (a.output === '-' && !a.receipt) throw new Error('--receipt is required when --output - streams ciphertext to stdout');
const result = await encryptRange({
  sourcePath: resolve(a.source), outputPath: a.output === '-' ? '-' : resolve(a.output), recipientEncapsKey: identity.pq_pubkey,
  offset: a.offset === undefined ? 0 : Number(a.offset),
  length: a.length === undefined ? null : Number(a.length),
  chunkBytes: a['chunk-bytes'] === undefined ? undefined : Number(a['chunk-bytes']),
  partIndex: a['part-index'] === undefined ? 0 : Number(a['part-index']),
  partCount: a['part-count'] === undefined ? null : Number(a['part-count']),
  archiveId: a['archive-id'] ?? null,
  compression: a.compression ?? 'none',
});
const receiptPath = resolve(a.receipt ?? `${a.output}.receipt.json`);
await writeFile(receiptPath, JSON.stringify(result, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
await chmod(receiptPath, 0o600);
const summary = JSON.stringify({
  profile: result.header.profile, archive_id: result.header.archive_id,
  part_index: result.header.part_index, source_offset: result.header.source_offset,
  source_length: result.header.source_length, ciphertext_bytes: result.ciphertext_bytes,
  output_path: result.output_path, receipt_path: receiptPath,
}) + '\n';
if (a.output === '-') process.stderr.write(summary); else process.stdout.write(summary);
