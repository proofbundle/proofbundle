#!/usr/bin/env python3
"""Reconcile local algorithm sources without changing their evidence status."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import subprocess
import tomllib

ROOT = Path(__file__).resolve().parent.parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def build(archive, formal, rust):
    sources = []
    def load(path, source_id):
        data = path.read_bytes()
        sources.append({'id': source_id, 'sha256': digest(data), 'bytes': len(data)})
        return json.loads(data)
    current = load(ROOT/'ALGORITHM_REGISTRY.json', 'application-registry')
    historical_bytes = subprocess.check_output(['git', '-C', str(ROOT), 'show', '3c199c2:ALGORITHM_REGISTRY.json'])
    historical = json.loads(historical_bytes)
    sources.append({'id': 'historical-registry', 'commit': subprocess.check_output(['git','-C',str(ROOT),'rev-parse','3c199c2'],text=True).strip(), 'path': 'ALGORITHM_REGISTRY.json', 'sha256': digest(historical_bytes), 'bytes': len(historical_bytes)})
    catalog = []
    errors = []
    def walk(value, source_id, pointer=''):
        if isinstance(value, dict):
            if isinstance(value.get('name'), str):
                catalog.append({'name':value['name'], 'category':pointer.rsplit('/',1)[0], 'source':source_id, 'pointer':pointer, 'declaration':value})
            for key,item in value.items():
                walk(item,source_id,pointer+'/'+key.replace('~','~0').replace('/','~1'))
        elif isinstance(value,list):
            for i,item in enumerate(value):walk(item,source_id,pointer+'/'+str(i))
    for path in sorted(archive.glob('*.json')):
        source_id=path.name
        try:walk(load(path,source_id),source_id)
        except json.JSONDecodeError as error:
            errors.append({'source':source_id,'error':'JSON parse failure','line':error.lineno,'column':error.colno})
    repaired = archive/'publications/08_repaired.json'
    if repaired.exists():walk(load(repaired,'08-recovered-subset'),'08-recovered-subset')
    proofs = load(formal/'registry/registry.json','proof-registry')
    proof_rows = []
    for row in proofs['rows']:
        evidence=[]
        for ref in row['provenance']:
            path=Path(ref['path'])
            if path.is_file():
                actual=digest(path.read_bytes())
                evidence.append({'recorded_sha256':ref['sha256'],'actual_sha256':actual,'matches':actual==ref['sha256']})
            else:evidence.append({'recorded_sha256':ref['sha256'],'matches':None,'reason':'source unavailable or not a regular file'})
        proof_rows.append({**row,'provenance_readback':evidence})
    status=collections.Counter(row['implementationStatus'] for row in current)
    old_ids=collections.Counter(row['id'] for row in historical)
    history=[]
    fields=['id','canonicalName','primitiveFamily','implementationClass','implementationStatus','securityStatus','implementationModulePaths','formalDefinitionPaths','theoremIds']
    for i,row in enumerate(historical):history.append({**{key:row.get(key) for key in fields},'source_index':i})
    path_checks=[]
    for row in current:
        for field in ['implementationModulePaths','testVectorPaths','formalDefinitionPaths']:
            for name in row[field]:
                path=ROOT/name
                path_checks.append({'algorithm':row['id'],'role':field,'path':name,'exists':path.is_file(),'sha256':digest(path.read_bytes()) if path.is_file() else None})
    profiles=[]
    for name,components,module in [
        ('x25519-hkdf-sha256-chacha20poly1305-v1',['X25519','HKDF-SHA-256','ChaCha20-Poly1305','Ed25519'],'agent/envelope.mjs'),
        ('ml-kem-768-hkdf-sha256-chacha20poly1305-v1',['ML-KEM-768','HKDF-SHA-256','ChaCha20-Poly1305','Ed25519'],'/home/falsealias/pb/rail/identity_gate.mjs'),
        ('PB-CONF-1',['ML-KEM-768','SHAKE256','SHA3-256'],'crypto/confidential.mjs')]:
        path=Path(module) if module.startswith('/') else ROOT/module
        profiles.append({'id':name,'components':components,'source_sha256':digest(path.read_bytes()),'status':'source inspected; profile integration distinct from primitive proof','construction':'custom SHAKE stream and MAC' if name=='PB-CONF-1' else 'key agreement or encapsulation, HKDF, ChaCha20-Poly1305, Ed25519 envelope'})
    rust_info={'status':'not located'}
    if rust.exists():
        raw=(rust/'Cargo.toml').read_bytes();manifest=tomllib.loads(raw.decode())
        crates=sorted(p.parent.name for p in (rust/'crates').glob('*/Cargo.toml'))
        rust_info={'status':'source manifests inspected; no build replay','manifest_sha256':digest(raw),'declared_members':manifest['workspace']['members'],'crate_directories':crates,'declared_member_count':len(manifest['workspace']['members']),'crate_directory_count':len(crates)}
    checks_path=ROOT/'reports/algorithm-synthesis/checks.json'
    checks=load(checks_path,'current-local-tests') if checks_path.exists() else None
    drift=[{'algorithm':row['name'],'finding':'A proof source differs from its previously recorded hash; inspect provenance_readback before applying the prior status.'} for row in proof_rows if any(e.get('matches') is False for e in row['provenance_readback'])]
    return {'schema':'ProofBundleAlgorithmSynthesis/v1','actor':'Rowan','scope':'Source reconciliation; declarations remain attributed; source presence, testing, formal proof and integration are independent. No global completion or security proof is inferred.','sources':sources,'summary':{'application_entries':len(current),'application_status':dict(status),'historical_rows':len(history),'historical_unique_ids':len(old_ids),'historical_duplicate_rows':len(history)-len(old_ids),'catalog_rows':len(catalog),'catalog_unique_names':len(set(r['name'] for r in catalog)),'proof_rows':len(proof_rows),'open_defects':sum(d['status']=='open' for d in proofs['defects'])},'application':current,'history':history,'historical_duplicate_ids':{k:v for k,v in old_ids.items() if v>1},'catalog':catalog,'proofs':proof_rows,'defects':proofs['defects'],'source_errors':errors,'path_checks':path_checks,'profiles':profiles,'rust':rust_info,'runtime_checks':checks,'conflicts':[{'algorithm':'ChaCha20-Poly1305','finding':'Application registry declares NOT_IMPLEMENTED; inspected agent/relay profiles invoke a native provider. Registry dispatch and profile integration are distinct.'},{'algorithm':'ML-KEM-768 / ECDSA P-256','finding':'Current JS implementation declarations coexist with a different Lean lineage marked hollow-scaffold. These statuses cannot transfer between files or languages.'}]+drift,'limits':['Historical publication citations have not been independently reverified in this synthesis.','Proof-registry provenance hashes are compared where present; historical proof claims are not upgraded by hash agreement.','A 32-crate recovery tree has only 27 declared workspace members; directory existence is not a successful Cargo build.','Captured source registrations do not establish coverage of every machine session.']}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--archive',type=Path,default=Path('/media/falsealias/raid2tb/Crypto_Accumulation_Algorithms/00_REGISTRY'))
    parser.add_argument('--formal',type=Path,default=Path('/home/falsealias/proofbundle-registry'))
    parser.add_argument('--rust',type=Path,default=Path('/media/falsealias/IMAGES-B/gpx-recovery/genophylaxis-src-full'))
    parser.add_argument('--out',type=Path,default=ROOT/'ALGORITHM_SYNTHESIS.json')
    args=parser.parse_args();result=build(args.archive,args.formal,args.rust)
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'output':str(args.out),'sha256':digest(args.out.read_bytes()),'summary':result['summary']}))

if __name__=='__main__':main()
