#!/usr/bin/env node
// Entry point for the src/ CLI slice. Only the commands actually
// implemented in this pass are wired here; everything else in the full
// spec's command list is not yet built and is not silently accepted —
// running an unimplemented command name prints an explicit message and
// exits with a usage error rather than doing nothing.

import { parseArgs } from '../src/cli/argument-parser.mjs';
import { runHash } from '../src/cli/commands/hash.mjs';
import { runCanonicalize } from '../src/cli/commands/canonicalize.mjs';
import { EXIT_CODES } from '../src/cli/output.mjs';

const IMPLEMENTED = new Set(['hash', 'canonicalize']);
const [, , command, ...rest] = process.argv;
const args = parseArgs(rest);

if (!command || command === '--help' || command === '-h') {
  process.stdout.write('proofbundle <command> [options]\n\nImplemented in this pass: hash, canonicalize\n');
  process.exit(command ? EXIT_CODES.OK : EXIT_CODES.USAGE_ERROR);
}

if (!IMPLEMENTED.has(command)) {
  process.stderr.write(`proofbundle: '${command}' is defined in the specification but not implemented in this pass. Implemented: ${[...IMPLEMENTED].join(', ')}\n`);
  process.exit(EXIT_CODES.USAGE_ERROR);
}

let code;
if (command === 'hash') code = runHash(args);
else if (command === 'canonicalize') code = runCanonicalize(args);
process.exit(code);
