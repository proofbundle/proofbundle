from pathlib import Path
import hashlib,json,re,sys
root=Path(__file__).resolve().parents[1]
orig=root/'00_ORIGINALS'; work=root/'10_WORKING/lean'; gt=root/'20_GROUND_TRUTH'; rec=root/'50_RECEIPTS'
rec.mkdir(exist_ok=True)
files=sorted([p for p in orig.iterdir() if p.is_file()])
manifest=[]
for p in files:
    b=p.read_bytes(); manifest.append({'file':p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(rec/'original_manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(rec/'SHA256SUMS').write_text(''.join(f"{x['sha256']}  00_ORIGINALS/{x['file']}\n" for x in manifest))
summary={'original_files':len(files),'original_bytes':sum(x['bytes'] for x in manifest),'lean':{},'ground_truth':{}}
for p in sorted(work.glob('*.lean')):
    s=p.read_text(errors='replace')
    summary['lean'][p.name]={
      'theorem_declarations':len(re.findall(r'(?m)^\s*(?:theorem|lemma)\s+',s)),
      'native_decide':len(re.findall(r'\bnative_decide\b',s)),
      'sorry_tokens':len(re.findall(r'\bsorry\b',s)),
      'admit_tokens':len(re.findall(r'\badmit\b',s)),
      'axiom_declarations':len(re.findall(r'(?m)^\s*axiom\s+',s)),
      'panic_access_get_bang':len(re.findall(r'\bget!',s)),
    }
for p in sorted(gt.glob('*.json')):
    d=json.loads(p.read_text())
    info={'keys':list(d.keys())}
    for k in ('vectors','hostile','K','H0','K512','H512'):
      if isinstance(d.get(k),list): info[k]=len(d[k])
    if 'params' in d: info['params']=d['params']
    summary['ground_truth'][p.name]=info
(rec/'static_audit.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
