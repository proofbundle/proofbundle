// Load the verbatim client core into an isolated context and export its functions.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const here = fileURLToPath(new URL('.', import.meta.url));
const src = readFileSync(here + 'pb_core_extract.js', 'utf-8');
const ctx = { btoa, atob, TextEncoder, TextDecoder, crypto: webcrypto, performance, console, setTimeout, clearTimeout, BigInt, Uint8Array, DataView, ArrayBuffer };
ctx.globalThis = ctx; ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(src + `\n;globalThis.__pb = { verify_bundle, pb_generate_conformance, pb_boundary_check, pb_is_verified, pb_verdict_family, seal_core, sig_keygen, sig_sign, sig_verify,
  digest_bytes, merkle_root_alg, canonical_json, parse_native_json, b64u_encode, b64u_decode, make_id, hex_of, utf8, leaf_hash_bytes, root_from_leaf_hashes, proof_from_leaf_hashes,
  verify_leaf_proof, merkle_root_bytes_alg, pb_spec_ver, pb_digests, pb_sigs, pb_registry, pb_verdicts };`, ctx, { filename: 'pb_core_extract.js' });
export const pb = ctx.__pb;
/* every object handed to the core is rebuilt inside its realm (the canonicalizer admits only its own realm's objects) */
export const in_realm = (x) => vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(x)) + ')', ctx);
