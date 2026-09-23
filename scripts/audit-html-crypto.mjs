#!/usr/bin/env node
/*
 * Live audit harness for the cryptographic surface embedded in proofbundle.html.
 *
 * This deliberately boots the shipped HTML in jsdom and calls its own functions.
 * It does not substitute the modular src/ or crypto/ implementations for the
 * browser artifact. The resulting receipt is therefore bound to the HTML hash.
 */

import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const artifactPath = join(repo, 'proofbundle.html');
const htmlBytes = readFileSync(artifactPath);
const html = htmlBytes.toString('utf8');

function hashHex(name, bytes) {
  return createHash(name).update(bytes).digest('hex');
}

function hex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function nodeDigest(name, bytes, options) {
  return createHash(name, options).update(Buffer.from(bytes)).digest('hex');
}

async function boot() {
  const virtualConsole = new VirtualConsole();
  const engineErrors = [];
  virtualConsole.on('jsdomError', (error) => {
    if (!/canvas|clearRect/i.test(error.message)) engineErrors.push(error.message);
  });

  const dom = new JSDOM(html, {
    url: 'https://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      const PageU8 = window.Uint8Array;
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      if (!window.TextEncoder) {
        window.TextEncoder = class {
          encode(value) {
            const native = encoder.encode(value);
            const page = new PageU8(native.length);
            page.set(native);
            return page;
          }
        };
      }
      if (!window.TextDecoder) {
        window.TextDecoder = class {
          decode(value) { return decoder.decode(value); }
        };
      }
      const getRandomValues = (target) => {
        const native = new Uint8Array(target.length);
        webcrypto.getRandomValues(native);
        target.set(native);
        return target;
      };
      Object.defineProperty(window, 'crypto', {
        configurable: true,
        value: {
          getRandomValues,
          subtle: webcrypto.subtle,
          randomUUID: () => webcrypto.randomUUID(),
        },
      });
      if (!window.CryptoKey) window.CryptoKey = globalThis.CryptoKey;
      if (!window.matchMedia) {
        window.matchMedia = () => ({
          matches: false,
          media: '',
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
          onchange: null,
          dispatchEvent() { return false; },
        });
      }
      window.HTMLCanvasElement.prototype.getContext = () => null;
    },
  });

  await new Promise((resolve) => dom.window.addEventListener('load', resolve));
  let selfTests = null;
  for (let i = 0; i < 120 && !(selfTests = dom.window.PB_SELFTEST); i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!selfTests) throw new Error('embedded boot self-tests did not complete');
  return { dom, window: dom.window, selfTests, engineErrors };
}

const startedAt = new Date().toISOString();
const { dom, window: win, selfTests, engineErrors } = await boot();
const functionalChecks = [];
const findings = [];

function check(id, category, ok, observed, expected) {
  functionalChecks.push({ id, category, ok: Boolean(ok), observed, expected });
}

const message = win.eval(`utf8('proofbundle.html cryptographic registry audit')`);
win.__PB_AUDIT_MESSAGE__ = message;

const digestRegistry = win.eval(`PB_DIGESTS.map((d) => ({...d}))`);
const signatureRegistry = win.eval(`PB_SIGS.map((s) => ({...s}))`);

const digestReferences = {
  'SHA-256':  { node: 'sha256' },
  'SHA-384':  { node: 'sha384' },
  'SHA-512':  { node: 'sha512' },
  'SHA3-256': { node: 'sha3-256' },
  'SHA3-384': { node: 'sha3-384' },
  'SHA3-512': { node: 'sha3-512' },
  'BLAKE2b':  { node: 'blake2b512' },
  'BLAKE2s':  { node: 'blake2s256' },
  /* Cross-checked against crypto/blake3.mjs, which does not share the embedded
     PBX implementation. The embedded boot suite separately checks the public
     BLAKE3 "abc" KAT. */
  'BLAKE3':   { expected: 'b424fbcb53499a8f8d35674b19d361d92a24642c0226b5affb91a2db597faf12' },
};

