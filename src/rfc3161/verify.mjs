/*
 * RFC 3161 timestamp token verification.
 *
 * Scope, stated precisely: this module answers one question about a
 * TimeStampResp token — "is the asserted time inside this token covered by a
 * signature this code just verified, and does the token bind the digest it
 * claims to bind?" It does NOT decide whether the signing certificate chains
 * to a trust anchor. That decision needs a caller-supplied trust store, and
 * the function reports the chain as UNTRUSTED unless the caller supplies one.
 *
 * The distinction matters because the two failure modes are different in
 * severity. A forged time is a lie the app tells the user. An untrusted-but-
 * correctly-signed time is a true statement from an unknown authority. The
 * first is a defect in this code; the second is a policy decision for the
 * caller. Keeping them separate is what lets the UI say something true.
 *
 * Structure of a TimeStampResp (RFC 3161 §2.4):
 *
 *   TimeStampResp ::= SEQUENCE {
 *     status                  PKIStatusInfo,
 *     timeStampToken          TimeStampToken OPTIONAL }
 *
 *   TimeStampToken ::= ContentInfo    -- CMS SignedData, contentType id-ct-TSTInfo
 *
 *   SignedData ::= SEQUENCE {
 *     version, digestAlgorithms, encapContentInfo, certificates [0] IMPLICIT,
 *     crls [1] IMPLICIT, signerInfos SET OF SignerInfo }
 *
 *   SignerInfo ::= SEQUENCE {
 *     version, sid, digestAlgorithm, signedAttrs [0] IMPLICIT OPTIONAL,
 *     signatureAlgorithm, signature, unsignedAttrs [1] IMPLICIT OPTIONAL }
 *
 * The signature is computed over the DER encoding of SignedAttrs with the
 * SET OF tag (0x31) replaced by the IMPLICIT [0] tag (0xA0). Getting that
 * substitution wrong is the classic CMS bug, so it is done explicitly below
 * and covered by a negative test.
 *
 * The signed content is a TSTInfo (RFC 3161 §2.4.2):
 *
 *   TSTInfo ::= SEQUENCE {
 *     version INTEGER { v1(1) },
 *     policy TSAPolicyId,
 *     messageImprint MessageImprint,
 *     serialNumber INTEGER,
 *     genTime GeneralizedTime,
 *     accuracy Accuracy OPTIONAL,
 *     ordering BOOLEAN DEFAULT FALSE,
 *     nonce INTEGER OPTIONAL,
 *     tsa [0] GeneralName OPTIONAL,
 *     extensions [1] IMPLICIT OPTIONAL }
 *
 *   MessageImprint ::= SEQUENCE {
 *     hashAlgorithm AlgorithmIdentifier,
 *     hashedMessage OCTET STRING }
 *
 * Verification therefore requires, in order:
 *   1. the token parses as CMS SignedData with id-ct-TSTInfo content,
 *   2. the TSTInfo parses and its messageImprint equals the caller's digest,
 *   3. the SignerInfo signature verifies over the DER signedAttrs,
 *   4. the signing certificate carries the timeStamping extended key usage.
 *
 * Step 4 is what distinguishes a timestamp authority from an arbitrary
 * certificate that happens to sign some bytes.
 */

const OID = {
  signedData: '1.2.840.113549.1.7.2',
  data: '1.2.840.113549.1.7.1',
  tstInfo: '1.2.840.113549.1.9.16.1.4',
  contentType: '1.2.840.113549.1.9.3',
  messageDigest: '1.2.840.113549.1.9.4',
  signingTime: '1.2.840.113549.1.9.5',
  sha256: '2.16.840.1.101.3.4.2.1',
  sha384: '2.16.840.1.101.3.4.2.2',
  sha512: '2.16.840.1.101.3.4.2.3',
  sha1: '1.3.14.3.2.26',
  rsaEncryption: '1.2.840.113549.1.1.1',
  sha256WithRSA: '1.2.840.113549.1.1.11',
  sha384WithRSA: '1.2.840.113549.1.1.12',
  sha512WithRSA: '1.2.840.113549.1.1.13',
  sha1WithRSA: '1.2.840.113549.1.1.5',
  rsassaPss: '1.2.840.113549.1.1.10',
  ecPublicKey: '1.2.840.10045.2.1',
  ecdsaWithSHA256: '1.2.840.10045.4.3.2',
  ecdsaWithSHA384: '1.2.840.10045.4.3.3',
  ecdsaWithSHA512: '1.2.840.10045.4.3.4',
  ed25519: '1.3.101.112',
  extendedKeyUsage: '2.5.29.37',
  keyUsage: '2.5.29.15',
  basicConstraints: '2.5.29.19',
  subjectKeyIdentifier: '2.5.29.14',
  authorityKeyIdentifier: '2.5.29.35',
  timeStamping: '1.3.6.1.5.5.7.3.8',
  commonName: '2.5.4.3',
  organization: '2.5.4.10',
  country: '2.5.4.6',
};

/* Digest OID -> WebCrypto hash name. */
const DIGEST_BY_OID = {
  [OID.sha256]: 'SHA-256',
  [OID.sha384]: 'SHA-384',
  [OID.sha512]: 'SHA-512',
  [OID.sha1]: 'SHA-1',
};

