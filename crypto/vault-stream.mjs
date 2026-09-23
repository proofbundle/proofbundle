/**
 * ProofBundle PB-VAULT-1 bounded-range streaming encryption.
 *
 * A vault part is independently decryptable.  Encryption consumes only an
 * ML-KEM-768 public encapsulation key; the corresponding decapsulation key is
 * neither accepted nor opened by the encryption path.  The format is intended
 * for resumable large-file custody: callers choose a source byte range small
 * enough for the available staging volume, upload and verify that ciphertext
 * part, then continue with the next range.
 *
 * Construction:
 *   PB ML-KEM-768 -> 32-byte shared secret
 *   PB SHAKE256 domain-separated per-record key derivation
 *   ChaCha20-Poly1305 per record, with unique prefix||counter nonce
 *   encrypted metadata and encrypted terminal digest record
 *   SHA-256/SHA-384/BLAKE2b-512 range digests plus PB BLAKE3 chunk Merkle root
 */
import {
  createCipheriv, createDecipheriv, createHash, randomBytes,
} from 'node:crypto';
import { open, stat } from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mlkemEncapsulate, mlkemDecapsulate } from './mlkem.mjs';
import { shake256 } from './keccak.mjs';
import { blake3 } from './blake3.mjs';

export const VAULT_PROFILE = 'PB-VAULT-1';
export const VAULT_MAGIC = Buffer.from('PBVLT1\n\0', 'binary');
export const DEFAULT_CHUNK_BYTES = 8 * 1024 * 1024;

const TYPE_METADATA = 1;
const TYPE_DATA = 2;
const TYPE_FINAL = 3;
const execFile = promisify(execFileCallback);

function canonicalJSON(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJSON).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON(obj[k])).join(',') + '}';
}

function concat(...xs) { return Buffer.concat(xs.map(x => Buffer.from(x))); }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }
function u64(n) { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; }
function fromHex(s, name) {
  if (typeof s !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(s)) throw new Error(`${name} must be even-length hexadecimal`);
  return Buffer.from(s, 'hex');
}

function deriveRecordKey(sharedSecret, salt, index) {
  return Buffer.from(shake256(concat(
    Buffer.from('PB-VAULT-1\0record-key\0', 'utf8'), sharedSecret, salt, u64(index),
  ), 32));
}

function recordAAD(headerDigest, type, index, plaintextLength) {
  return concat(VAULT_MAGIC, headerDigest, Buffer.from([type]), u64(index), u32(plaintextLength));
}

function nonceFor(prefix, index) { return concat(prefix, u64(index)); }

function encryptRecord({ type, index, plaintext, sharedSecret, salt, noncePrefix, headerDigest }) {
  const key = deriveRecordKey(sharedSecret, salt, index);
  const cipher = createCipheriv('chacha20-poly1305', key, nonceFor(noncePrefix, index), { authTagLength: 16 });
  cipher.setAAD(recordAAD(headerDigest, type, index, plaintext.length));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return concat(Buffer.from([type]), u64(index), u32(plaintext.length), ciphertext, cipher.getAuthTag());
}

function decryptRecord({ record, sharedSecret, salt, noncePrefix, headerDigest }) {
  const { type, index, plaintextLength, ciphertext, tag } = record;
  const key = deriveRecordKey(sharedSecret, salt, index);
  const decipher = createDecipheriv('chacha20-poly1305', key, nonceFor(noncePrefix, index), { authTagLength: 16 });
  decipher.setAAD(recordAAD(headerDigest, type, index, plaintextLength));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function leafHash(chunk) { return Buffer.from(blake3(chunk, 32)); }
function parentHash(left, right) { return Buffer.from(blake3(concat(Buffer.from([1]), left, right), 32)); }
function merkleRoot(leaves) {
  if (leaves.length === 0) return Buffer.from(blake3(Buffer.alloc(0), 32));
  let level = leaves.map(x => Buffer.from(x));
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? parentHash(level[i], level[i + 1]) : level[i]);
    level = next;
  }
  return level[0];
}

