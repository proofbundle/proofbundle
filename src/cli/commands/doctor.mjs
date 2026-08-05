// doctor / algorithms / version.
//
// `doctor` is the provider-capability report: what this build can actually
// do here, and for everything it cannot, the exact reason. It never reports
// a capability it has not probed.

import { readFileSync } from 'node:fs';
import { providerReport } from '../../providers/capabilities.mjs';
import { ALGORITHM_REGISTRY } from '../../registry/algorithm-registry.mjs';
import { VERDICTS } from '../../verdict/verdict.mjs';
import { EXIT_CODES } from '../output.mjs';

export function runDoctor({ flags }) {
  const report = providerReport();
  const byStatus = {};
  for (const e of ALGORITHM_REGISTRY) byStatus[e.implementationStatus] = (byStatus[e.implementationStatus] ?? 0) + 1;
  const out = {
    node: report.node,
    platform: report.platform,
    openssl: report.openssl,
    registryEntries: ALGORITHM_REGISTRY.length,
    byImplementationStatus: byStatus,
    verdictCodes: VERDICTS.length,
    providersAvailable: report.available,
    providersUnavailable: report.unavailable,
    leanToolchain: 'NOT INSTALLED — no Lean theorem in this project is claimed as compiled',
  };
  if (flags.json) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  else if (!flags.quiet) {
    process.stdout.write(`node ${out.node} on ${out.platform} (openssl ${out.openssl})\n`);
    process.stdout.write(`registry: ${out.registryEntries} entries — ${JSON.stringify(byStatus)}\n`);
    process.stdout.write(`verdict codes: ${out.verdictCodes}\n`);
    process.stdout.write(`providers available: ${out.providersAvailable.join(', ')}\n`);
    process.stdout.write('providers unavailable:\n');
    for (const u of out.providersUnavailable) process.stdout.write(`  ${u.providerId}: ${u.reason}\n`);
    process.stdout.write(`lean: ${out.leanToolchain}\n`);
  }
  return EXIT_CODES.OK;
}

export function runAlgorithms({ flags }) {
  const rows = ALGORITHM_REGISTRY
    .filter((e) => !flags.family || e.primitiveFamily === flags.family)
    .filter((e) => !flags.status || e.implementationStatus === flags.status)
    .map((e) => ({ id: e.id, family: e.primitiveFamily, class: e.implementationClass, status: e.implementationStatus }));
  if (flags.json) process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
  else if (!flags.quiet) for (const r of rows) process.stdout.write(`${r.id.padEnd(28)} ${String(r.family).padEnd(18)} ${String(r.class).padEnd(22)} ${r.status}\n`);
  return EXIT_CODES.OK;
}

export function runVersion({ flags }) {
  let pkg = {};
  try { pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')); } catch { /* version falls back below */ }
  const out = {
    implementationVersion: pkg.version ?? 'unknown',
    formatVersion: 'PB/v1',
    node: process.version,
    // Kept separate on purpose: the implementation version and the protocol
    // version move independently, and conflating them is how a UI ends up
    // claiming a protocol guarantee the build does not have.
    note: 'implementationVersion is this package; formatVersion is the on-the-wire ProofBundle format. They are not the same number.',
  };
  if (flags.json) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  else if (!flags.quiet) process.stdout.write(`proofbundle ${out.implementationVersion} (format ${out.formatVersion}, node ${out.node})\n`);
  return EXIT_CODES.OK;
}
