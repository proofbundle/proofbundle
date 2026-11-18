#!/usr/bin/env node
// 2026-11-15  claude-fable-5-2  (lane fable-20261115-catchup)
// External-vector review of the crypto modules written on 2026-11-15 in ~/src/proofbundle/crypto by other lanes.
// Expectations come from C2SP Wycheproof; OpenSSL (node:crypto) runs as a second implementation wherever it can,
// so an adapter fault in this file shows up as OpenSSL disagreeing with the vectors as well.
// usage: node this.mjs <crypto dir> <wycheproof/testvectors_v1> <out.json>
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import * as nc from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const [crypto_dir, vectors_dir, out_path] = process.argv.slice(2);
const load_mod = async n => import(pathToFileURL(join(crypto_dir, n)).href);
const sha256_file = n => nc.createHash('sha256').update(readFileSync(join(crypto_dir, n))).digest('hex');
const hx = h => Uint8Array.from(Buffer.from(h, 'hex')), to_hex = u => Buffer.from(u).toString('hex');
const eq = (a, b) => a != null && b != null && a.length === b.length && to_hex(a) === to_hex(b);
const cat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
function verdict(fn) { try { return fn() ? 'accept' : 'reject'; } catch (e) { return 'throw'; } }
const agrees = (exp, got) => exp === 'acceptable' ? true : exp === 'valid' ? got === 'accept' : got !== 'accept';
const results = [];
function new_file(file, module, family, second) { const r = {file, module, module_sha256: sha256_file(module), family, cases: 0, agree: 0, disagree: [], second_impl: second || 'openssl', second_agree: 0, second_disagree: [], second_na: 0, skipped: {}}; results.push(r); return r; }
function record(r, t, exp, got, second) { r.cases++; if (agrees(exp, got)) r.agree++; else r.disagree.push({tc: t.tcId, expected: exp, got, comment: (t.comment || '').slice(0, 90), flags: t.flags || []});
  if (second == null) r.second_na++; else if (agrees(exp, second)) r.second_agree++; else r.second_disagree.push({tc: t.tcId, expected: exp, second, comment: (t.comment || '').slice(0, 90)}); }
const skip = (r, why, n = 1) => { r.skipped[why] = (r.skipped[why] || 0) + n; };
const load = n => JSON.parse(readFileSync(join(vectors_dir, n), 'utf8'));
const have = n => existsSync(join(vectors_dir, n));
const try_cipher = (names, key, iv, opt) => { for (const n of names) { try { nc.createDecipheriv(n, key, iv, opt); return n; } catch {} } return null; };

// ── ECDSA: original module and the strict-DER candidate, DER-encoded signatures ──
for (const m of ['ecdsa.mjs', 'ecdsa.der-strict-20261115.mjs']) { const ec = await load_mod(m);
  for (const [curve, tag, sha] of [['P-256', 'secp256r1_sha256', 'sha256'], ['P-384', 'secp384r1_sha384', 'sha384']]) { const f = 'ecdsa_' + tag + '_test.json'; if (!have(f)) continue;
    const r = new_file(f, m, 'ECDSA ' + curve + ' verify, DER signatures');
    for (const g of load(f).testGroups) { const pub = hx(g.publicKey.uncompressed); let key = null; try { key = nc.createPublicKey({key: Buffer.from(g.publicKeyDer, 'hex'), format: 'der', type: 'spki'}); } catch {}
      for (const t of g.tests) { const msg = hx(t.msg), sig = hx(t.sig);
        record(r, t, t.result, verdict(() => ec.ecdsaVerify(pub, msg, sig, curve) === true), key ? verdict(() => nc.verify(sha, msg, {key, dsaEncoding: 'der'}, sig)) : 'reject'); } } } }
// ── Ed448 ──
if (have('ed448_test.json')) { const ed = await load_mod('ed448.mjs'), r = new_file('ed448_test.json', 'ed448.mjs', 'Ed448 verify');
  for (const g of load('ed448_test.json').testGroups) { const pk = hx(g.publicKey.pk); let key = null; try { key = nc.createPublicKey({key: Buffer.from(g.publicKeyDer, 'hex'), format: 'der', type: 'spki'}); } catch {}
    for (const t of g.tests) { const msg = hx(t.msg), sig = hx(t.sig); record(r, t, t.result, verdict(() => ed.verify(sig, msg, pk) === true), key ? verdict(() => nc.verify(null, msg, key, sig)) : 'reject'); } } }
// ── X448 ──
if (have('x448_test.json')) { const x = await load_mod('x448.mjs'), r = new_file('x448_test.json', 'x448.mjs', 'X448 shared secret');
  for (const g of load('x448_test.json').testGroups) for (const t of g.tests) { const priv = hx(t.private), pub = hx(t.public), want = hx(t.shared);
    const second = verdict(() => eq(nc.diffieHellman({privateKey: nc.createPrivateKey({key: Buffer.concat([Buffer.from('3046020100300506032b656f043a0438', 'hex'), Buffer.from(priv)]), format: 'der', type: 'pkcs8'}),
      publicKey: nc.createPublicKey({key: Buffer.concat([Buffer.from('3042300506032b656f033900', 'hex'), Buffer.from(pub)]), format: 'der', type: 'spki'})}), want));
    record(r, t, t.result, verdict(() => eq(x.x448(priv, pub), want)), second); } }
