// scrypt (RFC 7914) via node:crypto. Node enforces a memory ceiling derived
// from N*r*128; we surface an explicit maxmem so a large-but-legitimate
// parameter set fails with a clear RESOURCE_EXHAUSTED-shaped error rather
// than node's opaque "memory limit exceeded".

import { scryptSync } from 'node:crypto';
import { ResourceExhaustedError } from '../errors.mjs';

export const SCRYPT_ID = 'scrypt';

export function scrypt({ password, salt, N = 16384, r = 8, p = 1, length = 32, maxmem = 64 * 1024 * 1024 }) {
  if (!(password instanceof Uint8Array)) throw new TypeError('scrypt: password must be Uint8Array');
  if (!(salt instanceof Uint8Array)) throw new TypeError('scrypt: salt must be Uint8Array');
  if (!Number.isInteger(N) || N < 2 || (N & (N - 1)) !== 0) throw new RangeError('scrypt: N must be a power of two greater than 1');
  if (!Number.isInteger(r) || r < 1) throw new RangeError('scrypt: r must be a positive integer');
  if (!Number.isInteger(p) || p < 1) throw new RangeError('scrypt: p must be a positive integer');
  const needed = 128 * N * r;
  if (needed > maxmem) {
    throw new ResourceExhaustedError(`scrypt: parameters need ${needed} bytes, above maxmem ${maxmem}`, { predicate: 'kdf.scrypt.maxmem' });
  }
  return new Uint8Array(scryptSync(password, salt, length, { N, r, p, maxmem }));
}
