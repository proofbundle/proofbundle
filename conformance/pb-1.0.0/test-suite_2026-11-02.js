/* ══════════════════════════════════════════════════════════════════
   TEST SUITE — the 1.0.0 conformance definition
   The definition is generated from the registry: every dispatched digest × every dispatched
   signature scheme, one constructed case per verdict each pair can reach, plus every defined
   profile, every envelope form and the boundary connectives. Each expected verdict is fixed by how
   the case was built, never read back from the verifier. The exact bytes are embedded below
   (gzip, base64) with their SHA-256, so the same file can be run here, by the Node runner, or by
   any other implementation. "Generate fresh" rebuilds a definition in this browser with new keys.
   ══════════════════════════════════════════════════════════════════ */

let pb_conformance = null;          /* parsed embedded definition */
let pb_conformance_fresh = null;    /* last definition generated in this browser */

async function pb_conformance_bytes() {
  const el = document.getElementById('pb-conformance-definition');
  if (!el) throw new Error('no conformance definition is embedded in this build');
  const gz = b64u_decode(el.textContent.trim());
  if (typeof DecompressionStream === 'undefined') throw new Error('this browser has no DecompressionStream; use "Generate fresh" instead');
  const buf = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return new Uint8Array(buf);
}

async function pb_conformance_load() {
  if (pb_conformance) return pb_conformance;
  const bytes = await pb_conformance_bytes();
  const sha = hex_of(await digest_bytes('SHA-256', bytes));
  if (sha !== pb_conformance_sha256) throw new Error(`embedded definition SHA-256 ${sha} ≠ recorded ${pb_conformance_sha256}`);
  const def = parse_native_json(new TextDecoder().decode(bytes));
  def.__sha256 = sha; def.__bytes = bytes.length;
  pb_conformance = def;
  return def;
}

function pb_conformance_tally(def) {
  const by_verdict = {}, by_pair = {};
  for (const c of def.cases) {
    by_verdict[c.expected_verdict] = (by_verdict[c.expected_verdict] || 0) + 1;
    const k = c.digest_alg + '|' + c.sig_alg; by_pair[k] = (by_pair[k] || 0) + 1;
  }
  return { by_verdict, by_pair };
}

async function pb_render_test_suite() {
  const sum = document.getElementById('vec-summary');
  if (!sum) return;
  let def;
  try { def = await pb_conformance_load(); }
  catch (e) { sum.innerHTML = err_box('Conformance definition: ' + e.message); return; }
  const t = pb_conformance_tally(def);
  const chip = (k, v, extra) => `<span class="vec-chip${extra || ''}">${esc(k)} <b>${v}</b></span>`;
  const missing = pb_verdicts.filter((v) => !t.by_verdict[v]);
  sum.innerHTML =
    `<div class="vec-chips">${chip('CASES', def.cases.length, ' vec-chip-hero')}${chip('PAIRS', def.pairs)}${chip('VERDICTS COVERED', (pb_verdicts.length - missing.length) + '/' + pb_verdicts.length)}</div>` +
    `<div class="vec-chips" style="margin-top:6px">` + pb_verdicts.filter((v) => t.by_verdict[v]).map((v) => `<span class="vec-chip"><span class="badge ${pb_verdict_badge(v)}" style="font-size:10px">${v}</span> <b>${t.by_verdict[v]}</b></span>`).join('') + `</div>` +
    (missing.length ? `<div class="algo-note" style="margin-top:6px">Not constructed: ${missing.map((v) => esc(v) + ' — ' + esc((def.not_constructed || {})[v] || '')).join('; ')}</div>` : '') +
    `<div class="vec-anchor">definition SHA-256 <span class="mono">${pb_conformance_sha256}</span> · ${def.__bytes.toLocaleString()} bytes · verification time fixed at ${esc(def.now)}<br>` +
    `digests: ${def.digests.map(esc).join(', ')}<br>signatures: ${def.sigs.map(esc).join(', ')}<br>` +
    `registered and not executable here (each reaches UNSUPPORTED_ALGORITHM): ${pb_registry.recognized_unimplemented.map(esc).join(', ')}</div>`;
  const mat = document.getElementById('vec-matrix');
  if (mat) mat.innerHTML = `<table class="mini-table"><thead><tr><th>digest \\ signature</th>${def.sigs.map((s) => `<th>${esc(s)}</th>`).join('')}</tr></thead><tbody>` +
    def.digests.map((d) => `<tr><td><b>${esc(d)}</b></td>${def.sigs.map((s) => `<td>${t.by_pair[d + '|' + s] || 0}</td>`).join('')}</tr>`).join('') + `</tbody></table>`;
  const sel = document.getElementById('vec-run-scope');
  if (sel && !sel.dataset.filled) {
    sel.dataset.filled = '1';
    const ed = def.cases.filter((c) => c.sig_alg === 'Ed25519').length;
    const one = def.cases.filter((c) => c.digest_alg === 'SHA-256' && c.sig_alg === 'Ed25519').length;
    sel.innerHTML = `<option value="pair">Quick — SHA-256 × Ed25519 (${one} cases)</option>` +
      `<option value="ed25519" selected>Every digest × Ed25519 (${ed} cases)</option>` +
      `<option value="all">Full definition (${def.cases.length} cases, every pair)</option>` +
      `<option value="fresh">Generate fresh in this browser, then run it (new keys, every pair)</option>`;
  }
  pb_filter_ledger();
}

