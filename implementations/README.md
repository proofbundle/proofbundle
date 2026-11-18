# Implementations found on the build host

Source files that carry the defining constants of a cryptographic primitive: the round constants of SHA-2 and Keccak, the
initialisation vectors of BLAKE2 and BLAKE3, the AES S-box, the ChaCha20 constant, the field and curve constants of
Curve25519, Curve448, P-256, P-384, P-521 and secp256k1, the moduli of ML-KEM and ML-DSA, and so on. A file is placed by what
its text contains, not by its name. One copy is kept per distinct content; the file name ends with the first eight hex digits
of its SHA-256. The modules the client and the tests use are in `crypto/` at the repository root, not here.

| primitive | coq | javascript | lean | rust | typescript | total |
|---|---:|---:|---:|---:|---:|---:|
| sha-256 | 2 | 10 | 17 |  |  | 29 |
| chacha20 |  | 9 | 13 |  |  | 22 |
| ecdsa-p256 |  | 3 | 15 |  |  | 18 |
| ed25519 |  | 3 | 12 |  |  | 15 |
| poly1305 |  | 1 | 7 |  |  | 8 |
| ml-kem |  | 4 | 2 |  |  | 6 |
| sha-512 |  | 2 | 4 |  |  | 6 |
| keccak-sha3 |  | 3 | 3 |  |  | 6 |
| rsa |  | 3 | 2 |  |  | 5 |
| aes |  | 5 |  |  |  | 5 |
| blake3 |  | 3 |  |  | 2 | 5 |
| falcon |  | 2 | 2 |  |  | 4 |
| slh-dsa |  | 1 | 3 |  |  | 4 |
| blake2 |  | 3 |  |  |  | 3 |
| x448 |  | 3 |  |  |  | 3 |
| x25519 |  | 1 | 2 |  |  | 3 |
| ed448 |  | 3 |  |  |  | 3 |
| ecdsa-p521 |  | 2 |  |  |  | 2 |
| ml-dsa |  |  | 2 |  |  | 2 |
| ecdsa-p384 |  | 1 |  | 1 |  | 2 |
| secp256k1 |  | 1 |  |  |  | 1 |
| total | 2 | 63 | 84 | 1 | 2 | 152 |

`INDEX.tsv` has one row per file: SHA-256, bytes, lines, language, the primitive it is filed under, every primitive detected in it,
the number of copies found, the earliest file date among the copies, whether it calls the platform crypto (`node:crypto`, WebCrypto,
`hashlib`), whether it imports a crypto library, and the known-answer run.

## What was run

The JavaScript modules filed under SHA-256, SHA-512, Keccak/SHA-3, BLAKE2 and BLAKE3 were each loaded in a separate process that
could not write files, start processes or reach a network. An exported function named for the primitive was checked against the
published digests of `abc` and of the empty message and, except for BLAKE3, against OpenSSL on 24 message lengths between 1 and 300
bytes. 131: not run; 15: pass; 4: no export matched the name of the primitive; 2: mismatch.
Nothing else in this directory was executed or compiled, so a file here is a file that was found, not a file that was verified.

## What the two passes covered

First pass: 89,894 source files, taken from the 2026-11-01 census list of cryptographic sources after its package-manager filter and
from six directories of collected work. Second pass: the census lists of cryptographic and formal sources (423,777 loose files read,
22,856 outside the 200 B to 1.5 MB size range, 129,829 not readable) and 77,118 source-like members of 1,718 zip archives.
Left out by rule: files already in this repository, third-party libraries, vendored packages and system headers, files with a
copyright or licence notice of another party, bundles and generated files, scratch timing probes, files that name host paths, and
files that carry an earlier project label. Not covered: tar archives and Google Drive.
