import {
  createPublicKey,
  encapsulate,
  generateKeyPairSync,
  randomBytes,
} from 'node:crypto';
import { mlkemDecapsulate, mlkemKeygen } from './mlkem.mjs';

const configurations = [
  { name: 'ML-KEM-512', nodeType: 'ml-kem-512', publicKeyLength: 800 },
  { name: 'ML-KEM-768', nodeType: 'ml-kem-768', publicKeyLength: 1184 },
  { name: 'ML-KEM-1024', nodeType: 'ml-kem-1024', publicKeyLength: 1568 },
];

function equal(left, right) {
  return left.byteLength === right.byteLength &&
    left.every((value, index) => value === right[index]);
}

let passed = 0;
let failed = 0;
for (const configuration of configurations) {
  // A generated key supplies only the standard SubjectPublicKeyInfo wrapper;
  // its raw public-key bits are replaced with the independently generated key.
  const template = generateKeyPairSync(configuration.nodeType).publicKey.export({
    format: 'der',
    type: 'spki',
  });
  const prefix = template.subarray(
    0,
    template.byteLength - configuration.publicKeyLength,
  );
  for (let trial = 0; trial < 10; trial += 1) {
    const pure = mlkemKeygen(randomBytes(64), configuration.name);
    const spki = Buffer.concat([prefix, Buffer.from(pure.encapsKey)]);
    const publicKey = createPublicKey({ key: spki, format: 'der', type: 'spki' });
    const nodeResult = encapsulate(publicKey);
    const pureSharedSecret = mlkemDecapsulate(
      pure.decapsKey,
      new Uint8Array(nodeResult.ciphertext),
      configuration.name,
    );
    if (equal(pureSharedSecret, new Uint8Array(nodeResult.sharedKey))) passed += 1;
    else failed += 1;
  }
}

console.log(
  `node/pure-js ML-KEM interoperability: ${passed} pass, ${failed} fail ` +
  '(Node encapsulation, independent pure-JS decapsulation)',
);
process.exit(failed === 0 ? 0 : 1);
