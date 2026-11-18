import crypto from 'node:crypto';
const E=await import('/mnt/user-data/uploads/Crypto_Accumulation_Algorithms/crypto_core_active/crypto-core/ecdsa.mjs');
let ok=0,bad=[];
for(const [c,nc,h,w] of [['P-256','prime256v1','sha256',32],['P-384','secp384r1','sha384',48]]){
 for(let i=0;i<40;i++){
  const ecdh=crypto.createECDH(nc);ecdh.generateKeys();const d=ecdh.getPrivateKey();const dd=Buffer.concat([Buffer.alloc(w-d.length),d]);
  const kp=E.ecdsaKeygen(dd,c);
  if(Buffer.compare(Buffer.from(kp.publicKey),ecdh.getPublicKey())!==0){bad.push(c+'pub'+i);continue}
  const m=crypto.randomBytes(i*13);
  const s=E.ecdsaSign(dd,m,c);
  const pub=crypto.createPublicKey({key:crypto.createECDH(nc).constructor&&Buffer.concat([Buffer.from(c==='P-256'?'3059301306072a8648ce3d020106082a8648ce3d030107034200':'3076301006072a8648ce3d020106052b81040022036200','hex'),ecdh.getPublicKey()]),format:'der',type:'spki'});
  crypto.verify(h,m,pub,Buffer.from(s.der))?ok++:bad.push(c+'js-sig-node-verify'+i);
  // node signature verified by js
 }
}
console.log(ok,bad.length,bad.slice(0,5));
