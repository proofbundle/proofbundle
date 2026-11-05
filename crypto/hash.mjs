// Streaming scratch hashes with a transport-compatible update/digest API.
import {createSHA256} from './sha256.mjs';
import {createSHA384,createSHA512} from './sha512.mjs';
import {createBlake2b} from './blake2.mjs';
const implementations={sha256:createSHA256,sha384:createSHA384,sha512:createSHA512,blake2b512:createBlake2b};
export function createHash(name){
 const factory=implementations[name];if(!factory)throw new Error('Unimplemented scratch streaming hash: '+name);const hash=factory();
 return {update(input){if(typeof input!=='string'&&!(input instanceof Uint8Array))throw new TypeError('Hash input must be UTF-8 text or bytes');hash.update(typeof input==='string'?new TextEncoder().encode(input):input);return this;},digest(encoding){const result=hash.digest();if(encoding==='hex')return Array.from(result,b=>b.toString(16).padStart(2,'0')).join('');if(encoding!==undefined)throw new Error('Unsupported digest encoding');return typeof Buffer!=='undefined'?Buffer.from(result):result;}};
}
