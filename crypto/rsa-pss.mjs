// Scratch RSA-PSS/SHA-256, RFC 8017. Entropy is supplied by the caller.
// BigInt executable specification; variable-time arithmetic is an open obligation.
import {sha256} from './sha256.mjs';
const cat=(...a)=>{const out=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let at=0;for(const x of a){out.set(x,at);at+=x.length;}return out;};
const big=b=>{let n=0n;for(const x of b)n=n*256n+BigInt(x);return n;};
function bytes(n,len){const a=new Uint8Array(len);for(let i=len-1;i>=0;i--){a[i]=Number(n&255n);n>>=8n;}if(n)throw new RangeError('RSA integer overflow');return a;}
function pow(b,e,m){let a=1n;b%=m;while(e){if(e&1n)a=a*b%m;b=b*b%m;e>>=1n;}return a;}
function inverse(a,m){let [old,r,s,t]=[a,m,1n,0n];while(r){const q=old/r;[old,r]=[r,old-q*r];[s,t]=[t,s-q*t];}if(old!==1n)throw new Error('RSA inverse does not exist');return (s%m+m)%m;}
function randomBelow(n,random){const len=Math.ceil(n.toString(2).length/8),mask=255>>>(len*8-n.toString(2).length);for(;;){const b=random(len);b[0]&=mask;const x=big(b);if(x<n)return x;}}
const smallPrimes=[3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n,41n,43n,47n,53n,59n,61n,67n,71n,73n,79n,83n,89n,97n];
function probablePrime(n,random){
 if(!(n&1n)||smallPrimes.some(p=>n%p===0n))return false;let d=n-1n,s=0;while(!(d&1n)){d>>=1n;s++;}
 for(let i=0;i<32;i++){const a=randomBelow(n-3n,random)+2n;let x=pow(a,d,n);if(x===1n||x===n-1n)continue;let passed=false;for(let j=1;j<s;j++){x=x*x%n;if(x===n-1n){passed=true;break;}}if(!passed)return false;}return true;
}
function prime(bits,random){for(;;){const a=random(bits/8);a[0]|=0xc0;a[a.length-1]|=1;const n=big(a);if((n-1n)%65537n!==0n&&probablePrime(n,random))return n;}}
function der(tag,body){let length=body.length;const h=[];do{h.unshift(length&255);length>>>=8;}while(length);return cat(Uint8Array.of(tag),body.length<128?Uint8Array.of(body.length):Uint8Array.of(0x80|h.length,...h),body);}
function integer(n){let b=bytes(n,Math.max(1,Math.ceil(n.toString(2).length/8)));if(b[0]&128)b=cat(Uint8Array.of(0),b);return der(2,b);}
const seq=(...x)=>der(0x30,cat(...x));
const algorithm=Uint8Array.from([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00]);
function read(input){
 if(!(input instanceof Uint8Array)||input.length>16384)throw new Error('RSA DER input');
 const list=[];let at=0;while(at<input.length){if(at+2>input.length)throw new Error('RSA DER truncated header');const tag=input[at++];let len=input[at++];if(len&128){const n=len&127;if(!n||n>4||at+n>input.length||input[at]===0)throw new Error('RSA DER length');len=0;for(let i=0;i<n;i++)len=len*256+input[at++];if(len<128)throw new Error('RSA DER nonminimal length');}if(at+len>input.length)throw new Error('RSA DER truncated');list.push({tag,body:input.slice(at,at+len)});at+=len;}return list;
}
function sequence(input){const x=read(input);if(x.length!==1||x[0].tag!==0x30)throw new Error('RSA DER sequence');return read(x[0].body);}
function unsigned(x){if(x?.tag!==2||!x.body.length||(x.body[0]&128)||x.body.length>1&&x.body[0]===0&&!(x.body[1]&128))throw new Error('RSA DER integer');return big(x.body);}
function isAlgorithm(x){return x?.tag===0x30&&x.body.length===algorithm.length-2&&x.body.every((b,i)=>b===algorithm[i+2]);}
function validatePublic(k){if(![2048,3072,4096].includes(k.n.toString(2).length)||!(k.n&1n)||k.e<3n||!(k.e&1n)||k.e>=k.n)throw new Error('RSA public key bounds');return k;}
function privateParts(input){
 let fields=sequence(input);if(fields[2]?.tag===4){if(fields.length!==3||unsigned(fields[0])!==0n||!isAlgorithm(fields[1]))throw new Error('RSA PKCS8 algorithm');fields=sequence(fields[2].body);}
 if(fields.length!==9)throw new Error('RSA private fields');const v=fields.map(unsigned);if(v[0]!==0n)throw new Error('RSA multi-prime unsupported');const k=validatePublic({n:v[1],e:v[2],d:v[3],p:v[4],q:v[5],dp:v[6],dq:v[7],qi:v[8]});
 if(k.p<3n||k.q<3n||k.p===k.q||k.p*k.q!==k.n||k.d<1n||k.d>=k.n||k.dp!==k.d%(k.p-1n)||k.dq!==k.d%(k.q-1n)||k.q*k.qi%k.p!==1n||k.e*k.d%(k.p-1n)!==1n||k.e*k.d%(k.q-1n)!==1n)throw new Error('RSA private key consistency');return k;
}
function publicParts(input){let v=sequence(input);if(v[1]?.tag===3){if(v.length!==2||!isAlgorithm(v[0])||v[1].body[0]!==0)throw new Error('RSA SPKI algorithm');v=sequence(v[1].body.slice(1));}if(v.length!==2)throw new Error('RSA public fields');return validatePublic({n:unsigned(v[0]),e:unsigned(v[1])});}
export function rsaKeygen(bits,random){
 if(![2048,3072,4096].includes(bits))throw new RangeError('RSA modulus bits');let p=prime(bits/2,random),q;do{q=prime(bits/2,random);}while(q===p);if(p<q)[p,q]=[q,p];
 const n=p*q,e=65537n,d=inverse(e,(p-1n)*(q-1n)),dp=d%(p-1n),dq=d%(q-1n),qi=inverse(q,p);
 const pkcs1=seq(...[0n,n,e,d,p,q,dp,dq,qi].map(integer));return {privateKey:seq(integer(0n),algorithm,der(4,pkcs1)),publicKey:seq(algorithm,der(3,cat(Uint8Array.of(0),seq(integer(n),integer(e)))))};
}
function mgf(seed,len){const out=new Uint8Array(len);for(let at=0,i=0;at<len;at+=32,i++){const c=new Uint8Array(4);new DataView(c.buffer).setUint32(0,i,false);out.set(sha256(cat(seed,c)).slice(0,Math.min(32,len-at)),at);}return out;}
export function rsaPssSign(privateKey,message,random){
 const k=privateParts(privateKey),bits=k.n.toString(2).length-1,len=Math.ceil(bits/8),salt=random(32),h=sha256(cat(new Uint8Array(8),sha256(message),salt));const db=new Uint8Array(len-33);db[db.length-33]=1;db.set(salt,db.length-32);
 const mask=mgf(h,db.length),masked=db.map((x,i)=>x^mask[i]);masked[0]&=255>>>(len*8-bits);const m=big(cat(masked,h,Uint8Array.of(0xbc)));
 let r;do{r=randomBelow(k.n-2n,random)+2n;}while(r%k.p===0n||r%k.q===0n);const blinded=m*pow(r,k.e,k.n)%k.n;
 const a=pow(blinded%k.p,k.dp,k.p),b=pow(blinded%k.q,k.dq,k.q),signed=b+k.q*((k.qi*(a-b)%k.p+k.p)%k.p);
 return bytes(signed*inverse(r,k.n)%k.n,Math.ceil(k.n.toString(2).length/8));
}
export function rsaPssVerify(publicKey,message,signature){try{
 const k=publicParts(publicKey),bits=k.n.toString(2).length-1,len=Math.ceil(bits/8),modLen=Math.ceil(k.n.toString(2).length/8);
 if(signature.length!==modLen||big(signature)>=k.n)return false;const em=bytes(pow(big(signature),k.e,k.n),len);if(em[len-1]!==0xbc||len<66)return false;
 const h=em.slice(len-33,len-1),masked=em.slice(0,len-33),top=255>>>(len*8-bits);if(masked[0]&~top)return false;const mask=mgf(h,masked.length),db=masked.map((x,i)=>x^mask[i]);db[0]&=top;
 for(let i=0;i<db.length-33;i++)if(db[i]!==0)return false;if(db[db.length-33]!==1)return false;const expected=sha256(cat(new Uint8Array(8),sha256(message),db.slice(-32)));let diff=0;for(let i=0;i<32;i++)diff|=h[i]^expected[i];return diff===0;
 }catch{return false;}}