/* Signature OID -> WebCrypto verify parameters and the digest it implies. */
const SIGNATURE_ALGS = {
  [OID.sha256WithRSA]: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  [OID.sha384WithRSA]: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
  [OID.sha512WithRSA]: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
  [OID.sha1WithRSA]: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
  [OID.rsassaPss]: { name: 'RSA-PSS', hash: 'SHA-256' },
  [OID.ecdsaWithSHA256]: { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' },
  [OID.ecdsaWithSHA384]: { name: 'ECDSA', namedCurve: 'P-384', hash: 'SHA-384' },
  [OID.ecdsaWithSHA512]: { name: 'ECDSA', namedCurve: 'P-521', hash: 'SHA-512' },
  [OID.ed25519]: { name: 'Ed25519', hash: null },
};

/* Certificate public key algorithm OID -> the curve/spki shape to import. */
const KEY_ALGS = {
  [OID.rsaEncryption]: { kind: 'rsa' },
  [OID.rsassaPss]: { kind: 'rsa' },
  [OID.ecPublicKey]: { kind: 'ec' },
  [OID.ed25519]: { kind: 'ed25519' },
};

/* ---------------------------------------------------------------- DER reader */

class DerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DerError';
  }
}

/*
 * A cursor over DER bytes. Every read returns the node's tag, its content
 * range, and the absolute byte range of the whole TLV, because the CMS
 * signedAttrs fix requires re-encoding one node with a different tag and
 * therefore needs to know exactly which bytes to replace.
 */
class DerReader {
  constructor(bytes, start = 0, end = bytes.length) {
    this.bytes = bytes;
    this.pos = start;
    this.end = end;
  }

  get remaining() {
    return this.end - this.pos;
  }

  atEnd() {
    return this.pos >= this.end;
  }

  /* Reads one TLV header. Returns {tag, contentStart, contentEnd, totalStart, totalEnd}. */
  readTlv() {
    if (this.pos >= this.end) throw new DerError('unexpected end of DER');
    const totalStart = this.pos;
    const tag = this.bytes[this.pos++];
    if ((tag & 0x1f) === 0x1f) {
      throw new DerError('multi-byte DER tags are not supported');
    }
    if (this.pos >= this.end) throw new DerError('truncated DER length');
    let len = this.bytes[this.pos++];
    if (len & 0x80) {
      const count = len & 0x7f;
      if (count === 0) throw new DerError('indefinite DER length is not valid in DER');
      if (count > 4) throw new DerError('DER length too large');
      if (this.pos + count > this.end) throw new DerError('truncated DER length');
      len = 0;
      for (let i = 0; i < count; i += 1) len = len * 256 + this.bytes[this.pos++];
    }
    const contentStart = this.pos;
    const contentEnd = contentStart + len;
    if (contentEnd > this.end) throw new DerError('DER length overruns buffer');
    this.pos = contentEnd;
    return { tag, contentStart, contentEnd, totalStart, totalEnd: contentEnd };
  }

  /*
   * Reads a TLV and returns a reader scoped to its content.
   * The node carries `bytes` so a node can be re-examined later without
   * needing the reader that produced it.
   */
  readNode() {
    const node = this.readTlv();
    return { ...node, bytes: this.bytes, reader: new DerReader(this.bytes, node.contentStart, node.contentEnd) };
  }

  /* The raw bytes of a node, including its header. */
  raw(node) {
    return this.bytes.slice(node.totalStart, node.totalEnd);
  }
}

/* Encodes a DER length. */
function derLen(n) {
  if (n < 0x80) return Uint8Array.from([n]);
  const bytes = [];
  let v = n;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  }
  return Uint8Array.from([0x80 | bytes.length, ...bytes]);
}

/*
 * Re-encodes one TLV with a replacement tag, preserving the original length
 * bytes. This is the CMS signedAttrs transformation: the signature covers the
 * DER of the SET OF, but the transmitted bytes carry the IMPLICIT [0] tag.
 *
 * IMPLICIT tagging replaces only the identifier octets, so the length
 * encoding stays exactly as it was transmitted. The original header is
 * totalStart..contentStart: one tag byte followed by the length bytes.
 */
function retag(node, newTag) {
  const header = node.bytes.slice(node.totalStart, node.contentStart);
  const lengthBytes = header.slice(1);
  return Uint8Array.from([
    newTag,
    ...lengthBytes,
    ...node.bytes.slice(node.contentStart, node.contentEnd),
  ]);
}

/* Decodes an OID's content bytes to dotted form. */
function decodeOid(content) {
  const first = content[0];
  const parts = [Math.floor(first / 40), first % 40];
  let value = 0;
  for (let i = 1; i < content.length; i += 1) {
    const byte = content[i];
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) {
      parts.push(value);
      value = 0;
    }
  }
  return parts.join('.');
}

/* Reads an OBJECT IDENTIFIER node, returning its dotted form. */
function readOid(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x06) throw new DerError('expected OBJECT IDENTIFIER');
  return decodeOid(reader.bytes.slice(node.contentStart, node.contentEnd));
}

