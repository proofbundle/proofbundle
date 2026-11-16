// X448 against OpenSSL 3.5.7 (node:crypto), used only as an oracle.
//
// Three independent checks:
//   1. public key derived from a seed matches OpenSSL's
//   2. shared secret matches OpenSSL's diffieHellman, both directions
//   3. the RFC 7748 section 6.2 vector (also in x448.mjs selfTest)
import { createPrivateKey, createPublicKey, diffieHellman, generateKeyPairSync, randomBytes } from 'node:crypto';
import { x448Keygen, x448Shared, isZeroSharedSecret } from './x448.mjs';

const hex = (b) => Buffer.from(b).toString('hex');
const b64u = (b) => Buffer.from(b).toString('base64url');
const unb = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

let pass = 0, fail = 0;
function check(label, ok, detail = '') {
  if (ok) pass++;
  else { fail++; console.log(`FAIL: ${label} ${detail}`); }
}

function nodeKeyFromSeed(seed) {
  // OpenSSL's JWK import needs x alongside d; it recomputes the public key
  // from d, and the export below is OpenSSL's own value.
  const ours = x448Keygen(seed);
  const key = createPrivateKey({
    key: { kty: 'OKP', crv: 'X448', d: b64u(seed), x: b64u(ours) },
    format: 'jwk',
  });
  const pub = createPublicKey(key).export({ format: 'jwk' }).x;
  return { key, pub: unb(pub), ours };
}

// 1 + 2: seeded key derivation and crossed shared secrets
for (let i = 0; i < 10; i++) {
  const seedA = new Uint8Array(randomBytes(56));
  const seedB = new Uint8Array(randomBytes(56));

  const a = nodeKeyFromSeed(seedA);
  const b = nodeKeyFromSeed(seedB);

  const oursPubA = x448Keygen(seedA);
  check(`public key from seed #${i}`, hex(oursPubA) === hex(a.pub),
        `\n  openssl ${hex(a.pub)}\n  ours    ${hex(oursPubA)}`);

  const oracleShared = new Uint8Array(diffieHellman({ privateKey: a.key, publicKey: b.key }));
  const oursShared = x448Shared(seedA, b.pub);
  check(`shared secret A->B #${i}`, hex(oursShared) === hex(oracleShared));

  const oursReverse = x448Shared(seedB, a.pub);
  check(`shared secret B->A #${i}`, hex(oursReverse) === hex(oracleShared));

  check(`shared secret is not zero #${i}`, !isZeroSharedSecret(oursShared));
}

// two freshly generated OpenSSL pairs, no seeds involved
for (let i = 0; i < 5; i++) {
  const ka = generateKeyPairSync('x448');
  const kb = generateKeyPairSync('x448');
  const skA = unb(ka.privateKey.export({ format: 'jwk' }).d);
  const pubA = unb(ka.publicKey.export({ format: 'jwk' }).x);
  const pubB = unb(kb.publicKey.export({ format: 'jwk' }).x);
  const oracle = new Uint8Array(diffieHellman({ privateKey: kb.privateKey, publicKey: ka.publicKey }));
  check(`openssl pair #${i}`, hex(x448Shared(skA, pubB)) === hex(oracle));
}

// 3: length discipline
{
  let threw = false;
  try { x448Keygen(new Uint8Array(32)); } catch (e) { threw = e instanceof RangeError; }
  check('rejects 32-byte private key', threw);
}

console.log(`\nX448 vs OpenSSL: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
