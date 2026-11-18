# ML-KEM-768 ground truth, corrected to FIPS 203

ground-truth_fips203-corrected_2026-10-30.json holds six known-answer vectors (d, z, m, ek, dk, ct, ss) and sixteen
hostile cases with the expected result of each. Its own `correction` field states what was wrong in the file it
replaces and how the values were re-derived from the preserved seeds. The file it replaces is kept at
archive/crypto-verification_2026-07_2026-09/ground-truth/mlkem768_ground_truth.json (SHA-256 c315d206385c63cd…; the correction field names
source_file_sha256 c315d206385c63cd…).

The NIST ACVP vectors for ML-KEM are in vectors/nist-acvp/.
