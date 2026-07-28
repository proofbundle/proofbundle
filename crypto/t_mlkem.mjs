import { ntt, nttInverse, multiplyNTTs, polyMulSchoolbook, PARAMS,
         mlkemKeygen, mlkemEncapsulate, mlkemDecapsulate } from './mlkem.mjs';
import { randomBytes } from 'node:crypto';
const Q=3329,N=256;
let pass=0,fail=0; const bad=[];
const ok=(n,c,d='')=>{ if(c) pass++; else { fail++; bad.push(n+(d?' :: '+d:'')); } };
const eq=(a,b)=>{ if(a.length!==b.length) return false; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; };
const rndPoly=()=>{ const p=new Int32Array(N); const r=randomBytes(N*2); for(let i=0;i<N;i++) p[i]=((r[2*i]<<8)|r[2*i+1])%Q; return p; };

// 1. NTT invertibility
for(let t=0;t<5;t++){ const f=rndPoly(); ok(`ntt invertible #${t}`, eq(nttInverse(ntt(f)), f)); }

// 2. NTT-domain multiply agrees with independent schoolbook convolution
for(let t=0;t<5;t++){
  const a=rndPoly(), b=rndPoly();
  const viaNTT = nttInverse(multiplyNTTs(ntt(a), ntt(b)));
  const direct = polyMulSchoolbook(a,b);
  ok(`ntt-mul == schoolbook #${t}`, eq(viaNTT,direct));
}

// 3-6. per parameter set
const TABLE2 = { 'ML-KEM-512':{ek:800,dk:1632,ct:768}, 'ML-KEM-768':{ek:1184,dk:2400,ct:1088}, 'ML-KEM-1024':{ek:1568,dk:3168,ct:1568} };
for(const name of Object.keys(PARAMS)){
  const seed=randomBytes(64), m=randomBytes(32);
  const { encapsKey, decapsKey } = mlkemKeygen(seed,name);
  const { sharedSecret, ciphertext } = mlkemEncapsulate(encapsKey,m,name);
  const back = mlkemDecapsulate(decapsKey, ciphertext, name);
  const T=TABLE2[name];
  ok(`${name} ek size`, encapsKey.length===T.ek, `${encapsKey.length} vs ${T.ek}`);
  ok(`${name} dk size`, decapsKey.length===T.dk, `${decapsKey.length} vs ${T.dk}`);
  ok(`${name} ct size`, ciphertext.length===T.ct, `${ciphertext.length} vs ${T.ct}`);
  ok(`${name} ss size`, sharedSecret.length===32);
  ok(`${name} encaps/decaps agree`, eq(sharedSecret, back));

  // implicit rejection: every single-bit flip must NOT yield the real secret
  let rejected=0;
  for(let trial=0; trial<24; trial++){
    const c2=Uint8Array.from(ciphertext);
    const bit=Math.floor(Math.random()*c2.length*8);
    c2[bit>>3]^=1<<(bit&7);
    if(!eq(mlkemDecapsulate(decapsKey,c2,name), sharedSecret)) rejected++;
  }
  ok(`${name} implicit rejection 24/24`, rejected===24, `${rejected}/24`);

  // determinism
  const k2 = mlkemKeygen(seed,name);
  ok(`${name} keygen deterministic`, eq(k2.encapsKey,encapsKey) && eq(k2.decapsKey,decapsKey));
  const e2 = mlkemEncapsulate(encapsKey,m,name);
  ok(`${name} encaps deterministic`, eq(e2.ciphertext,ciphertext) && eq(e2.sharedSecret,sharedSecret));

  // 100 random messages must all round-trip (decryption-failure probe)
  let rt=0;
  for(let i=0;i<100;i++){
    const mm=randomBytes(32);
    const r=mlkemEncapsulate(encapsKey,mm,name);
    if(eq(mlkemDecapsulate(decapsKey,r.ciphertext,name), r.sharedSecret)) rt++;
  }
  ok(`${name} 100/100 round trips`, rt===100, `${rt}/100`);

  // distinct seeds must give distinct keys
  const k3=mlkemKeygen(randomBytes(64),name);
  ok(`${name} distinct seed -> distinct ek`, !eq(k3.encapsKey,encapsKey));
}
console.log(`mlkem: ${pass} pass, ${fail} fail`);
if(bad.length) console.log(bad.join("\n"));
process.exit(fail?1:0);
