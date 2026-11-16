// crypto/slh-dsa.mjs — SLH-DSA-SHA2-128f, FIPS 205 (August 2024).
// Installed 2026-11-01, replacing the earlier module (preserved byte-for-byte
// as slh-dsa.pre-fips205-20261101.mjs, sha256 b00d7d0f…7f1), which was not
// conformant: its SHA-256 length padding used >>> 32..56 (JS shift counts are
// mod 32), plus an L-tree instead of T_len, WOTS chains under WOTS_PK, and no
// per-step hash address. Evidence and tests:
//   pb/work/2026-11-01_slhdsa-oracle-check_opus55-cc/
//   pb/work/2026-11-01_crypto-conformance-sweep_opus55-cc/
// This module: written line by line from the FIPS 205 text; keygen and
// deterministic signatures byte-identical to @noble/post-quantum; keys and
// signatures accepted by OpenSSL 3.5.7. Not NIST ACVP-validated.
// Only import: ./sha256.mjs (from scratch). No WebCrypto, node:crypto or noble.
// SLH-DSA-SHA2-128f, written line by line from FIPS 205 (August 2024) as
// preserved at pb/work/bridge-verified-agents-20261013/reports/fips205-verification/
// NIST.FIPS.205.txt. Each function names its algorithm. Pure JS; the only
// import is the repo's from-scratch SHA-256. No WebCrypto, no node:crypto,
// no noble. Randomness for hedged signing comes from crypto.getRandomValues.
// Written for clarity and auditability, not speed.
import {sha256} from './sha256.mjs';

// Table 2, SLH-DSA-SHA2-128f
const n=16, h=66, d=22, hp=3, a=6, k=33, lgw=4, m=34;
const w=1<<lgw, len1=2*n, len2=3, len=len1+len2;            // §5, text at line 1066
const MD_BYTES=Math.ceil(k*a/8), TREE_BYTES=Math.ceil((h-h/d)/8), LEAF_BYTES=Math.ceil(h/(8*d)); // Alg 19 l.6-8
export const PK_BYTES=2*n, SK_BYTES=4*n, SIG_BYTES=(1+k*(1+a)+h+d*len)*n;  // Alg 20 l.1 -> 17088
const WOTS_HASH=0, WOTS_PK=1, TREE=2, FORS_TREE=3, FORS_ROOTS=4, WOTS_PRF=5, FORS_PRF=6;

// ---- byte helpers (§2.3 toInt / toByte) ----
const cat=(...xs)=>{const o=new Uint8Array(xs.reduce((s,x)=>s+x.length,0));let p=0;for(const x of xs){o.set(x,p);p+=x.length;}return o;};
const toByte=(x,L)=>{const b=new Uint8Array(L);let v=BigInt(x);for(let i=L-1;i>=0;i--){b[i]=Number(v&255n);v>>=8n;}return b;};
const toInt=(X)=>{let v=0n;for(const b of X)v=(v<<8n)|BigInt(b);return v;};
const eq=(x,y)=>{if(x.length!==y.length)return false;let r=0;for(let i=0;i<x.length;i++)r|=x[i]^y[i];return r===0;};

// ---- compressed address ADRSc, 22 bytes (§11.2, Table 3) ----
class ADRS{constructor(b){this.b=b?new Uint8Array(b):new Uint8Array(22);}
 copy(){return new ADRS(this.b);}
 setLayerAddress(l){this.b.set(toByte(l,1),0);}
 setTreeAddress(t){this.b.set(toByte(t,8),1);}
 setTypeAndClear(y){this.b[9]=y;this.b.fill(0,10,22);}
 setKeyPairAddress(i){this.b.set(toByte(i,4),10);}
 getKeyPairAddress(){return Number(toInt(this.b.subarray(10,14)));}
 setChainAddress(i){this.b.set(toByte(i,4),14);}
 setTreeHeight(i){this.b.set(toByte(i,4),14);}
 setHashAddress(i){this.b.set(toByte(i,4),18);}
 setTreeIndex(i){this.b.set(toByte(i,4),18);}
 getTreeIndex(){return Number(toInt(this.b.subarray(18,22)));}}

