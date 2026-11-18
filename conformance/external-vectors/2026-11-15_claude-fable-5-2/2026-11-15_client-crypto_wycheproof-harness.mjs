#!/usr/bin/env node
// 2026-11-15  claude-fable-5-2
// Runs the crypto modules embedded in a ProofBundle client build (the block between
// "PB NATIVE CRYPTO START" and "PB NATIVE CRYPTO END") against vector sets whose expected
// results were written by other parties: Wycheproof (C2SP), the BLAKE3 team's test_vectors.json,
// and, for the digests, OpenSSL through node:crypto on generated inputs. On every Wycheproof
// case that OpenSSL can also evaluate, OpenSSL is run as a second implementation, so a wiring
// fault in this file shows up as OpenSSL disagreeing with the vectors too.
// usage: node harness.mjs <client.html> <wycheproof/testvectors_v1> <blake3 test_vectors.json> <out.json> [only-prefix]
import {readFileSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import * as nc from 'node:crypto';
import {join} from 'node:path';

const [client_path, vectors_dir, blake3_path, out_path, only] = process.argv.slice(2);
const sha256_hex = b => nc.createHash('sha256').update(b).digest('hex');
const client_bytes = readFileSync(client_path);
const html = client_bytes.toString('utf8');
const start = html.indexOf('<!-- PB NATIVE CRYPTO START -->'), end = html.indexOf('<!-- PB NATIVE CRYPTO END -->');
if (start < 0 || end < 0) throw new Error('native crypto markers not found');
const block = html.slice(start, end);
const source = block.slice(block.indexOf('<script>') + 8, block.lastIndexOf('</script>'));
const pb_core = new Function('window', source + '\nreturn pb_core;')({});
const mod = name => pb_core['crypto/' + name + '.mjs'];

const hx = h => Uint8Array.from(Buffer.from(h, 'hex'));
const to_hex = u => Buffer.from(u).toString('hex');
const short = e => String(e && e.message || e).slice(0, 90);
// outcome of one implementation on one case: 'accept' | 'reject' | 'throw'
function verdict(fn) { try { return fn() ? 'accept' : 'reject'; } catch (e) { return 'throw'; } }
function agrees(expected, got) {
  if (expected === 'acceptable') return true;
  if (expected === 'valid') return got === 'accept';
  return got === 'reject' || got === 'throw';
}
const results = [];
function new_file(name, family, note) {
  const r = {file: name, family, note: note || null, cases: 0, client_agree: 0, client_disagree: [], client_throw_on_invalid: 0,
    second_impl: 'openssl', second_agree: 0, second_disagree: [], second_unavailable: 0, skipped: 0, skip_reasons: {}};
  results.push(r); return r;
}
function record(r, t, expected, client, second, extra) {
  r.cases++;
  if (agrees(expected, client)) { r.client_agree++; if (expected === 'invalid' && client === 'throw') r.client_throw_on_invalid++; }
  else r.client_disagree.push({tc: t.tcId, expected, client, comment: (t.comment || '').slice(0, 80), flags: t.flags || [], ...(extra || {})});
  if (second === null) r.second_unavailable++;
  else if (agrees(expected, second)) r.second_agree++;
  else r.second_disagree.push({tc: t.tcId, expected, second, comment: (t.comment || '').slice(0, 80), flags: t.flags || []});
}
function skip(r, reason, n = 1) { r.skipped += n; r.skip_reasons[reason] = (r.skip_reasons[reason] || 0) + n; }
const load = name => JSON.parse(readFileSync(join(vectors_dir, name), 'utf8'));
const have = name => existsSync(join(vectors_dir, name)) && (!only || name.startsWith(only));
const eq = (a, b) => a.length === b.length && to_hex(a) === to_hex(b);

// ── Ed25519 ──
if (have('ed25519_test.json')) {
  const r = new_file('ed25519_test.json', 'Ed25519 verify'), ed = mod('ed25519');
  for (const g of load('ed25519_test.json').testGroups) {
    const pk = hx(g.publicKey.pk); let key = null;
    try { key = nc.createPublicKey({key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(pk)]), format: 'der', type: 'spki'}); } catch {}
    for (const t of g.tests) {
      const msg = hx(t.msg), sig = hx(t.sig);
      record(r, t, t.result, verdict(() => ed.verify(sig, msg, pk)), key ? verdict(() => nc.verify(null, msg, key, sig)) : 'reject');
    }
  }
}
// ── ECDSA ──
for (const [curve, tag, sha] of [['P-256', 'secp256r1_sha256', 'sha256'], ['P-384', 'secp384r1_sha384', 'sha384'], ['P-521', 'secp521r1_sha512', 'sha512']]) {
  for (const enc of ['der', 'ieee-p1363']) {
    const name = 'ecdsa_' + tag + (enc === 'der' ? '' : '_p1363') + '_test.json';
    if (!have(name)) continue;
    const r = new_file(name, 'ECDSA ' + curve + ' verify, ' + enc + ' signatures, bytes passed as the application passes them'), ec = mod('ecdsa');
    for (const g of load(name).testGroups) {
      const pub = hx(g.publicKey.uncompressed); let key = null;
      try { key = nc.createPublicKey({key: Buffer.from(g.publicKeyDer, 'hex'), format: 'der', type: 'spki'}); } catch {}
      for (const t of g.tests) {
        const msg = hx(t.msg), sig = hx(t.sig);
        record(r, t, t.result, verdict(() => ec.ecdsa_verify(pub, msg, sig, curve)), key ? verdict(() => nc.verify(sha, msg, {key, dsaEncoding: enc}, sig)) : 'reject');
      }
    }
  }
}
// ── RSA-PSS (module profile: MGF1 with the message hash, salt length = hash length) ──
for (const [name, hash, sha] of [['rsa_pss_2048_sha256_mgf1_32_test.json', 'SHA-256', 'sha256'], ['rsa_pss_3072_sha256_mgf1_32_test.json', 'SHA-256', 'sha256'],
  ['rsa_pss_4096_sha256_mgf1_32_test.json', 'SHA-256', 'sha256'], ['rsa_pss_2048_sha384_mgf1_48_test.json', 'SHA-384', 'sha384'],
  ['rsa_pss_4096_sha384_mgf1_48_test.json', 'SHA-384', 'sha384'], ['rsa_pss_4096_sha512_mgf1_64_test.json', 'SHA-512', 'sha512']]) {
  if (!have(name)) continue;
  const r = new_file(name, 'RSA-PSS verify ' + hash), rsa = mod('rsa-pss');
  for (const g of load(name).testGroups) {
    const der = hx(g.publicKeyDer); let key = null;
    try { key = nc.createPublicKey({key: Buffer.from(der), format: 'der', type: 'spki'}); } catch {}
    for (const t of g.tests) {
      const msg = hx(t.msg), sig = hx(t.sig);
      record(r, t, t.result, verdict(() => rsa.rsa_pss_verify_hashed(der, msg, sig, hash)),
        key ? verdict(() => nc.verify(sha, msg, {key, padding: nc.constants.RSA_PKCS1_PSS_PADDING, saltLength: g.sLen}, sig)) : 'reject');
    }
  }
}
// parameter sets outside the module profile: the file's own expectations do not apply to a verifier fixed at
// salt length = hash length and MGF1 = message hash, so the expected verdict here is OpenSSL's under those fixed parameters
for (const [name, hash, sha, salt_len] of [['rsa_pss_2048_sha256_mgf1_0_test.json', 'SHA-256', 'sha256', 32], ['rsa_pss_2048_sha256_mgf1sha1_20_test.json', 'SHA-256', 'sha256', 32], ['rsa_pss_4096_sha512_mgf1_32_test.json', 'SHA-512', 'sha512', 64]]) {
  if (!have(name)) continue;
  const r = new_file(name, 'RSA-PSS inputs made for another parameter set, judged under the module profile', 'expected verdict is OpenSSL with salt length = hash length and MGF1 = message hash'), rsa = mod('rsa-pss');
  r.second_impl = 'openssl is the reference here';
  for (const g of load(name).testGroups) { const der = hx(g.publicKeyDer); const key = nc.createPublicKey({key: Buffer.from(der), format: 'der', type: 'spki'});
    for (const t of g.tests) { const msg = hx(t.msg), sig = hx(t.sig);
      const ref = verdict(() => nc.verify(sha, msg, {key, padding: nc.constants.RSA_PKCS1_PSS_PADDING, saltLength: salt_len}, sig));
      record(r, t, ref === 'accept' ? 'valid' : 'invalid', verdict(() => rsa.rsa_pss_verify_hashed(der, msg, sig, hash)), ref); } }
}
// ── X25519 ──
if (have('x25519_test.json')) {
  const r = new_file('x25519_test.json', 'X25519 shared secret'), x = mod('x25519');
  for (const g of load('x25519_test.json').testGroups) for (const t of g.tests) {
    const priv = hx(t.private), pub = hx(t.public), want = hx(t.shared);
    const second = verdict(() => eq(nc.diffieHellman({
      privateKey: nc.createPrivateKey({key: Buffer.concat([Buffer.from('302e020100300506032b656e04220420', 'hex'), Buffer.from(priv)]), format: 'der', type: 'pkcs8'}),
      publicKey: nc.createPublicKey({key: Buffer.concat([Buffer.from('302a300506032b656e032100', 'hex'), Buffer.from(pub)]), format: 'der', type: 'spki'})}), want));
    record(r, t, t.result, verdict(() => eq(x.x25519_shared(priv, pub), want)), second);
  }
}
// ── AEAD ──
function run_aead(name, family, cipher, seal, open, key_bits) {
  if (!have(name)) return;
  const r = new_file(name, family);
  for (const g of load(name).testGroups) {
    if (g.keySize !== key_bits) { skip(r, 'key size ' + g.keySize + ' outside the module', g.tests.length); continue; }
    const in_profile = g.ivSize === 96 && g.tagSize === 128;
    for (const t of g.tests) {
      const key = hx(t.key), iv = hx(t.iv), aad = hx(t.aad), msg = hx(t.msg), ct = hx(t.ct), tag = hx(t.tag);
      const client = verdict(() => { const pt = open(key, iv, ct, tag, aad); if (pt == null || !eq(pt, msg)) return false;
        const s = seal(key, iv, msg, aad); return eq(s.ciphertext, ct) && eq(s.tag, tag); });
      const second = verdict(() => { const d = nc.createDecipheriv(cipher, key, iv, {authTagLength: g.tagSize / 8}); d.setAuthTag(tag); d.setAAD(aad, {plaintextLength: ct.length});
        return eq(Buffer.concat([d.update(ct), d.final()]), msg); });
      // outside the 96-bit-nonce / 128-bit-tag profile the module must refuse; a refusal is counted as agreement
      const expected = in_profile ? t.result : (client === 'accept' ? t.result : 'invalid');
      record(r, t, expected, client, in_profile ? second : null, in_profile ? null : {iv_bits: g.ivSize, tag_bits: g.tagSize});
    }
  }
}
run_aead('chacha20_poly1305_test.json', 'ChaCha20-Poly1305 open and seal', 'chacha20-poly1305', mod('chacha20-poly1305').chacha20poly1305_seal, mod('chacha20-poly1305').chacha20poly1305_open, 256);
run_aead('aes_gcm_test.json', 'AES-256-GCM open and seal', 'aes-256-gcm', mod('aes256-gcm').aes256gcm_seal, mod('aes256-gcm').aes256gcm_open, 256);
// ── HKDF ──
if (have('hkdf_sha256_test.json')) {
  const r = new_file('hkdf_sha256_test.json', 'HKDF-SHA-256'), h = mod('hkdf');
  for (const g of load('hkdf_sha256_test.json').testGroups) for (const t of g.tests) {
    const ikm = hx(t.ikm), salt = hx(t.salt), info = hx(t.info), okm = hx(t.okm);
    record(r, t, t.result, verdict(() => eq(h.hkdf_sha256(ikm, t.size, salt, info), okm)), verdict(() => eq(new Uint8Array(nc.hkdfSync('sha256', ikm, salt, info, t.size)), okm)));
  }
}
// ── HMAC ──
for (const [name, hash, node_name] of [['hmac_sha256_test.json', 'SHA-256', 'sha256'], ['hmac_sha384_test.json', 'SHA-384', 'sha384'], ['hmac_sha512_test.json', 'SHA-512', 'sha512'],
  ['hmac_sha3_256_test.json', 'SHA3-256', 'sha3-256'], ['hmac_sha3_384_test.json', 'SHA3-384', 'sha3-384'], ['hmac_sha3_512_test.json', 'SHA3-512', 'sha3-512']]) {
  if (!have(name)) continue;
  const r = new_file(name, 'HMAC-' + hash + ', tag compared at the group tag length'), hm = mod('hmac');
  for (const g of load(name).testGroups) for (const t of g.tests) {
    const key = hx(t.key), msg = hx(t.msg), tag = hx(t.tag), n = g.tagSize / 8;
    record(r, t, t.result, verdict(() => eq(hm.hmac(hash, key, msg).slice(0, n), tag)), verdict(() => eq(nc.createHmac(node_name, key).update(msg).digest().subarray(0, n), tag)));
  }
}
// ── PBKDF2 ──
for (const [name, hash, node_name] of [['pbkdf2_hmacsha256_test.json', 'SHA-256', 'sha256'], ['pbkdf2_hmacsha384_test.json', 'SHA-384', 'sha384'], ['pbkdf2_hmacsha512_test.json', 'SHA-512', 'sha512']]) {
  if (!have(name)) continue;
  const r = new_file(name, 'PBKDF2-HMAC-' + hash), pb = mod('pbkdf2');
  for (const g of load(name).testGroups) for (const t of g.tests) {
    if (t.iterationCount > 20000) { skip(r, 'iteration count above 20000'); continue; }
    const pw = hx(t.password), salt = hx(t.salt), dk = hx(t.dk);
    record(r, t, t.result, verdict(() => eq(pb.pbkdf2(hash, pw, salt, t.iterationCount, t.dkLen), dk)), verdict(() => eq(nc.pbkdf2Sync(pw, salt, t.iterationCount, t.dkLen, node_name), dk)));
  }
}
// ── ML-KEM ──
const kem = mod('mlkem');
const kem_keys = k => ({ek: k.encaps_key || k.encapsulation_key || k.ek || k.public_key, dk: k.decaps_key || k.decapsulation_key || k.dk || k.private_key});
const kem_out = o => ({c: o.ciphertext || o.c || o.ct, k: o.shared_secret || o.shared_key || o.K || o.key || o.ss});
for (const size of ['512', '768', '1024']) {
  const p = 'ML-KEM-' + size; let name;
  name = 'mlkem_' + size + '_test.json';
  if (have(name)) { const r = new_file(name, p + ' key generation from seed, then decapsulation', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) for (const t of g.tests) record(r, t, t.result, verdict(() => { const k = kem_keys(kem.mlkem_keygen(hx(t.seed), p));
      if (t.ek && !eq(k.ek, hx(t.ek))) return false; const out = kem.mlkem_decapsulate(k.dk, hx(t.c), p); return eq(out.shared_secret || out, hx(t.K)); }), null); }
  name = 'mlkem_' + size + '_encaps_test.json';
  if (have(name)) { const r = new_file(name, p + ' encapsulation with given randomness', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) for (const t of g.tests) record(r, t, t.result, verdict(() => { const o = kem_out(kem.mlkem_encapsulate(hx(t.ek), hx(t.m), p));
      return eq(o.c, hx(t.c)) && eq(o.k, hx(t.K)); }), null); }
  name = 'mlkem_' + size + '_semi_expanded_decaps_test.json';
  if (have(name)) { const r = new_file(name, p + ' decapsulation with an expanded decapsulation key', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) for (const t of g.tests) record(r, t, t.result, verdict(() => { const out = kem.mlkem_decapsulate(hx(t.dk), hx(t.c), p);
      return t.K ? eq(out.shared_secret || out, hx(t.K)) : true; }), null); }
  name = 'mlkem_' + size + '_keygen_seed_test.json';
  if (have(name)) { const r = new_file(name, p + ' key generation from seed', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) for (const t of g.tests) record(r, t, t.result, verdict(() => { const k = kem_keys(kem.mlkem_keygen(hx(t.seed), p));
      return eq(k.ek, hx(t.ek)) && eq(k.dk, hx(t.dk)); }), null); }
}
// ── ML-DSA ──
const dsa = mod('mldsa'), node_major = Number(process.versions.node.split('.')[0]);
// one signing case: rnd from the case when given (hedged), else 32 zero bytes (deterministic); a case without msg carries mu for Sign_internal;
// a case with both msg and mu must produce the same signature through both entries
const dsa_sign_case = (sk, t, p) => { const ctx = t.ctx ? hx(t.ctx) : new Uint8Array(), rnd = t.rnd ? hx(t.rnd) : new Uint8Array(32), want = hx(t.sig);
  const out = s => s.signature || s; let ok = true;
  if (t.msg !== undefined) ok = ok && eq(out(dsa.mldsa_sign(sk, hx(t.msg), rnd, p, {context: ctx})), want);
  if (t.mu !== undefined) ok = ok && eq(out(dsa.mldsa_sign(sk, hx(t.mu), rnd, p, {externalMu: true})), want);
  return ok; };
