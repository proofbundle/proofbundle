// BLAKE2b-512 / BLAKE2s-256 via Node's native crypto module (NODE_NATIVE
// implementation class — OpenSSL's implementation, not reimplemented here).

import { createHash } from 'node:crypto';

function digest(algorithm, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError(`${algorithm}: expected Uint8Array input`);
  return new Uint8Array(createHash(algorithm).update(bytes).digest());
}

export const blake2b512 = (bytes) => digest('blake2b512', bytes);
export const blake2s256 = (bytes) => digest('blake2s256', bytes);