// ---- §11.2.1 hash instantiation (security category 1) ----
const pad=new Uint8Array(64-n);
const tweak=(pkSeed,adrs,X)=>sha256(cat(pkSeed,pad,adrs.b,X)).subarray(0,n);
const F=tweak, H=tweak, T=tweak;
const PRF=(pkSeed,skSeed,adrs)=>tweak(pkSeed,adrs,skSeed);
function hmacSha256(key,msg){                               // FIPS 198-1, B = 64
 let K=key.length>64?sha256(key):key;const k0=new Uint8Array(64);k0.set(K);
 const ipad=k0.map(x=>x^0x36),opad=k0.map(x=>x^0x5c);
 return sha256(cat(opad,sha256(cat(ipad,msg))));
}
const PRFmsg=(skPrf,optRand,M)=>hmacSha256(skPrf,cat(optRand,M)).subarray(0,n);
function mgf1Sha256(seed,L){                                // RFC 8017 B.2.1
 const out=new Uint8Array(L);let off=0;
 for(let c=0;off<L;c++){const blk=sha256(cat(seed,toByte(c,4)));out.set(blk.subarray(0,Math.min(32,L-off)),off);off+=32;}
 return out;
}
const Hmsg=(R,pkSeed,pkRoot,M)=>mgf1Sha256(cat(R,pkSeed,sha256(cat(R,pkSeed,pkRoot,M))),m);

// ---- Alg 4 base_2b ----
function base_2b(X,b,outLen){
 let i=0,bits=0,total=0;const out=new Array(outLen);const mask=(1<<b)-1;
 for(let o=0;o<outLen;o++){
  while(bits<b){total=((total<<8)+X[i])&0xffffff;i++;bits+=8;}  // only the low bits+8 bits are ever needed
  bits-=b;out[o]=(total>>>bits)&mask;
 }
 return out;
}

// ---- WOTS+ (Alg 5-8) ----
function chain(X,i,s,pkSeed,adrs){let tmp=X;for(let j=i;j<i+s;j++){adrs.setHashAddress(j);tmp=F(pkSeed,adrs,tmp);}return tmp;}
function wots_pkGen(skSeed,pkSeed,adrs){
 const skADRS=adrs.copy();skADRS.setTypeAndClear(WOTS_PRF);skADRS.setKeyPairAddress(adrs.getKeyPairAddress());
 const tmp=[];
 for(let i=0;i<len;i++){skADRS.setChainAddress(i);const sk=PRF(pkSeed,skSeed,skADRS);adrs.setChainAddress(i);tmp.push(chain(sk,0,w-1,pkSeed,adrs));}
 const pkADRS=adrs.copy();pkADRS.setTypeAndClear(WOTS_PK);pkADRS.setKeyPairAddress(adrs.getKeyPairAddress());
 return T(pkSeed,pkADRS,cat(...tmp));
}
function wotsDigits(M){
 const msg=base_2b(M,lgw,len1);let csum=0;
 for(let i=0;i<len1;i++)csum+=w-1-msg[i];
 csum<<=((8-((len2*lgw)%8))%8);
 return msg.concat(base_2b(toByte(csum,Math.ceil(len2*lgw/8)),lgw,len2));
}
function wots_sign(M,skSeed,pkSeed,adrs){
 const msg=wotsDigits(M);
 const skADRS=adrs.copy();skADRS.setTypeAndClear(WOTS_PRF);skADRS.setKeyPairAddress(adrs.getKeyPairAddress());
 const sig=[];
 for(let i=0;i<len;i++){skADRS.setChainAddress(i);const sk=PRF(pkSeed,skSeed,skADRS);adrs.setChainAddress(i);sig.push(chain(sk,0,msg[i],pkSeed,adrs));}
 return cat(...sig);
}
function wots_pkFromSig(sig,M,pkSeed,adrs){
 const msg=wotsDigits(M);const tmp=[];
 for(let i=0;i<len;i++){adrs.setChainAddress(i);tmp.push(chain(sig.subarray(i*n,(i+1)*n),msg[i],w-1-msg[i],pkSeed,adrs));}
 const pkADRS=adrs.copy();pkADRS.setTypeAndClear(WOTS_PK);pkADRS.setKeyPairAddress(adrs.getKeyPairAddress());
 return T(pkSeed,pkADRS,cat(...tmp));
}

