#!/usr/bin/env node
// Audit a complete gsutil ls -rL listing against downloaded bytes. Every run
// creates a new manifest directory; no prior evidence or object is rewritten.
import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,lstat,open,readFile,stat} from 'node:fs/promises';
import {basename,join,relative,resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {canonicalizeText} from '../src/canonical/canonical-json.mjs';

const sha = data => createHash('sha256').update(data).digest('hex');
const canonical = value => Buffer.from(canonicalizeText(JSON.stringify(value)));
const options = new Map();
for(let i=2;i<process.argv.length;i+=2){
  const name=process.argv[i], value=process.argv[i+1];
  if(!name?.startsWith('--')||value===undefined)throw Error('Expected --name value pairs');
  options.set(name.slice(2),value);
}
const required=name=>{const value=options.get(name);if(!value)throw Error('Missing --'+name);return value;};
const bucket=required('bucket');
if(!/^[a-z0-9][a-z0-9._-]{2,221}$/.test(bucket))throw Error('Invalid bucket name');
const listing=resolve(required('metadata'));
const objects=resolve(required('objects'));
const output=resolve(required('out'));
const stamp=options.get('stamp')==='yes';
if(options.has('stamp')&&!['yes','no'].includes(options.get('stamp')))throw Error('--stamp expects yes or no');
const chunkSize=10000, otsBatchSize=2000;

async function* entries(){
  const stream=createReadStream(listing,{encoding:'utf8'});
  const lines=createInterface({input:stream,crlfDelay:Infinity});
  let current=null,total=null,seen=0,prefixes=0;
  for await(const line of lines){
    if(line.startsWith('gs://')){
      if(current){ if(current.prefix_header&&!current.size_gcs){prefixes++;} else {delete current.prefix_header;seen++;yield current;} }
      if(!line.endsWith(':'))throw Error('Malformed object header after '+seen+' entries');
      const uri=line.slice(0,-1), prefix='gs://'+bucket+'/';
      if(!uri.startsWith(prefix))throw Error('Unexpected bucket in metadata: '+uri);
      const key=uri.slice(prefix.length);
      // 2026-10-16 (lane claudicus-max1, after lane deepseek-v4-pro's step-B failure "Unsafe object key: ALIB90/"):
      // `gsutil ls -L -r` emits a header for every prefix ("gs://b/dir/:" followed by a blank line, no metadata).
      // Those are not objects and are not counted in the TOTAL line; they are recorded as prefixes and skipped.
      // A key ending in "/" that DOES carry metadata is a real zero-byte placeholder object and is kept.
      if(key.endsWith('/')){
        const inner=key.slice(0,-1);
        if(inner.includes('\0')||inner.split('/').some(part=>part===''||part==='.'||part==='..'))throw Error('Unsafe object key: '+key);
        current={bucket,object_path:key,source_uri:uri,prefix_header:true};
        continue;
      }
      if(!key||key.includes('\0')||key.split('/').some(part=>part===''||part==='.'||part==='..'))throw Error('Unsafe object key: '+key);
      current={bucket,object_path:key,source_uri:uri};
    }else if(line.startsWith('TOTAL:')){
      if(current){ if(current.prefix_header&&!current.size_gcs){prefixes++;} else {delete current.prefix_header;seen++;yield current;} current=null;}
      const match=/^TOTAL:\s+(\d+)\s+objects,\s+(\d+)\s+bytes/.exec(line);
      if(!match)throw Error('Malformed gsutil total line');
      total=Number(match[1]);
    }else if(current){
      const match=/^\s+([^:]+):\s*(.*?)\s*$/.exec(line);
      if(match){
        const names={'Creation time':'created_at_gcs','Update time':'updated_at_gcs','Content-Length':'size_gcs','Hash (md5)':'md5_gcs_b64','Hash (crc32c)':'crc32c_gcs_b64','Generation':'generation_gcs','ETag':'etag_gcs'};
        const field=names[match[1]];if(field)current[field]=match[2];
      }
    }
  }
  if(current)throw Error('Metadata listing ended without TOTAL; partial run rejected');
  if(total===null||total!==seen)throw Error('Metadata count mismatch: listed '+seen+', summary '+total+', prefix headers skipped '+prefixes);
  console.error(JSON.stringify({listing_objects:seen,prefix_headers_skipped:prefixes,summary_total:total}));
}

async function fileDigests(path){
  const h=createHash('sha256'),md5=createHash('md5');let bytes=0;
  for await(const block of createReadStream(path)){h.update(block);md5.update(block);bytes+=block.length;}
  return {sha256:h.digest('hex'),md5_b64:md5.digest('base64'),bytes};
}
async function objectFile(key){
  const candidate=resolve(objects,key);
  if(candidate===objects||!candidate.startsWith(objects+sep)||relative(objects,candidate).startsWith('..'))throw Error('Object escaped destination');
  let path=objects;
  for(const part of key.split('/')){
    path=join(path,part);
    const info=await lstat(path);
    if(info.isSymbolicLink())throw Error('Object path contains symlink');
  }
  return candidate;
}
async function audit(entry){
  const observed_at=new Date().toISOString();
  const base={schema:'ProofBundleGcsObject/v1',bucket,object_path:entry.object_path,
    gcs:{source_uri:entry.source_uri,created_at:entry.created_at_gcs??null,
      updated_at:entry.updated_at_gcs??null,size:entry.size_gcs??null,
      md5_b64:entry.md5_gcs_b64??null,crc32c_b64:entry.crc32c_gcs_b64??null,
      generation:entry.generation_gcs??null,etag:entry.etag_gcs??null},
    local_observed_at:observed_at};
  try{
    const path=await objectFile(entry.object_path), info=await stat(path);
    if(!info.isFile())throw Error('Local object is not a regular file');
    const hashes=await fileDigests(path),sameSize=String(hashes.bytes)===entry.size_gcs;
    const sameMd5=!entry.md5_gcs_b64||hashes.md5_b64===entry.md5_gcs_b64;
    return {record:{...base,local:{relative_path:join(bucket,entry.object_path),bytes:hashes.bytes,sha256:hashes.sha256,md5_b64:hashes.md5_b64},
      outcome:sameSize&&sameMd5?'matched':'mismatch',checks:{size:sameSize,md5:sameMd5}},path,matched:sameSize&&sameMd5};
  }catch(error){
    if(error.code==='ENOENT')return {record:{...base,outcome:'missing',gap:'local object absent'},matched:false};
    return {record:{...base,outcome:'error',gap:error.message},matched:false};
  }
}
async function otsStamp(files,log){
  if(!files.length)return;
  const unstamped=[];
  for(const file of files){
    try{await stat(file.path+'.ots');file.record.ots={status:'existing_unverified',receipt:file.path+'.ots'};}
    catch(error){if(error.code!=='ENOENT')throw error;unstamped.push(file);}
  }
  if(!stamp){for(const file of unstamped)file.record.ots={status:'not_submitted'};return;}
  async function invoke(batch){
    const result=await new Promise((done,reject)=>{
      const child=spawn('ots',['stamp',...batch.map(file=>file.path)],{stdio:['ignore','pipe','pipe']});
      let message='';for(const pipe of [child.stdout,child.stderr])pipe.on('data',block=>{message+=block.toString();if(message.length>65536)message=message.slice(-65536);});
      child.on('error',reject);child.on('close',code=>done({code,message}));
    });
    await log.writeFile('batch '+batch.length+' exit '+result.code+' '+result.message+'\n');
    return result;
  }
  if(unstamped.length){
    const first=await invoke(unstamped);
    if(first.code!==0){const retry=[];for(const file of unstamped){try{await stat(file.path+'.ots');}catch(error){if(error.code==='ENOENT')retry.push(file);else throw error;}}
      if(retry.length)await invoke(retry);
    }
  }
  for(const file of unstamped){
    try{const info=await stat(file.path+'.ots');file.record.ots=info.size>0?{status:'calendar_submitted_pending',receipt:file.path+'.ots',bytes:info.size}:{status:'gap',reason:'zero-byte OTS receipt'};}
    catch(error){file.record.ots={status:'gap',reason:'OTS receipt missing after submission: '+error.message};}
  }
}

async function main(){
  const sourceInfo=await stat(listing);if(!sourceInfo.isFile())throw Error('Metadata source is not a file');
  const mount=await stat(objects);if(!mount.isDirectory())throw Error('Object destination is not a directory');
  await mkdir(output,{recursive:false});
  const log=await open(join(output,'ots-submissions.log'),'wx');
  const index=await open(join(output,'INDEX.ndjson'),'wx');
  let chunk=[],batch=[],chunkNo=0,prevHash=null,count=0,matched=0,gaps=0;
  async function flushChunk(){
    if(!chunk.length)return;
    const name=`manifest-${bucket}-chunk-${String(chunkNo).padStart(4,'0')}.ndjson`,file=join(output,name);
    const handle=await open(file,'wx');
    const header={schema:'ProofBundleGcsManifestChunk/v1',bucket,chunk:chunkNo,previous_chunk_sha256:prevHash,rows:chunk.length};
    await handle.write(canonical(header));await handle.write('\n');
    for(const record of chunk){const bare=canonical(record),row={...record,canonical_record_sha256:sha(bare)};
      await handle.write(canonical(row));await handle.write('\n');}
    await handle.sync();await handle.close();
    const bytes=await readFile(file),digest=sha(bytes);
    await index.write(canonical({chunk:chunkNo,path:name,rows:chunk.length,bytes:bytes.length,sha256:digest,previous_chunk_sha256:prevHash}));await index.write('\n');await index.sync();
    prevHash=digest;chunkNo++;chunk=[];
  }
  async function flushBatch(){
    if(!batch.length)return;
    await otsStamp(batch.filter(item=>item.matched),log);
    for(const item of batch){
      if(!item.record.ots)item.record.ots={status:item.matched?'not_submitted':'not_applicable'};
      chunk.push(item.record);count++;if(item.matched)matched++;else gaps++;
      if(chunk.length===chunkSize)await flushChunk();
    }
    batch=[];
  }
  try{
    for await(const entry of entries()){
      batch.push(await audit(entry));
      if(batch.length===otsBatchSize)await flushBatch();
    }
    await flushBatch();await flushChunk();
    await index.write(canonical({schema:'ProofBundleGcsManifestFinal/v1',bucket,objects:count,matched,gaps,chunks:chunkNo,final_chunk_sha256:prevHash,metadata_source:listing,metadata_source_sha256:await new Promise((done,reject)=>{const h=createHash('sha256');const s=createReadStream(listing);s.on('data',b=>h.update(b));s.on('error',reject);s.on('end',()=>done(h.digest('hex')));})}));await index.write('\n');await index.sync();
    console.log(JSON.stringify({bucket,objects:count,matched,gaps,chunks:chunkNo,final_chunk_sha256:prevHash,output}));
  }finally{await log.close();await index.close();}
}
main().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
