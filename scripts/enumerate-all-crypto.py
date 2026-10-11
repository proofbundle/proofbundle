#!/usr/bin/env python3
"""
Comprehensive cryptographic algorithm enumeration.
Every algorithm category: standardized, broken, proprietary, experimental, theoretical.
"""

import json

# Complete cryptographic algorithm taxonomy
ALGORITHMS = {
    "DIGEST": {
        "STANDARDIZED": [
            "MD2", "MD4", "MD5", "SHA-0", "SHA-1", 
            "SHA-224", "SHA-256", "SHA-384", "SHA-512", "SHA-512/224", "SHA-512/256",
            "SHA3-224", "SHA3-256", "SHA3-384", "SHA3-512",
            "SHAKE128", "SHAKE256",
            "BLAKE2b-256", "BLAKE2b-384", "BLAKE2b-512", "BLAKE2s-128", "BLAKE2s-160", "BLAKE2s-224", "BLAKE2s-256",
            "BLAKE3", "BLAKE3-256",
            "Keccak-224", "Keccak-256", "Keccak-384", "Keccak-512",
            "RIPEMD-128", "RIPEMD-160", "RIPEMD-256", "RIPEMD-320",
            "Tiger", "Tiger2",
            "Whirlpool",
            "SM3",
            "GOST-R-34.11-94", "Streebog-256", "Streebog-512",
            "HAS-160",
            "SipHash-2-4-64", "SipHash-2-4-128", "SipHash-4-8-64", "SipHash-4-8-128"
        ],
        "BROKEN_DEPRECATED": [
            "CRC32", "CRC64",
            "Adler32",
            "FNV-1", "FNV-1a",
            "MurmurHash3-32", "MurmurHash3-128",
            "CityHash-64", "CityHash-128",
            "xxHash-32", "xxHash-64", "xxHash-128"
        ],
        "PROPRIETARY": [
            "Grindahl-256", "Grindahl-512",
            "Spectral-Hash",
            "NHASH"
        ]
    },
    "MAC": {
        "STANDARDIZED": [
            "HMAC-MD5", "HMAC-SHA-1", "HMAC-SHA-224", "HMAC-SHA-256", "HMAC-SHA-384", "HMAC-SHA-512",
            "HMAC-SHA3-224", "HMAC-SHA3-256", "HMAC-SHA3-384", "HMAC-SHA3-512",
            "HMAC-BLAKE2b-256", "HMAC-BLAKE2b-512", "HMAC-BLAKE2s-256",
            "CMAC-AES-128", "CMAC-AES-192", "CMAC-AES-256",
            "GMAC-AES-128", "GMAC-AES-192", "GMAC-AES-256",
            "PMAC-AES-128", "PMAC-AES-256",
            "KMAC128", "KMAC256",
            "Poly1305-AES", "Poly1305-ChaCha20",
            "SipHash", "SipHash-2-4", "SipHash-4-8",
            "OMAC", "XCBC-MAC",
            "CBC-MAC", "EMAC",
            "UMAC-32", "UMAC-64", "UMAC-96", "UMAC-128",
            "VMAC-64", "VMAC-128"
        ],
        "BROKEN_DEPRECATED": [
            "CBC-MAC-DES",
            "ISO9797-MAC1", "ISO9797-MAC2", "ISO9797-MAC3"
        ]
    },
    "KDF": {
        "STANDARDIZED": [
            "PBKDF2-HMAC-SHA-1", "PBKDF2-HMAC-SHA-256", "PBKDF2-HMAC-SHA-512",
            "HKDF-SHA-256", "HKDF-SHA-384", "HKDF-SHA-512",
            "HKDF-BLAKE2b-256", "HKDF-BLAKE2s-256",
            "scrypt", "Argon2d", "Argon2i", "Argon2id",
            "bcrypt", "balloon",
            "SP800-108-KDF-CTR", "SP800-108-KDF-FEEDBACK", "SP800-108-KDF-PIPELINE",
            "SP800-56C-KDF",
            "TLS-PRF-MD5-SHA-1", "TLS-PRF-SHA-256", "TLS-PRF-SHA-384",
            "SSH-KDF-SHA-1", "SSH-KDF-SHA-256", "SSH-KDF-SHA-512",
            "IKEv2-PRF-SHA-1", "IKEv2-PRF-SHA-256", "IKEv2-PRF-SHA-384",
            "SRP-KDF", "OPAQUE-KDF",
            "Concat-KDF-SHA-256", "Concat-KDF-SHA-384", "Concat-KDF-SHA-512",
            "X9.63-KDF-SHA-256", "X9.63-KDF-SHA-384", "X9.63-KDF-SHA-512",
            "NIST-SP-800-108", "NIST-SP-800-56A", "NIST-SP-800-56B", "NIST-SP-800-56C"
        ],
        "PROPRIETARY": [
            "ANSI-X9.42-KDF",
            "SEED-KDF"
        ]
    },
    "CIPHER_SYMMETRIC": {
        "BLOCK": {
            "STANDARDIZED": [
                "AES-128-ECB", "AES-128-CBC", "AES-128-CFB", "AES-128-OFB", "AES-128-CTR", "AES-128-GCM", "AES-128-CCM", "AES-128-XTS",
                "AES-192-ECB", "AES-192-CBC", "AES-192-CFB", "AES-192-OFB", "AES-192-CTR", "AES-192-GCM", "AES-192-CCM", "AES-192-XTS",
                "AES-256-ECB", "AES-256-CBC", "AES-256-CFB", "AES-256-OFB", "AES-256-CTR", "AES-256-GCM", "AES-256-CCM", "AES-256-XTS",
                "Camellia-128-ECB", "Camellia-128-CBC", "Camellia-128-CFB", "Camellia-128-OFB", "Camellia-128-CTR",
                "Camellia-192-ECB", "Camellia-192-CBC", "Camellia-192-CFB", "Camellia-192-OFB", "Camellia-192-CTR",
                "Camellia-256-ECB", "Camellia-256-CBC", "Camellia-256-CFB", "Camellia-256-OFB", "Camellia-256-CTR",
                "ARIA-128-ECB", "ARIA-128-CBC", "ARIA-128-CTR",
                "ARIA-192-ECB", "ARIA-192-CBC", "ARIA-192-CTR",
                "ARIA-256-ECB", "ARIA-256-CBC", "ARIA-256-CTR",
                "SEED-ECB", "SEED-CBC", "SEED-CFB", "SEED-OFB", "SEED-CTR",
                "SM4-ECB", "SM4-CBC", "SM4-CTR", "SM4-GCM", "SM4-CCM",
                "Twofish-128-ECB", "Twofish-128-CBC", "Twofish-128-CTR",
                "Twofish-192-ECB", "Twofish-192-CBC", "Twofish-192-CTR",
                "Twofish-256-ECB", "Twofish-256-CBC", "Twofish-256-CTR",
                "Serpent-128-ECB", "Serpent-128-CBC", "Serpent-128-CTR",
                "Serpent-192-ECB", "Serpent-192-CBC", "Serpent-192-CTR",
                "Serpent-256-ECB", "Serpent-256-CBC", "Serpent-256-CTR",
                "CAST5-ECB", "CAST5-CBC", "CAST5-CFB", "CAST5-OFB", "CAST5-CTR",
                "CAST6-128-ECB", "CAST6-128-CBC", "CAST6-128-CTR",
                "CAST6-192-ECB", "CAST6-192-CBC", "CAST6-192-CTR",
                "CAST6-256-ECB", "CAST6-256-CBC", "CAST6-256-CTR",
                "IDEA-ECB", "IDEA-CBC", "IDEA-CFB", "IDEA-OFB",
                "Blowfish-ECB", "Blowfish-CBC", "Blowfish-CFB", "Blowfish-OFB",
                "3DES-ECB", "3DES-CBC", "3DES-CFB", "3DES-OFB",
                "DES-ECB", "DES-CBC", "DES-CFB", "DES-OFB",
                "GOST-28147-89-ECB", "GOST-28147-89-CBC", "GOST-28147-89-CFB", "GOST-28147-89-OFB", "GOST-28147-89-CTR",
                "Kuznyechik-ECB", "Kuznyechik-CBC", "Kuznyechik-CTR",
                "Magma-ECB", "Magma-CBC", "Magma-CTR",
                "RC2-ECB", "RC2-CBC", "RC2-CFB", "RC2-OFB",
                "RC5-ECB", "RC5-CBC", "RC5-CFB", "RC5-OFB",
                "RC6-ECB", "RC6-CBC", "RC6-CFB", "RC6-OFB",
                "MARS-128-ECB", "MARS-128-CBC", "MARS-128-CTR",
                "MARS-192-ECB", "MARS-192-CBC", "MARS-192-CTR",
                "MARS-256-ECB", "MARS-256-CBC", "MARS-256-CTR",
                "Kalyna-128-ECB", "Kalyna-128-CBC", "Kalyna-128-CTR",
                "Kalyna-256-ECB", "Kalyna-256-CBC", "Kalyna-256-CTR",
                "Kalyna-512-ECB", "Kalyna-512-CBC", "Kalyna-512-CTR"
            ],
            "AEAD": [
                "AES-128-GCM", "AES-192-GCM", "AES-256-GCM",
                "AES-128-CCM", "AES-192-CCM", "AES-256-CCM",
                "AES-128-OCB", "AES-192-OCB", "AES-256-OCB",
                "AES-128-EAX", "AES-192-EAX", "AES-256-EAX",
                "AES-128-SIV", "AES-256-SIV",
                "ChaCha20-Poly1305", "XChaCha20-Poly1305",
                "AEGIS-128", "AEGIS-128L", "AEGIS-256",
                "MORUS-640-128", "MORUS-1280-128", "MORUS-1280-256",
                "Ascon-128", "Ascon-128a", "Ascon-80pq",
                "GOST-Kuznyechik-MGM", "GOST-Magma-MGM",
                "SM4-GCM", "SM4-CCM"
            ],
            "BROKEN_DEPRECATED": [
                "DES", "2-Key-3DES", "RC4-40", "RC4-64", "RC4-128",
                "LCG-based-ciphers"
            ]
        },
        "STREAM": {
            "STANDARDIZED": [
                "ChaCha20", "ChaCha12", "ChaCha8", "XChaCha20", "XChaCha12", "XChaCha8",
                "Salsa20", "Salsa20/12", "Salsa20/8", "XSalsa20",
                "RC4-128",
                "ZUC-128", "ZUC-256",
                "SOBER-t16", "SOBER-t32",
                "HC-128", "HC-256",
                "Rabbit", "Rabbit-128",
                "VMPC",
                "Py", "Py6",
                "Mickey-128", "Mickey-256",
                "Grain-128", "Grain-128a",
                "Trivium",
                "DECIM",
                "F-FCSR", "F-FCSR-16",
                "LILI-128",
                "NLS",
                "Phelix",
                "PolarSSL-CTR-DRBG",
                "ISAAC", "ISAAC64",
                "PANAMA"
            ],
            "BROKEN_DEPRECATED": [
                "A5/1", "A5/2", "A5/3",
                "E0",
                "WEP-RC4"
            ]
        }
    },
    "CIPHER_ASYMMETRIC": {
        "PKE": {
            "STANDARDIZED": [
                "RSA-1024-PKCS1-v1_5", "RSA-2048-PKCS1-v1_5", "RSA-3072-PKCS1-v1_5", "RSA-4096-PKCS1-v1_5",
                "RSA-1024-OAEP-SHA-1", "RSA-2048-OAEP-SHA-1", "RSA-2048-OAEP-SHA-256", "RSA-3072-OAEP-SHA-256", "RSA-4096-OAEP-SHA-256",
                "RSA-2048-OAEP-SHA-384", "RSA-3072-OAEP-SHA-384", "RSA-4096-OAEP-SHA-384",
                "RSA-2048-OAEP-SHA-512", "RSA-3072-OAEP-SHA-512", "RSA-4096-OAEP-SHA-512",
                "ElGamal-1024", "ElGamal-2048", "ElGamal-3072", "ElGamal-4096",
                "DH-1024", "DH-2048", "DH-3072", "DH-4096", "DH-6144", "DH-8192",
                "ECDH-P-256", "ECDH-P-384", "ECDH-P-521",
                "ECDH-secp256k1", "ECDH-brainpoolP256r1", "ECDH-brainpoolP384r1", "ECDH-brainpoolP512r1",
                "ECDH-curve25519", "ECDH-curve448",
                "SM2",
                "GOST-R-34.10-2001", "GOST-R-34.10-2012-256", "GOST-R-34.10-2012-512",
                "ECIES-P-256", "ECIES-P-384", "ECIES-P-521", "ECIES-secp256k1",
                "PSEC", "ACE"
            ],
            "POST_QUANTUM_KEM": [
                "ML-KEM-512", "ML-KEM-768", "ML-KEM-1024",
                "FrodoKEM-640-SHAKE", "FrodoKEM-976-SHAKE", "FrodoKEM-1344-SHAKE",
                "FrodoKEM-640-AES", "FrodoKEM-976-AES", "FrodoKEM-1344-AES",
                "NTRU-HPS-2048-509", "NTRU-HPS-2048-677", "NTRU-HPS-4096-821",
                "NTRU-HRSS-701",
                "Saber-256", "Saber-512", "Saber-1024",
                "BIKE-L1", "BIKE-L3", "BIKE-L5",
                "HQC-128", "HQC-192", "HQC-256",
                "Classic-McEliece-348864", "Classic-McEliece-460896", "Classic-McEliece-6688128", "Classic-McEliece-6960119", "Classic-McEliece-8192128",
                "Kyber-512", "Kyber-768", "Kyber-1024",
                "SIKE-p434", "SIKE-p503", "SIKE-p610", "SIKE-p751"
            ],
            "BROKEN_DEPRECATED": [
                "RSA-512", "RSA-768",
                "DH-512", "DH-768"
            ]
        },
        "SIGNATURE": {
            "STANDARDIZED": [
                "RSA-1024-PKCS1-v1_5-SHA-1", "RSA-2048-PKCS1-v1_5-SHA-256", "RSA-3072-PKCS1-v1_5-SHA-256", "RSA-4096-PKCS1-v1_5-SHA-256",
                "RSA-2048-PKCS1-v1_5-SHA-384", "RSA-3072-PKCS1-v1_5-SHA-384", "RSA-4096-PKCS1-v1_5-SHA-384",
                "RSA-2048-PKCS1-v1_5-SHA-512", "RSA-3072-PKCS1-v1_5-SHA-512", "RSA-4096-PKCS1-v1_5-SHA-512",
                "RSA-2048-PSS-SHA-256", "RSA-3072-PSS-SHA-256", "RSA-4096-PSS-SHA-256",
                "RSA-2048-PSS-SHA-384", "RSA-3072-PSS-SHA-384", "RSA-4096-PSS-SHA-384",
                "RSA-2048-PSS-SHA-512", "RSA-3072-PSS-SHA-512", "RSA-4096-PSS-SHA-512",
                "DSA-1024-SHA-1", "DSA-2048-SHA-256", "DSA-3072-SHA-256",
                "ECDSA-P-256-SHA-256", "ECDSA-P-384-SHA-384", "ECDSA-P-521-SHA-512",
                "ECDSA-secp256k1-SHA-256",
                "ECDSA-brainpoolP256r1-SHA-256", "ECDSA-brainpoolP384r1-SHA-384", "ECDSA-brainpoolP512r1-SHA-512",
                "Ed25519", "Ed25519ph", "Ed25519ctx",
                "Ed448", "Ed448ph", "Ed448ctx",
                "SM2-SM3",
                "GOST-R-34.10-2001-GOST-R-34.11-94",
                "GOST-R-34.10-2012-256-GOST-R-34.11-2012-256",
                "GOST-R-34.10-2012-512-GOST-R-34.11-2012-512",
                "Schnorr-secp256k1", "Schnorr-P-256", "Schnorr-P-384",
                "BLS12-381", "BLS12-377", "BN254",
                "ECQV-P-256", "ECQV-P-384"
            ],
            "POST_QUANTUM": [
                "ML-DSA-44", "ML-DSA-65", "ML-DSA-87",
                "SLH-DSA-SHA2-128s", "SLH-DSA-SHA2-128f",
                "SLH-DSA-SHA2-192s", "SLH-DSA-SHA2-192f",
                "SLH-DSA-SHA2-256s", "SLH-DSA-SHA2-256f",
                "SLH-DSA-SHAKE-128s", "SLH-DSA-SHAKE-128f",
                "SLH-DSA-SHAKE-192s", "SLH-DSA-SHAKE-192f",
                "SLH-DSA-SHAKE-256s", "SLH-DSA-SHAKE-256f",
                "XMSS-SHA2_10_256", "XMSS-SHA2_16_256", "XMSS-SHA2_20_256",
                "XMSS-SHAKE_10_256", "XMSS-SHAKE_16_256", "XMSS-SHAKE_20_256",
                "XMSS-SHA2_10_512", "XMSS-SHA2_16_512", "XMSS-SHA2_20_512",
                "LMS-SHA256-M5-H5", "LMS-SHA256-M5-H10", "LMS-SHA256-M5-H15",
                "LMS-SHA256-M7-H5", "LMS-SHA256-M7-H10", "LMS-SHA256-M7-H15",
                "LMS-SHAKE256-M5-H5", "LMS-SHAKE256-M5-H10",
                "Rainbow-I", "Rainbow-III", "Rainbow-V", "Rainbow-VI", "Rainbow-VII", "Rainbow-IX",
                "GeMMS-1", "GeMMS-2", "GeMMS-3", "GeMMS-4",
                "UOV", "Mayo-1", "Mayo-2", "Mayo-3", "Mayo-5"
            ],
            "BROKEN_DEPRECATED": [
                "RSA-512-SHA-1", "RSA-768-SHA-1",
                "DSA-512-SHA-1", "DSA-768-SHA-1"
            ]
        }
    },
    "ADVANCED": {
        "IBE": [
            "Boneh-Franklin-BF-IBE",
            "Sakai-Kasahara-SK-IBE",
            "Boneh-Boyen-BB1-IBE",
            "Boneh-Boyen-BB2-IBE",
            "Gentry-IBE",
            "Waters-IBE"
        ],
        "ABE": [
            "BSW-CP-ABE",
            "KP-ABE-GPSW",
            "OW-CP-ABE",
            "MCP-ABE",
            "CP-ABE-BSW07",
            "CP-ABE-CPW13",
            "KP-ABE-ACPK11"
        ],
        "FHE": [
            "BFV", "BGV", "CKKS", "TFHE", "FHEW",
            "Gentry-FHE", "DGHV-FHE",
            "GSW-FHE",
            "FHE-DiCheLL",
            "FHE-OpenFHE-BFV", "FHE-OpenFHE-BGV", "FHE-OpenFHE-CKKS",
            "FHE-SEAL-BFV", "FHE-SEAL-CKKS"
        ],
        "ZKP": [
            "Groth16", "PLONK", "Marlin", "SuperSonic",
            "Bulletproofs", "Bulletproofs+",
            "Halo", "Halo2",
            "STARK", "Fractal",
            "Ligero", "Aurora", "Aurora2",
            "Spartan", "Virgo",
            "Zerocash", "Zether",
            "zk-SNARK-BN254", "zk-SNARK-BLS12-381",
            "zk-STARK-Field-64"
        ],
        "MPC": [
            "SPDZ", "SPDZ2", "Overdrive",
            "MASCOT", "TinyTD3",
            "BMR", "Garbled-Circuit-Yao",
            "GMW", "Goldreich-Micali-Wigderson",
            "Secret-Sharing-MPC",
            "Homomorphic-MPC",
            "OT-Extension", "IKNP-OT",
            "KOS-OT", "KKRT-OT"
        ],
        "COMMITMENT": [
            "Pedersen-Commitment",
            "Fujisaki-Okamoto-Commitment",
            "Hash-Commitment-SHA-256",
            "Hash-Commitment-SHA3-256",
            "Hash-Commitment-BLAKE2b-256",
            "ElGamal-Commitment",
            "Paillier-Commitment"
        ],
        "VRF": [
            "ECVRF-ED25519-SHA-512-Elligator2",
            "ECVRF-P-256-SHA-256-Elligator2",
            "RSA-FDH-VRF",
            "RSA-VRF-PSS",
            "GG-VRF",
            "MR-VRF"
        ],
        "VDF": [
            "Wesolowski-VDF",
            "Pietrzak-VDF",
            "Delfs-Goldwasser-VDF",
            "Minroot-VDF",
            "Sloth-VDF"
        ],
        "THRESHOLD": [
            "Shamir-Secret-Sharing",
            "Feldman-VSS",
            "Pedersen-VSS",
            "Pedersen-DKG",
            "Gennaro-DKG",
            "Threshold-RSA",
            "Threshold-ECDSA",
            "Threshold-EdDSA",
            "FROST-Ed25519", "FROST-Ed448", "FROST-P-256", "FROST-P-384",
            "MuSig2-Ed25519", "MuSig2-P-256",
            "ROAST-Ed25519", "ROAST-P-256"
        ],
        "PAKE": [
            "SRP-6a",
            "OPAQUE-H25519", "OPAQUE-P-256", "OPAQUE-P-384",
            "SPAKE2-P-256", "SPAKE2-P-384", "SPAKE2-Ed25519",
            "J-PAKE-P-256", "J-PAKE-P-384",
            "BSPAKE",
            "Dragonfly-SAE-P-256", "Dragonfly-SAE-P-384", "Dragonfly-SAE-P-521"
        ],
        "BLIND_SIGNATURE": [
            "RSA-Blind-Signature",
            "Chaum-Blind-Signature",
            "BBS-Blind-Signature",
            "Okamoto-Uchiyama-Blind",
            "Boldyreva-Blind-BLS"
        ],
        "RING_SIGNATURE": [
            "Ring-Signature-LSAG",
            "Ring-Signature-LSAG-Linkable",
            "Borromean-Ring-Signature",
            "Concentrator-Ring-Signature",
            "Fujisaki-Okamoto-Ring"
        ],
        "GROUP_SIGNATURE": [
            "BS-Group-Signature",
            "ACJT-Group-Signature",
            "Cam-Lys-Group-Signature",
            "BBS-Group-Signature",
            "BG-Group-Signature"
        ],
        "DENIABLE": [
            "OTR-Protocol",
            "Deniable-RSA",
            "Off-the-Record-Messaging",
            "PQ-OTR"
        ],
        "POST_QUANTUM_OTHER": [
            "CSIDH-512",
            "SIKE-p434", "SIKE-p503", "SIKE-p610", "SIKE-p751",
            "NTRU-Prime-sntrup761", "NTRU-Prime-sntrup857", "NTRU-Prime-sntrup953",
            "NTRU-Prime-ntrulpr653", "NTRU-Prime-ntrulpr761", "NTRU-Prime-ntrulpr857",
            "NTRU-Prime-ntrulpr953", "NTRU-Prime-ntrulpr1013", "NTRU-Prime-ntrulpr1277"
        ]
    }
}

def count_algorithms():
    total = 0
    counts = {}
    for family, subfamilies in ALGORITHMS.items():
        if isinstance(subfamilies, dict):
            for subfamily, categories in subfamilies.items():
                if isinstance(categories, dict):
                    for category, algos in categories.items():
                        key = f"{family}/{subfamily}/{category}"
                        counts[key] = len(algos)
                        total += len(algos)
                else:
                    key = f"{family}/{subfamily}"
                    counts[key] = len(categories)
                    total += len(categories)
        else:
            counts[family] = len(subfamilies)
            total += len(subfamilies)
    return total, counts

if __name__ == "__main__":
    total, counts = count_algorithms()
    print(f"Total algorithms enumerated: {total}")
    print("\nBreakdown by category:")
    for category, count in sorted(counts.items()):
        print(f"  {category}: {count}")
    
    # Save to JSON
    with open("ALGORITHM_ENUMERATION.json", "w") as f:
        json.dump({
            "total": total,
            "counts": counts,
            "algorithms": ALGORITHMS
        }, f, indent=2)
    print(f"\nSaved to ALGORITHM_ENUMERATION.json")