const digestResults = [];
for (const digest of digestRegistry) {
  const actualBytes = await win.eval(`digestBytes(${JSON.stringify(digest.id)}, window.__PB_AUDIT_MESSAGE__)`);
  const actual = hex(actualBytes);
  const reference = digestReferences[digest.id];
  const expected = reference.node
    ? nodeDigest(reference.node, message)
    : reference.expected;
  const ok = actual === expected;
  digestResults.push({ id: digest.id, engine: digest.engine, bytes: actualBytes.length, ok, actual, expected });
  check(`digest:${digest.id}`, 'digest', ok, actual, expected);
}

for (const [id, nodeName, length] of [
  ['SHAKE128', 'shake128', 64],
  ['SHAKE256', 'shake256', 64],
]) {
  win.__PB_AUDIT_SHAKE_LEN__ = length;
  const fn = id === 'SHAKE128' ? 'shake128' : 'shake256';
  const actualBytes = win.eval(`PBKECCAK.${fn}(window.__PB_AUDIT_MESSAGE__, window.__PB_AUDIT_SHAKE_LEN__)`);
  const actual = hex(actualBytes);
  const expected = nodeDigest(nodeName, message, { outputLength: length });
  check(`xof:${id}`, 'xof', actual === expected, actual, expected);
}

const pureShaActual = hex(win.eval(`PBSHA256.sha256(window.__PB_AUDIT_MESSAGE__)`));
const pureShaExpected = nodeDigest('sha256', message);
check('digest:SHA-256:pure-js', 'digest', pureShaActual === pureShaExpected, pureShaActual, pureShaExpected);

const signatureResults = [];
for (const signature of signatureRegistry) {
  const started = performance.now();
  const key = await win.eval(`sigKeygen(${JSON.stringify(signature.id)})`);
  win.__PB_AUDIT_KEY__ = key;
  const sig = await win.eval(`sigSign(${JSON.stringify(signature.id)}, window.__PB_AUDIT_MESSAGE__, window.__PB_AUDIT_KEY__.priv)`);
  win.__PB_AUDIT_SIGNATURE__ = sig;
  const valid = await win.eval(`sigVerify(${JSON.stringify(signature.id)}, window.__PB_AUDIT_MESSAGE__, window.__PB_AUDIT_SIGNATURE__, window.__PB_AUDIT_KEY__.pub)`);
  const tampered = new win.Uint8Array(sig);
  tampered[0] ^= 0x01;
  win.__PB_AUDIT_TAMPERED_SIGNATURE__ = tampered;
  const tamperedAccepted = await win.eval(`sigVerify(${JSON.stringify(signature.id)}, window.__PB_AUDIT_MESSAGE__, window.__PB_AUDIT_TAMPERED_SIGNATURE__, window.__PB_AUDIT_KEY__.pub)`);
  const keyLengths = win.eval(`({
    private_bytes: b64uDecode(window.__PB_AUDIT_KEY__.priv).length,
    public_bytes: b64uDecode(window.__PB_AUDIT_KEY__.pub).length,
  })`);
  const ok = valid === true && tamperedAccepted === false;
  signatureResults.push({
    id: signature.id,
    engine: signature.engine,
    standard: signature.standard,
    private_bytes: keyLengths.private_bytes,
    public_bytes: keyLengths.public_bytes,
    signature_bytes: sig.length,
    valid_round_trip: valid,
    tampered_signature_accepted: tamperedAccepted,
    elapsed_ms: Math.round(performance.now() - started),
    ok,
  });
  check(`signature:${signature.id}`, 'signature', ok,
    { valid_round_trip: valid, tampered_signature_accepted: tamperedAccepted },
    { valid_round_trip: true, tampered_signature_accepted: false });
}

