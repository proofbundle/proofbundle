#!/usr/bin/env node
// 2026-11-24_pb-act.mjs — written by claude-opus-5-5 on 2026-11-24. status: prenormative.
// the action gate meant to replace desktop commander (run/read/write) and rclone (copy) on this machine:
// every agent action is an intent signed by the agent's own keys, determined by the verifier into exactly one verdict
// from src/verdict/verdict.mjs, executed only on VERIFIED, and recorded whole: output bytes go to the terminal and to
// disk as they arrive, digests are taken over the bytes on disk, the verifier countersigns, the record is appended to
// the agent's chain and the global chain (append-only ndjson), written as its own file, and stamped with opentimestamps.
// crypto: the repository's from-scratch ed25519, ml-dsa-65, sha-256, sha3-384, blake3. no node:crypto, no webcrypto.
// no server, no daemon, no polling. nothing is ever deleted: commands that delete are refused (POLICY_DENIED).
//
//   pb-act keygen   --agent ID                      generate the agent's ed25519 + ml-dsa-65 keys (the verifier's: --agent verifier)
//   pb-act run      --agent ID -- CMD ARGS...       gate, run live, record
//   pb-act read     --agent ID FILE                 print a file whole and record its digests
//   pb-act write    --agent ID FILE < bytes         create a new file (refuses to overwrite) and record
//   pb-act copy     --agent ID SRC DST              copy a file or tree without deleting or overwriting; triple-hash before and after
//   pb-act verify                                    recompute every chain, digest and signature; print one verdict per record
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { spawn, spawnSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname), root = process.env.PB_ACT_REPO || path.resolve(here, '../..');
const { sha256 } = await import(root + '/crypto/sha256.mjs');
const { sha3_384 } = await import(root + '/crypto/keccak.mjs');
const { blake3 } = await import(root + '/crypto/blake3.mjs');
const ed = await import(root + '/crypto/ed25519.mjs');
const { mldsaKeygen, mldsaSign, mldsaVerify } = await import(root + '/crypto/mldsa.mjs');
const { VERDICTS } = await import(root + '/src/verdict/verdict.mjs');