// ── AEADs with sealed = ciphertext || tag ──
async function aead(file, module, family, seal_name, open_name, cipher_for, key_bits, iv_bits) { if (!have(file)) return; const m = await load_mod(module), r = new_file(file, module, family);
  for (const g of load(file).testGroups) { if (!key_bits.includes(g.keySize) || g.ivSize !== iv_bits || g.tagSize !== 128) { skip(r, `key ${g.keySize} iv ${g.ivSize} tag ${g.tagSize} outside the module`, g.tests.length); continue; }
    const probe = cipher_for(g.keySize), cipher = probe && try_cipher([probe], Buffer.alloc(g.keySize / 8), Buffer.alloc(iv_bits / 8), {authTagLength: 16});
    if (!cipher) r.second_impl = 'none available in this OpenSSL build';
    for (const t of g.tests) { const key = hx(t.key), iv = hx(t.iv), aad = hx(t.aad), msg = hx(t.msg), ct = hx(t.ct), tag = hx(t.tag);
      const got = verdict(() => { const pt = m[open_name](key, iv, cat(ct, tag), aad); if (pt == null || !eq(pt, msg)) return false; return eq(m[seal_name](key, iv, msg, aad), cat(ct, tag)); });
      const second = cipher ? verdict(() => { const d = nc.createDecipheriv(cipher, key, iv, {authTagLength: 16}); d.setAuthTag(tag); d.setAAD(aad, {plaintextLength: ct.length}); return eq(Buffer.concat([d.update(ct), d.final()]), msg); }) : null;
      record(r, t, t.result, got, second); } } }
await aead('chacha20_poly1305_test.json', 'chacha20-poly1305.mjs', 'ChaCha20-Poly1305 open and seal', 'aeadSeal', 'aeadOpen', () => 'chacha20-poly1305', [256], 96);
await aead('xchacha20_poly1305_test.json', 'chacha20-poly1305.mjs', 'XChaCha20-Poly1305 open and seal', 'xchacha20Poly1305Seal', 'xchacha20Poly1305Open', () => null, [256], 192);
await aead('aes_gcm_siv_test.json', 'aes-gcm-siv.mjs', 'AES-GCM-SIV open and seal', 'aeadSeal', 'aeadOpen', bits => `aes-${bits}-gcm-siv`, [128, 256], 96);
// ── AES key wrap, RFC 3394 and RFC 5649 ──
for (const [file, wrap, unwrap, names, iv_hex, family] of [['aes_wrap_test.json', 'keyWrap', 'keyUnwrap', b => [`id-aes${b}-wrap`, `aes${b}-wrap`], 'a6a6a6a6a6a6a6a6', 'AES-KW (RFC 3394)'],
  ['aes_kwp_test.json', 'keyWrapPad', 'keyUnwrapPad', b => [`id-aes${b}-wrap-pad`, `aes${b}-wrap-pad`, `aes-${b}-wrap-pad`], 'a65959a6', 'AES-KWP (RFC 5649)']]) { if (!have(file)) continue;
  const m = await load_mod('aes-keywrap.mjs'), r = new_file(file, 'aes-keywrap.mjs', family + ' unwrap, and wrap on valid cases');
  for (const g of load(file).testGroups) { const cipher = try_cipher(names(g.keySize), Buffer.alloc(g.keySize / 8), Buffer.from(iv_hex, 'hex')); if (!cipher) r.second_impl = 'none available in this OpenSSL build';
    for (const t of g.tests) { const key = hx(t.key), msg = hx(t.msg), ct = hx(t.ct);
      const got = verdict(() => { const pt = m[unwrap](key, ct); if (pt == null || !eq(pt, msg)) return false; return t.result !== 'valid' || eq(m[wrap](key, msg), ct); });
      const second = cipher ? verdict(() => { const d = nc.createDecipheriv(cipher, key, Buffer.from(iv_hex, 'hex')); return eq(Buffer.concat([d.update(ct), d.final()]), msg); }) : null;
      record(r, t, t.result, got, second); } } }
