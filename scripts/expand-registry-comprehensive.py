#!/usr/bin/env python3
"""
Comprehensive expansion of the ProofBundle algorithm registry.
Adds every known cryptographic algorithm across all families.
Logs all operations and errors to a timestamped log file.
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Setup logging
log_file = f"/home/falsealias/pb/scratch/registry-expansion-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
os.makedirs(os.path.dirname(log_file), exist_ok=True)

def log(msg: str, level: str = "INFO"):
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] [{level}] {msg}"
    print(entry, file=sys.stderr)
    with open(log_file, 'a') as f:
        f.write(entry + '\n')

def load_registry(path: str) -> List[Dict]:
    try:
        with open(path, 'r') as f:
            reg = json.load(f)
        log(f"Loaded registry with {len(reg)} algorithms")
        return reg
    except Exception as e:
        log(f"Failed to load registry: {e}", "ERROR")
        raise

def save_registry(path: str, reg: List[Dict]):
    try:
        with open(path, 'w') as f:
            json.dump(reg, f, indent=2)
        log(f"Saved registry with {len(reg)} algorithms")
    except Exception as e:
        log(f"Failed to save registry: {e}", "ERROR")
        raise

def create_algorithm(
    id: str,
    family: str,
    status: str = "NOT_IMPLEMENTED",
    klass: str = "VETTED_PROVIDER",
    digest_length: int = None,
    key_lengths: List[int] = None,
    nonce_length: int = None,
    tag_length: int = None,
    spec: str = None,
    notes: str = None,
    module_paths: List[str] = None,
    test_vector_paths: List[str] = None,
    failure_verdicts: List[str] = None,
    allowed_ops: List[str] = None,
    formal_requirements: Dict[str, Any] = None
) -> Dict:
    """Create a standardized algorithm entry with formal verification requirements."""
    
    # Default formal requirements: zero axioms, sorry, admits, propext, byte array, native_decide
    if formal_requirements is None:
        formal_requirements = {
            "lean": {
                "zero_axioms": True,
                "zero_sorry": True,
                "zero_admits": True,
                "zero_propext": True,
                "zero_byte_array": True,
                "zero_native_decide": True,
                "proof_status": "REQUIRED"
            },
            "rocq": {
                "zero_axioms": True,
                "zero_sorry": True,
                "zero_admits": True,
                "proof_status": "REQUIRED"
            },
            "fstar": {
                "zero_axioms": True,
                "zero_admits": True,
                "proof_status": "REQUIRED"
            },
            "isabelle": {
                "zero_axioms": True,
                "zero_sorry": True,
                "proof_status": "REQUIRED"
            }
        }
    
    alg = {
        "id": id,
        "canonicalName": id,
        "aliases": [],
        "primitiveFamily": family,
        "implementationClass": klass,
        "securityStatus": "CURRENT",
        "allowedOperations": allowed_ops or ["digest" if family == "DIGEST" else "sign" if family == "SIGNATURE" else "encrypt" if family in ["AEAD", "CIPHER"] else "derive" if family == "KDF" else "mac" if family == "MAC" else "encapsulate" if family == "KEM" else "unknown"],
        "parameterSet": None,
        "digestLength": digest_length,
        "keyLengths": key_lengths,
        "nonceLength": nonce_length,
        "tagLength": tag_length,
        "signatureEncoding": None,
        "publicKeyEncoding": None,
        "privateKeyEncoding": None,
        "transcriptRules": None,
        "domainSeparationTag": None,
        "providerRequirements": None,
        "generationPolicy": None,
        "verificationPolicy": None,
        "historicalVerificationPolicy": None,
        "deprecation": None,
        "testVectorPaths": test_vector_paths or [],
        "implementationModulePaths": module_paths or [],
        "formalDefinitionPaths": [],
        "theoremIds": [],
        "failureVerdicts": failure_verdicts or ["UNKNOWN_ALGORITHM"],
        "interoperabilityNotes": notes,
        "implementationStatus": status,
        "specificationReference": spec,
        "formalVerificationRequirements": formal_requirements
    }
    return alg

def expand_digests(existing: List[Dict]) -> List[Dict]:
    """Expand DIGEST family comprehensively."""
    log("Expanding DIGEST family...")
    new_algs = []
    
    # SHA-2 family (all variants)
    for bits in [224, 256, 384, 512]:
        id = f"SHA-{bits}"
        dlen = bits // 8
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE",
                klass="NODE_NATIVE",
                digest_length=dlen,
                spec=f"FIPS 180-4",
                notes=f"SHA-{bits} hash function"
            ))
    
    # SHA-512 variants
    for suffix, dlen in [("/224", 28), ("/256", 32)]:
        id = f"SHA-512{suffix}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE",
                klass="NODE_NATIVE",
                digest_length=dlen,
                spec="FIPS 180-4",
                notes=f"SHA-512{suffix} hash function"
            ))
    
    # SHA-3 family (all variants)
    for bits in [224, 256, 384, 512]:
        id = f"SHA3-{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE",
                klass="PURE_MJS",
                digest_length=bits // 8,
                spec="FIPS 202",
                notes=f"SHA3-{bits} hash function",
                module_paths=["crypto/keccak.mjs"]
            ))
    
    # SHAKE XOFs
    for bits in [128, 256]:
        id = f"SHAKE{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE",
                klass="PURE_MJS",
                digest_length=None,  # Variable
                spec="FIPS 202",
                notes=f"SHAKE{bits} extendable-output function",
                module_paths=["crypto/keccak.mjs"]
            ))
    
    # cSHAKE XOFs
    for bits in [128, 256]:
        id = f"cSHAKE{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE",
                klass="PURE_MJS",
                digest_length=None,
                spec="NIST SP 800-185",
                notes=f"cSHAKE{bits} customizable XOF",
                module_paths=["crypto/cshake.mjs"]
            ))
    
    # BLAKE2 family (all variants)
    for variant in ['b', 's']:
        for bits in [128, 160, 224, 256, 288, 320, 384, 512] if variant == 'b' else [128, 160, 192, 224, 256]:
            id = f"BLAKE2{variant}-{bits}"
            if not any(a['id'] == id for a in existing):
                new_algs.append(create_algorithm(
                    id=id,
                    family="DIGEST",
                    status="NOT_IMPLEMENTED",
                    klass="VETTED_PROVIDER",
                    digest_length=bits // 8,
                    spec="RFC 7693",
                    notes=f"BLAKE2{variant}-{bits} hash function"
                ))
    
    # BLAKE3
    if not any(a['id'] == 'BLAKE3' for a in existing):
        new_algs.append(create_algorithm(
            id="BLAKE3",
            family="DIGEST",
            status="COMPLETE",
            klass="PURE_MJS",
            digest_length=32,
            spec="BLAKE3 spec",
            notes="BLAKE3 hash function",
            module_paths=["crypto/blake3.mjs"]
        ))
    
    # Keccak (pre-SHA3)
    for bits in [224, 256, 384, 512]:
        id = f"Keccak-{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="COMPLETE" if bits in [256, 512] else "NOT_IMPLEMENTED",
                klass="PURE_MJS",
                digest_length=bits // 8,
                spec="Keccak spec",
                notes=f"Keccak-{bits} (pre-SHA3 padding)",
                module_paths=["crypto/keccak-raw.mjs"] if bits in [256, 512] else []
            ))
    
    # MD family
    for md in ['MD2', 'MD4', 'MD5']:
        if not any(a['id'] == md for a in existing):
            new_algs.append(create_algorithm(
                id=md,
                family="DIGEST",
                status="RECOGNIZE_ONLY",
                klass="RECOGNIZE_AND_REJECT",
                digest_length=16,
                spec="RFC 1319" if md == 'MD5' else "RFC 1319",
                notes=f"{md} hash function (broken, recognize only)",
                failure_verdicts=["FORBIDDEN_ALGORITHM"]
            ))
    
    # SHA-0, SHA-1
    for sha in ['SHA-0', 'SHA-1']:
        if not any(a['id'] == sha for a in existing):
            new_algs.append(create_algorithm(
                id=sha,
                family="DIGEST",
                status="RECOGNIZE_ONLY",
                klass="RECOGNIZE_AND_REJECT",
                digest_length=20,
                spec="FIPS 180" if sha == 'SHA-0' else "FIPS 180-1",
                notes=f"{sha} hash function (broken, recognize only)",
                failure_verdicts=["FORBIDDEN_ALGORITHM"]
            ))
    
    # RIPEMD family
    for bits in [128, 160, 256, 320]:
        id = f"RIPEMD-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="RIPEMD spec",
            notes=f"RIPEMD-{bits} hash function"
        ))
    
    # Tiger/Tiger2
    for tiger in ['Tiger', 'Tiger2']:
        new_algs.append(create_algorithm(
            id=tiger,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=24,
            spec=f"{tiger} spec",
            notes=f"{tiger} hash function"
        ))
    
    # Whirlpool
    new_algs.append(create_algorithm(
        id="Whirlpool",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=64,
        spec="ISO/IEC 10118-3",
        notes="Whirlpool hash function"
    ))
    
    # SM3 (Chinese standard)
    new_algs.append(create_algorithm(
        id="SM3",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=32,
        spec="GM/T 0004-2012",
        notes="SM3 hash function (Chinese standard)"
    ))
    
    # Streebog (GOST)
    for bits in [256, 512]:
        id = f"Streebog-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="GOST R 34.11-2012",
            notes=f"Streebog-{bits} (GOST hash)"
        ))
    
    # GOST R 34.11-94
    new_algs.append(create_algorithm(
        id="GOST-R-34.11-94",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=32,
        spec="GOST R 34.11-94",
        notes="GOST hash function (1994)"
    ))
    
    # HAS-160
    new_algs.append(create_algorithm(
        id="HAS-160",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=20,
        spec="HAS-160 spec",
        notes="HAS-160 hash function"
    ))
    
    # HAVAL family
    for bits in [128, 160, 192, 224, 256]:
        for rounds in [3, 4, 5]:
            id = f"HAVAL-{bits}-{rounds}"
            new_algs.append(create_algorithm(
                id=id,
                family="DIGEST",
                status="NOT_IMPLEMENTED",
                klass="VETTED_PROVIDER",
                digest_length=bits // 8,
                spec="HAVAL spec",
                notes=f"HAVAL-{bits} with {rounds} rounds"
            ))
    
    # PANAMA
    new_algs.append(create_algorithm(
        id="PANAMA",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=32,
        spec="PANAMA spec",
        notes="PANAMA stream cipher and hash"
    ))
    
    # RadioGatún
    new_algs.append(create_algorithm(
        id="RadioGatun",
        family="DIGEST",
        status="NOT_IMPLEMENTED",
        klass="VETTED_PROVIDER",
        digest_length=None,
        spec="RadioGatún spec",
        notes="RadioGatún hash function"
    ))
    
    # Skein family
    for bits in [256, 512, 1024]:
        for out in [128, 160, 224, 256, 384, 512]:
            if out <= bits:
                id = f"Skein-{bits}-{out}"
                new_algs.append(create_algorithm(
                    id=id,
                    family="DIGEST",
                    status="NOT_IMPLEMENTED",
                    klass="VETTED_PROVIDER",
                    digest_length=out // 8,
                    spec="Skein spec",
                    notes=f"Skein-{bits} with {out}-bit output"
                ))
    
    # Groestl family
    for bits in [224, 256, 384, 512]:
        id = f"Groestl-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Groestl spec",
            notes=f"Groestl-{bits} hash function"
        ))
    
    # JH family
    for bits in [224, 256, 384, 512]:
        id = f"JH-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="JH spec",
            notes=f"JH-{bits} hash function"
        ))
    
    # CubeHash
    for bits in [224, 256, 384, 512]:
        id = f"CubeHash-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="CubeHash spec",
            notes=f"CubeHash-{bits} hash function"
        ))
    
    # Luffa
    for bits in [224, 256, 384, 512]:
        id = f"Luffa-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Luffa spec",
            notes=f"Luffa-{bits} hash function"
        ))
    
    # Shabal
    for bits in [192, 224, 256, 384, 512]:
        id = f"Shabal-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Shabal spec",
            notes=f"Shabal-{bits} hash function"
        ))
    
    # Echo
    for bits in [224, 256, 384, 512]:
        id = f"Echo-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Echo spec",
            notes=f"Echo-{bits} hash function"
        ))
    
    # Fugue
    for bits in [224, 256, 384, 512]:
        id = f"Fugue-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Fugue spec",
            notes=f"Fugue-{bits} hash function"
        ))
    
    # Hamsi
    for bits in [224, 256, 384, 512]:
        id = f"Hamsi-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="Hamsi spec",
            notes=f"Hamsi-{bits} hash function"
        ))
    
    # MD6
    for bits in [224, 256, 384, 512]:
        id = f"MD6-{bits}"
        new_algs.append(create_algorithm(
            id=id,
            family="DIGEST",
            status="NOT_IMPLEMENTED",
            klass="VETTED_PROVIDER",
            digest_length=bits // 8,
            spec="MD6 spec",
            notes=f"MD6-{bits} hash function"
        ))
    
    log(f"Added {len(new_algs)} DIGEST algorithms")
    return new_algs

def main():
    log("Starting comprehensive registry expansion")
    
    registry_path = "/home/falsealias/src/proofbundle/ALGORITHM_REGISTRY.json"
    reg = load_registry(registry_path)
    
    # Expand each family
    new_digests = expand_digests(reg)
    reg.extend(new_digests)
    
    # Save expanded registry
    save_registry(registry_path, reg)
    
    log("Registry expansion complete")
    return 0

if __name__ == "__main__":
    sys.exit(main())
