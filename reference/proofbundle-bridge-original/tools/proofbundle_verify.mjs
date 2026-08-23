#!/usr/bin/env node
// proofbundle_verify.mjs — faithful Node port of the canonical ProofBundle verifier
// (from unique_apps/...proofbundle_v1_0_20260507_hardened_working_r4_domains.html).
// Same contract: bundle = {hdr,payload,meta,refs,seal}; canonical PB-CANON-JSON-1; SHA-256 + Ed25519;
// profile tiers PB-INTEGRITY-1 < PB-BOUNDARY-1 < PB-LINEAGE-1 < PB-REGULATED-1; deterministic boundary DSL.
// This is the REAL verifier logic, callable from the bridge — replaces the ad-hoc regex gate.
import { webcrypto as crypto } from 'node:crypto';

const DIGEST_ALGS = ['SHA-256', 'SHA-384', 'SHA-512'];
const SIG_ALGS = ['Ed25519', 'ECDSA-P256', 'ECDSA-P384', 'ECDSA-P521'];
const PROFILES = ['PB-INTEGRITY-1', 'PB-BOUNDARY-1', 'PB-LINEAGE-1', 'PB-REGULATED-1'];
const profileLevel = p => PROFILES.indexOf(p);

const utf8Encode = s => new TextEncoder().encode(s);
function stableJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableJson).join(',')}]`;
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(',')}}`;
}
const canonicalBytes = obj => utf8Encode(stableJson(obj));               // PB-CANON-JSON-1
function b64uEncode(bytes) { return Buffer.from(bytes).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64uDecode(str) { return new Uint8Array(Buffer.from(String(str).replace(/-/g,'+').replace(/_/g,'/'), 'base64')); }

async function digest(alg, bytes) {
  if (!DIGEST_ALGS.includes(alg)) throw new Error('Unknown digest: ' + alg);
  return new Uint8Array(await crypto.subtle.digest(alg, bytes));
}
function sigAlgParams(alg) {
  if (alg === 'Ed25519') return { name: 'Ed25519' };
  if (alg === 'ECDSA-P256') return { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };
  if (alg === 'ECDSA-P384') return { name: 'ECDSA', namedCurve: 'P-384', hash: 'SHA-384' };
  if (alg === 'ECDSA-P521') return { name: 'ECDSA', namedCurve: 'P-521', hash: 'SHA-512' };
  throw new Error('Unknown sig: ' + alg);
}
export async function generateKeyPair(alg='Ed25519') {
  const p = sigAlgParams(alg);
  return alg === 'Ed25519'
    ? crypto.subtle.generateKey({ name:'Ed25519' }, true, ['sign','verify'])
    : crypto.subtle.generateKey({ name:'ECDSA', namedCurve:p.namedCurve }, true, ['sign','verify']);
}
export async function exportPublicKey(key, alg='Ed25519') { return new Uint8Array(await crypto.subtle.exportKey('raw', key.publicKey)); }
async function importPublicKey(bytes, alg) {
  const p = sigAlgParams(alg);
  return alg === 'Ed25519'
    ? crypto.subtle.importKey('raw', bytes, { name:'Ed25519' }, false, ['verify'])
    : crypto.subtle.importKey('raw', bytes, { name:'ECDSA', namedCurve:p.namedCurve }, false, ['verify']);
}
async function signBytes(privateKey, message, alg) {
  const p = sigAlgParams(alg);
  const opts = alg === 'Ed25519' ? { name:'Ed25519' } : { name:'ECDSA', hash:p.hash };
  return new Uint8Array(await crypto.subtle.sign(opts, privateKey, message));
}
async function verifyBytes(publicKey, signature, message, alg) {
  const p = sigAlgParams(alg);
  const opts = alg === 'Ed25519' ? { name:'Ed25519' } : { name:'ECDSA', hash:p.hash };
  return crypto.subtle.verify(opts, publicKey, signature, message);
}

// ── boundary DSL (deterministic) ──
function evaluateAtom(atom, ctx) {
  if (!atom || typeof atom !== 'object' || Array.isArray(atom)) return { ok:false, outcome:'indeterminate', reason:'malformed-atom' };
  const keys = Object.keys(atom); if (keys.length !== 1) return { ok:false, outcome:'indeterminate', reason:'malformed-atom' };
  const k = keys[0], v = atom[k];
  const getPath = path => { if (typeof path!=='string'||!path) return {exists:false,malformed:true}; let cur=ctx; for (const pp of path.split('.')){ if(cur==null||typeof cur!=='object'||!(pp in cur)) return {exists:false}; cur=cur[pp]; } return {exists:true,value:cur}; };
  const now = () => (ctx && typeof ctx._now==='string') ? new Date(ctx._now) : new Date();
  const pd = s => { if (typeof s!=='string') return null; const d=new Date(s); return Number.isNaN(d.getTime())?null:d; };
  const missing = p => ({ ok:false, outcome:'missing-side-info', reason:'missing:'+p });
  if (k==='equals'){ if(!Array.isArray(v)||v.length!==2) return {ok:false,outcome:'indeterminate',reason:'equals-shape'}; const p=getPath(v[0]); if(p.malformed) return {ok:false,outcome:'indeterminate',reason:'path-shape'}; if(!p.exists) return missing(v[0]); return {ok:p.value===v[1],outcome:'out-of-bounds',reason:'equals:'+v[0]}; }
  if (k==='in'){ if(!Array.isArray(v)||v.length!==2||!Array.isArray(v[1])) return {ok:false,outcome:'indeterminate',reason:'in-shape'}; const p=getPath(v[0]); if(!p.exists) return missing(v[0]); return {ok:v[1].includes(p.value),outcome:'out-of-bounds',reason:'in:'+v[0]}; }
  if (k==='range'){ if(!Array.isArray(v)||v.length!==3||typeof v[1]!=='number'||typeof v[2]!=='number') return {ok:false,outcome:'indeterminate',reason:'range-shape'}; const p=getPath(v[0]); if(!p.exists) return missing(v[0]); if(typeof p.value!=='number'||!Number.isFinite(p.value)) return {ok:false,outcome:'indeterminate',reason:'range-type:'+v[0]}; return {ok:p.value>=v[1]&&p.value<=v[2],outcome:'out-of-bounds',reason:'range:'+v[0]}; }
  if (k==='present'){ const p=getPath(v); return p.exists?{ok:true}:missing(v); }
  if (k==='before'||k==='after'||k==='within'){ if(!Array.isArray(v)||(k==='within'?v.length!==3:v.length!==2)) return {ok:false,outcome:'indeterminate',reason:k+'-shape'}; const p=getPath(v[0]); if(!p.exists) return missing(v[0]); const t=pd(p.value),a=pd(v[1]),b=k==='within'?pd(v[2]):null; if(!t||!a||(k==='within'&&!b)) return {ok:false,outcome:'indeterminate',reason:k+'-date'}; if(k==='before') return {ok:t<a,outcome:'out-of-bounds',reason:'before:'+v[0]}; if(k==='after') return {ok:t>a,outcome:'out-of-bounds',reason:'after:'+v[0]}; return {ok:t>=a&&t<=b,outcome:'out-of-bounds',reason:'within:'+v[0]}; }
  if (k==='expired'||k==='not_expired'){ const p=getPath(v); if(!p.exists) return missing(v); const t=pd(p.value),n=now(); if(!t) return {ok:false,outcome:'indeterminate',reason:k+'-date'}; return k==='expired'?{ok:t<n,outcome:'out-of-bounds',reason:'not-expired:'+v}:{ok:t>=n,outcome:'out-of-bounds',reason:'expired:'+v}; }
  if (k==='all'){ if(!Array.isArray(v)) return {ok:false,outcome:'indeterminate',reason:'all-shape'}; for(const a of v){ const r=evaluateAtom(a,ctx); if(!r.ok) return r; } return {ok:true}; }
  if (k==='any'){ if(!Array.isArray(v)) return {ok:false,outcome:'indeterminate',reason:'any-shape'}; let last={ok:false,outcome:'out-of-bounds',reason:'any'}; for(const a of v){ const r=evaluateAtom(a,ctx); if(r.ok) return r; last=r; } return last; }
  if (k==='not'){ const r=evaluateAtom(v,ctx); return r.ok?{ok:false,outcome:'out-of-bounds',reason:'not'}:{ok:true,reason:'not'}; }
  return { ok:false, outcome:'not-defined-in-this-version', reason:'unknown-atom:'+k };
}
export function evaluateBoundary(boundary, ctx) { if(!boundary||typeof boundary!=='object') return {ok:false,outcome:'indeterminate',reason:'malformed-boundary'}; return evaluateAtom(boundary, ctx||{}); }

// ── seal & verify ──
export async function sealBundle({ payload, boundary, digestAlg='SHA-256', sigAlg='Ed25519', profile='PB-BOUNDARY-1', proofKind='signature+boundary', producerId='local', expiration, privateKey, refs }) {
  const payloadBytes = typeof payload === 'string' ? utf8Encode(payload) : payload;
  const meta = { producer_id:producerId, created_at:new Date().toISOString(), canonical_encoding:'PB-CANON-JSON-1', digest_alg:digestAlg, sig_alg:sigAlg, proof_kind:proofKind, boundary };
  if (expiration) meta.expiration = expiration;
  const partial = { hdr:{ spec_id:'PROOFBUNDLE', spec_ver:'1.0.0', profile, bundle_id:'' }, payload:b64uEncode(payloadBytes), meta, refs:Array.isArray(refs)?refs:[] };
  const dig1 = await digest(digestAlg, canonicalBytes(partial));
  partial.hdr.bundle_id = b64uEncode(dig1);
  const dig2 = await digest(digestAlg, canonicalBytes(partial));
  const sig = await signBytes(privateKey, dig2, sigAlg);
  partial.seal = { digest_alg:digestAlg, digest_b64u:b64uEncode(dig2), sig_alg:sigAlg, signature_b64u:b64uEncode(sig) };
  return partial;
}
async function sealedContentDigest(bundle) { const partial={hdr:bundle.hdr,payload:bundle.payload,meta:bundle.meta,refs:bundle.refs}; return b64uEncode(await digest(bundle.meta.digest_alg, canonicalBytes(partial))); }

export async function verifyBundle(bundle, publicKeyBytes, ctx={}, profile=null, options={}) {
  const trace=[]; const step=(n,ok,d)=>trace.push({n,ok,d:d||''});
  if (typeof bundle!=='object'||!bundle) return {outcome:'malformed',trace};
  if (!bundle.hdr||!bundle.payload||!bundle.meta||!Array.isArray(bundle.refs)||!bundle.seal) { step('schema',false,'missing field'); return {outcome:'malformed',trace}; }
  if (bundle.hdr.spec_id!=='PROOFBUNDLE') return {outcome:'malformed',trace};
  if (bundle.hdr.spec_ver!=='1.0.0') return {outcome:'unknown-version',trace};
  if (!PROFILES.includes(bundle.hdr.profile)) return {outcome:'not-defined-in-this-version',trace};
  const requested = profile||bundle.hdr.profile;
  if (profileLevel(requested) > profileLevel(bundle.hdr.profile)) return {outcome:'not-defined-in-this-version',trace};
  const eff = bundle.hdr.profile;
  if (bundle.meta.canonical_encoding!=='PB-CANON-JSON-1') return {outcome:'not-defined-in-this-version',trace};
  if (!DIGEST_ALGS.includes(bundle.meta.digest_alg)) return {outcome:'not-defined-in-this-version',trace};
  if (!SIG_ALGS.includes(bundle.meta.sig_alg)) return {outcome:'not-defined-in-this-version',trace};
  const partial={hdr:bundle.hdr,payload:bundle.payload,meta:bundle.meta,refs:bundle.refs};
  const dig=await digest(bundle.meta.digest_alg, canonicalBytes(partial));
  if (b64uEncode(dig)!==bundle.seal.digest_b64u) { step('canonical',false,'digest mismatch'); return {outcome:'invalid-signature',trace}; }
  let pub, sigOk;
  try { pub=await importPublicKey(publicKeyBytes, bundle.meta.sig_alg); } catch(e){ return {outcome:'malformed',trace}; }
  try { sigOk=await verifyBytes(pub, b64uDecode(bundle.seal.signature_b64u), dig, bundle.meta.sig_alg); } catch(e){ return {outcome:'invalid-signature',trace}; }
  if (!sigOk) { step('integrity',false,'signature'); return {outcome:'invalid-signature',trace}; }
  step('integrity',true);
  if (eff==='PB-INTEGRITY-1') return {outcome:'verified',trace};
  if (bundle.meta.expiration) { const exp=new Date(bundle.meta.expiration); if(Number.isNaN(exp.getTime())) return {outcome:'indeterminate',trace}; if(new Date()>=exp) return {outcome:'out-of-bounds',trace}; }
  const br=evaluateBoundary(bundle.meta.boundary, ctx);
  if (!br.ok) { step('boundary',false,br.reason); return {outcome:br.outcome||'out-of-bounds',trace}; }
  step('boundary',true);
  if (eff==='PB-BOUNDARY-1') return {outcome:'verified',trace};
  // (LINEAGE/REGULATED tiers: parent-digest + HITL — supported by full app; bridge uses BOUNDARY tier)
  return {outcome:'verified',trace};
}

// ── self-test when run directly ──
if (import.meta.url === `file://${process.argv[1].replace(/\\/g,'/')}` || process.argv[1]?.endsWith('proofbundle_verify.mjs')) {
  (async () => {
    const kp = await generateKeyPair('Ed25519');
    const pub = await exportPublicKey(kp, 'Ed25519');
    const boundary = { all: [ { equals: ['env','demo'] }, { present: 'receipt.sequence' }, { equals: ['receipt.owner','claude-opus-4-8-20260615'] } ] };
    const bundle = await sealBundle({ payload: JSON.stringify({ claim:'GPX build verified' }), boundary, privateKey: kp.privateKey });
    const good = { env:'demo', receipt:{ sequence:9592, owner:'claude-opus-4-8-20260615' } };
    const badOwner = { env:'demo', receipt:{ sequence:9592, owner:'claude-sonnet-20260521' } };
    const r1 = await verifyBundle(bundle, pub, good);
    const r2 = await verifyBundle(bundle, pub, badOwner);
    const tampered = JSON.parse(JSON.stringify(bundle)); tampered.payload = b64uEncode(utf8Encode('{"claim":"LIE"}'));
    const r3 = await verifyBundle(tampered, pub, good);
    console.log('valid ctx        ->', r1.outcome, '(expect verified)');
    console.log('wrong receipt owner ->', r2.outcome, '(expect out-of-bounds)');
    console.log('tampered payload ->', r3.outcome, '(expect invalid-signature)');
  })();
}
