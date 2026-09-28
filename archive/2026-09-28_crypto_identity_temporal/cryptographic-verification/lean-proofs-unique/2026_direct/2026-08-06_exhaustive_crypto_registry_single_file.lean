/-!
# Exhaustive Cryptographic Registry — Single-File Lean Enumeration

Generated 2026-08-06 from the user-supplied enumeration in this conversation.

Design constraints:
* one file;
* no admitted proof placeholders;
* no unproved declaration shortcuts;
* no vacuous `x = x` theorem padding;
* cryptographic algorithms are separated from standards, implementations, attacks, tools, hardware, and protocols;
* uncertain/historical names are preserved instead of silently normalized;
* semantic policy invariants are executable and theorem-backed.

Provenance note: the broad `catalog` is an append-only transcription/index, not an assertion that every label is an approved algorithm. The smaller `semanticRegistry` carries stronger status/policy claims. Current NIST identities used there: FIPS 203/204/205 and SP 800-232.
-/

import Std

namespace ProofBundle.CryptoRegistry

set_option maxRecDepth 100000
set_option maxHeartbeats 0
inductive CatalogKind where
  | digest
  | xof
  | mac
  | kdf
  | signature
  | pqSignature
  | kem
  | keyAgreement
  | aead
  | blockCipher
  | blockMode
  | streamCipher
  | curve
  | proofSystem
  | commitment
  | privacyScheme
  | pake
  | homomorphic
  | functionalEncryption
  | mpc
  | protocol
  | hybrid
  | hybridSignature
  | hybridKem
  | policy
  | encoding
  | rng
  | attack
  | countermeasure
  | formalTool
  | implementation
  | hardware
  | standard
  | publication
  | organization
  | blockchain
  | quantum
  | numberTheory
  | productOrTool
deriving Repr, DecidableEq, BEq, Inhabited
inductive Provenance where
  | userSupplied
  | primaryStandard
  | officialRegistry
  | historicalSubmission
  | implementationDocumentation
  | secondarySource
  | unverified
  | conflicting
deriving Repr, DecidableEq, BEq, Inhabited
structure CatalogItem where
  kind : CatalogKind
  name : String
  provenance : Provenance := .userSupplied
deriving Repr, DecidableEq, BEq
def catalog_digest : List CatalogItem := [
  { kind := .digest, name := "MD2" },
  { kind := .digest, name := "MD4" },
  { kind := .digest, name := "MD5" },
  { kind := .digest, name := "SHA-1" },
  { kind := .digest, name := "SHA-224" },
  { kind := .digest, name := "SHA-256" },
  { kind := .digest, name := "SHA-384" },
  { kind := .digest, name := "SHA-512" },
  { kind := .digest, name := "SHA-512/224" },
  { kind := .digest, name := "SHA-512/256" },
  { kind := .digest, name := "SHA3-224" },
  { kind := .digest, name := "SHA3-256" },
  { kind := .digest, name := "SHA3-384" },
  { kind := .digest, name := "SHA3-512" },
  { kind := .digest, name := "SHAKE128" },
  { kind := .digest, name := "SHAKE256" },
  { kind := .digest, name := "cSHAKE128" },
  { kind := .digest, name := "cSHAKE256" },
  { kind := .digest, name := "KMAC128" },
  { kind := .digest, name := "KMAC256" },
  { kind := .digest, name := "TupleHash128" },
  { kind := .digest, name := "TupleHash256" },
  { kind := .digest, name := "ParallelHash128" },
  { kind := .digest, name := "ParallelHash256" },
  { kind := .digest, name := "BLAKE-224" },
  { kind := .digest, name := "BLAKE-256" },
  { kind := .digest, name := "BLAKE-384" },
  { kind := .digest, name := "BLAKE-512" },
  { kind := .digest, name := "BLAKE2b-160" },
  { kind := .digest, name := "BLAKE2b-256" },
  { kind := .digest, name := "BLAKE2b-384" },
  { kind := .digest, name := "BLAKE2b-512" },
  { kind := .digest, name := "BLAKE2s-128" },
  { kind := .digest, name := "BLAKE2s-160" },
  { kind := .digest, name := "BLAKE2s-224" },
  { kind := .digest, name := "BLAKE2s-256" },
  { kind := .digest, name := "BLAKE3-256" },
  { kind := .digest, name := "BLAKE3-XOF" },
  { kind := .digest, name := "Keccak-224" },
  { kind := .digest, name := "Keccak-256" },
  { kind := .digest, name := "Keccak-384" },
  { kind := .digest, name := "Keccak-512" },
  { kind := .digest, name := "RIPEMD-128" },
  { kind := .digest, name := "RIPEMD-160" },
  { kind := .digest, name := "RIPEMD-256" },
  { kind := .digest, name := "RIPEMD-320" },
  { kind := .digest, name := "Whirlpool" },
  { kind := .digest, name := "SM3" },
  { kind := .digest, name := "Streebog-256" },
  { kind := .digest, name := "Streebog-512" },
  { kind := .digest, name := "Ascon-Hash256" },
  { kind := .digest, name := "Ascon-XOF128" },
  { kind := .digest, name := "Ascon-CXOF128" },
  { kind := .digest, name := "Ascon-Hash" },
  { kind := .digest, name := "Ascon-Hasha" },
  { kind := .digest, name := "Ascon-Xof" },
  { kind := .digest, name := "Ascon-Xofa" },
  { kind := .digest, name := "Tiger-128" },
  { kind := .digest, name := "Tiger-160" },
  { kind := .digest, name := "Tiger-192" },
  { kind := .digest, name := "HAVAL-128" },
  { kind := .digest, name := "HAVAL-160" },
  { kind := .digest, name := "HAVAL-192" },
  { kind := .digest, name := "HAVAL-224" },
  { kind := .digest, name := "HAVAL-256" },
  { kind := .digest, name := "Skein-256" },
  { kind := .digest, name := "Skein-512" },
  { kind := .digest, name := "Skein-1024" },
  { kind := .digest, name := "JH-224" },
  { kind := .digest, name := "JH-256" },
  { kind := .digest, name := "JH-384" },
  { kind := .digest, name := "JH-512" },
  { kind := .digest, name := "Grøstl-224" },
  { kind := .digest, name := "Grøstl-256" },
  { kind := .digest, name := "Grøstl-384" },
  { kind := .digest, name := "Grøstl-512" },
  { kind := .digest, name := "CubeHash" },
  { kind := .digest, name := "ECHO-224" },
  { kind := .digest, name := "ECHO-256" },
  { kind := .digest, name := "ECHO-384" },
  { kind := .digest, name := "ECHO-512" },
  { kind := .digest, name := "SIMD-224" },
  { kind := .digest, name := "SIMD-256" },
  { kind := .digest, name := "SIMD-384" },
  { kind := .digest, name := "SIMD-512" },
  { kind := .digest, name := "Fugue-224" },
  { kind := .digest, name := "Fugue-256" },
  { kind := .digest, name := "Fugue-384" },
  { kind := .digest, name := "Fugue-512" },
  { kind := .digest, name := "Luffa-224" },
  { kind := .digest, name := "Luffa-256" },
  { kind := .digest, name := "Luffa-384" },
  { kind := .digest, name := "Luffa-512" },
  { kind := .digest, name := "Shabal-192" },
  { kind := .digest, name := "Shabal-224" },
  { kind := .digest, name := "Shabal-256" },
  { kind := .digest, name := "Shabal-384" },
  { kind := .digest, name := "Shabal-512" },
  { kind := .digest, name := "SWIFFT" },
  { kind := .digest, name := "Spectral Hash" },
  { kind := .digest, name := "FSB-160" },
  { kind := .digest, name := "FSB-224" },
  { kind := .digest, name := "FSB-256" },
  { kind := .digest, name := "FSB-384" },
  { kind := .digest, name := "FSB-512" },
  { kind := .digest, name := "GOST 34.11-94" },
  { kind := .digest, name := "MASH-1" },
  { kind := .digest, name := "MASH-2" },
  { kind := .digest, name := "RadioGatún-32" },
  { kind := .digest, name := "RadioGatún-64" },
  { kind := .digest, name := "Panama hash" },
  { kind := .digest, name := "VSH" },
  { kind := .digest, name := "KangarooTwelve" },
  { kind := .digest, name := "MarsupilamiFourteen" },
  { kind := .digest, name := "TurboSHAKE128" },
  { kind := .digest, name := "TurboSHAKE256" },
]

def catalog_mac : List CatalogItem := [
  { kind := .mac, name := "HMAC-SHA-1" },
  { kind := .mac, name := "HMAC-SHA-224" },
  { kind := .mac, name := "HMAC-SHA-256" },
  { kind := .mac, name := "HMAC-SHA-384" },
  { kind := .mac, name := "HMAC-SHA-512" },
  { kind := .mac, name := "HMAC-SHA-512/224" },
  { kind := .mac, name := "HMAC-SHA-512/256" },
  { kind := .mac, name := "HMAC-SHA3-224" },
  { kind := .mac, name := "HMAC-SHA3-256" },
  { kind := .mac, name := "HMAC-SHA3-384" },
  { kind := .mac, name := "HMAC-SHA3-512" },
  { kind := .mac, name := "HMAC-RIPEMD-160" },
  { kind := .mac, name := "HMAC-SM3" },
  { kind := .mac, name := "HMAC-Streebog-256" },
  { kind := .mac, name := "HMAC-Streebog-512" },
  { kind := .mac, name := "KMAC128" },
  { kind := .mac, name := "KMAC256" },
  { kind := .mac, name := "KMACXOF128" },
  { kind := .mac, name := "KMACXOF256" },
  { kind := .mac, name := "Keyed BLAKE2b-160" },
  { kind := .mac, name := "Keyed BLAKE2b-256" },
  { kind := .mac, name := "Keyed BLAKE2b-384" },
  { kind := .mac, name := "Keyed BLAKE2b-512" },
  { kind := .mac, name := "Keyed BLAKE2s-128" },
  { kind := .mac, name := "Keyed BLAKE2s-160" },
  { kind := .mac, name := "Keyed BLAKE2s-224" },
  { kind := .mac, name := "Keyed BLAKE2s-256" },
  { kind := .mac, name := "Keyed BLAKE3-256" },
  { kind := .mac, name := "Keyed BLAKE3-XOF" },
  { kind := .mac, name := "Poly1305" },
  { kind := .mac, name := "AES-128-GMAC" },
  { kind := .mac, name := "AES-192-GMAC" },
  { kind := .mac, name := "AES-256-GMAC" },
  { kind := .mac, name := "AES-128-CMAC" },
  { kind := .mac, name := "AES-192-CMAC" },
  { kind := .mac, name := "AES-256-CMAC" },
  { kind := .mac, name := "Camellia-128-CMAC" },
  { kind := .mac, name := "Camellia-192-CMAC" },
  { kind := .mac, name := "Camellia-256-CMAC" },
  { kind := .mac, name := "ARIA-128-CMAC" },
  { kind := .mac, name := "ARIA-192-CMAC" },
  { kind := .mac, name := "ARIA-256-CMAC" },
  { kind := .mac, name := "SM4-CMAC" },
  { kind := .mac, name := "Ascon-MAC" },
  { kind := .mac, name := "AES-128-CBC-MAC" },
  { kind := .mac, name := "AES-256-CBC-MAC" },
  { kind := .mac, name := "UMAC-32" },
  { kind := .mac, name := "UMAC-64" },
  { kind := .mac, name := "UMAC-96" },
  { kind := .mac, name := "UMAC-128" },
  { kind := .mac, name := "VMAC" },
  { kind := .mac, name := "SipHash-1-3" },
  { kind := .mac, name := "SipHash-2-4" },
  { kind := .mac, name := "SipHash-4-8" },
  { kind := .mac, name := "HalfSipHash" },
  { kind := .mac, name := "HighwayHash" },
  { kind := .mac, name := "PMAC-AES" },
  { kind := .mac, name := "PMAC1" },
  { kind := .mac, name := "GHASH" },
  { kind := .mac, name := "POLYVAL" },
  { kind := .mac, name := "Retail MAC / ISO 9797-1 Algorithm 3" },
]

def catalog_kdf : List CatalogItem := [
  { kind := .kdf, name := "HKDF-SHA-1" },
  { kind := .kdf, name := "HKDF-SHA-224" },
  { kind := .kdf, name := "HKDF-SHA-256" },
  { kind := .kdf, name := "HKDF-SHA-384" },
  { kind := .kdf, name := "HKDF-SHA-512" },
  { kind := .kdf, name := "HKDF-SHA-512/224" },
  { kind := .kdf, name := "HKDF-SHA-512/256" },
  { kind := .kdf, name := "HKDF-SHA3-224" },
  { kind := .kdf, name := "HKDF-SHA3-256" },
  { kind := .kdf, name := "HKDF-SHA3-384" },
  { kind := .kdf, name := "HKDF-SHA3-512" },
  { kind := .kdf, name := "HKDF-SM3" },
  { kind := .kdf, name := "HKDF-Streebog-256" },
  { kind := .kdf, name := "HKDF-Streebog-512" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-1" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-224" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-256" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-384" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-512" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-512/224" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA-512/256" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA3-224" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA3-256" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA3-384" },
  { kind := .kdf, name := "PBKDF2-HMAC-SHA3-512" },
  { kind := .kdf, name := "scrypt" },
  { kind := .kdf, name := "Argon2d" },
  { kind := .kdf, name := "Argon2i" },
  { kind := .kdf, name := "Argon2id" },
  { kind := .kdf, name := "bcrypt" },
  { kind := .kdf, name := "bcrypt_pbkdf" },
  { kind := .kdf, name := "yescrypt" },
  { kind := .kdf, name := "Balloon Hashing" },
  { kind := .kdf, name := "Catena" },
  { kind := .kdf, name := "Lyra2" },
  { kind := .kdf, name := "SP800-108 Counter HMAC-SHA-256" },
  { kind := .kdf, name := "SP800-108 Counter HMAC-SHA-384" },
  { kind := .kdf, name := "SP800-108 Counter HMAC-SHA-512" },
  { kind := .kdf, name := "SP800-108 Feedback HMAC-SHA-256" },
  { kind := .kdf, name := "SP800-108 Feedback HMAC-SHA-384" },
  { kind := .kdf, name := "SP800-108 Feedback HMAC-SHA-512" },
  { kind := .kdf, name := "SP800-108 Double-Pipeline HMAC-SHA-256" },
  { kind := .kdf, name := "SP800-108 Double-Pipeline HMAC-SHA-384" },
  { kind := .kdf, name := "SP800-108 Double-Pipeline HMAC-SHA-512" },
  { kind := .kdf, name := "SP800-108 Counter AES-CMAC" },
  { kind := .kdf, name := "SP800-108 Feedback AES-CMAC" },
  { kind := .kdf, name := "SP800-108 Double-Pipeline AES-CMAC" },
  { kind := .kdf, name := "SP800-108 Counter KMAC128" },
  { kind := .kdf, name := "SP800-108 Counter KMAC256" },
  { kind := .kdf, name := "SP800-56C One-Step SHA-256" },
  { kind := .kdf, name := "SP800-56C One-Step SHA-384" },
  { kind := .kdf, name := "SP800-56C One-Step SHA-512" },
  { kind := .kdf, name := "SP800-56C Two-Step SHA-256" },
  { kind := .kdf, name := "SP800-56C Two-Step SHA-384" },
  { kind := .kdf, name := "SP800-56C Two-Step SHA-512" },
  { kind := .kdf, name := "HKDF-Extract" },
  { kind := .kdf, name := "HKDF-Expand" },
  { kind := .kdf, name := "ANSI X9.63 KDF SHA-256" },
  { kind := .kdf, name := "ANSI X9.63 KDF SHA-384" },
  { kind := .kdf, name := "ANSI X9.63 KDF SHA-512" },
  { kind := .kdf, name := "KDF1" },
  { kind := .kdf, name := "KDF2" },
  { kind := .kdf, name := "Concat KDF SHA-256" },
  { kind := .kdf, name := "Concat KDF SHA-384" },
  { kind := .kdf, name := "Concat KDF SHA-512" },
  { kind := .kdf, name := "TLS 1.2 PRF" },
  { kind := .kdf, name := "TLS 1.3 HKDF-Expand-Label" },
  { kind := .kdf, name := "SSH KDF" },
  { kind := .kdf, name := "IKEv1 KDF" },
  { kind := .kdf, name := "IKEv2 KDF" },
  { kind := .kdf, name := "IKEv2 PRF+" },
  { kind := .kdf, name := "SRTP KDF" },
  { kind := .kdf, name := "SNMP KDF" },
  { kind := .kdf, name := "TPM KDF" },
  { kind := .kdf, name := "BLAKE3 derive-key KDF" },
  { kind := .kdf, name := "ProofBundle Subkey Derivation V1" },
]

def catalog_signature : List CatalogItem := [
  { kind := .signature, name := "Ed25519" },
  { kind := .signature, name := "Ed25519ctx" },
  { kind := .signature, name := "Ed25519ph" },
  { kind := .signature, name := "Ed448" },
  { kind := .signature, name := "Ed448ph" },
  { kind := .signature, name := "ECDSA P-192" },
  { kind := .signature, name := "ECDSA P-224" },
  { kind := .signature, name := "ECDSA P-256 SHA-256" },
  { kind := .signature, name := "ECDSA P-384 SHA-384" },
  { kind := .signature, name := "ECDSA P-521 SHA-512" },
  { kind := .signature, name := "ECDSA secp256k1 SHA-256" },
  { kind := .signature, name := "ECDSA brainpoolP256r1" },
  { kind := .signature, name := "ECDSA brainpoolP384r1" },
  { kind := .signature, name := "ECDSA brainpoolP512r1" },
  { kind := .signature, name := "ECDSA FRP256v1" },
  { kind := .signature, name := "RSA-PSS SHA-224 MGF1-SHA-224" },
  { kind := .signature, name := "RSA-PSS SHA-256 MGF1-SHA-256" },
  { kind := .signature, name := "RSA-PSS SHA-384 MGF1-SHA-384" },
  { kind := .signature, name := "RSA-PSS SHA-512 MGF1-SHA-512" },
  { kind := .signature, name := "RSA-PSS SHA-512/224 MGF1-SHA-512/224" },
  { kind := .signature, name := "RSA-PSS SHA-512/256 MGF1-SHA-512/256" },
  { kind := .signature, name := "RSA-PSS SHAKE128 MGF1-SHAKE128" },
  { kind := .signature, name := "RSA-PSS SHAKE256 MGF1-SHAKE256" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-1" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-224" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-256" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-384" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-512" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-512/224" },
  { kind := .signature, name := "RSA PKCS1 v1.5 SHA-512/256" },
  { kind := .signature, name := "DSA SHA-1" },
  { kind := .signature, name := "DSA SHA-224" },
  { kind := .signature, name := "DSA SHA-256" },
  { kind := .signature, name := "DSA SHA-384" },
  { kind := .signature, name := "DSA SHA-512" },
  { kind := .signature, name := "GOST R 34.10-2001" },
  { kind := .signature, name := "GOST R 34.10-2012-256" },
  { kind := .signature, name := "GOST R 34.10-2012-512" },
  { kind := .signature, name := "SM2-SM3" },
  { kind := .signature, name := "SM2-SHA-256" },
  { kind := .signature, name := "ECSDSA" },
  { kind := .signature, name := "ECGDSA" },
  { kind := .signature, name := "ECKCDSA" },
  { kind := .signature, name := "KCDSA" },
  { kind := .signature, name := "EC-KCDSA" },
  { kind := .signature, name := "BLS12-381 Basic" },
  { kind := .signature, name := "BLS12-381 Augmented" },
  { kind := .signature, name := "BLS12-381 Proof-of-Possession" },
  { kind := .signature, name := "BLS12-381 Aggregate" },
  { kind := .signature, name := "BIP-340 Schnorr secp256k1" },
  { kind := .signature, name := "Generic Schnorr P-256" },
  { kind := .signature, name := "Generic Schnorr Ristretto255" },
  { kind := .signature, name := "Generic Schnorr Decaf448" },
  { kind := .signature, name := "ElGamal Signature" },
  { kind := .signature, name := "Nyberg-Rueppel" },
  { kind := .signature, name := "RSA-X9.31" },
  { kind := .signature, name := "RSA-ISO 9796-1" },
  { kind := .signature, name := "RSA-ISO 9796-2" },
  { kind := .signature, name := "RSA-ISO 9796-3" },
  { kind := .signature, name := "ECMR" },
  { kind := .signature, name := "Chaum Blind Signature" },
  { kind := .signature, name := "Boldyreva Blind Signature" },
  { kind := .signature, name := "Abe Blind Signature" },
  { kind := .signature, name := "Okamoto-Schnorr Blind Signature" },
  { kind := .signature, name := "Partially Blind Signature" },
  { kind := .signature, name := "Fair Blind Signature" },
  { kind := .signature, name := "Rivest-Shamir-Tauman Ring Signature" },
  { kind := .signature, name := "Abe-Ohkubo-Suzuki Ring Signature" },
  { kind := .signature, name := "Traceable Ring Signature" },
  { kind := .signature, name := "Linkable Ring Signature" },
  { kind := .signature, name := "Borromean Ring Signature" },
  { kind := .signature, name := "Chaum-van Heyst Group Signature" },
  { kind := .signature, name := "ACJT Group Signature" },
  { kind := .signature, name := "BBS Group Signature" },
  { kind := .signature, name := "BBS+ Signature" },
  { kind := .signature, name := "Pointcheval-Sanders Signature" },
]

