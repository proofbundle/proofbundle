// 2026-11-24_verify-nist-acvp-extended.mjs — claude-opus-5-5, 2026-11-24.
// runs the repository's from-scratch modules (crypto/*.mjs; no node:crypto, no webcrypto in any checked path)
// against nist acvp sample vector sets pinned at usnistgov/ACVP-Server 975de31e (manifest:
// vectors/nist-acvp/2026-11-24_SOURCE_MANIFEST_extended.tsv). every test group is reported as run (pass/fail counts)
// or not run, with the reason. scope: published acvp sample vectors; this is not cavp validation or fips 140 certification.
// usage: node scripts/2026-11-24_verify-nist-acvp-extended.mjs [--ldt]   (--ldt also runs the 1 GiB sha-2 large-data tests)
import fs from 'node:fs';
import {sha256, sha224, createSHA256, createSHA224, sha256hex, sha256Bits, sha224Bits} from '../crypto/sha256.mjs';
import {sha512, sha384, sha512_224, sha512_256, createSHA384, createSHA512, createSHA512_224, createSHA512_256, sha512Bits, sha384Bits, sha512_224Bits, sha512_256Bits} from '../crypto/sha512.mjs';
import {sha3_224, sha3_256, sha3_384, sha3_512, shake128, shake256} from '../crypto/keccak.mjs';
import {hmac} from '../crypto/hmac.mjs';
import {kmac128, kmac256, kmacXof128, kmacXof256} from '../crypto/kmac.mjs';
import {cshake128, cshake256} from '../crypto/cshake.mjs';
import {pbkdf2} from '../crypto/pbkdf2.mjs';
import * as ed25519 from '../crypto/ed25519.mjs';
import * as ed448 from '../crypto/ed448.mjs';
import {ecdsaKeygen, ecdsaVerify, ecdsaVerifyDigest} from '../crypto/ecdsa.mjs';
import * as slh from '../crypto/slh-dsa.mjs';
import {expandKey, encryptBlock, decryptBlock, ctrCrypt38a} from '../crypto/aes.mjs';
import {aeadSeal, aeadOpen} from '../crypto/aes-gcm-siv.mjs';
import {keyWrap, keyUnwrap} from '../crypto/aes-keywrap.mjs';
import {aes256gcmSeal, aes256gcmOpen} from '../crypto/aes256-gcm.mjs';
import {x25519Keygen, x25519Shared} from '../crypto/x25519.mjs';
import {x448Keygen} from '../crypto/x448.mjs';

const ROOT = 'vectors/nist-acvp';
const LDT = process.argv.includes('--ldt');
const B = s => Uint8Array.from((s || '').match(/../g) || [], x => parseInt(x, 16));
const H = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const eqHex = (a, b) => H(a) === (b || '').toUpperCase();
const load = (s, f) => { const j = JSON.parse(fs.readFileSync(`${ROOT}/${s}/${f}`, 'utf8')); return Array.isArray(j) ? j[1] : j; };
const bitsToBytes = (msgHex, lenBits) => { const b = B(msgHex); return lenBits % 8 === 0 ? b.subarray(0, lenBits / 8) : null; };

