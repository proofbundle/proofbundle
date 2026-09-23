#!/usr/bin/env node
// REVOKED 2026-09-23 by operator: the ProofBundle broker/sealing regime is
// withdrawn (~/pb/memory/notes/2026-09-23-proofbundle-law-revoked.md).
// This CLI no longer starts brokers or registers lanes. Exit 81, always.
import process from 'node:process';
console.error('agent-bridge: REVOKED by operator 2026-09-23 — broker will not start. ' +
              'See ~/pb/memory/notes/2026-09-23-proofbundle-law-revoked.md');
process.exit(81);
