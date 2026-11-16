// AES Key Wrap (RFC 3394) and Key Wrap with Padding (RFC 5649), gated by the
// RFC's own known answer plus OpenSSL 3.5.7 through node:crypto.
//
// The RFC 5649 n=1 special case matters: a single 8-byte semi-block is one AES
// block encryption of AIV||P[1], not the six-round loop. That path is exercised
// below by every 1..8 byte KWP input.
import { keyWrap, keyUnwrap, keyWrapPad, keyUnwrapPad } from './aes-keywrap.mjs';
import { createCipheriv, randomBytes } from 'node:crypto';

let pass = 0, fail = 0;
function check(label, cond, detail = '') {
  if (cond) { pass++; } else { fail++; console.log(`FAIL ${label}${detail ? ' :: ' + detail : ''}`); }
}
const b = (x) => Uint8Array.from(Buffer.from(x, 'hex'));
const h = (x) => Buffer.from(x).toString('hex');

// ---- RFC 3394 section 4.1 --------------------------------------------------
{
  const kek = b('000102030405060708090a0b0c0d0e0f');
  const key = b('00112233445566778899aabbccddeeff');
  const wrapped = keyWrap(kek, key);
  check('RFC 3394 4.1 wrap', h(wrapped) === '1fa68b0a8112b447aef34bd8fb5a7b829d3e862371d2cfe5', h(wrapped));
  check('RFC 3394 4.1 unwrap', h(keyUnwrap(kek, wrapped)) === h(key));
}

// ---- OpenSSL: plain KeyWrap -------------------------------------------------
let ok = 0, bad = 0;
for (const klen of [16, 24, 32]) {
  for (const n of [2, 3, 4, 8]) {
    for (let i = 0; i < 3; i++) {
      const kek = randomBytes(klen), key = randomBytes(8 * n);
      const mine = Buffer.from(keyWrap(Uint8Array.from(kek), Uint8Array.from(key)));
      const ci = createCipheriv(`id-aes${klen * 8}-wrap`, kek, Buffer.alloc(8, 0xa6));
      ci.setAutoPadding(false);
      const ref = Buffer.concat([ci.update(key), ci.final()]);
      const back = keyUnwrap(Uint8Array.from(kek), Uint8Array.from(ref));
      if (mine.equals(ref) && back && Buffer.from(back).equals(key)) ok++; else bad++;
    }
  }
}
check(`OpenSSL KeyWrap agrees on ${ok} inputs`, bad === 0, `${bad} mismatches`);

// ---- OpenSSL: KeyWrap with padding -----------------------------------------
ok = 0; bad = 0;
for (const klen of [16, 24, 32]) {
  for (const len of [1, 3, 7, 8, 9, 16, 20, 40]) {
    for (let i = 0; i < 2; i++) {
      const kek = randomBytes(klen), key = randomBytes(len);
      const mine = Buffer.from(keyWrapPad(Uint8Array.from(kek), Uint8Array.from(key)));
      const ci = createCipheriv(`id-aes${klen * 8}-wrap-pad`, kek, Buffer.from('a65959a6', 'hex'));
      const ref = Buffer.concat([ci.update(key), ci.final()]);
      const back = keyUnwrapPad(Uint8Array.from(kek), Uint8Array.from(ref));
      if (mine.equals(ref) && back && Buffer.from(back).equals(key)) ok++; else bad++;
    }
  }
}
check(`OpenSSL KeyWrap-with-Padding agrees on ${ok} inputs`, bad === 0, `${bad} mismatches`);

// ---- integrity ------------------------------------------------------------
{
  const kek = randomBytes(16), key = randomBytes(32);
  const wrapped = keyWrap(Uint8Array.from(kek), Uint8Array.from(key));
  for (const pos of [0, 7, 8, wrapped.length - 1]) {
    const t = Uint8Array.from(wrapped); t[pos] ^= 1;
    check(`unwrap rejects corruption at byte ${pos}`, keyUnwrap(Uint8Array.from(kek), t) === null);
  }
  check('unwrap rejects truncated input', keyUnwrap(Uint8Array.from(kek), wrapped.subarray(0, 20)) === null);
  check('unwrap rejects wrong KEK', keyUnwrap(Uint8Array.from(randomBytes(16)), wrapped) === null);

  const padded = keyWrapPad(Uint8Array.from(kek), Uint8Array.from(Buffer.from([5, 6, 7])));
  const t = Uint8Array.from(padded); t[2] ^= 1;
  check('KWP unwrap rejects corruption', keyUnwrapPad(Uint8Array.from(kek), t) === null);
  check('KWP rejects empty input', (() => { try { keyWrapPad(Uint8Array.from(kek), new Uint8Array(0)); return false; } catch { return true; } })());
  check('KeyWrap rejects non-multiple-of-8 input', (() => { try { keyWrap(Uint8Array.from(kek), new Uint8Array(9)); return false; } catch { return true; } })());
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