async function runConformanceScope(scopeId) {
  const pairs = win.eval(`PB_RUN_SCOPES[${JSON.stringify(scopeId)}].pairs.map((p) => [...p])`);
  let passed = 0;
  const failures = [];
  for (const [digest, signature] of pairs) {
    win.__PB_AUDIT_DIGEST__ = digest;
    win.__PB_AUDIT_SIGALG__ = signature;
    let cases;
    try {
      cases = await win.eval(`buildRunnerCases(window.__PB_AUDIT_DIGEST__, window.__PB_AUDIT_SIGALG__)`);
    } catch (error) {
      failures.push({ digest, signature, stage: 'build', error: error.message });
      continue;
    }
    for (const item of cases) {
      win.__PB_AUDIT_CASE__ = item;
      const result = await win.eval(`verifyCore(window.__PB_AUDIT_CASE__.bundle, window.__PB_AUDIT_CASE__.opts)`);
      if (result.outcome === item.expected) passed++;
      else failures.push({ digest, signature, expected: item.expected, observed: result.outcome });
    }
  }
  return { scope: scopeId, pairs: pairs.length, cases: pairs.length * 10, passed, failed: failures.length, failures };
}

const conformanceResults = [];
for (const scope of ['classical', 'pq']) {
  const result = await runConformanceScope(scope);
  conformanceResults.push(result);
  check(`conformance:${scope}`, 'seal-verify', result.failed === 0,
    { passed: result.passed, failed: result.failed },
    { passed: result.cases, failed: 0 });
}

/* Reproduce the PB-GENO-1 verifier's missing algorithm-binding check. */
const alternatePrimary = await win.eval(`sigKeygen('Ed25519')`);
win.__PB_AUDIT_ALT_PRIMARY__ = alternatePrimary;
const alternateBundle = win.eval(`({ hdr:{profile:'PB-GENO-1'}, meta:{}, payload:{audit:'alternate algorithms'} })`);
win.__PB_AUDIT_ALT_BUNDLE__ = alternateBundle;
await win.eval(`sealCore(window.__PB_AUDIT_ALT_BUNDLE__, 'SHA-256', 'Ed25519', window.__PB_AUDIT_ALT_PRIMARY__)`);
const alternateWitness = await win.eval(`sigKeygen('ECDSA-P256')`);
win.__PB_AUDIT_ALT_WITNESS__ = alternateWitness;
await win.eval(`(async () => {
  const digest = b64uDecode(window.__PB_AUDIT_ALT_BUNDLE__.seal.digest_b64u);
  const signature = await sigSign('ECDSA-P256', digest, window.__PB_AUDIT_ALT_WITNESS__.priv);
  window.__PB_AUDIT_ALT_BUNDLE__.seal.witness = {
    sig_alg: 'ECDSA-P256',
    pub_b64u: window.__PB_AUDIT_ALT_WITNESS__.pub,
    signature_b64u: b64uEncode(signature),
  };
})()`);
const alternateOutcome = await win.eval(`verifyCore(window.__PB_AUDIT_ALT_BUNDLE__, {})`);
findings.push({
  id: 'PBHTML-F001',
  severity: 'HIGH',
  title: 'PB-GENO-1 verifier does not bind the required algorithm suite',
  reproduced: alternateOutcome.outcome === 'VERIFIED',
  observation: `A PB-GENO-1 bundle using SHA-256 + Ed25519 primary + ECDSA-P256 witness returned ${alternateOutcome.outcome}.`,
  required: 'PB-GENO-1 verification must require SHA3-384, ECDSA-P384 primary, and Ed25519 witness before accepting the profile.',
});

/* Demonstrate that PB-CANON-JSON-1 is not injective over JavaScript values. */
const canonicalCollision = win.eval(`canonicalJSON([]) === canonicalJSON([undefined])`);
const canonicalInvalid = win.eval(`canonicalJSON({a:undefined})`);
findings.push({
  id: 'PBHTML-F002',
  severity: 'MEDIUM',
  title: 'PB-CANON-JSON-1 accepts values outside its apparent JSON domain',
  reproduced: canonicalCollision && canonicalInvalid === '{"a":undefined}',
  observation: `[] and [undefined] canonicalize identically: ${canonicalCollision}; {a:undefined} canonicalizes to ${canonicalInvalid}.`,
  required: 'Reject non-JSON values before sealing and verifying, and publish the exact canonical value domain.',
});

