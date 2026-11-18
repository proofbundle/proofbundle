/* Conformance definition generator: every dispatched digest × every dispatched signature scheme,
   one constructed case per verdict that the pair can reach. The expected verdict is fixed by the
   construction, never read back from the verifier. Runs inside the client (uses seal_core, sig_keygen). */
async function pb_generate_conformance(progress) {
  const now = '2026-11-01T00:00:00Z', now_ms = Date.parse(now);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const lim = (typeof window !== 'undefined' && window.__pb_limit) || {};
  const digests = lim.digests || pb_digests.map((d) => d.id), sigs = lim.sigs || pb_sigs.map((s) => s.id);
  const keys = {}, others = {};
  for (const s of sigs) { if (progress) progress(`keygen ${s}`); keys[s] = await sig_keygen(s); others[s] = await sig_keygen(s); }
  const wit = await sig_keygen('Ed25519');
  const seal = async (d, s, extra_meta, extra) => {
    const b = Object.assign({ hdr: { profile: 'PB-INTEGRITY-1' }, meta: Object.assign({ producer_id: 'pb-conformance-1.0.0', created_at: '2026-11-01T00:00:00Z' }, extra_meta || {}), payload: { label: 'conformance', pair: `${d}|${s}` } }, clone(extra || {}));
    if (extra && extra.hdr) b.hdr = Object.assign({ profile: 'PB-INTEGRITY-1' }, extra.hdr);
    await seal_core(b, d, s, keys[s]); return b;
  };
  const cases = [];
  let n = 0;
  /* A verified result names what anchors the signer. Cases expected to verify are given the key they were sealed with as
     the expected signer unless the construction supplies its own anchor (trust set, supplied key) or tests its absence
     (anchor = false), so each verified case isolates the property it constructs. */
  const add = (d, s, expected, construction, bundle, opts, parents, anchor = true) => {
    n += 1;
    const o = Object.assign({ now: now }, opts || {});
    if (anchor && expected.startsWith('VERIFIED') && !o.expected_signer && !o.trust && !o.pub_override) o.expected_signer = keys[s].pub;
    cases.push({ id: `pb-1.0.0-${String(n).padStart(5, '0')}`, digest_alg: d, sig_alg: s, expected_verdict: expected, construction, bundle, opts: o, parents: parents || [] });
  };
  const flip = (b64) => { const x = b64u_decode(b64); x[x.length >> 1] ^= 0x01; return b64u_encode(x); };
  for (const d of digests) for (const s of sigs) {
    if (progress) progress(`${d} × ${s}`);
    const base = await seal(d, s);
    const classical = !!(pb_registry.algorithm_states[s]);
    add(d, s, 'VERIFIED', 'sealed by the client, unchanged', base);
    add(d, s, 'VERIFIED_WITH_WARNINGS', 'sealed by the client, verified with no expected signer, trust set or key (the key the bundle carries is all that was checked)', base, {}, [], false);
    { const r = clone(base); r.payload = { label: 'resealed by another key holder' }; delete r.seal; delete r.merkleRoot; await seal_core(r, d, s, others[s]);
      add(d, s, 'UNEXPECTED_SIGNER', 'content changed and resealed under another key; the expected signer is supplied', r, { expected_signer: keys[s].pub });
      add(d, s, 'UNKNOWN_SIGNER', 'content changed and resealed under another key; a trust set holding only the original key is supplied', r, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'original' }] } });
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'content changed and resealed under another key; nothing anchors the signer (intact under the key it carries, flagged as unanchored)', r, {}, [], false); }
    { const b = clone(base); b.seal.time_anchors = [{ kind: 'opentimestamps', proof_b64u: 'AAAA' }];
      add(d, s, 'MALFORMED', 'seal.time_anchors added after sealing (a field outside the seal schema, covered by no signature)', b); }
    { const b = clone(base); b.seal._engine = 'pure-js-fallback'; b.seal._engine_note = 'conformance';
      add(d, s, 'VERIFIED_WITH_WARNINGS', "seal carries the sealer's unsigned engine note (seal._engine, seal._engine_note)", b); }
    { /* base64url with nonzero unused trailing bits decodes to the same bytes: one bundle would have many byte forms */
      const odd = (x) => { if (typeof x !== 'string') return null; const l = b64u_decode(x).length; if (l % 3 === 0) return null;
        const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; const v = a.indexOf(x[x.length - 1]);
        return x.slice(0, -1) + a[v | 1]; };
      for (const f of ['signature_b64u', 'pub_b64u']) { const alt = odd(base.seal[f]); if (!alt) continue;
        const b = clone(base); b.seal[f] = alt; add(d, s, 'NONCANONICAL', `seal.${f} re-spelled with a nonzero unused trailing bit (same bytes, non-canonical base64url)`, b); } }
    { const b = clone(base); b.seal.witness = { sig_alg: 'Ed25519', pub_b64u: wit.pub, signature_b64u: b64u_encode(await sig_sign('Ed25519', b64u_decode(b.seal.digest_b64u), wit.priv)) };
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'valid witness added without a binding in the signed content (legacy dual-signature form)', b); }
    { const b = clone(base); delete b.hdr.profile; add(d, s, 'MALFORMED', 'hdr.profile deleted', b); }
    add(d, s, 'NONCANONICAL', 'the same bundle supplied as JSON text with whitespace', JSON.stringify(base, null, 1));
    { const b = clone(base); b.hdr.spec_ver = '1.1.0'; add(d, s, 'UNSUPPORTED_VERSION', 'native envelope claiming spec 1.1.0 (a legacy-only version)', b); }
    { const b = clone(base); b.hdr.spec_ver = '99.0.0'; add(d, s, 'UNKNOWN_VERSION', 'spec_ver 99.0.0', b); }
    { const b = clone(base); b.seal.digest_alg = b.meta.digest_alg = 'SM3'; add(d, s, 'UNSUPPORTED_ALGORITHM', 'digest_alg SM3 (registered, not implemented in this client)', b); }
    { const b = clone(base); b.seal.digest_alg = b.meta.digest_alg = 'SHA-999'; add(d, s, 'UNKNOWN_ALGORITHM', 'digest_alg SHA-999 (not registered)', b); }
    for (const ua of ['Falcon512', 'SLH-DSA-SHA2-128f']) { const b = clone(base); b.seal.sig_alg = b.meta.sig_alg = ua;
      add(d, s, 'UNSUPPORTED_ALGORITHM', `sig_alg ${ua} (registered; not executable in this client until its from-scratch implementation lands)`, b); }
    { const b = clone(base); b.seal.sig_alg = b.meta.sig_alg = 'Lamport-9'; add(d, s, 'UNKNOWN_ALGORITHM', 'sig_alg Lamport-9 (not registered)', b); }
    if (classical) {
      add(d, s, 'DEPRECATED_ALGORITHM', `verified in 2032 (after ${s} deprecation) with deprecated algorithms refused`, base, { now: '2032-06-01T00:00:00Z', reject_deprecated: true });
      add(d, s, 'VERIFIED_WITH_WARNINGS', `verified in 2032 (after ${s} deprecation), deprecated algorithms allowed for verification`, base, { now: '2032-06-01T00:00:00Z' });
      add(d, s, 'DEPRECATED_ALGORITHM', `verified in 2037 (after ${s} is disallowed) with no time anchor`, base, { now: '2037-06-01T00:00:00Z' });
    }
    { const b = clone(base); b.seal.digest_alg = b.meta.digest_alg = 'SHA-1'; add(d, s, 'FORBIDDEN_ALGORITHM', 'digest_alg SHA-1 (recognized and refused)', b); }
    add(d, s, 'FORBIDDEN_ALGORITHM', `${d} declared broken from 2026-10-01, no time anchor`, base, { broken_algorithms: { [d]: '2026-10-01T00:00:00Z' } });
    { const b = await seal(d, s, { time_anchor: { kind: 'opentimestamps' } });
      add(d, s, 'VERIFIED_WITH_WARNINGS', `${d} declared broken from 2026-10-01, trusted time anchor 2026-09-01 precedes the break (legacy use)`, b, { broken_algorithms: { [d]: '2026-10-01T00:00:00Z' }, timestamp_check: { status: 'valid', time: '2026-09-01T00:00:00Z' } });
      add(d, s, 'TIMESTAMP_INVALID', 'declared time anchor checks invalid', b, { timestamp_check: { status: 'invalid' } });
      add(d, s, 'TIMESTAMP_UNTRUSTED', 'declared time anchor from an untrusted source', b, { timestamp_check: { status: 'untrusted' } });
      add(d, s, 'TIMESTAMP_INDETERMINATE', 'time anchor required and still pending', b, { require_timestamp: true, timestamp_check: { status: 'pending' } }); }
    { const b = clone(base); b.payload = { label: 'changed after sealing' }; add(d, s, 'DIGEST_MISMATCH', 'payload changed after sealing', b); }
    { const b = clone(base); b.seal.signature_b64u = flip(b.seal.signature_b64u); add(d, s, 'INVALID_SIGNATURE', 'one signature byte flipped', b); }
    { const b = clone(base); delete b.seal.signature_b64u; add(d, s, 'MISSING_SIGNATURE', 'seal.signature_b64u deleted', b); }
    { const b = await seal(d, s, { witness_binding: { sig_alg: 'Ed25519', pub_b64u: wit.pub } });
      const w = { sig_alg: 'Ed25519', pub_b64u: wit.pub, signature_b64u: b64u_encode(await sig_sign('Ed25519', b64u_decode(b.seal.digest_b64u), wit.priv)) };
      const ok = clone(b); ok.seal.witness = w; add(d, s, 'VERIFIED', 'bound witness present and valid', ok);
      const wx = clone(ok); wx.seal.witness.note = 'unsigned'; add(d, s, 'MALFORMED', 'bound witness with a field outside the witness schema', wx);
      const rm = clone(b); add(d, s, 'INSUFFICIENT_SIGNATURES', 'bound witness removed after sealing', rm);
      const sw = clone(b); const ow = await sig_keygen('Ed25519'); sw.seal.witness = { sig_alg: 'Ed25519', pub_b64u: ow.pub, signature_b64u: b64u_encode(await sig_sign('Ed25519', b64u_decode(b.seal.digest_b64u), ow.priv)) };
      add(d, s, 'UNEXPECTED_SIGNER', 'bound witness replaced by another key after sealing', sw);
      const bad = clone(ok); bad.seal.witness.signature_b64u = flip(bad.seal.witness.signature_b64u); add(d, s, 'INDETERMINATE', 'bound witness signature flipped, primary valid (the layers disagree)', bad);
      const badp = clone(ok); badp.seal.signature_b64u = flip(badp.seal.signature_b64u); add(d, s, 'INDETERMINATE', 'primary signature flipped, bound witness valid (the layers disagree)', badp);
      const both = clone(bad); both.seal.signature_b64u = flip(both.seal.signature_b64u); add(d, s, 'INVALID_SIGNATURE', 'primary and bound witness signatures both flipped', both); }
    /* isolate each integrity check, so no check can mask another (found by the fault-planting run, 2026-11-01) */
    { const b = clone(base); b.seal.digest_b64u = flip(b.seal.digest_b64u);
      add(d, s, 'DIGEST_MISMATCH', 'seal.digest_b64u altered, content and signature untouched (isolates the digest comparison)', b); }
    { const b = clone(base); b.merkleRoot = flip(b.merkleRoot);
      const { seal: _s, sig: _l, ...for_sig } = b; const dg = await digest_bytes(d, canonical_json(for_sig));
      b.seal.digest_b64u = b64u_encode(dg); b.seal.signature_b64u = b64u_encode(await sig_sign(s, dg, keys[s].priv));
      add(d, s, 'DIGEST_MISMATCH', 'sealed and signed over a merkleRoot that is not the root of hdr/meta/payload (isolates the Merkle comparison)', b); }
    /* selective disclosure (PB-DISCLOSURE-1): one sealed record and presentations of it */
    { const rec = { hdr: { bundle_id: `disc-${d}-${s}` }, meta: { producer_id: 'pb-conformance-1.0.0', created_at: '2026-11-01T00:00:00Z', subject: 'record 7', expiration: '2027-06-01T00:00:00Z' },
        payload: { decision: 'yes', score: 0.93, note: 'free text' } };
      const full = await pb_disclosure_seal(rec, d, s, keys[s]);
      const part = await pb_disclosure_present(full, ['meta.subject', 'payload.decision']);
      const li = (b, p) => b.disclosure.leaves.findIndex((l) => l.path === p);
      add(d, s, 'VERIFIED', 'disclosure: every committed field disclosed', full);
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'disclosure: meta.subject and payload.decision withheld (the warning names them)', part);
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'disclosure: every field disclosed, nothing anchors the signer', full, {}, [], false);
      { const r2 = await pb_disclosure_seal(rec, d, s, others[s]); add(d, s, 'UNEXPECTED_SIGNER', 'disclosure: the same record sealed by another key, the original signer expected', r2, { expected_signer: keys[s].pub }); }
      { const b = clone(part); b.payload.note = 'changed'; add(d, s, 'DIGEST_MISMATCH', 'disclosure: a disclosed value changed', b); }
      { const b = clone(full); const i = li(b, 'payload.note'), j = li(b, 'payload.score'); const t = b.disclosure.leaves[i].salt_b64u;
        b.disclosure.leaves[i].salt_b64u = b.disclosure.leaves[j].salt_b64u; b.disclosure.leaves[j].salt_b64u = t; add(d, s, 'DIGEST_MISMATCH', 'disclosure: the salts of two disclosed fields swapped', b); }
      { const b = clone(part); const i = li(b, 'payload.decision'); b.disclosure.leaves[i].leaf_b64u = flip(b.disclosure.leaves[i].leaf_b64u); add(d, s, 'DIGEST_MISMATCH', 'disclosure: a withheld leaf hash altered', b); }
      { const b = clone(part); const i = li(b, 'payload.decision'); b.disclosure.leaves[i].leaf_b64u = b64u_encode(new Uint8Array(16)); add(d, s, 'MALFORMED', 'disclosure: a withheld leaf hash of the wrong length', b); }
      { const b = clone(full); b.seal.signature_b64u = flip(b.seal.signature_b64u); add(d, s, 'INVALID_SIGNATURE', 'disclosure: one signature byte flipped', b); }
      { const b = clone(full); b.payload.extra = 1; add(d, s, 'MALFORMED', 'disclosure: a payload field carried and not committed', b); }
      { const b = clone(full); b.merkleRoot = 'AAAA'; add(d, s, 'MALFORMED', 'disclosure: a top-level field outside the commitment', b); }
      { const b = clone(full); b.disclosure.leaves.push(clone(b.disclosure.leaves[1])); add(d, s, 'MALFORMED', 'disclosure: one path committed twice', b); }
      { const b = clone(full); b.disclosure.leaves.reverse(); add(d, s, 'NONCANONICAL', 'disclosure: leaves out of ascending path order', b); }
      { const b = clone(full); const i = li(b, 'hdr'); b.disclosure.leaves[i] = { path: 'hdr', leaf_b64u: b64u_encode(await pb_disclosure_leaf_hash('hdr', b.disclosure.leaves[i].salt_b64u, b.hdr, d)) };
        add(d, s, 'MALFORMED', 'disclosure: hdr withheld', b); }
      { const b = clone(full); b.disclosure.leaves[li(b, 'payload.score')].salt_b64u = b64u_encode(new Uint8Array(16).fill(7)); add(d, s, 'MALFORMED', 'disclosure: a 16-byte salt', b); }
      { const b = clone(full); b.disclosure.leaves[li(b, 'payload.score')].salt_b64u = b.disclosure.leaves[li(b, 'payload.note')].salt_b64u; add(d, s, 'MALFORMED', 'disclosure: one salt used for two leaves', b); }
      { const b = clone(full); delete b.payload.note; add(d, s, 'MALFORMED', 'disclosure: a field listed as disclosed is absent', b); }
      { const b = clone(part); b.payload.decision = 'yes'; add(d, s, 'MALFORMED', 'disclosure: a field listed as withheld is present', b); }
      { const b = clone(full); const i = li(b, 'meta.expiration');
        b.disclosure.leaves[i] = { path: 'meta.expiration', leaf_b64u: b64u_encode(await pb_disclosure_leaf_hash('meta.expiration', b.disclosure.leaves[i].salt_b64u, b.meta.expiration, d)) }; delete b.meta.expiration;
        add(d, s, 'EVIDENCE_INCOMPLETE', 'disclosure: meta.expiration withheld (verification acts on it)', b); }
      { const b = clone(base); b.hdr.profile = 'PB-DISCLOSURE-1'; add(d, s, 'MALFORMED', 'native envelope declaring the disclosure profile', b); }
      { const odd = (x) => { const l = b64u_decode(x).length; if (l % 3 === 0) return null; const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; return x.slice(0, -1) + a[a.indexOf(x[x.length - 1]) | 1]; };
        const b = clone(part); const i = li(b, 'payload.decision'); const alt = odd(b.disclosure.leaves[i].leaf_b64u);
        if (alt) { b.disclosure.leaves[i].leaf_b64u = alt; add(d, s, 'NONCANONICAL', 'disclosure: a withheld leaf hash re-spelled with a nonzero unused trailing bit', b); } } }
    add(d, s, 'UNEXPECTED_SIGNER', 'a different signer was expected', base, { expected_signer: others[s].pub });
    add(d, s, 'UNKNOWN_SIGNER', 'sealing key not in the supplied trust set', base, { trust: { keys: [{ pub_b64u: others[s].pub, key_id: 'other' }] } });
    add(d, s, 'REVOKED_KEY', 'sealing key revoked in the trust set', base, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', status: 'revoked' }] } });
    add(d, s, 'EXPIRED_KEY', 'sealing key validity ended 2026-10-01', base, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', not_after: '2026-10-01T00:00:00Z' }] } });
    add(d, s, 'KEY_NOT_YET_VALID', 'sealing key valid only from 2027-01-01', base, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', not_before: '2027-01-01T00:00:00Z' }] } });
    { const b = await seal(d, s, { issuer_certificate: { issuer: 'conformance-ca', serial: '01' } });
      add(d, s, 'CERTIFICATE_INVALID', 'issuer certificate checks invalid', b, { certificate_check: { status: 'invalid' } });
      add(d, s, 'CERTIFICATE_PATH_INVALID', 'issuer certificate path invalid', b, { certificate_check: { status: 'path_invalid' } });
      add(d, s, 'CERTIFICATE_UNTRUSTED', 'issuer certificate chains to no trusted root', b, { certificate_check: { status: 'untrusted' } });
      add(d, s, 'CERTIFICATE_REVOCATION_INDETERMINATE', 'issuer certificate revocation status unavailable', b, { certificate_check: { status: 'revocation_indeterminate' } });
      add(d, s, 'EVIDENCE_INCOMPLETE', 'issuer certificate declared, no certificate check supplied', b); }
    { const b = await seal(d, s, { expiration: '2026-10-15T00:00:00Z' });
      add(d, s, 'BUNDLE_EXPIRED', 'meta.expiration 2026-10-15, verified 2026-11-01', b);
      add(d, s, 'INDETERMINATE', 'expiry must be evaluated, supplied time required and not given', b, { now: undefined, require_supplied_time: true }); }
    { const b = await seal(d, s, { not_before: '2027-01-01T00:00:00Z' }); add(d, s, 'BUNDLE_NOT_YET_VALID', 'meta.not_before 2027-01-01', b); }
    { const parent = await seal(d, s, {}, { hdr: { profile: 'PB-INTEGRITY-1', bundle_id: `parent-${d}-${s}` } });
      const { seal: _ps, ...pw } = parent; const pd = b64u_encode(await digest_bytes(d, canonical_json(pw)));
      const good = await seal(d, s, { refs: [{ parent_id: parent.hdr.bundle_id, parent_digest: pd, digest_alg: d }] }, { hdr: { profile: 'PB-LINEAGE-1' } });
      add(d, s, 'VERIFIED', 'child with one valid, digest-bound parent', good, {}, [parent]);
      const wrong = await seal(d, s, { refs: [{ parent_id: parent.hdr.bundle_id, parent_digest: flip(pd), digest_alg: d }] }, { hdr: { profile: 'PB-LINEAGE-1' } });
      add(d, s, 'LINEAGE_INVALID', 'child commits to a parent digest the supplied parent does not have', wrong, {}, [parent]);
      add(d, s, 'LINEAGE_MISSING', 'child references a parent that is not supplied', good, {}, []);
      add(d, s, 'ANCESTOR_UNAVAILABLE', 'lineage store unreachable', good, { lineage_store_unreachable: true }, [parent]);
      add(d, s, 'RESOURCE_EXHAUSTED', 'one parent, max_depth 0', good, { budgets: { max_depth: 0 } }, [parent]);
      const cid = `cycle-child-${d}-${s}`;
      const cp = await seal(d, s, { refs: [cid] }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: `cycle-parent-${d}-${s}` } });
      const cc = await seal(d, s, { refs: [cp.hdr.bundle_id] }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: cid } });
      add(d, s, 'LINEAGE_CYCLE', 'child → parent → child', cc, {}, [cp]); }
    /* lineage is a DAG: shared ancestors count once, every edge's digest is checked, depth is the longest path */
    { const dg = async (b) => { const { seal: _s, ...w } = b; return b64u_encode(await digest_bytes(d, canonical_json(w))); };
      const edge = async (b, bad) => ({ parent_id: b.hdr.bundle_id, parent_digest: bad ? flip(await dg(b)) : await dg(b), digest_alg: d });
      const l = { hdr: { profile: 'PB-LINEAGE-1' } };
      const r = await seal(d, s, {}, { hdr: { profile: 'PB-INTEGRITY-1', bundle_id: `dag-root-${d}-${s}` } });
      const a = await seal(d, s, { refs: [await edge(r)] }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: `dag-a-${d}-${s}` } });
      const node_b = await seal(d, s, { refs: [await edge(r)] }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: `dag-b-${d}-${s}` } });
      const bx = await seal(d, s, { refs: [await edge(r, true)] }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: `dag-bx-${d}-${s}` } });
      const c = await seal(d, s, { refs: [await edge(a), await edge(node_b)] }, l);
      add(d, s, 'VERIFIED', 'diamond: child → two parents → one shared root; max_containers 3 (three distinct ancestors, four paths)', c, { budgets: { max_containers: 3 } }, [a, node_b, r]);
      add(d, s, 'RESOURCE_EXHAUSTED', 'diamond with max_containers 2 (three distinct ancestors)', c, { budgets: { max_containers: 2 } }, [a, node_b, r]);
      const cx = await seal(d, s, { refs: [await edge(a), await edge(bx)] }, l);
      add(d, s, 'LINEAGE_INVALID', 'diamond whose second edge to the shared root commits to a wrong digest (root already verified through the first edge)', cx, {}, [a, bx, r]);
      const node_s = await seal(d, s, { refs: [await edge(r), await edge(a)] }, l);
      add(d, s, 'RESOURCE_EXHAUSTED', 'shortcut: child → root and child → parent → root, max_depth 1 (longest path 2; the root is first reached by the short edge)', node_s, { budgets: { max_depth: 1 } }, [a, r]);
      add(d, s, 'VERIFIED', 'shortcut with max_depth 2', node_s, { budgets: { max_depth: 2 } }, [a, r]);
      if (s === 'Ed25519') {
        /* a ladder 14 levels deep, two nodes per level, each referencing both nodes below: 28 ancestors, 2^14 paths */
        let below = [r], all = [r];
        for (let lv = 1; lv <= 14; lv++) { const row = [];
          for (const side of ['l', 'r']) row.push(await seal(d, s, { refs: await Promise.all(below.map((b) => edge(b))) }, { hdr: { profile: 'PB-LINEAGE-1', bundle_id: `ladder-${lv}${side}-${d}` } }));
          below = row; all = all.concat(row); }
        const top = await seal(d, s, { refs: await Promise.all(below.map((b) => edge(b))) }, l);
        add(d, s, 'VERIFIED', 'ladder DAG: 29 distinct ancestors over 2^15 paths, max_containers 29, max_depth 15', top, { budgets: { max_containers: 29, max_depth: 15 } }, all);
        add(d, s, 'RESOURCE_EXHAUSTED', 'ladder DAG with max_containers 28', top, { budgets: { max_containers: 28, max_depth: 15 } }, all);
      } }
    { const b = clone(base); b.meta.payload_sha256 = 'x'; delete b.payload; add(d, s, 'PAYLOAD_MISSING', 'meta commits to a payload digest, payload deleted', b); }
    { const b = await seal(d, s, { boundary: { all: [{ present: 'operator_id' }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'SIDE_INFORMATION_MISSING', 'boundary requires context operator_id, not supplied', b, { context: {} });
      add(d, s, 'VERIFIED', 'boundary requires context operator_id, supplied', b, { context: { operator_id: 'op-1' } }); }
    { const b = await seal(d, s, { boundary: { all: [{ equals: ['env', 'production'] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'POLICY_DENIED', 'boundary env=production, context env=test', b, { context: { env: 'test' } }); }
    { const b = await seal(d, s, { policy_requires: ['approval_ok'] });
      add(d, s, 'POLICY_INDETERMINATE', 'policy needs context approval_ok, not supplied', b, { context: {} }); }
    add(d, s, 'LIMIT_EXCEEDED', 'max_bundle_bytes 100', base, { limits: { max_bundle_bytes: 100 } });
    add(d, s, 'PROVIDER_UNAVAILABLE', `provider for ${s} marked unavailable`, base, { unavailable_providers: [s] });
    { const b = await seal(d, s, { requires_side_attestations: true });
      add(d, s, 'EXTERNAL_SERVICE_UNAVAILABLE', 'side-information store unreachable', b, { side_store_unreachable: true }); }
    { const b = await seal(d, s, { claim_type: 'prediction', falsification_condition: 'observed value deviates from predicted value by more than 5%' }, { hdr: { profile: 'PB-PREDICTION-1' } });
      add(d, s, 'NULL', 'prediction with no observation supplied yet', b, { context: {} });
      add(d, s, 'NEGATIVE', 'prediction falsified by the supplied observation', b, { context: { observation: { falsified: true } } });
      add(d, s, 'VERIFIED', 'prediction not falsified by the supplied observation', b, { context: { observation: { falsified: false } } }); }
    { const b = clone(base); b.hdr.profile = 'PB-UNDEFINED-9'; add(d, s, 'NOT_DEFINED', 'profile PB-UNDEFINED-9', b); }
    /* boundary atom structure and three-valued connectives */
    { const b = await seal(d, s, { boundary: { all: [{ equals: ['env'] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'MALFORMED', 'boundary atom equals with one operand (arity 2)', b, { context: { env: 'production' } }); }
    { const b = await seal(d, s, { boundary: { all: [{ teleport: ['env', 1] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'NOT_DEFINED', 'boundary atom "teleport" is not defined', b, { context: { env: 'production' } }); }
    { const b = await seal(d, s, { boundary: { all: [{ present: 'operator_id' }, { equals: ['env', 'production'] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'POLICY_DENIED', 'all(present operator_id, env=production): operator_id absent, env=test — the false conjunct decides', b, { context: { env: 'test' } }); }
    { const b = await seal(d, s, { boundary: { any: [{ present: 'operator_id' }, { equals: ['env', 'production'] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'VERIFIED', 'any(present operator_id, env=production): operator_id absent, env=production — the true disjunct decides', b, { context: { env: 'production' } });
      add(d, s, 'SIDE_INFORMATION_MISSING', 'any(present operator_id, env=production): operator_id absent, env=test — undecided', b, { context: { env: 'test' } }); }
    /* the boundary atom table (SPEC.md "Boundary atoms"), clause by clause, once (on the first pair): each atom true,
       false, at both edges of every inclusive or strict bound, with an absent path, and with each shape refusal. The pair
       is the first one whose signature scheme has no migration dates, so a time-dependent atom is the only check that
       needs the verification time (an algorithm migration date would be reached first otherwise). */
    if (d === digests[0] && s === sigs.find((x) => !pb_registry.algorithm_states[x])) {
      const bcase = async (expected, what, boundary, context, opts) => {
        const b = await seal(d, s, { boundary }, { hdr: { profile: 'PB-BOUNDARY-1' } });
        add(d, s, expected, 'boundary atom table: ' + what, b, Object.assign({ context }, opts || {}));
      };
      const T = (iso) => iso, now = '2026-11-01T00:00:00Z';
      /* equals */
      await bcase('VERIFIED', 'equals, value equal', { equals: ['a', 'x'] }, { a: 'x' });
      await bcase('POLICY_DENIED', 'equals, value different', { equals: ['a', 'x'] }, { a: 'y' });
      await bcase('POLICY_DENIED', 'equals, path absent', { equals: ['a', 'x'] }, {});
      await bcase('VERIFIED', 'equals, objects equal as canonical JSON in another key order', { equals: ['o', { a: 2, b: 1 }] }, { o: { b: 1, a: 2 } });
      await bcase('POLICY_DENIED', 'equals, number 1 against string "1"', { equals: ['n', '1'] }, { n: 1 });
      await bcase('VERIFIED', 'equals, nested path', { equals: ['p.q', 3] }, { p: { q: 3 } });
      await bcase('MALFORMED', 'equals operand is not an array', { equals: 'a' }, { a: 'x' });
      await bcase('MALFORMED', 'equals operand empty', { equals: [] }, { a: 'x' });
      await bcase('MALFORMED', 'equals first operand is not a path string', { equals: [1, 'x'] }, { a: 'x' });
      await bcase('MALFORMED', 'equals with three operands', { equals: ['a', 'x', 'y'] }, { a: 'x' });
      /* present */
      await bcase('VERIFIED', 'present, value present', { present: 'a' }, { a: 'x' });
      await bcase('VERIFIED', 'present, value 0', { present: 'a' }, { a: 0 });
      await bcase('VERIFIED', 'present, value false', { present: 'a' }, { a: false });
      await bcase('SIDE_INFORMATION_MISSING', 'present, value null', { present: 'a' }, { a: null });
      await bcase('SIDE_INFORMATION_MISSING', 'present, value ""', { present: 'a' }, { a: '' });
      await bcase('SIDE_INFORMATION_MISSING', 'present, path absent', { present: 'a' }, {});
      /* in */
      await bcase('VERIFIED', 'in, value a member', { in: ['a', ['x', 'y']] }, { a: 'y' });
      await bcase('POLICY_DENIED', 'in, value not a member', { in: ['a', ['x', 'y']] }, { a: 'z' });
      await bcase('POLICY_DENIED', 'in, path absent', { in: ['a', ['x', 'y']] }, {});
      await bcase('MALFORMED', 'in, set is not an array', { in: ['a', 'x'] }, { a: 'x' });
      /* range: both ends included, numbers only */
      await bcase('VERIFIED', 'range, value at lo', { range: ['n', 1, 5] }, { n: 1 });
      await bcase('VERIFIED', 'range, value at hi', { range: ['n', 1, 5] }, { n: 5 });
      await bcase('POLICY_DENIED', 'range, value just below lo', { range: ['n', 1, 5] }, { n: 0.999 });
      await bcase('POLICY_DENIED', 'range, value just above hi', { range: ['n', 1, 5] }, { n: 5.001 });
      await bcase('POLICY_DENIED', 'range, value a numeric string', { range: ['n', 1, 5] }, { n: '3' });
      await bcase('POLICY_DENIED', 'range, path absent', { range: ['n', 1, 5] }, {});
      await bcase('MALFORMED', 'range, lo above hi', { range: ['n', 5, 1] }, { n: 3 });
      await bcase('MALFORMED', 'range, a bound is a string', { range: ['n', '1', 5] }, { n: 3 });
      await bcase('MALFORMED', 'range with two operands', { range: ['n', 1] }, { n: 3 });
      /* before / after: strict */
      await bcase('VERIFIED', 'before, one second earlier', { before: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-05-31T23:59:59Z' });
      await bcase('POLICY_DENIED', 'before, equal time', { before: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-06-01T00:00:00Z' });
      await bcase('POLICY_DENIED', 'after, equal time', { after: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-06-01T00:00:00Z' });
      await bcase('VERIFIED', 'after, one second later', { after: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-06-01T00:00:01Z' });
      await bcase('POLICY_DENIED', 'after, earlier', { after: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-05-01T00:00:00Z' });
      await bcase('POLICY_DENIED', 'before, context time does not parse', { before: ['t', '2026-06-01T00:00:00Z'] }, { t: 'soon' });
      await bcase('MALFORMED', 'before, bound is not a timestamp', { before: ['t', 'soon'] }, { t: '2026-05-31T23:59:59Z' });
      /* within: both ends included */
      await bcase('VERIFIED', 'within, at the start', { within: ['t', '2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z'] }, { t: '2026-01-01T00:00:00Z' });
      await bcase('VERIFIED', 'within, at the end', { within: ['t', '2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z'] }, { t: '2026-12-31T00:00:00Z' });
      await bcase('POLICY_DENIED', 'within, one second before the start', { within: ['t', '2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z'] }, { t: '2025-12-31T23:59:59Z' });
      await bcase('POLICY_DENIED', 'within, one second after the end', { within: ['t', '2026-01-01T00:00:00Z', '2026-12-31T00:00:00Z'] }, { t: '2026-12-31T00:00:01Z' });
      await bcase('MALFORMED', 'within, a bound is not a timestamp', { within: ['t', '2026-01-01T00:00:00Z', 'later'] }, { t: '2026-06-01T00:00:00Z' });
      /* within_days: either side of now, ends included */
      await bcase('VERIFIED', 'within_days 30, exactly 30 days before now', { within_days: ['t', 30] }, { t: '2026-10-02T00:00:00Z' });
      await bcase('POLICY_DENIED', 'within_days 30, one second more than 30 days before now', { within_days: ['t', 30] }, { t: '2026-10-01T23:59:59Z' });
      await bcase('VERIFIED', 'within_days 30, exactly 30 days after now', { within_days: ['t', 30] }, { t: '2026-12-01T00:00:00Z' });
      await bcase('POLICY_DENIED', 'within_days 30, path absent', { within_days: ['t', 30] }, {});
      await bcase('MALFORMED', 'within_days, days is a string', { within_days: ['t', '30'] }, { t: now });
      /* expired / not_expired: at or before now / strictly after now */
      await bcase('VERIFIED', 'expired, time equal to now', { expired: 'x' }, { x: now });
      await bcase('POLICY_DENIED', 'expired, one second after now', { expired: 'x' }, { x: '2026-11-01T00:00:01Z' });
      await bcase('POLICY_DENIED', 'not_expired, time equal to now', { not_expired: 'x' }, { x: now });
      await bcase('VERIFIED', 'not_expired, one second after now', { not_expired: 'x' }, { x: '2026-11-01T00:00:01Z' });
      await bcase('POLICY_DENIED', 'expired, path absent', { expired: 'x' }, {});
      await bcase('POLICY_DENIED', 'not_expired, path absent', { not_expired: 'x' }, {});
      await bcase('MALFORMED', 'expired, value is not a timestamp', { expired: 'x' }, { x: 'never' });
      /* within_last (≤) / age_lt (<) */
      await bcase('VERIFIED', 'within_last 7d, exactly 7 days old', { within_last: ['t', '7d'] }, { t: '2026-10-25T00:00:00Z' });
      await bcase('POLICY_DENIED', 'within_last 7d, one second older', { within_last: ['t', '7d'] }, { t: '2026-10-24T23:59:59Z' });
      await bcase('POLICY_DENIED', 'age_lt 7d, exactly 7 days old', { age_lt: ['t', '7d'] }, { t: '2026-10-25T00:00:00Z' });
      await bcase('VERIFIED', 'age_lt 7d, one second younger', { age_lt: ['t', '7d'] }, { t: '2026-10-25T00:00:01Z' });
      await bcase('VERIFIED', 'within_last 2h with the context supplying _now', { within_last: ['t', '2h'] }, { t: '2026-06-01T10:00:00Z', _now: '2026-06-01T11:00:00Z' });
      await bcase('POLICY_DENIED', 'within_last 7d, path absent', { within_last: ['t', '7d'] }, {});
      await bcase('MALFORMED', 'within_last, duration "7 days"', { within_last: ['t', '7 days'] }, { t: now });
      await bcase('MALFORMED', 'age_lt, duration "7y" (no year unit)', { age_lt: ['t', '7y'] }, { t: now });
      /* connectives */
      await bcase('VERIFIED', 'all of nothing', { all: [] }, {});
      await bcase('POLICY_DENIED', 'any of nothing', { any: [] }, {});
      await bcase('VERIFIED', 'a top-level array is all', [{ equals: ['a', 'x'] }, { present: 'b' }], { a: 'x', b: 1 });
      await bcase('POLICY_DENIED', 'a top-level array is all: one false', [{ equals: ['a', 'x'] }, { present: 'b' }], { a: 'y', b: 1 });
      await bcase('SIDE_INFORMATION_MISSING', 'all(true, missing) is undecided', { all: [{ equals: ['a', 'x'] }, { present: 'b' }] }, { a: 'x' });
      await bcase('MALFORMED', 'all(false, malformed): the structural fault decides first', { all: [{ equals: ['a', 'x'] }, { range: ['n', 5, 1] }] }, { a: 'y', n: 3 });
      await bcase('VERIFIED', 'nested: any(all(false, true), all(true, true))', { any: [{ all: [{ equals: ['a', 'y'] }, { present: 'a' }] }, { all: [{ equals: ['a', 'x'] }, { present: 'a' }] }] }, { a: 'x' });
      await bcase('MALFORMED', 'all operand is not an array', { all: { equals: ['a', 'x'] } }, { a: 'x' });
      await bcase('MALFORMED', 'an atom with two operators', { equals: ['a', 'x'], present: 'a' }, { a: 'x' });
      await bcase('MALFORMED', 'an atom that is not an object', { all: [5] }, {});
      await bcase('NOT_DEFINED', 'atom "teleport" in a nested connective', { any: [{ all: [{ teleport: ['a', 1] }] }] }, {});
      await bcase('INDETERMINATE', 'a time atom when a supplied time is required and none is given', { before: ['t', '2026-06-01T00:00:00Z'] }, { t: '2026-05-01T00:00:00Z' }, { now: undefined, require_supplied_time: true });
      /* 2.x form */
      await bcase('VERIFIED', '2.x equals', { op: 'equals', path: 'a', value: 'x' }, { a: 'x' });
      await bcase('POLICY_DENIED', '2.x equals, different', { op: 'equals', path: 'a', value: 'x' }, { a: 'y' });
      await bcase('VERIFIED', '2.x present', { op: 'present', path: 'a' }, { a: 1 });
      await bcase('SIDE_INFORMATION_MISSING', '2.x present, absent', { op: 'present', path: 'a' }, {});
      await bcase('VERIFIED', '2.x in', { op: 'in', path: 'a', set: ['x', 'y'] }, { a: 'x' });
      await bcase('POLICY_DENIED', '2.x in, not a member', { op: 'in', path: 'a', set: ['x', 'y'] }, { a: 'z' });
      await bcase('VERIFIED', '2.x range at hi', { op: 'range', path: 'n', lo: 1, hi: 5 }, { n: 5 });
      await bcase('POLICY_DENIED', '2.x range, numeric string', { op: 'range', path: 'n', lo: 1, hi: 5 }, { n: '3' });
      await bcase('VERIFIED', '2.x after "now"', { op: 'after', path: 't', value: 'now' }, { t: '2026-11-01T00:00:01Z' });
      await bcase('POLICY_DENIED', '2.x before "now", equal time', { op: 'before', path: 't', value: 'now' }, { t: now });
      await bcase('VERIFIED', '2.x within_days 1, one day after now', { op: 'within_days', path: 't', days: 1 }, { t: '2026-11-02T00:00:00Z' });
      await bcase('NOT_DEFINED', '2.x "within" (no 2.x form)', { op: 'within', path: 't', value: now }, { t: now });
      await bcase('NOT_DEFINED', '2.x unknown operator', { op: 'teleport', path: 't' }, { t: now });
      await bcase('MALFORMED', '2.x range without hi', { op: 'range', path: 'n', lo: 1 }, { n: 1 });
      await bcase('MALFORMED', '2.x range, lo above hi', { op: 'range', path: 'n', lo: 5, hi: 1 }, { n: 3 });
      await bcase('MALFORMED', '2.x in, set not an array', { op: 'in', path: 'a', set: 'x' }, { a: 'x' });
      await bcase('MALFORMED', '2.x after, value not a timestamp or "now"', { op: 'after', path: 't', value: 'later' }, { t: now });
      await bcase('MALFORMED', '2.x within_days, days a string', { op: 'within_days', path: 't', days: '1' }, { t: now });
      await bcase('MALFORMED', '2.x equals with an extra key', { op: 'equals', path: 'a', value: 'x', note: 'unchecked' }, { a: 'x' });
      await bcase('MALFORMED', '2.x path empty', { op: 'present', path: '' }, { a: 1 });
    }
    /* every defined profile has a passing case, and each profile's own rule has a failing one */
    { const b = await seal(d, s, { boundary: { all: [{ equals: ['env', 'production'] }] } }, { hdr: { profile: 'PB-BOUNDARY-1' } });
      add(d, s, 'VERIFIED', 'PB-BOUNDARY-1, boundary holds', b, { context: { env: 'production' } }); }
    for (const prof of ['PB-AI-MODEL-1', 'PB-ARTIFACT-1', 'PB-ARCHIVE-1', 'PB-VERIFY-REPORT-1']) {
      const b = await seal(d, s, {}, { hdr: { profile: prof } }); add(d, s, 'VERIFIED', `${prof}, sealed by the client`, b); }
    { const hitl = { role: 'reviewer', party: 'pb-conformance', decision: 'approved', decided_at: '2026-10-31T12:00:00Z' };
      const ok = await seal(d, s, { hitl }, { hdr: { profile: 'PB-REGULATED-1' } });
      add(d, s, 'VERIFIED', 'PB-REGULATED-1 with a human approval (meta.hitl)', ok);
      const no = await seal(d, s, {}, { hdr: { profile: 'PB-REGULATED-1' } });
      add(d, s, 'POLICY_DENIED', 'PB-REGULATED-1 without any human approval', no);
      const exp = await seal(d, s, { hitl, approvals: [{ by: 'reviewer', expires_at: '2026-10-20T00:00:00Z' }] }, { hdr: { profile: 'PB-REGULATED-1' } });
      add(d, s, 'POLICY_DENIED', 'PB-REGULATED-1 approval expired 2026-10-20', exp);
      if (classical) add(d, s, 'DEPRECATED_ALGORITHM', `PB-REGULATED-1 verified in 2032: the profile refuses deprecated ${s}`, ok, { now: '2032-06-01T00:00:00Z' }); }
    { const anch = await seal(d, s, { time_anchor: { kind: 'opentimestamps' } }, { hdr: { profile: 'PB-INTEGRITY-TEMPORAL-1' } });
      add(d, s, 'VERIFIED', 'PB-INTEGRITY-TEMPORAL-1 with a valid trusted time anchor', anch, { timestamp_check: { status: 'valid', time: '2026-10-31T00:00:00Z' } });
      add(d, s, 'TIMESTAMP_INDETERMINATE', 'PB-INTEGRITY-TEMPORAL-1, anchor declared, no anchor check supplied', anch);
      const none = await seal(d, s, {}, { hdr: { profile: 'PB-INTEGRITY-TEMPORAL-1' } });
      add(d, s, 'EVIDENCE_INCOMPLETE', 'PB-INTEGRITY-TEMPORAL-1 declares no time anchor', none, { timestamp_check: { status: 'valid', time: '2026-10-31T00:00:00Z' } }); }
    /* key-beside envelope (1.0.0): no merkleRoot, no key in the seal; the key is supplied beside it */
    { const kb = { hdr: { bundle_id: `kb-${d}-${s}`, profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0' },
        meta: { producer_id: 'pb-conformance-1.0.0', created_at: '2026-11-01T00:00:00Z', canonical_encoding: 'PB-CANON-JSON-1', digest_alg: d, sig_alg: s },
        payload: b64u_encode(utf8(`key-beside ${d} ${s}`)), refs: [] };
      const dg = await digest_bytes(d, canonical_json(kb));
      kb.seal = { digest_alg: d, digest_b64u: b64u_encode(dg), sig_alg: s, signature_b64u: b64u_encode(await sig_sign(s, dg, keys[s].priv)) };
      add(d, s, 'VERIFIED', 'key-beside envelope, producer key supplied', kb, { pub_override: keys[s].pub });
      add(d, s, 'SIDE_INFORMATION_MISSING', 'key-beside envelope, no key supplied', kb);
      add(d, s, 'INVALID_SIGNATURE', 'key-beside envelope, a different key supplied', kb, { pub_override: others[s].pub });
      const t = clone(kb); t.payload = b64u_encode(utf8('changed')); add(d, s, 'DIGEST_MISMATCH', 'key-beside envelope, payload changed after sealing', t, { pub_override: keys[s].pub }); }
    /* pre-release native bundle (spec_ver 2.1.0, written by builds before 1.0.0): read for continuity, with a warning */
    { const pr = clone(base); delete pr.seal; delete pr.merkleRoot; pr.hdr.spec_ver = '2.1.0';
      pr.merkleRoot = b64u_encode(await merkle_root_alg([canonical_json(pr.hdr), canonical_json(pr.meta), canonical_json(pr.payload || {})], d));
      const dg = await digest_bytes(d, canonical_json(pr));
      const sg = pb_registry.rsa_pss_hash[s] ? pb_core['crypto/rsa-pss.mjs'].rsa_pss_sign(b64u_decode(keys[s].priv), dg, native_random) : await sig_sign(s, dg, keys[s].priv);
      pr.seal = { digest_alg: d, digest_b64u: b64u_encode(dg), sig_alg: s, pub_b64u: keys[s].pub, signature_b64u: b64u_encode(sg) };
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'pre-release spec_ver 2.1.0 native bundle (RSA-PSS, if any, with SHA-256 as those builds wrote it)', pr); }
  }
  /* legacy 1.1.0 envelope (Ed25519 over merkleRoot|canonical, SHA-256 Merkle); independent of the pair matrix */
  if (sigs.includes('Ed25519')) {
    const lk = keys['Ed25519'];
    const leg = { hdr: { bundle_id: 'legacy-1.1.0', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.1.0' }, meta: { created_at: '2026-11-01T00:00:00Z' }, payload: { note: 'legacy envelope' } };
    leg.merkleRoot = b64u_encode(await merkle_root_alg([canonical_json(leg.hdr), canonical_json(leg.meta), canonical_json(leg.payload)], 'SHA-256'));
    const lsig = await sig_sign('Ed25519', utf8(leg.merkleRoot + '|' + canonical_json(leg)), lk.priv);
    leg.sig = { alg: 'ED25519', pub: lk.pub, sig: b64u_encode(lsig) };
    add('SHA-256', 'Ed25519', 'VERIFIED_WITH_WARNINGS', 'legacy 1.1.0 envelope, unchanged', leg);
    const lt = clone(leg); lt.payload = { note: 'changed' }; add('SHA-256', 'Ed25519', 'INVALID_SIGNATURE', 'legacy 1.1.0 envelope, payload changed after signing', lt);
    const ln = clone(leg); ln.hdr.spec_ver = '2.1.0'; add('SHA-256', 'Ed25519', 'UNSUPPORTED_VERSION', 'legacy envelope claiming spec 2.1.0', ln);
    add('SHA-256', 'Ed25519', 'UNEXPECTED_SIGNER', 'legacy 1.1.0 envelope, another expected signer supplied', leg, { expected_signer: others['Ed25519'].pub });
    const lx = clone(leg); lx.sig.time_anchor = 'unsigned'; add('SHA-256', 'Ed25519', 'MALFORMED', 'legacy sig with a field outside its schema', lx);
  }
  /* nesting beyond the verifier's limit, as an object and as text: a refusal with a limit, never an internal error */
  if (sigs.length && digests.length) {
    const d = digests[0], s = sigs[0]; let deep = {}; for (let i = 0; i < 600; i++) deep = { n: deep };
    const b = await seal(d, s); b.payload = deep;
    add(d, s, 'LIMIT_EXCEEDED', 'payload nested 600 deep, supplied as an object', b);
    add(d, s, 'LIMIT_EXCEEDED', 'payload nested 600 deep, supplied as JSON text', JSON.stringify(b));
  }
  /* structure, limits at their exact edges, and every non-canonical base64url spelling the verifier must refuse
     (from the mechanical mutation run of 2026-11-02: none of these had a case) */
  if (sigs.length && digests.length) {
    const d = digests[0], s = sigs[0];
    const b0 = await seal(d, s);
    const txt = canonical_json(b0);
    add(d, s, 'MALFORMED', 'structure: text that is not JSON', txt.slice(0, 40));
    add(d, s, 'MALFORMED', 'structure: JSON text that is an array', '[1,2]');
    add(d, s, 'MALFORMED', 'structure: JSON text that is a string', '"bundle"');
    { const b = clone(b0); delete b.hdr; add(d, s, 'MALFORMED', 'structure: hdr absent', b); }
    { const b = clone(b0); b.hdr = 'PB'; add(d, s, 'MALFORMED', 'structure: hdr is a string', b); }
    { const b = clone(b0); delete b.hdr.bundle_id; add(d, s, 'MALFORMED', 'structure: hdr.bundle_id absent', b); }
    { const b = clone(b0); delete b.hdr.spec_ver; add(d, s, 'MALFORMED', 'structure: hdr.spec_ver absent', b); }
    { const b = clone(b0); delete b.meta; add(d, s, 'MALFORMED', 'structure: meta absent', b); }
    { const b = clone(b0); b.hdr.spec_id = 'OTHER'; add(d, s, 'MALFORMED', 'structure: hdr.spec_id is not PROOFBUNDLE', b); }
    { const b = clone(b0); delete b.hdr.spec_id; add(d, s, 'MALFORMED', 'structure: hdr.spec_id absent on a sealed (non-legacy) bundle', b); }
    { const b = clone(b0); delete b.seal; add(d, s, 'MISSING_SIGNATURE', 'structure: no seal and no sig', b); }
    { const b = clone(b0); b.seal = 'sealed'; add(d, s, 'MALFORMED', 'structure: seal is a string', b); }
    { const b = clone(b0); delete b.seal.digest_alg; add(d, s, 'MALFORMED', 'structure: seal.digest_alg absent', b); }
    { const b = clone(b0); delete b.seal.pub_b64u; add(d, s, 'MALFORMED', 'structure: a native seal without its key', b); }
    { const b = clone(b0); b.seal.digest_b64u += '='; add(d, s, 'MALFORMED', 'structure: seal.digest_b64u with padding (not the base64url alphabet)', b); }
    { const b = clone(b0); b.meta.digest_alg = digests.find((x) => x !== d) || 'SHA-512'; add(d, s, 'MALFORMED', 'structure: meta and seal name different digest algorithms', b); }
    { const b = clone(b0); b.seal._engine = 7; add(d, s, 'MALFORMED', 'structure: seal._engine is not a string', b); }
    { const b = clone(b0); b.seal.signature_b64u = ''; add(d, s, 'MISSING_SIGNATURE', 'structure: seal.signature_b64u empty', b); }
    { const b = clone(b0); b.seal.signature_b64u = 12345; add(d, s, 'MISSING_SIGNATURE', 'structure: seal.signature_b64u a number', b); }
    { const b = clone(b0); b.seal.digest_alg = ''; add(d, s, 'MALFORMED', 'structure: seal.digest_alg empty', b); }
    { const b = clone(b0); b.seal.pub_b64u = 12345; add(d, s, 'MALFORMED', 'structure: seal.pub_b64u a number', b); }
    { const b = clone(b0); b.seal.pub_b64u += '='; add(d, s, 'MALFORMED', 'structure: seal.pub_b64u with padding (not the base64url alphabet)', b); }
    { const b = clone(b0); b.seal.signature_b64u = '+' + b.seal.signature_b64u.slice(1); add(d, s, 'MALFORMED', 'structure: seal.signature_b64u with a "+" (not the base64url alphabet)', b); }
    { const b = clone(b0); b.payload = null; add(d, s, 'PAYLOAD_MISSING', 'structure: native payload null', b); }
    { const b = clone(b0); b.meta.sig_alg = sigs.find((x) => x !== s) || 'Ed448'; add(d, s, 'MALFORMED', 'structure: meta and seal name different signature algorithms', b); }
    /* Unicode NFC: a string or a key that is not NFC has another byte form that reads the same */
    { const b = clone(b0); b.payload.label = 'café'; add(d, s, 'NONCANONICAL', 'canonical: a payload string not in NFC (e + combining acute)', b); }
    { const b = clone(b0); b.payload['clé'] = 'x'; add(d, s, 'NONCANONICAL', 'canonical: a payload key not in NFC', b); }
    { const b = await seal(d, s, {}, { payload: { label: 'café' } }); add(d, s, 'VERIFIED', 'canonical: a payload string already in NFC (precomposed é)', b); }
    { const b = clone(b0); b.meta.canonical_encoding = 'XML-C14N'; add(d, s, 'NOT_DEFINED', 'gating: canonical_encoding XML-C14N is not defined', b); }
    { const b = await seal(d, s, { encryption: { kem: 'ML-KEM-768' } }); add(d, s, 'VERIFIED', 'gating: meta.encryption names ML-KEM-768 (registered key encapsulation)', b); }
    { const b = await seal(d, s, { encryption: { kem: 'RSA-OAEP-9' } }); add(d, s, 'UNKNOWN_ALGORITHM', 'gating: meta.encryption names an unregistered key encapsulation', b); }
    { const b = await seal(d, s, { payload_sha256: 'committed' }); add(d, s, 'VERIFIED', 'structure: meta.payload_sha256 with the payload present', b); }
    { const b = await seal(d, s, { witness_binding: { sig_alg: 'Ed25519' } }); add(d, s, 'MALFORMED', 'crypto: meta.witness_binding without a key', b); }
    /* the signer: a supplied key overrides the key the bundle carries; a trust set anchors on its own; validity windows at their edges */
    add(d, s, 'INVALID_SIGNATURE', 'signer: native bundle verified under a supplied key that did not seal it', b0, { pub_override: others[s].pub });
    add(d, s, 'VERIFIED', 'signer: native bundle verified under its own key, supplied', b0, { pub_override: keys[s].pub });
    add(d, s, 'VERIFIED', 'signer: the trust set holds the sealing key (no expected signer)', b0, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k' }] } });
    add(d, s, 'VERIFIED_WITH_WARNINGS', 'signer: the key is not in a trust set that does not require it (unanchored)', b0, { trust: { keys: [{ pub_b64u: others[s].pub, key_id: 'o' }], require_known: false } });
    add(d, s, 'VERIFIED', 'signer: key validity ends exactly at the verification time (still valid)', b0, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', not_after: now }] } });
    add(d, s, 'VERIFIED', 'signer: key validity starts exactly at the verification time (already valid)', b0, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', not_before: now }] } });
    add(d, s, 'EXPIRED_KEY', 'signer: key validity ended one second before the verification time', b0, { trust: { keys: [{ pub_b64u: keys[s].pub, key_id: 'k', not_after: '2026-10-31T23:59:59Z' }] } });
    { const kbb = { hdr: { bundle_id: 'kb-structure', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0' }, meta: { created_at: now, digest_alg: d, sig_alg: s }, refs: [] };
      const dg = await digest_bytes(d, canonical_json(kbb));
      kbb.seal = { digest_alg: d, digest_b64u: b64u_encode(dg), sig_alg: s, signature_b64u: b64u_encode(await sig_sign(s, dg, keys[s].priv)) };
      add(d, s, 'PAYLOAD_MISSING', 'structure: key-beside envelope without a payload', kbb, { pub_override: keys[s].pub });
      const kr = clone(kbb); kr.payload = 'eA'; kr.refs = 'none'; add(d, s, 'MALFORMED', 'structure: key-beside refs not an array', kr, { pub_override: keys[s].pub }); }
    /* every stage clause after the signature, at its edges (from the same mutation run) */
    const later = '2026-11-01T00:00:01Z', earlier = '2026-10-31T23:59:59Z';
    { const b = clone(b0); b.seal._engine = 'pure-js-fallback'; add(d, s, 'VERIFIED_WITH_WARNINGS', 'seal: the engine note without _engine_note', b); }
    { const b = clone(b0); b.seal._engine_note = 'conformance'; add(d, s, 'VERIFIED_WITH_WARNINGS', 'seal: _engine_note without _engine', b); }
    add(d, s, 'INSUFFICIENT_SIGNATURES', 'signatures: two required, the primary alone present', b0, { required_signatures: 2 });
    add(d, s, 'VERIFIED', 'signatures: one required, stated explicitly', b0, { required_signatures: 1 });
    { const wb = await seal(d, s, { witness_binding: { sig_alg: 'Ed25519', pub_b64u: wit.pub } });
      wb.seal.witness = { sig_alg: 'Ed25519', pub_b64u: wit.pub, signature_b64u: b64u_encode(await sig_sign('Ed25519', b64u_decode(wb.seal.digest_b64u), wit.priv)) };
      add(d, s, 'VERIFIED', 'signatures: two required, primary and bound witness both valid', wb, { required_signatures: 2 });
      add(d, s, 'INSUFFICIENT_SIGNATURES', 'signatures: three required, two present', wb, { required_signatures: 3 }); }
    { const b = await seal(d, s, { issuer_certificate: { issuer: 'conformance-ca', serial: '02' } });
      add(d, s, 'VERIFIED', 'certificate: declared and checked valid', b, { certificate_check: { status: 'valid' } });
      add(d, s, 'MALFORMED', 'certificate: a check status that is not defined', b, { certificate_check: { status: 'probably' } }); }
    { const b = await seal(d, s, { time_anchor: { kind: 'opentimestamps' } });
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'timestamp: declared, not required, no check supplied', b);
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'timestamp: declared, not required, check pending', b, { timestamp_check: { status: 'pending' } });
      add(d, s, 'VERIFIED', 'timestamp: declared and checked valid', b, { timestamp_check: { status: 'valid', time: '2026-10-01T00:00:00Z' } });
      add(d, s, 'MALFORMED', 'timestamp: a check status that is not defined', b, { timestamp_check: { status: 'probably' } });
      add(d, s, 'TIMESTAMP_INDETERMINATE', 'timestamp: required by the caller, declared, no check supplied', b, { require_timestamp: true }); }
    add(d, s, 'EVIDENCE_INCOMPLETE', 'timestamp: required by the caller, none declared', b0, { require_timestamp: true });
    { const b = await seal(d, s, {}, { hdr: { profile: 'PB-INTEGRITY-TEMPORAL-1' } }); add(d, s, 'EVIDENCE_INCOMPLETE', 'timestamp: PB-INTEGRITY-TEMPORAL-1 with no time anchor declared', b); }
    { const b = await seal(d, s, { time_anchor: { kind: 'opentimestamps' } }, { hdr: { profile: 'PB-INTEGRITY-TEMPORAL-1' } });
      add(d, s, 'TIMESTAMP_INDETERMINATE', 'timestamp: PB-INTEGRITY-TEMPORAL-1, anchor declared, no check supplied', b);
      add(d, s, 'VERIFIED', 'timestamp: PB-INTEGRITY-TEMPORAL-1, anchor checked valid', b, { timestamp_check: { status: 'valid', time: '2026-10-01T00:00:00Z' } }); }
    for (const [k, v, expected, what] of [['expiration', 'soon', 'MALFORMED', 'meta.expiration not a timestamp'], ['expiration', now, 'BUNDLE_EXPIRED', 'meta.expiration exactly the verification time'],
        ['expiration', later, 'VERIFIED', 'meta.expiration one second after the verification time'], ['expires_at', now, 'BUNDLE_EXPIRED', 'meta.expires_at exactly the verification time'],
        ['not_before', 'soon', 'MALFORMED', 'meta.not_before not a timestamp'], ['not_before', now, 'VERIFIED', 'meta.not_before exactly the verification time'],
        ['not_before', later, 'BUNDLE_NOT_YET_VALID', 'meta.not_before one second after the verification time']]) {
      const b = await seal(d, s, { [k]: v }); add(d, s, expected, 'validity: ' + what, b); }
    { const att = { role: 'reviewer', party: 'pb-conformance', statement: 'reviewed', signature_b64u: 'AAAA' };
      add(d, s, 'SIDE_INFORMATION_MISSING', 'auxiliary: side attestations required, none carried', await seal(d, s, { requires_side_attestations: true }));
      add(d, s, 'SIDE_INFORMATION_MISSING', 'auxiliary: side attestations required, an empty list', await seal(d, s, { requires_side_attestations: true, side_attestations: [] }));
      add(d, s, 'EVIDENCE_INCOMPLETE', 'auxiliary: a side attestation without its signature', await seal(d, s, { requires_side_attestations: true, side_attestations: [{ role: 'reviewer', party: 'p', statement: 's' }] }));
      add(d, s, 'VERIFIED', 'auxiliary: side attestations required and complete', await seal(d, s, { requires_side_attestations: true, side_attestations: [att] }));
      add(d, s, 'VERIFIED', 'auxiliary: side attestations carried, not required', await seal(d, s, { side_attestations: [{ role: 'r' }] })); }
    { const item = 'auxiliary item one', ad = b64u_encode(await digest_bytes(d, utf8(item)));
      const b = await seal(d, s, { aux: [{ id: 'a1', digest_alg: d, digest_b64u: ad }] });
      add(d, s, 'VERIFIED', 'auxiliary: aux item supplied and matching its digest', b, { aux_store: { a1: item } });
      add(d, s, 'SIDE_INFORMATION_MISSING', 'auxiliary: aux item not supplied', b, { aux_store: {} });
      add(d, s, 'SIDE_INFORMATION_MISSING', 'auxiliary: aux item supplied with other bytes', b, { aux_store: { a1: item + '.' } });
      add(d, s, 'EXTERNAL_SERVICE_UNAVAILABLE', 'auxiliary: aux store unreachable', b, { side_store_unreachable: true }); }
    /* lineage clauses */
    { const lp = { hdr: { profile: 'PB-LINEAGE-1' } };
      const par = await seal(d, s, {}, { hdr: { profile: 'PB-INTEGRITY-1', bundle_id: 'lin-parent' } });
      const kid = await seal(d, s, { refs: ['lin-parent'] }, lp);
      add(d, s, 'VERIFIED', 'lineage: a parent referenced by id alone, its integrity verified', kid, {}, [par]);
      add(d, s, 'VERIFIED', 'lineage: the parent supplied in the bundle store (opts.bundles)', kid, { bundles: { 'lin-parent': par } });
      const bad = clone(par); bad.payload = { label: 'changed' };
      add(d, s, 'LINEAGE_INVALID', 'lineage: a parent referenced by id whose own integrity fails', kid, {}, [bad]);
      add(d, s, 'MALFORMED', 'lineage: a reference with no parent_id', await seal(d, s, { refs: [{ parent_digest: 'x' }] }, lp), {}, [par]);
      add(d, s, 'RESOURCE_EXHAUSTED', 'lineage: one parent, opts.max_depth 0', kid, { max_depth: 0 }, [par]);
      add(d, s, 'RESOURCE_EXHAUSTED', 'lineage: ancestor bytes over max_bytes', kid, { budgets: { max_bytes: 10 } }, [par]);
      add(d, s, 'VERIFIED', 'lineage: ancestor bytes exactly max_bytes', kid, { budgets: { max_bytes: utf8(canonical_json(par)).length } }, [par]);
      const kbp = { hdr: { bundle_id: 'lin-kb-parent', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0' }, meta: { created_at: now, digest_alg: d, sig_alg: s }, payload: 'eA', refs: [] };
      const kdg = await digest_bytes(d, canonical_json(kbp));
      kbp.seal = { digest_alg: d, digest_b64u: b64u_encode(kdg), sig_alg: s, signature_b64u: b64u_encode(await sig_sign(s, kdg, keys[s].priv)) };
      const { seal: _ks, ...kbw } = kbp; const kpd = b64u_encode(await digest_bytes(d, canonical_json(kbw)));
      const kid_bound = await seal(d, s, { refs: [{ parent_id: 'lin-kb-parent', parent_digest: kpd, digest_alg: d }] }, lp);
      const kid_unbound = await seal(d, s, { refs: ['lin-kb-parent'] }, lp);
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'lineage: key-beside parent, no key, bound by the child\'s digest commitment', kid_bound, {}, [kbp]);
      add(d, s, 'VERIFIED', 'lineage: key-beside parent with its key supplied', kid_bound, { parent_keys: { 'lin-kb-parent': keys[s].pub } }, [kbp]);
      add(d, s, 'LINEAGE_INVALID', 'lineage: key-beside parent, no key, referenced by id alone (nothing binds it)', kid_unbound, {}, [kbp]);
      const dd = digests.find((x) => x !== 'SHA-256') || d, kpd2 = b64u_encode(await digest_bytes(dd, canonical_json(kbw)));
      const alias = await seal(d, s, { refs: [{ parent_id: 'lin-kb-parent', parent_digest: kpd2, parent_digest_alg: dd }] }, lp);
      add(d, s, 'VERIFIED', 'lineage: a reference object with parent_id and no digest (bound by id, parent verified)', await seal(d, s, { refs: [{ parent_id: 'lin-parent' }] }, lp), {}, [par]);
      add(d, s, 'VERIFIED', 'lineage: parent_digest_alg naming a digest other than the default SHA-256', alias, { parent_keys: { 'lin-kb-parent': keys[s].pub } }, [kbp]); }
    /* policy clauses */
    { const ap = (x) => seal(d, s, { hitl: { role: 'reviewer', party: 'p', decision: 'approved', decided_at: '2026-10-31T12:00:00Z' }, approvals: [{ by: 'p', expires_at: x }] }, { hdr: { profile: 'PB-REGULATED-1' } });
      add(d, s, 'POLICY_DENIED', 'policy: a regulated approval expiring exactly at the verification time', await ap(now));
      add(d, s, 'VERIFIED', 'policy: a regulated approval expiring one second after', await ap(later));
      add(d, s, 'VERIFIED', 'policy: PB-REGULATED-1 approved by side attestations without meta.hitl', await seal(d, s, { side_attestations: [{ role: 'r' }] }, { hdr: { profile: 'PB-REGULATED-1' } })); }
    { const b = await seal(d, s, { policy_requires: ['approval_ok'] });
      add(d, s, 'POLICY_DENIED', 'policy: a required context value false', b, { context: { approval_ok: false } });
      add(d, s, 'VERIFIED', 'policy: a required context value true', b, { context: { approval_ok: true } });
      add(d, s, 'VERIFIED', 'policy: a required context value present and not false (0)', b, { context: { approval_ok: 0 } }); }
    { const pb = await seal(d, s, { claim_type: 'prediction' }, { hdr: { profile: 'PB-PREDICTION-1' } });
      add(d, s, 'EVIDENCE_INCOMPLETE', 'prediction: no falsification condition', pb, { context: {} });
      const pc = await seal(d, s, { claim_type: 'prediction', falsification_condition: 'deviates by more than 5%' });
      add(d, s, 'NULL', 'prediction: claim_type on a PB-INTEGRITY-1 bundle, no observation yet', pc, { context: {} });
      add(d, s, 'MALFORMED', 'prediction: an observation whose "falsified" is not a boolean', pc, { context: { observation: { falsified: 'yes' } } }); }
    /* nesting at the limit (500) passes; one deeper is refused, as an object and as text */
    for (const [depth, expected] of [[500, 'VERIFIED'], [501, 'LIMIT_EXCEEDED']]) {
      let deep = {}; for (let i = 0; i < depth - 2; i++) deep = { n: deep };   /* the bundle is depth 1, its payload depth 2 */
      const b = await seal(d, s, {}, { payload: deep });
      add(d, s, expected, `nesting: payload reaching depth ${depth}, as an object`, b);
      add(d, s, expected, `nesting: payload reaching depth ${depth}, as canonical JSON text`, canonical_json(b));
    }
    add(d, s, 'VERIFIED', 'limits: max_nesting 2 on a bundle of depth 2', b0, { limits: { max_nesting: 2 } });
    add(d, s, 'LIMIT_EXCEEDED', 'limits: max_nesting 1 on a bundle of depth 2', b0, { limits: { max_nesting: 1 } });
    { const n = utf8(txt).length;
      add(d, s, 'VERIFIED', 'limits: max_bundle_bytes equal to the canonical size, object input', b0, { limits: { max_bundle_bytes: n } });
      add(d, s, 'LIMIT_EXCEEDED', 'limits: max_bundle_bytes one below the canonical size, object input', b0, { limits: { max_bundle_bytes: n - 1 } });
      add(d, s, 'VERIFIED', 'limits: max_bundle_bytes equal to the text size, text input', txt, { limits: { max_bundle_bytes: n } });
      add(d, s, 'LIMIT_EXCEEDED', 'limits: max_bundle_bytes one below the text size, text input', txt, { limits: { max_bundle_bytes: n - 1 } }); }
    /* base64url spellings: every value read outside the parse-stage alphabet check has one admitted spelling */
    const spellings = (x) => {
      const out = [];
      if (x.length % 4) out.push(['padded with "="', x + '='.repeat(4 - (x.length % 4))]);
      if (/[-_]/.test(x)) out.push(['in the standard alphabet ("+" "/")', x.replace(/-/g, '+').replace(/_/g, '/')]);
      out.push(['with a character outside base64url ("$")', '$' + x.slice(1)]);
      if ((x.length + 1) % 4 === 1) out.push(['one character longer (a length no base64url text has)', x + 'A']);
      return out;
    };
    for (const [how, v] of spellings(b0.merkleRoot)) { const b = clone(b0); b.merkleRoot = v; add(d, s, 'NONCANONICAL', `base64url: merkleRoot ${how}`, b); }
    const w = { sig_alg: 'Ed25519', pub_b64u: wit.pub, signature_b64u: b64u_encode(await sig_sign('Ed25519', b64u_decode(b0.seal.digest_b64u), wit.priv)) };
    { const b = clone(b0); b.seal.witness = { sig_alg: w.sig_alg, pub_b64u: w.pub_b64u }; add(d, s, 'MALFORMED', 'witness: without its signature', b); }
    { const b = clone(b0); b.seal.witness = 'witnessed'; add(d, s, 'MALFORMED', 'witness: a string, not an object', b); }
    { const b = clone(b0); b.seal.witness = Object.assign({}, w, { pub_b64u: b64u_encode(new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00, ...b64u_decode(w.pub_b64u)])) });
      add(d, s, 'VERIFIED_WITH_WARNINGS', 'witness: unbound Ed25519 witness whose key is in SubjectPublicKeyInfo form (same key)', b); }
    for (const f of ['pub_b64u', 'signature_b64u']) for (const [how, v] of spellings(w[f])) {
      const b = clone(b0); b.seal.witness = Object.assign({}, w, { [f]: v }); add(d, s, 'NONCANONICAL', `base64url: seal.witness.${f} ${how}`, b); }
  }
  /* migration dates at their first instant (NIST IR 8547 states apply from the date given), on the first classical scheme */
  { const s = sigs.find((x) => pb_registry.algorithm_states[x]), d = digests[0];
    if (s) { const st = pb_registry.algorithm_states[s]; const b = await seal(d, s);
      add(d, s, 'DEPRECATED_ALGORITHM', `migration: verified at the first instant ${s} is disallowed (${st.disallowed_from})`, b, { now: st.disallowed_from });
      add(d, s, 'VERIFIED_WITH_WARNINGS', `migration: verified one second before ${s} is disallowed`, b, { now: new Date(Date.parse(st.disallowed_from) - 1000).toISOString().replace('.000Z', 'Z') });
      add(d, s, 'DEPRECATED_ALGORITHM', `migration: deprecated algorithms refused, verified at the first instant ${s} is deprecated (${st.deprecated_from})`, b, { now: st.deprecated_from, reject_deprecated: true });
      add(d, s, 'VERIFIED', `migration: deprecated algorithms refused, verified one second before ${s} is deprecated`, b, { now: new Date(Date.parse(st.deprecated_from) - 1000).toISOString().replace('.000Z', 'Z'), reject_deprecated: true });
      const ta = await seal(d, s, { time_anchor: { kind: 'opentimestamps' } });
      add(d, s, 'FORBIDDEN_ALGORITHM', `migration: ${d} broken from 2026-10-01, trusted time anchor at exactly that instant (not before it)`, ta, { broken_algorithms: { [d]: '2026-10-01T00:00:00Z' }, timestamp_check: { status: 'valid', time: '2026-10-01T00:00:00Z' } });
      add(d, s, 'VERIFIED_WITH_WARNINGS', `migration: ${d} broken from 2026-10-01, trusted time anchor one second before`, ta, { broken_algorithms: { [d]: '2026-10-01T00:00:00Z' }, timestamp_check: { status: 'valid', time: '2026-09-30T23:59:59Z' } });
      add(d, s, 'FORBIDDEN_ALGORITHM', `migration: ${d} broken from exactly the verification time`, b, { broken_algorithms: { [d]: now } }); } }
  if (sigs.includes('Ed25519')) {
    /* an Ed25519 key in SubjectPublicKeyInfo form is the same key */
    const d = digests[0]; const b = await seal(d, 'Ed25519'); const spki = b64u_encode(new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00, ...b64u_decode(b.seal.pub_b64u)]));
    const w = clone(b); w.seal.pub_b64u = spki; add(d, 'Ed25519', 'VERIFIED', 'signer: Ed25519 seal key in SubjectPublicKeyInfo form (same key)', w);
    add(d, 'Ed25519', 'VERIFIED', 'signer: Ed25519 expected signer given in SubjectPublicKeyInfo form', b, { expected_signer: spki }); }
  if (sigs.includes('Ed25519')) {
    const lk = keys['Ed25519'];
    const leg = { hdr: { bundle_id: 'legacy-1.1.0-b64u', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.1.0' }, meta: { created_at: '2026-11-01T00:00:00Z' }, payload: { note: 'legacy envelope' } };
    leg.merkleRoot = b64u_encode(await merkle_root_alg([canonical_json(leg.hdr), canonical_json(leg.meta), canonical_json(leg.payload)], 'SHA-256'));
    leg.sig = { alg: 'ED25519', pub: lk.pub, sig: b64u_encode(await sig_sign('Ed25519', utf8(leg.merkleRoot + '|' + canonical_json(leg)), lk.priv)) };
    const sp = (x) => [['padded with "="', x.length % 4 ? x + '='.repeat(4 - (x.length % 4)) : null], ['in the standard alphabet', /[-_]/.test(x) ? x.replace(/-/g, '+').replace(/_/g, '/') : null], ['with "$"', '$' + x.slice(1)]];
    for (const f of ['sig', 'pub']) for (const [how, v] of sp(leg.sig[f])) if (v) { const b = clone(leg); b.sig[f] = v; add('SHA-256', 'Ed25519', 'NONCANONICAL', `base64url: legacy sig.${f} ${how}`, b); }
    { const b = clone(leg); b.sig = 'signed'; add('SHA-256', 'Ed25519', 'MALFORMED', 'structure: legacy sig is a string', b); }
  }
  return { cases, keys: Object.fromEntries(sigs.map((s) => [s, keys[s].pub])), now: now,
    not_constructed: { INTERNAL_ERROR: 'reached only when the verifier itself throws; no input is built to cause that' },
    pairs: digests.length * sigs.length, digests, sigs };
}

/* Run the definition: each case through verify_bundle; returns per-case actual verdicts. */
async function pb_run_conformance(def) {
  const out = [];
  for (const c0 of def.cases) {
    const c = JSON.parse(JSON.stringify(c0));   /* every object in this realm: the canonicalizer admits only its own realm's objects */
    const o = Object.assign({}, c.opts);
    if (typeof o.now === 'string') o.now = Date.parse(o.now); else delete o.now;
    if (c.parents && c.parents.length) o.parent_bundles = c.parents;
    const r = await verify_bundle(c.bundle, o);
    out.push({ id: c.id, expected: c.expected_verdict, actual: r.code, stage: r.stage, cause: (r.causes[0] || {}).message || '' });
  }
  return out;
}
