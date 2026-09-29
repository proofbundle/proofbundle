import * as K from '/mnt/user-data/uploads/Crypto_Accumulation_Algorithms/crypto_core_active/crypto-core/mlkem.mjs';
import * as D from '/mnt/user-data/uploads/Crypto_Accumulation_Algorithms/crypto_core_active/crypto-core/mldsa.mjs';
const hx=b=>Buffer.from(b).toString('hex');
const seq=(n,o)=>Uint8Array.from({length:n},(_,i)=>(i*7+o)&255);
const out={};
for(const p of ['ML-KEM-512','ML-KEM-768','ML-KEM-1024']){
 const kg=K.mlkemKeygen(seq(64,1),p); const en=K.mlkemEncapsulate(kg.encapsKey,seq(32,9),p);
 out[p]={ek:hx(kg.encapsKey),dk:hx(kg.decapsKey),ct:hx(en.ciphertext),ss:hx(en.sharedSecret),dec:hx(K.mlkemDecapsulate(kg.decapsKey,en.ciphertext,p))};
}
for(const p of ['ML-DSA-44','ML-DSA-65','ML-DSA-87']){
 const kg=D.mldsaKeygen(seq(32,3),p); const msg=new TextEncoder().encode('proofbundle');
 const sg=D.mldsaSign(kg.privateKey||kg.sk||kg.secretKey,msg,new Uint8Array(32),p);
 out[p]={keys:Object.keys(kg),pk:hx(kg.publicKey||kg.pk),sk:hx(kg.privateKey||kg.sk||kg.secretKey),sig:hx(sg.signature||sg),};
}
console.log(JSON.stringify(out));
