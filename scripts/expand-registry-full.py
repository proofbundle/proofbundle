#!/usr/bin/env python3
"""
Complete expansion of ProofBundle algorithm registry with:
- All cryptographic algorithm families
- Canonical manifest schema
- Formal verification requirements (zero axioms/sorry/admits)
- Multiple proof assistants (Lean, Rocq, F*, Isabelle, Agda, HOL4)
- OTS attestation requirements
- Comprehensive logging
"""

import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

# Setup logging
log_dir = "/home/falsealias/pb/scratch"
os.makedirs(log_dir, exist_ok=True)
log_file = f"{log_dir}/registry-expansion-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"

def log(msg: str, level: str = "INFO"):
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] [{level}] {msg}"
    print(entry, file=sys.stderr)
    with open(log_file, 'a') as f:
        f.write(entry + '\n')

def create_blockchain_redundancy_layer() -> Dict:
    """Create multi-blockchain redundancy layer for OTS attestation."""
    return {
        "bitcoin": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "ethereum": {
            "network": "mainnet",
            "transaction_hash": None,
            "block_number": None,
            "confirmations": 0,
            "timestamp": None
        },
        "litecoin": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "bitcoin_cash": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "dogecoin": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "dash": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "zcash": {
            "network": "mainnet",
            "transaction_id": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "monero": {
            "network": "mainnet",
            "transaction_hash": None,
            "block_height": None,
            "confirmations": 0,
            "timestamp": None
        },
        "ipfs": {
            "cid": None,
            "pinners": [],
            "timestamp": None
        },
        "arweave": {
            "transaction_id": None,
            "block_height": None,
            "timestamp": None
        },
        "filecoin": {
            "cid": None,
            "deal_id": None,
            "timestamp": None
        },
        "sia": {
            "contract_id": None,
            "timestamp": None
        },
        "storj": {
            "bucket_id": None,
            "file_id": None,
            "timestamp": None
        },
        "ots_calendars": {
            "calendar_urls": [],
            "attestation_chain": []
        }
    }

def create_canonical_manifest_schema() -> Dict:
    """Create the canonical manifest schema for algorithm verification."""
    return {
        "schema_version": "PB-CANONICAL-MANIFEST-2",
        "algorithm_id": None,
        "specification": {
            "document_hash": None,
            "document_format": None,
            "document_version": None,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "reference_implementation": {
            "git_repository": None,
            "git_commit": None,
            "language": None,
            "file_hash": None,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "formal_verification": {
            "lean4": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "axiom_count": 0,
                "sorry_count": 0,
                "admit_count": 0,
                "propext_count": 0,
                "byte_array_count": 0,
                "native_decide_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "rocq": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "axiom_count": 0,
                "sorry_count": 0,
                "admit_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "fstar": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "val_count": 0,
                "admit_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "isabelle": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "axiom_count": 0,
                "sorry_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "agda": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "postulate_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "hol4": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "axiom_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "metamath": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "coq": {
                "repository": None,
                "commit": None,
                "theorem_count": 0,
                "axiom_count": 0,
                "build_status": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            }
        },
        "test_vectors": {
            "standard": {
                "count": 0,
                "source": None,
                "file_hash": None,
                "blockchain_attestation": create_blockchain_redundancy_layer()
            },
            "hostile": {
                "count": 0,
                "source": None,
                "file_hash": None,
                "blockchain_attestation": create_blockchain_redundancy_layer(),
                "categories": [
                    "malformed_input",
                    "boundary_conditions",
                    "side_channel_probes",
                    "fault_injection",
                    "adaptive_attacks",
                    "related_key",
                    "chosen_prefix",
                    "length_extension",
                    "collision_attempts",
                    "preimage_attacks"
                ]
            }
        },
        "security_proof": {
            "model": None,
            "assumptions": [],
            "reduction_tightness": None,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "side_channel_analysis": {
            "constant_time": None,
            "masking_order": None,
            "protection_level": None,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "adversarial_adaptability": {
            "threat_model": None,
            "attack_vectors": [],
            "mitigation_strategies": [],
            "resilience_score": None,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "global_context_closure": {
            "closed_under": "PB-GLOBAL-CONTEXT-1",
            "dag_acyclicity": True,
            "admissibility_verified": True,
            "blockchain_attestation": create_blockchain_redundancy_layer()
        },
        "blockchain_attestation": create_blockchain_redundancy_layer()
    }

def create_algorithm(
    id: str,
    family: str,
    status: str = "NOT_IMPLEMENTED",
    klass: str = "VETTED_PROVIDER",
    digest_length: Optional[int] = None,
    key_lengths: Optional[List[int]] = None,
    nonce_length: Optional[int] = None,
    tag_length: Optional[int] = None,
    spec: Optional[str] = None,
    notes: Optional[str] = None,
    module_paths: Optional[List[str]] = None,
    test_vector_paths: Optional[List[str]] = None,
    failure_verdicts: Optional[List[str]] = None,
    allowed_ops: Optional[List[str]] = None,
    include_canonical_manifest: bool = True
) -> Dict:
    """Create a standardized algorithm entry with canonical manifest."""
    
    alg = {
        "id": id,
        "canonicalName": id,
        "aliases": [],
        "primitiveFamily": family,
        "implementationClass": klass,
        "securityStatus": "CURRENT",
        "allowedOperations": allowed_ops or get_default_ops(family),
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
        "specificationReference": spec
    }
    
    if include_canonical_manifest:
        manifest = create_canonical_manifest_schema()
        manifest["algorithm_id"] = id
        alg["canonicalManifest"] = manifest
    
    return alg

def get_default_ops(family: str) -> List[str]:
    """Get default operations for a family."""
    ops_map = {
        "DIGEST": ["digest"],
        "MAC": ["mac"],
        "KDF": ["derive"],
        "SIGNATURE": ["sign", "verify"],
        "KEM": ["encapsulate", "decapsulate"],
        "AEAD": ["encrypt", "decrypt"],
        "CIPHER": ["encrypt", "decrypt"],
        "STREAM_CIPHER": ["encrypt", "decrypt"],
        "PKE": ["encrypt", "decrypt"],
        "IBE": ["encrypt", "decrypt", "extract"],
        "ABE": ["encrypt", "decrypt", "keygen"],
        "FHE": ["encrypt", "decrypt", "evaluate"],
        "ZKP": ["prove", "verify"],
        "COMMITMENT": ["commit", "open", "verify"],
        "SECRET_SHARING": ["share", "reconstruct"],
        "THRESHOLD": ["sign", "verify", "combine"],
        "PAKE": ["authenticate", "derive_key"],
        "VRF": ["evaluate", "verify"],
        "VDF": ["evaluate", "verify"]
    }
    return ops_map.get(family, ["unknown"])

def expand_all_families(existing: List[Dict]) -> List[Dict]:
    """Expand all cryptographic families comprehensively."""
    log("Starting comprehensive expansion of all families")
    new_algs = []
    
    # DIGESTS
    new_algs.extend(expand_digests(existing))
    
    # MACs
    new_algs.extend(expand_macs(existing))
    
    # KDFs
    new_algs.extend(expand_kdfs(existing))
    
    # SIGNATURES
    new_algs.extend(expand_signatures(existing))
    
    # KEMs
    new_algs.extend(expand_kems(existing))
    
    # AEAD
    new_algs.extend(expand_aead(existing))
    
    # Stream Ciphers
    new_algs.extend(expand_stream_ciphers(existing))
    
    # Block Ciphers
    new_algs.extend(expand_block_ciphers(existing))
    
    # PKE (Public Key Encryption)
    new_algs.extend(expand_pke(existing))
    
    # Advanced Crypto
    new_algs.extend(expand_advanced_crypto(existing))
    
    log(f"Total new algorithms: {len(new_algs)}")
    return new_algs

def expand_digests(existing: List[Dict]) -> List[Dict]:
    """Expand DIGEST family."""
    log("Expanding DIGEST family...")
    new_algs = []
    
    # SHA-2 family
    for bits in [224, 256, 384, 512]:
        id = f"SHA-{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", status="COMPLETE",
                klass="NODE_NATIVE", digest_length=bits // 8,
                spec="FIPS 180-4", notes=f"SHA-{bits} hash function"
            ))
    
    # SHA-512 variants
    for suffix, dlen in [("/224", 28), ("/256", 32)]:
        id = f"SHA-512{suffix}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", status="COMPLETE",
                klass="NODE_NATIVE", digest_length=dlen,
                spec="FIPS 180-4", notes=f"SHA-512{suffix}"
            ))
    
    # SHA-3 family
    for bits in [224, 256, 384, 512]:
        id = f"SHA3-{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", status="COMPLETE",
                klass="PURE_MJS", digest_length=bits // 8,
                spec="FIPS 202", module_paths=["crypto/keccak.mjs"]
            ))
    
    # SHAKE XOFs
    for bits in [128, 256]:
        id = f"SHAKE{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", status="COMPLETE",
                klass="PURE_MJS", spec="FIPS 202",
                module_paths=["crypto/keccak.mjs"]
            ))
    
    # cSHAKE XOFs
    for bits in [128, 256]:
        id = f"cSHAKE{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", status="COMPLETE",
                klass="PURE_MJS", spec="NIST SP 800-185",
                module_paths=["crypto/cshake.mjs"]
            ))
    
    # BLAKE2 family
    for variant in ['b', 's']:
        bits_list = [128, 160, 224, 256, 288, 320, 384, 512] if variant == 'b' else [128, 160, 192, 224, 256]
        for bits in bits_list:
            id = f"BLAKE2{variant}-{bits}"
            new_algs.append(create_algorithm(
                id=id, family="DIGEST", digest_length=bits // 8,
                spec="RFC 7693"
            ))
    
    # BLAKE3
    if not any(a['id'] == 'BLAKE3' for a in existing):
        new_algs.append(create_algorithm(
            id="BLAKE3", family="DIGEST", status="COMPLETE",
            klass="PURE_MJS", digest_length=32,
            module_paths=["crypto/blake3.mjs"]
        ))
    
    # Keccak (pre-SHA3)
    for bits in [224, 256, 384, 512]:
        id = f"Keccak-{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="DIGEST",
                status="COMPLETE" if bits in [256, 512] else "NOT_IMPLEMENTED",
                klass="PURE_MJS", digest_length=bits // 8,
                module_paths=["crypto/keccak-raw.mjs"] if bits in [256, 512] else []
            ))
    
    # MD family (broken)
    for md in ['MD2', 'MD4', 'MD5']:
        if not any(a['id'] == md for a in existing):
            new_algs.append(create_algorithm(
                id=md, family="DIGEST", status="RECOGNIZE_ONLY",
                klass="RECOGNIZE_AND_REJECT", digest_length=16,
                failure_verdicts=["FORBIDDEN_ALGORITHM"]
            ))
    
    # SHA-0, SHA-1 (broken)
    for sha in ['SHA-0', 'SHA-1']:
        if not any(a['id'] == sha for a in existing):
            new_algs.append(create_algorithm(
                id=sha, family="DIGEST", status="RECOGNIZE_ONLY",
                klass="RECOGNIZE_AND_REJECT", digest_length=20,
                failure_verdicts=["FORBIDDEN_ALGORITHM"]
            ))
    
    # RIPEMD family
    for bits in [128, 160, 256, 320]:
        new_algs.append(create_algorithm(
            id=f"RIPEMD-{bits}", family="DIGEST",
            digest_length=bits // 8
        ))
    
    # Tiger/Tiger2
    for tiger in ['Tiger', 'Tiger2']:
        new_algs.append(create_algorithm(
            id=tiger, family="DIGEST", digest_length=24
        ))
    
    # Whirlpool
    new_algs.append(create_algorithm(
        id="Whirlpool", family="DIGEST", digest_length=64,
        spec="ISO/IEC 10118-3"
    ))
    
    # SM3 (Chinese standard)
    new_algs.append(create_algorithm(
        id="SM3", family="DIGEST", digest_length=32,
        spec="GM/T 0004-2012"
    ))
    
    # Streebog (GOST)
    for bits in [256, 512]:
        new_algs.append(create_algorithm(
            id=f"Streebog-{bits}", family="DIGEST",
            digest_length=bits // 8, spec="GOST R 34.11-2012"
        ))
    
    # GOST R 34.11-94
    new_algs.append(create_algorithm(
        id="GOST-R-34.11-94", family="DIGEST", digest_length=32
    ))
    
    # HAS-160
    new_algs.append(create_algorithm(
        id="HAS-160", family="DIGEST", digest_length=20
    ))
    
    # HAVAL family
    for bits in [128, 160, 192, 224, 256]:
        for rounds in [3, 4, 5]:
            new_algs.append(create_algorithm(
                id=f"HAVAL-{bits}-{rounds}", family="DIGEST",
                digest_length=bits // 8
            ))
    
    # PANAMA
    new_algs.append(create_algorithm(
        id="PANAMA", family="DIGEST", digest_length=32
    ))
    
    # RadioGatún
    new_algs.append(create_algorithm(
        id="RadioGatun", family="DIGEST"
    ))
    
    # Skein family
    for bits in [256, 512, 1024]:
        for out in [128, 160, 224, 256, 384, 512]:
            if out <= bits:
                new_algs.append(create_algorithm(
                    id=f"Skein-{bits}-{out}", family="DIGEST",
                    digest_length=out // 8
                ))
    
    # SHA-3 candidates
    for name in ['Groestl', 'JH', 'CubeHash', 'Luffa', 'Shabal', 'Echo', 'Fugue', 'Hamsi', 'MD6']:
        for bits in [224, 256, 384, 512]:
            new_algs.append(create_algorithm(
                id=f"{name}-{bits}", family="DIGEST",
                digest_length=bits // 8
            ))
    
    log(f"Added {len(new_algs)} DIGEST algorithms")
    return new_algs