async function metadataFor(pathname, st, range) {
  let xattrs = null, acl = null;
  try { xattrs = (await execFile('getfattr', ['--absolute-names', '-d', '-m', '-', '--encoding=base64', '--', pathname], { maxBuffer: 16 * 1024 * 1024 })).stdout; } catch {}
  try { acl = (await execFile('getfacl', ['--absolute-names', '--', pathname], { maxBuffer: 16 * 1024 * 1024 })).stdout; } catch {}
  return {
    path: pathname,
    size: st.size,
    mode: st.mode,
    uid: st.uid,
    gid: st.gid,
    atime_ns: st.atimeNs?.toString() ?? String(BigInt(Math.trunc(st.atimeMs * 1e6))),
    mtime_ns: st.mtimeNs?.toString() ?? String(BigInt(Math.trunc(st.mtimeMs * 1e6))),
    ctime_ns: st.ctimeNs?.toString() ?? String(BigInt(Math.trunc(st.ctimeMs * 1e6))),
    birthtime_ns: st.birthtimeNs?.toString() ?? String(BigInt(Math.trunc(st.birthtimeMs * 1e6))),
    xattrs_getfattr: xattrs,
    acl_getfacl: acl,
    range,
  };
}

/** Encrypt one bounded range from sourcePath into outputPath. */
export async function encryptRange({
  sourcePath, outputPath, recipientEncapsKey,
  offset = 0, length = null, chunkBytes = DEFAULT_CHUNK_BYTES,
  partIndex = 0, partCount = null, archiveId = null,
  compression = 'none',
}) {
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('offset must be a non-negative safe integer');
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 64 * 1024 || chunkBytes > 64 * 1024 * 1024)
    throw new Error('chunkBytes must be in 64 KiB..64 MiB');
  if (!['none', 'zstd-3'].includes(compression)) throw new Error('compression must be none or zstd-3');
  const st = await stat(sourcePath, { bigint: false });
  if (!st.isFile()) throw new Error('source must be a regular file');
  const available = st.size - offset;
  const rangeLength = length === null ? available : length;
  if (!Number.isSafeInteger(rangeLength) || rangeLength < 0 || rangeLength > available) throw new Error('range exceeds source');
  const ek = recipientEncapsKey instanceof Uint8Array ? recipientEncapsKey : fromHex(recipientEncapsKey, 'recipientEncapsKey');
  const kemSeed = randomBytes(32);
  const { sharedSecret, ciphertext: kemCiphertext } = mlkemEncapsulate(ek, kemSeed, 'ML-KEM-768');
  const salt = randomBytes(32), noncePrefix = randomBytes(4);
  const resolvedArchiveId = archiveId ?? randomBytes(16).toString('hex');
  const header = {
    profile: VAULT_PROFILE,
    version: 1,
    kem: 'ML-KEM-768',
    kdf: 'PB-SHAKE256-domain-separated-v1',
    aead: 'ChaCha20-Poly1305',
    archive_id: resolvedArchiveId,
    part_index: partIndex,
    part_count: partCount,
    source_offset: offset,
    source_length: rangeLength,
    source_size: st.size,
    chunk_bytes: chunkBytes,
    compression: compression === 'zstd-3' ? 'zstd-level-3-independent-range' : 'none',
    kem_ciphertext: Buffer.from(kemCiphertext).toString('hex'),
    salt: salt.toString('hex'),
    nonce_prefix: noncePrefix.toString('hex'),
  };
  const headerBytes = Buffer.from(canonicalJSON(header), 'utf8');
  const headerDigest = createHash('sha256').update(headerBytes).digest();
  const input = await open(sourcePath, 'r');
  const output = outputPath === '-' ? null : await open(outputPath, 'wx', 0o600);
  const plainHashes = {
    sha256: createHash('sha256'), sha384: createHash('sha384'), blake2b512: createHash('blake2b512'),
  };
  const cipherHashes = {
    sha256: createHash('sha256'), sha384: createHash('sha384'), blake2b512: createHash('blake2b512'),
  };
  let ciphertextBytes = 0;
  const write = async (bytes) => {
    if (output) await output.write(bytes);
    else if (!process.stdout.write(bytes)) await new Promise(resolve => process.stdout.once('drain', resolve));
    ciphertextBytes += bytes.length;
    for (const h of Object.values(cipherHashes)) h.update(bytes);
  };
  const leaves = [];
  let position = offset, remaining = rangeLength, recordIndex = 0, dataRecords = 0, encodedBytes = 0;
  try {
    await write(concat(VAULT_MAGIC, u32(headerBytes.length), headerBytes));
    const metadata = Buffer.from(canonicalJSON(await metadataFor(sourcePath, st, { offset, length: rangeLength })), 'utf8');
    await write(encryptRecord({ type: TYPE_METADATA, index: recordIndex++, plaintext: metadata, sharedSecret, salt, noncePrefix, headerDigest }));
    const emitData = async (chunk) => {
      encodedBytes += chunk.length;
      await write(encryptRecord({ type: TYPE_DATA, index: recordIndex++, plaintext: chunk, sharedSecret, salt, noncePrefix, headerDigest }));
      dataRecords++;
    };
    if (compression === 'none') {
      while (remaining > 0) {
        const want = Math.min(chunkBytes, remaining), buf = Buffer.allocUnsafe(want);
        const { bytesRead } = await input.read(buf, 0, want, position);
        if (bytesRead !== want) throw new Error(`short read at source offset ${position}: ${bytesRead}/${want}`);
        const chunk = buf.subarray(0, bytesRead);
        for (const h of Object.values(plainHashes)) h.update(chunk);
        leaves.push(leafHash(chunk));
        await emitData(chunk);
        position += bytesRead; remaining -= bytesRead;
      }
    } else {
      const zstd = spawn('zstd', ['-3', '-T2', '-q', '-c'], { stdio: ['pipe', 'pipe', 'pipe'] });
      const exit = new Promise((resolve, reject) => { zstd.once('error', reject); zstd.once('close', resolve); });
      let stderr = '', pending = Buffer.alloc(0);
      zstd.stderr.setEncoding('utf8'); zstd.stderr.on('data', x => { stderr += x; });
      const consume = (async () => {
        for await (const outChunk of zstd.stdout) {
          pending = Buffer.concat([pending, outChunk]);
          while (pending.length >= chunkBytes) {
            await emitData(pending.subarray(0, chunkBytes));
            pending = pending.subarray(chunkBytes);
          }
        }
        if (pending.length) await emitData(pending);
      })();
      while (remaining > 0) {
        const want = Math.min(chunkBytes, remaining), buf = Buffer.allocUnsafe(want);
        const { bytesRead } = await input.read(buf, 0, want, position);
        if (bytesRead !== want) throw new Error(`short read at source offset ${position}: ${bytesRead}/${want}`);
        const chunk = buf.subarray(0, bytesRead);
        for (const h of Object.values(plainHashes)) h.update(chunk);
        leaves.push(leafHash(chunk));
        if (!zstd.stdin.write(chunk)) await new Promise(resolve => zstd.stdin.once('drain', resolve));
        position += bytesRead; remaining -= bytesRead;
      }
      zstd.stdin.end(); await consume;
      const exitCode = await exit;
      if (exitCode !== 0) throw new Error(`zstd exited ${exitCode}: ${stderr.trim()}`);
    }
    const terminal = {
      profile: VAULT_PROFILE,
      archive_id: resolvedArchiveId,
      part_index: partIndex,
      source_offset: offset,
      source_length: rangeLength,
      compression: header.compression,
      encoded_bytes: encodedBytes,
      data_records: dataRecords,
      plaintext_digests: Object.fromEntries(Object.entries(plainHashes).map(([k, h]) => [k, h.digest('hex')])),
      chunk_blake3_merkle_root: merkleRoot(leaves).toString('hex'),
    };
    await write(encryptRecord({ type: TYPE_FINAL, index: recordIndex++, plaintext: Buffer.from(canonicalJSON(terminal)), sharedSecret, salt, noncePrefix, headerDigest }));
    if (output) { await output.sync(); await output.close(); }
    await input.close();
    return {
      header,
      output_path: outputPath,
      ciphertext_bytes: ciphertextBytes,
      ciphertext_digests: Object.fromEntries(Object.entries(cipherHashes).map(([k, h]) => [k, h.digest('hex')])),
      terminal,
    };
  } catch (error) {
    if (output) try { await output.close(); } catch {}
    try { await input.close(); } catch {}
    throw error;
  }
}

