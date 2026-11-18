import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const proofRoot = join(root, 'proofs', 'coq');
const evidenceRoot = join(root, 'evidence', 'proof-checks');
const forbidden = /^\s*(?:Axioms?|Parameters?|Hypotheses?)\b|(?:^|\s)(?:Admitted|admit)\s*\./m;

function stripComments(source) {
  let depth = 0;
  let result = '';
  for (let index = 0; index < source.length; index += 1) {
    if (source.slice(index, index + 2) === '(*') {
      depth += 1;
      index += 1;
    } else if (source.slice(index, index + 2) === '*)' && depth > 0) {
      depth -= 1;
      index += 1;
    } else if (depth === 0) {
      result += source[index];
    }
  }
  if (depth !== 0) throw new Error('unterminated Coq comment');
  return result;
}

const files = readdirSync(proofRoot)
  .filter((name) => name.endsWith('.v'))
  .sort();
for (const name of files) {
  const source = stripComments(readFileSync(join(proofRoot, name), 'utf8'));
  if (forbidden.test(source)) {
    throw new Error(`${name}: forbidden unclosed assumption or admission command`);
  }
}

const candidates = [
  process.env.JSCOQ,
  '/tmp/proofbundle-jscoq/node_modules/.bin/jscoq',
  ...process.env.PATH.split(delimiter).map((directory) => join(directory, 'jscoq')),
].filter(Boolean);
const jscoq = candidates.find(existsSync);
if (!jscoq) {
  throw new Error(
    'jscoq CLI not found; set JSCOQ to a jscoq 0.17.1 executable or install that version',
  );
}

mkdirSync(evidenceRoot, { recursive: true });
const version = spawnSync(jscoq, ['--version'], {
  encoding: 'utf8',
  windowsHide: true,
});
let failed = false;
const combined = [];
for (const name of files) {
  const path = join(proofRoot, name);
  // JSCoq 0.17.1's `run --compile` option does not assign its compile
  // configuration in the CLI implementation. `-l` issues Coq's Load command,
  // which parses and checks every declaration and returns non-zero on failure.
  const result = spawnSync(jscoq, ['run', '-l', path], {
    cwd: proofRoot,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  const log = [
    `checker=jscoq ${version.stdout.trim()}`,
    'mode=Coq Load command (full parse and type-check; no .vo emitted)',
    `$ ${jscoq} run -l ${relative(proofRoot, path)}`,
    `exit=${result.status} signal=${result.signal ?? 'none'}`,
    result.stdout ?? '',
    result.stderr ?? '',
  ].join('\n');
  writeFileSync(join(evidenceRoot, `${name}.log`), log, 'utf8');
  combined.push(log);
  if (result.status !== 0) failed = true;
}
writeFileSync(join(evidenceRoot, 'jscoq-combined.log'), combined.join('\n\n'), 'utf8');
if (failed) process.exitCode = 1;
else process.stdout.write(`proofs: ${files.length} Coq files type-checked with jscoq ${version.stdout.trim()}\n`);
