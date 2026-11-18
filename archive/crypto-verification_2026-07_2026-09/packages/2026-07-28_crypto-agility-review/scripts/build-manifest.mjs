import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blake3 } from '@noble/hashes/blake3.js';
import { canonicalizeJson } from '../src/canonical-json.mjs';
import { toHex, utf8 } from '../src/bytes.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const excludedDirectories = new Set(['.git', 'node_modules']);
const excludedFiles = new Set(['MANIFEST.json', 'SHA256SUMS', 'SHA512SUMS']);

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(path);
    if (!entry.isFile() || excludedFiles.has(entry.name) || entry.name.endsWith('.zip')) return [];
    return [path];
  });
}

function hash(name, bytes) {
  return createHash(name).update(bytes).digest('hex');
}

const files = filesBelow(root)
  .map((path) => ({ path, relativePath: relative(root, path).replaceAll('\\', '/') }))
  .sort((a, b) => Buffer.from(a.relativePath).compare(Buffer.from(b.relativePath)))
  .map(({ path, relativePath }) => {
    const bytes = readFileSync(path);
    const stat = statSync(path);
    return {
      path: relativePath,
      byteLength: bytes.byteLength,
      executable: (stat.mode & 0o111) !== 0,
      digests: {
        'pb.hash.blake3-256.v1': toHex(blake3(bytes, { dkLen: 32 })),
        'pb.hash.sha2-256.v1': hash('sha256', bytes),
        'pb.hash.sha2-512.v1': hash('sha512', bytes),
      },
    };
  });

const manifestBody = {
  format: 'ProofBundle-Review-Packet-File-Manifest',
  version: 1,
  pathOrdering: 'unsigned UTF-8 byte order',
  exclusions: ['MANIFEST.json', 'SHA256SUMS', 'SHA512SUMS', '*.zip', '.git/', 'node_modules/'],
  files,
};
const bodyBytes = utf8(canonicalizeJson(manifestBody));
const manifest = {
  ...manifestBody,
  commitment: {
    algorithmId: 'pb.hash.blake3-256.v1',
    value: toHex(blake3(bodyBytes, { dkLen: 32 })),
    committedEncoding: 'RFC 8785 JSON of the manifest without this commitment member',
  },
};

writeFileSync(join(root, 'MANIFEST.json'), `${canonicalizeJson(manifest)}\n`, {
  encoding: 'utf8',
  mode: 0o644,
});
writeFileSync(
  join(root, 'SHA256SUMS'),
  `${files.map((file) => `${file.digests['pb.hash.sha2-256.v1']}  ${file.path}`).join('\n')}\n`,
  { encoding: 'utf8', mode: 0o644 },
);
writeFileSync(
  join(root, 'SHA512SUMS'),
  `${files.map((file) => `${file.digests['pb.hash.sha2-512.v1']}  ${file.path}`).join('\n')}\n`,
  { encoding: 'utf8', mode: 0o644 },
);
process.stdout.write(
  `manifest: ${files.length} files, BLAKE3 ${manifest.commitment.value}\n`,
);