def expand_macs(existing: List[Dict]) -> List[Dict]:
    """Expand MAC family."""
    log("Expanding MAC family...")
    new_algs = []
    
    # HMAC with all hashes
    hashes = ['MD5', 'SHA-1', 'SHA-224', 'SHA-256', 'SHA-384', 'SHA-512',
              'SHA3-224', 'SHA3-256', 'SHA3-384', 'SHA3-512',
              'RIPEMD-160', 'SM3', 'Streebog-256', 'Streebog-512',
              'BLAKE2b-256', 'BLAKE2b-512', 'BLAKE2s-256', 'BLAKE3']
    
    for h in hashes:
        id = f"HMAC-{h}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="MAC", spec="RFC 2104",
                notes=f"HMAC with {h}"
            ))
    
    # CMAC variants
    for cipher in ['AES-128', 'AES-192', 'AES-256', 'DES', '3DES',
                   'Camellia-128', 'Camellia-192', 'Camellia-256']:
        new_algs.append(create_algorithm(
            id=f"{cipher}-CMAC", family="MAC",
            spec="NIST SP 800-38B"
        ))
    
    # GMAC variants
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-GMAC", family="MAC",
            spec="NIST SP 800-38D"
        ))
    
    # PMAC
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-PMAC", family="MAC"
        ))
    
    # CBC-MAC
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-CBC-MAC", family="MAC"
        ))
    
    # Poly1305
    new_algs.append(create_algorithm(
        id="Poly1305", family="MAC", spec="RFC 7539"
    ))
    
    # SipHash
    for variant in ['SipHash-2-4', 'SipHash-4-8']:
        for bits in [64, 128, 256]:
            new_algs.append(create_algorithm(
                id=f"{variant}-{bits}", family="MAC"
            ))
    
    # UMAC
    for bits in [64, 128]:
        new_algs.append(create_algorithm(
            id=f"UMAC-{bits}", family="MAC", spec="RFC 4418"
        ))
    
    # VMAC
    new_algs.append(create_algorithm(
        id="VMAC", family="MAC"
    ))
    
    # KMAC (already have, but ensure complete)
    for bits in [128, 256]:
        id = f"KMAC{bits}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="MAC", status="COMPLETE",
                klass="PURE_MJS", spec="NIST SP 800-185",
                module_paths=["crypto/kmac.mjs"]
            ))
    
    # GOST MAC
    new_algs.append(create_algorithm(
        id="GOST-28147-89-MAC", family="MAC",
        spec="GOST 28147-89"
    ))
    
    # SM4-MAC
    new_algs.append(create_algorithm(
        id="SM4-MAC", family="MAC", spec="GM/T 0002-2012"
    ))
    
    log(f"Added {len(new_algs)} MAC algorithms")
    return new_algs

