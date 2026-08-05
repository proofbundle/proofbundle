import { writeFileSync } from 'node:fs';
import { generateKeyPair, generatableAlgorithms, exportPublicKey, exportPrivateKey } from '../../keys/key-generation.mjs';
import { bytesToHex } from '../../encoding/hex.mjs';
import { EXIT_CODES } from '../output.mjs';

export function runKeygen({ positional, flags }) {
  const algId = flags.alg || positional[0];
  if (!algId) {
    process.stderr.write(`usage: proofbundle keygen --alg <algorithm> [--out keyfile.json] [--json]\nGeneratable: ${generatableAlgorithms().join(', ')}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
  let kp;
  try {
    kp = generateKeyPair(algId);
  } catch (e) {
    process.stderr.write(`keygen: ${e.message}\n`);
    // A refusal to generate is a real, stable outcome, not an internal error.
    return e.verdict ? EXIT_CODES.VERIFICATION_FAILED : EXIT_CODES.USAGE_ERROR;
  }
  const record = {
    algorithm: kp.algId,
    keyId: kp.keyId,
    publicKeySpkiHex: bytesToHex(kp.spki),
    privateKeyPkcs8Hex: bytesToHex(kp.pkcs8),
    publicKeyPem: exportPublicKey(kp.publicKey, 'pem'),
    privateKeyPem: exportPrivateKey(kp.privateKey, 'pem'),
  };
  if (flags.out) {
    writeFileSync(flags.out, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
    if (!flags.quiet) process.stdout.write(`wrote ${flags.out} (mode 0600)\nkeyId: ${kp.keyId}\n`);
    return EXIT_CODES.OK;
  }
  if (flags.json) process.stdout.write(JSON.stringify(record, null, 2) + '\n');
  else if (!flags.quiet) process.stdout.write(`algorithm: ${kp.algId}\nkeyId: ${kp.keyId}\npublicKeySpkiHex: ${record.publicKeySpkiHex}\n`);
  return EXIT_CODES.OK;
}
