// Regenerates MANIFEST.json: blake3/sha256/sha512 of every source file in
// this directory, hashed with this directory's own from-scratch functions
// (not node:crypto — the manifest of a from-scratch crypto core should not
// depend on an external implementation to describe itself).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { blake3Hex } from './blake3.mjs';
import { sha256 } from './sha256.mjs';
import { sha512 } from './sha512.mjs';

const hex = (b) => Buffer.from(b).toString('hex');
const dir = new URL('.', import.meta.url).pathname;
const skip = new Set(['MANIFEST.json', 'gen-manifest.mjs', 'README.md', 'RESULTS.txt']);

const files = readdirSync(dir)
  .filter((f) => !skip.has(f) && !f.startsWith('.') && statSync(dir + f).isFile())
  .sort();

const manifest = { bundle: 'crypto-core', generated_utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), files: {} };
for (const f of files) {
  const bytes = readFileSync(dir + f);
  manifest.files[f] = {
    bytes: bytes.length,
    blake3: blake3Hex(bytes),
    sha256: hex(sha256(bytes)),
    sha512: hex(sha512(bytes)),
  };
}

writeFileSync(dir + 'MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`MANIFEST.json regenerated: ${files.length} files`);
