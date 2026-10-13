// Platform crypto is an independent test oracle, never a production provider.
import assert from 'node:assert/strict';
import {createHash,createCipheriv,createPublicKey,createPrivateKey,verify,sign,generateKeyPairSync,randomBytes} from 'node:crypto';
import {sha224,sha256} from './sha256.mjs';
import {sha384,sha512,sha512_224,sha512_256} from './sha512.mjs';
import {quarterRound,chacha20Block,poly1305,chacha20poly1305Seal,chacha20poly1305Open} from './chacha20-poly1305.mjs';
import {aes256EncryptBlock,aes256gcmSeal,aes256gcmOpen} from './aes256-gcm.mjs';
import {ecdsaKeygen,ecdsaSign,ecdsaVerify} from './ecdsa.mjs';
import {rsaKeygen,rsaPssSign,rsaPssVerify} from './rsa-pss.mjs';
import {wrapEcPrivate,unwrapEcPrivate} from './der.mjs';
import {verify as edVerify} from './ed25519.mjs';
const fromHex=s=>new Uint8Array(Buffer.from(s,'hex')),hex=b=>Buffer.from(b).toString('hex');let checks=0;
const identityKey=new Uint8Array(32);identityKey[0]=1;const forged=new Uint8Array(64);forged[0]=1;assert.equal(edVerify(forged,new Uint8Array(),identityKey),false);checks++;
function eq(a,b){assert.equal(hex(a),typeof b==='string'?b:hex(b));checks++;}
const state=Uint32Array.of(0x11111111,0x01020304,0x9b8d6f43,0x01234567);quarterRound(state,0,1,2,3);assert.deepEqual(Array.from(state),[0xea2a92f4,0xcb1cf8ce,0x4581472e,0x5881c4bb]);checks++;
eq(chacha20Block(fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),fromHex('000000090000004a00000000'),1),'10f1e7e4d13b5915500fdd1fa32071c4c7d1f4c733c068030422aa9ac3d46c4ed2826446079faa0914c2d705d98b02a2b5129cd1de164eb9cbd083e8a2503c4e');
eq(poly1305(new TextEncoder().encode('Cryptographic Forum Research Group'),fromHex('85d6be7857556d337f4452fe42d506a80103808afb0db2fd4abff6af4149f51b')),'a8061dc1305136c6c22b8baf0c0127a9');
eq(aes256EncryptBlock(fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'),fromHex('00112233445566778899aabbccddeeff')),'8ea2b7ca516745bfeafc49904b496089');
eq(aes256gcmSeal(new Uint8Array(32),new Uint8Array(12),new Uint8Array()).tag,'530f8afbc74536b9a963b4f1c4cb738b');
const zero=aes256gcmSeal(new Uint8Array(32),new Uint8Array(12),new Uint8Array(16));eq(zero.ciphertext,'cea7403d4d606b6e074ec5d3baf39d18');eq(zero.tag,'d0d1c8a799996bf0265b98b5d48ab919');
for(const [name,fn] of [['sha224',sha224],['sha256',sha256],['sha384',sha384],['sha512',sha512],['sha512-224',sha512_224],['sha512-256',sha512_256]])for(const len of [0,3,55,56,63,64,111,112,127,128,257]){const data=new Uint8Array(randomBytes(len));eq(fn(data),createHash(name).update(data).digest());}
for(const [name,seal,open] of [['chacha20-poly1305',chacha20poly1305Seal,chacha20poly1305Open],['aes-256-gcm',aes256gcmSeal,aes256gcmOpen]])for(const len of [0,1,15,16,17,63,64,65,1024]){
 const key=new Uint8Array(randomBytes(32)),nonce=new Uint8Array(randomBytes(12)),message=new Uint8Array(randomBytes(len)),aad=new Uint8Array(randomBytes(23));
 const native=seal(key,nonce,message,aad),reference=createCipheriv(name,key,nonce,{authTagLength:16});reference.setAAD(aad);eq(native.ciphertext,Buffer.concat([reference.update(message),reference.final()]));eq(native.tag,reference.getAuthTag());eq(open(key,nonce,native.ciphertext,native.tag,aad),message);
 for(const field of ['tag','ciphertext','aad','nonce']){const changed={tag:native.tag.slice(),ciphertext:native.ciphertext.slice(),aad:aad.slice(),nonce:nonce.slice()};if(!changed[field].length)continue;changed[field][0]^=1;assert.throws(()=>open(key,changed.nonce,changed.ciphertext,changed.tag,changed.aad),/authentication/);checks++;}
}
for(const curve of ['P-256','P-384','P-521']){
 const len={'P-256':32,'P-384':48,'P-521':66}[curve],secret=new Uint8Array(len);secret[len-1]=7;const kp=ecdsaKeygen(secret,curve),message=new TextEncoder().encode('native ECDSA interoperability'),der=wrapEcPrivate(secret,curve),privateKey=createPrivateKey({key:Buffer.from(der),format:'der',type:'pkcs8'}),hash={'P-256':'sha256','P-384':'sha384','P-521':'sha512'}[curve];
 eq(unwrapEcPrivate(der,curve),secret);assert(verify(hash,message,{key:createPublicKey(privateKey),dsaEncoding:'ieee-p1363'},ecdsaSign(secret,message,curve).raw));checks++;
 assert(ecdsaVerify(kp.publicKey,message,new Uint8Array(sign(hash,message,{key:privateKey,dsaEncoding:'ieee-p1363'})),curve));checks++;
}
const message=new TextEncoder().encode('native RSA-PSS interoperability'),oracle=generateKeyPairSync('rsa',{modulusLength:2048}),priv=new Uint8Array(oracle.privateKey.export({format:'der',type:'pkcs8'})),pub=new Uint8Array(oracle.publicKey.export({format:'der',type:'spki'}));
const signature=rsaPssSign(priv,message,n=>new Uint8Array(randomBytes(n)));assert(verify('sha256',message,{key:oracle.publicKey,padding:6,saltLength:32},signature));checks++;
assert(rsaPssVerify(pub,message,new Uint8Array(sign('sha256',message,{key:oracle.privateKey,padding:6,saltLength:32}))));checks++;
signature[0]^=1;assert.equal(rsaPssVerify(pub,message,signature),false);checks++;
console.log(JSON.stringify({suite:'native-profile',checks,failed:0,reference_role:'test-only independent oracle',published_vectors:['RFC 8439 sections 2.1.1/2.3.2/2.5.2','FIPS 197 AES-256','SP 800-38D GCM']},null,2));