function pb_filter_ledger() {
  const def = pb_conformance; if (!def) return;
  const q = (document.getElementById('vec-filter').value || '').toLowerCase();
  const hits = q ? def.cases.filter((c) => (c.id + ' ' + c.expected_verdict + ' ' + c.digest_alg + ' ' + c.sig_alg + ' ' + c.construction).toLowerCase().includes(q)) : def.cases;
  document.getElementById('vec-count').innerText = `${hits.length} match${hits.length === 1 ? '' : 'es'}${hits.length > 200 ? ' (first 200 shown)' : ''}`;
  document.getElementById('vec-table').innerHTML =
    `<table class="mini-table"><thead><tr><th>id</th><th>expected</th><th>digest</th><th>signature</th><th>construction</th></tr></thead><tbody>` +
    hits.slice(0, 200).map((c) => `<tr><td class="mono">${c.id}</td><td><span class="badge ${pb_verdict_badge(c.expected_verdict)}">${c.expected_verdict}</span></td>` +
      `<td>${esc(c.digest_alg)}</td><td>${esc(c.sig_alg)}</td><td>${esc(c.construction)}</td></tr>`).join('') + `</tbody></table>`;
}

/* Run a definition's cases, in this realm, through verify_bundle. */
async function pb_conformance_execute(cases, on_progress) {
  const out = [];
  for (let i = 0; i < cases.length; i++) {
    const c = JSON.parse(JSON.stringify(cases[i]));
    const o = Object.assign({}, c.opts);
    if (typeof o.now === 'string') o.now = Date.parse(o.now); else delete o.now;
    if (c.parents && c.parents.length) o.parent_bundles = c.parents;
    const r = await verify_bundle(c.bundle, o);
    out.push({ id: c.id, digest_alg: c.digest_alg, sig_alg: c.sig_alg, expected: c.expected_verdict, actual: r.code, stage: r.stage, cause: (r.causes[0] || {}).message || '', construction: c.construction });
    if (on_progress && i % 40 === 0) { on_progress(i, cases.length); await new Promise((r2) => setTimeout(r2, 0)); }
  }
  return out;
}

function pb_conformance_report_html(rows, label, ms) {
  const fail = rows.filter((r) => r.expected !== r.actual);
  const digs = [...new Set(rows.map((r) => r.digest_alg))], sgs = [...new Set(rows.map((r) => r.sig_alg))];
  const cell = (d, s) => { const rs = rows.filter((r) => r.digest_alg === d && r.sig_alg === s); return rs.length ? `${rs.filter((r) => r.expected === r.actual).length}/${rs.length}` : '—'; };
  const covered = new Set(rows.filter((r) => r.expected === r.actual).map((r) => r.actual));
  let html = `<div class="vec-run-tally ${fail.length ? 'bad' : 'good'}"><b>${rows.length - fail.length}</b> pass · <b>${fail.length}</b> fail · ${rows.length} cases · ${covered.size} distinct verdicts reached as constructed · ${ms}ms — ${esc(label)}, run by the verifier in <i>this</i> browser</div>`;
  html += `<table class="mini-table"><thead><tr><th>digest \\ signature</th>${sgs.map((s) => `<th>${esc(s)}</th>`).join('')}</tr></thead><tbody>` +
    digs.map((d) => `<tr><td><b>${esc(d)}</b></td>${sgs.map((s) => { const v = cell(d, s), [a, b] = v.split('/'); return `<td class="${a === b ? 'cell-good' : 'cell-bad'}">${v}</td>`; }).join('')}</tr>`).join('') + `</tbody></table>`;
  if (fail.length) html += `<div class="vec-failures"><b>Failures</b><br>` + fail.slice(0, 40).map((f) => `${esc(f.id)} · ${esc(f.digest_alg)} × ${esc(f.sig_alg)} · ${esc(f.construction)} — expected ${esc(f.expected)}, got ${esc(f.actual)} (${esc(f.stage)}: ${esc(f.cause)})`).join('<br>') + `</div>`;
  return html;
}

