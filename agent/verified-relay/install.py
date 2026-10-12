#!/usr/bin/env python3
"""Install source helpers without replacing existing state, identities or ledgers."""
import json,os,pathlib,shutil
HERE=pathlib.Path(__file__).resolve().parent;HOME=pathlib.Path.home();REPO=HERE.parents[1]
rail=HOME/'pb/rail';bin=HOME/'pb/bin';bus=HOME/'pb/live/bus';units=HOME/'.config/systemd/user'
for d in (rail,bin,bus,units):d.mkdir(parents=True,exist_ok=True)
for pattern in ('*.py','*.mjs','*.html'):
 for src in HERE.glob(pattern):
  if src.name=='install.py':continue
  dst=rail/src.name
  if dst.exists():
   keep=dst.with_name(dst.name+'.before-verified-relay')
   if not keep.exists():shutil.copy2(dst,keep)
  shutil.copy2(src,dst)
for src in (HERE/'bin').iterdir():
 dst=bin/src.name
 if dst.exists():
  keep=dst.with_name(dst.name+'.before-verified-relay')
  if not keep.exists():shutil.copy2(dst,keep)
 shutil.copy2(src,dst);dst.chmod(0o755)
algorithms={'chain.prevhash-json.v1':{'status':'exercised','name':'Canonical JSON SHA256 predecessor chain'},'hash.sha256.v1':{'status':'exercised','name':'SHA256'},'merkle.rfc6962.sha256.v1':{'status':'declared','name':'RFC6962 SHA256 Merkle'},'ots.opentimestamps.v1':{'status':'declared','name':'OpenTimestamps'}}
for name,value in [('ALGORITHMS.json',{'algorithms':algorithms}),('LANES.json',{'lanes':{}})]:
 p=bus/name
 if not p.exists():p.write_text(json.dumps(value,indent=2)+'\n')
services={'pb-verified-relay':f'ExecStart=/usr/bin/python3 {rail}/api.py\nEnvironment=PB_REPO_ROOT={REPO}\nRestart=on-failure\nRestartSec=3',
 'pb-bridge-attest':f'Type=oneshot\nExecStart={bin}/pb-bridge-attest stamp\nTimeoutStartSec=15min',
 'pb-bridge-attest-upgrade':f'Type=oneshot\nExecStart={bin}/pb-bridge-attest upgrade\nTimeoutStartSec=30min'}
for name,body in services.items():
 (units/(name+'.service')).write_text(f'[Unit]\nDescription=ProofBundle {name}\n[Service]\n'+body+'\n[Install]\nWantedBy=default.target\n')
for name,delay in [('pb-bridge-attest','30s'),('pb-bridge-attest-upgrade','6h')]:
 (units/(name+'.timer')).write_text(f'[Unit]\nDescription=ProofBundle {name}\n[Timer]\nOnBootSec={delay}\nOnUnitInactiveSec={delay}\n[Install]\nWantedBy=timers.target\n')
print('Source helpers installed. State and keys preserved. Enable services explicitly after configuring conversation sources.')
