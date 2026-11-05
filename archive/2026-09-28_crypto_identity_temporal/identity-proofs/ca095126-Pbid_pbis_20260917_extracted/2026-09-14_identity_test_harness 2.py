#!/usr/bin/env python3
"""Headless Chromium harness for the 2026-09-14 ProofBundle identity patch.
Usage: python3 harness.py <url-of-original.html> <url-of-patched.html> <scratch-dir>
Runs: boot self-tests and the full live conformance matrix on both files; identity API
cases, a reload/keyring custody cycle, and the UI flow on the patched file."""
import asyncio, json, sys, pathlib
from playwright.async_api import async_playwright

ORIG, PATCHED, SCRATCH = sys.argv[1], sys.argv[2], pathlib.Path(sys.argv[3])
SCRATCH.mkdir(parents=True, exist_ok=True)
results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (('  | ' + detail) if detail else ''))

async def boot(ctx, url):
    page = await ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    page.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await page.goto(url)
    await page.wait_for_function('Array.isArray(window.PB_SELFTEST)', timeout=180000)
    return page, errs

MATRIX = """async () => {
  let pass = 0, fail = 0; const bad = [];
  for (const d of PB_DIGESTS) for (const s of PB_SIGS) {
    let cases;
    try { cases = await buildRunnerCases(d.id, s.id); }
    catch (e) { fail += 10; bad.push(d.id + ' x ' + s.id + ' seal: ' + e.message); continue; }
    for (const c of cases) {
      const { outcome } = await verifyCore(c.bundle, c.opts);
      if (outcome === c.expected) pass++; else { fail++; bad.push(d.id + ' x ' + s.id + ' ' + c.expected + ' -> ' + outcome); }
    }
  }
  return { pass, fail, bad: bad.slice(0, 20) };
}"""

async def regression(browser, url, label):
    ctx = await browser.new_context()
    page, errs = await boot(ctx, url)
    st = await page.evaluate('window.PB_SELFTEST')
    failed = [r['name'] for r in st if not r['ok']]
    mx = await page.evaluate(MATRIX)
    non_network = [e for e in errs if 'ERR_CONNECTION_REFUSED' not in e]
    await ctx.close()
    return {'label': label, 'selftest_pass': sum(r['ok'] for r in st), 'selftest_total': len(st),
            'selftest_failed': failed, 'matrix': mx, 'errors': non_network,
            'selftest_names': [r['name'] for r in st]}

