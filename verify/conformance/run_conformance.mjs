// Run the PB-CONFORMANCE-1.0.0 definition through the client's own verify_bundle.
// Usage: node run_conformance.mjs [--limit N] [--out DIR] [--shard i/N]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';

const HTML = process.env.PB_CLIENT || '/home/falsealias/proofbundle-1.0.0-20261102T084002Z.html';
const DEF = process.env.PB_DEFINITION || '/tmp/2B35D13C-96CB-42D9-A108-206ED2368930.json';
const args = process.argv.slice(2);
const arg = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const LIMIT = Number(arg('--limit', 0)) || 0;
const OUT = arg('--out', path.join(path.dirname(new URL(import.meta.url).pathname), 'results'));
const SHARD = arg('--shard', null);

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const htmlBuf = fs.readFileSync(HTML);
const defBuf = fs.readFileSync(DEF);
const def = JSON.parse(defBuf.toString('utf8'));
let cases = def.cases;
if (SHARD) {
  const [i, n] = SHARD.split('/').map(Number);
  cases = cases.filter((_, k) => k % n === i);
}
if (LIMIT) cases = cases.slice(0, LIMIT);

const meta = {
  spec: def.spec,
  definition_sha256: sha256(defBuf),
  definition_declared_verifier_sha256: def.verifier_sha256,
  definition_declared_engine_sha256: def.engine_sha256,
  definition_declared_generator_sha256: def.generator_sha256,
  client_path: HTML,
  client_sha256: sha256(htmlBuf),
  cases_in_definition: def.cases.length,
  cases_run: cases.length,
  shard: SHARD,
  started_utc: new Date().toISOString(),
  node: process.version,
};

fs.mkdirSync(OUT, { recursive: true });

const dom = new JSDOM(htmlBuf.toString('utf8'), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/proofbundle.html',
  beforeParse(window) {
    // the client expects the platform to supply random bytes and web crypto primitives
    if (!window.crypto) window.crypto = crypto.webcrypto;
    if (!window.crypto.getRandomValues) window.crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
    if (!window.crypto.subtle) window.crypto.subtle = crypto.webcrypto.subtle;
    window.TextEncoder = window.TextEncoder || TextEncoder;
    window.TextDecoder = window.TextDecoder || TextDecoder;
    window.structuredClone = window.structuredClone || structuredClone;
    window.fetch = window.fetch || (() => Promise.reject(new Error('offline')));
  },
});

const waitFor = async (fn, ms = 180000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = fn(); if (v) return v; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('timeout waiting for verify_bundle');
};

const win = dom.window;
const verify = await waitFor(() => (typeof win.verify_bundle === 'function' ? win.verify_bundle : null));
meta.verify_bundle_ready_utc = new Date().toISOString();
meta.verify_bundle_source_sha256 = sha256(String(verify));

const rows = [];
const tally = new Map();     // expected -> {pass, fail}
const gotTally = new Map();
const fails = [];

for (let k = 0; k < cases.length; k++) {
  const cn = cases[k];
  // the client's canonicaliser admits only objects from its own realm, so hand it
  // json round-tripped copies rather than Node-realm objects
  const c = win.JSON.parse(win.JSON.stringify({ bundle: cn.bundle, opts: cn.opts || {}, parents: cn.parents || [] }));
  c.id = cn.id; c.expected_verdict = cn.expected_verdict; c.construction = cn.construction;
  c.digest_alg = cn.digest_alg; c.sig_alg = cn.sig_alg;
  const opts = Object.assign({}, c.opts || {});
  if (typeof opts.now === 'string') {
    // the client gates time on Number.isFinite(opts.now): epoch ms, not an ISO string.
    // the definition stores ISO 8601; convert rather than let it fall back to Date.now().
    const ms = Date.parse(opts.now);
    if (Number.isFinite(ms)) opts.now = ms;
  }
  if (Array.isArray(c.parents) && c.parents.length) opts.parent_bundles = c.parents;
  let got, err = null, result = null;
  try {
    result = await verify(c.bundle, opts);
    got = result && (result.code || result.outcome) || 'NO_CODE';
  } catch (e) {
    got = 'THREW';
    err = String(e && e.stack || e).slice(0, 400);
  }
  const ok = got === c.expected_verdict;
  const t = tally.get(c.expected_verdict) || { pass: 0, fail: 0 };
  ok ? t.pass++ : t.fail++;
  tally.set(c.expected_verdict, t);
  gotTally.set(got, (gotTally.get(got) || 0) + 1);
  rows.push([c.id, c.digest_alg, c.sig_alg, c.expected_verdict, got, ok ? 'PASS' : 'FAIL', (c.construction || '').slice(0, 120), err ? err.slice(0, 160) : ''].join('\t'));
  if (!ok && fails.length < 400) {
    fails.push({ id: c.id, expected: c.expected_verdict, got, construction: c.construction,
      causes: result && result.causes, stage: result && result.stage, error: err });
  }
  if ((k + 1) % 500 === 0) {
    const pct = ((k + 1) / cases.length * 100).toFixed(1);
    console.error(`[${new Date().toISOString()}] ${k + 1}/${cases.length} (${pct}%)`);
  }
}

const total = rows.length;
const passed = rows.filter((r) => r.includes('\tPASS\t')).length;

const summary = Object.assign({}, meta, {
  finished_utc: new Date().toISOString(),
  cases: total,
  passed,
  failed: total - passed,
  pass_rate: total ? +(passed / total * 100).toFixed(4) : null,
  verdicts_expected: tally.size,
  per_verdict: Object.fromEntries([...tally.entries()].sort()),
  got_codes: Object.fromEntries([...gotTally.entries()].sort()),
  fails_sample: fails,
});

fs.writeFileSync(path.join(OUT, 'RESULTS.tsv'), 'case_id\tdigest_alg\tsig_alg\texpected\tgot\tstatus\tconstruction\terror\n' + rows.join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ cases: total, passed, failed: total - passed, verdicts_expected: tally.size }, null, 1));
dom.window.close();
