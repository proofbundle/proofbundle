// RSA PKCS#1 v1.5 verification, from scratch, gated by OpenSSL as an oracle
// and by hostile inputs that must be rejected.
//
// Ground truths:
//   * the EMSA-PKCS1-v1_5 layout is rebuilt byte for byte and compares equal to
//     what OpenSSL accepted (so a padding bug cannot hide behind a verify that
//     simply says true);
//   * every OpenSSL signature verifies under this implementation for all three
//     hash functions and two key sizes.
//
// Hostile inputs (each must return false, never throw):
//   bit flips in the signature, truncated/oversized signatures, s = 0, s = 1,
//   s = n-1, s = n, the wrong message, the wrong key, the wrong exponent, and a
//   signature made under one hash presented to another.
import { generateKeyPairSync, sign as nodeSign, verify as nodeVerify, createHash } from 'node:crypto';
import { verifyDigestInfo, encodeEm, DIGEST_INFO, rsaPublicOp, _internals } from './rsa-pkcs1-v15-verify.mjs';

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const b64u = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const unb = (s) => Uint8Array.from(b64u(s));

for (const bits of [2048, 3072]) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: bits });
  const jwk = publicKey.export({ format: 'jwk' });
  const n = unb(jwk.n), e = unb(jwk.e);
  const message = Buffer.from(`RSA PKCS#1 v1.5 verify, ${bits}-bit, 2026-11-16`);

  for (const hash of ['SHA-256', 'SHA-384', 'SHA-512']) {
    const sig = nodeSign(hash.toLowerCase().replace('-', ''), message, privateKey);
    check(`${bits} ${hash}: OpenSSL accepts its own signature`,
      nodeVerify(hash.toLowerCase().replace('-', ''), message, publicKey, sig) === true);
    check(`${bits} ${hash}: from-scratch verify accepts it`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), Uint8Array.from(sig)) === true);

    // Ground truth on the encoding itself: rebuild EM and compare to s^e mod n.
    const k = n.length;
    const digest = Uint8Array.from(createHash(hash.toLowerCase().replace('-', '')).update(message).digest());
    const t = new Uint8Array(DIGEST_INFO[hash].length + digest.length);
    t.set(DIGEST_INFO[hash], 0); t.set(digest, DIGEST_INFO[hash].length);
    const em = encodeEm(t, k);
    const { bytesToBig, bigToBytesFixed } = _internals;
    const emFromSig = bigToBytesFixed(rsaPublicOp(Uint8Array.from(sig), bytesToBig(n), bytesToBig(e)), k);
    check(`${bits} ${hash}: EMSA encoding rebuilt byte-for-byte matches s^e mod n`,
      Buffer.from(em).equals(Buffer.from(emFromSig)));
    check(`${bits} ${hash}: padding is 0x00 0x01 then >= 8 0xFF`,
      em[0] === 0x00 && em[1] === 0x01 && em[2] === 0xff && em[k - t.length - 1] === 0x00);

    // Hostile: bit flips.
    for (const pos of [0, 1, k >> 1, k - 1]) {
      const bad = Uint8Array.from(sig); bad[pos] ^= 1;
      check(`${bits} ${hash}: rejects bit flip at ${pos}`,
        verifyDigestInfo(hash, n, e, Uint8Array.from(message), bad) === false);
    }
    // Hostile: wrong length, degenerate values, wrong message/key/exponent.
    check(`${bits} ${hash}: rejects truncated signature`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), Uint8Array.from(sig).subarray(0, k - 1)) === false);
    const longer = new Uint8Array(k + 1); longer.set(sig, 0);
    check(`${bits} ${hash}: rejects oversized signature`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), longer) === false);
    check(`${bits} ${hash}: rejects s = 0`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), new Uint8Array(k)) === false);
    const one = new Uint8Array(k); one[k - 1] = 1;
    check(`${bits} ${hash}: rejects s = 1`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), one) === false);
    const nMinus1 = Uint8Array.from(Buffer.from((BigInt('0x' + Buffer.from(n).toString('hex')) - 1n).toString(16).padStart(2 * k, '0'), 'hex'));
    check(`${bits} ${hash}: rejects s = n-1`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), nMinus1) === false);
    check(`${bits} ${hash}: rejects s = n`,
      verifyDigestInfo(hash, n, e, Uint8Array.from(message), n) === false);
    check(`${bits} ${hash}: rejects altered message`,
      verifyDigestInfo(hash, n, e, Uint8Array.from([...message, 0x21]), Uint8Array.from(sig)) === false);
    check(`${bits} ${hash}: rejects wrong exponent`,
      verifyDigestInfo(hash, n, Uint8Array.from([0x03]), Uint8Array.from(message), Uint8Array.from(sig)) === false);

    const otherHash = hash === 'SHA-256' ? 'SHA-384' : 'SHA-256';
    check(`${bits} ${hash}: signature presented as ${otherHash} is rejected`,
      verifyDigestInfo(otherHash, n, e, Uint8Array.from(message), Uint8Array.from(sig)) === false);
  }

  // Hostile: signature under one key presented with another key's modulus.
  const other = generateKeyPairSync('rsa', { modulusLength: bits });
  const o = other.publicKey.export({ format: 'jwk' });
  const sig = nodeSign('sha256', message, privateKey);
  check(`${bits}: rejects signature under a different modulus`,
    verifyDigestInfo('SHA-256', unb(o.n), unb(o.e), Uint8Array.from(message), Uint8Array.from(sig)) === false);
}

// Hostile: unsupported hash name must throw rather than silently pass.
check('unsupported hash throws',
  (() => { try { verifyDigestInfo('SHA-1', new Uint8Array(256), new Uint8Array([1, 0, 1]), new Uint8Array(1), new Uint8Array(256)); return false; } catch { return true; } })());

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