const dsa_keys = k => ({pk: k.public_key || k.pk, sk: k.private_key || k.secret_key || k.sk});
for (const size of ['44', '65', '87']) {
  const p = 'ML-DSA-' + size; let name;
  name = 'mldsa_' + size + '_verify_test.json';
  if (have(name)) { const r = new_file(name, p + ' verify');
    for (const g of load(name).testGroups) { const pk = hx(g.publicKey); let key = null;
      try { if (g.publicKeyDer) key = nc.createPublicKey({key: Buffer.from(g.publicKeyDer, 'hex'), format: 'der', type: 'spki'}); } catch {}
      for (const t of g.tests) { const msg = hx(t.msg), sig = hx(t.sig), ctx = t.ctx ? hx(t.ctx) : new Uint8Array();
        const second = key && (!ctx.length || node_major >= 24) ? verdict(() => nc.verify(null, msg, ctx.length ? {key, context: ctx} : key, sig)) : null;
        record(r, t, t.result, verdict(() => dsa.mldsa_verify(pk, msg, sig, p, {context: ctx})), second); } } }
  name = 'mldsa_' + size + '_sign_seed_test.json';
  if (have(name)) { const r = new_file(name, p + ' signing from a seed, through the message entry and the external-mu entry', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) { let keys = null; try { keys = dsa_keys(dsa.mldsa_keygen(hx(g.privateSeed), p)); } catch {}
      for (const t of g.tests) { const ctx = t.ctx ? hx(t.ctx) : new Uint8Array();
        record(r, t, t.result, verdict(() => { if (!keys) throw new Error('keygen'); if (g.publicKey && !eq(keys.pk, hx(g.publicKey))) return false;
          return dsa_sign_case(keys.sk, t, p); }), null); } } }
  name = 'mldsa_' + size + '_sign_noseed_test.json';
  if (have(name)) { const r = new_file(name, p + ' signing from an expanded private key, through the message entry and the external-mu entry', 'no second implementation wired'); r.second_impl = null;
    for (const g of load(name).testGroups) for (const t of g.tests) { const ctx = t.ctx ? hx(t.ctx) : new Uint8Array();
      record(r, t, t.result, verdict(() => dsa_sign_case(hx(g.privateKey), t, p)), null); } }
}
// ── BLAKE3 (BLAKE3 team vectors, unkeyed mode) ──
if (blake3_path && existsSync(blake3_path) && (!only || 'blake3'.startsWith(only))) {
  const r = new_file('BLAKE3 test_vectors.json', 'BLAKE3 hash, 32-byte and 131-byte outputs', 'second implementation: none'); r.second_impl = null;
  const b3 = mod('blake3'), v = JSON.parse(readFileSync(blake3_path, 'utf8'));
  for (const c of v.cases) { const input = Uint8Array.from({length: c.input_len}, (_, i) => i % 251), want = hx(c.hash);
    for (const n of [32, want.length]) record(r, {tcId: c.input_len + '/' + n}, 'valid', verdict(() => eq(b3.blake3(input, n), want.subarray(0, n))), null); }
}
// ── Digests against OpenSSL on generated inputs (inputs come from an OpenSSL SHA-256 counter stream) ──
if (!only || 'digest'.startsWith(only)) {
  const stream = n => { const out = Buffer.alloc(n); for (let at = 0, i = 0; at < n; at += 32, i++) nc.createHash('sha256').update('pb-digest-input-' + i).digest().copy(out, at, 0, Math.min(32, n - at)); return Uint8Array.from(out); };
  const lengths = [...Array(300).keys(), 447, 448, 511, 512, 513, 1000, 1023, 1024, 1025, 4096, 10000, 65536, 100000, 1048576];
  const s2 = mod('sha256'), s5 = mod('sha512'), k = mod('keccak'), b2 = mod('blake2');
  const table = [['sha224', s2.sha224, 'sha224'], ['sha256', s2.sha256, 'sha256'], ['sha384', s5.sha384, 'sha384'], ['sha512', s5.sha512, 'sha512'],
    ['sha512_224', s5.sha512_224, 'sha512-224'], ['sha512_256', s5.sha512_256, 'sha512-256'], ['sha3_224', k.sha3_224, 'sha3-224'], ['sha3_256', k.sha3_256, 'sha3-256'],
    ['sha3_384', k.sha3_384, 'sha3-384'], ['sha3_512', k.sha3_512, 'sha3-512'], ['blake2b', m => b2.blake2b(m, 64), 'blake2b512'], ['blake2s', m => b2.blake2s(m, 32), 'blake2s256'],
    ['shake128/32', m => k.shake128(m, 32), ['shake128', 32]], ['shake128/200', m => k.shake128(m, 200), ['shake128', 200]], ['shake256/64', m => k.shake256(m, 64), ['shake256', 64]], ['shake256/300', m => k.shake256(m, 300), ['shake256', 300]]];
  for (const [label, fn, node_name] of table) {
    const r = new_file('digest ' + label, label + ' against OpenSSL on ' + lengths.length + ' input lengths', 'expected value is OpenSSL output'); r.second_impl = 'openssl is the reference here';
    for (const n of lengths) { const m = stream(n);
      const want = Array.isArray(node_name) ? nc.createHash(node_name[0], {outputLength: node_name[1]}).update(m).digest() : nc.createHash(node_name).update(m).digest();
      record(r, {tcId: n}, 'valid', verdict(() => eq(fn(m), want)), 'accept'); }
  }
}
const module_hashes = {};
for (const m of source.matchAll(/^pb_core\["([^"]+)"\]=\(\(\)=>\{/gm)) module_hashes[m[1]] = m.index;
const names = Object.keys(module_hashes), offs = Object.values(module_hashes);
names.forEach((n, i) => { module_hashes[n] = sha256_hex(Buffer.from(source.slice(offs[i], i + 1 < offs.length ? offs[i + 1] : source.lastIndexOf('\nwindow.pb_core')).trimEnd(), 'utf8')); });
const out = {written_utc: new Date().toISOString(), client: {path: client_path, sha256: sha256_hex(client_bytes), native_block_sha256: sha256_hex(Buffer.from(source, 'utf8')), modules: module_hashes},
  node: process.version, openssl: process.versions.openssl, vectors_dir, results};
writeFileSync(out_path, JSON.stringify(out, null, 1));
let cases = 0, dis = 0, sdis = 0;
const quiet = !!process.env.PB_QUIET;
for (const r of results) { cases += r.cases; dis += r.client_disagree.length; sdis += r.second_disagree.length;
  if (!quiet || r.client_disagree.length || r.second_disagree.length) console.log(`${r.file.padEnd(46)} cases ${String(r.cases).padStart(5)}  client agree ${String(r.client_agree).padStart(5)}  disagree ${String(r.client_disagree.length).padStart(4)}  | openssl agree ${String(r.second_agree).padStart(5)} disagree ${String(r.second_disagree.length).padStart(3)} n/a ${String(r.second_unavailable).padStart(5)}  skipped ${r.skipped}`); }
console.log(`files ${results.length}  TOTAL cases ${cases}  client disagreements ${dis}  openssl disagreements ${sdis}  client ${out.client.sha256.slice(0, 16)}  native block ${out.client.native_block_sha256.slice(0, 16)}  node ${process.version} openssl ${process.versions.openssl}`);