def expand_kdfs(existing: List[Dict]) -> List[Dict]:
    """Expand KDF family."""
    log("Expanding KDF family...")
    new_algs = []
    
    # HKDF variants
    for h in ['SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-512', 'BLAKE2b', 'BLAKE2s']:
        id = f"HKDF-{h}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="KDF", spec="RFC 5869"
            ))
    
    # PBKDF2 variants
    for h in ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-512']:
        id = f"PBKDF2-HMAC-{h}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="KDF", spec="RFC 2898"
            ))
    
    # scrypt
    if not any(a['id'] == 'scrypt' for a in existing):
        new_algs.append(create_algorithm(
            id="scrypt", family="KDF", spec="RFC 7914"
        ))
    
    # Argon2 variants
    for variant in ['Argon2d', 'Argon2i', 'Argon2id']:
        new_algs.append(create_algorithm(
            id=variant, family="KDF", spec="RFC 9106"
        ))
    
    # bcrypt
    new_algs.append(create_algorithm(
        id="bcrypt", family="KDF"
    ))
    
    # Balloon hashing
    new_algs.append(create_algorithm(
        id="Balloon", family="KDF"
    ))
    
    # SP 800-108 KDFs
    for mode in ['counter', 'feedback', 'double-pipeline']:
        for h in ['SHA-256', 'SHA-384', 'SHA-512']:
            new_algs.append(create_algorithm(
                id=f"SP800-108-{mode}-{h}", family="KDF",
                spec="NIST SP 800-108"
            ))
    
    # SP 800-56C
    new_algs.append(create_algorithm(
        id="SP800-56C", family="KDF", spec="NIST SP 800-56C"
    ))
    
    # TLS PRF
    for h in ['SHA-256', 'SHA-384', 'SHA-512']:
        new_algs.append(create_algorithm(
            id=f"TLS-PRF-{h}", family="KDF", spec="RFC 5246"
        ))
    
    # SSH KDF
    for h in ['SHA-256', 'SHA-384', 'SHA-512']:
        new_algs.append(create_algorithm(
            id=f"SSH-KDF-{h}", family="KDF", spec="RFC 4253"
        ))
    
    # IKEv2 PRF
    for h in ['SHA-256', 'SHA-384', 'SHA-512']:
        new_algs.append(create_algorithm(
            id=f"IKEv2-PRF-{h}", family="KDF", spec="RFC 5996"
        ))
    
    log(f"Added {len(new_algs)} KDF algorithms")
    return new_algs

