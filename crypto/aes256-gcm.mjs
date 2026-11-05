// Scratch AES-256 (FIPS 197) and 96-bit-IV/128-bit-tag GCM (SP 800-38D).
// Byte-table/BigInt executable specification; no constant-time guarantee.
function bytes(name,x,n){if(!(x instanceof Uint8Array)||n!==undefined&&x.length!==n)throw new TypeError(`${name}: expected ${n??''} bytes`);}
function mul(a,b){let r=0;for(let i=0;i<8;i++){if(b&1)r^=a;a=((a<<1)^((a&128)?0x11b:0))&255;b>>>=1;}return r;}
function power(a,n){let r=1;while(n){if(n&1)r=mul(r,a);a=mul(a,a);n>>>=1;}return r;}
const sbox=Uint8Array.from({length:256},(_,i)=>{const x=i?power(i,254):0;let y=x^0x63;for(let j=1;j<=4;j++)y^=((x<<j)|(x>>>(8-j)))&255;return y;});
function schedule(key){
 bytes('AES-256 key',key,32);const out=new Uint8Array(240);out.set(key);let rcon=1;
 for(let at=32;at<240;at+=4){let t=out.slice(at-4,at);
  if(at%32===0){t=Uint8Array.of(sbox[t[1]]^rcon,sbox[t[2]],sbox[t[3]],sbox[t[0]]);rcon=mul(rcon,2);}
  else if(at%32===16)t=t.map(x=>sbox[x]);for(let j=0;j<4;j++)out[at+j]=out[at-32+j]^t[j];
 }return out;
}
function block(input,expanded){
 bytes('AES block',input,16);let s=input.slice();for(let j=0;j<16;j++)s[j]^=expanded[j];
 for(let round=1;round<=14;round++){
  const old=s.map(x=>sbox[x]);s=new Uint8Array(16);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++)s[row+col*4]=old[row+((col+row)%4)*4];
  if(round<14)for(let col=0;col<4;col++){const i=col*4,a=s.slice(i,i+4);s[i]=mul(a[0],2)^mul(a[1],3)^a[2]^a[3];s[i+1]=a[0]^mul(a[1],2)^mul(a[2],3)^a[3];s[i+2]=a[0]^a[1]^mul(a[2],2)^mul(a[3],3);s[i+3]=mul(a[0],3)^a[1]^a[2]^mul(a[3],2);}
  for(let j=0;j<16;j++)s[j]^=expanded[round*16+j];
 }return s;
}
export function aes256EncryptBlock(key,input){return block(input,schedule(key));}
function big(x){let n=0n;for(const b of x)n=n*256n+BigInt(b);return n;}
function bigBytes(n){const out=new Uint8Array(16);for(let i=15;i>=0;i--){out[i]=Number(n&255n);n>>=8n;}return out;}
function gmul(x,y){let z=0n,v=y;for(let i=127n;i>=0n;i--){if((x>>i)&1n)z^=v;v=(v>>1n)^((v&1n)?0xe1000000000000000000000000000000n:0n);}return z;}
function ghash(h,aad,ciphertext){
 let y=0n;for(const data of [aad,ciphertext])for(let at=0;at<data.length;at+=16){const b=new Uint8Array(16);b.set(data.slice(at,at+16));y=gmul(y^big(b),h);}
 const lengths=new Uint8Array(16),v=new DataView(lengths.buffer);v.setBigUint64(0,BigInt(aad.length)*8n,false);v.setBigUint64(8,BigInt(ciphertext.length)*8n,false);return bigBytes(gmul(y^big(lengths),h));
}
function crypt(expanded,nonce,input){
 bytes('GCM nonce',nonce,12);bytes('input',input);if(Math.ceil(input.length/16)>0xfffffffe)throw new RangeError('GCM counter exhausted');
 const counter=new Uint8Array(16);counter.set(nonce);const v=new DataView(counter.buffer);const out=new Uint8Array(input.length);
 for(let at=0,i=2;at<input.length;at+=16,i++){v.setUint32(12,i,false);const k=block(counter,expanded);for(let j=0;j<Math.min(16,input.length-at);j++)out[at+j]=input[at+j]^k[j];}return out;
}
function auth(expanded,nonce,aad,ciphertext){
 bytes('GCM nonce',nonce,12);bytes('AAD',aad);const j0=new Uint8Array(16);j0.set(nonce);j0[15]=1;
 const mask=block(j0,expanded),tag=ghash(big(block(new Uint8Array(16),expanded)),aad,ciphertext);return tag.map((x,i)=>x^mask[i]);
}
export function aes256gcmSeal(key,nonce,plaintext,aad=new Uint8Array()){
 const expanded=schedule(key),ciphertext=crypt(expanded,nonce,plaintext);return {ciphertext,tag:auth(expanded,nonce,aad,ciphertext)};
}
export function aes256gcmOpen(key,nonce,ciphertext,tag,aad=new Uint8Array()){
 bytes('GCM tag',tag,16);bytes('ciphertext',ciphertext);const expanded=schedule(key),expected=auth(expanded,nonce,aad,ciphertext);let diff=0;
 for(let i=0;i<16;i++)diff|=tag[i]^expected[i];if(diff)throw new Error('AEAD authentication failed');return crypt(expanded,nonce,ciphertext);
}
