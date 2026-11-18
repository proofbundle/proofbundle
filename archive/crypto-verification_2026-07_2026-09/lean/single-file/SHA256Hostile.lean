/-
# SHA-256 — Hostile / adversarial test vectors

Compile with `lake env lean SHA256Hostile.lean` (with `SHA256.lean` in the
same source root and the import below).  This file contains the twenty-four
adversarial test vectors of the project ground-truth file
`ground_truth.json` (field `hostile[]`), each stated as a theorem closed by
`native_decide` and documented with the adversarial property it exercises.
There are no `sorry`s, no `admit`s and no axioms here.

The vectors are grouped as follows:

  * Padding boundary lengths (55, 56, 63, 64, 65 bytes and the two-block
    analogues 119, 120, 127, 128, 129): these straddle the boundary where
    the `0x80` delimiter and the 64-bit length field spill into a new
    block, which is where padding implementations historically fail.  The
    55/119-byte cases are the longest messages fitting one/two padded
    blocks; the 56/120-byte cases are the shortest that do not.
  * Extreme Hamming weights and minimal inputs (all-zero block, all-ones
    block, single zero byte, single 0xFF byte): these test constant
    injection and carry propagation through the message schedule.
  * Padding-delimiter confusion and injectivity probes (a 0x80 byte inside
    the message, a 0xFF byte inside the message, ten zero bytes versus the
    empty message, 0x80 repeated at the 56-byte boundary): these attack
    implementations that conflate message content with padding structure,
    and they complement the proved theorem `pad_injective` in
    `SHA256Theorems.lean`.
  * Alphabet coverage (all 256 byte values ascending and descending,
    alternating 0xAA/0x55 maximal bit-flip density).
  * Length-counter and long-message stress (1,000,000 copies of 'a',
    1000 irregular bytes, 4096 bytes = exactly 64 blocks): these exercise
    the 64-bit bit-length field and multi-block iteration.

Every expected digest below is quoted verbatim from the verified ground
truth (`hostile[].expected`); the adversarial-property descriptions are
quoted from `hostile[].adversarial_property`.  Long or patterned messages
are constructed with `Array.mkArray`, `List.range` and the `patMsg` helper
below, never with multi-kilobyte literals, so the file stays auditable.
-/

import Std
import SHA256

namespace ProofBundle.Crypto.SHA256

/-- Patterned message constructor used by two of the hostile vectors:
`patMsg n step` is the `n`-byte message whose byte `i` is
`(step * i) mod 256`.  This matches the ground-truth generator for the
`len_1000` (step 13) and `len_4096_power_of_two` (step 7) vectors. -/
def patMsg (n step : Nat) : ByteArray :=
  ByteArray.mk (Array.mk ((List.range n).map (fun i => ((step * i) % 256).toUInt8)))

/-- Hostile case `len_55_max_single_block`: 55 bytes: longest message fitting one padded block.

Message length 440 bits.  Padding analysis: 55 message bytes -> 1 delimiter byte (0x80), 0 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_55_max_single_block`). -/
theorem hostile_len_55_max_single_block : sha256 (ByteArray.mk (Array.mkArray 55 0x00)) =
    hexDecode "02779466cdec163811d078815c633f21901413081449002f24aa3e80f0b88ef7" := by
  native_decide

/-- Hostile case `len_56_forces_two_blocks`: 56 bytes: minimal length forcing second block (length field overflow into new block).

Message length 448 bits.  Padding analysis: 56 message bytes -> 1 delimiter byte (0x80), 63 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_56_forces_two_blocks`). -/
theorem hostile_len_56_forces_two_blocks : sha256 (ByteArray.mk (Array.mkArray 56 0xaa)) =
    hexDecode "d464bb04abbc80a2254cd4ad0f3356f1b70b5b6390085b193edcd291f065b01e" := by
  native_decide

/-- Hostile case `len_63_block_minus_one`: 63 bytes: one byte under block size.

Message length 504 bits.  Padding analysis: 63 message bytes -> 1 delimiter byte (0x80), 56 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_63_block_minus_one`). -/
theorem hostile_len_63_block_minus_one : sha256 (ByteArray.mk (Array.mkArray 63 0xff)) =
    hexDecode "d12449c8124182545ae91924286cc6af13528bcf62a5ddbd5e00b891fffc1b48" := by
  native_decide

/-- Hostile case `len_64_exact_block`: 64 bytes: exact block; padding occupies entire second block.

Message length 512 bits.  Padding analysis: 64 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_64_exact_block`). -/
theorem hostile_len_64_exact_block : sha256 (ByteArray.mk (Array.mkArray 64 0x00)) =
    hexDecode "f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b" := by
  native_decide

/-- Hostile case `len_65_block_plus_one`: 65 bytes: first multi-block data.

