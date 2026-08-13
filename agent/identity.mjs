/**
 * Agent identity — Ed25519 keypair generation, registration, fingerprinting.
 * Keypairs stored in ~/.proofbundle/agent/<agent_id>/
 */
import {
  generateKeyPairSync, createPrivateKey, createPublicKey,
  createHash, sign as cryptoSign, verify as cryptoVerify,
} from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const AGENT_DIR = join(homedir(), '.proofbundle', 'agent');
const toHex = (b) => Buffer.from(b).toString('hex');

/** Key fingerprint: SHA-256(SPKI public key) first 16 bytes, hex (32 chars). */
export function fingerprint(publicKeyDer) {
  return createHash('sha256').update(publicKeyDer).digest('hex').slice(0, 32);
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
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });
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
  const keyObj = createPrivateKey({ key: privateKeyDer, format: 'der', type: 'pkcs8' });
  return cryptoSign(null, message, keyObj);
}

/** Verify an Ed25519 signature against an SPKI DER public key (hex or Buffer). */
export function verify(publicKeyDerOrHex, message, signature) {
  const der = typeof publicKeyDerOrHex === 'string'
    ? Buffer.from(publicKeyDerOrHex, 'hex')
    : publicKeyDerOrHex;
  const keyObj = createPublicKey({ key: der, format: 'der', type: 'spki' });
  return cryptoVerify(null, message, keyObj, signature);
}
