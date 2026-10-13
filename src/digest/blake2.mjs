import {blake2b,blake2s} from '../../crypto/blake2.mjs';
export const blake2b512 = bytes => blake2b(bytes,64);
export const blake2s256 = bytes => blake2s(bytes,32);