def catalog_pqSignature : List CatalogItem := [
  { kind := .pqSignature, name := "ML-DSA-44" },
  { kind := .pqSignature, name := "ML-DSA-65" },
  { kind := .pqSignature, name := "ML-DSA-87" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-128s" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-128f" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-192s" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-192f" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-256s" },
  { kind := .pqSignature, name := "SLH-DSA-SHA2-256f" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-128s" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-128f" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-192s" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-192f" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-256s" },
  { kind := .pqSignature, name := "SLH-DSA-SHAKE-256f" },
  { kind := .pqSignature, name := "Falcon-512" },
  { kind := .pqSignature, name := "Falcon-1024" },
  { kind := .pqSignature, name := "FN-DSA" },
  { kind := .pqSignature, name := "XMSS-SHA2_10_256" },
  { kind := .pqSignature, name := "XMSS-SHA2_16_256" },
  { kind := .pqSignature, name := "XMSS-SHA2_20_256" },
  { kind := .pqSignature, name := "XMSS-SHA2_10_512" },
  { kind := .pqSignature, name := "XMSS-SHA2_16_512" },
  { kind := .pqSignature, name := "XMSS-SHA2_20_512" },
  { kind := .pqSignature, name := "XMSS-SHAKE_10_256" },
  { kind := .pqSignature, name := "XMSS-SHAKE_16_256" },
  { kind := .pqSignature, name := "XMSS-SHAKE_20_256" },
  { kind := .pqSignature, name := "XMSS-SHAKE_10_512" },
  { kind := .pqSignature, name := "XMSS-SHAKE_16_512" },
  { kind := .pqSignature, name := "XMSS-SHAKE_20_512" },
  { kind := .pqSignature, name := "XMSSMT" },
  { kind := .pqSignature, name := "LMS-SHA256_M32_H5" },
  { kind := .pqSignature, name := "LMS-SHA256_M32_H10" },
  { kind := .pqSignature, name := "LMS-SHA256_M32_H15" },
  { kind := .pqSignature, name := "LMS-SHA256_M32_H20" },
  { kind := .pqSignature, name := "LMS-SHA256_M32_H25" },
  { kind := .pqSignature, name := "HSS" },
  { kind := .pqSignature, name := "LM-OTS" },
  { kind := .pqSignature, name := "Lamport OTS" },
  { kind := .pqSignature, name := "Winternitz OTS" },
  { kind := .pqSignature, name := "WOTS+" },
  { kind := .pqSignature, name := "Merkle Signature Scheme" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-128s" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-128f" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-192s" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-192f" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-256s" },
  { kind := .pqSignature, name := "SPHINCS+-SHA2-256f" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-128s" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-128f" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-192s" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-192f" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-256s" },
  { kind := .pqSignature, name := "SPHINCS+-SHAKE-256f" },
  { kind := .pqSignature, name := "Dilithium2" },
  { kind := .pqSignature, name := "Dilithium3" },
  { kind := .pqSignature, name := "Dilithium5" },
  { kind := .pqSignature, name := "Dilithium2-AES" },
  { kind := .pqSignature, name := "Dilithium3-AES" },
  { kind := .pqSignature, name := "Dilithium5-AES" },
  { kind := .pqSignature, name := "Picnic-L1-FS" },
  { kind := .pqSignature, name := "Picnic-L1-UR" },
  { kind := .pqSignature, name := "Picnic-L3-FS" },
  { kind := .pqSignature, name := "Picnic-L3-UR" },
  { kind := .pqSignature, name := "Picnic-L5-FS" },
  { kind := .pqSignature, name := "Picnic-L5-UR" },
  { kind := .pqSignature, name := "Rainbow-I" },
  { kind := .pqSignature, name := "Rainbow-III" },
  { kind := .pqSignature, name := "Rainbow-V" },
  { kind := .pqSignature, name := "GeMSS-128" },
  { kind := .pqSignature, name := "GeMSS-192" },
  { kind := .pqSignature, name := "GeMSS-256" },
  { kind := .pqSignature, name := "qTESLA-p-I" },
  { kind := .pqSignature, name := "qTESLA-p-III" },
  { kind := .pqSignature, name := "MQDSS" },
  { kind := .pqSignature, name := "LUOV" },
  { kind := .pqSignature, name := "UOV" },
  { kind := .pqSignature, name := "CFS" },
  { kind := .pqSignature, name := "KKS" },
  { kind := .pqSignature, name := "GPV Signature" },
  { kind := .pqSignature, name := "Bonsai Trees Signature" },
  { kind := .pqSignature, name := "SQIsign" },
  { kind := .pqSignature, name := "HAETAE" },
  { kind := .pqSignature, name := "FAEST" },
  { kind := .pqSignature, name := "HAWK" },
  { kind := .pqSignature, name := "MAYO" },
  { kind := .pqSignature, name := "MQOM" },
  { kind := .pqSignature, name := "QR-UOV" },
  { kind := .pqSignature, name := "SDitH" },
  { kind := .pqSignature, name := "SNOVA" },
  { kind := .pqSignature, name := "CROSS" },
  { kind := .pqSignature, name := "LESS" },
  { kind := .pqSignature, name := "Mirath" },
  { kind := .pqSignature, name := "PERK" },
  { kind := .pqSignature, name := "RYDE" },
  { kind := .pqSignature, name := "FORS" },
  { kind := .pqSignature, name := "Hypertree Signature" },
  { kind := .pqSignature, name := "Dilithium Round 1" },
  { kind := .pqSignature, name := "Falcon Round 1" },
  { kind := .pqSignature, name := "qTESLA Round 1" },
  { kind := .pqSignature, name := "MQDSS Round 1" },
  { kind := .pqSignature, name := "Picnic Round 1" },
  { kind := .pqSignature, name := "SPHINCS+ Round 1" },
  { kind := .pqSignature, name := "LUOV Round 1" },
  { kind := .pqSignature, name := "HiMQ-3" },
  { kind := .pqSignature, name := "Rainbow Round 1" },
  { kind := .pqSignature, name := "GeMSS Round 1" },
  { kind := .pqSignature, name := "Dilithium-G" },
  { kind := .pqSignature, name := "Dilithium Round 2" },
  { kind := .pqSignature, name := "Falcon Round 2" },
  { kind := .pqSignature, name := "GeMSS Round 2" },
  { kind := .pqSignature, name := "LUOV Round 2" },
  { kind := .pqSignature, name := "MQDSS Round 2" },
  { kind := .pqSignature, name := "Picnic Round 2" },
  { kind := .pqSignature, name := "qTESLA Round 2" },
  { kind := .pqSignature, name := "Rainbow Round 2" },
  { kind := .pqSignature, name := "SPHINCS+ Round 2" },
  { kind := .pqSignature, name := "Dilithium Round 3" },
  { kind := .pqSignature, name := "Falcon Round 3" },
  { kind := .pqSignature, name := "GeMSS Round 3" },
  { kind := .pqSignature, name := "Picnic Round 3" },
  { kind := .pqSignature, name := "Rainbow Round 3" },
  { kind := .pqSignature, name := "SPHINCS+ Round 3" },
]

def catalog_kem : List CatalogItem := [
  { kind := .kem, name := "ML-KEM-512" },
  { kind := .kem, name := "ML-KEM-768" },
  { kind := .kem, name := "ML-KEM-1024" },
  { kind := .kem, name := "Classic McEliece 348864" },
  { kind := .kem, name := "Classic McEliece 348864f" },
  { kind := .kem, name := "Classic McEliece 460896" },
  { kind := .kem, name := "Classic McEliece 460896f" },
  { kind := .kem, name := "Classic McEliece 6688128" },
  { kind := .kem, name := "Classic McEliece 6688128f" },
  { kind := .kem, name := "Classic McEliece 6960119" },
  { kind := .kem, name := "Classic McEliece 6960119f" },
  { kind := .kem, name := "Classic McEliece 8192128" },
  { kind := .kem, name := "Classic McEliece 8192128f" },
  { kind := .kem, name := "Kyber512" },
  { kind := .kem, name := "Kyber768" },
  { kind := .kem, name := "Kyber1024" },
  { kind := .kem, name := "Kyber512-90s" },
  { kind := .kem, name := "Kyber768-90s" },
  { kind := .kem, name := "Kyber1024-90s" },
  { kind := .kem, name := "NTRU-HPS-2048-509" },
  { kind := .kem, name := "NTRU-HPS-2048-677" },
  { kind := .kem, name := "NTRU-HPS-4096-821" },
  { kind := .kem, name := "NTRU-HRSS-701" },
  { kind := .kem, name := "sntrup653" },
  { kind := .kem, name := "sntrup761" },
  { kind := .kem, name := "sntrup857" },
  { kind := .kem, name := "ntrulpr653" },
  { kind := .kem, name := "ntrulpr761" },
  { kind := .kem, name := "ntrulpr857" },
  { kind := .kem, name := "LightSaber" },
  { kind := .kem, name := "Saber" },
  { kind := .kem, name := "FireSaber" },
  { kind := .kem, name := "BIKE-L1" },
  { kind := .kem, name := "BIKE-L3" },
  { kind := .kem, name := "BIKE-L5" },
  { kind := .kem, name := "HQC-128" },
  { kind := .kem, name := "HQC-192" },
  { kind := .kem, name := "HQC-256" },
  { kind := .kem, name := "FrodoKEM-640-AES" },
  { kind := .kem, name := "FrodoKEM-640-SHAKE" },
  { kind := .kem, name := "FrodoKEM-976-AES" },
  { kind := .kem, name := "FrodoKEM-976-SHAKE" },
  { kind := .kem, name := "FrodoKEM-1344-AES" },
  { kind := .kem, name := "FrodoKEM-1344-SHAKE" },
  { kind := .kem, name := "SIKEp434" },
  { kind := .kem, name := "SIKEp503" },
  { kind := .kem, name := "SIKEp610" },
  { kind := .kem, name := "SIKEp751" },
  { kind := .kem, name := "Compressed SIKE" },
  { kind := .kem, name := "RSA-KEM" },
  { kind := .kem, name := "ECIES-KEM" },
  { kind := .kem, name := "PSEC-KEM" },
  { kind := .kem, name := "ACE-KEM" },
  { kind := .kem, name := "EPOC-1" },
  { kind := .kem, name := "EPOC-2" },
  { kind := .kem, name := "HIME(R)" },
  { kind := .kem, name := "DHIES" },
  { kind := .kem, name := "RSA-OAEP-KEM" },
  { kind := .kem, name := "BigQuake" },
  { kind := .kem, name := "BIKE-1 Round 1" },
  { kind := .kem, name := "BIKE-2 Round 1" },
  { kind := .kem, name := "BIKE-3 Round 1" },
  { kind := .kem, name := "DAGS-3" },
  { kind := .kem, name := "DAGS-5" },
  { kind := .kem, name := "Ding Key Exchange" },
  { kind := .kem, name := "Hila5" },
  { kind := .kem, name := "KINDI" },
  { kind := .kem, name := "LAC-128" },
  { kind := .kem, name := "LAC-192" },
  { kind := .kem, name := "LAC-256" },
  { kind := .kem, name := "Lima" },
  { kind := .kem, name := "Lizard" },
  { kind := .kem, name := "Lottery" },
  { kind := .kem, name := "NTRUEncrypt" },
  { kind := .kem, name := "NTRU-HRSS-KEM Round 1" },
  { kind := .kem, name := "ODD" },
  { kind := .kem, name := "OKCN" },
  { kind := .kem, name := "AKCN" },
  { kind := .kem, name := "RLizard" },
  { kind := .kem, name := "Round2" },
  { kind := .kem, name := "RQC" },
  { kind := .kem, name := "Three Bears" },
  { kind := .kem, name := "Titanium" },
  { kind := .kem, name := "CFPKM" },
  { kind := .kem, name := "Compact LWE" },
  { kind := .kem, name := "DME" },
  { kind := .kem, name := "DRS" },
  { kind := .kem, name := "DualModeMS" },
  { kind := .kem, name := "Edon-K" },
  { kind := .kem, name := "EMBLEM/R.EMBLEM" },
  { kind := .kem, name := "Giophantus" },
  { kind := .kem, name := "Guess Again" },
  { kind := .kem, name := "Gui" },
  { kind := .kem, name := "HK-17" },
  { kind := .kem, name := "KCL" },
  { kind := .kem, name := "LAKE" },
  { kind := .kem, name := "LEDAkem" },
  { kind := .kem, name := "LEDApkc" },
  { kind := .kem, name := "Lepton" },
  { kind := .kem, name := "LOCKER" },
  { kind := .kem, name := "LOTUS" },
  { kind := .kem, name := "McNie" },
  { kind := .kem, name := "Mersenne-756839" },
  { kind := .kem, name := "NewHope" },
  { kind := .kem, name := "NTS-KEM" },
  { kind := .kem, name := "Odd Manhattan" },
  { kind := .kem, name := "Ouroboros-R" },
  { kind := .kem, name := "Post-quantum RSA Encryption" },
  { kind := .kem, name := "QC-MDPC-KEM" },
  { kind := .kem, name := "RaCoSS" },
  { kind := .kem, name := "Ramstake" },
  { kind := .kem, name := "RLCE-KEM" },
  { kind := .kem, name := "RVB" },
  { kind := .kem, name := "SRTPI" },
  { kind := .kem, name := "WalnutDSA" },
  { kind := .kem, name := "LEDAcrypt" },
  { kind := .kem, name := "ROLLO" },
  { kind := .kem, name := "Round5" },
  { kind := .kem, name := "R-BC" },
]

def catalog_keyAgreement : List CatalogItem := [
  { kind := .keyAgreement, name := "ECDH P-192" },
  { kind := .keyAgreement, name := "ECDH P-224" },
  { kind := .keyAgreement, name := "ECDH P-256" },
  { kind := .keyAgreement, name := "ECDH P-384" },
  { kind := .keyAgreement, name := "ECDH P-521" },
  { kind := .keyAgreement, name := "ECDH secp256k1" },
  { kind := .keyAgreement, name := "ECDH brainpoolP256r1" },
  { kind := .keyAgreement, name := "ECDH brainpoolP384r1" },
  { kind := .keyAgreement, name := "ECDH brainpoolP512r1" },
  { kind := .keyAgreement, name := "ECDH FRP256v1" },
  { kind := .keyAgreement, name := "X25519" },
  { kind := .keyAgreement, name := "X448" },
  { kind := .keyAgreement, name := "SM2 Key Exchange" },
  { kind := .keyAgreement, name := "Finite-field Diffie-Hellman" },
  { kind := .keyAgreement, name := "FFDHE2048" },
  { kind := .keyAgreement, name := "FFDHE3072" },
  { kind := .keyAgreement, name := "FFDHE4096" },
  { kind := .keyAgreement, name := "FFDHE6144" },
  { kind := .keyAgreement, name := "FFDHE8192" },
  { kind := .keyAgreement, name := "MODP Group 1" },
  { kind := .keyAgreement, name := "MODP Group 2" },
  { kind := .keyAgreement, name := "MODP Group 5" },
  { kind := .keyAgreement, name := "MODP Group 14" },
  { kind := .keyAgreement, name := "MODP Group 15" },
  { kind := .keyAgreement, name := "MODP Group 16" },
  { kind := .keyAgreement, name := "MODP Group 17" },
  { kind := .keyAgreement, name := "MODP Group 18" },
  { kind := .keyAgreement, name := "MODP 1024-160" },
  { kind := .keyAgreement, name := "MODP 2048-224" },
  { kind := .keyAgreement, name := "MODP 2048-256" },
  { kind := .keyAgreement, name := "ECMQV" },
  { kind := .keyAgreement, name := "MQV" },
  { kind := .keyAgreement, name := "HMQV" },
  { kind := .keyAgreement, name := "Ristretto255 Diffie-Hellman" },
  { kind := .keyAgreement, name := "Decaf448 Diffie-Hellman" },
]

def catalog_aead : List CatalogItem := [
  { kind := .aead, name := "AES-128-GCM" },
  { kind := .aead, name := "AES-192-GCM" },
  { kind := .aead, name := "AES-256-GCM" },
  { kind := .aead, name := "AES-128-GCM-SIV" },
  { kind := .aead, name := "AES-256-GCM-SIV" },
  { kind := .aead, name := "AES-128-CCM" },
  { kind := .aead, name := "AES-192-CCM" },
  { kind := .aead, name := "AES-256-CCM" },
  { kind := .aead, name := "AES-128-CCM-8" },
  { kind := .aead, name := "AES-192-CCM-8" },
  { kind := .aead, name := "AES-256-CCM-8" },
  { kind := .aead, name := "ChaCha20-Poly1305" },
  { kind := .aead, name := "XChaCha20-Poly1305" },
  { kind := .aead, name := "AES-128-SIV" },
  { kind := .aead, name := "AES-192-SIV" },
  { kind := .aead, name := "AES-256-SIV" },
  { kind := .aead, name := "AES-SIV-CMAC" },
  { kind := .aead, name := "AES-PMAC-SIV" },
  { kind := .aead, name := "Ascon-AEAD128" },
  { kind := .aead, name := "Ascon-128" },
  { kind := .aead, name := "Ascon-128a" },
  { kind := .aead, name := "Ascon-80pq" },
  { kind := .aead, name := "SM4-GCM" },
  { kind := .aead, name := "SM4-CCM" },
  { kind := .aead, name := "AEGIS-128L" },
  { kind := .aead, name := "AEGIS-256" },
  { kind := .aead, name := "Deoxys-II-128-128" },
  { kind := .aead, name := "Deoxys-II-256-128" },
  { kind := .aead, name := "AES-128-OCB" },
  { kind := .aead, name := "AES-192-OCB" },
  { kind := .aead, name := "AES-256-OCB" },
  { kind := .aead, name := "AES-128-EAX" },
  { kind := .aead, name := "AES-256-EAX" },
  { kind := .aead, name := "Camellia-128-GCM" },
  { kind := .aead, name := "Camellia-192-GCM" },
  { kind := .aead, name := "Camellia-256-GCM" },
  { kind := .aead, name := "ARIA-128-GCM" },
  { kind := .aead, name := "ARIA-192-GCM" },
  { kind := .aead, name := "ARIA-256-GCM" },
  { kind := .aead, name := "Camellia-128-CCM" },
  { kind := .aead, name := "Camellia-192-CCM" },
  { kind := .aead, name := "Camellia-256-CCM" },
  { kind := .aead, name := "GIFT-COFB" },
  { kind := .aead, name := "Grain-128AEAD" },
  { kind := .aead, name := "ISAP-A-128A" },
  { kind := .aead, name := "Romulus-N" },
  { kind := .aead, name := "Romulus-M" },
  { kind := .aead, name := "TinyJAMBU-128" },
  { kind := .aead, name := "TinyJAMBU-192" },
  { kind := .aead, name := "TinyJAMBU-256" },
  { kind := .aead, name := "Elephant-Delirium" },
  { kind := .aead, name := "Elephant-Dumbo" },
  { kind := .aead, name := "Elephant-Jumbo" },
  { kind := .aead, name := "Photon-Beetle-AEAD" },
  { kind := .aead, name := "Xoodyak-AEAD" },
  { kind := .aead, name := "COMET" },
  { kind := .aead, name := "ESTATE" },
  { kind := .aead, name := "ForkAE" },
  { kind := .aead, name := "Gimli-AEAD" },
  { kind := .aead, name := "KNOT-AEAD" },
  { kind := .aead, name := "LOTUS-AEAD" },
  { kind := .aead, name := "LOCUS-AEAD" },
  { kind := .aead, name := "ORANGE" },
  { kind := .aead, name := "Pyjamask-AEAD" },
  { kind := .aead, name := "Saturnin-AEAD" },
  { kind := .aead, name := "SKINNY-AEAD" },
  { kind := .aead, name := "Schwaemm" },
  { kind := .aead, name := "Spoc" },
  { kind := .aead, name := "Subterranean-AEAD" },
  { kind := .aead, name := "WAGE-AEAD" },
  { kind := .aead, name := "ACORN" },
  { kind := .aead, name := "AEGIS-128" },
  { kind := .aead, name := "AES-COPA" },
  { kind := .aead, name := "AES-CMCC" },
  { kind := .aead, name := "AES-CPFB" },
  { kind := .aead, name := "AES-OTR" },
  { kind := .aead, name := "AEZ" },
  { kind := .aead, name := "ALEGRO" },
  { kind := .aead, name := "ARTEMIS" },
  { kind := .aead, name := "AVALANCHE" },
  { kind := .aead, name := "CBEAM" },
  { kind := .aead, name := "CIPHERFAX" },
  { kind := .aead, name := "CLAE" },
  { kind := .aead, name := "CLOC" },
  { kind := .aead, name := "COBRA" },
  { kind := .aead, name := "COLM" },
  { kind := .aead, name := "COPA" },
  { kind := .aead, name := "DECOYS" },
  { kind := .aead, name := "DEFLATE" },
  { kind := .aead, name := "DEIMOS" },
  { kind := .aead, name := "ELMD" },
  { kind := .aead, name := "FASER" },
  { kind := .aead, name := "FORCEMAX" },
  { kind := .aead, name := "FOREST" },
  { kind := .aead, name := "HADDOCK-TWEAKEY" },
  { kind := .aead, name := "HS1-SIV" },
  { kind := .aead, name := "ICE" },
  { kind := .aead, name := "JAMBU" },
  { kind := .aead, name := "JOLT" },
  { kind := .aead, name := "JULIUS" },
  { kind := .aead, name := "KETJE" },
  { kind := .aead, name := "KEYAK" },
  { kind := .aead, name := "KIASU" },
  { kind := .aead, name := "LAC AEAD" },
  { kind := .aead, name := "LILLIPUT-AE" },
  { kind := .aead, name := "MARBLE" },
  { kind := .aead, name := "McMambo" },
  { kind := .aead, name := "MINALPHER" },
  { kind := .aead, name := "MORUS" },
  { kind := .aead, name := "NORX" },
  { kind := .aead, name := "OCB-ICB" },
  { kind := .aead, name := "OMD" },
  { kind := .aead, name := "PAEQ" },
  { kind := .aead, name := "PANAMA AEAD" },
  { kind := .aead, name := "PI-CIPHER" },
  { kind := .aead, name := "Pi-256-Cipher" },
  { kind := .aead, name := "POET" },
  { kind := .aead, name := "POLAWIS" },
  { kind := .aead, name := "PPAE" },
  { kind := .aead, name := "PRIMATEs" },
  { kind := .aead, name := "PROST" },
  { kind := .aead, name := "RAVIYOYLA" },
  { kind := .aead, name := "SABLIER" },
  { kind := .aead, name := "SCREAM" },
  { kind := .aead, name := "SHELL" },
  { kind := .aead, name := "SILC" },
  { kind := .aead, name := "SILVER" },
  { kind := .aead, name := "SPARX" },
  { kind := .aead, name := "STRIBOB" },
  { kind := .aead, name := "Tiaoxin" },
  { kind := .aead, name := "TRIVIA-ck" },
  { kind := .aead, name := "WHEAT" },
]

def catalog_blockCipher : List CatalogItem := [
  { kind := .blockCipher, name := "AES-128" },
  { kind := .blockCipher, name := "AES-192" },
  { kind := .blockCipher, name := "AES-256" },
  { kind := .blockCipher, name := "DES" },
  { kind := .blockCipher, name := "3DES" },
  { kind := .blockCipher, name := "SM4" },
  { kind := .blockCipher, name := "Kuznyechik" },
  { kind := .blockCipher, name := "Magma" },
  { kind := .blockCipher, name := "Kalyna-128" },
  { kind := .blockCipher, name := "Kalyna-256" },
  { kind := .blockCipher, name := "Kalyna-512" },
  { kind := .blockCipher, name := "CLEFIA-128" },
  { kind := .blockCipher, name := "CLEFIA-192" },
  { kind := .blockCipher, name := "CLEFIA-256" },
  { kind := .blockCipher, name := "LEA-128" },
  { kind := .blockCipher, name := "LEA-192" },
  { kind := .blockCipher, name := "LEA-256" },
  { kind := .blockCipher, name := "HIGHT" },
  { kind := .blockCipher, name := "PRESENT-80" },
  { kind := .blockCipher, name := "PRESENT-128" },
  { kind := .blockCipher, name := "Simon-32/64" },
  { kind := .blockCipher, name := "Simon-48/72" },
  { kind := .blockCipher, name := "Simon-48/96" },
  { kind := .blockCipher, name := "Simon-64/96" },
  { kind := .blockCipher, name := "Simon-64/128" },
  { kind := .blockCipher, name := "Simon-96/96" },
  { kind := .blockCipher, name := "Simon-96/144" },
  { kind := .blockCipher, name := "Simon-128/128" },
  { kind := .blockCipher, name := "Simon-128/192" },
  { kind := .blockCipher, name := "Simon-128/256" },
  { kind := .blockCipher, name := "Speck-32/64" },
  { kind := .blockCipher, name := "Speck-48/72" },
  { kind := .blockCipher, name := "Speck-48/96" },
  { kind := .blockCipher, name := "Speck-64/96" },
  { kind := .blockCipher, name := "Speck-64/128" },
  { kind := .blockCipher, name := "Speck-96/96" },
  { kind := .blockCipher, name := "Speck-96/144" },
  { kind := .blockCipher, name := "Speck-128/128" },
  { kind := .blockCipher, name := "Speck-128/192" },
  { kind := .blockCipher, name := "Speck-128/256" },
  { kind := .blockCipher, name := "Serpent" },
  { kind := .blockCipher, name := "MARS" },
  { kind := .blockCipher, name := "RC2" },
  { kind := .blockCipher, name := "RC5" },
  { kind := .blockCipher, name := "RC6" },
  { kind := .blockCipher, name := "IDEA" },
  { kind := .blockCipher, name := "CAST5" },
  { kind := .blockCipher, name := "CAST6" },
  { kind := .blockCipher, name := "Blowfish" },
  { kind := .blockCipher, name := "Twofish" },
  { kind := .blockCipher, name := "Threefish-256" },
  { kind := .blockCipher, name := "Threefish-512" },
  { kind := .blockCipher, name := "Threefish-1024" },
  { kind := .blockCipher, name := "SHACAL-1" },
  { kind := .blockCipher, name := "SHACAL-2" },
  { kind := .blockCipher, name := "SAFER K-64" },
  { kind := .blockCipher, name := "SAFER K-128" },
  { kind := .blockCipher, name := "SAFER SK-64" },
  { kind := .blockCipher, name := "SAFER SK-128" },
  { kind := .blockCipher, name := "TEA" },
  { kind := .blockCipher, name := "XTEA" },
  { kind := .blockCipher, name := "XXTEA" },
  { kind := .blockCipher, name := "GOST 28147-89" },
  { kind := .blockCipher, name := "SEED" },
  { kind := .blockCipher, name := "Skipjack" },
]

def catalog_blockMode : List CatalogItem := [
  { kind := .blockMode, name := "ECB" },
  { kind := .blockMode, name := "CBC" },
  { kind := .blockMode, name := "CTR" },
  { kind := .blockMode, name := "CFB-1" },
  { kind := .blockMode, name := "CFB-8" },
  { kind := .blockMode, name := "CFB-128" },
  { kind := .blockMode, name := "OFB" },
  { kind := .blockMode, name := "XTS" },
  { kind := .blockMode, name := "GCM" },
  { kind := .blockMode, name := "CCM" },
  { kind := .blockMode, name := "OCB" },
  { kind := .blockMode, name := "KW" },
  { kind := .blockMode, name := "KWP" },
  { kind := .blockMode, name := "SIV" },
  { kind := .blockMode, name := "GCM-SIV" },
  { kind := .blockMode, name := "EAX" },
  { kind := .blockMode, name := "CMAC" },
  { kind := .blockMode, name := "XCBC-MAC" },
  { kind := .blockMode, name := "TMAC" },
  { kind := .blockMode, name := "CTS" },
  { kind := .blockMode, name := "EME2" },
  { kind := .blockMode, name := "LRW" },
  { kind := .blockMode, name := "CMC" },
  { kind := .blockMode, name := "EME" },
  { kind := .blockMode, name := "FF1" },
  { kind := .blockMode, name := "FF3" },
  { kind := .blockMode, name := "FF3-1" },
]

def catalog_streamCipher : List CatalogItem := [
  { kind := .streamCipher, name := "ChaCha20" },
  { kind := .streamCipher, name := "ChaCha8" },
  { kind := .streamCipher, name := "ChaCha12" },
  { kind := .streamCipher, name := "Salsa20" },
  { kind := .streamCipher, name := "Salsa20/7" },
  { kind := .streamCipher, name := "Salsa20/8" },
  { kind := .streamCipher, name := "Salsa20/12" },
  { kind := .streamCipher, name := "Salsa20/20" },
  { kind := .streamCipher, name := "XSalsa20" },
  { kind := .streamCipher, name := "HC-128" },
  { kind := .streamCipher, name := "HC-256" },
  { kind := .streamCipher, name := "Rabbit" },
  { kind := .streamCipher, name := "SOSEMANUK" },
  { kind := .streamCipher, name := "Grain" },
  { kind := .streamCipher, name := "Grain v1" },
  { kind := .streamCipher, name := "Grain-128" },
  { kind := .streamCipher, name := "Grain-128a" },
  { kind := .streamCipher, name := "MICKEY" },
  { kind := .streamCipher, name := "MICKEY-128" },
  { kind := .streamCipher, name := "MICKEY-128 2.0" },
  { kind := .streamCipher, name := "Trivium" },
  { kind := .streamCipher, name := "Enocoro" },
  { kind := .streamCipher, name := "MUGI" },
  { kind := .streamCipher, name := "SNOW 1.0" },
  { kind := .streamCipher, name := "SNOW 2.0" },
  { kind := .streamCipher, name := "SNOW 3G" },
  { kind := .streamCipher, name := "SNOW-V" },
  { kind := .streamCipher, name := "ZUC-128" },
  { kind := .streamCipher, name := "ZUC-256" },
  { kind := .streamCipher, name := "Panama stream" },
  { kind := .streamCipher, name := "SEAL" },
  { kind := .streamCipher, name := "WAKE" },
  { kind := .streamCipher, name := "A5/1" },
  { kind := .streamCipher, name := "A5/2" },
  { kind := .streamCipher, name := "A5/3" },
  { kind := .streamCipher, name := "E0" },
  { kind := .streamCipher, name := "RC4" },
  { kind := .streamCipher, name := "ISAAC" },
  { kind := .streamCipher, name := "FISH" },
  { kind := .streamCipher, name := "PIKE" },
  { kind := .streamCipher, name := "LEX" },
  { kind := .streamCipher, name := "Phelix" },
  { kind := .streamCipher, name := "Helix" },
  { kind := .streamCipher, name := "Py" },
  { kind := .streamCipher, name := "TPypy" },
  { kind := .streamCipher, name := "Rumba20" },
]

def catalog_curve : List CatalogItem := [
  { kind := .curve, name := "P-192" },
  { kind := .curve, name := "P-224" },
  { kind := .curve, name := "P-256" },
  { kind := .curve, name := "P-384" },
  { kind := .curve, name := "P-521" },
  { kind := .curve, name := "secp112r1" },
  { kind := .curve, name := "secp112r2" },
  { kind := .curve, name := "secp128r1" },
  { kind := .curve, name := "secp128r2" },
  { kind := .curve, name := "secp160k1" },
  { kind := .curve, name := "secp160r1" },
  { kind := .curve, name := "secp160r2" },
  { kind := .curve, name := "secp192k1" },
  { kind := .curve, name := "secp192r1" },
  { kind := .curve, name := "secp224k1" },
  { kind := .curve, name := "secp224r1" },
  { kind := .curve, name := "secp256k1" },
  { kind := .curve, name := "secp256r1" },
  { kind := .curve, name := "secp384r1" },
  { kind := .curve, name := "secp521r1" },
  { kind := .curve, name := "prime192v1" },
  { kind := .curve, name := "prime192v2" },
  { kind := .curve, name := "prime192v3" },
  { kind := .curve, name := "prime239v1" },
  { kind := .curve, name := "prime239v2" },
  { kind := .curve, name := "prime239v3" },
  { kind := .curve, name := "prime256v1" },
  { kind := .curve, name := "brainpoolP160r1" },
  { kind := .curve, name := "brainpoolP192r1" },
  { kind := .curve, name := "brainpoolP224r1" },
  { kind := .curve, name := "brainpoolP256r1" },
  { kind := .curve, name := "brainpoolP320r1" },
  { kind := .curve, name := "brainpoolP384r1" },
  { kind := .curve, name := "brainpoolP512r1" },
  { kind := .curve, name := "brainpoolP160t1" },
  { kind := .curve, name := "brainpoolP192t1" },
  { kind := .curve, name := "brainpoolP224t1" },
  { kind := .curve, name := "brainpoolP256t1" },
  { kind := .curve, name := "brainpoolP320t1" },
  { kind := .curve, name := "brainpoolP384t1" },
  { kind := .curve, name := "brainpoolP512t1" },
  { kind := .curve, name := "Curve25519" },
  { kind := .curve, name := "Curve448" },
  { kind := .curve, name := "Edwards25519" },
  { kind := .curve, name := "Edwards448" },
  { kind := .curve, name := "FRP256v1" },
  { kind := .curve, name := "SM2 P-256" },
  { kind := .curve, name := "GOST CryptoPro-A" },
  { kind := .curve, name := "GOST CryptoPro-B" },
  { kind := .curve, name := "GOST CryptoPro-C" },
  { kind := .curve, name := "GOST tc26 512 paramSetA" },
  { kind := .curve, name := "GOST tc26 512 paramSetB" },
  { kind := .curve, name := "BLS12-381" },
  { kind := .curve, name := "BLS12-377" },
  { kind := .curve, name := "BLS12-446" },
  { kind := .curve, name := "BLS12-455" },
  { kind := .curve, name := "BLS12-461" },
  { kind := .curve, name := "BLS24-315" },
  { kind := .curve, name := "BLS24-317" },
  { kind := .curve, name := "BLS24-479" },
  { kind := .curve, name := "BLS48-581" },
  { kind := .curve, name := "BN254" },
  { kind := .curve, name := "BN256" },
  { kind := .curve, name := "BN382" },
  { kind := .curve, name := "BN384" },
  { kind := .curve, name := "BN462" },
  { kind := .curve, name := "BN512" },
  { kind := .curve, name := "KSS16" },
  { kind := .curve, name := "KSS18" },
  { kind := .curve, name := "KSS36" },
  { kind := .curve, name := "KSS40" },
  { kind := .curve, name := "MNT4" },
  { kind := .curve, name := "MNT6" },
  { kind := .curve, name := "MNT4-298" },
  { kind := .curve, name := "MNT4-753" },
  { kind := .curve, name := "MNT6-298" },
  { kind := .curve, name := "MNT6-753" },
  { kind := .curve, name := "Freeman curve" },
  { kind := .curve, name := "Curve1174" },
  { kind := .curve, name := "Curve41417" },
  { kind := .curve, name := "E-222" },
  { kind := .curve, name := "E-382" },
  { kind := .curve, name := "E-521" },
  { kind := .curve, name := "M-221" },
  { kind := .curve, name := "M-383" },
  { kind := .curve, name := "M-511" },
  { kind := .curve, name := "NUMS P-256" },
  { kind := .curve, name := "NUMS P-384" },
  { kind := .curve, name := "NUMS P-512" },
  { kind := .curve, name := "Edwards1174" },
  { kind := .curve, name := "Edwards41417" },
  { kind := .curve, name := "Jubjub" },
  { kind := .curve, name := "sect163k1" },
  { kind := .curve, name := "sect163r1" },
  { kind := .curve, name := "sect163r2" },
  { kind := .curve, name := "sect193r1" },
  { kind := .curve, name := "sect193r2" },
  { kind := .curve, name := "sect233k1" },
  { kind := .curve, name := "sect233r1" },
  { kind := .curve, name := "sect239k1" },
  { kind := .curve, name := "sect283k1" },
  { kind := .curve, name := "sect283r1" },
  { kind := .curve, name := "sect409k1" },
  { kind := .curve, name := "sect409r1" },
  { kind := .curve, name := "sect571k1" },
  { kind := .curve, name := "sect571r1" },
]

def catalog_proofSystem : List CatalogItem := [
  { kind := .proofSystem, name := "Bulletproofs" },
  { kind := .proofSystem, name := "Bulletproofs+" },
  { kind := .proofSystem, name := "Groth16" },
  { kind := .proofSystem, name := "GM17" },
  { kind := .proofSystem, name := "PLONK" },
  { kind := .proofSystem, name := "TurboPLONK" },
  { kind := .proofSystem, name := "UltraPLONK" },
  { kind := .proofSystem, name := "Marlin" },
  { kind := .proofSystem, name := "Sonic" },
  { kind := .proofSystem, name := "Halo" },
  { kind := .proofSystem, name := "Halo2" },
  { kind := .proofSystem, name := "Gemini" },
  { kind := .proofSystem, name := "Mirage" },
  { kind := .proofSystem, name := "Spartan" },
  { kind := .proofSystem, name := "Nova" },
  { kind := .proofSystem, name := "SuperNova" },
  { kind := .proofSystem, name := "HyperNova" },
  { kind := .proofSystem, name := "ProtoStar" },
  { kind := .proofSystem, name := "Plonky2" },
  { kind := .proofSystem, name := "Plonky3" },
  { kind := .proofSystem, name := "STARK" },
  { kind := .proofSystem, name := "FRI" },
  { kind := .proofSystem, name := "Ligero" },
  { kind := .proofSystem, name := "Aurora" },
  { kind := .proofSystem, name := "Fractal" },
  { kind := .proofSystem, name := "Brakedown" },
  { kind := .proofSystem, name := "DARK" },
  { kind := .proofSystem, name := "Pinocchio" },
  { kind := .proofSystem, name := "Gepetto" },
  { kind := .proofSystem, name := "Buffet" },
  { kind := .proofSystem, name := "Hyrax" },
  { kind := .proofSystem, name := "Orion" },
  { kind := .proofSystem, name := "SHARK" },
  { kind := .proofSystem, name := "RISC Zero STARK-to-SNARK" },
  { kind := .proofSystem, name := "Polygon zkEVM prover" },
  { kind := .proofSystem, name := "zkSync prover" },
  { kind := .proofSystem, name := "Scroll prover" },
  { kind := .proofSystem, name := "ZKBoo" },
  { kind := .proofSystem, name := "ZKB++" },
  { kind := .proofSystem, name := "Katz-Kolesnikov-Wang" },
  { kind := .proofSystem, name := "Schnorr identification" },
  { kind := .proofSystem, name := "Chaum-Pedersen proof" },
  { kind := .proofSystem, name := "OR-proof" },
  { kind := .proofSystem, name := "AND-proof" },
  { kind := .proofSystem, name := "EQ-composition" },
  { kind := .proofSystem, name := "Guillou-Quisquater proof" },
  { kind := .proofSystem, name := "Okamoto proof" },
  { kind := .proofSystem, name := "Fiat-Shamir transform" },
  { kind := .proofSystem, name := "Designated Verifier Proof" },
  { kind := .proofSystem, name := "Designated Verifier Signature" },
  { kind := .proofSystem, name := "vRAM" },
  { kind := .proofSystem, name := "vASIC" },
]

def catalog_commitment : List CatalogItem := [
  { kind := .commitment, name := "SHA-256 commitment" },
  { kind := .commitment, name := "SHA-512 commitment" },
  { kind := .commitment, name := "SHA3-256 commitment" },
  { kind := .commitment, name := "SHA3-512 commitment" },
  { kind := .commitment, name := "BLAKE3 commitment" },
  { kind := .commitment, name := "HMAC-SHA-256 commitment" },
  { kind := .commitment, name := "HMAC-SHA-512 commitment" },
  { kind := .commitment, name := "Pedersen commitment" },
  { kind := .commitment, name := "Elliptic-curve Pedersen commitment" },
  { kind := .commitment, name := "Fujisaki-Okamoto commitment" },
  { kind := .commitment, name := "Merkle-tree commitment" },
  { kind := .commitment, name := "Sparse Merkle-tree commitment" },
  { kind := .commitment, name := "Merkle Mountain Range commitment" },
  { kind := .commitment, name := "Verkle-tree commitment" },
  { kind := .commitment, name := "KZG commitment" },
  { kind := .commitment, name := "IPA commitment" },
  { kind := .commitment, name := "FRI commitment" },
  { kind := .commitment, name := "RSA accumulator commitment" },
  { kind := .commitment, name := "Class-group commitment" },
  { kind := .commitment, name := "ElGamal commitment" },
]

def catalog_privacyScheme : List CatalogItem := [
  { kind := .privacyScheme, name := "Shamir Secret Sharing" },
  { kind := .privacyScheme, name := "Feldman VSS" },
  { kind := .privacyScheme, name := "Pedersen VSS" },
  { kind := .privacyScheme, name := "Publicly Verifiable Secret Sharing" },
  { kind := .privacyScheme, name := "Dynamic Secret Sharing" },
  { kind := .privacyScheme, name := "Proactive Secret Sharing" },
  { kind := .privacyScheme, name := "Blakley Secret Sharing" },
  { kind := .privacyScheme, name := "Asmuth-Bloom Secret Sharing" },
  { kind := .privacyScheme, name := "Krawczyk Secret Sharing" },
  { kind := .privacyScheme, name := "Rabin IDA" },
  { kind := .privacyScheme, name := "Additive Secret Sharing" },
  { kind := .privacyScheme, name := "Replicated Secret Sharing" },
  { kind := .privacyScheme, name := "Ramp Secret Sharing" },
  { kind := .privacyScheme, name := "Packed Secret Sharing" },
  { kind := .privacyScheme, name := "Distributed Key Generation" },
  { kind := .privacyScheme, name := "GJKR DKG" },
  { kind := .privacyScheme, name := "Joint Feldman DKG" },
  { kind := .privacyScheme, name := "Pedersen DKG" },
  { kind := .privacyScheme, name := "FROST DKG" },
  { kind := .privacyScheme, name := "Threshold ECDSA" },
  { kind := .privacyScheme, name := "Threshold Ed25519" },
  { kind := .privacyScheme, name := "Threshold BLS" },
  { kind := .privacyScheme, name := "Threshold Schnorr" },
  { kind := .privacyScheme, name := "Threshold RSA" },
  { kind := .privacyScheme, name := "Threshold ElGamal" },
  { kind := .privacyScheme, name := "Threshold Paillier" },
  { kind := .privacyScheme, name := "Threshold RSA-KEM" },
  { kind := .privacyScheme, name := "MuSig" },
  { kind := .privacyScheme, name := "MuSig2" },
  { kind := .privacyScheme, name := "FROST" },
  { kind := .privacyScheme, name := "ROAST" },
  { kind := .privacyScheme, name := "OT 1-out-of-2" },
  { kind := .privacyScheme, name := "OT 1-out-of-n" },
  { kind := .privacyScheme, name := "k-out-of-n OT" },
  { kind := .privacyScheme, name := "Rabin OT" },
  { kind := .privacyScheme, name := "IKNP OT Extension" },
  { kind := .privacyScheme, name := "KKRT OT Extension" },
  { kind := .privacyScheme, name := "KOS OT Extension" },
  { kind := .privacyScheme, name := "Silent OT" },
  { kind := .privacyScheme, name := "Correlated OT" },
  { kind := .privacyScheme, name := "ECDH PSI" },
  { kind := .privacyScheme, name := "OT PSI" },
  { kind := .privacyScheme, name := "Circuit PSI" },
  { kind := .privacyScheme, name := "PSI-CA" },
  { kind := .privacyScheme, name := "PSI-Sum" },
  { kind := .privacyScheme, name := "Delegated PSI" },
  { kind := .privacyScheme, name := "Unbalanced PSI" },
  { kind := .privacyScheme, name := "Single-server PIR" },
  { kind := .privacyScheme, name := "Multi-server PIR" },
  { kind := .privacyScheme, name := "XPIR" },
  { kind := .privacyScheme, name := "SealPIR" },
  { kind := .privacyScheme, name := "Spiral" },
  { kind := .privacyScheme, name := "OnionPIR" },
  { kind := .privacyScheme, name := "Private State PIR" },
  { kind := .privacyScheme, name := "OPRF" },
  { kind := .privacyScheme, name := "VOPRF" },
  { kind := .privacyScheme, name := "POPRF" },
  { kind := .privacyScheme, name := "ECVRF-P256-SHA256-TAI" },
  { kind := .privacyScheme, name := "ECVRF-P256-SHA256-SSWU" },
  { kind := .privacyScheme, name := "ECVRF-EDWARDS25519-SHA512-TAI" },
  { kind := .privacyScheme, name := "ECVRF-EDWARDS25519-SHA512-ELL2" },
  { kind := .privacyScheme, name := "RSA-FDH-VRF" },
  { kind := .privacyScheme, name := "BLS-VRF" },
  { kind := .privacyScheme, name := "Schnorr-VRF" },
  { kind := .privacyScheme, name := "NSEC5 VRF" },
  { kind := .privacyScheme, name := "Wesolowski VDF" },
  { kind := .privacyScheme, name := "Pietrzak VDF" },
  { kind := .privacyScheme, name := "Sloth VDF" },
  { kind := .privacyScheme, name := "MinRoot VDF" },
  { kind := .privacyScheme, name := "RSA accumulator" },
  { kind := .privacyScheme, name := "Dynamic RSA accumulator" },
  { kind := .privacyScheme, name := "Universal RSA accumulator" },
  { kind := .privacyScheme, name := "Nguyen accumulator" },
  { kind := .privacyScheme, name := "Pairing accumulator" },
  { kind := .privacyScheme, name := "Class-group accumulator" },
]

def catalog_pake : List CatalogItem := [
  { kind := .pake, name := "SRP-3" },
  { kind := .pake, name := "SRP-6" },
  { kind := .pake, name := "SRP-6a" },
  { kind := .pake, name := "OPAQUE" },
  { kind := .pake, name := "SPAKE2" },
  { kind := .pake, name := "SPAKE2+" },
  { kind := .pake, name := "J-PAKE" },
  { kind := .pake, name := "EKE" },
  { kind := .pake, name := "SPEKE" },
  { kind := .pake, name := "AugPAKE" },
  { kind := .pake, name := "SESPAKE" },
  { kind := .pake, name := "CPace" },
  { kind := .pake, name := "AuCPace" },
  { kind := .pake, name := "Dragonfly" },
  { kind := .pake, name := "SAE" },
  { kind := .pake, name := "PAK" },
  { kind := .pake, name := "PPK" },
  { kind := .pake, name := "KOY" },
  { kind := .pake, name := "AMP" },
  { kind := .pake, name := "B-SPEKE" },
]

def catalog_homomorphic : List CatalogItem := [
  { kind := .homomorphic, name := "RSA multiplicative homomorphism" },
  { kind := .homomorphic, name := "ElGamal multiplicative homomorphism" },
  { kind := .homomorphic, name := "Paillier" },
  { kind := .homomorphic, name := "Boneh-Goh-Nissim" },
  { kind := .homomorphic, name := "Damgård-Jurik" },
  { kind := .homomorphic, name := "Gentry FHE 2009" },
  { kind := .homomorphic, name := "DGHV" },
  { kind := .homomorphic, name := "BGV" },
  { kind := .homomorphic, name := "BFV" },
  { kind := .homomorphic, name := "Brakerski Scale-Invariant" },
  { kind := .homomorphic, name := "YASHE" },
  { kind := .homomorphic, name := "GSW" },
  { kind := .homomorphic, name := "FHEW" },
  { kind := .homomorphic, name := "TFHE" },
  { kind := .homomorphic, name := "CKKS" },
  { kind := .homomorphic, name := "CGGI" },
]

def catalog_functionalEncryption : List CatalogItem := [
  { kind := .functionalEncryption, name := "Boneh-Franklin IBE" },
  { kind := .functionalEncryption, name := "Cocks IBE" },
  { kind := .functionalEncryption, name := "Sakai-Kasahara IBE" },
  { kind := .functionalEncryption, name := "Boneh-Boyen IBE" },
  { kind := .functionalEncryption, name := "Waters IBE" },
  { kind := .functionalEncryption, name := "Gentry IBE" },
  { kind := .functionalEncryption, name := "Cha-Cheon IBS" },
  { kind := .functionalEncryption, name := "Shamir IBS" },
  { kind := .functionalEncryption, name := "Sakai-Kasahara IBS" },
  { kind := .functionalEncryption, name := "Boneh-Franklin IB-KEM" },
  { kind := .functionalEncryption, name := "Al-Riyami-Paterson Certificateless Cryptography" },
  { kind := .functionalEncryption, name := "Sahai-Waters ABE" },
  { kind := .functionalEncryption, name := "GPSW KP-ABE" },
  { kind := .functionalEncryption, name := "Bethencourt-Sahai-Waters CP-ABE" },
  { kind := .functionalEncryption, name := "Waters CP-ABE" },
  { kind := .functionalEncryption, name := "Rouselakis-Waters CP-ABE" },
  { kind := .functionalEncryption, name := "Lewko-Waters DABE" },
  { kind := .functionalEncryption, name := "Chase MA-ABE" },
  { kind := .functionalEncryption, name := "Chase-Chow MA-ABE" },
  { kind := .functionalEncryption, name := "Katz-Sahai-Waters Predicate Encryption" },
  { kind := .functionalEncryption, name := "Boneh-Waters Predicate Encryption" },
  { kind := .functionalEncryption, name := "Inner Product Encryption" },
  { kind := .functionalEncryption, name := "Hidden Vector Encryption" },
  { kind := .functionalEncryption, name := "Order-Revealing Encryption" },
  { kind := .functionalEncryption, name := "Order-Preserving Encryption" },
  { kind := .functionalEncryption, name := "Deterministic Encryption" },
  { kind := .functionalEncryption, name := "SSE-1" },
  { kind := .functionalEncryption, name := "SSE-2" },
  { kind := .functionalEncryption, name := "Dynamic SSE" },
  { kind := .functionalEncryption, name := "PEKS" },
  { kind := .functionalEncryption, name := "PAEKS" },
  { kind := .functionalEncryption, name := "Broadcast Encryption" },
  { kind := .functionalEncryption, name := "Traitor Tracing" },
  { kind := .functionalEncryption, name := "BBS Proxy Re-Encryption" },
  { kind := .functionalEncryption, name := "AFGH Proxy Re-Encryption" },
]

def catalog_mpc : List CatalogItem := [
  { kind := .mpc, name := "Yao Garbled Circuits" },
  { kind := .mpc, name := "Half-gates" },
  { kind := .mpc, name := "Free XOR" },
  { kind := .mpc, name := "GRR3" },
  { kind := .mpc, name := "GRR2" },
  { kind := .mpc, name := "FleXOR" },
  { kind := .mpc, name := "GMW" },
  { kind := .mpc, name := "BGW" },
  { kind := .mpc, name := "CCD" },
  { kind := .mpc, name := "SPDZ" },
  { kind := .mpc, name := "MASCOT" },
  { kind := .mpc, name := "Overdrive" },
  { kind := .mpc, name := "SCALE-MAMBA" },
  { kind := .mpc, name := "ABY" },
  { kind := .mpc, name := "ABY3" },
  { kind := .mpc, name := "EMP-toolkit" },
  { kind := .mpc, name := "Obliv-C" },
  { kind := .mpc, name := "Frigate" },
  { kind := .mpc, name := "MP-SPDZ" },
  { kind := .mpc, name := "Sharemind" },
  { kind := .mpc, name := "SEPIA" },
  { kind := .mpc, name := "PICCO" },
  { kind := .mpc, name := "TinyGarble" },
  { kind := .mpc, name := "JustGarble" },
  { kind := .mpc, name := "FlexSC" },
  { kind := .mpc, name := "SecureML" },
  { kind := .mpc, name := "MiniONN" },
  { kind := .mpc, name := "Gazelle" },
  { kind := .mpc, name := "Delphi" },
  { kind := .mpc, name := "CryptFlow" },
  { kind := .mpc, name := "CryptFlow2" },
  { kind := .mpc, name := "XONN" },
  { kind := .mpc, name := "FALCON MPC" },
  { kind := .mpc, name := "SecureNN" },
  { kind := .mpc, name := "Fantastic Four" },
  { kind := .mpc, name := "Beaver triples" },
  { kind := .mpc, name := "ALSZ" },
  { kind := .mpc, name := "HE-based MPC" },
  { kind := .mpc, name := "OT-based MPC" },
]

def catalog_protocol : List CatalogItem := [
  { kind := .protocol, name := "TLS 1.0" },
  { kind := .protocol, name := "TLS 1.1" },
  { kind := .protocol, name := "TLS 1.2" },
  { kind := .protocol, name := "TLS 1.3" },
  { kind := .protocol, name := "DTLS 1.0" },
  { kind := .protocol, name := "DTLS 1.2" },
  { kind := .protocol, name := "DTLS 1.3" },
  { kind := .protocol, name := "QUIC" },
  { kind := .protocol, name := "SSH v2" },
  { kind := .protocol, name := "IKEv1" },
  { kind := .protocol, name := "IKEv2" },
  { kind := .protocol, name := "ESP" },
  { kind := .protocol, name := "AH" },
  { kind := .protocol, name := "WireGuard" },
  { kind := .protocol, name := "Signal Protocol" },
  { kind := .protocol, name := "X3DH" },
  { kind := .protocol, name := "Double Ratchet" },
  { kind := .protocol, name := "Sesame" },
  { kind := .protocol, name := "Noise" },
  { kind := .protocol, name := "Noise_N" },
  { kind := .protocol, name := "Noise_K" },
  { kind := .protocol, name := "Noise_X" },
  { kind := .protocol, name := "Noise_NN" },
  { kind := .protocol, name := "Noise_NK" },
  { kind := .protocol, name := "Noise_NX" },
  { kind := .protocol, name := "Noise_XN" },
  { kind := .protocol, name := "Noise_XK" },
  { kind := .protocol, name := "Noise_XX" },
  { kind := .protocol, name := "Noise_KN" },
  { kind := .protocol, name := "Noise_KK" },
  { kind := .protocol, name := "Noise_KX" },
  { kind := .protocol, name := "Noise_IN" },
  { kind := .protocol, name := "Noise_IK" },
  { kind := .protocol, name := "Noise_IX" },
  { kind := .protocol, name := "Noise_NK1" },
  { kind := .protocol, name := "Noise_NX1" },
  { kind := .protocol, name := "Noise_X1N" },
  { kind := .protocol, name := "Noise_X1K" },
  { kind := .protocol, name := "Noise_XK1" },
  { kind := .protocol, name := "Noise_X1K1" },
  { kind := .protocol, name := "Noise_X1X" },
  { kind := .protocol, name := "Noise_XX1" },
  { kind := .protocol, name := "Noise_X1X1" },
  { kind := .protocol, name := "Noise_K1N" },
  { kind := .protocol, name := "Noise_K1K" },
  { kind := .protocol, name := "Noise_KK1" },
  { kind := .protocol, name := "Noise_K1K1" },
  { kind := .protocol, name := "Noise_K1X" },
  { kind := .protocol, name := "Noise_KX1" },
  { kind := .protocol, name := "Noise_K1X1" },
  { kind := .protocol, name := "Noise_I1N" },
  { kind := .protocol, name := "Noise_I1K" },
  { kind := .protocol, name := "Noise_IK1" },
  { kind := .protocol, name := "Noise_I1K1" },
  { kind := .protocol, name := "Noise_I1X" },
  { kind := .protocol, name := "Noise_IX1" },
  { kind := .protocol, name := "Noise_I1X1" },
  { kind := .protocol, name := "HPKE" },
  { kind := .protocol, name := "HPKE BASE" },
  { kind := .protocol, name := "HPKE PSK" },
  { kind := .protocol, name := "HPKE AUTH" },
  { kind := .protocol, name := "HPKE AUTH_PSK" },
  { kind := .protocol, name := "MLS" },
  { kind := .protocol, name := "TreeKEM" },
  { kind := .protocol, name := "EDHOC" },
  { kind := .protocol, name := "OSCORE" },
  { kind := .protocol, name := "SFrame" },
  { kind := .protocol, name := "OpenPGP" },
  { kind := .protocol, name := "CMS" },
  { kind := .protocol, name := "JWS" },
  { kind := .protocol, name := "JWE" },
  { kind := .protocol, name := "JWT" },
  { kind := .protocol, name := "COSE Sign" },
  { kind := .protocol, name := "COSE MAC" },
  { kind := .protocol, name := "COSE Encrypt" },
  { kind := .protocol, name := "CWT" },
  { kind := .protocol, name := "S/MIME" },
  { kind := .protocol, name := "XML Signature" },
  { kind := .protocol, name := "XML Encryption" },
  { kind := .protocol, name := "OCSP" },
  { kind := .protocol, name := "SCVP" },
  { kind := .protocol, name := "CMP" },
  { kind := .protocol, name := "CMC" },
  { kind := .protocol, name := "EST" },
  { kind := .protocol, name := "ACME" },
  { kind := .protocol, name := "Certificate Transparency" },
  { kind := .protocol, name := "CRLite" },
  { kind := .protocol, name := "RFC 3161 TSP" },
  { kind := .protocol, name := "OpenTimestamps" },
  { kind := .protocol, name := "ANSI X9.95 Timestamping" },
  { kind := .protocol, name := "Linked Timestamping" },
  { kind := .protocol, name := "FIDO U2F" },
  { kind := .protocol, name := "FIDO2" },
  { kind := .protocol, name := "WebAuthn" },
  { kind := .protocol, name := "CTAP1" },
  { kind := .protocol, name := "CTAP2" },
  { kind := .protocol, name := "FIDO UAF" },
  { kind := .protocol, name := "OMEMO" },
  { kind := .protocol, name := "Olm" },
  { kind := .protocol, name := "Megolm" },
  { kind := .protocol, name := "MTProto" },
  { kind := .protocol, name := "PGP/MIME" },
  { kind := .protocol, name := "age encryption" },
  { kind := .protocol, name := "Minisign" },
  { kind := .protocol, name := "PAdES" },
  { kind := .protocol, name := "XAdES" },
  { kind := .protocol, name := "CAdES" },
  { kind := .protocol, name := "ASiC" },
  { kind := .protocol, name := "OAuth 2.0" },
  { kind := .protocol, name := "OpenID Connect" },
  { kind := .protocol, name := "SAML 2.0" },
  { kind := .protocol, name := "SCIM" },
  { kind := .protocol, name := "SCEP" },
  { kind := .protocol, name := "KMIP" },
  { kind := .protocol, name := "DC-Net" },
  { kind := .protocol, name := "Loopix" },
  { kind := .protocol, name := "Nym" },
  { kind := .protocol, name := "Tor" },
  { kind := .protocol, name := "I2P" },
  { kind := .protocol, name := "Helios" },
  { kind := .protocol, name := "Scantegrity" },
  { kind := .protocol, name := "Pret a Voter" },
  { kind := .protocol, name := "NIST Randomness Beacon" },
  { kind := .protocol, name := "drand" },
  { kind := .protocol, name := "League of Entropy" },
  { kind := .protocol, name := "BB84" },
  { kind := .protocol, name := "E91" },
  { kind := .protocol, name := "B92" },
  { kind := .protocol, name := "SARG04" },
  { kind := .protocol, name := "COW QKD" },
  { kind := .protocol, name := "DPS QKD" },
  { kind := .protocol, name := "Decoy State QKD" },
  { kind := .protocol, name := "MDI-QKD" },
  { kind := .protocol, name := "TF-QKD" },
  { kind := .protocol, name := "CV-QKD" },
  { kind := .protocol, name := "DV-QKD" },
]

def catalog_hybrid : List CatalogItem := [
  { kind := .hybrid, name := "Ed25519 + ML-DSA-44" },
  { kind := .hybrid, name := "Ed25519 + ML-DSA-65" },
  { kind := .hybrid, name := "Ed25519 + ML-DSA-87" },
  { kind := .hybrid, name := "Ed448 + ML-DSA-65" },
  { kind := .hybrid, name := "Ed448 + ML-DSA-87" },
  { kind := .hybrid, name := "ECDSA P-256 + ML-DSA-44" },
  { kind := .hybrid, name := "ECDSA P-384 + ML-DSA-65" },
  { kind := .hybrid, name := "ECDSA P-384 + ML-DSA-87" },
  { kind := .hybrid, name := "ECDSA P-521 + ML-DSA-87" },
  { kind := .hybrid, name := "RSA-PSS-2048-SHA-256 + ML-DSA-44" },
  { kind := .hybrid, name := "RSA-PSS-3072-SHA-384 + ML-DSA-65" },
  { kind := .hybrid, name := "RSA-PSS-4096-SHA-512 + ML-DSA-87" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHA2-128s" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHA2-128f" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHAKE-128s" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHAKE-128f" },
  { kind := .hybrid, name := "ECDSA P-256 + SLH-DSA-SHA2-128s" },
  { kind := .hybrid, name := "ECDSA P-384 + SLH-DSA-SHA2-192s" },
  { kind := .hybrid, name := "Ed25519 + Falcon-512" },
  { kind := .hybrid, name := "Ed25519 + Falcon-1024" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHA2-192s" },
  { kind := .hybrid, name := "Ed25519 + SLH-DSA-SHAKE-192s" },
  { kind := .hybrid, name := "Ed448 + SLH-DSA-SHA2-256s" },
  { kind := .hybrid, name := "X25519 + ML-KEM-512" },
  { kind := .hybrid, name := "X25519 + ML-KEM-768" },
  { kind := .hybrid, name := "X25519 + ML-KEM-1024" },
  { kind := .hybrid, name := "X448 + ML-KEM-768" },
  { kind := .hybrid, name := "X448 + ML-KEM-1024" },
  { kind := .hybrid, name := "ECDH P-256 + ML-KEM-512" },
  { kind := .hybrid, name := "ECDH P-256 + ML-KEM-768" },
  { kind := .hybrid, name := "ECDH P-384 + ML-KEM-768" },
  { kind := .hybrid, name := "ECDH P-384 + ML-KEM-1024" },
  { kind := .hybrid, name := "ECDH P-521 + ML-KEM-1024" },
  { kind := .hybrid, name := "X25519 + Classic McEliece 6688128" },
  { kind := .hybrid, name := "X25519 + Kyber512" },
  { kind := .hybrid, name := "X25519 + Kyber768" },
  { kind := .hybrid, name := "X25519 + Kyber1024" },
  { kind := .hybrid, name := "X25519 + NTRU-HPS-2048-677" },
  { kind := .hybrid, name := "X25519 + NTRU-HRSS-701" },
  { kind := .hybrid, name := "X25519 + FrodoKEM-976-AES" },
  { kind := .hybrid, name := "X25519 + FrodoKEM-1344-SHAKE" },
]

def catalog_hybridPolicy : List CatalogItem := [
  { kind := .policy, name := "BOTH_REQUIRED" },
  { kind := .policy, name := "EITHER_ACCEPTED_DURING_MIGRATION" },
  { kind := .policy, name := "CLASSICAL_REQUIRED_BEFORE_DATE" },
  { kind := .policy, name := "PQ_REQUIRED_AFTER_DATE" },
  { kind := .policy, name := "HISTORICAL_POLICY" },
  { kind := .policy, name := "CURRENT_POLICY" },
  { kind := .policy, name := "HYBRID_MINIMUM_SECURITY_CATEGORY_1" },
  { kind := .policy, name := "HYBRID_MINIMUM_SECURITY_CATEGORY_2" },
  { kind := .policy, name := "HYBRID_MINIMUM_SECURITY_CATEGORY_3" },
  { kind := .policy, name := "HYBRID_MINIMUM_SECURITY_CATEGORY_5" },
  { kind := .policy, name := "MIGRATION_WINDOW_OPEN" },
  { kind := .policy, name := "MIGRATION_WINDOW_CLOSED" },
  { kind := .policy, name := "PQ_ONLY_AFTER_DATE" },
  { kind := .policy, name := "CLASSICAL_ONLY_BEFORE_DATE" },
  { kind := .policy, name := "DUAL_VALIDATION_REQUIRED" },
  { kind := .policy, name := "SINGLE_VALIDATION_WITH_WARNING" },
  { kind := .policy, name := "ALL_COMPONENTS_REQUIRED" },
  { kind := .policy, name := "ANY_COMPONENT_ACCEPTED" },
  { kind := .policy, name := "M_OF_N_COMPONENTS_REQUIRED" },
  { kind := .policy, name := "POLICY_SELECTED_COMPONENT_SET" },
  { kind := .policy, name := "DOWNGRADE_REJECTION" },
  { kind := .policy, name := "UNKNOWN_COMPONENT_REJECTION" },
  { kind := .policy, name := "MALFORMED_COMPONENT_REJECTION" },
]

def catalog_encoding : List CatalogItem := [
  { kind := .encoding, name := "DER" },
  { kind := .encoding, name := "BER" },
  { kind := .encoding, name := "CER" },
  { kind := .encoding, name := "PEM" },
  { kind := .encoding, name := "Canonical CBOR" },
  { kind := .encoding, name := "Deterministic CBOR" },
  { kind := .encoding, name := "Canonical JSON" },
  { kind := .encoding, name := "JSON Canonicalization Scheme" },
  { kind := .encoding, name := "Canonical XML" },
  { kind := .encoding, name := "MessagePack" },
  { kind := .encoding, name := "SubjectPublicKeyInfo" },
  { kind := .encoding, name := "PKCS#1" },
  { kind := .encoding, name := "PKCS#3" },
  { kind := .encoding, name := "PKCS#5" },
  { kind := .encoding, name := "PKCS#7" },
  { kind := .encoding, name := "PKCS#8" },
  { kind := .encoding, name := "PKCS#9" },
  { kind := .encoding, name := "PKCS#10" },
  { kind := .encoding, name := "PKCS#11" },
  { kind := .encoding, name := "PKCS#12" },
  { kind := .encoding, name := "JWK" },
  { kind := .encoding, name := "JWKS" },
  { kind := .encoding, name := "COSE Key" },
  { kind := .encoding, name := "CWT" },
  { kind := .encoding, name := "SSH public key" },
  { kind := .encoding, name := "SSH private key" },
  { kind := .encoding, name := "OpenPGP public key" },
  { kind := .encoding, name := "ASN.1 DER signature" },
  { kind := .encoding, name := "IEEE P1363 raw R||S" },
  { kind := .encoding, name := "JWS signature" },
  { kind := .encoding, name := "COSE signature" },
  { kind := .encoding, name := "X.509 v3" },
  { kind := .encoding, name := "CMS SignedData" },
  { kind := .encoding, name := "CMS EnvelopedData" },
  { kind := .encoding, name := "CMS AuthenticatedData" },
  { kind := .encoding, name := "CMS DigestedData" },
  { kind := .encoding, name := "P7B" },
  { kind := .encoding, name := "PFX/P12" },
  { kind := .encoding, name := "Encrypted PKCS#8" },
  { kind := .encoding, name := "OneAsymmetricKey" },
  { kind := .encoding, name := "AsymmetricKeyPackage" },
  { kind := .encoding, name := "ProofBundle Canonical Binary V1" },
  { kind := .encoding, name := "ProofBundle Canonical JSON V1" },
  { kind := .encoding, name := "ProofBundle Canonical CBOR V1" },
]

def catalog_rng : List CatalogItem := [
  { kind := .rng, name := "Hash_DRBG SHA-256" },
  { kind := .rng, name := "Hash_DRBG SHA-384" },
  { kind := .rng, name := "Hash_DRBG SHA-512" },
  { kind := .rng, name := "HMAC_DRBG SHA-256" },
  { kind := .rng, name := "HMAC_DRBG SHA-384" },
  { kind := .rng, name := "HMAC_DRBG SHA-512" },
  { kind := .rng, name := "CTR_DRBG AES-128" },
  { kind := .rng, name := "CTR_DRBG AES-192" },
  { kind := .rng, name := "CTR_DRBG AES-256" },
  { kind := .rng, name := "RBG1" },
  { kind := .rng, name := "RBG2" },
  { kind := .rng, name := "RBG3" },
  { kind := .rng, name := "RBGC" },
  { kind := .rng, name := "Fortuna" },
  { kind := .rng, name := "Yarrow-160" },
  { kind := .rng, name := "Tiny RNG" },
  { kind := .rng, name := "ISAAC RNG" },
  { kind := .rng, name := "MT19937" },
  { kind := .rng, name := "Blum Blum Shub" },
  { kind := .rng, name := "ANSI X9.17 RNG" },
  { kind := .rng, name := "ANSI X9.31 RNG" },
  { kind := .rng, name := "FIPS 186-4 General Purpose RNG" },
  { kind := .rng, name := "/dev/urandom" },
  { kind := .rng, name := "getrandom()" },
  { kind := .rng, name := "CryptGenRandom" },
  { kind := .rng, name := "BCryptGenRandom" },
  { kind := .rng, name := "RDRAND" },
  { kind := .rng, name := "RDSEED" },
  { kind := .rng, name := "TPM RNG" },
  { kind := .rng, name := "QRNG" },
]

def catalog_attack : List CatalogItem := [
  { kind := .attack, name := "Frequency analysis" },
  { kind := .attack, name := "Chosen plaintext attack" },
  { kind := .attack, name := "Known plaintext attack" },
  { kind := .attack, name := "Chosen ciphertext attack" },
  { kind := .attack, name := "Adaptive chosen ciphertext attack" },
  { kind := .attack, name := "Related-key attack" },
  { kind := .attack, name := "Slide attack" },
  { kind := .attack, name := "Boomerang attack" },
  { kind := .attack, name := "Rectangle attack" },
  { kind := .attack, name := "Impossible differential cryptanalysis" },
  { kind := .attack, name := "Truncated differential cryptanalysis" },
  { kind := .attack, name := "Higher-order differential cryptanalysis" },
  { kind := .attack, name := "Linear cryptanalysis" },
  { kind := .attack, name := "Differential-linear cryptanalysis" },
  { kind := .attack, name := "Integral cryptanalysis" },
  { kind := .attack, name := "Algebraic cryptanalysis" },
  { kind := .attack, name := "Length extension" },
  { kind := .attack, name := "Collision attack" },
  { kind := .attack, name := "Preimage attack" },
  { kind := .attack, name := "Second-preimage attack" },
  { kind := .attack, name := "Birthday attack" },
  { kind := .attack, name := "Meet-in-the-middle attack" },
  { kind := .attack, name := "Padding oracle" },
  { kind := .attack, name := "Bleichenbacher attack" },
  { kind := .attack, name := "ROBOT" },
  { kind := .attack, name := "DROWN" },
  { kind := .attack, name := "POODLE" },
  { kind := .attack, name := "BEAST" },
  { kind := .attack, name := "CRIME" },
  { kind := .attack, name := "BREACH" },
  { kind := .attack, name := "Lucky13" },
  { kind := .attack, name := "Sweet32" },
  { kind := .attack, name := "Logjam" },
  { kind := .attack, name := "FREAK" },
  { kind := .attack, name := "CurveSwap" },
  { kind := .attack, name := "Minerva" },
  { kind := .attack, name := "Raccoon" },
  { kind := .attack, name := "ROCA" },
  { kind := .attack, name := "Coppersmith attack" },
  { kind := .attack, name := "Timing analysis" },
  { kind := .attack, name := "Simple Power Analysis" },
  { kind := .attack, name := "Differential Power Analysis" },
  { kind := .attack, name := "Correlation Power Analysis" },
  { kind := .attack, name := "Simple EM Analysis" },
  { kind := .attack, name := "Differential EM Analysis" },
  { kind := .attack, name := "Acoustic cryptanalysis" },
  { kind := .attack, name := "Cache timing" },
  { kind := .attack, name := "Prime+Probe" },
  { kind := .attack, name := "Flush+Reload" },
  { kind := .attack, name := "Evict+Time" },
  { kind := .attack, name := "Cache Telepathy" },
  { kind := .attack, name := "Voltage glitching" },
  { kind := .attack, name := "Clock glitching" },
  { kind := .attack, name := "EM fault injection" },
  { kind := .attack, name := "Laser fault injection" },
  { kind := .attack, name := "Rowhammer" },
  { kind := .attack, name := "PlunderVolt" },
  { kind := .attack, name := "VoltJockey" },
  { kind := .attack, name := "CLKScrew" },
  { kind := .attack, name := "Spectre v1" },
  { kind := .attack, name := "Spectre v2" },
  { kind := .attack, name := "Meltdown" },
  { kind := .attack, name := "Foreshadow" },
  { kind := .attack, name := "ZombieLoad" },
  { kind := .attack, name := "RIDL" },
  { kind := .attack, name := "Fallout" },
  { kind := .attack, name := "MDS" },
  { kind := .attack, name := "SWAPGS" },
  { kind := .attack, name := "LVI" },
  { kind := .attack, name := "BHI" },
  { kind := .attack, name := "Retbleed" },
  { kind := .attack, name := "PostBarrier" },
  { kind := .attack, name := "Downfall" },
  { kind := .attack, name := "Shor algorithm attack" },
  { kind := .attack, name := "Grover algorithm attack" },
  { kind := .attack, name := "Simon algorithm attack" },
  { kind := .attack, name := "MOV attack" },
  { kind := .attack, name := "Pollard rho ECDLP" },
  { kind := .attack, name := "Index Calculus" },
  { kind := .attack, name := "Pohlig-Hellman" },
  { kind := .attack, name := "GNFS" },
  { kind := .attack, name := "Quadratic Sieve" },
]

def catalog_countermeasure : List CatalogItem := [
  { kind := .countermeasure, name := "Constant-time comparison" },
  { kind := .countermeasure, name := "Constant-time conditional swap" },
  { kind := .countermeasure, name := "Constant-time lookup" },
  { kind := .countermeasure, name := "Constant-time modular arithmetic" },
  { kind := .countermeasure, name := "Constant-time scalar multiplication" },
  { kind := .countermeasure, name := "Constant-time signing" },
  { kind := .countermeasure, name := "Constant-time verification" },
  { kind := .countermeasure, name := "No secret-dependent branches" },
  { kind := .countermeasure, name := "No secret-dependent memory access" },
  { kind := .countermeasure, name := "No secret-dependent division" },
  { kind := .countermeasure, name := "No secret-dependent floating point" },
  { kind := .countermeasure, name := "Scalar blinding" },
  { kind := .countermeasure, name := "Exponent blinding" },
  { kind := .countermeasure, name := "Message blinding" },
  { kind := .countermeasure, name := "Point randomization" },
  { kind := .countermeasure, name := "Projective-coordinate randomization" },
  { kind := .countermeasure, name := "Boolean masking" },
  { kind := .countermeasure, name := "Arithmetic masking" },
  { kind := .countermeasure, name := "Threshold implementation" },
  { kind := .countermeasure, name := "Bitslicing" },
  { kind := .countermeasure, name := "Cache partitioning" },
  { kind := .countermeasure, name := "Speculation barrier" },
  { kind := .countermeasure, name := "Fault detection" },
  { kind := .countermeasure, name := "Redundant computation" },
  { kind := .countermeasure, name := "Signature self-verification" },
  { kind := .countermeasure, name := "Ciphertext re-encryption check" },
  { kind := .countermeasure, name := "Infective countermeasure" },
  { kind := .countermeasure, name := "Clock randomization" },
  { kind := .countermeasure, name := "Power noise" },
  { kind := .countermeasure, name := "Shielding" },
  { kind := .countermeasure, name := "Secure zeroization" },
  { kind := .countermeasure, name := "Memory locking" },
  { kind := .countermeasure, name := "Core dump prohibition" },
]

def catalog_formalTool : List CatalogItem := [
  { kind := .formalTool, name := "Coq" },
  { kind := .formalTool, name := "Lean" },
  { kind := .formalTool, name := "Isabelle/HOL" },
  { kind := .formalTool, name := "HOL Light" },
  { kind := .formalTool, name := "Agda" },
  { kind := .formalTool, name := "Mizar" },
  { kind := .formalTool, name := "Metamath" },
  { kind := .formalTool, name := "PVS" },
  { kind := .formalTool, name := "F*" },
  { kind := .formalTool, name := "Dafny" },
  { kind := .formalTool, name := "Why3" },
  { kind := .formalTool, name := "Z3" },
  { kind := .formalTool, name := "CVC4" },
  { kind := .formalTool, name := "CVC5" },
  { kind := .formalTool, name := "Vampire" },
  { kind := .formalTool, name := "E prover" },
  { kind := .formalTool, name := "Alt-Ergo" },
  { kind := .formalTool, name := "MiniSat" },
  { kind := .formalTool, name := "CaDiCaL" },
  { kind := .formalTool, name := "Kissat" },
  { kind := .formalTool, name := "TLA+" },
  { kind := .formalTool, name := "Alloy" },
  { kind := .formalTool, name := "Spin" },
  { kind := .formalTool, name := "NuSMV" },
  { kind := .formalTool, name := "UPPAAL" },
]

def catalog_implementation : List CatalogItem := [
  { kind := .implementation, name := "OpenSSL" },
  { kind := .implementation, name := "BoringSSL" },
  { kind := .implementation, name := "LibreSSL" },
  { kind := .implementation, name := "Libgcrypt" },
  { kind := .implementation, name := "NSS" },
  { kind := .implementation, name := "GnuTLS" },
  { kind := .implementation, name := "mbed TLS" },
  { kind := .implementation, name := "wolfSSL" },
  { kind := .implementation, name := "MatrixSSL" },
  { kind := .implementation, name := "TinyCrypt" },
  { kind := .implementation, name := "micro-ecc" },
  { kind := .implementation, name := "Relic Toolkit" },
  { kind := .implementation, name := "PBC Library" },
  { kind := .implementation, name := "MIRACL" },
  { kind := .implementation, name := "Botan" },
  { kind := .implementation, name := "Crypto++" },
  { kind := .implementation, name := "libsodium" },
  { kind := .implementation, name := "NaCl" },
  { kind := .implementation, name := "TweetNaCl" },
  { kind := .implementation, name := "Monocypher" },
  { kind := .implementation, name := "BearSSL" },
  { kind := .implementation, name := "EverCrypt" },
  { kind := .implementation, name := "HACL*" },
  { kind := .implementation, name := "Vale" },
  { kind := .implementation, name := "Fiat-Crypto" },
  { kind := .implementation, name := "Jasmin" },
  { kind := .implementation, name := "ring" },
  { kind := .implementation, name := "rustls" },
  { kind := .implementation, name := "ed25519-dalek" },
  { kind := .implementation, name := "x25519-dalek" },
  { kind := .implementation, name := "p256 RustCrypto" },
  { kind := .implementation, name := "p384 RustCrypto" },
  { kind := .implementation, name := "p521 RustCrypto" },
  { kind := .implementation, name := "secp256k1 Rust" },
  { kind := .implementation, name := "sha2 RustCrypto" },
  { kind := .implementation, name := "sha3 RustCrypto" },
  { kind := .implementation, name := "blake2 RustCrypto" },
  { kind := .implementation, name := "blake3 Rust" },
  { kind := .implementation, name := "hmac RustCrypto" },
  { kind := .implementation, name := "hkdf RustCrypto" },
  { kind := .implementation, name := "pbkdf2 RustCrypto" },
  { kind := .implementation, name := "scrypt RustCrypto" },
  { kind := .implementation, name := "argon2 RustCrypto" },
  { kind := .implementation, name := "chacha20 RustCrypto" },
  { kind := .implementation, name := "chacha20poly1305 RustCrypto" },
  { kind := .implementation, name := "aes-gcm RustCrypto" },
  { kind := .implementation, name := "aes-gcm-siv RustCrypto" },
  { kind := .implementation, name := "aes-ccm RustCrypto" },
  { kind := .implementation, name := "curve25519-dalek" },
  { kind := .implementation, name := "rsa RustCrypto" },
  { kind := .implementation, name := "pqcrypto Rust" },
  { kind := .implementation, name := "cryptography Python" },
  { kind := .implementation, name := "PyCryptodome" },
  { kind := .implementation, name := "hashlib" },
  { kind := .implementation, name := "hmac Python" },
  { kind := .implementation, name := "secrets Python" },
  { kind := .implementation, name := "argon2-cffi" },
  { kind := .implementation, name := "pyargon2" },
  { kind := .implementation, name := "bcrypt Python" },
  { kind := .implementation, name := "paramiko" },
  { kind := .implementation, name := "PGPy" },
  { kind := .implementation, name := "python-jose" },
  { kind := .implementation, name := "PyJWT" },
  { kind := .implementation, name := "Authlib" },
  { kind := .implementation, name := "pyOpenSSL" },
  { kind := .implementation, name := "PyNaCl" },
  { kind := .implementation, name := "M2Crypto" },
  { kind := .implementation, name := "Go crypto" },
  { kind := .implementation, name := "x/crypto" },
  { kind := .implementation, name := "Go age" },
  { kind := .implementation, name := "go-jose" },
  { kind := .implementation, name := "go-jwt" },
  { kind := .implementation, name := "gopenpgp" },
  { kind := .implementation, name := "Node crypto" },
  { kind := .implementation, name := "Web Crypto API" },
  { kind := .implementation, name := "node-forge" },
  { kind := .implementation, name := "tweetnacl-js" },
  { kind := .implementation, name := "libsodium.js" },
  { kind := .implementation, name := "js-sha256" },
  { kind := .implementation, name := "js-sha3" },
  { kind := .implementation, name := "blakejs" },
  { kind := .implementation, name := "hash.js" },
  { kind := .implementation, name := "elliptic JS" },
  { kind := .implementation, name := "noble-crypto" },
  { kind := .implementation, name := "noble-curves" },
  { kind := .implementation, name := "noble-hashes" },
  { kind := .implementation, name := "noble-ed25519" },
  { kind := .implementation, name := "noble-secp256k1" },
  { kind := .implementation, name := "noble-bls12-381" },
  { kind := .implementation, name := "micro-packed" },
  { kind := .implementation, name := "jose JS" },
  { kind := .implementation, name := "openpgp.js" },
  { kind := .implementation, name := "JCA" },
  { kind := .implementation, name := "JCE" },
  { kind := .implementation, name := "Bouncy Castle" },
  { kind := .implementation, name := "Tink" },
  { kind := .implementation, name := "Conscrypt" },
  { kind := .implementation, name := "System.Security.Cryptography" },
  { kind := .implementation, name := "NSec" },
  { kind := .implementation, name := "CryptoKit" },
  { kind := .implementation, name := "SwiftCrypto" },
  { kind := .implementation, name := "Themis" },
  { kind := .implementation, name := "kotlin-crypto" },
  { kind := .implementation, name := "kalium" },
  { kind := .implementation, name := "Ruby OpenSSL" },
  { kind := .implementation, name := "PHP OpenSSL" },
  { kind := .implementation, name := "phpseclib" },
  { kind := .implementation, name := "CryptX" },
  { kind := .implementation, name := "cryptonite" },
  { kind := .implementation, name := "mirage-crypto" },
  { kind := .implementation, name := "std.crypto Zig" },
  { kind := .implementation, name := "nimcrypto" },
  { kind := .implementation, name := "HElib" },
  { kind := .implementation, name := "SEAL FHE" },
  { kind := .implementation, name := "PALISADE" },
  { kind := .implementation, name := "OpenFHE" },
  { kind := .implementation, name := "TFHE-rs" },
  { kind := .implementation, name := "Concrete" },
  { kind := .implementation, name := "Lattigo" },
  { kind := .implementation, name := "HEaaN" },
  { kind := .implementation, name := "cuHE" },
  { kind := .implementation, name := "cuFHE" },
  { kind := .implementation, name := "Google DP" },
  { kind := .implementation, name := "OpenDP" },
  { kind := .implementation, name := "Diffprivlib" },
  { kind := .implementation, name := "TensorFlow Privacy" },
  { kind := .implementation, name := "Opacus" },
  { kind := .implementation, name := "PipelineDP" },
]

def catalog_hardware : List CatalogItem := [
  { kind := .hardware, name := "TPM 1.2" },
  { kind := .hardware, name := "TPM 2.0" },
  { kind := .hardware, name := "PKCS#11 HSM" },
  { kind := .hardware, name := "Apple Secure Enclave" },
  { kind := .hardware, name := "Android Keystore" },
  { kind := .hardware, name := "Windows CNG/NCrypt" },
  { kind := .hardware, name := "PIV" },
  { kind := .hardware, name := "Intel SGX" },
  { kind := .hardware, name := "Intel TDX" },
  { kind := .hardware, name := "AMD SEV" },
  { kind := .hardware, name := "AMD SEV-ES" },
  { kind := .hardware, name := "AMD SEV-SNP" },
  { kind := .hardware, name := "ARM TrustZone" },
  { kind := .hardware, name := "ARM CCA" },
  { kind := .hardware, name := "AWS Nitro Enclaves" },
  { kind := .hardware, name := "Google Titan" },
  { kind := .hardware, name := "Samsung Knox" },
  { kind := .hardware, name := "Qualcomm TEE" },
  { kind := .hardware, name := "Huawei TEE" },
  { kind := .hardware, name := "Keystone RISC-V" },
  { kind := .hardware, name := "SGX EPID Attestation" },
  { kind := .hardware, name := "SGX ECDSA Attestation" },
  { kind := .hardware, name := "SGX DCAP" },
  { kind := .hardware, name := "AMD SEV Attestation" },
  { kind := .hardware, name := "ARM CCA Attestation" },
  { kind := .hardware, name := "Android Key Attestation" },
  { kind := .hardware, name := "Apple App Attestation" },
  { kind := .hardware, name := "DeviceCheck" },
  { kind := .hardware, name := "FIDO Packed Attestation" },
  { kind := .hardware, name := "FIDO TPM Attestation" },
  { kind := .hardware, name := "FIDO Android Key Attestation" },
  { kind := .hardware, name := "FIDO Android SafetyNet Attestation" },
  { kind := .hardware, name := "FIDO Apple Anonymous Attestation" },
  { kind := .hardware, name := "AES-NI" },
  { kind := .hardware, name := "CLMUL" },
  { kind := .hardware, name := "RDRAND instruction" },
  { kind := .hardware, name := "RDSEED instruction" },
  { kind := .hardware, name := "SHA-NI" },
  { kind := .hardware, name := "VAES" },
  { kind := .hardware, name := "VPCLMULQDQ" },
  { kind := .hardware, name := "ARMv8 Crypto Extensions" },
  { kind := .hardware, name := "AESE" },
  { kind := .hardware, name := "AESD" },
  { kind := .hardware, name := "AESMC" },
  { kind := .hardware, name := "AESIMC" },
  { kind := .hardware, name := "ARM SHA1" },
  { kind := .hardware, name := "ARM SHA256" },
  { kind := .hardware, name := "PMULL" },
  { kind := .hardware, name := "RISC-V scalar crypto" },
  { kind := .hardware, name := "RISC-V vector crypto" },
  { kind := .hardware, name := "CUDA crypto acceleration" },
  { kind := .hardware, name := "OpenCL crypto acceleration" },
  { kind := .hardware, name := "FPGA crypto acceleration" },
  { kind := .hardware, name := "ASIC SHA-256" },
  { kind := .hardware, name := "ASIC SHA3" },
  { kind := .hardware, name := "ASIC Scrypt" },
]

def catalog_standard : List CatalogItem := [
  { kind := .standard, name := "FIPS 140-2" },
  { kind := .standard, name := "FIPS 140-3" },
  { kind := .standard, name := "FIPS 180-4" },
  { kind := .standard, name := "FIPS 186-4" },
  { kind := .standard, name := "FIPS 186-5" },
  { kind := .standard, name := "FIPS 197" },
  { kind := .standard, name := "FIPS 198-1" },
  { kind := .standard, name := "FIPS 202" },
  { kind := .standard, name := "FIPS 203" },
  { kind := .standard, name := "FIPS 204" },
  { kind := .standard, name := "FIPS 205" },
  { kind := .standard, name := "NIST SP 800-12" },
  { kind := .standard, name := "NIST SP 800-30" },
  { kind := .standard, name := "NIST SP 800-32" },
  { kind := .standard, name := "NIST SP 800-37" },
  { kind := .standard, name := "NIST SP 800-38A" },
  { kind := .standard, name := "NIST SP 800-38B" },
  { kind := .standard, name := "NIST SP 800-38C" },
  { kind := .standard, name := "NIST SP 800-38D" },
  { kind := .standard, name := "NIST SP 800-38E" },
  { kind := .standard, name := "NIST SP 800-38F" },
  { kind := .standard, name := "NIST SP 800-38G" },
  { kind := .standard, name := "NIST SP 800-52 Rev 2" },
  { kind := .standard, name := "NIST SP 800-53" },
  { kind := .standard, name := "NIST SP 800-56A" },
  { kind := .standard, name := "NIST SP 800-56B" },
  { kind := .standard, name := "NIST SP 800-56C" },
  { kind := .standard, name := "NIST SP 800-57 Part 1" },
  { kind := .standard, name := "NIST SP 800-57 Part 2" },
  { kind := .standard, name := "NIST SP 800-57 Part 3" },
  { kind := .standard, name := "NIST SP 800-63-3" },
  { kind := .standard, name := "NIST SP 800-63A" },
  { kind := .standard, name := "NIST SP 800-63B" },
  { kind := .standard, name := "NIST SP 800-63C" },
  { kind := .standard, name := "NIST SP 800-67" },
  { kind := .standard, name := "NIST SP 800-77" },
  { kind := .standard, name := "NIST SP 800-81" },
  { kind := .standard, name := "NIST SP 800-88" },
  { kind := .standard, name := "NIST SP 800-89" },
  { kind := .standard, name := "NIST SP 800-90A" },
  { kind := .standard, name := "NIST SP 800-90B" },
  { kind := .standard, name := "NIST SP 800-90C" },
  { kind := .standard, name := "NIST SP 800-92" },
  { kind := .standard, name := "NIST SP 800-94" },
  { kind := .standard, name := "NIST SP 800-102" },
  { kind := .standard, name := "NIST SP 800-106" },
  { kind := .standard, name := "NIST SP 800-107" },
  { kind := .standard, name := "NIST SP 800-108" },
  { kind := .standard, name := "NIST SP 800-111" },
  { kind := .standard, name := "NIST SP 800-117" },
  { kind := .standard, name := "NIST SP 800-121" },
  { kind := .standard, name := "NIST SP 800-125" },
  { kind := .standard, name := "NIST SP 800-130" },
  { kind := .standard, name := "NIST SP 800-131A Rev 2" },
  { kind := .standard, name := "NIST SP 800-132" },
  { kind := .standard, name := "NIST SP 800-133" },
  { kind := .standard, name := "NIST SP 800-135 Rev 1" },
  { kind := .standard, name := "NIST SP 800-140" },
  { kind := .standard, name := "NIST SP 800-146" },
  { kind := .standard, name := "NIST SP 800-147" },
  { kind := .standard, name := "NIST SP 800-152" },
  { kind := .standard, name := "NIST SP 800-153" },
  { kind := .standard, name := "NIST SP 800-162" },
  { kind := .standard, name := "NIST SP 800-164" },
  { kind := .standard, name := "NIST SP 800-171" },
  { kind := .standard, name := "NIST SP 800-175A" },
  { kind := .standard, name := "NIST SP 800-175B" },
  { kind := .standard, name := "NIST SP 800-177" },
  { kind := .standard, name := "NIST SP 800-179" },
  { kind := .standard, name := "NIST SP 800-181" },
  { kind := .standard, name := "NIST SP 800-184" },
  { kind := .standard, name := "NIST SP 800-185" },
  { kind := .standard, name := "NIST SP 800-186" },
  { kind := .standard, name := "NIST SP 800-188" },
  { kind := .standard, name := "NIST SP 800-190" },
  { kind := .standard, name := "NIST SP 800-192" },
  { kind := .standard, name := "NIST SP 800-193" },
  { kind := .standard, name := "NIST SP 800-204" },
  { kind := .standard, name := "NIST SP 800-207" },
  { kind := .standard, name := "NIST SP 800-208" },
  { kind := .standard, name := "NIST SP 800-209" },
  { kind := .standard, name := "NIST SP 800-210" },
  { kind := .standard, name := "NIST SP 800-213" },
  { kind := .standard, name := "NIST SP 800-214" },
  { kind := .standard, name := "NIST SP 800-215" },
  { kind := .standard, name := "NIST SP 800-216" },
  { kind := .standard, name := "NIST SP 800-217" },
  { kind := .standard, name := "NIST SP 800-218" },
  { kind := .standard, name := "NIST SP 800-232" },
  { kind := .standard, name := "CNSA Suite 1.0" },
  { kind := .standard, name := "CNSA Suite 2.0" },
  { kind := .standard, name := "BSI TR-02102-1" },
  { kind := .standard, name := "BSI TR-03116" },
  { kind := .standard, name := "ANSSI RGS" },
  { kind := .standard, name := "ETSI TS 102 176" },
  { kind := .standard, name := "ETSI TS 119 312" },
  { kind := .standard, name := "ETSI TS 119 412" },
  { kind := .standard, name := "ANSI X9.24" },
  { kind := .standard, name := "ANSI X9.30" },
  { kind := .standard, name := "ANSI X9.42" },
  { kind := .standard, name := "ANSI X9.44" },
  { kind := .standard, name := "ANSI X9.62" },
  { kind := .standard, name := "ANSI X9.63" },
  { kind := .standard, name := "ANSI X9.82" },
  { kind := .standard, name := "ANSI X9.95" },
  { kind := .standard, name := "ISO/IEC 9797" },
  { kind := .standard, name := "ISO/IEC 9798" },
  { kind := .standard, name := "ISO/IEC 10116" },
  { kind := .standard, name := "ISO/IEC 10118" },
  { kind := .standard, name := "ISO/IEC 11770" },
  { kind := .standard, name := "ISO/IEC 14888" },
  { kind := .standard, name := "ISO/IEC 15408" },
  { kind := .standard, name := "ISO/IEC 18031" },
  { kind := .standard, name := "ISO/IEC 18032" },
  { kind := .standard, name := "ISO/IEC 18033" },
  { kind := .standard, name := "ISO/IEC 19772" },
  { kind := .standard, name := "ISO/IEC 19790" },
  { kind := .standard, name := "ISO/IEC 24759" },
  { kind := .standard, name := "ISO/IEC 27001" },
  { kind := .standard, name := "ISO/IEC 27002" },
  { kind := .standard, name := "ISO/IEC 27005" },
  { kind := .standard, name := "ISO/IEC 27017" },
  { kind := .standard, name := "ISO/IEC 27018" },
  { kind := .standard, name := "ISO/IEC 27032" },
  { kind := .standard, name := "ISO/IEC 27033" },
  { kind := .standard, name := "ISO/IEC 27034" },
  { kind := .standard, name := "ISO/IEC 27035" },
  { kind := .standard, name := "ISO/IEC 27036" },
  { kind := .standard, name := "ISO/IEC 27037" },
  { kind := .standard, name := "ISO/IEC 27038" },
  { kind := .standard, name := "ISO/IEC 27039" },
  { kind := .standard, name := "ISO/IEC 27040" },
  { kind := .standard, name := "ISO/IEC 27041" },
  { kind := .standard, name := "ISO/IEC 27042" },
  { kind := .standard, name := "ISO/IEC 27043" },
  { kind := .standard, name := "ISO/IEC 27050" },
  { kind := .standard, name := "ISO/IEC 29100" },
  { kind := .standard, name := "ISO/IEC 29101" },
  { kind := .standard, name := "ISO/IEC 29115" },
  { kind := .standard, name := "ISO/IEC 29128" },
  { kind := .standard, name := "ISO/IEC 29146" },
  { kind := .standard, name := "ISO/IEC 29147" },
  { kind := .standard, name := "ISO/IEC 29150" },
  { kind := .standard, name := "ISO/IEC 29192" },
  { kind := .standard, name := "IEEE P1363-2000" },
  { kind := .standard, name := "IEEE P1363a-2004" },
  { kind := .standard, name := "IEEE P1363.1" },
  { kind := .standard, name := "IEEE P1363.2" },
  { kind := .standard, name := "IEEE 802.11" },
  { kind := .standard, name := "IEEE 802.1AE" },
  { kind := .standard, name := "IEEE 802.1X" },
  { kind := .standard, name := "ITU-T X.509" },
  { kind := .standard, name := "ITU-T X.660" },
  { kind := .standard, name := "ITU-T X.800" },
  { kind := .standard, name := "ITU-T X.805" },
  { kind := .standard, name := "SEC 1" },
  { kind := .standard, name := "SEC 2" },
]

def catalog_rfc : List CatalogItem := [
  { kind := .publication, name := "RFC 1319" },
  { kind := .publication, name := "RFC 1320" },
  { kind := .publication, name := "RFC 1321" },
  { kind := .publication, name := "RFC 2104" },
  { kind := .publication, name := "RFC 2405" },
  { kind := .publication, name := "RFC 2409" },
  { kind := .publication, name := "RFC 2412" },
  { kind := .publication, name := "RFC 2451" },
  { kind := .publication, name := "RFC 2522" },
  { kind := .publication, name := "RFC 2631" },
  { kind := .publication, name := "RFC 2716" },
  { kind := .publication, name := "RFC 2876" },
  { kind := .publication, name := "RFC 2898" },
  { kind := .publication, name := "RFC 2945" },
  { kind := .publication, name := "RFC 2986" },
  { kind := .publication, name := "RFC 3161" },
  { kind := .publication, name := "RFC 3279" },
  { kind := .publication, name := "RFC 3394" },
  { kind := .publication, name := "RFC 3447" },
  { kind := .publication, name := "RFC 3526" },
  { kind := .publication, name := "RFC 3565" },
  { kind := .publication, name := "RFC 3610" },
  { kind := .publication, name := "RFC 3711" },
  { kind := .publication, name := "RFC 3852" },
  { kind := .publication, name := "RFC 4013" },
  { kind := .publication, name := "RFC 4055" },
  { kind := .publication, name := "RFC 4086" },
  { kind := .publication, name := "RFC 4106" },
  { kind := .publication, name := "RFC 4210" },
  { kind := .publication, name := "RFC 4211" },
  { kind := .publication, name := "RFC 4251" },
  { kind := .publication, name := "RFC 4253" },
  { kind := .publication, name := "RFC 4269" },
  { kind := .publication, name := "RFC 4279" },
  { kind := .publication, name := "RFC 4301" },
  { kind := .publication, name := "RFC 4303" },
  { kind := .publication, name := "RFC 4306" },
  { kind := .publication, name := "RFC 4309" },
  { kind := .publication, name := "RFC 4346" },
  { kind := .publication, name := "RFC 4357" },
  { kind := .publication, name := "RFC 4418" },
  { kind := .publication, name := "RFC 4491" },
  { kind := .publication, name := "RFC 4492" },
  { kind := .publication, name := "RFC 4503" },
  { kind := .publication, name := "RFC 4506" },
  { kind := .publication, name := "RFC 4543" },
  { kind := .publication, name := "RFC 4556" },
  { kind := .publication, name := "RFC 4557" },
  { kind := .publication, name := "RFC 4634" },
  { kind := .publication, name := "RFC 4753" },
  { kind := .publication, name := "RFC 4754" },
  { kind := .publication, name := "RFC 4868" },
  { kind := .publication, name := "RFC 4880" },
  { kind := .publication, name := "RFC 5054" },
  { kind := .publication, name := "RFC 5084" },
  { kind := .publication, name := "RFC 5114" },
  { kind := .publication, name := "RFC 5116" },
  { kind := .publication, name := "RFC 5208" },
  { kind := .publication, name := "RFC 5246" },
  { kind := .publication, name := "RFC 5280" },
  { kind := .publication, name := "RFC 5288" },
  { kind := .publication, name := "RFC 5289" },
  { kind := .publication, name := "RFC 5297" },
  { kind := .publication, name := "RFC 5480" },
  { kind := .publication, name := "RFC 5487" },
  { kind := .publication, name := "RFC 5639" },
  { kind := .publication, name := "RFC 5649" },
  { kind := .publication, name := "RFC 5652" },
  { kind := .publication, name := "RFC 5656" },
  { kind := .publication, name := "RFC 5705" },
  { kind := .publication, name := "RFC 5755" },
  { kind := .publication, name := "RFC 5756" },
  { kind := .publication, name := "RFC 5758" },
  { kind := .publication, name := "RFC 5869" },
  { kind := .publication, name := "RFC 5915" },
  { kind := .publication, name := "RFC 5958" },
  { kind := .publication, name := "RFC 5959" },
  { kind := .publication, name := "RFC 5990" },
  { kind := .publication, name := "RFC 6031" },
  { kind := .publication, name := "RFC 6070" },
  { kind := .publication, name := "RFC 6090" },
  { kind := .publication, name := "RFC 6162" },
  { kind := .publication, name := "RFC 6187" },
  { kind := .publication, name := "RFC 6234" },
  { kind := .publication, name := "RFC 6347" },
  { kind := .publication, name := "RFC 6367" },
  { kind := .publication, name := "RFC 6655" },
  { kind := .publication, name := "RFC 6668" },
  { kind := .publication, name := "RFC 6797" },
  { kind := .publication, name := "RFC 6960" },
  { kind := .publication, name := "RFC 6962" },
  { kind := .publication, name := "RFC 6979" },
  { kind := .publication, name := "RFC 6986" },
  { kind := .publication, name := "RFC 7027" },
  { kind := .publication, name := "RFC 7030" },
  { kind := .publication, name := "RFC 7091" },
  { kind := .publication, name := "RFC 7162" },
  { kind := .publication, name := "RFC 7253" },
  { kind := .publication, name := "RFC 7292" },
  { kind := .publication, name := "RFC 7296" },
  { kind := .publication, name := "RFC 7383" },
  { kind := .publication, name := "RFC 7427" },
  { kind := .publication, name := "RFC 7468" },
  { kind := .publication, name := "RFC 7469" },
  { kind := .publication, name := "RFC 7515" },
  { kind := .publication, name := "RFC 7516" },
  { kind := .publication, name := "RFC 7517" },
  { kind := .publication, name := "RFC 7518" },
  { kind := .publication, name := "RFC 7519" },
  { kind := .publication, name := "RFC 7539" },
  { kind := .publication, name := "RFC 7627" },
  { kind := .publication, name := "RFC 7634" },
  { kind := .publication, name := "RFC 7664" },
  { kind := .publication, name := "RFC 7693" },
  { kind := .publication, name := "RFC 7748" },
  { kind := .publication, name := "RFC 7905" },
  { kind := .publication, name := "RFC 7914" },
  { kind := .publication, name := "RFC 8017" },
  { kind := .publication, name := "RFC 8018" },
  { kind := .publication, name := "RFC 8032" },
  { kind := .publication, name := "RFC 8037" },
  { kind := .publication, name := "RFC 8080" },
  { kind := .publication, name := "RFC 8103" },
  { kind := .publication, name := "RFC 8152" },
  { kind := .publication, name := "RFC 8236" },
  { kind := .publication, name := "RFC 8262" },
  { kind := .publication, name := "RFC 8270" },
  { kind := .publication, name := "RFC 8292" },
  { kind := .publication, name := "RFC 8391" },
  { kind := .publication, name := "RFC 8392" },
  { kind := .publication, name := "RFC 8410" },
  { kind := .publication, name := "RFC 8419" },
  { kind := .publication, name := "RFC 8422" },
  { kind := .publication, name := "RFC 8439" },
  { kind := .publication, name := "RFC 8446" },
  { kind := .publication, name := "RFC 8452" },
  { kind := .publication, name := "RFC 8550" },
  { kind := .publication, name := "RFC 8551" },
  { kind := .publication, name := "RFC 8554" },
  { kind := .publication, name := "RFC 8555" },
  { kind := .publication, name := "RFC 8613" },
  { kind := .publication, name := "RFC 8651" },
  { kind := .publication, name := "RFC 8692" },
  { kind := .publication, name := "RFC 8702" },
  { kind := .publication, name := "RFC 8734" },
  { kind := .publication, name := "RFC 8755" },
  { kind := .publication, name := "RFC 8770" },
  { kind := .publication, name := "RFC 8784" },
  { kind := .publication, name := "RFC 8996" },
  { kind := .publication, name := "RFC 9000" },
  { kind := .publication, name := "RFC 9001" },
  { kind := .publication, name := "RFC 9052" },
  { kind := .publication, name := "RFC 9053" },
  { kind := .publication, name := "RFC 9106" },
  { kind := .publication, name := "RFC 9180" },
  { kind := .publication, name := "RFC 9200" },
  { kind := .publication, name := "RFC 9201" },
  { kind := .publication, name := "RFC 9380" },
  { kind := .publication, name := "RFC 9381" },
  { kind := .publication, name := "RFC 9420" },
  { kind := .publication, name := "RFC 9421" },
  { kind := .publication, name := "RFC 9497" },
  { kind := .publication, name := "RFC 9528" },
  { kind := .publication, name := "RFC 9529" },
  { kind := .publication, name := "RFC 9578" },
  { kind := .publication, name := "RFC 9580" },
  { kind := .publication, name := "RFC 9605" },
  { kind := .publication, name := "RFC 9629" },
  { kind := .publication, name := "RFC 9668" },
  { kind := .publication, name := "RFC 9750" },
  { kind := .publication, name := "RFC 9794" },
  { kind := .publication, name := "RFC 9807" },
]

def catalog_organization : List CatalogItem := [
  { kind := .organization, name := "NIST" },
  { kind := .organization, name := "ISO" },
  { kind := .organization, name := "IEC" },
  { kind := .organization, name := "IETF" },
  { kind := .organization, name := "CFRG" },
  { kind := .organization, name := "TLS WG" },
  { kind := .organization, name := "IPsecME" },
  { kind := .organization, name := "OpenPGP WG" },
  { kind := .organization, name := "JOSE WG" },
  { kind := .organization, name := "COSE WG" },
  { kind := .organization, name := "ACME WG" },
  { kind := .organization, name := "TRANS WG" },
  { kind := .organization, name := "RATS WG" },
  { kind := .organization, name := "SUIT WG" },
  { kind := .organization, name := "LAKE WG" },
  { kind := .organization, name := "PQUIP WG" },
  { kind := .organization, name := "LAMPS WG" },
  { kind := .organization, name := "CNSA" },
  { kind := .organization, name := "BSI" },
  { kind := .organization, name := "ANSSI" },
  { kind := .organization, name := "ETSI" },
  { kind := .organization, name := "IEEE" },
  { kind := .organization, name := "ANSI" },
  { kind := .organization, name := "ITU-T" },
  { kind := .organization, name := "FIDO Alliance" },
  { kind := .organization, name := "W3C" },
  { kind := .organization, name := "GCHQ/NCSC" },
  { kind := .organization, name := "CSE Canada" },
  { kind := .organization, name := "ASD Australia" },
  { kind := .organization, name := "NCSC New Zealand" },
  { kind := .organization, name := "NSA" },
]

def catalog_blockchain : List CatalogItem := [
  { kind := .blockchain, name := "Proof of Work" },
  { kind := .blockchain, name := "Proof of Stake" },
  { kind := .blockchain, name := "Delegated Proof of Stake" },
  { kind := .blockchain, name := "PBFT" },
  { kind := .blockchain, name := "Tendermint" },
  { kind := .blockchain, name := "HotStuff" },
  { kind := .blockchain, name := "Avalanche consensus" },
  { kind := .blockchain, name := "Algorand consensus" },
  { kind := .blockchain, name := "Ouroboros" },
  { kind := .blockchain, name := "Proof of History" },
  { kind := .blockchain, name := "Proof of Space" },
  { kind := .blockchain, name := "Proof of Storage" },
  { kind := .blockchain, name := "Proof of Replication" },
  { kind := .blockchain, name := "Bitcoin ECDSA" },
  { kind := .blockchain, name := "Bitcoin Schnorr" },
  { kind := .blockchain, name := "Bitcoin Taproot" },
  { kind := .blockchain, name := "Bitcoin MAST" },
  { kind := .blockchain, name := "Graftroot" },
  { kind := .blockchain, name := "Simplicity" },
  { kind := .blockchain, name := "Miniscript" },
  { kind := .blockchain, name := "PSBT" },
  { kind := .blockchain, name := "Descriptor Wallets" },
  { kind := .blockchain, name := "BIP32" },
  { kind := .blockchain, name := "BIP39" },
  { kind := .blockchain, name := "BIP44" },
  { kind := .blockchain, name := "BIP84" },
  { kind := .blockchain, name := "BIP86" },
  { kind := .blockchain, name := "BIP340" },
  { kind := .blockchain, name := "SLIP39" },
  { kind := .blockchain, name := "Lightning Network" },
  { kind := .blockchain, name := "CoinJoin" },
  { kind := .blockchain, name := "PayJoin" },
  { kind := .blockchain, name := "CoinSwap" },
  { kind := .blockchain, name := "Atomic Swap" },
  { kind := .blockchain, name := "HTLC" },
  { kind := .blockchain, name := "Payment Channel" },
  { kind := .blockchain, name := "Confidential Transactions" },
  { kind := .blockchain, name := "Confidential Assets" },
  { kind := .blockchain, name := "Mimblewimble" },
  { kind := .blockchain, name := "Ethereum ECDSA" },
  { kind := .blockchain, name := "ERC-4337" },
  { kind := .blockchain, name := "EIP-1559" },
  { kind := .blockchain, name := "EIP-4844" },
  { kind := .blockchain, name := "Ethereum KZG" },
  { kind := .blockchain, name := "Ethereum BLS" },
  { kind := .blockchain, name := "Ethereum Verkle Trees" },
  { kind := .blockchain, name := "Ethereum Stateless Clients" },
  { kind := .blockchain, name := "Danksharding" },
  { kind := .blockchain, name := "Solana Ed25519" },
  { kind := .blockchain, name := "Solana Proof of History" },
  { kind := .blockchain, name := "Cardano Ed25519" },
  { kind := .blockchain, name := "Cardano VRF" },
  { kind := .blockchain, name := "Algorand Ed25519" },
  { kind := .blockchain, name := "Algorand VRF" },
  { kind := .blockchain, name := "Polkadot sr25519" },
  { kind := .blockchain, name := "Polkadot ed25519" },
  { kind := .blockchain, name := "Cosmos Ed25519" },
  { kind := .blockchain, name := "Cosmos secp256k1" },
  { kind := .blockchain, name := "Monero RingCT" },
  { kind := .blockchain, name := "Monero Bulletproofs" },
  { kind := .blockchain, name := "Monero Bulletproofs+" },
  { kind := .blockchain, name := "RandomX" },
  { kind := .blockchain, name := "Zcash Groth16" },
  { kind := .blockchain, name := "Zcash Halo2" },
  { kind := .blockchain, name := "Jubjub" },
  { kind := .blockchain, name := "Pedersen Hash" },
  { kind := .blockchain, name := "Stellar Ed25519" },
  { kind := .blockchain, name := "Ripple secp256k1" },
  { kind := .blockchain, name := "Ripple Ed25519" },
  { kind := .blockchain, name := "Litecoin Scrypt" },
  { kind := .blockchain, name := "Dogecoin Scrypt" },
  { kind := .blockchain, name := "Bitcoin Cash Schnorr" },
  { kind := .blockchain, name := "Firo Sigma" },
  { kind := .blockchain, name := "Firo Lelantus" },
  { kind := .blockchain, name := "PIVX zk-SNARKs" },
  { kind := .blockchain, name := "Haven RingCT" },
]

def catalog_quantum : List CatalogItem := [
  { kind := .quantum, name := "Pauli X gate" },
  { kind := .quantum, name := "Pauli Y gate" },
  { kind := .quantum, name := "Pauli Z gate" },
  { kind := .quantum, name := "Hadamard gate" },
  { kind := .quantum, name := "CNOT" },
  { kind := .quantum, name := "Toffoli" },
  { kind := .quantum, name := "Phase gate" },
  { kind := .quantum, name := "Shor algorithm" },
  { kind := .quantum, name := "Grover algorithm" },
  { kind := .quantum, name := "Simon algorithm" },
  { kind := .quantum, name := "HHL algorithm" },
  { kind := .quantum, name := "VQE" },
  { kind := .quantum, name := "QAOA" },
  { kind := .quantum, name := "Surface code" },
  { kind := .quantum, name := "Shor code" },
  { kind := .quantum, name := "Steane code" },
  { kind := .quantum, name := "Color code" },
  { kind := .quantum, name := "Qiskit" },
  { kind := .quantum, name := "Q#" },
  { kind := .quantum, name := "Cirq" },
  { kind := .quantum, name := "Quipper" },
  { kind := .quantum, name := "Superconducting qubits" },
  { kind := .quantum, name := "Ion-trap qubits" },
  { kind := .quantum, name := "Topological qubits" },
  { kind := .quantum, name := "Neutral-atom qubits" },
  { kind := .quantum, name := "Photonic qubits" },
  { kind := .quantum, name := "Quantum Digital Signatures" },
  { kind := .quantum, name := "Quantum Secure Direct Communication" },
  { kind := .quantum, name := "Quantum Coin Flipping" },
  { kind := .quantum, name := "Quantum Steganography" },
]

def catalog_numberTheory : List CatalogItem := [
  { kind := .numberTheory, name := "Miller-Rabin primality test" },
  { kind := .numberTheory, name := "AKS primality test" },
  { kind := .numberTheory, name := "Pollard rho factoring" },
  { kind := .numberTheory, name := "Quadratic Sieve" },
  { kind := .numberTheory, name := "General Number Field Sieve" },
  { kind := .numberTheory, name := "Pollard rho discrete logarithm" },
  { kind := .numberTheory, name := "Index Calculus" },
  { kind := .numberTheory, name := "Pohlig-Hellman" },
  { kind := .numberTheory, name := "LLL" },
  { kind := .numberTheory, name := "BKZ" },
  { kind := .numberTheory, name := "Miller pairing algorithm" },
  { kind := .numberTheory, name := "Vélu formulas" },
  { kind := .numberTheory, name := "Chinese Remainder Theorem" },
  { kind := .numberTheory, name := "FFT" },
  { kind := .numberTheory, name := "NTT" },
  { kind := .numberTheory, name := "Karatsuba multiplication" },
  { kind := .numberTheory, name := "Montgomery multiplication" },
  { kind := .numberTheory, name := "Barrett reduction" },
  { kind := .numberTheory, name := "GF(p)" },
  { kind := .numberTheory, name := "GF(2^m)" },
  { kind := .numberTheory, name := "GF(p^m)" },
  { kind := .numberTheory, name := "Ring-LWE" },
  { kind := .numberTheory, name := "Module-LWE" },
  { kind := .numberTheory, name := "LWE" },
  { kind := .numberTheory, name := "LWR" },
  { kind := .numberTheory, name := "LPN" },
  { kind := .numberTheory, name := "NTRU lattice" },
  { kind := .numberTheory, name := "Goppa codes" },
  { kind := .numberTheory, name := "QC-MDPC codes" },
  { kind := .numberTheory, name := "Rank-metric codes" },
  { kind := .numberTheory, name := "Multivariate quadratic systems" },
]

def catalog_productOrTool : List CatalogItem := [
  { kind := .productOrTool, name := "openssl CLI" },
  { kind := .productOrTool, name := "GnuPG" },
  { kind := .productOrTool, name := "gpg" },
  { kind := .productOrTool, name := "age" },
  { kind := .productOrTool, name := "age-keygen" },
  { kind := .productOrTool, name := "minisign" },
  { kind := .productOrTool, name := "signify" },
  { kind := .productOrTool, name := "ssh-keygen" },
  { kind := .productOrTool, name := "certbot" },
  { kind := .productOrTool, name := "mkcert" },
  { kind := .productOrTool, name := "step-ca" },
  { kind := .productOrTool, name := "cfssl" },
  { kind := .productOrTool, name := "hashcat" },
  { kind := .productOrTool, name := "John the Ripper" },
  { kind := .productOrTool, name := "Aircrack-ng" },
  { kind := .productOrTool, name := "Wireshark" },
  { kind := .productOrTool, name := "tcpdump" },
  { kind := .productOrTool, name := "nmap" },
  { kind := .productOrTool, name := "openssh" },
  { kind := .productOrTool, name := "stunnel" },
  { kind := .productOrTool, name := "socat" },
  { kind := .productOrTool, name := "Bitwarden" },
  { kind := .productOrTool, name := "1Password" },
  { kind := .productOrTool, name := "KeePass" },
  { kind := .productOrTool, name := "Pass" },
  { kind := .productOrTool, name := "VeraCrypt" },
  { kind := .productOrTool, name := "LUKS" },
  { kind := .productOrTool, name := "FileVault" },
  { kind := .productOrTool, name := "BitLocker" },
  { kind := .productOrTool, name := "ProtonMail" },
  { kind := .productOrTool, name := "Tutanota" },
  { kind := .productOrTool, name := "Signal" },
  { kind := .productOrTool, name := "WhatsApp" },
  { kind := .productOrTool, name := "Telegram Secret Chats" },
  { kind := .productOrTool, name := "Matrix" },
  { kind := .productOrTool, name := "Wire" },
  { kind := .productOrTool, name := "OpenVPN" },
  { kind := .productOrTool, name := "Thales HSM" },
  { kind := .productOrTool, name := "Gemalto" },
  { kind := .productOrTool, name := "Utimaco" },
  { kind := .productOrTool, name := "nCipher" },
  { kind := .productOrTool, name := "Yubico" },
  { kind := .productOrTool, name := "Nitrokey" },
  { kind := .productOrTool, name := "SoloKeys" },
  { kind := .productOrTool, name := "YubiKey" },
  { kind := .productOrTool, name := "Google Titan Key" },
  { kind := .productOrTool, name := "OnlyKey" },
  { kind := .productOrTool, name := "Ledger" },
  { kind := .productOrTool, name := "Trezor" },
  { kind := .productOrTool, name := "Coldcard" },
  { kind := .productOrTool, name := "BitBox" },
]

def catalog : List CatalogItem :=
  catalog_digest ++
  catalog_mac ++
  catalog_kdf ++
  catalog_signature ++
  catalog_pqSignature ++
  catalog_kem ++
  catalog_keyAgreement ++
  catalog_aead ++
  catalog_blockCipher ++
  catalog_blockMode ++
  catalog_streamCipher ++
  catalog_curve ++
  catalog_proofSystem ++
  catalog_commitment ++
  catalog_privacyScheme ++
  catalog_pake ++
  catalog_homomorphic ++
  catalog_functionalEncryption ++
  catalog_mpc ++
  catalog_protocol ++
  catalog_hybrid ++
  catalog_hybridPolicy ++
  catalog_encoding ++
  catalog_rng ++
  catalog_attack ++
  catalog_countermeasure ++
  catalog_formalTool ++
  catalog_implementation ++
  catalog_hardware ++
  catalog_standard ++
  catalog_rfc ++
  catalog_organization ++
  catalog_blockchain ++
  catalog_quantum ++
  catalog_numberTheory ++
  catalog_productOrTool


inductive Era where
  | classical
  | postQuantum
  | hybrid
  | notApplicable
deriving Repr, DecidableEq, BEq, Inhabited

inductive StandardizationStatus where
  | finalStandard
  | selectedForStandardization
  | externalStandard
  | publishedSpecification
  | protocolProfile
  | localProfile
  | activeCandidate
  | historical
  | researchOnly
  | withdrawn
  | superseded
  | abandoned
deriving Repr, DecidableEq, BEq, Inhabited

inductive SecurityStatus where
  | approved
  | conditionallyApproved
  | migrationOnly
  | legacy
  | deprecated
  | knownBroken
  | unassessed
  | experimental
deriving Repr, DecidableEq, BEq, Inhabited

inductive OperationalPolicy where
  | generateAndVerify
  | verifyOnly
  | decryptOnly
  | recognizeAndReject
  | disabled
  | vettedProviderRequired
  | nativeProviderRequired
  | testVectorOnly
deriving Repr, DecidableEq, BEq, Inhabited

def OperationalPolicy.canGenerate : OperationalPolicy → Bool
  | .generateAndVerify => true
  | .vettedProviderRequired => true
  | .nativeProviderRequired => true
  | _ => false

def OperationalPolicy.canVerify : OperationalPolicy → Bool
  | .generateAndVerify => true
  | .verifyOnly => true
  | .vettedProviderRequired => true
  | .nativeProviderRequired => true
  | _ => false

def OperationalPolicy.canDecrypt : OperationalPolicy → Bool
  | .generateAndVerify => true
  | .decryptOnly => true
  | .vettedProviderRequired => true
  | .nativeProviderRequired => true
  | _ => false

structure CryptoEntry where
  id : String
  canonicalName : String
  kind : CatalogKind
  era : Era
  standardization : StandardizationStatus
  security : SecurityStatus
  policy : OperationalPolicy
  definingPublication : Option String := none
  provenance : Provenance := .userSupplied
  statusPublication : Option String := none
  aliases : List String := []
  classicalComponents : List String := []
  pqComponents : List String := []
  pqSecurityCategory : Option Nat := none
deriving Repr, DecidableEq, BEq

def CryptoEntry.isHybrid (e : CryptoEntry) : Bool :=
  e.kind == .hybridSignature || e.kind == .hybridKem || e.era == .hybrid

def validPqCategoryB : Option Nat → Bool
  | none => true
  | some n => n == 1 || n == 2 || n == 3 || n == 5

def securityPolicyCompatibleB (e : CryptoEntry) : Bool :=
  match e.security with
  | .knownBroken => e.policy == .recognizeAndReject || e.policy == .disabled || e.policy == .testVectorOnly
  | .legacy => !e.policy.canGenerate
  | .deprecated => !e.policy.canGenerate
  | .unassessed => !e.policy.canGenerate
  | .experimental => e.policy == .vettedProviderRequired || e.policy == .testVectorOnly || e.policy == .disabled
  | .approved | .conditionallyApproved | .migrationOnly => e.policy != .recognizeAndReject

def sourceBindingB (e : CryptoEntry) : Bool :=
  match e.standardization with
  | .finalStandard => e.definingPublication.isSome && e.provenance == .primaryStandard
  | .externalStandard => e.definingPublication.isSome && (e.provenance == .primaryStandard || e.provenance == .officialRegistry)
  | .publishedSpecification => e.definingPublication.isSome
  | .selectedForStandardization => e.statusPublication.isSome && e.provenance == .officialRegistry
  | .protocolProfile => e.definingPublication.isSome
  | .localProfile => e.definingPublication.isSome && e.provenance == .userSupplied
  | .activeCandidate => e.statusPublication.isSome || e.definingPublication.isSome
  | .historical | .researchOnly | .withdrawn | .superseded | .abandoned =>
      e.definingPublication.isSome || e.statusPublication.isSome

def pqCategoryRequiredB (e : CryptoEntry) : Bool :=
  let pqLike := e.era == .postQuantum || e.era == .hybrid
  let current := e.standardization == .finalStandard || e.standardization == .selectedForStandardization || e.standardization == .localProfile || e.standardization == .protocolProfile
  pqLike && current && e.security != .knownBroken

def eraCategoryCompatibleB (e : CryptoEntry) : Bool :=
  if e.era == .classical || e.era == .notApplicable then
    !(e.pqSecurityCategory.isSome)
  else if pqCategoryRequiredB e then
    e.pqSecurityCategory.isSome && validPqCategoryB e.pqSecurityCategory
  else
    validPqCategoryB e.pqSecurityCategory

def hybridShapeB (e : CryptoEntry) : Bool :=
  if e.isHybrid then
    e.era == .hybrid &&
    (e.kind == .hybridSignature || e.kind == .hybridKem) &&
    !e.classicalComponents.isEmpty &&
    !e.pqComponents.isEmpty
  else
    e.classicalComponents.isEmpty && e.pqComponents.isEmpty

def CryptoEntry.localIntegrityB (e : CryptoEntry) : Bool :=
  !e.id.isEmpty &&
  !e.canonicalName.isEmpty &&
  validPqCategoryB e.pqSecurityCategory &&
  securityPolicyCompatibleB e &&
  sourceBindingB e &&
  eraCategoryCompatibleB e &&
  hybridShapeB e

def semanticRegistry : List CryptoEntry := [
  { id := "digest.sha1", canonicalName := "SHA-1", kind := .digest, era := .classical, standardization := .finalStandard, security := .legacy, policy := .verifyOnly, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_224", canonicalName := "SHA-224", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_256", canonicalName := "SHA-256", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_384", canonicalName := "SHA-384", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_512", canonicalName := "SHA-512", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_512_224", canonicalName := "SHA-512/224", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha2_512_256", canonicalName := "SHA-512/256", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 180-4", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha3_224", canonicalName := "SHA3-224", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha3_256", canonicalName := "SHA3-256", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha3_384", canonicalName := "SHA3-384", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.sha3_512", canonicalName := "SHA3-512", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.shake128", canonicalName := "SHAKE128", kind := .xof, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.shake256", canonicalName := "SHAKE256", kind := .xof, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 202", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.md5", canonicalName := "MD5", kind := .digest, era := .classical, standardization := .historical, security := .knownBroken, policy := .recognizeAndReject, definingPublication := some "RFC 1321", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.blake3", canonicalName := "BLAKE3", kind := .xof, era := .classical, standardization := .publishedSpecification, security := .approved, policy := .generateAndVerify, definingPublication := some "BLAKE3 specification", provenance := .implementationDocumentation, statusPublication := none, aliases := ["BLAKE3-256", "BLAKE3-XOF"], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.keccak256", canonicalName := "Keccak-256", kind := .digest, era := .classical, standardization := .historical, security := .approved, policy := .generateAndVerify, definingPublication := some "Keccak submission specification", provenance := .historicalSubmission, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.ascon_hash256", canonicalName := "Ascon-Hash256", kind := .digest, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-232", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.ascon_xof128", canonicalName := "Ascon-XOF128", kind := .xof, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-232", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "digest.ascon_cxof128", canonicalName := "Ascon-CXOF128", kind := .xof, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-232", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "mac.hmac_sha256", canonicalName := "HMAC-SHA-256", kind := .mac, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 198-1", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "mac.hmac_sha384", canonicalName := "HMAC-SHA-384", kind := .mac, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 198-1", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "mac.hmac_sha512", canonicalName := "HMAC-SHA-512", kind := .mac, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 198-1", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "kdf.hkdf_sha256", canonicalName := "HKDF-SHA-256", kind := .kdf, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 5869", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "kdf.pbkdf2_sha256", canonicalName := "PBKDF2-HMAC-SHA-256", kind := .kdf, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8018", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "kdf.argon2id", canonicalName := "Argon2id", kind := .kdf, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 9106", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "kdf.scrypt", canonicalName := "scrypt", kind := .kdf, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 7914", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ed25519", canonicalName := "Ed25519", kind := .signature, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8032", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ed448", canonicalName := "Ed448", kind := .signature, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8032", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ecdsa_p256", canonicalName := "ECDSA P-256 SHA-256", kind := .signature, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 186-5", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ecdsa_p384", canonicalName := "ECDSA P-384 SHA-384", kind := .signature, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 186-5", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ecdsa_p521", canonicalName := "ECDSA P-521 SHA-512", kind := .signature, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 186-5", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.rsa_pss_sha256", canonicalName := "RSA-PSS SHA-256 MGF1-SHA-256", kind := .signature, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8017", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.rsa_pkcs1_sha1", canonicalName := "RSA PKCS1 v1.5 SHA-1", kind := .signature, era := .classical, standardization := .historical, security := .legacy, policy := .verifyOnly, definingPublication := some "RFC 8017", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.bip340", canonicalName := "BIP-340 Schnorr secp256k1", kind := .signature, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "BIP 340", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "sig.ml_dsa_44", canonicalName := "ML-DSA-44", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 204", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 2 },
  { id := "sig.ml_dsa_65", canonicalName := "ML-DSA-65", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 204", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "sig.ml_dsa_87", canonicalName := "ML-DSA-87", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 204", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.slh_dsa_sha2_128s", canonicalName := "SLH-DSA-SHA2-128s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "sig.slh_dsa_sha2_128f", canonicalName := "SLH-DSA-SHA2-128f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "sig.slh_dsa_sha2_192s", canonicalName := "SLH-DSA-SHA2-192s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "sig.slh_dsa_sha2_192f", canonicalName := "SLH-DSA-SHA2-192f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "sig.slh_dsa_sha2_256s", canonicalName := "SLH-DSA-SHA2-256s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.slh_dsa_sha2_256f", canonicalName := "SLH-DSA-SHA2-256f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.slh_dsa_shake_128s", canonicalName := "SLH-DSA-SHAKE-128s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "sig.slh_dsa_shake_128f", canonicalName := "SLH-DSA-SHAKE-128f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "sig.slh_dsa_shake_192s", canonicalName := "SLH-DSA-SHAKE-192s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "sig.slh_dsa_shake_192f", canonicalName := "SLH-DSA-SHAKE-192f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "sig.slh_dsa_shake_256s", canonicalName := "SLH-DSA-SHAKE-256s", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.slh_dsa_shake_256f", canonicalName := "SLH-DSA-SHAKE-256f", kind := .pqSignature, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 205", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.falcon512", canonicalName := "Falcon-512", kind := .pqSignature, era := .postQuantum, standardization := .selectedForStandardization, security := .experimental, policy := .vettedProviderRequired, definingPublication := none, provenance := .officialRegistry, statusPublication := some "NIST IR 8413", aliases := ["FN-DSA candidate 512"], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "sig.falcon1024", canonicalName := "Falcon-1024", kind := .pqSignature, era := .postQuantum, standardization := .selectedForStandardization, security := .experimental, policy := .vettedProviderRequired, definingPublication := none, provenance := .officialRegistry, statusPublication := some "NIST IR 8413", aliases := ["FN-DSA candidate 1024"], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "sig.rainbow", canonicalName := "Rainbow", kind := .pqSignature, era := .postQuantum, standardization := .historical, security := .knownBroken, policy := .recognizeAndReject, definingPublication := some "NIST PQC Rainbow submission specification", provenance := .historicalSubmission, statusPublication := some "NIST IR 8413", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "kem.ml_kem_512", canonicalName := "ML-KEM-512", kind := .kem, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 203", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "kem.ml_kem_768", canonicalName := "ML-KEM-768", kind := .kem, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 203", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "kem.ml_kem_1024", canonicalName := "ML-KEM-1024", kind := .kem, era := .postQuantum, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "FIPS 203", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "kem.hqc_128", canonicalName := "HQC-128", kind := .kem, era := .postQuantum, standardization := .selectedForStandardization, security := .experimental, policy := .vettedProviderRequired, definingPublication := none, provenance := .officialRegistry, statusPublication := some "NIST IR 8545", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 1 },
  { id := "kem.hqc_192", canonicalName := "HQC-192", kind := .kem, era := .postQuantum, standardization := .selectedForStandardization, security := .experimental, policy := .vettedProviderRequired, definingPublication := none, provenance := .officialRegistry, statusPublication := some "NIST IR 8545", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 3 },
  { id := "kem.hqc_256", canonicalName := "HQC-256", kind := .kem, era := .postQuantum, standardization := .selectedForStandardization, security := .experimental, policy := .vettedProviderRequired, definingPublication := none, provenance := .officialRegistry, statusPublication := some "NIST IR 8545", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := some 5 },
  { id := "kem.sike", canonicalName := "SIKE", kind := .kem, era := .postQuantum, standardization := .historical, security := .knownBroken, policy := .recognizeAndReject, definingPublication := some "NIST PQC SIKE submission specification", provenance := .historicalSubmission, statusPublication := some "NIST IR 8413", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "curve.curve25519", canonicalName := "Curve25519", kind := .curve, era := .notApplicable, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 7748", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "curve.edwards25519", canonicalName := "Edwards25519", kind := .curve, era := .notApplicable, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8032", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "curve.curve448", canonicalName := "Curve448", kind := .curve, era := .notApplicable, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 7748", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "curve.edwards448", canonicalName := "Edwards448", kind := .curve, era := .notApplicable, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8032", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "ka.x25519", canonicalName := "X25519", kind := .keyAgreement, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 7748", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "ka.x448", canonicalName := "X448", kind := .keyAgreement, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 7748", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "aead.aes128_gcm", canonicalName := "AES-128-GCM", kind := .aead, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-38D", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "aead.aes192_gcm", canonicalName := "AES-192-GCM", kind := .aead, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-38D", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "aead.aes256_gcm", canonicalName := "AES-256-GCM", kind := .aead, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-38D", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "aead.chacha20_poly1305", canonicalName := "ChaCha20-Poly1305", kind := .aead, era := .classical, standardization := .externalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "RFC 8439", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "aead.ascon_aead128", canonicalName := "Ascon-AEAD128", kind := .aead, era := .classical, standardization := .finalStandard, security := .approved, policy := .generateAndVerify, definingPublication := some "NIST SP 800-232", provenance := .primaryStandard, statusPublication := none, aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "cipher.rc4", canonicalName := "RC4", kind := .streamCipher, era := .classical, standardization := .historical, security := .knownBroken, policy := .recognizeAndReject, definingPublication := some "RFC 6229", provenance := .historicalSubmission, statusPublication := some "RFC 7465", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "cipher.des", canonicalName := "DES", kind := .blockCipher, era := .classical, standardization := .historical, security := .knownBroken, policy := .recognizeAndReject, definingPublication := some "FIPS 46-3", provenance := .historicalSubmission, statusPublication := some "NIST FIPS 46-3 withdrawal notice", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "cipher.3des", canonicalName := "3DES", kind := .blockCipher, era := .classical, standardization := .historical, security := .legacy, policy := .verifyOnly, definingPublication := some "NIST SP 800-67 Rev 2", provenance := .historicalSubmission, statusPublication := some "NIST SP 800-67 Rev 2 withdrawal", aliases := [], classicalComponents := [], pqComponents := [], pqSecurityCategory := none },
  { id := "hybrid.x25519_mlkem768", canonicalName := "X25519 + ML-KEM-768", kind := .hybridKem, era := .hybrid, standardization := .localProfile, security := .approved, policy := .generateAndVerify, definingPublication := some "ProofBundle Hybrid Profile V1", provenance := .userSupplied, statusPublication := none, aliases := [], classicalComponents := ["ka.x25519"], pqComponents := ["kem.ml_kem_768"], pqSecurityCategory := some 3 },
  { id := "hybrid.ed25519_mldsa65", canonicalName := "Ed25519 + ML-DSA-65", kind := .hybridSignature, era := .hybrid, standardization := .localProfile, security := .approved, policy := .generateAndVerify, definingPublication := some "ProofBundle Hybrid Profile V1", provenance := .userSupplied, statusPublication := none, aliases := [], classicalComponents := ["sig.ed25519"], pqComponents := ["sig.ml_dsa_65"], pqSecurityCategory := some 3 },
]


def stringOccurs (x : String) : List String → Bool
  | [] => false
  | y :: ys => (x == y) || stringOccurs x ys

def uniqueStrings : List String → Bool
  | [] => true
  | x :: xs => !(stringOccurs x xs) && uniqueStrings xs

def semanticIds : List String := semanticRegistry.map (fun e => e.id)
def semanticCanonicalNames : List String := semanticRegistry.map (fun e => e.canonicalName)

def semanticIdentityNames : List CryptoEntry → List String
  | [] => []
  | e :: es => e.canonicalName :: (e.aliases ++ semanticIdentityNames es)

def findEntryById (id : String) : Option CryptoEntry :=
  semanticRegistry.find? (fun e => e.id == id)

def idResolvesB (id : String) : Bool := (findEntryById id).isSome

def allIdsResolveB (ids : List String) : Bool := ids.all idResolvesB

def entryMatchesB (id : String) (kind : CatalogKind) (era : Era) : Bool :=
  match findEntryById id with
  | none => false
  | some e => e.kind == kind && e.era == era

def hybridComponentKindsB (e : CryptoEntry) : Bool :=
  if e.kind == .hybridSignature then
    e.classicalComponents.all (fun id => entryMatchesB id .signature .classical) &&
    e.pqComponents.all (fun id => entryMatchesB id .pqSignature .postQuantum)
  else if e.kind == .hybridKem then
    e.classicalComponents.all (fun id => entryMatchesB id .keyAgreement .classical) &&
    e.pqComponents.all (fun id => entryMatchesB id .kem .postQuantum)
  else
    true

def hybridComponentsResolveB (e : CryptoEntry) : Bool :=
  if e.isHybrid then
    allIdsResolveB e.classicalComponents &&
    allIdsResolveB e.pqComponents &&
    uniqueStrings e.classicalComponents &&
    uniqueStrings e.pqComponents &&
    !(e.classicalComponents.contains e.id) &&
    !(e.pqComponents.contains e.id)
  else
    true

def pqCategoryById (id : String) : Option Nat :=
  match findEntryById id with
  | none => none
  | some e => e.pqSecurityCategory

def allPqComponentCategoriesPresentB (e : CryptoEntry) : Bool :=
  e.pqComponents.all (fun id => (pqCategoryById id).isSome)

def minNat? : List Nat → Option Nat
  | [] => none
  | x :: xs => some (xs.foldl Nat.min x)

def resolvedPqCategories (ids : List String) : List Nat :=
  ids.filterMap pqCategoryById

def hybridCategoryConservativeB (e : CryptoEntry) : Bool :=
  if e.isHybrid then
    allPqComponentCategoriesPresentB e &&
    match e.pqSecurityCategory, minNat? (resolvedPqCategories e.pqComponents) with
    | some claimed, some actual => decide (claimed <= actual)
    | _, _ => false
  else
    true

def entryGlobalIntegrityB (e : CryptoEntry) : Bool :=
  e.localIntegrityB &&
  hybridComponentsResolveB e &&
  hybridComponentKindsB e &&
  hybridCategoryConservativeB e

def semanticRegistryLocalIntegrityB : Bool :=
  semanticRegistry.all CryptoEntry.localIntegrityB

def semanticRegistryGlobalIntegrityB : Bool :=
  semanticRegistry.all entryGlobalIntegrityB

def semanticRegistryIdsUniqueB : Bool := uniqueStrings semanticIds

def semanticRegistryCanonicalNamesUniqueB : Bool := uniqueStrings semanticCanonicalNames

def semanticRegistryIdentityNamesUniqueB : Bool := uniqueStrings (semanticIdentityNames semanticRegistry)

def brokenGenerationViolations : List String :=
  (semanticRegistry.filter (fun e => e.security == .knownBroken && e.policy.canGenerate)).map (fun e => e.id)

def brokenVerificationViolations : List String :=
  (semanticRegistry.filter (fun e => e.security == .knownBroken && e.policy.canVerify)).map (fun e => e.id)

def legacyGenerationViolations : List String :=
  (semanticRegistry.filter (fun e => (e.security == .legacy || e.security == .deprecated) && e.policy.canGenerate)).map (fun e => e.id)

def unresolvedHybridComponentIds : List String :=
  (semanticRegistry.filter (fun e => e.isHybrid && !(hybridComponentsResolveB e))).map (fun e => e.id)

def mistypedHybridComponentIds : List String :=
  (semanticRegistry.filter (fun e => e.isHybrid && !(hybridComponentKindsB e))).map (fun e => e.id)

def overstatedHybridCategoryIds : List String :=
  (semanticRegistry.filter (fun e => e.isHybrid && !(hybridCategoryConservativeB e))).map (fun e => e.id)

-- Closed registry obligations. These compute over the concrete registry; no premise packages the result.
theorem semantic_registry_local_integrity : semanticRegistryLocalIntegrityB = true := by
  decide

theorem semantic_registry_global_integrity : semanticRegistryGlobalIntegrityB = true := by
  decide

theorem semantic_registry_ids_unique : semanticRegistryIdsUniqueB = true := by
  decide

theorem semantic_registry_canonical_names_unique : semanticRegistryCanonicalNamesUniqueB = true := by
  decide

theorem semantic_registry_identity_names_unique : semanticRegistryIdentityNamesUniqueB = true := by
  decide

theorem semantic_registry_no_broken_generation : brokenGenerationViolations = [] := by
  decide

theorem semantic_registry_no_broken_verification : brokenVerificationViolations = [] := by
  decide

theorem semantic_registry_no_legacy_generation : legacyGenerationViolations = [] := by
  decide

theorem semantic_registry_hybrid_components_resolve : unresolvedHybridComponentIds = [] := by
  decide

theorem semantic_registry_hybrid_components_typed : mistypedHybridComponentIds = [] := by
  decide

theorem semantic_registry_hybrid_categories_conservative : overstatedHybridCategoryIds = [] := by
  decide

-- Canonical-vs-historical identity boundaries are checked as sets, not as isolated string inequalities.
def canonicalAsconNames : List String := [
  "Ascon-AEAD128", "Ascon-Hash256", "Ascon-XOF128", "Ascon-CXOF128"
]

def preStandardAsconNames : List String := [
  "Ascon-128", "Ascon-128a", "Ascon-80pq", "Ascon-Hash", "Ascon-Hasha", "Ascon-Xof", "Ascon-Xofa"
]

def listsDisjointB (xs ys : List String) : Bool :=
  xs.all (fun x => !(ys.contains x))

def asconIdentityBoundaryB : Bool :=
  uniqueStrings canonicalAsconNames &&
  uniqueStrings preStandardAsconNames &&
  listsDisjointB canonicalAsconNames preStandardAsconNames

theorem ascon_identity_boundary_holds : asconIdentityBoundaryB = true := by
  decide

def registryIdentityPairSeparatedB (leftId rightId : String) : Bool :=
  match findEntryById leftId, findEntryById rightId with
  | some left, some right =>
      left.id != right.id &&
      left.canonicalName != right.canonicalName &&
      left.definingPublication.isSome &&
      right.definingPublication.isSome
  | _, _ => false

def registryRolePairSeparatedB
    (leftId rightId : String) (leftKind rightKind : CatalogKind) : Bool :=
  match findEntryById leftId, findEntryById rightId with
  | some left, some right =>
      registryIdentityPairSeparatedB leftId rightId &&
      left.kind == leftKind &&
      right.kind == rightKind &&
      left.kind != right.kind
  | _, _ => false

def identitySeparationB : Bool :=
  registryIdentityPairSeparatedB "digest.sha3_256" "digest.keccak256" &&
  registryIdentityPairSeparatedB "curve.curve25519" "curve.edwards25519" &&
  registryRolePairSeparatedB "curve.curve25519" "ka.x25519" .curve .keyAgreement &&
  registryRolePairSeparatedB "ka.x25519" "sig.ed25519" .keyAgreement .signature &&
  registryIdentityPairSeparatedB "curve.curve448" "curve.edwards448" &&
  registryRolePairSeparatedB "curve.curve448" "ka.x448" .curve .keyAgreement &&
  registryRolePairSeparatedB "ka.x448" "sig.ed448" .keyAgreement .signature

theorem registry_construction_identities_remain_separated : identitySeparationB = true := by
  decide

-- Finite hardening state space. The conflict relation is independent of the selected profile.
inductive HardeningConstraint where
  | rejectBrokenAndUnknown
  | canonicalIdentitySeparation
  | sourceBinding
  | hybridComponentClosure
  | hybridCategoryConservatism
  | distinctFailureSemantics
  | preserveLegacyVerification
  | prohibitLegacyVerification
  | evidenceBoundProviderAgility
  | pinSingleProvider
  | stagedHybridMigration
  | immediatePqOnly
deriving Repr, DecidableEq, BEq, Inhabited

def allHardeningConstraints : List HardeningConstraint := [
  .rejectBrokenAndUnknown,
  .canonicalIdentitySeparation,
  .sourceBinding,
  .hybridComponentClosure,
  .hybridCategoryConservatism,
  .distinctFailureSemantics,
  .preserveLegacyVerification,
  .prohibitLegacyVerification,
  .evidenceBoundProviderAgility,
  .pinSingleProvider,
  .stagedHybridMigration,
  .immediatePqOnly
]

def hardeningConflictB : HardeningConstraint → HardeningConstraint → Bool
  | .preserveLegacyVerification, .prohibitLegacyVerification => true
  | .prohibitLegacyVerification, .preserveLegacyVerification => true
  | .evidenceBoundProviderAgility, .pinSingleProvider => true
  | .pinSingleProvider, .evidenceBoundProviderAgility => true
  | .stagedHybridMigration, .immediatePqOnly => true
  | .immediatePqOnly, .stagedHybridMigration => true
  | _, _ => false

def conflictDegree (c : HardeningConstraint) : Nat :=
  (allHardeningConstraints.filter (fun d => hardeningConflictB c d)).length

def leastContradictoryCore : List HardeningConstraint :=
  allHardeningConstraints.filter (fun c => conflictDegree c == 0)

def contradictionCount : List HardeningConstraint → Nat
  | [] => 0
  | c :: cs =>
      (cs.filter (fun d => hardeningConflictB c d)).length + contradictionCount cs

def constraintOccurs (x : HardeningConstraint) : List HardeningConstraint → Bool
  | [] => false
  | y :: ys => (x == y) || constraintOccurs x ys

def uniqueConstraints : List HardeningConstraint → Bool
  | [] => true
  | x :: xs => !(constraintOccurs x xs) && uniqueConstraints xs

def compatibleHardeningB (s : List HardeningConstraint) : Bool :=
  uniqueConstraints s && contradictionCount s == 0

def hardeningSubsetB (xs ys : List HardeningConstraint) : Bool :=
  xs.all (fun x => constraintOccurs x ys)

def powerset : List HardeningConstraint → List (List HardeningConstraint)
  | [] => [[]]
  | x :: xs =>
      let rest := powerset xs
      rest ++ rest.map (fun s => x :: s)

def hardeningStateSpace : List (List HardeningConstraint) :=
  powerset allHardeningConstraints

def hardeningStrength (s : List HardeningConstraint) : Nat := s.length

def adaptivePreferenceConstraints : List HardeningConstraint := [
  .preserveLegacyVerification,
  .evidenceBoundProviderAgility,
  .stagedHybridMigration
]

def adaptabilityScore (s : List HardeningConstraint) : Nat :=
  (adaptivePreferenceConstraints.filter (fun c => constraintOccurs c s)).length

-- This literal is an audit expectation only. It does not define either the core or the selected profile.
def expectedLeastContradictoryCore : List HardeningConstraint := [
  .rejectBrokenAndUnknown,
  .canonicalIdentitySeparation,
  .sourceBinding,
  .hybridComponentClosure,
  .hybridCategoryConservatism,
  .distinctFailureSemantics
]

def expectedHardenedAdaptiveProfile : List HardeningConstraint := [
  .rejectBrokenAndUnknown,
  .canonicalIdentitySeparation,
  .sourceBinding,
  .hybridComponentClosure,
  .hybridCategoryConservatism,
  .distinctFailureSemantics,
  .preserveLegacyVerification,
  .evidenceBoundProviderAgility,
  .stagedHybridMigration
]

def maxNatList : List Nat → Nat
  | [] => 0
  | x :: xs => xs.foldl Nat.max x

def minNatList : List Nat → Nat
  | [] => 0
  | x :: xs => xs.foldl Nat.min x

def stateContradictionScores : List Nat :=
  hardeningStateSpace.map contradictionCount

def minimumContradictionScore : Nat := minNatList stateContradictionScores

def leastContradictoryStates : List (List HardeningConstraint) :=
  hardeningStateSpace.filter (fun s => contradictionCount s == minimumContradictionScore)

def compatibleStates : List (List HardeningConstraint) :=
  leastContradictoryStates.filter compatibleHardeningB

def maximumCompatibleStrength : Nat :=
  maxNatList (compatibleStates.map hardeningStrength)

def strongestCompatibleStates : List (List HardeningConstraint) :=
  compatibleStates.filter (fun s => hardeningStrength s == maximumCompatibleStrength)

def maximumAdaptabilityAtStrengthFrontier : Nat :=
  maxNatList (strongestCompatibleStates.map adaptabilityScore)

def bestAdaptiveFrontierStates : List (List HardeningConstraint) :=
  strongestCompatibleStates.filter
    (fun s => adaptabilityScore s == maximumAdaptabilityAtStrengthFrontier)

-- The selected profile is derived from the optimization result. Ambiguity fails closed to [].
def hardenedAdaptiveProfile : List HardeningConstraint :=
  match bestAdaptiveFrontierStates with
  | [s] => s
  | _ => []

def noStrictCompatibleExtensionB (base : List HardeningConstraint) : Bool :=
  hardeningStateSpace.all (fun candidate =>
    if compatibleHardeningB candidate && hardeningSubsetB base candidate then
      !(decide (hardeningStrength base < hardeningStrength candidate))
    else
      true)

def everyStrengthFrontierContainsCoreB : Bool :=
  strongestCompatibleStates.all (fun s => hardeningSubsetB leastContradictoryCore s)

def hardeningConflictIrreflexiveB : Bool :=
  allHardeningConstraints.all (fun c => !(hardeningConflictB c c))

def hardeningConflictSymmetricB : Bool :=
  allHardeningConstraints.all (fun a =>
    allHardeningConstraints.all (fun b => hardeningConflictB a b == hardeningConflictB b a))

def everySingleAdditionContradictsB (base : List HardeningConstraint) : Bool :=
  allHardeningConstraints.all (fun c =>
    if constraintOccurs c base then true
    else decide (0 < contradictionCount (c :: base)))

def adaptivePreferenceWellFormedB : Bool :=
  uniqueConstraints adaptivePreferenceConstraints &&
  hardeningSubsetB adaptivePreferenceConstraints allHardeningConstraints &&
  compatibleHardeningB adaptivePreferenceConstraints

-- State-space results are closed computations over the complete 2^12 model.
-- "Maximal" below is deliberately scoped to this declared finite constraint space.
theorem hardening_state_space_size : hardeningStateSpace.length = 4096 := by
  decide

theorem hardening_constraint_universe_has_unique_members :
    uniqueConstraints allHardeningConstraints = true := by
  decide

theorem hardening_conflict_is_irreflexive : hardeningConflictIrreflexiveB = true := by
  decide

theorem hardening_conflict_is_symmetric : hardeningConflictSymmetricB = true := by
  decide

theorem adaptive_preferences_are_well_formed : adaptivePreferenceWellFormedB = true := by
  decide

theorem least_contradictory_core_has_six_constraints : leastContradictoryCore.length = 6 := by
  decide

theorem minimum_contradiction_is_zero : minimumContradictionScore = 0 := by
  decide

theorem least_contradictory_core_is_computed_as_expected :
    leastContradictoryCore = expectedLeastContradictoryCore := by
  decide

theorem hardened_profile_is_computed_as_expected :
    hardenedAdaptiveProfile = expectedHardenedAdaptiveProfile := by
  decide

theorem hardened_profile_is_compatible : compatibleHardeningB hardenedAdaptiveProfile = true := by
  decide

theorem hardened_profile_contains_entire_least_contradictory_core :
    hardeningSubsetB leastContradictoryCore hardenedAdaptiveProfile = true := by
  decide

theorem hardened_profile_reaches_global_strength_frontier :
    hardeningStrength hardenedAdaptiveProfile = maximumCompatibleStrength := by
  decide

theorem hardened_profile_reaches_adaptability_frontier :
    adaptabilityScore hardenedAdaptiveProfile = maximumAdaptabilityAtStrengthFrontier := by
  decide

theorem adaptability_optimum_at_strength_frontier_is_unique :
    bestAdaptiveFrontierStates.length = 1 := by
  decide

theorem hardened_profile_has_no_strict_compatible_extension :
    noStrictCompatibleExtensionB hardenedAdaptiveProfile = true := by
  decide

theorem every_missing_constraint_conflicts_with_hardened_profile :
    everySingleAdditionContradictsB hardenedAdaptiveProfile = true := by
  decide

theorem every_global_strength_frontier_contains_least_contradictory_core :
    everyStrengthFrontierContainsCoreB = true := by
  decide

-- Policy evaluation is total and absence is a first-class rejection, never a fabricated fallback entry.
structure EvaluationContext where
  allowLegacyVerification : Bool := false
  allowExperimentalProvider : Bool := false
  providerEvidencePresent : Bool := false
  requireCurrentGeneration : Bool := true
  minimumPqCategory : Nat := 1
  requireHybrid : Bool := false
deriving Repr, DecidableEq, BEq

inductive Decision where
  | allow
  | verifyOnly
  | rejectUnknown
  | rejectBroken
  | rejectPolicy
  | rejectPqCategory
  | rejectHybridRequired
  | rejectProviderEvidence
  | rejectSourceBinding
  | rejectIntegrity
  deriving Repr, DecidableEq, BEq, Inhabited

def evaluateEntry (ctx : EvaluationContext) (e : CryptoEntry) : Decision :=
  if !(sourceBindingB e) then .rejectSourceBinding
  else if !(entryGlobalIntegrityB e) then .rejectIntegrity
  else if e.security == .knownBroken then .rejectBroken
  else if ctx.requireHybrid && !e.isHybrid then .rejectHybridRequired
  else if e.security == .experimental && !ctx.allowExperimentalProvider then .rejectPolicy
  else if e.policy == .vettedProviderRequired && !ctx.providerEvidencePresent then .rejectProviderEvidence
  else match e.pqSecurityCategory with
    | some n =>
        if n < ctx.minimumPqCategory then .rejectPqCategory
        else if e.policy == .verifyOnly then
          if ctx.allowLegacyVerification then .verifyOnly else .rejectPolicy
        else if ctx.requireCurrentGeneration && !e.policy.canGenerate then .rejectPolicy
        else .allow
    | none =>
        if e.policy == .verifyOnly then
          if ctx.allowLegacyVerification then .verifyOnly else .rejectPolicy
        else if ctx.requireCurrentGeneration && !e.policy.canGenerate then .rejectPolicy
        else .allow

def evaluateById (ctx : EvaluationContext) (id : String) : Decision :=
  match findEntryById id with
  | none => .rejectUnknown
  | some e => evaluateEntry ctx e

def strictCurrent : EvaluationContext := {
  allowLegacyVerification := false,
  allowExperimentalProvider := false,
  providerEvidencePresent := false,
  requireCurrentGeneration := true,
  minimumPqCategory := 3,
  requireHybrid := false
}

def archivalVerification : EvaluationContext := {
  allowLegacyVerification := true,
  allowExperimentalProvider := false,
  providerEvidencePresent := false,
  requireCurrentGeneration := false,
  minimumPqCategory := 1,
  requireHybrid := false
}

def hybridTransition : EvaluationContext := {
  allowLegacyVerification := false,
  allowExperimentalProvider := false,
  providerEvidencePresent := false,
  requireCurrentGeneration := true,
  minimumPqCategory := 3,
  requireHybrid := true
}

def experimentalProviderMissingEvidence : EvaluationContext := {
  allowLegacyVerification := false,
  allowExperimentalProvider := true,
  providerEvidencePresent := false,
  requireCurrentGeneration := true,
  minimumPqCategory := 3,
  requireHybrid := false
}

def experimentalProviderWithEvidence : EvaluationContext := {
  allowLegacyVerification := false,
  allowExperimentalProvider := true,
  providerEvidencePresent := true,
  requireCurrentGeneration := true,
  minimumPqCategory := 3,
  requireHybrid := false
}

-- Negative-control fixtures are not members of semanticRegistry.
-- They exercise rejection paths independently of the curated registry contents.
def missingSourceFixture : CryptoEntry := {
  id := "fixture.missing_source",
  canonicalName := "Missing Source Fixture",
  kind := .digest,
  era := .classical,
  standardization := .finalStandard,
  security := .approved,
  policy := .generateAndVerify,
  definingPublication := none,
  provenance := .primaryStandard
}

def unresolvedHybridFixture : CryptoEntry := {
  id := "fixture.unresolved_hybrid",
  canonicalName := "Unresolved Hybrid Fixture",
  kind := .hybridKem,
  era := .hybrid,
  standardization := .localProfile,
  security := .approved,
  policy := .generateAndVerify,
  definingPublication := some "ProofBundle Negative Test Fixture V1",
  provenance := .userSupplied,
  classicalComponents := ["ka.x25519"],
  pqComponents := ["kem.nonexistent"],
  pqSecurityCategory := some 3
}

theorem rc4_is_present : (findEntryById "cipher.rc4").isSome = true := by
  decide

theorem mlkem768_is_present : (findEntryById "kem.ml_kem_768").isSome = true := by
  decide

theorem strict_policy_rejects_rc4 : evaluateById strictCurrent "cipher.rc4" = .rejectBroken := by
  decide

theorem strict_policy_accepts_mlkem768 : evaluateById strictCurrent "kem.ml_kem_768" = .allow := by
  decide

theorem strict_policy_rejects_unknown : evaluateById strictCurrent "missing.algorithm" = .rejectUnknown := by
  decide

theorem strict_policy_rejects_sha1_generation : evaluateById strictCurrent "digest.sha1" = .rejectPolicy := by
  decide

theorem archival_policy_verifies_sha1 : evaluateById archivalVerification "digest.sha1" = .verifyOnly := by
  decide

theorem hybrid_policy_rejects_nonhybrid_mlkem : evaluateById hybridTransition "kem.ml_kem_768" = .rejectHybridRequired := by
  decide

theorem hybrid_policy_accepts_x25519_mlkem768 : evaluateById hybridTransition "hybrid.x25519_mlkem768" = .allow := by
  decide

theorem provider_required_entry_rejects_missing_evidence :
    evaluateById experimentalProviderMissingEvidence "kem.hqc_192" = .rejectProviderEvidence := by
  decide

theorem provider_required_entry_accepts_present_evidence :
    evaluateById experimentalProviderWithEvidence "kem.hqc_192" = .allow := by
  decide

theorem missing_source_fixture_fails_source_binding : sourceBindingB missingSourceFixture = false := by
  decide

theorem evaluator_rejects_missing_source_fixture :
    evaluateEntry strictCurrent missingSourceFixture = .rejectSourceBinding := by
  decide

theorem unresolved_hybrid_fixture_fails_global_integrity :
    entryGlobalIntegrityB unresolvedHybridFixture = false := by
  decide

theorem evaluator_rejects_unresolved_hybrid_fixture :
    evaluateEntry strictCurrent unresolvedHybridFixture = .rejectIntegrity := by
  decide

def sourceBindingsCompleteB : Bool := semanticRegistry.all sourceBindingB

def hardeningCoreImplementedB : Bool :=
  brokenGenerationViolations == [] &&
  brokenVerificationViolations == [] &&
  semanticRegistryIdentityNamesUniqueB &&
  asconIdentityBoundaryB &&
  identitySeparationB &&
  sourceBindingsCompleteB &&
  unresolvedHybridComponentIds == [] &&
  mistypedHybridComponentIds == [] &&
  overstatedHybridCategoryIds == [] &&
  evaluateById strictCurrent "missing.algorithm" == .rejectUnknown &&
  evaluateById strictCurrent "cipher.rc4" == .rejectBroken &&
  evaluateById strictCurrent "digest.sha1" == .rejectPolicy &&
  evaluateById hybridTransition "kem.ml_kem_768" == .rejectHybridRequired &&
  evaluateEntry strictCurrent missingSourceFixture == .rejectSourceBinding &&
  evaluateEntry strictCurrent unresolvedHybridFixture == .rejectIntegrity

def adaptableChoicesRealizedB : Bool :=
  evaluateById archivalVerification "digest.sha1" == .verifyOnly &&
  evaluateById hybridTransition "hybrid.x25519_mlkem768" == .allow &&
  evaluateById experimentalProviderMissingEvidence "kem.hqc_192" == .rejectProviderEvidence &&
  evaluateById experimentalProviderWithEvidence "kem.hqc_192" == .allow

theorem hardening_core_is_operationally_realized : hardeningCoreImplementedB = true := by
  decide

theorem adaptable_frontier_choices_are_realized : adaptableChoicesRealizedB = true := by
  decide

def hardenedRegistryCertificateB : Bool :=
  semanticRegistryLocalIntegrityB &&
  semanticRegistryGlobalIntegrityB &&
  semanticRegistryIdsUniqueB &&
  semanticRegistryCanonicalNamesUniqueB &&
  semanticRegistryIdentityNamesUniqueB &&
  brokenGenerationViolations == [] &&
  brokenVerificationViolations == [] &&
  legacyGenerationViolations == [] &&
  unresolvedHybridComponentIds == [] &&
  mistypedHybridComponentIds == [] &&
  overstatedHybridCategoryIds == [] &&
  asconIdentityBoundaryB &&
  identitySeparationB &&
  uniqueConstraints allHardeningConstraints &&
  hardeningConflictIrreflexiveB &&
  hardeningConflictSymmetricB &&
  adaptivePreferenceWellFormedB &&
  minimumContradictionScore == 0 &&
  leastContradictoryCore.length == 6 &&
  compatibleHardeningB hardenedAdaptiveProfile &&
  hardeningStrength hardenedAdaptiveProfile == maximumCompatibleStrength &&
  adaptabilityScore hardenedAdaptiveProfile == maximumAdaptabilityAtStrengthFrontier &&
  bestAdaptiveFrontierStates.length == 1 &&
  noStrictCompatibleExtensionB hardenedAdaptiveProfile &&
  everySingleAdditionContradictsB hardenedAdaptiveProfile &&
  everyStrengthFrontierContainsCoreB &&
  hardeningCoreImplementedB &&
  adaptableChoicesRealizedB

theorem hardened_registry_certificate : hardenedRegistryCertificateB = true := by
  decide

#print axioms hardened_registry_certificate

-- Broad source catalog is retained append-only; canonicalCatalog removes exact repeated kind/name identities.
def CatalogItem.sameIdentityB (a b : CatalogItem) : Bool :=
  a.kind == b.kind && a.name == b.name

def identityOccursInCatalog (x : CatalogItem) : List CatalogItem → Bool
  | [] => false
  | y :: ys => x.sameIdentityB y || identityOccursInCatalog x ys

def dedupCatalog : List CatalogItem → List CatalogItem
  | [] => []
  | x :: xs =>
      if identityOccursInCatalog x xs then dedupCatalog xs else x :: dedupCatalog xs

def canonicalCatalog : List CatalogItem := dedupCatalog catalog

def catalogCount : Nat := catalog.length
def canonicalCatalogCount : Nat := canonicalCatalog.length
def semanticRegistryCount : Nat := semanticRegistry.length

-- Machine-readable audit values.
#eval catalogCount
#eval canonicalCatalogCount
#eval semanticRegistryCount
#eval semanticRegistryLocalIntegrityB
#eval semanticRegistryGlobalIntegrityB
#eval semanticRegistryIdsUniqueB
#eval semanticRegistryCanonicalNamesUniqueB
#eval semanticRegistryIdentityNamesUniqueB
#eval brokenGenerationViolations
#eval brokenVerificationViolations
#eval legacyGenerationViolations
#eval unresolvedHybridComponentIds
#eval mistypedHybridComponentIds
#eval overstatedHybridCategoryIds
#eval hardeningStateSpace.length
#eval leastContradictoryCore
#eval minimumContradictionScore
#eval maximumCompatibleStrength
#eval maximumAdaptabilityAtStrengthFrontier
#eval noStrictCompatibleExtensionB hardenedAdaptiveProfile

end ProofBundle.CryptoRegistry