// verify the pinned manifest before anything runs
const manifest = fs.readFileSync(`${ROOT}/2026-11-24_SOURCE_MANIFEST_extended.tsv`, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
for (const [path, , sha] of manifest) if (sha256hex(fs.readFileSync(path)) !== sha) throw new Error('source hash mismatch: ' + path);

const report = { schema: 'ProofBundleConformanceReceipt/v2', suite_family: 'nist acvp sample vectors (extended set)',
  source_repository: 'https://github.com/usnistgov/ACVP-Server', source_commit: '975de31eb83d87039ec88934fdc47d8c312b892d',
  manifest: `${ROOT}/2026-11-24_SOURCE_MANIFEST_extended.tsv`, manifest_sha256: sha256hex(fs.readFileSync(`${ROOT}/2026-11-24_SOURCE_MANIFEST_extended.tsv`)),
  implementation_sources: [], executed_at: new Date().toISOString(), executed_by: 'claude-opus-5-5',
  scope: 'nist acvp published sample vectors run against from-scratch modules; not cavp validation, not fips 140 module certification',
  suites: [] };
for (const f of fs.readdirSync('crypto').filter(f => f.endsWith('.mjs') && !f.startsWith('t_'))) report.implementation_sources.push({ path: 'crypto/' + f, sha256: sha256hex(fs.readFileSync('crypto/' + f)) });

function runSuite(name, handler) {
  const P = load(name, 'prompt.json'), E = load(name, 'expectedResults.json');
  const exp = new Map(E.testGroups.flatMap(g => g.tests.map(t => [t.tcId, { ...t, _group: g }])));
  const suite = { suite: name, groups: [], passed: 0, failed: 0, not_run: 0 };
  for (const g of P.testGroups) {
    const row = { tgId: g.tgId, testType: g.testType, params: Object.fromEntries(Object.entries(g).filter(([k]) => k !== 'tests')), tests: g.tests.length, passed: 0, failed: 0, not_run: 0, reason: null, failures: [] };
    for (const t of g.tests) {
      let r;
      try { r = handler(g, t, exp.get(t.tcId)); } catch (e) { r = { fail: 'exception: ' + e.message }; }
      if (r === true) row.passed++;
      else if (r && r.skip) { row.not_run++; row.reason = r.skip; }
      else { row.failed++; if (row.failures.length < 5) row.failures.push({ tcId: t.tcId, why: (r && r.fail) || 'expected result mismatch' }); }
    }
    suite.passed += row.passed; suite.failed += row.failed; suite.not_run += row.not_run; suite.groups.push(row);
  }
  report.suites.push(suite);
  console.log(`${name.padEnd(26)} passed ${String(suite.passed).padStart(5)}  failed ${String(suite.failed).padStart(4)}  not run ${String(suite.not_run).padStart(5)}`
    + (suite.not_run ? '  (' + [...new Set(suite.groups.filter(x => x.reason).map(x => x.reason))].join('; ') + ')' : ''));
}

// ---- sha-2 / sha-3 ----
const BITS = { 'SHA2-224': sha224Bits, 'SHA2-256': sha256Bits, 'SHA2-384': sha384Bits, 'SHA2-512': sha512Bits, 'SHA2-512-224': sha512_224Bits, 'SHA2-512-256': sha512_256Bits };
const SHA = { 'SHA2-224': [sha224, createSHA224], 'SHA2-256': [sha256, createSHA256], 'SHA2-384': [sha384, createSHA384], 'SHA2-512': [sha512, createSHA512],
  'SHA2-512-224': [sha512_224, createSHA512_224], 'SHA2-512-256': [sha512_256, createSHA512_256], 'SHA3-224': [sha3_224, null], 'SHA3-256': [sha3_256, null], 'SHA3-384': [sha3_384, null], 'SHA3-512': [sha3_512, null] };
function hashHandler(alg) {
  const [f, stream] = SHA[alg], sha3 = alg.startsWith('SHA3');
  return (g, t, e) => {
    if (g.testType === 'AFT') { const m = bitsToBytes(t.msg, t.len); if (!m) { if (BITS[alg]) return eqHex(BITS[alg](B(t.msg), t.len), e.md); return { skip: 'bit-oriented message (len not a multiple of 8): sha-3 module is byte-only' }; } return eqHex(f(m), e.md); }
    if (g.testType === 'MCT') {
      const seedLen = t.len / 8; let seed = B(t.msg).subarray(0, seedLen); const out = [];
      for (let j = 0; j < 100; j++) {
        if (sha3) { let md = seed; for (let i = 0; i < 1000; i++) md = f(md); seed = md; out.push(md); continue; }
        let a = seed, b = seed, c = seed, md;
        for (let i = 0; i < 1000; i++) {
          let m = cat(a, b, c);
          if (g.mctVersion === 'alternate') { if (m.length >= seedLen) m = m.subarray(0, seedLen); else m = cat(m, new Uint8Array(seedLen - m.length)); }
          md = f(m); a = b; b = c; c = md;
        }
        seed = md; out.push(md);
      }
      return out.every((md, i) => eqHex(md, e.resultsArray[i].md)) || { fail: 'mct chain diverges at iteration ' + out.findIndex((md, i) => !eqHex(md, e.resultsArray[i].md)) };
    }
    if (g.testType === 'LDT') {
      if (!LDT) return { skip: 'large data test (1 GiB+) not requested: run with --ldt' };
      if (!stream) return { skip: 'large data test: module has no streaming entry point for ' + alg };
      const L = t.largeMsg; if (L.expansionTechnique !== 'repeating' || L.contentLength % 8) return { skip: 'ldt expansion ' + L.expansionTechnique };
      const unit = B(L.content), total = L.fullLength / 8, chunk = new Uint8Array(1 << 20);
      for (let i = 0; i < chunk.length; i++) chunk[i] = unit[i % unit.length];
      const h = stream(); let left = total; while (left > 0) { const n = Math.min(left, chunk.length); h.update(n === chunk.length ? chunk : chunk.subarray(0, n)); left -= n; }
      return eqHex(h.digest ? h.digest() : h.final(), e.md);
    }
    return { skip: 'test type ' + g.testType };
  };
}
for (const s of ['SHA2-224-1.0', 'SHA2-256-1.0', 'SHA2-384-1.0', 'SHA2-512-1.0', 'SHA2-512-224-1.0', 'SHA2-512-256-1.0']) runSuite(s, hashHandler(s.replace(/-1\.0$/, '')));
for (const s of ['SHA3-224-2.0', 'SHA3-256-2.0', 'SHA3-384-2.0', 'SHA3-512-2.0']) runSuite(s, hashHandler(s.replace(/-2\.0$/, '')));
for (const [s, f] of [['SHAKE-128-FIPS202', shake128], ['SHAKE-256-FIPS202', shake256]]) runSuite(s, (g, t, e) => {
  if (g.testType !== 'AFT') return { skip: 'test type ' + g.testType };
  const m = bitsToBytes(t.msg, t.len); if (!m) return { skip: 'bit-oriented message: byte-only api' };
  if (t.outLen % 8) return { skip: 'bit-oriented output length: byte-only api' };
  return eqHex(f(m, t.outLen / 8), e.md);
});

// ---- hmac / kmac / cshake / pbkdf ----
const HMAC_NAME = { 'SHA2-224': 'SHA-224', 'SHA2-512/224': 'SHA-512/224', 'SHA2-512/256': 'SHA-512/256', 'SHA2-256': 'SHA-256', 'SHA2-384': 'SHA-384', 'SHA2-512': 'SHA-512', 'SHA3-224': 'SHA3-224', 'SHA3-256': 'SHA3-256', 'SHA3-384': 'SHA3-384', 'SHA3-512': 'SHA3-512' };
for (const a of ['SHA2-224','SHA2-256','SHA2-384','SHA2-512','SHA3-224','SHA3-256','SHA3-384','SHA3-512']) runSuite(`HMAC-${a}-2.0`, (g, t, e) => {
  if (t.keyLen % 8 || t.msgLen % 8 || t.macLen % 8) return { skip: 'bit-oriented lengths' };
  let mac; try { mac = hmac(HMAC_NAME[a], B(t.key), B(t.msg)); } catch (err) { if (/Unsupported/.test(err.message)) return { skip: 'hash not offered by crypto/hmac.mjs: ' + HMAC_NAME[a] }; throw err; }
  return eqHex(mac.subarray(0, t.macLen / 8), e.mac);
});
for (const [s, f, fx] of [['KMAC-128-1.0', kmac128, kmacXof128], ['KMAC-256-1.0', kmac256, kmacXof256]]) runSuite(s, (g, t, e) => {
  if (t.keyLen % 8 || t.msgLen % 8 || t.macLen % 8) return { skip: 'bit-oriented lengths' };
  const S = g.hexCustomization ? B(t.customizationHex || '') : (t.customization || '');
  const mac = (g.xof ? fx : f)(B(t.key), B(t.msg), t.macLen / 8, S);
  if (g.testType === 'MVT') return (eqHex(mac, t.mac)) === e.testPassed;
  return eqHex(mac, e.mac);
});
for (const [s, f] of [['cSHAKE-128-1.0', cshake128], ['cSHAKE-256-1.0', cshake256]]) runSuite(s, (g, t, e) => {
  if (g.testType !== 'AFT') return { skip: 'cshake monte carlo: not implemented in this harness' };
  if (g.hexCustomization) return { skip: 'hex customization string' };
  const m = bitsToBytes(t.msg, t.len); if (!m || t.outLen % 8) return { skip: 'bit-oriented lengths' };
  return eqHex(f(m, t.outLen / 8, t.functionName || '', t.customization || ''), e.md);
});
const PB_NAME = { 'SHA2-224': 'SHA-224', 'SHA2-512/224': 'SHA-512/224', 'SHA2-512/256': 'SHA-512/256', 'SHA3-224': 'SHA3-224', 'SHA2-256': 'SHA-256', 'SHA2-384': 'SHA-384', 'SHA2-512': 'SHA-512', 'SHA3-256': 'SHA3-256', 'SHA3-384': 'SHA3-384', 'SHA3-512': 'SHA3-512' };
runSuite('PBKDF-1.0', (g, t, e) => {
  if (!PB_NAME[g.hmacAlg]) return { skip: 'pbkdf2 prf not offered by crypto/pbkdf2.mjs: ' + g.hmacAlg };
  if (t.keyLen % 8) return { skip: 'bit-oriented key length' };
  return eqHex(pbkdf2(PB_NAME[g.hmacAlg], new TextEncoder().encode(t.password), B(t.salt), t.iterationCount, t.keyLen / 8), e.derivedKey);
});

// ---- eddsa / ecdsa / x25519 / x448 ----
runSuite('EDDSA-KeyGen-1.0', (g, t, e) => g.curve === 'ED-25519' ? eqHex(ed25519.keyPairFromSeed(B(e.d)).publicKey, e.q) : g.curve === 'ED-448' ? eqHex(ed448.keyPairFromSeed(B(e.d)).publicKey, e.q) : { skip: g.curve });
runSuite('EDDSA-SigVer-1.0', (g, t, e) => {
  const ctx = B(t.context || ''), mod = g.curve === 'ED-25519' ? ed25519 : ed448;
  const v = g.preHash ? mod.verifyPh(B(t.signature), B(t.message), B(t.q), ctx) : g.curve === 'ED-25519' ? (ctx.length ? ed25519.verifyCtx(B(t.signature), B(t.message), B(t.q), ctx) : ed25519.verify(B(t.signature), B(t.message), B(t.q))) : ed448.verify(B(t.signature), B(t.message), B(t.q), ctx);
  return v === e.testPassed;
});
runSuite('EDDSA-SigGen-1.0', (g, t, e) => {
  // the iut secret is not published; what is checkable is that each published signature verifies under the published key
  const q = B(e._group.q), sig = B(e.signature);
  const ctx = B(t.context || ''), mod = g.curve === 'ED-25519' ? ed25519 : ed448;
  if (g.preHash) return mod.verifyPh(sig, B(t.message), q, ctx);
  return g.curve === 'ED-25519' ? (ctx.length ? ed25519.verifyCtx(sig, B(t.message), q, ctx) : ed25519.verify(sig, B(t.message), q)) : ed448.verify(sig, B(t.message), q, ctx);
});
const DEFAULT_HASH = { 'P-256': 'SHA2-256', 'P-384': 'SHA2-384', 'P-521': 'SHA2-512' };
runSuite('ECDSA-SigVer-FIPS186-5', (g, t, e) => {
  if (!DEFAULT_HASH[g.curve]) return { skip: 'curve not offered by crypto/ecdsa.mjs: ' + g.curve };
  const HF = { 'SHA2-224': sha224, 'SHA2-256': sha256, 'SHA2-384': sha384, 'SHA2-512': sha512, 'SHA2-512/224': sha512_224, 'SHA2-512/256': sha512_256,
    'SHA3-224': sha3_224, 'SHA3-256': sha3_256, 'SHA3-384': sha3_384, 'SHA3-512': sha3_512, 'SHAKE-128': m => shake128(m, 32), 'SHAKE-256': m => shake256(m, 64) }[g.hashAlg];
  if (!HF) return { skip: 'hash ' + g.hashAlg };
  const L = { 'P-256': 32, 'P-384': 48, 'P-521': 66 }[g.curve], pad = h => B(h.padStart(2 * L, '0'));
  let v; try { v = ecdsaVerifyDigest(cat(Uint8Array.of(4), pad(t.qx), pad(t.qy)), HF(B(t.message)), { r: '0x' + (t.r || '0'), s: '0x' + (t.s || '0') }, g.curve); } catch { v = false; }
  return !!v === e.testPassed;
});
runSuite('ECDSA-KeyGen-FIPS186-5', (g, t, e) => {
  if (!DEFAULT_HASH[g.curve]) return { skip: 'curve not offered by crypto/ecdsa.mjs: ' + g.curve };
  const L = { 'P-256': 32, 'P-384': 48, 'P-521': 66 }[g.curve], pad = h => B(h.padStart(2 * L, '0'));
  return eqHex(ecdsaKeygen(pad(e.d), g.curve).publicKey, '04' + e.qx.padStart(2 * L, '0') + e.qy.padStart(2 * L, '0'));
});
runSuite('XECDH-keyGen-RFC7748', (g, t, e) => g.curve === 'Curve25519' ? eqHex(x25519Keygen(B(e.privateKey)).publicKey, e.publicKey) : g.curve === 'Curve448' ? eqHex(x448Keygen(B(e.privateKey)), e.publicKey) : { skip: g.curve });
runSuite('XECDH-SSC-RFC7748', (g, t, e) => e.privateIut ? eqHex(x25519Shared(B(e.privateIut), B(t.publicServer)), e.z) : { skip: 'iut private key not published in the sample; shared secret not checkable' });

// ---- slh-dsa (module implements slh-dsa-sha2-128f only) ----
const SLH = 'SLH-DSA-SHA2-128f';
runSuite('SLH-DSA-keyGen-FIPS205', (g, t, e) => g.parameterSet !== SLH ? { skip: 'parameter set not offered (module is ' + SLH + ' only)' } : (() => { const k = slh.keygen_internal(B(t.skSeed), B(t.skPrf), B(t.pkSeed)); return eqHex(k.secretKey, e.sk) && eqHex(k.publicKey, e.pk); })());
runSuite('SLH-DSA-sigGen-FIPS205', (g, t, e) => {
  if (g.parameterSet !== SLH) return { skip: 'parameter set not offered (module is ' + SLH + ' only)' };
  if (g.preHash === 'preHash') return { skip: 'hashslh-dsa (prehash) not offered' };
  const add = g.deterministic ? null : B(t.additionalRandomness);
  if (g.signatureInterface === 'internal') return eqHex(slh.sign_internal(B(t.message), B(t.sk), add), e.signature);
  const ctx = B(t.context || ''), mp = cat(Uint8Array.of(0, ctx.length), ctx, B(t.message));
  return eqHex(slh.sign_internal(mp, B(t.sk), add), e.signature);
});
runSuite('SLH-DSA-sigVer-FIPS205', (g, t, e) => {
  if (g.parameterSet !== SLH) return { skip: 'parameter set not offered (module is ' + SLH + ' only)' };
  if (g.preHash === 'preHash') return { skip: 'hashslh-dsa (prehash) not offered' };
  const v = g.signatureInterface === 'internal' ? slh.verify_internal(B(t.message), B(t.signature), B(t.pk)) : slh.verifyFips(B(t.signature), B(t.message), B(t.pk), { ctx: B(t.context || '') });
  return v === e.testPassed;
});

// ---- aes ----
runSuite('ACVP-AES-ECB-1.0', (g, t, e) => {
  const enc = g.direction === 'encrypt';
  if (g.testType === 'AFT') { const k = expandKey(B(t.key)), x = B(enc ? t.pt : t.ct), o = new Uint8Array(x.length);
    for (let i = 0; i < x.length; i += 16) o.set((enc ? encryptBlock : decryptBlock)(k, x.subarray(i, i + 16)), i); return eqHex(o, enc ? e.ct : e.pt); }
  if (g.testType === 'MCT') {
    let key = B(t.key), inp = B(enc ? t.pt : t.ct); const kl = key.length;
    for (let i = 0; i < 100; i++) {
      const r = e.resultsArray[i]; if (!eqHex(key, r.key) || !eqHex(inp, enc ? r.pt : r.ct)) return { fail: 'mct state diverges at outer ' + i };
      const k = expandKey(key); let cur = inp, c998 = null;
      for (let j = 0; j < 1000; j++) { const o = (enc ? encryptBlock : decryptBlock)(k, cur); if (j === 998) c998 = o; cur = o; }
      const c999 = cur; if (!eqHex(c999, enc ? r.ct : r.pt)) return { fail: 'mct output diverges at outer ' + i };
      const x = kl === 16 ? c999 : kl === 24 ? cat(c998.subarray(8), c999) : cat(c998, c999);
      key = key.map((b, idx) => b ^ x[idx]); inp = c999;
    }
    return true;
  }
  return { skip: 'test type ' + g.testType };
});
runSuite('ACVP-AES-CTR-1.0', (g, t, e) => {
  if (g.testType !== 'AFT') return { skip: 'test type ' + g.testType };
  if (t.payloadLen % 8) return { skip: 'bit-oriented payload' };
  const iv = B(e.iv || t.iv); if (!iv.length) return { skip: 'counter block not published' };
  const k = expandKey(B(t.key)), x = B(g.direction === 'encrypt' ? t.pt : t.ct);
  return eqHex(ctrCrypt38a(k, iv, x), g.direction === 'encrypt' ? e.ct : e.pt);
});
runSuite('ACVP-AES-GCM-1.0', (g, t, e) => {
  if (g.keyLen !== 256) return { skip: 'gcm with ' + g.keyLen + '-bit keys: crypto/aes256-gcm.mjs is aes-256 only' };
  if (g.ivLen !== 96 || g.tagLen !== 128) return { skip: 'iv/tag length other than 96/128' };
  if (g.direction === 'encrypt') { const o = aes256gcmSeal(B(t.key), B(t.iv), B(t.pt), B(t.aad)); return eqHex(o.ciphertext || o.slice?.(0, -16), e.ct) && eqHex(o.tag || o.slice?.(-16), e.tag); }
  let p; try { p = aes256gcmOpen(B(t.key), B(t.iv), B(t.ct), B(t.tag), B(t.aad)); } catch { p = null; }
  return e.testPassed === false ? p === null || p === false : eqHex(p, e.pt);
});
runSuite('ACVP-AES-GCM-SIV-1.0', (g, t, e) => {
  if (g.direction === 'encrypt') return eqHex(aeadSeal(B(t.key), B(t.iv), B(t.pt), B(t.aad)), e.ct);
  let p; try { p = aeadOpen(B(t.key), B(t.iv), B(t.ct), B(t.aad)); } catch { p = null; }
  return e.testPassed === false ? !p : eqHex(p, e.pt);
});
runSuite('ACVP-AES-KW-1.0', (g, t, e) => {
  if (g.kwCipher && g.kwCipher !== 'cipher') return { skip: 'inverse-cipher key wrap variant' };
  if (g.payloadLen % 64) return { skip: 'payload not a multiple of 64 bits (kwp territory)' };
  if (g.direction === 'encrypt') return eqHex(keyWrap(B(t.key), B(t.pt)), e.ct);
  let p; try { p = keyUnwrap(B(t.key), B(t.ct)); } catch { p = null; }
  return e.testPassed === false ? !p : eqHex(p, e.pt);
});

const totals = report.suites.reduce((a, s) => ({ passed: a.passed + s.passed, failed: a.failed + s.failed, not_run: a.not_run + s.not_run }), { passed: 0, failed: 0, not_run: 0 });
report.totals = totals;
const out = 'conformance/nist-acvp-extended/2026-11-24_acvp-extended-results' + (LDT ? '_with-ldt' : '') + '.json';
fs.mkdirSync('conformance/nist-acvp-extended', { recursive: true }); fs.writeFileSync(out, JSON.stringify(report, null, 1) + '\n');
console.log(`totals: passed ${totals.passed}  failed ${totals.failed}  not run ${totals.not_run}  -> ${out}`);
if (totals.failed) process.exitCode = 1;
