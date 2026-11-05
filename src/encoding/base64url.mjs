// Base64url (RFC 4648 §5), unpadded — the form used in JWS/JWK-style
// identifiers throughout this project. Rejects standard-alphabet
// characters ('+', '/') and any '=' padding, since accepting both
// alphabets for the same value would again make the encoding non-unique.

const B64URL_RE = /^[A-Za-z0-9_-]*$/;

export function bytesToBase64url(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToBase64url: expected Uint8Array');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',out=[];let value=0,bits=0;
  for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=6){bits-=6;out.push(alphabet[(value>>>bits)&63]);}}
  if(bits)out.push(alphabet[(value<<(6-bits))&63]);return out.join('');
}

export function base64urlToBytes(str) {
  if (typeof str !== 'string') throw new TypeError('base64urlToBytes: expected a string');
  if (!B64URL_RE.test(str)) throw new RangeError('base64urlToBytes: invalid base64url alphabet or padding present');
  if(str.length%4===1)throw new RangeError('base64urlToBytes: invalid length');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',decoded=[];let value=0,bits=0;
  for(const char of str){value=(value<<6)|alphabet.indexOf(char);bits+=6;if(bits>=8){bits-=8;decoded.push((value>>>bits)&255);}}
  if(bits&&(value&((1<<bits)-1)))throw new RangeError('base64urlToBytes: nonzero padding bits');
  if (bytesToBase64url(new Uint8Array(decoded)) !== str) {
    throw new RangeError('base64urlToBytes: non-canonical encoding');
  }
  return new Uint8Array(decoded);
}
