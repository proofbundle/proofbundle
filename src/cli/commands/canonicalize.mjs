import { readFileSync } from 'node:fs';
import { strictParseJSON, canonicalizeValue } from '../../canonical/canonical-json.mjs';
import { bytesToHex } from '../../encoding/hex.mjs';
import { EXIT_CODES } from '../output.mjs';

export function runCanonicalize({ positional, flags }) {
  const file = positional[0];
  if (!file) {
    process.stderr.write('usage: proofbundle canonicalize <file.json> [--json]\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  let text;
  try {
    text = readFileSync(file, 'utf-8');
  } catch (e) {
    process.stderr.write(`canonicalize: cannot read ${file}: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }
  try {
    const value = strictParseJSON(text);
    const bytes = canonicalizeValue(value);
    const out = new TextDecoder('utf-8').decode(bytes);
    if (flags.json) {
      process.stdout.write(JSON.stringify({ file, canonical: out, sha256OfCanonical: null }, null, 2) + '\n');
    } else {
      process.stdout.write(out + '\n');
    }
    process.stderr.write(`canonicalize: ${bytes.length} bytes, sha256-ready hex-inspectable via 'proofbundle hash'\n`);
    return EXIT_CODES.OK;
  } catch (e) {
    process.stderr.write(`canonicalize: MALFORMED — ${e.message}\n`);
    return EXIT_CODES.VERIFICATION_FAILED;
  }
}
