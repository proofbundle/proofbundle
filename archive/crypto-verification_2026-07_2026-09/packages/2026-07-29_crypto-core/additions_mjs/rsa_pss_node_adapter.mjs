import { generateKeyPairSync, sign, verify } from 'node:crypto';
export function rsaPssGenerate(bits = 3072) {
  return generateKeyPairSync('rsa', { modulusLength: bits, publicExponent: 0x10001 });
}
export function rsaPssSign(privateKey, msg, saltLength = 32) {
  return sign('sha256', msg, { key: privateKey, padding: 6, saltLength });
}
export function rsaPssVerify(publicKey, msg, sig, saltLength = 32) {
  return verify('sha256', msg, { key: publicKey, padding: 6, saltLength }, sig);
}
