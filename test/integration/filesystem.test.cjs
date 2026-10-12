const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {browse,locations}=require('../../desktop/filesystem.cjs');
test('live pages retain paths, updates and symlink metadata without recursively inventorying',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'proofbundle-files-'));
 try {
  await fs.mkdir(path.join(root,'nested'));await fs.writeFile(path.join(root,'nested','not-on-root-page'),'data');
  for(let i=0;i<103;i++)await fs.writeFile(path.join(root,'item-'+i),'x');
  await fs.symlink('nested',path.join(root,'link'));
  const first=await browse({path:root});assert.equal(first.entries.length,100);assert.equal(first.more,true);
  const second=await browse({path:root,offset:100});assert.equal(second.more,false);
  const all=[...first.entries,...second.entries];assert.equal(new Set(all.map(x=>x.path)).size,105);assert.ok(all.every(x=>path.dirname(x.path)===root));
  const link=all.find(x=>x.name==='link');assert.equal(link.kind,'symlink');assert.equal(link.target_kind,'directory');
  await fs.writeFile(path.join(root,'new-file'),'hello');const filtered=await browse({path:root,query:'new-file'});assert.equal(filtered.entries.length,1);assert.equal(filtered.entries[0].size,5);
  await assert.rejects(browse({path:'relative'}),/absolute/);await assert.rejects(browse({path:root,offset:-1}),/page/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('locations include the runtime home and computer',async()=>{const roots=await locations();assert.ok(roots.some(x=>x.path===os.homedir()));assert.ok(roots.some(x=>x.path==='/'));});