async function pb_run_test_suite() {
  const scope = document.getElementById('vec-run-scope').value;
  const out = document.getElementById('vec-run-result');
  const btn = document.getElementById('vec-run-btn');
  btn.disabled = true; out.style.display = 'block';
  const t0 = performance.now();
  try {
    let cases, label;
    if (scope === 'fresh') {
      out.innerHTML = '<div class="vec-running">Generating a fresh definition in this browser…</div>';
      pb_conformance_fresh = await pb_generate_conformance((m) => { out.innerHTML = `<div class="vec-running">Generating — ${esc(m)}</div>`; });
      cases = pb_conformance_fresh.cases; label = 'freshly generated definition';
      const dl = document.getElementById('vec-fresh-dl'); if (dl) dl.style.display = '';
    } else {
      const def = await pb_conformance_load();
      cases = scope === 'pair' ? def.cases.filter((c) => c.digest_alg === 'SHA-256' && c.sig_alg === 'Ed25519')
        : scope === 'ed25519' ? def.cases.filter((c) => c.sig_alg === 'Ed25519') : def.cases;
      label = 'embedded definition ' + pb_conformance_sha256.slice(0, 12) + '…';
    }
    const rows = await pb_conformance_execute(cases, (i, n) => { out.innerHTML = `<div class="vec-running">Verifying ${i}/${n}…</div>`; });
    out.innerHTML = pb_conformance_report_html(rows, label, Math.round(performance.now() - t0));
    window.pb_last_conformance_run = { scope, label, rows, observed_at: new Date().toISOString() };
  } catch (e) { out.innerHTML = err_box('Test suite: ' + e.message); }
  finally { btn.disabled = false; }
}

