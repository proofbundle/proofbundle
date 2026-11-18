import { sha3_256, sha3_384, sha3_512, shake128, shake256, toHex } from './keccak.mjs';
import { createHash, randomBytes } from 'node:crypto';

let pass=0, fail=0; const bad=[];
const chk=(n,a,b)=>{ if(a===b) pass++; else { fail++; bad.push(n+"\n  got "+a+"\n  ref "+b); } };

// message lengths incl. every rate boundary and a stress case
const lens=[0,1,63,71,72,73,103,104,105,135,136,137,167,168,169,200,1000,100000];
for (const L of lens){
  const m = randomBytes(L);
  chk(`sha3-256 len=${L}`, toHex(sha3_256(m)), createHash('sha3-256').update(m).digest('hex'));
  chk(`sha3-384 len=${L}`, toHex(sha3_384(m)), createHash('sha3-384').update(m).digest('hex'));
  chk(`sha3-512 len=${L}`, toHex(sha3_512(m)), createHash('sha3-512').update(m).digest('hex'));
}
// SHAKE across squeeze boundaries
for (const L of [0,1,31,32,64,135,136,137,167,168,169,200,504,1000,4096]){
  const m = randomBytes(37);
  chk(`shake128 out=${L}`, toHex(shake128(m,L)), createHash('shake128',{outputLength:L}).update(m).digest('hex'));
  chk(`shake256 out=${L}`, toHex(shake256(m,L)), createHash('shake256',{outputLength:L}).update(m).digest('hex'));
}
// FIPS 202 known answers
chk('KAT sha3-256("")', toHex(sha3_256(new Uint8Array(0))),
    'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a');
chk('KAT sha3-256("abc")', toHex(sha3_256(new TextEncoder().encode('abc'))),
    '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532');
chk('KAT shake128("",32)', toHex(shake128(new Uint8Array(0),32)),
    '7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26');
// prefix stability — the property sampleNTT depends on
{
  const m = randomBytes(34);
  const a = toHex(shake128(m, 504)), b = toHex(shake128(m, 1008));
  chk('shake128 prefix-stable', b.slice(0, a.length), a);
}
console.log(`keccak: ${pass} pass, ${fail} fail`);
if (bad.length) console.log(bad.slice(0,6).join("\n"));
process.exit(fail?1:0);
