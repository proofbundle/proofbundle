// Build inline, offline providers from the reviewed source modules. No library
// substitution or cryptographic native provider is introduced by this bundler.
import fs from 'node:fs';
import path from 'node:path';
import {sha256hex} from '../crypto/sha256.mjs';
const modules=[
 ['crypto/sha256.mjs',['sha224','sha256','sha256hex','createSHA256']],
 ['crypto/sha512.mjs',['sha384','sha512','sha512_224','sha512_256','createSHA384','createSHA512']],
 ['crypto/keccak.mjs',['sha3_224','sha3_256','sha3_384','sha3_512','shake128','shake256']],
 ['crypto/blake2.mjs',['blake2b','blake2s','createBlake2b']],['crypto/blake3.mjs',['blake3']],
 ['crypto/ed25519.mjs',['keyPairFromSeed','sign','verify']],
 ['crypto/ecdsa.mjs',['ecdsaKeygen','ecdsaSign','ecdsaVerify']],
 ['crypto/der.mjs',['wrapEcPrivate','unwrapEcPrivate']],
 ['crypto/rsa-pss.mjs',['rsaKeygen','rsaPssSign','rsaPssVerify']],
 ['crypto/hmac.mjs',['hmac','hmacSha256']],['crypto/hkdf.mjs',['hkdfSha256']],
 ['crypto/mlkem.mjs',['PARAMS','mlkemKeygen','mlkemEncapsulate','mlkemDecapsulate']],
 ['crypto/mldsa.mjs',['mldsaKeygen','mldsaSign','mldsaVerify']],
 ['crypto/x25519.mjs',['x25519Keygen','x25519Shared']],
 ['crypto/chacha20-poly1305.mjs',['chacha20poly1305Seal','chacha20poly1305Open','poly1305','chacha20Block']],
 ['crypto/aes256-gcm.mjs',['aes256gcmSeal','aes256gcmOpen']],
 ['src/bytes/utf8.mjs',['hasLoneSurrogate']],
 ['src/canonical/canonical-json.mjs',['canonicalizeObject','canonicalizeText','parseJSON']],
 ['src/encoding/base64url.mjs',['bytesToBase64url','base64urlToBytes']],
 ['crypto/aibom.mjs',['buildAibom','verifyAibom','canonical','gateNorm']],
];
const manifest=[];let output='const PB_CORE = Object.create(null);\n';
for(const [filename,exports] of modules){
 const source=fs.readFileSync(filename,'utf8');manifest.push({path:filename,sha256:sha256hex(source),exports});
 let code=source.replace(/^import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"];?/gm,(_all,names,relative)=>{
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(filename),relative));
  if(!modules.some(([p])=>p===target))throw new Error('Unbundled dependency '+target);
  return `const {${names.replace(/\bas\b/g,':')}} = PB_CORE[${JSON.stringify(target)}];`;
 });
 code=code.replace(/\nif\s*\(import\.meta\.url[\s\S]*$/,'');
 code=code.replace(/^export\s+(?=(?:async\s+)?function|const|let|class)/gm,'');
 if(/\bimport\s+|\bexport\s+|node:crypto|crypto\.subtle/.test(code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')))throw new Error('Unresolved native provider in '+filename);
 code=code.split('\n').map(line=>line.trimEnd()).join('\n');
 output+=`PB_CORE[${JSON.stringify(filename)}]=(()=>{\n${code}\nreturn {${exports.join(',')}};})();\n`;
}
output+='window.PB_CORE=PB_CORE;\n';
const htmlFile=process.argv[2]||'proofbundle.html';let html=fs.readFileSync(htmlFile,'utf8');
const embedded=`<!-- PB NATIVE CRYPTO START -->\n<script>\n${output.replace(/<\/script/gi,'<\\/script')}\n</script>\n<!-- PB NATIVE CRYPTO END -->`;
if(html.includes('<!-- PB NATIVE CRYPTO START -->'))html=html.replace(/<!-- PB NATIVE CRYPTO START -->[\s\S]*?<!-- PB NATIVE CRYPTO END -->/,()=>embedded);
else html=html.replace('</head>',()=>embedded+'\n</head>');
if(!html.includes('window.PB_CORE=PB_CORE'))throw new Error('Native embedding anchor not found');
fs.writeFileSync(htmlFile,html);fs.writeFileSync('CRYPTO_SOURCE_MANIFEST.json',JSON.stringify({schema:'ProofBundleCryptoSourceManifest/v1',modules:manifest},null,2)+'\n');
console.log('Embedded '+modules.length+' source modules into '+htmlFile);
