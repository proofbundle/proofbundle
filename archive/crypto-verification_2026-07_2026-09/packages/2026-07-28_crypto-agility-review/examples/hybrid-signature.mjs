import {
  generateSignatureKeySet,
  signDetached,
  verifyDetached,
} from '../src/index.mjs';

const suiteId = 'pb.sig.hybrid.ed25519+ml-dsa-65.v1';
const payload = new TextEncoder().encode('Both components are required.');
const privateKeys = generateSignatureKeySet(suiteId);
const publicKeys = privateKeys.map(({ privateKeyDer: _private, ...key }) => key);
const envelope = signDetached(suiteId, privateKeys, payload, {
  createdAt: '2026-07-28T12:00:00.000Z',
  purpose: 'hybrid-review-example',
});

const result = verifyDetached(envelope, publicKeys, payload);
if (!result.ok) throw new Error(result.verdict);
console.log(result);
