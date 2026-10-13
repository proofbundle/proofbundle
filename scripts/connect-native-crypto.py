#!/usr/bin/env python3
"""Connect application dispatch to the independently embedded source modules."""
from pathlib import Path
import re
p=Path('proofbundle.html');html=p.read_text(encoding='utf-8-sig')
def replace_function(name,body):
 global html
 pattern=re.compile(r'(?m)^(?:async )?function '+re.escape(name)+r'\([^\n]*\)\s*\{')
 m=pattern.search(html)
 if not m:raise RuntimeError('Missing function '+name)
 at=m.end();depth=1;quote=None;escape=False;comment=None
 while at<len(html) and depth:
  ch=html[at];next=html[at:at+2]
  if comment=='line':
   if ch=='\n':comment=None
  elif comment=='block':
   if next=='*/':comment=None;at+=1
  elif quote:
   if escape:escape=False
   elif ch=='\\':escape=True
   elif ch==quote:quote=None
  elif next=='//':comment='line';at+=1
  elif next=='/*':comment='block';at+=1
  elif ch in "'\"`":quote=ch
  elif ch=='{':depth+=1
  elif ch=='}':depth-=1
  at+=1
 if depth:raise RuntimeError('Unclosed function '+name)
 html=html[:m.start()]+body+html[at:]
