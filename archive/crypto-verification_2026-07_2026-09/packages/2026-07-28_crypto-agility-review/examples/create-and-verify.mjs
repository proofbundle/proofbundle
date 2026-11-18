import {
  createSignedBundle,
  generateSignatureKeyPair,
  verifyBundle,
} from '../src/index.mjs';

const payloads = {
  'evidence/statement.txt': new TextEncoder().encode('Evidence captured at source.'),
  'evidence/measurement.bin': Uint8Array.of(0x01, 0x02, 0x03, 0x04),
};
const files = Object.entries(payloads).map(([path, bytes]) => ({ path, bytes }));
const signingKeys = [generateSignatureKeyPair('pb.sig.ed25519.v1')];

const created = createSignedBundle(files, signingKeys, {
  profileId: 'pb.profile.interop-2026.v1',
  createdAt: '2026-07-28T12:00:00.000Z',
  metadata: { purpose: 'reviewer-smoke-example' },
});
const result = verifyBundle(created.bytes, { payloads });
if (!result.ok) throw new Error(`${result.verdict}: ${result.message ?? 'verification failed'}`);

console.log({
  bundleBytes: created.bytes.byteLength,
  manifestCid: result.manifestCid,
  verdict: result.verdict,
  verifiedScope: result.verifiedScope,
});
