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
import {createHash} from '../crypto/hash.mjs';
import {randomBytes} from '../crypto/random.mjs';
import {x25519Keygen,x25519Shared} from '../crypto/x25519.mjs';
import {hkdfSha256} from '../crypto/hkdf.mjs';
import {chacha20poly1305Seal,chacha20poly1305Open} from '../crypto/chacha20-poly1305.mjs';
import {canonicalizeObject,parseJSON} from '../src/canonical/canonical-json.mjs';
import { sign as edSign, verify as edVerify, fingerprint } from './identity.mjs';

const VERSION = 'PB-AGENT-1';
// Classical X25519/HKDF/ChaCha wire profile; scratch providers preserve it.
export const KX_ALG = 'x25519-hkdf-sha256-chacha20poly1305-v1';

/** Canonical JSON encoding (deterministic key order, no whitespace). */
export function canonicalJSON(object) {return new TextDecoder().decode(canonicalizeObject(object));}

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
 * @param {boolean} opts.encrypt — whether to encrypt the payload
 * @param {string|null} opts.recipientEncPubKeyHex — recipient's raw X25519 public key, hex (for encryption)
 * @returns {object} sealed envelope
 */
export function seal({
  agentId, privateKeyDer, pubkeyHex, payload, payloadType,
  prevHash = 'genesis', seq = null, prediction = null,
  encrypt = false, recipientEncPubKeyHex = null,
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

  // Hybrid encryption: ephemeral X25519 ECDH -> HKDF-SHA256(random salt) ->
  // ChaCha20-Poly1305. AAD = that random salt, NOT plaintext_hash — see
  // encryptPayload doc comment for why binding to a plaintext-derived value
  // was a public preimage oracle on low-entropy payloads.
  if (encrypt && recipientEncPubKeyHex) {
    payloadField = encryptPayload(plaintext, recipientEncPubKeyHex);
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
 *
 * SECURITY: this checks the signature against envelope.from.pubkey — the key
 * EMBEDDED IN THE ENVELOPE ITSELF. It proves the envelope is internally
 * self-consistent (this specific key signed this specific content), NOT that
 * from.agent_id actually owns that key. Anyone can construct an envelope
 * naming any agent_id, sign it with a key they control, and this returns
 * valid: true. A caller that needs identity assurance MUST additionally
 * cross-check envelope.from.pubkey against an independently-trusted source
 * (the bridge registry — see verifyAgainstLog in bridge.mjs, which does this).
 * Do not treat verifyEnvelope() alone as proof of who sent something.
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

/**
 * Encrypt a canonical-JSON plaintext to a recipient's X25519 public key.
 * Ephemeral-static ECDH -> HKDF-SHA256(salt=random, info=KX_ALG) -> ChaCha20-
 * Poly1305 with AAD=that same random salt.
 *
 * SECURITY: the salt/AAD MUST NOT be derived from the plaintext. An earlier
 * version used sha256(plaintext) here, exposed in the clear on a signed,
 * publicly-readable, permanently-anchored envelope — a preimage oracle: any
 * guessable candidate plaintext (short status strings, common JSON shapes)
 * could be hash-guessed against that public field for a non-repudiable,
 * Ed25519-signed, OTS-anchored confirmation of exactly what was said, with
 * no decryption key required. A random salt carries zero information about
 * the plaintext, so there's nothing to guess against. ChaCha20-Poly1305's
 * own auth tag already gives tamper-evidence — no separate plaintext-derived
 * commitment is needed for integrity either.
 * @param {string} plaintext — canonical JSON
 * @param {string} recipientEncPubKeyHex — raw 32-byte X25519 public key, hex
 */
export function encryptPayload(plaintext, recipientEncPubKeyHex) {
 if(typeof recipientEncPubKeyHex!=='string'||!/^[0-9a-f]{64}$/i.test(recipientEncPubKeyHex))throw new Error('X25519 recipient key length/encoding');
 const eph=x25519Keygen(randomBytes(32)),shared=x25519Shared(eph.privateKey,new Uint8Array(Buffer.from(recipientEncPubKeyHex,'hex')));
 if(shared.every(x=>x===0))throw new Error('X25519 low-order recipient key');
 const salt=randomBytes(32),nonce=randomBytes(12),key=hkdfSha256(shared,32,salt,new TextEncoder().encode(KX_ALG));
 const encrypted=chacha20poly1305Seal(key,nonce,new TextEncoder().encode(plaintext),salt),ciphertext=Buffer.concat([Buffer.from(encrypted.ciphertext),Buffer.from(encrypted.tag)]);
 return {encoding:'canonical-json',encrypted:true,kx:KX_ALG,ciphertext:ciphertext.toString('hex'),encapsulated_key:Buffer.from(eph.publicKey).toString('hex'),nonce:nonce.toString('hex'),kx_salt:salt.toString('hex'),body:null};
}

/**
 * Decrypt an encrypted payload field with the recipient's X25519 private key.
 * @param {object} payloadField — envelope.payload from an encrypted envelope
 * @param {Buffer} recipientEncPrivKeyDer — PKCS8 DER X25519 private key
 * @returns {object} the decrypted plaintext body (parsed canonical JSON)
 */
export function decryptPayload(payloadField, recipientEncPrivKeyDer) {
 if(!payloadField.encrypted||payloadField.kx!==KX_ALG)throw new Error('Unsupported encrypted payload');
 const prefix=Buffer.from('302e020100300506032b656e04220420','hex'),der=Buffer.from(recipientEncPrivKeyDer);
 if(der.length!==48||!der.subarray(0,16).equals(prefix))throw new Error('X25519 private DER');
 const remote=Buffer.from(payloadField.encapsulated_key,'hex');if(remote.length!==32)throw new Error('X25519 ephemeral key length');
 const shared=x25519Shared(new Uint8Array(der.subarray(16)),new Uint8Array(remote));if(shared.every(x=>x===0))throw new Error('X25519 low-order ephemeral key');
 const salt=Buffer.from(payloadField.kx_salt,'hex'),nonce=Buffer.from(payloadField.nonce,'hex'),data=Buffer.from(payloadField.ciphertext,'hex');if(salt.length!==32||data.length<16)throw new Error('Encrypted payload length');
 const key=hkdfSha256(shared,32,salt,new TextEncoder().encode(KX_ALG)),plaintext=chacha20poly1305Open(key,nonce,data.subarray(0,-16),data.subarray(-16),salt);
 return parseJSON(new TextDecoder('utf-8',{fatal:true}).decode(plaintext));
}