/* Reads a BIT STRING node, returning its payload with the unused-bit count removed. */
function readBitString(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x03) throw new DerError('expected BIT STRING');
  const content = reader.bytes.slice(node.contentStart, node.contentEnd);
  if (content.length === 0) throw new DerError('empty BIT STRING');
  const unused = content[0];
  if (unused > 7) throw new DerError('invalid BIT STRING padding');
  return content.slice(1);
}

/* Reads an INTEGER node as a byte string of its two's-complement magnitude. */
function readIntegerBytes(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x02) throw new DerError('expected INTEGER');
  return normalizeIntegerBytes(reader.bytes.slice(node.contentStart, node.contentEnd));
}

/* Strips leading zero padding from a two's-complement integer's content. */
function normalizeIntegerBytes(content) {
  let out = content;
  while (out.length > 1 && out[0] === 0x00) out = out.slice(1);
  return out;
}

/* Reads a GeneralizedTime node and returns it as an ISO-8601 string. */
function readGeneralizedTime(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x18) throw new DerError('expected GeneralizedTime');
  const text = new TextDecoder().decode(reader.bytes.slice(node.contentStart, node.contentEnd));
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z?$/.exec(text);
  if (!m) throw new DerError('malformed GeneralizedTime: ' + text);
  const frac = m[7] ? '.' + m[7] : '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${frac}Z`;
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* --------------------------------------------------------- X.509 extraction */

/*
 * Extracts what this module needs from a DER certificate: the SPKI bytes for
 * key import, the subject and issuer RDN strings, validity, and the
 * extensions that decide whether the certificate may act as a TSA.
 */
export function parseCertificate(der) {
  const reader = new DerReader(der);
  const cert = reader.readNode();
  if (cert.tag !== 0x30) throw new DerError('certificate is not a SEQUENCE');

  const body = cert.reader;
  const tbs = body.readNode();
  if (tbs.tag !== 0x30) throw new DerError('tbsCertificate is not a SEQUENCE');

  /* tbsCertificate ::= SEQUENCE { version [0] EXPLICIT, serialNumber, signature,
     issuer Name, validity, subject Name, subjectPublicKeyInfo, ... extensions [3] } */
  const tbsBody = tbs.reader;
  let next = tbsBody.readNode();
  if (next.tag === 0xa0) next = tbsBody.readNode(); /* skip explicit version */
  if (next.tag !== 0x02) throw new DerError('serialNumber is not an INTEGER');
  const serial = toHex(normalizeIntegerBytes(tbsBody.bytes.slice(next.contentStart, next.contentEnd)));

  const signatureAlg = readAlgorithmIdentifier(tbsBody);
  const issuer = readName(tbsBody);
  const validity = readValidity(tbsBody);
  const subject = readName(tbsBody);
  const spki = tbsBody.readNode();
  if (spki.tag !== 0x30) throw new DerError('subjectPublicKeyInfo is not a SEQUENCE');

  const spkiBody = spki.reader;
  const keyAlg = readAlgorithmIdentifier(spkiBody);
  const keyBits = readBitString(spkiBody);

  const extensions = readExtensions(tbsBody);

  return {
    der,
    serial,
    signatureAlg,
    issuer,
    subject,
    validity,
    spki: spki.reader.raw(spki),
    publicKey: keyBits,
    keyAlgorithm: keyAlg,
    extensions,
  };
}

/*
 * Reads an AlgorithmIdentifier whose SEQUENCE has already been consumed.
 * The reader must be scoped to the SEQUENCE's content.
 */
function readAlgorithmIdentifierContent(reader) {
  const oid = readOid(reader);
  let params = null;
  if (!reader.atEnd()) {
    const param = reader.readNode();
    if (param.tag === 0x06) params = decodeOid(reader.bytes.slice(param.contentStart, param.contentEnd));
    else params = { tag: param.tag };
  }
  return { oid, params };
}

/* Reads an AlgorithmIdentifier node from a reader, consuming the SEQUENCE. */
function readAlgorithmIdentifier(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x30) throw new DerError('AlgorithmIdentifier is not a SEQUENCE');
  return readAlgorithmIdentifierContent(node.reader);
}

/*
 * Reads an X.501 Name into a readable string. Only the attribute types that
 * appear in TSA certificates are decoded; unknown types are skipped by
 * walking their TLVs rather than being rendered.
 */
function readName(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x30) throw new DerError('Name is not a SEQUENCE');
  const parts = [];
  const rdnSeq = node.reader;
  while (!rdnSeq.atEnd()) {
    const rdn = rdnSeq.readNode();
    if (rdn.tag !== 0x31) break;
    const set = rdn.reader;
    while (!set.atEnd()) {
      const attr = set.readNode();
      if (attr.tag !== 0x30) break;
      const attrBody = attr.reader;
      const oid = readOid(attrBody);
      const valueNode = attrBody.readNode();
      const value = new TextDecoder().decode(
        attrBody.bytes.slice(valueNode.contentStart, valueNode.contentEnd),
      );
      const label = {
        [OID.commonName]: 'CN',
        [OID.organization]: 'O',
        [OID.country]: 'C',
      }[oid] || oid;
      parts.push(`${label}=${value}`);
    }
  }
  return parts.join(', ');
}

function readValidity(reader) {
  const node = reader.readNode();
  if (node.tag !== 0x30) throw new DerError('Validity is not a SEQUENCE');
  const v = node.reader;
  const notBefore = readTime(v);
  const notAfter = readTime(v);
  return { notBefore, notAfter };
}

