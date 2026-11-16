// proofbundle verify — check a hybrid manifest, its Merkle root, its signatures
// and (optionally) its OpenTimestamps proofs, using this repo's own primitives.
//
// Why this lives in the client rather than in one lane's script: a manifest is
// only worth signing if the party receiving it can re-derive every number in it.
// Everything here recomputes from bytes; nothing trusts a recorded digest.
//
// Usage:
//   proofbundle verify <manifest.tsv> [--root <dir>] [--ots] [--json]
//
//   <manifest.tsv>  header: path bytes sha256 sha384 blake3 hybrid
//   --root <dir>    prefix for relative paths (default: $HOME)
//   --ots           also compare each file's .ots proof digest (shells out to ots)
//   --json          machine-readable result
//
// Exit codes: 0 all checks passed, 1 any check failed, 2 usage error.
import { readFileSync, existsSync } from 'node:fs';
import { join, sep, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { sha256 } from '../../../crypto/sha256.mjs';
import { sha384 } from '../../../crypto/sha512.mjs';
import { blake3 } from '../../../crypto/blake3.mjs';
import { verify as ed25519Verify } from '../../../crypto/ed25519.mjs';
import { EXIT_CODES } from '../output.mjs';

const hex = (u8) => Buffer.from(u8).toString('hex');

function cat(...xs) {
  const out = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of xs) { out.set(x, o); o += x.length; }
  return out;
}

// Merkle root over the hybrid column, ascending path order, BLAKE3(left||right),
// odd node promoted (not duplicated) — the same rule the manifest states.
function merkleRoot(leaves) {
  let level = leaves.map((h) => Buffer.from(h, 'hex'));
  const counts = [level.length];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length
        ? Buffer.from(blake3(Uint8Array.from(Buffer.concat([level[i], level[i + 1]]))))
        : level[i]);
    }
    level = next;
    counts.push(level.length);
  }
  return { root: level[0].toString('hex'), counts };
}

