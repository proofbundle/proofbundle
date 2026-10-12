// SPDX-License-Identifier: GPL-3.0-or-later
// Live filesystem metadata. No archive totals or machine paths are compiled in.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
function absolute(value) {
  if (typeof value !== 'string' || !path.isAbsolute(value) || value.includes('\0')) throw new Error('An absolute filesystem path is required');
  return path.resolve(value);
}
async function locations() {
  const roots = new Map([[os.homedir(), 'Home'], ['/', 'Computer']]);
  if (process.platform === 'linux') {
    const text = await fs.readFile('/proc/self/mountinfo', 'utf8');
    for (const line of text.trim().split('\n')) {
      const [left, right] = line.split(' - '); if (!right) continue;
      const fields = left.split(' '), type = right.split(' ')[0];
      const mount = fields[4].replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)));
      if (!['proc','sysfs','devtmpfs','devpts','tmpfs','cgroup2','securityfs','debugfs','tracefs','pstore','mqueue','hugetlbfs','fusectl','configfs','autofs','efivarfs','bpf','binfmt_misc','fuse.portal'].includes(type)) roots.set(mount, mount === '/' ? 'Computer' : path.basename(mount) || mount);
    }
  } else {
    const base = process.platform === 'darwin' ? '/Volumes' : null;
    if (base) for (const item of await fs.readdir(base)) roots.set(path.join(base, item), item);
    if (process.platform === 'win32') for (let code=65;code<=90;code++) { const drive=String.fromCharCode(code)+':\\';try {await fs.access(drive);roots.set(drive,drive);}catch{}}
  }
  return Array.from(roots, ([path,label]) => ({path,label}));
}
async function browse(args = {}) {
  const directory = absolute(args.path || os.homedir());
  const offset = Number(args.offset || 0), limit = 100;
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid directory page');
  const query = String(args.query || '').toLocaleLowerCase();
  const entries = []; let matched = 0, more = false;
  const handle = await fs.opendir(directory);
  for await (const entry of handle) {
    if (!entry.name.toLocaleLowerCase().includes(query)) continue;
    if (matched++ < offset) continue;
    if (entries.length === limit) {more = true;break;}
    const full = path.join(directory,entry.name);
    let metadata;
    try {const stat=await fs.lstat(full);metadata={size:stat.size,modified_at:stat.mtime.toISOString(),kind:stat.isSymbolicLink()?'symlink':stat.isDirectory()?'directory':stat.isFile()?'file':'special'};
      if(stat.isSymbolicLink()){metadata.link_target=await fs.readlink(full);try{metadata.target_kind=(await fs.stat(full)).isDirectory()?'directory':'file';}catch{metadata.target_kind='unavailable';}}
    } catch(error){metadata={kind:'unavailable',error:error.code};}
    entries.push({name:entry.name,path:full,...metadata});
  }
  return {schema:'ProofBundleFilesystemPage/v1',path:directory,parent:path.dirname(directory),offset,limit,more,query,entries,observed_at:new Date().toISOString(),scope:'Live directory metadata; page order follows the filesystem. No recursive inventory or content capture is asserted.'};
}
module.exports={absolute,locations,browse};