API_CASES = r"""async () => {
  const out = {};
  const tryMsg = async (f) => { try { await f(); return null; } catch (e) { return e.message; } };
  const v = async (b, o) => (await verifyCore(b, o || {})).outcome;

  /* one key per name, reused, never replaced implicitly */
  const a1 = await establishIdentity('anthropic/claude-opus-5');
  const a2 = await establishIdentity('anthropic/claude-opus-5');
  out.create_then_reuse = a1.created === true && a2.created === false && a1.identity.key_sha256 === a2.identity.key_sha256;
  out.alg_change_refused = await tryMsg(() => establishIdentity('anthropic/claude-opus-5', 'ECDSA-P256'));
  const g1 = await establishIdentity('openai/gpt-5');
  const a3 = await establishIdentity('anthropic/claude-opus-5');
  out.two_names_two_keys_stable = g1.identity.key_sha256 !== a1.identity.key_sha256 && a3.identity.key_sha256 === a1.identity.key_sha256;

  /* concurrency: 5 parallel signAs on a new name → one key, chain intact */
  const par = await Promise.all([1,2,3,4,5].map(i => signAs('google/gemini-3', { i })));
  const shas = new Set(par.map(b => b.meta.signer.key_sha256));
  out.parallel_signAs_one_key = shas.size === 1;
  out.chain_intact_after_parallel = (await verifyChain(STATE.chain)).ok;

  /* registry built from live identities, pinned by operator key */
  await establishIdentity('operator/chaleb');
  const regB = await idBuildRegistry('operator/chaleb', ['anthropic/claude-opus-5', 'openai/gpt-5', 'google/gemini-3']);
  const reg = await idLoadRegistry(regB, [idGet('operator/chaleb').key_sha256]);
  const sb = await signAs('anthropic/claude-opus-5', { text: 'model output' });
  out.signAs_with_registry = await v(sb, { registry: reg });
  out.signAs_without_registry = await v(sb);
  out.signAs_trace_names_key = (await verifyCore(sb, { registry: reg })).trace.map(t => t.title + ': ' + t.body).filter(s => s.startsWith('Signer')).join(' || ');
  out.parallel_bundles_verify = (await Promise.all(par.map(b => v(b, { registry: reg })))).every(o => o === 'VERIFIED');

  /* all ten signature algorithms */
  const algs = {};
  for (const s of PB_SIGS) {
    const name = 'test/alg-' + s.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
    try {
      await establishIdentity(name, s.id);
      const opRec = idGet('operator/chaleb');
      const r = await idLoadRegistry(await idSealRegistry(opRec, await idKey('operator/chaleb'), [idGet(name)]), [opRec.key_sha256]);
      const b = await signAs(name, { alg: s.id });
      algs[s.id] = await v(JSON.parse(JSON.stringify(b)), { registry: r });
    } catch (e) { algs[s.id] = 'ERROR ' + e.message; }
  }
  out.all_algorithms = algs;

  /* pubOverride: the effective key is the one compared */
  const kA = await sigKeygen('Ed25519'), kB = await sigKeygen('Ed25519');
  const recB = await idMakeRecord('vendor/model-b', kB);
  const t = JSON.parse(JSON.stringify(await idSealAttest(recB, kA, { n: 1 })));
  t.seal.pub_b64u = kB.pub;                                   /* seal is outside the signed bytes */
  out.pubOverride_effective_key = await v(t, { pubOverride: kA.pub });
  out.proposal_check_would_pass = (await keyFingerprint(t.seal.pub_b64u)) === recB.fingerprint;

  /* legacy v1.1.0 envelope carrying meta.signer */
  const kL = await sigKeygen('Ed25519');
  const recL = await idMakeRecord('vendor/legacy', kL);
  const leg = { hdr: { bundle_id: makeId(), profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', spec_ver: '1.1.0' },
                meta: { created_at: new Date().toISOString(), signer: idSignerBlock(recL) }, payload: { note: 'legacy' } };
  leg.merkleRoot = b64uEncode(await merkleRootAlg([canonicalJSON(leg.hdr), canonicalJSON(leg.meta), canonicalJSON(leg.payload)], 'SHA-256'));
  const { sig: _n, ...fs } = leg;
  leg.sig = { alg: 'ED25519', pub: kL.pub, sig: b64uEncode(await ed25519Sign(utf8(leg.merkleRoot + '|' + canonicalJSON(fs)), b64uDecode(kL.priv))) };
  const opRec2 = idGet('operator/chaleb');
  const regL = await idLoadRegistry(await idSealRegistry(opRec2, await idKey('operator/chaleb'), [recL]), [opRec2.key_sha256]);
  out.legacy_with_registry = await v(leg, { registry: regL });
  out.legacy_without_registry = await v(leg);
  let propThrow = null; try { void leg.seal.pub_b64u; } catch (e) { propThrow = e.message; }
  out.proposal_legacy_property_access = propThrow;

  /* input guards */
  out.bad_name_uppercase = await tryMsg(() => establishIdentity('Anthropic/Claude'));
  out.prototype_key_name = (await establishIdentity('constructor')).created;
  out.undefined_in_payload = await tryMsg(() => signAs('anthropic/claude-opus-5', { a: undefined }));
  out.short_pin = await tryMsg(() => idLoadRegistry(regB, [idGet('operator/chaleb').fingerprint]));
  out.registry_tampered_entry = await tryMsg(async () => {
    const r2 = JSON.parse(JSON.stringify(regB)); r2.payload.entries[0].pub_b64u = kA.pub;
    await idLoadRegistry(r2, [idGet('operator/chaleb').key_sha256]); });
  const unl = await signAs('mistral/unlisted', { x: 1 });
  out.unlisted_name = await v(unl, { registry: reg });
  const bnd = JSON.parse(JSON.stringify(sb));
  out.boundary_not_masked = null;
  {
    const r = idGet('anthropic/claude-opus-5');
    const bb = { hdr: { profile: PB_ID_ATTEST_PROFILE }, meta: { signer: idSignerBlock(r), boundary: { all: [{ op: 'equals', path: 'env', value: 'production' }] } }, payload: {} };
    await sealCore(bb, 'SHA3-256', r.sig_alg, await idKey('anthropic/claude-opus-5'));
    out.boundary_not_masked = await v(bb, { context: { env: 'staging' } });
  }
  out.chain_intact_end = (await verifyChain(STATE.chain)).ok;
  out.fp_opus = idGet('anthropic/claude-opus-5').key_sha256;
  return out;
}"""

