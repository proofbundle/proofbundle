import { readFileSync, writeFileSync } from 'node:fs';
import { signBytes, verifyBytes } from '../../signature/signature.mjs';
import { importPrivateKey, importPublicKey } from '../../keys/key-generation.mjs';
import { bytesToHex, hexToBytes } from '../../encoding/hex.mjs';
import { EXIT_CODES } from '../output.mjs';

function loadKeyfile(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function runSign({ positional, flags }) {
  const file = positional[0];
  if (!file || !flags.key) {
    process.stderr.write('usage: proofbundle sign <file> --key keyfile.json [--out signature.json] [--json]\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  let message, keyfile;
  try {
    message = new Uint8Array(readFileSync(file));
    keyfile = loadKeyfile(flags.key);
  } catch (e) {
    process.stderr.write(`sign: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
  const algId = flags.alg || keyfile.algorithm;
  try {
    const priv = importPrivateKey(hexToBytes(keyfile.privateKeyPkcs8Hex));
    const signature = signBytes(algId, priv, message, { keyId: keyfile.keyId });
    const record = {
      algorithm: algId,
      keyId: keyfile.keyId,
      file,
      publicKeySpkiHex: keyfile.publicKeySpkiHex,
      signatureHex: bytesToHex(signature),
    };
    if (flags.out) {
      writeFileSync(flags.out, JSON.stringify(record, null, 2) + '\n');
      if (!flags.quiet) process.stdout.write(`wrote ${flags.out}\n`);
    } else if (flags.json) {
      process.stdout.write(JSON.stringify(record, null, 2) + '\n');
    } else if (!flags.quiet) {
      process.stdout.write(`${record.signatureHex}\n`);
    }
    return EXIT_CODES.OK;
  } catch (e) {
    process.stderr.write(`sign: ${e.message}\n`);
    return e.verdict ? EXIT_CODES.VERIFICATION_FAILED : EXIT_CODES.INTERNAL_ERROR;
  }
}

export function runVerify({ positional, flags }) {
  const file = positional[0];
  if (!file || !flags.signature) {
    process.stderr.write('usage: proofbundle verify <file> --signature signature.json [--json]\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  let message, sigRecord;
  try {
    message = new Uint8Array(readFileSync(file));
    sigRecord = loadKeyfile(flags.signature);
  } catch (e) {
    process.stderr.write(`verify: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
  try {
    const pub = importPublicKey(hexToBytes(sigRecord.publicKeySpkiHex));
    const ok = verifyBytes(sigRecord.algorithm, pub, message, hexToBytes(sigRecord.signatureHex), { keyId: sigRecord.keyId });
    const verdict = ok ? 'VERIFIED' : 'INVALID_SIGNATURE';
    const out = {
      verdict,
      algorithm: sigRecord.algorithm,
      keyId: sigRecord.keyId,
      file,
      // Stated on every successful verification, because the single most
      // common misreading of this tool is that a valid signature makes the
      // signed statement true. It does not.
      scope: 'A VERIFIED result means this key produced a signature over these exact bytes. It does not establish that the signed statement is true, nor who controls the key.',
    };
    if (flags.json) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    else if (!flags.quiet) process.stdout.write(`${verdict}  ${file}  (${sigRecord.algorithm}, keyId ${sigRecord.keyId})\n`);
    return ok ? EXIT_CODES.OK : EXIT_CODES.VERIFICATION_FAILED;
  } catch (e) {
    process.stderr.write(`verify: ${e.message}\n`);
    if (!flags.quiet && flags.json) process.stdout.write(JSON.stringify({ verdict: e.verdict ?? 'INTERNAL_ERROR', message: e.message }, null, 2) + '\n');
    return e.verdict ? EXIT_CODES.VERIFICATION_FAILED : EXIT_CODES.INTERNAL_ERROR;
  }
}
