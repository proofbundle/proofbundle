import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pb, in_realm } from './pb_core.mjs';
const path = process.argv[2]; const raw = readFileSync(path);
const def = JSON.parse(raw); const t0 = Date.now(); let fail = 0; const fails = [];
for (const c0 of def.cases) {
  const c = in_realm(c0); const o = c.opts;
  if (typeof o.now === 'string') o.now = Date.parse(o.now); else delete o.now;
  if (c.parents && c.parents.length) o.parent_bundles = c.parents;
  const r = await pb.verify_bundle(c.bundle, o);
  if (r.code !== c.expected_verdict) { fail++; if (fails.length < 10) fails.push({ id: c.id, expected: c.expected_verdict, actual: r.code, cause: (r.causes[0] || {}).message }); }
}
console.log(JSON.stringify({ runtime: 'node ' + process.version + ', no DOM', definition_sha256: createHash('sha256').update(raw).digest('hex'), cases: def.cases.length, pass: def.cases.length - fail, fail, seconds: (Date.now() - t0) / 1000 }));
for (const f of fails) console.log('FAIL', JSON.stringify(f));