def expand_signatures(existing: List[Dict]) -> List[Dict]:
    """Expand SIGNATURE family."""
    log("Expanding SIGNATURE family...")
    new_algs = []
    
    # EdDSA variants
    for curve in ['Ed25519', 'Ed448', 'Ed25519ph', 'Ed448ph']:
        if not any(a['id'] == curve for a in existing):
            new_algs.append(create_algorithm(
                id=curve, family="SIGNATURE", spec="RFC 8032"
            ))
    
    # ECDSA variants
    for curve in ['P-256', 'P-384', 'P-521', 'secp256k1', 'brainpoolP256r1', 'brainpoolP384r1', 'brainpoolP512r1']:
        for h in ['SHA-256', 'SHA-384', 'SHA-512']:
            new_algs.append(create_algorithm(
                id=f"ECDSA-{curve}-{h}", family="SIGNATURE",
                spec="FIPS 186-4"
            ))
    
    # RSA variants
    for padding in ['PKCS1-v1_5', 'PSS']:
        for bits in [2048, 3072, 4096]:
            for h in ['SHA-256', 'SHA-384', 'SHA-512']:
                new_algs.append(create_algorithm(
                    id=f"RSA-{bits}-{padding}-{h}", family="SIGNATURE",
                    spec="PKCS#1" if padding == 'PKCS1-v1_5' else "RFC 8017"
                ))
    
    # DSA
    for bits in [1024, 2048, 3072]:
        new_algs.append(create_algorithm(
            id=f"DSA-{bits}", family="SIGNATURE", spec="FIPS 186-4"
        ))
    
    # ML-DSA (already have)
    for param in ['44', '65', '87']:
        id = f"ML-DSA-{param}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="SIGNATURE", spec="FIPS 204"
            ))
    
    # SLH-DSA (SPHINCS+)
    for hash_fn in ['SHA2', 'SHAKE']:
        for sec in [128, 192, 256]:
            for speed in ['s', 'f']:
                new_algs.append(create_algorithm(
                    id=f"SLH-DSA-{hash_fn}-{sec}{speed}", family="SIGNATURE",
                    spec="FIPS 205"
                ))
    
    # Hash-based signatures
    for scheme in ['XMSS', 'LMS', 'HSS']:
        for h in ['SHA-256', 'SHA-512', 'SHAKE-256']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{h}", family="SIGNATURE"
            ))
    
    # Code-based
    for scheme in ['Classic-McEliece', 'BIKE', 'HQC']:
        for param in ['348864', '460896', '6688128', '6960119']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="SIGNATURE"
            ))
    
    # Multivariate
    for scheme in ['Rainbow', 'GeMMS', 'UOV']:
        for param in ['I', 'III', 'V', 'VI']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="SIGNATURE"
            ))
    
    # Lattice-based (beyond ML-DSA)
    for scheme in ['NTRU', 'FALCON']:
        for param in ['512', '768', '1024']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="SIGNATURE"
            ))
    
    # Isogeny-based
    new_algs.append(create_algorithm(
        id="CSIDH-512", family="SIGNATURE"
    ))
    
    # Schnorr signatures
    for curve in ['secp256k1', 'Ed25519', 'P-256']:
        new_algs.append(create_algorithm(
            id=f"Schnorr-{curve}", family="SIGNATURE"
        ))
    
    # BLS signatures
    for curve in ['BLS12-381', 'BLS12-377', 'BN254']:
        new_algs.append(create_algorithm(
            id=f"BLS-{curve}", family="SIGNATURE"
        ))
    
    log(f"Added {len(new_algs)} SIGNATURE algorithms")
    return new_algs

