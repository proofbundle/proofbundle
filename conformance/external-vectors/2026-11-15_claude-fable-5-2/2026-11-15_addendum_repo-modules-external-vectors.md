# 2026-11-15 Addendum: the modules written on 2026-11-15 in crypto/, run against Wycheproof

Script `2026-11-15_repo-modules_external-vectors.mjs` (sha256 1836fedc…2e5e), node 24.19.0, OpenSSL 3.5.7, Wycheproof commit 65ca494727a52944c204441c860b039e6786b99b. 24 vector files, 7,021 cases. The modules were written by other lanes (DeepSeek V4 Flash through Cline; reviewed in turn by Qwen 3.7 Plus); this run is a third party's check of them against expectations none of the three wrote.

`ecdsa.mjs` (7681f304…) accepts 82 invalid DER encodings across P-256 and P-384, the same defect as in the client's embedded module. `ecdsa.der-strict-20261115.mjs` (6f4d6b8e…) agrees with all 988 cases. `ed448.mjs` 87 of 87, `x448.mjs` 510 of 510, `chacha20-poly1305.mjs` 316 of 316 (ChaCha20-Poly1305) and 306 of 306 (XChaCha20-Poly1305), `aes-gcm-siv.mjs` 202 of 202, `aes-keywrap.mjs` 165 of 165 (RFC 3394) and 254 of 254 (RFC 5649), `rsa-pkcs1-v15-verify.mjs` 3,106 of 3,106 across 2048, 3072, 4096 and 8192-bit keys with SHA-256, SHA-384 and SHA-512, `scrypt.mjs` 99 of 99 against OpenSSL on a parameter grid that includes the three smaller RFC 7914 parameter sets.

OpenSSL ran as a second implementation on 6,507 of the cases and agrees with the vectors on all but 3 in `aes_wrap_test.json`; those three are listed in the result file and are an OpenSSL or adapter matter, since the module agrees with the vectors there. OpenSSL in this build offers no XChaCha20-Poly1305 and node exposes no AES-GCM-SIV, so those 508 cases have the Wycheproof expectation only.

One interface note on `rsa-pkcs1-v15-verify.mjs`: the modulus length k is taken from `nBytes.length`, so a modulus passed with the leading zero octet of its DER INTEGER makes every signature fail the length check. That fails closed. Deriving k from the bit length of n would remove the trap; the adapter here strips leading zero octets before calling.

Not covered: `slh-dsa.mjs` and `hybrids.mjs` (no Wycheproof file), `aes.mjs` on its own (exercised only through key wrap and GCM-SIV), timing behaviour of any module.