function readTime(reader) {
  const node = reader.readNode();
  const text = new TextDecoder().decode(reader.bytes.slice(node.contentStart, node.contentEnd));
  if (node.tag === 0x18) {
    const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z?$/.exec(text);
    if (!m) throw new DerError('malformed GeneralizedTime');
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? '.' + m[7] : ''}Z`;
  }
  if (node.tag === 0x17) {
    const m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z?$/.exec(text);
    if (!m) throw new DerError('malformed UTCTime');
    const year = Number(m[1]) >= 50 ? 1900 + Number(m[1]) : 2000 + Number(m[1]);
    return `${year}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  }
  throw new DerError('unsupported time type 0x' + node.tag.toString(16));
}

/*
 * Reads the extension block. Returns a map keyed by OID.
 * Each extension value keeps its DER so callers can inspect individual
 * extensions rather than only the ones this module needs.
 */
function readExtensions(reader) {
  const map = new Map();
  if (reader.atEnd()) return map;

  /* extensions [3] EXPLICIT Extensions OPTIONAL */
  let node;
  try {
    node = reader.readNode();
  } catch {
    return map;
  }
  if (node.tag !== 0xa3) return map;

  const seq = node.reader.readNode();
  if (seq.tag !== 0x30) return map;
  const list = seq.reader;

  while (!list.atEnd()) {
    const ext = list.readNode();
    if (ext.tag !== 0x30) break;
    const e = ext.reader;
    const oid = readOid(e);
    let critical = false;
    let valueNode = e.readNode();
    if (valueNode.tag === 0x01) {
      critical = valueNode.contentStart < valueNode.contentEnd && e.bytes[valueNode.contentStart] !== 0;
      valueNode = e.readNode();
    }
    if (valueNode.tag !== 0x04) break;
    map.set(oid, {
      critical,
      der: e.bytes.slice(valueNode.contentStart, valueNode.contentEnd),
    });
  }
  return map;
}

/* True when the certificate carries the id-kp-timeStamping EKU. */
export function hasTimeStampingEku(cert) {
  const ext = cert.extensions.get(OID.extendedKeyUsage);
  if (!ext) return false;
  const reader = new DerReader(ext.der);
  const seq = reader.readNode();
  if (seq.tag !== 0x30) return false;
  const list = seq.reader;
  while (!list.atEnd()) {
    const node = list.readNode();
    if (node.tag !== 0x06) continue;
    if (decodeOid(reader.bytes.slice(node.contentStart, node.contentEnd)) === OID.timeStamping) return true;
  }
  return false;
}

/* True when the certificate's basicConstraints says CA:FALSE, as RFC 3161 requires of TSA certs. */
export function isEndEntity(cert) {
  const ext = cert.extensions.get(OID.basicConstraints);
  if (!ext) return true; /* absent basicConstraints means end entity by default */
  const reader = new DerReader(ext.der);
  const seq = reader.readNode();
  if (seq.tag !== 0x30) return true;
  const body = seq.reader;
  /* basicConstraints ::= SEQUENCE { cA BOOLEAN DEFAULT FALSE, pathLenConstraint INTEGER OPTIONAL }
     An empty SEQUENCE is the encoding of the default, cA absent, therefore FALSE. */
  if (body.atEnd()) return true;
  const node = body.readNode();
  if (node.tag !== 0x01) return true;
  const isCa = node.contentStart < node.contentEnd && reader.bytes[node.contentStart] !== 0;
  return !isCa;
}

/* ------------------------------------------------------------- CMS parsing */

/*
 * Parses a TimeStampResp into its parts. Throws DerError on anything that is
 * not a well-formed CMS SignedData carrying a TSTInfo.
 */
export function parseTimeStampResp(respBytes) {
  const top = new DerReader(respBytes);
  const resp = top.readNode();
  if (resp.tag !== 0x30) throw new DerError('TimeStampResp is not a SEQUENCE');

  const body = resp.reader;
  const statusInfo = body.readNode();
  if (statusInfo.tag !== 0x30) throw new DerError('PKIStatusInfo is not a SEQUENCE');
  const status = readStatusInfo(statusInfo);

  if (body.atEnd()) {
    return { status, token: null, reason: 'token absent from response' };
  }

  const token = body.readNode();
  if (token.tag !== 0x30) throw new DerError('TimeStampToken is not a SEQUENCE');

  return { status, token: parseContentInfo(token), reason: null };
}

function readStatusInfo(node) {
  const body = node.reader;
  const statusNumber = readIntegerBytes(body)[0] ?? 0;
  let statusString = null;
  if (!body.atEnd()) {
    const s = body.readNode();
    if (s.tag === 0x0c) {
      statusString = new TextDecoder().decode(body.bytes.slice(s.contentStart, s.contentEnd));
    }
  }
  return { status: statusNumber, statusString };
}

/*
 * ContentInfo ::= SEQUENCE { contentType OID, content [0] EXPLICIT ANY }
 */
