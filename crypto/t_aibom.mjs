import { generateKeyPairSync } from 'node:crypto';
import { sha3_384 } from './keccak.mjs';
import { buildAibom, verifyAibom, gateNorm, canonical } from './aibom.mjs';

let fail = 0;

// 1. SHA3-384 from the from-scratch keccak must match FIPS 202.
const got = Buffer.from(sha3_384('abc')).toString('hex');
const want = 'ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25';
if (got === want) console.log('sha3-384("abc")      : MATCHES FIPS 202');
else { console.log(`sha3-384("abc")      : MISMATCH\n  got  ${got}\n  want ${want}`); fail++; }

// 2. gate_norm must reproduce the value in the record on Drive.
const gn = gateNorm(new Array(10).fill(1));
if (gn === 3.1622776601683795) console.log('gate_norm(ones(10))  : 3.1622776601683795 == record on Drive');
else { console.log(`gate_norm(ones(10))  : ${gn} != 3.1622776601683795`); fail++; }

// 3. Build and self-verify.
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const rec = buildAibom({
  artifact: 'urn:agent:claude-opus-5:proofbundle-session:20260810',
  generatedAt: '2026-08-10T21:00:00.000Z',
  privateKeyPem: privateKey,
  publicKeyRaw: publicKey.export({ type: 'spki', format: 'der' }).slice(-32),
});
const problems = verifyAibom(rec);
if (problems.length === 0) console.log('self-verify          : no problems');
else { console.log('self-verify          :', problems); fail++; }

// 4. Field set must match the schema on Drive exactly.
const expected = ['schema','artifact','risk_tier','generated_at','ancestry','model_cards',
                  'custody_chain','attestation_record','kappa','compliance_vector','theta',
                  'gate_norm','bom_seal'].sort();
const actual = Object.keys(rec).sort();
if (JSON.stringify(expected) === JSON.stringify(actual)) console.log('field set            : matches PB-AI-BOM-1');
else { console.log(`field set            : MISMATCH\n  extra   ${actual.filter(k=>!expected.includes(k))}\n  missing ${expected.filter(k=>!actual.includes(k))}`); fail++; }

const sealKeys = Object.keys(rec.bom_seal).sort();
const sealWant = ['digest_alg','digest_b64u','sig_alg','pub_b64u','signature_b64u'].sort();
if (JSON.stringify(sealKeys) === JSON.stringify(sealWant)) console.log('bom_seal field set   : matches PB-AI-BOM-1');
else { console.log(`bom_seal field set   : MISMATCH ${sealKeys}`); fail++; }

// 5. Tamper control: any mutation must be caught.
const tampered = JSON.parse(JSON.stringify(rec));
tampered.risk_tier = 'low';
if (verifyAibom(tampered).length > 0) console.log('tamper control       : mutation refuted');
else { console.log('tamper control       : FAILED — mutation not detected'); fail++; }

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
