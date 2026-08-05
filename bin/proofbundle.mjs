#!/usr/bin/env node
// Entry point for the src/ CLI.
//
// Only commands actually implemented are wired here. Every other command name
// in the full specification is listed as NOT IMPLEMENTED and exits with a
// usage error — an unimplemented command never silently succeeds, and never
// silently does nothing.

import { parseArgs } from '../src/cli/argument-parser.mjs';
import { runHash } from '../src/cli/commands/hash.mjs';
import { runCanonicalize } from '../src/cli/commands/canonicalize.mjs';
import { runKeygen } from '../src/cli/commands/keygen.mjs';
import { runSign, runVerify } from '../src/cli/commands/sign.mjs';
import {
  runMerkleBuild, runMerkleProve, runMerkleVerify,
  runMmrAppend, runMmrProve, runMmrVerify,
  runLineageCreate, runLineageVerify,
} from '../src/cli/commands/accumulator.mjs';
import { runDoctor, runAlgorithms, runVersion } from '../src/cli/commands/doctor.mjs';
import { EXIT_CODES } from '../src/cli/output.mjs';

const HANDLERS = new Map([
  ['hash', runHash],
  ['canonicalize', runCanonicalize],
  ['keygen', runKeygen],
  ['sign', runSign],
  ['verify', runVerify],
  ['merkle-build', runMerkleBuild],
  ['merkle-prove', runMerkleProve],
  ['merkle-verify', runMerkleVerify],
  ['mmr-append', runMmrAppend],
  ['mmr-prove', runMmrProve],
  ['mmr-verify', runMmrVerify],
  ['lineage-create', runLineageCreate],
  ['lineage-verify', runLineageVerify],
  ['doctor', runDoctor],
  ['algorithms', runAlgorithms],
  ['version', runVersion],
]);

// Named in the specification, deliberately not built in this slice. Listed so
// `proofbundle --help` tells the truth about the gap instead of omitting it.
const NOT_IMPLEMENTED = [
  'init', 'encrypt', 'decrypt', 'timestamp', 'timestamp-upgrade',
  'redact', 'disclose', 'policy-check', 'inspect', 'migrate', 'convert',
  'vectors', 'ingest', 'orchestrate',
];

const [, , command, ...rest] = process.argv;
const args = parseArgs(rest);

if (!command || command === '--help' || command === '-h') {
  process.stdout.write('proofbundle <command> [options]\n\n');
  process.stdout.write(`Implemented:     ${[...HANDLERS.keys()].join(', ')}\n`);
  process.stdout.write(`Not implemented: ${NOT_IMPLEMENTED.join(', ')}\n\n`);
  process.stdout.write('Global flags: --json (deterministic JSON output), --quiet\n');
  process.stdout.write('Exit codes: 0 ok, 1 verification failed, 2 usage error, 70 internal error\n');
  process.exit(command ? EXIT_CODES.OK : EXIT_CODES.USAGE_ERROR);
}

const handler = HANDLERS.get(command);
if (!handler) {
  const known = NOT_IMPLEMENTED.includes(command);
  process.stderr.write(known
    ? `proofbundle: '${command}' is defined in the specification but is NOT IMPLEMENTED in this build.\n`
    : `proofbundle: unknown command '${command}'.\n`);
  process.stderr.write(`Implemented: ${[...HANDLERS.keys()].join(', ')}\n`);
  process.exit(EXIT_CODES.USAGE_ERROR);
}

let code;
try {
  code = handler(args);
} catch (e) {
  process.stderr.write(`proofbundle ${command}: ${e.message}\n`);
  code = e.verdict ? EXIT_CODES.VERIFICATION_FAILED : EXIT_CODES.INTERNAL_ERROR;
}
process.exit(code);
