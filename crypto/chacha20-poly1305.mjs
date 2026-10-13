// Scratch RFC 8439 ChaCha20, Poly1305, and AEAD_CHACHA20_POLY1305.
// No platform cipher/MAC provider. BigInt arithmetic has no constant-time claim.
const rotl=(x,n)=>((x<<n)|(x>>>(32-n)))>>>0;
function bytes(name,x,n){if(!(x instanceof Uint8Array)||n!==undefined&&x.length!==n)throw new TypeError(`${name}: expected ${n??''} bytes`);}
export function quarterRound(s,a,b,c,d){
 s[a]=(s[a]+s[b])>>>0;s[d]=rotl(s[d]^s[a],16);
 s[c]=(s[c]+s[d])>>>0;s[b]=rotl(s[b]^s[c],12);
 s[a]=(s[a]+s[b])>>>0;s[d]=rotl(s[d]^s[a],8);
 s[c]=(s[c]+s[d])>>>0;s[b]=rotl(s[b]^s[c],7);
}
export function chacha20Block(key,nonce,counter=0){
 bytes('key',key,32);bytes('nonce',nonce,12);
 if(!Number.isInteger(counter)||counter<0||counter>0xffffffff)throw new RangeError('ChaCha20 counter exhausted');
 const initial=new Uint32Array(16);initial.set([0x61707865,0x3320646e,0x79622d32,0x6b206574]);
 const k=new DataView(key.buffer,key.byteOffset,key.byteLength),n=new DataView(nonce.buffer,nonce.byteOffset,nonce.byteLength);
 for(let i=0;i<8;i++)initial[4+i]=k.getUint32(i*4,true);
 initial[12]=counter;for(let i=0;i<3;i++)initial[13+i]=n.getUint32(i*4,true);
 const s=initial.slice();for(let i=0;i<10;i++){
  quarterRound(s,0,4,8,12);quarterRound(s,1,5,9,13);quarterRound(s,2,6,10,14);quarterRound(s,3,7,11,15);
  quarterRound(s,0,5,10,15);quarterRound(s,1,6,11,12);quarterRound(s,2,7,8,13);quarterRound(s,3,4,9,14);
 }
 const out=new Uint8Array(64),view=new DataView(out.buffer);
 for(let i=0;i<16;i++)view.setUint32(i*4,(s[i]+initial[i])>>>0,true);return out;
}
export function chacha20(key,nonce,input,counter=1){
 bytes('input',input);if(!Number.isInteger(counter)||counter<0||counter+Math.ceil(input.length/64)>0x100000000)throw new RangeError('ChaCha20 counter exhausted');
 const out=new Uint8Array(input.length);
 for(let at=0;at<input.length;at+=64){const block=chacha20Block(key,nonce,counter++);for(let j=0;j<Math.min(64,input.length-at);j++)out[at+j]=input[at+j]^block[j];}return out;
}
function little(x){let n=0n;for(let i=x.length-1;i>=0;i--)n=n*256n+BigInt(x[i]);return n;}
export function poly1305(message,key){
 bytes('message',message);bytes('Poly1305 key',key,32);
 const r=little(key.slice(0,16))&0x0ffffffc0ffffffc0ffffffc0fffffffn,s=little(key.slice(16)),p=(1n<<130n)-5n;
 let a=0n;for(let i=0;i<message.length;i+=16){const b=message.slice(i,i+16);a=((a+little(b)+(1n<<BigInt(8*b.length)))*r)%p;}
 let tag=(a+s)&((1n<<128n)-1n);const out=new Uint8Array(16);for(let i=0;i<16;i++){out[i]=Number(tag&255n);tag>>=8n;}return out;
}
function macInput(aad,ciphertext){
 const a=Math.ceil(aad.length/16)*16,c=Math.ceil(ciphertext.length/16)*16,out=new Uint8Array(a+c+16);
 out.set(aad);out.set(ciphertext,a);const v=new DataView(out.buffer);v.setBigUint64(a+c,BigInt(aad.length),true);v.setBigUint64(a+c+8,BigInt(ciphertext.length),true);return out;
}
export function chacha20poly1305Seal(key,nonce,plaintext,aad=new Uint8Array()){
 bytes('AAD',aad);const ciphertext=chacha20(key,nonce,plaintext,1);
 return {ciphertext,tag:poly1305(macInput(aad,ciphertext),chacha20Block(key,nonce,0).slice(0,32))};
}
export function chacha20poly1305Open(key,nonce,ciphertext,tag,aad=new Uint8Array()){
 bytes('AAD',aad);bytes('tag',tag,16);bytes('ciphertext',ciphertext);
 const expected=poly1305(macInput(aad,ciphertext),chacha20Block(key,nonce,0).slice(0,32));let difference=0;
 for(let i=0;i<16;i++)difference|=tag[i]^expected[i];
 if(difference)throw new Error('AEAD authentication failed');return chacha20(key,nonce,ciphertext,1);
}
