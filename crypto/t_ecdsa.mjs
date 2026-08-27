import { ecdsaKeygen, ecdsaSign, ecdsaVerify, _internals } from './ecdsa.mjs';
import { generateKeyPairSync, createSign, createVerify } from 'node:crypto';

// node:crypto (OpenSSL) is used here, and only here, as an independent
// yardstick -- ecdsa.mjs itself imports no cryptographic library.
//
// Strategy, from strongest check to weakest:
//   1. Derive a public key from a node:crypto-generated private scalar with
//      our own scalar multiplication and compare to node's own public key.
//      This validates our curve constants (p, a, b, Gx, Gy) and our entire
//      Jacobian point-arithmetic + ladder implementation against OpenSSL in
//      one shot: if any curve parameter or arithmetic step were wrong, the
//      derived point would not match.
//   2. Sign with us, verify with node (both raw r||s / IEEE P1363 and DER
//      encodings) -- proves our signatures are genuinely interoperable.
//   3. Sign with node, verify with us (both encodings) -- proves our
//      verifier accepts real, independently produced OpenSSL signatures.
//   4. Verify rejects tampered signatures/messages/keys and out-of-range
//      (r, s).
//   5. Point-arithmetic identities checked directly against curve constants.
//   6. Compressed/uncompressed SEC1 point-encoding round-trips.
// All of the above run for both P-256 and P-384.

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}

function b64uToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new Uint8Array(Buffer.from(s, 'base64'));
}
function padTo(bytes, len) {
  if (bytes.length === len) return bytes;
  const out = new Uint8Array(len);
  out.set(bytes, len - bytes.length); // left-pad with zeros (big-endian)
  return out;
}
function flipBit(bytes, byteIndex, bitMask = 0x01) {
  const out = Uint8Array.from(bytes);
  out[byteIndex] ^= bitMask;
  return out;
}

// Pull { dBytes, xBytes, yBytes, publicKeyObj, privateKeyObj } for a fresh
// node-generated keypair on the given curve, coordinates left-padded to the
// curve's fixed byte width (JWK's base64url omits leading zero bytes).
function nodeKeypair(curveName, curve) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: curveName });
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });
  return {
    dBytes: padTo(b64uToBytes(privJwk.d), curve.byteLen),
    xBytes: padTo(b64uToBytes(pubJwk.x), curve.byteLen),
    yBytes: padTo(b64uToBytes(pubJwk.y), curve.byteLen),
    publicKeyObj: publicKey,
    privateKeyObj: privateKey,
  };
}

const HASH_NAME = { 'P-256': 'SHA256', 'P-384': 'SHA384' };
const MESSAGES = [
  new TextEncoder().encode('the quick brown fox jumps over the lazy dog'),
  new TextEncoder().encode(''), // empty message
  new TextEncoder().encode('a'.repeat(500)), // longer than one hash block
  Uint8Array.from([0, 1, 2, 3, 255, 254, 253, 0, 0, 128]), // binary content
];