Message length 520 bits.  Padding analysis: 65 message bytes -> 1 delimiter byte (0x80), 54 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_65_block_plus_one`). -/
theorem hostile_len_65_block_plus_one : sha256 (ByteArray.mk (Array.mkArray 65 0x01)) =
    hexDecode "dc7156746a46cbe6edfaceb4ccfb9b27fc7250d2608a991848cfec6f62f39932" := by
  native_decide

/-- Hostile case `len_119_double_boundary_low`: 119 bytes: 2-block boundary analogue of 55.

Message length 952 bits.  Padding analysis: 119 message bytes -> 1 delimiter byte (0x80), 0 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_119_double_boundary_low`). -/
theorem hostile_len_119_double_boundary_low : sha256 (ByteArray.mk (Array.mkArray 119 0x55)) =
    hexDecode "2b65d765e9a878e2ff822128260e1a496b06d112dfb1e28b04a7597ea74d70fb" := by
  native_decide

/-- Hostile case `len_120_double_boundary_high`: 120 bytes: 2-block boundary analogue of 56.

Message length 960 bits.  Padding analysis: 120 message bytes -> 1 delimiter byte (0x80), 63 zero bytes, 8 length-field bytes = 3 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_120_double_boundary_high`). -/
theorem hostile_len_120_double_boundary_high : sha256 (ByteArray.mk (Array.mkArray 120 0x55)) =
    hexDecode "09a02baece236f519f993edbc70815d9987454d75b244e985ff156ca2865d63b" := by
  native_decide

/-- Hostile case `all_zero_64`: all-zero full block: tests constant injection, no input entropy.

Message length 512 bits.  Padding analysis: 64 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `all_zero_64`). -/
theorem hostile_all_zero_64 : sha256 (ByteArray.mk (Array.mkArray 64 0x00)) =
    hexDecode "f5a5fd42d16a20302798ef6ed309979b43003d2320d9f0e8ea9831a92759fb4b" := by
  native_decide

/-- Hostile case `all_ff_64`: all-ones full block: maximal Hamming weight input.

Message length 512 bits.  Padding analysis: 64 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `all_ff_64`). -/
theorem hostile_all_ff_64 : sha256 (ByteArray.mk (Array.mkArray 64 0xff)) =
    hexDecode "8667e718294e9e0df1d30600ba3eeb201f764aad2dad72748643e4a285e1d1f7" := by
  native_decide

/-- Hostile case `all_ff_1`: single byte 0xFF: high-bit set, exercises 0x80 padding delimiter adjacency.

Message length 8 bits.  Padding analysis: 1 message bytes -> 1 delimiter byte (0x80), 54 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `all_ff_1`). -/
theorem hostile_all_ff_1 : sha256 (ByteArray.mk (Array.mkArray 1 0xff)) =
    hexDecode "a8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89" := by
  native_decide

/-- Hostile case `single_zero`: single zero byte: minimal nonempty input.

Message length 8 bits.  Padding analysis: 1 message bytes -> 1 delimiter byte (0x80), 54 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `single_zero`). -/
theorem hostile_single_zero : sha256 (ByteArray.mk (Array.mkArray 1 0x00)) =
    hexDecode "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d" := by
  native_decide

/-- Hostile case `bitlength_0_vs_80_collision_probe`: distinguishes 0-bit from 80-bit preimage (padding injectivity).

Message length 80 bits.  Padding analysis: 10 message bytes -> 1 delimiter byte (0x80), 45 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `bitlength_0_vs_80_collision_probe`). -/
theorem hostile_bitlength_0_vs_80_collision_probe : sha256 (ByteArray.mk (Array.mkArray 10 0x00)) =
    hexDecode "01d448afd928065458cf670b60f5a594d735af0172c8d67f22a81680132681ca" := by
  native_decide

/-- Hostile case `abc_highbit_variant`: 0x80 terminator byte inside message: padding-delimiter confusion attack.

Message length 32 bits.  Padding analysis: 4 message bytes -> 1 delimiter byte (0x80), 51 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `abc_highbit_variant`). -/
theorem hostile_abc_highbit_variant : sha256 (hexDecode "61626380") =
    hexDecode "f9863f51bd38625dacc35a74b984a82e88b3b070fe1be491878cbe77704bc0af" := by
  native_decide

/-- Hostile case `abc_ff_variant`: 0xFF inside message adjacent to padding.

Message length 32 bits.  Padding analysis: 4 message bytes -> 1 delimiter byte (0x80), 51 zero bytes, 8 length-field bytes = 1 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `abc_ff_variant`). -/
theorem hostile_abc_ff_variant : sha256 (hexDecode "616263ff") =
    hexDecode "8e3b08dc1236880bf0c55873db58b12d8bf0398b1b17c9686e015ccfe098d35d" := by
  native_decide

/-- Hostile case `len_128_exact_two_blocks`: exactly two data blocks: padding in third block.

Message length 1024 bits.  Padding analysis: 128 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 3 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_128_exact_two_blocks`). -/
theorem hostile_len_128_exact_two_blocks : sha256 (ByteArray.mk (Array.mkArray 128 0x42)) =
    hexDecode "7abaa701a6f4bb8d9ea3872a315597eb6f2ccfd03392d8d10560837f6136d06a" := by
  native_decide

