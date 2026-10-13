// OS entropy boundary only. Hashes, signatures, KEMs and ciphers are scratch
// implementations. Never fall back to Math.random or a deterministic seed.
export function randomBytes(length){
 if(!Number.isSafeInteger(length)||length<0)throw new RangeError('Random byte length');
 if(!globalThis.crypto?.getRandomValues)throw new Error('OS cryptographic entropy is unavailable');
 const out=new Uint8Array(length);for(let at=0;at<length;at+=65536)globalThis.crypto.getRandomValues(out.subarray(at,Math.min(at+65536,length)));
 return typeof Buffer!=='undefined'?Buffer.from(out):out;
}
export function randomUUID(){const bytes=randomBytes(16);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');}
