# Implementations found on the build host

Source files that carry the defining constants of a cryptographic primitive: the round constants of SHA-2 and Keccak, the
initialisation vectors of BLAKE2 and BLAKE3, the AES S-box, the ChaCha20 constant, the field and curve constants of
Curve25519, Curve448, P-256, P-384, P-521 and secp256k1, the moduli of ML-KEM and ML-DSA, and so on. A file is placed by what
its text contains, not by its name. One copy is kept per distinct content; the file name ends with the first eight hex digits
of its SHA-256. The modules the client and the tests use are in `crypto/` at the repository root, not here.

| primitive | coq | javascript | lean | total |
|---|---:|---:|---:|---:|
| sha-256 | 1 | 10 | 7 | 18 |
| chacha20 |  | 9 | 4 | 13 |
| ed25519 |  | 3 | 10 | 13 |
| ecdsa-p256 |  | 3 | 9 | 12 |
| keccak-sha3 |  | 3 | 3 | 6 |
| rsa |  | 3 | 2 | 5 |
| ml-kem |  | 4 | 1 | 5 |
| aes |  | 5 |  | 5 |
| slh-dsa |  | 1 | 3 | 4 |
| falcon |  | 2 | 2 | 4 |
| sha-512 |  | 2 | 2 | 4 |
| x25519 |  | 1 | 2 | 3 |
| poly1305 |  | 1 | 2 | 3 |
| x448 |  | 3 |  | 3 |
| ed448 |  | 3 |  | 3 |
| ecdsa-p521 |  | 2 |  | 2 |
| ml-dsa |  |  | 2 | 2 |
| blake3 |  | 1 |  | 1 |
| secp256k1 |  | 1 |  | 1 |
| blake2 |  | 1 |  | 1 |
| ecdsa-p384 |  | 1 |  | 1 |
| total | 1 | 59 | 49 | 109 |

`INDEX.tsv` has one row per file: SHA-256, bytes, lines, language, the primitive it is filed under, every primitive detected in it,
the number of copies found, the earliest file date among the copies, whether it calls the platform crypto (`node:crypto`, WebCrypto,
`hashlib`), whether it imports a crypto library, and the known-answer run.

## What was run

The JavaScript modules filed under SHA-256, SHA-512, Keccak/SHA-3, BLAKE2 and BLAKE3 were each loaded in a separate process that
could not write files, start processes or reach a network. An exported function named for the primitive was checked against the
published digests of `abc` and of the empty message and, except for BLAKE3, against OpenSSL on 24 message lengths between 1 and 300
bytes. 92: not run; 13: pass; 4: no export matched the name of the primitive.
Nothing else in this directory was executed or compiled in this pass, so a file here is a file that was found, not a file that was verified.

## What the pass covered

It read 89,894 source files: the 2026-11-01 census list of cryptographic sources after its package-manager filter, and six
directories of collected work. Left out by rule: files already in this repository, files with a copyright or licence notice of
another party, files that name host paths, and files that carry an earlier project label. Not covered: members of zip and tar
archives, Google Drive, 1,495 listed paths on volumes that were not mounted, and the formal source files of the census outside the
six directories.