replace_function('ed25519Generate',"""async function ed25519Generate() {
 const seed = nativeRandom(32), kp = PB_CORE['crypto/ed25519.mjs'].keyPairFromSeed(seed);
 return {seed, pubRaw:kp.publicKey, privateKey:seed, publicKey:kp.publicKey};
}""")
replace_function('ed25519Sign',"""async function ed25519Sign(message, privateKey) {
 if(!(privateKey instanceof Uint8Array)) throw new TypeError('Ed25519 requires raw seed bytes');
 return PB_CORE['crypto/ed25519.mjs'].sign(message, privateKey);
}""")
replace_function('ed25519Verify',"""async function ed25519Verify(message, signature, publicKey) {
 return PB_CORE['crypto/ed25519.mjs'].verify(signature, message, publicKey);
}""")
replace_function('_checkEd25519Support',"""async function _checkEd25519Support() {
 _edFallback.checked=true;_edFallback.active=false;_edFallback.reason='';
}""")
replace_function('canonicalJSON',"""function canonicalJSON(object) {
 return new TextDecoder().decode(PB_CORE['src/canonical/canonical-json.mjs'].canonicalizeObject(object));
}""")
replace_function('digestBytes',"""async function digestBytes(algId,data) {
 const bytes=data instanceof Uint8Array?data:utf8(String(data));
 const table={
  'SHA-256':PB_CORE['crypto/sha256.mjs'].sha256,
  'SHA-384':PB_CORE['crypto/sha512.mjs'].sha384,'SHA-512':PB_CORE['crypto/sha512.mjs'].sha512,
  'SHA3-256':PB_CORE['crypto/keccak.mjs'].sha3_256,'SHA3-384':PB_CORE['crypto/keccak.mjs'].sha3_384,'SHA3-512':PB_CORE['crypto/keccak.mjs'].sha3_512,
  'BLAKE2b':PB_CORE['crypto/blake2.mjs'].blake2b,'BLAKE2s':PB_CORE['crypto/blake2.mjs'].blake2s,'BLAKE3':PB_CORE['crypto/blake3.mjs'].blake3};
 if(!table[algId])throw new Error('Unknown digest algorithm: '+algId);return table[algId](bytes);
}""")
replace_function('sigKeygen',"""async function sigKeygen(algId) {
 const info=sigInfo(algId);if(!info)throw new Error('Unknown signature algorithm: '+algId);
 if(algId==='Ed25519'){const kp=await ed25519Generate();return {alg:algId,priv:b64uEncode(kp.seed),pub:b64uEncode(kp.pubRaw)};}
 if(info.curve){const length={'P-256':32,'P-384':48,'P-521':66}[info.curve];let kp,secret;
  do{secret=nativeRandom(length);if(info.curve==='P-521')secret[0]&=1;try{kp=PB_CORE['crypto/ecdsa.mjs'].ecdsaKeygen(secret,info.curve);}catch{kp=null;}}while(!kp);
  return {alg:algId,priv:b64uEncode(PB_CORE['crypto/der.mjs'].wrapEcPrivate(secret,info.curve)),pub:b64uEncode(kp.publicKey)};}
 if(info.modulus){const kp=PB_CORE['crypto/rsa-pss.mjs'].rsaKeygen(info.modulus,nativeRandom);return {alg:algId,priv:b64uEncode(kp.privateKey),pub:b64uEncode(kp.publicKey)};}
 if(algId==='Dilithium2'){const kp=PB_CORE['crypto/mldsa.mjs'].mldsaKeygen(nativeRandom(32));return {alg:algId,priv:b64uEncode(kp.privateKey),pub:b64uEncode(kp.publicKey)};}
 if(info.pbx){const kp=PBX[info.pbx].keygen();return {alg:algId,priv:b64uEncode(kp.secretKey),pub:b64uEncode(kp.publicKey)};}
 throw new Error('Unimplemented signature: '+algId);
}""")
replace_function('sigSign',"""async function sigSign(algId,message,privB64u) {
 const info=sigInfo(algId),secret=b64uDecode(privB64u);if(!info)throw new Error('Unknown signature algorithm');
 if(algId==='Ed25519')return PB_CORE['crypto/ed25519.mjs'].sign(message,secret);
 if(info.curve)return PB_CORE['crypto/ecdsa.mjs'].ecdsaSign(PB_CORE['crypto/der.mjs'].unwrapEcPrivate(secret,info.curve),message,info.curve).raw;
 if(info.modulus)return PB_CORE['crypto/rsa-pss.mjs'].rsaPssSign(secret,message,nativeRandom);
 if(algId==='Dilithium2')return PB_CORE['crypto/mldsa.mjs'].mldsaSign(secret,message,nativeRandom(32));
 if(info.pbx)return PBX[info.pbx].sign(message,secret);throw new Error('Unimplemented signature');
}""")
replace_function('sigVerify',"""async function sigVerify(algId,message,signature,pubB64u) {
 try{const info=sigInfo(algId),pub=b64uDecode(pubB64u);if(!info)return false;
  if(algId==='Ed25519')return PB_CORE['crypto/ed25519.mjs'].verify(signature,message,pub);
  if(info.curve)return PB_CORE['crypto/ecdsa.mjs'].ecdsaVerify(pub,message,signature,info.curve);
  if(info.modulus)return PB_CORE['crypto/rsa-pss.mjs'].rsaPssVerify(pub,message,signature);
  if(algId==='Dilithium2')return PB_CORE['crypto/mldsa.mjs'].mldsaVerify(pub,message,signature);
  if(info.pbx)return PBX[info.pbx].verify(signature,message,pub);
 }catch{return false;}return false;
}""")
replace_function('probeCapabilities',"""async function probeCapabilities() {
 const caps={};for(const d of PB_DIGESTS){try{await digestBytes(d.id,utf8('probe'));caps[d.id]=true;}catch{caps[d.id]=false;}}
 for(const s of PB_SIGS)caps[s.id]=s.pbx?!!PBX[s.pbx]:true;return caps;
}""")
replace_function('rfc3161ExtractGenTime',"""function rfc3161ExtractGenTime(respBytes) {
 // RFC3161/CMS verification is not implemented. Preserve the response as
 // evidence, but do not derive a timestamp from arbitrary matching bytes.
 return null;
}""")
html=html.replace('badge badge-green\">TSA token received','badge badge-orange\">TSA response unverified')
html=html.replace('.tsr downloaded (genTime not parsed inline)', '.tsr downloaded · CMS signature, imprint and trust chain not verified')
# SHA-512 in the retained legacy Ed25519 KAT engine is also scratch-backed.
html=html.replace("const h = await crypto.subtle.digest('SHA-512', data);", "const h = PB_CORE['crypto/sha512.mjs'].sha512(data);")
html=html.replace("engine:'webcrypto'", "engine:'proofbundle'")
html=html.replace("{ id:'BLAKE2b',  bits:512, family:'BLAKE', engine:'noble'", "{ id:'BLAKE2b',  bits:512, family:'BLAKE', engine:'proofbundle'")
html=html.replace("{ id:'BLAKE2s',  bits:256, family:'BLAKE', engine:'noble'", "{ id:'BLAKE2s',  bits:256, family:'BLAKE', engine:'proofbundle'")
html=html.replace("{ id:'BLAKE3',   bits:256, family:'BLAKE', engine:'noble'", "{ id:'BLAKE3',   bits:256, family:'BLAKE', engine:'proofbundle'")
html=html.replace("{ id:'Dilithium2',   type:'post-quantum', secBits:128, engine:'noble'", "{ id:'Dilithium2',   type:'post-quantum', secBits:128, engine:'proofbundle'")
html=html.replace("d.engine === 'webcrypto' ? 'WebCrypto' : 'noble (audited)'", "d.engine === 'proofbundle' ? 'Scratch source' : 'Bundled provider'")
html=html.replace("s.engine === 'webcrypto' ? 'WebCrypto' : 'noble (audited)'", "s.engine === 'proofbundle' ? 'Scratch source' : 'Bundled provider'")
helpers="""function nativeRandom(length) {
 const out=new Uint8Array(length);if(!globalThis.crypto?.getRandomValues)throw new Error('OS entropy is unavailable');
 for(let at=0;at<length;at+=65536)crypto.getRandomValues(out.subarray(at,Math.min(at+65536,length)));return out;
}
function parseNativeJSON(text){return PB_CORE['src/canonical/canonical-json.mjs'].parseJSON(text);}
"""
if 'function nativeRandom(' not in html:html=html.replace('function canonicalJSON(object)',helpers+'\nfunction canonicalJSON(object)')
# Only executable JS is changed; native source data in JSON script blocks stays
# byte-identical. Strict parsing is shared by receipts, manifests and imports.
def strict_script(m):
 if re.search(r'type=[\"\']application/json',m[1],re.I):return m[0]
 return m[1]+m[2].replace('JSON.parse(', 'parseNativeJSON(')+m[3]
html=re.sub(r'(<script\b[^>]*>)([\s\S]*?)(</script>)',strict_script,html)
if re.search(r'crypto\.subtle\.(?:digest|sign|verify|generateKey|importKey|exportKey)',html):raise RuntimeError('Platform cryptography remains in application')
p.write_text(html,encoding='utf-8')
print('Application dispatch uses scratch providers and strict canonical JSON.')
