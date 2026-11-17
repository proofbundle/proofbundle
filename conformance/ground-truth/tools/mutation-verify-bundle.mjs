// 2026-11-16 claude-opus-5-5. Mutation test of verify_bundle in the published client (extracted core, c1d85fd6) against the 1.0.0 definition.
// Each mutant changes one token inside verify_bundle (=== <-> !==, < <-> <=, > <-> >=, && <-> ||, true <-> false, drops one unary !).
// A mutant is detected when any case's verdict differs from the definition's expected verdict, or the run throws or times out.
// usage: node 2026-11-16_mutation-verify-bundle.mjs <definition.json> <out-dir> [max-mutants=240] [jobs=3] [pairs=SHA-256|Ed25519,SHA3-384|ML-DSA-65]
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import * as acorn from 'acorn';
const [, , defPath, out, maxArg = '240', jobsArg = '3', pairsArg = 'SHA-256|Ed25519,SHA3-384|ML-DSA-65'] = process.argv;
const here = new URL('.', import.meta.url).pathname; // expects pb_core_extract.js beside it (see extract_core.mjs)
const src = readFileSync(join(here, 'pb_core_extract.js'), 'utf8');
const def = JSON.parse(readFileSync(defPath, 'utf8'));
const wanted = new Set(pairsArg.split(','));
const subset = def.cases.filter((c) => wanted.has(`${c.digest_alg}|${c.sig_alg}`));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'subset.json'), JSON.stringify({ cases: subset }));
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
const fn = ast.body.find((n) => n.type === 'FunctionDeclaration' && n.id.name === 'verify_bundle');
const swap = { '===': '!==', '!==': '===', '<': '<=', '<=': '<', '>': '>=', '>=': '>', '&&': '||', '||': '&&', 'true': 'false', 'false': 'true', '!': '' };
const sites = [];
for (const t of acorn.tokenizer(src.slice(fn.start, fn.end), { ecmaVersion: 'latest' })) {
  const v = t.value !== undefined && typeof t.value === 'string' ? t.value : (t.type.label || '');
  const text = src.slice(fn.start + t.start, fn.start + t.end);
  if (text in swap && (t.type.label !== 'string')) sites.push({ at: fn.start + t.start, len: t.end - t.start, from: text, to: swap[text] });
}
const max = Number(maxArg), step = Math.max(1, sites.length / max), chosen = [];
for (let i = 0; i < sites.length && chosen.length < max; i += step) chosen.push(sites[Math.floor(i)]);
const lineOf = (pos) => src.slice(0, pos).split('\n').length;
console.log(`verify_bundle: ${fn.end - fn.start} chars, ${sites.length} mutation sites, ${chosen.length} mutants; subset ${subset.length} cases from pairs ${[...wanted].join(', ')}`);
const runner = `import { readFileSync } from 'node:fs';
const { pb, in_realm } = await import(process.argv[2] + '/pb_core.mjs');
const def = JSON.parse(readFileSync(process.argv[3], 'utf8'));
for (const c0 of def.cases) { const c = in_realm(c0); const o = c.opts;
  if (typeof o.now === 'string') o.now = Date.parse(o.now); else delete o.now;
  if (c.parents && c.parents.length) o.parent_bundles = c.parents;
  const r = await pb.verify_bundle(c.bundle, o);
  if (r.code !== c.expected_verdict) { console.log(JSON.stringify({ detected_by: c.id, expected: c.expected_verdict, actual: r.code })); process.exit(1); } }
console.log('{"not_detected":true}');`;
writeFileSync(join(out, 'run-subset.mjs'), runner);
const tsv = join(out, 'mutants.tsv');
writeFileSync(tsv, 'id\tline\tfrom\tto\tstatus\tdetail\n');
// baseline: the unmutated core must pass the subset
const runOne = (dir) => new Promise((res) => {
  const p = spawn(process.execPath, [join(out, 'run-subset.mjs'), dir, join(out, 'subset.json')], { stdio: ['ignore', 'pipe', 'pipe'] });
  let o = '', e = ''; const timer = setTimeout(() => p.kill('SIGKILL'), 120000);
  p.stdout.on('data', (d) => (o += d)); p.stderr.on('data', (d) => (e += d));
  p.on('close', (code, sig) => { clearTimeout(timer); res({ code, sig, o: o.trim(), e: e.trim().split('\n').slice(-1)[0] || '' }); });
});
const mk = (id, text) => { const d = join(out, 'm', id); mkdirSync(d, { recursive: true }); copyFileSync(join(here, 'pb_core.mjs'), join(d, 'pb_core.mjs')); writeFileSync(join(d, 'pb_core_extract.js'), text); return d; };
const base = await runOne(mk('baseline', src));
console.log('baseline:', base.code === 0 ? 'passes the subset' : 'FAILS ' + base.o + ' ' + base.e);
if (base.code !== 0) process.exit(2);
let next = 0, detected = 0, not_detected = 0, crashed = 0; const not_detected_list = [];
async function worker() {
  while (next < chosen.length) {
    const i = next++; const s = chosen[i]; const id = String(i).padStart(4, '0');
    const text = src.slice(0, s.at) + s.to + src.slice(s.at + s.len);
    const r = await runOne(mk(id, text));
    let status, detail;
    if (r.code === 0) { status = 'NOT_DETECTED'; not_detected++; not_detected_list.push({ id, line: lineOf(s.at), from: s.from, to: s.to, context: src.slice(Math.max(0, s.at - 60), s.at + 60).replace(/\s+/g, ' ') }); detail = ''; }
    else if (r.o.startsWith('{"detected_by"')) { status = 'DETECTED'; detected++; detail = r.o; }
    else { status = 'DETECTED_CRASH'; crashed++; detail = (r.sig || '') + ' ' + r.e.slice(0, 160); }
    appendFileSync(tsv, `${id}\t${lineOf(s.at)}\t${s.from}\t${s.to || '(removed)'}\t${status}\t${detail}\n`);
    if ((detected + not_detected + crashed) % 20 === 0) console.log(`${detected + not_detected + crashed}/${chosen.length}: detected ${detected}, crashed ${crashed}, not_detected ${not_detected}`);
  }
}
await Promise.all(Array.from({ length: Number(jobsArg) }, worker));
console.log(`DONE ${chosen.length} mutants: detected ${detected}, detected by crash/timeout ${crashed}, not_detected ${not_detected}; mutation score ${((detected + crashed) / chosen.length * 100).toFixed(1)}%`);
writeFileSync(join(out, 'not_detected_list.json'), JSON.stringify(not_detected_list, null, 1));
for (const s of not_detected_list) console.log(`NOT DETECTED ${s.id} line ${s.line}: '${s.from}' -> '${s.to || '(removed)'}' … ${s.context}`);