/-- Hostile case `len_127`: one byte under two blocks.

Message length 1016 bits.  Padding analysis: 127 message bytes -> 1 delimiter byte (0x80), 56 zero bytes, 8 length-field bytes = 3 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_127`). -/
theorem hostile_len_127 : sha256 (ByteArray.mk (Array.mkArray 127 0x42)) =
    hexDecode "0875818355c7fb9bc0f246dad7fa1010a13b8a97162af00a3870bacec1400332" := by
  native_decide

/-- Hostile case `len_129`: one byte over two blocks.

Message length 1032 bits.  Padding analysis: 129 message bytes -> 1 delimiter byte (0x80), 54 zero bytes, 8 length-field bytes = 3 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_129`). -/
theorem hostile_len_129 : sha256 (ByteArray.mk (Array.mkArray 129 0x42)) =
    hexDecode "95b9362aa85cb5a5ea893c0d7681165e45e9e5c29d73e05efd6f45455bc2a056" := by
  native_decide

/-- Hostile case `million_a`: 1,000,000 × 0x61: CAVP long-message stress (64-bit length counter integrity).

Message length 8000000 bits.  Padding analysis: 1000000 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 15626 padded block(s) of 64 bytes.  Message constructed by a pattern/mkArray generator, not a literal.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `million_a`). -/
theorem hostile_million_a : sha256 (ByteArray.mk (Array.mkArray 1000000 0x61)) =
    hexDecode "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0" := by
  native_decide

/-- Hostile case `sequential_0_255`: all byte values ascending: S-box-like coverage of input alphabet.

Message length 2048 bits.  Padding analysis: 256 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 5 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `sequential_0_255`). -/
theorem hostile_sequential_0_255 : sha256 (ByteArray.mk (Array.mk ((List.range 256).map (fun i => i.toUInt8)))) =
    hexDecode "40aff2e9d2d8922e47afd4648e6967497158785fbd1da870e7110266bf944880" := by
  native_decide

/-- Hostile case `sequential_255_0`: all byte values descending.

Message length 2048 bits.  Padding analysis: 256 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 5 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `sequential_255_0`). -/
theorem hostile_sequential_255_0 : sha256 (ByteArray.mk (Array.mk ((List.range 256).map (fun i => (255 - i).toUInt8)))) =
    hexDecode "cd6816b77f68d70001fc3eaa4d42bdd67cb5973b3151cc5292ecc02a3daac6ab" := by
  native_decide

/-- Hostile case `alternating_aa_55_100`: alternating 10101010/01010101 pattern: maximal bit-flip density.

Message length 800 bits.  Padding analysis: 100 message bytes -> 1 delimiter byte (0x80), 19 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `alternating_aa_55_100`). -/
theorem hostile_alternating_aa_55_100 : sha256 (ByteArray.mk (Array.mk ((List.range 100).map (fun i => if i % 2 = 0 then 0xaa else 0x55)))) =
    hexDecode "7b79b7f0a94603f6d0d17af5ca22f60d03e7743ca486a6490086eaf5fb816e89" := by
  native_decide

/-- Hostile case `len_1000`: 1000 bytes irregular: 16 blocks + partial.

Message length 8000 bits.  Padding analysis: 1000 message bytes -> 1 delimiter byte (0x80), 15 zero bytes, 8 length-field bytes = 16 padded block(s) of 64 bytes.  Message constructed by a pattern/mkArray generator, not a literal.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_1000`). -/
theorem hostile_len_1000 : sha256 (patMsg 1000 13) =
    hexDecode "d65421767957649d707b553fb0062bfa78475eaacc89f973272a4841de37ae79" := by
  native_decide

/-- Hostile case `len_4096_power_of_two`: 4096 bytes: 64 exact blocks, no partial tail.

Message length 32768 bits.  Padding analysis: 4096 message bytes -> 1 delimiter byte (0x80), 55 zero bytes, 8 length-field bytes = 65 padded block(s) of 64 bytes.  Message constructed by a pattern/mkArray generator, not a literal.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `len_4096_power_of_two`). -/
theorem hostile_len_4096_power_of_two : sha256 (patMsg 4096 7) =
    hexDecode "d010f6d76d0eb4dce5d5b5b34014a8a157ec4380a66c24d7d455a9bf652db14a" := by
  native_decide

/-- Hostile case `bit_level_msb_set_all`: 0x80 repeated at the 56-byte boundary: delimiter ambiguity stress.

Message length 448 bits.  Padding analysis: 56 message bytes -> 1 delimiter byte (0x80), 63 zero bytes, 8 length-field bytes = 2 padded block(s) of 64 bytes.
Expected digest quoted verbatim from the verified ground truth
(`hostile[].expected` for `bit_level_msb_set_all`). -/
theorem hostile_bit_level_msb_set_all : sha256 (ByteArray.mk (Array.mkArray 56 0x80)) =
    hexDecode "ab44ecde4bac7f799c8588f617770b1a5877bead1a4bee5d3d848cd41b8855a0" := by
  native_decide

end ProofBundle.Crypto.SHA256
