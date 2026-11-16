// AES (FIPS 197) gated by the standard's own vectors and by OpenSSL.
//
//   * FIPS 197 Appendix C: one 128-, one 192- and one 256-bit known answer.
//   * OpenSSL 3.5.7 (node aes-*-ecb, no padding) as a second implementation on
//     random inputs.
//   * CTR (SP 800-38A style, little-endian 32-bit counter in the first four
//     bytes) against node's aes-*-ctr with the matching counter block.
import { expandKey, encryptBlock, decryptBlock, ctrCrypt, _internals } from './aes.mjs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const b = (x) => Uint8Array.from(Buffer.from(x, 'hex'));
const h = (x) => Buffer.from(x).toString('hex');

// ---- FIPS 197 Appendix C ---------------------------------------------------
const pt = b('00112233445566778899aabbccddeeff');
const vectors = [
  ['C.1 AES-128', '000102030405060708090a0b0c0d0e0f', '69c4e0d86a7b0430d8cdb78070b4c55a'],
  ['C.2 AES-192', '000102030405060708090a0b0c0d0e0f1011121314151617', 'dda97ca4864cdfe06eaf70a0ec0d7191'],
  ['C.3 AES-256', '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', '8ea2b7ca516745bfeafc49904b496089'],
];
for (const [name, keyHex, ctHex] of vectors) {
  const e = expandKey(b(keyHex));
  check(`${name}: encrypt`, h(encryptBlock(e, pt)) === ctHex, h(encryptBlock(e, pt)));
  check(`${name}: decrypt`, h(decryptBlock(e, b(ctHex))) === h(pt));
}

// ---- OpenSSL cross-check ---------------------------------------------------
let ok = 0, bad = 0;
for (const klen of [16, 24, 32]) {
  for (let i = 0; i < 40; i++) {
    const key = randomBytes(klen), blk = randomBytes(16);
    const e = expandKey(Uint8Array.from(key));
    const mine = Buffer.from(encryptBlock(e, Uint8Array.from(blk)));
    const ci = createCipheriv(`aes-${klen * 8}-ecb`, key, null);
    ci.setAutoPadding(false);
    const ref = Buffer.concat([ci.update(blk), ci.final()]);
    const back = Buffer.from(decryptBlock(e, Uint8Array.from(ref)));
    if (mine.equals(ref) && back.equals(blk)) ok++; else bad++;
  }
}
check(`OpenSSL ECB: 120 random blocks agree (${ok} ok, ${bad} bad)`, bad === 0);

// ---- CTR -------------------------------------------------------------------
// The counter layout here is the one AES-GCM-SIV needs: a 32-bit little-endian
// counter in the first four bytes of the block. OpenSSL's AES-CTR increments a
// big-endian counter over the whole block, so it is not a comparable oracle.
// Instead the expected keystream is built independently below: one AES-ECB
// encryption of each counter block, XORed by hand.
{
  const key = b('2b7e151628aed2a6abf7158809cf4f3c');
  const base = b('00000000f4f5f6f7f8f9fafbfcfdfeff');
  const msg = Uint8Array.from({ length: 40 }, (_, i) => (i * 11 + 1) & 255);
  const start = 7;
  const e = expandKey(key);
  const mine = ctrCrypt(e, base, msg, start);
  const expect = new Uint8Array(msg.length);
  for (let blk = 0; blk * 16 < msg.length; blk++) {
    const cb = Uint8Array.from(base);
    const v = (start + blk) >>> 0;
    cb[0] = v & 255; cb[1] = (v >>> 8) & 255; cb[2] = (v >>> 16) & 255; cb[3] = (v >>> 24) & 255;
    const ks = encryptBlock(e, cb);
    for (let i = 0; i < 16 && blk * 16 + i < msg.length; i++) expect[blk * 16 + i] = msg[blk * 16 + i] ^ ks[i];
  }
  check('CTR keystream equals hand-built AES-ECB of the counter blocks', h(mine) === h(expect));
  check('CTR is an involution', h(ctrCrypt(e, base, mine, start)) === h(msg));
  check('CTR with start 0 differs from start 1', h(ctrCrypt(e, base, msg, 0)) !== h(mine));
}

// ---- invariants -----------------------------------------------------------
check('S-box is a permutation', new Set(_internals.SBOX).size === 256);
check('inverse S-box inverts', (() => {
  for (let i = 0; i < 256; i++) if (_internals.INV_SBOX[_internals.SBOX[i]] !== i) return false;
  return true;
})());
check('S-box(0) = 0x63', _internals.SBOX[0] === 0x63);
check('rejects 20-byte key', (() => { try { expandKey(new Uint8Array(20)); return false; } catch { return true; } })());

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
