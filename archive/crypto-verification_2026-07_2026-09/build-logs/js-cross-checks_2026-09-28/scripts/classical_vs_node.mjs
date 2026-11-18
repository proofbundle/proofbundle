import crypto from 'node:crypto';
const B='/mnt/user-data/uploads/Crypto_Accumulation_Algorithms/crypto_core_active/crypto-core/';
const S=await import(B+'sha256.mjs'),S5=await import(B+'sha512.mjs'),Kc=await import(B+'keccak.mjs'),Bl=await import(B+'blake2.mjs'),E=await import(B+'ecdsa.mjs'),Ed=await import(B+'ed25519.mjs');
const hx=b=>Buffer.from(b).toString('hex');
let ok=0,bad=[];const chk=(n,a,b)=>{a===b?ok++:bad.push(n)};
for(let len=0;len<=300;len+=1){const m=crypto.randomBytes(len);
 chk('sha256'+len,hx(S.sha256(m)),crypto.createHash('sha256').update(m).digest('hex'));
 chk('sha512'+len,hx(S5.sha512(m)),crypto.createHash('sha512').update(m).digest('hex'));
 chk('sha384'+len,hx(S5.sha384(m)),crypto.createHash('sha384').update(m).digest('hex'));
 chk('sha3-256'+len,hx(Kc.sha3_256(m)),crypto.createHash('sha3-256').update(m).digest('hex'));
 chk('sha3-512'+len,hx(Kc.sha3_512(m)),crypto.createHash('sha3-512').update(m).digest('hex'));
 chk('shake256'+len,hx(Kc.shake256(m,77)),crypto.createHash('shake256',{outputLength:77}).update(m).digest('hex'));
 chk('shake128'+len,hx(Kc.shake128(m,50)),crypto.createHash('shake128',{outputLength:50}).update(m).digest('hex'));
 chk('blake2b'+len,hx(Bl.blake2b(m)),crypto.createHash('blake2b512').update(m).digest('hex'));
 chk('blake2s'+len,hx(Bl.blake2s(m)),crypto.createHash('blake2s256').update(m).digest('hex'));
}
// ed25519
for(let i=0;i<20;i++){const seed=crypto.randomBytes(32),m=crypto.randomBytes(i*5);
 const kp=Ed.ed25519Keygen(seed);const pk=kp.publicKey||kp.pk||Ed.ed25519PublicKey(seed);
 const priv=crypto.createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]),format:'der',type:'pkcs8'});
 const nsig=crypto.sign(null,m,priv);const npk=crypto.createPublicKey(priv).export({format:'der',type:'spki'}).slice(-32);
 chk('ed-pk'+i,hx(Ed.ed25519PublicKey(seed)),hx(npk)); chk('ed-sig'+i,hx(Ed.ed25519Sign(seed,m)),hx(nsig));
 chk('ed-ver'+i,String(Ed.ed25519Verify(npk,m,nsig)),'true');}
// ecdsa: verify js sigs with node, node sigs with js
console.log('ecdsa exports keys sample:',Object.keys(E.ecdsaKeygen(crypto.randomBytes(32),'P-256')));
console.log(ok,'ok',bad.length,'bad',bad.slice(0,10));