function parseContentInfo(node) {
  const body = node.reader;
  const contentType = readOid(body);
  if (contentType !== OID.signedData) {
    throw new DerError('TimeStampToken contentType is not id-signedData');
  }
  const wrapper = body.readNode();
  if (wrapper.tag !== 0xa0) throw new DerError('SignedData wrapper is not [0] EXPLICIT');
  const signedData = wrapper.reader.readNode();
  if (signedData.tag !== 0x30) throw new DerError('SignedData is not a SEQUENCE');
  return parseSignedData(signedData);
}

function parseSignedData(node) {
  const body = node.reader;
  const version = readIntegerBytes(body)[0] ?? 1;

  const digestAlgs = body.readNode();
  if (digestAlgs.tag !== 0x31) throw new DerError('digestAlgorithms is not a SET');
  const digestAlgorithms = [];
  {
    const list = digestAlgs.reader;
    while (!list.atEnd()) {
      const alg = list.readNode();
      if (alg.tag !== 0x30) break;
      digestAlgorithms.push(readAlgorithmIdentifierContent(alg.reader));
    }
  }

  const encap = body.readNode();
  if (encap.tag !== 0x30) throw new DerError('encapContentInfo is not a SEQUENCE');
  const encapBody = encap.reader;
  const contentType = readOid(encapBody);
  let eContent = null;
  if (!encapBody.atEnd()) {
    const wrapper = encapBody.readNode();
    if (wrapper.tag === 0xa0) {
      const octets = wrapper.reader.readNode();
      if (octets.tag === 0x04) {
        eContent = encapBody.bytes.slice(octets.contentStart, octets.contentEnd);
      }
    }
  }

  const certificates = [];
  if (!body.atEnd()) {
    const next = body.readNode();
    if (next.tag === 0xa0) {
      /* certificates [0] IMPLICIT CertificateSet */
      const set = new DerReader(body.bytes, next.contentStart, next.contentEnd);
      while (!set.atEnd()) {
        const certNode = set.readNode();
        if (certNode.tag !== 0x30) break;
        certificates.push(body.bytes.slice(certNode.totalStart, certNode.totalEnd));
      }
      /* signerInfos follows */
    } else {
      /* no certificates block; the node we just read was the signerInfos SET */
      return assembleSignedData(version, digestAlgorithms, contentType, eContent, certificates, next);
    }
  }

  const signerInfos = body.readNode();
  if (signerInfos.tag !== 0x31) throw new DerError('signerInfos is not a SET');
  return assembleSignedData(version, digestAlgorithms, contentType, eContent, certificates, signerInfos);
}

function assembleSignedData(version, digestAlgorithms, contentType, eContent, certificates, signerInfosNode) {
  const signers = [];
  const set = signerInfosNode.reader;
  while (!set.atEnd()) {
    const si = set.readNode();
    if (si.tag !== 0x30) break;
    signers.push(parseSignerInfo(si));
  }
  return {
    version,
    digestAlgorithms,
    contentType,
    eContent,
    certificates,
    signers,
  };
}

/*
 * SignerInfo ::= SEQUENCE {
 *   version INTEGER, sid IssuerAndSerialNumber,
 *   digestAlgorithm AlgorithmIdentifier,
 *   signedAttrs [0] IMPLICIT OPTIONAL,
 *   signatureAlgorithm AlgorithmIdentifier,
 *   signature OCTET STRING,
 *   unsignedAttrs [1] IMPLICIT OPTIONAL }
 */
function parseSignerInfo(node) {
  const body = node.reader;
  const version = readIntegerBytes(body)[0] ?? 1;

  const sidNode = body.readNode();
  let sid = null;
  if (sidNode.tag === 0x30) {
    const sidBody = sidNode.reader;
    const issuer = readName(sidBody);
    const serial = readIntegerBytes(sidBody);
    sid = { issuer, serial: toHex(serial) };
  }

  const digestAlgorithm = readAlgorithmIdentifier(body);

  /* signedAttrs [0] IMPLICIT is optional. Read the next node once and
     decide from its tag, so the node is never consumed twice. */
  let signedAttrsNode = null;
  let next = body.readNode();
  if (next.tag === 0xa0) {
    signedAttrsNode = next;
    next = body.readNode();
  }

  if (next.tag !== 0x30) throw new DerError('signatureAlgorithm is not a SEQUENCE');
  const signatureAlgorithm = readAlgorithmIdentifierContent(next.reader);

  const signatureNode = body.readNode();
  if (signatureNode.tag !== 0x04) throw new DerError('signature is not an OCTET STRING');
  const signature = body.bytes.slice(signatureNode.contentStart, signatureNode.contentEnd);

  let unsignedAttrs = null;
  if (!body.atEnd()) {
    const unsigned = body.readNode();
    if (unsigned.tag === 0xa1) unsignedAttrs = unsigned;
  }

  return {
    version,
    sid,
    digestAlgorithm,
    signedAttrsNode,
    signatureAlgorithm,
    signature,
    unsignedAttrs,
  };
}

/*
 * Parses the signed attributes into a list of {oid, value}. The attributes
 * are transmitted under the IMPLICIT [0] tag; the signature covers the same
 * bytes with the SET OF tag, so both forms are derived from one node.
 */