async function pb_download_definition(which) {
  if (which === 'fresh') {
    if (!pb_conformance_fresh) return;
    dl_text('proofbundle-conformance-1.0.0-fresh-' + new Date().toISOString().replace(/[:.]/g, '') + '.json', JSON.stringify(pb_conformance_fresh));
    return;
  }
  const bytes = await pb_conformance_bytes();
  const blob = new Blob([bytes], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'proofbundle-conformance-1.0.0-' + pb_conformance_sha256.slice(0, 12) + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* Older vector sets name their outcomes in the pre-1.0.0 vocabulary. Each old name maps to the
   1.0.0 verdicts it can correspond to; a case passes when the verdict lies in that set. The set is
   reported as an external set, never as the definition. */
const pb_old_outcome_map = {
  'VERIFIED': ['VERIFIED', 'VERIFIED_WITH_WARNINGS'],
  'MALFORMED': ['MALFORMED', 'NONCANONICAL', 'PAYLOAD_MISSING', 'MISSING_SIGNATURE'],
  'INVALID-SIGNATURE': ['DIGEST_MISMATCH', 'INVALID_SIGNATURE', 'MISSING_SIGNATURE', 'INSUFFICIENT_SIGNATURES', 'UNEXPECTED_SIGNER'],
  'OUT-OF-BOUNDS': ['POLICY_DENIED', 'BUNDLE_EXPIRED', 'BUNDLE_NOT_YET_VALID'],
  'UNKNOWN-VERSION': ['UNKNOWN_VERSION', 'UNSUPPORTED_VERSION'],
  'NOT-DEFINED-IN-THIS-VERSION': ['NOT_DEFINED', 'UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'FORBIDDEN_ALGORITHM'],
  'MISSING-SIDE-INFO': ['SIDE_INFORMATION_MISSING', 'EVIDENCE_INCOMPLETE', 'LINEAGE_MISSING'],
  'LINEAGE-INVALID': ['LINEAGE_INVALID', 'LINEAGE_CYCLE', 'LINEAGE_MISSING'],
  'RESOURCE-EXHAUSTED': ['RESOURCE_EXHAUSTED', 'LIMIT_EXCEEDED'],
  'POLICY-DENIED': ['POLICY_DENIED', 'EVIDENCE_INCOMPLETE'],
  'INDETERMINATE': ['INDETERMINATE', 'EVIDENCE_INCOMPLETE', 'POLICY_INDETERMINATE', 'SIDE_INFORMATION_MISSING', 'MALFORMED'],
  'EXPIRED': ['BUNDLE_EXPIRED'],
};

async function pb_import_vectors_run() {
  const out = document.getElementById('vec-import-result');
  out.style.display = 'block';
  let doc;
  try { doc = parse_native_json(document.getElementById('vec-import-json').value); }
  catch (e) { out.innerHTML = err_box('Import parse error: ' + e.message); return; }
  const t0 = performance.now();
  /* a 1.0.0 conformance definition */
  if (doc && !Array.isArray(doc) && Array.isArray(doc.cases)) {
    const bad = doc.cases.find((c) => !pb_verdict_set.has(c.expected_verdict));
    if (bad) { out.innerHTML = err_box(`case ${bad.id}: "${bad.expected_verdict}" is not a 1.0.0 verdict`); return; }
    const rows = await pb_conformance_execute(doc.cases, (i, n) => { out.innerHTML = `<div class="vec-running">Verifying ${i}/${n}…</div>`; });
    out.innerHTML = pb_conformance_report_html(rows, 'imported definition', Math.round(performance.now() - t0));
    return;
  }
  if (doc && !Array.isArray(doc) && Array.isArray(doc.vectors)) doc = doc.vectors;
  if (!Array.isArray(doc)) { out.innerHTML = err_box('expected a conformance definition ({cases:[…]}), a JSON array of vectors, or {vectors:[…]}'); return; }
  let pass = 0, fail = 0, skipped = 0;
  const failures = [], seen = {};
  for (let i = 0; i < doc.length; i++) {
    const v = doc[i];
    const keyed = !!v && v.input && typeof v.input === 'object' && 'bundle' in v.input;
    if (!v || (!keyed && v.bundle === undefined)) { skipped++; continue; }
    const raw = String(v.expected_verdict || v.expected_outcome || v.expected || '');
    const exact = pb_verdict_set.has(raw);
    const allowed = exact ? [raw] : (pb_old_outcome_map[raw.toUpperCase().replace(/_/g, '-')] || null);
    if (!allowed) { skipped++; if (failures.length < 40) failures.push(`${v.id || '#' + i}: expected outcome "${raw}" has no 1.0.0 mapping`); continue; }
    let opts;
    if (keyed) {
      const x = v.input;
      opts = { context: x.context || {}, parent_bundles: x.parent_bundles || [], pub_override: x.public_key_b64u || undefined, max_depth: Number.isFinite(x.max_depth) ? x.max_depth : 8 };
      if (Number.isFinite(x.max_bundle_bytes)) opts.limits = { max_bundle_bytes: x.max_bundle_bytes };
      if (x.context && typeof x.context._now === 'string') opts.now = Date.parse(x.context._now);
    } else {
      opts = { context: v.context || {}, parent_bundles: Object.values(v.provided_bundles || {}), bundles: v.bundles || {}, pub_override: v.public_key_b64u || v.pub_key || undefined, max_depth: v.max_depth };
    }
    const r = await verify_bundle(keyed ? v.input.bundle : v.bundle, opts);
    seen[r.code] = (seen[r.code] || 0) + 1;
    if (allowed.includes(r.code)) pass++;
    else { fail++; if (failures.length < 40) failures.push(`${v.id || '#' + i}: expected ${raw}${exact ? '' : ' (→ ' + allowed.join(' | ') + ')'}, got ${r.code} — ${(r.causes[0] || {}).message || ''}`); }
    if (i % 50 === 0) { out.innerHTML = `<div class="vec-running">Verifying ${i}/${doc.length}…</div>`; await new Promise((r2) => setTimeout(r2, 0)); }
  }
  out.innerHTML = `<div class="vec-run-tally ${fail ? 'bad' : 'good'}"><b>${pass}</b> consistent · <b>${fail}</b> inconsistent · ${skipped} skipped of ${doc.length} — external vector set; outcomes in the pre-1.0.0 vocabulary are compared through the mapping above</div>` +
    `<div class="vec-chips">${Object.entries(seen).map(([k, n]) => `<span class="vec-chip"><span class="badge ${pb_verdict_badge(k)}" style="font-size:10px">${k}</span> <b>${n}</b></span>`).join('')}</div>` +
    (failures.length ? `<div class="vec-failures">${failures.map(esc).join('<br>')}</div>` : '');
}
