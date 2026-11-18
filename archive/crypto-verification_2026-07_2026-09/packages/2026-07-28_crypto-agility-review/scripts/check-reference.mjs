import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const referenceRoot = join(root, 'reference', 'from-scratch');
const evidenceRoot = join(root, 'evidence', 'runtime-checks');
const scripts = ['t_keccak.mjs', 't_mlkem.mjs', 't_ref.mjs', 't_node_interop.mjs'];
mkdirSync(evidenceRoot, { recursive: true });

let failed = false;
const combined = [];
for (const script of scripts) {
  const result = spawnSync(process.execPath, [script], {
    cwd: referenceRoot,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  const log = [
    `runtime=${process.version}`,
    `$ node ${script}`,
    `exit=${result.status} signal=${result.signal ?? 'none'}`,
    result.stdout ?? '',
    result.stderr ?? '',
  ].join('\n');
  writeFileSync(join(evidenceRoot, `${script}.log`), log, 'utf8');
  combined.push(log);
  if (result.status !== 0) failed = true;
}
writeFileSync(join(evidenceRoot, 'reference-combined.log'), combined.join('\n\n'), 'utf8');
if (failed) process.exitCode = 1;
else process.stdout.write(`reference: ${scripts.length} suites passed\n`);