export function runVerify({ positional, flags }) {
  const manifestPath = positional[0];
  if (!manifestPath) {
    process.stderr.write('usage: proofbundle verify <manifest.tsv> [--root <dir>] [--ots] [--json]\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  let text;
  try { text = readFileSync(manifestPath, 'utf8'); }
  catch (e) {
    process.stderr.write(`verify: cannot read ${manifestPath}: ${e.message}\n`);
    return EXIT_CODES.USAGE_ERROR;
  }

  // Manifest paths are usually home-relative; --root overrides this. Falling
  // back to the manifest's own directory would silently mis-resolve them.
  const root = flags.root ? resolve(String(flags.root)) : (process.env.HOME || '/');
  const lines = text.split('\n').filter(Boolean);
  const header = lines[0].split('\t');
  if (header.length < 6) {
    process.stderr.write('verify: manifest header must have at least 6 columns\n');
    return EXIT_CODES.USAGE_ERROR;
  }
  const rows = lines.slice(1).map((l) => l.split('\t'));

  const failures = [];
  let checked = 0;
  for (const r of rows) {
    const [rel, bytes, sha256Expect, sha384Expect, blake3Expect, hybridExpect] = r;
    // Hostile manifest entries: an absolute path, or one that walks out of the
    // root with .., would make the verifier read files outside the tree it was
    // asked to check. Both are rejected rather than resolved.
    if (rel.startsWith('/')) { failures.push({ path: rel, why: 'absolute path in manifest' }); continue; }
    const abs = resolve(root, rel);
    if (abs !== resolve(root) && !abs.startsWith(resolve(root) + sep)) {
      failures.push({ path: rel, why: 'path escapes the root' });
      continue;
    }
    let data;
    try { data = readFileSync(abs); }
    catch (e) { failures.push({ path: rel, why: `unreadable: ${e.code}` }); continue; }
    checked++;

    const s256 = Buffer.from(sha256(Uint8Array.from(data)));
    const s384 = Buffer.from(sha384(Uint8Array.from(data)));
    const b3 = Buffer.from(blake3(Uint8Array.from(data)));
    const hy = Buffer.from(blake3(Uint8Array.from(Buffer.concat([s256, s384]))));

    if (String(data.length) !== bytes) failures.push({ path: rel, why: `size ${data.length} != ${bytes}` });
    if (s256.toString('hex') !== sha256Expect) failures.push({ path: rel, why: 'sha256 mismatch' });
    if (s384.toString('hex') !== sha384Expect) failures.push({ path: rel, why: 'sha384 mismatch' });
    if (b3.toString('hex') !== blake3Expect) failures.push({ path: rel, why: 'blake3 mismatch' });
    if (hy.toString('hex') !== hybridExpect) failures.push({ path: rel, why: 'hybrid digest mismatch' });

    if (flags.ots) {
      const proof = `${abs}.ots`;
      if (!existsSync(proof)) failures.push({ path: rel, why: 'no .ots proof' });
      else {
        try {
          const info = execFileSync('ots', ['info', proof], { encoding: 'utf8' });
          const m = info.match(/^File sha256 hash:\s*([0-9a-f]{64})/m);
          if (!m) failures.push({ path: rel, why: '.ots digest unreadable' });
          else if (m[1] !== s256.toString('hex')) failures.push({ path: rel, why: `.ots commits to ${m[1].slice(0, 16)}… not the file` });
        } catch (e) {
          failures.push({ path: rel, why: `ots info failed: ${e.message.split('\n')[0]}` });
        }
      }
    }
  }

  // Merkle root, if a .merkle file sits beside the manifest.
  const merkleFile = manifestPath.replace(/\.tsv$/, '.merkle');
  let merkleCheck = { checked: false };
  if (existsSync(merkleFile)) {
    const stored = readFileSync(merkleFile, 'utf8').match(/merkle_root_blake3\s+([0-9a-f]{64})/);
    const { root: computed, counts } = merkleRoot(rows.map((r) => r[5]));
    merkleCheck = {
      checked: true,
      stored: stored ? stored[1] : null,
      computed,
      levels: counts,
      match: Boolean(stored) && stored[1] === computed,
    };
    if (!merkleCheck.match) failures.push({ path: '<merkle>', why: 'Merkle root does not match the manifest' });
  }

  // Signatures, if SIGNATURES.json sits beside the manifest.
  const sigFile = join(root, 'SIGNATURES.json');
  let sigCheck = { checked: false };
  if (existsSync(sigFile)) {
    const sigs = JSON.parse(readFileSync(sigFile, 'utf8'));
    const entry = sigs.files.find((f) => f.path === manifestPath || f.path.endsWith(manifestPath));
    if (!entry) {
      sigCheck = { checked: true, found: false };
      failures.push({ path: '<signatures>', why: 'no signature for this manifest' });
    } else {
      const manifestBytes = readFileSync(manifestPath);
      const rawPub = Buffer.from(entry.public_key_hex, 'hex').subarray(-32);
      const ok = ed25519Verify(
        Uint8Array.from(Buffer.from(entry.signature_b64u, 'base64url')),
        Uint8Array.from(manifestBytes),
        Uint8Array.from(rawPub));
      sigCheck = { checked: true, found: true, agent: sigs.agent_id, fingerprint: entry.key_fingerprint, valid: ok };
      if (!ok) failures.push({ path: '<signatures>', why: 'Ed25519 signature does not verify' });
    }
  }

  const result = {
    manifest: manifestPath,
    root,
    rows: rows.length,
    filesChecked: checked,
    failures,
    merkle: merkleCheck,
    signatures: sigCheck,
    verdict: failures.length === 0 ? 'pass' : 'fail',
  };

  if (flags.json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else {
    process.stdout.write(`manifest      ${manifestPath}\n`);
    process.stdout.write(`rows          ${rows.length} (checked ${checked})\n`);
    if (merkleCheck.checked) process.stdout.write(`merkle root   ${merkleCheck.match ? 'matches' : 'MISMATCH'}\n`);
    if (sigCheck.checked) process.stdout.write(`signature     ${sigCheck.valid ? 'valid' : 'INVALID'} ${sigCheck.fingerprint || ''}\n`);
    for (const f of failures.slice(0, 20)) process.stdout.write(`FAIL ${f.path}: ${f.why}\n`);
    if (failures.length > 20) process.stdout.write(`… ${failures.length - 20} more\n`);
    process.stdout.write(`verdict       ${result.verdict}\n`);
  }
  return failures.length === 0 ? EXIT_CODES.OK : EXIT_CODES.VERIFICATION_FAILED;
}