// ---- XMSS (Alg 9-11) ----
function xmss_node(skSeed,i,z,pkSeed,adrs){
 if(z===0){adrs.setTypeAndClear(WOTS_HASH);adrs.setKeyPairAddress(i);return wots_pkGen(skSeed,pkSeed,adrs);}
 const l=xmss_node(skSeed,2*i,z-1,pkSeed,adrs),r=xmss_node(skSeed,2*i+1,z-1,pkSeed,adrs);
 adrs.setTypeAndClear(TREE);adrs.setTreeHeight(z);adrs.setTreeIndex(i);
 return H(pkSeed,adrs,cat(l,r));
}
function xmss_sign(M,skSeed,idx,pkSeed,adrs){
 const auth=[];
 for(let j=0;j<hp;j++){const kk=Math.floor(idx/2**j)^1;auth.push(xmss_node(skSeed,kk,j,pkSeed,adrs));}
 adrs.setTypeAndClear(WOTS_HASH);adrs.setKeyPairAddress(idx);
 return cat(wots_sign(M,skSeed,pkSeed,adrs),...auth);
}
function xmss_pkFromSig(idx,sigX,M,pkSeed,adrs){
 adrs.setTypeAndClear(WOTS_HASH);adrs.setKeyPairAddress(idx);
 const sig=sigX.subarray(0,len*n),auth=sigX.subarray(len*n,(len+hp)*n);
 let node=wots_pkFromSig(sig,M,pkSeed,adrs);
 adrs.setTypeAndClear(TREE);adrs.setTreeIndex(idx);
 for(let kk=0;kk<hp;kk++){
  adrs.setTreeHeight(kk+1);const A=auth.subarray(kk*n,(kk+1)*n);
  if(Math.floor(idx/2**kk)%2===0){adrs.setTreeIndex(adrs.getTreeIndex()/2);node=H(pkSeed,adrs,cat(node,A));}
  else{adrs.setTreeIndex((adrs.getTreeIndex()-1)/2);node=H(pkSeed,adrs,cat(A,node));}
 }
 return node;
}

// ---- Hypertree (Alg 12-13). idx_tree is a BigInt (up to 63 bits). ----
const XMSS_BYTES=(hp+len)*n;
function ht_sign(M,skSeed,pkSeed,idxTree,idxLeaf){
 const adrs=new ADRS();adrs.setTreeAddress(idxTree);
 let sigTmp=xmss_sign(M,skSeed,idxLeaf,pkSeed,adrs);const out=[sigTmp];
 let root=xmss_pkFromSig(idxLeaf,sigTmp,M,pkSeed,adrs);
 for(let j=1;j<d;j++){
  idxLeaf=Number(idxTree&BigInt(2**hp-1));idxTree>>=BigInt(hp);
  adrs.setLayerAddress(j);adrs.setTreeAddress(idxTree);
  sigTmp=xmss_sign(root,skSeed,idxLeaf,pkSeed,adrs);out.push(sigTmp);
  if(j<d-1)root=xmss_pkFromSig(idxLeaf,sigTmp,root,pkSeed,adrs);
 }
 return cat(...out);
}
function ht_verify(M,sigHT,pkSeed,idxTree,idxLeaf,pkRoot){
 const adrs=new ADRS();adrs.setTreeAddress(idxTree);
 let node=xmss_pkFromSig(idxLeaf,sigHT.subarray(0,XMSS_BYTES),M,pkSeed,adrs);
 for(let j=1;j<d;j++){
  idxLeaf=Number(idxTree&BigInt(2**hp-1));idxTree>>=BigInt(hp);
  adrs.setLayerAddress(j);adrs.setTreeAddress(idxTree);
  node=xmss_pkFromSig(idxLeaf,sigHT.subarray(j*XMSS_BYTES,(j+1)*XMSS_BYTES),node,pkSeed,adrs);
 }
 return eq(node,pkRoot);
}