// ── RSA PKCS#1 v1.5 verify ──
{ const rsa = await load_mod('rsa-pkcs1-v15-verify.mjs'); const strip = b => { let i = 0; while (i < b.length - 1 && b[i] === 0) i++; return b.subarray(i); };
  for (const bits of [2048, 3072, 4096, 8192]) for (const [hash, tag, sha] of [['SHA-256', 'sha256', 'sha256'], ['SHA-384', 'sha384', 'sha384'], ['SHA-512', 'sha512', 'sha512']]) { const f = `rsa_signature_${bits}_${tag}_test.json`; if (!have(f)) continue;
    const r = new_file(f, 'rsa-pkcs1-v15-verify.mjs', `RSASSA-PKCS1-v1_5 verify ${bits} ${hash}`);
    for (const g of load(f).testGroups) { const n = strip(hx(g.publicKey?.modulus ?? g.n)), e = strip(hx(g.publicKey?.publicExponent ?? g.e)); let key = null; try { key = nc.createPublicKey({key: Buffer.from(g.publicKeyDer, 'hex'), format: 'der', type: 'spki'}); } catch {}
      for (const t of g.tests) { const msg = hx(t.msg), sig = hx(t.sig);
        record(r, t, t.result, verdict(() => rsa.verifyDigestInfo(hash, n, e, msg, sig) === true), key ? verdict(() => nc.verify(sha, msg, {key, padding: nc.constants.RSA_PKCS1_PADDING}, sig)) : 'reject'); } } } }
// ── scrypt: OpenSSL is the reference; three RFC 7914 outputs written here from memory are checked against OpenSSL first ──
{ const sc = await load_mod('scrypt.mjs'), r = new_file('scrypt grid', 'scrypt.mjs', 'scrypt against OpenSSL on a parameter grid', 'openssl is the reference here'); const te = s => new TextEncoder().encode(s);
  const rfc = [['', '', 16, 1, 1, '77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906'],
    ['password', 'NaCl', 1024, 8, 16, 'fdbabe1c9d3472007856e7190d01e9fe7c6ad7cbc8237830e77376634b3731622eaf30d92e22a3886ff109279d9830dac727afb94a83ee6d8360cbdfa2cc0640'],
    ['pleaseletmein', 'SodiumChloride', 16384, 8, 1, '7023bdcb3afd7348461c06cd81fd38ebfda8fbba904f8e3ea9b543f6545da1f2d5432955613f0fcf62d49705242a9af9e61e85dc0d651e40dfcf017b45575887']];
  r.rfc7914_recalled_vs_openssl = rfc.map(([p, s, N, rr, pp, want]) => to_hex(nc.scryptSync(p, s, 64, {N, r: rr, p: pp, maxmem: 1 << 28})) === want);
  const grid = [...rfc.map(x => [te(x[0]), te(x[1]), x[2], x[3], x[4], 64])]; for (const N of [2, 4, 64, 256]) for (const rr of [1, 2, 8]) for (const pp of [1, 3]) for (const dk of [1, 32, 65, 100]) grid.push([nc.createHash('sha256').update(`p${N}${rr}${pp}${dk}`).digest().subarray(0, (N + dk) % 33), nc.createHash('sha256').update(`s${N}${rr}${pp}${dk}`).digest().subarray(0, (rr * 7 + dk) % 33), N, rr, pp, dk]);
  grid.forEach(([p, s, N, rr, pp, dk], i) => { const want = nc.scryptSync(p, s, dk, {N, r: rr, p: pp, maxmem: 1 << 28}); record(r, {tcId: i, comment: `N=${N} r=${rr} p=${pp} dkLen=${dk}`}, 'valid', verdict(() => eq(sc.scrypt(Uint8Array.from(p), Uint8Array.from(s), N, rr, pp, dk), want)), 'accept'); }); }
writeFileSync(out_path, JSON.stringify({written_utc: new Date().toISOString(), crypto_dir, vectors_dir, node: process.version, openssl: process.versions.openssl, results}, null, 1));
let c = 0, d = 0, s = 0; for (const r of results) { c += r.cases; d += r.disagree.length; s += r.second_disagree.length;
  console.log(`${r.module.padEnd(30)} ${r.file.padEnd(38)} cases ${String(r.cases).padStart(4)} agree ${String(r.agree).padStart(4)} disagree ${String(r.disagree.length).padStart(3)} | openssl agree ${String(r.second_agree).padStart(4)} disagree ${String(r.second_disagree.length).padStart(2)} n/a ${String(r.second_na).padStart(4)}${Object.keys(r.skipped).length ? ' skipped ' + JSON.stringify(r.skipped) : ''}${r.rfc7914_recalled_vs_openssl ? ' rfc7914 strings vs openssl ' + JSON.stringify(r.rfc7914_recalled_vs_openssl) : ''}`); }
console.log(`files ${results.length}  cases ${c}  module disagreements ${d}  openssl disagreements ${s}  node ${process.version} openssl ${process.versions.openssl}`);
for (const r of results) if (r.disagree.length) { const k = {}; for (const x of r.disagree) { const key = `${x.expected}->${x.got} | ${x.comment.slice(0, 60)} | ${x.flags.join(',')}`; k[key] = (k[key] || 0) + 1; } console.log('--', r.module, r.file); for (const [key, n] of Object.entries(k).slice(0, 12)) console.log(`   ${String(n).padStart(3)}  ${key}`); }