function readSignedAttributes(signerInfo) {
  if (!signerInfo.signedAttrsNode) return [];
  const node = signerInfo.signedAttrsNode;
  const reader = new DerReader(node.bytes, node.contentStart, node.contentEnd);
  const attrs = [];
  while (!reader.atEnd()) {
    const attr = reader.readNode();
    if (attr.tag !== 0x30) break;
    const body = attr.reader;
    const oid = readOid(body);
    const values = body.readNode();
    if (values.tag !== 0x31) break;
    const valueList = values.reader;
    const valueNodes = [];
    while (!valueList.atEnd()) {
      const v = valueList.readNode();
      valueNodes.push(v);
    }
    attrs.push({ oid, valueNodes });
  }
  return attrs;
}

/* ---------------------------------------------------------- TSTInfo parsing */

export function parseTstInfo(der) {
  const top = new DerReader(der);
  const node = top.readNode();
  if (node.tag !== 0x30) throw new DerError('TSTInfo is not a SEQUENCE');
  const body = node.reader;

  const version = readIntegerBytes(body)[0] ?? 1;
  const policy = readOid(body);

  const imprintNode = body.readNode();
  if (imprintNode.tag !== 0x30) throw new DerError('MessageImprint is not a SEQUENCE');
  const imprintBody = imprintNode.reader;
  const hashAlgorithm = readAlgorithmIdentifier(imprintBody);
  const hashNode = imprintBody.readNode();
  if (hashNode.tag !== 0x04) throw new DerError('hashedMessage is not an OCTET STRING');
  const hashedMessage = imprintBody.bytes.slice(hashNode.contentStart, hashNode.contentEnd);

  const serialNumber = toHex(readIntegerBytes(body));

  const genTime = readGeneralizedTime(body);

  let accuracy = null;
  let ordering = null;
  let nonce = null;
  let tsa = null;

  while (!body.atEnd()) {
    const next = body.readNode();
    if (next.tag === 0x30) {
      /* Accuracy ::= SEQUENCE { seconds [0] INTEGER OPTIONAL, millis [1] INTEGER OPTIONAL,
         micros [2] INTEGER OPTIONAL } */
      const acc = next.reader;
      const seconds = [];
      while (!acc.atEnd()) {
        const f = acc.readNode();
        const raw = acc.bytes.slice(f.contentStart, f.contentEnd);
        let value = 0;
        for (const b of raw) value = value * 256 + b;
        seconds.push({ tag: f.tag, value });
      }
      accuracy = seconds;
    } else if (next.tag === 0x01) {
      ordering = next.contentStart < next.contentEnd && body.bytes[next.contentStart] !== 0;
    } else if (next.tag === 0x02) {
      nonce = toHex(body.bytes.slice(next.contentStart, next.contentEnd));
    } else if (next.tag === 0xa0) {
      /* tsa [0] GeneralName */
      const gn = next.reader.readNode();
      if (gn.tag === 0xa4) {
        tsa = { directoryName: readName(gn.reader) };
      } else {
        tsa = { tag: gn.tag };
      }
    } else if (next.tag === 0xa1) {
      /* extensions [1] IMPLICIT — not interpreted here */
    } else {
      break;
    }
  }

  return {
    version,
    policy,
    hashAlgorithm,
    hashedMessage,
    serialNumber,
    genTime,
    accuracy,
    ordering,
    nonce,
    tsa,
  };
}

/* ---------------------------------------------------------- verification */

/*
 * Verifies a TimeStampResp against an expected digest.
 *
 * expectedDigest: Uint8Array of the hash the token must bind.
 * expectedNonce:  optional Uint8Array of the nonce that was sent in the
 *                 request; RFC 3161 §2.4.2 requires the response to echo it
 *                 when the request carried one.
 * trust:           optional { trustedCerts: Uint8Array[] }. When omitted the
 *                 chain is reported UNTRUSTED. This is deliberate: the module
 *                 never invents an anchor.
 *
 * Returns a result object whose `verified` field is true only when the
 * signature checked out AND the imprint matched AND the nonce matched.
 * `chain` reports trust separately so a caller can refuse to act on an
 * untrusted token without having to pretend the token was forged.
 */
