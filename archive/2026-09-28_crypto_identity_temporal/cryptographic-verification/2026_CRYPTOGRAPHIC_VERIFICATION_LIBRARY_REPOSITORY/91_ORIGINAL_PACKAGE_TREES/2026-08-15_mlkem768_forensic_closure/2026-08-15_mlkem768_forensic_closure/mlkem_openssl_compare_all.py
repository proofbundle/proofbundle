import json,subprocess,re,pathlib,hashlib
# import canonicalizer definitions before j=
ns={}; exec(open('/mnt/data/mlkem_canonicalize_test.py').read().split('j=json.load')[0],ns)
canon=ns['canon_dk']
j=json.load(open('/mnt/data/mlkem768_ground_truth.json'))
out=[]; wd=pathlib.Path('/mnt/data/mlkem_openssl_all');wd.mkdir(exist_ok=True)
for i,v in enumerate(j['vectors']):
 seed=v['d']+v['z']; pem=wd/f'{i}.pem'
 subprocess.run(['openssl','genpkey','-algorithm','ML-KEM-768','-pkeyopt','hexseed:'+seed,'-out',str(pem)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 txt=subprocess.check_output(['openssl','pkey','-in',str(pem),'-text','-noout'],text=True)
 sec={};cur=None
 for line in txt.splitlines():
  s=line.strip()
  if s in ('seed:','dk:','ek:'):cur=s[:-1];sec[cur]='';continue
  if cur and re.fullmatch(r'[0-9a-f:]+',s):sec[cur]+=s.replace(':','')
 supplied_dk=bytes.fromhex(v['dk']); cdk=canon(supplied_dk); od=bytes.fromhex(sec['dk']); oe=bytes.fromhex(sec['ek']); se=bytes.fromhex(v['ek'])
 out.append({
   'name':v['name'],
   'seed_match':sec['seed']==seed,
   'canonicalized_secret_matches_openssl':cdk[:1152]==od[:1152],
   'supplied_ek_matches_openssl':se==oe,
   'rho_matches_openssl':se[-32:]==oe[-32:],
   'supplied_dk_tail_ek_hash_z_layout_valid': supplied_dk[1152:2336]==se and supplied_dk[2336:2368]==hashlib.sha3_256(se).digest() and supplied_dk[2368:]==bytes.fromhex(v['z']),
   'openssl_dk_sha256':hashlib.sha256(od).hexdigest(),
   'canonicalized_supplied_dk_sha256':hashlib.sha256(cdk).hexdigest(),
   'supplied_ek_sha256':hashlib.sha256(se).hexdigest(),
   'openssl_ek_sha256':hashlib.sha256(oe).hexdigest(),
 })
print(json.dumps(out,indent=2))
pathlib.Path('/mnt/data/mlkem_openssl_all/results.json').write_text(json.dumps(out,indent=2)+'\n')