def expand_kems(existing: List[Dict]) -> List[Dict]:
    """Expand KEM family."""
    log("Expanding KEM family...")
    new_algs = []
    
    # ECDH variants
    for curve in ['X25519', 'X448', 'P-256', 'P-384', 'P-521', 'secp256k1']:
        if not any(a['id'] == curve for a in existing):
            new_algs.append(create_algorithm(
                id=curve, family="KEM", spec="RFC 7748" if 'X' in curve else "NIST SP 800-56A"
            ))
    
    # ML-KEM (already have)
    for param in ['512', '768', '1024']:
        id = f"ML-KEM-{param}"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="KEM", spec="FIPS 203"
            ))
    
    # Code-based KEMs
    for scheme in ['Classic-McEliece', 'BIKE', 'HQC']:
        for param in ['348864', '460896', '6688128', '6960119']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="KEM"
            ))
    
    # Lattice-based KEMs (beyond ML-KEM)
    for scheme in ['NTRU', 'SABER', 'NTRU-Prime']:
        for param in ['512', '768', '1024']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="KEM"
            ))
    
    # Isogeny-based
    new_algs.append(create_algorithm(
        id="SIDH-503", family="KEM"
    ))
    new_algs.append(create_algorithm(
        id="CSIDH-512", family="KEM"
    ))
    
    # RSA-KEM
    for bits in [2048, 3072, 4096]:
        new_algs.append(create_algorithm(
            id=f"RSA-KEM-{bits}", family="KEM", spec="RFC 5990"
        ))
    
    log(f"Added {len(new_algs)} KEM algorithms")
    return new_algs

