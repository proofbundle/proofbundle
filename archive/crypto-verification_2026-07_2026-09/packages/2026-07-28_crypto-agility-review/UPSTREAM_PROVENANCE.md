# Upstream attachment provenance

Two uploaded ZIPs were inspected read-only. Both passed ZIP integrity testing.
The later state was selected as upstream evidence; neither outer ZIP was nested
inside this review packet.

| Uploaded name | SHA-256 |
|---|---|
| `files (8).zip` | `3b10befefe82cff0c6d8ab979b437f651254fb101ea468dc878a492802beab9f` |
| `files (9)(1).zip` | `a8bb181d35c3fa3cae6773f5583f468015f8f2fbc222164e77c276c86829e534` |

Each ZIP contained a file named `mc108_canonical_20260728.tar.gz`, but the bytes
were different:

| Source | Tar SHA-256 | Inventory |
|---|---|---:|
| `files (8).zip` | `4b82ac4ee1b85626b280e2689debaed383fcf2345e58de473ba5610c9806cebb` | 195 files |
| `files (9)(1).zip` | `98d6d50ce33457e678c73533df51cdcac6ca5b105bb94ea79afbf17809ce0487` | 202 files |

The second ZIP records a later repair state: three operator-algebra proof files
were promoted from an uncompiled area to the proved area, and repair logs and
proof logs were added. The packet preserves that later tar byte-for-byte at
`upstream/mc108_canonical_20260728.tar.gz`. It does not silently merge the two
archives.

Selected context copied byte-for-byte from the later ZIP appears under
`upstream/context/`:

- `2026-07-26_PROOFBUNDLE_COMPLETE_DEVELOPMENT_LOG.md`
- `2026-07-26_PROOFBUNDLE_IMPLEMENTATION_MATRIX.csv`
- `FINDINGS.md`
- `RECONCILED.md`
- `REPAIR_LOG.md`

The later ZIP's dependency-free cryptographic reference files were copied
byte-for-byte under `reference/from-scratch/`. Their source SHA-256 values are:

| File | SHA-256 |
|---|---|
| `keccak.mjs` | `0ad043bf020563268609aca3e4f686890cfcee6ec0c1a441994f10bcf8faa307` |
| `mlkem.mjs` | `61b6fc67ad806023d0bb61e7f9db5e88460c711cdce9b0857456b1c545bc5e90` |
| `ref_vectors.json` | `e4a87d50a287c8d8862e663eab75fbbd84d94b3d58024127dc5f90ab77ca2858` |
| `t_keccak.mjs` | `bbd16b43d6489935d07228869b35c454f7cf4a727d6c28775a914f98bcf801aa` |
| `t_mlkem.mjs` | `041bf1edcb108e020b34758a489b1fa15c838bef9d2dc47fe0446086829d3d0e` |
| `t_ref.mjs` | `f56d5958179ef2db1162263829a97e501ec9e22685aac5e8e9ad26bb234b6d09` |

`t_node_interop.mjs` and the new operational modules were authored for this
review packet and are distinguished by the packet manifest.

The imported pure-JS ML-KEM code is retained as independent test/reference
evidence. It is not the operational secret-key backend selected by
`src/kem.mjs`, because JavaScript does not provide a defensible constant-time
execution guarantee.
