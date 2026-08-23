#!/usr/bin/env node
// bridge_send_pb.mjs — ProofBundle-gated send. Replaces the regex gate with the REAL verifier.
// Each completion/status claim is SEALED as a ProofBundle (Ed25519, boundary predicate) and run through
// verifyBundle. Append to the bridge ONLY if outcome === 'verified'. Ownership is a deterministic
// boundary predicate {equals:['receipt.owner', <sender>]} over a ledger-verified context.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';
import { sealBundle, verifyBundle } from './proofbundle_verify.mjs';
import { verifyIdentityDeclaration } from './bridge_identity_declaration.mjs';

const BRIDGE = 'C:/Users/alib90/Downloads/ORGANIZED/AGENT_COORDINATION/proofbundles/codex_peer_bridge_20260508';
const LEDGER = BRIDGE + '/ledger.jsonl';
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) args[a.slice(2)] = (process.argv[i+1]?.startsWith('--') ? true : process.argv[++i]) ?? true; }
let text = args.text || '';
if (args.file) { try { text = fs.readFileSync(path.resolve(args.file), 'utf8'); } catch { text = ''; } }
const from = args.from || 'unknown';

const COMPLETION = /\b(up and running|operational|is up|complete|completed|\bdone\b|finished|landed|release|verified|passing|production[- ]?running|on the bridge|works|working)\b/i;
const citedSeqs = t => { const o = new Set(); for (const re of [/sequence\s*=\s*(\d+)/gi, /\bseq\s*=?\s*(\d+)/gi, /#(\d{3,})/g]) { let m; while ((m = re.exec(t))) o.add(m[1]); } return [...o]; };

// cryptographically-verified owner of a cited sequence (via its signed declaration)
function verifiedOwnerOf(seq) {
  try { for (const ln of fs.readFileSync(LEDGER, 'utf8').split(/\r?\n/)) {
    if (!ln) continue; const sm = ln.match(/"sequence":(\d+)/); if (!sm || sm[1] !== String(seq)) continue;
    let r; try { r = JSON.parse(ln); } catch { return { exists: true, owner: null }; }
    const d = r?.payload?.identity_declaration;
    if (d) { try { if (verifyIdentityDeclaration(d).ok) return { exists: true, owner: d.identity_id }; } catch {} }
    return { exists: true, owner: null };
  } } catch {}
  return { exists: false, owner: null };
}
function loadIdentity(file) { return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); }

(async () => {
  // StatePackets are the mandated every-sequence heartbeat (state reports, NOT deliverable claims):
  // they must always pass, else the statefulness enforcer (requires a packet each sequence) and this
  // gate deadlock. They are still Ed25519-sealed + ledgered via the non-claim path. Genuine
  // completion/deliverable assertions (anything that is NOT a StatePacket) still require an owned receipt.
  const isStatePacket = /\bType:\s*StatePacket\b/i.test(text);
  const isClaim = COMPLETION.test(text) && !isStatePacket;
  // build boundary + ctx
  let boundary, ctx;
  if (isClaim) {
    const cited = citedSeqs(text);
    let receipt = null;
    for (const s of cited) { const o = verifiedOwnerOf(s); if (o.exists && o.owner) { receipt = { sequence: Number(s), owner: o.owner }; if (o.owner === from) break; } }
    ctx = { from, receipt: receipt || undefined };
    boundary = { all: [ { present: 'receipt.sequence' }, { equals: ['receipt.owner', from] } ] };
  } else {
    boundary = { equals: ['ok', true] }; ctx = { ok: true };
  }

  // seal with the sender's Ed25519 key (from identity file)
  const idf = args['identity-file'];
  if (!idf) { console.error('GATE(PB): need --identity-file'); process.exit(2); }
  const id = loadIdentity(idf);
  if (!id.private_key_ed25519_pkcs8_hex || !id.public_key_ed25519_spki_hex) { console.error('GATE(PB): identity missing keypair'); process.exit(2); }
  const priv = await crypto.subtle.importKey('pkcs8', Buffer.from(id.private_key_ed25519_pkcs8_hex, 'hex'), { name: 'Ed25519' }, false, ['sign']);
  const rawPub = Buffer.from(id.public_key_ed25519_spki_hex, 'hex').subarray(-32);  // last 32 bytes of spki = raw ed25519

  const bundle = await sealBundle({ payload: text, boundary, privateKey: priv, producerId: from, profile: 'PB-BOUNDARY-1', proofKind: 'signature+boundary' });
  const res = await verifyBundle(bundle, new Uint8Array(rawPub), ctx);

  if (res.outcome !== 'verified') {
    console.error(`GATE(PB): REJECTED  outcome=${res.outcome}  from=${from}  isClaim=${isClaim}`);
    console.error(`  boundary=${JSON.stringify(boundary)}  ctx.receipt=${JSON.stringify(ctx.receipt||null)}`);
    if (res.outcome === 'out-of-bounds') console.error('  -> claim cites no owned receipt (borrowed/none). Cite YOUR OWN signed sequence.');
    process.exit(2);
  }
  // verified -> append via core send (identical args)
  const pass = [];
  for (const k of ['from','to','type','identity-file','file','text']) if (args[k]) pass.push(`--${k}`, String(args[k]));
  const r = spawnSync('node', ['proofbundle_peer_bridge.mjs', 'send', ...pass], { cwd: BRIDGE, encoding: 'utf8' });
  process.stdout.write(r.stdout || ''); if (r.stderr) process.stderr.write(r.stderr);
  console.log(`GATE(PB): ADMITTED via ProofBundle verifier (outcome=verified, bundle_id=${bundle.hdr.bundle_id.slice(0,16)}...)`);
  process.exit(r.status || 0);
})().catch(e => { console.error('GATE(PB): error', e.message); process.exit(3); });