def expand_aead(existing: List[Dict]) -> List[Dict]:
    """Expand AEAD family."""
    log("Expanding AEAD family...")
    new_algs = []
    
    # AES-GCM variants
    for bits in [128, 192, 256]:
        id = f"AES-{bits}-GCM"
        if not any(a['id'] == id for a in existing):
            new_algs.append(create_algorithm(
                id=id, family="AEAD", spec="NIST SP 800-38D"
            ))
    
    # ChaCha20-Poly1305
    if not any(a['id'] == 'ChaCha20-Poly1305' for a in existing):
        new_algs.append(create_algorithm(
            id="ChaCha20-Poly1305", family="AEAD", spec="RFC 7539"
        ))
    
    # XChaCha20-Poly1305
    if not any(a['id'] == 'XChaCha20-Poly1305' for a in existing):
        new_algs.append(create_algorithm(
            id="XChaCha20-Poly1305", family="AEAD"
        ))
    
    # AES-CCM
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-CCM", family="AEAD", spec="NIST SP 800-38C"
        ))
    
    # AES-EAX
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-EAX", family="AEAD"
        ))
    
    # AES-OCB
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-OCB", family="AEAD", spec="RFC 7253"
        ))
    
    # AES-SIV
    for bits in [128, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}-SIV", family="AEAD", spec="RFC 5297"
        ))
    
    # AES-GCM-SIV
    if not any(a['id'] == 'AES-256-GCM-SIV' for a in existing):
        new_algs.append(create_algorithm(
            id="AES-256-GCM-SIV", family="AEAD", spec="RFC 8452"
        ))
    
    # AEGIS
    for variant in ['AEGIS-128', 'AEGIS-128L', 'AEGIS-256']:
        new_algs.append(create_algorithm(
            id=variant, family="AEAD"
        ))
    
    # MORUS
    for variant in ['MORUS-640-128', 'MORUS-1280-128', 'MORUS-1280-256']:
        new_algs.append(create_algorithm(
            id=variant, family="AEAD"
        ))
    
    # OCB variants
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"OCB-{bits}", family="AEAD"
        ))
    
    log(f"Added {len(new_algs)} AEAD algorithms")
    return new_algs

def expand_stream_ciphers(existing: List[Dict]) -> List[Dict]:
    """Expand STREAM_CIPHER family."""
    log("Expanding STREAM_CIPHER family...")
    new_algs = []
    
    # ChaCha variants
    for rounds in [20, 12, 8]:
        new_algs.append(create_algorithm(
            id=f"ChaCha{rounds}", family="STREAM_CIPHER"
        ))
    
    # Salsa20 variants
    for rounds in [20, 12, 8]:
        new_algs.append(create_algorithm(
            id=f"Salsa20-{rounds}", family="STREAM_CIPHER"
        ))
    
    # RC4 (broken)
    new_algs.append(create_algorithm(
        id="RC4", family="STREAM_CIPHER", status="RECOGNIZE_ONLY",
        klass="RECOGNIZE_AND_REJECT", failure_verdicts=["FORBIDDEN_ALGORITHM"]
    ))
    
    # A5/1, A5/2 (GSM, broken)
    for variant in ['A5-1', 'A5-2', 'A5-3']:
        new_algs.append(create_algorithm(
            id=variant, family="STREAM_CIPHER", status="RECOGNIZE_ONLY",
            klass="RECOGNIZE_AND_REJECT", failure_verdicts=["FORBIDDEN_ALGORITHM"]
        ))
    
    # ZUC (Chinese standard)
    new_algs.append(create_algorithm(
        id="ZUC", family="STREAM_CIPHER", spec="GM/T 0001-2012"
    ))
    
    # SOBER
    new_algs.append(create_algorithm(
        id="SOBER-t16", family="STREAM_CIPHER"
    ))
    
    # Rabbit
    new_algs.append(create_algorithm(
        id="Rabbit", family="STREAM_CIPHER"
    ))
    
    # HC-128, HC-256
    for bits in [128, 256]:
        new_algs.append(create_algorithm(
            id=f"HC-{bits}", family="STREAM_CIPHER"
        ))
    
    # VMPC
    new_algs.append(create_algorithm(
        id="VMPC", family="STREAM_CIPHER"
    ))
    
    # Py
    new_algs.append(create_algorithm(
        id="Py", family="STREAM_CIPHER"
    ))
    
    # eSTREAM portfolio
    for cipher in ['Grain-128a', 'MICKEY-2.0', 'Trivium', 'MOSH']:
        new_algs.append(create_algorithm(
            id=cipher, family="STREAM_CIPHER"
        ))
    
    log(f"Added {len(new_algs)} STREAM_CIPHER algorithms")
    return new_algs

