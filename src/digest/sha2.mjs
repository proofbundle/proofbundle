// SHA-2 family via Node's native crypto module (NODE_NATIVE implementation
// class — OpenSSL's implementation, not reimplemented here).

import { createHash } from 'node:crypto';

function digest(algorithm, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError(`${algorithm}: expected Uint8Array input`);
  return new Uint8Array(createHash(algorithm).update(bytes).digest());
}

export const sha224 = (bytes) => digest('sha224', bytes);
export const sha256 = (bytes) => digest('sha256', bytes);
export const sha384 = (bytes) => digest('sha384', bytes);
export const sha512 = (bytes) => digest('sha512', bytes);
export const sha512_224 = (bytes) => digest('sha512-224', bytes);
export const sha512_256 = (bytes) => digest('sha512-256', bytes);