export async function verifyTimeStampResp(respBytes, options = {}) {
  const { expectedDigest = null, expectedNonce = null, trust = null, webcrypto = globalThis.crypto } = options;

  const result = {
    verified: false,
    genTime: null,
    status: null,
    imprintMatches: false,
    nonceMatches: null,
    signatureVerified: false,
    chain: 'UNTRUSTED',
    signerSubject: null,
    signerIssuer: null,
    digestAlgorithm: null,
    reason: null,
  };

  let parsed;
  try {
    parsed = parseTimeStampResp(respBytes);
  } catch (err) {
    result.reason = 'token does not parse as a TimeStampResp: ' + err.message;
    return result;
  }

  result.status = parsed.status;

  /* RFC 3161 §2.4.2: status must be granted (0) or grantedWithMods (1). */
  if (parsed.status.status !== 0 && parsed.status.status !== 1) {
    result.reason = 'PKIStatus is ' + parsed.status.status + ' (' + (parsed.status.statusString || 'no status string') + ')';
    return result;
  }

  if (!parsed.token) {
    result.reason = parsed.reason || 'response carries no timestamp token';
    return result;
  }

  const signed = parsed.token;
  if (signed.contentType !== OID.tstInfo) {
    result.reason = 'encapsulated content type is ' + signed.contentType + ', not id-ct-TSTInfo';
    return result;
  }
  if (!signed.eContent) {
    result.reason = 'SignedData carries no encapsulated TSTInfo';
    return result;
  }

  let tst;
  try {
    tst = parseTstInfo(signed.eContent);
  } catch (err) {
    result.reason = 'TSTInfo does not parse: ' + err.message;
    return result;
  }

  result.genTime = tst.genTime;
  result.digestAlgorithm = DIGEST_BY_OID[tst.hashAlgorithm.oid] || tst.hashAlgorithm.oid;

  /* The imprint check is what binds the token to the artifact. */
  if (expectedDigest) {
    result.imprintMatches = bytesEqual(tst.hashedMessage, expectedDigest);
    if (!result.imprintMatches) {
      result.reason = 'token imprint does not match the expected digest';
      return result;
    }
  } else {
    result.reason = 'no expected digest supplied; nothing to bind the token to';
    return result;
  }

  if (expectedNonce) {
    if (tst.nonce === null) {
      result.nonceMatches = false;
      result.reason = 'response carries no nonce but the request had one';
      return result;
    }
    result.nonceMatches = bytesEqual(hexToBytes(tst.nonce), expectedNonce);
    if (!result.nonceMatches) {
      result.reason = 'response nonce does not match the request nonce';
      return result;
    }
  }

  if (signed.signers.length === 0) {
    result.reason = 'SignedData carries no SignerInfo';
    return result;
  }

  const signer = signed.signers[0];
  const cert = findSignerCertificate(signed.certificates, signer);
  if (!cert) {
    result.reason = 'no certificate in the token matches the SignerInfo issuer and serial';
    return result;
  }

  result.signerSubject = cert.subject;
  result.signerIssuer = cert.issuer;

  /* RFC 3161 §2.3: the TSA certificate must carry id-kp-timeStamping and must be an end entity. */
  if (!hasTimeStampingEku(cert)) {
    result.reason = 'signing certificate does not carry the id-kp-timeStamping extended key usage';
    return result;
  }
  if (!isEndEntity(cert)) {
    result.reason = 'signing certificate is a CA; RFC 3161 requires an end-entity TSA certificate';
    return result;
  }

  const sigAlg = resolveSignatureAlgorithm(signer, cert);
  if (!sigAlg) {
    result.reason = 'unsupported signature algorithm ' + signer.signatureAlgorithm.oid;
    return result;
  }

  const keyAlg = KEY_ALGS[cert.keyAlgorithm.oid];
  if (!keyAlg) {
    result.reason = 'unsupported public key algorithm ' + cert.keyAlgorithm.oid;
    return result;
  }

  /* Work out which bytes the signature covers. */
  const signedAttrs = readSignedAttributes(signer);
  let signedBytes;
  if (signer.signedAttrsNode) {
    if (signedAttrs.length === 0) {
      result.reason = 'signedAttrs present but empty';
      return result;
    }
    /* The signature covers the DER SET OF form, not the transmitted [0] form. */
    signedBytes = retag(signer.signedAttrsNode, 0x31);

    /* RFC 5652 §5.4: the messageDigest attribute must equal the digest of
       the encapsulated content. Checking it stops a token whose signedAttrs
       do not actually cover the TSTInfo we are about to trust. */
    const mdAttr = signedAttrs.find((a) => a.oid === OID.messageDigest);
    if (!mdAttr || mdAttr.valueNodes.length !== 1) {
      result.reason = 'signedAttrs carry no single messageDigest attribute';
      return result;
    }
    const mdNode = mdAttr.valueNodes[0];
    const claimed = toHex(mdNode.bytes.slice(mdNode.contentStart, mdNode.contentEnd));
    const hashName = DIGEST_BY_OID[signer.digestAlgorithm.oid];
    if (!hashName) {
      result.reason = 'unsupported SignerInfo digest algorithm ' + signer.digestAlgorithm.oid;
      return result;
    }
    const fresh = toHex(new Uint8Array(await webcrypto.subtle.digest(hashName, signed.eContent)));
    if (claimed.toLowerCase() !== fresh.toLowerCase()) {
      result.reason = 'messageDigest attribute does not match the encapsulated content';
      return result;
    }
  } else {
    /* Without signedAttrs the signature is over the eContent itself. */
    signedBytes = signed.eContent;
  }

  let verified = false;
  try {
    const importParams = buildImportParams(keyAlg, sigAlg, cert);
    const key = await webcrypto.subtle.importKey('spki', cert.spki, importParams, false, ['verify']);
    verified = await webcrypto.subtle.verify(
      buildVerifyParams(sigAlg),
      key,
      signer.signature,
      signedBytes,
    );
  } catch (err) {
    result.reason = 'signature verification could not be performed: ' + err.message;
    return result;
  }

  result.signatureVerified = verified;
  if (!verified) {
    result.reason = 'CMS signature does not verify over the signed content';
    return result;
  }

  result.verified = true;
  result.chain = resolveChain(cert, signed.certificates, trust);
  if (result.chain !== 'TRUSTED') {
    result.reason = result.reason || 'signature verified but the certificate chain was not established';
  }
  return result;
}

