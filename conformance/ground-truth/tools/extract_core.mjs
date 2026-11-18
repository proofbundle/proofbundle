// Extract, verbatim, the client code the agent server needs: the PBKECCAK and PB_CORE crypto scripts whole,
// and from the main script the transitive closure of top-level declarations reachable from ROOTS.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as acorn from 'acorn';
const [,, html_path, out_path] = process.argv;
const html = readFileSync(html_path, 'utf-8');
const scripts = [...html.matchAll(/<script(?![^>]*type="application\/(?:json|octet-stream)")([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => m[2]);
const keccak = scripts.find((s) => s.includes('var pbkeccak'));
const core = scripts.find((s) => s.includes('const pb_core = Object.create(null);'));
const main = scripts.find((s) => s.includes('async function verify_bundle(bundle, opts)'));
const ast = acorn.parse(main, { ecmaVersion: 'latest', sourceType: 'script' });
const decls = new Map();
for (const n of ast.body) {
  const names = n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration' ? [n.id.name]
    : n.type === 'VariableDeclaration' ? n.declarations.flatMap((d) => d.id.type === 'Identifier' ? [d.id.name] : []) : [];
  for (const nm of names) decls.set(nm, n);          // last declaration wins, as in the page
}
const roots = ['verify_bundle', 'pb_generate_conformance', 'pb_boundary_check', 'pb_is_verified', 'pb_verdict_family', 'seal_core', 'sig_keygen', 'sig_sign', 'sig_verify',
  'digest_bytes', 'merkle_root_alg', 'canonical_json', 'parse_native_json', 'b64u_encode', 'b64u_decode', 'make_id', 'hex_of', 'utf8', 'leaf_hash_bytes', 'root_from_leaf_hashes',
  'proof_from_leaf_hashes', 'verify_leaf_proof', 'merkle_root_bytes_alg', 'native_random', 'pb_spec_ver', 'pb_digests', 'pb_sigs', 'digest_info', 'sig_info', 'pb_registry', 'pb_verdicts'];
const want = new Set(), queue = [...roots];
const ids = (node) => { const out = new Set(); (function walk(x) { if (!x || typeof x !== 'object') return; if (Array.isArray(x)) return x.forEach(walk); if (x.type === 'Identifier') out.add(x.name); for (const k in x) if (k !== 'type' && k !== 'start' && k !== 'end') walk(x[k]); })(node); return out; };
while (queue.length) { const nm = queue.shift(); const n = decls.get(nm); if (!n || want.has(n)) continue; want.add(n); for (const i of ids(n)) if (decls.has(i) && !want.has(decls.get(i))) queue.push(i); }
const picked = ast.body.filter((n) => want.has(n));
const text = picked.map((n) => main.slice(n.start, n.end)).join('\n');
const dom = [...new Set([...text.matchAll(/\b(document|window|localStorage|navigator|location|indexedDB)\b/g)].map((m) => m[1]))];
const src_sha = createHash('sha256').update(readFileSync(html_path)).digest('hex');
const out = `/* ProofBundle core for Node — extracted verbatim by extract_core.mjs from ${html_path.split('/').pop()}
   (sha256 ${src_sha}). pbkeccak and pb_core scripts whole; ${picked.length} top-level declarations of the main script. Do not edit: regenerate. */
${keccak}
${core}
${text}
`;
writeFileSync(out_path, out);
console.log(JSON.stringify({ declarations: picked.length, names: picked.map((n) => n.id ? n.id.name : n.declarations.map((d) => d.id.name).join(',')), dom_refs: dom, bytes: out.length }));
