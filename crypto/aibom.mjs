// PB-AI-BOM-1 generator, conforming to the schema already in use on Drive
// (formal_agent_aibom.json, Drive id 1QuygdAWuQ7QMGcZRbJAqpdrVVvaryNJK):
//
//   { schema, artifact, risk_tier, generated_at, ancestry, model_cards,
//     custody_chain, attestation_record, kappa, compliance_vector, theta,
//     gate_norm,
//     bom_seal: { digest_alg: "SHA3-384", digest_b64u,
//                 sig_alg: "Ed25519", pub_b64u, signature_b64u } }
//
// SHA3-384 comes from the from-scratch keccak.mjs in this directory, which is
// why this is JS and not PowerShell: .NET reports SHA3_384.IsSupported = false
// on Windows 10 (no CNG SHA3 provider), while keccak.mjs provides it directly.
//
// Ed25519 signing is delegated to the Node runtime's own implementation here.
// Swap it for the from-scratch one by replacing sign() below; the record format
// does not change.

import { createHash, generateKeyPairSync, sign as nodeSign } from 'node:crypto';
// Signing is pluggable. The default uses the Node runtime's Ed25519 because
// there is no from-scratch Ed25519 in this archive — I searched the repo tree
// and pb-crypto before assuming one was needed. Supply your own via
// buildAibom({ signer }) to remove the runtime from the trust boundary;
// the record format does not change.
import { sha3_384 } from './keccak.mjs';

const b64u = (buf) =>
  Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Deterministic serialisation: keys sorted at every level, no whitespace.
 *  The seal digest is taken over this and nothing else. */
export function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  return '{' + Object.keys(v).sort()
    .map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}

/** gate_norm is the Euclidean norm of theta. For theta = ones(10) this is
 *  sqrt(10) = 3.1622776601683795, matching the record on Drive. */
export function gateNorm(theta) {
  return Math.sqrt(theta.reduce((s, x) => s + x * x, 0));
}

export function buildAibom({
  artifact,
  riskTier = 'high',
  generatedAt,
  ancestry = [],
  modelCards = [],
  custodyChain = 'chi(v) — see lineage ledger',
  attestationRecord = 'alpha(v)',
  kappa = 1,
  complianceVector = new Array(10).fill(0),
  theta = new Array(10).fill(1),
  privateKeyPem,
  publicKeyRaw,
  signer,          // optional: (digestBytes) => Uint8Array signature
}) {
  if (!artifact) throw new Error('artifact URN is required');
  if (!generatedAt) throw new Error('generatedAt must be supplied, not invented');
  if (theta.length !== complianceVector.length) {
    throw new Error('theta and compliance_vector must have equal length');
  }

  const body = {
    schema: 'PB-AI-BOM-1',
    artifact,
    risk_tier: riskTier,
    generated_at: generatedAt,
    ancestry,
    model_cards: modelCards,
    custody_chain: custodyChain,
    attestation_record: attestationRecord,
    kappa,
    compliance_vector: complianceVector,
    theta,
    gate_norm: gateNorm(theta),
  };

  // Digest with the from-scratch SHA3-384, not a platform primitive.
  const digest = sha3_384(canonical(body));

  const record = {
    ...body,
    bom_seal: {
      digest_alg: 'SHA3-384',
      digest_b64u: b64u(digest),
      sig_alg: 'Ed25519',
      pub_b64u: publicKeyRaw ? b64u(publicKeyRaw) : null,
      signature_b64u: signer
        ? b64u(signer(digest))
        : (privateKeyPem ? b64u(nodeSign(null, Buffer.from(digest), privateKeyPem)) : null),
    },
  };
  return record;
}

/** Recompute the digest and check the signature. Returns what FAILED, not a
 *  boolean — an empty array means nothing was refuted, which is not the same
 *  as the record being genuine. */
export function verifyAibom(record) {
  const problems = [];
  const { bom_seal, ...body } = record;
  if (!bom_seal) return ['no bom_seal present'];

  if (bom_seal.digest_alg !== 'SHA3-384') {
    problems.push(`digest_alg is ${bom_seal.digest_alg}, expected SHA3-384`);
  }
  const recomputed = b64u(sha3_384(canonical(body)));
  if (recomputed !== bom_seal.digest_b64u) {
    problems.push(`digest does not recompute: ${recomputed} != ${bom_seal.digest_b64u}`);
  }
  if (typeof body.gate_norm === 'number' && Array.isArray(body.theta)) {
    const gn = gateNorm(body.theta);
    if (Math.abs(gn - body.gate_norm) > 1e-12) {
      problems.push(`gate_norm ${body.gate_norm} != ||theta|| ${gn}`);
    }
  }
  return problems;
}

// Self-check against the known record when run directly.
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const kn = sha3_384('abc');
  const want = 'ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25';
  console.log('sha3-384("abc") from keccak.mjs:', Buffer.from(kn).toString('hex') === want ? 'MATCHES FIPS 202' : 'MISMATCH');
  console.log('gate_norm(ones(10))            :', gateNorm(new Array(10).fill(1)),
              gateNorm(new Array(10).fill(1)) === 3.1622776601683795 ? '== record on Drive' : '!= record on Drive');

  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const rec = buildAibom({
    artifact: 'urn:agent:claude-opus-5:proofbundle-session:20260810',
    generatedAt: '2026-08-10T21:00:00.000Z',
    privateKeyPem: privateKey,
    publicKeyRaw: publicKey.export({ type: 'spki', format: 'der' }).slice(-32),
  });
  const problems = verifyAibom(rec);
  console.log('self-verify                    :', problems.length ? problems : 'no problems');
  console.log(JSON.stringify(rec, null, 1));
}