/*
 * Resolves the WebCrypto verification parameters for a SignerInfo.
 *
 * RFC 5652 §5.3 lets a SignerInfo name either a combined algorithm
 * (sha256WithRSAEncryption) or a bare key algorithm (rsaEncryption) plus a
 * separate digestAlgorithm. OpenSSL emits the bare form for RSA, so both
 * have to be handled or real tokens fail to verify. When the SignerInfo names
 * only a key algorithm, the digest comes from the SignerInfo's own
 * digestAlgorithm, which is the field RFC 5652 says to use for that case.
 */
function resolveSignatureAlgorithm(signer, cert) {
  const direct = SIGNATURE_ALGS[signer.signatureAlgorithm.oid];
  if (direct) return direct;

  const keyOid = cert.keyAlgorithm.oid;

  if (signer.signatureAlgorithm.oid === OID.rsaEncryption || signer.signatureAlgorithm.oid === OID.rsassaPss) {
    const hashName = DIGEST_BY_OID[signer.digestAlgorithm.oid];
    if (!hashName) return null;
    if (signer.signatureAlgorithm.oid === OID.rsassaPss) {
      return { name: 'RSA-PSS', hash: hashName };
    }
    return { name: 'RSASSA-PKCS1-v1_5', hash: hashName };
  }

  /* An ECDSA SignerInfo may name the bare key algorithm too. */
  if (keyOid === OID.ecPublicKey) {
    const hashName = DIGEST_BY_OID[signer.digestAlgorithm.oid];
    if (!hashName) return null;
    const curve = cert.keyAlgorithm.params && cert.keyAlgorithm.params.oid;
    const namedCurve = {
      '1.2.840.10045.3.1.7': 'P-256',
      '1.3.132.0.34': 'P-384',
      '1.3.132.0.35': 'P-521',
    }[curve] || 'P-256';
    return { name: 'ECDSA', namedCurve, hash: hashName };
  }

  return null;
}

function buildImportParams(keyAlg, sigAlg, cert) {
  if (keyAlg.kind === 'rsa') {
    /* RSA import requires the hash so the key type carries its digest. */
    return { name: 'RSASSA-PKCS1-v1_5', hash: sigAlg.hash || 'SHA-256' };
  }
  if (keyAlg.kind === 'ec') {
    const curve = cert.keyAlgorithm.params && cert.keyAlgorithm.params.oid;
    const namedCurve = {
      '1.2.840.10045.3.1.7': 'P-256',
      '1.3.132.0.34': 'P-384',
      '1.3.132.0.35': 'P-521',
    }[curve] || 'P-256';
    return { name: 'ECDSA', namedCurve };
  }
  return { name: 'Ed25519' };
}

function buildVerifyParams(sigAlg) {
  if (sigAlg.name === 'RSASSA-PKCS1-v1_5') return { name: 'RSASSA-PKCS1-v1_5' };
  if (sigAlg.name === 'RSA-PSS') {
    return { name: 'RSA-PSS', saltLength: (sigAlg.hash.length / 8) || 32 };
  }
  if (sigAlg.name === 'ECDSA') return { name: 'ECDSA', hash: sigAlg.hash };
  return { name: 'Ed25519' };
}

function findSignerCertificate(certificates, signer) {
  let first = null;
  for (const der of certificates) {
    let cert;
    try {
      cert = parseCertificate(der);
    } catch {
      continue;
    }
    if (!first) first = cert;
    if (!signer.sid) return cert;
    /* Serial numbers compare as lowercase hex on both sides. */
    if (cert.serial.toLowerCase() === signer.sid.serial.toLowerCase() && cert.issuer === signer.sid.issuer) {
      return cert;
    }
  }
  return first;
}

/*
 * Establishes whether the signer chains to a caller-supplied anchor.
 * Returns one of TRUSTED, UNTRUSTED, or SELF_SIGNED.
 */
function resolveChain(signerCert, certificates, trust) {
  if (!trust || !Array.isArray(trust.trustedCerts) || trust.trustedCerts.length === 0) {
    return 'UNTRUSTED';
  }

  /* Anchors are keyed by serial hex and matched on subject as well, so an
     unrelated certificate with a colliding serial cannot stand in for one. */
  const anchors = new Map();
  for (const der of trust.trustedCerts) {
    try {
      const cert = parseCertificate(der);
      anchors.set(cert.serial.toLowerCase(), cert);
    } catch {
      /* an unparsable anchor is not an anchor */
    }
  }
  if (anchors.size === 0) return 'UNTRUSTED';

  const pool = [];
  for (const der of certificates) {
    try {
      pool.push(parseCertificate(der));
    } catch {
      /* skip unparsable certificates carried in the token */
    }
  }

  let current = signerCert;
  const seen = new Set();
  for (let depth = 0; depth < 8; depth += 1) {
    const key = current.serial.toLowerCase() + '|' + current.subject;
    if (seen.has(key)) break;
    seen.add(key);

    const anchor = anchors.get(current.serial.toLowerCase());
    if (anchor && anchor.subject === current.subject) {
      return 'TRUSTED';
    }

    const parent = pool.find(
      (c) => c.subject === current.issuer && c.serial.toLowerCase() !== current.serial.toLowerCase(),
    );
    if (!parent) {
      return current.subject === current.issuer ? 'SELF_SIGNED' : 'UNTRUSTED';
    }
    current = parent;
  }
  return 'UNTRUSTED';
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}