async def api_and_custody(browser, url):
    ctx = await browser.new_context(accept_downloads=True)
    page, errs = await boot(ctx, url)
    r = await page.evaluate(API_CASES)
    check('one key per name: created once, reused', r['create_then_reuse'])
    check('asking for a different key type is refused', r['alg_change_refused'] and 'not replaced implicitly' in r['alg_change_refused'], r['alg_change_refused'] or '')
    check('two names keep two stable keys (no single-slot overwrite)', r['two_names_two_keys_stable'])
    check('5 parallel signAs on a new name produce one key', r['parallel_signAs_one_key'])
    check('action chain intact after parallel signAs', r['chain_intact_after_parallel'])
    check('signAs + pinned registry → VERIFIED', r['signAs_with_registry'] == 'VERIFIED', r['signAs_with_registry'])
    check('signAs without registry → MISSING-SIDE-INFO', r['signAs_without_registry'] == 'MISSING-SIDE-INFO', r['signAs_without_registry'])
    check('parallel bundles verify against registry', r['parallel_bundles_verify'])
    for alg, o in r['all_algorithms'].items():
        check(f'algorithm {alg}: identity seal → JSON → VERIFIED', o == 'VERIFIED', o)
    check('pubOverride: declared key compared with the key that verified → INVALID-SIGNATURE',
          r['pubOverride_effective_key'] == 'INVALID-SIGNATURE', r['pubOverride_effective_key'])
    check('  (proposal check on seal.pub_b64u would have passed this bundle)', r['proposal_check_would_pass'])
    check('legacy v1.1.0 envelope with signer + registry → VERIFIED', r['legacy_with_registry'] == 'VERIFIED', r['legacy_with_registry'])
    check('legacy v1.1.0 envelope with signer, no registry → MISSING-SIDE-INFO', r['legacy_without_registry'] == 'MISSING-SIDE-INFO', r['legacy_without_registry'])
    check('  (proposal insertion reads bundle.seal.pub_b64u on legacy → throws)', r['proposal_legacy_property_access'] is not None, r['proposal_legacy_property_access'] or '')
    check('uppercase model name refused', r['bad_name_uppercase'] is not None, r['bad_name_uppercase'] or '')
    check('name "constructor" is a fresh identity (no prototype collision)', r['prototype_key_name'] is True)
    check('undefined inside payload refused before sealing', r['undefined_in_payload'] is not None and 'JSON' in r['undefined_in_payload'], r['undefined_in_payload'] or '')
    check('16-hex fingerprint refused as a pin', r['short_pin'] is not None and '64-character' in r['short_pin'], r['short_pin'] or '')
    check('registry with a swapped entry key refused', r['registry_tampered_entry'] is not None, r['registry_tampered_entry'] or '')
    check('name not in registry → POLICY-DENIED', r['unlisted_name'] == 'POLICY-DENIED', r['unlisted_name'])
    check('unchecked name does not mask OUT-OF-BOUNDS', r['boundary_not_masked'] == 'OUT-OF-BOUNDS', r['boundary_not_masked'])
    check('action chain intact at end of API cases', r['chain_intact_end'])

    # custody cycle: export keyring (real download), reload, refuse, import, same key
    await page.evaluate("switchTab('ledger', document.querySelector('.sb-nav button[data-title=\"History\"]') || document.querySelector('nav button'))")
    async with page.expect_download() as dl_info:
        await page.click('button[onclick="idExportKeyringUI()"]')
    kr = await (await dl_info.value).path()
    kr_name = (await dl_info.value).suggested_filename
    kr_path = SCRATCH / 'keyring.json'; kr_path.write_bytes(pathlib.Path(kr).read_bytes())
    check('keyring downloads with YYYY-MM-DD_ name', kr_name.endswith('_pb-identity-keyring.json') and kr_name[4] == '-' and kr_name[7] == '-', kr_name)
    await page.reload()
    await page.wait_for_function('Array.isArray(window.PB_SELFTEST)', timeout=180000)
    after = await page.evaluate("""async () => {
      const pub = idPublic('anthropic/claude-opus-5');
      let refused = null; try { await signAs('anthropic/claude-opus-5', { after: 'reload' }); } catch (e) { refused = e.message; }
      return { restored: !!pub, loaded: pub && pub.private_loaded, sha: pub && pub.key_sha256, refused,
               sha_after_refusal: idGet('anthropic/claude-opus-5').key_sha256 };
    }""")
    check('after reload: public record restored', after['restored'])
    check('after reload: private key not loaded', after['loaded'] is False)
    check('after reload: signAs refuses instead of making a new key', after['refused'] is not None and 'no private key loaded' in after['refused'], after['refused'] or '')
    check('after reload: key SHA-256 unchanged by the refusal', after['sha'] == r['fp_opus'] == after['sha_after_refusal'])
    await page.set_input_files('#id-keyring-file', str(kr_path))
    await page.wait_for_function("(document.getElementById('pb-toast')||{textContent:''}).textContent.startsWith('Keyring:')", timeout=120000)
    back = await page.evaluate("""async () => {
      const b = await signAs('anthropic/claude-opus-5', { after: 'import' });
      return { sha: b.meta.signer.key_sha256 };
    }""")
    check('after keyring import: signs with the original key', back['sha'] == r['fp_opus'])
    non_network = [e for e in errs if 'ERR_CONNECTION_REFUSED' not in e]
    check('no page errors in API/custody run', not non_network, '; '.join(non_network[:3]))
    await ctx.close()