/** Encrypt a readable stream whose own container preserves source metadata. */
export async function encryptReadable({
  readable, outputPath, recipientEncapsKey, streamMetadata = {},
  chunkBytes = DEFAULT_CHUNK_BYTES, partIndex = 0, partCount = 1,
  archiveId = null, encoding = 'opaque-stream',
}) {
  if (!readable || typeof readable[Symbol.asyncIterator] !== 'function') throw new Error('readable must be an async iterable byte stream');
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 64 * 1024 || chunkBytes > 64 * 1024 * 1024)
    throw new Error('chunkBytes must be in 64 KiB..64 MiB');
  const ek = recipientEncapsKey instanceof Uint8Array ? recipientEncapsKey : fromHex(recipientEncapsKey, 'recipientEncapsKey');
  const { sharedSecret, ciphertext: kemCiphertext } = mlkemEncapsulate(ek, randomBytes(32), 'ML-KEM-768');
  const salt = randomBytes(32), noncePrefix = randomBytes(4), resolvedArchiveId = archiveId ?? randomBytes(16).toString('hex');
  const header = {
    profile: VAULT_PROFILE, version: 1, kem: 'ML-KEM-768',
    kdf: 'PB-SHAKE256-domain-separated-v1', aead: 'ChaCha20-Poly1305',
    archive_id: resolvedArchiveId, part_index: partIndex, part_count: partCount,
    source_offset: null, source_length: null, source_size: null,
    chunk_bytes: chunkBytes, compression: encoding,
    kem_ciphertext: Buffer.from(kemCiphertext).toString('hex'),
    salt: salt.toString('hex'), nonce_prefix: noncePrefix.toString('hex'),
  };
  const headerBytes = Buffer.from(canonicalJSON(header), 'utf8');
  const headerDigest = createHash('sha256').update(headerBytes).digest();
  const output = outputPath === '-' ? null : await open(outputPath, 'wx', 0o600);
  const streamHashes = { sha256: createHash('sha256'), sha384: createHash('sha384'), blake2b512: createHash('blake2b512') };
  const cipherHashes = { sha256: createHash('sha256'), sha384: createHash('sha384'), blake2b512: createHash('blake2b512') };
  let ciphertextBytes = 0, streamBytes = 0, recordIndex = 0, dataRecords = 0, pending = Buffer.alloc(0);
  const leaves = [];
  const write = async bytes => {
    if (output) await output.write(bytes);
    else if (!process.stdout.write(bytes)) await new Promise(resolve => process.stdout.once('drain', resolve));
    ciphertextBytes += bytes.length; for (const h of Object.values(cipherHashes)) h.update(bytes);
  };
  const emitData = async chunk => {
    streamBytes += chunk.length; for (const h of Object.values(streamHashes)) h.update(chunk); leaves.push(leafHash(chunk));
    await write(encryptRecord({ type: TYPE_DATA, index: recordIndex++, plaintext: chunk, sharedSecret, salt, noncePrefix, headerDigest }));
    dataRecords++;
  };
  try {
    await write(concat(VAULT_MAGIC, u32(headerBytes.length), headerBytes));
    await write(encryptRecord({ type: TYPE_METADATA, index: recordIndex++, plaintext: Buffer.from(canonicalJSON(streamMetadata)), sharedSecret, salt, noncePrefix, headerDigest }));
    for await (const incoming of readable) {
      pending = Buffer.concat([pending, incoming]);
      while (pending.length >= chunkBytes) { await emitData(pending.subarray(0, chunkBytes)); pending = pending.subarray(chunkBytes); }
    }
    if (pending.length) await emitData(pending);
    const terminal = {
      profile: VAULT_PROFILE, archive_id: resolvedArchiveId, part_index: partIndex,
      stream_bytes: streamBytes, data_records: dataRecords,
      stream_digests: Object.fromEntries(Object.entries(streamHashes).map(([k, h]) => [k, h.digest('hex')])),
      chunk_blake3_merkle_root: merkleRoot(leaves).toString('hex'),
    };
    await write(encryptRecord({ type: TYPE_FINAL, index: recordIndex++, plaintext: Buffer.from(canonicalJSON(terminal)), sharedSecret, salt, noncePrefix, headerDigest }));
    if (output) { await output.sync(); await output.close(); }
    return { header, output_path: outputPath, ciphertext_bytes: ciphertextBytes, ciphertext_digests: Object.fromEntries(Object.entries(cipherHashes).map(([k, h]) => [k, h.digest('hex')])), terminal };
  } catch (error) {
    if (output) try { await output.close(); } catch {}
    throw error;
  }
}

