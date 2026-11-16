// Canonical-form test for the DER decoder, and a differential against the
// build it is meant to replace.
//
// Requirement: for one (r, s) there is exactly one byte string a verifier
// accepts. Anything else -- trailing bytes, a wrong SEQUENCE length, a
// long-form length where the short form fits, a non-minimal INTEGER, a
// negative INTEGER -- must be rejected, because signature bytes get hashed
// into envelopes and Merkle leaves and one signing event must not have
// several hashes.
//
// candidate: ./ecdsa.der-strict-20261115.mjs (strict decoder)
// original:  ./ecdsa.mjs                     (permissive decoder, unchanged)
//
// The candidate assertions are the test. The original's behaviour is
// measured and printed so the delta is visible while the merge decision is
// open; those lines do not fail the run.
import { ecdsaVerify as verifyStrict, ecdsaSign as signStrict, ecdsaKeygen as keygenStrict,
         _internals as strictInternals } from './ecdsa.der-strict-20261115.mjs';
import { ecdsaVerify as verifyOrig } from './ecdsa.mjs';
import { generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from 'node:crypto';

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}

const NODE_CURVE = { 'P-256': 'prime256v1', 'P-384': 'secp384r1' };
const unb = (s) => Uint8Array.from(Buffer.from(s, 'base64url'));

function nodeKey(curve) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: NODE_CURVE[curve] });
  const jwk = publicKey.export({ format: 'jwk' });
  const raw = new Uint8Array(1 + 2 * unb(jwk.x).length);
  raw[0] = 0x04;
  raw.set(unb(jwk.x), 1);
  raw.set(unb(jwk.y), 1 + unb(jwk.x).length);
  return { publicKey, privateKey, raw };
}

// The same signature in the byte forms a non-canonical encoder can produce.
function variants(der) {
  const rLen = der[3], rStart = 4;
  const rBytes = der.slice(rStart, rStart + rLen);
  const rest = der.slice(rStart + rLen);
  return [
    ['canonical', Uint8Array.from(der)],
    ['trailing byte', Uint8Array.from([...der, 0x00])],
    ['trailing 2 bytes', Uint8Array.from([...der, 0xde, 0xad])],
    ['sequence length +1', (() => { const b = Uint8Array.from(der); b[1] += 1; return b; })()],
    ['sequence length -1', (() => { const b = Uint8Array.from(der); b[1] -= 1; return b; })()],
    ['long-form length 0x81', Uint8Array.from([0x30, 0x81, der[1], ...der.slice(2)])],
    ['r non-minimal (0x00 prefix)', Uint8Array.from([0x30, der[1] + 1, 0x02, rLen + 1, 0x00, ...rBytes, ...rest])],
    ['r negative (high bit set)', (() => {
      const b = Uint8Array.from(der); b[rStart] |= 0x80; return b; })()],
    ['r zero-length', Uint8Array.from([0x30, der[1] - rLen, 0x02, 0x00, ...rest])],
    ['truncated (last byte dropped)', Uint8Array.from(der.slice(0, der.length - 1))],
  ];
}

for (const curve of ['P-256', 'P-384']) {
  const digest = curve === 'P-384' ? 'sha384' : 'sha256';
  const { publicKey, privateKey, raw } = nodeKey(curve);
  const message = Buffer.from(`DER canonical form, ${curve}, 2026-11-15`);

  // 1. real OpenSSL signatures, canonical DER: both verifiers accept.
  for (let i = 0; i < 3; i++) {
    const msg = Buffer.concat([message, Buffer.from([i])]);
    const der = nodeSign(digest, msg, privateKey);
    check(`${curve} #${i}: strict accepts canonical OpenSSL DER`,
      verifyStrict(raw, new Uint8Array(msg), new Uint8Array(der), curve) === true);
    check(`${curve} #${i}: strict accepts it as { der } object too`,
      verifyStrict(raw, new Uint8Array(msg), { der: new Uint8Array(der) }, curve) === true);
    check(`${curve} #${i}: original also accepts canonical DER (no regression)`,
      verifyOrig(raw, new Uint8Array(msg), new Uint8Array(der), curve) === true);
    check(`${curve} #${i}: OpenSSL agrees the canonical form verifies`,
      nodeVerify(digest, msg, publicKey, der) === true);
  }

  // 2. every non-canonical form must be rejected by the strict decoder.
  const der = nodeSign(digest, message, privateKey);
  let origAccepted = 0, nonCanonical = 0;
  for (const [label, bytes] of variants(der)) {
    const canonical = label === 'canonical';
    const strict = verifyStrict(raw, new Uint8Array(message), bytes, curve);
    const orig = verifyOrig(raw, new Uint8Array(message), bytes, curve);
    const openssl = (() => { try { return nodeVerify(digest, message, publicKey, bytes); } catch { return false; } })();
    if (!canonical) { nonCanonical++; if (orig) origAccepted++; }
    check(`${curve}: strict ${canonical ? 'accepts' : 'rejects'} ${label}`, strict === canonical,
      `strict=${strict}`);
    check(`${curve}: OpenSSL ${canonical ? 'accepts' : 'rejects'} ${label}`, openssl === canonical,
      `openssl=${openssl}`);
  }
  console.log(`${curve}: ${nonCanonical} non-canonical forms; original build accepted ${origAccepted}, ` +
              `strict accepted 0, OpenSSL accepted 0`);

  // 3. Our own signer, both encodings the module exposes, still verify.
  const curveObj = strictInternals.getCurve(curve);
  const scalar = Uint8Array.from(Buffer.alloc(curveObj.byteLen, 7));
  scalar[curveObj.byteLen - 1] = 3; // 07..03, comfortably inside [1, n-1]
  const mine = keygenStrict(scalar, curve);
  const sig = signStrict(mine.privateKey, message, curve);
  check(`${curve}: our DER verifies under the strict decoder`,
    verifyStrict(mine.publicKey, message, sig.der, curve) === true);
  check(`${curve}: our { der } object verifies`,
    verifyStrict(mine.publicKey, message, { der: sig.der }, curve) === true);
  check(`${curve}: our raw P1363 form verifies (unchanged path)`,
    verifyStrict(mine.publicKey, message, sig.raw, curve) === true);
  check(`${curve}: encoded DER decodes back to (r, s)`, (() => {
    const d = strictInternals.decodeDER(sig.der, curveObj.byteLen + 1);
    return d.r === sig.r && d.s === sig.s;
  })());
  check(`${curve}: tampered message rejected`,
    verifyStrict(mine.publicKey, new Uint8Array([...message, 0]), sig.der, curve) === false);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
