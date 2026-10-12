import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const data=JSON.parse(fs.readFileSync(new URL('../../ALGORITHM_SYNTHESIS.json',import.meta.url)));
const script=fs.readFileSync(new URL('../../ui/algorithm-synthesis.js',import.meta.url),'utf8');
function view(value=data) {
  const dom=new JSDOM('<div id="algorithm-synthesis"></div><script id="pb-algorithm-synthesis-data" type="application/json"></script>',{runScripts:'outside-only'});
  dom.window.document.getElementById('pb-algorithm-synthesis-data').textContent=JSON.stringify(value);
  dom.window.eval(script);return dom;
}
test('preserves separate implementation and proof lineages',()=>{
  assert.equal(data.application.find(r=>r.id==='ML-KEM-768').implementationStatus,'COMPLETE');
  assert.equal(data.proofs.find(r=>r.name==='ML-KEM-768').status,'hollow-scaffold');
  assert.ok(data.sources.every(r=>/^[a-f0-9]{64}$/.test(r.sha256)));
  assert.equal(data.summary.historical_duplicate_rows,data.history.length-new Set(data.history.map(r=>r.id)).size);
});
test('search finds BLAKE3 and source selection retains the historical rows',()=>{
  const dom=view(),d=dom.window.document,input=d.querySelector('input'),select=d.querySelector('select');
  select.value='application';select.dispatchEvent(new dom.window.Event('change'));
  input.value='BLAKE3';input.dispatchEvent(new dom.window.Event('input'));
  assert.ok(d.querySelector('tbody').textContent.includes('BLAKE3'));
  assert.ok(!d.querySelector('tbody').textContent.includes('SHA-224'));
  input.value='';select.value='history';select.dispatchEvent(new dom.window.Event('change'));
  assert.ok(d.getElementById('algorithm-synthesis').textContent.includes(`${data.history.length} matching records`));
  assert.equal(d.querySelectorAll('tbody tr').length,40);dom.window.close();
});
test('combined search exposes conflicting ML-KEM implementation and proof evidence together',()=>{
  const dom=view(),d=dom.window.document,input=d.querySelector('input');
  input.value='ML-KEM-768';input.dispatchEvent(new dom.window.Event('input'));
  assert.ok(d.querySelector('tbody').textContent.includes('COMPLETE'));
  assert.ok(d.querySelector('tbody').textContent.includes('hollow-scaffold'));
  assert.ok(d.querySelector('tbody').textContent.includes('application'));
  assert.ok(d.querySelector('tbody').textContent.includes('proofs'));dom.window.close();
});
test('untrusted source names are rendered as text',()=>{
  const copy=structuredClone(data);copy.application=[{id:'<img src=x onerror="globalThis.attacked=1">',implementationStatus:'DECLARED'}];
  const dom=view(copy);assert.equal(dom.window.document.querySelectorAll('img').length,0);
  assert.equal(dom.window.attacked,undefined);assert.ok(dom.window.document.querySelector('tbody').textContent.includes('<img'));dom.window.close();
});
test('file-origin page includes exact reconciled data',()=>{
  const html=fs.readFileSync(new URL('../../proofbundle.html',import.meta.url),'utf8');
  const dom=new JSDOM(html);const encoded=dom.window.document.getElementById('pb-algorithm-synthesis-data');
  assert.deepEqual(JSON.parse(encoded.textContent),data);
  assert.equal(dom.window.document.querySelectorAll('#algorithm-synthesis').length,1);dom.window.close();
});