def expand_block_ciphers(existing: List[Dict]) -> List[Dict]:
    """Expand BLOCK_CIPHER family (new family)."""
    log("Expanding BLOCK_CIPHER family...")
    new_algs = []
    
    # AES variants
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"AES-{bits}", family="BLOCK_CIPHER", spec="FIPS 197"
        ))
    
    # DES, 3DES
    new_algs.append(create_algorithm(
        id="DES", family="BLOCK_CIPHER", status="RECOGNIZE_ONLY",
        klass="RECOGNIZE_AND_REJECT", failure_verdicts=["FORBIDDEN_ALGORITHM"]
    ))
    new_algs.append(create_algorithm(
        id="3DES", family="BLOCK_CIPHER", status="RECOGNIZE_ONLY",
        klass="RECOGNIZE_AND_REJECT", failure_verdicts=["FORBIDDEN_ALGORITHM"]
    ))
    
    # Camellia
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"Camellia-{bits}", family="BLOCK_CIPHER", spec="RFC 3713"
        ))
    
    # Twofish
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"Twofish-{bits}", family="BLOCK_CIPHER"
        ))
    
    # Serpent
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"Serpent-{bits}", family="BLOCK_CIPHER"
        ))
    
    # IDEA
    new_algs.append(create_algorithm(
        id="IDEA", family="BLOCK_CIPHER"
    ))
    
    # CAST5
    new_algs.append(create_algorithm(
        id="CAST5", family="BLOCK_CIPHER", spec="RFC 2144"
    ))
    
    # Blowfish
    new_algs.append(create_algorithm(
        id="Blowfish", family="BLOCK_CIPHER"
    ))
    
    # SM4 (Chinese standard)
    new_algs.append(create_algorithm(
        id="SM4", family="BLOCK_CIPHER", spec="GM/T 0002-2012"
    ))
    
    # ARIA (Korean standard)
    for bits in [128, 192, 256]:
        new_algs.append(create_algorithm(
            id=f"ARIA-{bits}", family="BLOCK_CIPHER"
        ))
    
    # SEED (Korean standard)
    new_algs.append(create_algorithm(
        id="SEED", family="BLOCK_CIPHER"
    ))
    
    # GOST 28147-89
    new_algs.append(create_algorithm(
        id="GOST-28147-89", family="BLOCK_CIPHER", spec="GOST 28147-89"
    ))
    
    # Kuznyechik (GOST R 34.12-2015)
    new_algs.append(create_algorithm(
        id="Kuznyechik", family="BLOCK_CIPHER", spec="GOST R 34.12-2015"
    ))
    
    # Magma (GOST R 34.12-2015)
    new_algs.append(create_algorithm(
        id="Magma", family="BLOCK_CIPHER", spec="GOST R 34.12-2015"
    ))
    
    # Modes of operation (these are not algorithms per se, but configurations)
    # We'll add them as separate entries for completeness
    modes = ['ECB', 'CBC', 'CFB', 'OFB', 'CTR', 'XTS', 'CBC-MAC']
    for cipher in ['AES-128', 'AES-192', 'AES-256']:
        for mode in modes:
            new_algs.append(create_algorithm(
                id=f"{cipher}-{mode}", family="BLOCK_CIPHER",
                notes=f"{cipher} in {mode} mode"
            ))
    
    log(f"Added {len(new_algs)} BLOCK_CIPHER algorithms")
    return new_algs

def expand_pke(existing: List[Dict]) -> List[Dict]:
    """Expand PKE (Public Key Encryption) family."""
    log("Expanding PKE family...")
    new_algs = []
    
    # RSA encryption
    for padding in ['PKCS1-v1_5', 'OAEP']:
        for bits in [2048, 3072, 4096]:
            for h in ['SHA-256', 'SHA-384', 'SHA-512']:
                new_algs.append(create_algorithm(
                    id=f"RSA-{bits}-{padding}-{h}", family="PKE",
                    spec="PKCS#1" if padding == 'PKCS1-v1_5' else "RFC 8017"
                ))
    
    # ElGamal
    for bits in [2048, 3072, 4096]:
        new_algs.append(create_algorithm(
            id=f"ElGamal-{bits}", family="PKE"
        ))
    
    # ECIES
    for curve in ['P-256', 'P-384', 'P-521', 'secp256k1']:
        new_algs.append(create_algorithm(
            id=f"ECIES-{curve}", family="PKE"
        ))
    
    # Integrated Encryption Schemes
    for scheme in ['DLIES', 'XTR-IES']:
        new_algs.append(create_algorithm(
            id=scheme, family="PKE"
        ))
    
    # Post-quantum PKE
    for scheme in ['NTRU', 'SABER', 'NTRU-Prime', 'Classic-McEliece']:
        for param in ['512', '768', '1024']:
            new_algs.append(create_algorithm(
                id=f"{scheme}-{param}", family="PKE"
            ))
    
    # Identity-based encryption
    new_algs.append(create_algorithm(
        id="Boneh-Franklin-IBE", family="PKE"
    ))
    
    # Attribute-based encryption
    for scheme in ['CP-ABE', 'KP-ABE']:
        new_algs.append(create_algorithm(
            id=scheme, family="PKE"
        ))
    
    log(f"Added {len(new_algs)} PKE algorithms")
    return new_algs

