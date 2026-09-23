#!/usr/bin/env node
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { encryptReadable } from './vault-stream.mjs';

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
for (const k of ['output', 'receipt', 'recipient-identity', 'archive-id']) if (!a[k]) throw new Error(`--${k} is required`);
const identity = JSON.parse(await readFile(a['recipient-identity'], 'utf8'));
if (typeof identity.pq_pubkey !== 'string') throw new Error('recipient identity has no public ML-KEM encapsulation key');
const result = await encryptReadable({
  readable: process.stdin,
  outputPath: a.output === '-' ? '-' : resolve(a.output),
  recipientEncapsKey: identity.pq_pubkey,
  streamMetadata: { container: a.container ?? 'opaque-stream', metadata_preservation: a['metadata-preservation'] ?? null },
  chunkBytes: a['chunk-bytes'] === undefined ? undefined : Number(a['chunk-bytes']),
  archiveId: a['archive-id'], encoding: a.encoding ?? 'opaque-stream',
});
const receiptPath = resolve(a.receipt);
await writeFile(receiptPath, JSON.stringify(result, null, 2) + '\n', { mode: 0o600, flag: 'wx' }); await chmod(receiptPath, 0o600);
process.stderr.write(JSON.stringify({ profile: result.header.profile, archive_id: result.header.archive_id, stream_bytes: result.terminal.stream_bytes, ciphertext_bytes: result.ciphertext_bytes, receipt_path: receiptPath }) + '\n');
