/**
 * Agent identity — Ed25519 keypair generation, registration, fingerprinting.
 * Keypairs stored in ~/.proofbundle/agent/<agent_id>/
 *
 * Keys and signatures are DER-wrapped (PKCS8 for private, SPKI for public)
 * so every consumer of this module (bridge.mjs, envelope.mjs,
 * pb-spawn-register.mjs, agent-init.mjs) and every identity already on disk
 * keeps working unchanged. Ed25519 has no algorithm parameters, so that
 * wrapping is one fixed 16/12-byte prefix around the raw 32-byte key — no
 * ASN.1 library needed, just a Buffer.concat. The actual signing math comes
 * from crypto/ed25519.mjs (from-scratch, RFC 8032), not node:crypto.
 * node:crypto appears here only for randomBytes (OS entropy), same
 * convention already used for ML-KEM keygen in pb-spawn-register.mjs.
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { keyPairFromSeed, sign as edSign, verify as edVerify } from '../crypto/ed25519.mjs';
import { sha256 } from '../crypto/sha256.mjs';

const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');
const toHex = (b) => Buffer.from(b).toString('hex');

// RFC 8410 fixed OneAsymmetricKey / SubjectPublicKeyInfo headers for
// Ed25519 — constant because the algorithm carries no parameters.
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

const derWrapPriv = (seed32) => Buffer.concat([PKCS8_PREFIX, Buffer.from(seed32)]);
const derWrapPub = (pub32) => Buffer.concat([SPKI_PREFIX, Buffer.from(pub32)]);
const derUnwrapPriv = (der) => new Uint8Array(der.subarray(der.length - 32));
const derUnwrapPub = (der) => new Uint8Array(der.subarray(der.length - 32));

/** Key fingerprint: SHA-256(SPKI public key) first 16 bytes, hex (32 chars). */
export function fingerprint(publicKeyDer) {
  return toHex(sha256(new Uint8Array(publicKeyDer))).slice(0, 32);
}

/** Create or load an agent identity. Returns identity + privateKeyDer. */
export function loadOrCreateIdentity(agentId) {
  const dir = join(AGENT_DIR, agentId);
  const identityFile = join(dir, 'identity.json');
  const secretFile = join(dir, 'secret.key');

  if (existsSync(identityFile) && existsSync(secretFile)) {
    const identity = JSON.parse(readFileSync(identityFile, 'utf8'));
    const privateKeyDer = readFileSync(secretFile);
    return { ...identity, privateKeyDer };
  }

  mkdirSync(dir, { recursive: true });
  const seed = new Uint8Array(randomBytes(32));
  const { publicKey } = keyPairFromSeed(seed);
  const pubDer = derWrapPub(publicKey);
  const privDer = derWrapPriv(seed);
  const fp = fingerprint(pubDer);
  const createdAt = new Date().toISOString();

  const identity = {
    agent_id: agentId,
    pubkey: toHex(pubDer),
    key_fingerprint: fp,
    created_at: createdAt,
  };
  writeFileSync(identityFile, JSON.stringify(identity, null, 2));
  writeFileSync(secretFile, privDer);
  chmodSync(secretFile, 0o600);
  return { ...identity, privateKeyDer: privDer };
}

/** Sign a message with a PKCS8 DER private key. Returns 64-byte Buffer. */
export function sign(privateKeyDer, message) {
  const seed = derUnwrapPriv(privateKeyDer);
  return Buffer.from(edSign(new Uint8Array(message), seed));
}

/** Verify an Ed25519 signature against an SPKI DER public key (hex or Buffer). */
export function verify(publicKeyDerOrHex, message, signature) {
  const der = typeof publicKeyDerOrHex === 'string'
    ? Buffer.from(publicKeyDerOrHex, 'hex')
    : publicKeyDerOrHex;
  const pub = derUnwrapPub(der);
  return edVerify(new Uint8Array(signature), new Uint8Array(message), pub);
}