function parseRecord(bytes, offset) {
  if (offset + 13 > bytes.length) throw new Error('truncated record header');
  const type = bytes[offset], index = Number(bytes.readBigUInt64BE(offset + 1));
  const plaintextLength = bytes.readUInt32BE(offset + 9);
  const end = offset + 13 + plaintextLength + 16;
  if (end > bytes.length) throw new Error('truncated record body');
  return { record: { type, index, plaintextLength, ciphertext: bytes.subarray(offset + 13, end - 16), tag: bytes.subarray(end - 16, end) }, end };
}

/** Test/recovery primitive.  Production encryption never calls this. */
export function decryptVaultBytes(bytes, recipientDecapsKey) {
  bytes = Buffer.from(bytes);
  if (!bytes.subarray(0, VAULT_MAGIC.length).equals(VAULT_MAGIC)) throw new Error('bad vault magic');
  const headerLength = bytes.readUInt32BE(VAULT_MAGIC.length);
  const headerStart = VAULT_MAGIC.length + 4, headerEnd = headerStart + headerLength;
  const headerBytes = bytes.subarray(headerStart, headerEnd), header = JSON.parse(headerBytes.toString('utf8'));
  if (header.profile !== VAULT_PROFILE) throw new Error('unsupported vault profile');
  const salt = fromHex(header.salt, 'salt'), noncePrefix = fromHex(header.nonce_prefix, 'nonce_prefix');
  const sharedSecret = mlkemDecapsulate(recipientDecapsKey, fromHex(header.kem_ciphertext, 'kem_ciphertext'), 'ML-KEM-768');
  const headerDigest = createHash('sha256').update(headerBytes).digest();
  let off = headerEnd; const records = [];
  while (off < bytes.length) {
    const parsed = parseRecord(bytes, off); off = parsed.end;
    records.push({ type: parsed.record.type, index: parsed.record.index, plaintext: decryptRecord({ record: parsed.record, sharedSecret, salt, noncePrefix, headerDigest }) });
  }
  return { header, records };
}

export const RECORD_TYPES = Object.freeze({ metadata: TYPE_METADATA, data: TYPE_DATA, final: TYPE_FINAL });