async def ui_flow(browser, url):
    ctx = await browser.new_context(accept_downloads=True)
    page, errs = await boot(ctx, url)
    await page.evaluate("switchTab('ledger', document.querySelector('nav button'))")
    for name in ['anthropic/claude-opus-5', 'operator/chaleb']:
        await page.fill('#id-new-name', name)
        await page.select_option('#id-new-alg', 'Ed25519')
        await page.click('#id-create-btn')
        await page.wait_for_function(f"_idPriv.has({json.dumps(name)})", timeout=60000)
    rows = await page.eval_on_selector_all('#id-list tbody tr', 'els => els.length')
    check('UI: identity table lists 2 rows', rows == 2, str(rows))
    await page.select_option('#id-operator', 'operator/chaleb')
    async with page.expect_download() as dl_info:
        await page.click('button[onclick="idBuildRegistryUI()"]')
    reg_path = SCRATCH / 'registry.pb.json'
    reg_path.write_bytes(pathlib.Path(await (await dl_info.value).path()).read_bytes())
    reg_name = (await dl_info.value).suggested_filename
    check('UI: registry downloads with YYYY-MM-DD_ name', reg_name.endswith('_pb-model-registry.pb.json'), reg_name)
    op_sha = await page.evaluate("idGet('operator/chaleb').key_sha256")

    # seal through the Bundle editor as an identity
    await page.evaluate("switchTab('seal', document.querySelector('nav button'))")
    await page.select_option('#seal-identity', 'anthropic/claude-opus-5')
    await page.click('button[onclick="sealBundle()"]')
    await page.wait_for_function('window._lastSealed && window._lastSealed.meta && window._lastSealed.meta.signer', timeout=60000)
    sealed = await page.evaluate('window._lastSealed')
    check('UI: editor seal writes meta.signer for the chosen identity', sealed['meta']['signer']['model'] == 'anthropic/claude-opus-5')

    # meta.signer pasted without choosing an identity is refused
    await page.select_option('#seal-identity', '')
    await page.evaluate("""() => { const el = document.getElementById('seal-bundle-json');
      const j = JSON.parse(el.value); j.meta.signer = { model: 'anthropic/claude-opus-5' }; el.value = JSON.stringify(j); window._lastSealedBefore = window._lastSealed; }""")
    await page.click('button[onclick="sealBundle()"]')
    await page.wait_for_timeout(500)
    toast = await page.evaluate("(document.getElementById('pb-toast')||{}).textContent || ''")
    unchanged = await page.evaluate('window._lastSealed === window._lastSealedBefore')
    check('UI: pasted meta.signer without identity is refused', 'meta.signer is written by identity sealing' in toast and unchanged, toast)

    # load + pin registry, verify through the Verify tab
    await page.evaluate("switchTab('ledger', document.querySelector('nav button'))")
    await page.set_input_files('#id-registry-file', str(reg_path))
    await page.fill('#id-registry-pin', op_sha)
    await page.click('button[onclick="idLoadRegistryUI()"]')
    await page.wait_for_function('idActiveRegistry !== null', timeout=60000)
    async def verify_ui():
        await page.evaluate("switchTab('verify', document.querySelector('nav button'))")
        await page.evaluate("""(b) => { document.getElementById('verify-bundle-json').value = JSON.stringify(b);
          document.getElementById('verify-context').value = JSON.stringify({ env: 'production', consent_token: 'tok' }); }""", sealed)
        await page.evaluate('verifyBundle()')
        await page.wait_for_function("document.querySelector('#verify-result .badge')", timeout=60000)
        return await page.evaluate("""() => ({ badge: document.querySelector('#verify-result .badge').textContent,
          signer: [...document.querySelectorAll('#verify-result .trace-step-title')].map(e => e.textContent).filter(t => t.startsWith('Signer')) })""")
    got = await verify_ui()
    check('UI: Verify tab with pinned registry → VERIFIED', got['badge'] == 'VERIFIED', json.dumps(got))
    await page.evaluate("idClearRegistryUI()")
    got2 = await verify_ui()
    check('UI: Verify tab after "Stop using registry" → MISSING-SIDE-INFO', got2['badge'] == 'MISSING-SIDE-INFO', json.dumps(got2))

    # wrong pin
    await page.evaluate("switchTab('ledger', document.querySelector('nav button'))")
    await page.fill('#id-registry-pin', '0' * 64)
    await page.click('button[onclick="idLoadRegistryUI()"]')
    await page.wait_for_timeout(800)
    status = await page.evaluate("document.getElementById('id-registry-status').textContent")
    active = await page.evaluate('idActiveRegistry')
    check('UI: wrong pin leaves no registry in use', active is None and 'not pinned' in status, status)

    # remove an identity through the table button (confirm dialog accepted)
    await page.click('#id-list button[data-id-forget="anthropic/claude-opus-5"]')
    await page.wait_for_function("idGet('anthropic/claude-opus-5') === null", timeout=60000)
    check('UI: Remove deletes the identity', True)
    chain_ok = await page.evaluate('verifyChain(STATE.chain).then(r => r.ok)')
    check('UI: action chain intact after UI flow', chain_ok)
    non_network = [e for e in errs if 'ERR_CONNECTION_REFUSED' not in e]
    check('UI: no page errors', not non_network, '; '.join(non_network[:3]))
    await ctx.close()