const HOME = process.env.PB_ACT_HOME || path.join(os.homedir(), '.proofbundle', 'pb-act');
const KEYS = path.join(HOME, 'keys'), REG = path.join(HOME, 'registry.ndjson'), LEDGER = path.join(HOME, 'ledger.ndjson');
const REC = path.join(HOME, 'records'), OUT = path.join(HOME, 'outputs');
for (const d of [HOME, KEYS, REC, OUT]) fs.mkdirSync(d, { recursive: true, mode: 0o700 });
const hex = b => Buffer.from(b).toString('hex'), unhex = s => Uint8Array.from(Buffer.from(s, 'hex'));
const te = new TextEncoder();
const rand = n => { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return b; };
function canon(v) { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const digests = b => ({ sha256: hex(sha256(b)), sha3_384: hex(sha3_384(b)), blake3: hex(blake3(b)) });
function fileDigests(p) { const b = fs.readFileSync(p); return { path: path.resolve(p), bytes: b.length, ...digests(b) }; }
const DOMAIN = { intent: 'pb-act/1 intent\n', result: 'pb-act/1 result\n' };
const ML = 'ML-DSA-65';
const now = () => ({ utc: new Date().toISOString(), monotonic_ns: process.hrtime.bigint().toString() });

function keyDir(id) { if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(id || '')) throw new Error('agent id must be lowercase [a-z0-9._-]'); return path.join(KEYS, id); }
function loadKeys(id) {
  const d = keyDir(id); if (!fs.existsSync(path.join(d, 'ed25519.seed'))) return null;
  const edSeed = unhex(fs.readFileSync(path.join(d, 'ed25519.seed'), 'utf8').trim()), mlSeed = unhex(fs.readFileSync(path.join(d, 'mldsa65.seed'), 'utf8').trim());
  const k = mldsaKeygen(mlSeed, ML);
  return { id, edSeed, edPub: ed.keyPairFromSeed(edSeed).publicKey, mlSk: k.privateKey, mlPk: k.publicKey };
}
function registry() { const m = new Map(); if (fs.existsSync(REG)) for (const l of fs.readFileSync(REG, 'utf8').split('\n')) if (l.trim()) { const r = JSON.parse(l); m.set(r.agent, r); } return m; }
function keygen(id) {
  const d = keyDir(id); if (fs.existsSync(path.join(d, 'ed25519.seed'))) { console.log(`keys for ${id} already exist; nothing overwritten`); return loadKeys(id); }
  fs.mkdirSync(d, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(d, 'ed25519.seed'), hex(rand(32)) + '\n', { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(path.join(d, 'mldsa65.seed'), hex(rand(32)) + '\n', { mode: 0o600, flag: 'wx' });
  const k = loadKeys(id);
  const entry = { schema: 'pb-act/1 registry', agent: id, genesis_utc: new Date().toISOString(), ed25519_public: hex(k.edPub), mldsa65_public_sha256: hex(sha256(k.mlPk)), mldsa65_public: hex(k.mlPk) };
  entry.identity_sha256 = hex(sha256(te.encode(canon({ agent: id, genesis_utc: entry.genesis_utc, ed25519_public: entry.ed25519_public, mldsa65_public: entry.mldsa65_public }))));
  const self = te.encode(DOMAIN.intent + canon(entry));
  entry.self_signature_ed25519 = hex(ed.sign(self, k.edSeed)); entry.self_signature_mldsa65 = hex(mldsaSign(k.mlSk, self, rand(32), ML, {}));
  fs.appendFileSync(REG, JSON.stringify(entry) + '\n');
  writeOpenSSH(d, id, k);
  console.log(`registered ${id}: ed25519 ${entry.ed25519_public}  ml-dsa-65 sha256(pk) ${entry.mldsa65_public_sha256}  identity ${entry.identity_sha256}`);
  return k;
}
function writeOpenSSH(d, id, k) {
  const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }, str = x => { const b = Buffer.from(x); return Buffer.concat([u32(b.length), b]); };
  const pubBlob = Buffer.concat([str('ssh-ed25519'), str(k.edPub)]), check = Buffer.from(rand(4));
  let priv = Buffer.concat([check, check, str('ssh-ed25519'), str(k.edPub), str(Buffer.concat([Buffer.from(k.edSeed), Buffer.from(k.edPub)])), str('pb-act ' + id)]);
  for (let i = 1; priv.length % 8; i++) priv = Buffer.concat([priv, Buffer.from([i])]);
  const body = Buffer.concat([Buffer.from('openssh-key-v1\0'), str('none'), str('none'), str(''), u32(1), str(pubBlob), str(priv)]).toString('base64').match(/.{1,70}/g).join('\n');
  fs.writeFileSync(path.join(d, 'git-signing-ed25519'), `-----BEGIN OPENSSH PRIVATE KEY-----\n${body}\n-----END OPENSSH PRIVATE KEY-----\n`, { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(path.join(d, 'git-signing-ed25519.pub'), `ssh-ed25519 ${pubBlob.toString('base64')} pb-act ${id}\n`, { mode: 0o644, flag: 'wx' });
}

function ledgerLines() { return fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []; }
function tips(agent) { const L = ledgerLines(); const g = L[L.length - 1]; const a = L.filter(r => r.intent.agent === agent).pop();
  return { global_seq: L.length, global_prev: g ? g.record_sha256 : 'genesis', agent_seq: a ? a.intent.agent_seq + 1 : 0, agent_prev: a ? a.record_sha256 : 'genesis' }; }

// the verifier: one function over explicit state; the first failing check decides; exactly one verdict from the enum
function determine(intent, sigs, reg, tip) {
  if (!intent || intent.schema !== 'pb-act/1 intent' || typeof intent.agent !== 'string' || !['run', 'read', 'write', 'copy'].includes(intent.kind)) return 'MALFORMED';
  const r = reg.get(intent.agent); if (!r) return 'UNKNOWN_SIGNER';
  const msg = te.encode(DOMAIN.intent + canon(intent));
  if (!sigs || !sigs.ed25519 || !sigs.mldsa65) return 'MISSING_SIGNATURE';
  if (!ed.verify(unhex(sigs.ed25519), msg, unhex(r.ed25519_public)) || !mldsaVerify(unhex(r.mldsa65_public), msg, unhex(sigs.mldsa65), ML, {})) return 'INVALID_SIGNATURE';
  if (intent.agent_seq !== tip.agent_seq || intent.agent_prev !== tip.agent_prev || intent.global_seq !== tip.global_seq || intent.global_prev !== tip.global_prev) return 'LINEAGE_INVALID';
  for (const i of intent.inputs || []) { if (!fs.existsSync(i.path)) return 'PAYLOAD_MISSING'; const d = fileDigests(i.path); if (d.sha256 !== i.sha256 || d.sha3_384 !== i.sha3_384 || d.blake3 !== i.blake3) return 'DIGEST_MISMATCH'; }
  if (intent.kind === 'run') { const a = intent.argv || [], cmd = path.basename(a[0] || '');
    if (!a.length) return 'MALFORMED';
    if (/^(rm|rmdir|unlink|shred|truncate|wipefs|mkfs(\..*)?)$/.test(cmd)) return 'POLICY_DENIED';
    if (cmd === 'git' && (a.includes('clean') || (a.includes('reset') && a.includes('--hard')) || (a.includes('push') && (a.includes('--force') || a.includes('-f'))) || (a.includes('branch') && a.includes('-D')))) return 'POLICY_DENIED';
    if (cmd === 'find' && a.includes('-delete')) return 'POLICY_DENIED';
    if (/^(bash|sh|zsh)$/.test(cmd) && a[1] === '-c' && /(^|[;&|\s])(rm|rmdir|unlink|shred)\s/.test(a[2] || '')) return 'POLICY_DENIED'; }
  if (intent.kind === 'write' && fs.existsSync(intent.target)) return 'POLICY_DENIED';
  return 'VERIFIED';
}
function signIntent(k, intent) { const msg = te.encode(DOMAIN.intent + canon(intent)); return { ed25519: hex(ed.sign(msg, k.edSeed)), mldsa65: hex(mldsaSign(k.mlSk, msg, rand(32), ML, {})) }; }
function seal(intent, sigs, verdict, result) {
  const v = loadKeys('verifier'); if (!v) throw new Error('no verifier keys: run  pb-act keygen --agent verifier');
  if (!VERDICTS.includes(verdict)) throw new Error('verdict not in the enum: ' + verdict);
  const body = { schema: 'pb-act/1 record', intent, agent_signatures: sigs, verdict, determined: now(), result };
  const msg = te.encode(DOMAIN.result + canon(body));
  body.verifier_signatures = { ed25519: hex(ed.sign(msg, v.edSeed)), mldsa65: hex(mldsaSign(v.mlSk, msg, rand(32), ML, {})) };
  body.record_sha256 = hex(sha256(te.encode(canon(body))));
  const line = JSON.stringify(body) + '\n'; fs.appendFileSync(LEDGER, line);
  const f = path.join(REC, `${String(intent.global_seq).padStart(7, '0')}_${intent.agent}_${body.record_sha256.slice(0, 16)}.json`);
  fs.writeFileSync(f, line, { flag: 'wx' });
  let ots = 'not stamped (PB_ACT_NO_STAMP)';
  if (!process.env.PB_ACT_NO_STAMP) { const s = spawnSync('ots', ['stamp', f], { encoding: 'utf8', timeout: 60000 }); ots = s.status === 0 ? f + '.ots' : 'ots stamp failed: ' + String(s.stderr || s.error || '').slice(0, 200); }
  process.stderr.write(`[pb-act] ${intent.agent} #${intent.agent_seq} global #${intent.global_seq} ${intent.kind} -> ${verdict}  record ${body.record_sha256}  ${ots}\n`);
  return body;
}
function gate(agent, kind, extra) {
  const k = loadKeys(agent);
  const intent = { schema: 'pb-act/1 intent', agent, kind, cwd: process.cwd(), at: now(), host: os.hostname(), ...tips(agent), ...extra };
  const sigs = k ? signIntent(k, intent) : null; return { intent, sigs, verdict: determine(intent, sigs, registry(), tips(agent)) };
}
async function run(agent, argv) {
  const { intent, sigs, verdict } = gate(agent, 'run', { argv });
  if (verdict !== 'VERIFIED') { seal(intent, sigs, verdict, { executed: false }); process.exitCode = 77; return; }
  const base = path.join(OUT, `${String(intent.global_seq).padStart(7, '0')}_${agent}`), fo = base + '.stdout', fe = base + '.stderr';
  const so = fs.openSync(fo, 'wx'), se = fs.openSync(fe, 'wx'), t0 = process.hrtime.bigint();
  const code = await new Promise(res => { const p = spawn(argv[0], argv.slice(1), { stdio: ['inherit', 'pipe', 'pipe'] });
    p.stdout.on('data', c => { process.stdout.write(c); fs.writeSync(so, c); }); p.stderr.on('data', c => { process.stderr.write(c); fs.writeSync(se, c); });
    p.on('error', e => { fs.writeSync(se, String(e)); res(127); }); p.on('close', c => res(c === null ? 128 : c)); });
  fs.closeSync(so); fs.closeSync(se);
  seal(intent, sigs, verdict, { executed: true, exit_code: code, elapsed_ns: (process.hrtime.bigint() - t0).toString(), stdout: fileDigests(fo), stderr: fileDigests(fe) });
  process.exitCode = code;
}
function read(agent, file) {
  const d = fileDigests(file); const { intent, sigs, verdict } = gate(agent, 'read', { inputs: [d] });
  if (verdict === 'VERIFIED') process.stdout.write(fs.readFileSync(file));
  seal(intent, sigs, verdict, { executed: verdict === 'VERIFIED', bytes_shown: verdict === 'VERIFIED' ? d.bytes : 0 });
}
async function write(agent, file) {
  const chunks = []; for await (const c of process.stdin) chunks.push(c); const b = Buffer.concat(chunks);
  const { intent, sigs, verdict } = gate(agent, 'write', { target: path.resolve(file), content: { bytes: b.length, ...digests(b) } });
  if (verdict === 'VERIFIED') fs.writeFileSync(file, b, { flag: 'wx' });
  seal(intent, sigs, verdict, verdict === 'VERIFIED' ? { executed: true, written: fileDigests(file) } : { executed: false });
}
function walk(p) { const s = fs.statSync(p); if (s.isFile()) return [p]; if (!s.isDirectory()) return []; return fs.readdirSync(p).sort().flatMap(n => walk(path.join(p, n))); }
function copy(agent, src, dst) {
  const files = walk(src), srcRoot = path.resolve(src), dstRoot = path.resolve(dst), single = fs.statSync(src).isFile();
  const before = files.map(fileDigests);
  const plan = before.map(d => ({ ...d, to: single ? dstRoot : path.join(dstRoot, path.relative(srcRoot, d.path)) }));
  const clash = plan.filter(p => fs.existsSync(p.to));
  const manifest = { files: plan.length, bytes: plan.reduce((x, p) => x + p.bytes, 0), entries_sha256: hex(sha256(te.encode(canon(plan)))) };
  const { intent, sigs, verdict: v0 } = gate(agent, 'copy', { inputs: before, destination: dstRoot, manifest });
  const verdict = v0 === 'VERIFIED' && clash.length ? 'POLICY_DENIED' : v0;
  if (verdict !== 'VERIFIED') { seal(intent, sigs, verdict, { executed: false, would_overwrite: clash.map(c => c.to) }); process.exitCode = 77; return; }
  const after = [];
  for (const p of plan) { fs.mkdirSync(path.dirname(p.to), { recursive: true }); fs.copyFileSync(p.path, p.to, fs.constants.COPYFILE_EXCL); const d = fileDigests(p.to);
    const ok = d.sha256 === p.sha256 && d.sha3_384 === p.sha3_384 && d.blake3 === p.blake3; after.push({ to: p.to, ok }); process.stdout.write(`${ok ? 'ok  ' : 'BAD '} ${p.to}\n`); }
  seal(intent, sigs, after.every(x => x.ok) ? 'VERIFIED' : 'DIGEST_MISMATCH', { executed: true, copied: after.length, all_three_digests_match: after.every(x => x.ok), mismatches: after.filter(x => !x.ok).map(x => x.to) });
}
function verify() {
  const reg = registry(), L = ledgerLines(), vk = reg.get('verifier'); let prevG = 'genesis'; const prevA = new Map(), seqA = new Map(); let bad = 0;
  L.forEach((r, i) => { let v = 'VERIFIED'; const { record_sha256, ...core } = r;
    if (hex(sha256(te.encode(canon(core)))) !== record_sha256) v = 'DIGEST_MISMATCH';
    else if (r.intent.global_seq !== i || r.intent.global_prev !== prevG || r.intent.agent_prev !== (prevA.get(r.intent.agent) || 'genesis') || r.intent.agent_seq !== (seqA.get(r.intent.agent) || 0)) v = 'LINEAGE_INVALID';
    else { const ag = reg.get(r.intent.agent), mi = te.encode(DOMAIN.intent + canon(r.intent)); const { verifier_signatures, ...body } = core; const mr = te.encode(DOMAIN.result + canon(body));
      if (!ag && r.verdict !== 'UNKNOWN_SIGNER') v = 'UNKNOWN_SIGNER';
      else if (!ag) { if (!vk || !ed.verify(unhex(verifier_signatures.ed25519), mr, unhex(vk.ed25519_public))) v = 'INVALID_SIGNATURE'; }
      else if (!ed.verify(unhex(r.agent_signatures.ed25519), mi, unhex(ag.ed25519_public)) || !mldsaVerify(unhex(ag.mldsa65_public), mi, unhex(r.agent_signatures.mldsa65), ML, {})) v = 'INVALID_SIGNATURE';
      else if (!vk || !ed.verify(unhex(verifier_signatures.ed25519), mr, unhex(vk.ed25519_public)) || !mldsaVerify(unhex(vk.mldsa65_public), mr, unhex(verifier_signatures.mldsa65), ML, {})) v = 'INVALID_SIGNATURE'; }
    if (v !== 'VERIFIED') bad++;
    console.log(`${String(i).padStart(6)} ${r.intent.agent.padEnd(18)} ${r.intent.kind.padEnd(5)} verdict=${r.verdict.padEnd(16)} integrity=${v}`);
    prevG = record_sha256; prevA.set(r.intent.agent, record_sha256); seqA.set(r.intent.agent, r.intent.agent_seq + 1); });
  console.log(`${L.length} records, ${bad} failing recomputation`); if (bad) process.exitCode = 1;
}
const args = process.argv.slice(2), cmd = args.shift(), ai = args.indexOf('--agent'), agent = ai >= 0 ? args.splice(ai, 2)[1] : null;
if (cmd === 'keygen') keygen(agent);
else if (cmd === 'run') { const dd = args.indexOf('--'); await run(agent, dd >= 0 ? args.slice(dd + 1) : args); }
else if (cmd === 'read') read(agent, args[0]);
else if (cmd === 'write') await write(agent, args[0]);
else if (cmd === 'copy') copy(agent, args[0], args[1]);
else if (cmd === 'verify') verify();
else console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n'));
