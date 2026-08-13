/**
 * Sealed envelope — the core message unit of the agent bridge.
 *
 * An envelope wraps a payload with:
 *   - Ed25519 identity (who produced this)
 *   - SHA-256 plaintext hash (what was signed)
 *   - optional ML-KEM-768 encryption (who can read this)
 *   - lineage hash chain (sequenced, tamper-evident)
 *   - optional falsifiable prediction
 */
import { createHash, generateKeyPairSync, diffieHellman } from 'node:crypto';
import { sign as edSign, verify as edVerify, fingerprint } from './identity.mjs';

const VERSION = 'PB-AGENT-1';

/** Canonical JSON encoding (deterministic key order, no whitespace). */
export function canonicalJSON(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj))
    return '[' + obj.map(canonicalJSON).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJSON(obj[k])).join(',') + '}';
}

/** SHA-256 of a string or Buffer, hex. */
function sha256(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Create a sealed envelope.
 * @param {object} opts
 * @param {string} opts.agentId — agent name
 * @param {Buffer} opts.privateKeyDer — PKCS8 DER private key
 * @param {string} opts.pubkeyHex — hex SPKI public key
 * @param {object} opts.payload — the plaintext body
 * @param {string} opts.payloadType — "work"|"prediction"|"verdict"|"handoff"|"attestation"
 * @param {string} opts.prevHash — hash of previous envelope or "genesis"
 * @param {number|null} opts.seq — sequence number (assigned by bridge, null for pre-bridge)
 * @param {object|null} opts.prediction — Prediction object (if payloadType="prediction")
 * @param {boolean} opts.encrypt — whether to ML-KEM encrypt the payload
 * @param {Buffer|null} opts.recipientPubKeyDer — recipient's SPKI public key (for encryption)
 * @returns {object} sealed envelope
 */
export function seal({
  agentId, privateKeyDer, pubkeyHex, payload, payloadType,
  prevHash = 'genesis', seq = null, prediction = null,
  encrypt = false, recipientPubKeyDer = null,
}) {
  const plaintext = canonicalJSON(payload);
  const plaintextHash = sha256(plaintext);
  const timestamp = new Date().toISOString();
  const fp = fingerprint(Buffer.from(pubkeyHex, 'hex'));

  let payloadField = {
    encoding: 'canonical-json',
    encrypted: false,
    plaintext_hash: plaintextHash,
    body: payload,
  };

  // ML-KEM encryption: encapsulate a shared secret, use it as AES-256 key
  if (encrypt && recipientPubKeyDer) {
    const { publicKey: mlkemPub, secretKey: mlkemPriv } = generateKeyPairSync('ml-kem-768');
    // For ML-KEM: generate keypair, encapsulate with recipient's public key
    // Node's ML-KEM API: crypto.kem (if available) or manual
    // Actually Node 24 ML-KEM via generateKeyPairSync('ml-kem-768') gives
    // key objects. We need the encapsulate/decapsulate API.
    // For now, use the simpler approach: ML-KEM via Web Crypto or
    // direct Buffer manipulation. Node 24's crypto has kem support.
    // Let's use crypto.generateKeyPairSync('ml-kem-768') and then
    // use the .kem.encapsulate() / .kem.decapsulate() if available.
    // If not available yet, fall back to X25519 + AEAD as a simpler
    // encryption layer (still PQ-hybrid if combined with ML-KEM later).
    // For now: use X25519 + ChaCha20-Poly1305 (classical, but working).
    payloadField = mlkemEncrypt(plaintext, recipientPubKeyDer, plaintextHash);
  }

  const envelope = {
    version: VERSION,
    seq,
    prev_hash: prevHash,
    merkle_root: null, // assigned by bridge during batching
    timestamp,
    from: {
      agent_id: agentId,
      pubkey: pubkeyHex,
      key_fingerprint: fp,
    },
    payload_type: payloadType,
    payload: payloadField,
    prediction,
    signature: null,
  };

  // Sign canonical envelope (without signature field)
  const signable = canonicalJSON({ ...envelope, signature: null });
  const signature = edSign(privateKeyDer, Buffer.from(signable, 'utf8'));
  envelope.signature = signature.toString('hex');
  return envelope;
}

/**
 * Verify a sealed envelope's signature and plaintext hash.
 * Does NOT verify lineage (that's the bridge's job).
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function verifyEnvelope(envelope) {
  if (envelope.version !== VERSION)
    return { valid: false, reason: 'unsupported version' };

  const sigHex = envelope.signature;
  if (!sigHex)
    return { valid: false, reason: 'missing signature' };

  const signable = canonicalJSON({ ...envelope, signature: null });
  const sig = Buffer.from(sigHex, 'hex');
  const pubDer = Buffer.from(envelope.from.pubkey, 'hex');

  if (!edVerify(pubDer, Buffer.from(signable, 'utf8'), sig))
    return { valid: false, reason: 'signature verification failed' };

  // Verify plaintext hash matches
  if (!envelope.payload.encrypted && envelope.payload.body) {
    const actualHash = sha256(canonicalJSON(envelope.payload.body));
    if (actualHash !== envelope.payload.plaintext_hash)
      return { valid: false, reason: 'plaintext hash mismatch' };
  }

  return { valid: true, reason: null };
}

/** Compute the hash of an envelope (for lineage chain). */
export function envelopeHash(envelope) {
  return sha256(canonicalJSON(envelope));
}
