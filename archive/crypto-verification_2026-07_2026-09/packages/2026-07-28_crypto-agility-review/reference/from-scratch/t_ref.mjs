import { keyGenInternal, encapsInternal, decapsInternal } from './mlkem.mjs';
import { readFileSync } from 'node:fs';
const hex=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
const toHex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const V=JSON.parse(readFileSync('./ref_vectors.json','utf8'));
let pass=0,fail=0; const bad=[];
const chk=(n,a,b)=>{ if(a===b) pass++; else { fail++; bad.push(`${n}\n  ours ${a.slice(0,64)}…\n  ref  ${b.slice(0,64)}…`); } };
for(const v of V){
  const {encapsKey,decapsKey}=keyGenInternal(hex(v.d),hex(v.z),v.set);
  chk(`${v.set} ek`, toHex(encapsKey), v.ek);
  chk(`${v.set} dk`, toHex(decapsKey), v.dk);
  const {sharedSecret,ciphertext}=encapsInternal(hex(v.ek),hex(v.m),v.set);
  chk(`${v.set} ct`, toHex(ciphertext), v.ct);
  chk(`${v.set} ss`, toHex(sharedSecret), v.ss);
  chk(`${v.set} decaps(ref ct)`, toHex(decapsInternal(hex(v.dk),hex(v.ct),v.set)), v.ss);
}
console.log(`cross-implementation: ${pass} pass, ${fail} fail  (${V.length} vectors x 5 checks)`);
if(bad.length) console.log(bad.slice(0,4).join("\n"));
process.exit(fail?1:0);
