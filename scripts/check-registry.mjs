#!/usr/bin/env node
import { ALGORITHM_REGISTRY, validateRegistry } from '../src/registry/algorithm-registry.mjs';
import { writeFileSync } from 'node:fs';

const errors = validateRegistry();
writeFileSync('ALGORITHM_REGISTRY.json', JSON.stringify(ALGORITHM_REGISTRY, null, 2) + '\n');

const byStatus = {};
for (const e of ALGORITHM_REGISTRY) byStatus[e.implementationStatus] = (byStatus[e.implementationStatus] || 0) + 1;

console.log(`registry: ${ALGORITHM_REGISTRY.length} entries, ${errors.length} validation errors`);
console.log('by implementation_status:', JSON.stringify(byStatus, null, 2));
if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
