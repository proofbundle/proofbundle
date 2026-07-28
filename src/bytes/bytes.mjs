// Immutable byte-sequence helpers. Everything in this module treats
// Uint8Array as read-only: no function mutates an input array.

export function concatBytes(...arrays) {
  let total = 0;
  for (const a of arrays) {
    if (!(a instanceof Uint8Array)) throw new TypeError('concatBytes: all arguments must be Uint8Array');
    total += a.length;
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

export function equalBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function sliceBytes(a, start, end) {
  if (!(a instanceof Uint8Array)) throw new TypeError('sliceBytes: input must be Uint8Array');
  return a.slice(start, end);
}

export function freezeBytes(a) {
  if (!(a instanceof Uint8Array)) throw new TypeError('freezeBytes: input must be Uint8Array');
  return Object.freeze(a);
}

export function isBytes(v) {
  return v instanceof Uint8Array;
}

export function assertLength(a, n, label = 'bytes') {
  if (!(a instanceof Uint8Array)) throw new TypeError(`${label}: expected Uint8Array`);
  if (a.length !== n) throw new RangeError(`${label}: expected length ${n}, got ${a.length}`);
  return a;
}

export function assertMaxLength(a, n, label = 'bytes') {
  if (!(a instanceof Uint8Array)) throw new TypeError(`${label}: expected Uint8Array`);
  if (a.length > n) throw new RangeError(`${label}: length ${a.length} exceeds maximum ${n}`);
  return a;
}
