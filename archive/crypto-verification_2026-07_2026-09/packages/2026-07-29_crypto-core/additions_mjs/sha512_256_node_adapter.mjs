import { createHash } from 'node:crypto';
export function sha512_256(bytes) {
  return new Uint8Array(createHash('sha512-256').update(bytes).digest());
}
export function sha512_256Hex(bytes) {
  return Buffer.from(sha512_256(bytes)).toString('hex');
}
