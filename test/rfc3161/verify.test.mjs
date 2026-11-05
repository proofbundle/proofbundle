/*
 * Tests for the RFC 3161 verifier.
 *
 * The fixtures were produced with OpenSSL 3.0 against a locally generated TSA:
 *
 *   openssl req -x509 -newkey rsa:2048 -keyout ca.key -out ca.pem -days 3650 -nodes ...
 *   openssl req -newkey rsa:2048 -keyout tsa.key -out tsa.csr -nodes ...
 *   openssl x509 -req -in tsa.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
 *       -out tsa.pem -days 3650 -extfile tsa.cnf -extensions ts_cert_ext
 *   openssl ts -query -data payload.txt -sha256 -cert -out req.tsq
 *   openssl ts -reply -queryfile req.tsq -signer tsa.pem -inkey tsa.key -chain ca.pem -out reply.tsr
 *
 * The same token verifies with `openssl ts -verify -data payload.txt -in reply.tsr
 * -CAfile ca.pem`, which is what makes it usable as ground truth rather than
 * as a self-consistent artefact.
 *
 * The tampered fixture is reply.tsr with one byte changed inside the TSTInfo
 * genTime. OpenSSL rejects it with "digest failure", so a verifier that
 * accepts it is wrong.
 *
 * The forged fixture is the 15-byte synthetic string that the project's own
 * PBHTML-F004 finding used: a bare GeneralizedTime with no CMS structure at
 * all. It is the exact input the old rfc3161ExtractGenTime accepted.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  verifyTimeStampResp,
  parseTimeStampResp,
  parseTstInfo,
  parseCertificate,
  hasTimeStampingEku,
  isEndEntity,
} from '../../src/rfc3161/verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, 'fixtures');

const load = (name) => new Uint8Array(readFileSync(join(fixtures, name)));
const good = load('good.tsr');
const tampered = load('tampered.tsr');
const caDer = load('ca.der');
const tsaDer = load('tsa.der');
const payload = readFileSync(join(fixtures, 'payload.txt'));

const digestOfPayload = new Uint8Array(await crypto.subtle.digest('SHA-256', payload));

/* The exact byte string from the PBHTML-F004 finding. */
const forged = new Uint8Array([0x18, 0x0f, ...Buffer.from('20260827123456Z', 'ascii')]);

test('a genuine OpenSSL token verifies and yields its asserted time', async () => {
  const result = await verifyTimeStampResp(good, {
    expectedDigest: digestOfPayload,
    trust: { trustedCerts: [caDer] },
  });

  assert.equal(result.verified, true, result.reason || '');
  assert.equal(result.signatureVerified, true);
  assert.equal(result.imprintMatches, true);
  assert.equal(result.chain, 'TRUSTED');
  assert.equal(result.status.status, 0);
  assert.equal(result.digestAlgorithm, 'SHA-256');
  assert.match(result.genTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  assert.equal(result.signerSubject, 'CN=Test TSA Signer');
  assert.equal(result.signerIssuer, 'CN=Test TSA Root');
});

test('the forged 15-byte GeneralizedTime is rejected', async () => {
  const result = await verifyTimeStampResp(forged, { expectedDigest: digestOfPayload });

  assert.equal(result.verified, false);
  assert.equal(result.genTime, null);
  assert.equal(result.signatureVerified, false);
  assert.match(result.reason, /does not parse/);
});

test('a tampered token is rejected even though it still parses', async () => {
  const result = await verifyTimeStampResp(tampered, {
    expectedDigest: digestOfPayload,
    trust: { trustedCerts: [caDer] },
  });

  assert.equal(result.verified, false);
  assert.equal(result.signatureVerified, false);
  /*
   * The tamper lands in the TSTInfo genTime, so the RFC 5652 §5.4 check that
   * the signed messageDigest attribute matches the encapsulated content
   * catches it before the signature is even attempted. Both defences reject
   * the token; this one simply fires first.
   */
  assert.match(result.reason, /messageDigest attribute does not match|signature does not verify/);
});

test('a token bound to a different digest is rejected', async () => {
  const other = new Uint8Array(32);
  other[0] = 0xaa;
  const result = await verifyTimeStampResp(good, {
    expectedDigest: other,
    trust: { trustedCerts: [caDer] },
  });

  assert.equal(result.verified, false);
  assert.equal(result.imprintMatches, false);
  assert.match(result.reason, /imprint does not match/);
});

test('a token with no expected digest cannot be called verified', async () => {
  const result = await verifyTimeStampResp(good, { trust: { trustedCerts: [caDer] } });

  assert.equal(result.verified, false);
  assert.match(result.reason, /no expected digest/);
});

test('without a trust store the signature still verifies but the chain is untrusted', async () => {
  const result = await verifyTimeStampResp(good, { expectedDigest: digestOfPayload });

  assert.equal(result.verified, true);
  assert.equal(result.signatureVerified, true);
  assert.equal(result.chain, 'UNTRUSTED');
  assert.match(result.reason, /chain was not established/);
});

test('a token whose signer is not a TSA certificate is rejected', async () => {
  /* The root CA is carried in the token but does not carry the timeStamping
     EKU. Verifying against it as the signer must not succeed. */
  const root = parseCertificate(caDer);
  assert.equal(hasTimeStampingEku(root), false);
  assert.equal(hasTimeStampingEku(parseCertificate(tsaDer)), true);
});

test('the TSA certificate is an end entity', () => {
  assert.equal(isEndEntity(parseCertificate(tsaDer)), true);
});

test('the parsed TSTInfo carries the imprint and the nonce', () => {
  const parsed = parseTimeStampResp(good);
  const tst = parseTstInfo(parsed.token.eContent);

  assert.equal(tst.version, 1);
  assert.equal(tst.hashAlgorithm.oid, '2.16.840.1.101.3.4.2.1');
  assert.equal(Buffer.from(tst.hashedMessage).toString('hex'), Buffer.from(digestOfPayload).toString('hex'));
  assert.ok(tst.nonce, 'a nonce must be present when the request carried one');
});

test('a truncated token is rejected rather than throwing', async () => {
  const result = await verifyTimeStampResp(good.slice(0, 40), {
    expectedDigest: digestOfPayload,
  });

  assert.equal(result.verified, false);
  assert.ok(result.reason);
});

test('an empty buffer is rejected rather than throwing', async () => {
  const result = await verifyTimeStampResp(new Uint8Array(0), {
    expectedDigest: digestOfPayload,
  });

  assert.equal(result.verified, false);
  assert.ok(result.reason);
});