/* Compare the offline and network OTS file headers emitted by this artifact. */
const otsDigest = new win.Uint8Array(32);
otsDigest.fill(0xa5);
win.__PB_AUDIT_OTS_DIGEST__ = otsDigest;
const offlineOts = await win.eval(`otsBuildPending(window.__PB_AUDIT_OTS_DIGEST__, ['https://calendar.invalid'])`);
win.fetch = async () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(0),
});
const networkOts = await win.eval(`otsSubmitToCalendar(window.__PB_AUDIT_OTS_DIGEST__, 'https://calendar.invalid')`);
const otsPrefixLength = win.eval(`OTS_MAGIC.length`) + 1 + 1 + 32;
const otsHeadersMatch = hex(offlineOts.slice(0, otsPrefixLength)) === hex(networkOts.slice(0, otsPrefixLength));
findings.push({
  id: 'PBHTML-F003',
  severity: 'HIGH',
  title: 'Offline and network OpenTimestamps paths emit incompatible file headers',
  reproduced: !otsHeadersMatch,
  observation: `Offline header begins ${hex(offlineOts.slice(0, otsPrefixLength))}; network header begins ${hex(networkOts.slice(0, otsPrefixLength))}.`,
  required: 'Validate both serializers byte-for-byte against the reference OpenTimestamps implementation and add parsing, upgrading, and Bitcoin attestation verification tests.',
});

/* Confirm the documented RFC 3161 limitation is present, not silently resolved. */
const forgedTime = new win.Uint8Array([0x18, 0x0f, ...Buffer.from('20260827123456Z', 'ascii')]);
win.__PB_AUDIT_FORGED_TIME__ = forgedTime;
const extractedForgedTime = win.eval(`rfc3161ExtractGenTime(window.__PB_AUDIT_FORGED_TIME__)`);
findings.push({
  id: 'PBHTML-F004',
  severity: 'HIGH',
  title: 'RFC 3161 response path extracts asserted time without verifying the CMS signature or certificate chain',
  reproduced: extractedForgedTime?.genTime === '2026-08-27T12:34:56Z',
  observation: `A synthetic byte string with no TimeStampResp or CMS signature produced ${extractedForgedTime?.genTime || 'no time'}.`,
  required: 'Parse TimeStampResp structurally, bind the message imprint and nonce, and verify the CMS signature and trust chain before reporting an anchored time.',
});

const bootPassed = selfTests.filter((item) => item.ok).length;
const functionalPassed = functionalChecks.filter((item) => item.ok).length;
const receipt = {
  schema: 'PROOFBUNDLE-HTML-CRYPTO-AUDIT-1',
  started_at: startedAt,
  completed_at: new Date().toISOString(),
  artifact: {
    path: 'proofbundle.html',
    bytes: htmlBytes.length,
    sha256: hashHex('sha256', htmlBytes),
    sha512: hashHex('sha512', htmlBytes),
  },
  environment: {
    node: process.version,
    webcrypto: 'node:crypto.webcrypto',
    jsdom: '24.x dependency resolved by package-lock.json',
  },
  summary: {
    embedded_boot_selftests: { passed: bootPassed, total: selfTests.length },
    functional_audit_checks: { passed: functionalPassed, total: functionalChecks.length },
    digest_dispatch_entries: digestRegistry.length,
    signature_dispatch_entries: signatureRegistry.length,
    conformance_cases: conformanceResults.reduce((sum, item) => sum + item.cases, 0),
    conformance_passed: conformanceResults.reduce((sum, item) => sum + item.passed, 0),
    reproduced_security_findings: findings.filter((item) => item.reproduced).length,
    engine_errors: engineErrors.length,
  },
  digest_results: digestResults,
  signature_results: signatureResults,
  conformance_results: conformanceResults,
  functional_checks: functionalChecks,
  findings,
  engine_errors: engineErrors,
};

console.log(JSON.stringify(receipt, null, 2));
dom.window.close();
process.exit(functionalPassed === functionalChecks.length && bootPassed === selfTests.length ? 0 : 1);