async def existing_defects(browser, url):
    ctx = await browser.new_context()
    page, _ = await boot(ctx, url)
    d = await page.evaluate("""async () => {
      const key = await sigKeygen('Ed25519');
      const subj = await sealCore(runnerBaseBundle(), 'SHA3-256', 'Ed25519', key);
      const vr = await verifyCore(subj, { context: RUNNER_CTX_OK });
      const rep = await buildVerifyReport(subj, vr.outcome, vr.trace, 'SHA3-256', 'Ed25519', key, Date.now());
      const reportInMemory = (await verifyCore(rep, {})).outcome;
      const reportAfterJson = (await verifyCore(JSON.parse(JSON.stringify(rep)), {})).outcome;
      const h2b = h => { const u = new Uint8Array(h.length/2); for (let i=0;i<u.length;i++) u[i]=parseInt(h.substr(2*i,2),16); return u; };
      const sig = h2b('e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b');
      const pub = h2b('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
      const kat_selftest_order = await _ed.verify(new Uint8Array(0), sig, pub);
      const kat_engine_order = await _ed.verify(sig, new Uint8Array(0), pub);
      await Promise.all([chainAppend('race-a'), chainAppend('race-b'), chainAppend('race-c')]);
      const race = await verifyChain(STATE.chain);
      return { reportInMemory, reportAfterJson, kat_selftest_order, kat_engine_order, race };
    }""")
    await ctx.close()
    return d

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        base = await regression(browser, ORIG, 'original')
        pat = await regression(browser, PATCHED, 'patched')
        for rr in (base, pat):
            print(f"[{rr['label']}] self-tests {rr['selftest_pass']}/{rr['selftest_total']} failed={rr['selftest_failed']} "
                  f"matrix {rr['matrix']['pass']} pass / {rr['matrix']['fail']} fail errors={rr['errors']}")
        new_tests = [n for n in pat['selftest_names'] if n not in base['selftest_names']]
        check('patched: every original self-test still present', all(n in pat['selftest_names'] for n in base['selftest_names']))
        check('patched: failing self-tests are exactly the original ones', pat['selftest_failed'] == base['selftest_failed'], str(pat['selftest_failed']))
        check(f'patched: {len(new_tests)} new identity self-tests pass', all(n not in pat['selftest_failed'] for n in new_tests), '; '.join(new_tests))
        check('patched: live conformance matrix unchanged', pat['matrix'] == base['matrix'] and base['matrix']['fail'] == 0,
              f"{pat['matrix']['pass']}/{pat['matrix']['pass'] + pat['matrix']['fail']}")
        check('patched: no page errors at boot', not pat['errors'], '; '.join(pat['errors'][:3]))
        await api_and_custody(browser, PATCHED)
        await ui_flow(browser, PATCHED)
        d = await existing_defects(browser, PATCHED)
        print('EXISTING-DEFECT EVIDENCE (not changed by this patch):', json.dumps(d))
        await browser.close()
    summary = {'regression': {'original': {k: base[k] for k in ('selftest_pass', 'selftest_total', 'selftest_failed', 'matrix')},
                              'patched': {k: pat[k] for k in ('selftest_pass', 'selftest_total', 'selftest_failed', 'matrix')}},
               'checks': [{'name': n, 'pass': ok, 'detail': det} for n, ok, det in results],
               'existing_defects': d}
    (SCRATCH / 'results.json').write_text(json.dumps(summary, indent=2))
    fails = [n for n, ok, _ in results if not ok]
    print(f'\n{len(results) - len(fails)}/{len(results)} checks pass')
    if fails: print('FAILED:', fails)

asyncio.run(main())
