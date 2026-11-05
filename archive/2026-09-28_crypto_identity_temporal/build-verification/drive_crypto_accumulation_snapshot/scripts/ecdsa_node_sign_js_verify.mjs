import crypto from 'node:crypto';
const E=await import('/mnt/user-data/uploads/Crypto_Accumulation_Algorithms/crypto_core_active/crypto-core/ecdsa.mjs');
let ok=0,bad=[];
for(const [c,nc,h] of [['P-256','prime256v1','sha256'],['P-384','secp384r1','sha384']]) for(let i=0;i<40;i++){
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:nc});
 const pk=publicKey.export({format:'der',type:'spki'}).slice(-(c==='P-256'?65:97));
 const m=crypto.randomBytes(i*11);const sig=crypto.sign(h,m,privateKey);
 E.ecdsaVerify(pk,m,sig,c)?ok++:bad.push('accept'+c+i);
 const m2=Buffer.from(m);m2[0]^=1; if(m.length&&E.ecdsaVerify(pk,m2,sig,c))bad.push('acceptTampered'+c+i);
 const s2=Buffer.from(sig);s2[s2.length-1]^=1; if(E.ecdsaVerify(pk,m,s2,c))bad.push('acceptBadSig'+c+i);
}
console.log(ok,bad);
