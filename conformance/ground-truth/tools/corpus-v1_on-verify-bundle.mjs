// 2026-11-17 claude-opus-5-5. Run the May 2026 corpus (vectors_v1.json, 300) through verify_bundle of a client core extract
// (default: gate/pb_core_extract.js = published c1d85fd6) and record each vector's expected class beside the client's verdict code.
// usage: node 2026-11-17_corpus-v1_on-verify-bundle.mjs [vectors_v1.json] [out.tsv]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const G = new URL('../tools/', import.meta.url).pathname;
const { pb, in_realm } = await import(G + 'pb_core.mjs');
const [, , vp = new URL('../corpus-v1/vectors_v1.json', import.meta.url).pathname, out = 'corpus-v1_published-c1d85fd6.tsv'] = process.argv;
const raw = readFileSync(vp); const v = JSON.parse(raw); const rows = [['id', 'category', 'expected_class', 'client_code', 'stage', 'predicate', 'message']];
for (const x of v) { const i = x.input || {}; let r;
  try { r = await pb.verify_bundle(in_realm(i.bundle), in_realm({ context: i.context || {}, pub_override: i.public_key_b64u, parent_bundles: i.parent_bundles || [],
    limits: Number.isFinite(i.max_bundle_bytes) ? { max_bundle_bytes: i.max_bundle_bytes } : undefined, now: i.context && i.context._now ? Date.parse(i.context._now) : undefined })); }
  catch (e) { r = { code: 'THREW', causes: [{ message: String(e && e.message) }] }; }
  const c = r.causes && r.causes[0] || {}; rows.push([x.id, x.category, x.expected_outcome, r.code, c.stage || '', c.predicate || '', String(c.message || '').slice(0, 160)].map((s) => String(s).replace(/[\t\n]/g, ' '))); }
writeFileSync(out, rows.map((r) => r.join('\t')).join('\n') + '\n');
console.log(JSON.stringify({ vectors_sha256: createHash('sha256').update(raw).digest('hex'), core_sha256: createHash('sha256').update(readFileSync(G + 'pb_core_extract.js')).digest('hex'), vectors: v.length, out }));
