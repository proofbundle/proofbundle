import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const excluded = new Set(['.git', 'node_modules']);

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excluded.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(path);
    return entry.isFile() && entry.name.endsWith('.mjs') ? [path] : [];
  });
}

const files = filesBelow(root).sort();
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${relative(root, file)}\n${result.stderr || result.stdout}\n`);
  }
}

if (failed) process.exitCode = 1;
else process.stdout.write(`syntax: ${files.length} .mjs files passed node --check\n`);
