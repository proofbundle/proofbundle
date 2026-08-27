import { sha512, sha384, sha512hex, sha384hex } from './sha512.mjs';
import { createHash, randomBytes } from 'node:crypto';

let pass = 0, fail = 0; const bad = [];
const chk = (n, a, b) => { if (a === b) pass++; else { fail++; bad.push(n + "\n  got " + a + "\n  ref " + b); } };
const hex = (b) => Buffer.from(b).toString('hex');

// rate/block boundaries for the 128-byte SHA-512 block size, plus a stress case
const lens = [0, 1, 55, 56, 57, 111, 112, 113, 127, 128, 129, 1000, 100000];
for (const len of lens) {
  const m = randomBytes(len);
  chk(`sha512 len=${len}`, hex(sha512(m)), createHash('sha512').update(m).digest('hex'));
  chk(`sha384 len=${len}`, hex(sha384(m)), createHash('sha384').update(m).digest('hex'));
  chk(`sha512hex len=${len}`, sha512hex(m), createHash('sha512').update(m).digest('hex'));
  chk(`sha384hex len=${len}`, sha384hex(m), createHash('sha384').update(m).digest('hex'));
}

chk('sha512 accepts string input', hex(sha512('abc')), createHash('sha512').update('abc').digest('hex'));
chk('sha384 accepts string input', hex(sha384('abc')), createHash('sha384').update('abc').digest('hex'));
chk('sha512 output length', sha512(new Uint8Array(0)).length, 64);
chk('sha384 output length', sha384(new Uint8Array(0)).length, 48);

console.log(`sha512/384: ${pass} pass, ${fail} fail`);
if (bad.length) console.log(bad.slice(0, 8).join("\n"));
process.exit(fail ? 1 : 0);