// ---- FORS (Alg 14-17) ----
function fors_skGen(skSeed,pkSeed,adrs,idx){
 const skADRS=adrs.copy();skADRS.setTypeAndClear(FORS_PRF);skADRS.setKeyPairAddress(adrs.getKeyPairAddress());skADRS.setTreeIndex(idx);
 return PRF(pkSeed,skSeed,skADRS);
}
function fors_node(skSeed,i,z,pkSeed,adrs){
 if(z===0){const sk=fors_skGen(skSeed,pkSeed,adrs,i);adrs.setTreeHeight(0);adrs.setTreeIndex(i);return F(pkSeed,adrs,sk);}
 const l=fors_node(skSeed,2*i,z-1,pkSeed,adrs),r=fors_node(skSeed,2*i+1,z-1,pkSeed,adrs);
 adrs.setTreeHeight(z);adrs.setTreeIndex(i);return H(pkSeed,adrs,cat(l,r));
}
function fors_sign(md,skSeed,pkSeed,adrs){
 const ind=base_2b(md,a,k);const out=[];
 for(let i=0;i<k;i++){
  out.push(fors_skGen(skSeed,pkSeed,adrs,i*2**a+ind[i]));
  for(let j=0;j<a;j++){const s=Math.floor(ind[i]/2**j)^1;out.push(fors_node(skSeed,i*2**(a-j)+s,j,pkSeed,adrs));}
 }
 return cat(...out);
}
function fors_pkFromSig(sigF,md,pkSeed,adrs){
 const ind=base_2b(md,a,k);const roots=[];
 for(let i=0;i<k;i++){
  const base=i*(a+1)*n,sk=sigF.subarray(base,base+n),auth=sigF.subarray(base+n,base+(a+1)*n);
  adrs.setTreeHeight(0);adrs.setTreeIndex(i*2**a+ind[i]);let node=F(pkSeed,adrs,sk);
  for(let j=0;j<a;j++){
   adrs.setTreeHeight(j+1);const A=auth.subarray(j*n,(j+1)*n);
   if(Math.floor(ind[i]/2**j)%2===0){adrs.setTreeIndex(adrs.getTreeIndex()/2);node=H(pkSeed,adrs,cat(node,A));}
   else{adrs.setTreeIndex((adrs.getTreeIndex()-1)/2);node=H(pkSeed,adrs,cat(A,node));}
  }
  roots.push(node);
 }
 const pkADRS=adrs.copy();pkADRS.setTypeAndClear(FORS_ROOTS);pkADRS.setKeyPairAddress(adrs.getKeyPairAddress());
 return T(pkSeed,pkADRS,cat(...roots));
}

// ---- Alg 18-20: internal key generation, signing, verification ----
function splitDigest(digest){
 const md=digest.subarray(0,MD_BYTES);
 const idxTree=toInt(digest.subarray(MD_BYTES,MD_BYTES+TREE_BYTES))&((1n<<BigInt(h-h/d))-1n);
 const idxLeaf=Number(toInt(digest.subarray(MD_BYTES+TREE_BYTES,MD_BYTES+TREE_BYTES+LEAF_BYTES))&BigInt(2**(h/d)-1));
 return {md,idxTree,idxLeaf};
}
export function keygen_internal(skSeed,skPrf,pkSeed){
 const adrs=new ADRS();adrs.setLayerAddress(d-1);
 const pkRoot=xmss_node(skSeed,0,hp,pkSeed,adrs);
 return {secretKey:cat(skSeed,skPrf,pkSeed,pkRoot),publicKey:cat(pkSeed,pkRoot)};
}
export function sign_internal(M,SK,addrnd=null){
 const skSeed=SK.subarray(0,n),skPrf=SK.subarray(n,2*n),pkSeed=SK.subarray(2*n,3*n),pkRoot=SK.subarray(3*n,4*n);
 const optRand=addrnd??pkSeed;                                // Alg 19 l.2: deterministic variant uses PK.seed
 const R=PRFmsg(skPrf,optRand,M);
 const {md,idxTree,idxLeaf}=splitDigest(Hmsg(R,pkSeed,pkRoot,M));
 const adrs=new ADRS();adrs.setTreeAddress(idxTree);adrs.setTypeAndClear(FORS_TREE);adrs.setKeyPairAddress(idxLeaf);
 const sigF=fors_sign(md,skSeed,pkSeed,adrs);
 const pkF=fors_pkFromSig(sigF,md,pkSeed,adrs);
 return cat(R,sigF,ht_sign(pkF,skSeed,pkSeed,idxTree,idxLeaf));
}
export function verify_internal(M,SIG,PK){
 if(SIG.length!==SIG_BYTES||PK.length!==PK_BYTES)return false;
 const pkSeed=PK.subarray(0,n),pkRoot=PK.subarray(n,2*n);
 const R=SIG.subarray(0,n),sigF=SIG.subarray(n,(1+k*(1+a))*n),sigHT=SIG.subarray((1+k*(1+a))*n);
 const {md,idxTree,idxLeaf}=splitDigest(Hmsg(R,pkSeed,pkRoot,M));
 const adrs=new ADRS();adrs.setTreeAddress(idxTree);adrs.setTypeAndClear(FORS_TREE);adrs.setKeyPairAddress(idxLeaf);
 const pkF=fors_pkFromSig(sigF,md,pkSeed,adrs);
 return ht_verify(pkF,sigHT,pkSeed,idxTree,idxLeaf,pkRoot);
}

