/* ═══════════════════════════════════════════════════════════════════════════
   PROOFBUNDLE VERIFIER — one verifier, one verdict vocabulary (2026-11-01)

   Built from the design, not patched onto the old paths:
   · verdicts: the 46 codes of src/verdict/verdict.mjs (the originating
     specification's enum, in the repository since 2026-08-12), exactly one
     terminal code per result, causes and warnings beside it, warnings never
     able to change the code (src/verdict/cause.mjs);
   · stage order: the patent (PDF sha256 ce332fdb…, Bitcoin block 931808),
     1 parse · 2 canonical · 3 specification/profile/algorithm gating ·
     4 cryptographic integrity · 5 boundary · 6 auxiliary data · 7 lineage ·
     8 resource budgets (enforced inside lineage) · 9 policy;
     the signature covers the digest of the canonical bundle-without-seal;
   · one registry for every envelope: 15 digests, the dispatched signature
     schemes, every defined profile; 1.0.0 is the finished release, so no
     defined feature is gated out of it;
   · migration: an algorithm declared broken or disallowed after a receipt
     was sealed is accepted only with a trusted time anchor earlier than the
     break (verified with a warning); otherwise it is refused.

   Choices the verdict names alone do not fix, made here and stated:
   · a false boundary predicate is POLICY_DENIED (cause stage "boundary");
     a "present" atom whose context value is absent is SIDE_INFORMATION_MISSING;
   · bundle validity windows (meta.expiration / expires_at, meta.not_before)
     give BUNDLE_EXPIRED / BUNDLE_NOT_YET_VALID;
   · a prediction claim with no observation supplied yet is NULL, one whose
     observation falsifies it is NEGATIVE, one without a falsification
     condition is EVIDENCE_INCOMPLETE;
   · INDETERMINATE is returned when a time-dependent check must be made and
     the caller required a supplied verification time but gave none;
   · certificate and timestamp verdicts are reached only when the bundle
     declares a certificate / time anchor (or its profile requires one) and
     come from the verifier-supplied check results (opts.certificate_check,
     opts.timestamp_check), because the client does not fetch either;
   · INTERNAL_ERROR is returned only when the verifier itself throws; no
     input is constructed to reach it.
   · dual signature (the dual-signature specification): both layers valid
     passes; exactly one valid is INDETERMINATE ("requires investigation");
     both invalid is INVALID_SIGNATURE. A witness key bound in the signed
     content (meta.witness_binding) makes the witness mandatory and fixes its
     key: removal is INSUFFICIENT_SIGNATURES, replacement UNEXPECTED_SIGNER;
     an unbound witness passes with a warning;
   · a boundary connective is three-valued: a structural fault decides first,
     then a decided child settles it (false for all, true for any), and only
     then does a missing context value leave it SIDE_INFORMATION_MISSING;
   · RSA-PSS in 1.0.0 uses the hash named by PB_REGISTRY.rsa_pss_hash for the
     message hash and MGF1, salt length equal to the hash length; bundles
     written by pre-release builds (spec 2.0.0 / 2.1.0) used SHA-256 at every
     modulus, are verified that way, and carry a pre-release warning.
   ═══════════════════════════════════════════════════════════════════════════ */

const pb_verdicts = Object.freeze([
  'VERIFIED', 'VERIFIED_WITH_WARNINGS', 'MALFORMED', 'NONCANONICAL', 'UNSUPPORTED_VERSION', 'UNKNOWN_VERSION',
  'UNSUPPORTED_ALGORITHM', 'UNKNOWN_ALGORITHM', 'DEPRECATED_ALGORITHM', 'FORBIDDEN_ALGORITHM', 'DIGEST_MISMATCH',
  'INVALID_SIGNATURE', 'MISSING_SIGNATURE', 'INSUFFICIENT_SIGNATURES', 'UNEXPECTED_SIGNER', 'UNKNOWN_SIGNER',
  'REVOKED_KEY', 'EXPIRED_KEY', 'KEY_NOT_YET_VALID', 'CERTIFICATE_INVALID', 'CERTIFICATE_PATH_INVALID',
  'CERTIFICATE_UNTRUSTED', 'CERTIFICATE_REVOCATION_INDETERMINATE', 'TIMESTAMP_INVALID', 'TIMESTAMP_UNTRUSTED',
  'TIMESTAMP_INDETERMINATE', 'BUNDLE_EXPIRED', 'BUNDLE_NOT_YET_VALID', 'LINEAGE_INVALID', 'LINEAGE_CYCLE',
  'LINEAGE_MISSING', 'ANCESTOR_UNAVAILABLE', 'PAYLOAD_MISSING', 'SIDE_INFORMATION_MISSING', 'POLICY_DENIED',
  'POLICY_INDETERMINATE', 'RESOURCE_EXHAUSTED', 'LIMIT_EXCEEDED', 'PROVIDER_UNAVAILABLE',
  'EXTERNAL_SERVICE_UNAVAILABLE', 'EVIDENCE_INCOMPLETE', 'NEGATIVE', 'NULL', 'INDETERMINATE', 'NOT_DEFINED',
  'INTERNAL_ERROR',
]);
const pb_verdict_set = new Set(pb_verdicts);
const pb_max_nesting = 500;   /* below the parser's and the canonicalizer's 512, so the verifier's own limit is the one reached */
/* The seal is outside the signed content, so only the fields the seal schema defines are admitted: an unsigned field
   would otherwise travel with a verified bundle and could be shown as if it were checked. */
const pb_seal_fields = Object.freeze({
  native: ['digest_alg', 'digest_b64u', 'sig_alg', 'signature_b64u', 'pub_b64u', 'witness', '_engine', '_engine_note'],
  key_beside: ['digest_alg', 'digest_b64u', 'sig_alg', 'signature_b64u', 'witness', '_engine', '_engine_note'],
  disclosure: ['digest_alg', 'digest_b64u', 'sig_alg', 'signature_b64u', 'pub_b64u'],
  witness: ['sig_alg', 'pub_b64u', 'signature_b64u'],
  legacy_sig: ['alg', 'pub', 'sig'],
});
/* canonical base64url: the bytes it decodes to re-encode to the same text (rejects nonzero unused bits, padding, bad length) */
function pb_b64u_canonical(x) { if (typeof x !== 'string' || !/^[A-Za-z0-9_-]*$/.test(x) || x.length % 4 === 1) return false; try { return b64u_encode(b64u_decode(x)) === x; } catch { return false; } }
const pb_stages = ['parse', 'canonical', 'gating', 'crypto', 'boundary', 'auxiliary', 'lineage', 'budget', 'policy'];

/* ── selective disclosure (PB-DISCLOSURE-1) ─────────────────────────────────────────────────────────────────────────
   The sealer commits to hdr as one leaf and to every top-level field of meta and payload as a leaf of its own:
   leaf = H(0x00 ‖ canonical ["PB-DISCLOSURE-1", path, salt, value]) with a fresh 32-byte salt per leaf; the leaves, in
   ascending path order, form a Merkle tree under the client's node rule (0x01 ‖ left ‖ right, odd node promoted);
   the signature covers H(canonical {digest_alg, leaf_count, profile, root_b64u}). A presentation carries each
   disclosed field with its salt and each withheld field as its leaf hash only. The salt is what makes a withheld field
   unguessable: without it, the leaf of a short value ("yes", true, a date) could be found by hashing candidates. */
const pb_disclosure_profile = 'PB-DISCLOSURE-1';
const pb_disclosure_path_re = /^(hdr|meta\.[^.]+|payload\.[^.]+)$/;
/* meta fields this verifier acts on: a presentation may not withhold them, or withholding would change the verdict
   (a withheld boundary, expiry or approval would simply not be checked). integrate.py checks this list against every
   bundle.meta.<field> the verifier source reads, so a new check cannot be added without it. */
const pb_disclosure_acted_on = Object.freeze(['approvals', 'aux', 'boundary', 'canonical_encoding', 'claim_type', 'digest_alg', 'encryption',
  'expiration', 'expires_at', 'falsification_condition', 'hitl', 'issuer_certificate', 'not_before', 'payload_sha256', 'policy_requires', 'refs',
  'requires_side_attestations', 'side_attestations', 'sig_alg', 'time_anchor', 'witness_binding']);
async function pb_disclosure_leaf_hash(path, salt_b64u, value, digest_alg) {
  const enc = utf8(canonical_json([pb_disclosure_profile, path, salt_b64u, value]));
  const data = new Uint8Array(1 + enc.length); data[0] = 0x00; data.set(enc, 1);
  return digest_bytes(digest_alg, data);
}
function pb_disclosure_value(bundle, path) {
  if (path === 'hdr') return { present: true, value: bundle.hdr };
  const [sec, key] = [path.slice(0, path.indexOf('.')), path.slice(path.indexOf('.') + 1)];
  const obj = bundle[sec];
  return obj && typeof obj === 'object' && !Array.isArray(obj) && Object.prototype.hasOwnProperty.call(obj, key) ? { present: true, value: obj[key] } : { present: false };
}
async function pb_disclosure_statement_digest(leaf_hashes, digest_alg) {
  const root_b64u = b64u_encode(await root_from_leaf_hashes(leaf_hashes, digest_alg));
  return { root_b64u, digest: await digest_bytes(digest_alg, canonical_json({ digest_alg, leaf_count: leaf_hashes.length, profile: pb_disclosure_profile, root_b64u })) };
}

