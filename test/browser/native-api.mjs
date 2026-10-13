const {chromium}=await import(process.env.PB_PLAYWRIGHT_MODULE||'playwright-core');
import fs from 'node:fs/promises';
const root=process.env.PB_QA_ROOT||new URL('../../reports/browser-qa',import.meta.url).pathname,stamp=new Date().toISOString().replace(/[:.]/g,'-');
await fs.mkdir(root+'/scratch',{recursive:true});await fs.mkdir(root+'/artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PB_CHROME||'/usr/bin/google-chrome',headless:true,env:{...process.env,TMPDIR:root+'/scratch'},args:['--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{Object.defineProperty(crypto,'subtle',{get(){throw new Error('PLATFORM_CRYPTO_FORBIDDEN');}});});
await page.goto('file://'+new URL('../../proofbundle.html',import.meta.url).pathname+'');
await page.waitForFunction(()=>window.PB_SELFTEST&&window.PBLocalIdentity&&window.ProofBundle);
await page.waitForTimeout(800);
const result=await page.evaluate(async()=>{
 const identity=await PBLocalIdentity.identity();const tests=PB_SELFTEST;const checks=[];
 const message=utf8('browser native conformance');
 for(const parameter of ['ML-KEM-512','ML-KEM-768','ML-KEM-1024'])for(const cipher of ['ChaCha20-Poly1305','AES-256-GCM']){
  const keys=PBEncryption.keygen(parameter),envelope=PBEncryption.seal(message,keys.encapsKey,{parameter,cipher});const plaintext=PBEncryption.open(envelope,keys.decapsKey);
  checks.push({parameter,cipher,roundtrip:hexOf(plaintext)===hexOf(message)});envelope.tag_b64u=b64uEncode(new Uint8Array(16));let rejected=false;try{PBEncryption.open(envelope,keys.decapsKey);}catch{rejected=true;}checks.push({parameter,cipher,tampered_tag_rejected:rejected});
 }
 for(const [name,value] of [['duplicate','{"x":1,"x":2}'],['surrogate','{"x":"\\ud800"}']]){let rejected=false;try{parseNativeJSON(value);}catch{rejected=true;}checks.push({canonical_case:name,rejected});}
 const key=await sigKeygen('Dilithium2'),signature=await sigSign('Dilithium2',message,key.priv);checks.push({mldsa44:await sigVerify('Dilithium2',message,signature,key.pub)});
 return {identity,selftest:{total:tests.length,failed:tests.filter(x=>!x.ok)},checks,signingStatus:document.getElementById('aletheia-signing-status').textContent,body:document.body.innerText.slice(0,2200),overflow:document.documentElement.scrollWidth>innerWidth};
});
await page.screenshot({path:`${root}/artifacts/workspace-${stamp}.png`,fullPage:true});
await page.reload();await page.waitForFunction(()=>window.PBLocalIdentity);const after=await page.evaluate(()=>PBLocalIdentity.identity());result.identity_survives_reload=after.id===result.identity.id;
await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${root}/artifacts/mobile-${stamp}.png`,fullPage:true});result.mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
result.errors=errors;await fs.writeFile(`${root}/artifacts/check-app-${stamp}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
