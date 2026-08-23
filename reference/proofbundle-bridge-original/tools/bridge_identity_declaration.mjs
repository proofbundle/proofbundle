import crypto from 'node:crypto';
import fs from 'node:fs';

const DECLARATION_SCHEMA = 'ProofBundleIdentityDeclaration/v1.0.0';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
}

function sha256Bytes(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function generateEd25519Keypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    public_key_ed25519_spki_hex: publicKey.export({ type: 'spki', format: 'der' }).toString('hex').toUpperCase(),
    private_key_ed25519_pkcs8_hex: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex').toUpperCase(),
  };
}

function loadPrivateKey(pkcs8Hex) {
  return crypto.createPrivateKey({
    key: Buffer.from(pkcs8Hex, 'hex'),
    format: 'der',
    type: 'pkcs8',
  });
}

function signDeclarationHash(privateKeyPkcs8Hex, declarationSha256) {
  const privateKey = loadPrivateKey(privateKeyPkcs8Hex);
  const digest = Buffer.from(declarationSha256, 'hex');
  return crypto.sign(null, digest, privateKey).toString('hex').toUpperCase();
}

function identityObjectSha256(identity) {
  const copy = { ...identity };
  delete copy.private_key_ed25519_pkcs8_hex;
  delete copy.identity_sha256;
  return sha256(stableJson(copy));
}

export function ensureIdentityKeypair(identityFile) {
  if (!identityFile || !fs.existsSync(identityFile)) {
    throw new Error(`identity file required for declaration: ${identityFile ?? '(missing)'}`);
  }
  const identity = JSON.parse(fs.readFileSync(identityFile, 'utf8'));
  let changed = false;
  if (!identity.public_key_ed25519_spki_hex || !identity.private_key_ed25519_pkcs8_hex) {
    const keys = generateEd25519Keypair();
    identity.public_key_ed25519_spki_hex = keys.public_key_ed25519_spki_hex;
    identity.private_key_ed25519_pkcs8_hex = keys.private_key_ed25519_pkcs8_hex;
    changed = true;
  }
  const nextIdentitySha = identityObjectSha256(identity);
  if (identity.identity_sha256 !== nextIdentitySha) {
    identity.identity_sha256 = nextIdentitySha;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(identityFile, `${JSON.stringify(identity, null, 2)}\n`, 'utf8');
  }
  return {
    identity,
    identityFile,
    identityFileSha256: sha256Bytes(fs.readFileSync(identityFile)),
    identityObjectSha256: nextIdentitySha,
    privateKeyFingerprintSha256: sha256Bytes(Buffer.from(identity.private_key_ed25519_pkcs8_hex, 'hex')),
  };
}

export function buildIdentityDeclaration({ identityFile, messageBody }) {
  const material = ensureIdentityKeypair(identityFile);
  const { identity } = material;
  const declaredAtUtc = new Date().toISOString();
  const messageBodySha256 = sha256(String(messageBody ?? ''));

  const unsignedDeclaration = {
    schema: DECLARATION_SCHEMA,
    declared_at_utc: declaredAtUtc,
    identity_id: identity.identity_id ?? null,
    display_name: identity.display_name ?? null,
    bridge_name: identity.bridge_name ?? identity.identity_id ?? null,
    role: identity.role ?? null,
    model: identity.model ?? null,
    lane: identity.lane ?? null,
    identity_file: identityFile,
    identity_file_sha256: material.identityFileSha256,
    identity_object_sha256: material.identityObjectSha256,
    identity_sha256: identity.identity_sha256 ?? material.identityObjectSha256,
    public_key_ed25519_spki_hex: identity.public_key_ed25519_spki_hex,
    private_key_ed25519_pkcs8_sha256: material.privateKeyFingerprintSha256,
    message_body_sha256: messageBodySha256,
  };

  const declarationSha256 = sha256(stableJson(unsignedDeclaration));
  const signatureEd25519Hex = signDeclarationHash(
    identity.private_key_ed25519_pkcs8_hex,
    declarationSha256,
  );

  const declaration = {
    ...unsignedDeclaration,
    declaration_sha256: declarationSha256,
    signature_ed25519_hex: signatureEd25519Hex,
  };

  const textPrefix = [
    '=== IDENTITY_DECLARATION ===',
    `declared_at_utc: ${declaredAtUtc}`,
    `identity_id: ${declaration.identity_id}`,
    `display_name: ${declaration.display_name}`,
    `message_body_sha256: ${messageBodySha256}`,
    `identity_object_sha256: ${declaration.identity_object_sha256}`,
    `identity_file_sha256: ${declaration.identity_file_sha256}`,
    `private_key_ed25519_pkcs8_sha256: ${declaration.private_key_ed25519_pkcs8_sha256}`,
    `public_key_ed25519_spki_hex: ${declaration.public_key_ed25519_spki_hex}`,
    `declaration_sha256: ${declarationSha256}`,
    `signature_ed25519_hex: ${signatureEd25519Hex}`,
    '=== END IDENTITY_DECLARATION ===',
    '',
  ].join('\n');

  return {
    declaration,
    textWithDeclaration: `${textPrefix}${String(messageBody ?? '')}`,
  };
}

export function verifyIdentityDeclaration(declaration) {
  if (!declaration || declaration.schema !== DECLARATION_SCHEMA) {
    return { ok: false, reason: 'missing_or_unsupported_schema' };
  }
  const copy = { ...declaration };
  const expectedDeclarationSha = copy.declaration_sha256;
  const signature = copy.signature_ed25519_hex;
  delete copy.declaration_sha256;
  delete copy.signature_ed25519_hex;
  const computedDeclarationSha = sha256(stableJson(copy));
  if (expectedDeclarationSha !== computedDeclarationSha) {
    return { ok: false, reason: 'declaration_sha256_mismatch' };
  }
  if (!copy.public_key_ed25519_spki_hex || !signature) {
    return { ok: false, reason: 'missing_public_key_or_signature' };
  }
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(copy.public_key_ed25519_spki_hex, 'hex'),
      format: 'der',
      type: 'spki',
    });
    const digest = Buffer.from(expectedDeclarationSha, 'hex');
    const valid = crypto.verify(null, digest, publicKey, Buffer.from(signature, 'hex'));
    return valid ? { ok: true } : { ok: false, reason: 'signature_invalid' };
  } catch (error) {
    return { ok: false, reason: `verify_error:${error.message}` };
  }
}