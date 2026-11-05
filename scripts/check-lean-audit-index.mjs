// Fails if a theorem/lemma under lean/ is missing from lean/PrintAxioms.lean, or if a lean/ProofBundle
// module is not imported (transitively) from a build root. Purely structural: it reads source text,
// it does not judge whether any theorem is correct; the axiom result itself comes from `lake env lean PrintAxioms.lean`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = 'lean';
const modDir = join(root, 'ProofBundle');
const files = readdirSync(modDir).filter((f) => f.endsWith('.lean')).map((f) => join(modDir, f));
files.push(join(root, 'Architecture.lean'), join(root, 'ProofBundle.lean'));

const declared = new Set();
for (const f of files) {
  const ns = [];
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    let m = line.match(/^\s*namespace\s+(\S+)/);
    if (m) ns.push(m[1]);
    m = line.match(/^\s*end\s+(\S+)/);
    if (m && ns.length && ns[ns.length - 1] === m[1]) ns.pop();
    m = line.match(/^\s*(?:@\[[^\]]*\]\s*)?(?:protected\s+)?(?:theorem|lemma)\s+(\S+)/);
    if (m) declared.add([...ns, m[1]].join('.'));
  }
}

const audited = new Set(
  [...readFileSync(join(root, 'PrintAxioms.lean'), 'utf8').matchAll(/#print axioms\s+(\S+)/g)].map((m) => m[1]),
);
const unaudited = [...declared].filter((d) => !audited.has(d)).sort();

const imports = new Map();
for (const f of files) {
  const mod = f.replace(/^lean\//, '').replace(/\.lean$/, '').replaceAll('/', '.');
  imports.set(mod, [...readFileSync(f, 'utf8').matchAll(/^import\s+(\S+)/gm)].map((m) => m[1]));
}
const reach = new Set();
const walk = (m) => { if (reach.has(m)) return; reach.add(m); for (const i of imports.get(m) || []) walk(i); };
walk('ProofBundle'); walk('Architecture');
const unreached = [...imports.keys()].filter((m) => m.startsWith('ProofBundle.') && !reach.has(m)).sort();

console.log(`lean declarations: ${declared.size}; audited: ${audited.size}`);
let bad = false;
if (unaudited.length) { bad = true; console.error('theorems not in PrintAxioms.lean:\n  ' + unaudited.join('\n  ')); }
if (unreached.length) { bad = true; console.error('modules not imported from a build root:\n  ' + unreached.join('\n  ')); }
process.exit(bad ? 1 : 0);