for (const curveName of ['P-256', 'P-384']) {
  const curve = _internals.getCurve(curveName);
  const hashName = HASH_NAME[curveName];

  console.log(`\n--- ${curveName} ---`);

  // --- 1. scalar -> public key derivation matches node:crypto (OpenSSL) ---
  for (let trial = 0; trial < 4; trial++) {
    const { dBytes, xBytes, yBytes } = nodeKeypair(curveName, curve);
    const mine = ecdsaKeygen(dBytes, curveName);
    const nodePub = _internals.encodePoint(
      [_internals.bytesToBig(xBytes), _internals.bytesToBig(yBytes), 1n], curve, false);
    check(`${curveName} trial${trial}: derived pubkey matches node:crypto`,
      Buffer.from(mine.publicKey).equals(Buffer.from(nodePub)),
      `mine=${Buffer.from(mine.publicKey).toString('hex')} node=${Buffer.from(nodePub).toString('hex')}`);
  }

  // --- 2 & 3. sign/verify interop with node:crypto, both encodings -------
  for (let trial = 0; trial < MESSAGES.length; trial++) {
    const message = MESSAGES[trial];
    const { dBytes, xBytes, yBytes, publicKeyObj, privateKeyObj } = nodeKeypair(curveName, curve);
    const myPub = _internals.encodePoint(
      [_internals.bytesToBig(xBytes), _internals.bytesToBig(yBytes), 1n], curve, false);

    // sign with us, verify with node
    const mySig = ecdsaSign(dBytes, message, curveName);
    const vDer = createVerify(hashName); vDer.update(Buffer.from(message)); vDer.end();
    check(`${curveName} msg${trial}: node accepts our DER signature`,
      vDer.verify(publicKeyObj, Buffer.from(mySig.der)));
    const vRaw = createVerify(hashName); vRaw.update(Buffer.from(message)); vRaw.end();
    check(`${curveName} msg${trial}: node accepts our raw (r||s) signature`,
      vRaw.verify({ key: publicKeyObj, dsaEncoding: 'ieee-p1363' }, Buffer.from(mySig.raw)));

    // sign with node, verify with us
    const sDer = createSign(hashName); sDer.update(Buffer.from(message)); sDer.end();
    const nodeDerSig = sDer.sign(privateKeyObj);
    check(`${curveName} msg${trial}: we accept node's DER signature`,
      ecdsaVerify(myPub, message, nodeDerSig, curveName));
    const sRaw = createSign(hashName); sRaw.update(Buffer.from(message)); sRaw.end();
    const nodeRawSig = sRaw.sign({ key: privateKeyObj, dsaEncoding: 'ieee-p1363' });
    check(`${curveName} msg${trial}: we accept node's raw (r||s) signature`,
      ecdsaVerify(myPub, message, nodeRawSig, curveName));

    // determinism (RFC 6979): identical key+message -> byte-identical signature
    const mySig2 = ecdsaSign(dBytes, message, curveName);
    check(`${curveName} msg${trial}: RFC 6979 signature is deterministic`,
      mySig.r === mySig2.r && mySig.s === mySig2.s);
  }

  // --- 4. verify rejects ---------------------------------------------------
  {
    const message = MESSAGES[0];
    const { dBytes, xBytes, yBytes } = nodeKeypair(curveName, curve);
    const myPub = _internals.encodePoint(
      [_internals.bytesToBig(xBytes), _internals.bytesToBig(yBytes), 1n], curve, false);
    const sig = ecdsaSign(dBytes, message, curveName);

    check(`${curveName}: baseline signature verifies`, ecdsaVerify(myPub, message, sig.raw, curveName));

    const flippedSigMid = flipBit(sig.raw, Math.floor(sig.raw.length / 2));
    check(`${curveName}: rejects flipped signature bit (raw, mid)`,
      !ecdsaVerify(myPub, message, flippedSigMid, curveName));
    const flippedSigLast = flipBit(sig.raw, sig.raw.length - 1);
    check(`${curveName}: rejects flipped signature bit (raw, last byte)`,
      !ecdsaVerify(myPub, message, flippedSigLast, curveName));
    const flippedDer = flipBit(sig.der, sig.der.length - 1);
    check(`${curveName}: rejects flipped signature bit (DER)`,
      !ecdsaVerify(myPub, message, flippedDer, curveName));

    const flippedMessage = flipBit(message, 0);
    check(`${curveName}: rejects flipped message bit`,
      !ecdsaVerify(myPub, flippedMessage, sig.raw, curveName));

    const { xBytes: wx, yBytes: wy } = nodeKeypair(curveName, curve);
    const wrongPub = _internals.encodePoint(
      [_internals.bytesToBig(wx), _internals.bytesToBig(wy), 1n], curve, false);
    check(`${curveName}: rejects wrong public key`,
      !ecdsaVerify(wrongPub, message, sig.raw, curveName));

    check(`${curveName}: rejects s == n (out of range)`,
      !ecdsaVerify(myPub, message, { r: sig.r, s: curve.n }, curveName));
    check(`${curveName}: rejects s > n (out of range)`,
      !ecdsaVerify(myPub, message, { r: sig.r, s: curve.n + 12345n }, curveName));
    check(`${curveName}: rejects r == n (out of range)`,
      !ecdsaVerify(myPub, message, { r: curve.n, s: sig.s }, curveName));
    check(`${curveName}: rejects r = 0`,
      !ecdsaVerify(myPub, message, { r: 0n, s: sig.s }, curveName));
    check(`${curveName}: rejects s = 0`,
      !ecdsaVerify(myPub, message, { r: sig.r, s: 0n }, curveName));
    check(`${curveName}: rejects r = 0 and s = 0 together`,
      !ecdsaVerify(myPub, message, { r: 0n, s: 0n }, curveName));
  }

  // --- 5. point-arithmetic identities --------------------------------------
  {
    const { F, G, n } = curve;
    const negG = [G[0], F.sub(0n, G[1]), G[2]];
    const identitySum = _internals.pointAdd(G, negG, F);
    check(`${curveName}: P + (-P) == identity`, _internals.isInfinity(identitySum));

    const doubled = _internals.pointDouble(G, F);
    const added = _internals.pointAdd(G, G, F);
    check(`${curveName}: 2P (double) == P + P (add)`, _internals.pointEqual(doubled, added, F));

    for (const k of [1n, 2n, 3n, 5n, 13n, 100n, 12345n]) {
      let repeated = _internals.INFINITY;
      for (let i = 0n; i < k; i++) repeated = _internals.pointAdd(repeated, G, F);
      const viaLadder = _internals.scalarMul(k, G, curve);
      check(`${curveName}: ladder(${k}G) == repeated addition`,
        _internals.pointEqual(repeated, viaLadder, F));
    }
    check(`${curveName}: 1*G == G`, _internals.pointEqual(_internals.scalarMul(1n, G, curve), G, F));

    check(`${curveName}: n*G == identity (documented order)`,
      _internals.isInfinity(_internals.scalarMul(n, G, curve)));
    check(`${curveName}: (n-1)*G != identity`,
      !_internals.isInfinity(_internals.scalarMul(n - 1n, G, curve)));
    check(`${curveName}: G is on the curve`, _internals.isOnCurve([G[0], G[1]], curve));
  }

  // --- 6. compressed / uncompressed encoding round-trips -------------------
  {
    for (let trial = 0; trial < 3; trial++) {
      const { xBytes, yBytes } = nodeKeypair(curveName, curve);
      const Q = [_internals.bytesToBig(xBytes), _internals.bytesToBig(yBytes), 1n];

      const uncompressed = _internals.encodePoint(Q, curve, false);
      check(`${curveName} trial${trial}: uncompressed length == 2*byteLen+1`,
        uncompressed.length === 2 * curve.byteLen + 1);
      check(`${curveName} trial${trial}: uncompressed tag == 0x04`, uncompressed[0] === 0x04);
      const fromUncompressed = _internals.decodePoint(uncompressed, curve);
      check(`${curveName} trial${trial}: uncompressed round-trip`,
        _internals.pointEqual(Q, fromUncompressed, curve.F));

      const compressed = _internals.encodePoint(Q, curve, true);
      check(`${curveName} trial${trial}: compressed length == byteLen+1`,
        compressed.length === curve.byteLen + 1);
      check(`${curveName} trial${trial}: compressed tag is 0x02 or 0x03`,
        compressed[0] === 0x02 || compressed[0] === 0x03);
      const fromCompressed = _internals.decodePoint(compressed, curve);
      check(`${curveName} trial${trial}: compressed round-trip`,
        _internals.pointEqual(Q, fromCompressed, curve.F));
      check(`${curveName} trial${trial}: compressed tag matches Y parity`,
        compressed[0] === ((_internals.bytesToBig(yBytes) & 1n) === 0n ? 0x02 : 0x03));
    }
  }

  // --- 7. DER encode/decode round-trip (used throughout, checked directly) -
  {
    const { dBytes } = nodeKeypair(curveName, curve);
    const sig = ecdsaSign(dBytes, MESSAGES[0], curveName);
    const der = _internals.encodeDER(sig.r, sig.s);
    check(`${curveName}: DER round-trip matches ecdsaSign's own der`,
      Buffer.from(der).equals(Buffer.from(sig.der)));
    const { r: dr, s: ds } = _internals.decodeDER(der);
    check(`${curveName}: DER decode recovers r`, dr === sig.r);
    check(`${curveName}: DER decode recovers s`, ds === sig.s);
    check(`${curveName}: DER starts with SEQUENCE tag 0x30`, der[0] === 0x30);
  }
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