const pb_registry = {
  versions_known: ['1.0.0', '1.1.0', '2.0.0', '2.1.0'],
  /* which spec versions each envelope form may carry */
  envelope_versions: { native: ['1.0.0', '2.0.0', '2.1.0'], key_beside: ['1.0.0'], legacy: ['1.1.0'], disclosure: ['1.0.0'] },
  profiles: ['PB-INTEGRITY-1', 'PB-BOUNDARY-1', 'PB-LINEAGE-1', 'PB-REGULATED-1', 'PB-AI-MODEL-1',
    'PB-INTEGRITY-TEMPORAL-1', 'PB-ARTIFACT-1', 'PB-ARCHIVE-1', 'PB-VERIFY-REPORT-1', 'PB-PREDICTION-1', 'PB-DISCLOSURE-1'],
  pre_release_versions: ['2.0.0', '2.1.0'],
  encodings: ['PB-CANON-JSON-1'],
  /* key encapsulation for encrypted payloads (meta.encryption.kem); gated, not used by verification itself */
  key_encapsulation: ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024', 'X25519'],
  /* RSA-PSS parameterization in 1.0.0: EMSA-PSS with this hash, MGF1 with the same hash, salt length = hash length.
     Pre-release (2.x) native bundles used SHA-256 for every modulus and are verified that way. */
  rsa_pss_hash: { 'RSA-PSS-2048': 'SHA-256', 'RSA-PSS-3072': 'SHA-384', 'RSA-PSS-4096': 'SHA-512' },
  digest_aliases: { 'BLAKE2b-512': 'BLAKE2b', 'BLAKE2s-256': 'BLAKE2s' },
  sig_aliases: { 'ML-DSA-44': 'Dilithium2', 'ECDSA-P-256': 'ECDSA-P256', 'ECDSA-P-384': 'ECDSA-P384', 'ECDSA-P-521': 'ECDSA-P521' },
  forbidden: ['MD5', 'SHA-1', 'SHA1', 'MD4', 'RSA-PKCS1-v1_5-SHA-1', 'DSA-1024'],
  /* in the registry, not executable in this client (embedded but not dispatched, or removed pending a from-scratch build) */
  recognized_unimplemented: ['SM3', 'RIPEMD-160', 'Streebog-256', 'Falcon512', 'Falcon-512', 'SPHINCS+-256',
    'SLH-DSA-SHA2-128f', 'SLH-DSA-SHA2-128s'],
  atoms: ['all', 'any', 'equals', 'present', 'in', 'range', 'before', 'after', 'within', 'within_days', 'expired',
    'not_expired', 'within_last', 'age_lt'],
  /* NIST IR 8547 (final, October 2026): quantum-vulnerable signatures deprecated after 2030, disallowed after 2035;
     verifying existing signatures is "legacy use". Dates are the first instant each state applies. */
  algorithm_states: {
    'Ed25519':      { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'ECDSA-P256':   { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'ECDSA-P384':   { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'ECDSA-P521':   { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'RSA-PSS-2048': { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'RSA-PSS-3072': { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
    'RSA-PSS-4096': { deprecated_from: '2031-01-01T00:00:00Z', disallowed_from: '2036-01-01T00:00:00Z' },
  },
  /* profiles whose policy refuses deprecated algorithms outright */
  strict_profiles: ['PB-REGULATED-1'],
  /* profiles that require a trusted time anchor */
  anchored_profiles: ['PB-INTEGRITY-TEMPORAL-1'],
};

/* What would change a negative verdict: the contrary finding, stated with the verdict, so no refusal closes the question.
   Where nothing further could change it for this bundle, the text says so and why. */
function pb_revisable_by(code, predicate, extra) {
  const pr = predicate || '', x = extra || {}, alg = x.algorithm_id ? `"${x.algorithm_id}"` : 'the algorithm';
  switch (code) {
    case 'MALFORMED': return pr.endsWith('.fields') ? 'the same bundle with only the fields its seal schema defines (an unsigned field is not admitted)'
      : pr.startsWith('disclosure') ? 'a presentation whose disclosure list commits every field it carries exactly once, hdr disclosed, each disclosed field with its own 32-byte salt and each withheld field with its leaf hash'
      : pr.startsWith('atom') ? 'a boundary whose atom has the arity and operand types its operator defines'
      : pr === 'json' ? 'the same bundle as strict JSON' : `a bundle in which ${pr || 'the named field'} is present and well formed, sealed as such`;
    case 'NONCANONICAL': return pr.startsWith('b64u') ? `the same ${pr.slice(5) || 'value'} in canonical base64url (RFC 4648 §5, unpadded, unused trailing bits zero)`
      : pr === 'disclosure.order' ? 'the same disclosure leaves listed in ascending path order'
      : 'the same content supplied in its canonical serialization (PB-CANON-JSON-1, NFC strings)';
    case 'UNSUPPORTED_VERSION': return 'a version this envelope form admits: native 1.0.0, key-beside 1.0.0, legacy 1.1.0';
    case 'UNKNOWN_VERSION': return 'a registered spec version';
    case 'UNSUPPORTED_ALGORITHM': return `a verifier that executes ${alg}`;
    case 'UNKNOWN_ALGORITHM': return `a registry entry for ${alg}`;
    case 'DEPRECATED_ALGORITHM': return 'a trusted time anchor showing the bundle predates the cutoff, or a policy that admits deprecated algorithms';
    case 'FORBIDDEN_ALGORITHM': return "a trusted time anchor showing the bundle predates the algorithm's break";
    case 'DIGEST_MISMATCH': return pr === 'merkle_root' ? 'hdr, meta and payload exactly as they were when the Merkle root was computed'
      : pr === 'disclosure.root' ? 'the disclosed values, salts and withheld leaf hashes exactly as they were sealed' : 'the original content whose digest equals seal.digest_b64u';
    case 'INVALID_SIGNATURE': return 'a signature over this digest that verifies under the stated key';
    case 'MISSING_SIGNATURE': return 'a seal that carries its signature';
    case 'INSUFFICIENT_SIGNATURES': return pr === 'witness.present' ? 'the witness signature whose key meta.witness_binding names' : 'valid signatures up to the required count';
    case 'UNEXPECTED_SIGNER': return pr === 'witness.key' ? 'a witness signature by the key meta.witness_binding names' : 'a signature by the expected key, or an expectation naming this key';
    case 'UNKNOWN_SIGNER': return 'this key in the trust set';
    case 'REVOKED_KEY': return 'a trusted time anchor showing the signature predates the revocation';
    case 'EXPIRED_KEY': case 'KEY_NOT_YET_VALID': return "a trusted time anchor inside the key's validity period";
    case 'CERTIFICATE_INVALID': case 'CERTIFICATE_PATH_INVALID': case 'CERTIFICATE_UNTRUSTED': case 'CERTIFICATE_REVOCATION_INDETERMINATE':
      return 'a certificate check result showing a valid, trusted issuer path with determinate revocation status';
    case 'TIMESTAMP_INVALID': case 'TIMESTAMP_UNTRUSTED': return 'a timestamp check result that is valid and from a trusted authority';
    case 'TIMESTAMP_INDETERMINATE': return pr === 'timestamp.pending' ? 'the completed attestation (for an OpenTimestamps proof, its Bitcoin attestation)' : 'a determinate timestamp check result';
    case 'BUNDLE_EXPIRED': return 'a verification time inside the validity window, or a trusted anchor showing use before expiration';
    case 'BUNDLE_NOT_YET_VALID': return 'a verification time at or after not_before';
    case 'LINEAGE_INVALID': return pr === 'parent.digest' ? "the parent whose digest equals the child's commitment" : pr === 'parent.unbound' ? "a digest commitment in the child, or the parent's key" : 'an intact copy of the parent';
    case 'LINEAGE_CYCLE': return 'nothing further: the references themselves form the cycle';
    case 'LINEAGE_MISSING': return 'the referenced parent, supplied';
    case 'ANCESTOR_UNAVAILABLE': return 'a reachable lineage store';
    case 'PAYLOAD_MISSING': return 'the bundle with its payload';
    case 'SIDE_INFORMATION_MISSING': return pr === 'key.supplied' ? "the producer's public key" : pr === 'atom.present' ? 'the context value the boundary names' : pr.startsWith('aux') ? 'the auxiliary item whose digest matches its reference' : 'the side information named in the cause';
    case 'POLICY_DENIED': return pr === 'boundary' ? 'a context in which the boundary predicate holds' : pr.startsWith('approval') || pr.startsWith('regulated') ? 'a current human approval record' : 'the context the policy requires';
    case 'POLICY_INDETERMINATE': return 'the context fields the policy reads';
    case 'RESOURCE_EXHAUSTED': return pr === 'max_depth' ? "a max_depth at or above the lineage's longest path" : pr === 'max_containers' ? "a max_containers at or above the lineage's distinct ancestors" : "a max_bytes at or above the ancestors' bytes";
    case 'LIMIT_EXCEEDED': return "a limit at or above the bundle's size or nesting";
    case 'PROVIDER_UNAVAILABLE': return 'the cryptographic provider available';
    case 'EXTERNAL_SERVICE_UNAVAILABLE': return 'the external service reachable';
    case 'EVIDENCE_INCOMPLETE': return pr === 'prediction.falsification' ? 'a prediction sealed with its falsification condition' : pr === 'disclosure.acted_on' ? 'the same presentation with the named fields disclosed' : 'the evidence the cause names';
    case 'NEGATIVE': return 'evidence that the recorded observation is wrong';
    case 'NULL': return 'the observation';
    case 'INDETERMINATE': return pr === 'witness.disagreement' ? 'the two signature layers agreeing' : 'a supplied verification time';
    case 'NOT_DEFINED': return 'a spec version that defines it';
    case 'INTERNAL_ERROR': return 'a run of the verifier without the internal fault';
    default: return null;
  }
}
class pb_verdict_stop {
  constructor(code, stage, cause) { this.code = code; this.stage = stage; this.cause = cause; }
}

/* Signature over the digest. Every 1.0.0 envelope uses sig_verify (RSA-PSS per PB_REGISTRY.rsa_pss_hash);
   a pre-release 2.x bundle signed with RSA-PSS used SHA-256 at every modulus. */
async function pb_signature_ok(sig_alg, pub_b64u, digest, sig_b64u, spec_ver) {
  const sig = b64u_decode(sig_b64u);
  if (pb_registry.rsa_pss_hash[sig_alg] && pb_registry.pre_release_versions.includes(spec_ver)) {
    try { return pb_core['crypto/rsa-pss.mjs'].rsa_pss_verify(b64u_decode(pub_b64u), digest, sig); } catch { return false; }
  }
  return sig_verify(sig_alg, digest, sig, pub_b64u);
}

/* Presentation families: one place that groups the 46 codes for display. */
const pb_verdict_family = (() => {
  const f = {};
  const put = (fam, codes) => codes.forEach((c) => { f[c] = fam; });
  put('verified', ['VERIFIED', 'VERIFIED_WITH_WARNINGS']);
  put('integrity', ['DIGEST_MISMATCH', 'INVALID_SIGNATURE', 'MISSING_SIGNATURE', 'INSUFFICIENT_SIGNATURES', 'UNEXPECTED_SIGNER', 'LINEAGE_INVALID', 'LINEAGE_CYCLE']);
  put('structure', ['MALFORMED', 'NONCANONICAL', 'PAYLOAD_MISSING', 'INTERNAL_ERROR']);
  put('trust', ['UNKNOWN_SIGNER', 'REVOKED_KEY', 'EXPIRED_KEY', 'KEY_NOT_YET_VALID', 'CERTIFICATE_INVALID', 'CERTIFICATE_PATH_INVALID', 'CERTIFICATE_UNTRUSTED', 'TIMESTAMP_INVALID', 'TIMESTAMP_UNTRUSTED', 'FORBIDDEN_ALGORITHM', 'DEPRECATED_ALGORITHM']);
  put('support', ['UNSUPPORTED_VERSION', 'UNKNOWN_VERSION', 'UNSUPPORTED_ALGORITHM', 'UNKNOWN_ALGORITHM', 'NOT_DEFINED', 'RESOURCE_EXHAUSTED', 'LIMIT_EXCEEDED', 'PROVIDER_UNAVAILABLE']);
  put('policy', ['POLICY_DENIED', 'BUNDLE_EXPIRED', 'BUNDLE_NOT_YET_VALID', 'NEGATIVE']);
  put('undetermined', ['SIDE_INFORMATION_MISSING', 'LINEAGE_MISSING', 'ANCESTOR_UNAVAILABLE', 'POLICY_INDETERMINATE', 'EXTERNAL_SERVICE_UNAVAILABLE', 'EVIDENCE_INCOMPLETE', 'CERTIFICATE_REVOCATION_INDETERMINATE', 'TIMESTAMP_INDETERMINATE', 'NULL', 'INDETERMINATE']);
  return Object.freeze(f);
})();
function pb_is_verified(code) { return code === 'VERIFIED' || code === 'VERIFIED_WITH_WARNINGS'; }

function pb_ed25519_raw_key(pub_b64u) {
  /* SubjectPublicKeyInfo for Ed25519 is a fixed 12-byte prefix over the 32-byte key */
  const b = b64u_decode(pub_b64u);
  const prefix = [0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];
  if (b.length === 44 && prefix.every((x, i) => b[i] === x)) return b64u_encode(b.slice(12));
  return pub_b64u;
}

/* Boundary predicate evaluation, shared by verify_bundle and every page that shows a boundary
   check, so there is exactly one implementation of the atom semantics. Throws PbVerdictStop for
   MALFORMED / NOT_DEFINED / SIDE_INFORMATION_MISSING / INDETERMINATE; returns true or false. When
   `details` is an array, each top-level atom's result is recorded there as
   { atom, result: 'pass' | 'fail' | 'missing' | 'malformed' | 'not_defined', message }. */
function pb_boundary_eval(boundary, context, now_ms, env) {
  const e = env || {};
  const ctx = context || {};
  const is_obj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const is_str = (x) => typeof x === 'string';
  const ts = (x) => (is_str(x) ? Date.parse(x) : NaN);
  const stop = (code, stage, predicate, message) => { throw new pb_verdict_stop(code, stage, { code, stage, predicate, message, revisable_by: pb_revisable_by(code, predicate) }); };
  const need_time = e.need_time || (() => {});
  const get = (path) => { let cur = ctx; for (const k of String(path).split('.')) { if (!cur || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, k)) return [undefined, false]; cur = cur[k]; } return [cur, true]; };
  const ctx_now = () => (is_str(ctx._now) ? ts(ctx._now) : now_ms);
  const eval_atom = (a, path_label) => {
    if (!is_obj(a)) stop('MALFORMED', 'boundary', 'atom.shape', `${path_label} is not an object`);
    /* 2.x form {path, op, ...} */
    if (is_str(a.op) && 'path' in a) {
      if (!pb_registry.atoms.includes(a.op)) stop('NOT_DEFINED', 'boundary', 'atom.op', `atom "${a.op}" is not defined`);
      /* the operands each 2.x atom takes; anything else, or an operand of the wrong type, is MALFORMED as in the 1.0.0 form */
      const shape = { equals: ['value'], present: [], in: ['set'], range: ['lo', 'hi'], after: ['value'], before: ['value'], within_days: ['days'] }[a.op];
      if (!shape) stop('NOT_DEFINED', 'boundary', 'atom.op', `atom "${a.op}" has no 2.x form`);
      if (!is_str(a.path) || !a.path) stop('MALFORMED', 'boundary', 'atom.operand', `${path_label}: path must be a non-empty string`);
      if (Object.keys(a).sort().join() !== ['op', 'path', ...shape].sort().join()) stop('MALFORMED', 'boundary', 'atom.arity', `${a.op} (2.x form) takes path${shape.map((k) => ', ' + k).join('')}`);
      const ts_or_now = (x) => x === 'now' || (is_str(x) && !Number.isNaN(Date.parse(x)));
      if (a.op === 'in' && !Array.isArray(a.set)) stop('MALFORMED', 'boundary', 'atom.operand', 'in: set is not an array');
      if (a.op === 'range' && !(typeof a.lo === 'number' && typeof a.hi === 'number' && Number.isFinite(a.lo) && Number.isFinite(a.hi) && a.lo <= a.hi)) stop('MALFORMED', 'boundary', 'atom.operand', 'range: lo and hi must be finite numbers, lo ≤ hi');
      if ((a.op === 'after' || a.op === 'before') && !ts_or_now(a.value)) stop('MALFORMED', 'boundary', 'atom.operand', `${a.op}: value must be a timestamp or "now"`);
      if (a.op === 'within_days' && !(typeof a.days === 'number' && Number.isFinite(a.days))) stop('MALFORMED', 'boundary', 'atom.operand', 'within_days: days must be a number');
      const [v, ok] = get(a.path);
      switch (a.op) {
        case 'equals': return ok && canonical_json(v) === canonical_json(a.value);
        case 'present': if (!ok || v === null || v === '') stop('SIDE_INFORMATION_MISSING', 'boundary', 'atom.present', `context value "${a.path}" is required and absent`); return true;
        case 'in': return ok && a.set.some((x) => canonical_json(x) === canonical_json(v));
        case 'range': return ok && typeof v === 'number' && v >= a.lo && v <= a.hi;
        case 'after': case 'before': { need_time('boundary', 'a time predicate'); const t = ts(v), r = a.value === 'now' ? ctx_now() : ts(a.value); return ok && !Number.isNaN(t) && !Number.isNaN(r) && (a.op === 'after' ? t > r : t < r); }
        case 'within_days': { need_time('boundary', 'a time predicate'); const t = ts(v); return ok && !Number.isNaN(t) && Math.abs(ctx_now() - t) <= a.days * 864e5; }
      }
    }
    /* 1.0.0 form {op: operand} */
    const keys = Object.keys(a);
    if (keys.length !== 1) stop('MALFORMED', 'boundary', 'atom.shape', `${path_label} must have exactly one operator`);
    const op = keys[0], arg = a[op];
    if (!pb_registry.atoms.includes(op)) stop('NOT_DEFINED', 'boundary', 'atom.op', `atom "${op}" is not defined`);
    if (op === 'all' || op === 'any') {
      if (!Array.isArray(arg)) stop('MALFORMED', 'boundary', 'atom.operand', `${op} operand is not an array`);
      /* three-valued: a structural fault anywhere is decided first; then a decided child settles the
         connective (false for all, true for any); only if nothing settles it does a missing value
         leave it undecided (SIDE_INFORMATION_MISSING) */
      const rs = arg.map((x, i) => { try { return { v: eval_atom(x, `${path_label}.${op}[${i}]`) }; } catch (z) { if (z instanceof pb_verdict_stop && z.code === 'SIDE_INFORMATION_MISSING') return { missing: z }; throw z; } });
      if (op === 'all' && rs.some((r) => r.v === false)) return false;
      if (op === 'any' && rs.some((r) => r.v === true)) return true;
      const m = rs.find((r) => r.missing); if (m) throw m.missing;
      return op === 'all';
    }
    if (op === 'present') { const [v, ok] = get(arg); if (!ok || v === null || v === '') stop('SIDE_INFORMATION_MISSING', 'boundary', 'atom.present', `context value "${arg}" is required and absent`); return true; }
    if (op === 'expired' || op === 'not_expired') { need_time('boundary', 'a time predicate'); const [v, ok] = get(arg); if (!ok) return false; const t = ts(v); if (Number.isNaN(t)) stop('MALFORMED', 'boundary', 'atom.operand', `${op}: not a timestamp`); return op === 'expired' ? t <= ctx_now() : t > ctx_now(); }
    if (!Array.isArray(arg) || !arg.length || !is_str(arg[0])) stop('MALFORMED', 'boundary', 'atom.operand', `${op}: operand is not [path, …]`);
    const arity = { equals: 2, in: 2, range: 3, before: 2, after: 2, within: 3, within_days: 2, within_last: 2, age_lt: 2 }[op];
    if (arg.length !== arity) stop('MALFORMED', 'boundary', 'atom.arity', `${op} takes ${arity} operands, got ${arg.length}`);
    const is_ts = (x) => is_str(x) && !Number.isNaN(Date.parse(x));
    if (op === 'in' && !Array.isArray(arg[1])) stop('MALFORMED', 'boundary', 'atom.operand', 'in: second operand is not an array');
    if (op === 'range' && !(typeof arg[1] === 'number' && typeof arg[2] === 'number' && Number.isFinite(arg[1]) && Number.isFinite(arg[2]) && arg[1] <= arg[2])) stop('MALFORMED', 'boundary', 'atom.operand', 'range: bounds must be finite numbers, lo ≤ hi');
    if ((op === 'before' || op === 'after') && !is_ts(arg[1])) stop('MALFORMED', 'boundary', 'atom.operand', `${op}: ${JSON.stringify(arg[1])} is not a timestamp`);
    if (op === 'within' && !(is_ts(arg[1]) && is_ts(arg[2]))) stop('MALFORMED', 'boundary', 'atom.operand', 'within: bounds must be timestamps');
    if (op === 'within_days' && !(typeof arg[1] === 'number' && Number.isFinite(arg[1]))) stop('MALFORMED', 'boundary', 'atom.operand', 'within_days: days must be a number');
    const [v, ok] = get(arg[0]);
    if (op === 'equals') return ok && canonical_json(v) === canonical_json(arg[1]);
    if (op === 'in') return ok && Array.isArray(arg[1]) && arg[1].some((x) => canonical_json(x) === canonical_json(v));
    if (op === 'range') return ok && typeof v === 'number' && arg[1] <= v && v <= arg[2];
    need_time('boundary', 'a time predicate');
    if (op === 'before' || op === 'after') { const t = ts(arg[1]); return ok && (op === 'before' ? ts(v) < t : ts(v) > t); }
    if (op === 'within') return ok && ts(arg[1]) <= ts(v) && ts(v) <= ts(arg[2]);
    if (op === 'within_days') return ok && Math.abs(ctx_now() - ts(v)) <= arg[1] * 864e5;
    const m = is_str(arg[1]) ? /^(\d+)([smhdw])$/.exec(arg[1]) : null;
    if (!m) stop('MALFORMED', 'boundary', 'atom.operand', `${op}: not a duration`);
    const span = Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2]];
    if (!ok) return false; const age = ctx_now() - ts(v);
    return op === 'within_last' ? age <= span : age < span;
  };
  const top = Array.isArray(boundary) ? { all: boundary } : boundary;
  if (Array.isArray(e.details) && is_obj(top) && Object.keys(top).length === 1 && (Array.isArray(top.all) || Array.isArray(top.any))) {
    const mode = Array.isArray(top.all) ? 'all' : 'any';
    for (const [i, a] of top[mode].entries()) {
      try { e.details.push({ atom: a, result: eval_atom(a, `boundary.${mode}[${i}]`) ? 'pass' : 'fail', message: '' }); }
      catch (x) { if (!(x instanceof pb_verdict_stop)) throw x; e.details.push({ atom: a, result: { SIDE_INFORMATION_MISSING: 'missing', NOT_DEFINED: 'not_defined', MALFORMED: 'malformed' }[x.code] || 'indeterminate', message: x.cause.message }); }
    }
  }
  return eval_atom(top, 'boundary');
}

async function verify_bundle(bundle, opts) {
  const o = opts || {};
  const trace = [], warnings = [], causes = [];
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const ms = () => Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) + 'ms';
  const step = (stage, title, body) => trace.push({ stage, title, body, outcome: null, ms: ms() });
  const warn = (stage, predicate, message) => { warnings.push({ stage, predicate, message }); trace.push({ stage, title: 'Warning', body: message, outcome: null, ms: ms() }); };
  const stop = (code, stage, predicate, message, extra) => { throw new pb_verdict_stop(code, stage, Object.assign({ code, stage, predicate, message, revisable_by: pb_revisable_by(code, predicate, extra) }, extra || {})); };
  const is_obj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const is_str = (x) => typeof x === 'string';
  const supplied_now = Number.isFinite(o.now);
  const now_ms = supplied_now ? o.now : Date.now();
  const need_time = (stage, what) => { if (!supplied_now && o.require_supplied_time) stop('INDETERMINATE', stage, 'time.required', `${what} depends on the verification time and none was supplied`); };
  const ts = (x) => (is_str(x) ? Date.parse(x) : NaN);
  const finish = (code, stage, cause) => {
    if (cause) { if (code !== 'VERIFIED' && !('revisable_by' in cause)) cause.revisable_by = pb_revisable_by(code, cause.predicate); causes.push(cause); }
    const final = (code === 'VERIFIED' && warnings.length) ? 'VERIFIED_WITH_WARNINGS' : code;
    trace.push({ stage, title: 'Verdict', body: final + (cause && cause.message ? ' — ' + cause.message : ''), outcome: final, ms: ms() });
    return { code: final, outcome: final, stage, causes, warnings, trace, envelope, signer };
  };
  let envelope = null, signer = null;

  try {
    /* ── 1 parse ─────────────────────────────────────────────────────────── */
    let raw = null;
    if (is_str(bundle)) {
      raw = bundle;
      const lim = (o.limits || {}).max_bundle_bytes;
      if (Number.isFinite(lim) && utf8(raw).length > lim) stop('LIMIT_EXCEEDED', 'parse', 'limits.max_bundle_bytes', `${utf8(raw).length} bytes > ${lim}`);
      try { bundle = parse_native_json(raw); } catch (e) {
        if (/nesting depth/i.test(String(e && e.message))) stop('LIMIT_EXCEEDED', 'parse', 'limits.max_nesting', String(e.message));
        stop('MALFORMED', 'parse', 'json', 'not strict JSON: ' + (e && e.message || e)); }
    }
    if (!is_obj(bundle)) stop('MALFORMED', 'parse', 'shape.object', 'bundle is not a JSON object');
    {
      const lim = o.limits || {};
      {
        /* nesting is bounded for object input as for text: the default is the parser's limit, so no input reaches
           the canonicalizer's depth guard or the call stack (both would surface as INTERNAL_ERROR) */
        const max_n = Number.isFinite(lim.max_nesting) ? Math.min(lim.max_nesting, pb_max_nesting) : pb_max_nesting;
        let d = 0; const todo = [[bundle, 1]];
        while (todo.length) { const [x, k] = todo.pop(); if (k > d) d = k; if (d > max_n) break;
          for (const v of Object.values(x)) if (v && typeof v === 'object') todo.push([v, k + 1]); }
        if (d > max_n) stop('LIMIT_EXCEEDED', 'parse', 'limits.max_nesting', `nesting depth over ${max_n}`);
      }
      if (!raw && Number.isFinite(lim.max_bundle_bytes)) {
        const n = utf8(canonical_json(bundle)).length; if (n > lim.max_bundle_bytes) stop('LIMIT_EXCEEDED', 'parse', 'limits.max_bundle_bytes', `${n} canonical bytes > ${lim.max_bundle_bytes}`);
      }
    }
    if (!is_obj(bundle.hdr)) stop('MALFORMED', 'parse', 'shape.hdr', 'missing hdr');
    for (const k of ['bundle_id', 'profile', 'spec_ver']) if (!is_str(bundle.hdr[k]) || !bundle.hdr[k]) stop('MALFORMED', 'parse', 'shape.hdr.' + k, `missing hdr.${k}`);
    if (!is_obj(bundle.meta)) stop('MALFORMED', 'parse', 'shape.meta', 'missing meta');
    if (('spec_id' in bundle.hdr && bundle.hdr.spec_id !== 'PROOFBUNDLE') || (!('spec_id' in bundle.hdr) && !(bundle.sig && !bundle.seal))) stop('MALFORMED', 'parse', 'shape.hdr.spec_id', `hdr.spec_id must be PROOFBUNDLE (got ${JSON.stringify(bundle.hdr.spec_id)})`);
    envelope = (bundle.sig && !bundle.seal) ? 'legacy' : ('disclosure' in bundle) ? 'disclosure' : (is_obj(bundle.seal) && !('pub_b64u' in bundle.seal) && !('merkleRoot' in bundle)) ? 'key_beside' : 'native';
    if (!bundle.seal && !bundle.sig) stop('MISSING_SIGNATURE', 'parse', 'shape.seal', 'the bundle carries no seal — it was never signed');
    if (envelope !== 'legacy') {
      const s = bundle.seal;
      if (!is_obj(s)) stop('MALFORMED', 'parse', 'shape.seal', 'seal is not an object');
      if (!is_str(s.signature_b64u) || !s.signature_b64u) stop('MISSING_SIGNATURE', 'parse', 'shape.seal.signature_b64u', 'seal carries no signature');
      for (const k of ['digest_alg', 'digest_b64u', 'sig_alg']) if (!is_str(s[k]) || !s[k]) stop('MALFORMED', 'parse', 'shape.seal.' + k, `seal.${k} missing`);
      if (!/^[A-Za-z0-9_-]*$/.test(s.digest_b64u) || !/^[A-Za-z0-9_-]*$/.test(s.signature_b64u)) stop('MALFORMED', 'parse', 'shape.seal.b64u', 'seal value is not base64url');
      if ((envelope === 'native' || envelope === 'disclosure') && (!is_str(s.pub_b64u) || !/^[A-Za-z0-9_-]+$/.test(s.pub_b64u))) stop('MALFORMED', 'parse', 'shape.seal.pub_b64u', `a ${envelope} seal must carry its key as base64url`);
      if (is_str(bundle.meta.digest_alg) && bundle.meta.digest_alg !== s.digest_alg) stop('MALFORMED', 'parse', 'shape.alg_agreement', 'meta and seal name different digest algorithms');
      if (is_str(bundle.meta.sig_alg) && bundle.meta.sig_alg !== s.sig_alg) stop('MALFORMED', 'parse', 'shape.alg_agreement', 'meta and seal name different signature algorithms');
      const extra = Object.keys(s).filter((k) => !pb_seal_fields[envelope].includes(k));
      if (extra.length) stop('MALFORMED', 'parse', 'shape.seal.fields', `seal carries field(s) outside its schema, which no signature covers: ${extra.join(', ')}`);
      if (s.witness !== undefined && is_obj(s.witness)) { const wx = Object.keys(s.witness).filter((k) => !pb_seal_fields.witness.includes(k));
        if (wx.length) stop('MALFORMED', 'parse', 'shape.witness.fields', `seal.witness carries field(s) outside its schema: ${wx.join(', ')}`); }
      for (const k of ['_engine', '_engine_note']) if (k in s && !is_str(s[k])) stop('MALFORMED', 'parse', 'shape.seal.' + k, `seal.${k} must be a string`);
    } else {
      if (!is_obj(bundle.sig)) stop('MALFORMED', 'parse', 'shape.sig', 'legacy sig is not an object');
      const extra = Object.keys(bundle.sig).filter((k) => !pb_seal_fields.legacy_sig.includes(k));
      if (extra.length) stop('MALFORMED', 'parse', 'shape.sig.fields', `legacy sig carries field(s) outside its schema: ${extra.join(', ')}`);
    }
    if (envelope === 'key_beside') {
      if (!('payload' in bundle) || bundle.payload === '' || bundle.payload === null) stop('PAYLOAD_MISSING', 'parse', 'shape.payload', 'a key-beside envelope must carry its payload');
      if (!Array.isArray(bundle.refs)) stop('MALFORMED', 'parse', 'shape.refs', 'refs is not an array');
    }
    if (envelope === 'native' && (bundle.payload === null || bundle.payload === '') ) stop('PAYLOAD_MISSING', 'parse', 'shape.payload', 'payload is declared but empty');
    let disc = null;
    if ((envelope === 'disclosure') !== (bundle.hdr.profile === pb_disclosure_profile)) stop('MALFORMED', 'parse', 'disclosure.profile', envelope === 'disclosure' ? `a disclosure envelope must declare profile ${pb_disclosure_profile}` : `profile ${pb_disclosure_profile} is carried only by a disclosure envelope`);
    if (envelope === 'disclosure') {
      const dz = bundle.disclosure;
      if (!is_obj(dz) || Object.keys(dz).sort().join() !== 'digest_alg,leaves' || !is_str(dz.digest_alg) || !Array.isArray(dz.leaves) || !dz.leaves.length) stop('MALFORMED', 'parse', 'disclosure.shape', 'disclosure must be { digest_alg, leaves: [...] } with at least one leaf');
      if (dz.digest_alg !== bundle.seal.digest_alg) stop('MALFORMED', 'parse', 'shape.alg_agreement', 'disclosure and seal name different digest algorithms');
      const top = Object.keys(bundle).filter((k) => !['hdr', 'meta', 'payload', 'disclosure', 'seal'].includes(k));
      if (top.length) stop('MALFORMED', 'parse', 'disclosure.uncommitted', `field(s) outside the disclosure commitment: ${top.join(', ')}`);
      if ('payload' in bundle && !is_obj(bundle.payload)) stop('MALFORMED', 'parse', 'disclosure.shape', 'a disclosure payload is an object of committed fields');
      const seen = new Set(), salts = new Set(), withheld = [];
      for (const [i, l] of dz.leaves.entries()) {
        const keys = is_obj(l) ? Object.keys(l).sort().join() : '';
        if (keys !== 'path,salt_b64u' && keys !== 'leaf_b64u,path') stop('MALFORMED', 'parse', 'disclosure.leaf', `disclosure.leaves[${i}] must be { path, salt_b64u } (disclosed) or { path, leaf_b64u } (withheld)`);
        if (!is_str(l.path) || !pb_disclosure_path_re.test(l.path)) stop('MALFORMED', 'parse', 'disclosure.path', `disclosure.leaves[${i}].path is not hdr, meta.<field> or payload.<field>`);
        if (seen.has(l.path)) stop('MALFORMED', 'parse', 'disclosure.duplicate', `path ${l.path} is committed twice`);
        seen.add(l.path);
        const v = pb_disclosure_value(bundle, l.path);
        if ('salt_b64u' in l) {
          if (!v.present) stop('MALFORMED', 'parse', 'disclosure.missing_value', `${l.path} is listed as disclosed and is absent`);
          if (!is_str(l.salt_b64u) || !/^[A-Za-z0-9_-]{43}$/.test(l.salt_b64u)) stop('MALFORMED', 'parse', 'disclosure.salt', `${l.path}: the salt must be 32 bytes in base64url`);
          if (salts.has(l.salt_b64u)) stop('MALFORMED', 'parse', 'disclosure.salt_reuse', `${l.path}: a salt is used for more than one leaf`);
          salts.add(l.salt_b64u);
        } else {
          if (l.path === 'hdr') stop('MALFORMED', 'parse', 'disclosure.hdr_withheld', 'hdr is always disclosed: version, profile and identity are what the verifier gates on');
          if (v.present) stop('MALFORMED', 'parse', 'disclosure.withheld_present', `${l.path} is listed as withheld and is present`);
          if (!is_str(l.leaf_b64u) || !/^[A-Za-z0-9_-]+$/.test(l.leaf_b64u)) stop('MALFORMED', 'parse', 'disclosure.leaf', `${l.path}: leaf_b64u must be base64url`);
          withheld.push(l.path);
        }
      }
      if (!seen.has('hdr')) stop('MALFORMED', 'parse', 'disclosure.hdr_withheld', 'hdr is not committed');
      for (const sec of ['meta', 'payload']) for (const k of Object.keys(is_obj(bundle[sec]) ? bundle[sec] : {})) if (!seen.has(sec + '.' + k)) stop('MALFORMED', 'parse', 'disclosure.uncommitted', `${sec}.${k} is carried and not committed`);
      for (let i = 1; i < dz.leaves.length; i++) if (!(dz.leaves[i - 1].path < dz.leaves[i].path)) stop('NONCANONICAL', 'parse', 'disclosure.order', 'disclosure leaves are not in ascending path order: one presentation would have several byte forms');
      const acted = withheld.filter((p) => p.startsWith('meta.') && pb_disclosure_acted_on.includes(p.slice(5)));
      if (acted.length) stop('EVIDENCE_INCOMPLETE', 'parse', 'disclosure.acted_on', `the presentation withholds ${acted.join(', ')}, which verification acts on: withholding it would remove that check`);
      disc = { leaves: dz.leaves, withheld };
    }
    if (is_str(bundle.meta.payload_sha256) && !('payload' in bundle)) stop('PAYLOAD_MISSING', 'parse', 'shape.payload', 'meta commits to a payload digest but the payload is absent');
    step('parse', 'Structure', `${envelope} envelope · hdr · meta · seal ✓`);

    /* ── 2 canonical ─────────────────────────────────────────────────────── */
    if (raw !== null && canonical_json(bundle) !== raw) stop('NONCANONICAL', 'canonical', 'bytes', 'input bytes differ from the canonical serialization');
    {
      let bad = null;
      const walk = (x, p) => { if (bad) return; if (typeof x === 'string') { if (x.normalize('NFC') !== x) bad = p; } else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (k.normalize('NFC') !== k) { bad = p + '.' + k; return; } walk(v, p + '.' + k); } };
      walk(bundle, '$'); if (bad) stop('NONCANONICAL', 'canonical', 'nfc', `string at ${bad} is not Unicode NFC`);
    }
    {
      const outside = envelope === 'legacy' ? [['sig.sig', bundle.sig.sig], ['sig.pub', bundle.sig.pub], ['merkleRoot', bundle.merkleRoot]]
        : [['seal.signature_b64u', bundle.seal.signature_b64u], ['seal.digest_b64u', bundle.seal.digest_b64u], ['seal.pub_b64u', bundle.seal.pub_b64u],
           ['merkleRoot', bundle.merkleRoot], ...(is_obj(bundle.seal.witness) ? [['seal.witness.pub_b64u', bundle.seal.witness.pub_b64u], ['seal.witness.signature_b64u', bundle.seal.witness.signature_b64u]] : [])];
      if (envelope === 'disclosure') for (const l of disc.leaves) outside.push(['disclosure.' + l.path + ('salt_b64u' in l ? '.salt' : '.leaf'), 'salt_b64u' in l ? l.salt_b64u : l.leaf_b64u]);
      for (const [name, v] of outside) if (is_str(v) && !pb_b64u_canonical(v)) stop('NONCANONICAL', 'canonical', 'b64u.' + name, `${name} is not canonical base64url (unused trailing bits set, padding or bad length): the same bytes have one admitted spelling`);
    }
    step('canonical', 'Canonical form', raw !== null ? 'bytes equal canonical serialization · NFC ✓' : 'NFC ✓ (object input)');

    /* ── 3 gating ────────────────────────────────────────────────────────── */
    const ver = bundle.hdr.spec_ver;
    if (!pb_registry.versions_known.includes(ver)) stop('UNKNOWN_VERSION', 'gating', 'version.known', `spec_ver "${ver}" is not a ProofBundle version`);
    if (!pb_registry.envelope_versions[envelope].includes(ver)) stop('UNSUPPORTED_VERSION', 'gating', 'version.envelope', `spec_ver ${ver} is known but not carried by a ${envelope} envelope`);
    if (pb_registry.pre_release_versions.includes(ver)) warn('gating', 'version.pre_release', `spec_ver ${ver} is a pre-release label written by builds before 1.0.0; read for continuity`);
    if (!pb_registry.profiles.includes(bundle.hdr.profile)) stop('NOT_DEFINED', 'gating', 'profile', `profile "${bundle.hdr.profile}" is not defined`);
    if (is_str(bundle.meta.canonical_encoding) && !pb_registry.encodings.includes(bundle.meta.canonical_encoding)) stop('NOT_DEFINED', 'gating', 'encoding', `canonical_encoding "${bundle.meta.canonical_encoding}" is not defined`);
    const norm_d = (a) => pb_registry.digest_aliases[a] || a, norm_s = (a) => pb_registry.sig_aliases[a] || a;
    const digest_alg = envelope === 'legacy' ? 'SHA-256' : norm_d(bundle.seal.digest_alg);
    const sig_alg = envelope === 'legacy' ? 'Ed25519' : norm_s(bundle.seal.sig_alg);
    const gate_alg = (alg, kind, info) => {
      if (pb_registry.forbidden.includes(alg)) stop('FORBIDDEN_ALGORITHM', 'gating', kind, `${alg} is recognized and refused`, { algorithm_id: alg });
      if (!info(alg)) {
        if (pb_registry.recognized_unimplemented.includes(alg)) stop('UNSUPPORTED_ALGORITHM', 'gating', kind, `${alg} is in the registry but not executable in this client`, { algorithm_id: alg });
        stop('UNKNOWN_ALGORITHM', 'gating', kind, `"${alg}" is not a registered algorithm`, { algorithm_id: alg });
      }
      if ((o.unavailable_providers || []).includes(alg)) stop('PROVIDER_UNAVAILABLE', 'gating', kind, `the provider for ${alg} is unavailable`, { algorithm_id: alg });
    };
    gate_alg(digest_alg, 'algorithm.digest', digest_info);
    gate_alg(sig_alg, 'algorithm.signature', sig_info);
    if (is_obj(bundle.meta.encryption) && bundle.meta.encryption.kem !== undefined) gate_alg(String(bundle.meta.encryption.kem), 'algorithm.kem', (a) => pb_registry.key_encapsulation.includes(a));
    /* migration: broken / disallowed / deprecated, decided at the verification time against a trusted anchor */
    const anchor_ms = (o.timestamp_check && o.timestamp_check.status === 'valid') ? ts(o.timestamp_check.time) : NaN;
    const broken = Object.assign({}, o.broken_algorithms || {});
    for (const alg of [digest_alg, sig_alg]) {
      const states = Object.assign({}, pb_registry.algorithm_states[alg] || {}, broken[alg] ? { broken_from: broken[alg] } : {});
      const at = (k) => is_str(states[k]) ? ts(states[k]) : NaN;
      for (const [k, code] of [['broken_from', 'FORBIDDEN_ALGORITHM'], ['disallowed_from', 'DEPRECATED_ALGORITHM']]) {
        const t = at(k); if (Number.isNaN(t)) continue;
        need_time('gating', `the ${alg} migration state`);
        if (now_ms >= t) {
          if (!Number.isNaN(anchor_ms) && anchor_ms < t) warn('gating', 'algorithm.legacy_use', `${alg} is ${k === 'broken_from' ? 'broken' : 'disallowed'} since ${states[k]}; accepted as legacy use because a trusted time anchor (${o.timestamp_check.time}) precedes it`);
          else stop(code, 'gating', 'algorithm.' + k.replace('_from', ''), `${alg} is ${k === 'broken_from' ? 'broken' : 'disallowed'} since ${states[k]} and no trusted time anchor shows the receipt predates that`, { algorithm_id: alg });
        }
      }
      const tdep = at('deprecated_from');
      if (!Number.isNaN(tdep) && now_ms >= tdep && !(now_ms >= at('disallowed_from'))) {
        if (pb_registry.strict_profiles.includes(bundle.hdr.profile) || o.reject_deprecated) stop('DEPRECATED_ALGORITHM', 'gating', 'algorithm.deprecated', `${alg} is deprecated since ${states.deprecated_from} and profile ${bundle.hdr.profile} refuses deprecated algorithms`, { algorithm_id: alg });
        warn('gating', 'algorithm.deprecated', `${alg} is deprecated since ${states.deprecated_from}`);
      }
    }
    step('gating', 'Version · profile · algorithms', `spec ${ver} · ${bundle.hdr.profile} · ${digest_alg} · ${sig_alg} ✓`);

    /* ── 4 cryptographic integrity ───────────────────────────────────────── */
    let digest = null, signer_pub = null;
    /* who signed: the result names what anchors the key. A key the bundle carries for itself shows only that the bundle is
       intact under that key; without an expected signer, a trust set or a supplied key, anyone can reseal and get the same. */
    const anchor_signer = (pub, key_source) => {
      const trust = o.trust || null;
      if (o.expected_signer && pb_ed25519_raw_key(o.expected_signer) !== pub) stop('UNEXPECTED_SIGNER', 'crypto', 'signer.expected', 'the sealing key is not the expected signer', { key_id: String(pub).slice(0, 16) });
      let basis = o.expected_signer ? 'expected_signer' : key_source === 'supplied' ? 'supplied_key' : null;
      if (trust && Array.isArray(trust.keys)) {
        const entry = trust.keys.find((k) => pb_ed25519_raw_key(k.pub_b64u) === pub);
        if (!entry) { if (trust.require_known !== false) stop('UNKNOWN_SIGNER', 'crypto', 'signer.known', 'the sealing key is not in the supplied trust set', { key_id: String(pub).slice(0, 16) }); }
        else {
          if (entry.status === 'revoked') stop('REVOKED_KEY', 'crypto', 'key.revoked', `key ${entry.key_id || ''} is revoked`, { key_id: entry.key_id || null });
          if (is_str(entry.not_after)) { need_time('crypto', 'the key validity window'); if (now_ms > ts(entry.not_after)) stop('EXPIRED_KEY', 'crypto', 'key.not_after', `key validity ended ${entry.not_after}`, { key_id: entry.key_id || null }); }
          if (is_str(entry.not_before)) { need_time('crypto', 'the key validity window'); if (now_ms < ts(entry.not_before)) stop('KEY_NOT_YET_VALID', 'crypto', 'key.not_before', `key validity starts ${entry.not_before}`, { key_id: entry.key_id || null }); }
          basis = basis || 'trust_set';
        }
      }
      signer = { key_id: String(pub).slice(0, 16), basis: basis || 'carried_by_bundle' };
    };
    if (envelope === 'legacy') {
      signer_pub = o.pub_override || bundle.sig.pub;
      anchor_signer(pb_ed25519_raw_key(signer_pub), o.pub_override ? 'supplied' : 'bundle');
      const { sig: _x, ...for_sig } = bundle;
      const ok = await ed25519_verify(utf8(bundle.merkleRoot + '|' + canonical_json(for_sig)), b64u_decode(bundle.sig.sig), b64u_decode(signer_pub));
      if (!ok) stop('INVALID_SIGNATURE', 'crypto', 'signature', 'legacy v1.1.0 Ed25519 signature does not verify', { algorithm_id: 'Ed25519' });
      warn('crypto', 'envelope.legacy', 'legacy v1.1.0 envelope (signature over merkleRoot|canonical, no digest field)');
    } else {
      const { seal: _s, sig: _l, ...for_sig } = bundle;
      if (envelope === 'disclosure') {
        const bytes = (digest_info(digest_alg) || { bits: 256 }).bits / 8, hashes = [];
        for (const l of disc.leaves) {
          if ('salt_b64u' in l) hashes.push(await pb_disclosure_leaf_hash(l.path, l.salt_b64u, pb_disclosure_value(bundle, l.path).value, digest_alg));
          else { const h = b64u_decode(l.leaf_b64u); if (h.length !== bytes) stop('MALFORMED', 'crypto', 'disclosure.leaf', `${l.path}: a withheld leaf is ${h.length} bytes, ${digest_alg} gives ${bytes}`); hashes.push(h); }
        }
        const st = await pb_disclosure_statement_digest(hashes, digest_alg);
        digest = st.digest;
        if (b64u_encode(digest) !== bundle.seal.digest_b64u) stop('DIGEST_MISMATCH', 'crypto', 'disclosure.root', `the ${disc.leaves.length} committed leaves give root ${st.root_b64u.slice(0, 16)}…, whose statement digest is not seal.digest_b64u — a disclosed value, salt or withheld leaf differs from what was sealed`, { algorithm_id: digest_alg });
      } else {
        digest = await digest_bytes(digest_alg, canonical_json(for_sig));
        if (b64u_encode(digest) !== bundle.seal.digest_b64u) stop('DIGEST_MISMATCH', 'crypto', 'digest', `${digest_alg} digest of the canonical bundle-without-seal does not match seal.digest_b64u — content changed after sealing`, { algorithm_id: digest_alg });
      }
      if (envelope === 'native') {
        const leaves = [canonical_json(bundle.hdr), canonical_json(bundle.meta), canonical_json(bundle.payload || {})];
        const root = b64u_encode(await merkle_root_alg(leaves, digest_alg));
        if (root !== bundle.merkleRoot) stop('DIGEST_MISMATCH', 'crypto', 'merkle_root', `computed Merkle root ${root.slice(0, 16)}… ≠ committed ${String(bundle.merkleRoot).slice(0, 16)}…`, { algorithm_id: digest_alg });
        signer_pub = o.pub_override || bundle.seal.pub_b64u;
      } else if (envelope === 'disclosure') {
        signer_pub = o.pub_override || bundle.seal.pub_b64u;
      } else {
        signer_pub = o.pub_override;
        if (!is_str(signer_pub) || !signer_pub) stop('SIDE_INFORMATION_MISSING', 'crypto', 'key.supplied', 'a key-beside envelope carries no key; the producer key must be supplied with it');
      }
      if (sig_alg === 'Ed25519') signer_pub = pb_ed25519_raw_key(signer_pub);
      anchor_signer(signer_pub, o.pub_override ? 'supplied' : 'bundle');
      let sig_ok = false;
      try {
        sig_ok = await pb_signature_ok(sig_alg, signer_pub, digest, bundle.seal.signature_b64u, ver);
      } catch (e) {
        if (/unimplemented|not available|unavailable/i.test(String(e && e.message))) stop('PROVIDER_UNAVAILABLE', 'crypto', 'provider', String(e.message), { algorithm_id: sig_alg });
        sig_ok = false;
      }
      /* witness: bound in the signed content, or legacy unbound */
      const wb = bundle.meta.witness_binding, w = bundle.seal.witness;
      if (wb !== undefined) {
        if (!is_obj(wb) || !is_str(wb.pub_b64u) || !is_str(wb.sig_alg)) stop('MALFORMED', 'crypto', 'witness.binding', 'meta.witness_binding must carry sig_alg and pub_b64u');
        if (!w) stop('INSUFFICIENT_SIGNATURES', 'crypto', 'witness.present', 'the signed content binds a witness and the seal carries none — witness removed after sealing');
        if (w.sig_alg !== wb.sig_alg || w.pub_b64u !== wb.pub_b64u) stop('UNEXPECTED_SIGNER', 'crypto', 'witness.key', 'the witness key differs from the one bound in the signed content — witness replaced after sealing');
      }
      /* the witness layer (dual-signature specification): both layers sign the same digest */
      let w_ok = null, w_alg = null;
      if (w) {
        if (!is_obj(w) || !is_str(w.sig_alg) || !is_str(w.pub_b64u) || !is_str(w.signature_b64u)) stop('MALFORMED', 'crypto', 'witness.shape', 'seal.witness must carry sig_alg, pub_b64u and signature_b64u');
        w_alg = norm_s(w.sig_alg); gate_alg(w_alg, 'algorithm.witness', sig_info);
        try { w_ok = await sig_verify(w_alg, digest, b64u_decode(w.signature_b64u), w_alg === 'Ed25519' ? pb_ed25519_raw_key(w.pub_b64u) : w.pub_b64u); } catch { w_ok = false; }
      }
      /* exactly one layer valid: the specification calls for investigation, not a verdict either way */
      if (w && sig_ok !== w_ok) stop('INDETERMINATE', 'crypto', 'witness.disagreement', `${sig_ok ? `primary ${sig_alg} valid, ${w_alg} witness INVALID` : `primary ${sig_alg} INVALID, ${w_alg} witness valid`} — the two layers disagree: partial key compromise, implementation mismatch or a targeted algorithm attack; requires investigation`, { algorithm_id: sig_ok ? w_alg : sig_alg });
      if (!sig_ok) {
        let note = '';
        try {
          if (sig_alg === 'Ed25519') {
            const { seal: _s2, sig: _l2, ...body } = bundle;
            if (await sig_verify('Ed25519', utf8(canonical_json(body)), b64u_decode(bundle.seal.signature_b64u), signer_pub)) note = ' (it verifies over the canonical message bytes instead of the digest — the June 2026 generator form, which the specification does not admit)';
          }
        } catch { /* diagnostic only */ }
        stop('INVALID_SIGNATURE', 'crypto', 'signature', `${sig_alg} signature over the ${digest_alg} digest does not verify${w ? ', and neither does the witness' : ''}${note}`, { algorithm_id: sig_alg, key_id: String(signer_pub).slice(0, 16) });
      }
      if (w) {
        if (wb === undefined) warn('crypto', 'witness.unbound', 'legacy dual-signature envelope: the witness key is not committed in the signed content, so its removal or replacement cannot be detected');
        step('crypto', 'Dual signature', `${sig_alg} primary ✓ + ${w_alg} witness ✓ over one ${digest_alg} digest`);
      }
      const req = Number.isFinite(o.required_signatures) ? o.required_signatures : 1;
      const have = 1 + (w ? 1 : 0);
      if (have < req) stop('INSUFFICIENT_SIGNATURES', 'crypto', 'signatures.count', `${have} valid signature(s), ${req} required`);
      step('crypto', 'Digest and signature', `${digest_alg} digest ✓ · ${sig_alg} signature ✓${envelope === 'native' ? ' · Merkle root ✓' : envelope === 'disclosure' ? ` · ${disc.leaves.length} committed leaves ✓` : ''}`);
      if (envelope === 'disclosure' && disc.withheld.length) warn('crypto', 'disclosure.withheld', `${disc.withheld.length} of ${disc.leaves.length} committed fields are withheld (${disc.withheld.join(', ')}): the verdict covers the disclosed fields; a withheld field is known only to be committed`);
      if ('_engine' in bundle.seal || '_engine_note' in bundle.seal) warn('crypto', 'seal.unsigned_note', `seal._engine${'_engine_note' in bundle.seal ? ' and seal._engine_note are unsigned notes' : ' is an unsigned note'} from the sealer (${bundle.seal._engine || ''}); no signature covers them`);
    }
    /* certificate (declared issuer certificate) */
    if (bundle.meta.issuer_certificate !== undefined) {
      const c = o.certificate_check;
      if (!c) stop('EVIDENCE_INCOMPLETE', 'crypto', 'certificate.check', 'the bundle declares an issuer certificate and no certificate check result was supplied');
      const map = { invalid: 'CERTIFICATE_INVALID', path_invalid: 'CERTIFICATE_PATH_INVALID', untrusted: 'CERTIFICATE_UNTRUSTED', revocation_indeterminate: 'CERTIFICATE_REVOCATION_INDETERMINATE' };
      if (map[c.status]) stop(map[c.status], 'crypto', 'certificate.' + c.status, c.message || `issuer certificate: ${c.status}`);
      if (c.status !== 'valid') stop('MALFORMED', 'crypto', 'certificate.status', `unrecognized certificate check status "${c.status}"`);
      step('crypto', 'Issuer certificate', 'certificate, path and trust ✓ (supplied check)');
    }
    /* time anchor (declared, or required by the profile) */
    /* entered when the bundle declares an anchor, its profile requires one, or the caller does (require_timestamp): a caller's
       requirement on a bundle that declares none is EVIDENCE_INCOMPLETE, not silently satisfied */
    if (bundle.meta.time_anchor !== undefined || pb_registry.anchored_profiles.includes(bundle.hdr.profile) || !!o.require_timestamp) {
      const t = o.timestamp_check, required = pb_registry.anchored_profiles.includes(bundle.hdr.profile) || !!o.require_timestamp;
      if (bundle.meta.time_anchor === undefined && required) stop('EVIDENCE_INCOMPLETE', 'crypto', 'timestamp.declared', `profile ${bundle.hdr.profile} requires a time anchor and the bundle declares none`);
      if (!t) { if (required) stop('TIMESTAMP_INDETERMINATE', 'crypto', 'timestamp.check', 'a time anchor is required and no anchor check result was supplied'); else warn('crypto', 'timestamp.unchecked', 'time anchor declared but not checked'); }
      else if (t.status === 'invalid') stop('TIMESTAMP_INVALID', 'crypto', 'timestamp.invalid', t.message || 'the time anchor does not commit to this bundle');
      else if (t.status === 'untrusted') stop('TIMESTAMP_UNTRUSTED', 'crypto', 'timestamp.untrusted', t.message || 'the time anchor is not from a trusted source');
      else if (t.status === 'pending') { if (required) stop('TIMESTAMP_INDETERMINATE', 'crypto', 'timestamp.pending', 'the time anchor is still pending confirmation'); warn('crypto', 'timestamp.pending', 'time anchor pending confirmation'); }
      else if (t.status === 'valid') step('crypto', 'Time anchor', `anchored at ${t.time} ✓`);
      else stop('MALFORMED', 'crypto', 'timestamp.status', `unrecognized timestamp check status "${t.status}"`);
    }

    if (signer && signer.basis === 'carried_by_bundle' && !o._integrity_only) warn('crypto', 'signer.self_carried', `the sealing key (${signer.key_id}…) is the one the bundle carries, and no expected signer, trust set or key was supplied: the bundle is intact under that key, which does not identify who holds it — supply expected_signer or a trust set to bind it`);
    if (o._integrity_only) return finish('VERIFIED', 'crypto', null);

    /* ── 5 boundary (validity window, then predicates) ───────────────────── */
    const exp = bundle.meta.expiration ?? bundle.meta.expires_at;
    if (exp !== undefined) { need_time('boundary', 'the bundle expiry'); const t = ts(exp); if (Number.isNaN(t)) stop('MALFORMED', 'boundary', 'validity.expiration', `expiration "${exp}" is not a timestamp`); if (t <= now_ms) stop('BUNDLE_EXPIRED', 'boundary', 'validity.expiration', `expired ${exp}`); }
    if (bundle.meta.not_before !== undefined) { need_time('boundary', 'the bundle start'); const t = ts(bundle.meta.not_before); if (Number.isNaN(t)) stop('MALFORMED', 'boundary', 'validity.not_before', `not_before "${bundle.meta.not_before}" is not a timestamp`); if (t > now_ms) stop('BUNDLE_NOT_YET_VALID', 'boundary', 'validity.not_before', `valid from ${bundle.meta.not_before}`); }
    const ctx = o.context || {};
    const bnd = bundle.meta.boundary;
    if (bnd !== undefined && bnd !== null) {
      const ok = pb_boundary_eval(bnd, ctx, now_ms, { need_time });
      if (!ok) stop('POLICY_DENIED', 'boundary', 'boundary', 'the boundary predicate is false for the supplied context — the artifact is outside its declared applicability');
      step('boundary', 'Boundary', 'predicate holds ✓');
    }

    /* ── 6 auxiliary data ────────────────────────────────────────────────── */
    if (bundle.meta.requires_side_attestations === true || (Array.isArray(bundle.meta.aux) && bundle.meta.aux.length)) {
      if (o.side_store_unreachable) stop('EXTERNAL_SERVICE_UNAVAILABLE', 'auxiliary', 'store', 'the side-information store is unreachable');
      if (bundle.meta.requires_side_attestations === true) {
        const sa = bundle.meta.side_attestations;
        if (!Array.isArray(sa) || !sa.length) stop('SIDE_INFORMATION_MISSING', 'auxiliary', 'side_attestations', 'required side attestations are absent');
        sa.forEach((a, i) => { if (!is_obj(a) || !['role', 'party', 'statement', 'signature_b64u'].every((k) => is_str(a[k]))) stop('EVIDENCE_INCOMPLETE', 'auxiliary', 'side_attestations.shape', `side_attestations[${i}] is incomplete`); });
      }
      for (const [i, x] of (Array.isArray(bundle.meta.aux) ? bundle.meta.aux : []).entries()) {
        const item = (o.aux_store || {})[x && x.id];
        if (item === undefined) stop('SIDE_INFORMATION_MISSING', 'auxiliary', 'aux.item', `aux[${i}] "${x && x.id}" was not supplied`);
        const d = b64u_encode(await digest_bytes(norm_d(x.digest_alg), typeof item === 'string' ? utf8(item) : item));
        if (d !== x.digest_b64u) stop('SIDE_INFORMATION_MISSING', 'auxiliary', 'aux.digest', `aux[${i}] does not match its declared digest`);
      }
      step('auxiliary', 'Auxiliary data', 'required side information present and matching ✓');
    }

    /* ── 7 lineage, with 8 budgets enforced at every step ────────────────── */
    const refs = Array.isArray(bundle.refs) ? bundle.refs : (Array.isArray(bundle.meta.refs) ? bundle.meta.refs : []);
    if (refs.length) {
      const budgets = Object.assign({ max_depth: Number.isFinite(o.max_depth) ? o.max_depth : 16, max_containers: 256, max_bytes: 64 << 20 }, o.budgets || {});
      const store = Object.assign({}, o.bundles || {});
      for (const p of (Array.isArray(o.parent_bundles) ? o.parent_bundles : [])) if (is_obj(p) && is_obj(p.hdr)) store[p.hdr.bundle_id] = p;
      /* Lineage is a DAG. Each distinct ancestor is resolved, digest-bound and integrity-checked once; every edge's digest
         commitment is checked; max_containers and max_bytes count distinct ancestors; max_depth bounds the longest path.
         A node met again on the current path is a cycle; met again off it, it is a shared ancestor already verified. */
      let seen = 0, bytes = 0;
      const height = new Map(), on_path = new Set();
      const bind_edge = async (ref, pid, p) => {
        if (is_obj(ref) && is_str(ref.parent_digest)) {
          const { seal: _ps, ...pw } = p;
          const pd = b64u_encode(await digest_bytes(norm_d(ref.digest_alg || ref.parent_digest_alg || 'SHA-256'), canonical_json(pw)));
          if (pd !== ref.parent_digest) stop('LINEAGE_INVALID', 'lineage', 'parent.digest', `parent ${pid} does not match the digest the child committed to`);
        }
      };
      const visit = async (b, bid, depth) => {
        on_path.add(bid); let h = 0;
        const rs = Array.isArray(b.refs) ? b.refs : (Array.isArray((b.meta || {}).refs) ? b.meta.refs : []);
        for (const [i, ref] of rs.entries()) {
          const pid = is_str(ref) ? ref : (ref && ref.parent_id);
          if (!is_str(pid)) stop('MALFORMED', 'lineage', 'ref.shape', `refs[${i}] has no parent_id`);
          if (on_path.has(pid)) stop('LINEAGE_CYCLE', 'lineage', 'cycle', `${pid} appears twice on one path from the root`);
          if (height.has(pid)) {
            if (depth + 1 + height.get(pid) > budgets.max_depth) stop('RESOURCE_EXHAUSTED', 'budget', 'max_depth', `lineage depth ${depth + 1 + height.get(pid)} > max_depth ${budgets.max_depth}`);
            await bind_edge(ref, pid, store[pid]);
            h = Math.max(h, 1 + height.get(pid));
            continue;
          }
          if (depth + 1 > budgets.max_depth) stop('RESOURCE_EXHAUSTED', 'budget', 'max_depth', `lineage depth ${depth + 1} > max_depth ${budgets.max_depth}`);
          if (o.lineage_store_unreachable) stop('ANCESTOR_UNAVAILABLE', 'lineage', 'store', 'the lineage store is unreachable');
          const p = store[pid];
          if (!p) stop('LINEAGE_MISSING', 'lineage', 'parent', `parent ${pid} is referenced and was not supplied`);
          seen += 1; bytes += utf8(canonical_json(p)).length;
          if (seen > budgets.max_containers) stop('RESOURCE_EXHAUSTED', 'budget', 'max_containers', `${seen} ancestors > max_containers ${budgets.max_containers}`);
          if (bytes > budgets.max_bytes) stop('RESOURCE_EXHAUSTED', 'budget', 'max_bytes', `${bytes} ancestor bytes > max_bytes ${budgets.max_bytes}`);
          await bind_edge(ref, pid, p);
          const parent_key = (o.parent_keys || {})[pid];
          const key_beside_parent = is_obj(p.seal) && !('pub_b64u' in p.seal) && !('merkleRoot' in p);
          if (key_beside_parent && !parent_key) {
            if (!(is_obj(ref) && is_str(ref.parent_digest))) stop('LINEAGE_INVALID', 'lineage', 'parent.unbound', `parent ${pid} carries no key and the child commits to no digest of it — nothing binds it`);
            warn('lineage', 'parent.signature_unchecked', `parent ${pid} is bound by the child's signed digest commitment; its own signature was not checked (no key supplied for it)`);
          } else {
            const pr = await verify_bundle(p, { _integrity_only: true, now: o.now, pub_override: parent_key, trust: o.trust });
            if (pr.code !== 'VERIFIED' && pr.code !== 'VERIFIED_WITH_WARNINGS') stop('LINEAGE_INVALID', 'lineage', 'parent.integrity', `parent ${pid} fails integrity: ${pr.code}`);
          }
          h = Math.max(h, 1 + await visit(p, pid, depth + 1));
        }
        on_path.delete(bid); height.set(bid, h); return h;
      };
      await visit(bundle, bundle.hdr.bundle_id, 0);
      step('lineage', 'Lineage', `${seen} ancestor(s) resolve, digest-bind and verify; no cycle; within budgets ✓`);
    }

    const get = (path) => { let cur = ctx; for (const k of String(path).split('.')) { if (!cur || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, k)) return [undefined, false]; cur = cur[k]; } return [cur, true]; };
    /* ── 9 policy ─────────────────────────────────────────────────────────── */
    const prof = bundle.hdr.profile;
    if (prof === 'PB-REGULATED-1') {
      const hitl = bundle.meta.hitl, sa = bundle.meta.side_attestations;
      if (!is_obj(hitl) && !(Array.isArray(sa) && sa.length)) stop('POLICY_DENIED', 'policy', 'regulated.approval', 'PB-REGULATED-1 requires a human approval (meta.hitl or side attestations)');
      const approvals = Array.isArray(bundle.meta.approvals) ? bundle.meta.approvals : [];
      for (const [i, a] of approvals.entries()) {
        if (is_str(a.expires_at)) { need_time('policy', 'an approval expiry'); if (ts(a.expires_at) <= now_ms) stop('POLICY_DENIED', 'policy', 'approval.expired', `approvals[${i}] expired ${a.expires_at}`); }
      }
    }
    if (Array.isArray(bundle.meta.policy_requires)) {
      for (const k of bundle.meta.policy_requires) {
        const [v, ok] = get(k);
        if (!ok) stop('POLICY_INDETERMINATE', 'policy', 'context.' + k, `policy needs context value "${k}" to decide and it was not supplied`);
        if (v === false) stop('POLICY_DENIED', 'policy', 'context.' + k, `policy requirement "${k}" is not met`);
      }
    }
    if (bundle.meta.claim_type === 'prediction' || prof === 'PB-PREDICTION-1') {
      if (!is_str(bundle.meta.falsification_condition) || !bundle.meta.falsification_condition) stop('EVIDENCE_INCOMPLETE', 'policy', 'prediction.falsification', 'a prediction must state its falsification condition');
      const obs = ctx.observation;
      if (obs === undefined) return finish('NULL', 'policy', { code: 'NULL', stage: 'policy', predicate: 'prediction.observation', message: 'no observation supplied yet — the prediction has no truth value at this time' });
      if (!is_obj(obs) || typeof obs.falsified !== 'boolean') stop('MALFORMED', 'policy', 'prediction.observation', 'context.observation must carry a boolean "falsified"');
      if (obs.falsified) stop('NEGATIVE', 'policy', 'prediction.falsified', 'the supplied observation falsifies the prediction');
      step('policy', 'Prediction', 'observation does not falsify the prediction ✓');
    }
    step('policy', 'Policy', `profile ${prof} ✓`);
    return finish('VERIFIED', 'policy', null);
  } catch (e) {
    if (e instanceof pb_verdict_stop) return finish(e.code, e.stage, e.cause);
    return finish('INTERNAL_ERROR', 'internal', { code: 'INTERNAL_ERROR', stage: 'internal', predicate: 'exception', message: String(e && e.stack || e).slice(0, 400) });
  }
}
