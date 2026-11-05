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
// Ed25519 signing and verification use the shared scratch implementation.

import {sign as edSign,verify as edVerify,keyPairFromSeed} from './ed25519.mjs';
import {canonicalizeObject} from '../src/canonical/canonical-json.mjs';
import {bytesToBase64url as b64u,base64urlToBytes} from '../src/encoding/base64url.mjs';
import { sha3_384 } from './keccak.mjs';

export function canonical(value) {return new TextDecoder().decode(canonicalizeObject(value));}
function seedFromPrivate(key) {
 let bytes;if(key instanceof Uint8Array)bytes=key;
 else if(typeof key==='string'){const text=key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,'');bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
 else if(key?.export)bytes=new Uint8Array(key.export({format:'der',type:'pkcs8'}));
 else throw new Error('Raw Ed25519 seed or PKCS8 private key required');
 if(bytes.length===32)return bytes;
 const prefix=Uint8Array.from([0x30,0x2e,2,1,0,0x30,5,6,3,0x2b,0x65,0x70,4,0x22,4,0x20]);
 if(bytes.length!==48||!prefix.every((v,i)=>bytes[i]===v))throw new Error('Ed25519 PKCS8 format');return bytes.slice(16);
}

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
        : (privateKeyPem ? b64u(edSign(digest,seedFromPrivate(privateKeyPem))) : null),
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
  try {
    if(bom_seal.sig_alg!=='Ed25519')problems.push('unsupported signature algorithm');
    else if(!bom_seal.pub_b64u||!bom_seal.signature_b64u)problems.push('missing public key or signature');
    else if(!edVerify(base64urlToBytes(bom_seal.signature_b64u),sha3_384(canonical(body)),base64urlToBytes(bom_seal.pub_b64u)))problems.push('signature verification failed');
  }catch{problems.push('malformed public key or signature');}
  return problems;
}