def expand_advanced_crypto(existing: List[Dict]) -> List[Dict]:
    """Expand advanced cryptographic primitives."""
    log("Expanding advanced cryptographic families...")
    new_algs = []
    
    # FHE (Fully Homomorphic Encryption)
    for scheme in ['BFV', 'BGV', 'TFHE', 'CKKS', 'FHEW']:
        new_algs.append(create_algorithm(
            id=scheme, family="FHE"
        ))
    
    # Zero-knowledge proof systems
    for scheme in ['Groth16', 'PLONK', 'Marlin', 'Bulletproofs', 'Halo2', 'STARK']:
        new_algs.append(create_algorithm(
            id=scheme, family="ZKP"
        ))
    
    # Commitment schemes
    for scheme in ['Pedersen', 'Fujisaki-Okamoto', 'Hash-commit']:
        new_algs.append(create_algorithm(
            id=scheme, family="COMMITMENT"
        ))
    
    # Secret sharing
    for scheme in ['Shamir', 'Blakley', 'Verifiable-Secret-Sharing']:
        new_algs.append(create_algorithm(
            id=scheme, family="SECRET_SHARING"
        ))
    
    # Threshold cryptography
    for scheme in ['Threshold-RSA', 'Threshold-ECDSA', 'Threshold-EdDSA']:
        new_algs.append(create_algorithm(
            id=scheme, family="THRESHOLD"
        ))
    
    # PAKE (Password-Authenticated Key Exchange)
    for scheme in ['SRP-6a', 'OPAQUE', 'SPAKE2', 'J-PAKE']:
        new_algs.append(create_algorithm(
            id=scheme, family="PAKE"
        ))
    
    # Blind signatures
    for scheme in ['RSA-blind', 'Chaum-blind', 'BLS-blind']:
        new_algs.append(create_algorithm(
            id=scheme, family="SIGNATURE"
        ))
    
    # Ring signatures
    for scheme in ['Ring-Signature', 'Linkable-Ring-Signature', 'Concentrator-Ring']:
        new_algs.append(create_algorithm(
            id=scheme, family="SIGNATURE"
        ))
    
    # Group signatures
    for scheme in ['BS', 'ACJT', 'Cam-Lys']:
        new_algs.append(create_algorithm(
            id=scheme, family="SIGNATURE"
        ))
    
    # Multi-signatures
    for scheme in ['MuSig', 'MuSig2', 'FROST']:
        new_algs.append(create_algorithm(
            id=scheme, family="SIGNATURE"
        ))
    
    # Aggregate signatures
    for scheme in ['BLS-Aggregate', 'Boneh-Lynn-Shacham']:
        new_algs.append(create_algorithm(
            id=scheme, family="SIGNATURE"
        ))
    
    # VRF (Verifiable Random Functions)
    for scheme in ['ECVRF-ED25519', 'ECVRF-P256', 'RSA-FDH-VRF']:
        new_algs.append(create_algorithm(
            id=scheme, family="VRF"
        ))
    
    # VDF (Verifiable Delay Functions)
    for scheme in ['Wesolowski-VDF', 'Pietrzak-VDF']:
        new_algs.append(create_algorithm(
            id=scheme, family="VDF"
        ))
    
    # Time-lock puzzles
    new_algs.append(create_algorithm(
        id="Rivest-Time-Lock", family="PKE"
    ))
    
    # Format-preserving encryption
    for scheme in ['FF1', 'FF3-1']:
        new_algs.append(create_algorithm(
            id=scheme, family="CIPHER", spec="NIST SP 800-38G"
        ))
    
    # Searchable encryption
    for scheme in ['SSE', 'SE']:
        new_algs.append(create_algorithm(
            id=scheme, family="PKE"
        ))
    
    # Proxy re-encryption
    for scheme in ['BBS98-PRE', 'ATR-PRE']:
        new_algs.append(create_algorithm(
            id=scheme, family="PKE"
        ))
    
    # Deniable encryption
    for scheme in ['OTR', 'Deniable-RSA']:
        new_algs.append(create_algorithm(
            id=scheme, family="PKE"
        ))
    
    log(f"Added {len(new_algs)} advanced cryptographic algorithms")
    return new_algs

def main():
    log("Starting comprehensive registry expansion")
    
    registry_path = "/home/falsealias/src/proofbundle/ALGORITHM_REGISTRY.json"
    
    # Load existing registry
    try:
        with open(registry_path, 'r') as f:
            reg = json.load(f)
        log(f"Loaded registry with {len(reg)} algorithms")
    except Exception as e:
        log(f"Failed to load registry: {e}", "ERROR")
        return 1
    
    # Expand all families
    new_algs = expand_all_families(reg)
    
    # Add new algorithms to registry
    reg.extend(new_algs)
    
    # Save expanded registry
    try:
        with open(registry_path, 'w') as f:
            json.dump(reg, f, indent=2)
        log(f"Saved registry with {len(reg)} algorithms")
    except Exception as e:
        log(f"Failed to save registry: {e}", "ERROR")
        return 1
    
    log("Registry expansion complete")
    return 0

if __name__ == "__main__":
    sys.exit(main())