// ---- Alg 21, 22, 24: external (pure) interface ----
export function keygen(seed48){
 if(!(seed48 instanceof Uint8Array)||seed48.length!==3*n)throw new TypeError('seed must be 48 bytes: SK.seed||SK.prf||PK.seed');
 return keygen_internal(seed48.subarray(0,n),seed48.subarray(n,2*n),seed48.subarray(2*n,3*n));
}
function mPrime(M,ctx){if(ctx.length>255)throw new RangeError('context longer than 255 bytes');return cat(toByte(0,1),toByte(ctx.length,1),ctx,M);}
export function signFips(M,SK,{ctx=new Uint8Array(0),deterministic=false}={}){
 let addrnd=null;
 if(!deterministic){addrnd=new Uint8Array(n);globalThis.crypto.getRandomValues(addrnd);}
 return sign_internal(mPrime(M,ctx),SK,addrnd);
}
export function verifyFips(SIG,M,PK,{ctx=new Uint8Array(0)}={}){
 if(ctx.length>255)return false;
 return verify_internal(mPrime(M,ctx),SIG,PK);
}
export const params={name:'SLH-DSA-SHA2-128f',n,h,d,hp,a,k,lgw,m,len,PK_BYTES,SK_BYTES,SIG_BYTES};

// ---- Compatibility layer for existing callers (crypto/t_slh_dsa.mjs) ----
// keyPairFromSeed: a 48-byte seed is FIPS 205 SK.seed||SK.prf||PK.seed.
// A 32-byte seed is expanded with the earlier module's documented rule
// (h1 = SHA-256(seed), h2 = SHA-256(h1||seed); SK.seed=h1[0:16],
// SK.prf=h1[16:32], PK.seed=h2[0:16]). That expansion is NOT part of FIPS 205.
const enc=new TextEncoder();
export function keyPairFromSeed(seed){
 if(!(seed instanceof Uint8Array))throw new TypeError('keyPairFromSeed: seed must be Uint8Array');
 let s48;
 if(seed.length===48)s48=seed;
 else if(seed.length===32){const h1=sha256(seed),h2=sha256(cat(h1.subarray(0,16),seed));s48=cat(h1.subarray(0,32),h2.subarray(0,16));}
 else throw new TypeError('keyPairFromSeed: seed must be 32 or 48 bytes');
 const k=keygen(s48);return {publicKey:k.publicKey,privateKey:k.secretKey};
}
// sign / verify: FIPS 205 pure SLH-DSA (Alg 22 / 24), empty context.
// sign defaults to the deterministic variant (opt_rand = PK.seed), which is
// valid FIPS 205 and keeps signatures reproducible; pass {deterministic:false}
// for the hedged variant.
export function sign(message,privateKey,opts={}){
 if(typeof message==='string')message=enc.encode(message);
 if(!(message instanceof Uint8Array))throw new TypeError('sign: message must be Uint8Array or string');
 if(!(privateKey instanceof Uint8Array)||privateKey.length!==SK_BYTES)throw new TypeError('sign: privateKey must be 64 bytes');
 return signFips(message,privateKey,{deterministic:true,...opts});
}
export function verify(signature,message,publicKey,opts={}){
 if(typeof message==='string')message=enc.encode(message);
 if(!(signature instanceof Uint8Array)||!(publicKey instanceof Uint8Array)||!(message instanceof Uint8Array))return false;
 try{return verifyFips(signature,message,publicKey,opts);}catch{return false;}
}
