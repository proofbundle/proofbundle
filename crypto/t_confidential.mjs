import { confidentialSeal, confidentialOpen, verifyCiphertext, mlkemKeygen } from './confidential.mjs';
import { sha3_256 } from './keccak.mjs';
import { randomBytes } from 'node:crypto';

let pass = 0, fail = 0;
const ok = (name, cond) => cond ? pass++ : (fail++, console.log(`FAIL ${name}`));
const throws = (name, fn) => { try { fn(); fail++; console.log(`FAIL ${name} (expected throw)`); } catch { pass++; } };

const rnd = n => new Uint8Array(randomBytes(n));

for (const set of ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']) {
  const { encapsKey, decapsKey } = mlkemKeygen(rnd(64), set);

  for (const len of [0, 1, 31, 32, 33, 1000, 5000]) {
    const payload = rnd(len);
    const nonce = rnd(16);
    const { envelope, digest_plaintext, digest_ciphertext } = confidentialSeal(payload, encapsKey, nonce, set);

    // tier 1 — no key
    ok(`${set}/${len} tier1 accepts sealed ciphertext`, verifyCiphertext(envelope, digest_ciphertext));

    // tier 2 — with key
    const { payload: got, digestMatchesSeal } = confidentialOpen(envelope, decapsKey, digest_plaintext);
    ok(`${set}/${len} roundtrip`, got.length === payload.length && got.every((b, i) => b === payload[i]));
    ok(`${set}/${len} digest matches seal`, digestMatchesSeal === true);

    // the payload must not appear in the clear
    if (len >= 32) {
      const same = envelope.ct.every((b, i) => b === payload[i]);
      ok(`${set}/${len} ciphertext differs from plaintext`, !same);
    }
  }

  // tamper: flip a ciphertext bit -> tier 1 rejects, tier 2 refuses to return plaintext
  const payload = rnd(256), nonce = rnd(16);
  const { envelope, digest_ciphertext } = confidentialSeal(payload, encapsKey, nonce, set);
  const bad = { ...envelope, ct: Uint8Array.from(envelope.ct) };
  bad.ct[7] ^= 0x01;
  ok(`${set} tier1 rejects tampered ciphertext`, !verifyCiphertext(bad, digest_ciphertext));
  throws(`${set} tier2 refuses tampered ciphertext`, () => confidentialOpen(bad, decapsKey, null));

  // tamper the tag
  const badTag = { ...envelope, tag: Uint8Array.from(envelope.tag) };
  badTag.tag[0] ^= 0xff;
  throws(`${set} tier2 refuses forged tag`, () => confidentialOpen(badTag, decapsKey, null));

  // wrong recipient must not decrypt
  const other = mlkemKeygen(rnd(64), set);
  throws(`${set} wrong key cannot open`, () => confidentialOpen(envelope, other.decapsKey, null));

  // a substituted plaintext digest must be caught
  const { digestMatchesSeal } = confidentialOpen(envelope, decapsKey, sha3_256(rnd(64)));
  ok(`${set} wrong sealed digest detected`, digestMatchesSeal === false);

  // determinism for a fixed nonce
  const a = confidentialSeal(payload, encapsKey, nonce, set);
  const b = confidentialSeal(payload, encapsKey, nonce, set);
  ok(`${set} deterministic for fixed nonce`, a.envelope.ct.every((x, i) => x === b.envelope.ct[i]));

  // a different nonce must produce different ciphertext
  const c = confidentialSeal(payload, encapsKey, rnd(16), set);
  ok(`${set} nonce changes ciphertext`, !c.envelope.ct.every((x, i) => x === a.envelope.ct[i]));
}

console.log(`confidential provenance: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
